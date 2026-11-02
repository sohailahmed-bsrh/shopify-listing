import mysql from "mysql2/promise";
import "dotenv/config";
import { getLinkByEmsId } from "./linksStore.js";

let poolInstance = null;
let detectedSchema = null;

export function sanitizeDbError(err) {
  if (!err) return "Unknown database error.";
  const msg = err.message || "";
  const code = err.code || "";

  if (code === "ETIMEDOUT" || code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return "Cannot reach the database. Please verify host and network accessibility.";
  }
  if (code === "ER_ACCESS_DENIED_ERROR" || code === "ER_DBACCESS_DENIED_ERROR" || /access denied/i.test(msg)) {
    return "Database credentials rejected. Please verify EMS_DB_USER, EMS_DB_PASSWORD, and EMS_DB_NAME in .env.";
  }
  if (code === "PROTOCOL_CONNECTION_LOST") {
    return "Database connection was closed by the remote host.";
  }
  return `Database query failed: ${msg.replace(/(password|user|host|secret)=[^&\s]+/gi, "$1=[REDACTED]")}`;
}

export async function getPool() {
  if (poolInstance) return poolInstance;

  const host = (process.env.EMS_DB_HOST || process.env.DB_HOST || "").trim();
  const user = (process.env.EMS_DB_USER || process.env.DB_USER || "").trim();
  const password = (process.env.EMS_DB_PASSWORD || process.env.DB_PASSWORD || "").trim();
  const database = (process.env.EMS_DB_NAME || process.env.DB_NAME || "").trim();
  const port = parseInt(process.env.EMS_DB_PORT || process.env.DB_PORT || "3306", 10);

  if (!host || !user || !database) {
    throw new Error(
      "EMS database credentials are not configured in .env. Please set EMS_DB_HOST, EMS_DB_USER, EMS_DB_PASSWORD, and EMS_DB_NAME."
    );
  }

  const baseConfig = {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 3,
    connectTimeout: 5000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  };

  try {
    poolInstance = mysql.createPool(baseConfig);
    const testConn = await poolInstance.getConnection();
    testConn.release();
    return poolInstance;
  } catch (initialErr) {
    if (/ssl|handshake|tls/i.test(initialErr.message) || initialErr.code === "HANDSHAKE_SSL_ERROR") {
      try {
        poolInstance = mysql.createPool({
          ...baseConfig,
          ssl: { rejectUnauthorized: false }
        });
        const sslConn = await poolInstance.getConnection();
        sslConn.release();
        return poolInstance;
      } catch (sslErr) {
        poolInstance = null;
        throw new Error(sanitizeDbError(sslErr));
      }
    }
    poolInstance = null;
    throw new Error(sanitizeDbError(initialErr));
  }
}

/**
 * THE EMS DATABASE IS STRICTLY READ-ONLY.
 * Enforces that all queries are SELECT, SHOW, DESCRIBE, or EXPLAIN.
 * Rejects any write, modification, DDL, or batch injection attempts.
 */
export async function emsQuery(sql, params = []) {
  if (!sql || typeof sql !== "string") {
    throw new Error("Invalid SQL query statement provided.");
  }

  const sanitized = sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--.*$/gm, "")
    .trim();

  // (1) Reject anything that does not start with SELECT, SHOW, DESCRIBE, or EXPLAIN
  if (!/^(SELECT|SHOW|DESCRIBE|EXPLAIN)\b/i.test(sanitized)) {
    throw new Error(
      "Security Violation: Only SELECT, SHOW, DESCRIBE, and EXPLAIN queries are permitted on the EMS database."
    );
  }

  if (/;\s*(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE)\b/i.test(sanitized)) {
    throw new Error("Security Violation: Multiple queries or mutating operations are strictly prohibited.");
  }

  try {
    const pool = await getPool();
    const conn = await pool.getConnection();

    try {
      try {
        await conn.query("SET SESSION TRANSACTION READ ONLY");
      } catch {}

      const [rows] = await conn.execute({
        sql: sanitized,
        values: params,
        timeout: 10000
      });

      return rows;
    } finally {
      conn.release();
    }
  } catch (err) {
    throw new Error(sanitizeDbError(err));
  }
}

