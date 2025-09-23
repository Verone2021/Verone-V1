"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Share2, Settings, FileText, Image as ImageIcon, Package, Tag, Clock } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Progress } from "../../../components/ui/progress"
import { ProductImageGallery } from "../../../components/business/product-image-gallery"
import { ProductPhotosModal } from "../../../components/business/product-photos-modal"
import { ProductCharacteristicsModal } from "../../../components/business/product-characteristics-modal"
import { ProductDescriptionsModal } from "../../../components/business/product-descriptions-modal"
import { SampleRequirementSection } from "../../../components/business/sample-requirement-section"
import { SupplierVsPricingEditSection } from "../../../components/business/supplier-vs-pricing-edit-section"
import { GeneralInfoEditSection } from "../../../components/business/general-info-edit-section"
import { StockEditSection } from "../../../components/business/stock-edit-section"
import { ProductFixedCharacteristics } from "../../../components/business/product-fixed-characteristics"
import { IdentifiersEditSection } from "../../../components/business/identifiers-edit-section"
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
  min_stock_level: number | null
  supplier_id: string | null
  supplier_reference: string | null
  subcategory_id: string | null
  family_id: string | null
  dimensions: string | null
  weight: number | null
  variant_attributes: Record<string, any> | null
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
    slug: string
    is_active: boolean
  } | null
  subcategory?: {
    id: string
    name: string
    category?: {
      id: string
      name: string
      family?: {
        id: string
        name: string
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
            id, name, email, phone
          ),
          subcategory:subcategories(
            id, name,
            category:categories(
              id, name,
              family:families(id, name)
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

      setProduct({
        ...data,
        supplier: data.supplier ? {
          ...data.supplier,
          slug: data.supplier.name.toLowerCase().replace(/\s+/g, '-'),
          is_active: true
        } : null
      })

    } catch (err) {
      console.error('Erreur lors du chargement du produit:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du produit')
    } finally {
      setLoading(false)

      // Vérification SLO
      const loadTime = Date.now() - startTime
      checkSLOCompliance('ProductDetail', loadTime, 2000)
    }
  }

  // Handler pour mettre à jour le produit
  const handleProductUpdate = (updatedData: Partial<Product>) => {
    if (product) {
      setProduct({ ...product, ...updatedData })
    }
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
            <div className="p-3 border-t border-black">
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
              <div>
                <h1 className="text-xl font-bold text-black mb-1">{product.name}</h1>
                <div className="text-sm text-gray-600 mb-2">
                  SKU: {product.sku || 'Non défini'}
                </div>
                <div className="text-lg font-semibold text-black">
                  {product.price_ht ? formatPrice(product.price_ht) : 'Prix non défini'}
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>

          {/* Informations générales */}
          <GeneralInfoEditSection
            product={{
              id: product.id,
              name: product.name,
              sku: product.sku,
              description: product.description,
              technical_description: product.technical_description,
              selling_points: product.selling_points,
              subcategory_id: product.subcategory_id,
              supplier_id: product.supplier_id
            }}
            onUpdate={handleProductUpdate}
          />

          {/* Description */}
          <div className="bg-white border border-black p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Description</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDescriptionsModal(true)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Éditer
              </Button>
            </div>
            <p className="text-sm text-gray-700">
              {product.description || 'Aucune description disponible'}
            </p>
          </div>

          {/* Caractéristiques */}
          <div className="bg-white border border-black p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Caractéristiques</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCharacteristicsModal(true)}
              >
                <Settings className="h-3 w-3 mr-1" />
                Gérer
              </Button>
            </div>
            <ProductFixedCharacteristics
              product={product}
            />
          </div>

          {/* Catégorisation */}
          <div className="bg-white border border-black p-4">
            <h3 className="font-medium mb-3 flex items-center text-sm">
              <Tag className="h-4 w-4 mr-2" />
              Catégorisation
            </h3>
            <div className="space-y-2 text-sm">
              {product.subcategory?.category?.family && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Famille:</span>
                  <span>{product.subcategory.category.family.name}</span>
                </div>
              )}
              {product.subcategory?.category && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Catégorie:</span>
                  <span>{product.subcategory.category.name}</span>
                </div>
              )}
              {product.subcategory && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-catégorie:</span>
                  <span>{product.subcategory.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE 3: Actions & Gestion (30% - xl:col-span-4) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Actions rapides */}
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
                Gérer les photos
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setShowCharacteristicsModal(true)}
              >
                <Settings className="h-3 w-3 mr-2" />
                Caractéristiques
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setShowDescriptionsModal(true)}
              >
                <FileText className="h-3 w-3 mr-2" />
                Descriptions
              </Button>
            </div>
          </div>

          {/* Stock & Gestion */}
          <StockEditSection
            product={{
              id: product.id,
              status: product.status,
              condition: product.condition,
              stock_quantity: product.stock_quantity,
              min_stock_level: product.min_stock_level
            }}
            onUpdate={handleProductUpdate}
          />

          {/* Tarification */}
          <SupplierVsPricingEditSection
            product={{
              id: product.id,
              selling_price: product.price_ht,
              supplier_price: product.cost_price,
              tax_rate: product.tax_rate,
              price_ht: product.price_ht,
              cost_price: product.cost_price
            }}
            onUpdate={handleProductUpdate}
          />

          {/* Identifiants */}
          <IdentifiersEditSection
            product={{
              id: product.id,
              sku: product.sku,
              slug: product.slug,
              supplier_reference: product.supplier_reference,
              gtin: product.gtin,
              variant_attributes: product.variant_attributes
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
    </div>
  )
}