/**
 * Hook: useLinkMeEnseigneCustomers
 * Gestion des clients (organisations + particuliers) rattachés à une enseigne
 * Pour création de commandes LinkMe depuis le CMS
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { Database } from '@verone/types';

// Types Supabase
type Organisation = Database['public']['Tables']['organisations']['Row'];
type IndividualCustomer =
  Database['public']['Tables']['individual_customers']['Row'];
const supabase = createClient();

// ============================================
// TYPES
// ============================================

export interface EnseigneOrganisationCustomer {
  id: string;
  name: string; // trade_name || legal_name
  legal_name: string;
  trade_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  is_active: boolean;
  created_at: string | null;
  source_type: 'internal' | 'linkme' | 'site-internet' | 'manual' | null;
  source_affiliate_id: string | null;
}

export interface EnseigneIndividualCustomer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string; // Calculé: first_name + last_name
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  created_at: string | null;
  source_type: 'internal' | 'linkme' | 'site-internet' | 'manual' | null;
  source_affiliate_id: string | null;
}

export interface CreateOrganisationInput {
  enseigne_id: string;
  legal_name: string;
  trade_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string;
  source_type?: 'internal' | 'linkme' | 'site-internet' | 'manual';
  source_affiliate_id?: string | null;
}

export interface CreateIndividualCustomerInput {
  /** ID de l'enseigne (optionnel pour org_independante) */
  enseigne_id?: string | null;
  /** ID de l'organisation (pour org_independante sans enseigne) */
  organisation_id?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string;
  source_type?: 'internal' | 'linkme' | 'site-internet' | 'manual';
  source_affiliate_id?: string | null;
}

// ============================================
// FETCH FUNCTIONS
// ============================================

/**
 * Récupère les organisations (clients) d'une enseigne
 */
async function fetchEnseigneOrganisations(
  enseigneId: string
): Promise<EnseigneOrganisationCustomer[]> {
  const { data, error } = await supabase
    .from('organisations')
    .select(
      'id, legal_name, trade_name, email, phone, address_line1, city, postal_code, is_active, created_at, source_type, source_affiliate_id'
    )
    .eq('enseigne_id', enseigneId)
    .eq('type', 'customer') // Uniquement les clients, pas les fournisseurs
    .order('legal_name');

  if (error) {
    console.error('Erreur fetch organisations enseigne:', error);
    throw error;
  }

  return (data ?? []).map(org => ({
    id: org.id,
    name: org.trade_name || org.legal_name,
    legal_name: org.legal_name,
    trade_name: org.trade_name,
    email: org.email,
    phone: org.phone,
    address_line1: org.address_line1,
    city: org.city,
    postal_code: org.postal_code,
    is_active: org.is_active ?? true,
    created_at: org.created_at,
    source_type: org.source_type,
    source_affiliate_id: org.source_affiliate_id,
  }));
}

/**
 * Récupère les clients particuliers d'une enseigne
 */
async function fetchEnseigneIndividualCustomers(
  enseigneId: string
): Promise<EnseigneIndividualCustomer[]> {
  const { data, error } = await supabase
    .from('individual_customers')
    .select(
      'id, first_name, last_name, email, phone, address_line1, city, postal_code, created_at, source_type, source_affiliate_id'
    )
    .eq('enseigne_id', enseigneId)
    .order('last_name');

  if (error) {
    console.error('Erreur fetch individual customers enseigne:', error);
    throw error;
  }

  return (data || []).map(customer => ({
    id: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    full_name: `${customer.first_name} ${customer.last_name}`.trim(),
    email: customer.email,
    phone: customer.phone,
    address_line1: customer.address_line1,
    city: customer.city,
    postal_code: customer.postal_code,
    created_at: customer.created_at,
    source_type: customer.source_type,
    source_affiliate_id: customer.source_affiliate_id,
  }));
}

/**
 * Récupère les clients particuliers d'une organisation indépendante
 * Cherche par organisation_id OU source_affiliate_id
 */
