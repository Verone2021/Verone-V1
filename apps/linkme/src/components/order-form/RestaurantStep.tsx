import { useCallback } from 'react';

import {
  AddressAutocomplete,
  type AddressResult,
  Card,
  CardContent,
  Badge,
  RadioGroup,
  RadioGroupItem,
  Label,
  Separator,
  Input,
} from '@verone/ui';
import { CheckCircle, FileText, Upload } from 'lucide-react';

import { RestaurantSelectorModal } from '../orders/RestaurantSelectorModal';
import { useEnseigneOrganisations } from '../../lib/hooks/use-enseigne-organisations';

import type { StepProps, ExistingStep2Props, Organisation } from './types';

/**
 * ÉTAPE 2 (OPENING) : RESTAURANT
 * Sélection restaurant existant OU création nouveau restaurant
 */
export function OpeningStep2Restaurant({
  data,
  errors,
  updateData,
  affiliateId,
}: StepProps) {
  const { data: organisations } = useEnseigneOrganisations(affiliateId);

  if (data.isNewRestaurant === false) {
    // ========================================
    // RESTAURANT EXISTANT : Modal sélection
    // ========================================
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Sélection du restaurant
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Recherchez et sélectionnez le restaurant concerné
          </p>
        </div>

        <RestaurantSelectorModal
          organisations={organisations ?? []}
          selectedId={data.existingOrganisationId}
          onSelect={org => updateData({ existingOrganisationId: org.id })}
          isLoading={!organisations}
          error={errors['existingOrganisationId']}
        />
      </div>
    );
  }

  // ========================================
  // NOUVEAU RESTAURANT : Formulaire complet
  // ========================================
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Informations du restaurant
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Création d'un nouveau restaurant
        </p>
      </div>

      {/* Type de restaurant - DÉPLACÉ ICI (étape 2 au lieu de 3) */}
      <div>
        <Label>
          Type de restaurant <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={data.newRestaurant.ownershipType ?? ''}
          onValueChange={(value: 'succursale' | 'franchise') =>
            updateData({
              newRestaurant: {
                ...data.newRestaurant,
                ownershipType: value,
              },
              // Reset useParentOrganisation when switching to franchise
              // (parent org billing only applies to succursales)
              billing: {
                ...data.billing,
                useParentOrganisation:
                  value === 'succursale'
                    ? data.billing.useParentOrganisation
                    : false,
              },
            })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="succursale" id="type-propre" />
            <Label htmlFor="type-propre" className="cursor-pointer font-normal">
              Restaurant propre (succursale)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="franchise" id="type-franchise" />
            <Label
              htmlFor="type-franchise"
              className="cursor-pointer font-normal"
            >
              Restaurant franchisé
            </Label>
          </div>
        </RadioGroup>
        {errors['newRestaurant.ownershipType'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['newRestaurant.ownershipType']}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Cette information détermine les champs requis aux étapes suivantes
        </p>
      </div>

      <Separator />

      {/* Nom commercial */}
      <div>
        <Label htmlFor="tradeName">
          Nom commercial <span className="text-red-500">*</span>
        </Label>
        <Input
          id="tradeName"
          value={data.newRestaurant.tradeName}
          onChange={e =>
            updateData({
              newRestaurant: {
                ...data.newRestaurant,
                tradeName: e.target.value,
              },
            })
          }
          placeholder="Pokawa Paris Rivoli"
        />
        {errors['newRestaurant.tradeName'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['newRestaurant.tradeName']}
          </p>
        )}
      </div>

      {/* Adresse autocomplete */}
      <div>
        <Label>
          Adresse du restaurant <span className="text-red-500">*</span>
        </Label>
        <AddressAutocomplete
          value={
            data.newRestaurant.address
              ? `${data.newRestaurant.address}, ${data.newRestaurant.postalCode} ${data.newRestaurant.city}`
              : ''
          }
          onSelect={(address: AddressResult) =>
            updateData({
              newRestaurant: {
                ...data.newRestaurant,
                address: address.streetAddress,
                postalCode: address.postalCode,
                city: address.city,
                latitude: address.latitude,
                longitude: address.longitude,
              },
            })
          }
          placeholder="123 Rue de Rivoli, 75001 Paris"
        />
        {errors['newRestaurant.address'] && (
          <p className="text-sm text-red-600 mt-1">
            {errors['newRestaurant.address']}
          </p>
        )}
      </div>

      {/* Informations légales de l'organisation */}
      {data.newRestaurant.ownershipType && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium text-sm">
                Informations légales (facultatif)
              </h4>
            </div>

            <div>
              <Label htmlFor="companyLegalName">Raison sociale</Label>
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
              <Label htmlFor="siret">SIRET</Label>
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
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  Choisir un fichier
                  <input
                    id="kbisFile"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null;
                      updateData({
                        responsable: { ...data.responsable, kbisFile: file },
                      });
                    }}
                  />
                </label>
                {data.responsable.kbisFile && (
                  <span className="text-sm text-green-600">
                    {data.responsable.kbisFile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPG ou PNG — Max 10 MB
              </p>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Contact responsable optionnel */}
      <div>
        <h4 className="font-medium text-sm mb-3">
          Contact responsable (optionnel)
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Vous pouvez ajouter dès maintenant un contact responsable. Sinon, vous
          pourrez le faire à l'étape suivante.
        </p>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="optionalContactName">Nom complet</Label>
            <Input
              id="optionalContactName"
              value={data.newRestaurant.optionalContactName}
              onChange={e =>
                updateData({
                  newRestaurant: {
                    ...data.newRestaurant,
                    optionalContactName: e.target.value,
                  },
                })
              }
              placeholder="Sophie Martin"
            />
          </div>

          <p className="text-xs text-gray-400">
            Ce contact sera automatiquement créé et associé au restaurant
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * ÉTAPE 2 (EXISTING) : RESTAURANT (sélection restaurant existant)
 */
export function ExistingStep2Restaurant({
  data,
  errors,
  updateData,
  organisations,
  isLoadingOrganisations = false,
}: ExistingStep2Props) {
  const selectedOrg = organisations.find(
    o => o.id === data.existingOrganisationId
  );

  const handleSelectOrg = useCallback(
    (org: Organisation) => {
      // Pre-fill delivery address from organisation
      const deliveryAddress =
        org.shipping_address_line1 ?? org.address_line1 ?? '';
      const deliveryCity = org.shipping_city ?? org.city ?? '';
      const deliveryPostalCode =
        org.shipping_postal_code ?? org.postal_code ?? '';

      updateData({
        existingOrganisationId: org.id,
        delivery: {
          ...data.delivery,
          address: deliveryAddress,
          city: deliveryCity,
          postalCode: deliveryPostalCode,
          latitude: org.latitude,
          longitude: org.longitude,
        },
      });
    },
    [data.delivery, updateData]
  );

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-lg font-medium">Restaurant</h3>
        <p className="text-sm text-gray-500 mt-1">
          Sélectionnez le restaurant pour cette commande
        </p>
      </div>

      <div>
        <Label>
          Restaurant <span className="text-red-500">*</span>
        </Label>
        <RestaurantSelectorModal
          organisations={organisations}
          selectedId={data.existingOrganisationId}
          onSelect={handleSelectOrg}
          isLoading={isLoadingOrganisations}
          error={errors.existingOrganisationId}
        />
      </div>

      {/* Résumé du restaurant sélectionné */}
      {selectedOrg && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">
                  {selectedOrg.trade_name ?? selectedOrg.legal_name}
                </p>
                {selectedOrg.address_line1 && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {selectedOrg.address_line1}
                    {selectedOrg.postal_code &&
                      `, ${selectedOrg.postal_code}`}{' '}
                    {selectedOrg.city}
                  </p>
                )}
                {selectedOrg.ownership_type && (
                  <Badge variant="outline" className="mt-1">
                    {selectedOrg.ownership_type === 'franchise'
                      ? 'Franchise'
                      : 'Restaurant propre'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {errors.existingOrganisationId && (
        <p className="text-sm text-red-600">{errors.existingOrganisationId}</p>
      )}
    </div>
  );
}
