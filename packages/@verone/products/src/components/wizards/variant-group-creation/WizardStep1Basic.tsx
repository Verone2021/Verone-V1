'use client';

import { useState } from 'react';

import { X, User } from 'lucide-react';

import { Input, Label, ButtonV2 } from '@verone/ui';
import { CategoryHierarchySelector } from '@verone/categories';
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';

// =====================================================================
// TYPES
// =====================================================================

export interface MatrixProductInfo {
  id: string;
  name: string;
  sku: string;
  subcategory_id: string | null;
  variant_group_id: string | null;
  variant_group_name: string | null;
  variant_group_base_sku: string | null;
}

export interface WizardStep1BasicProps {
  name: string;
  baseSku: string;
  subcategoryId: string;
  matrixProduct: MatrixProductInfo | null;
  onUpdate: (updates: Record<string, unknown>) => void;
  onMatrixProductChange: (product: MatrixProductInfo | null) => void;
}

// =====================================================================
// HELPER
// =====================================================================

/**
 * Dérive le base_sku depuis le SKU d'un produit témoin.
 * - Si parentGroupBaseSku non nul/vide → le retourner
 * - Sinon split('-') : si >= 2 segments → tout sauf le dernier
 * - Sinon → SKU complet
 */
export function deriveBaseSku(
  productSku: string,
  parentGroupBaseSku?: string | null
): string {
  if (parentGroupBaseSku) return parentGroupBaseSku;
  const segments = productSku.split('-');
  if (segments.length >= 2) return segments.slice(0, -1).join('-');
  return productSku;
}

// =====================================================================
// COMPOSANT
// =====================================================================

export function WizardStep1Basic({
  name,
  baseSku,
  subcategoryId,
  matrixProduct,
  onUpdate,
  onMatrixProductChange,
}: WizardStep1BasicProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleProductSelect = (products: SelectedProduct[]) => {
    const selected = products[0];
    if (!selected) return;

    // Vérification : le produit ne doit pas déjà appartenir à un groupe
    // La vérification se fait dans le Wizard parent via onMatrixProductChange
    // qui a accès au refetch. Ici on délègue immédiatement.
    const info: MatrixProductInfo = {
      id: selected.id,
      name: selected.name,
      sku: selected.sku ?? '',
      subcategory_id: selected.subcategory_id ?? null,
      // Ces valeurs seront enrichies par le wizard parent après refetch
      variant_group_id: null,
      variant_group_name: null,
      variant_group_base_sku: null,
    };
    onMatrixProductChange(info);
  };

  const handleRemoveMatrixProduct = () => {
    onMatrixProductChange(null);
  };

  return (
    <div className="space-y-4 py-4">
      {/* ===== BLOC PRODUIT TEMOIN ===== */}
      <div className="rounded-md border border-dashed border-gray-300 p-3 space-y-2">
        <p className="text-xs font-medium text-gray-600">
          Produit témoin (optionnel) — pré-remplit Nom, SKU et sous-catégorie
        </p>

        {matrixProduct ? (
          <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {matrixProduct.name}
              </p>
              <p className="text-xs text-gray-500 font-mono truncate">
                {matrixProduct.sku}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              <ButtonV2
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPickerOpen(true)}
              >
                Changer
              </ButtonV2>
              <ButtonV2
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveMatrixProduct}
              >
                <X className="h-4 w-4" />
              </ButtonV2>
            </div>
          </div>
        ) : (
          <ButtonV2
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setPickerOpen(true)}
          >
            <User className="h-4 w-4 mr-2" />
            Sélectionner un produit témoin
          </ButtonV2>
        )}
      </div>

      {/* ===== NOM DU GROUPE ===== */}
      <div>
        <Label className="text-sm font-medium">
          Nom du groupe <span className="text-red-500">*</span>
        </Label>
        <Input
          value={name}
          onChange={e => {
            onUpdate({ name: e.target.value });
          }}
          placeholder="Ex: Vase Eleonore, Table Oslo..."
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Le nom du groupe sera le préfixe de tous les produits
        </p>
      </div>

      {/* ===== SKU DE BASE ===== */}
      <div>
        <Label className="text-sm font-medium">
          SKU de base <span className="text-red-500">*</span>
        </Label>
        <Input
          value={baseSku}
          onChange={e => onUpdate({ base_sku: e.target.value })}
          placeholder="VAS-ELE"
          className="mt-1 font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          Préfixe SKU auto-généré. Les variantes seront VAS-ELE-001,
          VAS-ELE-002...
        </p>
      </div>

      {/* ===== SOUS-CATEGORIE ===== */}
      <div>
        <CategoryHierarchySelector
          value={subcategoryId || undefined}
          onChange={subcatId => {
            onUpdate({ subcategory_id: subcatId ?? '' });
          }}
          placeholder="Sélectionner une sous-catégorie"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Catégorie commune à tous les produits du groupe
        </p>
      </div>

      {/* ===== SELECTOR PRODUIT TEMOIN (modal) ===== */}
      {pickerOpen && (
        <UniversalProductSelectorV2
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handleProductSelect}
          mode="single"
          context="variants"
          title="Sélectionner un produit témoin"
          description="Le produit choisi servira à pré-remplir Nom, SKU et sous-catégorie."
          showQuantity={false}
          showPricing={false}
          showImages
        />
      )}
    </div>
  );
}
