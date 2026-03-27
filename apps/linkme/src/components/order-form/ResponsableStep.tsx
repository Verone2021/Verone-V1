import {
  Card,
  CardContent,
  Badge,
  RadioGroup,
  RadioGroupItem,
  Label,
  Input,
} from '@verone/ui';
import { Plus, AlertCircle, Check } from 'lucide-react';
import { cn } from '@verone/ui';

import { useOrganisationContacts } from '../../lib/hooks/use-organisation-contacts';

import type {
  StepProps,
  ExistingStep3Props,
  ResponsableContactFormProps,
  CompanyFieldsProps,
} from './types';

// =====================================================================
// SOUS-COMPOSANTS STEP 3
// =====================================================================

export function ResponsableContactForm({
  data,
  errors,
  updateData,
}: ResponsableContactFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="responsableName">
          Nom complet <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsableName"
          value={data.responsable.name}
          onChange={e =>
            updateData({
              responsable: { ...data.responsable, name: e.target.value },
            })
          }
          placeholder="Sophie Martin"
        />
        {errors['responsable.name'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['responsable.name']}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="responsableEmail">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsableEmail"
          type="email"
          value={data.responsable.email}
          onChange={e =>
            updateData({
              responsable: { ...data.responsable, email: e.target.value },
            })
          }
          placeholder="sophie.martin@restaurant.fr"
        />
        {errors['responsable.email'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['responsable.email']}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="responsablePhone">
          Téléphone <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsablePhone"
          type="tel"
          value={data.responsable.phone}
          onChange={e =>
            updateData({
              responsable: { ...data.responsable, phone: e.target.value },
            })
          }
          placeholder="06 12 34 56 78"
        />
        {errors['responsable.phone'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['responsable.phone']}
          </p>
        )}
      </div>
    </div>
  );
}

