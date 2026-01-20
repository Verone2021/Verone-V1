/**
 * Hook: use-organisation-contacts-bo
 * Gestion des contacts d'une organisation pour le back-office LinkMe
 * =====================================================================
 * - Fetch des contacts avec leurs rôles
 * - Création de nouveaux contacts avec rôles
 *
 * @module use-organisation-contacts-bo
 * @since 2026-01-20
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export interface ContactBO {
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
}

export interface CreateContactInput {
  organisationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  isBillingContact?: boolean;
  isPrimaryContact?: boolean;
  isDeliveryContact?: boolean;
}

// ============================================
// HOOKS
// ============================================

/**
 * Récupère les contacts d'une organisation (pour le back-office)
 *
 * @param organisationId - ID de l'organisation
 * @returns Contacts avec leurs rôles
 */
export function useOrganisationContactsBO(organisationId: string | null) {
  return useQuery({
    queryKey: ['organisation-contacts-bo', organisationId],
    queryFn: async () => {
      if (!organisationId) return null;

      const supabase = createClient();

      const { data, error } = await supabase
        .from('contacts')
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          phone,
          mobile,
          title,
          is_primary_contact,
          is_billing_contact,
          is_commercial_contact,
          is_technical_contact
        `
        )
        .eq('organisation_id', organisationId)
        .eq('is_active', true)
        .order('is_primary_contact', { ascending: false })
        .order('is_billing_contact', { ascending: false });

      if (error) {
        console.error('Erreur récupération contacts:', error);
        throw error;
      }

      const contacts: ContactBO[] = (data || []).map(c => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        title: c.title,
        isPrimaryContact: c.is_primary_contact || false,
        isBillingContact: c.is_billing_contact || false,
        isCommercialContact: c.is_commercial_contact || false,
        isTechnicalContact: c.is_technical_contact || false,
      }));

      // Identifier les contacts clés
      const primaryContact = contacts.find(c => c.isPrimaryContact) || null;
      const billingContact = contacts.find(c => c.isBillingContact) || null;

      return {
        contacts,
        primaryContact,
        billingContact,
      };
    },
    enabled: !!organisationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Mutation pour créer un nouveau contact pour une organisation
 */
export function useCreateContactBO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const supabase = createClient();

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          organisation_id: input.organisationId,
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          phone: input.phone || null,
          title: input.title || null,
          is_billing_contact: input.isBillingContact || false,
          is_primary_contact: input.isPrimaryContact || false,
          is_active: true,
        })
        .select('id, first_name, last_name, email')
        .single();

      if (error) {
        console.error('Erreur création contact:', error);
        throw error;
      }

      return contact;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organisation-contacts-bo', variables.organisationId],
      });
      toast.success('Contact créé avec succès');
    },
    onError: (error: Error) => {
      console.error('Erreur création contact:', error);
      toast.error('Erreur lors de la création du contact', {
        description: error.message,
      });
    },
  });
}

/**
 * Mutation pour mettre à jour le flag is_billing_contact d'un contact
 */
export function useSetBillingContactBO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      contactId: string;
      organisationId: string;
      isBillingContact: boolean;
    }) => {
      const supabase = createClient();

      // D'abord retirer le flag is_billing_contact des autres contacts
      if (input.isBillingContact) {
        await supabase
          .from('contacts')
          .update({ is_billing_contact: false })
          .eq('organisation_id', input.organisationId)
          .neq('id', input.contactId);
      }

      // Puis mettre à jour le contact cible
      const { error } = await supabase
        .from('contacts')
        .update({ is_billing_contact: input.isBillingContact })
        .eq('id', input.contactId);

      if (error) {
        console.error('Erreur mise à jour contact:', error);
        throw error;
      }

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organisation-contacts-bo', variables.organisationId],
      });
    },
    onError: (error: Error) => {
      console.error('Erreur mise à jour contact:', error);
      toast.error('Erreur lors de la mise à jour du contact');
    },
  });
}
