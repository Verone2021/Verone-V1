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
  isTechnicalContact: boolean;
  linkmeUserId: string | null;
  linkmeRole: string | null;
  affiliateOrdersCount: number | null;
  affiliateLastOrderDate: string | null;
}

export interface UpdateContactInput {
  contactId: string;
  enseigneId?: string;
  organisationId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  isBillingContact?: boolean;
  isPrimaryContact?: boolean;
  isTechnicalContact?: boolean;
}

export interface CreateContactInput {
  organisationId?: string;
  enseigneId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  isBillingContact?: boolean;
  isPrimaryContact?: boolean;
  isTechnicalContact?: boolean;
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

      const contacts: ContactBO[] = (data ?? []).map(c => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        title: c.title,
        isPrimaryContact: c.is_primary_contact ?? false,
        isBillingContact: c.is_billing_contact ?? false,

        isTechnicalContact: c.is_technical_contact ?? false,
        linkmeUserId: null,
        linkmeRole: null,
        affiliateOrdersCount: null,
        affiliateLastOrderDate: null,
      }));

      // Identifier les contacts clés
      const primaryContact = contacts.find(c => c.isPrimaryContact) ?? null;
      const billingContact = contacts.find(c => c.isBillingContact) ?? null;

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
 * Récupère les contacts d'une enseigne (pour le back-office)
 *
 * @param enseigneId - ID de l'enseigne
 * @returns Contacts avec leurs rôles
 */
