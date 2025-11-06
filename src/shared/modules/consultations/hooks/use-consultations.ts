'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/shared/modules/common/hooks'

const supabase = createClient()

// Types pour les consultations
export interface ClientConsultation {
  id: string
  organisation_name: string
  client_email: string
  client_phone?: string
  descriptif: string
  image_url?: string
  tarif_maximum?: number
  status: 'en_attente' | 'en_cours' | 'terminee' | 'annulee'
  assigned_to?: string
  notes_internes?: string
  priority_level: number
  source_channel: 'website' | 'email' | 'phone' | 'other'
  estimated_response_date?: string
  created_at: string
  updated_at: string
  created_by?: string
  responded_at?: string
  responded_by?: string
  // Lifecycle columns (ajoutées 2025-10-20)
  validated_at?: string
  validated_by?: string
  archived_at?: string
  archived_by?: string
  deleted_at?: string
  deleted_by?: string
}

// Interface existante maintenue pour rétrocompatibilité
export interface ConsultationProduct {
  id: string
  consultation_id: string
  product_id: string
  proposed_price?: number
  notes?: string
  is_primary_proposal: boolean
  quantity: number
  is_free: boolean
  created_at: string
  created_by?: string
  // Relations
  product?: {
    id: string
    name: string
    sku: string
    requires_sample: boolean
    supplier_name?: string
  }
}

// Nouvelle interface simplifiée pour le workflow type commande
export interface ConsultationItem {
  id: string
  consultation_id: string
  product_id: string
  quantity: number
  unit_price?: number
  is_free: boolean
  notes?: string
  created_at: string
  created_by?: string
  // Relations
  product?: {
    id: string
    name: string
    sku: string
    requires_sample: boolean
    supplier_name?: string
    cost_price?: number
  }
}

export interface CreateConsultationData {
  organisation_name: string  // Nom de l'organisation cliente
  client_email: string
  client_phone?: string
  descriptif: string
  image_url?: string
  tarif_maximum?: number
  priority_level?: number
  source_channel?: 'website' | 'email' | 'phone' | 'other'
  estimated_response_date?: string
}

// Interface existante maintenue pour rétrocompatibilité
export interface AssignProductData {
  consultation_id: string
  product_id: string
  proposed_price?: number
  notes?: string
  is_primary_proposal?: boolean
  quantity?: number
  is_free?: boolean
}

// Nouvelles interfaces simplifiées pour le workflow type commande
export interface CreateConsultationItemData {
  consultation_id: string
  product_id: string
  quantity: number
  unit_price?: number
  is_free?: boolean
  notes?: string
}

export interface UpdateConsultationItemData {
  quantity?: number
  unit_price?: number
  is_free?: boolean
  notes?: string
}

export interface ConsultationFilters {
  status?: string
  assigned_to?: string
  priority_level?: number | 'all'
  organisation_name?: string
  source_channel?: string
  date_range?: {
    start: string
    end: string
  }
}

