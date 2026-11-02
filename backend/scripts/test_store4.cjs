const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_123';

function signToken(payload) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url');
  const s = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${b}`).digest('base64url');
  return `${h}.${b}.${s}`;
}

const token = signToken({ id: 1, email: 'shaheer@devsil.com', role: 'admin' });

async function testStore4() {
  const res = await fetch('http://localhost:5000/api/shopify/products?store_id=4', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Store 4 products HTTP status:', res.status);
  console.log('Store 4 response:', JSON.stringify(data, null, 2));
}

testStore4();
