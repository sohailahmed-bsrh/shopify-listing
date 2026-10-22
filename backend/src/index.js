import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Determine file & directory names for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory or backend directory
const rootEnvPath = path.resolve(__dirname, '../../.env');
const backendEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config(); // fallback to default
}

import { initDbPool } from './config/db.js';
import shopifyRoutes from './routes/shopifyRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import templateRoutes from './routes/templateRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve local media uploads fallback
const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Shopify Listing Automation (EMS)',
    version: '1.0.0'
  });
});

// API Routes (All prefixed under /api/...)
app.use('/api/shopify', shopifyRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);

// Static frontend serving from backend/public/
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Client-side routing catch-all
app.use((req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>EMS - Shopify Listing Automation</title></head>
        <body style="background:#030712; color:#f4f4f5; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
          <div style="text-align:center; max-width:600px; padding:2rem; background:#09090b; border:1px solid rgba(255,255,255,0.1); border-radius:1rem;">
            <h1 style="color:#6366f1;">Shopify Listing Automation Backend</h1>
            <p style="color:#a1a1aa;">The API server is running successfully on port ${PORT}.</p>
            <p style="font-size:0.9rem; color:#71717a;">Frontend build not found in <code>backend/public/</code>. Run <code>npm run build</code> in <code>/frontend</code> to compile the client application.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// Start server and initialize MySQL connection pool
async function startServer() {
  await initDbPool();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 EMS Shopify Listing Automation Server`);
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`📦 Serving static bundle from: ${publicDir}`);
    console.log(`=======================================================`);
  });
}

startServer();
