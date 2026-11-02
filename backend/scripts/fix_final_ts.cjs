const fs = require('fs');
const path = require('path');

// 1. Fix api.ts disconnectShopifyStore
const apiPath = path.resolve(__dirname, '../ems_project/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');
apiContent = apiContent.replace(
  'async disconnectShopifyStore(storeId: number',
  'async disconnectShopifyStore(storeId: number | string'
);
fs.writeFileSync(apiPath, apiContent, 'utf8');
console.log('Fixed api.ts disconnectShopifyStore');

// 2. Fix ListingWizardModal.tsx
const wizardPath = path.resolve(__dirname, '../ems_project/frontend/src/components/ListingWizardModal.tsx');
let wizardContent = fs.readFileSync(wizardPath, 'utf8');
wizardContent = wizardContent.replace(
  "setSelectedStoreId(initialData.store_id || (stores[0]?.id ?? ''));",
  "setSelectedStoreId(initialData.store_id || (stores[0]?.id ? String(stores[0].id) : ''));"
);
wizardContent = wizardContent.replace(
  "setSelectedStoreId(stores[0]?.id || '');",
  "setSelectedStoreId(stores[0]?.id ? String(stores[0].id) : '');"
);
fs.writeFileSync(wizardPath, wizardContent, 'utf8');
console.log('Fixed ListingWizardModal.tsx');

// 3. Fix StoreSettingsModal.tsx
const settingsModalPath = path.resolve(__dirname, '../ems_project/frontend/src/components/StoreSettingsModal.tsx');
let settingsModalContent = fs.readFileSync(settingsModalPath, 'utf8');
settingsModalContent = settingsModalContent.replace(
  'onClick={() => handleDeleteStore(store.id)}',
  'onClick={() => handleDeleteStore(String(store.id))}'
);
fs.writeFileSync(settingsModalPath, settingsModalContent, 'utf8');
console.log('Fixed StoreSettingsModal.tsx');