async function fetchOrganisationIndividualCustomers(
  organisationId: string,
  affiliateId?: string
): Promise<EnseigneIndividualCustomer[]> {
  // Requête avec OR pour trouver clients par organisation_id OU source_affiliate_id
  let query = supabase
    .from('individual_customers')
    .select(
      'id, first_name, last_name, email, phone, address_line1, city, postal_code, created_at, source_type, source_affiliate_id'
    );

  // Construire le filtre OR
  if (affiliateId) {
    query = query.or(
      `organisation_id.eq.${organisationId},source_affiliate_id.eq.${affiliateId}`
    );
  } else {
    query = query.eq('organisation_id', organisationId);
  }

  const { data, error } = await query.order('last_name');

  if (error) {
    console.error('Erreur fetch individual customers organisation:', error);
    throw error;
  }

  return (data || []).map(customer => ({
    id: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    full_name: `${customer.first_name} ${customer.last_name}`.trim(),
    email: customer.email,
    phone: customer.phone,
    address_line1: customer.address_line1,
    city: customer.city,
    postal_code: customer.postal_code,
    created_at: customer.created_at,
    source_type: customer.source_type,
    source_affiliate_id: customer.source_affiliate_id,
  }));
}

// ============================================
// HOOKS REACT-QUERY
// ============================================

/**
 * Hook: récupère les organisations (clients) d'une enseigne
 */
export function useLinkMeEnseigneOrganisations(enseigneId: string | null) {
  return useQuery({
    queryKey: ['linkme-enseigne-organisations', enseigneId],
    queryFn: () => fetchEnseigneOrganisations(enseigneId!),
    enabled: !!enseigneId,
    staleTime: 30000,
  });
}

/**
 * Hook: récupère les clients particuliers d'une enseigne
 */
export function useLinkMeEnseigneIndividualCustomers(
  enseigneId: string | null
) {
  return useQuery({
    queryKey: ['linkme-enseigne-individual-customers', enseigneId],
    queryFn: () => fetchEnseigneIndividualCustomers(enseigneId!),
    enabled: !!enseigneId,
    staleTime: 30000,
  });
}

/**
 * Hook: récupère tous les clients (orgs + particuliers) d'une enseigne
 * Retourne un objet unifié { organisations, individuals }
 */
export function useLinkMeEnseigneCustomers(enseigneId: string | null) {
  const orgsQuery = useLinkMeEnseigneOrganisations(enseigneId);
  const individualsQuery = useLinkMeEnseigneIndividualCustomers(enseigneId);

  return {
    organisations: orgsQuery.data || [],
    individuals: individualsQuery.data || [],
    isLoading: orgsQuery.isLoading || individualsQuery.isLoading,
    isError: orgsQuery.isError || individualsQuery.isError,
    error: orgsQuery.error || individualsQuery.error,
    refetch: () => {
      void Promise.all([orgsQuery.refetch(), individualsQuery.refetch()]).catch(
        error => {
          console.error('[LinkMeEnseigneCustomers] Refetch failed:', error);
        }
      );
    },
  };
}

/**
 * Hook: récupère les clients particuliers d'une organisation indépendante
 */
export function useLinkMeOrganisationIndividualCustomers(
  organisationId: string | null,
  affiliateId?: string | null
) {
  return useQuery({
    queryKey: [
      'linkme-organisation-individual-customers',
      organisationId,
      affiliateId,
    ],
    queryFn: () =>
      fetchOrganisationIndividualCustomers(
        organisationId!,
        affiliateId ?? undefined
      ),
    enabled: !!organisationId,
    staleTime: 30000,
  });
}

// ============================================
// TYPE AFFILIATE POUR HOOK UNIFIÉ
// ============================================

export interface LinkMeAffiliateInfo {
  id: string;
  enseigne_id: string | null;
  organisation_id: string | null;
  affiliate_type: string;
}

/**
 * Hook unifié: récupère les clients selon le type d'affilié
 * - Pour enseignes: organisations liées + clients particuliers via enseigne_id
 * - Pour org_independante: clients particuliers via organisation_id
 */
