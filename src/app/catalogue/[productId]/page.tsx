"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Edit, Share2, Clock, Package, Calendar, Truck, DollarSign, BarChart3, Tag, Layers } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { cn, formatPrice, checkSLOCompliance } from "../../../lib/utils"
import { createClient } from "../../../lib/supabase/client"

// Types selon structure DB Supabase
interface Product {
  // Identifiants & Références
  id: string
  product_group_id: string
  sku: string
  name: string
  slug: string
  supplier_reference?: string
  gtin?: string

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
  primary_image_url: string
  gallery_images?: string[]
  video_url?: string

  // Stock & Gestion
  stock_quantity?: number
  min_stock_level?: number

  // Timestamps
  created_at: string
  updated_at: string

  // Relations
  product_groups?: {
    id: string
    name: string
    description?: string
    brand?: string
    status: string
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

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
            product_groups (
              id,
              name,
              description,
              brand,
              status,
              subcategories (
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

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="pl-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au catalogue
          </Button>

          {/* Breadcrumb */}
          <nav className="text-sm text-black opacity-70">
            <span>Catalogue</span>
            <span className="mx-2">›</span>
            {product.product_groups?.subcategories?.categories?.families && (
              <>
                <span>{product.product_groups.subcategories.categories.families.name}</span>
                <span className="mx-2">›</span>
              </>
            )}
            {product.product_groups?.subcategories?.categories && (
              <>
                <span>{product.product_groups.subcategories.categories.name}</span>
                <span className="mx-2">›</span>
              </>
            )}
            {product.product_groups?.subcategories && (
              <span>{product.product_groups.subcategories.name}</span>
            )}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Badge variant={sloCompliance.isCompliant ? "success" : "destructive"}>
            {sloCompliance.duration}ms
          </Badge>
          <Button variant="secondary" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </Button>
          <Button variant="default" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section Médias */}
        <div className="space-y-4">
          {/* Image principale */}
          <div className="relative aspect-square overflow-hidden card-verone">
            <Image
              src={product.gallery_images?.[selectedImageIndex] || product.primary_image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            {/* Badge statut */}
            <div className="absolute top-4 right-4">
              <Badge
                className={cn(
                  product.status === 'in_stock' && "bg-green-600 text-white",
                  product.status === 'out_of_stock' && "bg-red-600 text-white",
                  product.status === 'preorder' && "bg-blue-600 text-white",
                  product.status === 'coming_soon' && "bg-black text-white",
                  product.status === 'discontinued' && "bg-gray-600 text-white"
                )}
              >
                {product.status === 'in_stock' && '✓ En stock'}
                {product.status === 'out_of_stock' && '✕ Rupture'}
                {product.status === 'preorder' && '📅 Précommande'}
                {product.status === 'coming_soon' && '⏳ Bientôt'}
                {product.status === 'discontinued' && '⚠ Arrêté'}
              </Badge>
            </div>
          </div>

          {/* Miniatures galerie */}
          {product.gallery_images && product.gallery_images.length > 1 && (
            <div className="flex space-x-2">
              {product.gallery_images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative aspect-square w-20 overflow-hidden border-2 transition-all",
                    selectedImageIndex === index ? "border-black" : "border-gray-200 hover:border-gray-400"
                  )}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - Vue ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Vidéo si disponible */}
          {product.video_url && (
            <div className="card-verone p-4">
              <h3 className="text-sm font-medium text-black mb-2">Vidéo produit</h3>
              <video controls className="w-full rounded">
                <source src={product.video_url} type="video/mp4" />
                Votre navigateur ne supporte pas la vidéo.
              </video>
            </div>
          )}
        </div>

        {/* Section Informations */}
        <div className="space-y-6">
          {/* En-tête produit */}
          <div>
            <h1 className="text-3xl font-light text-black mb-2">
              {product.name}
            </h1>
            {product.product_groups?.description && (
              <p className="text-black opacity-70 mb-4">
                {product.product_groups.description}
              </p>
            )}
            <div className="flex items-center space-x-4 text-sm text-black opacity-60">
              <span>SKU: {product.sku}</span>
              {product.product_groups?.brand && (
                <>
                  <span>•</span>
                  <span>Marque: {product.product_groups.brand}</span>
                </>
              )}
              {product.stock_quantity !== undefined && (
                <>
                  <span>•</span>
                  <span>Stock: {product.stock_quantity} unités</span>
                </>
              )}
            </div>
          </div>

          {/* SECTION 1: IDENTIFIANTS & RÉFÉRENCES */}
          <div className="card-verone p-4">
            <h3 className="text-lg font-medium text-black mb-4 flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Identifiants & Références
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-black opacity-70">ID Produit:</span>
                <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{product.id}</span>
              </div>
              <div>
                <span className="text-black opacity-70">ID Groupe:</span>
                <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{product.product_group_id}</span>
              </div>
              <div>
                <span className="text-black opacity-70">SKU:</span>
                <span className="ml-2 font-medium text-black">{product.sku}</span>
              </div>
              <div>
                <span className="text-black opacity-70">Slug URL:</span>
                <span className="ml-2 font-mono text-xs text-blue-600">{product.slug}</span>
              </div>
              {product.supplier_reference && (
                <div>
                  <span className="text-black opacity-70">Ref. Fournisseur:</span>
                  <span className="ml-2 font-medium text-black">{product.supplier_reference}</span>
                </div>
              )}
              {product.gtin && (
                <div>
                  <span className="text-black opacity-70">GTIN/EAN:</span>
                  <span className="ml-2 font-mono text-black">{product.gtin}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: TARIFICATION & BUSINESS */}
          <div className="card-verone p-4">
            <h3 className="text-lg font-medium text-black mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Tarification & Business
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-black opacity-70">Prix de vente HT:</span>
                <span className="text-xl font-bold text-black">{formatPrice(product.price_ht)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black opacity-70">Prix TTC (TVA {((product.tax_rate || 0.2) * 100).toFixed(0)}%):</span>
                <span className="text-lg font-semibold text-black">
                  {formatPrice(product.price_ht * (1 + (product.tax_rate || 0.2)))}
                </span>
              </div>
              {product.cost_price && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600 opacity-70">Prix d'achat HT (confidentiel):</span>
                    <span className="text-red-600 font-medium">{formatPrice(product.cost_price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 opacity-70">Marge brute:</span>
                    <span className="text-green-600 font-semibold">
                      {formatPrice(product.price_ht - product.cost_price)}
                      ({Math.round(((product.price_ht - product.cost_price) / product.price_ht) * 100)}%)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 3: STATUTS & CONDITIONS */}
          <div className="card-verone p-4">
            <h3 className="text-lg font-medium text-black mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Statuts & Conditions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-black opacity-70">Statut disponibilité:</span>
                <Badge
                  className={cn(
                    "ml-2",
                    product.status === 'in_stock' && "bg-green-600 text-white",
                    product.status === 'out_of_stock' && "bg-red-600 text-white",
                    product.status === 'preorder' && "bg-blue-600 text-white",
                    product.status === 'coming_soon' && "bg-black text-white",
                    product.status === 'discontinued' && "bg-gray-600 text-white"
                  )}
                >
                  {product.status}
                </Badge>
              </div>
              <div>
                <span className="text-black opacity-70">Condition:</span>
                <Badge variant="outline" className="ml-2">
                  {product.condition === 'new' && 'Neuf'}
                  {product.condition === 'refurbished' && 'Reconditionné'}
                  {product.condition === 'used' && 'Occasion'}
                </Badge>
              </div>
            </div>
          </div>

          {/* SECTION 4: CARACTÉRISTIQUES PHYSIQUES */}
          <div className="card-verone p-4">
            <h3 className="text-lg font-medium text-black mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Caractéristiques Physiques
            </h3>
            <div className="space-y-3">
              {/* Attributs variantes */}
              {product.variant_attributes && Object.keys(product.variant_attributes).length > 0 && (
                <div>
                  <span className="text-black opacity-70 font-medium">Attributs variantes:</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(product.variant_attributes).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize text-black opacity-70">{key}:</span>
                        <span className="font-medium text-black">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dimensions */}
              {product.dimensions && Object.keys(product.dimensions).length > 0 && (
                <div>
                  <span className="text-black opacity-70 font-medium">Dimensions:</span>
                  <div className="mt-2 text-sm">
                    <pre className="bg-gray-100 p-2 rounded font-mono text-xs overflow-x-auto">
                      {JSON.stringify(product.dimensions, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Poids */}
              {product.weight && (
                <div className="flex justify-between">
                  <span className="text-black opacity-70">Poids:</span>
                  <span className="font-medium text-black">{product.weight} kg</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: STOCK & GESTION */}
          <div className="card-verone p-4">
            <h3 className="text-lg font-medium text-black mb-4 flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Stock & Gestion
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-black opacity-70">Stock actuel:</span>
                <span className={cn(
                  "font-semibold",
                  (product.stock_quantity || 0) > (product.min_stock_level || 5) ? "text-green-600" :
                  (product.stock_quantity || 0) > 0 ? "text-orange-600" : "text-red-600"
                )}>
                  {product.stock_quantity || 0} unités
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black opacity-70">Seuil minimum:</span>
                <span className="font-medium text-black">{product.min_stock_level || 5} unités</span>
              </div>
            </div>
          </div>

          {/* SECTION 6: TIMESTAMPS */}
          <div className="card-verone p-4">
            <h3 className="text-lg font-medium text-black mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Dates & Historique
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black opacity-70">Créé le:</span>
                <span className="font-mono text-black">
                  {new Date(product.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black opacity-70">Modifié le:</span>
                <span className="font-mono text-black">
                  {new Date(product.updated_at).toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 7: RELATIONS */}
          {product.product_groups && (
            <div className="card-verone p-4">
              <h3 className="text-lg font-medium text-black mb-4 flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Relations & Hiérarchie
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-black opacity-70">Groupe de produits:</span>
                  <div className="mt-1 bg-gray-100 p-2 rounded">
                    <div className="font-medium text-black">{product.product_groups.name}</div>
                    {product.product_groups.description && (
                      <div className="text-xs text-black opacity-70 mt-1">
                        {product.product_groups.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hiérarchie complète */}
                {product.product_groups.subcategories && (
                  <div>
                    <span className="text-black opacity-70">Hiérarchie complète:</span>
                    <div className="mt-1 text-xs text-black opacity-80">
                      {product.product_groups.subcategories.categories?.families?.name}
                      {' › '}
                      {product.product_groups.subcategories.categories?.name}
                      {' › '}
                      {product.product_groups.subcategories.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}