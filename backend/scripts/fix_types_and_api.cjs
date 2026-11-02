const fs = require('fs');
const path = require('path');

// 1. Fix src/types/index.ts
const typesPath = path.resolve(__dirname, '../ems_project/frontend/src/types/index.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');

// Replace top ShopifyStore definition with unified one
const unifiedStoreInterface = `export interface ShopifyStore {
  id: number | string;
  shop_domain: string;
  shop_name?: string;
  name?: string;
  is_default: number | boolean;
  status?: 'connected' | 'disconnected' | 'error' | string;
  currency?: string;
  iana_timezone?: string;
  api_version?: string;
  is_active?: number | boolean;
  product_count?: number;
  order_count?: number;
  last_synced_at?: string | null;
  scopes?: string;
  created_at?: string;
  updated_at?: string;
}`;

typesContent = typesContent.replace(/export interface ShopifyStore \{[\s\S]*?\n\}/, unifiedStoreInterface);

// Remove the second duplicate declaration of ShopifyStore
typesContent = typesContent.replace(/export interface ShopifyStore \{[\s\S]*?\n\}\n\nexport interface ShopifyRealProduct/, 'export interface ShopifyRealProduct');

fs.writeFileSync(typesPath, typesContent, 'utf8');
console.log('Fixed src/types/index.ts');

// 2. Fix src/services/api.ts
const apiPath = path.resolve(__dirname, '../ems_project/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

// Ensure deleteShopifyProduct is single and supports storeId
apiContent = apiContent.replace(
  /\/\/ Delete product from Shopify store and delink from EMS database[\s\S]*?async deleteShopifyProduct\(id: string \| number\)[\s\S]*?return handleResponse\(res\);\s*\},\s*\n/,
  ''
);

// Update storeId type in api signatures
apiContent = apiContent.replace(/storeId\?: number/g, 'storeId?: number | string');
apiContent = apiContent.replace(/setDefaultShopifyStore\(storeId: number\)/g, 'setDefaultShopifyStore(storeId: number | string)');
apiContent = apiContent.replace(/syncShopifyStore\(storeId: number\)/g, 'syncShopifyStore(storeId: number | string)');
apiContent = apiContent.replace(/disconnectShopifyStore\(storeId: number\)/g, 'disconnectShopifyStore(storeId: number | string)');

fs.writeFileSync(apiPath, apiContent, 'utf8');
console.log('Fixed src/services/api.ts');

// 3. Fix src/components/ShopifyProductsView.tsx
const viewPath = path.resolve(__dirname, '../ems_project/frontend/src/components/ShopifyProductsView.tsx');
let viewContent = fs.readFileSync(viewPath, 'utf8');

// Update state types to number | string | null
viewContent = viewContent.replace(/const \[syncingStoreId, setSyncingStoreId\] = useState<number \| null>\(null\);/g, 'const [syncingStoreId, setSyncingStoreId] = useState<number | string | null>(null);');
viewContent = viewContent.replace(/const \[settingDefaultId, setSettingDefaultId\] = useState<number \| null>\(null\);/g, 'const [settingDefaultId, setSettingDefaultId] = useState<number | string | null>(null);');
viewContent = viewContent.replace(/const \[openStoreMenuId, setOpenStoreMenuId\] = useState<number \| null>\(null\);/g, 'const [openStoreMenuId, setOpenStoreMenuId] = useState<number | string | null>(null);');

// Update fetchStores and fetchProducts parameter types
viewContent = viewContent.replace(/const fetchStores = useCallback\(async \(selectId\?: number\)/g, 'const fetchStores = useCallback(async (selectId?: number | string)');
viewContent = viewContent.replace(/queryStr\?: string, storeId\?: number\)/g, 'queryStr?: string, storeId?: number | string)');
viewContent = viewContent.replace(/const fetchOrders = useCallback\(async \(cursor\?: string, storeId\?: number\)/g, 'const fetchOrders = useCallback(async (cursor?: string, storeId?: number | string)');

// Safe comparisons for IDs
viewContent = viewContent.replace(/res\.stores\.find\(s => s\.id === selectId\)/g, 'res.stores.find(s => String(s.id) === String(selectId))');
viewContent = viewContent.replace(/res\.stores\.find\(s => s\.id === selectedStore\.id\)/g, 'res.stores.find(s => String(s.id) === String(selectedStore.id))');

fs.writeFileSync(viewPath, viewContent, 'utf8');
console.log('Fixed src/components/ShopifyProductsView.tsx');
