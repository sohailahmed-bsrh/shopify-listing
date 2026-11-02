import { shopify } from "../shopify.js";

async function testProductCreateWithStagedMedia() {
  const redPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  
  // 1. Stage upload
  const stagedQuery = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
        userErrors { field message }
      }
    }
  `;
  const stagedRes = await shopify(stagedQuery, {
    input: [{
      resource: 'IMAGE',
      filename: 'smoke-test.png',
      mimeType: 'image/png',
      httpMethod: 'POST',
      fileSize: String(redPng.length)
    }]
  });
  const target = stagedRes.stagedUploadsCreate.stagedTargets[0];

  // 2. Upload blob to Google Cloud Storage
  const formData = new FormData();
  for (const p of target.parameters) {
    formData.append(p.name, p.value);
  }
  const blob = new Blob([redPng], { type: 'image/png' });
  formData.append('file', blob, 'smoke-test.png');
  const uploadRes = await fetch(target.url, { method: 'POST', body: formData });
  console.log('Upload status:', uploadRes.status);

  // 3. Create product with media
  const createQuery = `
    mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product {
          id
          title
          media(first: 5) {
            nodes {
              id
              status
            }
          }
        }
        userErrors { field message }
      }
    }
  `;
  const createRes = await shopify(createQuery, {
    product: {
      title: "PIPELINE TEST - delete me",
      status: "DRAFT"
    },
    media: [
      {
        originalSource: target.resourceUrl,
        mediaContentType: "IMAGE"
      }
    ]
  });
  console.log('Create result:', JSON.stringify(createRes, null, 2));

  // 4. Delete the test product
  const prodId = createRes?.productCreate?.product?.id;
  if (prodId) {
    await shopify(`mutation($input: ProductDeleteInput!) { productDelete(input: $input) { deletedProductId } }`, { input: { id: prodId } });
    console.log('Cleaned up test product:', prodId);
  }
}
testProductCreateWithStagedMedia().catch(e => console.error(e));
