'use client'

import { useMemo, useCallback } from 'react'
import { useSupabaseQuery, useSupabaseMutation, useSupabaseTable, clearQueryCache } from './use-supabase-query'
import { useToast } from './use-toast'

// Types unifiés pour le catalogue optimisé
export interface Product {
  id: string
  sku: string
  name: string
  slug?: string
  price_ht: number
  supplier_cost_price?: number
  cost_price?: number
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued' | 'sourcing' | 'pret_a_commander' | 'echantillon_a_commander'
  condition: 'new' | 'refurbished' | 'used'
  variant_attributes?: Record<string, any>
  dimensions?: Record<string, any>
  weight?: number
  video_url?: string
  stock_quantity?: number
  stock_real?: number
  stock_forecasted_in?: number
  stock_forecasted_out?: number
  min_stock?: number
  supplier_id?: string
  subcategory_id?: string
  brand?: string
  supplier_reference?: string
  supplier_page_url?: string
  gtin?: string
  margin_percentage?: number
  target_margin_percentage?: number
  description?: string
  technical_description?: string
  selling_points?: string[]
  availability_type?: 'normal' | 'preorder' | 'coming_soon' | 'discontinued'
  product_type?: 'standard' | 'custom'
  assigned_client_id?: string
  creation_mode?: 'sourcing' | 'complete'
  requires_sample?: boolean
  archived_at?: string
  created_at: string
  updated_at: string
  // Relations
  supplier?: { id: string; name: string; type: string }
  subcategories?: { id: string; name: string }
  primary_image_url?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  level?: number
  parent_id?: string
  description?: string
  image_url?: string
  is_active: boolean
  display_order?: number
  family_id?: string
  created_at: string
  updated_at: string
}

export interface CatalogueFilters {
  search?: string
  statuses?: string[]
  categories?: string[]
  suppliers?: string[]
  priceMin?: number
  priceMax?: number
  inStockOnly?: boolean
  archived?: boolean
  productType?: 'standard' | 'custom'
  assignedClientId?: string
  limit?: number
  offset?: number
}

export interface CreateProductData {
  name: string
  slug?: string
  supplier_cost_price?: number
  margin_percentage?: number
  availability_type?: 'normal' | 'preorder' | 'coming_soon' | 'discontinued'
  cost_price?: number
  description?: string
  subcategory_id?: string
  technical_description?: string
  selling_points?: string[]
  product_type?: 'standard' | 'custom'
  assigned_client_id?: string
  creation_mode?: 'sourcing' | 'complete'
  supplier_page_url?: string
  condition?: 'new' | 'refurbished' | 'used'
  variant_attributes?: Record<string, any>
  dimensions?: Record<string, any>
  weight?: number
  video_url?: string
  supplier_reference?: string
  gtin?: string
  supplier_id?: string
  brand?: string
  requires_sample?: boolean
}

// Helper pour calculer le prix minimum de vente
export function calculateMinimumSellingPrice(supplierCost: number, marginPercentage: number): number {
  return supplierCost * (1 + marginPercentage / 100)
}

