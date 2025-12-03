/**
 * Hook: useLinkMeEnseigneCustomers
 * Gestion des clients (organisations + particuliers) rattachés à une enseigne
 * Pour création de commandes LinkMe depuis le CMS
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

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
  created_at: string;
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
  created_at: string;
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
  enseigne_id: string;
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
  const { data, error } = await (supabase as any)
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

  return (data || []).map((org: any) => ({
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
  const { data, error } = await (supabase as any)
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

  return (data || []).map((customer: any) => ({
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
      orgsQuery.refetch();
      individualsQuery.refetch();
    },
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
      const { data, error } = await (supabase as any)
        .from('organisations')
        .insert({
          enseigne_id: input.enseigne_id,
          legal_name: input.legal_name,
          trade_name: input.trade_name || null,
          email: input.email || null,
          phone: input.phone || null,
          address_line1: input.address_line1 || null,
          address_line2: input.address_line2 || null,
          city: input.city || null,
          postal_code: input.postal_code || null,
          country: input.country || 'FR',
          type: 'customer', // Toujours client
          is_active: true,
          source_type: input.source_type || 'linkme', // Par défaut depuis CMS LinkMe
          source_affiliate_id: input.source_affiliate_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-enseigne-organisations', variables.enseigne_id],
      });
    },
  });
}

/**
 * Hook: créer un nouveau client particulier pour une enseigne
 * Source automatiquement définie sur 'linkme' si appelé depuis le CMS
 */
export function useCreateEnseigneIndividualCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateIndividualCustomerInput) => {
      const { data, error } = await (supabase as any)
        .from('individual_customers')
        .insert({
          enseigne_id: input.enseigne_id,
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email || null,
          phone: input.phone || null,
          address_line1: input.address_line1 || null,
          address_line2: input.address_line2 || null,
          city: input.city || null,
          postal_code: input.postal_code || null,
          country: input.country || 'FR',
          source_type: input.source_type || 'linkme', // Par défaut depuis CMS LinkMe
          source_affiliate_id: input.source_affiliate_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'linkme-enseigne-individual-customers',
          variables.enseigne_id,
        ],
      });
    },
  });
}
