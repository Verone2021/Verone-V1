/**
 * Hook: use-organisation-addresses-bo
 * Gestion des adresses d'une organisation pour le back-office LinkMe
 * =====================================================================
 * - Fetch des adresses billing/shipping
 * - Création de nouvelles adresses
 *
 * @module use-organisation-addresses-bo
 * @since 2026-01-20
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
// Database type is used by TypeScript for supabase.rpc() type inference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Database } from '@verone/types';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export type AddressType = 'billing' | 'shipping';

export interface AddressBO {
  id: string;
  ownerType: string;
  ownerId: string;
  addressType: AddressType;
  label: string | null;
  legalName: string | null;
  tradeName: string | null;
  siret: string | null;
  vatNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  region: string | null;
  country: string;
  isDefault: boolean;
}

export interface CreateAddressInput {
  ownerId: string;
  ownerType: 'organisation' | 'user';
  addressType: AddressType;
  label?: string;
  legalName?: string;
  tradeName?: string;
  siret?: string;
  vatNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  region?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  setAsDefault?: boolean;
}

// ============================================
// HOOKS
// ============================================

/**
 * Récupère les adresses d'une organisation (pour le back-office)
 *
 * @param organisationId - ID de l'organisation
 * @param addressType - Optionnel: filtrer par type ('billing', 'shipping')
 * @returns Adresses de l'organisation
 */
export function useOrganisationAddressesBO(
  organisationId: string | null,
  addressType?: AddressType
) {
  return useQuery({
    queryKey: ['organisation-addresses-bo', organisationId, addressType],
    queryFn: async () => {
      if (!organisationId) {
        return {
          billing: [],
          shipping: [],
          defaults: { billing: null, shipping: null },
          all: [],
        };
      }

      const supabase = createClient();

      // Build query with proper typing
      const baseQuery = supabase
        .from('addresses')
        .select('*')
        .eq('owner_type', 'organisation')
        .eq('owner_id', organisationId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      // Add address type filter if specified
      const { data, error } = addressType
        ? await baseQuery.eq('address_type', addressType)
        : await baseQuery;

      if (error) {
        console.error('[useOrganisationAddressesBO] Error:', error);
        throw error;
      }

      // Transform to camelCase
      const addresses: AddressBO[] = (data ?? []).map(
        (row: Record<string, unknown>) => ({
          id: row.id as string,
          ownerType: row.owner_type as string,
          ownerId: row.owner_id as string,
          addressType: row.address_type as AddressType,
          label: row.label as string | null,
          legalName: row.legal_name as string | null,
          tradeName: row.trade_name as string | null,
          siret: row.siret as string | null,
          vatNumber: row.vat_number as string | null,
          addressLine1: row.address_line1 as string,
          addressLine2: row.address_line2 as string | null,
          postalCode: row.postal_code as string,
          city: row.city as string,
          region: row.region as string | null,
          country: row.country as string,
          isDefault: row.is_default as boolean,
        })
      );

      // Group by type
      const billing = addresses.filter(a => a.addressType === 'billing');
      const shipping = addresses.filter(a => a.addressType === 'shipping');

      // Find defaults
      const defaultBilling = billing.find(a => a.isDefault) ?? null;
      const defaultShipping = shipping.find(a => a.isDefault) ?? null;

      return {
        billing,
        shipping,
        defaults: {
          billing: defaultBilling,
          shipping: defaultShipping,
        },
        all: addresses,
      };
    },
    enabled: !!organisationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Mutation pour créer une nouvelle adresse
 */
export function useCreateAddressBO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAddressInput) => {
      const supabase = createClient();

      // Convert to snake_case JSONB for RPC
      const addressDataJson = {
        label: input.label,
        legal_name: input.legalName,
        trade_name: input.tradeName,
        siret: input.siret,
        vat_number: input.vatNumber,
        address_line1: input.addressLine1,
        address_line2: input.addressLine2,
        postal_code: input.postalCode,
        city: input.city,
        region: input.region,
        // NOTE: Using || intentionally - empty string should default to 'FR'
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        country: input.country || 'FR',
        latitude: input.latitude,
        longitude: input.longitude,
      };

      const { data, error } = await supabase.rpc('upsert_address', {
        p_owner_type: input.ownerType,
        p_owner_id: input.ownerId,
        p_address_type: input.addressType,
        p_address_data: addressDataJson,
        p_set_as_default: input.setAsDefault ?? false,
        p_source_app: 'back-office',
      });

      if (error) {
        console.error('[useCreateAddressBO] Error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['organisation-addresses-bo', variables.ownerId],
      });
      toast.success('Adresse créée avec succès');
    },
    onError: (error: Error) => {
      console.error('[useCreateAddressBO] Error:', error);
      toast.error("Erreur lors de la création de l'adresse", {
        description: error.message,
      });
    },
  });
}
