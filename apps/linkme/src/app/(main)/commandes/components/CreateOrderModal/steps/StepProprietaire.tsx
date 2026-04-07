'use client';

import { AlertCircle } from 'lucide-react';

import type { NewRestaurantFormState } from '../types';

interface Props {
  form: NewRestaurantFormState;
  setForm: React.Dispatch<React.SetStateAction<NewRestaurantFormState>>;
  selectedCustomerContacts?: {
    primaryContact?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  } | null;
}

export function StepProprietaire({
  form,
  setForm,
  selectedCustomerContacts,
}: Props) {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {form.ownerType === 'franchise'
          ? 'Propriétaire du restaurant (Franchisé)'
          : 'Responsable du restaurant'}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {form.ownerType === 'franchise'
          ? 'Informations du propriétaire franchisé'
          : 'Informations du responsable de ce restaurant'}
      </p>

      {selectedCustomerContacts?.primaryContact && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Données pré-remplies depuis le profil client (modifiables)
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom *
            </label>
            <input
              type="text"
              autoComplete="given-name"
              value={form.ownerFirstName}
              onChange={e =>
                setForm(prev => ({ ...prev, ownerFirstName: e.target.value }))
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
              value={form.ownerLastName}
              onChange={e =>
                setForm(prev => ({ ...prev, ownerLastName: e.target.value }))
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
            value={form.ownerEmail}
            onChange={e =>
              setForm(prev => ({ ...prev, ownerEmail: e.target.value }))
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
            value={form.ownerPhone}
            onChange={e =>
              setForm(prev => ({ ...prev, ownerPhone: e.target.value }))
            }
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>

        {form.ownerType === 'franchise' && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Informations société (franchisé)
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raison sociale *
              </label>
              <input
                type="text"
                autoComplete="organization"
                value={form.ownerCompanyName}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    ownerCompanyName: e.target.value,
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
