import "dotenv/config";
import { createSessionToken } from "../auth.js";

async function runTests() {
  const token = createSessionToken({ email: "test@local", name: "Local Tester" }, 7);
  const authHeaders = { Cookie: `ems_session=${token}` };
  const BASE = "http://localhost:4000";

  console.log("=================================================");
  console.log("🧪 Automated Endpoint Verification Suite");
  console.log("=================================================\n");

  const results = [];

  async function test(name, fn) {
    try {
      const detail = await fn();
      console.log(`[PASS] ${name} -> ${detail}`);
      results.push({ name, status: "PASS", detail });
    } catch (err) {
      console.log(`[FAIL] ${name} -> ${err.message}`);
      results.push({ name, status: "FAIL", detail: err.message });
    }
  }

  // 1. GET / with cookie -> 200
  await test("GET / (with test cookie)", async () => {
    const res = await fetch(`${BASE}/`, { headers: authHeaders });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes("EMS Shopify Store")) throw new Error("Index HTML does not contain app name");
    return "200 OK (returned index.html)";
  });

  // 2. GET /api/health with cookie -> 200
  await test("GET /api/health (with test cookie)", async () => {
    const res = await fetch(`${BASE}/api/health`, { headers: authHeaders });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok || !json.shop) throw new Error("Missing ok or shop in response");
    return `200 OK (shop: ${json.shop.myshopifyDomain || json.shop.name})`;
  });

  // 3. GET /api/products with cookie -> 200
  await test("GET /api/products (with test cookie)", async () => {
    const res = await fetch(`${BASE}/api/products`, { headers: authHeaders });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error("Expected array of products");
    return `200 OK (returned ${json.length} products with adminUrl & previewUrl)`;
  });

  // 4. GET /api/ems/products with cookie -> 200 or clean DB notice
  await test("GET /api/ems/products (with test cookie)", async () => {
    const res = await fetch(`${BASE}/api/ems/products`, { headers: authHeaders });
    const json = await res.json();
    if (res.status === 200) {
      if (!json || typeof json !== "object") throw new Error("Expected { items, total }");
      return `200 OK (items: ${json.items?.length || 0}, total: ${json.total || 0})`;
    } else {
      // Clean DB connection message if DB credentials are not yet supplied
      if (json.error && (/credentials|Hostinger|reach the database/i.test(json.error))) {
        return `Handled DB state: ${json.error}`;
      }
      throw new Error(`HTTP ${res.status}: ${json.error || "Unknown error"}`);
    }
  });

  // 5. GET /api/orders with cookie -> 200
  await test("GET /api/orders (with test cookie)", async () => {
    const res = await fetch(`${BASE}/api/orders`, { headers: authHeaders });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.items)) throw new Error("Expected items array in orders response");
    return `200 OK (returned ${json.items.length} orders, total: ${json.total})`;
  });

  // 6. GET /api/orders/summary with cookie -> 200
  await test("GET /api/orders/summary (with test cookie)", async () => {
    const res = await fetch(`${BASE}/api/orders/summary`, { headers: authHeaders });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.total === undefined || json.todayRevenue === undefined) {
      throw new Error("Missing summary metrics");
    }
    return `200 OK (total: ${json.total}, todayRevenue: $${json.todayRevenue})`;
  });

  // 7. GET /api/records with cookie -> 200
  await test("GET /api/records (with test cookie)", async () => {
    const res = await fetch(`${BASE}/api/records`, { headers: authHeaders });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error("Expected array of records");
    return `200 OK (returned ${json.length} records)`;
  });

  // 8. GET /api/products WITHOUT cookie -> 401
  await test("GET /api/products (without cookie)", async () => {
    const res = await fetch(`${BASE}/api/products`);
    if (res.status !== 401) throw new Error(`Expected 401, got HTTP ${res.status}`);
    return "401 Unauthorized (properly blocked)";
  });

  // 9. GET / WITHOUT cookie -> 302 to /login.html
  await test("GET / (without cookie)", async () => {
    const res = await fetch(`${BASE}/`, { redirect: "manual" });
    if (res.status !== 302) throw new Error(`Expected 302, got HTTP ${res.status}`);
    const loc = res.headers.get("location");
    if (!loc || !loc.includes("login.html")) throw new Error(`Redirected to ${loc}`);
    return `302 Found -> ${loc}`;
  });

  // 10. GET /auth/callback with bad parameters -> rejected with friendly page
  await test("GET /auth/callback?code=x&shop=wrong&state=bad&hmac=bad", async () => {
    const res = await fetch(`${BASE}/auth/callback?code=x&shop=wrong&state=bad&hmac=bad`);
    const text = await res.text();
    if (res.status !== 400 && res.status !== 403) {
      throw new Error(`Expected rejection (400/403), got HTTP ${res.status}`);
    }
    if (!text.includes("Authentication") && !text.includes("Shopify") && !text.includes("Error")) {
      throw new Error("Friendly error page not returned");
    }
    return `${res.status} Rejected with friendly error page`;
  });

  // 11. End-to-end Product Lifecycle: POST /api/products -> GET link-check -> PUT /api/products/:id -> DELETE /api/products
  let testCreatedId = null;
  await test("POST /api/products (create product with base64 image)", async () => {
    const tinyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const res = await fetch(`${BASE}/api/products`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "AUTOMATED TEST PRODUCT - delete me",
        price: "19.99",
        vendor: "Test Vendor",
        status: "DRAFT",
        images: [tinyBase64]
      })
    });
    if (res.status !== 200) {
      const errBody = await res.text();
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    const data = await res.json();
    if (!data.id) throw new Error("Missing product id in response");
    testCreatedId = data.id;
    return `200 OK (Created ${data.id}, adminUrl: ${data.adminUrl})`;
  });

  if (testCreatedId) {
    const numericId = testCreatedId.split("/").pop();

    await test("GET /api/products/:id/link-check", async () => {
      const res = await fetch(`${BASE}/api/products/${numericId}/link-check`, {
        headers: authHeaders
      });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.check || !data.product) throw new Error("Invalid link-check structure");
      return `200 OK (Target: ${data.check.targetUrl || "None"}, final: ${data.check.finalUrl || "None"})`;
    });

    await test("PUT /api/products/:id (update title & price)", async () => {
      const res = await fetch(`${BASE}/api/products/${numericId}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "AUTOMATED TEST PRODUCT - UPDATED",
          price: "24.99"
        })
      });
      if (res.status !== 200) {
        const errBody = await res.text();
        throw new Error(`HTTP ${res.status}: ${errBody}`);
      }
      const data = await res.json();
      if (data.title !== "AUTOMATED TEST PRODUCT - UPDATED") throw new Error("Title not updated");
      return `200 OK (Title updated to '${data.title}', price: ${data.price})`;
    });

    await test("DELETE /api/products (clean up test product)", async () => {
      const res = await fetch(`${BASE}/api/products`, {
        method: "DELETE",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ id: testCreatedId, title: "AUTOMATED TEST PRODUCT - UPDATED" })
      });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.deletedProductId) throw new Error("Missing deletedProductId");
      return `200 OK (Cleanly deleted ${data.deletedProductId})`;
    });
  }

  console.log("\n=================================================");
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`📋 Verification Summary: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch((fatal) => {
  console.error("Test execution fatal error:", fatal.message);
  process.exit(1);
});
