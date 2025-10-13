'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { calculateMinimumSellingPrice, formatPrice } from '@/lib/pricing-utils'

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  price_ht: number // Prix d'achat fournisseur (legacy - sera remplacé par supplier_cost_price)
  supplier_cost_price?: number // NOUVEAU: Prix d'achat fournisseur clarifié
  cost_price?: number // Autre coût si défini séparément
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  condition: 'new' | 'refurbished' | 'used'
  variant_attributes?: any
  dimensions?: any
  weight?: number
  // Images: URL publique de l'image primaire (chargée via product_images JOIN)
  primary_image_url?: string | null
  video_url?: string
  supplier_reference?: string
  gtin?: string
  stock_quantity?: number
  min_stock?: number
  supplier_page_url?: string
  supplier_id?: string
  margin_percentage?: number // Marge minimum en pourcentage
  // Champs descriptions ajoutés lors de la migration
  description?: string
  technical_description?: string
  selling_points?: string[]
  created_at: string
  updated_at: string

  // NOUVEAUX CHAMPS - Système sourcing et différenciation
  product_type?: 'standard' | 'custom'
  assigned_client_id?: string
  creation_mode?: 'sourcing' | 'complete'

  // Relation fournisseur
  supplier?: {
    id: string
    name: string
    type: string
  }

  // CALCULÉ: Prix minimum de vente (prix d'achat + marge)
  minimumSellingPrice?: number
}

export interface ProductFilters {
  search?: string
  status?: string
  supplier_id?: string
  category_id?: string
  family_id?: string
  min_price?: number
  max_price?: number
  in_stock_only?: boolean
}

export interface CreateProductData {
  // Champs obligatoires selon business rules (CONDITIONNELS selon mode)
  name: string // Obligatoire TOUJOURS
  supplier_cost_price?: number // NOUVEAU: Prix d'achat fournisseur (obligatoire en mode COMPLETE)
  description?: string // Obligatoire en mode COMPLETE uniquement
  subcategory_id?: string // Obligatoire en mode COMPLETE uniquement

  // NOUVEAUX CHAMPS - Système sourcing et différenciation
  product_type?: 'standard' | 'custom' // Type de produit
  assigned_client_id?: string // Client assigné (obligatoire si product_type = 'custom')
  creation_mode?: 'sourcing' | 'complete' // Mode de création
  supplier_page_url?: string // URL fournisseur (obligatoire en mode SOURCING)

  // Champs automatiques (générés par la DB)
  // sku: généré automatiquement
  // status: calculé automatiquement depuis le stock

  // Champs business rules
  availability_type?: string // normal, preorder, coming_soon, discontinued
  technical_description?: string // Description technique interne
  selling_points?: string[] // Points de vente

  // Champs de marge et pricing - NOUVELLE LOGIQUE
  margin_percentage?: number // Marge minimum en pourcentage (ex: 50 = 50%)
  // minimumSellingPrice sera calculé automatiquement: supplier_cost_price × (1 + margin_percentage/100)

  // Legacy (à supprimer progressivement)
  cost_price?: number // Autre coût si défini séparément

  // Champs optionnels existants
  slug?: string
  condition?: string
  variant_attributes?: any
  dimensions?: any
  weight?: number
  brand?: string

  // URLs et références
  video_url?: string
  supplier_reference?: string
  gtin?: string
  supplier_id?: string
}

// NOUVELLE interface spécialisée pour le sourcing rapide
export interface SourcingFormData {
  // 3 champs OBLIGATOIRES pour sourcing rapide
  name: string
  supplier_page_url: string
  // image: géré séparément via upload

  // Champs automatiques injectés
  creation_mode: 'sourcing'
  sourcing_type: 'interne' | 'client' // Calculé automatiquement selon assigned_client_id
  assigned_client_id?: string // Facultatif - si rempli → sourcing_type = 'client'
}

// 🚀 Configuration pagination et cache
const PRODUCTS_PER_PAGE = 50
const CACHE_REVALIDATION_TIME = 5 * 60 * 1000 // 5 minutes

// 📊 Fetcher optimisé SWR avec SELECT allégé pour vue liste
const productsFetcher = async (
  key: string,
  filters: ProductFilters | undefined,
  page: number = 0
) => {
  const supabase = createClient()

  // 🎯 SELECT optimisé - colonnes essentielles + stock + image primaire
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      sku,
      status,
      cost_price,
      stock_quantity,
      margin_percentage,
      price_ht,
      created_at,
      subcategory_id,
      product_images!product_id(
        public_url,
        is_primary
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PRODUCTS_PER_PAGE, (page + 1) * PRODUCTS_PER_PAGE - 1)

  // Appliquer les filtres
  if (filters?.search && filters.search.trim()) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id)
  }

  if (filters?.min_price) {
    query = query.gte('cost_price', filters.min_price)
  }

  if (filters?.max_price) {
    query = query.lte('cost_price', filters.max_price)
  }

  if (filters?.in_stock_only) {
    query = query.gt('stock_quantity', 0)
  }

  const { data, error, count } = await query

  if (error) throw error

  // Enrichir avec prix minimum de vente + image primaire
  const enriched = (data || []).map(product => {
    // Extraire l'image primaire de la relation product_images
    const primaryImage = Array.isArray(product.product_images)
      ? product.product_images.find((img: any) => img.is_primary === true)
      : null

    return {
      ...product,
      primary_image_url: primaryImage?.public_url || null,
      minimumSellingPrice: product.cost_price && product.margin_percentage
        ? calculateMinimumSellingPrice(product.cost_price, product.margin_percentage)
        : 0
    }
  })

  return { products: enriched, totalCount: count || 0 }
}

