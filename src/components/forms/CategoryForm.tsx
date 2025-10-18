/**
 * 🏷️ CategoryForm - Formulaire pour catégories
 *
 * Formulaire séparé pour la gestion des catégories (niveau 1)
 * Avec sélection de famille parent obligatoire
 */

"use client"

import { useState, useEffect } from 'react'
import { ButtonV2 } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Family {
  id: string
  name: string
}

interface Category {
  id: string
  parent_id: string | null
  family_id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  display_order: number
  is_active: boolean
  level: 1
  created_at?: string
  updated_at?: string
}

interface CategoryFormData {
  family_id: string
  name: string
  description: string
  image_url?: string
  display_order: number
  is_active: boolean
}

interface CategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (category: Category) => void
  initialData?: Category | null
  mode: 'create' | 'edit'
  families: Family[] // Liste des familles pour sélection parent
}

export function CategoryForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  mode,
  families
}: CategoryFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // État du formulaire
  const [formData, setFormData] = useState<CategoryFormData>({
    family_id: initialData?.family_id || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    image_url: initialData?.image_url || '',
    display_order: initialData?.display_order || 1,
    is_active: initialData?.is_active ?? true
  })

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        family_id: initialData?.family_id || '',
        name: initialData?.name || '',
        description: initialData?.description || '',
        image_url: initialData?.image_url || '',
        display_order: initialData?.display_order || 1,
        is_active: initialData?.is_active ?? true
      })
    }
  }, [isOpen, initialData])

  // Génération du slug automatique
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-")
  }

  // Upload d'image vers Supabase Storage
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `category-${Date.now()}.${fileExt}`
      const filePath = `category-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('family-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('family-images')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))

      toast({
        title: "✅ Image téléchargée",
        description: "L'image a été uploadée avec succès"
      })
    } catch (error) {
      console.error('Erreur upload image catégorie:', error?.message || JSON.stringify(error))
      toast({
        title: "❌ Erreur upload",
        description: "Impossible de télécharger l'image",
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
    }
  }

  // Suppression d'image
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }))
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "❌ Nom requis",
        description: "Le nom de la catégorie est obligatoire",
        variant: "destructive"
      })
      return
    }

    if (!formData.family_id) {
      toast({
        title: "❌ Famille requise",
        description: "Vous devez sélectionner une famille parent",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const slug = generateSlug(formData.name)

      const categoryData = {
        ...formData,
        slug,
        level: 1 as const
      }

      let result

      if (mode === 'create') {
        const { data, error } = await supabase
          .from('categories')
          .insert([categoryData])
          .select()
          .single()

        if (error) throw error
        result = data

        toast({
          title: "✅ Catégorie créée",
          description: `La catégorie "${formData.name}" a été créée`
        })
      } else {
        const { data, error } = await supabase
          .from('categories')
          .update({
            ...categoryData,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData!.id)
          .select()
          .single()

        if (error) throw error
        result = data

        toast({
          title: "✅ Catégorie modifiée",
          description: `La catégorie "${formData.name}" a été mise à jour`
        })
      }

      onSubmit(result as Category)
      onClose()

    } catch (error: any) {
      console.error('Erreur soumission formulaire catégorie:', error?.message || JSON.stringify(error))

      // Gestion spécifique des erreurs de contrainte unique
      let errorMessage = error.message || "Une erreur est survenue"
      if (error.code === '23505') {
        errorMessage = 'Une catégorie avec ce nom existe déjà dans cette famille. Veuillez choisir un nom différent.'
      }

      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'
  const selectedFamily = families.find(f => f.id === formData.family_id)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Famille parent */}
          <div className="space-y-2">
            <Label className="text-black">
              Famille parent*
            </Label>
            {(mode === 'edit' || (mode === 'create' && initialData?.family_id)) && selectedFamily ? (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm font-medium text-gray-900">
                  {selectedFamily.name}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La famille parent ne peut pas être modifiée pour préserver la cohérence de l'arborescence.
                </p>
              </div>
            ) : (
              <Select
                value={formData.family_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, family_id: value }))}
                required
              >
                <SelectTrigger className="border-gray-300 focus:border-black">
                  <SelectValue placeholder="Sélectionnez une famille..." />
                </SelectTrigger>
                <SelectContent>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-black">
              Nom de la catégorie*
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Chaises, Tables..."
              className="border-gray-300 focus:border-black"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-black">
              Description de la catégorie
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de cette catégorie"
              className="border-gray-300 focus:border-black resize-none"
              rows={3}
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label className="text-black">Image de la catégorie</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {formData.image_url ? (
                <div className="relative">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <ButtonV2
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </ButtonV2>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="imageUpload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Cliquez ou glissez une image
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        JPG, PNG, WebP (max 5MB)
                      </span>
                    </Label>
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && file.size <= 5 * 1024 * 1024) {
                          handleImageUpload(file)
                        } else {
                          toast({
                            title: "❌ Fichier trop volumineux",
                            description: "L'image doit faire moins de 5MB",
                            variant: "destructive"
                          })
                        }
                      }}
                      disabled={uploadingImage}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ordre d'affichage */}
          <div className="space-y-2">
            <Label htmlFor="display_order" className="text-black">
              Ordre d'affichage
            </Label>
            <Input
              id="display_order"
              type="number"
              min="1"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                display_order: parseInt(e.target.value) || 1
              }))}
              className="border-gray-300 focus:border-black"
            />
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label className="text-black">Statut</Label>
            <Select
              value={formData.is_active ? 'active' : 'inactive'}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                is_active: value === 'active'
              }))}
            >
              <SelectTrigger className="border-gray-300 focus:border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300 hover:bg-gray-50"
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={loading || uploadingImage}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {mode === 'create' ? 'Créer' : 'Modifier'}
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}