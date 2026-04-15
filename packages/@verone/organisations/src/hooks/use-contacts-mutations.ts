'use client';

/**
 * Mutations (create/update/delete) pour les contacts d'organisations
 */

import { useState, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';

import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import type {
  Contact,
  CreateContactData,
  UpdateContactData,
} from './use-contacts';

const CONTACT_SELECT = `
  *,
  organisation:organisations (
    id,
    legal_name,
    type,
    customer_type
  ),
  enseigne:enseignes (
    id,
    name
  )
`;

export function useContactsMutations(
  fetchContacts: (filters?: {
    organisation_id?: string;
    is_active?: boolean;
    search?: string;
  }) => Promise<void>,
  currentContactId: string | null,
  setCurrentContact: (contact: Contact | null) => void
) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const createContact = useCallback(
    async (data: CreateContactData) => {
      setLoading(true);
      try {
        const user = await supabase.auth.getUser();

        const cleanData = {
          ...data,
          phone: data.phone?.trim() ? data.phone.trim() : null,
          mobile: data.mobile?.trim() ? data.mobile.trim() : null,
          secondary_email: data.secondary_email?.trim()
            ? data.secondary_email.trim()
            : null,
          direct_line: data.direct_line?.trim()
            ? data.direct_line.trim()
            : null,
          title: data.title?.trim() ? data.title.trim() : null,
          department: data.department?.trim() ? data.department.trim() : null,
          notes: data.notes?.trim() ? data.notes.trim() : null,
        };

        const insertData = {
          ...cleanData,
          created_by: user.data.user?.id,
        };

        logger.info('Création contact en cours', {
          operation: 'create_contact',
          resource: 'contacts',
          userId: user.data.user?.id,
          organisationId: data.organisation_id,
        });

        const { data: contact, error } = await supabase
          .from('contacts')
          .insert(insertData)
          .select(CONTACT_SELECT)
          .single();

        if (error) {
          logger.error(
            'Erreur Supabase création contact',
            new Error(error.message),
            {
              operation: 'create_contact',
              resource: 'contacts',
              errorCode: error.code,
              organisationId: data.organisation_id,
            }
          );
          throw error;
        }

        logger.info('Contact créé avec succès', {
          operation: 'create_contact_success',
          resource: 'contacts',
          contactId: contact.id,
          organisationId: data.organisation_id,
        });

        toast({
          title: 'Succès',
          description: `Contact ${data.first_name} ${data.last_name} créé avec succès`,
        });

        await fetchContacts();
        return contact;
      } catch (error: unknown) {
        const err = error as {
          code?: string;
          details?: string;
          hint?: string;
          message?: string;
        };
        logger.error(
          'Erreur création contact',
          error instanceof Error ? error : new Error(String(error)),
          {
            operation: 'create_contact_failed',
            resource: 'contacts',
            errorCode: err.code,
            errorDetails: err.details,
            errorHint: err.hint,
            organisationId: data.organisation_id,
          }
        );

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Impossible de créer le contact';
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchContacts]
  );

  const updateContact = useCallback(
    async (contactId: string, data: UpdateContactData) => {
      setLoading(true);
      try {
        const { data: contact, error } = await supabase
          .from('contacts')
          .update(data)
          .eq('id', contactId)
          .select(CONTACT_SELECT)
          .single();

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Contact mis à jour avec succès',
        });

        await fetchContacts();
        if (currentContactId === contactId) {
          setCurrentContact(contact as Contact);
        }
        return contact as Contact;
      } catch (error: unknown) {
        logger.error(
          'Erreur mise à jour contact',
          error instanceof Error ? error : new Error(String(error)),
          {
            operation: 'update_contact',
            resource: 'contacts',
            contactId,
          }
        );
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Impossible de mettre à jour le contact';
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchContacts, currentContactId, setCurrentContact]
  );

  const deleteContact = useCallback(
    async (contactId: string) => {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', contactId);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Contact supprimé définitivement',
        });

        await fetchContacts();
        if (currentContactId === contactId) {
          setCurrentContact(null);
        }
      } catch (error: unknown) {
        logger.error(
          'Erreur suppression contact',
          error instanceof Error ? error : new Error(String(error)),
          {
            operation: 'delete_contact',
            resource: 'contacts',
            contactId,
          }
        );
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Impossible de supprimer le contact';
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchContacts, currentContactId, setCurrentContact]
  );

  // Shortcuts utilisant updateContact
  const deactivateContact = useCallback(
    (contactId: string) => updateContact(contactId, { is_active: false }),
    [updateContact]
  );

  const activateContact = useCallback(
    (contactId: string) => updateContact(contactId, { is_active: true }),
    [updateContact]
  );

  const setPrimaryContact = useCallback(
    (contactId: string) =>
      updateContact(contactId, { is_primary_contact: true }),
    [updateContact]
  );

  const updateLastContactDate = useCallback(
    (contactId: string) =>
      updateContact(contactId, {
        last_contact_date: new Date().toISOString(),
      } as UpdateContactData),
    [updateContact]
  );

  return {
    loading,
    createContact,
    updateContact,
    deactivateContact,
    activateContact,
    setPrimaryContact,
    updateLastContactDate,
    deleteContact,
  };
}
