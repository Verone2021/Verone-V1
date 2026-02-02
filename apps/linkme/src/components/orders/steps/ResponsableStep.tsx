'use client';

/**
 * ResponsableStep - Etape 5 du formulaire de commande
 *
 * Contact responsable de la commande avec layout split-screen:
 * - Gauche (50%): Formulaire / Contacts locaux de l'organisation
 * - Droite (50%): Contacts de l'enseigne (toujours visibles)
 *
 * @module ResponsableStep
 * @since 2026-01-24
 */

import { useState, useCallback, useMemo } from 'react';

import { Card, Input, Label, cn } from '@verone/ui';
import { User, Building2, Plus, Check, AlertCircle } from 'lucide-react';

import { useEnseigneId } from '@/lib/hooks/use-enseigne-id';
import { useOrganisationContacts } from '@/lib/hooks/use-organisation-contacts';
import type { OrganisationContact } from '@/lib/hooks/use-organisation-contacts';

import type {
  OrderFormData,
  ContactsStepData,
  ContactBase,
} from '../schemas/order-form.schema';
import { defaultContact } from '../schemas/order-form.schema';
import { ContactCard } from './contacts/ContactCard';

// ============================================================================
// TYPES
// ============================================================================

interface ResponsableStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<ContactsStepData>) => void;
}

// ============================================================================
// SUB-COMPONENT: Contact Form (inline)
// ============================================================================

interface ContactFormProps {
  contact: ContactBase;
  onChange: (field: keyof ContactBase, value: string) => void;
  showCompany?: boolean;
}

