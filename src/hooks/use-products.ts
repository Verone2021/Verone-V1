'use client'

import { useState, useEffect, useCallback } from 'react'
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
  // Images gérées par product_images table via useProductImages hook
  video_url?: string
  supplier_reference?: string
  gtin?: string
  stock_quantity?: number
  min_stock_level?: number
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
          min_stock_level,
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
          )
        `)
        .order('created_at', { ascending: false })

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

      // Enrichir les produits avec le prix minimum de vente calculé
      const enrichedProducts = (data || []).map(product => {
        // Utiliser supplier_cost_price en priorité, sinon price_ht en fallback
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

      setProducts(enrichedProducts)
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
          // SKU sera généré automatiquement par la fonction DB
          name: data.name,
          slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
          // NOUVELLE LOGIQUE PRIX
          supplier_cost_price: data.supplier_cost_price, // Prix d'achat fournisseur
          price_ht: data.supplier_cost_price || 0, // Legacy - prix d'achat (sera supprimé plus tard)
          margin_percentage: data.margin_percentage || 0, // Marge minimum
          // Nouveaux champs business rules
          availability_type: data.availability_type || 'normal',
          cost_price: data.cost_price, // Autre coût si défini séparément
          description: data.description, // Obligatoire en mode complete
          subcategory_id: data.subcategory_id, // Obligatoire en mode complete
          technical_description: data.technical_description,
          selling_points: data.selling_points || [],
          // NOUVEAUX CHAMPS - Système sourcing et différenciation
          product_type: data.product_type || 'standard',
          assigned_client_id: data.assigned_client_id,
          creation_mode: data.creation_mode || 'complete',
          supplier_page_url: data.supplier_page_url,
          // Champs optionnels existants
          condition: data.condition || 'new',
          variant_attributes: data.variant_attributes,
          dimensions: data.dimensions,
          weight: data.weight,
          video_url: data.video_url,
          supplier_reference: data.supplier_reference,
          gtin: data.gtin,
          supplier_id: data.supplier_id,
          brand: data.brand
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
            min_stock_level,
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
            )
          `)
          .eq('id', id)
          .single()

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        // Enrichir le produit avec le prix minimum de vente calculé
        if (data) {
          const supplierCost = data.supplier_cost_price || data.price_ht
          const margin = data.margin_percentage || 0

          const minimumSellingPrice = supplierCost && margin
            ? calculateMinimumSellingPrice(supplierCost, margin)
            : 0

          setProduct({
            ...data,
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