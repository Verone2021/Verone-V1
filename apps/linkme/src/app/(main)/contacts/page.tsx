'use client';

/**
 * Page Contacts LinkMe
 *
 * Affiche tous les contacts accessibles selon le rôle :
 * - enseigne_admin : Contacts de l'enseigne + utilisateurs de l'enseigne
 * - organisation_admin : Contacts de l'organisation + utilisateurs de l'organisation
 *
 * @module contacts/page
 * @since 2026-02-04
 */

import { useState } from 'react';

import { Button, Card } from '@verone/ui';
import { Plus, Users, Loader2, Building2 } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { CreateEnseigneContactModal } from '@/components/organisations/CreateEnseigneContactModal';
import { useOrganisationContacts } from '@/lib/hooks/use-organisation-contacts';
import { ContactDisplayCard } from '@/components/contacts/ContactDisplayCard';

// ============================================================================
// COMPONENT
// ============================================================================

export default function ContactsPage() {
  const { linkMeRole } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Déterminer les IDs selon le rôle
  const enseigneId = linkMeRole?.enseigne_id ?? null;
  const organisationId = linkMeRole?.organisation_id ?? null;

  // Fetch contacts selon le rôle
  // - enseigne_admin : Contacts de l'enseigne (enseigneId set, organisationId null)
  // - organisation_admin : Contacts de l'organisation (organisationId set, enseigneId null)
  const { data: contactsData, isLoading } = useOrganisationContacts(
    organisationId,
    enseigneId,
    null,
    true // Inclure tous les contacts accessibles
  );

  const contacts = contactsData?.contacts ?? [];

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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Titre selon le rôle
  const pageTitle =
    linkMeRole.role === 'enseigne_admin'
      ? "Contacts de l'Enseigne"
      : 'Mes Contacts';

  const pageDescription =
    linkMeRole.role === 'enseigne_admin'
      ? 'Contacts disponibles pour tous les restaurants propres (succursales)'
      : 'Contacts de votre organisation et utilisateurs';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-linkme-turquoise" />
            {pageTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-2">{pageDescription}</p>
          {linkMeRole.enseigne_name && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              <span>{linkMeRole.enseigne_name}</span>
            </div>
          )}
          {linkMeRole.organisation_name && !linkMeRole.enseigne_name && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              <span>{linkMeRole.organisation_name}</span>
            </div>
          )}
        </div>

        {/* Bouton création - uniquement pour enseigne_admin */}
        {linkMeRole.role === 'enseigne_admin' && enseigneId && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un contact
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Total Contacts</p>
            <p className="text-2xl font-bold text-gray-900">
              {contacts.length}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Facturation</p>
            <p className="text-2xl font-bold text-blue-600">
              {contacts.filter(c => c.isBillingContact).length}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Commercial</p>
            <p className="text-2xl font-bold text-green-600">
              {contacts.filter(c => c.isCommercialContact).length}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Technique</p>
            <p className="text-2xl font-bold text-purple-600">
              {contacts.filter(c => c.isTechnicalContact).length}
            </p>
          </div>
        </div>
      </Card>

      {/* Contact Grid */}
      {contacts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
          <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Aucun contact
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            {linkMeRole.role === 'enseigne_admin'
              ? 'Les contacts enseigne sont partagés avec tous les restaurants propres. Ajoutez un contact pour commencer.'
              : 'Aucun contact trouvé pour votre organisation.'}
          </p>
          {linkMeRole.role === 'enseigne_admin' && enseigneId && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer le premier contact
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(contact => (
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
