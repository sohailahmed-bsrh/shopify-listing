import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { EMSProductsView } from './components/EMSProductsView';
import { EMSOrdersView } from './components/EMSOrdersView';
import { ShopifyAutomationPage } from './components/ShopifyAutomationPage';
import { INITIAL_EMS_PRODUCTS, getProductsByIds } from './data/emsProducts';
import { EMSProduct } from './types';

export function App() {
  const [currentPage, setCurrentPage] = useState<'products' | 'orders' | 'shopify'>('products');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from URL search parameters or session storage (preserves refresh state!)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPage = params.get('page') as 'products' | 'orders' | 'shopify' | null;
      const urlIds = params.get('ids');

      let initialIds: string[] = [];

      if (urlIds) {
        initialIds = urlIds.split(',').filter(Boolean);
      } else {
        const stored = sessionStorage.getItem('ems_selected_product_ids');
        if (stored) {
          initialIds = JSON.parse(stored);
        }
      }

      if (initialIds.length > 0) {
        setSelectedProductIds(initialIds);
      }

      if (urlPage === 'shopify' || urlPage === 'orders') {
        setCurrentPage(urlPage);
      }
    } catch (e) {
      console.error('Error restoring session state:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync to URL & Session Storage whenever state changes
  useEffect(() => {
    if (!isInitialized) return;

    try {
      sessionStorage.setItem('ems_selected_product_ids', JSON.stringify(selectedProductIds));

      const params = new URLSearchParams();
      if (currentPage === 'shopify') {
        params.set('page', 'shopify');
        if (selectedProductIds.length > 0) {
          params.set('ids', selectedProductIds.join(','));
        }
      } else if (currentPage === 'orders') {
        params.set('page', 'orders');
      }

      const queryString = params.toString();
      const newUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

      window.history.replaceState({}, '', newUrl);
    } catch (e) {
      console.error('Error syncing state to URL:', e);
    }
  }, [currentPage, selectedProductIds, isInitialized]);

  // Handle single toggle
  const handleToggleSelect = (id: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        // Appends to preserve user selection sequence!
        return [...prev, id];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    const allIds = INITIAL_EMS_PRODUCTS.map(p => p.id);
    if (selectedProductIds.length === allIds.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(allIds);
    }
  };

  // Handle clear
  const handleClearSelection = () => {
    setSelectedProductIds([]);
  };

  // Remove single product from Shopify staging
  const handleRemoveStagedProduct = (id: string) => {
    setSelectedProductIds(prev => prev.filter(i => i !== id));
  };

  // Navigate to Shopify Automation
  const handleNavigateToShopify = () => {
    setCurrentPage('shopify');
  };

  // Navigate back to EMS Products
  const handleBackToProducts = () => {
    setCurrentPage('products');
  };

  // Retrieve products in exact preserved selection order
  const stagedProducts = getProductsByIds(selectedProductIds);

  return (
    <div className="flex min-h-screen bg-[#030712] text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(page) => setCurrentPage(page)}
        stagedCount={selectedProductIds.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentPage={currentPage}
          stagedCount={selectedProductIds.length}
          onNavigateToShopify={handleNavigateToShopify}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentPage === 'products' && (
            <EMSProductsView
              products={INITIAL_EMS_PRODUCTS}
              selectedProductIds={selectedProductIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onNavigateToShopify={handleNavigateToShopify}
            />
          )}

          {currentPage === 'orders' && (
            <EMSOrdersView />
          )}

          {currentPage === 'shopify' && (
            <ShopifyAutomationPage
              selectedProducts={stagedProducts}
              onRemoveProduct={handleRemoveStagedProduct}
              onClearAll={handleClearSelection}
              onBackToProducts={handleBackToProducts}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