export async function discoverEmsSchema() {
  if (detectedSchema) return detectedSchema;

  const customTable = (process.env.EMS_PRODUCTS_TABLE || "").trim();
  if (customTable) {
    const cols = await getTableColumns(customTable);
    detectedSchema = {
      tableName: customTable,
      columns: cols,
      mediaTable: await findMediaTable()
    };
    return detectedSchema;
  }

  const tablesResult = await emsQuery("SHOW TABLES");
  const tableNames = tablesResult.map((r) => Object.values(r)[0]);

  const candidateNames = ["products", "listings", "items", "catalog", "tbl_products"];
  let chosenTable = null;

  for (const name of candidateNames) {
    const found = tableNames.find((t) => t.toLowerCase() === name);
    if (found) {
      chosenTable = found;
      break;
    }
  }

  if (!chosenTable) {
    chosenTable = tableNames.find((t) => /product|listing|catalog/i.test(t));
  }

  if (!chosenTable) {
    throw new Error(
      `Could not identify a products table in database. Available tables: [${tableNames.slice(0, 10).join(", ")}]`
    );
  }

  const columns = await getTableColumns(chosenTable);
  const mediaTable = await findMediaTable(tableNames);

  detectedSchema = {
    tableName: chosenTable,
    columns,
    mediaTable
  };

  return detectedSchema;
}

async function getTableColumns(tableName) {
  const descRows = await emsQuery(`DESCRIBE \`${tableName}\``);
  return descRows.map((r) => r.Field.toLowerCase());
}

async function findMediaTable(allTables = []) {
  if (!allTables || allTables.length === 0) {
    try {
      const tablesResult = await emsQuery("SHOW TABLES");
      allTables = tablesResult.map((r) => Object.values(r)[0]);
    } catch {
      return null;
    }
  }
  const mediaCandidates = ["listing_media", "product_images", "product_media", "listing_images"];
  return allTables.find((t) => mediaCandidates.includes(t.toLowerCase())) || null;
}

export function normalizeEmsProduct(row = {}, mediaUrls = []) {
  const emsId = String(row.id || row.product_id || row.item_id || row.sku || "").trim();
  const title = String(row.title || row.name || row.product_name || "Untitled Product").trim();

  let description = "";
  if (row.description_html) description = String(row.description_html);
  else if (row.description) description = String(row.description);
  else if (row.desc) description = String(row.desc);
  else {
    const parts = [];
    if (row.brand) parts.push(`Brand: ${row.brand}`);
    if (row.gender) parts.push(`Gender: ${row.gender}`);
    if (row.color) parts.push(`Color: ${row.color}`);
    if (row.size_original || row.size) parts.push(`Size: ${row.size_original || row.size}`);
    description = parts.length > 0 ? parts.join(" | ") : "";
  }

  const vendor = String(row.brand || row.vendor || row.manufacturer || "EMS Originals").trim();
  const productType = String(row.category || (row.gender ? `${vendor} ${row.gender}` : "Footwear & Apparel")).trim();

  let price = "0.00";
  const rawPrice =
    row.starting_price !== undefined
      ? row.starting_price
      : row.price !== undefined
      ? row.price
      : row.sale_price !== undefined
      ? row.sale_price
      : row.selling_price !== undefined
      ? row.selling_price
      : row.minimum_price;

  if (rawPrice !== null && rawPrice !== undefined) {
    const parsed = parseFloat(String(rawPrice));
    if (!isNaN(parsed) && parsed >= 0) price = parsed.toFixed(2);
  }

  const images = [];

  // 1. Add main image from row if present
  const mainImg = row.main_image_url || row.image_url || row.image || row.photo || row.thumbnail || row.url;
  if (typeof mainImg === "string" && mainImg.trim().startsWith("http")) {
    images.push(mainImg.trim());
  }

  // 2. Parse extra_image_urls JSON or array
  if (row.extra_image_urls) {
    try {
      const parsedExtras =
        typeof row.extra_image_urls === "string"
          ? JSON.parse(row.extra_image_urls)
          : row.extra_image_urls;
      if (Array.isArray(parsedExtras)) {
        for (const u of parsedExtras) {
          if (typeof u === "string" && u.trim().startsWith("http") && !images.includes(u.trim())) {
            images.push(u.trim());
          }
        }
      }
    } catch {}
  }

  // 3. Add any mediaUrls from joined media tables
  if (Array.isArray(mediaUrls)) {
    for (const u of mediaUrls) {
      if (typeof u === "string" && u.trim().startsWith("http") && !images.includes(u.trim())) {
        images.push(u.trim());
      }
    }
  }

  const imageUrl = images.length > 0 ? images[0] : "";
  const sku = row.sku ? String(row.sku).trim() : (row.id ? `EMS-${row.id}` : null);
  const stock = parseInt(row.inventory_quantity || row.stock || row.qty || 1, 10);
  const category = row.category || row.gender || null;

  return {
    emsId,
    title,
    description,
    vendor,
    productType,
    price,
    imageUrl,
    images,
    sku,
    stock: isNaN(stock) ? 0 : stock,
    category
  };
}

