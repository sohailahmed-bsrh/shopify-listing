const fs = require('fs');
const path = require('path');

// 1. Update shopify.js to automatically lookup existing store client_id and secret
const shopifyApiPath = path.resolve(__dirname, '../ems_project/backend/modules/api/shopify.js');
let shopifyApiContent = fs.readFileSync(shopifyApiPath, 'utf8');

const targetBlock = `        // Path B: Real Shopify OAuth Redirect Flow
        const appClientId = (client_id || process.env.CLIENT_ID || process.env.SHOPIFY_CLIENT_ID || '').trim();
        const appClientSecret = (client_secret || process.env.CLIENT_SECRET || process.env.SHOPIFY_CLIENT_SECRET || '').trim();`;

const replacementBlock = `        // Path B: Real Shopify OAuth Redirect Flow
        let appClientId = client_id;
        let appClientSecret = client_secret;

        if (!appClientId || !appClientSecret) {
            try {
                const [existingStores] = await db.query('SELECT client_id, client_secret FROM shopify_stores WHERE shop_domain = ? LIMIT 1', [cleanDomain]);
                if (existingStores.length > 0 && existingStores[0].client_id) {
                    if (!appClientId) appClientId = existingStores[0].client_id;
                    if (!appClientSecret) appClientSecret = existingStores[0].client_secret;
                }
            } catch (e) { }
        }

        appClientId = (appClientId || process.env.CLIENT_ID || process.env.SHOPIFY_CLIENT_ID || '').trim();
        appClientSecret = (appClientSecret || process.env.CLIENT_SECRET || process.env.SHOPIFY_CLIENT_SECRET || '').trim();`;

if (shopifyApiContent.includes(targetBlock)) {
  shopifyApiContent = shopifyApiContent.replace(targetBlock, replacementBlock);
  fs.writeFileSync(shopifyApiPath, shopifyApiContent, 'utf8');
  console.log('Successfully patched shopify.js with auto-lookup for client_id/secret');
} else {
  // Try CRLF
  const targetCRLF = targetBlock.replace(/\n/g, '\r\n');
  const replCRLF = replacementBlock.replace(/\n/g, '\r\n');
  if (shopifyApiContent.includes(targetCRLF)) {
    shopifyApiContent = shopifyApiContent.replace(targetCRLF, replCRLF);
    fs.writeFileSync(shopifyApiPath, shopifyApiContent, 'utf8');
    console.log('Successfully patched shopify.js with auto-lookup (CRLF)');
  } else {
    console.error('Could not find targetBlock in shopify.js');
  }
}

// 2. Add Re-Authorize option to triple-dots menu in ShopifyProductsView.tsx
const viewPath = path.resolve(__dirname, '../ems_project/frontend/src/components/ShopifyProductsView.tsx');
let viewContent = fs.readFileSync(viewPath, 'utf8');

const targetMenuItem = `<button
                            type="button"
                            onClick={e => handleSyncStore(store, e)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-zinc-200 flex items-center gap-2"
                          >
                            <RefreshCw size={13} className={syncingStoreId === store.id ? 'animate-spin text-purple-400' : ''} />
                            <span>Sync Store</span>
                          </button>`;

const replacementMenuItem = `<button
                            type="button"
                            onClick={e => handleSyncStore(store, e)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-zinc-200 flex items-center gap-2"
                          >
                            <RefreshCw size={13} className={syncingStoreId === store.id ? 'animate-spin text-purple-400' : ''} />
                            <span>Sync Store</span>
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                showToast('success', 'Opening Shopify to update permissions...');
                                const res = await api.connectShopifyStore({ shop: store.shop_domain });
                                if (res?.auth_url) {
                                  window.location.href = res.auth_url;
                                } else {
                                  showToast('error', res?.message || 'Could not initiate re-authorization');
                                }
                              } catch (err) {
                                showToast('error', err.message);
                              }
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-500/10 text-purple-300 flex items-center gap-2"
                          >
                            <Lock size={13} />
                            <span>Update Permissions (OAuth)</span>
                          </button>`;

if (viewContent.includes(targetMenuItem)) {
  viewContent = viewContent.replace(targetMenuItem, replacementMenuItem);
  fs.writeFileSync(viewPath, viewContent, 'utf8');
  console.log('Successfully patched ShopifyProductsView.tsx with Update Permissions button');
} else {
  const targetCRLF = targetMenuItem.replace(/\n/g, '\r\n');
  const replCRLF = replacementMenuItem.replace(/\n/g, '\r\n');
  if (viewContent.includes(targetCRLF)) {
    viewContent = viewContent.replace(targetCRLF, replCRLF);
    fs.writeFileSync(viewPath, viewContent, 'utf8');
    console.log('Successfully patched ShopifyProductsView.tsx with Update Permissions button (CRLF)');
  } else {
    console.error('Could not find targetMenuItem in ShopifyProductsView.tsx');
  }
}
