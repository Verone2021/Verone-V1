'use client';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Search, Package, Plus, CheckCircle } from 'lucide-react';

import { ProductMarginEditor } from '../../ProductMarginEditor';
import type {
  CatalogProduct,
  SelectedProduct,
  SelectionFormData,
} from '../types';

interface CreateSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliates: { id: string; display_name: string }[];
  formData: SelectionFormData;
  onFormDataChange: (data: Partial<SelectionFormData>) => void;
  selectedProducts: SelectedProduct[];
  filteredCatalogProducts: CatalogProduct[];
  productSearch: string;
  onProductSearchChange: (value: string) => void;
  marginValidationErrors: string[];
  hasValidationErrors: boolean;
  saving: boolean;
  onAddProduct: (product: CatalogProduct) => void;
  onRemoveProduct: (productId: string) => void;
  onUpdateMargin: (productId: string, marginRate: number) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

export function CreateSelectionModal({
  open,
  onOpenChange,
  affiliates,
  formData,
  onFormDataChange,
  selectedProducts,
  filteredCatalogProducts,
  productSearch,
  onProductSearchChange,
  marginValidationErrors,
  hasValidationErrors,
  saving,
  onAddProduct,
  onRemoveProduct,
  onUpdateMargin,
  onSubmit,
  onCancel,
}: CreateSelectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une sélection</DialogTitle>
          <DialogDescription>
            Créez une mini-boutique pour un affilié avec une sélection de
            produits
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Affilié */}
          <div className="grid gap-2">
            <Label>Affilié *</Label>
            <Select
              value={formData.affiliate_id}
              onValueChange={value => onFormDataChange({ affiliate_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un affilié" />
              </SelectTrigger>
              <SelectContent>
                {affiliates.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Aucun affilié actif
                  </SelectItem>
                ) : (
                  affiliates.map(affiliate => (
                    <SelectItem key={affiliate.id} value={affiliate.id}>
                      {affiliate.display_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Nom de la sélection */}
          <div className="grid gap-2">
            <Label htmlFor="selection_name">Nom de la sélection *</Label>
            <Input
              id="selection_name"
              value={formData.name}
              onChange={e => onFormDataChange({ name: e.target.value })}
              placeholder="Ex: Collection Été 2024"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="selection_description">Description</Label>
            <Input
              id="selection_description"
              value={formData.description}
              onChange={e => onFormDataChange({ description: e.target.value })}
              placeholder="Description courte de la sélection..."
            />
          </div>

          {/* Sélection de produits */}
          <div className="grid gap-2">
            <Label>Produits ({selectedProducts.length} sélectionné(s)) *</Label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit du catalogue..."
                value={productSearch}
                onChange={e => onProductSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedProducts.length > 0 && (
              <div className="border rounded-md p-3 bg-blue-50 space-y-2">
                <p className="text-sm font-medium text-blue-800">
                  Produits dans la sélection :
                </p>
                {selectedProducts.map(product => (
                  <ProductMarginEditor
                    key={product.product_id}
                    product={product}
                    onMarginChange={onUpdateMargin}
                    onRemove={onRemoveProduct}
                    compact
                  />
                ))}
              </div>
            )}

            <div className="max-h-48 overflow-y-auto border rounded-md">
              {filteredCatalogProducts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {productSearch
                    ? 'Aucun produit trouvé'
                    : 'Chargement du catalogue...'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredCatalogProducts.slice(0, 20).map(product => {
                    const isSelected = selectedProducts.some(
                      p => p.product_id === product.product_id
                    );
                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={isSelected}
                        onClick={() => onAddProduct(product)}
                        className={`w-full p-3 text-left flex items-center gap-3 transition-colors ${
                          isSelected
                            ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product.product_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Réf: {product.product_reference} | Prix:{' '}
                            {product.product_price_ht.toFixed(2)}€ | Marge
                            suggérée: {product.suggested_margin_rate}%
                          </p>
                        </div>
                        {isSelected ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Plus className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {hasValidationErrors && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mx-6 mb-4">
            <p className="text-sm font-medium text-red-800 mb-2">
              Erreurs de validation des marges :
            </p>
            <ul className="text-xs text-red-700 space-y-1">
              {marginValidationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <ButtonV2 variant="outline" onClick={onCancel}>
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={() => {
              void onSubmit().catch(error => {
                console.error(
                  '[SelectionsSection] Create selection failed:',
                  error
                );
              });
            }}
            disabled={
              saving ||
              !formData.affiliate_id ||
              !formData.name.trim() ||
              selectedProducts.length === 0 ||
              hasValidationErrors
            }
          >
            {saving
              ? 'Création...'
              : hasValidationErrors
                ? 'Corrigez les marges'
                : `Créer (${selectedProducts.length} produit${selectedProducts.length > 1 ? 's' : ''})`}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
