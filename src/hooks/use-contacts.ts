/**
 * Hook pour la gestion des contacts d'organisations
 * Spécialement pour fournisseurs et clients professionnels
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Types pour les contacts
export interface Contact {
  id: string
  organisation_id: string

  // Informations personnelles
  first_name: string
  last_name: string
  title?: string
  department?: string

  // Contact principal
  email: string
  phone?: string
  mobile?: string

  // Contact secondaire
  secondary_email?: string
  direct_line?: string

  // Préférences communication
  is_primary_contact: boolean
  is_billing_contact: boolean
  is_technical_contact: boolean
  is_commercial_contact: boolean

  // Communication preferences
  preferred_communication_method: 'email' | 'phone' | 'both'
  accepts_marketing: boolean
  accepts_notifications: boolean
  language_preference: string

  // Métadonnées
  notes?: string
  is_active: boolean
  last_contact_date?: string

  // Audit
  created_by?: string
  created_at: string
  updated_at: string

  // Relations jointes
  organisation?: {
    id: string
    name: string
    type: string
    customer_type?: string
  }
}

export interface CreateContactData {
  organisation_id: string
  first_name: string
  last_name: string
  title?: string
  department?: string
  email: string
  phone?: string
  mobile?: string
  secondary_email?: string
  direct_line?: string
  is_primary_contact?: boolean
  is_billing_contact?: boolean
  is_technical_contact?: boolean
  is_commercial_contact?: boolean
  preferred_communication_method?: 'email' | 'phone' | 'both'
  accepts_marketing?: boolean
  accepts_notifications?: boolean
  language_preference?: string
  notes?: string
}

export interface UpdateContactData {
  first_name?: string
  last_name?: string
  title?: string
  department?: string
  email?: string
  phone?: string
  mobile?: string
  secondary_email?: string
  direct_line?: string
  is_primary_contact?: boolean
  is_billing_contact?: boolean
  is_technical_contact?: boolean
  is_commercial_contact?: boolean
  preferred_communication_method?: 'email' | 'phone' | 'both'
  accepts_marketing?: boolean
  accepts_notifications?: boolean
  language_preference?: string
  notes?: string
  is_active?: boolean
}

interface ContactFilters {
  organisation_id?: string
  is_primary_contact?: boolean
  is_billing_contact?: boolean
  is_technical_contact?: boolean
  is_commercial_contact?: boolean
  is_active?: boolean
  search?: string
}

export function useContacts() {
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [currentContact, setCurrentContact] = useState<Contact | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Récupérer tous les contacts avec filtres
  const fetchContacts = useCallback(async (filters?: ContactFilters) => {
    setLoading(true)
    try {
      let query = supabase
        .from('contacts')
        .select(`
          *,
          organisation:organisations (
            id,
            name,
            type,
            customer_type
          )
        `)
        .order('organisation_id', { ascending: true })
        .order('is_primary_contact', { ascending: false })
        .order('last_name', { ascending: true })

      // Appliquer les filtres
      if (filters?.organisation_id) {
        query = query.eq('organisation_id', filters.organisation_id)
      }
      if (filters?.is_primary_contact !== undefined) {
        query = query.eq('is_primary_contact', filters.is_primary_contact)
      }
      if (filters?.is_billing_contact !== undefined) {
        query = query.eq('is_billing_contact', filters.is_billing_contact)
      }
      if (filters?.is_technical_contact !== undefined) {
        query = query.eq('is_technical_contact', filters.is_technical_contact)
      }
      if (filters?.is_commercial_contact !== undefined) {
        query = query.eq('is_commercial_contact', filters.is_commercial_contact)
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setContacts(data || [])
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les contacts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  // Récupérer un contact spécifique
  const fetchContact = useCallback(async (contactId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          organisation:organisations (
            id,
            name,
            type,
            customer_type
          )
        `)
        .eq('id', contactId)
        .single()

      if (error) throw error

      setCurrentContact(data)
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération du contact:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer le contact",
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  // Récupérer les contacts d'une organisation
  const fetchOrganisationContacts = useCallback(async (organisationId: string) => {
    return fetchContacts({ organisation_id: organisationId, is_active: true })
  }, [fetchContacts])

  // Récupérer le contact principal d'une organisation
  const fetchPrimaryContact = useCallback(async (organisationId: string) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          organisation:organisations (
            id,
            name,
            type,
            customer_type
          )
        `)
        .eq('organisation_id', organisationId)
        .eq('is_primary_contact', true)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = pas de résultat

      return data || null
    } catch (error) {
      console.error('Erreur lors de la récupération du contact principal:', error)
      return null
    }
  }, [supabase])

  // Créer un nouveau contact
  const createContact = useCallback(async (data: CreateContactData) => {
    setLoading(true)
    try {
      const user = await supabase.auth.getUser()

      // Nettoyer les champs vides en les convertissant en null pour respecter les contraintes DB
      const cleanData = {
        ...data,
        phone: data.phone && data.phone.trim() ? data.phone.trim() : null,
        mobile: data.mobile && data.mobile.trim() ? data.mobile.trim() : null,
        secondary_email: data.secondary_email && data.secondary_email.trim() ? data.secondary_email.trim() : null,
        direct_line: data.direct_line && data.direct_line.trim() ? data.direct_line.trim() : null,
        title: data.title && data.title.trim() ? data.title.trim() : null,
        department: data.department && data.department.trim() ? data.department.trim() : null,
        notes: data.notes && data.notes.trim() ? data.notes.trim() : null,
      }

      const insertData = {
        ...cleanData,
        created_by: user.data.user?.id
      }

      console.log('📤 Création contact - Données envoyées:', {
        insertData,
        userId: user.data.user?.id,
        organisationId: data.organisation_id
      })

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert(insertData)
        .select(`
          *,
          organisation:organisations (
            id,
            name,
            type,
            customer_type
          )
        `)
        .single()

      console.log('📥 Réponse Supabase:', { contact, error })

      if (error) {
        console.error('🚨 Erreur Supabase détaillée:', JSON.stringify(error, null, 2))
        throw error
      }

      toast({
        title: "Succès",
        description: `Contact ${data.first_name} ${data.last_name} créé avec succès`
      })

      await fetchContacts()
      return contact
    } catch (error: any) {
      console.error('❌ ERREUR CRÉATION CONTACT:')
      console.error('Error object:', error)
      console.error('Error string:', String(error))
      console.error('Error message:', error?.message)
      console.error('Error details:', error?.details)
      console.error('Error hint:', error?.hint)
      console.error('Error code:', error?.code)
      console.error('Data sent:', data)

      try {
        console.error('Error JSON:', JSON.stringify(error, null, 2))
      } catch (e) {
        console.error('Cannot stringify error:', e)
      }
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le contact",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchContacts])

  // Mettre à jour un contact
  const updateContact = useCallback(async (contactId: string, data: UpdateContactData) => {
    setLoading(true)
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', contactId)
        .select(`
          *,
          organisation:organisations (
            id,
            name,
            type,
            customer_type
          )
        `)
        .single()

      if (error) throw error

      toast({
        title: "Succès",
        description: "Contact mis à jour avec succès"
      })

      await fetchContacts()
      if (currentContact?.id === contactId) {
        setCurrentContact(contact)
      }
      return contact
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le contact",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchContacts, currentContact])

  // Désactiver un contact (soft delete)
  const deactivateContact = useCallback(async (contactId: string) => {
    return updateContact(contactId, { is_active: false })
  }, [updateContact])

  // Réactiver un contact
  const activateContact = useCallback(async (contactId: string) => {
    return updateContact(contactId, { is_active: true })
  }, [updateContact])

  // Définir comme contact principal
  const setPrimaryContact = useCallback(async (contactId: string) => {
    return updateContact(contactId, { is_primary_contact: true })
  }, [updateContact])

  // Mettre à jour la date de dernier contact
  const updateLastContactDate = useCallback(async (contactId: string) => {
    return updateContact(contactId, { last_contact_date: new Date().toISOString() })
  }, [updateContact])

  // Supprimer définitivement un contact (à utiliser avec précaution)
  const deleteContact = useCallback(async (contactId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Contact supprimé définitivement"
      })

      await fetchContacts()
      if (currentContact?.id === contactId) {
        setCurrentContact(null)
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le contact",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchContacts, currentContact])

  // Utilitaires
  const getContactFullName = useCallback((contact: Contact) => {
    return `${contact.first_name} ${contact.last_name}`
  }, [])

  const getContactDisplayEmail = useCallback((contact: Contact) => {
    return `${contact.first_name} ${contact.last_name} <${contact.email}>`
  }, [])

  const getContactRoles = useCallback((contact: Contact) => {
    const roles = []
    if (contact.is_primary_contact) roles.push('Principal')
    if (contact.is_commercial_contact) roles.push('Commercial')
    if (contact.is_billing_contact) roles.push('Facturation')
    if (contact.is_technical_contact) roles.push('Technique')
    return roles.join(', ') || 'Aucun rôle'
  }, [])

  return {
    // État
    loading,
    contacts,
    currentContact,

    // Actions principales
    fetchContacts,
    fetchContact,
    fetchOrganisationContacts,
    fetchPrimaryContact,
    createContact,
    updateContact,
    deactivateContact,
    activateContact,
    setPrimaryContact,
    updateLastContactDate,
    deleteContact,

    // Utilitaires
    getContactFullName,
    getContactDisplayEmail,
    getContactRoles,
    setCurrentContact
  }
}