'use client';

import { useState } from 'react';

import {
  GoogleMerchantConfigModal,
  GoogleMerchantProductManager,
} from '@verone/channels';
import {
  useGoogleMerchantProducts,
  useGoogleMerchantStats,
} from '@verone/channels';
import { useProducts } from '@verone/products';
import { Alert, AlertDescription } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Info } from 'lucide-react';

import { GoogleMerchantConfigCard } from './GoogleMerchantConfigCard';
import { GoogleMerchantHeader } from './GoogleMerchantHeader';
import { GoogleMerchantProductsTab } from './GoogleMerchantProductsTab';
import { GoogleMerchantSettingsTab } from './GoogleMerchantSettingsTab';
import { GoogleMerchantStatsSection } from './GoogleMerchantStatsSection';
import { GoogleMerchantSyncFeedback } from './GoogleMerchantSyncFeedback';
import { useGoogleMerchantPage } from './use-google-merchant-page';

export default function GoogleMerchantPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const {
    syncStatus,
    synced,
    failed,
    skipped,
    total,
    progress,
    duration,
    error,
    handleAddProducts,
    handleUpdatePrice,
    handleUpdateMetadata,
    handleResyncProduct,
    handleHideProduct,
    handleRemoveProduct,
    handleSync,
  } = useGoogleMerchantPage();

  const { data: syncedProducts = [], isLoading: syncedProductsLoading } =
    useGoogleMerchantProducts();

  const { products: eligibleProducts = [], loading: eligibleProductsLoading } =
    useProducts({ is_published_online: true });

  const { data: stats, isLoading: statsLoading } = useGoogleMerchantStats();

  const merchantConfig = {
    merchant_id: '5495521926',
    api_connected: true,
    country: 'FR',
    currency: 'EUR',
    language: 'fr',
    last_sync: stats?.last_sync_at ?? null,
    sync_frequency: 'manual',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GoogleMerchantConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
      />

      <GoogleMerchantHeader
        syncStatus={syncStatus}
        onConfigOpen={() => setConfigModalOpen(true)}
        onSync={() => {
          void handleSync().catch(err => {
            console.error('[GoogleMerchant] handleSync failed:', err);
          });
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <GoogleMerchantSyncFeedback
          syncStatus={syncStatus}
          synced={synced}
          failed={failed}
          skipped={skipped}
          total={total}
          progress={progress}
          duration={duration}
          error={error}
        />

        <GoogleMerchantConfigCard config={merchantConfig} />

        <GoogleMerchantStatsSection stats={stats} isLoading={statsLoading} />

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Produits Synchronisés</TabsTrigger>
            <TabsTrigger value="add">Ajouter des Produits</TabsTrigger>
            <TabsTrigger value="settings">Paramètres Feed</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <GoogleMerchantProductsTab
              syncedProducts={syncedProducts}
              isLoading={syncedProductsLoading}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              onSearchChange={setSearchTerm}
              onStatusFilterChange={setStatusFilter}
              onUpdatePrice={handleUpdatePrice}
              onUpdateMetadata={handleUpdateMetadata}
              onResync={handleResyncProduct}
              onHide={handleHideProduct}
              onRemove={handleRemoveProduct}
            />
          </TabsContent>

          <TabsContent value="add">
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="text-black">
                  Ajouter des Produits
                </CardTitle>
                <CardDescription>
                  Sélectionnez les produits à exporter vers Google Merchant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6 border-blue-300 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    Sélectionnez les produits depuis votre catalogue pour les
                    synchroniser avec Google Merchant Center. Vous pouvez
                    définir des prix et métadonnées personnalisés pour chaque
                    produit.
                  </AlertDescription>
                </Alert>
                <GoogleMerchantProductManager
                  products={
                    eligibleProducts as unknown as Parameters<
                      typeof GoogleMerchantProductManager
                    >[0]['products']
                  }
                  onAddProducts={handleAddProducts}
                  isLoading={eligibleProductsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <GoogleMerchantSettingsTab
              syncFrequency={merchantConfig.sync_frequency}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
