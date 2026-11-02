const crypto = require('crypto');
const fs = require('fs');

const envContent = fs.readFileSync('ems_project/.env', 'utf8');
const jwtMatch = envContent.match(/JWT_SECRET=(.*)/);
const JWT_SECRET = jwtMatch ? jwtMatch[1].trim() : 'supersecret_jwt_key_123';

function signToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + 3600 })).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

const token = signToken({ id: 1, email: 'shaheer@devsil.com', role: 'admin' });

async function testBackend() {
    console.log('--- 1. Testing GET /api/shopify/automation ---');
    let res = await fetch('http://localhost:5000/api/shopify/automation', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('GET Automation:', await res.json());

    console.log('\n--- 2. Testing POST /api/shopify/automation ---');
    res = await fetch('http://localhost:5000/api/shopify/automation', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
            default_status: 'ACTIVE',
            auto_publish_online_store: 1,
            duplicate_prevention: 1,
            default_vendor: 'Devsil EMS',
            default_stock: 30
        })
    });
    console.log('POST Automation:', await res.json());

    console.log('\n--- 3. Testing POST /api/shopify/sync-catalog ---');
    res = await fetch('http://localhost:5000/api/shopify/sync-catalog', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('POST Sync Catalog:', await res.json());

    console.log('\n--- 4. Testing parse-product-fields with Urdu & English ---');
    const testPhrases = [
        "Nike Air Zoom running shoes brand Nike category Footwear size 42 color Black starting price 5500 minimum price 4500 for men stock 20",
        "Yeh Panther running shoes hain brand Panther color white size 43 price 4500 men footwear bohot comfortable hain",
        "Bata formal leather shoes color brown size 41 price 3500 stock 15"
    ];
    for (const phrase of testPhrases) {
        res = await fetch('http://localhost:5000/api/transcribe/parse-product-fields', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ transcript: phrase })
        });
        const data = await res.json();
        console.log(`\nPhrase: "${phrase}"`);
        console.log('Extracted Fields:', data.fields);
    }
}

testBackend();
