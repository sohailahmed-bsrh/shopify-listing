import express from "express";
import path from "path";
import "dotenv/config";

import { shopify, publishToOnlineStore, SHOP } from "./shopify.js";
import { registerAuthRoutes, requireAuth, parseCookies, verifySessionToken } from "./auth.js";
import { addRecord, getRecords } from "./records.js";
import { fetchEmsProducts } from "./ems.js";
import {
  saveLink,
  removeLinkByShopifyId,
  getEmsIdByShopifyId
} from "./linksStore.js";
import {
  syncOrders,
  getStoredOrders,
  getStoredOrderById,
  getStoredOrdersSummary
} from "./ordersStore.js";
import {
  processImageSource,
  attachMediaToProduct,
  pollProductMediaUntilReady
} from "./mediaPipeline.js";

const app = express();
const PORT = process.env.PORT || 4000;
const storeHandle = SHOP.replace(/^https?:\/\//i, "").replace(/\.myshopify\.com\/?$/i, "").trim();

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// Helper wrapper for async route handlers
const wrap = (fn) => async (req, res) => {
  try {
    const data = await fn(req, res);
    if (!res.headersSent) {
      res.json(data);
    }
  } catch (err) {
    const statusCode = err.status || 500;
    console.error(`[API Error] ${req.method} ${req.url}:`, err.message);
    if (!res.headersSent) {
      res.status(statusCode).json({ error: err.message || "Internal server error" });
    }
  }
};

// 1. Mount Public Auth Routes & Pages
registerAuthRoutes(app);

app.get("/login.html", (req, res) => {
  const cookies = parseCookies(req);
  if (verifySessionToken(cookies.ems_session)) {
    return res.redirect("/");
  }
  res.sendFile(path.resolve("public", "login.html"));
});

// Protect application index with staff auth
app.get(["/", "/index.html"], requireAuth, (req, res) => {
  res.sendFile(path.resolve("public", "index.html"));
});

// Serve static assets (CSS, JS, images)
app.use(express.static("public"));

// 2. All /api/* routes require staff authentication
app.use("/api", requireAuth);

// GET /api/health -> { ok, shop: { name, myshopifyDomain } }
app.get(
  "/api/health",
  wrap(async () => {
    const data = await shopify(`{ shop { name myshopifyDomain } }`);
    return { ok: true, shop: data.shop };
  })
);

// Helper to compute deep links for a Shopify product
function getProductLinks(p) {
  const numericId = String(p.id).split("/").pop();
  const adminUrl = `https://${SHOP}/admin/products/${numericId}`;
  const previewUrl = p.onlineStorePreviewUrl || null;
  const storefrontUrl = p.status === "ACTIVE" ? (p.onlineStoreUrl || null) : null;
  return { numericId, adminUrl, previewUrl, storefrontUrl };
}

// GET /api/products?limit=50
app.get(
  "/api/products",
  wrap(async (req) => {
    const first = Math.min(parseInt(req.query.limit, 10) || 50, 50);
    const data = await shopify(
      `
      query($first: Int!) {
        products(first: $first, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id
            title
            status
            vendor
            productType
            descriptionHtml
            createdAt
            tags
            onlineStoreUrl
            onlineStorePreviewUrl
            variants(first: 50) {
              nodes { id }
            }
            media(first: 10) {
              nodes {
                ... on MediaImage {
                  image { url }
                }
              }
            }
            featuredMedia {
              preview { image { url } }
            }
            priceRangeV2 {
              minVariantPrice { amount currencyCode }
            }
          }
        }
      }
    `,
      { first }
    );

    return data.products.nodes.map((p) => {
      const { adminUrl, previewUrl, storefrontUrl } = getProductLinks(p);
      const images = [];
      if (p.media?.nodes) {
        for (const m of p.media.nodes) {
          if (m.image?.url) images.push(m.image.url);
        }
      }
      if (images.length === 0 && p.featuredMedia?.preview?.image?.url) {
        images.push(p.featuredMedia.preview.image.url);
      }

      return {
        id: p.id,
        title: p.title,
        status: p.status,
        vendor: p.vendor || "",
        productType: p.productType || "",
        descriptionHtml: p.descriptionHtml || "",
        price: p.priceRangeV2?.minVariantPrice?.amount || "0.00",
        currency: p.priceRangeV2?.minVariantPrice?.currencyCode || "USD",
        images,
        variantsCount: p.variants?.nodes?.length || 1,
        tags: p.tags || [],
        createdAt: p.createdAt,
        storefrontUrl,
        previewUrl,
        adminUrl,
        emsId: getEmsIdByShopifyId(p.id)
      };
    });
  })
);

// POST /api/products
app.post(
  "/api/products",
  wrap(async (req) => {
    const { title, descriptionHtml, vendor, productType, price, imageUrl, images, tags, status, emsId } = req.body;
    if (!title || !title.trim()) {
      throw new Error("Product title is required.");
    }

    const targetStatus = status === "ACTIVE" ? "ACTIVE" : "DRAFT";

    // 1. Gather all incoming image sources (base64, remote URL, or buffer)
    const rawImages = [];
    if (Array.isArray(images)) {
      for (const img of images) {
        if (img) rawImages.push(img);
      }
    }
    if (imageUrl && !rawImages.includes(imageUrl)) {
      rawImages.push(imageUrl);
    }

    // 2. Stage images to Google Cloud Storage via Shopify stagedUploadsCreate
    const stagedResourceUrls = [];
    for (const imgSrc of rawImages) {
      try {
        const rUrl = await processImageSource(imgSrc);
        if (rUrl) stagedResourceUrls.push(rUrl);
      } catch (imgErr) {
        console.warn(`[Product Creation] Media staging warning for "${title}":`, imgErr.message);
      }
    }

    // 3. Format tags
    let formattedTags = undefined;
    if (Array.isArray(tags)) {
      formattedTags = tags;
    } else if (typeof tags === "string" && tags.trim()) {
      formattedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    // 4. Create product in Shopify
    const createResult = await shopify(
      `
      mutation($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            onlineStoreUrl
            onlineStorePreviewUrl
            variants(first: 1) { nodes { id } }
          }
          userErrors { field message }
        }
      }
    `,
      {
        product: {
          title: title.trim(),
          descriptionHtml: descriptionHtml || undefined,
          vendor: vendor || undefined,
          productType: productType || undefined,
          tags: formattedTags,
          status: targetStatus
        }
      }
    );

    const userErrors = createResult?.productCreate?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(userErrors.map((e) => e.message).join(", "));
    }

    const product = createResult.productCreate.product;

    // 5. Attach staged media
    if (stagedResourceUrls.length > 0) {
      try {
        await attachMediaToProduct(product.id, stagedResourceUrls);
        pollProductMediaUntilReady(product.id).catch(() => {});
      } catch (attachErr) {
        console.warn(`[Product Creation] Media attachment warning for ${product.id}:`, attachErr.message);
      }
    }

    // 6. Set variant price if provided
    if (price && product.variants?.nodes?.[0]?.id) {
      const variantId = product.variants.nodes[0].id;
      const priceResult = await shopify(
        `
        mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }
      `,
        {
          productId: product.id,
          variants: [{ id: variantId, price: String(price) }]
        }
      );

      const priceErrors = priceResult?.productVariantsBulkUpdate?.userErrors || [];
      if (priceErrors.length > 0) {
        console.warn(`[Product Creation] Price update warning for ${product.id}:`, priceErrors);
      }
    }

    // 7. Publish to Online Store channel if ACTIVE
    let publishWarning = null;
    if (targetStatus === "ACTIVE") {
      const pubRes = await publishToOnlineStore(product.id);
      if (!pubRes.ok && pubRes.warning) {
        publishWarning = pubRes.warning;
      }
    }

    const { adminUrl, previewUrl, storefrontUrl } = getProductLinks(product);

    if (emsId) {
      saveLink(emsId, {
        shopifyId: product.id,
        handle: product.handle,
        listedAt: new Date().toISOString(),
        listedBy: req.user?.email || "staff",
        storefrontUrl,
        adminUrl
      });
    }

    // Log action record
    addRecord({
      user: req.user?.email,
      action: "created",
      title: product.title,
      shopifyId: product.id,
      emsId: emsId || undefined,
      status: targetStatus,
      note: publishWarning || ""
    });

    return {
      id: product.id,
      title: product.title,
      status: product.status,
      previewUrl,
      adminUrl,
      storefrontUrl,
      warning: publishWarning
    };
  })
);

// PUT /api/products/:id
app.put(
  "/api/products/:id",
  wrap(async (req) => {
    let rawId = req.params.id;
    const gid = rawId.startsWith("gid://") ? rawId : `gid://shopify/Product/${rawId}`;

    const {
      title,
      descriptionHtml,
      vendor,
      productType,
      price,
      status,
      tags,
      newImages,
      removeMediaIds
    } = req.body;

    const input = { id: gid };
    if (title !== undefined && title.trim()) input.title = String(title).trim();
    if (descriptionHtml !== undefined) input.descriptionHtml = descriptionHtml;
    if (vendor !== undefined) input.vendor = vendor;
    if (productType !== undefined) input.productType = productType;
    if (status !== undefined) input.status = status === "ACTIVE" ? "ACTIVE" : "DRAFT";
    if (tags !== undefined) {
      input.tags = Array.isArray(tags)
        ? tags
        : String(tags).split(",").map((t) => t.trim()).filter(Boolean);
    }

    const updateResult = await shopify(
      `
      mutation($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            handle
            status
            vendor
            productType
            descriptionHtml
            tags
            onlineStoreUrl
            onlineStorePreviewUrl
            variants(first: 1) {
              nodes { id price }
            }
          }
          userErrors { field message }
        }
      }
    `,
      { input }
    );

    const userErrors = updateResult?.productUpdate?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(userErrors.map((e) => e.message).join(", "));
    }

    const product = updateResult.productUpdate.product;

    // Update variant price if provided
    if (price !== undefined && product.variants?.nodes?.[0]?.id) {
      const variantId = product.variants.nodes[0].id;
      const priceRes = await shopify(
        `
        mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }
      `,
        {
          productId: product.id,
          variants: [{ id: variantId, price: String(price) }]
        }
      );
      const priceErrors = priceRes?.productVariantsBulkUpdate?.userErrors || [];
      if (priceErrors.length > 0) {
        console.warn(`[Product Edit] Price update warning:`, priceErrors);
      }
    }

    // Delete media if requested
    if (Array.isArray(removeMediaIds) && removeMediaIds.length > 0) {
      try {
        await shopify(
          `
          mutation($productId: ID!, $mediaIds: [ID!]!) {
            productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
              deletedMediaIds
              userErrors { field message }
            }
          }
        `,
          { productId: product.id, mediaIds: removeMediaIds }
        );
      } catch (delErr) {
        console.warn("[Product Edit] Delete media error:", delErr.message);
      }
    }

    // Stage & attach new images
    if (Array.isArray(newImages) && newImages.length > 0) {
      const stagedResourceUrls = [];
      for (const img of newImages) {
        if (img) {
          try {
            const rUrl = await processImageSource(img);
            if (rUrl) stagedResourceUrls.push(rUrl);
          } catch (err) {
            console.warn("[Product Edit] Staging new image failed:", err.message);
          }
        }
      }

      if (stagedResourceUrls.length > 0) {
        await attachMediaToProduct(product.id, stagedResourceUrls);
        pollProductMediaUntilReady(product.id).catch(() => {});
      }
    }

    // Handle online store channel publishing
    let publishWarning = null;
    if (input.status === "ACTIVE") {
      const pubRes = await publishToOnlineStore(product.id);
      if (!pubRes.ok && pubRes.warning) {
        publishWarning = pubRes.warning;
      }
    }

    const { adminUrl, previewUrl, storefrontUrl } = getProductLinks(product);

    // Audit log
    addRecord({
      user: req.user?.email,
      action: "edited",
      title: product.title,
      shopifyId: product.id,
      status: product.status,
      note: publishWarning || ""
    });

    return {
      id: product.id,
      title: product.title,
      status: product.status,
      vendor: product.vendor,
      productType: product.productType,
      descriptionHtml: product.descriptionHtml,
      tags: product.tags,
      price: price !== undefined ? String(price) : product.variants?.nodes?.[0]?.price,
      adminUrl,
      previewUrl,
      storefrontUrl,
      warning: publishWarning
    };
  })
);

