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
