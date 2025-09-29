'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useSubcategories } from '../../hooks/use-subcategories'
import type { CreateVariantGroupData } from '../../types/variant-groups'

interface VariantGroupCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateVariantGroupData) => Promise<void>
}

const DIMENSION_UNITS = [
  { value: 'cm', label: 'Centimètres (cm)' },
  { value: 'm', label: 'Mètres (m)' },
  { value: 'mm', label: 'Millimètres (mm)' },
  { value: 'in', label: 'Pouces (in)' },
] as const

export function VariantGroupCreateModal({
  isOpen,
  onClose,
  onSubmit
}: VariantGroupCreateModalProps) {
  const { subcategories, loading: subcategoriesLoading } = useSubcategories()

  const [name, setName] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [dimensionsLength, setDimensionsLength] = useState<number | undefined>()
  const [dimensionsWidth, setDimensionsWidth] = useState<number | undefined>()
  const [dimensionsHeight, setDimensionsHeight] = useState<number | undefined>()
  const [dimensionsUnit, setDimensionsUnit] = useState<'cm' | 'm' | 'mm' | 'in'>('cm')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setSubcategoryId('')
      setDimensionsLength(undefined)
      setDimensionsWidth(undefined)
      setDimensionsHeight(undefined)
      setDimensionsUnit('cm')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !subcategoryId) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        subcategory_id: subcategoryId,
        dimensions_length: dimensionsLength,
        dimensions_width: dimensionsWidth,
        dimensions_height: dimensionsHeight,
        dimensions_unit: dimensionsUnit,
      })
      onClose()
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un groupe de variantes</DialogTitle>
          <DialogDescription>
            Créez un groupe pour organiser les variantes de produits (couleurs, matières)
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !subcategoryId || isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? 'Création...' : 'Créer le groupe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}