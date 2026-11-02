const fs = require('fs');

let envContent = fs.readFileSync('c:/Users/BILAL.COM/Desktop/Ecomerce-Management-System/.env', 'utf8');
const shopMatch = envContent.match(/SHOPIFY_STORE_URL=(.+)/);
const tokenMatch = envContent.match(/SHOPIFY_ACCESS_TOKEN=(.+)/);
const SHOP = shopMatch ? shopMatch[1].trim() : 'devsil-store.myshopify.com';
const TOKEN = tokenMatch ? tokenMatch[1].trim() : '';

async function checkShopifyProduct() {
  const query = `
    query {
      products(first: 5) {
        nodes {
          id
          title
          featuredImage { url }
          images(first: 10) { nodes { id url } }
          media(first: 10) {
            nodes {
              mediaContentType
              status
              ... on MediaImage { image { url } }
              ... on Video { id status sources { url } }
            }
          }
        }
      }
    }
  `;
  const res = await fetch('https://' + SHOP + '/admin/api/2024-10/graphql.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
checkShopifyProduct();
