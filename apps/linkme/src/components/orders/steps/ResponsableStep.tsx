'use client';

/**
 * ResponsableStep - Etape 5 du formulaire de commande
 *
 * Formulaire simple de saisie directe du contact responsable.
 * Pas de consultation des contacts existants (securite : accessible sur internet).
 * Fusion server-side si email/tel/nom match un contact existant (hors scope formulaire).
 *
 * @module ResponsableStep
 * @since 2026-01-24
 * @updated 2026-02-23 - Simplification: suppression contacts existants, ajout franchise
 */

import { useMemo, useCallback } from 'react';

import { Card, Input, Label, cn } from '@verone/ui';
import { User, Check, AlertCircle } from 'lucide-react';

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
  // Determine ownership type
  const ownershipType = useMemo(() => {
    if (formData.restaurant.mode === 'new') {
      return formData.restaurant.newRestaurant?.ownershipType ?? null;
    }
    return formData.restaurant.existingOwnershipType ?? null;
  }, [formData.restaurant]);

  const isFranchise = ownershipType === 'franchise';

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

  const handleFranchiseChange = useCallback(
    (field: 'companyLegalName' | 'siret', value: string) => {
      onUpdate({
        franchiseInfo: {
          ...formData.contacts.franchiseInfo,
          [field]: value,
        },
      });
    },
    [formData.contacts.franchiseInfo, onUpdate]
  );

  const contact = formData.contacts.responsable;

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
            <span className="text-gray-400 text-sm font-normal ml-2">
              (optionnel)
            </span>
          </h3>
          <p className="text-sm text-gray-500">
            Personne principale a contacter pour cette commande
          </p>
        </div>
      </div>

      {/* Formulaire saisie directe */}
      <Card className="p-5">
        <div className="flex items-center gap-2 pb-3 border-b mb-4">
          <User className="h-4 w-4 text-gray-500" />
          <h4 className="font-medium text-gray-700">
            Informations du responsable
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

        {/* Champs franchise conditionnels */}
        {isFranchise && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <h4 className="font-medium text-gray-700">
                Informations franchise
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="franchise-legalName">
                  Raison sociale <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="franchise-legalName"
                  type="text"
                  value={
                    formData.contacts.franchiseInfo?.companyLegalName ?? ''
                  }
                  onChange={e =>
                    handleFranchiseChange('companyLegalName', e.target.value)
                  }
                  placeholder="SARL Restaurant Dupont"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="franchise-siret">
                  SIRET <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="franchise-siret"
                  type="text"
                  value={formData.contacts.franchiseInfo?.siret ?? ''}
                  onChange={e => handleFranchiseChange('siret', e.target.value)}
                  placeholder="123 456 789 00012"
                  maxLength={17}
                />
                <p className="text-xs text-gray-500">14 chiffres</p>
              </div>
            </div>
          </div>
        )}
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
