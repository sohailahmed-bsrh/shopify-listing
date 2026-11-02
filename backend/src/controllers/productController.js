import { getDb } from '../config/db.js';
import {
  getDefaultShopifyCredentials,
  shopifyGraphql,
  stageAndUploadImage,
  publishProductToOnlineStore
} from '../services/shopifyService.js';

export async function getProducts(req, res) {
  const { search } = req.query;
  const db = getDb();

  const cleanDomain = (process.env.SHOP || process.env.SHOPIFY_SHOP_DOMAIN || 'devsil-store.myshopify.com')
    .replace(/^https?:\/\//, '').replace(/\/$/, '');

  if (db.isLive()) {
    try {
      let sql = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        sql += ' AND (title LIKE ? OR brand LIKE ? OR color LIKE ?)';
        params.push(term, term, term);
      }

      sql += ' ORDER BY id DESC';
      const [rows] = await db.pool().query(sql, params);

      const products = rows.map((r) => {
        let extraImages = [];
        if (r.extra_image_urls) {
          try {
            extraImages = typeof r.extra_image_urls === 'string'
              ? JSON.parse(r.extra_image_urls)
              : r.extra_image_urls;
          } catch {}
        }

        const priceNum = parseFloat(r.starting_price || r.price || '0') || 0;
        const comparePriceNum = r.minimum_price ? parseFloat(r.minimum_price) : null;

        const shopifyId = r.shopify_product_id ? String(r.shopify_product_id) : null;
        const numericShopifyId = shopifyId ? shopifyId.split('/').pop() : null;

        return {
          id: String(r.id),
          title: r.title || 'Untitled Product',
          sku: `EMS-${String(r.id).padStart(4, '0')}`,
          category: r.gender ? `${r.brand || 'EMS'} ${r.gender}` : (r.brand || 'Apparel & Footwear'),
          price: priceNum,
          compare_at_price: comparePriceNum,
          stock: 25,
          status: r.status === 'available' ? 'active' : (r.status || 'active'),
          image: r.main_image_url || null,
          extra_images: extraImages,
          vendor: r.brand || 'EMS Originals',
          description: r.description || `Brand: ${r.brand || '-'} | Color: ${r.color || '-'} | Size: ${r.size_original || r.size || '-'}`,
          tags: [r.brand, r.gender, r.color, 'EMS'].filter(Boolean),
          variantsCount: 1,
          video_url: r.video_url || null,
          voice_note_url: r.voice_note_url || null,
          shopify_product_id: shopifyId,
          shopify_url: numericShopifyId ? `https://${cleanDomain}/admin/products/${numericShopifyId}` : null
        };
      });

      return res.json({ success: true, products });
    } catch (err) {
      console.error('[Products Query Error]', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Memory fallback
  return res.json({ success: true, products: [] });
}

export async function getProductById(req, res) {
  const { id } = req.params;
  const db = getDb();
  const cleanDomain = (process.env.SHOP || 'devsil-store.myshopify.com').replace(/^https?:\/\//, '').replace(/\/$/, '');

  if (db.isLive()) {
    try {
      const [rows] = await db.pool().query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      const r = rows[0];
      const shopifyId = r.shopify_product_id ? String(r.shopify_product_id) : null;
      const numericShopifyId = shopifyId ? shopifyId.split('/').pop() : null;

      return res.json({
        success: true,
        product: {
          id: String(r.id),
          title: r.title,
          brand: r.brand,
          gender: r.gender,
          color: r.color,
          size: r.size_original || r.size,
          starting_price: r.starting_price,
          minimum_price: r.minimum_price,
          description: r.description,
          main_image_url: r.main_image_url,
          extra_image_urls: r.extra_image_urls,
          video_url: r.video_url,
          voice_note_url: r.voice_note_url,
          status: r.status,
          shopify_product_id: shopifyId,
          shopify_url: numericShopifyId ? `https://${cleanDomain}/admin/products/${numericShopifyId}` : null
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(404).json({ success: false, error: 'Product not found' });
}

export async function publishProductToShopifyDirect(req, res) {
  const {
    ems_id,
    title,
    price,
    vendor,
    product_type,
    tags,
    status = 'DRAFT',
    description,
    images = []
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Product title is required' });
  }

  const creds = getDefaultShopifyCredentials();
  const targetStatus = status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT';

  try {
    // 1. Stage images to Google Cloud Storage via Shopify Staged Uploads
    const stagedResourceUrls = [];
    for (const img of images) {
      if (img) {
        const rUrl = await stageAndUploadImage(img, creds);
        if (rUrl) stagedResourceUrls.push(rUrl);
      }
    }

    // 2. Format tags
    let formattedTags = undefined;
    if (Array.isArray(tags)) formattedTags = tags;
    else if (typeof tags === 'string' && tags.trim()) {
      formattedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // 3. Create Product in Shopify via GraphQL
    const createResult = await shopifyGraphql(`
      mutation productCreate($product: ProductCreateInput!) {
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
    `, {
      product: {
        title: title.trim(),
        descriptionHtml: description ? `<p>${description}</p>` : undefined,
        vendor: vendor || 'EMS Originals',
        productType: product_type || 'Footwear & Apparel',
        tags: formattedTags,
        status: targetStatus
      }
    }, creds);

    const userErrors = createResult?.productCreate?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(userErrors.map(e => e.message).join(', '));
    }

    const createdProduct = createResult.productCreate.product;
    const numericShopifyId = createdProduct.id.split('/').pop();
    const adminUrl = `https://${creds.shopDomain}/admin/products/${numericShopifyId}`;

    // 4. Attach staged media
    if (stagedResourceUrls.length > 0) {
      try {
        const mediaInput = stagedResourceUrls.map(url => ({
          originalSource: url,
          mediaContentType: 'IMAGE'
        }));
        await shopifyGraphql(`
          mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
            productCreateMedia(productId: $productId, media: $media) {
              media { id }
              mediaUserErrors { field message }
            }
          }
        `, { productId: createdProduct.id, media: mediaInput }, creds);
      } catch (attachErr) {
        console.warn('[Shopify Media Attach Warning]', attachErr.message);
      }
    }

    // 5. Update Variant Price
    if (price && createdProduct.variants?.nodes?.[0]?.id) {
      try {
        await shopifyGraphql(`
          mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              userErrors { field message }
            }
          }
        `, {
          productId: createdProduct.id,
          variants: [{
            id: createdProduct.variants.nodes[0].id,
            price: String(parseFloat(price).toFixed(2))
          }]
        }, creds);
      } catch (priceErr) {
        console.warn('[Shopify Price Update Warning]', priceErr.message);
      }
    }

    // 6. Publish to Online Store channel if status is ACTIVE
    let publishWarning = null;
    if (targetStatus === 'ACTIVE') {
      const pubRes = await publishProductToOnlineStore(createdProduct.id, creds);
      if (!pubRes.ok) publishWarning = pubRes.warning;
    }

    // 7. Update shopify_product_id in EMS database
    if (ems_id) {
      const db = getDb();
      if (db.isLive()) {
        try {
          await db.pool().query(
            'UPDATE products SET shopify_product_id = ? WHERE id = ?',
            [numericShopifyId, ems_id]
          );
        } catch (dbErr) {
          console.warn('[DB shopify_product_id update warning]', dbErr.message);
        }
      }
    }

    return res.json({
      success: true,
      shopify_product_id: numericShopifyId,
      shopify_gid: createdProduct.id,
      handle: createdProduct.handle,
      status: createdProduct.status,
      admin_url: adminUrl,
      preview_url: createdProduct.onlineStorePreviewUrl || null,
      storefront_url: createdProduct.status === 'ACTIVE' ? createdProduct.onlineStoreUrl : null,
      warning: publishWarning
    });
  } catch (err) {
    console.error('[Shopify Publish Error]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function checkShopifyLink(req, res) {
  const { id } = req.params;
  const creds = getDefaultShopifyCredentials();
  const gid = String(id).startsWith('gid://') ? id : `gid://shopify/Product/${id}`;

  try {
    const data = await shopifyGraphql(`
      query getProductPreview($id: ID!) {
        product(id: $id) {
          id
          title
          status
          onlineStoreUrl
          onlineStorePreviewUrl
        }
      }
    `, { id: gid }, creds);

    if (!data?.product) {
      return res.status(404).json({ success: false, error: 'Product not found on Shopify' });
    }

    const p = data.product;
    const testUrl = p.onlineStoreUrl || p.onlineStorePreviewUrl;
    let isReachable = false;
    let redirectedToPassword = false;
    let statusText = 'Draft / Offline';

    if (testUrl) {
      try {
        const fetchRes = await fetch(testUrl, { method: 'GET', redirect: 'follow' });
        const finalUrl = fetchRes.url || '';
        redirectedToPassword = finalUrl.includes('/password') || fetchRes.status === 401;
        isReachable = fetchRes.ok || redirectedToPassword;
        statusText = redirectedToPassword
          ? '🔒 Development store password protected'
          : fetchRes.ok
          ? '✓ Live HTTP 200 OK'
          : `HTTP ${fetchRes.status}`;
      } catch (e) {
        statusText = `Network check: ${e.message}`;
      }
    }

    return res.json({
      success: true,
      product: p,
      check: {
        reachable: isReachable,
        redirectedToPassword,
        statusText,
        testUrl
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
