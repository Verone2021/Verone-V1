'use client';

import { useState, useEffect } from 'react';

import { useSubcategories } from '@verone/categories/hooks';
import { useOrganisations } from '@verone/organisations/hooks';
import type { VariantGroup, UpdateVariantGroupData } from '@verone/types';
import { Button } from '@verone/ui';
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

import { normalizeForSKU } from '@verone/products/utils';

import { VariantGroupDimensionsSection } from './variant-group-edit/VariantGroupDimensionsSection';
import { VariantGroupCommonPropsSection } from './variant-group-edit/VariantGroupCommonPropsSection';
import { VariantGroupStyleSupplierSection } from './variant-group-edit/VariantGroupStyleSupplierSection';

interface VariantGroupEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupId: string, data: UpdateVariantGroupData) => Promise<void>;
  group: VariantGroup | null;
}

export function VariantGroupEditModal({
  isOpen,
  onClose,
  onSubmit,
  group,
}: VariantGroupEditModalProps) {
  const { subcategories, loading: subcategoriesLoading } = useSubcategories();
  const { organisations: suppliers, loading: suppliersLoading } =
    useOrganisations({
      type: 'supplier',
      is_active: true,
    });

  const [name, setName] = useState('');
  const [baseSku, setBaseSku] = useState('');
  const [variantType, setVariantType] = useState<'color' | 'material'>('color');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [dimensionsLength, setDimensionsLength] = useState<
    number | undefined
  >();
  const [dimensionsWidth, setDimensionsWidth] = useState<number | undefined>();
  const [dimensionsHeight, setDimensionsHeight] = useState<
    number | undefined
  >();
  const [dimensionsUnit, setDimensionsUnit] = useState<
    'cm' | 'm' | 'mm' | 'in'
  >('cm');
  const [commonWeight, setCommonWeight] = useState<number | undefined>();
  const [hasCommonWeight, setHasCommonWeight] = useState(false);
  const [commonCostPrice, setCommonCostPrice] = useState<number | undefined>();
  const [hasCommonCostPrice, setHasCommonCostPrice] = useState(false);
  const [commonEcoTax, setCommonEcoTax] = useState<number>(0); // ✅ Éco-taxe commune (liée au prix d'achat)
  const [style, setStyle] = useState<string>('');
  const [suitableRooms, setSuitableRooms] = useState<string[]>([]);
  const [hasCommonSupplier, setHasCommonSupplier] = useState(false);
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser les valeurs du formulaire quand le groupe change
  useEffect(() => {
    if (group && isOpen) {
      setName(group.name ?? '');
      setBaseSku(group.base_sku ?? '');
      setVariantType(group.variant_type ?? 'color');
      setSubcategoryId(group.subcategory_id ?? '');

      // Dimensions communes (colonnes séparées)
      setDimensionsLength(group.dimensions_length ?? undefined);
      setDimensionsWidth(group.dimensions_width ?? undefined);
      setDimensionsHeight(group.dimensions_height ?? undefined);
      setDimensionsUnit(group.dimensions_unit ?? 'cm');

      // Poids commun
      setCommonWeight(group.common_weight ?? undefined);
      setHasCommonWeight(group.has_common_weight ?? false);

      // Prix d'achat commun
      setCommonCostPrice(group.common_cost_price ?? undefined);
      setHasCommonCostPrice(group.has_common_cost_price ?? false);

      // Éco-taxe commune (liée au prix d'achat)
      setCommonEcoTax(group.common_eco_tax ?? 0);

      // Style décoratif
      setStyle(group.style ?? '');

      // Pièces compatibles
      setSuitableRooms(group.suitable_rooms ?? []);

      // Fournisseur commun
      setHasCommonSupplier(group.has_common_supplier ?? false);
      setSupplierId(group.supplier_id ?? undefined);
    }
  }, [group, isOpen]);

  // Auto-générer base_sku quand le nom change
  useEffect(() => {
    if (name.trim() && name !== group?.name) {
      const generatedSku = normalizeForSKU(name, 30);
      setBaseSku(generatedSku);
    }
  }, [name, group?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !name.trim() || !baseSku.trim() || !subcategoryId) return;

    // Validation: si fournisseur commun coché, un fournisseur doit être sélectionné
    if (hasCommonSupplier && !supplierId) {
      alert(
        'Veuillez sélectionner un fournisseur ou décocher la case "Même fournisseur pour tous les produits"'
      );
      return;
    }

    // Validation: si poids commun coché, un poids doit être saisi
    if (hasCommonWeight && !commonWeight) {
      alert(
        'Veuillez saisir un poids ou décocher la case "Même poids pour tous les produits"'
      );
      return;
    }

    // Validation: si prix d'achat commun coché, un prix doit être saisi
    if (hasCommonCostPrice && !commonCostPrice) {
      alert(
        'Veuillez saisir un prix d\'achat ou décocher la case "Même prix d\'achat pour tous les produits"'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Préparer les données
      const updateData: UpdateVariantGroupData = {
        name: name.trim(),
        base_sku: baseSku.trim(),
        variant_type: variantType,
        subcategory_id: subcategoryId,
        has_common_supplier: hasCommonSupplier,
        supplier_id: hasCommonSupplier ? (supplierId ?? null) : null,
      };

      // Dimensions communes en JSONB (format compatible avec products.dimensions)
      if (dimensionsLength && dimensionsWidth && dimensionsHeight) {
        updateData.common_dimensions = {
          length: dimensionsLength,
          width: dimensionsWidth,
          height: dimensionsHeight,
          unit: dimensionsUnit ?? 'cm',
        };
      } else {
        updateData.common_dimensions = null;
      }

      // Poids commun
      updateData.common_weight = hasCommonWeight
        ? (commonWeight ?? null)
        : null;
      updateData.has_common_weight = hasCommonWeight;

      // Prix d'achat commun
      updateData.common_cost_price = hasCommonCostPrice
        ? (commonCostPrice ?? null)
        : null;
      updateData.has_common_cost_price = hasCommonCostPrice;

      // Éco-taxe commune (liée au prix d'achat)
      updateData.common_eco_tax = hasCommonCostPrice ? commonEcoTax || 0 : null;

      // Style décoratif
      updateData.style = style ?? undefined;

      // Pièces compatibles
      updateData.suitable_rooms =
        suitableRooms.length > 0 ? suitableRooms : undefined;

      await onSubmit(group.id, updateData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification du groupe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-2xl md:max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Modifier le groupe de variantes</DialogTitle>
          <DialogDescription>
            Modifiez les informations du groupe. Les changements seront propagés
            aux produits du groupe.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            void handleSubmit(e).catch(console.error);
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Nom du groupe *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Chaise Design Scandinave"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  Ce nom sera la base pour tous les produits du groupe
                </p>
              </div>

              <div>
                <Label htmlFor="base_sku" className="text-sm font-medium">
                  SKU de base *
                </Label>
                <Input
                  id="base_sku"
                  value={baseSku}
                  onChange={e => setBaseSku(e.target.value)}
                  placeholder="Ex: CHAISE-DESIGN-SCANDI"
                  className="mt-1 font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  Pattern:{' '}
                  {baseSku ? `${baseSku}-[VARIANTE]` : 'BASE_SKU-[VARIANTE]'}
                </p>
              </div>

              <div>
                <Label htmlFor="variant_type" className="text-sm font-medium">
                  Type de variante *
                </Label>
                <select
                  id="variant_type"
                  value={variantType}
                  onChange={e =>
                    setVariantType(e.target.value as 'color' | 'material')
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
                  required
                >
                  <option value="color">🎨 Couleur</option>
                  <option value="material">🧵 Matériau</option>
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  Définit l'attribut principal qui différencie les produits du
                  groupe
                </p>
              </div>

              <div>
                <Label htmlFor="subcategory" className="text-sm font-medium">
                  Sous-catégorie *
                </Label>
                <select
                  id="subcategory"
                  value={subcategoryId}
                  onChange={e => setSubcategoryId(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
                  required
                  disabled={subcategoriesLoading}
                >
                  <option value="">Sélectionner une sous-catégorie</option>
                  {subcategories?.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.category?.name} → {sub.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  Tous les produits du groupe partageront cette sous-catégorie
                </p>
              </div>
            </div>

            <VariantGroupDimensionsSection
              dimensionsLength={dimensionsLength}
              setDimensionsLength={setDimensionsLength}
              dimensionsWidth={dimensionsWidth}
              setDimensionsWidth={setDimensionsWidth}
              dimensionsHeight={dimensionsHeight}
              setDimensionsHeight={setDimensionsHeight}
              dimensionsUnit={dimensionsUnit}
              setDimensionsUnit={setDimensionsUnit}
            />

            <VariantGroupCommonPropsSection
              hasCommonWeight={hasCommonWeight}
              setHasCommonWeight={setHasCommonWeight}
              commonWeight={commonWeight}
              setCommonWeight={setCommonWeight}
              hasCommonCostPrice={hasCommonCostPrice}
              setHasCommonCostPrice={setHasCommonCostPrice}
              commonCostPrice={commonCostPrice}
              setCommonCostPrice={setCommonCostPrice}
              commonEcoTax={commonEcoTax}
              setCommonEcoTax={setCommonEcoTax}
            />

            <VariantGroupStyleSupplierSection
              style={style}
              setStyle={setStyle}
              suitableRooms={suitableRooms}
              setSuitableRooms={setSuitableRooms}
              hasCommonSupplier={hasCommonSupplier}
              setHasCommonSupplier={setHasCommonSupplier}
              supplierId={supplierId}
              setSupplierId={setSupplierId}
              suppliers={suppliers}
              suppliersLoading={suppliersLoading}
            />
          </div>

          <DialogFooter className="flex-col gap-2 md:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                !name.trim() ||
                !baseSku.trim() ||
                !subcategoryId ||
                isSubmitting
              }
              className="w-full md:w-auto bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting
                ? 'Modification...'
                : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
