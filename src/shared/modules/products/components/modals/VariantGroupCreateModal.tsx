'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

import { ExternalLink } from 'lucide-react';

import { ButtonV2 } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { normalizeForSKU } from '@/lib/sku-generator';
import { useSubcategories } from '@/shared/modules/common/hooks';
import { useOrganisations } from '@/shared/modules/common/hooks';
import type { CreateVariantGroupData } from '@verone/types';

interface VariantGroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVariantGroupData) => Promise<void>;
}

const DIMENSION_UNITS = [
  { value: 'cm', label: 'Centimètres (cm)' },
  { value: 'm', label: 'Mètres (m)' },
  { value: 'mm', label: 'Millimètres (mm)' },
  { value: 'in', label: 'Pouces (in)' },
] as const;

export function VariantGroupCreateModal({
  isOpen,
  onClose,
  onSubmit,
}: VariantGroupCreateModalProps) {
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
  const [hasCommonSupplier, setHasCommonSupplier] = useState(false);
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-générer base_sku quand le nom change
  useEffect(() => {
    if (name.trim()) {
      const generatedSku = normalizeForSKU(name, 30);
      setBaseSku(generatedSku);
    }
  }, [name]);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setBaseSku('');
      setVariantType('color');
      setSubcategoryId('');
      setDimensionsLength(undefined);
      setDimensionsWidth(undefined);
      setDimensionsHeight(undefined);
      setDimensionsUnit('cm');
      setCommonWeight(undefined);
      setHasCommonWeight(false);
      setHasCommonSupplier(false);
      setSupplierId(undefined);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !baseSku.trim() || !subcategoryId) return;

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

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        base_sku: baseSku.trim(),
        variant_type: variantType,
        subcategory_id: subcategoryId,
        dimensions_length: dimensionsLength,
        dimensions_width: dimensionsWidth,
        dimensions_height: dimensionsHeight,
        dimensions_unit: dimensionsUnit,
        common_weight: hasCommonWeight ? commonWeight : null,
        has_common_weight: hasCommonWeight,
        has_common_supplier: hasCommonSupplier,
        supplier_id: hasCommonSupplier ? supplierId : null,
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un groupe de variantes</DialogTitle>
          <DialogDescription>
            Créez un groupe pour organiser les variantes de produits (couleurs,
            matières)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                Généré automatiquement depuis le nom. Pattern:{' '}
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

          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">
              Dimensions communes (optionnel)
            </Label>
            <p className="text-xs text-gray-600">
              Si tous les produits du groupe ont les mêmes dimensions
            </p>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="length" className="text-xs">
                  Longueur
                </Label>
                <Input
                  id="length"
                  type="number"
                  step="0.01"
                  value={dimensionsLength || ''}
                  onChange={e =>
                    setDimensionsLength(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="width" className="text-xs">
                  Largeur
                </Label>
                <Input
                  id="width"
                  type="number"
                  step="0.01"
                  value={dimensionsWidth || ''}
                  onChange={e =>
                    setDimensionsWidth(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="height" className="text-xs">
                  Hauteur
                </Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  value={dimensionsHeight || ''}
                  onChange={e =>
                    setDimensionsHeight(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="unit" className="text-xs">
                  Unité
                </Label>
                <select
                  id="unit"
                  value={dimensionsUnit}
                  onChange={e => setDimensionsUnit(e.target.value as any)}
                  className="mt-1 w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                >
                  {DIMENSION_UNITS.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-common-weight"
                checked={hasCommonWeight}
                onCheckedChange={checked => {
                  setHasCommonWeight(checked as boolean);
                  if (!checked) setCommonWeight(undefined);
                }}
              />
              <Label
                htmlFor="has-common-weight"
                className="text-sm font-medium cursor-pointer"
              >
                ⚖️ Même poids pour tous les produits
              </Label>
            </div>
            <p className="text-xs text-gray-600 ml-6">
              Si cochée, tous les produits du groupe hériteront automatiquement
              du poids saisi
            </p>

            {hasCommonWeight && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="common_weight" className="text-sm font-medium">
                  Poids commun <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-end space-x-2">
                  <Input
                    id="common_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={commonWeight || ''}
                    onChange={e =>
                      setCommonWeight(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 mb-2 min-w-[30px]">
                    kg
                  </span>
                </div>
                <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                  💡 Ce poids sera appliqué automatiquement à tous les produits
                  du groupe et ne pourra pas être modifié individuellement
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-common-supplier"
                checked={hasCommonSupplier}
                onCheckedChange={checked => {
                  setHasCommonSupplier(checked as boolean);
                  if (!checked) setSupplierId(undefined);
                }}
              />
              <Label
                htmlFor="has-common-supplier"
                className="text-sm font-medium cursor-pointer"
              >
                🏢 Même fournisseur pour tous les produits
              </Label>
            </div>
            <p className="text-xs text-gray-600 ml-6">
              Si cochée, tous les produits du groupe hériteront automatiquement
              du fournisseur sélectionné
            </p>

            {hasCommonSupplier && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="supplier" className="text-sm font-medium">
                  Fournisseur commun <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={supplierId}
                  onValueChange={setSupplierId}
                  disabled={suppliersLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {supplierId && (
                  <Link
                    href={`/contacts-organisations/suppliers/${supplierId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Voir la fiche détail du fournisseur
                  </Link>
                )}
                <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                  💡 Ce fournisseur sera appliqué automatiquement à tous les
                  produits du groupe et ne pourra pas être modifié
                  individuellement
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={
                !name.trim() ||
                !baseSku.trim() ||
                !subcategoryId ||
                isSubmitting
              }
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? 'Création...' : 'Créer le groupe'}
            </ButtonV2>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
