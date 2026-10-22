export interface ShopifyStore {
  id: string;
  name: string;
  shop_domain: string;
  api_version: string;
  currency: string;
  is_default: number | boolean;
  is_active: number | boolean;
  created_at?: string;
}

export interface ListingVariant {
  id?: string;
  listing_id?: string;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  option3_name?: string;
  option3_value?: string;
  price: number | string;
  compare_at_price?: number | string | null;
  cost_per_item?: number | string | null;
  sku?: string;
  barcode?: string;
  inventory_quantity: number;
  shopify_variant_id?: string;
}

export interface ListingMedia {
  id?: string;
  listing_id?: string;
  media_type: 'image' | 'video' | 'audio';
  url: string;
  oci_storage_key?: string;
  alt_text?: string;
  position?: number;
}

export interface Listing {
  id: string;
  store_id?: string | null;
  store_name?: string;
  title: string;
  description_html: string;
  vendor: string;
  product_type: string;
  category: string;
  tags: string;
  status: 'draft' | 'active' | 'archived';
  sync_status: 'draft' | 'pending' | 'synced' | 'failed';
  shopify_product_id?: string | null;
  shopify_handle?: string | null;
  shopify_url?: string | null;
  price: number;
  compare_at_price?: number | null;
  cost_per_item?: number | null;
  sku?: string;
  barcode?: string;
  inventory_quantity: number;
  seo_title?: string;
  seo_description?: string;
  ai_generated?: boolean;
  voice_memo_url?: string | null;
  voice_transcript?: string | null;
  error_message?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at?: string;
  variants?: ListingVariant[];
  media?: ListingMedia[];
  variant_count?: number;
  thumbnail_url?: string;
}

export interface ListingTemplate {
  id: string;
  name: string;
  description_template: string;
  default_vendor: string;
  default_tags: string;
  policy_snippet: string;
  size_chart_html: string;
}

export interface DashboardStats {
  total_listings: number;
  synced_listings: number;
  draft_listings: number;
  failed_listings: number;
  total_stores: number;
  syncRate: number;
  categoryDistribution: { category: string; count: number }[];
  recentListings: Listing[];
}

export interface AiGeneratedProduct {
  title: string;
  seo_title: string;
  seo_description: string;
  product_type: string;
  category: string;
  tags: string[];
  bullet_points: string[];
  description_html: string;
  suggested_price: number;
  suggested_compare_at_price?: number;
  suggested_variants?: Array<{
    option1: string;
    option2?: string;
    sku_suffix?: string;
    price: number;
  }>;
}
