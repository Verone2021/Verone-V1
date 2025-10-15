'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSubcategories } from '../../hooks/use-subcategories'
import { useOrganisations } from '../../hooks/use-organisations'
import { normalizeForSKU } from '../../lib/sku-generator'
import type { VariantGroup, UpdateVariantGroupData } from '../../types/variant-groups'
import { cn } from '../../lib/utils'
import { ExternalLink } from 'lucide-react'
import {
  ComponentInstanceIcon,
  DesktopIcon,
  RocketIcon,
  FrameIcon,
  GearIcon,
  ReaderIcon,
  SewingPinIcon,
  DrawingPinIcon
} from '@radix-ui/react-icons'

interface VariantGroupEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (groupId: string, data: UpdateVariantGroupData) => Promise<void>
  group: VariantGroup | null
}

const DIMENSION_UNITS = [
  { value: 'cm', label: 'Centimètres (cm)' },
  { value: 'm', label: 'Mètres (m)' },
  { value: 'mm', label: 'Millimètres (mm)' },
  { value: 'in', label: 'Pouces (in)' },
] as const

const DECORATIVE_STYLES = [
  { value: 'minimaliste', label: 'Minimaliste', description: 'Épuré et fonctionnel', icon: ComponentInstanceIcon },
  { value: 'contemporain', label: 'Contemporain', description: 'Moderne et actuel', icon: DesktopIcon },
  { value: 'moderne', label: 'Moderne', description: 'Design avant-gardiste', icon: RocketIcon },
  { value: 'scandinave', label: 'Scandinave', description: 'Chaleureux et lumineux', icon: FrameIcon },
  { value: 'industriel', label: 'Industriel', description: 'Brut et authentique', icon: GearIcon },
  { value: 'classique', label: 'Classique', description: 'Intemporel et élégant', icon: ReaderIcon },
  { value: 'boheme', label: 'Bohème', description: 'Libre et éclectique', icon: SewingPinIcon },
  { value: 'art_deco', label: 'Art Déco', description: 'Raffiné et géométrique', icon: DrawingPinIcon },
] as const

const ROOM_TYPES = [
  { value: 'atelier', label: 'Atelier' },
  { value: 'balcon', label: 'Balcon' },
  { value: 'bibliotheque', label: 'Bibliothèque' },
  { value: 'buanderie', label: 'Buanderie' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'cave', label: 'Cave' },
  { value: 'cellier', label: 'Cellier' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'couloir', label: 'Couloir' },
  { value: 'cour', label: 'Cour' },
  { value: 'cuisine', label: 'Cuisine' },
  { value: 'dressing', label: 'Dressing' },
  { value: 'garage', label: 'Garage' },
  { value: 'grenier', label: 'Grenier' },
  { value: 'hall_entree', label: "Hall d'entrée" },
  { value: 'jardin', label: 'Jardin' },
  { value: 'loggia', label: 'Loggia' },
  { value: 'mezzanine', label: 'Mezzanine' },
  { value: 'patio', label: 'Patio' },
  { value: 'salle_a_manger', label: 'Salle à manger' },
  { value: 'salle_de_bain', label: 'Salle de bain' },
  { value: 'salle_de_jeux', label: 'Salle de jeux' },
  { value: 'salle_de_sport', label: 'Salle de sport' },
  { value: 'salon', label: 'Salon' },
  { value: 'salon_sejour', label: 'Salon/Séjour' },
  { value: 'sous_sol', label: 'Sous-sol' },
  { value: 'terrasse', label: 'Terrasse' },
  { value: 'toilettes', label: 'Toilettes' },
  { value: 'veranda', label: 'Véranda' },
  { value: 'wc', label: 'WC' },
] as const

