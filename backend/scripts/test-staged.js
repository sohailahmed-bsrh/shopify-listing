import { shopify } from "../shopify.js";

async function testStaged() {
  const query = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  try {
    const res = await shopify(query, {
      input: [
        {
          resource: "IMAGE",
          filename: "test.jpg",
          mimeType: "image/jpeg",
          httpMethod: "POST",
          fileSize: "1000"
        }
      ]
    });
    console.log("STAGED TARGET:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("STAGED ERROR:", err.message);
  }
}
testStaged();
