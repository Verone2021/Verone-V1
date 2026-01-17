'use client';

import { useState, useMemo, useCallback } from 'react';

import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';
import { Badge, Progress } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import {
  Settings,
  Search,
  Save,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  DollarSign,
  Percent,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useLinkMeCatalogProducts,
  useUpdateLinkMePricing,
  type LinkMeCatalogProduct,
} from '../../hooks/use-linkme-catalog';

// ============================================
// CONSTANTES TVA ET FONCTIONS DE CONVERSION
// ============================================

/**
 * Taux de TVA par défaut (20% France)
 */
const TVA_RATE = 0.2;

/**
 * Convertit un prix TTC en HT
 * Formule : HT = TTC / (1 + TVA) = TTC / 1.20
 */
const ttcToHt = (ttc: number): number => ttc / (1 + TVA_RATE);

/**
 * Convertit un prix HT en TTC
 * Formule : TTC = HT × (1 + TVA) = HT × 1.20
 */
const htToTtc = (ht: number): number => ht * (1 + TVA_RATE);

/**
 * Interface pour les modifications en attente
 */
interface PendingChange {
  catalogProductId: string;
  field: string;
  originalValue: number | null;
  newValue: number | null;
}

/**
 * Composant cellule éditable pour les prix
 */
function EditableCell({
  value,
  onChange,
  type = 'price',
  min = 0,
  max = 100,
  step = 0.01,
  disabled = false,
  hasChange = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  type?: 'price' | 'percent';
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  hasChange?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState<string>(
    value !== null
      ? type === 'percent'
        ? (value * 100).toFixed(1)
        : value.toFixed(2)
      : ''
  );

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(localValue);
    if (isNaN(numValue)) {
      onChange(null);
    } else {
      const finalValue = type === 'percent' ? numValue / 100 : numValue;
      onChange(Math.max(min, Math.min(max, finalValue)));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(
        value !== null
          ? type === 'percent'
            ? (value * 100).toFixed(1)
            : value.toFixed(2)
          : ''
      );
      setIsEditing(false);
    }
  };

  if (disabled) {
    return (
      <span className="text-gray-500 font-mono text-sm">
        {value !== null
          ? type === 'percent'
            ? `${(value * 100).toFixed(1)}%`
            : formatPrice(value)
          : '-'}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={localValue}
          onChange={e => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          step={type === 'percent' ? 0.1 : step}
          min={type === 'percent' ? min * 100 : min}
          max={type === 'percent' ? max * 100 : max}
          className="w-24 h-8 text-sm font-mono"
          autoFocus
        />
        {type === 'percent' && <span className="text-gray-400">%</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'px-2 py-1 rounded text-sm font-mono transition-colors text-left min-w-[80px]',
        hasChange
          ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
          : 'hover:bg-gray-100'
      )}
    >
      {value !== null
        ? type === 'percent'
          ? `${(value * 100).toFixed(1)}%`
          : formatPrice(value)
        : '-'}
    </button>
  );
}

/**
 * Composant indicateur de marge
 */
function MarginIndicator({ margin }: { margin: number | null }) {
  if (margin === null) {
    return <span className="text-gray-400">-</span>;
  }

  const marginPercent = margin * 100;
  const isNegative = marginPercent < 0;
  const isLow = marginPercent < 15;
  const isGood = marginPercent >= 15 && marginPercent < 30;
  const isHigh = marginPercent >= 30;

  return (
    <div className="flex items-center gap-1">
      {isNegative ? (
        <TrendingDown className="h-4 w-4 text-red-500" />
      ) : isLow ? (
        <Minus className="h-4 w-4 text-amber-500" />
      ) : (
        <TrendingUp className="h-4 w-4 text-green-500" />
      )}
      <span
        className={cn(
          'font-mono text-sm font-medium',
          isNegative && 'text-red-600',
          isLow && 'text-amber-600',
          isGood && 'text-green-600',
          isHigh && 'text-emerald-600'
        )}
      >
        {marginPercent.toFixed(1)}%
      </span>
    </div>
  );
}

/**
 * Page Configuration Prix LinkMe
 *
 * Permet l'édition inline des prix pour tous les produits du catalogue LinkMe :
 * - Prix public HT
 * - Prix de vente HT (custom_price_ht)
 * - Buffer % (marge de sécurité)
 * - Commission canal %
 */
export default function LinkMePricingConfigPage() {
  // State: Recherche
  const [searchTerm, setSearchTerm] = useState('');

  // State: Modifications en attente
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, PendingChange>
  >(new Map());

  // Hooks data
  const {
    data: catalogProducts,
    isLoading,
    refetch,
  } = useLinkMeCatalogProducts();
  const updatePricingMutation = useUpdateLinkMePricing();

  // Produits filtrés
  const filteredProducts = useMemo(() => {
    if (!catalogProducts) return [];
    if (!searchTerm) return catalogProducts;

    const search = searchTerm.toLowerCase();
    return catalogProducts.filter(
      p =>
        p.product_name.toLowerCase().includes(search) ||
        p.product_reference.toLowerCase().includes(search)
    );
  }, [catalogProducts, searchTerm]);

  // KPIs
  const kpis = useMemo(() => {
    if (!catalogProducts || catalogProducts.length === 0) {
      return {
        totalProducts: 0,
        avgMargin: 0,
        avgBuffer: 0,
        avgCommission: 0,
        productsWithPricing: 0,
      };
    }

    let totalMargin = 0;
    let totalBuffer = 0;
    let totalCommission = 0;
    let marginCount = 0;
    let bufferCount = 0;
    let commissionCount = 0;
    let productsWithPricing = 0;

    catalogProducts.forEach(p => {
      if (p.public_price_ht !== null || p.product_selling_price_ht !== null) {
        productsWithPricing++;
      }

      // Calcul marge: (vente - achat) / achat
      const costPrice = p.product_price_ht || 0;
      const sellingPrice = p.product_selling_price_ht || p.public_price_ht || 0;
      if (costPrice > 0 && sellingPrice > 0) {
        totalMargin += (sellingPrice - costPrice) / costPrice;
        marginCount++;
      }

      // Buffer
      const bufferRate =
        (p as unknown as { buffer_rate?: number }).buffer_rate ?? null;
      if (bufferRate !== null) {
        totalBuffer += bufferRate;
        bufferCount++;
      }

      // Commission
      if (p.channel_commission_rate !== null) {
        totalCommission += p.channel_commission_rate;
        commissionCount++;
      }
    });

    return {
      totalProducts: catalogProducts.length,
      avgMargin: marginCount > 0 ? totalMargin / marginCount : 0,
      avgBuffer: bufferCount > 0 ? totalBuffer / bufferCount : 0.05,
      avgCommission:
        commissionCount > 0 ? totalCommission / commissionCount : 0,
      productsWithPricing,
    };
  }, [catalogProducts]);

  // Gestion des modifications
  const handleFieldChange = useCallback(
    (
      product: LinkMeCatalogProduct,
      field:
        | 'public_price_ht'
        | 'custom_price_ht'
        | 'buffer_rate'
        | 'channel_commission_rate',
      newValue: number | null
    ) => {
      const key = `${product.id}-${field}`;
      const extProduct = product as unknown as {
        buffer_rate?: number;
        public_price_ht?: number | null;
        product_selling_price_ht?: number | null;
        channel_commission_rate?: number | null;
      };

      let originalValue: number | null = null;
      if (field === 'buffer_rate') {
        originalValue = extProduct.buffer_rate ?? 0.05;
      } else if (field === 'public_price_ht') {
        originalValue = extProduct.public_price_ht ?? null;
      } else if (field === 'custom_price_ht') {
        originalValue = extProduct.product_selling_price_ht ?? null;
      } else if (field === 'channel_commission_rate') {
        originalValue = extProduct.channel_commission_rate ?? null;
      }

      if (newValue === originalValue) {
        // Supprimer le changement si on revient à la valeur originale
        setPendingChanges(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      } else {
        setPendingChanges(prev => {
          const next = new Map(prev);
          next.set(key, {
            catalogProductId: product.id,
            field,
            originalValue,
            newValue,
          });
          return next;
        });
      }
    },
    []
  );

  // Sauvegarder toutes les modifications
  const handleSaveAll = async () => {
    if (pendingChanges.size === 0) return;

    // Grouper les changements par produit
    const changesByProduct = new Map<string, Record<string, number | null>>();
    pendingChanges.forEach(change => {
      const existing = changesByProduct.get(change.catalogProductId) || {};
      existing[change.field] = change.newValue;
      changesByProduct.set(change.catalogProductId, existing);
    });

    let successCount = 0;
    let errorCount = 0;

    for (const [catalogProductId, pricing] of changesByProduct) {
      try {
        await updatePricingMutation.mutateAsync({
          catalogProductId,
          pricing: pricing as {
            public_price_ht?: number | null;
            custom_price_ht?: number | null;
            buffer_rate?: number | null;
            channel_commission_rate?: number | null;
          },
        });
        successCount++;
      } catch (error) {
        console.error(`Erreur mise à jour ${catalogProductId}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} produit(s) mis à jour`);
      setPendingChanges(new Map());
      refetch();
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} erreur(s) lors de la mise à jour`);
    }
  };

  // Annuler toutes les modifications
  const handleDiscardAll = () => {
    setPendingChanges(new Map());
  };

  // Obtenir la valeur effective (avec modification en attente)
  const getEffectiveValue = (
    product: LinkMeCatalogProduct,
    field:
      | 'public_price_ht'
      | 'custom_price_ht'
      | 'buffer_rate'
      | 'channel_commission_rate'
  ): number | null => {
    const key = `${product.id}-${field}`;
    const pending = pendingChanges.get(key);
    if (pending) {
      return pending.newValue;
    }

    const extProduct = product as unknown as {
      buffer_rate?: number;
      public_price_ht?: number | null;
      product_selling_price_ht?: number | null;
      channel_commission_rate?: number | null;
    };

    if (field === 'buffer_rate') {
      return extProduct.buffer_rate ?? 0.05;
    }
    if (field === 'public_price_ht') {
      return extProduct.public_price_ht ?? null;
    }
    if (field === 'custom_price_ht') {
      return extProduct.product_selling_price_ht ?? null;
    }
    if (field === 'channel_commission_rate') {
      return extProduct.channel_commission_rate ?? null;
    }
    return null;
  };

  // Calculer la marge pour un produit
  const calculateMargin = (product: LinkMeCatalogProduct): number | null => {
    const costPrice = product.product_price_ht || 0;
    const sellingPrice =
      getEffectiveValue(product, 'custom_price_ht') ??
      getEffectiveValue(product, 'public_price_ht') ??
      0;

    if (costPrice <= 0 || sellingPrice <= 0) return null;
    return (sellingPrice - costPrice) / costPrice;
  };

  // Vérifier si un produit a des modifications
  const hasChanges = (product: LinkMeCatalogProduct): boolean => {
    return (
      pendingChanges.has(`${product.id}-public_price_ht`) ||
      pendingChanges.has(`${product.id}-custom_price_ht`) ||
      pendingChanges.has(`${product.id}-buffer_rate`) ||
      pendingChanges.has(`${product.id}-channel_commission_rate`)
    );
  };

  // Obtenir la valeur TTC à partir du HT stocké
  const getEffectiveTtcValue = (
    product: LinkMeCatalogProduct
  ): number | null => {
    const htValue = getEffectiveValue(product, 'public_price_ht');
    return htValue !== null ? htToTtc(htValue) : null;
  };

  // Handler quand l'utilisateur modifie le TTC
  const handleTtcChange = useCallback(
    (product: LinkMeCatalogProduct, ttcValue: number | null) => {
      // Convertir TTC → HT avant de sauvegarder
      const htValue = ttcValue !== null ? ttcToHt(ttcValue) : null;
      handleFieldChange(product, 'public_price_ht', htValue);
    },
    [handleFieldChange]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto" />
          <p className="text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Settings className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Configuration des Prix</h1>
              <p className="text-sm text-gray-500">
                Éditez les prix en ligne pour tous les produits du catalogue
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {pendingChanges.size > 0 && (
              <>
                <Badge variant="warning" className="mr-2">
                  {pendingChanges.size} modification(s)
                </Badge>
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardAll}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Annuler
                </ButtonV2>
                <ButtonV2
                  size="sm"
                  onClick={handleSaveAll}
                  disabled={updatePricingMutation.isPending}
                >
                  {updatePricingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Sauvegarder tout
                </ButtonV2>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.totalProducts}</p>
                  <p className="text-sm text-gray-500">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(kpis.avgMargin * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Marge moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(kpis.avgBuffer * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Buffer moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(kpis.avgCommission * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Commission moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche */}
        <Card>
          <CardContent className="pt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom ou SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tableau des prix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Configuration des prix par produit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[300px]">Produit</TableHead>
                    <TableHead className="text-right">
                      Prix d&apos;achat HT
                    </TableHead>
                    <TableHead className="text-right">
                      Prix public TTC
                    </TableHead>
                    <TableHead className="text-right">Prix public HT</TableHead>
                    <TableHead className="text-right">
                      Prix de vente HT
                    </TableHead>
                    <TableHead className="text-right">Buffer %</TableHead>
                    <TableHead className="text-right">Commission %</TableHead>
                    <TableHead className="text-right">Marge</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => {
                    const margin = calculateMargin(product);
                    const productHasChanges = hasChanges(product);

                    return (
                      <TableRow
                        key={product.id}
                        className={cn(
                          'transition-colors',
                          productHasChanges && 'bg-amber-50'
                        )}
                      >
                        {/* Produit */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ProductThumbnail
                              src={product.product_image_url}
                              alt={product.product_name}
                              size="xs"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[200px]">
                                {product.product_name}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                {product.product_reference}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Prix d'achat (lecture seule) */}
                        <TableCell className="text-right">
                          <EditableCell
                            value={product.product_price_ht}
                            onChange={() => {}}
                            type="price"
                            disabled
                          />
                        </TableCell>

                        {/* Prix public TTC (éditable, convertit vers HT) */}
                        <TableCell className="text-right">
                          <EditableCell
                            value={getEffectiveTtcValue(product)}
                            onChange={ttcValue =>
                              handleTtcChange(product, ttcValue)
                            }
                            type="price"
                            hasChange={pendingChanges.has(
                              `${product.id}-public_price_ht`
                            )}
                          />
                        </TableCell>

                        {/* Prix public HT (éditable, stockage direct) */}
                        <TableCell className="text-right">
                          <EditableCell
                            value={getEffectiveValue(
                              product,
                              'public_price_ht'
                            )}
                            onChange={htValue =>
                              handleFieldChange(
                                product,
                                'public_price_ht',
                                htValue
                              )
                            }
                            type="price"
                            hasChange={pendingChanges.has(
                              `${product.id}-public_price_ht`
                            )}
                          />
                        </TableCell>

                        {/* Prix de vente HT */}
                        <TableCell className="text-right">
                          <EditableCell
                            value={getEffectiveValue(
                              product,
                              'custom_price_ht'
                            )}
                            onChange={v =>
                              handleFieldChange(product, 'custom_price_ht', v)
                            }
                            type="price"
                            hasChange={pendingChanges.has(
                              `${product.id}-custom_price_ht`
                            )}
                          />
                        </TableCell>

                        {/* Buffer % */}
                        <TableCell className="text-right">
                          <EditableCell
                            value={getEffectiveValue(product, 'buffer_rate')}
                            onChange={v =>
                              handleFieldChange(product, 'buffer_rate', v)
                            }
                            type="percent"
                            min={0}
                            max={0.2}
                            hasChange={pendingChanges.has(
                              `${product.id}-buffer_rate`
                            )}
                          />
                        </TableCell>

                        {/* Commission % */}
                        <TableCell className="text-right">
                          <EditableCell
                            value={getEffectiveValue(
                              product,
                              'channel_commission_rate'
                            )}
                            onChange={v =>
                              handleFieldChange(
                                product,
                                'channel_commission_rate',
                                v
                              )
                            }
                            type="percent"
                            min={0}
                            max={0.5}
                            hasChange={pendingChanges.has(
                              `${product.id}-channel_commission_rate`
                            )}
                          />
                        </TableCell>

                        {/* Marge calculée */}
                        <TableCell className="text-right">
                          <MarginIndicator margin={margin} />
                        </TableCell>

                        {/* Indicateur de modification */}
                        <TableCell>
                          {productHasChanges && (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun produit trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Légende */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded" />
                <span>Modification en attente</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Marge &gt; 15%</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-amber-500" />
                <span>Marge 0-15%</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span>Marge négative</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600" />
                <span>Buffer = Marge de sécurité (5-10%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