export function VariantGroupEditModal({
  isOpen,
  onClose,
  onSubmit,
  group
}: VariantGroupEditModalProps) {
  const { subcategories, loading: subcategoriesLoading } = useSubcategories()
  const { organisations: suppliers, loading: suppliersLoading } = useOrganisations({
    type: 'supplier',
    is_active: true
  })

  const [name, setName] = useState('')
  const [baseSku, setBaseSku] = useState('')
  const [variantType, setVariantType] = useState<'color' | 'material'>('color')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [dimensionsLength, setDimensionsLength] = useState<number | undefined>()
  const [dimensionsWidth, setDimensionsWidth] = useState<number | undefined>()
  const [dimensionsHeight, setDimensionsHeight] = useState<number | undefined>()
  const [dimensionsUnit, setDimensionsUnit] = useState<'cm' | 'm' | 'mm' | 'in'>('cm')
  const [commonWeight, setCommonWeight] = useState<number | undefined>()
  const [style, setStyle] = useState<string>('')
  const [suitableRooms, setSuitableRooms] = useState<string[]>([])
  const [hasCommonSupplier, setHasCommonSupplier] = useState(false)
  const [supplierId, setSupplierId] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialiser les valeurs du formulaire quand le groupe change
  useEffect(() => {
    if (group && isOpen) {
      setName(group.name || '')
      setBaseSku(group.base_sku || '')
      setVariantType(group.variant_type || 'color')
      setSubcategoryId(group.subcategory_id || '')

      // Dimensions communes (colonnes séparées)
      setDimensionsLength(group.dimensions_length || undefined)
      setDimensionsWidth(group.dimensions_width || undefined)
      setDimensionsHeight(group.dimensions_height || undefined)
      setDimensionsUnit(group.dimensions_unit || 'cm')

      // Poids commun
      setCommonWeight(group.common_weight || undefined)

      // Style décoratif
      setStyle(group.style || '')

      // Pièces compatibles
      setSuitableRooms(group.suitable_rooms || [])

      // Fournisseur commun
      setHasCommonSupplier(group.has_common_supplier || false)
      setSupplierId(group.supplier_id || undefined)
    }
  }, [group, isOpen])

  // Auto-générer base_sku quand le nom change
  useEffect(() => {
    if (name.trim() && name !== group?.name) {
      const generatedSku = normalizeForSKU(name, 30)
      setBaseSku(generatedSku)
    }
  }, [name, group?.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!group || !name.trim() || !baseSku.trim() || !subcategoryId) return

    // Validation: si fournisseur commun coché, un fournisseur doit être sélectionné
    if (hasCommonSupplier && !supplierId) {
      alert('Veuillez sélectionner un fournisseur ou décocher la case "Même fournisseur pour tous les produits"')
      return
    }

    setIsSubmitting(true)
    try {
      // Préparer les données
      const updateData: UpdateVariantGroupData = {
        name: name.trim(),
        base_sku: baseSku.trim(),
        variant_type: variantType,
        subcategory_id: subcategoryId,
        has_common_supplier: hasCommonSupplier,
        supplier_id: hasCommonSupplier ? (supplierId || null) : null,
      }

      // Dimensions communes en JSONB (format compatible avec products.dimensions)
      if (dimensionsLength && dimensionsWidth && dimensionsHeight) {
        updateData.common_dimensions = {
          length: dimensionsLength,
          width: dimensionsWidth,
          height: dimensionsHeight,
          unit: dimensionsUnit || 'cm'
        }
      } else {
        updateData.common_dimensions = null
      }

      // Poids commun
      updateData.common_weight = commonWeight || null

      // Style décoratif
      updateData.style = style || undefined

      // Pièces compatibles
      updateData.suitable_rooms = suitableRooms.length > 0 ? suitableRooms : null

      await onSubmit(group.id, updateData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la modification du groupe:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!group) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le groupe de variantes</DialogTitle>
          <DialogDescription>
            Modifiez les informations du groupe. Les changements seront propagés aux produits du groupe.
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
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setBaseSku(e.target.value)}
                placeholder="Ex: CHAISE-DESIGN-SCANDI"
                className="mt-1 font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Pattern: {baseSku ? `${baseSku}-[VARIANTE]` : 'BASE_SKU-[VARIANTE]'}
              </p>
            </div>

            <div>
              <Label htmlFor="variant_type" className="text-sm font-medium">
                Type de variante *
              </Label>
              <select
                id="variant_type"
                value={variantType}
                onChange={(e) => setVariantType(e.target.value as 'color' | 'material')}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
                required
              >
                <option value="color">🎨 Couleur</option>
                <option value="material">🧵 Matériau</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Définit l'attribut principal qui différencie les produits du groupe
              </p>
            </div>

            <div>
              <Label htmlFor="subcategory" className="text-sm font-medium">
                Sous-catégorie *
              </Label>
              <select
                id="subcategory"
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
                required
                disabled={subcategoriesLoading}
              >
                <option value="">Sélectionner une sous-catégorie</option>
                {subcategories?.map((sub) => (
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
            <Label className="text-sm font-medium">Dimensions communes (optionnel)</Label>
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
                  onChange={(e) => setDimensionsLength(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                  onChange={(e) => setDimensionsWidth(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                  onChange={(e) => setDimensionsHeight(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                  onChange={(e) => setDimensionsUnit(e.target.value as any)}
                  className="mt-1 w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                >
                  {DIMENSION_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">Poids commun (optionnel)</Label>
            <p className="text-xs text-gray-600">
              Si tous les produits du groupe ont le même poids
            </p>
            <div className="flex items-end space-x-2">
              <Input
                id="common_weight"
                type="number"
                step="0.01"
                min="0"
                value={commonWeight || ''}
                onChange={(e) => setCommonWeight(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
                className="flex-1"
              />
              <span className="text-sm text-gray-600 mb-2 min-w-[30px]">kg</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">
              Style décoratif (optionnel)
            </Label>
            <p className="text-xs text-gray-600">
              Style commun à tous les produits du groupe
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DECORATIVE_STYLES.map((styleOption) => {
                const Icon = styleOption.icon
                return (
                  <button
                    key={styleOption.value}
                    type="button"
                    onClick={() => setStyle(style === styleOption.value ? '' : styleOption.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all",
                      style === styleOption.value
                        ? "border-black bg-black text-white shadow-md"
                        : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{styleOption.label}</div>
                      <div className={cn(
                        "text-xs",
                        style === styleOption.value ? "text-gray-200" : "text-gray-500"
                      )}>
                        {styleOption.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">
              Pièces compatibles (optionnel)
            </Label>
            <p className="text-xs text-gray-600">
              Sélectionnez les pièces où ces produits peuvent être utilisés
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
              {ROOM_TYPES.map((room) => (
                <div key={room.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`room-${room.value}`}
                    checked={suitableRooms.includes(room.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSuitableRooms([...suitableRooms, room.value])
                      } else {
                        setSuitableRooms(suitableRooms.filter(r => r !== room.value))
                      }
                    }}
                  />
                  <Label
                    htmlFor={`room-${room.value}`}
                    className="text-xs cursor-pointer"
                  >
                    {room.label}
                  </Label>
                </div>
              ))}
            </div>
            {suitableRooms.length > 0 && (
              <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                {suitableRooms.length} pièce{suitableRooms.length > 1 ? 's' : ''} sélectionnée{suitableRooms.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-common-supplier"
                checked={hasCommonSupplier}
                onCheckedChange={(checked) => {
                  setHasCommonSupplier(checked as boolean)
                  if (!checked) setSupplierId(undefined)
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
              Si cochée, tous les produits du groupe hériteront automatiquement du fournisseur sélectionné
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
                    {suppliers.map((supplier) => (
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
                  💡 Ce fournisseur sera appliqué automatiquement à tous les produits du groupe et ne pourra pas être modifié individuellement
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </ButtonV2>
            <Button
              type="submit"
              disabled={!name.trim() || !baseSku.trim() || !subcategoryId || isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? 'Modification...' : 'Enregistrer les modifications'}
            </ButtonV2>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
