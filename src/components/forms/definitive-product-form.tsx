"use client"

import { useState, useEffect } from "react"
import {
  Upload, X, Loader2, Save, Package, Info, Image as ImageIcon,
  AlertCircle, CheckCircle, Plus, Trash2, Euro, Percent,
  Link, Tag, Building, Box, Calculator, Eye
} from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Alert, AlertDescription } from "../ui/alert"
import { Switch } from "../ui/switch"
import { useProducts } from "../../hooks/use-products"
import { useSubcategories } from "../../hooks/use-subcategories"
import { useSuppliers } from "../../hooks/use-organisations"
import { useToast } from "../../hooks/use-toast"
import { createClient } from "../../lib/supabase/client"
import Image from "next/image"
import { cn } from "../../lib/utils"

interface DefinitiveProductFormProps {
  onSuccess?: (productId: string) => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
  existingProduct?: any
}

// Statuts de disponibilité (automatique basé sur stock)
const STOCK_STATUSES = [
  { value: 'in_stock', label: 'En stock', icon: '✅', color: 'bg-green-100 text-green-800' },
  { value: 'out_of_stock', label: 'Rupture de stock', icon: '❌', color: 'bg-red-100 text-red-800' }
]

// Types de disponibilité (manuel)
const AVAILABILITY_TYPES = [
  { value: 'normal', label: 'Normal', icon: '📦', color: 'bg-gray-100 text-gray-800' },
  { value: 'preorder', label: 'Précommande', icon: '📅', color: 'bg-blue-100 text-blue-800' },
  { value: 'coming_soon', label: 'Bientôt disponible', icon: '⏳', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'discontinued', label: 'Arrêté', icon: '🚫', color: 'bg-red-100 text-red-800' }
]

// Points de vente dynamiques
const DEFAULT_SELLING_POINTS = [
  'Design moderne et élégant',
  'Fabrication de qualité',
  'Livraison rapide',
  'Garantie constructeur'
]

const PRODUCT_CONDITIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'refurbished', label: 'Reconditionné' },
  { value: 'used', label: 'Occasion' }
]