/**
 * Fetch EMS products with server-side search, pagination, and links mapping.
 * Connects directly to the live MySQL database via emsQuery.
 * If the database is unreachable, throws a sanitized error (never returns fake products).
 */
export async function fetchEmsProducts({ search = "", limit = 50, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  const schema = await discoverEmsSchema();
  const { tableName, columns, mediaTable } = schema;

  const whereClauses = [];
  const queryParams = [];

  // Exclude archived or deleted items if such flags exist
  if (columns.includes("status")) {
    whereClauses.push("status != 'archived' AND status != 'deleted'");
  } else if (columns.includes("is_active")) {
    whereClauses.push("is_active = 1");
  } else if (columns.includes("deleted_at")) {
    whereClauses.push("deleted_at IS NULL");
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    const searchConditions = [];
    if (columns.includes("title")) {
      searchConditions.push("title LIKE ?");
      queryParams.push(term);
    } else if (columns.includes("name")) {
      searchConditions.push("name LIKE ?");
      queryParams.push(term);
    }
    if (columns.includes("brand")) {
      searchConditions.push("brand LIKE ?");
      queryParams.push(term);
    }
    if (columns.includes("sku")) {
      searchConditions.push("sku LIKE ?");
      queryParams.push(term);
    }
    if (columns.includes("color")) {
      searchConditions.push("color LIKE ?");
      queryParams.push(term);
    }
    if (searchConditions.length > 0) {
      whereClauses.push(`(${searchConditions.join(" OR ")})`);
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const countSql = `SELECT COUNT(*) AS total FROM \`${tableName}\` ${whereSql} LIMIT 1`;
  const countRows = await emsQuery(countSql, queryParams);
  const total = countRows?.[0]?.total ? Number(countRows[0].total) : 0;

  const orderCol = columns.includes("created_at")
    ? "created_at"
    : columns.includes("id")
    ? "id"
    : null;

  const orderSql = orderCol ? `ORDER BY \`${orderCol}\` DESC` : "";
  const dataSql = `SELECT * FROM \`${tableName}\` ${whereSql} ${orderSql} LIMIT ? OFFSET ?`;

  const rows = await emsQuery(dataSql, [...queryParams, String(safeLimit), String(safeOffset)]);

  const mediaMap = {};
  if (mediaTable && rows.length > 0) {
    try {
      const ids = rows.map((r) => r.id).filter(Boolean);
      if (ids.length > 0) {
        const placeholders = ids.map(() => "?").join(",");
        const mediaRows = await emsQuery(
          `SELECT listing_id, url FROM \`${mediaTable}\` WHERE listing_id IN (${placeholders}) ORDER BY position ASC LIMIT 300`,
          ids
        );
        for (const m of mediaRows) {
          if (!mediaMap[m.listing_id]) mediaMap[m.listing_id] = [];
          if (m.url) mediaMap[m.listing_id].push(m.url);
        }
      }
    } catch {}
  }

  const items = rows.map((row) => {
    const relatedMedia = mediaMap[row.id] || [];
    const normalized = normalizeEmsProduct(row, relatedMedia);
    const link = getLinkByEmsId(normalized.emsId);

    return {
      ...normalized,
      alreadyListed: Boolean(link),
      shopifyId: link?.shopifyId || null,
      shopifyHandle: link?.handle || null,
      listedAt: link?.listedAt || null,
      listedBy: link?.listedBy || null,
      storefrontUrl: link?.storefrontUrl || null,
      adminUrl: link?.adminUrl || null
    };
  });

  return { items, total };
}
