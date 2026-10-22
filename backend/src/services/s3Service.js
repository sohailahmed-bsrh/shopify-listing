import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, isS3Configured } from '../config/s3.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Upload a media buffer or file to OCI Object Storage or local storage fallback
 * @param {Object} file - Multer file object or { buffer, originalname, mimetype }
 * @param {string} folder - 'images' | 'videos' | 'voice-notes'
 * @returns {Promise<{ url: string, storageKey: string, isOci: boolean }>}
 */
export async function uploadMedia(file, folder = 'images') {
  const fileExt = path.extname(file.originalname || '') || '.bin';
  const fileName = `${folder}/${Date.now()}-${uuidv4()}${fileExt}`;

  if (isS3Configured()) {
    try {
      const s3 = getS3Client();
      const bucket = process.env.OCI_S3_BUCKET_NAME;

      const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
      if (!fileBuffer) {
        throw new Error('No file buffer or path provided for upload');
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: file.mimetype || 'application/octet-stream'
      });

      await s3.send(command);

      // Clean up temporary local file if created by multer diskStorage
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }

      // Format OCI public or S3 URL
      let url = '';
      if (process.env.OCI_S3_PUBLIC_BASE_URL) {
        url = `${process.env.OCI_S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${fileName}`;
      } else {
        const endpoint = process.env.OCI_S3_ENDPOINT.replace(/\/$/, '');
        url = `${endpoint}/${bucket}/${fileName}`;
      }

      console.log(`[S3] Successfully uploaded to Oracle Object Storage: ${url}`);
      return { url, storageKey: fileName, isOci: true };
    } catch (err) {
      console.error('[S3 UPLOAD ERROR] Failed uploading to OCI S3, falling back to local storage:', err.message);
    }
  }

  // Local Storage Fallback
  const targetSubdir = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(targetSubdir)) {
    fs.mkdirSync(targetSubdir, { recursive: true });
  }

  const localFilename = `${Date.now()}-${uuidv4()}${fileExt}`;
  const localFilePath = path.join(targetSubdir, localFilename);

  if (file.buffer) {
    fs.writeFileSync(localFilePath, file.buffer);
  } else if (file.path) {
    fs.copyFileSync(file.path, localFilePath);
    try { fs.unlinkSync(file.path); } catch (e) {}
  }

  const relativeUrl = `/uploads/${folder}/${localFilename}`;
  return {
    url: relativeUrl,
    storageKey: `${folder}/${localFilename}`,
    isOci: false
  };
}

/**
 * Delete an object from OCI S3 or local disk
 */
export async function deleteMedia(storageKey) {
  if (isS3Configured() && storageKey) {
    try {
      const s3 = getS3Client();
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.OCI_S3_BUCKET_NAME,
        Key: storageKey
      }));
      return true;
    } catch (err) {
      console.warn('[S3 DELETE WARNING]', err.message);
    }
  }

  // Local delete
  try {
    const localPath = path.join(UPLOAD_DIR, storageKey);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    return true;
  } catch (err) {
    console.warn('[LOCAL DELETE WARNING]', err.message);
    return false;
  }
}
