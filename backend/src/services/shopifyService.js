/**
 * Shopify Admin API Integration Service
 * Handles Store verification, Product publishing, Variant creation, Media syncing, and Inventory.
 */

/**
 * Format and sanitize shop domain (e.g. cleans https://, trailing slashes, ensures .myshopify.com)
 */
export function sanitizeShopDomain(domain) {
  if (!domain) return '';
  let clean = domain.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!clean.includes('.myshopify.com') && !clean.includes('.')) {
    clean = `${clean}.myshopify.com`;
  }
  return clean;
}

/**
 * Make an authenticated request to Shopify Admin REST API
 */
async function shopifyRequest(shopDomain, accessToken, apiVersion, endpoint, method = 'GET', body = null) {
  const cleanDomain = sanitizeShopDomain(shopDomain);
  const version = apiVersion || process.env.SHOPIFY_API_VERSION || '2024-10';
  const url = `https://${cleanDomain}/admin/api/${version}/${endpoint.replace(/^\//, '')}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': accessToken
  };

  const options = {
    method,
    headers
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorBody);
    } catch (e) {
      parsedError = errorBody;
    }
    throw new Error(`Shopify API Error (${response.status}): ${JSON.stringify(parsedError)}`);
  }

  return await response.json();
}

/**
 * Verify Shopify store credentials and fetch shop details
 */
export async function verifyStoreConnection(shopDomain, accessToken, apiVersion = '2024-10') {
  try {
    const data = await shopifyRequest(shopDomain, accessToken, apiVersion, 'shop.json');
    return {
      success: true,
      shop: {
        id: data.shop.id,
        name: data.shop.name,
        email: data.shop.email,
        domain: data.shop.domain,
        myshopify_domain: data.shop.myshopify_domain,
        currency: data.shop.currency,
        plan_name: data.shop.plan_name,
        iana_timezone: data.shop.iana_timezone
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Fetch Custom & Smart Collections from Shopify
 */
export async function getShopifyCollections(shopDomain, accessToken, apiVersion = '2024-10') {
  try {
    const customCollections = await shopifyRequest(shopDomain, accessToken, apiVersion, 'custom_collections.json');
    const smartCollections = await shopifyRequest(shopDomain, accessToken, apiVersion, 'smart_collections.json');

    const collections = [
      ...(customCollections.custom_collections || []).map(c => ({ id: c.id, title: c.title, handle: c.handle, type: 'custom' })),
      ...(smartCollections.smart_collections || []).map(c => ({ id: c.id, title: c.title, handle: c.handle, type: 'smart' }))
    ];

    return { success: true, collections };
  } catch (err) {
    console.warn('[SHOPIFY COLLECTIONS WARNING]', err.message);
    return { success: false, collections: [], error: err.message };
  }
}

/**
 * Create or publish a full product to Shopify
 * @param {Object} store - { shop_domain, access_token, api_version }
 * @param {Object} listing - Product listing data
 * @param {Array} variants - Product variants
 * @param {Array} media - Product images and media URLs
 */
export async function publishProductToShopify(store, listing, variants = [], media = []) {
  const { shop_domain, access_token, api_version } = store;

  // 1. Format Options structure
  const optionsMap = [];
  if (variants && variants.length > 0) {
    const opt1Names = new Set(variants.map(v => v.option1_name).filter(Boolean));
    const opt2Names = new Set(variants.map(v => v.option2_name).filter(Boolean));
    const opt3Names = new Set(variants.map(v => v.option3_name).filter(Boolean));

    if (opt1Names.size > 0) optionsMap.push({ name: Array.from(opt1Names)[0] });
    if (opt2Names.size > 0) optionsMap.push({ name: Array.from(opt2Names)[0] });
    if (opt3Names.size > 0) optionsMap.push({ name: Array.from(opt3Names)[0] });
  }

  // 2. Format Variants payload
  const formattedVariants = (variants && variants.length > 0)
    ? variants.map(v => ({
        option1: v.option1_value || null,
        option2: v.option2_value || null,
        option3: v.option3_value || null,
        price: (Number(v.price) || Number(listing.price) || 0).toFixed(2),
        compare_at_price: v.compare_at_price ? Number(v.compare_at_price).toFixed(2) : null,
        sku: v.sku || null,
        barcode: v.barcode || null,
        inventory_management: 'shopify',
        inventory_quantity: Number(v.inventory_quantity) || 0
      }))
    : [
        {
          price: (Number(listing.price) || 0).toFixed(2),
          compare_at_price: listing.compare_at_price ? Number(listing.compare_at_price).toFixed(2) : null,
          sku: listing.sku || null,
          barcode: listing.barcode || null,
          inventory_management: 'shopify',
          inventory_quantity: Number(listing.inventory_quantity) || 0
        }
      ];

  // 3. Format Media/Images payload
  const formattedImages = (media || [])
    .filter(m => m.url && (m.media_type === 'image' || !m.media_type))
    .map((m, index) => ({
      src: m.url.startsWith('http') ? m.url : `${process.env.OCI_S3_PUBLIC_BASE_URL || ''}${m.url}`,
      alt: m.alt_text || listing.title,
      position: index + 1
    }));

  // 4. Construct Shopify Product Payload
  const productPayload = {
    product: {
      title: listing.title,
      body_html: listing.description_html,
      vendor: listing.vendor || 'EMS',
      product_type: listing.product_type || listing.category || 'General',
      tags: Array.isArray(listing.tags) ? listing.tags.join(', ') : listing.tags,
      status: listing.status === 'active' ? 'active' : 'draft',
      metafields_global_title_tag: listing.seo_title || listing.title,
      metafields_global_description_tag: listing.seo_description || null,
      variants: formattedVariants
    }
  };

  if (optionsMap.length > 0) {
    productPayload.product.options = optionsMap;
  }

  if (formattedImages.length > 0 && formattedImages[0].src.startsWith('http')) {
    productPayload.product.images = formattedImages;
  }

  // 5. Send POST to Shopify
  const result = await shopifyRequest(
    shop_domain,
    access_token,
    api_version,
    'products.json',
    'POST',
    productPayload
  );

  const publishedProduct = result.product;
  const cleanDomain = sanitizeShopDomain(shop_domain);
  const shopifyAdminUrl = `https://${cleanDomain}/admin/products/${publishedProduct.id}`;

  return {
    success: true,
    shopify_product_id: String(publishedProduct.id),
    shopify_handle: publishedProduct.handle,
    shopify_url: shopifyAdminUrl,
    published_product: publishedProduct
  };
}

/**
 * Fetch products from Shopify
 */
export async function getShopifyProducts(shopDomain, accessToken, apiVersion = '2024-10', limit = 50) {
  try {
    const data = await shopifyRequest(shopDomain, accessToken, apiVersion, `products.json?limit=${limit}`);
    return {
      success: true,
      products: data.products || []
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}
