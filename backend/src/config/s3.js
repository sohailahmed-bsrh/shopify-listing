import { S3Client } from '@aws-sdk/client-s3';

let s3Client = null;

export function getS3Client() {
  if (s3Client) return s3Client;

  const accessKeyId = process.env.OCI_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.OCI_S3_SECRET_ACCESS_KEY;
  const region = process.env.OCI_S3_REGION || 'us-ashburn-1';
  const endpoint = process.env.OCI_S3_ENDPOINT;

  if (accessKeyId && secretAccessKey && endpoint) {
    s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      forcePathStyle: true // Recommended for Oracle Cloud S3 compatibility
    });
    console.log('[S3] Oracle Cloud Object Storage client initialized with endpoint:', endpoint);
  } else {
    console.log('[S3 INFO] OCI credentials not fully configured in .env. Using local media storage fallback.');
  }

  return s3Client;
}

export function isS3Configured() {
  return Boolean(
    process.env.OCI_S3_ACCESS_KEY_ID &&
    process.env.OCI_S3_SECRET_ACCESS_KEY &&
    process.env.OCI_S3_ENDPOINT &&
    process.env.OCI_S3_BUCKET_NAME
  );
}
