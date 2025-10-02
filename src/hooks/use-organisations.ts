'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Organisation {
  id: string
  name: string
  type: 'supplier' | 'customer' | 'partner' | 'internal'
  email: string | null
  country: string | null
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null

  // Nouveaux champs de contact
  phone: string | null
  website: string | null
  secondary_email: string | null

  // Adresse complète (DEPRECATED - à garder pour compatibilité)
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  city: string | null
  region: string | null

  // Adresse de facturation (nouvelle structure)
  billing_address_line1: string | null
  billing_address_line2: string | null
  billing_postal_code: string | null
  billing_city: string | null
  billing_region: string | null
  billing_country: string | null

  // Adresse de livraison (si différente de facturation)
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_postal_code: string | null
  shipping_city: string | null
  shipping_region: string | null
  shipping_country: string | null

  // Indicateur si adresses différentes
  has_different_shipping_address: boolean | null

  // Identifiants légaux
  siret: string | null
  vat_number: string | null
  legal_form: string | null

  // Classification business
  industry_sector: string | null
  supplier_segment: string | null
  supplier_category: string | null

  // Informations commerciales
  payment_terms: string | null
  delivery_time_days: number | null
  minimum_order_amount: number | null
  currency: string | null
  prepayment_required: boolean | null

  // Classification client (B2B/B2C)
  customer_type: 'professional' | 'individual' | null

  // Champs spécifiques clients particuliers
  first_name: string | null
  mobile_phone: string | null
  date_of_birth: string | null
  nationality: string | null
  preferred_language: string | null
  communication_preference: 'email' | 'phone' | 'mail' | null
  marketing_consent: boolean | null

  // Performance et qualité
  rating: number | null
  certification_labels: string[] | null
  preferred_supplier: boolean | null
  notes: string | null

  _count?: {
    products: number // Comptage des produits individuels liés au fournisseur
  }
}

export interface OrganisationFilters {
  type?: 'supplier' | 'customer' | 'partner' | 'internal'
  customer_type?: 'professional' | 'individual' | 'all'
  is_active?: boolean
  search?: string
  country?: string
  include_archived?: boolean
}

export interface CreateOrganisationData {
  name: string
  type: 'supplier' | 'customer' | 'partner' | 'internal'
  email?: string
  country?: string
  is_active?: boolean

  // Nouveaux champs optionnels
  phone?: string
  website?: string
  secondary_email?: string

  // Adresse (DEPRECATED - garder pour compatibilité)
  address_line1?: string
  address_line2?: string
  postal_code?: string
  city?: string
  region?: string

  // Adresse de facturation
  billing_address_line1?: string
  billing_address_line2?: string
  billing_postal_code?: string
  billing_city?: string
  billing_region?: string
  billing_country?: string

  // Adresse de livraison
  shipping_address_line1?: string
  shipping_address_line2?: string
  shipping_postal_code?: string
  shipping_city?: string
  shipping_region?: string
  shipping_country?: string

  // Indicateur
  has_different_shipping_address?: boolean

  // Identifiants légaux
  siret?: string
  vat_number?: string
  legal_form?: string

  // Classification
  industry_sector?: string
  supplier_segment?: string
  supplier_category?: string

  // Commercial
  payment_terms?: string
  delivery_time_days?: number
  minimum_order_amount?: number
  currency?: string
  prepayment_required?: boolean

  // Classification client (B2B/B2C)
  customer_type?: 'professional' | 'individual'

  // Champs spécifiques clients particuliers
  first_name?: string
  mobile_phone?: string
  date_of_birth?: string
  nationality?: string
  preferred_language?: string
  communication_preference?: 'email' | 'phone' | 'mail'
  marketing_consent?: boolean

  // Performance
  rating?: number
  certification_labels?: string[]
  preferred_supplier?: boolean
  notes?: string
}

export interface UpdateOrganisationData extends Partial<CreateOrganisationData> {
  id: string
}

