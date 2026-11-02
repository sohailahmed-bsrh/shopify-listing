import crypto from "crypto";
import { SHOP, getShopInfo } from "./shopify.js";

/**
 * Normalize a Shopify domain or shop identifier:
 * - trim, lowercase
 * - strip leading http:// or https://
 * - strip any path and trailing slash
 * - strip any port
 * @param {string} s
 * @returns {string}
 */
export function normalizeShop(s) {
  if (!s || typeof s !== "string") return "";
  let clean = s.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//i, "");
  clean = clean.split("/")[0];
  clean = clean.split("?")[0];
  clean = clean.split("#")[0];
  clean = clean.split(":")[0];
  return clean.replace(/\/+$/, "").trim();
}

/**
 * Manually parse cookies from request headers (zero dependencies)
 * @param {import('express').Request} req
 * @returns {Record<string, string>}
 */
export function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      try {
        list[name] = decodeURIComponent(val);
      } catch {
        list[name] = val;
      }
    }
  });
  return list;
}

/**
 * Escape HTML characters for safe DOM/HTML rendering
 * @param {string} str
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Render a styled error page in the app theme
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.detail]
 * @param {number} [options.status=400]
 */
export function renderAuthError(res, { title, message, detail, status = 400 }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || "Authentication Error")} - EMS Shopify Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #030712;
      --card-bg: #09090b;
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --red: #ef4444;
      --red-bg: rgba(239, 68, 68, 0.12);
      --text-main: #f4f4f5;
      --text-muted: #a1a1aa;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .error-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 2.25rem 2rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .icon {
      width: 52px;
      height: 52px;
      margin: 0 auto 1.25rem;
      border-radius: 12px;
      background: var(--red-bg);
      border: 1px solid rgba(239, 68, 68, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
    }
    h2 {
      font-size: 1.35rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--text-main);
    }
    p.msg {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .detail {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.775rem;
      color: #71717a;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 0.6rem 0.75rem;
      margin-bottom: 1.5rem;
      word-break: break-word;
      text-align: left;
    }
    .btn-retry {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.8rem 1.25rem;
      background: var(--primary);
      color: white;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: 10px;
      transition: background 0.2s;
    }
    .btn-retry:hover {
      background: var(--primary-hover);
    }
  </style>
</head>
<body>
  <div class="error-card">
    <div class="icon">⚠️</div>
    <h2>${escapeHtml(title || "Sign In Failed")}</h2>
    <p class="msg">${escapeHtml(message || "An authentication error occurred.")}</p>
    ${detail ? `<div class="detail">${escapeHtml(detail)}</div>` : ""}
    <a href="/auth/login" class="btn-retry">Try Again</a>
  </div>
</body>
</html>`;
  return res.status(status).send(html);
}

/**
 * Create a signed ems_session token (valid 7 days)
 * @param {Object} [user]
 * @param {string} [user.email]
 * @param {string} [user.name]
 * @param {number} [days=7]
 * @returns {string}
 */
export function createSessionToken(user = { email: "test@local", name: "Test Staff" }, days = 7) {
  const sessionSecret = (process.env.SESSION_SECRET || "").trim();
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is missing in environment.");
  }
  const payload = {
    email: user.email,
    name: user.name || user.email,
    exp: Date.now() + days * 24 * 3600 * 1000
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", sessionSecret)
    .update(payloadStr)
    .digest("base64url");
  return `${payloadStr}.${sig}`;
}

/**
 * Verify signed ems_session token
 * @param {string} token
 * @returns {{ email: string, name: string } | null}
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadStr, sig] = parts;
  const sessionSecret = (process.env.SESSION_SECRET || "").trim();
  if (!sessionSecret) return null;

  const expectedSig = crypto
    .createHmac("sha256", sessionSecret)
    .update(payloadStr)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8"));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return {
      email: payload.email,
      name: payload.name || payload.email
    };
  } catch {
    return null;
  }
}

/**
 * Express middleware to require staff authentication.
 */
export function requireAuth(req, res, next) {
  const cookies = parseCookies(req);
  const session = verifySessionToken(cookies.ems_session);

  if (!session) {
    if (req.originalUrl.startsWith("/api/")) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }
    return res.redirect("/login.html");
  }

  req.user = session;
  next();
}

/**
 * Register auth routes onto Express app
 * @param {import('express').Express} app
 */
export function registerAuthRoutes(app) {
  const BASE_URL = (process.env.BASE_URL || "http://localhost:4000")
    .replace(/\/+$/, "")
    .trim();
  const isSecure = BASE_URL.startsWith("https");

  // Middleware: Redirect host consistency (127.0.0.1 -> localhost)
  app.use((req, res, next) => {
    const host = req.headers.host || "";
    if (host.startsWith("127.0.0.1")) {
      return res.redirect(`${BASE_URL}${req.originalUrl}`);
    }
    next();
  });

  // 1. Initiate "Login with Shopify"
  app.get("/auth/login", async (req, res) => {
    const state = crypto.randomBytes(16).toString("hex");
    const clientId = (process.env.CLIENT_ID || "").trim();
    const scopes = "read_products,write_products,read_orders,read_publications,write_publications";
    const redirectUri = `${BASE_URL}/auth/callback`;

    // 10 minute httpOnly cookie for CSRF state validation
    res.setHeader("Set-Cookie", [
      `oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}`
    ]);

    // Determine normalized shop to authorize against
    let shopToAuthorize = normalizeShop(process.env.SHOP || "");
    if (!shopToAuthorize.includes(".")) {
      shopToAuthorize = `${shopToAuthorize}.myshopify.com`;
    }

    const authUrl = `https://${shopToAuthorize}/admin/oauth/authorize?client_id=${encodeURIComponent(
      clientId
    )}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${encodeURIComponent(state)}&grant_options[]=per-user`;

    res.redirect(authUrl);
  });

  // 2. OAuth Callback
  app.get("/auth/callback", async (req, res) => {
    const cookies = parseCookies(req);
    const { code, state, shop, hmac } = req.query;

    // (a) State verification
    if (!state || !cookies.oauth_state || state !== cookies.oauth_state) {
      return renderAuthError(res, {
        title: "Session Expired or Host Mismatch",
        message: "Please open the app from http://localhost:4000 and try again.",
        detail: `State mismatch: received '${state || "none"}' vs cookie '${cookies.oauth_state ? "present" : "missing"}'`,
        status: 400
      });
    }

    // (b) Shop domain verification using normalizeShop helper & myshopifyDomain fallback
    const envShopRaw = process.env.SHOP || "";
    const callbackShopRaw = shop || "";

    const normalizedEnvShop = normalizeShop(envShopRaw);
    const normalizedCallbackShop = normalizeShop(callbackShopRaw);

    if (!normalizedCallbackShop) {
      return renderAuthError(res, {
        title: "Missing Shop Parameter",
        message: "Shopify did not return the expected store domain.",
        detail: "The callback query string was missing the 'shop' parameter.",
        status: 400
      });
    }

    // Check direct equality
    let shopMatches = normalizedEnvShop === normalizedCallbackShop;

    // Check without .myshopify.com suffix
    if (!shopMatches) {
      const envPrefix = normalizedEnvShop.replace(/\.myshopify\.com$/, "");
      const callbackPrefix = normalizedCallbackShop.replace(/\.myshopify\.com$/, "");
      if (envPrefix && callbackPrefix && envPrefix === callbackPrefix) {
        shopMatches = true;
      }
    }

    // Fallback: check against store's myshopifyDomain from Shopify API
    let liveMyshopifyDomain = "";
    if (!shopMatches) {
      const shopInfo = await getShopInfo();
      if (shopInfo?.myshopifyDomain) {
        liveMyshopifyDomain = normalizeShop(shopInfo.myshopifyDomain);
        if (
          normalizedCallbackShop === liveMyshopifyDomain ||
          normalizedCallbackShop.replace(/\.myshopify\.com$/, "") ===
            liveMyshopifyDomain.replace(/\.myshopify\.com$/, "")
        ) {
          shopMatches = true;
        }
      }
    }

    if (!shopMatches) {
      return renderAuthError(res, {
        title: "Shop Domain Mismatch",
        message: "The store that authorized this login does not match the configured shop domain.",
        detail: `SHOP from .env: "${normalizedEnvShop || envShopRaw}" | Callback shop: "${normalizedCallbackShop || callbackShopRaw}"${
          liveMyshopifyDomain ? ` | Store myshopifyDomain: "${liveMyshopifyDomain}"` : ""
        }`,
        status: 400
      });
    }

    // (c) HMAC verification - MUST use ORIGINAL raw query params exactly as received
    if (!hmac || typeof hmac !== "string") {
      return renderAuthError(res, {
        title: "Security Verification Failed",
        message: "Missing HMAC security signature from Shopify.",
        detail: "The 'hmac' parameter was not provided in the callback URL.",
        status: 400
      });
    }

    const clientSecret = (process.env.CLIENT_SECRET || "").trim();
    const rawMessage = Object.keys(req.query)
      .filter((k) => k !== "hmac" && k !== "signature")
      .sort()
      .map((k) => `${k}=${req.query[k]}`)
      .join("&");

    const computedHmac = crypto
      .createHmac("sha256", clientSecret)
      .update(rawMessage)
      .digest("hex");

    const compBuf = Buffer.from(computedHmac, "hex");
    const queryBuf = Buffer.from(hmac, "hex");

    if (compBuf.length !== queryBuf.length || !crypto.timingSafeEqual(compBuf, queryBuf)) {
      return renderAuthError(res, {
        title: "Invalid Signature",
        message: "HMAC security verification failed. The request may have been altered.",
        detail: "Calculated HMAC digest did not match query hmac.",
        status: 400
      });
    }

    // (d) Exchange authorization code for online access token to read associated_user
    const shopToExchange = normalizedCallbackShop || normalizedEnvShop;
    let tokenData;
    try {
      const tokenRes = await fetch(`https://${shopToExchange}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: (process.env.CLIENT_ID || "").trim(),
          client_secret: clientSecret,
          code
        })
      });

      tokenData = await tokenRes.json();
    } catch (err) {
      return renderAuthError(res, {
        title: "Shopify Token Exchange Failed",
        message: "Failed to exchange authorization code for staff session.",
        detail: err.message,
        status: 500
      });
    }

    const user = tokenData?.associated_user;
    if (!user || !user.email) {
      const errMsg = tokenData?.error_description || tokenData?.error || "User data not returned by Shopify";
      return renderAuthError(res, {
        title: "Staff Identification Failed",
        message: "Shopify did not return staff user identity.",
        detail: errMsg,
        status: 400
      });
    }

    const email = String(user.email).trim();
    const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || email;

    // (e) Check ALLOWED_EMAILS restriction
    const allowedRaw = (process.env.ALLOWED_EMAILS || "").trim();
    if (allowedRaw) {
      const allowedList = allowedRaw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (!allowedList.includes(email.toLowerCase())) {
        return renderAuthError(res, {
          title: "Access Restricted",
          message: `Your email (${email}) is not authorized to access EMS Shopify Studio.`,
          detail: "Contact an administrator to add your email to ALLOWED_EMAILS.",
          status: 403
        });
      }
    }

    // (f) Issue signed session cookie (7 DAYS expiration)
    const sessionCookie = createSessionToken({ email, name }, 7);

    res.setHeader("Set-Cookie", [
      `ems_session=${sessionCookie}; Path=/; Max-Age=${7 * 24 * 3600}; HttpOnly; SameSite=Lax${
        isSecure ? "; Secure" : ""
      }`,
      `oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
    ]);

    // Always redirect to "/#products" upon successful callback
    res.redirect("/#products");
  });

  // 3. User profile check
  app.get("/auth/me", (req, res) => {
    const cookies = parseCookies(req);
    const session = verifySessionToken(cookies.ems_session);
    if (!session) {
      return res.status(401).json({ error: "Not logged in" });
    }
    res.json({ email: session.email, name: session.name });
  });

  // 4. Logout
  app.all(["/auth/logout", "/logout"], (req, res) => {
    res.setHeader("Set-Cookie", [
      `ems_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      `oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
    ]);
    if (req.method === "POST") {
      res.json({ ok: true });
    } else {
      res.redirect("/login.html");
    }
  });

  // 5. Local Staff Quick Access (development / internal testing)
  app.get("/auth/dev-login", (req, res) => {
    const email = "staff@devsil.com";
    const name = "EMS Staff";
    const sessionCookie = createSessionToken({ email, name }, 7);
    res.setHeader("Set-Cookie", [
      `ems_session=${sessionCookie}; Path=/; Max-Age=${7 * 24 * 3600}; HttpOnly; SameSite=Lax`
    ]);
    res.redirect("/#products");
  });
}
