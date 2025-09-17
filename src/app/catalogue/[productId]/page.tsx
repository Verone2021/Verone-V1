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

  const missingFields = REQUIRED_PRODUCT_FIELDS.filter(field => {
    const value = product[field as keyof Product]
    if (typeof value === 'string') {
      return value.trim().length === 0
    }
    return value === null || value === undefined || value === 0
  }).map(field => PRODUCT_FIELD_LABELS[field] || field)

  const percentage = Math.round((filledFields.length / REQUIRED_PRODUCT_FIELDS.length) * 100)

  return { percentage, missingFields }
}

// Types selon structure DB Supabase
interface Product {
  // Identifiants & Références
  id: string
  sku: string
  name: string
  description?: string
  slug: string
  supplier_reference?: string
  gtin?: string

  // Relations directes
  subcategory_id?: string
  brand?: string
  supplier_id?: string

  // Tarification & Business
  price_ht: number // En centimes
  cost_price?: number // En centimes
  tax_rate?: number

  // Statuts & Conditions
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  condition: 'new' | 'refurbished' | 'used'

  // Caractéristiques Physiques
  variant_attributes?: Record<string, any> // JSON
  dimensions?: Record<string, any> // JSON
  weight?: number

  // Médias
  video_url?: string

  // Descriptions enrichies
  technical_description?: string
  selling_points?: string[]

  // Stock & Gestion
  stock_quantity?: number
  min_stock_level?: number

  // Timestamps
  created_at: string
  updated_at: string

  // Relations jointes
  supplier?: {
    id: string
    name: string
  }
  subcategories?: {
    id: string
    name: string
    categories?: {
      id: string
      name: string
      families?: {
        id: string
        name: string
      }
    }
  }
}

export default function ProductDetailPage() {
  const startTime = Date.now()
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  // États locaux
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPhotosModal, setShowPhotosModal] = useState(false)
  const [showCharacteristicsModal, setShowCharacteristicsModal] = useState(false)
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false)

  // Hook pour gestion images
  const { images, hasImages, loading: imagesLoading } = useProductImages({
    productId: params.productId as string,
    productType: 'product'
  })

  // Gestionnaire de mise à jour produit
  const handleProductUpdate = (updatedData: Partial<Product>) => {
    if (product) {
      setProduct({ ...product, ...updatedData })
    }
  }

  // Charger le produit depuis Supabase
  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.productId || typeof params.productId !== 'string') {
        setError('ID produit invalide')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            supplier:organisations!supplier_id(id, name),
            subcategories!subcategory_id(
              id,
              name,
              categories (
                id,
                name,
                families (
                  id,
                  name
                )
              )
            )
          `)
          .eq('id', params.productId)
          .single()

        if (error) throw error

        setProduct(data)
      } catch (err) {
        console.error('❌ Erreur lors du chargement du produit:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.productId, supabase])

  // SLO compliance check
  const sloCompliance = checkSLOCompliance(startTime, 'dashboard')

  // États de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-black opacity-70">Chargement du produit...</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="pl-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au catalogue
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">
            {error || 'Produit introuvable'}
          </div>
        </div>
      </div>
    )
  }

  const { percentage } = calculateProductProgress(product)

  return (
    <div className="space-y-4">
      {/* Header compact avec navigation */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="pl-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          {/* Breadcrumb compact */}
          <nav className="text-sm text-gray-600">
            <span>Catalogue</span>
            {product.subcategories?.categories?.name && (
              <>
                <span className="mx-1">›</span>
                <span>{product.subcategories.categories.name}</span>
              </>
            )}
            {product.subcategories?.name && (
              <>
                <span className="mx-1">›</span>
                <span>{product.subcategories.name}</span>
              </>
            )}
          </nav>
        </div>

        {/* Actions header */}
        <div className="flex items-center space-x-2">
          <Badge variant={sloCompliance.isCompliant ? "default" : "destructive"} className="text-xs">
            {sloCompliance.duration}ms
          </Badge>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Partager
          </Button>
        </div>
      </div>

      {/* Layout 3 colonnes compact */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* COLONNE 1: Images & Métadonnées (25% - xl:col-span-3) */}
        <div className="xl:col-span-3 space-y-4">
          {/* Galerie images compacte */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              productStatus={product.status}
              className=""
            />

            {/* Actions rapides images */}
            <div className="mt-3 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowPhotosModal(true)}
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                Gérer photos ({images.length})
              </Button>
            </div>
          </div>

          {/* Métadonnées automatiques */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-black flex items-center mb-3">
              <Clock className="h-4 w-4 mr-1" />
              Métadonnées
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono">{product.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Créé:</span>
                <span>{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modifié:</span>
                <span>{new Date(product.updated_at).toLocaleDateString('fr-FR')}</span>
              </div>
              {product.supplier && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fournisseur:</span>
                  <span className="font-medium">{product.supplier.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status & Progression */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <Badge
                  className={cn(
                    "text-xs",
                    product.status === 'in_stock' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  )}
                >
                  {product.status === 'in_stock' ? 'En stock' : 'Hors stock'}
                </Badge>
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-1">Complétude</div>
                <div className="flex items-center gap-2">
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-xs font-medium">{percentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE 2: Informations Principales (45% - xl:col-span-5) */}
        <div className="xl:col-span-5 space-y-4">

          {/* Header produit compact */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-black mb-1">{product.name}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                  <span>SKU: {product.sku}</span>
                  {product.supplier_reference && <span>Réf. fournisseur: {product.supplier_reference}</span>}
                </div>
                <div className="text-lg font-semibold text-black">
                  {formatPrice(product.price_ht)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDescriptionsModal(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            </div>
          </div>

          {/* Description rapide */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-black">Description</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDescriptionsModal(true)}
                className="text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                Éditer
              </Button>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">
              {product.description || "Aucune description disponible"}
            </p>
          </div>

          {/* Caractéristiques rapides */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-black">Caractéristiques</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCharacteristicsModal(true)}
                className="text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Gérer
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {product.variant_attributes?.color && (
                <div>
                  <span className="text-gray-600">Couleur:</span>
                  <div className="font-medium">{product.variant_attributes.color}</div>
                </div>
              )}
              {product.variant_attributes?.material && (
                <div>
                  <span className="text-gray-600">Matière:</span>
                  <div className="font-medium">{product.variant_attributes.material}</div>
                </div>
              )}
              {product.weight && (
                <div>
                  <span className="text-gray-600">Poids:</span>
                  <div className="font-medium">{product.weight} kg</div>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <span className="text-gray-600">Dimensions:</span>
                  <div className="font-medium text-xs">
                    {product.dimensions.width}×{product.dimensions.height}×{product.dimensions.depth} cm
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Catégorisation */}
          {product.subcategories && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-black flex items-center mb-3">
                <Tag className="h-4 w-4 mr-1" />
                Catégorisation
              </h3>
              <div className="space-y-2 text-xs">
                {product.subcategories.categories?.families && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Famille:</span>
                    <span className="font-medium">{product.subcategories.categories.families.name}</span>
                  </div>
                )}
                {product.subcategories.categories && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Catégorie:</span>
                    <span className="font-medium">{product.subcategories.categories.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-catégorie:</span>
                  <span className="font-medium">{product.subcategories.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLONNE 3: Actions & Gestion (30% - xl:col-span-4) */}
        <div className="xl:col-span-4 space-y-4">

          {/* Actions rapides */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-black mb-3">Actions</h3>
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