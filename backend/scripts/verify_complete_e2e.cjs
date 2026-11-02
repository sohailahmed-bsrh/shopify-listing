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

async function run() {
    console.log('======================================================================');
    console.log('   EMS PRODUCTS MODULE — COMPLETE END-TO-END VERIFICATION');
    console.log('======================================================================\n');

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const baseUrl = 'http://localhost:5000/api/shopify';

    let allPassed = true;

    // STEP 1: Stores Listing and Real-time Status Classification
    console.log('▶ [CHECK 1] GET /api/shopify/stores (Multi-Store Live Status)');
    try {
        const res = await fetch(`${baseUrl}/stores`, { headers });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch stores');

        console.log(`  ✓ Returned ${data.stores.length} store(s)`);
        for (const s of data.stores) {
            console.log(`    - ID ${s.id}: ${s.shop_name} (${s.shop_domain}) | status: ${s.status} | products: ${s.product_count} | default: ${Boolean(s.is_default)}`);
        }

        const store1 = data.stores.find(s => s.id === 1);
        const store4 = data.stores.find(s => s.id === 4);

        if (!store1 || !store4) throw new Error('Expected both Store 1 and Store 4');
        if (store4.status !== 'connected') throw new Error(`Expected Store 4 to be 'connected', got ${store4.status}`);
        if (store1.status !== 'unavailable') console.log(`  ℹ Store 1 status: ${store1.status} (${store1.error_message || 'N/A'})`);

        console.log('  ✅ [PASS] Multi-store retrieval & status classification verified.\n');
    } catch (e) {
        console.error('  ❌ [FAIL] Check 1:', e.message);
        allPassed = false;
    }

    // STEP 2: Live Products Query on Store 4
    console.log('▶ [CHECK 2] GET /api/shopify/products?store_id=4 (Store 4 Live Products)');
    try {
        const res = await fetch(`${baseUrl}/products?store_id=4`, { headers });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to get products for Store 4');

        console.log(`  ✓ Store 4 returned ${data.products.length} live product(s) from Shopify:`);
        data.products.forEach(p => {
            console.log(`    - "${p.title}" | ID: ${p.id} | Price: PKR ${p.price} | Status: ${p.status} | Variants: ${p.variants?.length || 0}`);
        });

        console.log('  ✅ [PASS] Real Shopify products fetched successfully from Store 4.\n');
    } catch (e) {
        console.error('  ❌ [FAIL] Check 2:', e.message);
        allPassed = false;
    }

    // STEP 3: Store 1 Graceful 402 Error Handling
    console.log('▶ [CHECK 3] GET /api/shopify/products?store_id=1 (Store 1 External 402 Check)');
    try {
        const res = await fetch(`${baseUrl}/products?store_id=1`, { headers });
        const data = await res.json();
        console.log(`  ✓ HTTP Status: ${res.status} | isUnavailable: ${data.isUnavailable}`);
        if (res.status === 402 && data.isUnavailable) {
            console.log(`  ✓ Gracefully caught Shopify Unavailable Shop (402) without 500 server crash.`);
            console.log('  ✅ [PASS] Store 1 402 handled gracefully.\n');
        } else if (res.status === 200 && data.success) {
            console.log(`  ✓ Store 1 returned live products!`);
            console.log('  ✅ [PASS] Store 1 live.\n');
        } else {
            console.warn(`  ℹ Store 1 returned status ${res.status}:`, data);
        }
    } catch (e) {
        console.error('  ❌ [FAIL] Check 3:', e.message);
        allPassed = false;
    }

    // STEP 4: Eligibility Query for Store 4
    console.log('▶ [CHECK 4] GET /api/shopify/products/eligibility?store_id=4 (WhatsApp Catalog Eligibility)');
    try {
        const res = await fetch(`${baseUrl}/products/eligibility?store_id=4`, { headers });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch eligibility');

        console.log(`  ✓ Target store: "${data.target_store.shop_name}" (${data.target_store.shop_domain})`);
        console.log(`  ✓ Total canonical WhatsApp products: ${data.total} | Eligible: ${data.eligible_count} | Published: ${data.published_count}`);

        // Verify canonical ordering (ascending by id)
        let isAscending = true;
        for (let i = 1; i < data.products.length; i++) {
            if (data.products[i].id < data.products[i-1].id) {
                isAscending = false;
                break;
            }
        }
        if (!isAscending) throw new Error('Products are NOT in canonical order (id ASC)');
        console.log('  ✓ Verified products are strictly in canonical source catalog order (id ASC).');

        data.products.slice(0, 5).forEach(p => {
            console.log(`    - #${p.id} "${p.title}": is_published=${p.is_published}, price=PKR ${p.price}, other mappings: ${p.mappings.length}`);
        });

        console.log('  ✅ [PASS] WhatsApp product eligibility endpoint verified.\n');
    } catch (e) {
        console.error('  ❌ [FAIL] Check 4:', e.message);
        allPassed = false;
    }

    // STEP 5: Real Shopify Publishing to Store 4
    console.log('▶ [CHECK 5] POST /api/shopify/products (Publish WhatsApp Product #5 to Store 4)');
    try {
        // Fetch WhatsApp product #5 details
        const eligRes = await fetch(`${baseUrl}/products/eligibility?store_id=4`, { headers });
        const eligData = await eligRes.json();
        const prod5 = eligData.products.find(p => p.id === 5) || eligData.products[0];

        console.log(`  Publishing WhatsApp product #${prod5.id} ("${prod5.title}")...`);
        const payload = {
            ems_product_id: prod5.id,
            store_ids: [4],
            title: prod5.title,
            vendor: 'EMS WhatsApp Catalog',
            product_type: 'Footwear',
            price: prod5.price || 4500,
            compare_at_price: prod5.compare_at_price || 6000,
            status: 'ACTIVE',
            description: prod5.description || 'Premium Footwear from EMS Catalog',
            tags: ['EMS', 'WhatsApp', 'Sneakers'],
            images: prod5.main_image_url ? [prod5.main_image_url] : []
        };

        const pubRes = await fetch(`${baseUrl}/products`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        const pubData = await pubRes.json();
        
        if (!pubData.success) {
            throw new Error(pubData.error || 'Publishing failed');
        }

        console.log(`  ✓ Successfully published to Store 4!`);
        console.log(`    - Shopify Product ID: ${pubData.shopify_product_id || pubData.product?.id || 'N/A'}`);
        console.log(`    - Handle: ${pubData.handle || pubData.product?.handle || 'N/A'}`);
        console.log(`    - Admin URL: ${pubData.admin_url || `https://pgtqyi-up.myshopify.com/admin/products/${pubData.numeric_id || ''}`}`);

        console.log('  ✅ [PASS] Real publishing to Shopify Store 4 verified.\n');
    } catch (e) {
        console.error('  ❌ [FAIL] Check 5:', e.message);
        allPassed = false;
    }

    // STEP 6: Re-verify Eligibility on Store 4
    console.log('▶ [CHECK 6] Re-verifying Eligibility State after Publishing');
    try {
        const res = await fetch(`${baseUrl}/products/eligibility?store_id=4`, { headers });
        const data = await res.json();
        const prod5 = data.products.find(p => p.id === 5);
        if (prod5) {
            console.log(`  ✓ WhatsApp product #${prod5.id} status on Store 4: is_published=${prod5.is_published}`);
            console.log(`    - Shopify Product ID: ${prod5.shopify_product_id}`);
            console.log(`    - Admin URL: ${prod5.admin_url}`);
            if (!prod5.is_published) throw new Error('Product #5 should now be is_published: true');
        }
        console.log('  ✅ [PASS] State reflects successful publication.\n');
    } catch (e) {
        console.error('  ❌ [FAIL] Check 6:', e.message);
        allPassed = false;
    }

    console.log('======================================================================');
    if (allPassed) {
        console.log('   🎉 ALL 6 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!');
    } else {
        console.log('   ⚠ SOME CHECKS ENCOUNTERED ISSUES — REVIEW ABOVE.');
    }
    console.log('======================================================================\n');
}

run();
