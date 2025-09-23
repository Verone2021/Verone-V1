'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import { useToast } from './use-toast'

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
}

export interface ConsultationProduct {
  id: string
  consultation_id: string
  product_id: string
  proposed_price?: number
  notes?: string
  is_primary_proposal: boolean
  created_at: string
  created_by?: string
  // Relations
  product?: {
    id: string
    name: string
    sku: string
    status: string
    requires_sample: boolean
    supplier_name?: string
  }
}

export interface CreateConsultationData {
  organisation_name: string
  client_email: string
  client_phone?: string
  descriptif: string
  image_url?: string
  tarif_maximum?: number
  priority_level?: number
  source_channel?: 'website' | 'email' | 'phone' | 'other'
  estimated_response_date?: string
}

export interface AssignProductData {
  consultation_id: string
  product_id: string
  proposed_price?: number
  notes?: string
  is_primary_proposal?: boolean
}

export interface ConsultationFilters {
  status?: string
  assigned_to?: string
  priority_level?: number
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

      setConsultations(data || [])
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
      setConsultations(prev => [newConsultation, ...prev])

      toast({
        title: "Consultation créée",
        description: `Nouvelle consultation pour ${data.organisation_name}`
      })

      return newConsultation
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
    updateStatus
  }
}

// Hook pour gérer les produits associés aux consultations
export function useConsultationProducts(consultationId?: string) {
  const [consultationProducts, setConsultationProducts] = useState<ConsultationProduct[]>([])
  const [eligibleProducts, setEligibleProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Charger les produits de la consultation
  const fetchConsultationProducts = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('consultation_products')
        .select(`
          *,
          product:products(
            id,
            name,
            sku,
            status,
            requires_sample,
            supplier:organisations(name)
          )
        `)
        .eq('consultation_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setConsultationProducts(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des produits'
      setError(message)
      console.error('Erreur fetchConsultationProducts:', err)
    } finally {
      setLoading(false)
    }
  }

  // Charger les produits éligibles (sourcing uniquement)
  const fetchEligibleProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .rpc('get_consultation_eligible_products')

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

  // Assigner un produit à une consultation
  const assignProduct = async (data: AssignProductData): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('consultation_products')
        .insert([data])

      if (error) throw error

      // Recharger les produits de la consultation
      if (consultationId) {
        await fetchConsultationProducts(consultationId)
      }

      toast({
        title: "Produit assigné",
        description: "Le produit a été ajouté à la consultation"
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'assignation du produit'
      setError(message)
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      })
      return false
    }
  }

  // Retirer un produit d'une consultation
  const removeProduct = async (consultationProductId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('consultation_products')
        .delete()
        .eq('id', consultationProductId)

      if (error) throw error

      // Mettre à jour la liste locale
      setConsultationProducts(prev =>
        prev.filter(cp => cp.id !== consultationProductId)
      )

      toast({
        title: "Produit retiré",
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

  // Mettre à jour les détails d'un produit dans la consultation
  const updateConsultationProduct = async (
    consultationProductId: string,
    updates: Partial<ConsultationProduct>
  ): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('consultation_products')
        .update(updates)
        .eq('id', consultationProductId)

      if (error) throw error

      // Mettre à jour la liste locale
      setConsultationProducts(prev =>
        prev.map(cp =>
          cp.id === consultationProductId
            ? { ...cp, ...updates }
            : cp
        )
      )

      toast({
        title: "Produit mis à jour",
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

  // Charger les produits au changement de consultation
  useEffect(() => {
    if (consultationId) {
      fetchConsultationProducts(consultationId)
    }
  }, [consultationId])

  return {
    // État
    consultationProducts,
    eligibleProducts,
    loading,
    error,

    // Actions
    fetchConsultationProducts,
    fetchEligibleProducts,
    assignProduct,
    removeProduct,
    updateConsultationProduct
  }
}