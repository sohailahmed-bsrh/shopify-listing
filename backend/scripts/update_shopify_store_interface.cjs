const fs = require('fs');
const path = require('path');

const typesPath = path.resolve(__dirname, '../ems_project/frontend/src/types/index.ts');
let content = fs.readFileSync(typesPath, 'utf8');

const oldDefinition = `export interface ShopifyStore {
  id: string;
  name: string;
  shop_domain: string;
  api_version: string;
  currency: string;
  is_default: number | boolean;
  is_active: number | boolean;
  created_at?: string;
}`;

const newDefinition = `export interface ShopifyStore {
  id: string | number;
  name?: string;
  shop_name?: string;
  shop_domain: string;
  api_version?: string;
  currency?: string;
  iana_timezone?: string;
  is_default: number | boolean;
  is_active?: number | boolean;
  status?: 'connected' | 'disconnected' | 'error' | string;
  product_count?: number;
  order_count?: number;
  last_synced_at?: string | null;
  scopes?: string;
  created_at?: string;
  updated_at?: string;
}`;

if (content.includes(oldDefinition)) {
  content = content.replace(oldDefinition, newDefinition);
  fs.writeFileSync(typesPath, content, 'utf8');
  console.log('Successfully updated ShopifyStore interface');
} else {
  // Try CRLF
  const oldDefCRLF = oldDefinition.replace(/\n/g, '\r\n');
  const newDefCRLF = newDefinition.replace(/\n/g, '\r\n');
  if (content.includes(oldDefCRLF)) {
    content = content.replace(oldDefCRLF, newDefCRLF);
    fs.writeFileSync(typesPath, content, 'utf8');
    console.log('Successfully updated ShopifyStore interface (CRLF)');
  } else {
    console.error('Could not find oldDefinition in types/index.ts');
  }
}
