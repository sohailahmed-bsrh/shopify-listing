import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/db.js';
import { publishProductToShopify } from '../services/shopifyService.js';

export async function getListings(req, res) {
  const { search, status, sync_status, limit = 50, offset = 0 } = req.query;
  const db = getDb();

  if (db.isLive()) {
    try {
      let query = `
        SELECT l.*, s.name as store_name,
               (SELECT COUNT(*) FROM listing_variants WHERE listing_id = l.id) as variant_count,
               (SELECT url FROM listing_media WHERE listing_id = l.id AND media_type = 'image' ORDER BY position ASC LIMIT 1) as thumbnail_url
        FROM listings l
        LEFT JOIN shopify_stores s ON l.store_id = s.id
        WHERE 1=1
      `;
      const params = [];

      if (search) {
        query += ` AND (l.title LIKE ? OR l.tags LIKE ? OR l.sku LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (status) {
        query += ` AND l.status = ?`;
        params.push(status);
      }
      if (sync_status) {
        query += ` AND l.sync_status = ?`;
        params.push(sync_status);
      }

      query += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
      params.push(Number(limit), Number(offset));

      const [rows] = await db.pool().query(query, params);
      const [[{ total }]] = await db.pool().query('SELECT COUNT(*) as total FROM listings');

      return res.json({ success: true, listings: rows, total });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Fallback memory store
  let filtered = [...db.memory.listings];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(l => l.title?.toLowerCase().includes(s) || l.tags?.toLowerCase().includes(s) || l.sku?.toLowerCase().includes(s));
  }
  if (status) {
    filtered = filtered.filter(l => l.status === status);
  }
  if (sync_status) {
    filtered = filtered.filter(l => l.sync_status === sync_status);
  }

  return res.json({
    success: true,
    listings: filtered.slice(Number(offset), Number(offset) + Number(limit)),
    total: filtered.length
  });
}

export async function getListingById(req, res) {
  const { id } = req.params;
  const db = getDb();

  if (db.isLive()) {
    try {
      const [listings] = await db.pool().query('SELECT * FROM listings WHERE id = ?', [id]);
      if (listings.length === 0) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
      }

      const listing = listings[0];
      const [variants] = await db.pool().query('SELECT * FROM listing_variants WHERE listing_id = ? ORDER BY created_at ASC', [id]);
      const [media] = await db.pool().query('SELECT * FROM listing_media WHERE listing_id = ? ORDER BY position ASC', [id]);

      return res.json({
        success: true,
        listing: {
          ...listing,
          variants,
          media
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  const listing = db.memory.listings.find(l => l.id === id);
  if (!listing) {
    return res.status(404).json({ success: false, error: 'Listing not found' });
  }

  const variants = db.memory.variants.filter(v => v.listing_id === id);
  const media = db.memory.media.filter(m => m.listing_id === id);

  return res.json({
    success: true,
    listing: {
      ...listing,
      variants,
      media
    }
  });
}

export async function createListing(req, res) {
  const {
    store_id,
    title,
    description_html,
    vendor = 'EMS',
    product_type = '',
    category = '',
    tags = '',
    status = 'draft',
    price = 0,
    compare_at_price = null,
    cost_per_item = null,
    sku = '',
    barcode = '',
    inventory_quantity = 0,
    seo_title = '',
    seo_description = '',
    ai_generated = false,
    voice_memo_url = null,
    voice_transcript = null,
    variants = [],
    media = []
  } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, error: 'Product title is required' });
  }

  const id = uuidv4();
  const db = getDb();
  const formattedTags = Array.isArray(tags) ? tags.join(', ') : tags;

  if (db.isLive()) {
    const conn = await db.pool().getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO listings (
          id, store_id, title, description_html, vendor, product_type, category,
          tags, status, sync_status, price, compare_at_price, cost_per_item,
          sku, barcode, inventory_quantity, seo_title, seo_description,
          ai_generated, voice_memo_url, voice_transcript
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, store_id || null, title, description_html, vendor, product_type, category,
          formattedTags, status, price, compare_at_price, cost_per_item,
          sku, barcode, inventory_quantity, seo_title, seo_description,
          ai_generated ? 1 : 0, voice_memo_url, voice_transcript
        ]
      );

      // Insert variants
      if (variants && variants.length > 0) {
        for (const v of variants) {
          await conn.query(
            `INSERT INTO listing_variants (
              id, listing_id, option1_name, option1_value, option2_name, option2_value,
              option3_name, option3_value, price, compare_at_price, cost_per_item,
              sku, barcode, inventory_quantity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(), id, v.option1_name || 'Title', v.option1_value || 'Default Title',
              v.option2_name || null, v.option2_value || null,
              v.option3_name || null, v.option3_value || null,
              v.price || price, v.compare_at_price || compare_at_price, v.cost_per_item || cost_per_item,
              v.sku || sku, v.barcode || barcode, v.inventory_quantity || inventory_quantity
            ]
          );
        }
      }

      // Insert media
      if (media && media.length > 0) {
        for (let i = 0; i < media.length; i++) {
          const m = media[i];
          await conn.query(
            `INSERT INTO listing_media (id, listing_id, media_type, url, oci_storage_key, alt_text, position)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), id, m.media_type || 'image', m.url, m.oci_storage_key || null, m.alt_text || title, i + 1]
          );
        }
      }

      await conn.commit();
      conn.release();

      return res.json({ success: true, message: 'Listing created successfully', id });
    } catch (err) {
      await conn.rollback();
      conn.release();
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Memory fallback
  const newListing = {
    id,
    store_id: store_id || null,
    title,
    description_html,
    vendor,
    product_type,
    category,
    tags: formattedTags,
    status,
    sync_status: 'draft',
    price,
    compare_at_price,
    cost_per_item,
    sku,
    barcode,
    inventory_quantity,
    seo_title,
    seo_description,
    ai_generated,
    voice_memo_url,
    voice_transcript,
    created_at: new Date().toISOString()
  };

  db.memory.listings.unshift(newListing);

  if (variants && variants.length > 0) {
    variants.forEach(v => {
      db.memory.variants.push({
        id: uuidv4(),
        listing_id: id,
        ...v,
        price: v.price || price
      });
    });
  }

  if (media && media.length > 0) {
    media.forEach((m, idx) => {
      db.memory.media.push({
        id: uuidv4(),
        listing_id: id,
        media_type: m.media_type || 'image',
        url: m.url,
        alt_text: m.alt_text || title,
        position: idx + 1
      });
    });
  }

  return res.json({ success: true, message: 'Listing created successfully', id, listing: newListing });
}

export async function updateListing(req, res) {
  const { id } = req.params;
  const {
    store_id,
    title,
    description_html,
    vendor,
    product_type,
    category,
    tags,
    status,
    price,
    compare_at_price,
    cost_per_item,
    sku,
    barcode,
    inventory_quantity,
    seo_title,
    seo_description,
    variants,
    media
  } = req.body;

  const db = getDb();
  const formattedTags = Array.isArray(tags) ? tags.join(', ') : tags;

  if (db.isLive()) {
    const conn = await db.pool().getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE listings SET
          store_id = ?, title = ?, description_html = ?, vendor = ?, product_type = ?, category = ?,
          tags = ?, status = ?, price = ?, compare_at_price = ?, cost_per_item = ?,
          sku = ?, barcode = ?, inventory_quantity = ?, seo_title = ?, seo_description = ?
         WHERE id = ?`,
        [
          store_id || null, title, description_html, vendor, product_type, category,
          formattedTags, status, price, compare_at_price, cost_per_item,
          sku, barcode, inventory_quantity, seo_title, seo_description, id
        ]
      );

      if (variants) {
        await conn.query('DELETE FROM listing_variants WHERE listing_id = ?', [id]);
        for (const v of variants) {
          await conn.query(
            `INSERT INTO listing_variants (
              id, listing_id, option1_name, option1_value, option2_name, option2_value,
              option3_name, option3_value, price, compare_at_price, cost_per_item,
              sku, barcode, inventory_quantity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(), id, v.option1_name || 'Title', v.option1_value || 'Default Title',
              v.option2_name || null, v.option2_value || null,
              v.option3_name || null, v.option3_value || null,
              v.price || price, v.compare_at_price || compare_at_price, v.cost_per_item || cost_per_item,
              v.sku || sku, v.barcode || barcode, v.inventory_quantity || inventory_quantity
            ]
          );
        }
      }

      if (media) {
        await conn.query('DELETE FROM listing_media WHERE listing_id = ?', [id]);
        for (let i = 0; i < media.length; i++) {
          const m = media[i];
          await conn.query(
            `INSERT INTO listing_media (id, listing_id, media_type, url, oci_storage_key, alt_text, position)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), id, m.media_type || 'image', m.url, m.oci_storage_key || null, m.alt_text || title, i + 1]
          );
        }
      }

      await conn.commit();
      conn.release();
      return res.json({ success: true, message: 'Listing updated successfully' });
    } catch (err) {
      await conn.rollback();
      conn.release();
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Memory fallback
  const idx = db.memory.listings.findIndex(l => l.id === id);
  if (idx < 0) {
    return res.status(404).json({ success: false, error: 'Listing not found' });
  }

  db.memory.listings[idx] = {
    ...db.memory.listings[idx],
    store_id: store_id || db.memory.listings[idx].store_id,
    title: title || db.memory.listings[idx].title,
    description_html: description_html !== undefined ? description_html : db.memory.listings[idx].description_html,
    vendor: vendor || db.memory.listings[idx].vendor,
    product_type: product_type || db.memory.listings[idx].product_type,
    category: category || db.memory.listings[idx].category,
    tags: formattedTags || db.memory.listings[idx].tags,
    status: status || db.memory.listings[idx].status,
    price: price !== undefined ? price : db.memory.listings[idx].price,
    compare_at_price: compare_at_price !== undefined ? compare_at_price : db.memory.listings[idx].compare_at_price,
    cost_per_item: cost_per_item !== undefined ? cost_per_item : db.memory.listings[idx].cost_per_item,
    sku: sku || db.memory.listings[idx].sku,
    barcode: barcode || db.memory.listings[idx].barcode,
    inventory_quantity: inventory_quantity !== undefined ? inventory_quantity : db.memory.listings[idx].inventory_quantity,
    seo_title: seo_title || db.memory.listings[idx].seo_title,
    seo_description: seo_description || db.memory.listings[idx].seo_description,
    updated_at: new Date().toISOString()
  };

  if (variants) {
    db.memory.variants = db.memory.variants.filter(v => v.listing_id !== id);
    variants.forEach(v => db.memory.variants.push({ id: uuidv4(), listing_id: id, ...v }));
  }

  if (media) {
    db.memory.media = db.memory.media.filter(m => m.listing_id !== id);
    media.forEach((m, i) => db.memory.media.push({ id: uuidv4(), listing_id: id, position: i + 1, ...m }));
  }

  return res.json({ success: true, message: 'Listing updated successfully' });
}

