"use client"

import { useState, useEffect } from "react"
import { Upload, X, Loader2, Save, Package, Info, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Alert, AlertDescription } from "../ui/alert"
import { useProducts } from "../../hooks/use-products"
import { CategorySelector } from "../business/category-selector"
import { useToast } from "../../hooks/use-toast"
import { createClient } from "../../lib/supabase/client"
import { cn } from "../../lib/utils"

interface DefinitiveProductFormProps {
  onSuccess?: (productId: string) => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
  creation_mode?: 'sourcing' | 'complete'
  existingProduct?: any
  initialData?: {
    name?: string
    supplier_page_url?: string
    product_type?: 'standard' | 'custom'
    assigned_client_id?: string
  }
}

export function DefinitiveProductForm({
  onSuccess,
  onCancel,
  mode = 'create',
  creation_mode = 'complete',
  existingProduct,
  initialData
}: DefinitiveProductFormProps) {
  const { toast } = useToast()
  const { createProduct } = useProducts()
  const supabase = createClient()

  // État simplifié du formulaire
  const [formData, setFormData] = useState({
    name: existingProduct?.name || initialData?.name || "",
    description: existingProduct?.description || "",
    cost_price: existingProduct?.cost_price || "",
    subcategory_id: existingProduct?.subcategory_id || "",
    brand: existingProduct?.brand || "",
    supplier_page_url: existingProduct?.supplier_page_url || initialData?.supplier_page_url || "",
    product_type: existingProduct?.product_type || initialData?.product_type || "standard",
    creation_mode: existingProduct?.creation_mode || creation_mode
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Gestion de la sélection de fichiers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (selectedFiles.length + files.length > 10) {
      toast({
        title: "Limite dépassée",
        description: "Maximum 10 images par produit",
        variant: "destructive"
      })
      return
    }

    // Créer les previews
    const newPreviews: string[] = []
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === files.length) {
          setPreviews([...previews, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    setSelectedFiles([...selectedFiles, ...files])
  }

  // Upload d'image
  const uploadProductImage = async (file: File, productId: string, displayOrder: number) => {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `products/${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: imageRecord, error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          storage_path: uploadData.path,
          is_primary: displayOrder === 0,
          image_type: displayOrder === 0 ? 'primary' : 'gallery',
          alt_text: formData.name || file.name,
          file_size: file.size,
          format: fileExt || 'jpg',
          display_order: displayOrder
        })
        .select()
        .single()

      if (dbError) {
        await supabase.storage.from('product-images').remove([uploadData.path])
        throw dbError
      }

      return imageRecord
    } catch (error) {
      console.error(`Erreur upload image:`, error)
      throw error
    }
  }

  // Validation du formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 5) {
      newErrors.name = "Le nom doit contenir au moins 5 caractères"
    }

    if (!formData.cost_price || parseFloat(formData.cost_price) <= 0) {
      newErrors.cost_price = "Le prix d'achat est obligatoire et doit être supérieur à 0"
    }

    if (!formData.description || formData.description.length < 10) {
      newErrors.description = "La description doit contenir au moins 10 caractères"
    }

    if (!formData.subcategory_id) {
      newErrors.subcategory = "La catégorie est obligatoire"
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
      // Préparer les données du produit
      const productData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        cost_price: parseFloat(formData.cost_price),
        subcategory_id: formData.subcategory_id,
        product_type: formData.product_type,
        creation_mode: formData.creation_mode,
        availability_type: "normal",
        condition: "new"
      }

      // Ajouter les champs optionnels
      if (formData.brand) productData.brand = formData.brand.trim()
      if (formData.supplier_page_url) productData.supplier_page_url = formData.supplier_page_url.trim()

      const product = await createProduct(productData)

      if (!product?.id) {
        throw new Error("Erreur lors de la sauvegarde du produit")
      }

      // Upload des images
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map((file, index) =>
          uploadProductImage(file, product.id, index)
        )

        try {
          await Promise.all(uploadPromises)
          console.log(`✅ ${selectedFiles.length} images uploadées`)
        } catch (uploadError) {
          console.error("Erreur upload images:", uploadError)
          toast({
            title: "⚠️ Avertissement",
            description: "Le produit a été créé mais certaines images n'ont pas pu être uploadées",
            variant: "default"
          })
        }
      }

      // Créer le package par défaut
      await supabase
        .from('product_packages')
        .insert({
          product_id: product.id,
          name: 'Unité',
          type: 'single',
          base_quantity: 1,
          min_order_quantity: 1,
          is_default: true,
          is_active: true,
          description: 'Vente à l\'unité'
        })

      toast({
        title: "✅ Produit créé avec succès !",
        description: `${formData.name} a été ajouté au catalogue`
      })

      if (onSuccess) {
        onSuccess(product.id)
      }

    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "❌ Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder le produit",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-black">
                Créer un nouveau produit
              </CardTitle>
              <CardDescription className="mt-1">
                Formulaire complet selon règles métier Vérone
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-white">
              <Package className="h-4 w-4 mr-1" />
              Mode Complet
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="pricing">Prix</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              {/* Nom du produit */}
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Chaise design moderne..."
                  className={cn(
                    "border-gray-300 focus:border-black",
                    errors.name && "border-red-300"
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description détaillée du produit..."
                  rows={4}
                  className={cn(
                    "border-gray-300 focus:border-black",
                    errors.description && "border-red-300"
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <CategorySelector
                  value={formData.subcategory_id}
                  onChange={(subcategoryId, hierarchy) => setFormData({ ...formData, subcategory_id: subcategoryId })}
                />
                {errors.subcategory && (
                  <p className="text-sm text-red-600">{errors.subcategory}</p>
                )}
              </div>

              {/* Marque */}
              <div className="space-y-2">
                <Label htmlFor="brand">Marque</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ex: Vérone Collection..."
                  className="border-gray-300 focus:border-black"
                />
              </div>

              {/* URL Fournisseur */}
              <div className="space-y-2">
                <Label htmlFor="supplier_url">URL Page Fournisseur</Label>
                <Input
                  id="supplier_url"
                  value={formData.supplier_page_url}
                  onChange={(e) => setFormData({ ...formData, supplier_page_url: e.target.value })}
                  placeholder="https://fournisseur.com/produit..."
                  className="border-gray-300 focus:border-black"
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              {/* Prix d'achat */}
              <div className="space-y-2">
                <Label htmlFor="cost_price">Prix d'achat (€ HT) *</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0.00"
                  className={cn(
                    "border-gray-300 focus:border-black",
                    errors.cost_price && "border-red-300"
                  )}
                />
                {errors.cost_price && (
                  <p className="text-sm text-red-600">{errors.cost_price}</p>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Le SKU, les prix de vente et la TVA seront calculés automatiquement selon les règles métier Vérone.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
              {/* Upload d'images */}
              <div className="space-y-4">
                <Label>Images du produit</Label>

                {/* Zone de drop */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <Label
                        htmlFor="image-upload"
                        className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Sélectionner des images
                      </Label>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      PNG, JPG, WEBP jusqu'à 5MB chacune. Maximum 10 images.
                    </p>
                  </div>
                </div>

                {/* Aperçu des images */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
                            setPreviews(previews.filter((_, i) => i !== index))
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {index === 0 && (
                          <Badge className="absolute bottom-2 left-2 bg-green-600">
                            Principale
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer le produit
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}