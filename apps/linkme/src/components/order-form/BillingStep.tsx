import {
  AddressAutocomplete,
  type AddressResult,
  Card,
  CardContent,
  Checkbox,
  Label,
} from '@verone/ui';
import { CheckCircle } from 'lucide-react';

import { useEnseigneIdFromAffiliate } from '../../lib/hooks/use-enseigne-id-from-affiliate';
import { useEnseigneParentOrganisation } from '../../lib/hooks/use-enseigne-parent-organisation';

import type { StepProps } from './types';

export function OpeningStep4Billing({
  data,
  errors,
  updateData,
  affiliateId,
}: StepProps) {
  const { data: enseigneId } = useEnseigneIdFromAffiliate(affiliateId);
  const { data: parentOrg } = useEnseigneParentOrganisation(enseigneId ?? null);
  // For existing restaurants, default to isPropre=true (most common case)
  // For new restaurants, check ownershipType
  const isPropre =
    data.isNewRestaurant === false ||
    data.newRestaurant.ownershipType === 'succursale';

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-lg font-medium">Facturation</h3>
        <p className="text-sm text-gray-500 mt-1">
          Adresse et contact de facturation
        </p>
      </div>

      {/* Option organisation mère (uniquement si propre ET org mère existe) */}
      {isPropre && parentOrg && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="useParentOrg"
                checked={data.billing.useParentOrganisation}
                onCheckedChange={checked =>
                  updateData({
                    billing: {
                      ...data.billing,
                      useParentOrganisation: !!checked,
                    },
                  })
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="useParentOrg"
                  className="cursor-pointer font-medium"
                >
                  Utiliser l'organisation mère de l'enseigne
                </Label>
                <div className="mt-2 text-sm text-gray-700">
                  <p className="font-medium">
                    {parentOrg.trade_name ?? parentOrg.legal_name}
                  </p>
                  <p className="text-gray-600">{parentOrg.address_line1}</p>
                  <p className="text-gray-600">
                    {parentOrg.postal_code} {parentOrg.city}
                  </p>
                  {parentOrg.siret && (
                    <p className="text-xs text-gray-500 mt-1">
                      SIRET : {parentOrg.siret}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  L'adresse de facturation sera celle de l'organisation mère
                </p>
              </div>
              {data.billing.useParentOrganisation && (
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire custom (si case non cochée OU franchise) */}
      {(!data.billing.useParentOrganisation || !isPropre) && (
        <>
          {/* Contact de facturation */}
          <div>
            <Label>Contact de facturation</Label>
            <div className="space-y-2 mt-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="billingSource"
                  checked={data.billing.contactSource === 'responsable'}
                  onChange={() =>
                    updateData({
                      billing: {
                        ...data.billing,
                        contactSource: 'responsable',
                      },
                    })
                  }
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  Même que le responsable (Étape 2)
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="billingSource"
                  checked={data.billing.contactSource === 'custom'}
                  onChange={() =>
                    updateData({
                      billing: { ...data.billing, contactSource: 'custom' },
                    })
                  }
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Autre contact</span>
              </label>
            </div>
          </div>

          {/* Si contact personnalisé */}
          {data.billing.contactSource === 'custom' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">
                Contact de facturation
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={data.billing.name}
                    onChange={e =>
                      updateData({
                        billing: { ...data.billing, name: e.target.value },
                      })
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors['billing.name']
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors['billing.name'] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors['billing.name']}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={data.billing.email}
                    onChange={e =>
                      updateData({
                        billing: { ...data.billing, email: e.target.value },
                      })
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors['billing.email']
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors['billing.email'] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors['billing.email']}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={data.billing.phone}
                  onChange={e =>
                    updateData({
                      billing: { ...data.billing, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Adresse de facturation */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-gray-900">
              Adresse de facturation
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison sociale
                </label>
                <input
                  type="text"
                  value={data.billing.companyLegalName}
                  onChange={e =>
                    updateData({
                      billing: {
                        ...data.billing,
                        companyLegalName: e.target.value,
                      },
                    })
                  }
                  placeholder="Société Example SAS"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SIRET
                </label>
                <input
                  type="text"
                  value={data.billing.siret}
                  onChange={e =>
                    updateData({
                      billing: {
                        ...data.billing,
                        siret: e.target.value.replace(/\D/g, '').slice(0, 14),
                      },
                    })
                  }
                  placeholder="12345678901234"
                  maxLength={14}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">14 chiffres</p>
              </div>
            </div>
            <div>
              <AddressAutocomplete
                label="Adresse de facturation *"
                placeholder="Rechercher une adresse..."
                value={
                  data.billing.address
                    ? `${data.billing.address}, ${data.billing.postalCode} ${data.billing.city}`
                    : ''
                }
                onChange={value => {
                  if (!value) {
                    updateData({
                      billing: {
                        ...data.billing,
                        address: '',
                        city: '',
                        postalCode: '',
                        latitude: null,
                        longitude: null,
                      },
                    });
                  }
                }}
                onSelect={(address: AddressResult) => {
                  updateData({
                    billing: {
                      ...data.billing,
                      address: address.streetAddress,
                      city: address.city,
                      postalCode: address.postalCode,
                      latitude: address.latitude,
                      longitude: address.longitude,
                    },
                  });
                }}
              />
              {errors['billing.address'] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors['billing.address']}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Notes (optionnel) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optionnel)
        </label>
        <textarea
          value={data.finalNotes}
          onChange={e => updateData({ finalNotes: e.target.value })}
          placeholder="Instructions spéciales, commentaires..."
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
