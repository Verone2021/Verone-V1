'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  price_ht: number
  cost_price?: number
  tax_rate: number
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  condition: 'new' | 'refurbished' | 'used'
  variant_attributes?: any
  dimensions?: any
  weight?: number
  // Images gérées par product_images table via useProductImages hook
  video_url?: string
  supplier_reference?: string
  gtin?: string
  stock_quantity?: number
  min_stock_level?: number
  supplier_page_url?: string
  supplier_id?: string
  margin_percentage?: number
  estimated_selling_price?: number
  created_at: string
  updated_at: string

  // Relations jointes
  organisations?: {
    id: string
    name: string
    type: string
  }
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
  sku: string
  name: string
  price_ht: number
  cost_price?: number
  tax_rate?: number
  status?: string
  condition?: string
  variant_attributes?: any
  dimensions?: any
  weight?: number
  // Images gérées séparément par product_images table
  video_url?: string
  supplier_reference?: string
  gtin?: string
  stock_quantity?: number
  min_stock_level?: number
  supplier_page_url?: string
  supplier_id?: string
  margin_percentage?: number
}

export function useProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const supabase = createClient()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          sku,
          name,
          slug,
          price_ht,
          cost_price,
          tax_rate,
          status,
          condition,
          variant_attributes,
          dimensions,
          weight,
          video_url,
          supplier_reference,
          gtin,
          stock_quantity,
          min_stock_level,
          supplier_page_url,
          supplier_id,
          margin_percentage,
          estimated_selling_price,
          created_at,
          updated_at,
          organisations (
            id,
            name,
            type
          )
        `)
        .order('created_at', { ascending: false })

      // Appliquer les filtres
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id)
      }

      if (filters?.min_price) {
        query = query.gte('price_ht', filters.min_price)
      }

      if (filters?.max_price) {
        query = query.lte('price_ht', filters.max_price)
      }

      if (filters?.in_stock_only) {
        query = query.gt('stock_quantity', 0)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [filters, supabase])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const createProduct = async (data: CreateProductData): Promise<Product | null> => {
    try {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([{
          sku: data.sku,
          name: data.name,
          slug: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
          price_ht: data.price_ht,
          cost_price: data.cost_price,
          tax_rate: data.tax_rate || 0.2,
          status: data.status || 'in_stock',
          condition: data.condition || 'new',
          variant_attributes: data.variant_attributes,
          dimensions: data.dimensions,
          weight: data.weight,
          video_url: data.video_url,
          supplier_reference: data.supplier_reference,
          gtin: data.gtin,
          stock_quantity: data.stock_quantity || 0,
          min_stock_level: data.min_stock_level || 5,
          supplier_page_url: data.supplier_page_url,
          supplier_id: data.supplier_id,
          margin_percentage: data.margin_percentage
        }])
        .select()
        .single()

      if (error) {
        setError(error.message)
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
        return null
      }

      await fetchProducts()
      toast({
        title: "Succès",
        description: "Produit créé avec succès"
      })
      return newProduct
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      toast({
        title: "Erreur",
        description: "Impossible de créer le produit",
        variant: "destructive"
      })
      return null
    }
  }

  const updateProduct = async (id: string, data: Partial<CreateProductData>): Promise<Product | null> => {
    try {
      const { data: updatedProduct, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        setError(error.message)
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
        return null
      }

      await fetchProducts()
      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès"
      })
      return updatedProduct
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit",
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

      if (error) {
        setError(error.message)
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
        return false
      }

      await fetchProducts()
      toast({
        title: "Succès",
        description: "Produit supprimé avec succès"
      })
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive"
      })
      return false
    }
  }

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
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
            cost_price,
            tax_rate,
            status,
            condition,
            variant_attributes,
            dimensions,
            weight,
            video_url,
            supplier_reference,
            gtin,
            stock_quantity,
            min_stock_level,
            supplier_page_url,
            supplier_id,
            margin_percentage,
            estimated_selling_price,
            created_at,
            updated_at,
            organisations (
              id,
              name,
              type
            )
          `)
          .eq('id', id)
          .single()

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        setProduct(data)
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