export function useConsultations() {
  const [consultations, setConsultations] = useState<ClientConsultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Charger toutes les consultations
  const fetchConsultations = async (filters?: ConsultationFilters) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('client_consultations')
        .select('*')
        .order('created_at', { ascending: false })

      // Appliquer les filtres
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (filters?.priority_level && filters.priority_level !== 'all') {
        query = query.eq('priority_level', filters.priority_level)
      }
      if (filters?.organisation_name) {
        query = query.ilike('organisation_name', `%${filters.organisation_name}%`)
      }
      if (filters?.source_channel && filters.source_channel !== 'all') {
        query = query.eq('source_channel', filters.source_channel)
      }
      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end)
      }

      const { data, error } = await query

      if (error) throw error

      setConsultations((data || []) as any)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des consultations'
      setError(message)
      console.error('Erreur fetchConsultations:', err)
    } finally {
      setLoading(false)
    }
  }

  // Créer une nouvelle consultation
  const createConsultation = async (data: CreateConsultationData): Promise<ClientConsultation | null> => {
    try {
      setError(null)

      const { data: newConsultation, error } = await supabase
        .from('client_consultations')
        .insert([{
          ...data,
          priority_level: data.priority_level || 2,
          source_channel: data.source_channel || 'website'
        }])
        .select()
        .single()

      if (error) throw error

      // Ajouter à la liste locale
      setConsultations(prev => [newConsultation, ...prev] as any)

      toast({
        title: "Consultation créée",
        description: `Nouvelle consultation pour ${data.organisation_name}`
      })

      return newConsultation as any
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la consultation'
      setError(message)
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
      return null
    }
  }

  // Mettre à jour une consultation
  const updateConsultation = async (id: string, updates: Partial<ClientConsultation>): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('client_consultations')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Mettre à jour la liste locale
      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === id
            ? { ...consultation, ...updates }
            : consultation
        )
      )

      toast({
        title: "Consultation mise à jour",
        description: "Les modifications ont été enregistrées"
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      setError(message)
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
      return false
    }
  }

  // Assigner une consultation à un utilisateur
  const assignConsultation = async (consultationId: string, userId: string): Promise<boolean> => {
    return updateConsultation(consultationId, {
      assigned_to: userId,
      status: 'en_cours'
    })
  }

  // Changer le statut d'une consultation
  const updateStatus = async (consultationId: string, status: ClientConsultation['status']): Promise<boolean> => {
    const updates: Partial<ClientConsultation> = { status }

    // Si terminée, marquer la date de réponse
    if (status === 'terminee') {
      updates.responded_at = new Date().toISOString()
    }

    return updateConsultation(consultationId, updates)
  }

  // Valider une consultation (utilisée Phase 2 pour pricing)
  const validateConsultation = async (consultationId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('client_consultations')
        .update({
          validated_at: new Date().toISOString(),
          status: 'terminee'
        })
        .eq('id', consultationId)

      if (error) throw error

      // Mettre à jour la liste locale
      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === consultationId
            ? { ...consultation, validated_at: new Date().toISOString(), status: 'terminee' as const }
            : consultation
        )
      )

      toast({
        title: "Consultation validée",
        description: "La consultation a été marquée comme validée"
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la validation'
      setError(message)
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
      return false
    }
  }

  // Archiver une consultation
  const archiveConsultation = async (consultationId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('client_consultations')
        .update({ archived_at: new Date().toISOString() } as any)
        .eq('id', consultationId)

      if (error) throw error

      // Mettre à jour la liste locale
      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === consultationId
            ? { ...consultation, archived_at: new Date().toISOString() }
            : consultation
        )
      )

      toast({
        title: "Consultation archivée",
        description: "La consultation a été archivée"
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'archivage'
      setError(message)
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
      return false
    }
  }

  // Désarchiver une consultation
  const unarchiveConsultation = async (consultationId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('client_consultations')
        .update({ archived_at: null } as any)
        .eq('id', consultationId)

      if (error) throw error

      // Mettre à jour la liste locale
      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === consultationId
            ? { ...consultation, archived_at: undefined }
            : consultation
        )
      )

      toast({
        title: "Consultation désarchivée",
        description: "La consultation a été désarchivée"
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du désarchivage'
      setError(message)
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
      return false
    }
  }

  // Supprimer une consultation (soft delete)
  const deleteConsultation = async (consultationId: string): Promise<boolean> => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette consultation ?')) {
      return false
    }

    try {
      setError(null)

      const { error } = await supabase
        .from('client_consultations')
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', consultationId)

      if (error) throw error

      // Retirer de la liste locale
      setConsultations(prev =>
        prev.filter(consultation => consultation.id !== consultationId)
      )

      toast({
        title: "Consultation supprimée",
        description: "La consultation a été supprimée"
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression'
      setError(message)
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
      return false
    }
  }

  return {
    // État
    consultations,
    loading,
    error,

    // Actions
    fetchConsultations,
    createConsultation,
    updateConsultation,
    assignConsultation,
    updateStatus,
    validateConsultation,
    archiveConsultation,
    unarchiveConsultation,
    deleteConsultation
  }
}

// Hook DÉPRÉCIÉ - utilisez useConsultationItems à la place
// Conservé temporairement pour rétrocompatibilité
export function useConsultationProducts(consultationId?: string) {
  console.warn('useConsultationProducts est déprécié. Utilisez useConsultationItems à la place.')

  // Redirection vers le nouveau hook
  const {
    consultationItems,
    eligibleProducts,
    loading,
    error,
    addItem,
    removeItem,
    updateItem
  } = useConsultationItems(consultationId)

  // Adapter l'interface pour rétrocompatibilité
  const consultationProducts = consultationItems.map(item => ({
    id: item.id,
    consultation_id: item.consultation_id,
    product_id: item.product_id,
    proposed_price: item.unit_price,
    notes: item.notes,
    is_primary_proposal: false, // Plus utilisé
    quantity: item.quantity,
    is_free: item.is_free,
    created_at: item.created_at,
    created_by: item.created_by,
    product: item.product
  }))

  return {
    consultationProducts,
    eligibleProducts,
    loading,
    error,
    fetchConsultationProducts: (id: string) => {}, // Noop - le nouveau hook gère automatiquement
    fetchEligibleProducts: () => {}, // Noop - le nouveau hook gère automatiquement
    assignProduct: async (data: AssignProductData) => {
      return addItem({
        consultation_id: data.consultation_id,
        product_id: data.product_id,
        quantity: data.quantity || 1,
        unit_price: data.proposed_price,
        is_free: data.is_free || false,
        notes: data.notes
      })
    },
    removeProduct: removeItem,
    updateConsultationProduct: async (id: string, updates: Partial<ConsultationProduct>) => {
      return updateItem(id, {
        quantity: updates.quantity,
        unit_price: updates.proposed_price,
        is_free: updates.is_free,
        notes: updates.notes
      })
    }
  }
}