export function useOrganisations(filters?: OrganisationFilters) {
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fonction pour récupérer une organisation par ID avec ses adresses
  const getOrganisationById = async (id: string): Promise<Organisation | null> => {
    if (!id) return null

    try {
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'organisation:', error)
      return null
    }
  }

  const fetchOrganisations = async () => {
    setLoading(true)
    setError(null)

    try {
      // Requête simplifiée avec tous les champs disponibles
      let query = supabase
        .from('organisations')
        .select('*')
        .order('name', { ascending: true })

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      if (filters?.country) {
        query = query.eq('country', filters.country)
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      // Filtre customer_type pour les clients uniquement
      if (filters?.type === 'customer' && filters?.customer_type && filters.customer_type !== 'all') {
        if (filters.customer_type === 'professional') {
          // Professionnel = customer_type IS NULL OR customer_type = 'professional'
          query = query.or('customer_type.is.null,customer_type.eq.professional')
        } else if (filters.customer_type === 'individual') {
          // Particulier = customer_type = 'individual' uniquement
          query = query.eq('customer_type', 'individual')
        }
      }

      // Exclude archived by default unless explicitly requested
      if (!filters?.include_archived) {
        query = query.is('archived_at', null)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      // Add product counts for suppliers
      const organisationsWithCounts = await Promise.all(
        (data || []).map(async (org) => {
          if (org.type === 'supplier') {
            // Compter les produits individuels directement par supplier_id
            const { count: productsCount } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('supplier_id', org.id)

            return {
              ...org,
              _count: {
                products: productsCount || 0
              }
            }
          }
          return org
        })
      )

      setOrganisations(organisationsWithCounts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganisations()
  }, [filters?.type, filters?.is_active, filters?.search, filters?.country, filters?.include_archived])

  const createOrganisation = async (data: CreateOrganisationData): Promise<Organisation | null> => {
    try {
      // Générer slug automatiquement depuis le nom
      const slug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Retirer accents
        .replace(/[^a-z0-9]+/g, '-')     // Remplacer non-alphanumériques par -
        .replace(/^-+|-+$/g, '')         // Retirer - en début/fin
        .substring(0, 100)               // Limiter à 100 caractères

      const { data: newOrg, error } = await supabase
        .from('organisations')
        .insert([{
          // ✅ Colonnes de base (REQUIRED)
          name: data.name,
          slug: slug, // ✅ AJOUTÉ - Requis en BD
          type: data.type,
          email: data.email || null,
          country: data.country || 'FR',
          is_active: data.is_active ?? true,

          // ✅ Adresses de facturation (existantes en BD)
          billing_address_line1: data.billing_address_line1 || null,
          billing_address_line2: data.billing_address_line2 || null,
          billing_postal_code: data.billing_postal_code || null,
          billing_city: data.billing_city || null,
          billing_region: data.billing_region || null,
          billing_country: data.billing_country || 'FR',

          // ✅ Adresses de livraison (existantes en BD)
          shipping_address_line1: data.shipping_address_line1 || null,
          shipping_address_line2: data.shipping_address_line2 || null,
          shipping_postal_code: data.shipping_postal_code || null,
          shipping_city: data.shipping_city || null,
          shipping_region: data.shipping_region || null,
          shipping_country: data.shipping_country || 'FR',
          has_different_shipping_address: data.has_different_shipping_address ?? false,

          // ✅ Classification client (existantes en BD)
          customer_type: data.customer_type || null,
          prepayment_required: data.prepayment_required ?? false,

          // ✅ Champs clients particuliers (existants en BD)
          first_name: data.first_name || null,
          mobile_phone: data.mobile_phone || null,
          date_of_birth: data.date_of_birth || null,
          nationality: data.nationality || null,
          preferred_language: data.preferred_language || null,
          communication_preference: data.communication_preference || null,
          marketing_consent: data.marketing_consent ?? false,

          // ❌ RETIRÉES - Colonnes inexistantes en BD :
          // phone, website, secondary_email,
          // address_line1, address_line2, postal_code, city, region,
          // siret, vat_number, legal_form,
          // industry_sector, supplier_segment, supplier_category,
          // payment_terms, delivery_time_days, minimum_order_amount, currency,
          // rating, certification_labels, preferred_supplier, notes
        }])
        .select()
        .single()

      if (error) {
        setError(error.message)
        return null
      }

      await fetchOrganisations()
      return newOrg
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      return null
    }
  }

  const updateOrganisation = async (data: UpdateOrganisationData): Promise<Organisation | null> => {
    try {
      // Filtrer uniquement les colonnes valides existantes en BD
      const validData: any = {}

      // Colonnes de base autorisées
      const allowedFields = [
        'name', 'type', 'email', 'country', 'is_active',
        'billing_address_line1', 'billing_address_line2', 'billing_postal_code',
        'billing_city', 'billing_region', 'billing_country',
        'shipping_address_line1', 'shipping_address_line2', 'shipping_postal_code',
        'shipping_city', 'shipping_region', 'shipping_country',
        'has_different_shipping_address',
        'customer_type', 'prepayment_required',
        'first_name', 'mobile_phone', 'date_of_birth',
        'nationality', 'preferred_language', 'communication_preference', 'marketing_consent'
      ]

      // Copier uniquement les champs autorisés
      allowedFields.forEach(field => {
        if (field in data) {
          validData[field] = data[field as keyof UpdateOrganisationData]
        }
      })

      const { data: updatedOrg, error } = await supabase
        .from('organisations')
        .update(validData)
        .eq('id', data.id)
        .select()
        .single()

      if (error) {
        setError(error.message)
        return null
      }

      await fetchOrganisations()
      return updatedOrg
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      return null
    }
  }

  const deleteOrganisation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organisations')
        .delete()
        .eq('id', id)

      if (error) {
        setError(error.message)
        return false
      }

      await fetchOrganisations()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
      return false
    }
  }

  const toggleOrganisationStatus = async (id: string): Promise<boolean> => {
    try {
      const org = organisations.find(o => o.id === id)
      if (!org) return false

      const { error } = await supabase
        .from('organisations')
        .update({ is_active: !org.is_active })
        .eq('id', id)

      if (error) {
        setError(error.message)
        return false
      }

      await fetchOrganisations()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de statut')
      return false
    }
  }

  const archiveOrganisation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organisations')
        .update({
          archived_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', id)
        .is('archived_at', null) // Only archive if not already archived

      if (error) {
        setError(error.message)
        return false
      }

      await fetchOrganisations()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'archivage')
      return false
    }
  }

  const unarchiveOrganisation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organisations')
        .update({
          archived_at: null,
          is_active: true
        })
        .eq('id', id)
        .not('archived_at', 'is', null) // Only unarchive if currently archived

      if (error) {
        setError(error.message)
        return false
      }

      await fetchOrganisations()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la restauration')
      return false
    }
  }

  const hardDeleteOrganisation = async (id: string): Promise<boolean> => {
    try {
      // Allow direct deletion regardless of archive status
      const { error } = await supabase
        .from('organisations')
        .delete()
        .eq('id', id)

      if (error) {
        setError(error.message)
        return false
      }

      await fetchOrganisations()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression définitive')
      return false
    }
  }

  return {
    organisations,
    loading,
    error,
    refetch: fetchOrganisations,
    createOrganisation,
    updateOrganisation,
    deleteOrganisation,
    toggleOrganisationStatus,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    getOrganisationById,
  }
}

