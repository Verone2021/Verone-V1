import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import { ProductDraftData } from '../components/forms/product-creation-wizard'

// Définition des champs obligatoires pour un produit complet
const REQUIRED_FIELDS = [
  'name',
  'sku',
  'supplier_id',
  'subcategory_id',
  'supplier_price',
  'description'
] as const

// Mapping des champs avec leurs libellés pour l'utilisateur
const FIELD_LABELS: Record<string, string> = {
  name: 'Nom du produit',
  sku: 'Référence SKU',
  supplier_id: 'Fournisseur',
  subcategory_id: 'Sous-catégorie',
  supplier_price: 'Prix fournisseur',
  description: 'Description'
}

// Fonction pour calculer la progression réelle basée sur les champs remplis
function calculateRealProgress(draft: ProductDraftData): number {
  const filledFields = REQUIRED_FIELDS.filter(field => {
    const value = draft[field as keyof ProductDraftData]
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    return value !== null && value !== undefined
  })

  return Math.round((filledFields.length / REQUIRED_FIELDS.length) * 100)
}

// Fonction pour identifier les champs manquants
function getMissingFields(draft: ProductDraftData): string[] {
  const missingFields = REQUIRED_FIELDS.filter(field => {
    const value = draft[field as keyof ProductDraftData]
    if (typeof value === 'string') {
      return value.trim().length === 0
    }
    return value === null || value === undefined
  })

  return missingFields.map(field => FIELD_LABELS[field] || field)
}

export interface DraftWithMeta extends ProductDraftData {
  id: string
  created_at: string
  updated_at: string
  created_by: string
  // Métadonnées calculées
  progressPercentage: number
  lastModified: string
  canFinalize: boolean
  missingFields: string[]
  // Image principale de la table normalisée
  primary_image_url?: string
}

interface DraftsState {
  drafts: DraftWithMeta[]
  loading: boolean
  error: string | null
  total: number
}

export function useDrafts() {
  const [state, setState] = useState<DraftsState>({
    drafts: [],
    loading: true,
    error: null,
    total: 0
  })

  const supabase = createClient()

  // Charger tous les brouillons de l'utilisateur connecté
  const loadDrafts = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      const { data, error, count } = await supabase
        .from('product_drafts')
        .select('*', { count: 'exact' })
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Enrichir les données avec des métadonnées calculées
      const enrichedDrafts: DraftWithMeta[] = await Promise.all((data || []).map(async draft => {
        // Récupérer l'image principale depuis la table normalisée product_images
        let primaryImageUrl: string | undefined = undefined

        try {
          const { data: primaryImage } = await supabase
            .from('product_images')
            .select('storage_path')
            .eq('product_id', draft.id)
            .eq('product_type', 'draft')
            .eq('is_primary', true)
            .single()

          if (primaryImage && primaryImage.storage_path) {
            primaryImageUrl = supabase.storage
              .from('product-images')
              .getPublicUrl(primaryImage.storage_path).data.publicUrl
          }
        } catch {
          // Ignore les erreurs de récupération d'image
        }

        return {
          ...draft,
          // Calculer le pourcentage de progression basé sur la complétude réelle des champs
          progressPercentage: calculateRealProgress(draft),

          // Format de date lisible
          lastModified: new Date(draft.updated_at).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),

          // Peut être finalisé si tous les champs obligatoires sont remplis (100%)
          canFinalize: calculateRealProgress(draft) === 100,

          // Liste des champs manquants pour l'utilisateur
          missingFields: getMissingFields(draft),

          // URL de l'image principale depuis la table normalisée
          primary_image_url: primaryImageUrl
        }
      }))

      setState(prev => ({
        ...prev,
        drafts: enrichedDrafts,
        total: count || 0,
        loading: false
      }))

    } catch (error) {
      console.error('Erreur chargement brouillons:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        loading: false
      }))
    }
  }

  // Supprimer un brouillon
  const deleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('product_drafts')
        .delete()
        .eq('id', draftId)

      if (error) throw error

      // Mise à jour optimiste
      setState(prev => ({
        ...prev,
        drafts: prev.drafts.filter(d => d.id !== draftId),
        total: prev.total - 1
      }))

      console.log('✅ Brouillon supprimé avec succès')
      return true

    } catch (error) {
      console.error('❌ Erreur suppression brouillon:', error)
      throw error
    }
  }

  // Dupliquer un brouillon
  const duplicateDraft = async (draftId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Récupérer le brouillon source
      const { data: sourceDraft, error: fetchError } = await supabase
        .from('product_drafts')
        .select('*')
        .eq('id', draftId)
        .single()

      if (fetchError) throw fetchError

      // Créer une copie avec un nouveau nom
      const duplicateData = {
        ...sourceDraft,
        id: undefined, // Laisser Supabase générer un nouvel ID
        name: `${sourceDraft.name} (Copie)`,
        wizard_step_completed: 0, // Remettre à zéro la progression
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: newDraft, error: createError } = await supabase
        .from('product_drafts')
        .insert(duplicateData)
        .select()
        .single()

      if (createError) throw createError

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Brouillon dupliqué avec succès')
      return newDraft

    } catch (error) {
      console.error('❌ Erreur duplication brouillon:', error)
      throw error
    }
  }

  // Charger les données au montage
  useEffect(() => {
    loadDrafts()
  }, [])

  // Statistiques calculées
  const stats = {
    total: state.drafts.length,
    recent: state.drafts.filter(d => {
      const dayAgo = new Date()
      dayAgo.setDate(dayAgo.getDate() - 1)
      return new Date(d.updated_at) > dayAgo
    }).length,
    readyToFinalize: state.drafts.filter(d => d.canFinalize).length,
    inProgress: state.drafts.filter(d => d.wizard_step_completed > 0 && !d.canFinalize).length
  }

  return {
    ...state,
    loadDrafts,
    deleteDraft,
    duplicateDraft,
    stats
  }
}