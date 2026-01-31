/**
 * Hook: use-organisation-contacts
 * Gestion des contacts d'une organisation
 * =======================================
 * - Fetch des contacts avec leurs rôles
 * - Mise à jour des contacts (propriétaire, facturation)
 * - Création de nouveaux contacts
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

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
  isUser: boolean; // Contact lié à un utilisateur (auto-sync/backfill)
  // IDs pour filtrage UI (Phase 8.1 - franchises)
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
  billingContact: ContactFormData | null; // null = same as primary
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook pour récupérer les contacts d'une organisation
 * Retourne les contacts avec leurs rôles identifiés
 *
 * @param organisationId - ID de l'organisation
 * @param enseigneId - ID de l'enseigne (optionnel) - pour chercher aussi les contacts liés à l'enseigne
 * @param ownershipType - Type de propriété de l'organisation ('propre' | 'succursale' | 'franchise' | null)
 * @param includeEnseigneContacts - true pour inclure contacts enseigne (pour succursales uniquement)
 */
export function useOrganisationContacts(
  organisationId: string | null,
  enseigneId?: string | null,
  ownershipType?: 'propre' | 'succursale' | 'franchise' | null,
  includeEnseigneContacts?: boolean
) {
  return useQuery({
    queryKey: ['organisation-contacts', organisationId, enseigneId],
    queryFn: async () => {
      if (!organisationId && !enseigneId) return null;

      const supabase = createClient();

      // Construire la requête de base
      let query = supabase
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
          is_technical_contact,
          notes,
          organisation_id,
          enseigne_id
        `
        )
        .eq('is_active', true);

      // Filtrer selon ownership_type et mode d'affichage
      if (
        ownershipType === 'franchise' &&
        includeEnseigneContacts &&
        enseigneId &&
        organisationId
      ) {
        // FRANCHISE + Bouton cliqué : Contacts restaurant + contacts enseigne
        // Note: Le filtrage billing/delivery sera fait côté UI (contacts enseigne = responsable commande uniquement)
        query = query.or(
          `organisation_id.eq.${organisationId},enseigne_id.eq.${enseigneId}`
        );
      } else if (ownershipType === 'franchise' && organisationId) {
        // FRANCHISE (défaut) : Seulement contacts restaurant
        query = query.eq('organisation_id', organisationId);
      } else if (
        ownershipType === 'succursale' &&
        includeEnseigneContacts &&
        enseigneId &&
        organisationId
      ) {
        // SUCCURSALE + Bouton cliqué : Contacts enseigne uniquement
        query = query.or(
          `enseigne_id.eq.${enseigneId},and(organisation_id.eq.${organisationId},enseigne_id.eq.${enseigneId})`
        );
      } else if (
        ownershipType === 'succursale' &&
        enseigneId &&
        organisationId
      ) {
        // SUCCURSALE (défaut) : Contacts restaurant + partagés enseigne/restaurant
        query = query.or(
          `organisation_id.eq.${organisationId},and(organisation_id.eq.${organisationId},enseigne_id.eq.${enseigneId})`
        );
      } else if (organisationId) {
        // Fallback : seulement contacts organisation
        query = query.eq('organisation_id', organisationId);
      } else if (enseigneId) {
        // Fallback : contacts enseigne uniquement
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
        // Détecter si c'est un utilisateur (créé par auto-sync ou backfill)
        isUser:
          (c.notes?.includes('auto-sync') ?? false) ||
          (c.notes?.includes('backfill') ?? false),
        // IDs pour filtrage UI (Phase 8.1 - franchises)
        organisationId: c.organisation_id,
        enseigneId: c.enseigne_id,
      }));

      // Identifier les contacts clés
      const primaryContact = contacts.find(c => c.isPrimaryContact) ?? null;
      const billingContact = contacts.find(c => c.isBillingContact) ?? null;
      const otherContacts = contacts.filter(
        c => !c.isPrimaryContact && !c.isBillingContact
      );

      // Vérifier si les contacts sont complets
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

      // Si pas de billing distinct, le primary fait office de billing
      const hasBilling = !!billingContact || isPrimaryComplete;

      // Grouper contacts par appartenance (utiliser data brut avant mapping)
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
        allContacts: contacts, // Alias pour compatibilité avec sélection contacts existants (LM-ORD-009)
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
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
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

      // 1. Chercher le contact primaire existant
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('id, is_primary_contact, is_billing_contact')
        .eq('organisation_id', organisationId)
        .eq('is_active', true);

      const existingPrimary = existingContacts?.find(c => c.is_primary_contact);
      const existingBilling = existingContacts?.find(
        c => c.is_billing_contact && !c.is_primary_contact
      );

      // 2. Upsert le contact propriétaire
      if (existingPrimary) {
        // Mise à jour
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            first_name: primaryContact.firstName,
            last_name: primaryContact.lastName,
            email: primaryContact.email,
            phone: primaryContact.phone ?? null,
            title: primaryContact.title ?? null,
            is_billing_contact: billingContact === null, // Si pas de billing distinct, primary = billing
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPrimary.id);

        if (updateError) throw updateError;
      } else {
        // Création
        const { error: insertError } = await supabase.from('contacts').insert({
          organisation_id: organisationId,
          first_name: primaryContact.firstName,
          last_name: primaryContact.lastName,
          email: primaryContact.email,
          phone: primaryContact.phone ?? null,
          title: primaryContact.title ?? null,
          is_primary_contact: true,
          is_billing_contact: billingContact === null, // Si pas de billing distinct
          is_active: true,
        });

        if (insertError) throw insertError;
      }

      // 3. Gérer le contact facturation si différent du propriétaire
      if (billingContact !== null) {
        if (existingBilling) {
          // Mise à jour du contact facturation existant
          const { error: updateError } = await supabase
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

          if (updateError) throw updateError;
        } else {
          // Création du contact facturation
          const { error: insertError } = await supabase
            .from('contacts')
            .insert({
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

          if (insertError) throw insertError;
        }

        // Retirer le flag billing du primary s'il l'avait
        if (existingPrimary) {
          await supabase
            .from('contacts')
            .update({ is_billing_contact: false })
            .eq('id', existingPrimary.id);
        }
      } else {
        // Billing = Primary, supprimer l'ancien billing s'il existait
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

/**
 * Hook pour créer des contacts lors de la création d'une organisation
 * Utilisé lors de l'approbation d'une commande avec nouveau restaurant
 */
export function useCreateOrganisationContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      organisationId: string;
      primaryContact: ContactFormData;
      billingContact: ContactFormData | null;
    }) => {
      const supabase = createClient();
      const { organisationId, primaryContact, billingContact } = input;

      // Créer le contact propriétaire
      const { error: primaryError } = await supabase.from('contacts').insert({
        organisation_id: organisationId,
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

      // Créer le contact facturation si différent
      if (billingContact !== null) {
        const { error: billingError } = await supabase.from('contacts').insert({
          organisation_id: organisationId,
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