export function useSuppliers(filters?: Omit<OrganisationFilters, 'type'>) {
  return useOrganisations({ ...filters, type: 'supplier' })
}

export function useOrganisation(id: string) {
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchOrganisation = async () => {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('organisations')
          .select(`
            id,
            name,
            type,
            email,
            country,
            is_active,
            archived_at,
            created_at,
            updated_at,
            created_by,
            phone,
            website,
            secondary_email,
            address_line1,
            address_line2,
            postal_code,
            city,
            region,
            billing_address_line1,
            billing_address_line2,
            billing_postal_code,
            billing_city,
            billing_region,
            billing_country,
            shipping_address_line1,
            shipping_address_line2,
            shipping_postal_code,
            shipping_city,
            shipping_region,
            shipping_country,
            has_different_shipping_address,
            siret,
            vat_number,
            legal_form,
            industry_sector,
            supplier_segment,
            supplier_category,
            payment_terms,
            delivery_time_days,
            minimum_order_amount,
            currency,
            prepayment_required,
            customer_type,
            rating,
            certification_labels,
            preferred_supplier,
            notes
          `)
          .eq('id', id)
          .single()

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        // Add product counts if supplier
        if (data.type === 'supplier') {
          // Compter les produits individuels directement par supplier_id
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('supplier_id', data.id)

          data._count = {
            products: productsCount || 0
          }
        }

        setOrganisation(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganisation()
  }, [id])

  return { organisation, loading, error }
}

