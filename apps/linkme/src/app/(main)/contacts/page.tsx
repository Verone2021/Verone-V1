'use client';

/**
 * Page Contacts LinkMe
 *
 * Répertoire des contacts enseigne avec badges de rôle colorés.
 * Barre de recherche + filtre Utilisateurs/Contacts.
 *
 * @module contacts/page
 * @since 2026-02-04
 */

import { useState, useMemo } from 'react';

import { Button, Input } from '@verone/ui';
import { Plus, Users, Loader2, Building2, Search } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { CreateEnseigneContactModal } from '@/components/organisations/CreateEnseigneContactModal';
import { useOrganisationContacts } from '@/lib/hooks/use-organisation-contacts';
import { ContactDisplayCard } from '@/components/contacts/ContactDisplayCard';

// ============================================================================
// TYPES
// ============================================================================

type ContactFilter = 'all' | 'users' | 'contacts';

const FILTER_OPTIONS: { value: ContactFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'users', label: 'Utilisateurs' },
  { value: 'contacts', label: 'Contacts' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ContactsPage() {
  const { linkMeRole } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ContactFilter>('all');

  // Déterminer les IDs selon le rôle
  const enseigneId = linkMeRole?.enseigne_id ?? null;
  const organisationId = linkMeRole?.organisation_id ?? null;

  // Fetch contacts selon le rôle
  const { data: contactsData, isLoading } = useOrganisationContacts(
    organisationId,
    enseigneId,
    null,
    true
  );

  const contacts = contactsData?.contacts ?? [];

  // Filtrage et recherche
  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Filtre utilisateur/contact
    if (filter === 'users') {
      result = result.filter(c => c.isUser);
    } else if (filter === 'contacts') {
      result = result.filter(c => !c.isUser);
    }

    // Recherche texte
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        c =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.title?.toLowerCase().includes(q) ?? false)
      );
    }

    return result;
  }, [contacts, filter, search]);

  // Compteurs pour les filtres
  const userCount = useMemo(
    () => contacts.filter(c => c.isUser).length,
    [contacts]
  );
  const contactOnlyCount = contacts.length - userCount;

  // Protection : Rediriger si pas de rôle
  if (!linkMeRole) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Nom de l'entité
  const entityName =
    linkMeRole.enseigne_name ?? linkMeRole.organisation_name ?? '';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-linkme-marine">
            <Users className="h-5 w-5 text-linkme-turquoise" />
            Contacts
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
            <Building2 className="h-3.5 w-3.5" />
            <span>
              {entityName}
              {contacts.length > 0 && (
                <>
                  {' '}
                  &middot; {contacts.length} contact
                  {contacts.length > 1 ? 's' : ''}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Bouton création — uniquement pour enseigne_admin */}
        {linkMeRole.role === 'enseigne_admin' && enseigneId && (
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-linkme-turquoise hover:bg-linkme-turquoise/90 text-white"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Barre de recherche + filtres */}
      {contacts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Rechercher un contact..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {FILTER_OPTIONS.map(opt => {
              const count =
                opt.value === 'all'
                  ? contacts.length
                  : opt.value === 'users'
                    ? userCount
                    : contactOnlyCount;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    filter === opt.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                  <span className="ml-1 text-gray-400">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact Grid / Empty State */}
      {contacts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
          <Users className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Aucun contact
          </h3>
          <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
            {linkMeRole.role === 'enseigne_admin'
              ? 'Les contacts enseigne sont partagés avec tous vos restaurants.'
              : 'Aucun contact trouvé pour votre organisation.'}
          </p>
          {linkMeRole.role === 'enseigne_admin' && enseigneId && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Ajouter un contact
            </Button>
          )}
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-500">
            Aucun contact ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredContacts.map(contact => (
            <ContactDisplayCard
              key={contact.id}
              contact={contact}
              enseigneId={enseigneId}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && enseigneId && (
        <CreateEnseigneContactModal
          enseigneId={enseigneId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
