"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Share2, Image as ImageIcon, Package, Tag, Clock, TreePine, FolderOpen, Tags, ChevronRight, Save, X } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Progress } from "../../../components/ui/progress"
import { ProductImageGallery } from "../../../components/business/product-image-gallery"
import { ProductPhotosModal } from "../../../components/business/product-photos-modal"
import { ProductCharacteristicsModal } from "../../../components/business/product-characteristics-modal"
import { ProductDescriptionsModal } from "../../../components/business/product-descriptions-modal"
import { CategoryHierarchySelector } from "../../../components/business/category-hierarchy-selector"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { ProductVariantsSection } from "../../../components/business/product-variants-section"
import { SampleRequirementSection } from "../../../components/business/sample-requirement-section"
import { SupplierVsPricingEditSection } from "../../../components/business/supplier-vs-pricing-edit-section"
import { StockEditSection } from "../../../components/business/stock-edit-section"
import { ProductFixedCharacteristics } from "../../../components/business/product-fixed-characteristics"
import { IdentifiersEditSection } from "../../../components/business/identifiers-edit-section"
import { SupplierEditSection } from "../../../components/business/supplier-edit-section"
import { IdentifiersCompleteEditSection } from "../../../components/business/identifiers-complete-edit-section"
import { cn, formatPrice, checkSLOCompliance } from "../../../lib/utils"
import { createClient } from "../../../lib/supabase/client"
import { useProductImages } from "../../../hooks/use-product-images"

// Champs obligatoires pour un produit complet
const REQUIRED_PRODUCT_FIELDS = [
  'name',
  'sku',
  'supplier_id',
  'subcategory_id',
  'price_ht',
  'description'
] as const

// Mapping des champs avec leurs libellés
const PRODUCT_FIELD_LABELS: Record<string, string> = {
  name: 'Nom du produit',
  sku: 'Référence SKU',
  supplier_id: 'Fournisseur',
  subcategory_id: 'Sous-catégorie',
  price_ht: 'Prix de vente HT',
  description: 'Description'
}

// Fonction pour calculer la progression d'un produit
function calculateProductProgress(product: Product): { percentage: number, missingFields: string[] } {
  const filledFields = REQUIRED_PRODUCT_FIELDS.filter(field => {
    const value = product[field as keyof Product]
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    return value !== null && value !== undefined && value !== 0
  })

  const percentage = (filledFields.length / REQUIRED_PRODUCT_FIELDS.length) * 100
  const missingFields = REQUIRED_PRODUCT_FIELDS.filter(field => {
    const value = product[field as keyof Product]
    if (typeof value === 'string') {
      return value.trim().length === 0
    }
    return value === null || value === undefined || value === 0
  }).map(field => PRODUCT_FIELD_LABELS[field])

  return { percentage, missingFields }
}

