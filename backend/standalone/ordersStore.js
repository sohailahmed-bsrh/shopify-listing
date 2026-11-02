import fs from "fs";
import path from "path";
import { shopify, SHOP } from "./shopify.js";

const ORDERS_FILE = path.resolve("data", "orders.json");
const ORDERS_META_FILE = path.resolve("data", "orders-meta.json");

let isSyncing = false;

function ensureFiles() {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]", "utf-8");
  if (!fs.existsSync(ORDERS_META_FILE)) {
    fs.writeFileSync(
      ORDERS_META_FILE,
      JSON.stringify({ lastSync: null, customerDataRestricted: false }, null, 2),
      "utf-8"
    );
  }
}

export function readOrders() {
  ensureFiles();
  try {
    const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[OrdersStore] Error reading orders.json:", err.message);
    return [];
  }
}

function writeOrders(orders) {
  ensureFiles();
  const tmp = `${ORDERS_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(orders, null, 2), "utf-8");
  fs.renameSync(tmp, ORDERS_FILE);
}

export function readMeta() {
  ensureFiles();
  try {
    const raw = fs.readFileSync(ORDERS_META_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { lastSync: null, customerDataRestricted: false };
  }
}

export function writeMeta(meta) {
  ensureFiles();
  const tmp = `${ORDERS_META_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(meta, null, 2), "utf-8");
  fs.renameSync(tmp, ORDERS_META_FILE);
}

/**
 * Fetch orders from Shopify and persist locally in data/orders.json
 * Runs cursor pagination, incremental sync via updated_at, and handles protected customer data.
 */
