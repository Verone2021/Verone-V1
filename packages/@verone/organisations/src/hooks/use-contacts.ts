'use client';

/**
 * Hook pour la gestion des contacts d'organisations
 * Spécialement pour fournisseurs et clients professionnels
 */

import { useState, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import type { Contact as BaseContact } from '@verone/types';

import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import { useContactsMutations } from './use-contacts-mutations';

// Contact étendu avec jointures organisation + enseigne
export interface Contact extends BaseContact {
  organisation?: {
    id: string;
    legal_name: string;
    type: string;
    customer_type?: string;
  };
  enseigne?: {
    id: string;
    name: string;
  };
}

export interface CreateContactData {
  organisation_id: string;
  first_name: string;
  last_name: string;
  title?: string;
  department?: string;
  email: string;
  phone?: string;
  mobile?: string;
  secondary_email?: string;
  direct_line?: string;
  is_primary_contact?: boolean;
  is_billing_contact?: boolean;
  is_technical_contact?: boolean;
  preferred_communication_method?: 'email' | 'phone' | 'both';
  accepts_marketing?: boolean;
  accepts_notifications?: boolean;
  language_preference?: string;
  notes?: string;
}

export interface UpdateContactData {
  first_name?: string;
  last_name?: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  secondary_email?: string;
  direct_line?: string;
  is_primary_contact?: boolean;
  is_billing_contact?: boolean;
  is_technical_contact?: boolean;
  preferred_communication_method?: 'email' | 'phone' | 'both';
  accepts_marketing?: boolean;
  accepts_notifications?: boolean;
  language_preference?: string;
  notes?: string;
  is_active?: boolean;
  last_contact_date?: string;
}

interface ContactFilters {
  organisation_id?: string;
  is_primary_contact?: boolean;
  is_billing_contact?: boolean;
  is_technical_contact?: boolean;
  is_active?: boolean;
  search?: string;
}

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

export function useContacts() {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchContacts = useCallback(
    async (filters?: ContactFilters) => {
      setLoading(true);
      try {
        let query = supabase
          .from('contacts')
          .select(CONTACT_SELECT)
          .order('organisation_id', { ascending: true })
          .order('is_primary_contact', { ascending: false })
          .order('last_name', { ascending: true });

        if (filters?.organisation_id) {
          query = query.eq('organisation_id', filters.organisation_id);
        }
        if (filters?.is_primary_contact !== undefined) {
          query = query.eq('is_primary_contact', filters.is_primary_contact);
        }
        if (filters?.is_billing_contact !== undefined) {
          query = query.eq('is_billing_contact', filters.is_billing_contact);
        }
        if (filters?.is_technical_contact !== undefined) {
          query = query.eq(
            'is_technical_contact',
            filters.is_technical_contact
          );
        }
        if (filters?.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active);
        }
        if (filters?.search) {
          query = query.or(
            `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
          );
        }

        const { data, error } = await query;

        if (error) throw error;

        setContacts((data as Contact[]) ?? []);
      } catch (error) {
        logger.error(
          'Erreur récupération contacts',
          error instanceof Error ? error : new Error(String(error)),
          {
            operation: 'fetch_contacts',
            resource: 'contacts',
            filtersApplied: !!filters,
          }
        );
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les contacts',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  const fetchContact = useCallback(
    async (contactId: string) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select(CONTACT_SELECT)
          .eq('id', contactId)
          .single();

        if (error) throw error;

        setCurrentContact(data as Contact);
        return data as Contact;
      } catch (error) {
        logger.error(
          'Erreur récupération contact',
          error instanceof Error ? error : new Error(String(error)),
          {
            operation: 'fetch_contact',
            resource: 'contacts',
            contactId,
          }
        );
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer le contact',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  const fetchOrganisationContacts = useCallback(
    async (organisationId: string) => {
      return fetchContacts({
        organisation_id: organisationId,
        is_active: true,
      });
    },
    [fetchContacts]
  );

  const fetchPrimaryContact = useCallback(
    async (organisationId: string) => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select(CONTACT_SELECT)
          .eq('organisation_id', organisationId)
          .eq('is_primary_contact', true)
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        return data ?? null;
      } catch (error) {
        logger.error(
          'Erreur récupération contact principal',
          error instanceof Error ? error : new Error(String(error)),
          {
            operation: 'fetch_primary_contact',
            resource: 'contacts',
            organisationId,
          }
        );
        return null;
      }
    },
    [supabase]
  );

  const mutations = useContactsMutations(
    fetchContacts,
    currentContact?.id ?? null,
    setCurrentContact
  );

  // Utilitaires
  const getContactFullName = useCallback((contact: Contact) => {
    return `${contact.first_name} ${contact.last_name}`;
  }, []);

  const getContactDisplayEmail = useCallback((contact: Contact) => {
    return `${contact.first_name} ${contact.last_name} <${contact.email}>`;
  }, []);

  const getContactRoles = useCallback((contact: Contact) => {
    const roles: string[] = [];
    if (contact.is_primary_contact) roles.push('Responsable');
    if (contact.is_billing_contact) roles.push('Facturation');
    if (contact.is_technical_contact) roles.push('Technique');
    const rolesStr = roles.join(', ');
    return rolesStr.length > 0 ? rolesStr : 'Aucun rôle';
  }, []);

  const isLoading = loading || mutations.loading;

  return {
    // État
    loading: isLoading,
    contacts,
    currentContact,

    // Queries
    fetchContacts,
    fetchContact,
    fetchOrganisationContacts,
    fetchPrimaryContact,

    // Mutations (destructured explicitly to avoid loading collision)
    createContact: mutations.createContact,
    updateContact: mutations.updateContact,
    deactivateContact: mutations.deactivateContact,
    activateContact: mutations.activateContact,
    setPrimaryContact: mutations.setPrimaryContact,
    updateLastContactDate: mutations.updateLastContactDate,
    deleteContact: mutations.deleteContact,

    // Utilitaires
    getContactFullName,
    getContactDisplayEmail,
    getContactRoles,
    setCurrentContact,
  };
}
