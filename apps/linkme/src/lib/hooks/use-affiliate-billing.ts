/**
 * Hook: useAffiliateBilling
 * Récupère et met à jour les infos de facturation de l'organisation parente
 * de l'affilié LinkMe connecté (legal_name, siret, IBAN, adresse).
 *
 * @module use-affiliate-billing
 * @since 2026-05-19 [BO-LINKME-PR-003]
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';

import { useUserAffiliate } from './use-user-affiliate';

const supabase: SupabaseClient<Database> = createClient();

export interface AffiliateBillingInfo {
  organisationId: string;
  legalName: string;
  siret: string | null;
  vatNumber: string | null;
  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingPostalCode: string | null;
  billingCity: string | null;
  billingCountry: string | null;
  bankAccount: {
    id: string;
    iban: string;
    bic: string | null;
    bankName: string | null;
    accountHolderName: string | null;
  } | null;
}

export interface UpdateAffiliateBillingInput {
  organisationId: string;
  legalName: string;
  siret?: string | null;
  vatNumber?: string | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingPostalCode?: string | null;
  billingCity?: string | null;
  billingCountry?: string | null;
  iban?: string | null;
  bic?: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
}

const ORGANISATION_BILLING_COLUMNS =
  'id, legal_name, siret, vat_number, address_line1, address_line2, postal_code, city, country, billing_address_line1, billing_address_line2, billing_postal_code, billing_city, billing_country, enseigne_id, is_enseigne_parent';

/**
 * Récupère les infos de facturation de l'orga parente de l'affilié connecté.
 * Retourne `null` si aucune orga parente n'est rattachée (cas Black & White
 * Burger au 2026-05-19) — l'UI doit alors bloquer le dépôt de facture.
 */
export function useAffiliateBilling() {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['affiliate-billing', affiliate?.id],
    queryFn: async (): Promise<AffiliateBillingInfo | null> => {
      if (!affiliate) return null;

      let orgQuery = supabase
        .from('organisations')
        .select(ORGANISATION_BILLING_COLUMNS);

      if (affiliate.organisation_id) {
        orgQuery = orgQuery.eq('id', affiliate.organisation_id);
      } else if (affiliate.enseigne_id) {
        orgQuery = orgQuery
          .eq('enseigne_id', affiliate.enseigne_id)
          .eq('is_enseigne_parent', true);
      } else {
        return null;
      }

      const { data: org, error: orgErr } = await orgQuery.maybeSingle();

      if (orgErr) {
        console.error('[useAffiliateBilling] fetch organisation:', orgErr);
        throw orgErr;
      }

      if (!org) return null;

      const { data: bank, error: bankErr } = await supabase
        .from('counterparty_bank_accounts')
        .select('id, iban, bic, bank_name, account_holder_name')
        .eq('organisation_id', org.id)
        .eq('is_primary', true)
        .maybeSingle();

      if (bankErr) {
        console.error('[useAffiliateBilling] fetch bank account:', bankErr);
      }

      return {
        organisationId: org.id,
        legalName: org.legal_name ?? '',
        siret: org.siret,
        vatNumber: org.vat_number,
        billingAddressLine1:
          org.billing_address_line1 ?? org.address_line1 ?? null,
        billingAddressLine2:
          org.billing_address_line2 ?? org.address_line2 ?? null,
        billingPostalCode: org.billing_postal_code ?? org.postal_code ?? null,
        billingCity: org.billing_city ?? org.city ?? null,
        billingCountry: org.billing_country ?? org.country ?? 'FR',
        bankAccount: bank
          ? {
              id: bank.id,
              iban: bank.iban,
              bic: bank.bic,
              bankName: bank.bank_name,
              accountHolderName: bank.account_holder_name,
            }
          : null,
      };
    },
    enabled: !!affiliate,
    staleTime: 60_000,
  });
}

/**
 * Met à jour l'organisation parente + le compte bancaire principal.
 * RLS : `linkme_users_update_organisations` et `linkme_affiliate_*_own_bank_account`.
 */
export function useUpdateAffiliateBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAffiliateBillingInput) => {
      const { organisationId, iban, bic, bankName, accountHolderName, ...org } =
        input;

      const { error: orgErr } = await supabase
        .from('organisations')
        .update({
          legal_name: org.legalName,
          siret: org.siret ?? null,
          vat_number: org.vatNumber ?? null,
          billing_address_line1: org.billingAddressLine1 ?? null,
          billing_address_line2: org.billingAddressLine2 ?? null,
          billing_postal_code: org.billingPostalCode ?? null,
          billing_city: org.billingCity ?? null,
          billing_country: org.billingCountry ?? 'FR',
          updated_at: new Date().toISOString(),
        })
        .eq('id', organisationId);

      if (orgErr) {
        console.error('[useUpdateAffiliateBilling] update orga:', orgErr);
        throw orgErr;
      }

      if (iban && iban.trim().length > 0) {
        const { data: existing } = await supabase
          .from('counterparty_bank_accounts')
          .select('id')
          .eq('organisation_id', organisationId)
          .eq('is_primary', true)
          .maybeSingle();

        const bankPayload = {
          iban: iban.replace(/\s+/g, '').toUpperCase(),
          bic: bic && bic.trim().length > 0 ? bic.toUpperCase() : null,
          bank_name: bankName ?? null,
          account_holder_name: accountHolderName ?? null,
        };

        if (existing) {
          const { error: bankErr } = await supabase
            .from('counterparty_bank_accounts')
            .update(bankPayload)
            .eq('id', existing.id);
          if (bankErr) {
            console.error('[useUpdateAffiliateBilling] update bank:', bankErr);
            throw bankErr;
          }
        } else {
          const { error: bankErr } = await supabase
            .from('counterparty_bank_accounts')
            .insert({
              ...bankPayload,
              organisation_id: organisationId,
              is_primary: true,
            });
          if (bankErr) {
            console.error('[useUpdateAffiliateBilling] insert bank:', bankErr);
            throw bankErr;
          }
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['affiliate-billing'] });
    },
  });
}