// Interface pour un produit
interface Product {
  id: string
  name: string
  sku: string | null
  description: string | null
  technical_description: string | null
  selling_points: string | null
  price_ht: number | null
  cost_price: number | null
  tax_rate: number | null
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  condition: 'new' | 'used' | 'refurbished'
  stock_quantity: number | null
  min_stock: number | null
  supplier_id: string | null
  supplier_reference: string | null
  subcategory_id: string | null
  family_id: string | null
  dimensions: string | null
  weight: number | null
  variant_attributes: Record<string, any> | null
  variant_group_id: string | null  // ID du groupe de variantes
  gtin: string | null
  slug: string | null
  images: any[]
  requires_sample: boolean | null  // Ajout du champ échantillon
  created_at: string
  updated_at: string
  organisation_id: string
  // Relations
  supplier?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    is_active: boolean
  } | null
  subcategory?: {
    id: string
    name: string
    slug: string
    category?: {
      id: string
      name: string
      slug: string
      family?: {
        id: string
        name: string
        slug: string
      }
    }
  } | null
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPhotosModal, setShowPhotosModal] = useState(false)
  const [showCharacteristicsModal, setShowCharacteristicsModal] = useState(false)
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false)
  const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false)

  // États pour l'édition du nom
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // États pour l'édition du SKU
  const [isEditingSku, setIsEditingSku] = useState(false)
  const [editedSku, setEditedSku] = useState('')
  const [savingSku, setSavingSku] = useState(false)

  // États pour l'édition du Prix HT
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [editedPrice, setEditedPrice] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)

  // États pour l'édition de la Description
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [savingDescription, setSavingDescription] = useState(false)

  const startTime = Date.now()

  // Charger le produit
  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          supplier:organisations!products_supplier_id_fkey(
            id,
            name,
            email,
            phone,
            is_active
          ),
          subcategory:subcategories(
            id,
            name,
            slug,
            category:categories(
              id,
              name,
              slug,
              family:families(
                id,
                name,
                slug
              )
            )
          )
        `)
        .eq('id', productId)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      if (!data) {
        throw new Error('Produit non trouvé')
      }

      setProduct(data)

    } catch (err) {
      console.error('Erreur lors du chargement du produit:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du produit')
    } finally {
      setLoading(false)

      // Vérification SLO
      checkSLOCompliance(startTime, 'dashboard')
    }
  }

  // Handler pour mettre à jour le produit avec persistance en base
  const handleProductUpdate = async (updatedData: Partial<Product>) => {
    if (!product) return

    try {
      const supabase = createClient()

      // Mettre à jour en base de données
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du produit:', error)
        throw error
      }

      // Mettre à jour l'état local avec les données retournées de la base
      setProduct({ ...product, ...data })
      console.log('✅ Produit mis à jour avec succès:', data)
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error)
      // En cas d'erreur, on garde l'ancien état (pas de mise à jour locale)
    }
  }

  // Gestion de l'édition du nom
  const handleStartEditName = () => {
    if (product?.variant_group_id) {
      // Si le produit est dans un groupe de variantes, ne pas permettre l'édition
      return
    }
    setEditedName(product?.name || '')
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === product?.name) {
      setIsEditingName(false)
      return
    }

    setSavingName(true)
    try {
      await handleProductUpdate({ name: editedName.trim() })
      setIsEditingName(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom:', error)
    } finally {
      setSavingName(false)
    }
  }

  const handleCancelEditName = () => {
    setIsEditingName(false)
    setEditedName('')
  }

  // Gestion de l'édition du SKU
  const handleStartEditSku = () => {
    setEditedSku(product?.sku || '')
    setIsEditingSku(true)
  }

  const handleSaveSku = async () => {
    if (editedSku === product?.sku) {
      setIsEditingSku(false)
      return
    }

    setSavingSku(true)
    try {
      await handleProductUpdate({ sku: editedSku.trim() || null })
      setIsEditingSku(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du SKU:', error)
    } finally {
      setSavingSku(false)
    }
  }

  const handleCancelEditSku = () => {
    setIsEditingSku(false)
    setEditedSku('')
  }

  // Gestion de l'édition du Prix HT
  const handleStartEditPrice = () => {
    setEditedPrice(product?.price_ht?.toString() || '')
    setIsEditingPrice(true)
  }

  const handleSavePrice = async () => {
    const priceValue = parseFloat(editedPrice)

    if (isNaN(priceValue) || priceValue < 0) {
      setIsEditingPrice(false)
      return
    }

    if (priceValue === product?.price_ht) {
      setIsEditingPrice(false)
      return
    }

    setSavingPrice(true)
    try {
      await handleProductUpdate({ price_ht: priceValue })
      setIsEditingPrice(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prix:', error)
    } finally {
      setSavingPrice(false)
    }
  }

  const handleCancelEditPrice = () => {
    setIsEditingPrice(false)
    setEditedPrice('')
  }

  // Gestion de l'édition de la Description
  const handleStartEditDescription = () => {
    setEditedDescription(product?.description || '')
    setIsEditingDescription(true)
  }

  const handleSaveDescription = async () => {
    if (editedDescription === product?.description) {
      setIsEditingDescription(false)
      return
    }

    setSavingDescription(true)
    try {
      await handleProductUpdate({ description: editedDescription.trim() || null })
      setIsEditingDescription(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la description:', error)
    } finally {
      setSavingDescription(false)
    }
  }

  const handleCancelEditDescription = () => {
    setIsEditingDescription(false)
    setEditedDescription('')
  }

  // Handler pour naviguer vers la page de partage
  const handleShare = () => {
    if (product?.slug) {
      const shareUrl = `/share/product/${product.slug}`
      router.push(shareUrl)
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [productId])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p>Chargement du produit...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Produit non trouvé'}</p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Calculer la progression
  const { percentage: completionPercentage, missingFields } = calculateProductProgress(product)

  // Générer le breadcrumb
  const breadcrumbParts = ['Catalogue']
  if (product.subcategory?.category?.family?.name) {
    breadcrumbParts.push(product.subcategory.category.family.name)
  }
  if (product.subcategory?.category?.name) {
    breadcrumbParts.push(product.subcategory.category.name)
  }
  if (product.subcategory?.name) {
    breadcrumbParts.push(product.subcategory.name)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <nav className="text-sm text-gray-600">
            {breadcrumbParts.join('›')}
          </nav>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-500">
            {Date.now() - startTime}ms
          </div>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </Button>
        </div>
      </div>

      {/* Contenu principal - Layout 3 colonnes */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* COLONNE 1: Images & Métadonnées (25% - xl:col-span-3) */}
        <div className="xl:col-span-3 space-y-4">
          {/* Galerie d'images */}
          <div className="bg-white border border-black">
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              productStatus={product.status}
              compact={true}
            />
          </div>

          {/* Section Variantes - Affichée uniquement si produit dans un groupe */}
          {product.variant_group_id && (
            <div className="bg-white border border-black">
              <ProductVariantsSection
                productId={product.id}
                productName={product.name}
                productData={{
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  supplier_id: product.supplier_id,
                  supplier: product.supplier,
                  dimensions_length: product.dimensions_length,
                  dimensions_width: product.dimensions_width,
                  dimensions_height: product.dimensions_height,
                  dimensions_unit: product.dimensions_unit,
                  weight: product.weight,
                  weight_unit: product.weight_unit,
                  base_cost: product.base_cost,
                  selling_price: product.selling_price,
                  description: product.description,
                  technical_description: product.technical_description,
                  category_id: product.category_id,
                  subcategory_id: product.subcategory_id,
                  variant_group_id: product.variant_group_id
                }}
                onVariantsUpdate={fetchProduct}
              />
            </div>
          )}

          {/* Actions sous l'image (déplacées depuis colonne 3) */}
          <div className="bg-white border border-black p-4">
            <h3 className="font-medium mb-3 text-sm">Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setShowPhotosModal(true)}
              >
                <ImageIcon className="h-3 w-3 mr-2" />
                Gérer photos ({product.images?.length || 0})
              </Button>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="bg-white border border-black p-4">
            <h3 className="font-medium mb-3 flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2" />
              Métadonnées
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono">{product.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Créé:</span>
                <span>{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modifié:</span>
                <span>{new Date(product.updated_at).toLocaleDateString()}</span>
              </div>
              {product.supplier && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fournisseur:</span>
                  <span>{product.supplier.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status badge et progression */}
          <div className="bg-white border border-black p-4">
            <div className="space-y-3">
              <Badge className={cn(
                "text-xs",
                product.status === 'in_stock' ? "bg-green-600 text-white" :
                product.status === 'out_of_stock' ? "bg-red-600 text-white" :
                "bg-black text-white"
              )}>
                {product.status === 'in_stock' ? 'En stock' :
                 product.status === 'out_of_stock' ? 'Rupture' :
                 'Autre statut'}
              </Badge>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Complétude</span>
                  <span className="text-xs font-medium">{Math.round(completionPercentage)}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE 2: Informations Principales (45% - xl:col-span-5) */}
        <div className="xl:col-span-5 space-y-4">
          {/* Header produit */}
          <div className="bg-white border border-black p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {isEditingName ? (
                  // Mode édition du nom
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName()
                        if (e.key === 'Escape') handleCancelEditName()
                      }}
                      className="w-full text-xl font-bold text-black border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black"
                      disabled={savingName}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleSaveName}
                        disabled={savingName || !editedName.trim()}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {savingName ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEditName}
                        disabled={savingName}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Mode affichage
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-black mb-1">{product.name}</h1>
                      {!product.variant_group_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStartEditName}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {product.variant_group_id && (
                      <p className="text-xs text-orange-600 mb-2">
                        ℹ️ Nom géré par le groupe de variantes.{' '}
                        <a
                          href={`/catalogue/variantes/${product.variant_group_id}`}
                          className="underline hover:text-orange-800"
                        >
                          Modifier depuis la page du groupe
                        </a>
                      </p>
                    )}
                    {/* SKU - Édition inline */}
                    <div className="mb-2">
                      {isEditingSku ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">SKU:</span>
                          <input
                            type="text"
                            value={editedSku}
                            onChange={(e) => setEditedSku(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveSku()
                              if (e.key === 'Escape') handleCancelEditSku()
                            }}
                            onBlur={handleSaveSku}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black flex-1"
                            disabled={savingSku}
                            autoFocus
                            placeholder="Ex: MILO-TISSU-MARRON"
                          />
                          {savingSku && (
                            <span className="text-xs text-gray-500">Sauvegarde...</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 group">
                          <span className="text-sm text-gray-600">
                            SKU: {product.sku || 'Non défini'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleStartEditSku}
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Prix HT - Édition inline */}
                    <div>
                      {isEditingPrice ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSavePrice()
                              if (e.key === 'Escape') handleCancelEditPrice()
                            }}
                            onBlur={handleSavePrice}
                            className="text-lg font-semibold border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black w-32"
                            disabled={savingPrice}
                            autoFocus
                            placeholder="0.00"
                          />
                          <span className="text-lg font-semibold text-gray-600">€</span>
                          {savingPrice && (
                            <span className="text-xs text-gray-500">Sauvegarde...</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 group">
                          <span className="text-lg font-semibold text-black">
                            {product.price_ht ? formatPrice(product.price_ht) : 'Prix non défini'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleStartEditPrice}
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Catégorisation - Arborescence complète */}
          <div className="bg-white border border-black p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center text-sm">
                <Tag className="h-4 w-4 mr-2" />
                Catégorisation
              </h3>
              {!product.variant_group_id ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white"
                  onClick={() => setIsCategorizeModalOpen(true)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
              ) : (
                <p className="text-xs text-orange-600">
                  ℹ️ Géré par le groupe de variantes
                </p>
              )}
            </div>

            {/* Fil d'Ariane hiérarchique */}
            <div className="space-y-3">
              {product.subcategory?.category?.family || product.subcategory?.category || product.subcategory ? (
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="flex items-center space-x-2 flex-wrap text-sm">
                    {product.subcategory?.category?.family && (
                      <>
                        <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded">
                          <TreePine className="h-3 w-3 text-green-600" />
                          <span className="text-green-800 font-medium">
                            {product.subcategory.category.family.name}
                          </span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                      </>
                    )}

                    {product.subcategory?.category && (
                      <>
                        <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded">
                          <FolderOpen className="h-3 w-3 text-blue-600" />
                          <span className="text-blue-800 font-medium">
                            {product.subcategory.category.name}
                          </span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                      </>
                    )}

                    {product.subcategory && (
                      <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded">
                        <Tags className="h-3 w-3 text-purple-600" />
                        <span className="text-purple-800 font-medium">
                          {product.subcategory.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="text-red-700 text-sm flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Aucune catégorisation définie
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    Ce produit n'est associé à aucune famille, catégorie ou sous-catégorie
                  </p>
                </div>
              )}

              {/* Détails techniques (si disponibles) */}
              {(product.subcategory?.category?.family || product.subcategory?.category || product.subcategory) && (
                <div className="space-y-1 text-xs text-gray-600">
                  {product.subcategory?.category?.family && (
                    <div className="flex justify-between">
                      <span>ID Famille:</span>
                      <span className="font-mono">{product.subcategory.category.family.id.slice(0, 8)}...</span>
                    </div>
                  )}
                  {product.subcategory?.category && (
                    <div className="flex justify-between">
                      <span>ID Catégorie:</span>
                      <span className="font-mono">{product.subcategory.category.id.slice(0, 8)}...</span>
                    </div>
                  )}
                  {product.subcategory && (
                    <div className="flex justify-between">
                      <span>ID Sous-catégorie:</span>
                      <span className="font-mono">{product.subcategory.id.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fournisseur & Références */}
          <SupplierEditSection
            product={{
              id: product.id,
              supplier_id: product.supplier_id,
              supplier_reference: product.supplier_reference,
              supplier_page_url: product.supplier_page_url,
              supplier: product.supplier
            }}
            onUpdate={handleProductUpdate}
          />

          {/* Description - Édition inline */}
          <div className="bg-white border border-black p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Description</h3>
              {!isEditingDescription && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEditDescription}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
              )}
            </div>
            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancelEditDescription()
                    // Ctrl+Enter pour sauvegarder
                    if (e.key === 'Enter' && e.ctrlKey) handleSaveDescription()
                  }}
                  className="w-full text-sm text-gray-700 border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-black min-h-[100px]"
                  disabled={savingDescription}
                  autoFocus
                  placeholder="Décrivez le produit..."
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Ctrl+Entrée pour sauvegarder, Échap pour annuler
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleSaveDescription}
                      disabled={savingDescription}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {savingDescription ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEditDescription}
                      disabled={savingDescription}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="group relative">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {product.description || 'Aucune description disponible'}
                </p>
                {product.description && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDescriptionsModal(true)}
                      className="h-6"
                      title="Ouvrir l'éditeur complet"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Caractéristiques */}
          <div className="bg-white border border-black p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Caractéristiques</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCharacteristicsModal(true)}
                disabled={!!product.variant_group_id}
                className={product.variant_group_id ? "opacity-50 cursor-not-allowed" : ""}
                title={product.variant_group_id ? "Géré depuis le groupe de variantes" : "Modifier les caractéristiques"}
              >
                <Edit className="h-3 w-3 mr-1" />
                Modifier
              </Button>
            </div>
            {product.variant_group_id && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                ℹ️ Les caractéristiques sont gérées au niveau du groupe de variantes.{' '}
                <a
                  href={`/catalogue/variantes/${product.variant_group_id}`}
                  className="underline font-medium hover:text-blue-900"
                >
                  Voir le groupe
                </a>
              </div>
            )}
            <ProductFixedCharacteristics
              product={product}
            />
          </div>

        </div>

        {/* COLONNE 3: Gestion (30% - xl:col-span-4) */}
        <div className="xl:col-span-4 space-y-4">

          {/* Stock & Gestion */}
          <StockEditSection
            product={{
              id: product.id,
              status: product.status,
              condition: product.condition,
              stock_quantity: product.stock_quantity,
              min_stock: product.min_stock
            }}
            onUpdate={handleProductUpdate}
          />

          {/* Tarification */}
          <SupplierVsPricingEditSection
            product={{
              id: product.id,
              cost_price: product.cost_price,
              margin_percentage: product.margin_percentage,
              selling_price: product.selling_price
            }}
            onUpdate={handleProductUpdate}
          />

          {/* Identifiants Complets */}
          <IdentifiersCompleteEditSection
            product={{
              id: product.id,
              sku: product.sku,
              brand: product.brand,
              gtin: product.gtin,
              condition: product.condition
            }}
            onUpdate={handleProductUpdate}
          />

          {/* Section échantillon */}
          <div className="bg-white border border-black p-4">
            <h3 className="font-medium mb-3 text-sm">Gestion Échantillons</h3>
            <SampleRequirementSection
              requiresSample={product.requires_sample || false}
              isProduct={true}
              productName={product.name}
              disabled={product.stock_quantity >= 1} // Griser si le produit a déjà été commandé (stock >= 1)
              onRequirementChange={(requiresSample) => {
                handleProductUpdate({ requires_sample: requiresSample })
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal de gestion des photos */}
      <ProductPhotosModal
        isOpen={showPhotosModal}
        onClose={() => setShowPhotosModal(false)}
        productId={product.id}
        productName={product.name}
        productType="product"
        maxImages={20}
      />

      {/* Modal de gestion des caractéristiques */}
      <ProductCharacteristicsModal
        isOpen={showCharacteristicsModal}
        onClose={() => setShowCharacteristicsModal(false)}
        productId={product.id}
        productName={product.name}
        initialData={{
          variant_attributes: product.variant_attributes,
          dimensions: product.dimensions,
          weight: product.weight
        }}
        onUpdate={handleProductUpdate}
      />

      {/* Modal de gestion des descriptions */}
      <ProductDescriptionsModal
        isOpen={showDescriptionsModal}
        onClose={() => setShowDescriptionsModal(false)}
        productId={product.id}
        productName={product.name}
        initialData={{
          description: product.description,
          technical_description: product.technical_description,
          selling_points: product.selling_points
        }}
        onUpdate={handleProductUpdate}
      />

      {/* Modal de modification de la catégorisation */}
      <Dialog open={isCategorizeModalOpen} onOpenChange={setIsCategorizeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Modifier la catégorisation
            </DialogTitle>
            <DialogDescription>
              Sélectionnez une nouvelle sous-catégorie pour ce produit. La famille et la catégorie seront automatiquement mises à jour.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <CategoryHierarchySelector
              value={product.subcategory_id || ''}
              onChange={(subcategoryId, hierarchyInfo) => {
                if (subcategoryId && hierarchyInfo) {
                  handleProductUpdate({
                    subcategory_id: subcategoryId
                  })
                  setIsCategorizeModalOpen(false)
                }
              }}
              placeholder="Sélectionner une sous-catégorie"
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCategorizeModalOpen(false)}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}