export function useProducts(filters?: ProductFilters, page: number = 0) {
  const { toast } = useToast()
  const supabase = createClient()

  // 🔑 Clé SWR stable basée sur filtres + page
  const swrKey = useMemo(() =>
    ['products', JSON.stringify(filters || {}), page],
    [filters, page]
  )

  // 🚀 Utiliser SWR avec cache et revalidation automatique
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    ([_, filtersJson]) => productsFetcher('products', JSON.parse(filtersJson), page),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: CACHE_REVALIDATION_TIME,
      keepPreviousData: true // Garde les données pendant rechargement
    }
  )

  const products = data?.products || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE)

  // 📝 Méthodes CRUD avec invalidation cache SWR
  const createProduct = async (productData: CreateProductData): Promise<Product | null> => {
    try {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
          supplier_cost_price: productData.supplier_cost_price,
          price_ht: productData.supplier_cost_price || 0,
          margin_percentage: productData.margin_percentage || 0,
          availability_type: productData.availability_type || 'normal',
          cost_price: productData.cost_price,
          description: productData.description,
          subcategory_id: productData.subcategory_id,
          technical_description: productData.technical_description,
          selling_points: productData.selling_points || [],
          product_type: productData.product_type || 'standard',
          assigned_client_id: productData.assigned_client_id,
          creation_mode: productData.creation_mode || 'complete',
          supplier_page_url: productData.supplier_page_url,
          condition: productData.condition || 'new',
          variant_attributes: productData.variant_attributes,
          dimensions: productData.dimensions,
          weight: productData.weight,
          video_url: productData.video_url,
          supplier_reference: productData.supplier_reference,
          gtin: productData.gtin,
          supplier_id: productData.supplier_id,
          brand: productData.brand
        }])
        .select()
        .single()

      if (error) throw error

      // 🔄 Invalider cache SWR pour refresh auto
      await mutate()

      toast({
        title: "Succès",
        description: "Produit créé avec succès"
      })
      return newProduct
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création'
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
      return null
    }
  }

  const updateProduct = async (id: string, productData: Partial<CreateProductData>): Promise<Product | null> => {
    try {
      const { data: updatedProduct, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 🔄 Invalider cache SWR
      await mutate()

      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès"
      })
      return updatedProduct
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
      return null
    }
  }

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 🔄 Invalider cache SWR
      await mutate()

      toast({
        title: "Succès",
        description: "Produit supprimé avec succès"
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression'
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    }
  }

  return {
    products,
    loading: isLoading,
    error: error?.message || null,
    refetch: () => mutate(),
    createProduct,
    updateProduct,
    deleteProduct,
    // 📄 Pagination
    page,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages - 1,
    hasPreviousPage: page > 0
  }
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            id,
            sku,
            name,
            slug,
            price_ht,
            supplier_cost_price,
            cost_price,
            status,
            condition,
            variant_attributes,
            dimensions,
            weight,
            video_url,
            supplier_reference,
            gtin,
            stock_quantity,
            min_stock,
            supplier_page_url,
            supplier_id,
            margin_percentage,
            target_margin_percentage,
            availability_type,
            description,
            technical_description,
            selling_points,
            product_type,
            assigned_client_id,
            creation_mode,
            created_at,
            updated_at,
            supplier:organisations!supplier_id (
              id,
              name,
              type
            ),
            product_images!product_id(
              public_url,
              is_primary
            )
          `)
          .eq('id', id)
          .single()

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        // Enrichir le produit avec le prix minimum de vente + image primaire
        if (data) {
          const supplierCost = data.supplier_cost_price || data.price_ht
          const margin = data.margin_percentage || 0

          const minimumSellingPrice = supplierCost && margin
            ? calculateMinimumSellingPrice(supplierCost, margin)
            : 0

          // Extraire l'image primaire
          const primaryImage = Array.isArray(data.product_images)
            ? data.product_images.find((img: any) => img.is_primary === true)
            : null

          setProduct({
            ...data,
            primary_image_url: primaryImage?.public_url || null,
            minimumSellingPrice
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, supabase])

  return { product, loading, error }
}