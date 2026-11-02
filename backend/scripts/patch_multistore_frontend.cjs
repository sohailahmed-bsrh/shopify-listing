const fs = require('fs');
const path = require('path');

// 1. Update WhatsAppDashboard.tsx
const dashboardPath = path.resolve(__dirname, '../ems_project/frontend/src/components/WhatsAppDashboard.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Change Live badge to 3
dashboardContent = dashboardContent.replace(
  /<span className="text-\[10px\] bg-purple-500\/20 text-purple-300 px-2 py-0\.5 rounded-full font-bold">\s*Live\s*<\/span>/,
  `<span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">3</span>`
);

// Add Stores button if not present
if (!dashboardContent.includes("onClick={() => setShopifySubTab('stores')")) {
  const targetSubnav = `<span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Shopify Views</span>`;
  const storesButton = `<span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Shopify Views</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShopifySubTab('stores')}
                                                    className={\`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition-all \${
                                                        shopifySubTab === 'stores'
                                                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                                    }\`}
                                                >
                                                    <Store size={15} />
                                                    <span>Stores</span>
                                                </button>`;
  dashboardContent = dashboardContent.replace(targetSubnav, storesButton);
}

// Support both stores and products rendering ShopifyProductsView with initialTab
if (dashboardContent.includes("{shopifySubTab === 'products' && (")) {
  dashboardContent = dashboardContent.replace(
    `{shopifySubTab === 'products' && (\r\n                                                    <ShopifyProductsView`,
    `{(shopifySubTab === 'stores' || shopifySubTab === 'products') && (\r\n                                                    <ShopifyProductsView\r\n                                                        initialTab={shopifySubTab}`
  );
  // Also try LF version just in case
  dashboardContent = dashboardContent.replace(
    `{shopifySubTab === 'products' && (\n                                                    <ShopifyProductsView`,
    `{(shopifySubTab === 'stores' || shopifySubTab === 'products') && (\n                                                    <ShopifyProductsView\n                                                        initialTab={shopifySubTab}`
  );
}

fs.writeFileSync(dashboardPath, dashboardContent, 'utf8');
console.log('Successfully patched WhatsAppDashboard.tsx');

// 2. Update ShopifyProductsView.tsx to respond to initialTab prop changes
const viewPath = path.resolve(__dirname, '../ems_project/frontend/src/components/ShopifyProductsView.tsx');
let viewContent = fs.readFileSync(viewPath, 'utf8');

if (!viewContent.includes('useEffect(() => {\n    if (initialTab ===') && !viewContent.includes('useEffect(() => {\r\n    if (initialTab ===')) {
  const targetEffectPoint = `  const showToast = (type: 'success' | 'error', message: string) => {`;
  const effectCode = `  useEffect(() => {
    if (initialTab === 'orders') {
      setActiveSubTab('orders');
    } else if (initialTab === 'settings') {
      setActiveSubTab('settings');
    } else if (initialTab === 'products' || initialTab === 'stores') {
      setActiveSubTab('products');
    }
  }, [initialTab]);\n\n  const showToast = (type: 'success' | 'error', message: string) => {`;
  viewContent = viewContent.replace(targetSubnav = targetEffectPoint, effectCode);
  fs.writeFileSync(viewPath, viewContent, 'utf8');
  console.log('Successfully patched ShopifyProductsView.tsx with initialTab effect');
} else {
  console.log('ShopifyProductsView.tsx already has initialTab effect');
}
