'use client';

/**
 * Hook: useEntityAddresses
 *
 * Gestion des adresses d'une entité (organisation, user, customer)
 * Système scalable réutilisable multi-apps (LinkMe, site-internet, back-office)
 *
 * @module useEntityAddresses
 * @since 2026-01-20
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export type AddressOwnerType = 'organisation' | 'user' | 'customer';
export type AddressType = 'billing' | 'shipping';

export interface Address {
  id: string;
  ownerType: AddressOwnerType;
  ownerId: string;
  addressType: AddressType;
  sourceApp: string;
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
  latitude: number | null;
  longitude: number | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface AddressInput {
  id?: string; // If updating existing address
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
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface EntityAddressesResult {
  billing: Address[];
  shipping: Address[];
  defaults: {
    billing: Address | null;
    shipping: Address | null;
  };
  all: Address[];
}

// ============================================
// HELPER: Transform DB row to Address type
// ============================================

function transformAddress(row: Record<string, unknown>): Address {
  return {
    id: row.id as string,
    ownerType: row.owner_type as AddressOwnerType,
    ownerId: row.owner_id as string,
    addressType: row.address_type as AddressType,
    sourceApp: row.source_app as string,
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
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    contactName: row.contact_name as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    isDefault: row.is_default as boolean,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    archivedAt: row.archived_at as string | null,
  };
}

// ============================================
// HOOKS
// ============================================

/**
 * Récupère les adresses d'une entité (organisation, user, customer)
 *
 * @param ownerType - Type d'entité ('organisation', 'user', 'customer')
 * @param ownerId - ID de l'entité
 * @param addressType - Optionnel: filtrer par type ('billing', 'shipping')
 * @returns Adresses groupées par type avec les défauts identifiés
 *
 * @example
 * ```tsx
 * const { data: addresses, isLoading } = useEntityAddresses('organisation', orgId);
 * console.log(addresses?.defaults.billing); // Adresse de facturation par défaut
 * console.log(addresses?.shipping); // Toutes les adresses de livraison
 * ```
 */
export function useEntityAddresses(
  ownerType: AddressOwnerType,
  ownerId: string | null,
  addressType?: AddressType
) {
  return useQuery({
    queryKey: ['entity-addresses', ownerType, ownerId, addressType],
    queryFn: async (): Promise<EntityAddressesResult> => {
      if (!ownerId) {
        return {
          billing: [],
          shipping: [],
          defaults: { billing: null, shipping: null },
          all: [],
        };
      }

      const supabase = createClient();

      // Build query based on parameters
      // Note: Using 'as any' because 'addresses' table types are not yet generated
      // TODO: Regenerate Supabase types after migration is applied
      let query = (supabase as any)
        .from('addresses')
        .select('*')
        .eq('owner_type', ownerType)
        .eq('owner_id', ownerId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (addressType) {
        query = query.eq('address_type', addressType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useEntityAddresses] Error:', error);
        throw error;
      }

      const addresses = (data || []).map(row =>
        transformAddress(row as Record<string, unknown>)
      );

      // Group by type
      const billing = addresses.filter(a => a.addressType === 'billing');
      const shipping = addresses.filter(a => a.addressType === 'shipping');

      // Find defaults
      const defaultBilling = billing.find(a => a.isDefault) || null;
      const defaultShipping = shipping.find(a => a.isDefault) || null;

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
    enabled: !!ownerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Mutation pour sauvegarder une adresse
 * Appelle l'RPC upsert_address qui gère automatiquement le flag is_default
 *
 * @returns Mutation avec mutate(params)
 *
 * @example
 * ```tsx
 * const { mutate: saveAddress, isPending } = useSaveAddress();
 *
 * saveAddress({
 *   ownerType: 'organisation',
 *   ownerId: orgId,
 *   addressType: 'shipping',
 *   addressData: { addressLine1: '...', city: '...' },
 *   setAsDefault: true,
 * });
 * ```
 */
export function useSaveAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      ownerType: AddressOwnerType;
      ownerId: string;
      addressType: AddressType;
      addressData: AddressInput;
      setAsDefault?: boolean;
      sourceApp?: string;
    }): Promise<string> => {
      const supabase = createClient();

      // Convert AddressInput to snake_case JSONB for RPC
      const addressDataJson = {
        id: params.addressData.id,
        label: params.addressData.label,
        legal_name: params.addressData.legalName,
        trade_name: params.addressData.tradeName,
        siret: params.addressData.siret,
        vat_number: params.addressData.vatNumber,
        address_line1: params.addressData.addressLine1,
        address_line2: params.addressData.addressLine2,
        postal_code: params.addressData.postalCode,
        city: params.addressData.city,
        region: params.addressData.region,
        country: params.addressData.country || 'FR',
        latitude: params.addressData.latitude,
        longitude: params.addressData.longitude,
        contact_name: params.addressData.contactName,
        contact_email: params.addressData.contactEmail,
        contact_phone: params.addressData.contactPhone,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('upsert_address', {
        p_owner_type: params.ownerType,
        p_owner_id: params.ownerId,
        p_address_type: params.addressType,
        p_address_data: addressDataJson,
        p_set_as_default: params.setAsDefault ?? false,
        p_source_app: params.sourceApp || 'linkme',
      });

      if (error) {
        console.error('[useSaveAddress] Error:', error);
        throw error;
      }

      return data as string;
    },
    onSuccess: (_, params) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['entity-addresses', params.ownerType, params.ownerId],
      });
      toast.success('Adresse enregistrée');
    },
    onError: (error: Error) => {
      console.error('[useSaveAddress] Error:', error);
      toast.error("Erreur lors de l'enregistrement de l'adresse", {
        description: error.message,
      });
    },
  });
}

/**
 * Mutation pour archiver une adresse (soft delete)
 *
 * @returns Mutation avec mutate(addressId)
 */
export function useArchiveAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      addressId: string;
      ownerType: AddressOwnerType;
      ownerId: string;
    }): Promise<boolean> => {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('archive_address', {
        p_address_id: params.addressId,
      });

      if (error) {
        console.error('[useArchiveAddress] Error:', error);
        throw error;
      }

      return data as boolean;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({
        queryKey: ['entity-addresses', params.ownerType, params.ownerId],
      });
      toast.success('Adresse archivée');
    },
    onError: (error: Error) => {
      console.error('[useArchiveAddress] Error:', error);
      toast.error("Erreur lors de l'archivage de l'adresse", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook combiné pour récupérer les adresses d'une organisation
 * Simplifie l'utilisation courante (organisation addresses)
 *
 * @param organisationId - ID de l'organisation
 * @returns Adresses avec helpers
 */
export function useOrganisationAddresses(organisationId: string | null) {
  return useEntityAddresses('organisation', organisationId);
}