// GET /api/products/:id/link-check
app.get(
  "/api/products/:id/link-check",
  wrap(async (req) => {
    let rawId = req.params.id;
    const gid = rawId.startsWith("gid://") ? rawId : `gid://shopify/Product/${rawId}`;

    const query = `
      query getProductLinks($id: ID!) {
        product(id: $id) {
          id
          title
          status
          onlineStoreUrl
          onlineStorePreviewUrl
        }
      }
    `;

    const data = await shopify(query, { id: gid });
    if (!data?.product) {
      const err = new Error("Product not found");
      err.status = 404;
      throw err;
    }

    const { numericId, adminUrl, previewUrl, storefrontUrl } = getProductLinks(data.product);

    // Target URL to check
    const targetUrl = storefrontUrl || previewUrl;
    let checkResult = {
      reachable: false,
      status: null,
      targetUrl,
      finalUrl: null,
      redirectedToPassword: false,
      message: ""
    };

    if (targetUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(targetUrl, {
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        clearTimeout(timeout);

        const finalUrl = res.url || targetUrl;
        const isPasswordPage = finalUrl.includes("/password");

        checkResult = {
          reachable: res.ok,
          status: res.status,
          targetUrl,
          finalUrl,
          redirectedToPassword: isPasswordPage,
          message: isPasswordPage
            ? "Redirected to password-protected storefront page (development / trial store)."
            : res.ok
            ? "Storefront URL is live and returning HTTP 200 OK."
            : `Storefront returned HTTP status ${res.status}.`
        };
      } catch (fetchErr) {
        checkResult.message = `Network check failed: ${fetchErr.message}`;
      }
    } else {
      checkResult.message = "No storefront or preview URL available (Draft or unpublished).";
    }

    return {
      product: {
        id: data.product.id,
        numericId,
        title: data.product.title,
        status: data.product.status,
        adminUrl,
        previewUrl,
        storefrontUrl
      },
      check: checkResult
    };
  })
);

// POST /api/products/status { id, status }
app.post(
  "/api/products/status",
  wrap(async (req) => {
    const { id, status } = req.body;
    if (!id || !status) {
      throw new Error("Product id and status ('ACTIVE' or 'DRAFT') are required.");
    }

    const targetStatus = status.toUpperCase() === "ACTIVE" ? "ACTIVE" : "DRAFT";

    const updateResult = await shopify(
      `
      mutation($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            status
            onlineStoreUrl
            onlineStorePreviewUrl
          }
          userErrors { field message }
        }
      }
    `,
      {
        input: { id, status: targetStatus }
      }
    );

    const userErrors = updateResult?.productUpdate?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(userErrors.map((e) => e.message).join(", "));
    }

    const product = updateResult.productUpdate.product;

    let publishWarning = null;
    if (targetStatus === "ACTIVE") {
      const pubRes = await publishToOnlineStore(product.id);
      if (!pubRes.ok && pubRes.warning) {
        publishWarning = pubRes.warning;
      }
    }

    const { adminUrl, previewUrl, storefrontUrl } = getProductLinks(product);

    addRecord({
      user: req.user?.email,
      action: "status_changed",
      title: product.title,
      shopifyId: product.id,
      status: targetStatus,
      note: publishWarning || ""
    });

    return {
      id: product.id,
      title: product.title,
      status: product.status,
      previewUrl,
      adminUrl,
      storefrontUrl,
      warning: publishWarning
    };
  })
);

