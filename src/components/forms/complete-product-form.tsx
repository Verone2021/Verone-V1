"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, Loader2, Save, Package, Info, Image as ImageIcon, Plus } from "lucide-react"
import { ButtonV2 } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useProducts } from "../../hooks/use-products"
import { useCategories } from "../../hooks/use-categories"
import { useSuppliers } from "../../hooks/use-organisations"
import { useToast } from "../../hooks/use-toast"
import { createClient } from "../../lib/supabase/client"
import Image from "next/image"

const supabase = createClient()

interface CompleteProductFormProps {
  onSuccess?: (productId: string) => void
  onCancel?: () => void
}

export default function CompleteProductForm({ onSuccess, onCancel }: CompleteProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { categories } = useCategories()
  const { suppliers } = useSuppliers()
  const { createProduct } = useProducts()

  // État du formulaire selon nouvelles règles business
  const [formData, setFormData] = useState({
    // Champs obligatoires (nouvelles règles métier)
    name: "",
    description: "",
    subcategory_id: "",
    
    // NOUVEAU: Pricing avec supplier_cost_price
    supplier_cost_price: "", // Prix d'achat fournisseur HT (OBLIGATOIRE)
    margin_percentage: "", // Marge en pourcentage (optionnel)
    
    // Statut séparé selon nouvelles règles
    availability_type: "normal" as const, // Type disponibilité manuel
    condition: "new" as const,

    // Fournisseur
    supplier_id: "",

    // Champs optionnels
    brand: "",
    technical_description: "",
    selling_points: [] as string[],
    supplier_reference: "",
    supplier_page_url: "",
    gtin: "",

    // Caractéristiques physiques (champs DB réels)
    weight: "",
    dimensions: {
      width: "",
      height: "",
      depth: ""
    },

    // Attributs de variante (structure JSON existante)
    variant_attributes: {
      color: "",
      material: "",
      finish: ""
    }
  })

  // État des images
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculer le prix minimum de vente (pour information uniquement)
  const calculateMinimumSellingPrice = () => {
    if (formData.supplier_cost_price && formData.margin_percentage) {
      const cost = parseFloat(formData.supplier_cost_price)
      const margin = parseFloat(formData.margin_percentage)
      if (cost > 0 && margin >= 0) {
        return (cost * (1 + margin / 100)).toFixed(2)
      }
    }
    return ""
  }

  // Ajout d'un point de vente
  const addSellingPoint = () => {
    setFormData({
      ...formData,
      selling_points: [...formData.selling_points, ""]
    })
  }

  // Suppression d'un point de vente
  const removeSellingPoint = (index: number) => {
    setFormData({
      ...formData,
      selling_points: formData.selling_points.filter((_, i) => i !== index)
    })
  }

  // Mise à jour d'un point de vente
  const updateSellingPoint = (index: number, value: string) => {
    const updatedPoints = [...formData.selling_points]
    updatedPoints[index] = value
    setFormData({
      ...formData,
      selling_points: updatedPoints
    })
  }

  // Gestion de la sélection de fichiers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (selectedFiles.length + files.length > 10) {
      toast({
        title: "Trop d'images",
        description: "Maximum 10 images par produit",
        variant: "destructive"
      })
      return
    }

    // Créer les previews
    const newPreviews: string[] = []
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse 5MB`,
          variant: "destructive"
        })
        return
      }

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

  // Supprimer une image
  const removeImage = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  // Upload direct d'une image
  const uploadProductImage = async (file: File, productId: string, displayOrder: number) => {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `products/${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Créer l'enregistrement dans la table
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

  // Validation du formulaire selon nouvelles règles
  const validateForm = () => {
    const errors: string[] = []

    if (!formData.name.trim()) errors.push("Nom du produit requis")
    if (!formData.supplier_cost_price || parseFloat(formData.supplier_cost_price) <= 0) {
      errors.push("Prix d'achat fournisseur requis et doit être supérieur à 0")
    }
    if (!formData.subcategory_id) errors.push("Catégorie requise")

    // Validation GTIN
    if (formData.gtin && !/^\d+$/.test(formData.gtin)) {
      errors.push("GTIN doit contenir uniquement des chiffres")
    }

    if (errors.length > 0) {
      toast({
        title: "Erreurs de validation",
        description: errors.join(", "),
        variant: "destructive"
      })
      return false
    }

    return true
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Préparer les données du produit selon nouvelles règles
      const productData: any = {
        name: formData.name.trim(),
        // NOUVEAU: Utiliser supplier_cost_price au lieu de cost_price/price_ht
        supplier_cost_price: parseFloat(formData.supplier_cost_price),
        availability_type: formData.availability_type,
        condition: formData.condition,
        subcategory_id: formData.subcategory_id,
      }

      // Champs optionnels
      if (formData.supplier_id) productData.supplier_id = formData.supplier_id
      if (formData.brand) productData.brand = formData.brand.trim()
      if (formData.description) productData.description = formData.description.trim()
      if (formData.technical_description) productData.technical_description = formData.technical_description.trim()
      if (formData.selling_points.length > 0) {
        productData.selling_points = formData.selling_points.filter(point => point.trim() !== "")
      }
      if (formData.supplier_reference) productData.supplier_reference = formData.supplier_reference.trim()
      if (formData.supplier_page_url) productData.supplier_page_url = formData.supplier_page_url.trim()
      if (formData.gtin) productData.gtin = formData.gtin.trim()
      if (formData.margin_percentage) productData.margin_percentage = parseFloat(formData.margin_percentage)
      if (formData.weight) productData.weight = parseFloat(formData.weight)

      // Dimensions
      const dims: any = {}
      if (formData.dimensions.width) dims.width = parseFloat(formData.dimensions.width)
      if (formData.dimensions.height) dims.height = parseFloat(formData.dimensions.height)
      if (formData.dimensions.depth) dims.depth = parseFloat(formData.dimensions.depth)
      if (Object.keys(dims).length > 0) productData.dimensions = dims

      // Attributs variantes
      const attrs: any = {}
      if (formData.variant_attributes.color) attrs.color = formData.variant_attributes.color
      if (formData.variant_attributes.material) attrs.material = formData.variant_attributes.material
      if (formData.variant_attributes.finish) attrs.finish = formData.variant_attributes.finish
      if (Object.keys(attrs).length > 0) productData.variant_attributes = attrs

      // 1. Créer le produit
      const product = await createProduct(productData)

      if (!product?.id) {
        throw new Error("Erreur lors de la création du produit")
      }

      // 2. Upload des images en parallèle si présentes
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map((file, index) =>
          uploadProductImage(file, product.id, index)
        )

        try {
          await Promise.all(uploadPromises)
          console.log(`✅ ${selectedFiles.length} images uploadées`)
        } catch (uploadError) {
          console.error("Erreur upload images:", uploadError)
          // Le produit est créé, on continue
        }
      }

      toast({
        title: "✅ Produit créé avec succès !",
        description: `${formData.name} a été ajouté au catalogue`,
      })

      if (onSuccess) {
        onSuccess(product.id)
      }

    } catch (error) {
      console.error("Erreur création produit:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le produit",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Récupérer les sous-catégories pour le select
  const subcategories = categories?.flatMap(cat => 
    cat.subcategories?.map(sub => ({
      ...sub,
      category: { name: cat.name }
    })) || []
  ) || []

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-black">Créer un nouveau produit</h3>
              <p className="text-gray-600 mt-1">Formulaire complet selon règles métier Vérone</p>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Mode Complet</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black">
              Général
            </TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black">
              Prix
            </TabsTrigger>
            <TabsTrigger value="images" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black">
              Images
            </TabsTrigger>
          </TabsList>

          {/* Onglet Général */}
          <TabsContent value="general" className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Chaise design moderne..."
                  className="border-gray-300 focus:border-black"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Catégorie *</Label>
                <Select
                  value={formData.subcategory_id}
                  onValueChange={(value) => setFormData({...formData, subcategory_id: value})}
                >
                  <SelectTrigger className="border-gray-300 focus:border-black">
                    <SelectValue placeholder="Sélectionner une catégorie..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.category?.name} / {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marque</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  placeholder="Ex: Vérone Collection..."
                  className="border-gray-300 focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_page_url">URL Page Fournisseur</Label>
                <Input
                  id="supplier_page_url"
                  value={formData.supplier_page_url}
                  onChange={(e) => setFormData({...formData, supplier_page_url: e.target.value})}
                  placeholder="https://fournisseur.com/produit..."
                  className="border-gray-300 focus:border-black"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Description détaillée du produit..."
                className="border-gray-300 focus:border-black min-h-[80px]"
                required
              />
            </div>
          </TabsContent>

          {/* Onglet Prix */}
          <TabsContent value="pricing" className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_cost_price">Prix d'achat (€ HT) *</Label>
                <Input
                  id="supplier_cost_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.supplier_cost_price}
                  onChange={(e) => setFormData({...formData, supplier_cost_price: e.target.value})}
                  placeholder="150.00"
                  className="border-gray-300 focus:border-black"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin_percentage">Marge (%)</Label>
                <Input
                  id="margin_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1000"
                  value={formData.margin_percentage}
                  onChange={(e) => setFormData({...formData, margin_percentage: e.target.value})}
                  placeholder="50"
                  className="border-gray-300 focus:border-black"
                />
              </div>
            </div>

            {calculateMinimumSellingPrice() && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-700">Prix minimum de vente calculé :</span>
                  <span className="font-bold text-blue-900">{calculateMinimumSellingPrice()} €</span>
                </div>
              </div>
            )}

            <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-gray-900" />
                <span className="text-sm text-gray-900 font-medium">Information</span>
              </div>
              <p className="text-sm text-white mt-1">
                Le SKU, les prix de vente et la TVA seront calculés automatiquement selon les règles métier Vérone.
              </p>
            </div>
          </TabsContent>

          {/* Onglet Images */}
          <TabsContent value="images" className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Images du produit</Label>
                <Badge variant="secondary">
                  {selectedFiles.length}/10 images
                </Badge>
              </div>

              {/* Zone d'upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-black transition-colors">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isSubmitting || selectedFiles.length >= 10}
                  className="hidden"
                />

                <label
                  htmlFor="images"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="p-4 bg-gray-100 rounded-full">
                    <ImageIcon className="h-10 w-10 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-black">
                      Cliquez ou glissez des images ici
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG, WEBP • Max 10 images • 5MB par image
                    </p>
                  </div>
                </label>
              </div>

              {/* Preview des images */}
              {previews.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-black">
                    Images sélectionnées
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            width={200}
                            height={200}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        {/* Badge image principale */}
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded shadow">
                            Image principale
                          </div>
                        )}

                        {/* Badge ordre */}
                        <div className="absolute bottom-2 left-2 bg-white text-black text-xs px-2 py-1 rounded shadow">
                          #{index + 1}
                        </div>

                        {/* Bouton supprimer */}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110"
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </ButtonV2>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-black hover:bg-gray-800"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Créer le produit
              </>
            )}
          </ButtonV2>
        </div>
      </div>
    </form>
  )
}
