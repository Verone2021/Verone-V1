'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface SourcingProduct {
  id: string
  sku: string
  name: string
  supplier_page_url: string | null
  supplier_cost_price: number | null
  status: string
  supplier_id: string | null
  supplier?: {
    id: string
    name: string
    type: string
  }
  creation_mode: string
  sourcing_type?: string
  requires_sample: boolean
  assigned_client_id: string | null
  assigned_client?: {
    id: string
    name: string
    is_professional: boolean
  }
  created_at: string
  updated_at: string
  // Calculs
  estimated_selling_price?: number
  margin_percentage?: number
  // Images
  main_image_url?: string
}

interface SourcingFilters {
  search?: string
  status?: string
  sourcing_type?: 'interne' | 'client'
  has_supplier?: boolean
  requires_sample?: boolean
}

export function useSourcingProducts(filters?: SourcingFilters) {
  const [products, setProducts] = useState<SourcingProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchSourcingProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Requête de base pour produits en sourcing - simplifiée pour debug
      let query = supabase
        .from('products')
        .select(`
          id,
          sku,
          name,
          supplier_page_url,
          supplier_cost_price,
          status,
          supplier_id,
          creation_mode,
          sourcing_type,
          requires_sample,
          assigned_client_id,
          margin_percentage,
          created_at,
          updated_at
        `)
        .eq('creation_mode', 'sourcing')
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      // Appliquer les filtres
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.sourcing_type) {
        query = query.eq('sourcing_type', filters.sourcing_type)
      }

      if (filters?.has_supplier !== undefined) {
        if (filters.has_supplier) {
          query = query.not('supplier_id', 'is', null)
        } else {
          query = query.is('supplier_id', null)
        }
      }

      if (filters?.requires_sample !== undefined) {
        query = query.eq('requires_sample', filters.requires_sample)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
        toast({
          title: "Erreur",
          description: "Impossible de charger les produits en sourcing",
          variant: "destructive"
        })
        return
      }

      // Récupérer les images principales
      const productIds = data?.map(p => p.id) || []
      const imagesResponse = await supabase
        .from('product_images')
        .select('product_id, image_url')
        .in('product_id', productIds)
        .eq('is_primary', true)

      const imageMap = new Map(
        imagesResponse.data?.map(img => [img.product_id, img.image_url]) || []
      )

      // Enrichir les produits avec les calculs
      const enrichedProducts = (data || []).map(product => {
        const supplierCost = product.supplier_cost_price || 0
        const margin = product.margin_percentage || 50 // Marge par défaut 50%
        const estimatedSellingPrice = supplierCost * (1 + margin / 100)

        return {
          ...product,
          estimated_selling_price: estimatedSellingPrice,
          main_image_url: imageMap.get(product.id) || null
        }
      })

      setProducts(enrichedProducts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, supabase, toast])

  useEffect(() => {
    fetchSourcingProducts()
  }, [fetchSourcingProducts])

  // Valider un produit sourcing (passage au catalogue)
  const validateSourcing = async (productId: string) => {
    try {
      // Vérifier que le fournisseur est lié
      const product = products.find(p => p.id === productId)
      if (!product?.supplier_id) {
        toast({
          title: "Erreur",
          description: "Un fournisseur doit être lié avant la validation",
          variant: "destructive"
        })
        return false
      }

      // Mettre à jour le statut
      const { error } = await supabase
        .from('products')
        .update({
          status: 'in_stock',
          creation_mode: 'complete'
        })
        .eq('id', productId)

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
        return false
      }

      toast({
        title: "Succès",
        description: "Produit validé et ajouté au catalogue"
      })

      await fetchSourcingProducts()
      return true
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de valider le produit",
        variant: "destructive"
      })
      return false
    }
  }

  // Commander un échantillon
  const orderSample = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'echantillon_a_commander',
          requires_sample: true
        })
        .eq('id', productId)

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
        return false
      }

      toast({
        title: "Succès",
        description: "Commande d'échantillon enregistrée"
      })

      await fetchSourcingProducts()
      return true
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de commander l'échantillon",
        variant: "destructive"
      })
      return false
    }
  }

  // Créer un produit en sourcing rapide
  const createSourcingProduct = async (data: {
    name: string
    supplier_page_url: string
    supplier_cost_price: number
    supplier_id?: string
    assigned_client_id?: string
  }) => {
    try {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([{
          name: data.name,
          supplier_page_url: data.supplier_page_url,
          supplier_cost_price: data.supplier_cost_price,
          supplier_id: data.supplier_id,
          assigned_client_id: data.assigned_client_id,
          creation_mode: 'sourcing',
          sourcing_type: data.assigned_client_id ? 'client' : 'interne',
          status: 'sourcing',
          price_ht: data.supplier_cost_price || 0, // Legacy field
          cost_price: data.supplier_cost_price || 0
        }])
        .select()
        .single()

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
        return null
      }

      toast({
        title: "Succès",
        description: "Produit en sourcing créé"
      })

      await fetchSourcingProducts()
      return newProduct
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le produit",
        variant: "destructive"
      })
      return null
    }
  }

  return {
    products,
    loading,
    error,
    refetch: fetchSourcingProducts,
    validateSourcing,
    orderSample,
    createSourcingProduct
  }
}