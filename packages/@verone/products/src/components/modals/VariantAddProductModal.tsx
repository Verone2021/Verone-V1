/* eslint-disable @typescript-eslint/no-misused-promises, @typescript-eslint/prefer-nullish-coalescing */
'use client';

import { useState, useEffect } from 'react';

import { Check, AlertCircle, ArrowRight, Lock } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Label } from '@verone/ui';
import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import type { AddProductToGroupData, VariantGroup } from '@verone/types';
import { MATERIAL_OPTIONS, type ProductMaterial } from '@verone/types';
import { DynamicColorSelector } from '@verone/ui-business/components/selectors/DynamicColorSelector';

// =====================================================================
// SOUS-COMPOSANT — Chip hérité (pattern InheritanceRulesCard.tsx dupliqué)
// Duplication volontaire pour éviter couplage cross-package.
// =====================================================================

function InheritedFieldChip({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={
        active
          ? 'inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border border-blue-200 bg-blue-50 text-blue-700'
          : 'inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border border-neutral-200 bg-neutral-50 text-neutral-500 opacity-50'
      }
    >
      {active && <Lock className="h-2 w-2" />}
      {label}
    </span>
  );
}

// =====================================================================
// SOUS-COMPOSANT — Chips hérités du groupe
// Tags : Dimensions, Poids, Style décoratif, Pièces compatibles,
//        Prix de revient, Fournisseur, Sous-catégorie
// =====================================================================