// DELETE /api/products { id, title }
app.delete(
  "/api/products",
  wrap(async (req) => {
    const { id, title } = req.body;
    if (!id) throw new Error("Product id is required for deletion.");

    const deleteResult = await shopify(
      `
      mutation($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors { field message }
        }
      }
    `,
      { input: { id } }
    );

    const userErrors = deleteResult?.productDelete?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(userErrors.map((e) => e.message).join(", "));
    }

    // Keep links.json in sync
    removeLinkByShopifyId(id);

    addRecord({
      user: req.user?.email,
      action: "deleted",
      title: title || "",
      shopifyId: id,
      status: "DELETED"
    });

    return deleteResult.productDelete;
  })
);

// GET /api/ems/products?search=&limit=&offset=
app.get(
  "/api/ems/products",
  wrap(async (req) => {
    const { search, limit, offset } = req.query;
    return await fetchEmsProducts({
      search: search ? String(search) : "",
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0
    });
  })
);

// POST /api/ems/list { items: [...], status }
app.post(
  "/api/ems/list",
  wrap(async (req) => {
    const { items, status } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided for listing.");
    }

    const targetStatus = status === "ACTIVE" ? "ACTIVE" : "DRAFT";
    const results = [];

    for (const item of items) {
      try {
        // Stage image sources through Google Cloud Storage
        const rawImages = [];
        if (item.imageUrl) rawImages.push(item.imageUrl);
        if (Array.isArray(item.images)) {
          for (const img of item.images) {
            if (img && !rawImages.includes(img)) rawImages.push(img);
          }
        }

        const stagedResourceUrls = [];
        for (const imgSrc of rawImages) {
          try {
            const rUrl = await processImageSource(imgSrc);
            if (rUrl) stagedResourceUrls.push(rUrl);
          } catch (imgErr) {
            console.warn(`[EMS Listing] Media staging warning for "${item.title}":`, imgErr.message);
          }
        }

        // Format tags if present
        let formattedTags = undefined;
        if (Array.isArray(item.tags)) {
          formattedTags = item.tags;
        } else if (item.category || item.gender || item.brand) {
          formattedTags = [item.brand, item.gender, item.category].filter(Boolean);
        }

        const createResult = await shopify(
          `
          mutation($product: ProductCreateInput!) {
            productCreate(product: $product) {
              product {
                id
                title
                handle
                status
                onlineStoreUrl
                onlineStorePreviewUrl
                variants(first: 1) { nodes { id } }
              }
              userErrors { field message }
            }
          }
        `,
          {
            product: {
              title: item.title,
              descriptionHtml: item.description ? `<p>${item.description}</p>` : undefined,
              vendor: item.vendor || item.brand || undefined,
              productType: item.productType || item.category || undefined,
              tags: formattedTags,
              status: targetStatus
            }
          }
        );

        const userErrors = createResult?.productCreate?.userErrors || [];
        if (userErrors.length > 0) {
          throw new Error(userErrors.map((e) => e.message).join(", "));
        }

        const product = createResult.productCreate.product;

        // Attach staged media
        if (stagedResourceUrls.length > 0) {
          try {
            await attachMediaToProduct(product.id, stagedResourceUrls);
            pollProductMediaUntilReady(product.id).catch(() => {});
          } catch (attachErr) {
            console.warn(`[EMS Listing] Media attachment warning for ${product.id}:`, attachErr.message);
          }
        }

        // Set price
        if (item.price && product.variants?.nodes?.[0]?.id) {
          const variantId = product.variants.nodes[0].id;
          const priceResult = await shopify(
            `
            mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                userErrors { field message }
              }
            }
          `,
            {
              productId: product.id,
              variants: [{ id: variantId, price: String(item.price) }]
            }
          );
          const priceErrors = priceResult?.productVariantsBulkUpdate?.userErrors || [];
          if (priceErrors.length > 0) {
            console.warn(`[EMS Listing] Price update warning for ${item.title}:`, priceErrors);
          }
        }

        // Publish to Online Store channel if ACTIVE
        let publishWarning = null;
        if (targetStatus === "ACTIVE") {
          const pubRes = await publishToOnlineStore(product.id);
          if (!pubRes.ok && pubRes.warning) {
            publishWarning = pubRes.warning;
          }
        }

        const { adminUrl, previewUrl, storefrontUrl } = getProductLinks(product);

        // Record in links.json
        saveLink(item.emsId, {
          shopifyId: product.id,
          handle: product.handle,
          listedAt: new Date().toISOString(),
          listedBy: req.user?.email || "staff",
          storefrontUrl,
          adminUrl
        });

        // Add record
        addRecord({
          user: req.user?.email,
          action: "listed_from_ems",
          title: product.title,
          shopifyId: product.id,
          emsId: item.emsId,
          status: targetStatus,
          note: publishWarning || ""
        });

        results.push({
          emsId: item.emsId,
          title: product.title,
          ok: true,
          shopifyId: product.id,
          adminUrl,
          previewUrl,
          storefrontUrl,
          warning: publishWarning
        });
      } catch (itemErr) {
        results.push({
          emsId: item.emsId,
          title: item.title,
          ok: false,
          error: itemErr.message
        });
      }
    }

    return results;
  })
);

