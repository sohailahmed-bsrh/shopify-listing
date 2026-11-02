import "dotenv/config";
import fs from "fs";
import path from "path";
import { shopify, SHOP } from "../shopify.js";
import { emsQuery, discoverEmsSchema, fetchEmsProducts } from "../ems.js";
import { syncOrders, getStoredOrders } from "../ordersStore.js";
import { stageAndUploadImage, attachMediaToProduct } from "../mediaPipeline.js";

const storeHandle = SHOP.replace(/^https?:\/\//i, "").replace(/\.myshopify\.com\/?$/i, "").trim();

async function runSmokeTests() {
  console.log("=================================================");
  console.log("🚀 EMS Shopify Store Smoke Test Suite");
  console.log(`📡 Connected Store: ${SHOP}`);
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;
  const results = [];

  function recordResult(step, title, ok, details = "") {
    if (ok) {
      passed++;
      console.log(`[PASS] (${step}) ${title}`);
      if (details) console.log(`       ${details}`);
    } else {
      failed++;
      console.log(`[FAIL] (${step}) ${title}`);
      if (details) console.log(`       ${details}`);
    }
    results.push({ step, title, ok, details });
  }

  // (a) Shop info
  try {
    const data = await shopify(`{ shop { name myshopifyDomain } }`);
    if (!data?.shop?.name) throw new Error("Shop response missing shop.name");
    recordResult(
      "a",
      "Shop info",
      true,
      `Store: "${data.shop.name}" | myshopifyDomain: ${data.shop.myshopifyDomain}`
    );
  } catch (err) {
    recordResult("a", "Shop info", false, `Error: ${err.message}`);
  }

  // (b) List 5 Shopify products
  try {
    const data = await shopify(`
      query {
        products(first: 5, sortKey: CREATED_AT, reverse: true) {
          nodes { id title status }
        }
      }
    `);
    const count = data?.products?.nodes?.length || 0;
    recordResult("b", "List 5 Shopify products", true, `Retrieved ${count} products from store`);
  } catch (err) {
    recordResult("b", "List 5 Shopify products", false, `Error: ${err.message}`);
  }

  // (c) Create DRAFT product with staged media upload, verify URLs, test link-check, and cleanly delete
  let testProductId = null;
  try {
    // 1. Stage in-memory PNG image buffer to Google Cloud Storage
    const samplePng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const stagedResourceUrl = await stageAndUploadImage({
      buffer: samplePng,
      mimeType: "image/png",
      filename: "smoke_test_sample.png"
    });

    if (!stagedResourceUrl) {
      throw new Error("Failed to receive staged upload resourceUrl from Shopify GCS staging");
    }

    // 2. Create DRAFT product
    const createRes = await shopify(
      `
      mutation($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            status
            onlineStorePreviewUrl
            variants(first: 1) { nodes { id } }
          }
          userErrors { field message }
        }
      }
    `,
      {
        product: {
          title: "SMOKE TEST - delete me",
          status: "DRAFT"
        }
      }
    );

    const userErrors = createRes?.productCreate?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(userErrors.map((e) => e.message).join(", "));
    }

    const prod = createRes.productCreate.product;
    testProductId = prod.id;
    const numericId = testProductId.split("/").pop();
    const adminUrl = `https://${SHOP}/admin/products/${numericId}`;
    const previewUrl = prod.onlineStorePreviewUrl;

    if (!adminUrl || !previewUrl) {
      throw new Error(`Missing URLs: adminUrl=${adminUrl}, previewUrl=${previewUrl}`);
    }

    // 3. Attach staged media to product
    const mediaAttached = await attachMediaToProduct(testProductId, [stagedResourceUrl]);

    // 4. Set price to 1.00
    if (prod.variants?.nodes?.[0]?.id) {
      const varId = prod.variants.nodes[0].id;
      await shopify(
        `
        mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }
      `,
        {
          productId: testProductId,
          variants: [{ id: varId, price: "1.00" }]
        }
      );
    }

    // 5. Test link-check connectivity
    let linkCheckStatus = "unverified";
    try {
      const linkRes = await fetch(previewUrl, { redirect: "follow" });
      const finalUrl = linkRes.url || previewUrl;
      const isPassword = finalUrl.includes("/password");
      linkCheckStatus = isPassword ? "Password protected (dev store)" : `HTTP ${linkRes.status}`;
    } catch (e) {
      linkCheckStatus = `Fetch notice: ${e.message}`;
    }

    // 6. Delete test product
    const delRes = await shopify(
      `
      mutation($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors { field message }
        }
      }
    `,
      { input: { id: testProductId } }
    );
    const delErrors = delRes?.productDelete?.userErrors || [];
    if (delErrors.length > 0) {
      throw new Error(delErrors.map((e) => e.message).join(", "));
    }

    recordResult(
      "c",
      "Staged media upload, create DRAFT product, verify URLs, link-check, and delete",
      true,
      `Media staged to GCS (${mediaAttached.length} media attached). AdminUrl: ${adminUrl}. Link check: ${linkCheckStatus}. Cleanly deleted.`
    );
    testProductId = null;
  } catch (err) {
    recordResult("c", "Staged media upload, create DRAFT product, verify URLs, link-check, and delete", false, `Error: ${err.message}`);
    // Cleanup if needed
    if (testProductId) {
      try {
        await shopify(`mutation($input: ProductDeleteInput!) { productDelete(input: $input) { deletedProductId } }`, {
          input: { id: testProductId }
        });
      } catch {}
    }
  }

  // (d) EMS DB: connect, confirm read-only guard works, report detected table name & total count, print 3 normalized products
  try {
    // 1. Guard check: a test call emsQuery("DELETE ...") must be REJECTED by the guard without reaching the database
    let guardBlocked = false;
    try {
      await emsQuery("DELETE FROM test_table WHERE id = 1");
    } catch (guardErr) {
      if (/Security Violation|Only SELECT, SHOW, DESCRIBE/i.test(guardErr.message)) {
        guardBlocked = true;
      } else {
        throw new Error(`Guard returned unexpected error: ${guardErr.message}`);
      }
    }

    if (!guardBlocked) {
      throw new Error("CRITICAL SECURITY FAILURE: emsQuery allowed a DELETE statement through!");
    }

    // 2. Discover schema & products
    let schemaInfo = "EMS Catalog Layer (Production connects to MySQL via 127.0.0.1 on Hostinger)";
    try {
      const s = await discoverEmsSchema();
      schemaInfo = `MySQL Table: '${s.tableName}'`;
    } catch {}

    const { items, total } = await fetchEmsProducts({ limit: 3 });

    const samples = items.slice(0, 3).map((p) => ({
      title: p.title,
      price: p.price,
      imageUrl: p.imageUrl ? (p.imageUrl.length > 40 ? p.imageUrl.substring(0, 40) + "..." : p.imageUrl) : "none"
    }));

    recordResult(
      "d",
      "EMS DB read-only guard & normalized products with pictures",
      true,
      `Guard: BLOCKED DELETE (PASSED). Total products: ${total}. Mode: ${schemaInfo}. Samples: ${JSON.stringify(samples)}`
    );
  } catch (err) {
    recordResult(
      "d",
      "EMS DB read-only guard & normalized products with pictures",
      false,
      `Error: ${err.message}`
    );
  }

  // (e) syncOrders() then read from ordersStore: report count and show 1 order
  try {
    let syncError = null;
    try {
      await syncOrders();
    } catch (sErr) {
      syncError = sErr;
    }

    const { items, total, meta } = getStoredOrders({ limit: 1 });
    let details = `Saved orders count: ${total}.`;

    if (items.length > 0) {
      const o = items[0];
      details += ` Sample: Order #${o.name || o.numericId}, Total: ${o.total} ${o.currency}, Status: ${o.displayFinancialStatus}/${o.displayFulfillmentStatus}.`;
    }

    if (meta.customerDataRestricted) {
      details += ` (Protected customer data restricted by Shopify).`;
    }

    if (syncError) {
      if (/access denied|scope|read_orders/i.test(syncError.message)) {
        recordResult(
          "e",
          "syncOrders() & read from ordersStore",
          false,
          `Shopify scope missing: 'read_orders' required. ${details}`
        );
      } else if (/protected customer data/i.test(syncError.message)) {
        recordResult(
          "e",
          "syncOrders() & read from ordersStore",
          true,
          `Protected Customer Data restricted; orders saved without customer info. ${details}`
        );
      } else {
        recordResult(
          "e",
          "syncOrders() & read from ordersStore",
          false,
          `Sync warning: ${syncError.message}. ${details}`
        );
      }
    } else {
      recordResult("e", "syncOrders() & read from ordersStore", true, details);
    }
  } catch (err) {
    recordResult("e", "syncOrders() & read from ordersStore", false, `Error: ${err.message}`);
  }

  // (f) links.json and records.json are valid JSON
  try {
    const linksPath = path.resolve("data", "links.json");
    const recordsPath = path.resolve("data", "records.json");

    if (!fs.existsSync(linksPath)) throw new Error("data/links.json does not exist");
    if (!fs.existsSync(recordsPath)) throw new Error("data/records.json does not exist");

    const linksData = JSON.parse(fs.readFileSync(linksPath, "utf-8"));
    const recordsData = JSON.parse(fs.readFileSync(recordsPath, "utf-8"));

    if (typeof linksData !== "object" || !Array.isArray(recordsData)) {
      throw new Error("links.json must be an object and records.json must be an array");
    }

    recordResult(
      "f",
      "links.json and records.json valid JSON",
      true,
      `links.json (${Object.keys(linksData).length} mappings) and records.json (${recordsData.length} entries) are valid JSON.`
    );
  } catch (err) {
    recordResult("f", "links.json and records.json valid JSON", false, `Error: ${err.message}`);
  }

  console.log("\n=================================================");
  console.log(`📋 Smoke Test Summary: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((fatal) => {
  console.error("Smoke test suite fatal error:", fatal.message);
  process.exit(1);
});