// Nouveau hook simplifié pour le workflow type commande
export function useConsultationItems(consultationId?: string) {
  const [consultationItems, setConsultationItems] = useState<ConsultationItem[]>([])
  const [eligibleProducts, setEligibleProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Charger les items de la consultation
  const fetchConsultationItems = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('consultation_products')
        .select(`
          id,
          consultation_id,
          product_id,
          quantity,
          proposed_price,
          is_free,
          notes,
          created_at,
          created_by,
          product:products(
            id,
            name,
            sku,
            requires_sample,
            cost_price
          )
        `)
        .eq('consultation_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform to ConsultationItem format
      const items = (data || []).map(item => ({
        id: item.id,
        consultation_id: item.consultation_id,
        product_id: item.product_id,
        quantity: item.quantity || 1,
        unit_price: item.proposed_price || item.product?.cost_price,
        is_free: item.is_free || false,
        notes: item.notes ?? undefined,
        created_at: item.created_at,
        created_by: item.created_by,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          requires_sample: item.product.requires_sample,
          supplier_name: undefined, // Temporairement désactivé
          cost_price: item.product.cost_price
        } : undefined
      }))

      setConsultationItems(items as any)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des items'
      setError(message)
      console.error('Erreur fetchConsultationItems:', err)
    } finally {
      setLoading(false)
    }
  }

  // Charger les produits éligibles
  const fetchEligibleProducts = async (targetConsultationId?: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .rpc('get_consultation_eligible_products', {
          target_consultation_id: targetConsultationId || undefined
        })

      if (error) throw error

      setEligibleProducts(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des produits éligibles'
      setError(message)
      console.error('Erreur fetchEligibleProducts:', err)
    } finally {
      setLoading(false)
    }
  }

  // Ajouter un item à la consultation
  const addItem = async (data: CreateConsultationItemData): Promise<boolean> => {
    try {
      setError(null)

      const response = await fetch('/api/consultations/associations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultation_id: data.consultation_id,
          product_id: data.product_id,
          proposed_price: data.unit_price,
          quantity: data.quantity,
          is_free: data.is_free,
          notes: data.notes,
          is_primary_proposal: false // Plus utilisé dans le nouveau workflow
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'ajout de l\'item')
      }

      // Recharger les items
      if (consultationId) {
        await fetchConsultationItems(consultationId)
      }

      toast({
        title: "Item ajouté",
        description: "Le produit a été ajouté à la consultation"
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'item'
      setError(message)
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
      return false
    }
  }

  // Mettre à jour un item
  const updateItem = async (
    itemId: string,
    updates: UpdateConsultationItemData
  ): Promise<boolean> => {
    try {
      setError(null)

      const updateData: any = {}
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity
      if (updates.unit_price !== undefined) updateData.proposed_price = updates.unit_price
      if (updates.is_free !== undefined) updateData.is_free = updates.is_free
      if (updates.notes !== undefined) updateData.notes = updates.notes

      const { error } = await supabase
        .from('consultation_products')
        .update(updateData)
        .eq('id', itemId)

      if (error) throw error

      // Mettre à jour la liste locale
      setConsultationItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                quantity: updates.quantity ?? item.quantity,
                unit_price: updates.unit_price ?? item.unit_price,
                is_free: updates.is_free ?? item.is_free,
                notes: updates.notes ?? item.notes
              }
            : item
        )
      )

      toast({
        title: "Item mis à jour",
        description: "Les modifications ont été enregistrées"
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      setError(message)
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
      return false
    }
  }

  // Supprimer un item
  const removeItem = async (itemId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('consultation_products')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      // Mettre à jour la liste locale
      setConsultationItems(prev =>
        prev.filter(item => item.id !== itemId)
      )

      toast({
        title: "Item supprimé",
        description: "Le produit a été retiré de la consultation"
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression'
      setError(message)
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
      return false
    }
  }

  // Basculer l'état gratuit d'un item
  const toggleFreeItem = async (itemId: string): Promise<boolean> => {
    const item = consultationItems.find(i => i.id === itemId)
    if (!item) return false

    return updateItem(itemId, { is_free: !item.is_free })
  }

  // Calculer le total de la consultation
  const calculateTotal = () => {
    return consultationItems.reduce((total, item) => {
      if (item.is_free) return total
      const price = item.unit_price || 0
      return total + (price * item.quantity)
    }, 0)
  }

  // Calculer le nombre total d'items
  const getTotalItemsCount = () => {
    return consultationItems.reduce((total, item) => total + item.quantity, 0)
  }

  // Charger les items au changement de consultation
  useEffect(() => {
    if (consultationId) {
      fetchConsultationItems(consultationId)
      fetchEligibleProducts(consultationId)
    }
  }, [consultationId])

  return {
    // État
    consultationItems,
    eligibleProducts,
    loading,
    error,

    // Actions
    fetchConsultationItems,
    fetchEligibleProducts,
    addItem,
    updateItem,
    removeItem,
    toggleFreeItem,

    // Utilitaires
    calculateTotal,
    getTotalItemsCount
  }
}