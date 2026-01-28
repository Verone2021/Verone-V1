'use client';

/**
 * EnseigneContactsTab
 *
 * Onglet de gestion des contacts de l'enseigne
 * Visible uniquement pour les enseignes parentes (is_enseigne_parent = true)
 * Permet de créer et gérer les contacts partagés avec les succursales
 *
 * @module EnseigneContactsTab
 * @since 2026-01-21
 */

import { useState } from 'react';

import { Button, Card } from '@verone/ui';
import { Plus, Users, Loader2 } from 'lucide-react';

import { CreateEnseigneContactModal } from './CreateEnseigneContactModal';
import { useOrganisationContacts } from '../../lib/hooks/use-organisation-contacts';
import { ContactDisplayCard } from '../contacts/ContactDisplayCard';

// ============================================================================
// TYPES
// ============================================================================

interface EnseigneContactsTabProps {
  /** ID de l'enseigne */
  enseigneId: string;
  /** ID de l'organisation parente (pour création contacts) */
  parentOrgId: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EnseigneContactsTab({
  enseigneId,
  parentOrgId: _parentOrgId,
}: EnseigneContactsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch enseigne contacts (enseigne_id set, organisation_id NULL ou shared)
  const { data: contactsData, isLoading } = useOrganisationContacts(
    null, // No specific org
    enseigneId,
    null, // No ownership filter
    true // Include enseigne contacts
  );

  const enseigneContacts = contactsData?.contacts ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-linkme-turquoise" />
            Contacts de l&apos;Enseigne
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Contacts disponibles pour tous les restaurants propres (succursales)
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un contact
        </Button>
      </div>

      {/* Stats Cards */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Total Contacts</p>
            <p className="text-2xl font-bold text-gray-900">
              {enseigneContacts.length}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Facturation</p>
            <p className="text-2xl font-bold text-blue-600">
              {enseigneContacts.filter(c => c.isBillingContact).length}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Commercial</p>
            <p className="text-2xl font-bold text-green-600">
              {enseigneContacts.filter(c => c.isCommercialContact).length}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Technique</p>
            <p className="text-2xl font-bold text-purple-600">
              {enseigneContacts.filter(c => c.isTechnicalContact).length}
            </p>
          </div>
        </div>
      </Card>

      {/* Contact Grid */}
      {enseigneContacts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
          <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Aucun contact enseigne
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Les contacts enseigne sont partagés avec tous les restaurants
            propres. Ajoutez un contact pour commencer.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer le premier contact
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enseigneContacts.map(contact => (
            <ContactDisplayCard
              key={contact.id}
              contact={contact}
              enseigneId={enseigneId}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateEnseigneContactModal
          enseigneId={enseigneId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

export default EnseigneContactsTab;
