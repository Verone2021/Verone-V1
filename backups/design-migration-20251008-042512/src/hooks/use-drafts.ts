'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Draft {
  id: string
  name?: string
  slug?: string
  description?: string
  selling_points?: string[]
  condition?: string
  availability_type?: string
  video_url?: string
  family_id?: string
  category_id?: string
  subcategory_id?: string
  supplier_id?: string
  supplier_page_url?: string
  supplier_reference?: string
  cost_price?: number
  target_margin_percentage?: number
  margin_percentage?: number
  brand?: string
  variant_attributes?: Record<string, any>
  dimensions?: Record<string, any>
  weight?: number
  gtin?: string
  product_type?: 'standard' | 'custom'
  assigned_client_id?: string
  creation_mode?: 'sourcing' | 'complete'
  requires_sample?: boolean
  stock_quantity?: number
  stock_real?: number
  stock_forecasted_in?: number
  stock_forecasted_out?: number
  min_stock?: number
  reorder_point?: number
  created_at: string
  updated_at: string
}

export function useDrafts() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const getDraftForEdit = useCallback(async (draftId: string): Promise<Draft | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('product_drafts')
        .select('*')
        .eq('id', draftId)
        .single()

      if (error) {
        console.error('❌ Erreur récupération brouillon:', error)
        setError('Impossible de récupérer le brouillon')
        return null
      }

      return data as Draft
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      setError('Erreur inattendue lors de la récupération')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const updateDraft = useCallback(async (draftId: string, data: Partial<Draft>): Promise<Draft | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: updatedDraft, error } = await supabase
        .from('product_drafts')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur mise à jour brouillon:', error)
        setError('Impossible de mettre à jour le brouillon')
        return null
      }

      return updatedDraft as Draft
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      setError('Erreur inattendue lors de la mise à jour')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const createDraft = useCallback(async (data: Partial<Draft>): Promise<Draft | null> => {
    try {
      setIsLoading(true)
      setError(null)

      // Nettoyer et formater les données
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => {
          // Filtrer les valeurs null, undefined, et les strings vides
          if (value === null || value === undefined || value === '') return false
          // Garder les arrays même vides et les objets même vides
          if (Array.isArray(value) || typeof value === 'object') return true
          return true
        })
      )

      // S'assurer que selling_points est bien un array
      if (cleanedData.selling_points && !Array.isArray(cleanedData.selling_points)) {
        cleanedData.selling_points = []
      }

      const { data: newDraft, error } = await supabase
        .from('product_drafts')
        .insert({
          ...cleanedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur création brouillon:', error)
        setError('Impossible de créer le brouillon')
        return null
      }

      return newDraft as Draft
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      setError('Erreur inattendue lors de la création')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const validateDraft = useCallback(async (draftId: string): Promise<{ isValid: boolean; errors: string[] }> => {
    try {
      const draft = await getDraftForEdit(draftId)
      if (!draft) {
        return { isValid: false, errors: ['Brouillon non trouvé'] }
      }

      const errors: string[] = []

      // Validation des champs obligatoires
      if (!draft.name?.trim()) {
        errors.push('Le nom du produit est obligatoire')
      }

      if (!draft.supplier_id) {
        errors.push('Le fournisseur est obligatoire')
      }

      if (!draft.subcategory_id) {
        errors.push('La sous-catégorie est obligatoire')
      }

      if (!draft.cost_price || draft.cost_price <= 0) {
        errors.push('Le prix de coût doit être supérieur à 0')
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    } catch (error) {
      console.error('❌ Erreur validation brouillon:', error)
      return {
        isValid: false,
        errors: ['Erreur lors de la validation']
      }
    }
  }, [getDraftForEdit])

  const deleteDraft = useCallback(async (draftId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase
        .from('product_drafts')
        .delete()
        .eq('id', draftId)

      if (error) {
        console.error('❌ Erreur suppression brouillon:', error)
        setError('Impossible de supprimer le brouillon')
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      setError('Erreur inattendue lors de la suppression')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  return {
    // État
    isLoading,
    error,

    // Actions principales
    getDraftForEdit,
    updateDraft,
    createDraft,
    validateDraft,
    deleteDraft
  }
}