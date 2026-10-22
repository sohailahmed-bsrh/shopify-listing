# Shopify Listing Automation (EMS Module)

An ultra-sleek, AI-driven Shopify Listing Automation module built for the **E-commerce Management System (EMS)**.

---

## 🛠️ Architecture & Technology Stack

* **Frontend:**
  - **Framework:** React 19 + Vite + TypeScript
  - **Styling:** Tailwind CSS (v4) with EMS Dark Mode (`#030712`, `#09090b`, indigo-500, emerald-500)
  - **Icons:** `lucide-react`
  - **Charts & Media:** `recharts`, native Web Audio API / MediaRecorder
* **Backend:**
  - **Runtime:** Node.js + Express (ES Modules)
  - **Database:** MySQL (`mysql2/promise` with Connection Pooling & auto-migrations)
  - **Media Storage:** Oracle Cloud Object Storage (S3-Compatible API via `@aws-sdk/client-s3`)
  - **AI / LLMs:** Google Gemini (1.5 Flash) & OpenAI Whisper (Speech-to-Text)
* **Deployment:** Hostinger VPS via PM2 / Node.js

---

## 🚀 Key Features

1. **AI Auto-Listing Generator (Google Gemini):**
   - High-converting product titles & bullet points
   - Rich HTML descriptions with specifications, care instructions, and warranty
   - SEO Title & Meta Description with live Google SERP preview
   - Suggested variant matrices and pricing
2. **Voice-to-Listing (OpenAI Whisper + Gemini):**
   - Record voice memos directly from desktop or mobile browser
   - Live pulsating audio waveform visualizer
   - Whisper transcribes audio notes; Gemini parses into structured listing fields
3. **Media Studio (Oracle Cloud Object Storage):**
   - Drag-and-drop image and video uploader
   - Primary thumbnail selector and reordering
   - Auto-tagging and alt-text generation
4. **Variants & Options Matrix:**
   - Cartesian combination generator (Size, Color, Material)
   - Individual SKU, Barcode, Selling Price, Compare-At Price, Cost, and Stock Quantity
5. **Shopify Publishing Engine:**
   - Direct publish via Shopify Admin REST API
   - Multi-store connection management
   - Direct link to view published products in Shopify Admin

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Set the following variables:
* `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (MySQL Database)
* `GEMINI_API_KEY` (Google Gemini AI)
* `OPENAI_API_KEY` (OpenAI Whisper Audio STT)
* `OCI_S3_ACCESS_KEY_ID`, `OCI_S3_SECRET_ACCESS_KEY`, `OCI_S3_ENDPOINT`, `OCI_S3_BUCKET_NAME` (Oracle Cloud Object Storage)
* `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_ACCESS_TOKEN` (Default Shopify store)

---

## ⚠️ Critical Build Workflow (MUST FOLLOW)

The live Express server serves the compiled React production bundle from `backend/public/`.

Before pushing any changes to Git or deploying to the Hostinger VPS:

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```
   *(This automatically compiles and outputs the bundle into `../backend/public` as configured in `vite.config.ts`).*

2. **Verify that `backend/public/assets/` has been updated.**

3. **Commit both frontend source and compiled assets:**
   ```bash
   git add .
   git commit -m "feat: updated listing automation module"
   git push origin main
   ```

---

## 💻 Local Development

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Start Servers
```bash
# Terminal 1: Backend API (port 5000)
cd backend
npm run dev

# Terminal 2: Frontend Dev Server (port 3000)
cd frontend
npm run dev
```

### 3. Production Run (Hostinger VPS)
```bash
cd backend
node src/index.js
# Or via PM2:
pm2 start src/index.js --name "shopify-listing-automation"
```
