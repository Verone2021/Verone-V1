"use client"

import { useState, useEffect } from "react"
import { X, Save, Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { cn } from "../../lib/utils"
import { ImageUploadV2 } from "./ImageUploadV2"

// Types pour le formulaire adaptatif
type ItemType = 'family' | 'category' | 'subcategory'

interface FormData {
  name: string
  description: string
  is_active: boolean
  sort_order: number
  parent_id?: string // Pour catégories et sous-catégories
  image_url?: string
}

interface FamilyCrudFormProps {
  isOpen: boolean
  onClose: () => void
  type: ItemType
  mode: 'create' | 'edit'
  initialData?: FormData & { id?: string }
  parentOptions?: Array<{ id: string; name: string }> // Options parent pour catégories/sous-catégories
  onSubmit: (data: FormData & { id?: string }) => Promise<void>
}

const ITEM_LABELS = {
  family: {
    title: 'Famille',
    titleCreate: 'Nouvelle famille',
    titleEdit: 'Modifier la famille',
    nameLabel: 'Nom de la famille',
    descriptionLabel: 'Description de la famille',
    namePlaceholder: 'Ex: Mobilier, Électroménager...',
    descriptionPlaceholder: 'Description de cette famille de produits'
  },
  category: {
    title: 'Catégorie',
    titleCreate: 'Nouvelle catégorie',
    titleEdit: 'Modifier la catégorie',
    nameLabel: 'Nom de la catégorie',
    descriptionLabel: 'Description de la catégorie',
    namePlaceholder: 'Ex: Chaises, Tables...',
    descriptionPlaceholder: 'Description de cette catégorie'
  },
  subcategory: {
    title: 'Sous-catégorie',
    titleCreate: 'Nouvelle sous-catégorie',
    titleEdit: 'Modifier la sous-catégorie',
    nameLabel: 'Nom de la sous-catégorie',
    descriptionLabel: 'Description de la sous-catégorie',
    namePlaceholder: 'Ex: Chaise de bureau, Chaise de salle à manger...',
    descriptionPlaceholder: 'Description de cette sous-catégorie'
  }
}

export function FamilyCrudForm({
  isOpen,
  onClose,
  type,
  mode,
  initialData,
  parentOptions = [],
  onSubmit
}: FamilyCrudFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    is_active: true,
    sort_order: 1,
    parent_id: undefined,
    image_url: undefined
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const labels = ITEM_LABELS[type]
  const title = mode === 'create' ? labels.titleCreate : labels.titleEdit

  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        is_active: initialData.is_active ?? true,
        sort_order: initialData.sort_order || 1,
        parent_id: initialData.parent_id,
        image_url: initialData.image_url
      })
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true,
        sort_order: 1,
        parent_id: undefined,
        image_url: undefined
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire'
    }

    if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    }

    if ((type === 'category' || type === 'subcategory') && !formData.parent_id) {
      newErrors.parent_id = `Vous devez sélectionner une ${type === 'category' ? 'famille' : 'catégorie'} parent`
    }

    if (formData.sort_order < 1 || formData.sort_order > 999) {
      newErrors.sort_order = 'L\'ordre doit être entre 1 et 999'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const submitData = {
        ...formData,
        ...(mode === 'edit' && initialData?.id ? { id: initialData.id } : {})
      }

      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      // TODO: Afficher un message d'erreur à l'utilisateur
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mise à jour des champs
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Gestionnaires d'images
  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }))
  }

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, image_url: undefined }))
  }

  // Déterminer le bucket selon le type
  const getImageBucket = () => {
    switch (type) {
      case 'family':
        return 'family-images' as const
      case 'category':
      case 'subcategory':
        return 'category-images' as const
      default:
        return 'category-images' as const
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-black">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection parent pour catégories et sous-catégories */}
          {(type === 'category' || type === 'subcategory') && (
            <div className="space-y-2">
              <Label htmlFor="parent">
                {type === 'category' ? 'Famille parent' : 'Catégorie parent'}
                {mode === 'create' && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {mode === 'edit' ? (
                // Mode édition : affichage en lecture seule
                <div className="space-y-2">
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                    {parentOptions.find(option => option.id === formData.parent_id)?.name || 'Parent non trouvé'}
                  </div>
                  <p className="text-xs text-gray-500">
                    La {type === 'category' ? 'famille' : 'catégorie'} parent ne peut pas être modifiée après création pour préserver la cohérence de l'arborescence.
                  </p>
                </div>
              ) : (
                // Mode création : sélection normale
                <>
                  <Select
                    value={formData.parent_id || ""}
                    onValueChange={(value) => updateField('parent_id', value)}
                  >
                    <SelectTrigger className={cn(errors.parent_id && "border-red-500")}>
                      <SelectValue
                        placeholder={`Sélectionner une ${type === 'category' ? 'famille' : 'catégorie'}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.parent_id && (
                    <p className="text-sm text-red-600">{errors.parent_id}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {labels.nameLabel}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder={labels.namePlaceholder}
              className={cn(errors.name && "border-red-500")}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{labels.descriptionLabel}</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder={labels.descriptionPlaceholder}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            />
          </div>

          {/* Image/Icône */}
          <div className="space-y-2">
            <Label>Image {type === 'family' ? 'de la famille' : type === 'category' ? 'de la catégorie' : 'de la sous-catégorie'}</Label>
            <ImageUploadV2
              bucket={getImageBucket()}
              currentImageUrl={formData.image_url}
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              autoUpload={true}
            />
          </div>

          {/* Ordre d'affichage */}
          <div className="space-y-2">
            <Label htmlFor="sort_order">Ordre d'affichage</Label>
            <Input
              id="sort_order"
              type="number"
              min="1"
              max="999"
              value={formData.sort_order}
              onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 1)}
              className={cn(errors.sort_order && "border-red-500")}
            />
            {errors.sort_order && (
              <p className="text-sm text-red-600">{errors.sort_order}</p>
            )}
          </div>

          {/* Statut actif/inactif */}
          <div className="space-y-2">
            <Label htmlFor="is_active">Statut</Label>
            <Select
              value={formData.is_active.toString()}
              onValueChange={(value) => updateField('is_active', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Actif</SelectItem>
                <SelectItem value="false">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Créer' : 'Modifier'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}