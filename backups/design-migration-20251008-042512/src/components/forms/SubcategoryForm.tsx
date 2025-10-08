/**
 * 🔖 SubcategoryForm - Formulaire pour sous-catégories
 *
 * Formulaire séparé pour la gestion des sous-catégories (niveau 2)
 * CORRECTION: Utilise la table subcategories avec category_id
 */

"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CategoryWithFamily {
  id: string
  name: string
  family_name: string
}

interface Subcategory {
  id: string
  category_id: string // ID de la catégorie parent
  name: string
  slug: string
  description?: string
  image_url?: string
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface SubcategoryFormData {
  parent_id: string // ID de la catégorie parent (mappé depuis category_id)
  family_id: string // Récupéré automatiquement depuis la catégorie parent
  name: string
  description: string
  image_url?: string
  display_order: number
  is_active: boolean
}

interface SubcategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (subcategory: Subcategory) => void
  initialData?: Subcategory | null
  mode: 'create' | 'edit'
  categories: CategoryWithFamily[] // Liste des catégories pour sélection parent
}

export function SubcategoryForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  mode,
  categories
}: SubcategoryFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // État du formulaire - CORRECTION: utiliser category_id au lieu de parent_id
  const [formData, setFormData] = useState<SubcategoryFormData>({
    parent_id: initialData?.category_id || '', // Support mapping category_id -> parent_id
    family_id: '', // Sera récupéré depuis la catégorie
    name: initialData?.name || '',
    description: initialData?.description || '',
    image_url: initialData?.image_url || '',
    display_order: initialData?.sort_order || 1,
    is_active: initialData?.is_active ?? true
  })

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        parent_id: initialData?.category_id || '',
        family_id: '', // Sera récupéré automatiquement
        name: initialData?.name || '',
        description: initialData?.description || '',
        image_url: initialData?.image_url || '',
        display_order: initialData?.sort_order || 1,
        is_active: initialData?.is_active ?? true
      })
    }
  }, [isOpen, initialData])

  // Mise à jour automatique du family_id quand on change de catégorie parent
  const handleCategoryChange = async (categoryId: string) => {
    setFormData(prev => ({ ...prev, parent_id: categoryId }))

    // Récupérer le family_id de la catégorie sélectionnée
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('family_id')
        .eq('id', categoryId)
        .single()

      if (error) throw error

      setFormData(prev => ({ ...prev, family_id: data.family_id }))
    } catch (error) {
      console.error('Erreur récupération family_id catégorie:', error?.message || JSON.stringify(error))
    }
  }

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
      const fileName = `subcategory-${Date.now()}.${fileExt}`
      const filePath = `subcategory-images/${fileName}`

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
      console.error('Erreur upload image sous-catégorie:', error?.message || JSON.stringify(error))
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

  // Soumission du formulaire - CORRECTION: utiliser table subcategories
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "❌ Nom requis",
        description: "Le nom de la sous-catégorie est obligatoire",
        variant: "destructive"
      })
      return
    }

    if (!formData.parent_id) {
      toast({
        title: "❌ Catégorie requise",
        description: "Vous devez sélectionner une catégorie parent",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const slug = generateSlug(formData.name)

      let result

      if (mode === 'create') {
        // CORRECTION: Utiliser la table subcategories avec category_id
        const subcategoryData = {
          category_id: formData.parent_id,
          name: formData.name,
          slug,
          description: formData.description,
          image_url: formData.image_url,
          sort_order: formData.display_order,
          is_active: formData.is_active
        }

        const { data, error } = await supabase
          .from('subcategories')
          .insert([subcategoryData])
          .select()
          .single()

        if (error) throw error
        result = data

        toast({
          title: "✅ Sous-catégorie créée",
          description: `La sous-catégorie "${formData.name}" a été créée`
        })
      } else {
        // CORRECTION: Mettre à jour dans la table subcategories
        const updateData = {
          name: formData.name,
          description: formData.description,
          image_url: formData.image_url,
          sort_order: formData.display_order,
          is_active: formData.is_active,
          slug,
          updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('subcategories')
          .update(updateData)
          .eq('id', initialData!.id)
          .select()
          .single()

        if (error) throw error
        result = data

        toast({
          title: "✅ Sous-catégorie modifiée",
          description: `La sous-catégorie "${formData.name}" a été mise à jour`
        })
      }

      onSubmit(result as Subcategory)
      onClose()

    } catch (error: any) {
      console.error('Erreur soumission formulaire sous-catégorie:', error?.message || JSON.stringify(error))
      toast({
        title: "❌ Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'create' ? 'Nouvelle sous-catégorie' : 'Modifier la sous-catégorie'
  const selectedCategory = categories.find(c => c.id === formData.parent_id)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black">{title}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Créer une nouvelle sous-catégorie dans une catégorie existante' : 'Modifier les informations de cette sous-catégorie'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Catégorie parent */}
          <div className="space-y-2">
            <Label className="text-black">
              Catégorie parent*
            </Label>
            {mode === 'edit' && selectedCategory ? (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm font-medium text-gray-900">
                  {selectedCategory.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Famille: {selectedCategory.family_name}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La catégorie parent ne peut pas être modifiée après création pour préserver la cohérence de l'arborescence.
                </p>
              </div>
            ) : (
              <Select
                value={formData.parent_id}
                onValueChange={handleCategoryChange}
                required
              >
                <SelectTrigger className="border-gray-300 focus:border-black">
                  <SelectValue placeholder="Sélectionnez une catégorie..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-gray-500">
                          Famille: {category.family_name}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-black">
              Nom de la sous-catégorie*
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Chaises de bureau, Tables basses..."
              className="border-gray-300 focus:border-black"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-black">
              Description de la sous-catégorie
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de cette sous-catégorie"
              className="border-gray-300 focus:border-black resize-none"
              rows={3}
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label className="text-black">Image de la sous-catégorie</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {formData.image_url ? (
                <div className="relative">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300 hover:bg-gray-50"
            >
              Annuler
            </Button>
            <Button
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
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}