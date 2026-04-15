'use client';

/**
 * Hook: use-organisation-contacts
 * Gestion des contacts d'une organisation
 *
 * @module use-organisation-contacts
 * @since 2025-xx-xx
 * @updated 2026-04-14 - Refactoring: extraction mutations
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// Re-exports des mutations pour compatibilité imports existants
export {
  useUpdateOrganisationContacts,
  useCreateOrganisationContacts,
  useUpdateContact,
  useDeleteContact,
  useCreateContact,
} from './use-organisation-contacts-mutations';

// ============================================
// TYPES
// ============================================

export interface OrganisationContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  title: string | null;
  isPrimaryContact: boolean;
  isBillingContact: boolean;
  isCommercialContact: boolean;
  isTechnicalContact: boolean;
  isDeliveryOnly: boolean;
  isUser: boolean;
  organisationId: string | null;
  enseigneId: string | null;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title?: string;
}

export interface UpdateContactsInput {
  organisationId: string;
  primaryContact: ContactFormData;
  billingContact: ContactFormData | null;
}

export interface UpdateContactInput {
  contactId: string;
  organisationId: string;
  first_name: string;
  last_name: string;
  email: string;
  title?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  secondary_email?: string;
  direct_line?: string;
  is_primary_contact: boolean;
  is_billing_contact: boolean;
  is_delivery_only?: boolean;
  notes?: string;
}

export interface CreateContactInput {
  organisationId: string;
  enseigneId?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  title?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  secondary_email?: string;
  direct_line?: string;
  is_primary_contact: boolean;
  is_billing_contact: boolean;
  is_delivery_only?: boolean;
  notes?: string;
}

// ============================================
// QUERY HOOK
// ============================================

/**
 * Hook pour récupérer les contacts d'une organisation
 */
export function useOrganisationContacts(
  organisationId: string | null,
  enseigneId?: string | null,
  ownershipType?: 'propre' | 'succursale' | 'franchise' | null,
  includeEnseigneContacts?: boolean
) {
  return useQuery({
    queryKey: [
      'organisation-contacts',
      organisationId,
      enseigneId,
      ownershipType,
      includeEnseigneContacts,
    ],
    queryFn: async () => {
      if (!organisationId && !enseigneId) return null;

      const supabase = createClient();

      let query = supabase
        .from('contacts')
        .select(
          `id, first_name, last_name, email, phone, mobile, title,
          is_primary_contact, is_billing_contact, is_commercial_contact,
          is_technical_contact, is_delivery_only, notes, organisation_id, enseigne_id`
        )
        .eq('is_active', true);

      if (
        ownershipType === 'franchise' &&
        includeEnseigneContacts &&
        enseigneId &&
        organisationId
      ) {
        query = query.or(
          `organisation_id.eq.${organisationId},enseigne_id.eq.${enseigneId}`
        );
      } else if (ownershipType === 'franchise' && organisationId) {
        query = query.eq('organisation_id', organisationId);
      } else if (
        ownershipType === 'succursale' &&
        includeEnseigneContacts &&
        enseigneId &&
        organisationId
      ) {
        query = query.or(
          `enseigne_id.eq.${enseigneId},and(organisation_id.eq.${organisationId},enseigne_id.eq.${enseigneId})`
        );
      } else if (
        ownershipType === 'succursale' &&
        enseigneId &&
        organisationId
      ) {
        query = query.or(
          `organisation_id.eq.${organisationId},and(organisation_id.eq.${organisationId},enseigne_id.eq.${enseigneId})`
        );
      } else if (organisationId) {
        query = query.eq('organisation_id', organisationId);
      } else if (enseigneId) {
        query = query.eq('enseigne_id', enseigneId);
      }

      const { data, error } = await query.order('is_primary_contact', {
        ascending: false,
      });

      if (error) {
        console.error('Erreur récupération contacts:', error);
        throw error;
      }

      const contacts: OrganisationContact[] = (data ?? []).map(c => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        title: c.title,
        isPrimaryContact: c.is_primary_contact ?? false,
        isBillingContact: c.is_billing_contact ?? false,
        isCommercialContact: c.is_commercial_contact ?? false,
        isTechnicalContact: c.is_technical_contact ?? false,
        isDeliveryOnly: c.is_delivery_only ?? false,
        isUser:
          (c.notes?.includes('auto-sync') ?? false) ||
          (c.notes?.includes('backfill') ?? false),
        organisationId: c.organisation_id,
        enseigneId: c.enseigne_id,
      }));

      const primaryContact = contacts.find(c => c.isPrimaryContact) ?? null;
      const billingContact = contacts.find(c => c.isBillingContact) ?? null;
      const otherContacts = contacts.filter(
        c => !c.isPrimaryContact && !c.isBillingContact
      );

      const isPrimaryComplete = !!(
        primaryContact?.firstName &&
        primaryContact?.lastName &&
        primaryContact?.email
      );
      const isBillingComplete = !!(
        billingContact?.firstName &&
        billingContact?.lastName &&
        billingContact?.email
      );
      const hasBilling = !!billingContact || isPrimaryComplete;

      const restaurantContacts = (data || []).filter(
        c => c.organisation_id === organisationId
      );
      const enseigneContacts = (data || []).filter(
        c => c.enseigne_id === enseigneId && !c.organisation_id
      );
      const sharedContacts = (data || []).filter(
        c => c.organisation_id && c.enseigne_id
      );

      return {
        contacts,
        allContacts: contacts,
        restaurantContacts,
        enseigneContacts,
        sharedContacts,
        primaryContact,
        billingContact,
        otherContacts,
        isComplete: isPrimaryComplete && hasBilling,
        isPrimaryComplete,
        isBillingComplete: billingContact
          ? isBillingComplete
          : isPrimaryComplete,
      };
    },
    enabled: !!organisationId || !!enseigneId,
    staleTime: 2 * 60 * 1000,
  });
}
