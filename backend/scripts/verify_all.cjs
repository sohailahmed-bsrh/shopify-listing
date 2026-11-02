const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

// Read env for JWT_SECRET if needed
let JWT_SECRET = 'supersecret_jwt_key_123';
try {
  const envContent = fs.readFileSync('c:/Users/BILAL.COM/Desktop/Ecomerce-Management-System/.env', 'utf8');
  const match = envContent.match(/JWT_SECRET=(.+)/);
  if (match) JWT_SECRET = match[1].trim();
} catch (e) {}

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

const authToken = signToken({ id: 1, email: 'shaheer@devsil.com', role: 'admin' });

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      ...(options.headers || {})
    };
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING EMS INTEGRATION TESTS (AUTHENTICATED) ===');

  // Test 1: Shopify Store Status
  console.log('\n[TEST 1] Checking /api/shopify/status ...');
  try {
    const res1 = await request('/api/shopify/status');
    console.log('Status code:', res1.status);
    console.log('Shopify status response:', JSON.stringify(res1.body, null, 2));
  } catch (e) {
    console.error('Test 1 failed:', e.message);
  }

  // Test 2: Fetch Products from Shopify
  console.log('\n[TEST 2] Checking /api/shopify/products ...');
  try {
    const res2 = await request('/api/shopify/products?limit=5');
    console.log('Status code:', res2.status);
    if (res2.body && res2.body.products) {
      console.log(`Success! Fetched ${res2.body.products.length} products from Shopify.`);
      if (res2.body.products.length > 0) {
        console.log('Sample product:', {
          id: res2.body.products[0].id,
          title: res2.body.products[0].title,
          price: res2.body.products[0].price,
          status: res2.body.products[0].status
        });
      }
    } else {
      console.log('Response:', res2.body);
    }
  } catch (e) {
    console.error('Test 2 failed:', e.message);
  }

  // Test 3: Fetch Orders from Shopify
  console.log('\n[TEST 3] Checking /api/shopify/orders ...');
  try {
    const res3 = await request('/api/shopify/orders?limit=5');
    console.log('Status code:', res3.status);
    if (res3.body && res3.body.orders) {
      console.log(`Success! Fetched ${res3.body.orders.length} orders from Shopify.`);
    } else {
      console.log('Response:', res3.body);
    }
  } catch (e) {
    console.error('Test 3 failed:', e.message);
  }

  // Test 4: Roman Urdu Transcript Field Parsing
  console.log('\n[TEST 4] Checking /api/transcribe/parse-product-fields ...');
  try {
    const res4 = await request('/api/transcribe/parse-product-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        transcript: 'Ye Nike Air Max shoes hain size 42 black color mein. Starting price 7500 aur final minimum 6000 hai. Bohat zabardast condition hai.'
      }
    });
    console.log('Status code:', res4.status);
    console.log('Parsed fields:', JSON.stringify(res4.body, null, 2));
  } catch (e) {
    console.error('Test 4 failed:', e.message);
  }

  // Test 5: Media Upload route
  console.log('\n[TEST 5] Checking /api/media/upload and /api/upload ...');
  let uploadedUrl = null;
  try {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuf = Buffer.from(pngBase64, 'base64');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    const postData = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`),
      pngBuf,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const res5 = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/media/upload',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': postData.length
        }
      }, (res) => {
        let d = '';
        res.on('data', chunk => d += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(d) });
          } catch (e) {
            resolve({ status: res.statusCode, body: d });
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('Status code:', res5.status);
    console.log('Upload response:', res5.body);
    uploadedUrl = res5.body?.url;
  } catch (e) {
    console.error('Test 5 failed:', e.message);
  }

  // Test 6: Create Product on Shopify
  console.log('\n[TEST 6] Creating test product on Shopify via POST /api/shopify/products ...');
  try {
    const testProdPayload = {
      title: 'EMS Auto Test Shoe - ' + Date.now(),
      description: 'Created by EMS automated verification suite',
      vendor: 'EMS Store',
      product_type: 'Footwear / Shoes',
      tags: 'test, ems, shoes',
      status: 'DRAFT',
      variants: [
        {
          price: '4500.00',
          compare_at_price: '5500.00',
          inventory_quantity: 15,
          option1: 'Black',
          option2: '42'
        }
      ],
      colors: ['Black'],
      sizes: ['42'],
      images: uploadedUrl ? [uploadedUrl] : []
    };

    const res6 = await request('/api/shopify/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: testProdPayload
    });

    console.log('Status code:', res6.status);
    console.log('Create product result:', {
      success: res6.body.success,
      product: res6.body.product ? {
        id: res6.body.product.id,
        numeric_id: res6.body.product.numeric_id,
        title: res6.body.product.title,
        status: res6.body.product.status
      } : null,
      error: res6.body.error
    });

    if (res6.body.success && res6.body.product) {
      const createdId = res6.body.product.numeric_id || (res6.body.product.id ? res6.body.product.id.split('/').pop() : null);

      // Test 7: Update Product
      console.log('\n[TEST 7] Testing update product PUT /api/shopify/products/:id ...');
      const updatePayload = {
        title: res6.body.product.title + ' (Verified)',
        price: '4800.00'
      };
      const res7 = await request(`/api/shopify/products/${createdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: updatePayload
      });
      console.log('Update Status code:', res7.status);
      console.log('Update result:', { success: res7.body.success, title: res7.body.product?.title });

      // Test 8: Clean up test product from Shopify
      console.log('\n[TEST 8] Cleaning up test product from Shopify (DELETE) ...');
      const res8 = await request(`/api/shopify/products/${createdId}`, {
        method: 'DELETE'
      });
      console.log('Delete Status code:', res8.status);
      console.log('Delete result:', res8.body);
    }
  } catch (e) {
    console.error('Test 6-8 failed:', e.message);
  }

  console.log('\n=== ALL TESTS COMPLETED ===');
}

runTests();
