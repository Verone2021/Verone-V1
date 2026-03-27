'use client';

/**
 * ResponsableStep - Etape 5 du formulaire UTILISATEUR de commande
 *
 * Pour les restaurants propres/succursales : affiche les contacts de l'enseigne
 * en cartes selectionnables + formulaire de saisie manuelle.
 * Pour les franchises (nouveau restaurant) : saisie manuelle uniquement.
 *
 * @module ResponsableStep
 * @since 2026-01-24
 * @updated 2026-03-27 - Ajout contacts enseigne pour restaurants propres
 */

import { useMemo, useCallback } from 'react';

import { Card, Input, Label, cn } from '@verone/ui';
import { User, Check, AlertCircle, Mail, Phone } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useOrganisationContacts } from '@/lib/hooks/use-organisation-contacts';

import type {
  OrderFormData,
  ContactsStepData,
  ContactBase,
} from '../schemas/order-form.schema';

// ============================================================================
// TYPES
// ============================================================================

interface ResponsableStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<ContactsStepData>) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ResponsableStep({
  formData,
  errors: _errors,
  onUpdate,
}: ResponsableStepProps) {
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id ?? null;

  // Determine ownership type
  const ownershipType =
    formData.restaurant.mode === 'existing'
      ? formData.restaurant.existingOwnershipType
      : formData.restaurant.newRestaurant?.ownershipType;

  // succursale = restaurant propre de l'enseigne
  const isSuccursale = ownershipType === 'succursale';
  const isFranchise = ownershipType === 'franchise';

  // Load contacts: enseigne contacts for succursales, org contacts for franchises
  const organisationId =
    formData.restaurant.mode === 'existing'
      ? (formData.restaurant.existingId ?? null)
      : null;

  const { data: contactsData } = useOrganisationContacts(
    organisationId,
    enseigneId ?? null,
    (ownershipType as 'succursale' | 'franchise' | null) ?? null,
    true // include enseigne contacts
  );

  // For succursales: show enseigne contacts
  // For franchises with existing restaurant: show org contacts
  const availableContacts = useMemo(() => {
    if (!contactsData) return [];
    if (isSuccursale) {
      // Enseigne contacts (shared across all propre restaurants)
      return (contactsData.allContacts ?? []).filter(
        c => c.enseigneId && !c.organisationId
      );
    }
    if (isFranchise && organisationId) {
      // Organisation contacts (specific to the franchise restaurant)
      return (contactsData.allContacts ?? []).filter(
        c => c.organisationId === organisationId
      );
    }
    return [];
  }, [isSuccursale, isFranchise, organisationId, contactsData]);

  // Check if responsable is complete
  const isComplete = useMemo(() => {
    const r = formData.contacts.responsable;
    return (
      r.firstName.length >= 2 &&
      r.lastName.length >= 2 &&
      r.email.includes('@') &&
      (r.phone?.length ?? 0) > 0
    );
  }, [formData.contacts.responsable]);

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

  const handleSelectContact = useCallback(
    (c: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      title: string | null;
    }) => {
      onUpdate({
        responsable: {
          ...formData.contacts.responsable,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone ?? '',
          position: c.title ?? '',
        },
      });
    },
    [formData.contacts.responsable, onUpdate]
  );

  const contact = formData.contacts.responsable;

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <span className="text-gray-400 text-sm font-normal ml-2">
              (optionnel)
            </span>
          </h3>
          <p className="text-sm text-gray-500">
            Personne principale a contacter pour cette commande
          </p>
        </div>
      </div>

      {/* Contacts enseigne (propre/succursale only) */}
      {availableContacts.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Contacts de l&apos;enseigne
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableContacts.map(c => {
              const isSelected =
                contact.email === c.email && contact.firstName === c.firstName;
              return (
                <Card
                  key={c.id}
                  className={cn(
                    'p-3 cursor-pointer transition-all hover:shadow-md',
                    isSelected
                      ? 'border-2 border-purple-500 bg-purple-50/50'
                      : 'hover:border-gray-300'
                  )}
                  onClick={() => handleSelectContact(c)}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                        isSelected ? 'bg-purple-100' : 'bg-gray-100'
                      )}
                    >
                      <User
                        className={cn(
                          'h-4 w-4',
                          isSelected ? 'text-purple-600' : 'text-gray-500'
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {c.firstName} {c.lastName}
                        </h4>
                        {isSelected && (
                          <Check className="h-4 w-4 text-purple-500 flex-shrink-0 ml-auto" />
                        )}
                      </div>
                      {c.title && (
                        <p className="text-xs text-gray-500 truncate">
                          {c.title}
                        </p>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulaire saisie directe */}
      <Card className="p-5">
        <div className="flex items-center gap-2 pb-3 border-b mb-4">
          <User className="h-4 w-4 text-gray-500" />
          <h4 className="font-medium text-gray-700">
            {availableContacts.length > 0
              ? 'Ou saisir manuellement'
              : 'Informations du responsable'}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="responsable-firstName">
              Prenom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="responsable-firstName"
              type="text"
              value={contact.firstName}
              onChange={e => handleContactChange('firstName', e.target.value)}
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
              onChange={e => handleContactChange('lastName', e.target.value)}
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
              onChange={e => handleContactChange('email', e.target.value)}
              placeholder="jean.dupont@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsable-phone">
              Telephone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="responsable-phone"
              type="tel"
              value={contact.phone ?? ''}
              onChange={e => handleContactChange('phone', e.target.value)}
              placeholder="06 12 34 56 78"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsable-position">Fonction</Label>
            <Input
              id="responsable-position"
              type="text"
              value={contact.position ?? ''}
              onChange={e => handleContactChange('position', e.target.value)}
              placeholder="Directeur, Gerant..."
            />
          </div>
        </div>
      </Card>

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
