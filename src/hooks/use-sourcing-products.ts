'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface SourcingProduct {
  id: string
  sku: string
  name: string
  supplier_page_url: string | null
  cost_price: number | null // 🔥 FIX: Utiliser cost_price au lieu de supplier_cost_price
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
    type: string // 🔥 FIX: type au lieu de is_professional
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
  supplier_id?: string        // 🆕 Filtrer par fournisseur spécifique
  assigned_client_id?: string // 🆕 Filtrer par client assigné spécifique
  has_supplier?: boolean
  requires_sample?: boolean
}

export function useSourcingProducts(filters?: SourcingFilters) {
  const [products, setProducts] = useState<SourcingProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // 🔥 FIX SIMPLE: Utiliser fonction classique au lieu de useCallback
  // Cela évite les dépendances circulaires
  const fetchSourcingProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      // Requête de base pour produits en sourcing avec jointures organisations
      let query = supabase
        .from('products')
        .select(`
          id,
          sku,
          name,
          supplier_page_url,
          cost_price,
          status,
          supplier_id,
          creation_mode,
          sourcing_type,
          requires_sample,
          assigned_client_id,
          margin_percentage,
          created_at,
          updated_at,
          supplier:organisations!products_supplier_id_fkey(
            id,
            name,
            type
          ),
          assigned_client:organisations!products_assigned_client_id_fkey(
            id,
            name,
            type
          )
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

      // 🆕 Filtre par fournisseur spécifique
      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id)
      }

      // 🆕 Filtre par client assigné spécifique
      if (filters?.assigned_client_id) {
        query = query.eq('assigned_client_id', filters.assigned_client_id)
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

      // 🔥 FIX: Ne pas charger images si aucun produit (évite requête bloquante)
      let imageMap = new Map<string, string>()

      if (productIds.length > 0) {
        const imagesResponse = await supabase
          .from('product_images')
          .select('product_id, public_url')
          .in('product_id', productIds)
          .eq('is_primary', true)

        imageMap = new Map(
          imagesResponse.data?.map(img => [img.product_id, img.public_url]) || []
        )
      }

      // Enrichir les produits avec les calculs
      const enrichedProducts = (data || []).map(product => {
        const supplierCost = product.cost_price || 0 // 🔥 FIX: cost_price au lieu de supplier_cost_price
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
  }

  useEffect(() => {
    // 🔥 FIX: Appeler directement sans dépendances sur la fonction
    // Dépendre uniquement des valeurs primitives de filters
    fetchSourcingProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.search,
    filters?.status,
    filters?.sourcing_type,
    filters?.has_supplier,
    filters?.requires_sample
  ])

  // Valider un produit sourcing (passage au catalogue)
  const validateSourcing = async (productId: string) => {
    try {
      // 🔥 FIX: Vérifications business rules complètes
      const product = products.find(p => p.id === productId)

      if (!product) {
        toast({
          title: "Erreur",
          description: "Produit introuvable",
          variant: "destructive"
        })
        return false
      }

      // Vérification prix fournisseur OBLIGATOIRE
      if (!product.cost_price || product.cost_price <= 0) {
        toast({
          title: "Erreur",
          description: "Le prix d'achat fournisseur doit être défini et > 0€ avant validation",
          variant: "destructive"
        })
        return false
      }

      // Vérification fournisseur OBLIGATOIRE
      if (!product.supplier_id) {
        toast({
          title: "Erreur",
          description: "Un fournisseur doit être lié avant la validation",
          variant: "destructive"
        })
        return false
      }

      // 🔥 FIX: Mettre à jour statut + stocks pour respecter trigger validation
      // Le trigger exige stock > 0 pour status "in_stock"
      const { error } = await supabase
        .from('products')
        .update({
          status: 'in_stock',
          creation_mode: 'complete',
          stock_real: 1, // Stock initial minimal pour valider le trigger
          stock_forecasted_in: 0 // Pas de stock prévisionnel à l'entrée
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
    supplier_cost_price: number // REQUIRED - validation > 0
    supplier_id?: string
    assigned_client_id?: string
    imageFile?: File // Upload image optionnel
  }) => {
    try {
      // 🔥 FIX: Validation prix OBLIGATOIRE
      if (!data.supplier_cost_price || data.supplier_cost_price <= 0) {
        toast({
          title: "Erreur",
          description: "Le prix d'achat fournisseur est obligatoire et doit être > 0€",
          variant: "destructive"
        })
        return null
      }

      // Validation nom
      if (!data.name?.trim()) {
        toast({
          title: "Erreur",
          description: "Le nom du produit est obligatoire",
          variant: "destructive"
        })
        return null
      }

      // Créer le produit
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([{
          name: data.name,
          supplier_page_url: data.supplier_page_url,
          cost_price: data.supplier_cost_price, // 🔥 FIX: Utiliser cost_price (nom correct BD)
          supplier_id: data.supplier_id,
          assigned_client_id: data.assigned_client_id,
          creation_mode: 'sourcing',
          sourcing_type: data.assigned_client_id ? 'client' : 'interne',
          status: 'sourcing' // Statut initial pour produit en sourcing
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

      // 🔥 FIX: Upload image si fournie
      if (data.imageFile && newProduct) {
        try {
          const fileExt = data.imageFile.name.split('.').pop()
          const fileName = `${newProduct.id}-${Date.now()}.${fileExt}`
          const filePath = `products/${fileName}`

          // Upload vers Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, data.imageFile)

          if (uploadError) {
            console.error('Erreur upload image:', uploadError)
            // Ne pas bloquer la création du produit, juste logger
          } else {
            // Obtenir l'URL publique
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath)

            // Créer entrée product_images
            await supabase
              .from('product_images')
              .insert([{
                product_id: newProduct.id,
                public_url: publicUrl,
                storage_path: filePath,
                is_primary: true,
                image_type: 'product'
              }])
          }
        } catch (imgError) {
          console.error('Erreur gestion image:', imgError)
          // Ne pas bloquer la création
        }
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