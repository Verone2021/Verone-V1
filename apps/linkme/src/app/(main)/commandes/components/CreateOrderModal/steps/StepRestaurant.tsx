'use client';

import { type AddressResult } from '@verone/ui';
import { AddressAutocomplete } from '@verone/ui';
import { Building2, Users } from 'lucide-react';

import type { NewRestaurantFormState } from '../types';

interface Props {
  form: NewRestaurantFormState;
  setForm: React.Dispatch<React.SetStateAction<NewRestaurantFormState>>;
}

export function StepRestaurant({ form, setForm }: Props) {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Adresse de livraison du restaurant
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom commercial *
            </label>
            <input
              type="text"
              autoComplete="organization"
              value={form.tradeName}
              onChange={e =>
                setForm(prev => ({ ...prev, tradeName: e.target.value }))
              }
              placeholder="Ex: Restaurant Le Gourmet"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          <div>
            <AddressAutocomplete
              label="Adresse du restaurant *"
              placeholder="Rechercher une adresse..."
              value={
                form.address
                  ? `${form.address}, ${form.postalCode} ${form.city}`
                  : ''
              }
              onChange={value => {
                if (!value) {
                  setForm(prev => ({
                    ...prev,
                    address: '',
                    city: '',
                    postalCode: '',
                    latitude: null,
                    longitude: null,
                  }));
                }
              }}
              onSelect={(address: AddressResult) => {
                setForm(prev => ({
                  ...prev,
                  address: address.streetAddress,
                  city: address.city,
                  postalCode: address.postalCode,
                  latitude: address.latitude,
                  longitude: address.longitude,
                }));
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Type de restaurant
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() =>
              setForm(prev => ({ ...prev, ownerType: 'succursale' }))
            }
            className={`p-4 border-2 rounded-xl transition-all ${
              form.ownerType === 'succursale'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Building2
              className={`h-8 w-8 mx-auto mb-2 ${form.ownerType === 'succursale' ? 'text-green-600' : 'text-gray-400'}`}
            />
            <p className="font-medium text-gray-900">Propre</p>
            <p className="text-xs text-gray-500 mt-1">
              Restaurant détenu par l'enseigne
            </p>
          </button>
          <button
            onClick={() =>
              setForm(prev => ({ ...prev, ownerType: 'franchise' }))
            }
            className={`p-4 border-2 rounded-xl transition-all ${
              form.ownerType === 'franchise'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Users
              className={`h-8 w-8 mx-auto mb-2 ${form.ownerType === 'franchise' ? 'text-green-600' : 'text-gray-400'}`}
            />
            <p className="font-medium text-gray-900">Franchisé</p>
            <p className="text-xs text-gray-500 mt-1">
              Exploité par un franchisé
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
