"use client"

import { useState, useMemo, useEffect, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFamilies } from '@/hooks/use-families'
import { useCategories } from '@/hooks/use-categories'
import { useSubcategories } from '@/hooks/use-subcategories'
import { useVariantGroups } from '@/hooks/use-variant-groups'
import { useToast } from '@/hooks/use-toast'
import { RoomMultiSelect } from '@/components/ui/room-multi-select'
import { COLLECTION_STYLE_OPTIONS } from '@/types/collections'
import { normalizeForSKU } from '@/lib/sku-generator'
import type { VariantGroup, VariantType } from '@/types/variant-groups'
import type { RoomType } from '@/types/room-types'

interface VariantGroupFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  editingGroup?: VariantGroup | null
}

interface FormData {
  name: string
  base_sku: string
  subcategory_id: string
  variant_type: VariantType
  // Attributs de catégorisation
  style: string
  suitable_rooms: RoomType[]
  // Nouveaux champs pour attributs communs
  common_length: string
  common_width: string
  common_height: string
  common_dimensions_unit: 'cm' | 'm'
}

export function VariantGroupForm({
  isOpen,
  onClose,
  onSubmit,
  editingGroup
}: VariantGroupFormProps) {
  const { toast } = useToast()
  const { createVariantGroup, updateVariantGroup } = useVariantGroups()

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
    common_dimensions_unit: 'cm'
  })
  const [filters, setFilters] = useState({
    familyId: '',
    categoryId: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})

  // Hooks hiérarchie
  const { families } = useFamilies()
  const { getCategoriesByFamily } = useCategories()
  const { getSubcategoriesByCategory } = useSubcategories()

  // Catégories et sous-catégories filtrées
  const filteredCategories = useMemo(() => {
    if (!filters.familyId) return []
    return getCategoriesByFamily(filters.familyId)
  }, [filters.familyId, getCategoriesByFamily])

  const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([])

  // Charger sous-catégories quand catégorie change
  useEffect(() => {
    if (!filters.categoryId) {
      setFilteredSubcategories([])
      return
    }

    let isMounted = true

    const loadSubcategories = async () => {
      try {
        const subcats = await getSubcategoriesByCategory(filters.categoryId)
        if (isMounted) {
          setFilteredSubcategories(subcats)
        }
      } catch (err) {
        console.error('Erreur chargement sous-catégories:', err)
        if (isMounted) {
          setFilteredSubcategories([])
        }
      }
    }

    loadSubcategories()

    return () => {
      isMounted = false
    }
  }, [filters.categoryId]) // Enlevé getSubcategoriesByCategory des dépendances

  // Auto-générer base_sku quand le nom change
  useEffect(() => {
    if (formData.name.trim() && !editingGroup) {
      const generatedSku = normalizeForSKU(formData.name, 30)
      setFormData(prev => ({ ...prev, base_sku: generatedSku }))
    }
  }, [formData.name, editingGroup])

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        // Mode édition
        const dimensions = editingGroup.common_dimensions as any || {}
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
          common_dimensions_unit: dimensions.unit || 'cm'
        })
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
          common_dimensions_unit: 'cm'
        })
        setFilters({
          familyId: '',
          categoryId: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, editingGroup])

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du groupe est obligatoire'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères'
    }

    if (!formData.subcategory_id) {
      newErrors.subcategory_id = 'La sous-catégorie est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Construire common_dimensions si au moins une dimension est renseignée
      const hasDimensions = formData.common_length || formData.common_width || formData.common_height
      const common_dimensions = hasDimensions ? {
        length: parseFloat(formData.common_length) || null,
        width: parseFloat(formData.common_width) || null,
        height: parseFloat(formData.common_height) || null,
        unit: formData.common_dimensions_unit
      } : null

      const groupData = {
        name: formData.name.trim(),
        base_sku: formData.base_sku.trim(),
        subcategory_id: formData.subcategory_id,
        variant_type: formData.variant_type,
        style: formData.style || null,
        suitable_rooms: formData.suitable_rooms.length > 0 ? formData.suitable_rooms : null,
        common_dimensions
      }

      let success = false

      if (editingGroup) {
        // Mode édition
        success = await updateVariantGroup(editingGroup.id, groupData)
        if (success) {
          toast({
            title: "Succès",
            description: `Groupe "${formData.name}" modifié avec succès`
          })
        }
      } else {
        // Mode création
        success = await createVariantGroup(groupData)
        if (success) {
          toast({
            title: "Succès",
            description: `Groupe "${formData.name}" créé avec succès`
          })
        }
      }

      if (success) {
        onSubmit(formData) // Callback pour refetch
        onClose()
      }
    } catch (err) {
      console.error('Erreur soumission groupe:', err)
      toast({
        title: "Erreur",
        description: editingGroup ? "Impossible de modifier le groupe" : "Impossible de créer le groupe",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-light">
            {editingGroup ? 'Modifier le groupe' : 'Nouveau groupe de variantes'}
          </DialogTitle>
          <DialogDescription>
            Créez un groupe pour organiser les variantes de produits (couleurs, tailles, matériaux)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, base_sku: e.target.value }))}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-600">
              Généré automatiquement depuis le nom. Pattern: {formData.base_sku ? `${formData.base_sku}-[VARIANTE]` : 'BASE_SKU-[VARIANTE]'}
            </p>
          </div>

          {/* Sélection hiérarchique */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Catégorisation <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-gray-600">
              Sélectionnez la hiérarchie pour identifier la sous-catégorie des produits
            </p>

            <div className="grid grid-cols-3 gap-3">
              {/* Famille */}
              <div className="space-y-2">
                <Label htmlFor="family" className="text-xs text-gray-600">Famille</Label>
                <select
                  id="family"
                  value={filters.familyId}
                  onChange={(e) => {
                    setFilters({ familyId: e.target.value, categoryId: '' })
                    setFormData(prev => ({ ...prev, subcategory_id: '' }))
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs text-gray-600">Catégorie</Label>
                <select
                  id="category"
                  value={filters.categoryId}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, categoryId: e.target.value }))
                    setFormData(prev => ({ ...prev, subcategory_id: '' }))
                  }}
                  disabled={!filters.familyId}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  <option value="">Sélectionner...</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sous-catégorie */}
              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-xs text-gray-600">Sous-catégorie</Label>
                <select
                  id="subcategory"
                  value={formData.subcategory_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory_id: e.target.value }))}
                  disabled={!filters.categoryId}
                  className={`w-full border rounded-md px-3 py-2 text-sm disabled:bg-gray-100 ${
                    errors.subcategory_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner...</option>
                  {filteredSubcategories.map((subcategory) => (
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
              onChange={(e) => setFormData(prev => ({ ...prev, variant_type: e.target.value as VariantType }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="color">Couleur</option>
              <option value="material">Matériau</option>
            </select>
          </div>

          {/* Style décoratif */}
          <div className="space-y-2">
            <Label htmlFor="style" className="text-sm font-medium">
              Style décoratif
            </Label>
            <p className="text-xs text-gray-600">
              Choisissez le style esthétique des produits de ce groupe
            </p>
            <select
              id="style"
              value={formData.style}
              onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Aucun style défini</option>
              {COLLECTION_STYLE_OPTIONS.map((styleOption) => (
                <option key={styleOption.value} value={styleOption.value}>
                  {styleOption.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pièces compatibles */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Pièces compatibles
            </Label>
            <p className="text-xs text-gray-600">
              Sélectionnez les pièces où ces produits peuvent être utilisés
            </p>
            <RoomMultiSelect
              value={formData.suitable_rooms}
              onChange={(rooms) => setFormData(prev => ({ ...prev, suitable_rooms: rooms }))}
              placeholder="Sélectionner les pièces compatibles..."
              className="w-full"
            />
            {formData.suitable_rooms.length > 0 && (
              <p className="text-xs text-gray-600">
                {formData.suitable_rooms.length} pièce{formData.suitable_rooms.length > 1 ? 's' : ''} sélectionnée{formData.suitable_rooms.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Attributs communs */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label className="text-sm font-medium">Attributs communs (optionnels)</Label>
              <p className="text-xs text-gray-600 mt-1">
                Ces informations seront automatiquement copiées vers tous les produits du groupe
              </p>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">📐 Dimensions</Label>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  type="number"
                  placeholder="Longueur"
                  value={formData.common_length}
                  onChange={(e) => setFormData(prev => ({ ...prev, common_length: e.target.value }))}
                  className="text-sm"
                  step="0.1"
                  min="0"
                />
                <Input
                  type="number"
                  placeholder="Largeur"
                  value={formData.common_width}
                  onChange={(e) => setFormData(prev => ({ ...prev, common_width: e.target.value }))}
                  className="text-sm"
                  step="0.1"
                  min="0"
                />
                <Input
                  type="number"
                  placeholder="Hauteur"
                  value={formData.common_height}
                  onChange={(e) => setFormData(prev => ({ ...prev, common_height: e.target.value }))}
                  className="text-sm"
                  step="0.1"
                  min="0"
                />
                <select
                  value={formData.common_dimensions_unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, common_dimensions_unit: e.target.value as 'cm' | 'm' }))}
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
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingGroup ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingGroup ? 'Modifier le groupe' : 'Créer le groupe'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}