export function DefinitiveProductForm({
  onSuccess,
  onCancel,
  mode = 'create',
  existingProduct
}: DefinitiveProductFormProps) {
  const { toast } = useToast()
  const { createProduct, updateProduct } = useProducts()
  const { subcategories } = useSubcategories()
  const { organisations: suppliers } = useSuppliers()
  const supabase = createClient()

  // État complet du formulaire selon nouvelles règles métier
  const [formData, setFormData] = useState({
    // Champs obligatoires
    name: existingProduct?.name || "",
    // SKU supprimé - sera généré automatiquement

    // Champs de base
    slug: existingProduct?.slug || "",
    condition: existingProduct?.condition || "new",

    // Type de disponibilité (manuel)
    availability_type: existingProduct?.availability_type || "normal",

    // Tarification - Prix d'achat obligatoire
    cost_price: existingProduct?.cost_price || "",
    // Prix de vente et TVA supprimés du formulaire

    // Relations
    subcategory_id: existingProduct?.subcategory_id || "",
    supplier_id: existingProduct?.supplier_id || "",

    // Descriptions séparées selon règles business
    description: existingProduct?.description || "", // Description principale visible client
    technical_description: existingProduct?.technical_description || "", // Description technique détaillée

    // Points de vente (array)
    selling_points: existingProduct?.selling_points || [],

    // Détails produit
    brand: existingProduct?.brand || "",
    supplier_reference: existingProduct?.supplier_reference || "",
    supplier_page_url: existingProduct?.supplier_page_url || "",
    gtin: existingProduct?.gtin || "",
    video_url: existingProduct?.video_url || "",

    // Stock management supprimé du formulaire

    // Caractéristiques physiques alignées DB
    weight: existingProduct?.weight || "",
    dimensions: existingProduct?.dimensions || {
      width: "",
      height: "",
      depth: ""
    },

    // Attributs variante (JSON) alignés DB
    variant_attributes: existingProduct?.variant_attributes || {
      color: "",
      material: "",
      finish: "",
      size: ""
    }
  })

  // État des images
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  // États de validation
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // État pour les points de vente
  const [newSellingPoint, setNewSellingPoint] = useState("")

  // Calculs automatiques
  useEffect(() => {
    // Générer le slug automatiquement depuis le nom
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name])

  // Calculs automatiques supprimés - pricing géré séparément selon business rules

  // Validation en temps réel
  const validateField = (field: string, value: any) => {
    let error = ""

    switch(field) {
      case 'name':
        if (!value || value.length < 5) error = "Le nom doit contenir au moins 5 caractères"
        if (value.length > 200) error = "Le nom ne peut pas dépasser 200 caractères"
        break
      case 'cost_price':
        if (!value || parseFloat(value) <= 0) error = "Le prix d'achat est obligatoire et doit être supérieur à 0"
        break
      case 'description':
        if (!value || value.length < 10) error = "La description doit contenir au moins 10 caractères"
        break
      case 'gtin':
        if (value && !/^\d+$/.test(value)) {
          error = "Le code GTIN doit contenir uniquement des chiffres"
        }
        break
      // Tax rate validation supprimée - plus dans le formulaire
      case 'supplier_page_url':
      case 'video_url':
        if (value && !value.startsWith('http')) {
          error = "L'URL doit commencer par http:// ou https://"
        }
        break
    }

    setErrors(prev => ({ ...prev, [field]: error }))
    return !error
  }

  // Gestion du blur pour la validation
  const handleBlur = (field: string, value: any) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, value)
  }

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

    // Vérifier la taille des fichiers
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast({
        title: "Fichiers trop volumineux",
        description: `${oversizedFiles.map(f => f.name).join(', ')} dépassent 5MB`,
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

  // Supprimer une image
  const removeImage = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  // Upload direct d'une image avec toutes les métadonnées
  const uploadProductImage = async (
    file: File,
    productId: string,
    displayOrder: number
  ) => {
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

      // Créer l'enregistrement avec toutes les métadonnées
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
          display_order: displayOrder,
          // Note: width et height peuvent être ajoutés plus tard avec un traitement d'image
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

  // Validation complète du formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validation des champs obligatoires selon nouvelles règles
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

    // Validation des URLs
    if (formData.supplier_page_url && !formData.supplier_page_url.startsWith('http')) {
      newErrors.supplier_page_url = "L'URL doit commencer par http:// ou https://"
    }

    if (formData.video_url && !formData.video_url.startsWith('http')) {
      newErrors.video_url = "L'URL vidéo doit commencer par http:// ou https://"
    }

    // Validation GTIN
    if (formData.gtin && !/^\d+$/.test(formData.gtin)) {
      newErrors.gtin = "Le code GTIN doit contenir uniquement des chiffres"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      // Aller au premier onglet avec erreur
      if (newErrors.name || newErrors.subcategory || newErrors.description) {
        setActiveTab("general")
      } else if (newErrors.cost_price) {
        setActiveTab("pricing")
      }

      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs avant de continuer",
        variant: "destructive"
      })

      return false
    }

    return true
  }

  // Soumission du formulaire
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Préparer les données du produit selon nouvelles règles
      const productData: any = {
        name: formData.name.trim(),
        // SKU sera généré automatiquement par la DB
        availability_type: formData.availability_type,
        condition: formData.condition,
        cost_price: parseFloat(formData.cost_price), // Obligatoire
        description: formData.description.trim(),
        technical_description: formData.technical_description?.trim() || null,
        selling_points: formData.selling_points.filter(point => point.trim() !== ''),
      }

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (formData.slug) productData.slug = formData.slug
      if (formData.subcategory_id) productData.subcategory_id = formData.subcategory_id
      if (formData.supplier_id) productData.supplier_id = formData.supplier_id
      if (formData.brand) productData.brand = formData.brand.trim()
      if (formData.supplier_reference) productData.supplier_reference = formData.supplier_reference.trim()
      if (formData.supplier_page_url) productData.supplier_page_url = formData.supplier_page_url.trim()
      if (formData.gtin) productData.gtin = formData.gtin.trim()
      if (formData.video_url) productData.video_url = formData.video_url.trim()
      // Cost_price déjà inclus comme obligatoire
      // Pricing management supprimé du formulaire
      if (formData.weight) productData.weight = parseFloat(formData.weight)

      // Gérer les dimensions
      const dims: any = {}
      if (formData.dimensions.width) dims.width = parseFloat(formData.dimensions.width)
      if (formData.dimensions.height) dims.height = parseFloat(formData.dimensions.height)
      if (formData.dimensions.depth) dims.depth = parseFloat(formData.dimensions.depth)
      if (Object.keys(dims).length > 0) productData.dimensions = dims

      // Gérer les attributs de variante
      const attrs: any = {}
      if (formData.variant_attributes.color) attrs.color = formData.variant_attributes.color
      if (formData.variant_attributes.material) attrs.material = formData.variant_attributes.material
      if (formData.variant_attributes.finish) attrs.finish = formData.variant_attributes.finish
      if (formData.variant_attributes.size) attrs.size = formData.variant_attributes.size
      if (Object.keys(attrs).length > 0) productData.variant_attributes = attrs

      // Créer ou mettre à jour le produit
      let product
      if (mode === 'edit' && existingProduct?.id) {
        product = await updateProduct(existingProduct.id, productData)
      } else {
        product = await createProduct(productData)
      }

      if (!product?.id) {
        throw new Error("Erreur lors de la sauvegarde du produit")
      }

      // Upload des nouvelles images
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map((file, index) =>
          uploadProductImage(file, product.id, existingImages.length + index)
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

      // Créer le package par défaut si nouveau produit
      if (mode === 'create') {
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
      }

      toast({
        title: mode === 'create' ? "✅ Produit créé avec succès !" : "✅ Produit mis à jour !",
        description: `${formData.name} a été ${mode === 'create' ? 'ajouté au' : 'mis à jour dans le'} catalogue`,
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
                {mode === 'create' ? 'Créer un nouveau produit' : 'Modifier le produit'}
              </CardTitle>
              <CardDescription className="mt-1">
                Formulaire complet avec tous les champs disponibles
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {mode === 'create' ? 'Nouveau' : 'Édition'}
            </Badge>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-white">
            <TabsTrigger
              value="general"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-gray-50"
            >
              <Info className="h-4 w-4 mr-2" />
              Informations générales
              {(errors.name || errors.description || errors.subcategory) && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 rounded-full">!</Badge>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="pricing"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-gray-50"
            >
              <Euro className="h-4 w-4 mr-2" />
              Prix d'achat
              {errors.cost_price && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 rounded-full">!</Badge>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="supplier"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-gray-50"
            >
              <Building className="h-4 w-4 mr-2" />
              Fournisseur & Références
            </TabsTrigger>

            <TabsTrigger
              value="characteristics"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-gray-50"
            >
              <Box className="h-4 w-4 mr-2" />
              Caractéristiques
            </TabsTrigger>

            <TabsTrigger
              value="images"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-gray-50"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Images & Médias
              <Badge variant="secondary" className="ml-2">
                {selectedFiles.length + existingImages.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* ONGLET 1 : Informations générales */}
          <TabsContent value="general" className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom du produit */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Nom du produit
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({...formData, name: e.target.value})
                    if (touched.name) validateField('name', e.target.value)
                  }}
                  onBlur={(e) => handleBlur('name', e.target.value)}
                  placeholder="Ex: Chaise Design Milano"
                  className={cn(
                    "border-gray-300 focus:border-black",
                    errors.name && touched.name && "border-red-500"
                  )}
                  required
                />
                {errors.name && touched.name && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku" className="flex items-center">
                  Référence SKU
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => {
                    setFormData({...formData, sku: e.target.value})
                    if (touched.sku) validateField('sku', e.target.value)
                  }}
                  onBlur={(e) => handleBlur('sku', e.target.value)}
                  placeholder="Ex: CHA-MIL-001"
                  className={cn(
                    "uppercase border-gray-300 focus:border-black",
                    errors.sku && touched.sku && "border-red-500"
                  )}
                  required
                />
                {errors.sku && touched.sku && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.sku}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="flex items-center">
                  Slug URL
                  <Badge variant="outline" className="ml-2 text-xs">Auto</Badge>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="chaise-design-milano"
                  className="border-gray-300 focus:border-black"
                />
                <p className="text-xs text-gray-500">
                  Généré automatiquement depuis le nom
                </p>
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <Label htmlFor="subcategory" className="flex items-center">
                  Catégorie
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.subcategory_id}
                  onValueChange={(value) => {
                    setFormData({...formData, subcategory_id: value})
                    if (touched.subcategory) validateField('subcategory', value)
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "border-gray-300 focus:border-black",
                      errors.subcategory && touched.subcategory && "border-red-500"
                    )}
                  >
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories?.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.category?.family?.name} → {sub.category?.name} → {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subcategory && touched.subcategory && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.subcategory}
                  </p>
                )}
              </div>

              {/* Marque */}
              <div className="space-y-2">
                <Label htmlFor="brand">Marque</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  placeholder="Ex: Vérone Collection"
                  className="border-gray-300 focus:border-black"
                />
              </div>

              {/* Statut */}
              <div className="space-y-2">
                <Label htmlFor="status">Statut de disponibilité</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger className="border-gray-300 focus:border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center">
                          <span className="mr-2">{status.icon}</span>
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value: any) => setFormData({...formData, condition: value})}
                >
                  <SelectTrigger className="border-gray-300 focus:border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CONDITIONS.map(condition => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Affichage du statut actuel */}
            <Alert className="border-gray-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Statut actuel :</strong> {' '}
                <Badge className={PRODUCT_STATUSES.find(s => s.value === formData.status)?.color}>
                  {PRODUCT_STATUSES.find(s => s.value === formData.status)?.icon} {' '}
                  {PRODUCT_STATUSES.find(s => s.value === formData.status)?.label}
                </Badge>
                {' • '}
                <strong>Condition :</strong> {' '}
                {PRODUCT_CONDITIONS.find(c => c.value === formData.condition)?.label}
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* ONGLET 2 : Tarification & Stock */}
          <TabsContent value="pricing" className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Prix de vente HT */}
              <div className="space-y-2">
                <Label htmlFor="price_ht" className="flex items-center">
                  Prix de vente HT (€)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="price_ht"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_ht}
                    onChange={(e) => {
                      setFormData({...formData, price_ht: e.target.value})
                      if (touched.price_ht) validateField('price_ht', e.target.value)
                    }}
                    onBlur={(e) => handleBlur('price_ht', e.target.value)}
                    placeholder="299.99"
                    className={cn(
                      "pl-10 border-gray-300 focus:border-black",
                      errors.price_ht && touched.price_ht && "border-red-500"
                    )}
                    required
                  />
                </div>
                {errors.price_ht && touched.price_ht && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.price_ht}
                  </p>
                )}
              </div>

              {/* Prix d'achat HT */}
              <div className="space-y-2">
                <Label htmlFor="cost_price">Prix d'achat HT (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                    placeholder="150.00"
                    className="pl-10 border-gray-300 focus:border-black"
                  />
                </div>
              </div>

              {/* Taux de TVA */}
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Taux de TVA</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.0001"
                    min="0"
                    max="1"
                    value={formData.tax_rate}
                    onChange={(e) => {
                      setFormData({...formData, tax_rate: e.target.value})
                      validateField('tax_rate', e.target.value)
                    }}
                    placeholder="0.2000"
                    className="pl-10 border-gray-300 focus:border-black"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Valeur entre 0 et 1 (0.20 = 20%)
                </p>
              </div>

              {/* Marge */}
              <div className="space-y-2">
                <Label htmlFor="margin">Marge (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="margin"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1000"
                    value={formData.margin_percentage}
                    onChange={(e) => setFormData({...formData, margin_percentage: e.target.value})}
                    placeholder="50"
                    className="pl-10 border-gray-300 focus:border-black"
                  />
                </div>
              </div>

              {/* Prix de vente estimé */}
              <div className="space-y-2">
                <Label htmlFor="estimated">Prix de vente estimé (€)</Label>
                <div className="relative">
                  <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="estimated"
                    type="number"
                    step="0.01"
                    value={formData.estimated_selling_price}
                    onChange={(e) => setFormData({...formData, estimated_selling_price: e.target.value})}
                    placeholder="Calculé automatiquement"
                    className="pl-10 border-gray-300 focus:border-black bg-gray-50"
                    readOnly
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Calculé depuis le prix d'achat et la marge
                </p>
              </div>
            </div>

            {/* Section Stock */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Gestion du stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock actuel</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    placeholder="100"
                    className="border-gray-300 focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_stock">Stock minimum d'alerte</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                    placeholder="5"
                    className="border-gray-300 focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Résumé des calculs */}
            {(formData.cost_price && formData.margin_percentage) && (
              <Alert className="border-blue-200 bg-blue-50">
                <Calculator className="h-4 w-4" />
                <AlertDescription>
                  <strong>Calculs automatiques :</strong><br/>
                  Prix d'achat : {formData.cost_price}€ HT<br/>
                  Marge : {formData.margin_percentage}%<br/>
                  Prix de vente estimé : {formData.estimated_selling_price}€ HT<br/>
                  Prix TTC (TVA {(parseFloat(formData.tax_rate) * 100).toFixed(0)}%) : {(parseFloat(formData.estimated_selling_price || formData.price_ht) * (1 + parseFloat(formData.tax_rate))).toFixed(2)}€
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* ONGLET 3 : Fournisseur & Références */}
          <TabsContent value="supplier" className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fournisseur */}
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({...formData, supplier_id: value})}
                >
                  <SelectTrigger className="border-gray-300 focus:border-black">
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          {supplier.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Référence fournisseur */}
              <div className="space-y-2">
                <Label htmlFor="supplier_reference">Référence fournisseur</Label>
                <Input
                  id="supplier_reference"
                  value={formData.supplier_reference}
                  onChange={(e) => setFormData({...formData, supplier_reference: e.target.value})}
                  placeholder="REF-FOURNISSEUR-123"
                  className="border-gray-300 focus:border-black"
                />
              </div>

              {/* Code GTIN/EAN */}
              <div className="space-y-2">
                <Label htmlFor="gtin">Code GTIN/EAN</Label>
                <Input
                  id="gtin"
                  value={formData.gtin}
                  onChange={(e) => {
                    setFormData({...formData, gtin: e.target.value})
                    if (touched.gtin) validateField('gtin', e.target.value)
                  }}
                  onBlur={(e) => handleBlur('gtin', e.target.value)}
                  placeholder="3700000000000"
                  className={cn(
                    "border-gray-300 focus:border-black",
                    errors.gtin && touched.gtin && "border-red-500"
                  )}
                />
                {errors.gtin && touched.gtin && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.gtin}
                  </p>
                )}
              </div>
            </div>

            {/* URL page fournisseur */}
            <div className="space-y-2">
              <Label htmlFor="supplier_url">URL page produit fournisseur</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="supplier_url"
                  type="url"
                  value={formData.supplier_page_url}
                  onChange={(e) => {
                    setFormData({...formData, supplier_page_url: e.target.value})
                    if (touched.supplier_page_url) validateField('supplier_page_url', e.target.value)
                  }}
                  onBlur={(e) => handleBlur('supplier_page_url', e.target.value)}
                  placeholder="https://fournisseur.com/produit/123"
                  className={cn(
                    "pl-10 border-gray-300 focus:border-black",
                    errors.supplier_page_url && touched.supplier_page_url && "border-red-500"
                  )}
                />
              </div>
              {errors.supplier_page_url && touched.supplier_page_url && (
                <p className="text-xs text-red-500 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.supplier_page_url}
                </p>
              )}
            </div>
          </TabsContent>

          {/* ONGLET 4 : Caractéristiques */}
          <TabsContent value="characteristics" className="p-6 space-y-6">
            {/* Dimensions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Dimensions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Largeur (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.dimensions.width}
                    onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, width: e.target.value}})}
                    placeholder="50"
                    className="border-gray-300 focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Hauteur (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.dimensions.height}
                    onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, height: e.target.value}})}
                    placeholder="80"
                    className="border-gray-300 focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depth">Profondeur (cm)</Label>
                  <Input
                    id="depth"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.dimensions.depth}
                    onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, depth: e.target.value}})}
                    placeholder="45"
                    className="border-gray-300 focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Poids */}
            <div className="space-y-2">
              <Label htmlFor="weight">Poids (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.001"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                placeholder="12.5"
                className="border-gray-300 focus:border-black w-full md:w-1/3"
              />
            </div>

            {/* Attributs de variante */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Attributs de variante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Couleur</Label>
                  <Input
                    id="color"
                    value={formData.variant_attributes.color}
                    onChange={(e) => setFormData({...formData, variant_attributes: {...formData.variant_attributes, color: e.target.value}})}
                    placeholder="Blanc"
                    className="border-gray-300 focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material">Matière</Label>
                  <Input
                    id="material"
                    value={formData.variant_attributes.material}
                    onChange={(e) => setFormData({...formData, variant_attributes: {...formData.variant_attributes, material: e.target.value}})}
                    placeholder="Bois massif"
                    className="border-gray-300 focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finish">Finition</Label>
                  <Input
                    id="finish"
                    value={formData.variant_attributes.finish}
                    onChange={(e) => setFormData({...formData, variant_attributes: {...formData.variant_attributes, finish: e.target.value}})}
                    placeholder="Vernis mat"
                    className="border-gray-300 focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Taille</Label>
                  <Input
                    id="size"
                    value={formData.variant_attributes.size}
                    onChange={(e) => setFormData({...formData, variant_attributes: {...formData.variant_attributes, size: e.target.value}})}
                    placeholder="L"
                    className="border-gray-300 focus:border-black"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ONGLET 5 : Images & Médias */}
          <TabsContent value="images" className="p-6 space-y-6">
            {/* URL Vidéo */}
            <div className="space-y-2">
              <Label htmlFor="video_url">URL vidéo produit</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => {
                    setFormData({...formData, video_url: e.target.value})
                    if (touched.video_url) validateField('video_url', e.target.value)
                  }}
                  onBlur={(e) => handleBlur('video_url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className={cn(
                    "pl-10 border-gray-300 focus:border-black",
                    errors.video_url && touched.video_url && "border-red-500"
                  )}
                />
              </div>
              {errors.video_url && touched.video_url && (
                <p className="text-xs text-red-500 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.video_url}
                </p>
              )}
            </div>

            {/* Upload d'images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Images du produit</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {selectedFiles.length + existingImages.length}/10 images
                  </Badge>
                  {selectedFiles.length > 0 && (
                    <Badge variant="secondary">
                      {selectedFiles.length} nouvelles
                    </Badge>
                  )}
                </div>
              </div>

              {/* Zone d'upload */}
              <div className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all",
                "hover:border-gray-400 hover:bg-gray-50",
                selectedFiles.length >= 10 && "opacity-50 cursor-not-allowed"
              )}>
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isSubmitting || selectedFiles.length + existingImages.length >= 10}
                  className="hidden"
                />

                <label
                  htmlFor="images"
                  className={cn(
                    "cursor-pointer flex flex-col items-center space-y-3",
                    selectedFiles.length >= 10 && "cursor-not-allowed"
                  )}
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

              {/* Images existantes */}
              {existingImages.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-black">
                    Images existantes ({existingImages.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                          <Image
                            src={image.public_url}
                            alt={image.alt_text || `Image ${index + 1}`}
                            width={200}
                            height={200}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        {image.is_primary && (
                          <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded shadow">
                            Image principale
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview des nouvelles images */}
              {previews.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-black">
                    Nouvelles images ({previews.length})
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-green-200">
                          <Image
                            src={preview}
                            alt={`Nouvelle image ${index + 1}`}
                            width={200}
                            height={200}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        {/* Badge nouvelle image */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            Nouvelle
                          </Badge>
                        </div>

                        {/* Badge ordre */}
                        <div className="absolute bottom-2 left-2 bg-white text-black text-xs px-2 py-1 rounded shadow">
                          #{existingImages.length + index + 1}
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

              {/* Instructions */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Conseils pour les images :</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>La première image sera automatiquement définie comme image principale</li>
                    <li>Utilisez des images de haute qualité (min. 800x800px)</li>
                    <li>Format carré recommandé pour un meilleur affichage</li>
                    <li>Les images seront automatiquement optimisées par Supabase</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <CardContent className="border-t bg-gray-50 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <CheckCircle className="inline-block h-4 w-4 mr-1 text-green-600" />
              Tous les champs marqués d'un * sont obligatoires
            </div>

            <div className="flex space-x-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="border-gray-300 hover:bg-white"
                >
                  Annuler
                </Button>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="min-w-[180px] bg-black hover:bg-gray-900 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === 'create' ? 'Création en cours...' : 'Mise à jour...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Créer le produit' : 'Mettre à jour'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}