function GroupInheritanceChips({ group }: { group: VariantGroup }) {
  const hasDimensions =
    !!group.dimensions_length ||
    !!group.dimensions_width ||
    !!group.dimensions_height;

  const chips: Array<{ label: string; active: boolean }> = [
    { label: 'Dimensions', active: hasDimensions },
    {
      label: 'Poids',
      active: !!group.common_weight && !!group.has_common_weight,
    },
    { label: 'Style décoratif', active: !!group.style },
    {
      label: 'Pièces compatibles',
      active: !!(group.suitable_rooms && group.suitable_rooms.length > 0),
    },
    {
      label: 'Prix de revient',
      active: !!group.has_common_cost_price && group.common_cost_price != null,
    },
    {
      label: 'Fournisseur',
      active: !!group.has_common_supplier && !!group.supplier_id,
    },
    {
      label: 'Matière',
      active: !!group.has_common_material && !!group.common_material,
    },
    {
      label: 'Couleur',
      active: !!group.has_common_color && !!group.common_color,
    },
    { label: 'Sous-catégorie', active: !!group.subcategory_id },
  ];

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1.5">
        Hérités du groupe
      </p>
      <div className="flex flex-wrap gap-1.5">
        {chips.map(chip => (
          <InheritedFieldChip
            key={chip.label}
            label={chip.label}
            active={chip.active}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

interface VariantAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddProductToGroupData) => Promise<void>;
  group: VariantGroup | null;
}

export function VariantAddProductModal({
  isOpen,
  onClose,
  onSubmit,
  group,
}: VariantAddProductModalProps) {
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null);

  // Couleur : string (nom) pour DynamicColorSelector (compatible avec l'API du composant)
  const [colorName, setColorName] = useState('');
  // Matière : enum strict ProductMaterial
  const [material, setMaterial] = useState<ProductMaterial | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aperçu du nom : "Groupe - Couleur" ou "Groupe - Matière" ou les deux
  const nameParts = [colorName, material].filter(Boolean);
  const newName =
    selectedProduct && nameParts.length > 0
      ? `${group?.name ?? ''} - ${nameParts.join(', ')}`
      : (group?.name ?? '');

  // Résolution hiérarchique de la sous-catégorie depuis les données déjà présentes
  const subcategoryPath = (() => {
    if (!group?.subcategory) return null;
    const cat = group.subcategory.category?.name;
    const subcat = group.subcategory.name;
    if (cat && subcat) return `${cat} > ${subcat}`;
    return subcat ?? null;
  })();

  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null);
      setColorName('');
      setMaterial('');
      setShowProductSelector(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProduct?.variant_attributes) {
      const attrs = selectedProduct.variant_attributes as Record<
        string,
        string | undefined
      >;
      setColorName(attrs.color ?? attrs.color_name ?? '');
      const rawMaterial = attrs.material ?? '';
      // Valider que c'est bien une valeur de l'enum
      const isValidMat = MATERIAL_OPTIONS.some(o => o.value === rawMaterial);
      setMaterial(isValidMat ? (rawMaterial as ProductMaterial) : '');
    }
  }, [selectedProduct]);

  // Auto-fill couleur depuis common_color du groupe si has_common_color
  useEffect(() => {
    if (group?.has_common_color && group.common_color) {
      setColorName(group.common_color);
    }
  }, [group?.has_common_color, group?.common_color]);

  // Auto-fill matière depuis common_material du groupe si has_common_material
  useEffect(() => {
    if (group?.has_common_material && group.common_material) {
      const isValid = MATERIAL_OPTIONS.some(
        o => o.value === group.common_material
      );
      if (isValid) {
        setMaterial(group.common_material as ProductMaterial);
      }
    }
  }, [group?.has_common_material, group?.common_material]);

  const handleProductSelect = (products: SelectedProduct[]) => {
    if (products.length > 0) {
      setSelectedProduct(products[0]);
      setShowProductSelector(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation selon variant_type
    const vt = group?.variant_type ?? 'color';
    const cLocked = !!group?.has_common_color && !!group?.common_color;
    const mLocked = !!group?.has_common_material && !!group?.common_material;
    if (!selectedProduct) return;
    if (vt === 'color' && !colorName && !cLocked) return;
    if (vt === 'material' && !material && !mLocked) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        product_id: selectedProduct.id,
        variant_group_id: group?.id ?? '',
      });
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'ajout du produit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) return null;

  // Logique conditionnelle selon variant_type du groupe
  const variantType = group.variant_type ?? 'color';
  const isColorVariant = variantType === 'color';
  const isMaterialVariant = variantType === 'material';
  // Si la propriété est commune au groupe, on la verrouille (lock)
  const colorLocked = !!group.has_common_color && !!group.common_color;
  const materialLocked = !!group.has_common_material && !!group.common_material;

  return (
    <>
      <Dialog open={isOpen && !showProductSelector} onOpenChange={onClose}>
        <DialogContent className="h-screen md:h-auto max-w-full md:max-w-3xl md:max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Ajouter un produit au groupe</DialogTitle>
            <DialogDescription>
              Groupe : <strong>{group.name}</strong> • {group.subcategory?.name}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto space-y-6 pb-2">
              {/* ========================================================
                  CHIPS HÉRITÉS — toujours visibles en haut du modal
              ======================================================== */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <GroupInheritanceChips group={group} />
              </div>

              <div className="space-y-4">
                {/* ==================================================
                    SÉLECTEUR PRODUIT
                ================================================== */}
                <div>
                  <Label htmlFor="product" className="text-sm font-medium">
                    Produit à ajouter *
                  </Label>
                  {selectedProduct ? (
                    <div className="mt-2 p-4 border border-gray-300 rounded-md flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {selectedProduct.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedProduct.sku}
                        </div>
                      </div>
                      <ButtonV2
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProduct(null)}
                      >
                        Changer
                      </ButtonV2>
                    </div>
                  ) : (
                    <ButtonV2
                      type="button"
                      variant="outline"
                      onClick={() => setShowProductSelector(true)}
                      className="mt-2 w-full min-h-[44px] md:min-h-0"
                    >
                      Sélectionner un produit
                    </ButtonV2>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    Seuls les produits de la sous-catégorie &ldquo;
                    {group.subcategory?.name}&rdquo; sans groupe de variantes
                    sont disponibles
                  </p>
                </div>

                {selectedProduct && (
                  <>
                    {/* ==================================================
                        COULEUR + MATIÈRE — adaptation selon variant_type
                        - Champ qui VARIE (selon variant_type) : obligatoire
                        - Champ COMMUN : verrouillé (lock) si has_common_X=true
                    ================================================== */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label
                          htmlFor="color"
                          className="text-sm font-medium block mb-1 flex items-center gap-1"
                        >
                          Couleur
                          {isColorVariant && (
                            <span className="text-red-500">*</span>
                          )}
                          {colorLocked && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1 py-0.5">
                              <Lock className="h-2 w-2" />
                              Hérité du groupe
                            </span>
                          )}
                        </Label>
                        <div className="min-h-[44px] md:min-h-0">
                          {colorLocked ? (
                            <div className="px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-sm text-blue-900">
                              {group.common_color}
                            </div>
                          ) : (
                            <DynamicColorSelector
                              value={colorName}
                              onChange={setColorName}
                              placeholder={
                                isColorVariant
                                  ? 'Rechercher ou créer une couleur...'
                                  : 'Optionnel — couleur de cette variante'
                              }
                            />
                          )}
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="material"
                          className="text-sm font-medium block mb-1 flex items-center gap-1"
                        >
                          Matière
                          {isMaterialVariant && (
                            <span className="text-red-500">*</span>
                          )}
                          {materialLocked && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1 py-0.5">
                              <Lock className="h-2 w-2" />
                              Hérité du groupe
                            </span>
                          )}
                        </Label>
                        {materialLocked ? (
                          <div className="min-h-[44px] md:min-h-0 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-sm text-blue-900">
                            {MATERIAL_OPTIONS.find(
                              o => o.value === group.common_material
                            )?.label ?? group.common_material}
                          </div>
                        ) : (
                          <select
                            id="material"
                            value={material}
                            onChange={e =>
                              setMaterial(
                                (e.target.value as ProductMaterial | '') ?? ''
                              )
                            }
                            className="w-full min-h-[44px] md:min-h-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">
                              {isMaterialVariant
                                ? '— Sélectionner une matière —'
                                : '— Aucune matière —'}
                            </option>
                            {MATERIAL_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {((isColorVariant && !colorName && !colorLocked) ||
                      (isMaterialVariant && !material && !materialLocked)) && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-900">
                          <p className="font-medium">
                            {isColorVariant
                              ? 'Couleur requise'
                              : 'Matière requise'}
                          </p>
                          <p className="text-xs mt-1">
                            Le type de variante du groupe est{' '}
                            <strong>{variantType}</strong> — cette propriété est
                            obligatoire pour cette variante.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ==================================================
                        APERÇU NOM
                    ================================================== */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-blue-900 flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        Aperçu des modifications
                      </h4>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Nom actuel :</span>
                          <Badge variant="outline">
                            {selectedProduct.name}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-center py-1">
                          <ArrowRight className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Nouveau nom :</span>
                          <Badge className="bg-blue-600 text-white">
                            {newName}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* ==================================================
                        PROPRIÉTÉS CONSERVÉES
                    ================================================== */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">
                        Propriétés conservées
                      </h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>✓ Prix de vente et coût</li>
                        <li>✓ Descriptions (technique, commerciale)</li>
                        <li>✓ Images et photos</li>
                        <li>✓ Stock et inventaire</li>
                        <li>✓ Fournisseur et références</li>
                      </ul>
                    </div>

                    {/* ==================================================
                        PROPRIÉTÉS SYNCHRONISÉES DU GROUPE
                    ================================================== */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Propriétés synchronisées du groupe
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {subcategoryPath && (
                          <li>→ Catégorisation : {subcategoryPath}</li>
                        )}
                        {!subcategoryPath && group.subcategory?.name && (
                          <li>→ Sous-catégorie : {group.subcategory.name}</li>
                        )}
                        {(group.dimensions_length ||
                          group.dimensions_width ||
                          group.dimensions_height) && (
                          <li>
                            → Dimensions : {group.dimensions_length || 0} ×{' '}
                            {group.dimensions_width || 0} ×{' '}
                            {group.dimensions_height || 0}{' '}
                            {group.dimensions_unit}
                          </li>
                        )}
                        {group.has_common_weight && group.common_weight && (
                          <li>→ Poids commun : {group.common_weight} kg</li>
                        )}
                        {group.has_common_cost_price &&
                          group.common_cost_price != null && (
                            <li>
                              → Prix d&apos;achat commun :{' '}
                              {group.common_cost_price.toFixed(2)} €
                            </li>
                          )}
                        {group.has_common_supplier && group.supplier && (
                          <li>→ Fournisseur : {group.supplier.name}</li>
                        )}
                        {group.has_common_material && group.common_material && (
                          <li>
                            → Matière commune :{' '}
                            {MATERIAL_OPTIONS.find(
                              o => o.value === group.common_material
                            )?.label ?? group.common_material}
                          </li>
                        )}
                        {group.has_common_color && group.common_color && (
                          <li>→ Couleur commune : {group.common_color}</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 md:flex-row">
              <ButtonV2
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                Annuler
              </ButtonV2>
              <ButtonV2
                type="submit"
                disabled={
                  !selectedProduct ||
                  (isColorVariant && !colorName && !colorLocked) ||
                  (isMaterialVariant && !material && !materialLocked) ||
                  isSubmitting
                }
                className="w-full md:w-auto bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? 'Ajout en cours...' : 'Ajouter au groupe'}
              </ButtonV2>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* UniversalProductSelectorV2 — Filtre par subcategory_id */}
      {showProductSelector && group && (
        <UniversalProductSelectorV2
          open={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          onSelect={handleProductSelect}
          mode="single"
          context="variants"
          title="Sélectionner un produit pour le groupe de variantes"
          description={`Groupe : ${group.name} • ${group.subcategory?.name}`}
          showQuantity={false}
          showPricing={false}
          showImages
        />
      )}
    </>
  );
}
