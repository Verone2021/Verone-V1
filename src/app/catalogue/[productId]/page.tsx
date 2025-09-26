"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { createClient } from "../../../lib/supabase/client"
import { ProductDualMode } from "../../../components/business/product-dual-mode"

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  description?: string
  technical_description?: string
  status: 'draft' | 'active' | 'archived'

  // Relations
  supplier_id?: string
  supplier?: {
    id: string
    name: string
  }

  // Catégorisation
  subcategory_id?: string
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
  }

  // Dimensions physiques
  dimensions_length?: number
  dimensions_width?: number
  dimensions_height?: number
  dimensions_unit?: string
  weight?: number
  weight_unit?: string

  // Prix
  base_cost?: number
  selling_price?: number

  // Fournisseur
  supplier_reference?: string
  supplier_page_url?: string

  // Variants
  variant_group_id?: string
  is_variant_parent?: boolean
  variant_position?: number
  variant_attributes?: any
  variants?: Product[]

  // Métadonnées
  created_at?: string
  updated_at?: string
  brand?: string
  condition?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Chargement du produit avec toutes ses relations
  useEffect(() => {
    if (!productId) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            supplier:organisations!supplier_id(id, name),
            subcategory:subcategories(
              id,
              name,
              category:categories(
                id,
                name,
                family:families(id, name)
              )
            )
          `)
          .eq('id', productId)
          .single()

        if (error) {
          console.error('Erreur chargement produit:', error)
          setError('Produit introuvable')
          return
        }

        // Charger les variantes si le produit fait partie d'un groupe
        if (data.variant_group_id) {
          const { data: variants } = await supabase
            .from('products')
            .select('id, name, sku, variant_attributes, variant_position')
            .eq('variant_group_id', data.variant_group_id)
            .neq('id', productId)
            .order('variant_position', { ascending: true })

          data.variants = variants || []
        }

        setProduct(data)
      } catch (err) {
        console.error('Erreur:', err)
        setError('Erreur lors du chargement du produit')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  // Mise à jour du produit
  const handleProductUpdate = async (updatedData: Partial<Product>) => {
    if (!product) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('products')
        .update(updatedData)
        .eq('id', product.id)

      if (error) {
        console.error('Erreur mise à jour:', error)
        return
      }

      // Mettre à jour l'état local
      setProduct(prev => prev ? { ...prev, ...updatedData } : null)
    } catch (err) {
      console.error('Erreur mise à jour produit:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Chargement du produit...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Produit introuvable'}
            </h1>
            <Button onClick={() => router.push('/catalogue')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au catalogue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/catalogue')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Catalogue
            </Button>

            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {product.name}
              </h1>
              <p className="text-sm text-gray-500">
                SKU: {product.sku || 'Non défini'} •
                Statut: {product.status === 'active' ? 'Actif' : 'Brouillon'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interface dual-mode */}
      <ProductDualMode
        product={product}
        onUpdate={handleProductUpdate}
        initialMode="view"
      />
    </div>
  )
}