import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let isConnected = false;

// Fallback in-memory storage if MySQL service is not yet started or configured
const memoryStore = {
  stores: [
    {
      id: 'store-default-1',
      name: 'Main EMS Brand Store',
      shop_domain: process.env.SHOPIFY_SHOP_DOMAIN || 'ems-demo-store.myshopify.com',
      access_token: process.env.SHOPIFY_ACCESS_TOKEN || 'shpat_demo1234567890abcdef',
      api_version: process.env.SHOPIFY_API_VERSION || '2024-10',
      currency: 'USD',
      is_default: 1,
      is_active: 1,
      created_at: new Date().toISOString()
    }
  ],
  listings: [],
  variants: [],
  media: [],
  templates: [
    {
      id: 'tmpl-fashion-1',
      name: 'Apparel & Fashion Standard',
      description_template: '<h3>Premium Quality & Craftsmanship</h3><p>Designed for daily comfort, style, and longevity. Crafted with top-grade materials.</p><ul><li>Breathable and lightweight</li><li>Precision tailored fit</li><li>Machine washable</li></ul>',
      default_vendor: 'EMS Originals',
      default_tags: 'apparel, premium, style, bestseller',
      policy_snippet: 'Free shipping on orders over $50. 30-day hassle-free returns.',
      size_chart_html: '<table border="1"><tr><th>Size</th><th>Chest (in)</th><th>Length (in)</th></tr><tr><td>S</td><td>36-38</td><td>27</td></tr><tr><td>M</td><td>39-41</td><td>28</td></tr><tr><td>L</td><td>42-44</td><td>29</td></tr><tr><td>XL</td><td>45-47</td><td>30</td></tr></table>'
    },
    {
      id: 'tmpl-electronics-1',
      name: 'Consumer Electronics & Gadgets',
      description_template: '<h3>Next-Generation Performance</h3><p>Built for professionals and power users requiring reliability and high-speed efficiency.</p><ul><li>1-Year Manufacturer Warranty</li><li>USB-C Quick Charging</li><li>Ultra-compact ergonomic build</li></ul>',
      default_vendor: 'EMS Tech',
      default_tags: 'gadgets, tech, fast-charge, premium',
      policy_snippet: 'Covered under EMS 1-Year Comprehensive Warranty and 14-day replacement guarantee.',
      size_chart_html: ''
    }
  ],
  logs: []
};

export async function initDbPool() {
  const host = (process.env.EMS_DB_HOST || process.env.DB_HOST || 'localhost').trim();
  const user = (process.env.EMS_DB_USER || process.env.DB_USER || 'root').trim();
  const password = (process.env.EMS_DB_PASSWORD || process.env.DB_PASSWORD || '').trim();
  const database = (process.env.EMS_DB_NAME || process.env.DB_NAME || 'u821088027_EMS').trim();
  const port = Number(process.env.EMS_DB_PORT || process.env.DB_PORT) || 3306;
  const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT) || 5;

  const baseConfig = {
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit,
    connectTimeout: 5000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  };

  try {
    pool = mysql.createPool(baseConfig);
    const testConn = await pool.getConnection();
    testConn.release();
    isConnected = true;
    console.log(`[DB] Successfully connected to live MySQL database: ${database} on ${host}:${port}`);

    // Auto-apply schema migrations if needed
    await runSchemaMigrations();
    return pool;
  } catch (err) {
    if (/ssl|handshake|tls/i.test(err.message)) {
      try {
        pool = mysql.createPool({
          ...baseConfig,
          ssl: { rejectUnauthorized: false }
        });
        const sslConn = await pool.getConnection();
        sslConn.release();
        isConnected = true;
        console.log(`[DB] Successfully connected with SSL to database: ${database} on ${host}:${port}`);
        await runSchemaMigrations();
        return pool;
      } catch (sslErr) {
        console.warn(`[DB WARNING] SSL connection failed (${sslErr.message}).`);
      }
    }
    console.warn(`[DB WARNING] Could not connect to MySQL server (${err.message}).`);
    console.warn(`[DB INFO] Running with integrated fallback layer.`);
    isConnected = false;
    return null;
  }
}

async function runSchemaMigrations() {
  if (!pool) return;
  try {
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        await pool.query(statement);
      }
      console.log('[DB] Schema verified & tables initialized successfully.');
    }
  } catch (err) {
    console.error('[DB ERROR] Failed executing schema migrations:', err.message);
  }
}

export function getDb() {
  return {
    isLive: () => isConnected,
    pool: () => pool,
    memory: memoryStore,
    async query(sql, params = []) {
      if (isConnected && pool) {
        return await pool.query(sql, params);
      }
      // Return query on memory store or dummy result
      return [[], []];
    }
  };
}
