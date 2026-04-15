'use client';

import { useState, useMemo } from 'react';

import {
  Search,
  X,
  XCircle,
  CheckCircle,
  Package,
  ShoppingCart,
  Loader2,
} from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from '@verone/utils';
import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';

export type {
  EligibleProduct,
  GoogleMerchantProductManagerProps,
} from './google-merchant-types';
import type {
  EligibleProduct,
  CustomMetadata,
  GoogleMerchantProductManagerProps,
} from './google-merchant-types';
export function GoogleMerchantProductManager({
  products,
  onAddProducts,
  isLoading = false,
}: GoogleMerchantProductManagerProps) {
  const TVA_RATE = 1.2;

  // State: Sélection et custom data
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customData, setCustomData] = useState<Record<string, CustomMetadata>>(
    {}
  );
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );

  // State: Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, _setStatusFilter] = useState<string>('all');

  // State: Modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    synced: 0,
    total: 0,
    percent: 0,
  });
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    synced: number;
    failed: number;
  } | null>(null);

  // Extraction valeurs uniques pour filtres
  const families = useMemo(() => {
    const unique = new Set(
      products.map(p => p.family_name).filter(Boolean) as string[]
    );
    return Array.from(unique).sort();
  }, [products]);

  const categories = useMemo(() => {
    const unique = new Set(
      products.map(p => p.category_name).filter(Boolean) as string[]
    );
    return Array.from(unique).sort();
  }, [products]);

  // Produits filtrés
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Recherche
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchName = product.name.toLowerCase().includes(search);
        const matchSku = product.sku.toLowerCase().includes(search);
        if (!matchName && !matchSku) return false;
      }

      // Famille
      if (familyFilter !== 'all' && product.family_name !== familyFilter) {
        return false;
      }

      // Catégorie
      if (
        categoryFilter !== 'all' &&
        product.category_name !== categoryFilter
      ) {
        return false;
      }

      // Statut
      if (statusFilter !== 'all') {
        if (statusFilter === 'in_stock' && product.stock_status !== 'in_stock')
          return false;
        if (
          statusFilter === 'out_of_stock' &&
          product.stock_status !== 'out_of_stock'
        )
          return false;
        if (statusFilter === 'active' && product.product_status !== 'active')
          return false;
      }

      return true;
    });
  }, [products, searchTerm, familyFilter, categoryFilter, statusFilter]);

  // Produits sélectionnés
  const selectedProducts = useMemo(() => {
    return filteredProducts.filter(p => selectedIds.has(p.id));
  }, [filteredProducts, selectedIds]);

  // Total TTC estimé
  const totalTTC = useMemo(() => {
    return selectedProducts.reduce((sum, product) => {
      const customPrice = customData[product.id]?.custom_price_ht;
      const priceHT = customPrice ?? product.cost_price ?? 0;
      return sum + priceHT * TVA_RATE;
    }, 0);
  }, [selectedProducts, customData]);

  // Handlers: Sélection
  const toggleSelection = (productId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredProducts.map(p => p.id));
    setSelectedIds(allIds);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const _toggleDescriptionExpanded = (productId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedDescriptions(newExpanded);
  };

  // Handler: Ajout produits
  const handleAddProducts = async () => {
    setIsConfirmModalOpen(false);
    setIsProgressModalOpen(true);
    setSyncProgress({ synced: 0, total: selectedIds.size, percent: 0 });

    try {
      const result = await onAddProducts(
        Array.from(selectedIds),
        customData,
        progress => {
          const percent = Math.round((progress.synced / progress.total) * 100);
          setSyncProgress({ ...progress, percent });
        }
      );

      setSyncResult(result);

      // Si succès, clear sélection
      if (result.success) {
        setSelectedIds(new Set());
        setCustomData({});
      }
    } catch (_error) {
      setSyncResult({
        success: false,
        synced: 0,
        failed: selectedIds.size,
      });
    }
  };

  // Helper: Badge éligibilité
  const getEligibilityBadge = (product: EligibleProduct) => {
    if (
      product.stock_status === 'in_stock' &&
      product.product_status === 'active'
    ) {
      return (
        <Badge
          variant="outline"
          className="border-[#38ce3c] text-[#38ce3c] bg-green-50"
        >
          ✅ Éligible
        </Badge>
      );
    }
    if (product.stock_status === 'out_of_stock') {
      return (
        <Badge
          variant="outline"
          className="border-[#ff9b3e] text-[#ff9b3e] bg-orange-50"
        >
          ⚠️ Stock vide
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-gray-300 text-gray-600">
        ℹ️ À valider
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-[#3b86d1] animate-spin mx-auto" />
          <p className="text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: Recherche + Filtres */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom ou SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300"
            />
          </div>

          {/* Filtre Famille */}
          <Select value={familyFilter} onValueChange={setFamilyFilter}>
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Famille" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes familles</SelectItem>
              {families.map(family => (
                <SelectItem key={family} value={family}>
                  {family}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtre Catégorie */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions rapides */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="border-gray-300 text-gray-700"
            >
              Tout sélectionner ({filteredProducts.length})
            </ButtonV2>
            {selectedIds.size > 0 && (
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-gray-600"
              >
                <X className="h-4 w-4 mr-1" />
                Effacer sélection
              </ButtonV2>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {filteredProducts.length} produit
            {filteredProducts.length > 1 ? 's' : ''} trouvé
            {filteredProducts.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Grille produits */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-lg">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Aucun produit trouvé</p>
          <p className="text-sm text-gray-500 mt-1">
            Modifiez les filtres pour afficher plus de résultats
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const isSelected = selectedIds.has(product.id);

            return (
              <Card
                key={product.id}
                className={cn(
                  'border-2 transition-all duration-150',
                  isSelected
                    ? 'border-[#3b86d1] bg-blue-50/30'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header: Checkbox + Thumbnail + Info */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(product.id)}
                      className="mt-1"
                      aria-label={`Sélectionner ${product.name}`}
                    />

                    <ProductThumbnail
                      src={product.primary_image_url}
                      alt={product.name}
                      size="md"
                      className="flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-black line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        {product.sku}
                      </p>
                      {getEligibilityBadge(product)}
                    </div>
                  </div>

                  {/* Prix (lecture seule — identique au site internet) */}
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500 mb-1">Prix base HT</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {(product.cost_price ?? 0).toFixed(2)} €
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Prix identique au site internet (non modifiable)
                    </p>
                  </div>

                  {/* Stock */}
                  <div
                    className={cn(
                      'rounded p-2 text-xs font-medium',
                      product.stock_status === 'in_stock'
                        ? 'bg-green-50 text-green-700'
                        : product.stock_status === 'out_of_stock'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-yellow-50 text-yellow-700'
                    )}
                  >
                    {product.stock_status === 'in_stock' && '✅ En stock'}
                    {product.stock_status === 'out_of_stock' &&
                      '❌ Rupture de stock'}
                    {product.stock_status === 'coming_soon' &&
                      '⏳ Bientôt disponible'}
                    {!product.stock_status && '❓ Stock inconnu'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer sticky */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 bg-white border-t-2 border-[#3b86d1] shadow-lg rounded-t-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-600">Produits sélectionnés</p>
                <p className="text-2xl font-bold text-black">
                  {selectedIds.size}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Total TTC estimé</p>
                <p className="text-2xl font-bold text-[#3b86d1]">
                  {totalTTC.toFixed(2)} €
                </p>
              </div>
            </div>

            <ButtonV2
              onClick={() => setIsConfirmModalOpen(true)}
              className="bg-[#3b86d1] hover:bg-[#2a75c0] text-white"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Ajouter {selectedIds.size} produit
              {selectedIds.size > 1 ? 's' : ''}
            </ButtonV2>
          </div>
        </div>
      )}

      {/* Modal Confirmation */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              Confirmer l'ajout à Google Merchant
            </DialogTitle>
            <DialogDescription>
              Vous allez ajouter {selectedIds.size} produit
              {selectedIds.size > 1 ? 's' : ''} à Google Merchant Center
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Résumé */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Produits sélectionnés:
                </span>
                <span className="text-lg font-bold text-black">
                  {selectedIds.size}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Total TTC estimé:
                </span>
                <span className="text-lg font-bold text-[#38ce3c]">
                  {totalTTC.toFixed(2)} €
                </span>
              </div>
            </div>

            {/* Liste produits */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {selectedProducts.map(product => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded"
                >
                  <ProductThumbnail
                    src={product.primary_image_url}
                    alt={product.name}
                    size="xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {product.sku}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <ButtonV2
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              className="border-gray-300 text-gray-700"
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={() => void handleAddProducts()}
              className="bg-[#3b86d1] hover:bg-[#2a75c0] text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmer l'ajout
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Progress */}
      <Dialog open={isProgressModalOpen} onOpenChange={setIsProgressModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              {syncResult
                ? 'Synchronisation terminée'
                : 'Synchronisation en cours...'}
            </DialogTitle>
            <DialogDescription>
              {syncResult
                ? `${syncResult.synced} produits ajoutés avec succès`
                : `${syncProgress.synced} / ${syncProgress.total} produits`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {!syncResult ? (
              <>
                <Progress value={syncProgress.percent} className="h-3" />
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 text-[#3b86d1] animate-spin" />
                  <span className="text-lg font-semibold text-black">
                    {syncProgress.percent}%
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                {syncResult.success ? (
                  <>
                    <CheckCircle className="h-16 w-16 text-[#38ce3c] mx-auto" />
                    <div>
                      <p className="text-lg font-bold text-black">
                        {syncResult.synced} produits ajoutés
                      </p>
                      {syncResult.failed > 0 && (
                        <p className="text-sm text-[#ff9b3e] mt-1">
                          {syncResult.failed} échecs
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-16 w-16 text-[#ff4d6b] mx-auto" />
                    <p className="text-lg font-bold text-black">
                      Échec de la synchronisation
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {syncResult && (
            <DialogFooter>
              <ButtonV2
                onClick={() => {
                  setIsProgressModalOpen(false);
                  setSyncResult(null);
                }}
                className="bg-[#3b86d1] hover:bg-[#2a75c0] text-white"
              >
                Fermer
              </ButtonV2>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
