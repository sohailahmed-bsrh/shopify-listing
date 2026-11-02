import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/db.js';
import { verifyStoreConnection, getShopifyCollections, getShopifyProducts, sanitizeShopDomain } from '../services/shopifyService.js';

export async function getStores(req, res) {
  const db = getDb();
  if (db.isLive()) {
    try {
      const [rows] = await db.pool().query('SELECT id, name, shop_domain, api_version, currency, is_default, is_active, created_at FROM shopify_stores ORDER BY created_at DESC');
      return res.json({ success: true, stores: rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.json({
    success: true,
    stores: db.memory.stores.map(({ access_token, ...rest }) => rest)
  });
}

export async function getShopifyStatus(req, res) {
  const domain = (process.env.SHOP || process.env.SHOPIFY_SHOP_DOMAIN || 'devsil-store.myshopify.com')
    .replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = process.env.CLIENT_SECRET || process.env.SHOPIFY_ACCESS_TOKEN;
  const version = process.env.API_VERSION || '2024-10';

  const result = await verifyStoreConnection(domain, token, version);
  return res.json({
    success: true,
    connected: result.success,
    shop: result.shop || null,
    shop_domain: domain,
    error: result.error || null
  });
}

export async function testConnection(req, res) {
  const { shop_domain, access_token, api_version } = req.body;

  if (!shop_domain || !access_token) {
    return res.status(400).json({ success: false, error: 'Shop domain and access token are required' });
  }

  const result = await verifyStoreConnection(shop_domain, access_token, api_version);
  return res.json(result);
}

export async function addStore(req, res) {
  const { name, shop_domain, access_token, api_version = '2024-10', is_default = false } = req.body;

  if (!shop_domain || !access_token) {
    return res.status(400).json({ success: false, error: 'Shop domain and access token are required' });
  }

  const cleanDomain = sanitizeShopDomain(shop_domain);
  const verifyResult = await verifyStoreConnection(cleanDomain, access_token, api_version);
  const currency = verifyResult.shop?.currency || 'USD';
  const storeName = name || verifyResult.shop?.name || cleanDomain.replace('.myshopify.com', '');

  const db = getDb();
  const id = uuidv4();

  if (db.isLive()) {
    try {
      if (is_default) {
        await db.pool().query('UPDATE shopify_stores SET is_default = FALSE');
      }

      await db.pool().query(
        `INSERT INTO shopify_stores (id, name, shop_domain, access_token, api_version, currency, is_default, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), access_token = VALUES(access_token), api_version = VALUES(api_version), currency = VALUES(currency), is_default = VALUES(is_default)`,
        [id, storeName, cleanDomain, access_token, api_version, currency, is_default ? 1 : 0, 1]
      );

      return res.json({
        success: true,
        message: 'Shopify store connected successfully',
        store: { id, name: storeName, shop_domain: cleanDomain, api_version, currency, is_default }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Memory store fallback
  const existingIdx = db.memory.stores.findIndex(s => s.shop_domain === cleanDomain);
  const newStore = {
    id: existingIdx >= 0 ? db.memory.stores[existingIdx].id : id,
    name: storeName,
    shop_domain: cleanDomain,
    access_token,
    api_version,
    currency,
    is_default: is_default ? 1 : 0,
    is_active: 1,
    created_at: new Date().toISOString()
  };

  if (is_default) {
    db.memory.stores.forEach(s => s.is_default = 0);
  }

  if (existingIdx >= 0) {
    db.memory.stores[existingIdx] = newStore;
  } else {
    db.memory.stores.push(newStore);
  }

  return res.json({
    success: true,
    message: 'Shopify store connected successfully',
    store: { id: newStore.id, name: storeName, shop_domain: cleanDomain, api_version, currency, is_default }
  });
}

export async function deleteStore(req, res) {
  const { id } = req.params;
  const db = getDb();

  if (db.isLive()) {
    try {
      await db.pool().query('DELETE FROM shopify_stores WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Store removed' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  db.memory.stores = db.memory.stores.filter(s => s.id !== id);
  return res.json({ success: true, message: 'Store removed' });
}

export async function getStoreCollections(req, res) {
  const { id } = req.params;
  const db = getDb();
  let store;

  if (db.isLive()) {
    const [rows] = await db.pool().query('SELECT * FROM shopify_stores WHERE id = ?', [id]);
    store = rows[0];
  } else {
    store = db.memory.stores.find(s => s.id === id);
  }

  if (!store) {
    return res.status(404).json({ success: false, error: 'Store not found' });
  }

  const result = await getShopifyCollections(store.shop_domain, store.access_token, store.api_version);
  return res.json(result);
}

export async function getStoreProducts(req, res) {
  const { id } = req.params;
  const db = getDb();
  let store;

  if (db.isLive()) {
    const [rows] = await db.pool().query('SELECT * FROM shopify_stores WHERE id = ?', [id]);
    store = rows[0];
  } else {
    store = db.memory.stores.find(s => s.id === id);
  }

  if (!store) {
    return res.status(404).json({ success: false, error: 'Store not found' });
  }

  const result = await getShopifyProducts(store.shop_domain, store.access_token, store.api_version);
  return res.json(result);
}

/**
 * 1-Click Automated OAuth Authorization Starter
 */
export function startOAuth(req, res) {
  const shop = req.query.shop || process.env.SHOPIFY_SHOP_DOMAIN || 'devsil-store.myshopify.com';
  const cleanShop = sanitizeShopDomain(shop);
  const clientId = req.query.client_id || process.env.SHOPIFY_CLIENT_ID || '59547e88d597627a9e2546ea2aa17db6';
  
  // Use host or tunnel URL for redirect callback
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const redirectUri = `${protocol}://${host}/api/shopify/oauth/callback`;
  
  const scopes = 'write_products,read_products,write_inventory,read_inventory,read_orders,write_files,read_files';
  const authUrl = `https://${cleanShop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  return res.redirect(authUrl);
}

/**
 * OAuth Callback Handler: Exchanges temporary code for permanent Admin API Access Token
 */
export async function handleOAuthCallback(req, res) {
  const { shop, code, error } = req.query;

  if (error || !code) {
    return res.status(400).send(`
      <div style="background:#030712; color:#fff; font-family:sans-serif; padding:2rem; text-align:center;">
        <h2 style="color:#ef4444;">OAuth Authorization Cancelled or Failed</h2>
        <p>${error || 'No authorization code received from Shopify'}</p>
        <a href="/" style="color:#6366f1;">Return to Dashboard</a>
      </div>
    `);
  }

  const cleanShop = sanitizeShopDomain(shop || process.env.SHOPIFY_SHOP_DOMAIN || 'devsil-store.myshopify.com');
  const clientId = process.env.SHOPIFY_CLIENT_ID || process.env.CLIENT_ID || '';
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || process.env.CLIENT_SECRET || '';

  try {
    const tokenUrl = `https://${cleanShop}/admin/oauth/access_token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token exchange failed (${tokenResponse.status}): ${errText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Verify and save to store database
    const verifyResult = await verifyStoreConnection(cleanShop, accessToken);
    const storeName = verifyResult.shop?.name || cleanShop.replace('.myshopify.com', '');
    const currency = verifyResult.shop?.currency || 'USD';

    const db = getDb();
    const id = uuidv4();

    if (db.isLive()) {
      await db.pool().query('UPDATE shopify_stores SET is_default = FALSE');
      await db.pool().query(
        `INSERT INTO shopify_stores (id, name, shop_domain, access_token, api_version, currency, is_default, is_active)
         VALUES (?, ?, ?, ?, '2024-10', ?, 1, 1)
         ON DUPLICATE KEY UPDATE name = VALUES(name), access_token = VALUES(access_token), is_default = 1`,
        [id, storeName, cleanShop, accessToken, currency]
      );
    } else {
      db.memory.stores.forEach(s => s.is_default = 0);
      const existingIdx = db.memory.stores.findIndex(s => s.shop_domain === cleanShop);
      const storeObj = {
        id: existingIdx >= 0 ? db.memory.stores[existingIdx].id : id,
        name: storeName,
        shop_domain: cleanShop,
        access_token: accessToken,
        api_version: '2024-10',
        currency,
        is_default: 1,
        is_active: 1,
        created_at: new Date().toISOString()
      };
      if (existingIdx >= 0) db.memory.stores[existingIdx] = storeObj;
      else db.memory.stores.unshift(storeObj);
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shopify Connected Successfully</title>
          <style>
            body { background: #030712; color: #f4f4f5; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #09090b; border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 2.5rem; max-width: 550px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
            .badge { display: inline-block; padding: 0.25rem 0.75rem; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 1rem; }
            h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #fff; }
            p { color: #a1a1aa; font-size: 0.9rem; line-height: 1.5; margin: 0 0 1.5rem 0; }
            .token-box { background: #030712; border: 1px solid rgba(255,255,255,0.08); border-radius: 0.75rem; padding: 1rem; font-family: monospace; font-size: 0.85rem; color: #818cf8; word-break: break-all; margin-bottom: 1.5rem; text-align: left; }
            .btn { display: inline-block; padding: 0.75rem 1.75rem; background: #6366f1; color: #fff; font-weight: 700; font-size: 0.85rem; border-radius: 0.75rem; text-decoration: none; transition: background 0.2s; }
            .btn:hover { background: #4f46e5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">✓ Connected to Shopify</div>
            <h1>${storeName}</h1>
            <p>Your Shopify store has been successfully authorized and connected to EMS Listing Automation. Products can now be published live with 1 click!</p>
            <div class="token-box">
              <span style="color:#71717a; font-size:0.75rem; display:block; margin-bottom:0.25rem;">ADMIN API ACCESS TOKEN:</span>
              ${accessToken}
            </div>
            <a href="/" class="btn">Open EMS Listing Automation →</a>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    return res.status(500).send(`
      <div style="background:#030712; color:#fff; font-family:sans-serif; padding:2rem; text-align:center;">
        <h2 style="color:#ef4444;">Failed to exchange Shopify token</h2>
        <p style="color:#a1a1aa;">${err.message}</p>
        <a href="/" style="color:#6366f1;">Return to Dashboard</a>
      </div>
    `);
  }
}

