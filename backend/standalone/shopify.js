import "dotenv/config";

const rawShop = process.env.SHOP || "";
export const SHOP = rawShop.replace(/^https?:\/\//i, "").replace(/\/+$/, "").trim();
export const API_VERSION = (process.env.API_VERSION || "2026-04").trim();

let cachedToken = { token: null, expiresAt: 0 };

/**
 * Obtain Shopify Admin API access token using Dev Dashboard Client Credentials flow.
 * Caches token until shortly before expiration (expires_in - 300s or fallback 23h).
 * Never prints or leaks secrets on error.
 */
export async function getToken() {
  if (cachedToken.token && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = (process.env.CLIENT_ID || "").trim();
  const clientSecret = (process.env.CLIENT_SECRET || "").trim();

  if (!SHOP || !clientId || !clientSecret) {
    throw new Error("Missing required Shopify credentials (SHOP, CLIENT_ID, or CLIENT_SECRET) in environment.");
  }

  const tokenUrl = `https://${SHOP}/admin/oauth/access_token`;

  let response;
  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      })
    });
  } catch (netErr) {
    throw new Error(`Failed to reach Shopify OAuth endpoint: ${netErr.message}`);
  }

  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    // Shopify returned HTML error page (e.g. 400 Oauth error application_cannot_be_found)
    const oauthMatch = responseText.match(/Oauth error [^<\r\n]+/i);
    if (oauthMatch) {
      throw new Error(`Shopify token error: ${oauthMatch[0].trim()}`);
    }
    const titleMatch = responseText.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : `HTTP ${response.status}`;
    throw new Error(`Shopify token error: ${title}`);
  }

  if (!data || !data.access_token) {
    const errorMsg = data?.error_description || data?.errors || data?.error || JSON.stringify(data);
    throw new Error(`Shopify token error: ${errorMsg}`);
  }

  const ttlSec = Number(data.expires_in) ? Number(data.expires_in) - 300 : 23 * 3600;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(ttlSec * 1000, 60000)
  };

  return cachedToken.token;
}

/**
 * Execute GraphQL Admin API query or mutation against Shopify
 * @param {string} query
 * @param {Object} [variables={}]
 */
export async function shopify(query, variables = {}) {
  const token = await getToken();
  const endpoint = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    const messages = Array.isArray(json.errors)
      ? json.errors.map((e) => e.message || JSON.stringify(e)).join("; ")
      : JSON.stringify(json.errors);
    throw new Error(`Shopify GraphQL error: ${messages}`);
  }

  return json.data;
}

/**
 * Publish product to the "Online Store" sales channel publication.
 * Gracefully handles missing scopes or missing Online Store publication.
 * @param {string} productId
 * @returns {Promise<{ ok: boolean, warning?: string }>}
 */
export async function publishToOnlineStore(productId) {
  try {
    const pubData = await shopify(`
      query {
        publications(first: 10) {
          nodes { id name }
        }
      }
    `);

    const onlineStore = pubData?.publications?.nodes?.find(
      (p) => p.name && p.name.toLowerCase() === "online store"
    );

    if (!onlineStore) {
      return { ok: false, warning: "Could not find 'Online Store' publication channel" };
    }

    const pubResult = await shopify(
      `
      mutation($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          userErrors { field message }
        }
      }
    `,
      {
        id: productId,
        input: [{ publicationId: onlineStore.id }]
      }
    );

    const userErrors = pubResult?.publishablePublish?.userErrors || [];
    if (userErrors.length > 0) {
      return {
        ok: false,
        warning: `Could not publish to Online Store: ${userErrors.map((e) => e.message).join(", ")}`
      };
    }

    return { ok: true };
  } catch (err) {
    // If scope is missing (e.g. read_publications/write_publications), do not fail request
    return { ok: false, warning: "Created but could not publish to Online Store" };
  }
}

let cachedShopInfo = null;

/**
 * Fetch and cache shop details including myshopifyDomain
 */
export async function getShopInfo() {
  if (cachedShopInfo) return cachedShopInfo;
  try {
    const data = await shopify(`{ shop { name myshopifyDomain } }`);
    if (data?.shop) {
      cachedShopInfo = data.shop;
    }
    return cachedShopInfo;
  } catch (err) {
    return null;
  }
}

