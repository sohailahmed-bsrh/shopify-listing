const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_123';

function signToken(payload, expiresInSeconds = 30 * 24 * 3600) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const body = Buffer.from(JSON.stringify({
        ...payload,
        iat: now,
        exp: now + expiresInSeconds
    })).toString('base64url');

    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');

    return `${header}.${body}.${signature}`;
}

const token = signToken({ id: 1, email: 'shaheer@devsil.com', role: 'admin' });

async function runTests() {
  console.log('====================================================');
  console.log('   EMS PRODUCTS MODULE — E2E VERIFICATION SUITE     ');
  console.log('====================================================\n');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const baseUrl = 'http://localhost:5000/api/shopify';

  // TEST 1: GET STORES & VERIFY LIVE SHOPIFY SYNC
  console.log('▶ [TEST 1] Verifying Connected Shopify Stores...');
  try {
    const res = await fetch(`${baseUrl}/stores`, { headers });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch stores');
    
    console.log(`  ✓ Successfully retrieved ${data.stores.length} connected stores.`);
    data.stores.forEach(s => {
      console.log(`    - Store ID ${s.id}: "${s.shop_name}" (${s.shop_domain}) | Product Count: ${s.product_count} | Default: ${s.is_default ? 'YES' : 'NO'}`);
      if (!s.shop_domain.includes('.myshopify.com')) {
        throw new Error(`Invalid shop domain for store ${s.id}: ${s.shop_domain}`);
      }
    });

    const store1 = data.stores.find(s => s.id === 1);
    const store4 = data.stores.find(s => s.id === 4);
    if (!store1 || !store4) {
      throw new Error('Expected both Store 1 (Devsil) and Store 4 to be connected!');
    }
  } catch (e) {
    console.error('  ✗ TEST 1 FAILED:', e.message);
    process.exit(1);
  }

  // TEST 2: GET PRODUCTS FOR STORE 1 (DEVSIL STORE)
  console.log('\n▶ [TEST 2] Verifying Live Products on Store 1 (devsil-store)...');
  try {
    const res = await fetch(`${baseUrl}/products?store_id=1`, { headers });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch Store 1 products');

    console.log(`  ✓ Store 1 returned ${data.products.length} live Shopify products.`);
    data.products.forEach(p => {
      console.log(`    - Product: "${p.title}" | ID: ${p.id} | Status: ${p.status} | Price: Rs ${p.price} | Variants: ${p.variants?.length || 0}`);
    });
  } catch (e) {
    console.error('  ✗ TEST 2 FAILED:', e.message);
    process.exit(1);
  }

  // TEST 3: GET PRODUCTS FOR STORE 4
  console.log('\n▶ [TEST 3] Verifying Live Products on Store 4 (pgtqyi-up)...');
  try {
    const res = await fetch(`${baseUrl}/products?store_id=4`, { headers });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch Store 4 products');

    console.log(`  ✓ Store 4 returned ${data.products.length} live Shopify products.`);
    data.products.forEach(p => {
      console.log(`    - Product: "${p.title}" | ID: ${p.id} | Status: ${p.status} | Price: Rs ${p.price} | Variants: ${p.variants?.length || 0}`);
    });
  } catch (e) {
    console.error('  ✗ TEST 3 FAILED:', e.message);
    process.exit(1);
  }

  // TEST 4: VERIFY ELIGIBILITY ENDPOINT FOR STORE 1
  console.log('\n▶ [TEST 4] Verifying Eligibility Endpoint for Store 1...');
  try {
    const res = await fetch(`${baseUrl}/products/eligibility?store_id=1`, { headers });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch eligibility');

    console.log(`  ✓ Target store: "${data.target_store.shop_name}" (${data.target_store.shop_domain})`);
    console.log(`  ✓ Total canonical WhatsApp products: ${data.total} | Eligible: ${data.eligible_count} | Published: ${data.published_count}`);
    
    data.products.forEach(p => {
      console.log(`    - Product #${p.id} "${p.title}": is_published=${p.is_published}, shopify_product_id=${p.shopify_product_id}`);
    });
  } catch (e) {
    console.error('  ✗ TEST 4 FAILED:', e.message);
    process.exit(1);
  }

  // TEST 5: VERIFY ELIGIBILITY ENDPOINT FOR STORE 4
  console.log('\n▶ [TEST 5] Verifying Eligibility Endpoint for Store 4...');
  try {
    const res = await fetch(`${baseUrl}/products/eligibility?store_id=4`, { headers });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch eligibility');

    console.log(`  ✓ Target store: "${data.target_store.shop_name}" (${data.target_store.shop_domain})`);
    console.log(`  ✓ Total canonical WhatsApp products: ${data.total} | Eligible: ${data.eligible_count} | Published: ${data.published_count}`);
    
    data.products.forEach(p => {
      console.log(`    - Product #${p.id} "${p.title}": is_published=${p.is_published}, shopify_product_id=${p.shopify_product_id}`);
    });
  } catch (e) {
    console.error('  ✗ TEST 5 FAILED:', e.message);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('   🎉 ALL INTEGRATION VERIFICATION TESTS PASSED!    ');
  console.log('====================================================\n');
  process.exit(0);
}

runTests();