export function useCatalogueOptimized(filters: CatalogueFilters = {}) {
  const { toast } = useToast()

  // Query pour les produits avec cache intelligent
  const productsQuery = useSupabaseQuery(
    `products:${JSON.stringify(filters)}`,
    async (supabase) => {
      let query = supabase
        .from('products')
        .select(`
          *,
          supplier:organisations!supplier_id(id, name, type),
          subcategories!subcategory_id(id, name)
        `)

      // Filtres selon business rules
      if (!filters.archived) {
        query = query.is('archived_at', null)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses)
      }

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('subcategory_id', filters.categories)
      }

      if (filters.suppliers && filters.suppliers.length > 0) {
        query = query.in('supplier_id', filters.suppliers)
      }

      if (filters.priceMin !== undefined) {
        query = query.gte('price_ht', filters.priceMin)
      }

      if (filters.priceMax !== undefined) {
        query = query.lte('price_ht', filters.priceMax)
      }

      if (filters.inStockOnly) {
        query = query.gt('stock_real', 0)
      }

      if (filters.productType) {
        query = query.eq('product_type', filters.productType)
      }

      if (filters.assignedClientId) {
        query = query.eq('assigned_client_id', filters.assignedClientId)
      }

      // Pagination optimisée
      const limit = filters.limit || 500
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      // Tri par défaut
      query = query.order('updated_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      // Enrichir les produits avec calculs business
      const enrichedProducts = (data || []).map(product => {
        const supplierCost = product.supplier_cost_price || product.price_ht
        const margin = product.margin_percentage || 0

        const minimumSellingPrice = supplierCost && margin
          ? calculateMinimumSellingPrice(supplierCost, margin)
          : 0

        return {
          ...product,
          minimumSellingPrice
        }
      })

      return { data: enrichedProducts, error: null, count }
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes pour les produits
      cacheTime: 5 * 60 * 1000  // 5 minutes
    }
  )

  // Query pour les catégories avec cache long terme
  const categoriesQuery = useSupabaseTable<Category>(
    'categories',
    { is_active: true },
    {
      select: '*',
      orderBy: { column: 'level', ascending: true },
      staleTime: 10 * 60 * 1000, // 10 minutes pour les catégories
      cacheTime: 30 * 60 * 1000  // 30 minutes
    }
  )

  // Mutations optimisées
  const createProductMutation = useSupabaseMutation<Product>(
    async (supabase, productData: CreateProductData) => {
      const { data, error } = await supabase
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
          brand: productData.brand,
          requires_sample: productData.requires_sample || false
        }])
        .select()
        .single()

      return { data, error }
    }
  )

  const updateProductMutation = useSupabaseMutation<Product>(
    async (supabase, { id, updates }: { id: string; updates: Partial<CreateProductData> }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    }
  )

  const archiveProductMutation = useSupabaseMutation<boolean>(
    async (supabase, id: string) => {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'discontinued',
          archived_at: new Date().toISOString()
        })
        .eq('id', id)

      return { data: !error, error }
    }
  )

  const deleteProductMutation = useSupabaseMutation<boolean>(
    async (supabase, id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      return { data: !error, error }
    }
  )

  // Actions avec feedback utilisateur
  const createProduct = useCallback(async (productData: CreateProductData): Promise<Product | null> => {
    const result = await createProductMutation.mutate(productData)

    if (result) {
      toast({
        title: "Succès",
        description: "Produit créé avec succès"
      })
      // Invalider les caches pour rafraîchir les listes
      clearQueryCache('products')
    } else {
      toast({
        title: "Erreur",
        description: createProductMutation.error || "Impossible de créer le produit",
        variant: "destructive"
      })
    }

    return result
  }, [createProductMutation, toast])

  const updateProduct = useCallback(async (id: string, updates: Partial<CreateProductData>): Promise<Product | null> => {
    const result = await updateProductMutation.mutate({ id, updates })

    if (result) {
      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès"
      })
      clearQueryCache('products')
    } else {
      toast({
        title: "Erreur",
        description: updateProductMutation.error || "Impossible de mettre à jour le produit",
        variant: "destructive"
      })
    }

    return result
  }, [updateProductMutation, toast])

  const archiveProduct = useCallback(async (id: string): Promise<boolean> => {
    const result = await archiveProductMutation.mutate(id)

    if (result) {
      toast({
        title: "Succès",
        description: "Produit archivé avec succès"
      })
      clearQueryCache('products')
    } else {
      toast({
        title: "Erreur",
        description: archiveProductMutation.error || "Impossible d'archiver le produit",
        variant: "destructive"
      })
    }

    return result || false
  }, [archiveProductMutation, toast])

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    const result = await deleteProductMutation.mutate(id)

    if (result) {
      toast({
        title: "Succès",
        description: "Produit supprimé avec succès"
      })
      clearQueryCache('products')
    } else {
      toast({
        title: "Erreur",
        description: deleteProductMutation.error || "Impossible de supprimer le produit",
        variant: "destructive"
      })
    }

    return result || false
  }, [deleteProductMutation, toast])

  // Stats calculées avec memo pour performance
  const stats = useMemo(() => {
    const products = productsQuery.data || []

    return {
      totalProducts: products.length,
      inStock: products.filter(p => p.status === 'in_stock').length,
      outOfStock: products.filter(p => p.status === 'out_of_stock').length,
      preorder: products.filter(p => p.status === 'preorder').length,
      comingSoon: products.filter(p => p.status === 'coming_soon').length,
      lowStock: products.filter(p => (p.stock_real || 0) <= (p.min_stock || 5)).length,
      averageMargin: products.reduce((acc, p) => acc + (p.margin_percentage || 0), 0) / (products.length || 1)
    }
  }, [productsQuery.data])

  // Helpers
  const getProductsBySubcategory = useCallback((subcategoryId: string) => {
    return (productsQuery.data || []).filter(p => p.subcategory_id === subcategoryId)
  }, [productsQuery.data])

  const getCategoryById = useCallback((id: string) => {
    return (categoriesQuery.data || []).find(c => c.id === id)
  }, [categoriesQuery.data])

  return {
    // Données
    products: productsQuery.data || [],
    categories: categoriesQuery.data || [],

    // États
    loading: productsQuery.loading || categoriesQuery.loading,
    error: productsQuery.error || categoriesQuery.error,

    // Actions
    createProduct,
    updateProduct,
    archiveProduct,
    deleteProduct,
    refetch: productsQuery.refetch,

    // Helpers
    getProductsBySubcategory,
    getCategoryById,
    stats,

    // Mutations states pour UI feedback avancé
    mutations: {
      creating: createProductMutation.loading,
      updating: updateProductMutation.loading,
      archiving: archiveProductMutation.loading,
      deleting: deleteProductMutation.loading
    }
  }
}