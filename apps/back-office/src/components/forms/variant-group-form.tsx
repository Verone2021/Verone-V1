'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

import Link from 'next/link';

import { COLLECTION_STYLE_OPTIONS } from '@verone/types';
import type { RoomType } from '@verone/types';
import type { VariantGroup, VariantType } from '@verone/types';
import { ButtonV2 } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { RoomMultiSelect } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { X, Plus, ExternalLink } from 'lucide-react';

import { useFamilies } from '@verone/categories';
import { useCategories } from '@verone/categories';
import { useSubcategories } from '@verone/categories';
import { useToast } from '@verone/common';
import { useOrganisations } from '@verone/organisations';
import { useVariantGroups } from '@verone/products';
import { normalizeForSKU } from '@verone/products/utils/sku-generator';

interface VariantGroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editingGroup?: VariantGroup | null;
}

interface FormData {
  name: string;
  base_sku: string;
  subcategory_id: string;
  variant_type: VariantType;
  // Attributs de catégorisation
  style: string;
  suitable_rooms: RoomType[];
  // Nouveaux champs pour attributs communs
  common_length: string;
  common_width: string;
  common_height: string;
  common_dimensions_unit: 'cm' | 'm';
  // Fournisseur commun
  has_common_supplier: boolean;
  supplier_id: string;
}

const DECORATIVE_STYLES = [
  {
    value: 'minimaliste',
    label: 'Minimaliste',
    description: 'Épuré et fonctionnel',
    icon: '⬜',
  },
  {
    value: 'contemporain',
    label: 'Contemporain',
    description: 'Moderne et actuel',
    icon: '🏙️',
  },
  {
    value: 'moderne',
    label: 'Moderne',
    description: 'Design avant-gardiste',
    icon: '🚀',
  },
  {
    value: 'scandinave',
    label: 'Scandinave',
    description: 'Chaleureux et lumineux',
    icon: '🌲',
  },
  {
    value: 'industriel',
    label: 'Industriel',
    description: 'Brut et authentique',
    icon: '⚙️',
  },
  {
    value: 'classique',
    label: 'Classique',
    description: 'Intemporel et élégant',
    icon: '👑',
  },
  {
    value: 'boheme',
    label: 'Bohème',
    description: 'Libre et éclectique',
    icon: '🌺',
  },
  {
    value: 'art_deco',
    label: 'Art Déco',
    description: 'Raffiné et géométrique',
    icon: '💎',
  },
] as const;

