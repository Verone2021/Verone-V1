/**
 * Hook: useLinkMeEnseigneCustomers
 * Gestion des clients (organisations + particuliers) rattaches a une enseigne
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type {
  EnseigneOrganisationCustomer,
  EnseigneIndividualCustomer,
  CreateOrganisationInput,
  CreateIndividualCustomerInput,
} from './linkme-customer-types';

export type {
  EnseigneOrganisationCustomer,
  EnseigneIndividualCustomer,
  CreateOrganisationInput,
  CreateIndividualCustomerInput,
};

import {
  fetchEnseigneOrganisations,
  fetchEnseigneIndividualCustomers,
  fetchOrganisationIndividualCustomers,
} from './linkme-customer-queries';

const supabase = createClient();

export function useLinkMeEnseigneOrganisations(enseigneId: string | null) {
  return useQuery({
    queryKey: ['linkme-enseigne-organisations', enseigneId],
    queryFn: () => fetchEnseigneOrganisations(enseigneId!),
    enabled: !!enseigneId,
    staleTime: 300_000,
  });
}

export function useLinkMeEnseigneIndividualCustomers(
  enseigneId: string | null
) {
  return useQuery({
    queryKey: ['linkme-enseigne-individual-customers', enseigneId],
    queryFn: () => fetchEnseigneIndividualCustomers(enseigneId!),
    enabled: !!enseigneId,
    staleTime: 300_000,
  });
}

export function useLinkMeEnseigneCustomers(enseigneId: string | null) {
  const orgsQuery = useLinkMeEnseigneOrganisations(enseigneId);
  const individualsQuery = useLinkMeEnseigneIndividualCustomers(enseigneId);
  return {
    organisations: orgsQuery.data ?? [],
    individuals: individualsQuery.data ?? [],
    isLoading: orgsQuery.isLoading || individualsQuery.isLoading,
    isError: orgsQuery.isError || individualsQuery.isError,
    error: orgsQuery.error ?? individualsQuery.error,
    refetch: () => {
      void Promise.all([orgsQuery.refetch(), individualsQuery.refetch()]).catch(
        err => {
          console.error('[LinkMeEnseigneCustomers] Refetch failed:', err);
        }
      );
    },
  };
}

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
    staleTime: 300_000,
  });
}

export interface LinkMeAffiliateInfo {
  id: string;
  enseigne_id: string | null;
  organisation_id: string | null;
  affiliate_type: string;
}

export function useLinkMeAffiliateCustomers(
  affiliate: LinkMeAffiliateInfo | null
) {
  const isEnseigne = !!affiliate?.enseigne_id;
  const isOrgIndependante = !!affiliate?.organisation_id && !isEnseigne;

  const enseigneOrgsQuery = useLinkMeEnseigneOrganisations(
    isEnseigne ? (affiliate?.enseigne_id ?? null) : null
  );
  const enseigneIndividualsQuery = useLinkMeEnseigneIndividualCustomers(
    isEnseigne ? (affiliate?.enseigne_id ?? null) : null
  );
  const orgIndividualsQuery = useLinkMeOrganisationIndividualCustomers(
    isOrgIndependante ? (affiliate?.organisation_id ?? null) : null,
    isOrgIndependante ? affiliate?.id : null
  );

  return {
    organisations: isEnseigne ? (enseigneOrgsQuery.data ?? []) : [],
    individuals: isEnseigne
      ? (enseigneIndividualsQuery.data ?? [])
      : (orgIndividualsQuery.data ?? []),
    isLoading: isEnseigne
      ? enseigneOrgsQuery.isLoading || enseigneIndividualsQuery.isLoading
      : orgIndividualsQuery.isLoading,
    isError: isEnseigne
      ? enseigneOrgsQuery.isError || enseigneIndividualsQuery.isError
      : orgIndividualsQuery.isError,
    error: isEnseigne
      ? (enseigneOrgsQuery.error ?? enseigneIndividualsQuery.error)
      : orgIndividualsQuery.error,
    refetch: () => {
      if (isEnseigne) {
        void Promise.all([
          enseigneOrgsQuery.refetch(),
          enseigneIndividualsQuery.refetch(),
        ]).catch(err => {
          console.error('[LinkMeAffiliateCustomers] Refetch failed:', err);
        });
      } else {
        void orgIndividualsQuery.refetch().catch(err => {
          console.error('[LinkMeAffiliateCustomers] Refetch failed:', err);
        });
      }
    },
    affiliateType: isEnseigne
      ? 'enseigne'
      : isOrgIndependante
        ? 'org_independante'
        : null,
  };
}

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
          country: input.country ?? 'FR',
          billing_address_line1: input.address_line1 ?? null,
          billing_address_line2: input.address_line2 ?? null,
          billing_city: input.city ?? null,
          billing_postal_code: input.postal_code ?? null,
          billing_country: input.country ?? 'FR',
          shipping_address_line1: input.address_line1 ?? null,
          shipping_address_line2: input.address_line2 ?? null,
          shipping_city: input.city ?? null,
          shipping_postal_code: input.postal_code ?? null,
          shipping_country: input.country ?? 'FR',
          logo_url: input.logo_url ?? null,
          ownership_type: input.ownership_type ?? null,
          type: 'customer',
          is_active: true,
          source_type: input.source_type ?? 'linkme',
          source_affiliate_id: input.source_affiliate_id ?? null,
        })
        .select(
          'id, legal_name, trade_name, email, phone, address_line1, city, postal_code, billing_address_line1, billing_city, billing_postal_code, siret, is_active, created_at, source_type, source_affiliate_id'
        )
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

export function useCreateEnseigneIndividualCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateIndividualCustomerInput) => {
      if (!input.email?.trim())
        throw new Error('Email requis pour creer un client particulier');
      const insertData = {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email.trim(),
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
      const { data, error } = await supabase
        .from('individual_customers')
        .insert(insertData)
        .select(
          'id, first_name, last_name, email, phone, address_line1, city, postal_code, created_at, source_type, source_affiliate_id'
        )
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (_, variables) => {
      if (variables.enseigne_id)
        await queryClient.invalidateQueries({
          queryKey: [
            'linkme-enseigne-individual-customers',
            variables.enseigne_id,
          ],
        });
      if (variables.organisation_id)
        await queryClient.invalidateQueries({
          queryKey: ['linkme-organisation-individual-customers'],
        });
      await queryClient.invalidateQueries({
        queryKey: ['individual-customers'],
      });
    },
  });
}