export async function syncOrders() {
  if (isSyncing) {
    console.log("[OrdersSync] Another sync is already in progress, skipping.");
    return { syncing: true };
  }

  isSyncing = true;
  try {
    const meta = readMeta();
    const storeHandle = SHOP.replace(/^https?:\/\//i, "").replace(/\.myshopify\.com\/?$/i, "").trim();

    let afterCursor = null;
    let hasMore = true;
    let fetchedNodes = [];
    let customerDataBlocked = false;

    // Use incremental query if we previously synced successfully
    let queryFilter = null;
    if (meta.lastSync) {
      // Small buffer to avoid clock skew
      const syncDate = new Date(new Date(meta.lastSync).getTime() - 60000).toISOString();
      queryFilter = `updated_at:>='${syncDate}'`;
    }

    const fullOrderQuery = `
      query($first: Int!, $after: String, $query: String) {
        orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: true, query: $query) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            name
            createdAt
            updatedAt
            cancelledAt
            displayFinancialStatus
            displayFulfillmentStatus
            sourceName
            tags
            note
            paymentGatewayNames
            totalPriceSet { shopMoney { amount currencyCode } }
            subtotalPriceSet { shopMoney { amount currencyCode } }
            totalShippingPriceSet { shopMoney { amount currencyCode } }
            totalTaxSet { shopMoney { amount currencyCode } }
            totalDiscountsSet { shopMoney { amount currencyCode } }
            shippingLine { title }
            customer {
              displayName
              phone
              email
            }
            shippingAddress {
              name
              firstName
              lastName
              address1
              address2
              city
              province
              zip
              country
              phone
            }
            billingAddress {
              name
              address1
              city
              province
              zip
              country
              phone
            }
            lineItems(first: 25) {
              nodes {
                title
                variantTitle
                sku
                quantity
                originalUnitPriceSet { shopMoney { amount currencyCode } }
                image { url }
              }
            }
          }
        }
      }
    `;

    const restrictedOrderQuery = `
      query($first: Int!, $after: String, $query: String) {
        orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: true, query: $query) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            name
            createdAt
            updatedAt
            cancelledAt
            displayFinancialStatus
            displayFulfillmentStatus
            sourceName
            tags
            note
            paymentGatewayNames
            totalPriceSet { shopMoney { amount currencyCode } }
            subtotalPriceSet { shopMoney { amount currencyCode } }
            totalShippingPriceSet { shopMoney { amount currencyCode } }
            totalTaxSet { shopMoney { amount currencyCode } }
            totalDiscountsSet { shopMoney { amount currencyCode } }
            shippingLine { title }
            lineItems(first: 25) {
              nodes {
                title
                variantTitle
                sku
                quantity
                originalUnitPriceSet { shopMoney { amount currencyCode } }
                image { url }
              }
            }
          }
        }
      }
    `;

    while (hasMore) {
      let data;
      try {
        data = await shopify(customerDataBlocked ? restrictedOrderQuery : fullOrderQuery, {
          first: 50,
          after: afterCursor,
          query: queryFilter
        });
      } catch (err) {
        if (/protected customer data|access denied/i.test(err.message) && !customerDataBlocked) {
          customerDataBlocked = true;
          console.warn("[OrdersSync] Protected Customer Data restriction active; falling back to restricted fields.");
          continue;
        }
        throw err;
      }

      const connection = data?.orders;
      const nodes = connection?.nodes || [];
      fetchedNodes = fetchedNodes.concat(nodes);

      hasMore = connection?.pageInfo?.hasNextPage || false;
      afterCursor = connection?.pageInfo?.endCursor || null;

      // Limit initial run to max 500 orders to avoid huge first-time delays
      if (fetchedNodes.length >= 500) break;
    }

    const existingOrders = readOrders();
    const orderMap = new Map();
    for (const o of existingOrders) {
      orderMap.set(o.id, o);
    }

    const nowIso = new Date().toISOString();

    for (const node of fetchedNodes) {
      const numericId = node.id.split("/").pop();
      const adminUrl = `https://${SHOP}/admin/orders/${numericId}`;

      const lineItems = (node.lineItems?.nodes || []).map((li) => {
        const unit = li.originalUnitPriceSet?.shopMoney?.amount || "0.00";
        const qty = li.quantity || 1;
        const total = (parseFloat(unit) * qty).toFixed(2);
        return {
          title: li.title || "Untitled Item",
          variantTitle: li.variantTitle || "",
          sku: li.sku || "",
          quantity: qty,
          unitPrice: unit,
          lineTotal: total,
          imageUrl: li.image?.url || null
        };
      });

      const orderRecord = {
        id: node.id,
        numericId,
        adminUrl,
        name: node.name,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        cancelledAt: node.cancelledAt,
        displayFinancialStatus: node.displayFinancialStatus || "PENDING",
        displayFulfillmentStatus: node.displayFulfillmentStatus || "UNFULFILLED",
        currency: node.totalPriceSet?.shopMoney?.currencyCode || "USD",
        total: node.totalPriceSet?.shopMoney?.amount || "0.00",
        subtotal: node.subtotalPriceSet?.shopMoney?.amount || "0.00",
        shipping: node.totalShippingPriceSet?.shopMoney?.amount || "0.00",
        tax: node.totalTaxSet?.shopMoney?.amount || "0.00",
        discounts: node.totalDiscountsSet?.shopMoney?.amount || "0.00",
        customer: node.customer
          ? {
              displayName: node.customer.displayName || null,
              phone: node.customer.phone || null,
              email: node.customer.email || null
            }
          : null,
        shippingAddress: node.shippingAddress || null,
        billingAddress: node.billingAddress || null,
        lineItems,
        note: node.note || "",
        tags: Array.isArray(node.tags) ? node.tags : (node.tags ? [node.tags] : []),
        sourceName: node.sourceName || "web",
        paymentGatewayNames: node.paymentGatewayNames || [],
        shippingLineTitle: node.shippingLine?.title || "",
        syncedAt: nowIso
      };

      orderMap.set(node.id, orderRecord);
    }

    const allUpdated = Array.from(orderMap.values());
    writeOrders(allUpdated);

    writeMeta({
      lastSync: nowIso,
      customerDataRestricted: customerDataBlocked || meta.customerDataRestricted
    });

    console.log(`[OrdersSync] Completed successfully: ${fetchedNodes.length} fetched, ${allUpdated.length} total saved.`);
    return {
      fetched: fetchedNodes.length,
      total: allUpdated.length,
      lastSync: nowIso,
      customerDataRestricted: customerDataBlocked
    };
  } finally {
    isSyncing = false;
  }
}

/**
 * Read orders strictly from local data/orders.json with search, filters, and pagination
 */
export function getStoredOrders({ search = "", financial = "", fulfillment = "", limit = 20, offset = 0 } = {}) {
  const allOrders = readOrders();
  const meta = readMeta();

  let filtered = allOrders;

  // 1. Status filters
  if (financial && financial.toLowerCase() !== "all") {
    filtered = filtered.filter(
      (o) => o.displayFinancialStatus && o.displayFinancialStatus.toLowerCase() === financial.toLowerCase()
    );
  }
  if (fulfillment && fulfillment.toLowerCase() !== "all") {
    filtered = filtered.filter(
      (o) => o.displayFulfillmentStatus && o.displayFulfillmentStatus.toLowerCase() === fulfillment.toLowerCase()
    );
  }

  // 2. Search
  if (search && search.trim()) {
    const term = search.toLowerCase().trim();
    filtered = filtered.filter((o) => {
      const matchName = o.name && o.name.toLowerCase().includes(term);
      const matchCustomer = o.customer?.displayName && o.customer.displayName.toLowerCase().includes(term);
      const matchEmail = o.customer?.email && o.customer.email.toLowerCase().includes(term);
      const matchPhone =
        (o.customer?.phone && o.customer.phone.includes(term)) ||
        (o.shippingAddress?.phone && o.shippingAddress.phone.includes(term));
      const matchCity = o.shippingAddress?.city && o.shippingAddress.city.toLowerCase().includes(term);
      return matchName || matchCustomer || matchEmail || matchPhone || matchCity;
    });
  }

  // 3. Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);
  const items = filtered.slice(safeOffset, safeOffset + safeLimit);

  return {
    items,
    total,
    meta
  };
}

export function getStoredOrderById(id) {
  if (!id) return null;
  const orders = readOrders();
  const cleanId = String(id).trim();
  return (
    orders.find(
      (o) => o.id === cleanId || o.numericId === cleanId || o.name?.toLowerCase() === cleanId.toLowerCase()
    ) || null
  );
}

export function getStoredOrdersSummary() {
  const orders = readOrders();
  const meta = readMeta();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  let unfulfilled = 0;
  let paid = 0;
  let pendingPayment = 0;
  let todayRevenue = 0;

  for (const o of orders) {
    if (o.displayFulfillmentStatus === "UNFULFILLED") {
      unfulfilled++;
    }
    if (o.displayFinancialStatus === "PAID") {
      paid++;
    }
    if (o.displayFinancialStatus === "PENDING" || o.displayFinancialStatus === "PARTIALLY_PAID") {
      pendingPayment++;
    }

    if (o.createdAt && o.createdAt.startsWith(todayStr)) {
      todayRevenue += parseFloat(o.total || 0);
    }
  }

  return {
    total: orders.length,
    unfulfilled,
    paid,
    pendingPayment,
    todayRevenue: todayRevenue.toFixed(2),
    lastSync: meta.lastSync,
    customerDataRestricted: Boolean(meta.customerDataRestricted)
  };
}
