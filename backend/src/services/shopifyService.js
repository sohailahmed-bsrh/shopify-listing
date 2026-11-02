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

let cachedToken = { token: null, expiresAt: 0 };

/**
 * Resolve or retrieve valid Shopify Admin API access token.
 * Supports Dev Dashboard Client Credentials flow (exchanging CLIENT_ID & CLIENT_SECRET for access token).
 */
export async function getShopifyAccessToken(shopDomain, customToken) {
  if (customToken && !customToken.startsWith('shpss_')) {
    return customToken;
  }
  if (cachedToken.token && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = (process.env.CLIENT_ID || '').trim();
  const clientSecret = (customToken || process.env.CLIENT_SECRET || process.env.SHOPIFY_ACCESS_TOKEN || '').trim();
  const domain = sanitizeShopDomain(shopDomain || process.env.SHOP || 'devsil-store.myshopify.com');

  if (!domain || !clientId || !clientSecret) {
    if (customToken) return customToken;
    throw new Error('Missing required Shopify credentials (SHOP, CLIENT_ID, or CLIENT_SECRET).');
  }

  const tokenUrl = `https://${domain}/admin/oauth/access_token`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  const responseText = await res.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Shopify OAuth token error: ${responseText}`);
  }

  if (!data || !data.access_token) {
    throw new Error(`Shopify OAuth token error: ${data?.error_description || data?.errors || JSON.stringify(data)}`);
  }

  const ttlSec = Number(data.expires_in) ? Number(data.expires_in) - 300 : 23 * 3600;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(ttlSec * 1000, 60000)
  };
  return cachedToken.token;
}

/**
 * Make an authenticated request to Shopify Admin REST API
 */
async function shopifyRequest(shopDomain, accessToken, apiVersion, endpoint, method = 'GET', body = null) {
  const cleanDomain = sanitizeShopDomain(shopDomain);
  const token = await getShopifyAccessToken(cleanDomain, accessToken);
  const version = apiVersion || process.env.SHOPIFY_API_VERSION || '2024-10';
  const url = `https://${cleanDomain}/admin/api/${version}/${endpoint.replace(/^\//, '')}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': token
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
    const creds = getDefaultShopifyCredentials(shopDomain, accessToken, apiVersion);
    const data = await shopifyRequest(creds.shopDomain, creds.accessToken, creds.apiVersion, `products.json?limit=${limit}`);
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

/**
 * Get active default credentials from environment or store
 */
export function getDefaultShopifyCredentials(shopDomain, accessToken, apiVersion) {
  const domain = sanitizeShopDomain(shopDomain || process.env.SHOP || process.env.SHOPIFY_SHOP_DOMAIN || 'devsil-store.myshopify.com');
  const token = accessToken || process.env.CLIENT_SECRET || process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_CLIENT_SECRET;
  const version = apiVersion || process.env.API_VERSION || process.env.SHOPIFY_API_VERSION || '2024-10';
  return { shopDomain: domain, accessToken: token, apiVersion: version };
}

/**
 * Execute Shopify Admin GraphQL Query / Mutation
 */
export async function shopifyGraphql(query, variables = {}, customCreds = null) {
  const creds = customCreds || getDefaultShopifyCredentials();
  const token = await getShopifyAccessToken(creds.shopDomain, creds.accessToken);
  const url = `https://${creds.shopDomain}/admin/api/${creds.apiVersion}/graphql.json`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify GraphQL HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Shopify GraphQL error: ${json.errors.map(e => e.message).join(', ')}`);
  }
  return json.data;
}

/**
 * Stage an image to Shopify Google Cloud Storage bucket
 */
export async function stageAndUploadImage(imageUrl, customCreds = null) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  try {
    // 1. Fetch source image
    let buffer, contentType, filename;
    if (imageUrl.startsWith('data:image/')) {
      const parts = imageUrl.split(',');
      const match = parts[0].match(/data:(.*?);base64/);
      contentType = match ? match[1] : 'image/jpeg';
      buffer = Buffer.from(parts[1], 'base64');
      const ext = contentType.includes('png') ? 'png' : 'jpg';
      filename = `upload_${Date.now()}.${ext}`;
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const resp = await fetch(imageUrl);
      if (!resp.ok) throw new Error(`Could not fetch image: HTTP ${resp.status}`);
      contentType = resp.headers.get('content-type') || 'image/jpeg';
      buffer = Buffer.from(await resp.arrayBuffer());
      const ext = contentType.includes('png') ? 'png' : 'jpg';
      filename = `remote_${Date.now()}.${ext}`;
    } else {
      return null;
    }

    // 2. Request staged upload target from Shopify
    const stageData = await shopifyGraphql(`
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters { name value }
          }
          userErrors { field message }
        }
      }
    `, {
      input: [{
        filename,
        mimeType: contentType,
        resource: 'IMAGE',
        httpMethod: 'POST'
      }]
    }, customCreds);

    const target = stageData?.stagedUploadsCreate?.stagedTargets?.[0];
    if (!target) return null;

    // 3. Post to Google Cloud Storage
    const formData = new FormData();
    for (const p of target.parameters) {
      formData.append(p.name, p.value);
    }
    const blob = new Blob([buffer], { type: contentType });
    formData.append('file', blob, filename);

    const uploadRes = await fetch(target.url, { method: 'POST', body: formData });
    if (!uploadRes.ok) return null;

    return target.resourceUrl;
  } catch (err) {
    console.warn('[Shopify Media Staging Warning]', err.message);
    return null;
  }
}

/**
 * Publish product to Online Store sales channel
 */
export async function publishProductToOnlineStore(productId, customCreds = null) {
  try {
    const gid = String(productId).startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`;
    const pubData = await shopifyGraphql(`{
      publications(first: 20) {
        nodes { id name }
      }
    }`, {}, customCreds);

    const pub = pubData?.publications?.nodes?.find(
      p => /online\s*store/i.test(p.name) || /web/i.test(p.name)
    );
    if (!pub) return { ok: false, warning: 'Online Store sales channel not found' };

    const publishResult = await shopifyGraphql(`
      mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          publishable { availablePublicationsCount }
          userErrors { field message }
        }
      }
    `, {
      id: gid,
      input: [{ publicationId: pub.id }]
    }, customCreds);

    const userErrors = publishResult?.publishablePublish?.userErrors || [];
    if (userErrors.length > 0) {
      return { ok: false, warning: userErrors.map(e => e.message).join(', ') };
    }
    return { ok: true, channel: pub.name };
  } catch (err) {
    return { ok: false, warning: err.message };
  }
}