export async function deleteListing(req, res) {
  const { id } = req.params;
  const db = getDb();

  if (db.isLive()) {
    try {
      await db.pool().query('DELETE FROM listing_variants WHERE listing_id = ?', [id]);
      await db.pool().query('DELETE FROM listing_media WHERE listing_id = ?', [id]);
      await db.pool().query('DELETE FROM listings WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Listing deleted' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  db.memory.listings = db.memory.listings.filter(l => l.id !== id);
  db.memory.variants = db.memory.variants.filter(v => v.listing_id !== id);
  db.memory.media = db.memory.media.filter(m => m.listing_id !== id);

  return res.json({ success: true, message: 'Listing deleted' });
}

/**
 * Direct Publish to Shopify
 */
export async function publishListing(req, res) {
  const { id } = req.params;
  const { store_id } = req.body;
  const db = getDb();

  let listing, variants = [], media = [], store;

  if (db.isLive()) {
    const [listings] = await db.pool().query('SELECT * FROM listings WHERE id = ?', [id]);
    if (listings.length === 0) return res.status(404).json({ success: false, error: 'Listing not found' });
    listing = listings[0];

    const targetStoreId = store_id || listing.store_id;
    const [stores] = targetStoreId
      ? await db.pool().query('SELECT * FROM shopify_stores WHERE id = ?', [targetStoreId])
      : await db.pool().query('SELECT * FROM shopify_stores ORDER BY is_default DESC LIMIT 1');

    if (stores.length === 0) return res.status(400).json({ success: false, error: 'No Shopify store configured. Please connect a store first.' });
    store = stores[0];

    const [vars] = await db.pool().query('SELECT * FROM listing_variants WHERE listing_id = ?', [id]);
    variants = vars;
    const [meds] = await db.pool().query('SELECT * FROM listing_media WHERE listing_id = ? ORDER BY position ASC', [id]);
    media = meds;
  } else {
    listing = db.memory.listings.find(l => l.id === id);
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

    const targetStoreId = store_id || listing.store_id;
    store = targetStoreId
      ? db.memory.stores.find(s => s.id === targetStoreId)
      : db.memory.stores[0];

    if (!store) return res.status(400).json({ success: false, error: 'No Shopify store configured.' });

    variants = db.memory.variants.filter(v => v.listing_id === id);
    media = db.memory.media.filter(m => m.listing_id === id);
  }

  try {
    const publishResult = await publishProductToShopify(store, listing, variants, media);

    // Update status in database
    const now = new Date().toISOString();
    if (db.isLive()) {
      await db.pool().query(
        `UPDATE listings SET
          sync_status = 'synced',
          shopify_product_id = ?,
          shopify_handle = ?,
          shopify_url = ?,
          last_synced_at = NOW(),
          error_message = NULL
         WHERE id = ?`,
        [publishResult.shopify_product_id, publishResult.shopify_handle, publishResult.shopify_url, id]
      );
    } else {
      listing.sync_status = 'synced';
      listing.shopify_product_id = publishResult.shopify_product_id;
      listing.shopify_handle = publishResult.shopify_handle;
      listing.shopify_url = publishResult.shopify_url;
      listing.last_synced_at = now;
      listing.error_message = null;
    }

    return res.json({
      success: true,
      message: 'Product successfully published to Shopify!',
      shopify_product_id: publishResult.shopify_product_id,
      shopify_handle: publishResult.shopify_handle,
      shopify_url: publishResult.shopify_url
    });
  } catch (err) {
    if (db.isLive()) {
      await db.pool().query(
        `UPDATE listings SET sync_status = 'failed', error_message = ? WHERE id = ?`,
        [err.message, id]
      );
    } else {
      listing.sync_status = 'failed';
      listing.error_message = err.message;
    }

    return res.status(500).json({
      success: false,
      error: `Failed to publish to Shopify: ${err.message}`
    });
  }
}

/**
 * Bulk Publish Multiple Listings
 */
export async function bulkPublishListings(req, res) {
  const { listing_ids = [], store_id } = req.body;

  if (!listing_ids.length) {
    return res.status(400).json({ success: false, error: 'No listing IDs specified' });
  }

  const results = [];
  for (const id of listing_ids) {
    try {
      const mockReq = { params: { id }, body: { store_id } };
      let mockResData = null;
      const mockRes = {
        json: (d) => { mockResData = d; },
        status: () => mockRes
      };
      await publishListing(mockReq, mockRes);
      results.push({ id, ...mockResData });
    } catch (e) {
      results.push({ id, success: false, error: e.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  return res.json({
    success: true,
    total: listing_ids.length,
    successCount,
    failedCount: listing_ids.length - successCount,
    results
  });
}
