'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Types des sections éditables
export type EditableSection =
  // Sections produits
  | 'general' | 'pricing' | 'supplier' | 'relations' | 'identifiers' | 'stock'
  // Sections organisations/contacts
  | 'contact' | 'address' | 'legal' | 'commercial' | 'performance' | 'personal' | 'roles' | 'preferences'

// Interface pour les options du hook
export interface UseInlineEditOptions {
  productId?: string // Pour les produits
  organisationId?: string // Pour les organisations/fournisseurs
  contactId?: string // Pour les contacts
  onUpdate: (updatedData: any) => void
  onError?: (error: string) => void
}

// État d'édition par section
interface SectionEditState {
  isEditing: boolean
  editedData: any
  isSaving: boolean
  error: string | null
  hasChanges: boolean
}

/**
 * Hook principal pour l'édition inline par sections
 * Compatible avec l'interface attendue par les composants EditSection
 */
export function useInlineEdit(options: UseInlineEditOptions) {
  const { productId, organisationId, contactId, onUpdate, onError } = options
  const [sections, setSections] = useState<Record<EditableSection, SectionEditState>>({} as any)
  const supabase = createClient()

  // Getters par section
  const isEditing = useCallback((section: EditableSection) => {
    return sections[section]?.isEditing ?? false
  }, [sections])

  const isSaving = useCallback((section: EditableSection) => {
    return sections[section]?.isSaving ?? false
  }, [sections])

  const getError = useCallback((section: EditableSection) => {
    return sections[section]?.error ?? null
  }, [sections])

  const getEditedData = useCallback((section: EditableSection) => {
    return sections[section]?.editedData ?? null
  }, [sections])

  const hasChanges = useCallback((section: EditableSection) => {
    return sections[section]?.hasChanges ?? false
  }, [sections])

  // Actions par section
  const startEdit = useCallback((section: EditableSection, initialData: any) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        isEditing: true,
        editedData: { ...initialData },
        isSaving: false,
        error: null,
        hasChanges: false
      }
    }))
  }, [])

  const cancelEdit = useCallback((section: EditableSection) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        isEditing: false,
        editedData: null,
        isSaving: false,
        error: null,
        hasChanges: false
      }
    }))
  }, [])

  const updateEditedData = useCallback((section: EditableSection, updates: any) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        editedData: { ...prev[section]?.editedData, ...updates },
        hasChanges: true
      }
    }))
  }, [])

  const saveChanges = useCallback(async (section: EditableSection): Promise<boolean> => {
    const sectionState = sections[section]
    if (!sectionState?.editedData || !sectionState.hasChanges) return false

    setSections(prev => ({
      ...prev,
      [section]: { ...prev[section], isSaving: true, error: null }
    }))

    try {
      let success = false

      if (productId) {
        // Mise à jour produit
        const { error } = await supabase
          .from('products')
          .update(sectionState.editedData)
          .eq('id', productId)

        success = !error
        if (error) throw error
      } else if (organisationId) {
        // Mise à jour organisation/fournisseur
        console.log('🔄 Updating organisation with data:', sectionState.editedData)

        const { error, data } = await supabase
          .from('organisations')
          .update(sectionState.editedData)
          .eq('id', organisationId)
          .select()

        success = !error
        if (error) {
          console.error('❌ Supabase update error:', error)
          throw error
        } else {
          console.log('✅ Update successful:', data)
        }
      } else if (contactId) {
        // Mise à jour contact
        console.log('🔄 Updating contact with data:', sectionState.editedData)

        // Nettoyer les données avant la mise à jour
        const cleanedData = { ...sectionState.editedData }

        // Convertir les chaînes vides en null pour les champs optionnels
        Object.keys(cleanedData).forEach(key => {
          if (cleanedData[key] === '') {
            cleanedData[key] = null
          }
        })

        console.log('🧹 Cleaned data for contact update:', cleanedData)

        const { error, data } = await supabase
          .from('contacts')
          .update(cleanedData)
          .eq('id', contactId)
          .select()

        success = !error
        if (error) {
          console.error('❌ Supabase contact update error:', error)
          console.error('❌ Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw new Error(error.message || error.details || 'Erreur de mise à jour contact')
        } else {
          console.log('✅ Contact update successful:', data)
        }
      }

      if (success) {
        onUpdate(sectionState.editedData)
        setSections(prev => ({
          ...prev,
          [section]: {
            isEditing: false,
            editedData: null,
            isSaving: false,
            error: null,
            hasChanges: false
          }
        }))
      }

      return success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setSections(prev => ({
        ...prev,
        [section]: { ...prev[section], isSaving: false, error: errorMessage }
      }))

      if (onError) {
        onError(errorMessage)
      }

      return false
    }
  }, [sections, productId, organisationId, contactId, onUpdate, onError, supabase])

  return {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    hasChanges,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges
  }
}