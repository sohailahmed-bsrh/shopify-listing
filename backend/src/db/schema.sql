-- ========================================================
-- Shopify Listing Automation Schema for MySQL
-- E-commerce Management System (EMS)
-- ========================================================

CREATE TABLE IF NOT EXISTS shopify_stores (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  shop_domain VARCHAR(255) NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  api_version VARCHAR(50) DEFAULT '2024-10',
  currency VARCHAR(10) DEFAULT 'USD',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
  id VARCHAR(36) PRIMARY KEY,
  store_id VARCHAR(36) NULL,
  title VARCHAR(500) NOT NULL,
  description_html LONGTEXT,
  vendor VARCHAR(255) DEFAULT '',
  product_type VARCHAR(255) DEFAULT '',
  category VARCHAR(255) DEFAULT '',
  tags TEXT,
  status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
  sync_status ENUM('draft', 'pending', 'synced', 'failed') DEFAULT 'draft',
  shopify_product_id VARCHAR(100) NULL,
  shopify_handle VARCHAR(255) NULL,
  shopify_url TEXT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  compare_at_price DECIMAL(10,2) NULL,
  cost_per_item DECIMAL(10,2) NULL,
  sku VARCHAR(100) NULL,
  barcode VARCHAR(100) NULL,
  inventory_quantity INT DEFAULT 0,
  seo_title VARCHAR(255) NULL,
  seo_description TEXT NULL,
  ai_generated BOOLEAN DEFAULT FALSE,
  voice_memo_url TEXT NULL,
  voice_transcript TEXT NULL,
  error_message TEXT NULL,
  last_synced_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_store (store_id),
  INDEX idx_sync_status (sync_status),
  INDEX idx_created (created_at)
);

CREATE TABLE IF NOT EXISTS listing_variants (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  option1_name VARCHAR(100) DEFAULT 'Title',
  option1_value VARCHAR(100) DEFAULT 'Default Title',
  option2_name VARCHAR(100) NULL,
  option2_value VARCHAR(100) NULL,
  option3_name VARCHAR(100) NULL,
  option3_value VARCHAR(100) NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  compare_at_price DECIMAL(10,2) NULL,
  cost_per_item DECIMAL(10,2) NULL,
  sku VARCHAR(100) NULL,
  barcode VARCHAR(100) NULL,
  inventory_quantity INT DEFAULT 0,
  shopify_variant_id VARCHAR(100) NULL,
  image_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_listing (listing_id)
);

CREATE TABLE IF NOT EXISTS listing_media (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  media_type ENUM('image', 'video', 'audio') DEFAULT 'image',
  url TEXT NOT NULL,
  oci_storage_key VARCHAR(500) NULL,
  alt_text VARCHAR(255) NULL,
  position INT DEFAULT 0,
  shopify_media_id VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_media_listing (listing_id)
);

CREATE TABLE IF NOT EXISTS listing_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description_template LONGTEXT NULL,
  default_vendor VARCHAR(255) NULL,
  default_tags TEXT NULL,
  policy_snippet TEXT NULL,
  size_chart_html TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36) NULL,
  details TEXT NULL,
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_created (created_at)
);
