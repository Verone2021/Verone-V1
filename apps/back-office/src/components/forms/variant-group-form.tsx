'use client';

import { useState, useMemo, useEffect } from 'react';

import type {
  CreateVariantGroupData,
  RoomType,
  VariantType,
} from '@verone/types';
import {
  ButtonV2,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  RoomMultiSelect,
} from '@verone/ui';
import {
  useFamilies,
  useCategories,
  useSubcategories,
} from '@verone/categories';
import { useToast } from '@verone/common';
import { useOrganisations } from '@verone/organisations';
import { useVariantGroups } from '@verone/products';
import { normalizeForSKU } from '@verone/products/utils/sku-generator';
import { Plus } from 'lucide-react';

import { VariantGroupBasicFields } from './VariantGroupBasicFields';
import { VariantGroupCategorySelector } from './VariantGroupCategorySelector';
import { VariantGroupDimensionsSection } from './VariantGroupDimensionsSection';
import { VariantGroupStyleSelector } from './VariantGroupStyleSelector';
import { VariantGroupSupplierSection } from './VariantGroupSupplierSection';
import type {
  CommonDimensions,
  FormData,
  Subcategory,
  VariantGroupFormProps,
} from './variant-group-form.types';

export function VariantGroupForm({
  isOpen,
  onClose,
  onSubmit,
  editingGroup,
}: VariantGroupFormProps) {
  const { toast } = useToast();
  const { createVariantGroup, updateVariantGroup } = useVariantGroups();

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
  const [filters, setFilters] = useState({ familyId: '', categoryId: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const { families } = useFamilies();
  const { getCategoriesByFamily } = useCategories();
  const { getSubcategoriesByCategory } = useSubcategories();
  const { organisations: suppliers, loading: suppliersLoading } =
    useOrganisations({ type: 'supplier', is_active: true });

  const filteredCategories = useMemo(() => {
    if (!filters.familyId) return [];
    return getCategoriesByFamily(filters.familyId);
  }, [filters.familyId, getCategoriesByFamily]);

  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([]);

  useEffect(() => {
    if (!filters.categoryId) {
      setFilteredSubcategories([]);
      return;
    }
    let isMounted = true;
    const loadSubcategories = async () => {
      try {
        const subcats = await getSubcategoriesByCategory(filters.categoryId);
        if (isMounted) setFilteredSubcategories(subcats);
      } catch (err) {
        console.error('Erreur chargement sous-catégories:', err);
        if (isMounted) setFilteredSubcategories([]);
      }
    };
    void loadSubcategories().catch(error => {
      console.error('[VariantGroupForm] loadSubcategories failed:', error);
    });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getSubcategoriesByCategory is memoized in hook, adding it causes infinite re-renders
  }, [filters.categoryId]);

  useEffect(() => {
    if (formData.name.trim() && !editingGroup) {
      const generatedSku = normalizeForSKU(formData.name, 30);
      setFormData(prev => ({ ...prev, base_sku: generatedSku }));
    }
  }, [formData.name, editingGroup]);

  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        const dimensions =
          (editingGroup.common_dimensions as CommonDimensions | null) ?? null;
        setFormData({
          name: editingGroup.name,
          base_sku: editingGroup.base_sku,
          subcategory_id: editingGroup.subcategory_id,
          variant_type: editingGroup.variant_type ?? 'color',
          style: editingGroup.style ?? '',
          suitable_rooms: (editingGroup.suitable_rooms ?? []) as RoomType[],
          common_length: dimensions?.length?.toString() ?? '',
          common_width: dimensions?.width?.toString() ?? '',
          common_height: dimensions?.height?.toString() ?? '',
          common_dimensions_unit: dimensions?.unit ?? 'cm',
          has_common_supplier: false,
          supplier_id: '',
        });
      } else {
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
          has_common_supplier: false,
          supplier_id: '',
        });
        setFilters({ familyId: '', categoryId: '' });
      }
      setErrors({});
    }
  }, [isOpen, editingGroup]);

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
      const parsedLength = parseFloat(formData.common_length);
      const parsedWidth = parseFloat(formData.common_width);
      const parsedHeight = parseFloat(formData.common_height);
      const groupData: CreateVariantGroupData = {
        name: formData.name.trim(),
        base_sku: formData.base_sku.trim(),
        subcategory_id: formData.subcategory_id,
        variant_type: formData.variant_type,
        dimensions_length: !isNaN(parsedLength) ? parsedLength : undefined,
        dimensions_width: !isNaN(parsedWidth) ? parsedWidth : undefined,
        dimensions_height: !isNaN(parsedHeight) ? parsedHeight : undefined,
        dimensions_unit: formData.common_dimensions_unit,
        style: formData.style || undefined,
        suitable_rooms:
          formData.suitable_rooms.length > 0
            ? (formData.suitable_rooms as string[])
            : undefined,
        has_common_supplier: formData.has_common_supplier,
        supplier_id: formData.has_common_supplier
          ? formData.supplier_id || null
          : null,
      };
      let success = false;
      if (editingGroup) {
        success = await updateVariantGroup(
          editingGroup.id,
          groupData as Parameters<typeof updateVariantGroup>[1]
        );
        if (success) {
          toast({
            title: 'Succès',
            description: `Groupe "${formData.name}" modifié avec succès`,
          });
        }
      } else {
        success = !!(await createVariantGroup(groupData));
        if (success) {
          toast({
            title: 'Succès',
            description: `Groupe "${formData.name}" créé avec succès`,
          });
        }
      }
      if (success) {
        onSubmit(formData);
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
          onSubmit={e => {
            void handleSubmit(e).catch(error => {
              console.error('[VariantGroupForm] handleSubmit failed:', error);
            });
          }}
          className="space-y-6"
        >
          <VariantGroupBasicFields
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />

          <VariantGroupCategorySelector
            filters={filters}
            setFilters={setFilters}
            formData={formData}
            setFormData={setFormData}
            families={families}
            filteredCategories={filteredCategories}
            filteredSubcategories={filteredSubcategories}
            error={errors.subcategory_id}
          />

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

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Style décoratif (optionnel)
            </Label>
            <p className="text-xs text-gray-600">
              Choisissez le style esthétique des produits de ce groupe
            </p>
            <VariantGroupStyleSelector
              style={formData.style}
              onStyleChange={value =>
                setFormData(prev => ({ ...prev, style: value }))
              }
            />
          </div>

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

          <VariantGroupSupplierSection
            hasCommonSupplier={formData.has_common_supplier}
            supplierId={formData.supplier_id}
            onHasCommonSupplierChange={value =>
              setFormData(prev => ({ ...prev, has_common_supplier: value }))
            }
            onSupplierIdChange={value =>
              setFormData(prev => ({ ...prev, supplier_id: value }))
            }
            suppliers={suppliers}
            suppliersLoading={suppliersLoading}
          />

          <VariantGroupDimensionsSection
            formData={formData}
            setFormData={setFormData}
          />

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
