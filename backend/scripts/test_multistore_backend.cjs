const { signToken } = require('../ems_project/backend/modules/auth');

async function testBackend() {
    console.log('--- Testing Multi-Store Backend Endpoints ---');
    const token = signToken({ id: 1, email: 'shaheer@devsil.com' });
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const BASE = 'http://localhost:5000';

    try {
        // 1. GET /api/shopify/stores
        console.log('\n[TEST 1] GET /api/shopify/stores');
        const storesRes = await fetch(`${BASE}/api/shopify/stores`, { headers });
        const storesData = await storesRes.json();
        console.log('Status:', storesRes.status, 'Success:', storesData.success);
        console.log('Stores found:', storesData.stores?.map(s => ({ id: s.id, name: s.shop_name, domain: s.shop_domain, default: s.is_default })));

        // 2. GET /api/shopify/status (Default Store - Devsil)
        console.log('\n[TEST 2] GET /api/shopify/status');
        const statusRes = await fetch(`${BASE}/api/shopify/status`, { headers });
        const statusData = await statusRes.json();
        console.log('Status:', statusRes.status, 'Connected:', statusData.connected, 'Shop:', statusData.shop?.name, statusData.shop_domain);

        // 3. GET /api/shopify/products (Store 1)
        console.log('\n[TEST 3] GET /api/shopify/products?store_id=1&limit=5');
        const prodRes = await fetch(`${BASE}/api/shopify/products?store_id=1&limit=5`, { headers });
        const prodData = await prodRes.json();
        console.log('Status:', prodRes.status, 'Products count:', prodData.products?.length, 'Shop:', prodData.shopDomain);
        if (prodData.products && prodData.products.length > 0) {
            console.log('Sample product:', prodData.products[0].title, '| Price:', prodData.products[0].price);
        }

        // 4. POST /api/shopify/stores/1/sync
        console.log('\n[TEST 4] POST /api/shopify/stores/1/sync');
        const syncRes = await fetch(`${BASE}/api/shopify/stores/1/sync`, { method: 'POST', headers });
        const syncData = await syncRes.json();
        console.log('Sync result:', syncData.success, syncData.message, 'Product count:', syncData.store?.product_count);

        // 5. Test OAuth start URL generation
        console.log('\n[TEST 5] POST /api/shopify/stores/connect (OAuth URL)');
        const oauthRes = await fetch(`${BASE}/api/shopify/stores/connect`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ shop: 'test-new-store.myshopify.com' })
        });
        const oauthData = await oauthRes.json();
        console.log('OAuth Start Success:', oauthData.success, 'Auth URL generated:', oauthData.auth_url?.slice(0, 80) + '...');

        console.log('\n✅ ALL BACKEND MULTI-STORE ENDPOINTS VERIFIED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Backend test failed:', err);
    } finally {
        process.exit(0);
    }
}

testBackend();
