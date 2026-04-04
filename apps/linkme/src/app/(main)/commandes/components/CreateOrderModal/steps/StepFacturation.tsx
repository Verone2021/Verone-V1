'use client';

import { type AddressResult } from '@verone/ui';
import { AddressAutocomplete } from '@verone/ui';

import type { NewRestaurantFormState } from '../types';

interface Props {
  form: NewRestaurantFormState;
  setForm: React.Dispatch<React.SetStateAction<NewRestaurantFormState>>;
}

export function StepFacturation({ form, setForm }: Props) {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Informations de facturation
      </h3>

      {form.ownerType === 'franchise' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dénomination sociale *
          </label>
          <input
            type="text"
            autoComplete="organization"
            value={form.billingCompanyName}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                billingCompanyName: e.target.value,
              }))
            }
            placeholder="Ex: SARL Le Gourmet"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">
          Adresse de facturation
        </h4>
        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={form.billingUseSameAddress}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                billingUseSameAddress: e.target.checked,
              }))
            }
            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          />
          <div>
            <p className="font-medium text-gray-900">
              Reprendre l'adresse de livraison
            </p>
            <p className="text-sm text-gray-500">
              {form.address}, {form.postalCode} {form.city}
            </p>
          </div>
        </label>

        {!form.billingUseSameAddress && (
          <div className="space-y-4 pt-2">
            <AddressAutocomplete
              label="Adresse de facturation *"
              placeholder="Rechercher une adresse..."
              value={
                form.billingAddress
                  ? `${form.billingAddress}, ${form.billingPostalCode} ${form.billingCity}`
                  : ''
              }
              onChange={value => {
                if (!value) {
                  setForm(prev => ({
                    ...prev,
                    billingAddress: '',
                    billingCity: '',
                    billingPostalCode: '',
                    billingLatitude: null,
                    billingLongitude: null,
                  }));
                }
              }}
              onSelect={(address: AddressResult) => {
                setForm(prev => ({
                  ...prev,
                  billingAddress: address.streetAddress,
                  billingCity: address.city,
                  billingPostalCode: address.postalCode,
                  billingLatitude: address.latitude,
                  billingLongitude: address.longitude,
                }));
              }}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SIRET *
        </label>
        <input
          type="text"
          value={form.billingSiret}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              billingSiret: e.target.value.replace(/\s/g, ''),
            }))
          }
          placeholder="123 456 789 00012"
          maxLength={14}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">14 chiffres sans espaces</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          K-bis (facultatif)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={form.billingKbisUrl}
            onChange={e =>
              setForm(prev => ({ ...prev, billingKbisUrl: e.target.value }))
            }
            placeholder="URL du document K-bis"
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Lien vers le document (Google Drive, Dropbox, etc.)
        </p>
      </div>

      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-900 mb-4">
          Contact facturation
        </h4>
        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={form.billingSameAsOwner}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                billingSameAsOwner: e.target.checked,
              }))
            }
            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          />
          <div>
            <p className="font-medium text-gray-900">
              Même contact que le propriétaire
            </p>
            <p className="text-sm text-gray-500">
              {form.ownerFirstName} {form.ownerLastName} - {form.ownerEmail}
            </p>
          </div>
        </label>

        {!form.billingSameAsOwner && (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  autoComplete="given-name"
                  value={form.billingFirstName}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      billingFirstName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  autoComplete="family-name"
                  value={form.billingLastName}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      billingLastName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                autoComplete="email"
                value={form.billingEmail}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    billingEmail: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                autoComplete="tel"
                value={form.billingPhone}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    billingPhone: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