// GET /api/orders?search=&financial=&fulfillment=&limit=&offset=
app.get(
  "/api/orders",
  wrap(async (req) => {
    const { search, financial, fulfillment, limit, offset } = req.query;
    return getStoredOrders({
      search: search ? String(search) : "",
      financial: financial ? String(financial) : "",
      fulfillment: fulfillment ? String(fulfillment) : "",
      limit: parseInt(limit, 10) || 20,
      offset: parseInt(offset, 10) || 0
    });
  })
);

// GET /api/orders/summary
app.get(
  "/api/orders/summary",
  wrap(async () => {
    return getStoredOrdersSummary();
  })
);

// GET /api/orders/:id
app.get(
  "/api/orders/:id",
  wrap(async (req) => {
    const order = getStoredOrderById(req.params.id);
    if (!order) {
      const err = new Error("Order not found");
      err.status = 404;
      throw err;
    }
    return order;
  })
);

// POST /api/orders/sync
app.post(
  "/api/orders/sync",
  wrap(async () => {
    const result = await syncOrders();
    return { ok: true, result };
  })
);

// GET /api/records?limit=100
app.get(
  "/api/records",
  wrap(async (req) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    return getRecords({ limit });
  })
);

// Periodic orders sync: on start + every 2 minutes
syncOrders().catch((err) => {
  console.warn("[OrdersSync Initial Notice]:", err.message);
});
setInterval(() => {
  syncOrders().catch((err) => {
    console.warn("[OrdersSync Interval Notice]:", err.message);
  });
}, 2 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 EMS Shopify Store running on http://localhost:${PORT}`);
  console.log(`🛒 Connected Shop Domain: ${SHOP}`);
  console.log(`=============================================`);
});
