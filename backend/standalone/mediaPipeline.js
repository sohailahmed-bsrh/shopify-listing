import { shopify } from "./shopify.js";
import path from "path";

const PRIVATE_IP_REGEX = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|0\.0\.0\.0|::1)/i;

/**
 * Validates if a target host is safe from SSRF attacks.
 */
function isSafeHost(hostname) {
  if (!hostname) return false;
  const emsBase = process.env.EMS_IMAGE_BASE_URL || "";
  try {
    if (emsBase) {
      const allowedHost = new URL(emsBase).hostname.toLowerCase();
      if (hostname.toLowerCase() === allowedHost) return true;
    }
  } catch {}

  return !PRIVATE_IP_REGEX.test(hostname);
}

/**
 * Downloads image bytes from an HTTP/HTTPS URL with strict safety guards.
 * Follows up to 3 redirects, enforces 15s timeout, 10MB max size, and image/* Content-Type.
 */
export async function downloadImageBytes(imageUrl, { maxBytes = 10 * 1024 * 1024, timeoutMs = 15000 } = {}) {
  let currentUrl = imageUrl.trim();
  let redirects = 0;

  while (redirects <= 3) {
    let parsedUrl;
    try {
      parsedUrl = new URL(currentUrl);
    } catch {
      throw new Error(`Invalid image URL: ${currentUrl}`);
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error(`Invalid protocol '${parsedUrl.protocol}'. Only http/https supported.`);
    }

    if (!isSafeHost(parsedUrl.hostname)) {
      throw new Error(`Security Violation: Target host '${parsedUrl.hostname}' is restricted.`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res;
    try {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual"
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      if (fetchErr.name === "AbortError") {
        throw new Error(`Image download timed out after ${timeoutMs}ms.`);
      }
      throw new Error(`Image download failed: ${fetchErr.message}`);
    }
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect response missing Location header.");
      currentUrl = new URL(location, currentUrl).toString();
      redirects++;
      continue;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch image: HTTP ${res.status} ${res.statusText}`);
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase().split(";")[0].trim();
    if (!contentType.startsWith("image/")) {
      throw new Error(`Invalid Content-Type '${contentType}'. Expected image/*`);
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      throw new Error(`Image size (${arrayBuffer.byteLength} bytes) exceeds limit of ${maxBytes} bytes.`);
    }

    const buffer = Buffer.from(arrayBuffer);
    const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    let baseName = path.basename(parsedUrl.pathname) || `image_${Date.now()}.${ext}`;
    if (!baseName.includes(".")) baseName += `.${ext}`;

    return {
      buffer,
      mimeType: contentType,
      filename: baseName
    };
  }

  throw new Error("Too many redirects while downloading image.");
}

/**
 * Parses a Data URI base64 image into bytes, mimeType and generated filename.
 */
export function parseBase64Image(dataUri) {
  const match = dataUri.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid base64 Data URI format.");
  }

  const mimeType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const filename = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

  return { buffer, mimeType, filename };
}

/**
 * Stages an image with Shopify and uploads bytes directly to Google Cloud Storage.
 * Returns the resourceUrl to use in productCreate or productCreateMedia.
 */
export async function stageAndUploadImage({ buffer, mimeType, filename }) {
  const stagedMutation = `
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

  const stagedRes = await shopify(stagedMutation, {
    input: [
      {
        resource: "IMAGE",
        filename: filename || "image.jpg",
        mimeType: mimeType || "image/jpeg",
        httpMethod: "POST",
        fileSize: String(buffer.length)
      }
    ]
  });

  const userErrors = stagedRes?.stagedUploadsCreate?.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(`stagedUploadsCreate failed: ${userErrors.map((e) => e.message).join(", ")}`);
  }

  const target = stagedRes?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target || !target.url || !target.resourceUrl) {
    throw new Error("Shopify did not return a valid staged upload target.");
  }

  // Multi-part POST with target parameters first, file blob last
  const formData = new FormData();
  for (const p of target.parameters) {
    formData.append(p.name, p.value);
  }
  const blob = new Blob([buffer], { type: mimeType });
  formData.append("file", blob, filename || "image.jpg");

  const uploadRes = await fetch(target.url, {
    method: "POST",
    body: formData
  });

  if (!uploadRes.ok && uploadRes.status !== 201) {
    const errorText = await uploadRes.text();
    throw new Error(`Staged upload to storage failed with HTTP ${uploadRes.status}: ${errorText.slice(0, 200)}`);
  }

  return target.resourceUrl;
}

/**
 * Process any image source (Data URI base64, external URL, or raw bytes).
 * Stages and uploads, returning ready resourceUrl.
 */
export async function processImageSource(imageSource) {
  if (!imageSource) return null;

  if (typeof imageSource === "object" && Buffer.isBuffer(imageSource.buffer)) {
    return await stageAndUploadImage(imageSource);
  }

  if (typeof imageSource === "string") {
    const trimmed = imageSource.trim();
    if (trimmed.startsWith("data:image/")) {
      const parsed = parseBase64Image(trimmed);
      return await stageAndUploadImage(parsed);
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const downloaded = await downloadImageBytes(trimmed);
      return await stageAndUploadImage(downloaded);
    }
  }

  throw new Error("Unsupported image source. Must be a base64 Data URI, HTTP/HTTPS URL, or buffer object.");
}

/**
 * Creates media attachments on a product and polls until READY status.
 */
export async function attachMediaToProduct(productId, resourceUrls = []) {
  if (!resourceUrls || resourceUrls.length === 0) return [];

  const mediaInput = resourceUrls.map((rUrl) => ({
    originalSource: rUrl,
    mediaContentType: "IMAGE"
  }));

  const createMediaMutation = `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          id
          status
          mediaContentType
        }
        mediaUserErrors {
          field
          message
        }
      }
    }
  `;

  const res = await shopify(createMediaMutation, {
    productId,
    media: mediaInput
  });

  const errors = res?.productCreateMedia?.mediaUserErrors || [];
  if (errors.length > 0) {
    console.warn(`[Media Pipeline] Warning attaching media to ${productId}:`, errors.map((e) => e.message).join(", "));
  }

  return res?.productCreateMedia?.media || [];
}

/**
 * Polls media status until READY or timeout (runs in background).
 */
export async function pollProductMediaUntilReady(productId, maxWaitMs = 30000) {
  const startTime = Date.now();
  const query = `
    query getProductMedia($id: ID!) {
      product(id: $id) {
        media(first: 20) {
          nodes {
            id
            status
            ... on MediaImage {
              image { url }
            }
          }
        }
      }
    }
  `;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const data = await shopify(query, { id: productId });
      const nodes = data?.product?.media?.nodes || [];
      if (nodes.length === 0) return nodes;

      const allDone = nodes.every((n) => n.status === "READY" || n.status === "FAILED");
      if (allDone) {
        return nodes;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return [];
}