export function useEnseigneContactsBO(enseigneId: string | null) {
  return useQuery({
    queryKey: ['enseigne-contacts-bo', enseigneId],
    queryFn: async () => {
      if (!enseigneId) return null;

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

          is_technical_contact
        `
        )
        .eq('enseigne_id', enseigneId)
        .eq('is_active', true)
        .order('is_primary_contact', { ascending: false })
        .order('is_billing_contact', { ascending: false });

      if (error) {
        console.error('Erreur récupération contacts enseigne:', error);
        throw error;
      }

      // Fetch LinkMe users for this enseigne to detect linked accounts and enrich data
      type LinkmeUserRow = {
        user_id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        linkme_role: string | null;
      };
      const { data: linkmeUsers } = await supabase
        .from('v_linkme_users')
        .select('user_id, email, first_name, last_name, phone, linkme_role')
        .eq('enseigne_id', enseigneId)
        .eq('is_active', true)
        .returns<LinkmeUserRow[]>();

      const linkmeEmailMap = new Map<string, LinkmeUserRow>();
      for (const u of linkmeUsers ?? []) {
        linkmeEmailMap.set(u.email.toLowerCase(), u);
      }

      // Fetch affiliate order stats for this enseigne
      let affiliateOrdersCount: number | null = null;
      let affiliateLastOrderDate: string | null = null;

      const { data: affiliate } = await supabase
        .from('linkme_affiliates')
        .select('id')
        .eq('enseigne_id', enseigneId)
        .limit(1)
        .single();

      if (affiliate?.id) {
        const { count, data: lastOrder } = await supabase
          .from('sales_orders')
          .select('created_at', { count: 'exact' })
          .eq('created_by_affiliate_id', affiliate.id)
          .order('created_at', { ascending: false })
          .limit(1);

        affiliateOrdersCount = count ?? 0;
        affiliateLastOrderDate = lastOrder?.[0]?.created_at ?? null;
      }

      const contacts: ContactBO[] = (data ?? []).map(c => {
        const linkmeUser = linkmeEmailMap.get(c.email?.toLowerCase());
        // If linked to a LinkMe user, override name/phone with fresh data from v_linkme_users
        return {
          id: c.id,
          firstName: linkmeUser?.first_name ?? c.first_name,
          lastName: linkmeUser?.last_name ?? c.last_name,
          email: c.email,
          phone: linkmeUser?.phone ?? c.phone,
          mobile: c.mobile,
          title: c.title,
          isPrimaryContact: c.is_primary_contact ?? false,
          isBillingContact: c.is_billing_contact ?? false,

          isTechnicalContact: c.is_technical_contact ?? false,
          linkmeUserId: linkmeUser?.user_id ?? null,
          linkmeRole: linkmeUser?.linkme_role ?? null,
          affiliateOrdersCount: linkmeUser ? affiliateOrdersCount : null,
          affiliateLastOrderDate: linkmeUser ? affiliateLastOrderDate : null,
        };
      });

      const primaryContact = contacts.find(c => c.isPrimaryContact) ?? null;
      const billingContact = contacts.find(c => c.isBillingContact) ?? null;

      return {
        contacts,
        primaryContact,
        billingContact,
      };
    },
    enabled: !!enseigneId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Mutation pour créer un nouveau contact (organisation ou enseigne)
 */
export function useCreateContactBO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const supabase = createClient();

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          organisation_id: input.organisationId ?? null,
          enseigne_id: input.enseigneId ?? null,
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          phone: input.phone ?? null,
          title: input.title ?? null,
          is_billing_contact: input.isBillingContact ?? false,
          is_primary_contact: input.isPrimaryContact ?? false,

          is_technical_contact: input.isTechnicalContact ?? false,
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
    onSuccess: async (_, variables) => {
      if (variables.organisationId) {
        await queryClient.invalidateQueries({
          queryKey: ['organisation-contacts-bo', variables.organisationId],
        });
      }
      if (variables.enseigneId) {
        await queryClient.invalidateQueries({
          queryKey: ['enseigne-contacts-bo', variables.enseigneId],
        });
      }
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
 * Mutation pour mettre à jour un contact (tous les champs)
 */
export function useUpdateContactBO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateContactInput) => {
      const supabase = createClient();

      const { data: contact, error } = await supabase
        .from('contacts')
        .update({
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          phone: input.phone ?? null,
          title: input.title ?? null,
          is_billing_contact: input.isBillingContact ?? false,
          is_primary_contact: input.isPrimaryContact ?? false,

          is_technical_contact: input.isTechnicalContact ?? false,
        })
        .eq('id', input.contactId)
        .select('id, first_name, last_name, email')
        .single();

      if (error) {
        console.error('Erreur mise à jour contact:', error);
        throw error;
      }

      return contact;
    },
    onSuccess: async (_, variables) => {
      if (variables.organisationId) {
        await queryClient.invalidateQueries({
          queryKey: ['organisation-contacts-bo', variables.organisationId],
        });
      }
      if (variables.enseigneId) {
        await queryClient.invalidateQueries({
          queryKey: ['enseigne-contacts-bo', variables.enseigneId],
        });
      }
      toast.success('Contact mis à jour');
    },
    onError: (error: Error) => {
      console.error('Erreur mise à jour contact:', error);
      toast.error('Erreur lors de la mise à jour du contact', {
        description: error.message,
      });
    },
  });
}

/**
 * Mutation pour soft-delete un contact (is_active = false)
 */
export function useDeleteContactBO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      contactId: string;
      enseigneId?: string;
      organisationId?: string;
    }) => {
      const supabase = createClient();

      const { error } = await supabase
        .from('contacts')
        .update({ is_active: false })
        .eq('id', input.contactId);

      if (error) {
        console.error('Erreur suppression contact:', error);
        throw error;
      }

      return true;
    },
    onSuccess: async (_, variables) => {
      if (variables.organisationId) {
        await queryClient.invalidateQueries({
          queryKey: ['organisation-contacts-bo', variables.organisationId],
        });
      }
      if (variables.enseigneId) {
        await queryClient.invalidateQueries({
          queryKey: ['enseigne-contacts-bo', variables.enseigneId],
        });
      }
      toast.success('Contact supprimé');
    },
    onError: (error: Error) => {
      console.error('Erreur suppression contact:', error);
      toast.error('Erreur lors de la suppression du contact', {
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organisation-contacts-bo', variables.organisationId],
      });
    },
    onError: (error: Error) => {
      console.error('Erreur mise à jour contact:', error);
      toast.error('Erreur lors de la mise à jour du contact');
    },
  });
}