export function CompanyFields({
  data,
  errors,
  updateData,
}: CompanyFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="companyLegalName">
          Raison sociale <span className="text-red-500">*</span>
        </Label>
        <Input
          id="companyLegalName"
          value={data.responsable.companyLegalName}
          onChange={e =>
            updateData({
              responsable: {
                ...data.responsable,
                companyLegalName: e.target.value,
              },
            })
          }
          placeholder="SARL Restaurant Martin"
        />
        {errors['responsable.companyLegalName'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['responsable.companyLegalName']}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="companyTradeName">Nom commercial (optionnel)</Label>
        <Input
          id="companyTradeName"
          value={data.responsable.companyTradeName}
          onChange={e =>
            updateData({
              responsable: {
                ...data.responsable,
                companyTradeName: e.target.value,
              },
            })
          }
          placeholder="Chez Sophie"
        />
      </div>

      <div>
        <Label htmlFor="siret">
          SIRET <span className="text-red-500">*</span>
        </Label>
        <Input
          id="siret"
          value={data.responsable.siret}
          onChange={e =>
            updateData({
              responsable: { ...data.responsable, siret: e.target.value },
            })
          }
          placeholder="123 456 789 00012"
          maxLength={17}
        />
        {errors['responsable.siret'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['responsable.siret']}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          14 chiffres (espaces autorisés)
        </p>
      </div>

      <div>
        <Label htmlFor="kbisFile">Extrait K-BIS (optionnel)</Label>
        <Input
          id="kbisFile"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={e => {
            const file = e.target.files?.[0] ?? null;
            updateData({
              responsable: { ...data.responsable, kbisFile: file },
            });
          }}
        />
        <p className="text-xs text-gray-500 mt-1">PDF, JPG ou PNG - Max 5 MB</p>
      </div>
    </div>
  );
}

// =====================================================================
// STEP 3 : RESPONSABLE
// =====================================================================

export function OpeningStep3Responsable({
  data,
  errors,
  updateData,
}: StepProps) {
  const { data: contacts } = useOrganisationContacts(
    data.existingOrganisationId
  );

  const isExisting = data.isNewRestaurant === false;

  // ========================================
  // RESTAURANT EXISTANT : Sélection contact OU nouveau
  // ========================================
  if (isExisting) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h3 className="text-lg font-medium">Responsable du restaurant</h3>
          <p className="text-sm text-gray-500 mt-1">
            Sélectionnez un contact existant ou créez-en un nouveau
          </p>
        </div>

        {contacts?.allContacts && contacts.allContacts.length > 0 ? (
          <>
            <RadioGroup
              value={data.existingContact.selectedContactId ?? ''}
              onValueChange={value =>
                updateData({
                  existingContact: {
                    ...data.existingContact,
                    selectedContactId: value,
                    isNewContact: value === 'new',
                  },
                })
              }
            >
              {/* Contacts existants */}
              {contacts.allContacts.map(contact => (
                <Card
                  key={contact.id}
                  className={cn(
                    'cursor-pointer transition-all',
                    data.existingContact.selectedContactId === contact.id &&
                      'ring-2 ring-blue-500 bg-blue-50'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value={contact.id}
                        id={`contact-${contact.id}`}
                      />
                      <Label
                        htmlFor={`contact-${contact.id}`}
                        className="cursor-pointer flex-1"
                      >
                        <div>
                          <p className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {contact.email}
                          </p>
                          {contact.phone && (
                            <p className="text-sm text-gray-500">
                              {contact.phone}
                            </p>
                          )}
                          {contact.isPrimaryContact && (
                            <Badge variant="outline" className="mt-2">
                              Contact principal
                            </Badge>
                          )}
                        </div>
                      </Label>
                      {data.existingContact.selectedContactId ===
                        contact.id && (
                        <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Option : Nouveau contact */}
              <Card
                className={cn(
                  'cursor-pointer transition-all border-dashed',
                  data.existingContact.selectedContactId === 'new' &&
                    'ring-2 ring-blue-500 bg-blue-50'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="new" id="contact-new" />
                    <Label
                      htmlFor="contact-new"
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter un nouveau contact</span>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>

            {/* Si "nouveau" sélectionné, afficher formulaire */}
            {data.existingContact.selectedContactId === 'new' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg mt-4">
                <h4 className="font-medium text-gray-900">Nouveau contact</h4>
                <ResponsableContactForm
                  data={data}
                  errors={errors}
                  updateData={updateData}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Aucun contact enregistré
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Veuillez ajouter un contact pour ce restaurant.
                </p>
              </div>
            </div>
            <ResponsableContactForm
              data={data}
              errors={errors}
              updateData={updateData}
            />
          </>
        )}

        {errors['existingContact.selectedContactId'] && (
          <p className="text-sm text-red-600">
            {errors['existingContact.selectedContactId']}
          </p>
        )}
      </div>
    );
  }

  // ========================================
  // RESTAURANT NOUVEAU : Formulaire direct
  // ========================================
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-lg font-medium">Responsable du restaurant</h3>
        <p className="text-sm text-gray-500 mt-1">
          Coordonnées du responsable du restaurant
        </p>
      </div>

      <ResponsableContactForm
        data={data}
        errors={errors}
        updateData={updateData}
      />

      {/* Informations légales déplacées à l'étape Restaurant */}
    </div>
  );
}

/**
 * EXISTING STEP 3 : RESPONSABLE (saisie manuelle, PAS de contacts DB)
 */
export function ExistingStep3Responsable({
  data,
  errors,
  updateData,
}: ExistingStep3Props) {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-lg font-medium">Responsable du restaurant</h3>
        <p className="text-sm text-gray-500 mt-1">
          Coordonnées du responsable pour cette commande
        </p>
      </div>

      {/* Info : saisie manuelle */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-700">
            Les coordonnées saisies seront vérifiées par l&apos;équipe Verone
            lors de la validation de la commande.
          </p>
        </div>
      </div>

      <ResponsableContactForm
        data={data}
        errors={errors}
        updateData={updateData}
      />
    </div>
  );
}
