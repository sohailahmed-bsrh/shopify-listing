import {
  ShopifyStore,
  Listing,
  ListingTemplate,
  DashboardStats,
  AiGeneratedProduct
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

export const api = {
  // Stores
  async getStores(): Promise<{ success: boolean; stores: ShopifyStore[] }> {
    const res = await fetch(`${API_BASE}/shopify/stores`);
    return handleResponse(res);
  },

  async addStore(storeData: Partial<ShopifyStore> & { access_token: string }): Promise<{ success: boolean; store: ShopifyStore }> {
    const res = await fetch(`${API_BASE}/shopify/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeData)
    });
    return handleResponse(res);
  },

  async deleteStore(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/shopify/stores/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  async testConnection(data: { shop_domain: string; access_token: string; api_version?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/shopify/stores/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Listings
  async getListings(params?: { search?: string; status?: string; sync_status?: string; limit?: number; offset?: number }): Promise<{ success: boolean; listings: Listing[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.sync_status) query.append('sync_status', params.sync_status);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));

    const res = await fetch(`${API_BASE}/listings?${query.toString()}`);
    return handleResponse(res);
  },

  async getListingById(id: string): Promise<{ success: boolean; listing: Listing }> {
    const res = await fetch(`${API_BASE}/listings/${id}`);
    return handleResponse(res);
  },

  async createListing(listingData: any): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`${API_BASE}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingData)
    });
    return handleResponse(res);
  },

  async updateListing(id: string, listingData: any): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingData)
    });
    return handleResponse(res);
  },

  async deleteListing(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/listings/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  async publishListing(id: string, store_id?: string): Promise<{ success: boolean; shopify_product_id: string; shopify_url: string }> {
    const res = await fetch(`${API_BASE}/listings/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_id })
    });
    return handleResponse(res);
  },

  async bulkPublishListings(listing_ids: string[], store_id?: string): Promise<{ success: boolean; successCount: number; failedCount: number; results: any[] }> {
    const res = await fetch(`${API_BASE}/listings/bulk-publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_ids, store_id })
    });
    return handleResponse(res);
  },

  // AI & Voice
  async generateProductWithAi(prompt: string, category?: string, tone?: string): Promise<{ success: boolean; data: AiGeneratedProduct }> {
    const res = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, category, tone })
    });
    return handleResponse(res);
  },

  async uploadVoiceRecording(audioBlob: Blob, filename = 'voice-memo.webm'): Promise<{ success: boolean; transcript: string; isMockTranscript?: boolean; parsedProduct: any; audioUrl: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, filename);

    const res = await fetch(`${API_BASE}/media/voice`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  },

  // Media
  async uploadMediaFile(file: File): Promise<{ success: boolean; url: string; storageKey: string; isOci: boolean }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  },

  // Templates
  async getTemplates(): Promise<{ success: boolean; templates: ListingTemplate[] }> {
    const res = await fetch(`${API_BASE}/templates`);
    return handleResponse(res);
  },

  async createTemplate(templateData: Partial<ListingTemplate>): Promise<{ success: boolean; template: ListingTemplate }> {
    const res = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData)
    });
    return handleResponse(res);
  },

  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Analytics
  async getDashboardStats(): Promise<{ success: boolean; stats: DashboardStats }> {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    return handleResponse(res);
  }
};
