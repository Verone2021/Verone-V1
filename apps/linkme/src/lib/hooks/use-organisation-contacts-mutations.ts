'use client';

/**
 * Hooks: mutations pour les contacts d'organisation
 * (update, create, delete)
 *
 * @module use-organisation-contacts-mutations
 * @since 2026-04-14 (extrait de use-organisation-contacts.ts)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import type {
  ContactFormData,
  UpdateContactsInput,
  UpdateContactInput,
  CreateContactInput,
} from './use-organisation-contacts';

/** Convert empty string to null (for DB constraints that reject "") */
function emptyToNull(value: string | undefined | null): string | null {
  if (!value) return null;
  return value;
}

/**
 * Hook pour mettre à jour ou créer les contacts d'une organisation
 * Gère la création/mise à jour du contact propriétaire et facturation
 */
export function useUpdateOrganisationContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateContactsInput) => {
      const supabase = createClient();
      const { organisationId, primaryContact, billingContact } = input;

      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('id, is_primary_contact, is_billing_contact')
        .eq('organisation_id', organisationId)
        .eq('is_active', true);

      const existingPrimary = existingContacts?.find(c => c.is_primary_contact);
      const existingBilling = existingContacts?.find(
        c => c.is_billing_contact && !c.is_primary_contact
      );

      if (existingPrimary) {
        const { error } = await supabase
          .from('contacts')
          .update({
            first_name: primaryContact.firstName,
            last_name: primaryContact.lastName,
            email: primaryContact.email,
            phone: primaryContact.phone ?? null,
            title: primaryContact.title ?? null,
            is_billing_contact: billingContact === null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPrimary.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contacts').insert({
          organisation_id: organisationId,
          first_name: primaryContact.firstName,
          last_name: primaryContact.lastName,
          email: primaryContact.email,
          phone: primaryContact.phone ?? null,
          title: primaryContact.title ?? null,
          is_primary_contact: true,
          is_billing_contact: billingContact === null,
          is_active: true,
        });
        if (error) throw error;
      }

      if (billingContact !== null) {
        if (existingBilling) {
          const { error } = await supabase
            .from('contacts')
            .update({
              first_name: billingContact.firstName,
              last_name: billingContact.lastName,
              email: billingContact.email,
              phone: billingContact.phone ?? null,
              title: billingContact.title ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingBilling.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('contacts').insert({
            organisation_id: organisationId,
            first_name: billingContact.firstName,
            last_name: billingContact.lastName,
            email: billingContact.email,
            phone: billingContact.phone ?? null,
            title: billingContact.title ?? null,
            is_primary_contact: false,
            is_billing_contact: true,
            is_active: true,
          });
          if (error) throw error;
        }
        if (existingPrimary) {
          await supabase
            .from('contacts')
            .update({ is_billing_contact: false })
            .eq('id', existingPrimary.id);
        }
      } else {
        if (existingBilling) {
          await supabase
            .from('contacts')
            .update({ is_billing_contact: false, is_active: false })
            .eq('id', existingBilling.id);
        }
      }

      return { success: true };
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organisation-contacts', variables.organisationId],
      });
      toast.success('Contacts mis à jour');
    },
    onError: (error: Error) => {
      console.error('Erreur mise à jour contacts:', error);
      toast.error('Erreur', {
        description:
          error.message || 'Impossible de mettre à jour les contacts',
      });
    },
  });
}

export function useCreateOrganisationContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      organisationId: string;
      primaryContact: ContactFormData;
      billingContact: ContactFormData | null;
      enseigneId?: string | null;
      ownershipType?: 'propre' | 'succursale' | 'franchise' | null;
    }) => {
      const supabase = createClient();
      const {
        organisationId,
        primaryContact,
        billingContact,
        enseigneId,
        ownershipType,
      } = input;
      const contactEnseigneId =
        ownershipType === 'succursale' ? enseigneId : null;

      const { error: primaryError } = await supabase.from('contacts').insert({
        organisation_id: organisationId,
        enseigne_id: contactEnseigneId ?? null,
        first_name: primaryContact.firstName,
        last_name: primaryContact.lastName,
        email: primaryContact.email,
        phone: primaryContact.phone || null,
        title: primaryContact.title ?? 'Propriétaire',
        is_primary_contact: true,
        is_billing_contact: billingContact === null,
        is_active: true,
      });
      if (primaryError) throw primaryError;

      if (billingContact !== null) {
        const { error: billingError } = await supabase.from('contacts').insert({
          organisation_id: organisationId,
          enseigne_id: contactEnseigneId ?? null,
          first_name: billingContact.firstName,
          last_name: billingContact.lastName,
          email: billingContact.email,
          phone: billingContact.phone || null,
          title: billingContact.title ?? 'Responsable facturation',
          is_primary_contact: false,
          is_billing_contact: true,
          is_active: true,
        });
        if (billingError) throw billingError;
      }

      return { success: true };
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organisation-contacts', variables.organisationId],
      });
    },
    onError: (error: Error) => {
      console.error('Erreur création contacts:', error);
      throw error;
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateContactInput) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email,
          title: emptyToNull(input.title),
          department: emptyToNull(input.department),
          phone: emptyToNull(input.phone),
          mobile: emptyToNull(input.mobile),
          secondary_email: emptyToNull(input.secondary_email),
          direct_line: emptyToNull(input.direct_line),
          is_primary_contact: input.is_primary_contact,
          is_billing_contact: input.is_billing_contact,
          is_delivery_only: input.is_delivery_only ?? false,
          notes: emptyToNull(input.notes),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.contactId);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organisation-contacts', variables.organisationId],
      });
      toast.success('Contact mis à jour');
    },
    onError: (error: Error) => {
      console.error('Erreur mise à jour contact:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de mettre à jour le contact',
      });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      contactId: string;
      organisationId: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('contacts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', input.contactId);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organisation-contacts', variables.organisationId],
      });
      toast.success('Contact supprimé');
    },
    onError: (error: Error) => {
      console.error('Erreur suppression contact:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer le contact',
      });
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const supabase = createClient();
      const { error } = await supabase.from('contacts').insert({
        organisation_id: input.organisationId,
        enseigne_id: emptyToNull(input.enseigneId),
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        title: emptyToNull(input.title),
        department: emptyToNull(input.department),
        phone: emptyToNull(input.phone),
        mobile: emptyToNull(input.mobile),
        secondary_email: emptyToNull(input.secondary_email),
        direct_line: emptyToNull(input.direct_line),
        is_primary_contact: input.is_primary_contact,
        is_billing_contact: input.is_billing_contact,
        is_delivery_only: input.is_delivery_only ?? false,
        is_commercial_contact: !(input.is_delivery_only ?? false),
        notes: emptyToNull(input.notes),
        is_active: true,
      });
      if (error) throw error;
      return { success: true };
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organisation-contacts', variables.organisationId],
      });
      toast.success('Contact créé avec succès');
    },
    onError: (error: Error) => {
      console.error('Erreur création contact:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de créer le contact',
      });
    },
  });
}
