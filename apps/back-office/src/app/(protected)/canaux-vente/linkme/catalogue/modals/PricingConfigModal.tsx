'use client';

import {
  ButtonV2,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@verone/ui';
import { Loader2, Plus } from 'lucide-react';

import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import type { UseMutationResult } from '@tanstack/react-query';
import type { AddProductWithPricing } from '../../hooks/use-linkme-catalog';

interface PricingConfigModalProps {
  open: boolean;
  onClose: () => void;
  pendingProducts: SelectedProduct[];
  pricingConfig: Record<
    string,
    { customPriceHt: string; commissionRate: string }
  >;
  onPricingConfigChange: (
    updater: (
      prev: Record<string, { customPriceHt: string; commissionRate: string }>
    ) => Record<string, { customPriceHt: string; commissionRate: string }>
  ) => void;
  allPricesValid: boolean;
  addProductsMutation: UseMutationResult<
    number,
    Error,
    AddProductWithPricing[],
    unknown
  >;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function PricingConfigModal({
  open,
  onClose,
  pendingProducts,
  pricingConfig,
  onPricingConfigChange,
  allPricesValid,
  addProductsMutation,
  onConfirm,
  onCancel,
}: PricingConfigModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurer les prix LinkMe</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Définissez le prix de vente HT pour chaque produit avant de
            l&apos;ajouter au catalogue.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {pendingProducts.map(product => (
            <Card key={product.id} className="p-4">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  {product.sku && (
                    <p className="text-xs text-muted-foreground">
                      REF: {product.sku}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`price-${product.id}`}>
                      Prix de vente HT *
                    </Label>
                    <div className="relative">
                      <Input
                        id={`price-${product.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={pricingConfig[product.id]?.customPriceHt ?? ''}
                        onChange={e =>
                          onPricingConfigChange(prev => ({
                            ...prev,
                            [product.id]: {
                              ...prev[product.id],
                              customPriceHt: e.target.value,
                            },
                          }))
                        }
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        €
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`commission-${product.id}`}>
                      Commission LinkMe
                    </Label>
                    <div className="relative">
                      <Input
                        id={`commission-${product.id}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0"
                        value={pricingConfig[product.id]?.commissionRate ?? '0'}
                        onChange={e =>
                          onPricingConfigChange(prev => ({
                            ...prev,
                            [product.id]: {
                              ...prev[product.id],
                              commissionRate: e.target.value,
                            },
                          }))
                        }
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ButtonV2 variant="outline" onClick={onCancel}>
            Annuler
          </ButtonV2>
          <ButtonV2
            disabled={!allPricesValid || addProductsMutation.isPending}
            onClick={() => {
              void onConfirm().catch((error: unknown) => {
                console.error('[LinkMeCatalogue] Add products failed:', error);
              });
            }}
          >
            {addProductsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter au catalogue
              </>
            )}
          </ButtonV2>
        </div>
      </DialogContent>
    </Dialog>
  );
}