function ContactForm({
  contact,
  onChange,
  showCompany = false,
}: ContactFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="responsable-firstName">
          Prenom <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsable-firstName"
          type="text"
          value={contact.firstName}
          onChange={e => onChange('firstName', e.target.value)}
          placeholder="Jean"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsable-lastName">
          Nom <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsable-lastName"
          type="text"
          value={contact.lastName}
          onChange={e => onChange('lastName', e.target.value)}
          placeholder="Dupont"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsable-email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsable-email"
          type="email"
          value={contact.email}
          onChange={e => onChange('email', e.target.value)}
          placeholder="jean.dupont@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsable-phone">Telephone</Label>
        <Input
          id="responsable-phone"
          type="tel"
          value={contact.phone ?? ''}
          onChange={e => onChange('phone', e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsable-position">Fonction</Label>
        <Input
          id="responsable-position"
          type="text"
          value={contact.position ?? ''}
          onChange={e => onChange('position', e.target.value)}
          placeholder="Directeur, Gerant..."
        />
      </div>

      {showCompany && (
        <div className="space-y-2">
          <Label htmlFor="responsable-company">Societe</Label>
          <Input
            id="responsable-company"
            type="text"
            value={contact.company ?? ''}
            onChange={e => onChange('company', e.target.value)}
            placeholder="Nom de la societe"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: Create New Card
// ============================================================================

interface CreateNewCardProps {
  onClick: () => void;
  isActive: boolean;
}

function CreateNewCard({ onClick, isActive }: CreateNewCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
        isActive
          ? 'border-2 border-blue-500 bg-blue-50/50'
          : 'hover:border-gray-400'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
        <Plus
          className={cn(
            'h-5 w-5',
            isActive ? 'text-blue-500' : 'text-gray-400'
          )}
        />
        <span
          className={cn(
            'font-medium text-sm',
            isActive ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          Nouveau contact
        </span>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ResponsableStep({
  formData,
  errors: _errors,
  onUpdate,
}: ResponsableStepProps) {
  const [showForm, setShowForm] = useState(
    !formData.contacts.existingResponsableId
  );

  // Get enseigne ID
  const enseigneId = useEnseigneId();

  // Get organisation ID (restaurant selectionne)
  const organisationId =
    formData.restaurant.mode === 'existing'
      ? (formData.restaurant.existingId ?? null)
      : null;

  // Determine ownership type
  const ownershipType = useMemo(() => {
    if (formData.restaurant.mode === 'new') {
      return formData.restaurant.newRestaurant?.ownershipType ?? null;
    }
    return formData.restaurant.existingOwnershipType ?? null;
  }, [formData.restaurant]);

  // Is franchise?
  const isFranchise = ownershipType === 'franchise';

  // Fetch organisation contacts (toujours avec enseigne pour cette etape)
  const { data: contactsData, isLoading } = useOrganisationContacts(
    organisationId,
    enseigneId ?? null,
    ownershipType,
    true // Toujours inclure les contacts enseigne pour l'etape responsable
  );

  // Separate local and enseigne contacts
  const allContacts = useMemo(() => {
    return contactsData?.allContacts ?? [];
  }, [contactsData]);

  const localContacts = useMemo(() => {
    return allContacts.filter(c => c.organisationId === organisationId);
  }, [allContacts, organisationId]);

  const enseigneContacts = useMemo(() => {
    return allContacts.filter(c => c.organisationId !== organisationId);
  }, [allContacts, organisationId]);

  // Check if responsable is complete
  const isComplete = useMemo(() => {
    const r = formData.contacts.responsable;
    return (
      r.firstName.length >= 2 && r.lastName.length >= 2 && r.email.includes('@')
    );
  }, [formData.contacts.responsable]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleContactChange = useCallback(
    (field: keyof ContactBase, value: string) => {
      onUpdate({
        responsable: {
          ...formData.contacts.responsable,
          [field]: value,
        },
      });
    },
    [formData.contacts.responsable, onUpdate]
  );

  const handleContactSelect = useCallback(
    (contact: OrganisationContact) => {
      onUpdate({
        existingResponsableId: contact.id,
        responsable: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone ?? contact.mobile ?? '',
          position: contact.title ?? '',
        },
      });
      setShowForm(false);
    },
    [onUpdate]
  );

  const handleCreateNew = useCallback(() => {
    setShowForm(true);
    onUpdate({
      existingResponsableId: null,
      responsable: defaultContact,
    });
  }, [onUpdate]);

  return (
    <div className="space-y-6">
      {/* Header avec indicateur de completion */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isComplete
              ? 'bg-green-100 text-green-600'
              : 'bg-blue-100 text-blue-600'
          )}
        >
          {isComplete ? (
            <Check className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            Contact Responsable de la Commande
            <span className="text-red-500 ml-1">*</span>
          </h3>
          <p className="text-sm text-gray-500">
            Personne principale a contacter pour cette commande
          </p>
        </div>
      </div>

      {/* Layout Split-Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GAUCHE : Formulaire + Contacts locaux */}
        <Card className="p-5 space-y-6">
          {/* Titre section */}
          <div className="flex items-center gap-2 pb-3 border-b">
            <User className="h-4 w-4 text-gray-500" />
            <h4 className="font-medium text-gray-700">
              {localContacts.length > 0
                ? 'Contacts du restaurant'
                : 'Nouveau contact'}
            </h4>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          )}

          {/* Grille de contacts locaux */}
          {!isLoading && localContacts.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {localContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  isSelected={
                    formData.contacts.existingResponsableId === contact.id &&
                    !showForm
                  }
                  onClick={() => handleContactSelect(contact)}
                />
              ))}
              <CreateNewCard onClick={handleCreateNew} isActive={showForm} />
            </div>
          )}

          {/* Formulaire si mode creation ou pas de contacts */}
          {!isLoading && (showForm || localContacts.length === 0) && (
            <div className={localContacts.length > 0 ? 'pt-4 border-t' : ''}>
              {localContacts.length > 0 && (
                <h5 className="text-sm font-medium text-gray-700 mb-4">
                  Nouveau contact
                </h5>
              )}
              <ContactForm
                contact={formData.contacts.responsable}
                onChange={handleContactChange}
                showCompany={isFranchise}
              />
            </div>
          )}
        </Card>

        {/* DROITE : Contacts Enseigne (toujours visibles) */}
        <Card className="p-5">
          <div className="flex items-center gap-2 pb-3 border-b mb-4">
            <Building2 className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-700">
              Contacts de l&apos;Enseigne
            </h4>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          )}

          {/* Contacts enseigne */}
          {!isLoading && enseigneContacts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {enseigneContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  isSelected={
                    formData.contacts.existingResponsableId === contact.id &&
                    !showForm
                  }
                  onClick={() => handleContactSelect(contact)}
                />
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucun contact enseigne disponible</p>
                <p className="text-xs text-gray-400 mt-1">
                  Les contacts enseigne seront affiches ici s&apos;ils existent
                </p>
              </div>
            )
          )}

          {/* Info pour franchises */}
          {isFranchise && enseigneContacts.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  En tant que franchise, vous pouvez selectionner un contact
                  enseigne comme responsable de commande. Les contacts
                  facturation et livraison devront etre des contacts locaux.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Info section */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Information</p>
            <p className="mt-1">
              Le contact responsable sera le point de contact principal pour
              toutes les communications concernant cette commande.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResponsableStep;
