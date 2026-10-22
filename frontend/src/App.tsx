import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ListingsTableView } from './components/ListingsTableView';
import { TemplatesView } from './components/TemplatesView';
import { VoiceRecorder } from './components/VoiceRecorder';
import { ListingWizardModal } from './components/ListingWizardModal';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { ShopifyStore, Listing, ListingTemplate, DashboardStats } from './types';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [templates, setTemplates] = useState<ListingTemplate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [storesRes, listingsRes, templatesRes, statsRes] = await Promise.allSettled([
        api.getStores(),
        api.getListings({ limit: 100 }),
        api.getTemplates(),
        api.getDashboardStats()
      ]);

      if (storesRes.status === 'fulfilled') {
        const fetchedStores = storesRes.value.stores || [];
        setStores(fetchedStores);
        if (fetchedStores.length > 0 && !activeStoreId) {
          const defaultStore = fetchedStores.find(s => Boolean(s.is_default)) || fetchedStores[0];
          setActiveStoreId(defaultStore.id);
        }
      }

      if (listingsRes.status === 'fulfilled') {
        setListings(listingsRes.value.listings || []);
      }

      if (templatesRes.status === 'fulfilled') {
        setTemplates(templatesRes.value.templates || []);
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.stats);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNewListing = () => {
    setEditingListing(null);
    setIsWizardOpen(true);
  };

  const handleEditListing = async (listing: Listing) => {
    try {
      const fullListing = await api.getListingById(listing.id);
      setEditingListing(fullListing.listing);
    } catch (e) {
      setEditingListing(listing);
    }
    setIsWizardOpen(true);
  };

  const handleVoiceParsedAndOpenWizard = (productData: any, transcript: string, audioUrl?: string) => {
    setEditingListing({
      id: '',
      title: productData.title || '',
      description_html: productData.description_html || '',
      vendor: productData.vendor || 'EMS Originals',
      product_type: productData.product_type || '',
      category: productData.category || '',
      tags: Array.isArray(productData.tags) ? productData.tags.join(', ') : (productData.tags || ''),
      status: 'draft',
      sync_status: 'draft',
      price: productData.price || 39.99,
      compare_at_price: productData.compare_at_price || null,
      cost_per_item: productData.cost_per_item || null,
      inventory_quantity: 20,
      seo_title: productData.seo_title || '',
      seo_description: productData.seo_description || '',
      variants: productData.variants || [],
      voice_memo_url: audioUrl || null,
      voice_transcript: transcript,
      created_at: new Date().toISOString()
    });
    setIsWizardOpen(true);
  };

  const activeStore = stores.find(s => s.id === activeStoreId) || stores[0];

  return (
    <div className="flex min-h-screen bg-[#030712] text-zinc-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'stores') {
            setIsStoreModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        activeStoreName={activeStore?.name}
        onOpenStoreModal={() => setIsStoreModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          stores={stores}
          currentStoreId={activeStoreId}
          onSelectStore={(id) => setActiveStoreId(id)}
          onNewListing={handleOpenNewListing}
          onOpenStoreModal={() => setIsStoreModalOpen(true)}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              onNewListing={handleOpenNewListing}
              onOpenVoice={() => setCurrentTab('voice')}
              onOpenStores={() => setIsStoreModalOpen(true)}
              onEditListing={handleEditListing}
            />
          )}

          {currentTab === 'listings' && (
            <ListingsTableView
              listings={listings}
              isLoading={isLoading}
              onRefresh={loadAllData}
              onNewListing={handleOpenNewListing}
              onEditListing={handleEditListing}
            />
          )}

          {currentTab === 'voice' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Voice-to-Listing Studio</h2>
                <p className="text-xs text-zinc-400">Record a voice memo and automatically convert it into a complete Shopify listing</p>
              </div>

              <VoiceRecorder onParsedProduct={handleVoiceParsedAndOpenWizard} />
            </div>
          )}

          {currentTab === 'templates' && (
            <TemplatesView
              templates={templates}
              onRefresh={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Flagship Product Creation Wizard Modal */}
      <ListingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSaved={loadAllData}
        initialData={editingListing}
        stores={stores}
      />

      {/* Store Credentials Modal */}
      <StoreSettingsModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onStoresUpdated={loadAllData}
      />
    </div>
  );
}

export default App;
