/**
 * 📁 Hook Collections - Vérone Back Office
 *
 * Hook pour la gestion des collections de produits avec partage
 * Remplace les données mock par de vraies données Supabase
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Collection {
  id: string
  name: string
  description?: string
  is_active: boolean
  visibility: 'public' | 'private'
  shared_link_token?: string
  product_count: number
  shared_count: number
  last_shared?: string
  created_at: string
  updated_at: string
  created_by?: string
  products?: Array<{
    id: string
    name: string
    image_url: string
    price_ht: number
  }>
}

export interface CollectionFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  visibility?: 'all' | 'public' | 'private'
  shared?: 'all' | 'shared' | 'not_shared'
}

export interface CreateCollectionData {
  name: string
  description?: string
  is_active?: boolean
  visibility?: 'public' | 'private'
}

export interface UpdateCollectionData extends Partial<CreateCollectionData> {
  id: string
}

export function useCollections(filters?: CollectionFilters) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchCollections = useCallback(async () => {
    console.log('🔍 [useCollections] Démarrage fetchCollections avec filtres:', filters)
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('collections')
        .select(`
          id,
          name,
          description,
          is_active,
          visibility,
          shared_link_token,
          product_count,
          shared_count,
          last_shared,
          created_at,
          updated_at,
          created_by
        `)
        .order('updated_at', { ascending: false })
        .limit(10) // LIMITE TEMPORAIRE pour éviter trop de requêtes

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        const isActive = filters.status === 'active'
        query = query.eq('is_active', isActive)
      }

      if (filters?.visibility && filters.visibility !== 'all') {
        query = query.eq('visibility', filters.visibility)
      }

      if (filters?.shared && filters.shared !== 'all') {
        if (filters.shared === 'shared') {
          query = query.gt('shared_count', 0)
        } else if (filters.shared === 'not_shared') {
          query = query.eq('shared_count', 0)
        }
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      console.log('🔍 [useCollections] Exécution requête principale')
      const { data, error: fetchError } = await query

      if (fetchError) {
        console.error('❌ [useCollections] Erreur requête principale:', fetchError)
        setError(fetchError.message)
        return
      }

      console.log('✅ [useCollections] Collections récupérées:', data?.length || 0)

      // Simplification temporaire : ne pas charger les produits pour éviter trop de requêtes
      setCollections((data || []).map(collection => ({
        ...collection,
        products: [] // Produits vides temporairement
      })) as Collection[])

    } catch (err) {
      console.error('💥 [useCollections] Erreur catch:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
      console.log('🏁 [useCollections] fetchCollections terminé')
    }
  }, []) // CORRECTION: Dépendances vides pour éviter boucle infinie

  // useEffect stable qui se déclenche seulement au montage initial
  useEffect(() => {
    fetchCollections()
  }, []) // CORRECTION: Dépendances vides pour chargement initial seulement

  const createCollection = async (data: CreateCollectionData): Promise<Collection | null> => {
    try {
      const { data: newCollection, error } = await supabase
        .from('collections')
        .insert([{
          name: data.name,
          description: data.description || null,
          is_active: data.is_active ?? true,
          visibility: data.visibility || 'private',
        }])
        .select()
        .single()

      if (error) {
        setError(error.message)
        return null
      }

      await fetchCollections()
      return newCollection
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      return null
    }
  }

  const updateCollection = async (data: UpdateCollectionData): Promise<Collection | null> => {
    try {
      const updateData: any = { ...data }
      delete updateData.id

      const { data: updatedCollection, error } = await supabase
        .from('collections')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .select()
        .single()

      if (error) {
        setError(error.message)
        return null
      }

      await fetchCollections()
      return updatedCollection
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      return null
    }
  }

  const deleteCollection = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)

      if (error) {
        setError(error.message)
        return false
      }

      await fetchCollections()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
      return false
    }
  }

  const toggleCollectionStatus = async (id: string): Promise<boolean> => {
    try {
      const collection = collections.find(c => c.id === id)
      if (!collection) return false

      const { error } = await supabase
        .from('collections')
        .update({
          is_active: !collection.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        setError(error.message)
        return false
      }

      await fetchCollections()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de statut')
      return false
    }
  }

  const generateShareToken = async (id: string): Promise<string | null> => {
    try {
      const collection = collections.find(c => c.id === id)
      if (!collection) return null

      // Generate share token using the database function
      const { data: tokenResult, error: tokenError } = await supabase
        .rpc('generate_share_token', { collection_name: collection.name })

      if (tokenError) {
        setError(tokenError.message)
        return null
      }

      const shareToken = tokenResult

      // Update collection with the share token
      const { error: updateError } = await supabase
        .from('collections')
        .update({
          shared_link_token: shareToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        return null
      }

      await fetchCollections()
      return shareToken
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération du lien')
      return null
    }
  }

  const addProductToCollection = async (collectionId: string, productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('collection_products')
        .insert([{
          collection_id: collectionId,
          product_id: productId,
        }])

      if (error) {
        setError(error.message)
        return false
      }

      await fetchCollections()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du produit')
      return false
    }
  }

  const removeProductFromCollection = async (collectionId: string, productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('collection_products')
        .delete()
        .eq('collection_id', collectionId)
        .eq('product_id', productId)

      if (error) {
        setError(error.message)
        return false
      }

      await fetchCollections()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du produit')
      return false
    }
  }

  const recordShare = async (collectionId: string, shareType: 'link' | 'email' | 'pdf' = 'link', recipientEmail?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('collection_shares')
        .insert([{
          collection_id: collectionId,
          share_type: shareType,
          recipient_email: recipientEmail || null,
        }])

      if (error) {
        setError(error.message)
        return false
      }

      await fetchCollections()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du partage')
      return false
    }
  }

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    toggleCollectionStatus,
    generateShareToken,
    addProductToCollection,
    removeProductFromCollection,
    recordShare,
  }
}

export function useCollection(id: string) {
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchCollection = async () => {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('collections')
          .select(`
            id,
            name,
            description,
            is_active,
            visibility,
            shared_link_token,
            product_count,
            shared_count,
            last_shared,
            created_at,
            updated_at,
            created_by
          `)
          .eq('id', id)
          .single()

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        // Get all products in this collection
        const { data: products } = await supabase
          .from('collection_products')
          .select(`
            position,
            products:product_id (
              id,
              name,
              image_url,
              price_ht
            )
          `)
          .eq('collection_id', id)
          .order('position', { ascending: true })

        setCollection({
          ...data,
          products: products?.map(cp => cp.products).filter(Boolean) || []
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [id])

  return { collection, loading, error }
}