export function VariantGroupForm({
  isOpen,
  onClose,
  onSubmit,
  editingGroup,
}: VariantGroupFormProps) {
  const { toast } = useToast();
  const { createVariantGroup, updateVariantGroup } = useVariantGroups();

  // États du formulaire
  const [formData, setFormData] = useState<FormData>({
    name: '',
    base_sku: '',
    subcategory_id: '',
    variant_type: 'color',
    style: '',
    suitable_rooms: [],
    common_length: '',
    common_width: '',
    common_height: '',
    common_dimensions_unit: 'cm',
    has_common_supplier: false,
    supplier_id: '',
  });
  const [filters, setFilters] = useState({
    familyId: '',
    categoryId: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Hooks hiérarchie
  const { families } = useFamilies();
  const { getCategoriesByFamily } = useCategories();
  const { getSubcategoriesByCategory } = useSubcategories();
  const { organisations: suppliers, loading: suppliersLoading } =
    useOrganisations({
      type: 'supplier',
      is_active: true,
    });

  // Catégories et sous-catégories filtrées
  const filteredCategories = useMemo(() => {
    if (!filters.familyId) return [];
    return getCategoriesByFamily(filters.familyId);
  }, [filters.familyId, getCategoriesByFamily]);

  const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);

  // Charger sous-catégories quand catégorie change
  useEffect(() => {
    if (!filters.categoryId) {
      setFilteredSubcategories([]);
      return;
    }

    let isMounted = true;

    const loadSubcategories = async () => {
      try {
        const subcats = await getSubcategoriesByCategory(filters.categoryId);
        if (isMounted) {
          setFilteredSubcategories(subcats);
        }
      } catch (err) {
        console.error('Erreur chargement sous-catégories:', err);
        if (isMounted) {
          setFilteredSubcategories([]);
        }
      }
    };

    void loadSubcategories().catch((error: unknown) => {
      console.error('[VariantGroupForm] Load subcategories failed:', error);
    });

    return () => {
      isMounted = false;
    };
  }, [filters.categoryId]); // Enlevé getSubcategoriesByCategory des dépendances

  // Auto-générer base_sku quand le nom change
  useEffect(() => {
    if (formData.name.trim() && !editingGroup) {
      const generatedSku = normalizeForSKU(formData.name, 30);
      setFormData(prev => ({ ...prev, base_sku: generatedSku }));
    }
  }, [formData.name, editingGroup]);

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        // Mode édition
        const dimensions = (editingGroup.common_dimensions as any) || {};
        setFormData({
          name: editingGroup.name,
          base_sku: editingGroup.base_sku,
          subcategory_id: editingGroup.subcategory_id,
          variant_type: editingGroup.variant_type || 'color',
          style: editingGroup.style || '',
          suitable_rooms: (editingGroup.suitable_rooms || []) as RoomType[],
          common_length: dimensions.length?.toString() || '',
          common_width: dimensions.width?.toString() || '',
          common_height: dimensions.height?.toString() || '',
          common_dimensions_unit: dimensions.unit || 'cm',
        } as any);
      } else {
        // Mode création
        setFormData({
          name: '',
          base_sku: '',
          subcategory_id: '',
          variant_type: 'color',
          style: '',
          suitable_rooms: [],
          common_length: '',
          common_width: '',
          common_height: '',
          common_dimensions_unit: 'cm',
        } as any);
        setFilters({
          familyId: '',
          categoryId: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, editingGroup]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du groupe est obligatoire';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }

    if (!formData.subcategory_id) {
      newErrors.subcategory_id = 'La sous-catégorie est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Construire common_dimensions si au moins une dimension est renseignée
      const hasDimensions =
        formData.common_length ||
        formData.common_width ||
        formData.common_height;
      const common_dimensions = hasDimensions
        ? {
            length: parseFloat(formData.common_length) || null,
            width: parseFloat(formData.common_width) || null,
            height: parseFloat(formData.common_height) || null,
            unit: formData.common_dimensions_unit,
          }
        : null;

      const groupData = {
        name: formData.name.trim(),
        base_sku: formData.base_sku.trim(),
        subcategory_id: formData.subcategory_id,
        variant_type: formData.variant_type,
        style: formData.style || null,
        suitable_rooms:
          formData.suitable_rooms.length > 0 ? formData.suitable_rooms : null,
        common_dimensions,
        has_common_supplier: formData.has_common_supplier,
        supplier_id: formData.has_common_supplier
          ? formData.supplier_id || null
          : null,
      };

      let success = false;

      if (editingGroup) {
        // Mode édition
        success = await updateVariantGroup(editingGroup.id, groupData);
        if (success) {
          toast({
            title: 'Succès',
            description: `Groupe "${formData.name}" modifié avec succès`,
          });
        }
      } else {
        // Mode création
        success = !!(await createVariantGroup(groupData as any));
        if (success) {
          toast({
            title: 'Succès',
            description: `Groupe "${formData.name}" créé avec succès`,
          });
        }
      }

      if (success) {
        onSubmit(formData); // Callback pour refetch
        onClose();
      }
    } catch (err) {
      console.error('Erreur soumission groupe:', err);
      toast({
        title: 'Erreur',
        description: editingGroup
          ? 'Impossible de modifier le groupe'
          : 'Impossible de créer le groupe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-light">
            {editingGroup
              ? 'Modifier le groupe'
              : 'Nouveau groupe de variantes'}
          </DialogTitle>
          <DialogDescription>
            Créez un groupe pour organiser les variantes de produits (couleurs,
            tailles, matériaux)
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(e).catch((error: unknown) => {
              console.error('[VariantGroupForm] Submit failed:', error);
              setError(
                error instanceof Error
                  ? error.message
                  : "Une erreur inattendue s'est produite"
              );
            });
          }}
          className="space-y-6"
        >
          {/* Nom du groupe */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nom du groupe <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: Paniers Osier Naturel"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* SKU de base */}
          <div className="space-y-2">
            <Label htmlFor="base_sku" className="text-sm font-medium">
              SKU de base <span className="text-red-500">*</span>
            </Label>
            <Input
              id="base_sku"
              type="text"
              placeholder="Ex: PANIERS-OSIER-NATUREL"
              value={formData.base_sku}
              onChange={e =>
                setFormData(prev => ({ ...prev, base_sku: e.target.value }))
              }
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-600">
              Généré automatiquement depuis le nom. Pattern:{' '}
              {formData.base_sku
                ? `${formData.base_sku}-[VARIANTE]`
                : 'BASE_SKU-[VARIANTE]'}
            </p>
          </div>

          {/* Sélection hiérarchique */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Catégorisation <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-gray-600">
              Sélectionnez la hiérarchie pour identifier la sous-catégorie des
              produits
            </p>

            <div className="grid grid-cols-3 gap-3">
              {/* Famille */}
              <div className="space-y-2">
                <Label htmlFor="family" className="text-xs text-gray-600">
                  Famille
                </Label>
                <select
                  id="family"
                  value={filters.familyId}
                  onChange={e => {
                    setFilters({ familyId: e.target.value, categoryId: '' });
                    setFormData(prev => ({ ...prev, subcategory_id: '' }));
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {families.map(family => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs text-gray-600">
                  Catégorie
                </Label>
                <select
                  id="category"
                  value={filters.categoryId}
                  onChange={e => {
                    setFilters(prev => ({
                      ...prev,
                      categoryId: e.target.value,
                    }));
                    setFormData(prev => ({ ...prev, subcategory_id: '' }));
                  }}
                  disabled={!filters.familyId}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  <option value="">Sélectionner...</option>
                  {filteredCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sous-catégorie */}
              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-xs text-gray-600">
                  Sous-catégorie
                </Label>
                <select
                  id="subcategory"
                  value={formData.subcategory_id}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      subcategory_id: e.target.value,
                    }))
                  }
                  disabled={!filters.categoryId}
                  className={`w-full border rounded-md px-3 py-2 text-sm disabled:bg-gray-100 ${
                    errors.subcategory_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner...</option>
                  {filteredSubcategories.map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errors.subcategory_id && (
              <p className="text-sm text-red-500">{errors.subcategory_id}</p>
            )}
          </div>

          {/* Type de variante */}
          <div className="space-y-2">
            <Label htmlFor="variant_type" className="text-sm font-medium">
              Type de variante
            </Label>
            <p className="text-xs text-gray-600">
              Définissez comment les produits varient dans ce groupe
            </p>
            <select
              id="variant_type"
              value={formData.variant_type}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  variant_type: e.target.value as VariantType,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="color">Couleur</option>
              <option value="material">Matériau</option>
            </select>
          </div>

          {/* Style décoratif */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Style décoratif (optionnel)
            </Label>
            <p className="text-xs text-gray-600">
              Choisissez le style esthétique des produits de ce groupe
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DECORATIVE_STYLES.map(styleOption => {
                const isSelected = formData.style === styleOption.value;
                return (
                  <button
                    key={styleOption.value}
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        style: isSelected ? '' : styleOption.value,
                      }))
                    }
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all',
                      isSelected
                        ? 'border-black bg-black text-white shadow-md'
                        : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                    )}
                  >
                    <div className="text-2xl mb-1">{styleOption.icon}</div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {styleOption.label}
                      </div>
                      <div
                        className={cn(
                          'text-xs',
                          isSelected ? 'text-gray-200' : 'text-gray-500'
                        )}
                      >
                        {styleOption.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pièces compatibles */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pièces compatibles</Label>
            <p className="text-xs text-gray-600">
              Sélectionnez les pièces où ces produits peuvent être utilisés
            </p>
            <RoomMultiSelect
              value={formData.suitable_rooms}
              onChange={rooms =>
                setFormData(prev => ({ ...prev, suitable_rooms: rooms }))
              }
              placeholder="Sélectionner les pièces compatibles..."
              className="w-full"
            />
            {formData.suitable_rooms.length > 0 && (
              <p className="text-xs text-gray-600">
                {formData.suitable_rooms.length} pièce
                {formData.suitable_rooms.length > 1 ? 's' : ''} sélectionnée
                {formData.suitable_rooms.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Fournisseur commun */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-common-supplier"
                checked={formData.has_common_supplier}
                onCheckedChange={checked => {
                  setFormData(prev => ({
                    ...prev,
                    has_common_supplier: checked as boolean,
                  }));
                  if (!checked)
                    setFormData(prev => ({ ...prev, supplier_id: '' }));
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

            {formData.has_common_supplier && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="supplier" className="text-sm font-medium">
                  Fournisseur commun <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, supplier_id: value }))
                  }
                  disabled={suppliersLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.legal_name ||
                          supplier.trade_name ||
                          'Sans nom'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.supplier_id && (
                  <Link
                    href={`/contacts-organisations/suppliers/${formData.supplier_id}`}
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
                  produits du groupe
                </p>
              </div>
            )}
          </div>

          {/* Attributs communs */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label className="text-sm font-medium">
                Attributs communs (optionnels)
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                Ces informations seront automatiquement copiées vers tous les
                produits du groupe
              </p>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">
                📐 Dimensions
              </Label>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  type="number"
                  placeholder="Longueur"
                  value={formData.common_length}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      common_length: e.target.value,
                    }))
                  }
                  className="text-sm"
                  step="0.1"
                  min="0"
                />
                <Input
                  type="number"
                  placeholder="Largeur"
                  value={formData.common_width}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      common_width: e.target.value,
                    }))
                  }
                  className="text-sm"
                  step="0.1"
                  min="0"
                />
                <Input
                  type="number"
                  placeholder="Hauteur"
                  value={formData.common_height}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      common_height: e.target.value,
                    }))
                  }
                  className="text-sm"
                  step="0.1"
                  min="0"
                />
                <select
                  value={formData.common_dimensions_unit}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      common_dimensions_unit: e.target.value as 'cm' | 'm',
                    }))
                  }
                  className="border border-gray-300 rounded-md px-2 py-2 text-sm"
                >
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {editingGroup ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingGroup ? 'Modifier le groupe' : 'Créer le groupe'}
                </>
              )}
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
