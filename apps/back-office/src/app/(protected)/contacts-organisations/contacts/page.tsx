'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

import {
  useContacts,
  getOrganisationDisplayName,
  type Organisation,
} from '@verone/organisations';
import { ButtonV2 } from '@verone/ui';
import { ArrowLeft, Plus } from 'lucide-react';

import { ContactsFilters } from './ContactsFilters';
import { ContactsInfo } from './ContactsInfo';
import { ContactsStats } from './ContactsStats';
import { ContactsTable } from './ContactsTable';
import type { Contact, ContactStats, FilterRole, FilterType } from './types';

export default function ContactsPage() {
  const {
    contacts,
    loading,
    fetchContacts,
    deactivateContact,
    activateContact,
    deleteContact,
  } = useContacts();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');

  useEffect(() => {
    void fetchContacts().catch(error => {
      console.error('[ContactsPage] fetchContacts failed:', error);
    });
  }, [fetchContacts]);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch =
      contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.organisation &&
        getOrganisationDisplayName(contact.organisation as Organisation)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesType =
      filterType === 'all' ||
      (filterType === 'supplier' &&
        contact.organisation?.type === 'supplier') ||
      (filterType === 'customer' && contact.organisation?.type === 'customer');

    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Intentional boolean OR for filter conditions */
    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'primary' && contact.is_primary_contact) ||
      (filterRole === 'commercial' && contact.is_commercial_contact) ||
      (filterRole === 'technical' && contact.is_technical_contact) ||
      (filterRole === 'billing' && contact.is_billing_contact);
    /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */

    return matchesSearch && matchesType && matchesRole;
  });

  const stats: ContactStats = {
    totalContacts: contacts.length,
    supplierContacts: contacts.filter(c => c.organisation?.type === 'supplier')
      .length,
    customerContacts: contacts.filter(c => c.organisation?.type === 'customer')
      .length,
    primaryContacts: contacts.filter(c => c.is_primary_contact).length,
    activeContacts: contacts.filter(c => c.is_active).length,
  };

  const handleArchive = async (contact: Contact) => {
    try {
      if (contact.is_active) {
        await deactivateContact(contact.id);
      } else {
        await activateContact(contact.id);
      }
    } catch (error: unknown) {
      console.error('[ContactsPage] handleArchive failed:', error);
    }
  };

  const handleDelete = async (contact: Contact) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${contact.first_name} ${contact.last_name}" ?\n\nCette action est irréversible !`
    );
    if (confirmed) {
      try {
        await deleteContact(contact.id);
      } catch (error: unknown) {
        console.error('[ContactsPage] handleDelete failed:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations">
              <ButtonV2 variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Organisations
              </ButtonV2>
            </Link>
          </div>
          <h1 className="text-3xl font-semibold text-black">Contacts</h1>
          <p className="text-gray-600 mt-2">
            Gestion centralisée des contacts fournisseurs et clients
            professionnels
          </p>
        </div>
        <Link href="/contacts-organisations/enseignes">
          <ButtonV2 className="bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau contact
          </ButtonV2>
        </Link>
      </div>

      <ContactsStats stats={stats} />

      <ContactsFilters
        searchTerm={searchTerm}
        filterType={filterType}
        filterRole={filterRole}
        onSearchChange={setSearchTerm}
        onFilterTypeChange={setFilterType}
        onFilterRoleChange={setFilterRole}
      />

      <ContactsTable
        contacts={filteredContacts}
        loading={loading}
        searchTerm={searchTerm}
        filterType={filterType}
        filterRole={filterRole}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      <ContactsInfo />
    </div>
  );
}
