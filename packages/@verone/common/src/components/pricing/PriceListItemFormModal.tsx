'use client';

import { useState, useEffect } from 'react';

import { Plus } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  useCreatePriceListItem,
  useUpdatePriceListItem,
  usePriceListItems,
  usePriceList,
} from '@verone/finance/hooks';
import { useProducts } from '@verone/products/hooks';

import { PriceTierForm, type TierForm } from './PriceTierForm';
import {
  PriceProductSelector,
  type SelectedProduct,
} from './PriceProductSelector';

interface PriceListItemFormModalProps {
  open: boolean;
  onClose: () => void;
  priceListId: string;
  itemId?: string | null;
}

const DEFAULT_TIER: TierForm = {
  min_quantity: 1,
  max_quantity: null,
  price_ht: 0,
  discount_rate: 0,
  margin_rate: 0,
  valid_from: '',
  valid_until: '',
  is_active: true,
  notes: '',
};

export function PriceListItemFormModal({
  open,
  onClose,
  priceListId,
  itemId,
}: PriceListItemFormModalProps) {
  const isEditMode = !!itemId;

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null);
  const [showProductSearch, setShowProductSearch] = useState(!isEditMode);
  const [tiers, setTiers] = useState<TierForm[]>([DEFAULT_TIER]);

  const { products } = useProducts({
    search: productSearchTerm,
  }) as unknown as {
    products: SelectedProduct[] | undefined;
  };
  const { data: priceList } = usePriceList(priceListId);
  const { data: existingItems } = usePriceListItems(priceListId);
  const { mutate: createItem, isPending: isCreating } =
    useCreatePriceListItem();
  const { mutate: updateItem, isPending: isUpdating } =
    useUpdatePriceListItem();

  const isLoading = isCreating || isUpdating;
  const currency = (priceList as unknown as { currency?: string })?.currency;

  // Load existing item in edit mode
  useEffect(() => {
    if (itemId && existingItems) {
      const item = existingItems.find((i: { id: string }) => i.id === itemId);
      if (item) {
        setSelectedProduct(
          (item as unknown as { products: SelectedProduct }).products
        );
        setTiers([
          {
            min_quantity: item.min_quantity,
            max_quantity: item.max_quantity,
            price_ht: (item as unknown as { price_ht: number }).price_ht,
            discount_rate: (item.discount_rate ?? 0) * 100,
            margin_rate: (item.margin_rate ?? 0) * 100,
            valid_from: item.valid_from ?? '',
            valid_until: item.valid_until ?? '',
            is_active: item.is_active,
            notes: item.notes ?? '',
          },
        ]);
        setShowProductSearch(false);
      }
    }
  }, [itemId, existingItems]);

  const handleSelectProduct = (product: SelectedProduct) => {
    setSelectedProduct(product);
    setShowProductSearch(false);
    setTiers([{ ...DEFAULT_TIER, price_ht: product.price_ht ?? 0 }]);
  };

  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const nextMinQty = lastTier.max_quantity
      ? lastTier.max_quantity + 1
      : lastTier.min_quantity + 10;

    setTiers([
      ...tiers,
      {
        min_quantity: nextMinQty,
        max_quantity: null,
        price_ht: lastTier.price_ht * 0.95,
        discount_rate: 0,
        margin_rate: 0,
        valid_from: lastTier.valid_from,
        valid_until: lastTier.valid_until,
        is_active: true,
        notes: '',
      },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const handleTierChange = (
    index: number,
    field: keyof TierForm,
    value: TierForm[keyof TierForm]
  ) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setProductSearchTerm('');
    setShowProductSearch(true);
    setTiers([DEFAULT_TIER]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert('Veuillez sélectionner un produit');
      return;
    }

    for (const tier of tiers) {
      if (tier.min_quantity < 1) {
        alert('La quantité minimum doit être au moins 1');
        return;
      }
      if (tier.max_quantity !== null && tier.max_quantity < tier.min_quantity) {
        alert('La quantité maximum doit être supérieure à la quantité minimum');
        return;
      }
      if (tier.price_ht <= 0) {
        alert('Le prix doit être supérieur à 0');
        return;
      }
    }

    const sortedTiers = [...tiers].sort(
      (a, b) => a.min_quantity - b.min_quantity
    );

    if (isEditMode && itemId) {
      const tier = sortedTiers[0];
      updateItem(
        {
          itemId,
          priceListId,
          data: {
            cost_price: tier.price_ht,
            discount_rate:
              tier.discount_rate > 0 ? tier.discount_rate / 100 : undefined,
            min_quantity: tier.min_quantity,
            max_quantity: tier.max_quantity ?? undefined,
            margin_rate:
              tier.margin_rate > 0 ? tier.margin_rate / 100 : undefined,
            valid_from: tier.valid_from ?? undefined,
            valid_until: tier.valid_until ?? undefined,
            is_active: tier.is_active,
            notes: tier.notes ?? undefined,
          },
        },
        {
          onSuccess: () => {
            onClose();
            resetForm();
          },
        }
      );
    } else {
      let successCount = 0;
      const totalTiers = sortedTiers.length;

      for (const tier of sortedTiers) {
        await new Promise<void>(resolve => {
          createItem(
            {
              price_list_id: priceListId,
              product_id: selectedProduct.id,
              cost_price: tier.price_ht,
              discount_rate:
                tier.discount_rate > 0 ? tier.discount_rate / 100 : undefined,
              min_quantity: tier.min_quantity,
              max_quantity: tier.max_quantity ?? undefined,
              margin_rate:
                tier.margin_rate > 0 ? tier.margin_rate / 100 : undefined,
              currency,
              valid_from: tier.valid_from ?? undefined,
              valid_until: tier.valid_until ?? undefined,
              is_active: tier.is_active,
              notes: tier.notes ?? undefined,
            },
            {
              onSuccess: () => {
                successCount++;
                if (successCount === totalTiers) {
                  onClose();
                  resetForm();
                }
                resolve();
              },
              onError: () => {
                resolve();
              },
            }
          );
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-6xl md:max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? 'Modifier le palier de prix'
              : 'Ajouter un produit avec paliers'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifiez les paramètres du palier de prix'
              : 'Configurez les paliers de prix manuellement pour ce produit'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => void handleSubmit(e)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Product Selection */}
            {showProductSearch && !isEditMode && (
              <PriceProductSelector
                searchTerm={productSearchTerm}
                onSearchChange={setProductSearchTerm}
                products={products}
                onSelect={handleSelectProduct}
              />
            )}

            {/* Selected Product Info */}
            {selectedProduct && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        {selectedProduct.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        SKU:{' '}
                        <span className="font-mono">{selectedProduct.sku}</span>{' '}
                        • Prix catalogue:{' '}
                        <span className="font-medium">
                          {formatCurrency(selectedProduct.price_ht)}
                        </span>
                      </p>
                    </div>
                    {!isEditMode && (
                      <ButtonV2
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(null);
                          setShowProductSearch(true);
                        }}
                      >
                        Changer
                      </ButtonV2>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tiers Configuration */}
            {selectedProduct && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {isEditMode
                        ? 'Paramètres du Palier'
                        : '2. Configurer les Paliers de Prix'}
                    </CardTitle>
                    {!isEditMode && (
                      <ButtonV2
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddTier}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter Palier
                      </ButtonV2>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tiers.map((tier, index) => (
                      <PriceTierForm
                        key={index}
                        tier={tier}
                        index={index}
                        currency={currency}
                        isEditMode={isEditMode}
                        tiersCount={tiers.length}
                        onChange={handleTierChange}
                        onRemove={handleRemoveTier}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 md:flex-row md:justify-end pt-4 border-t">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={isLoading ?? !selectedProduct}
              className="w-full md:w-auto"
            >
              {isLoading
                ? 'Enregistrement...'
                : isEditMode
                  ? 'Mettre à jour'
                  : `Créer ${tiers.length} palier${tiers.length > 1 ? 's' : ''}`}
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
