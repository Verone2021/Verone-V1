import { Truck } from 'lucide-react';

import { AddressAutocomplete, type AddressResult } from '@verone/ui';

import type { CheckoutFormData } from '../types';

interface ShippingSectionProps {
  formData: CheckoutFormData;
  updateFormData: (
    field: keyof CheckoutFormData,
    value: string | boolean
  ) => void;
  onAddressSelect: (address: AddressResult) => void;
}

export function ShippingSection({
  formData,
  updateFormData,
  onAddressSelect,
}: ShippingSectionProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Truck className="h-4 w-4" />
        Adresse de livraison
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Prénom *
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={e => updateFormData('firstName', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={e => updateFormData('lastName', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Société (optionnel)
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={e => updateFormData('company', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <AddressAutocomplete
            value={formData.address}
            onChange={value => updateFormData('address', value)}
            onSelect={onAddressSelect}
            placeholder="Rechercher une adresse..."
            label="Adresse *"
            id="shipping-address-checkout"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Complément d'adresse
          </label>
          <input
            type="text"
            value={formData.addressComplement}
            onChange={e => updateFormData('addressComplement', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Bâtiment, étage, code..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Code postal *
          </label>
          <input
            type="text"
            required
            value={formData.postalCode}
            onChange={e => updateFormData('postalCode', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Ville *
          </label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={e => updateFormData('city', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Pays
          </label>
          <select
            value={formData.country}
            onChange={e => updateFormData('country', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="France">France</option>
            <option value="Belgique">Belgique</option>
            <option value="Suisse">Suisse</option>
            <option value="Luxembourg">Luxembourg</option>
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.useSameForBilling}
            onChange={e =>
              updateFormData('useSameForBilling', e.target.checked)
            }
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-xs text-gray-700">
            Utiliser la même adresse pour la facturation
          </span>
        </label>
      </div>
    </div>
  );
}