export function useLinkMeAffiliateCustomers(
  affiliate: LinkMeAffiliateInfo | null
) {
  const isEnseigne = !!affiliate?.enseigne_id;
  const isOrgIndependante = !!affiliate?.organisation_id && !isEnseigne;

  // Hook pour enseignes
  const enseigneOrgsQuery = useLinkMeEnseigneOrganisations(
    isEnseigne ? (affiliate?.enseigne_id ?? null) : null
  );
  const enseigneIndividualsQuery = useLinkMeEnseigneIndividualCustomers(
    isEnseigne ? (affiliate?.enseigne_id ?? null) : null
  );

  // Hook pour org_independante
  const orgIndividualsQuery = useLinkMeOrganisationIndividualCustomers(
    isOrgIndependante ? (affiliate?.organisation_id ?? null) : null,
    isOrgIndependante ? affiliate?.id : null
  );

  // Pour org_independante: pas d'organisations liées (c'est le point!)
  // Les clients sont uniquement des particuliers ou des organisations externes créées

  return {
    // Pour enseignes: organisations liées
    // Pour org_independante: liste vide (normal, pas d'orgs liées)
    organisations: isEnseigne ? enseigneOrgsQuery.data || [] : [],

    // Clients particuliers selon le type
    individuals: isEnseigne
      ? enseigneIndividualsQuery.data || []
      : orgIndividualsQuery.data || [],

    isLoading: isEnseigne
      ? enseigneOrgsQuery.isLoading || enseigneIndividualsQuery.isLoading
      : orgIndividualsQuery.isLoading,

    isError: isEnseigne
      ? enseigneOrgsQuery.isError || enseigneIndividualsQuery.isError
      : orgIndividualsQuery.isError,

    error: isEnseigne
      ? enseigneOrgsQuery.error || enseigneIndividualsQuery.error
      : orgIndividualsQuery.error,

    refetch: () => {
      if (isEnseigne) {
        void Promise.all([
          enseigneOrgsQuery.refetch(),
          enseigneIndividualsQuery.refetch(),
        ]).catch(error => {
          console.error('[LinkMeAffiliateCustomers] Refetch failed:', error);
        });
      } else {
        void orgIndividualsQuery.refetch().catch(error => {
          console.error('[LinkMeAffiliateCustomers] Refetch failed:', error);
        });
      }
    },

    // Info sur le type d'affilié (utile pour le UI)
    affiliateType: isEnseigne
      ? 'enseigne'
      : isOrgIndependante
        ? 'org_independante'
        : null,
  };
}

/**
 * Hook: créer une nouvelle organisation cliente pour une enseigne
 * Source automatiquement définie sur 'linkme' si appelé depuis le CMS
 */
export function useCreateEnseigneOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrganisationInput) => {
      const { data, error } = await supabase
        .from('organisations')
        .insert({
          enseigne_id: input.enseigne_id,
          legal_name: input.legal_name,
          trade_name: input.trade_name ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          address_line1: input.address_line1 ?? null,
          address_line2: input.address_line2 ?? null,
          city: input.city ?? null,
          postal_code: input.postal_code ?? null,
          country: input.country || 'FR',
          type: 'customer', // Toujours client
          is_active: true,
          source_type: input.source_type || 'linkme', // Par défaut depuis CMS LinkMe
          source_affiliate_id: input.source_affiliate_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['linkme-enseigne-organisations', variables.enseigne_id],
      });
    },
  });
}

/**
 * Hook: créer un nouveau client particulier
 * Supporte les enseignes ET les organisations indépendantes
 * Source automatiquement définie sur 'linkme' si appelé depuis le CMS
 */
export function useCreateEnseigneIndividualCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateIndividualCustomerInput) => {
      // Validation: email est REQUIRED dans la table
      if (!input.email?.trim()) {
        throw new Error('Email requis pour créer un client particulier');
      }

      const insertData = {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email.trim(), // NOT NULL - requis
        phone: input.phone ?? null,
        address_line1: input.address_line1 ?? null,
        address_line2: input.address_line2 ?? null,
        city: input.city ?? null,
        postal_code: input.postal_code ?? null,
        country: input.country ?? 'FR',
        source_type: input.source_type ?? 'linkme',
        source_affiliate_id: input.source_affiliate_id ?? null,
        enseigne_id: input.enseigne_id ?? undefined,
        organisation_id: input.organisation_id ?? undefined,
      };

      console.warn('📝 Création client particulier:', insertData);

      const { data, error } = await supabase
        .from('individual_customers')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création client:', error);
        throw error;
      }

      console.warn('✅ Client créé:', data);
      return data;
    },
    onSuccess: async (_, variables) => {
      // Invalider le cache pour l'enseigne si spécifiée
      if (variables.enseigne_id) {
        await queryClient.invalidateQueries({
          queryKey: [
            'linkme-enseigne-individual-customers',
            variables.enseigne_id,
          ],
        });
      }

      // Invalider le cache pour l'organisation si spécifiée (NOUVEAU - org_independante)
      if (variables.organisation_id) {
        await queryClient.invalidateQueries({
          queryKey: ['linkme-organisation-individual-customers'],
        });
      }

      // Toujours invalider la liste générale des clients
      await queryClient.invalidateQueries({
        queryKey: ['individual-customers'],
      });
    },
  });
}
