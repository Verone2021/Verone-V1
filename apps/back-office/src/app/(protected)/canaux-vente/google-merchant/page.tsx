'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { GoogleMerchantConfigModal } from '@verone/channels';
import { GoogleMerchantProductCard } from '@verone/channels';
import { GoogleMerchantProductManager } from '@verone/channels';
import { useGoogleMerchantSync } from '@verone/channels';
import {
  useGoogleMerchantProducts,
  useGoogleMerchantStats,
} from '@verone/channels';
import { useProducts } from '@verone/products';
import { Alert, AlertDescription, AlertTitle } from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Progress } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { logger } from '@verone/utils/logger';
import {
  Globe,
  ArrowLeft,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle,
  Package,
  Euro,
  BarChart,
  ShoppingBag,
  Search,
  Info,
} from 'lucide-react';

export default function GoogleMerchantPage() {
  const router = useRouter();
  // Reserved for future multi-select feature
  const [_selectedProducts, _setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // 🚀 Hooks RÉELS (aucune donnée mock)
  const {
    isLoading,
    isSuccess,
    isError,
    synced,
    failed,
    skipped,
    total,
    progress,
    duration,
    results: _results,
    error,
    insertProducts,
    updateProducts: _updateProducts,
    reset: _reset,
  } = useGoogleMerchantSync();

  // 🚀 Fetch produits RÉELS synchronisés depuis Supabase
  const { data: syncedProducts = [], isLoading: syncedProductsLoading } =
    useGoogleMerchantProducts();

  // 🚀 Fetch produits éligibles (tous les produits - le filtrage sera fait côté serveur via RPC)
  const { products: eligibleProducts = [], loading: eligibleProductsLoading } =
    useProducts({});

  // 🚀 Fetch statistiques RÉELLES depuis Supabase
  const { data: stats, isLoading: statsLoading } = useGoogleMerchantStats();

  // 🚀 Configuration Google Merchant (TEMPORAIRE - à récupérer depuis DB)
  // TODO Phase 2: Créer table google_merchant_config
  const merchantConfig = {
    merchant_id: '5495521926', // Account ID RÉEL
    api_connected: true,
    country: 'FR',
    currency: 'EUR',
    language: 'fr',
    last_sync: stats?.last_sync_at || null,
    auto_sync: false, // Pas encore implémenté
    sync_frequency: 'manual',
  };

  // 🚀 Handler: Ajouter produits depuis GoogleMerchantProductManager
  const handleAddProducts = async (
    productIds: string[],
    customData: Record<string, any>,
    onProgress?: (progress: { synced: number; total: number }) => void
  ) => {
    logger.info('[Google Merchant Page] Adding products', {
      count: productIds.length,
    });

    return new Promise<{ success: boolean; synced: number; failed: number }>(
      resolve => {
        insertProducts(productIds, {
          onSuccess: data => {
            logger.info('[Google Merchant Page] Products added successfully', {
              synced: data.synced,
              failed: data.failed,
            });
            resolve({
              success: true,
              synced: data.synced,
              failed: data.failed,
            });
          },
          onError: error => {
            logger.error(
              `[Google Merchant Page] Failed to add products: ${error}`
            );
            resolve({ success: false, synced: 0, failed: productIds.length });
          },
          onProgress: progress => {
            if (onProgress) onProgress(progress);
          },
        });
      }
    );
  };

  // 🚀 Handler: Mettre à jour prix custom produit
  const handleUpdatePrice = async (productId: string, newPriceHT: number) => {
    logger.info('[Google Merchant Page] Updating custom price', {
      productId,
      price: newPriceHT,
    });
    // TODO: Implémenter API update prix custom
    // await updateProducts([productId], { custom_price_ht: newPriceHT })
  };

  // 🚀 Handler: Mettre à jour métadonnées produit
  const handleUpdateMetadata = async (
    productId: string,
    _metadata: { title: string; description: string }
  ) => {
    logger.info('[Google Merchant Page] Updating metadata', { productId });
    // TODO: Implémenter API update métadonnées (will use _metadata)
  };

  // 🚀 Handler: Re-synchroniser produit
  const handleResyncProduct = async (productId: string) => {
    logger.info('[Google Merchant Page] Resyncing product', { productId });
    await insertProducts([productId]);
  };

  // 🚀 Handler: Masquer produit
  const handleHideProduct = async (productId: string) => {
    logger.info('[Google Merchant Page] Hiding product', { productId });
    // TODO: Implémenter API hide product
  };

  // 🚀 Handler: Retirer produit
  const handleRemoveProduct = async (productId: string) => {
    logger.info('[Google Merchant Page] Removing product', { productId });
    // TODO: Implémenter API remove product (soft delete)
  };

  // Reserved for future status badge customization
  const _getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-500">
          Non synchronisé
        </Badge>
      );
    }
    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-300 text-green-600">
            Approuvé
          </Badge>
        );
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="border-yellow-300 text-yellow-600"
          >
            En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-300 text-red-600">
            Refusé
          </Badge>
        );
      case 'not_synced':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-500">
            Non synchronisé
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-500">
            {status}
          </Badge>
        );
    }
  };

  // Reserved for custom currency formatting
  const _formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 🚀 Statistiques RÉELLES (jamais de mock)
  // Si pas de données, afficher 0 ou N/A

  // 🚀 Handler: Synchroniser manuellement (polling Google statuses)
  const handleSync = async () => {
    logger.info('[Google Merchant Page] Manual sync triggered');

    try {
      const response = await fetch('/api/google-merchant/poll-statuses', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();
      logger.info('[Google Merchant Page] Sync completed', result);

      // Refresh data
      window.location.reload();
    } catch (error: any) {
      logger.error('[Google Merchant Page] Sync error:', error);
    }
  };

  // 🚀 NOUVEAU: Déterminer le statut de synchronisation basé sur le hook
  const syncStatus = isLoading
    ? 'syncing'
    : isSuccess
      ? 'success'
      : isError
        ? 'error'
        : 'idle';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Configuration Modal */}
      <GoogleMerchantConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => router.push('/canaux-vente')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </ButtonV2>
              <div>
                <h1 className="text-3xl font-bold text-black flex items-center space-x-2">
                  <Globe className="h-8 w-8" />
                  <span>Google Merchant Center</span>
                </h1>
                <p className="text-gray-600 mt-1">
                  Gérez votre catalogue produits sur Google Shopping
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ButtonV2
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
                onClick={() => setConfigModalOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </ButtonV2>
              <ButtonV2
                className="bg-black hover:bg-gray-800 text-white"
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Synchroniser
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 🚀 NOUVEAU: Feedback de synchronisation enrichi */}

        {/* Synchronisation en cours */}
        {syncStatus === 'syncing' && (
          <Card className="mb-6 border-black">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="h-5 w-5 text-black animate-spin" />
                    <div>
                      <h3 className="font-semibold text-black">
                        Synchronisation en cours...
                      </h3>
                      <p className="text-sm text-gray-600">
                        {synced}/{total} produits synchronisés
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-black">{progress}%</p>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Synchronisation réussie */}
        {syncStatus === 'success' && (
          <Alert className="mb-6 border-green-300 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">
              Synchronisation terminée avec succès
            </AlertTitle>
            <AlertDescription className="text-green-700">
              <div className="mt-2 space-y-1">
                <p>✅ {synced} produits synchronisés</p>
                {failed > 0 && (
                  <p className="text-red-600">❌ {failed} échecs</p>
                )}
                {skipped > 0 && (
                  <p className="text-gray-600">⏭️ {skipped} ignorés</p>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  Durée: {(duration / 1000).toFixed(1)}s
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Synchronisation échouée */}
        {syncStatus === 'error' && (
          <Alert className="mb-6 border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">
              Échec de synchronisation
            </AlertTitle>
            <AlertDescription className="text-red-700">
              <p>
                {error || 'Une erreur est survenue lors de la synchronisation'}
              </p>
              {failed > 0 && (
                <div className="mt-2 space-y-1">
                  <p>❌ {failed} produits en échec</p>
                  {synced > 0 && (
                    <p>✅ {synced} produits synchronisés avant erreur</p>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration */}
        <Card className="border-black mb-6">
          <CardHeader>
            <CardTitle className="text-black flex items-center justify-between">
              Configuration Google Merchant
              {merchantConfig.api_connected ? (
                <Badge
                  variant="outline"
                  className="border-green-300 text-green-600"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connecté
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-red-300 text-red-600"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Non connecté
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">ID Marchand</p>
                <p className="font-mono">{merchantConfig.merchant_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pays / Langue</p>
                <p className="font-medium">
                  {merchantConfig.country} / {merchantConfig.language}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Devise</p>
                <p className="font-medium">{merchantConfig.currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dernière synchro</p>
                <p className="font-medium">
                  {merchantConfig.last_sync
                    ? formatDate(merchantConfig.last_sync)
                    : 'Jamais'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques RÉELLES - Affichage conditionnel */}
        {statsLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
            <p className="text-gray-600 mt-2">Chargement des statistiques...</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <Card className="border-black">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Produits</p>
                    <p className="text-2xl font-bold text-black">
                      {stats.total_products}
                    </p>
                  </div>
                  <Package className="h-6 w-6 text-black" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-black">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approuvés</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.approved_products}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-black">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Impressions</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.total_impressions.toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <BarChart className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-black">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Clics</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.total_clicks}
                    </p>
                  </div>
                  <ShoppingBag className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-black">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Conversions</p>
                    <p className="text-2xl font-bold text-black">
                      {stats.total_conversions}
                    </p>
                  </div>
                  <Euro className="h-6 w-6 text-black" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-black">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taux Conv.</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.conversion_rate > 0
                        ? `${stats.conversion_rate}%`
                        : '0%'}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert className="mb-6 border-gray-300">
            <Info className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-700">
              Aucune donnée de synchronisation disponible. Synchronisez des
              produits pour voir les statistiques.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs pour produits et configuration */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Produits Synchronisés</TabsTrigger>
            <TabsTrigger value="add">Ajouter des Produits</TabsTrigger>
            <TabsTrigger value="settings">Paramètres Feed</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="text-black">
                  Produits sur Google Merchant
                </CardTitle>
                <CardDescription>
                  Gérez les produits synchronisés avec Google Shopping
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtres */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 border-black"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 border-black">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Grid des produits RÉELS avec GoogleMerchantProductCard */}
                {syncedProductsLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
                    <p className="text-gray-600 mt-2">
                      Chargement des produits...
                    </p>
                  </div>
                ) : syncedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {syncedProducts.map(product => (
                      <GoogleMerchantProductCard
                        key={product.id}
                        product={product}
                        onUpdatePrice={handleUpdatePrice}
                        onUpdateMetadata={handleUpdateMetadata}
                        onResync={handleResyncProduct}
                        onHide={handleHideProduct}
                        onRemove={handleRemoveProduct}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      Aucun produit synchronisé
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Utilisez l'onglet "Ajouter des Produits" pour synchroniser
                      votre catalogue
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  products={eligibleProducts}
                  onAddProducts={handleAddProducts}
                  isLoading={eligibleProductsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="text-black">Paramètres du Feed</CardTitle>
                <CardDescription>
                  Configurez les paramètres de synchronisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium">
                      Fréquence de synchronisation
                    </label>
                    <Select defaultValue={merchantConfig.sync_frequency}>
                      <SelectTrigger className="w-full mt-1 border-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manuelle</SelectItem>
                        <SelectItem value="hourly">
                          Toutes les heures
                        </SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Format d'export
                    </label>
                    <Select defaultValue="xml">
                      <SelectTrigger className="w-full mt-1 border-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xml">
                          XML (Google Shopping)
                        </SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Synchronisation automatique activée
                    </p>
                    <ButtonV2 className="bg-black hover:bg-gray-800 text-white">
                      Enregistrer les paramètres
                    </ButtonV2>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
