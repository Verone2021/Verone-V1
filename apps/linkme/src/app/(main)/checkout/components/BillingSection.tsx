import { AddressAutocomplete, type AddressResult } from '@verone/ui';

import type { CheckoutFormData } from '../types';

interface BillingSectionProps {
  formData: CheckoutFormData;
  updateFormData: (
    field: keyof CheckoutFormData,
    value: string | boolean
  ) => void;
  onAddressSelect: (address: AddressResult) => void;
}

export function BillingSection({
  formData,
  updateFormData,
  onAddressSelect,
}: BillingSectionProps) {
  if (formData.useSameForBilling) return null;

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-base font-bold text-gray-900 mb-3">
        Adresse de facturation
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Prénom *
          </label>
          <input
            type="text"
            required
            value={formData.billingFirstName}
            onChange={e => updateFormData('billingFirstName', e.target.value)}
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
            value={formData.billingLastName}
            onChange={e => updateFormData('billingLastName', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Société (optionnel)
          </label>
          <input
            type="text"
            value={formData.billingCompany}
            onChange={e => updateFormData('billingCompany', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <AddressAutocomplete
            value={formData.billingAddress}
            onChange={value => updateFormData('billingAddress', value)}
            onSelect={onAddressSelect}
            placeholder="Rechercher une adresse..."
            label="Adresse *"
            id="billing-address-checkout"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Complément d'adresse
          </label>
          <input
            type="text"
            value={formData.billingAddressComplement}
            onChange={e =>
              updateFormData('billingAddressComplement', e.target.value)
            }
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Code postal *
          </label>
          <input
            type="text"
            required
            value={formData.billingPostalCode}
            onChange={e => updateFormData('billingPostalCode', e.target.value)}
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
            value={formData.billingCity}
            onChange={e => updateFormData('billingCity', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Pays
          </label>
          <select
            value={formData.billingCountry}
            onChange={e => updateFormData('billingCountry', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="France">France</option>
            <option value="Belgique">Belgique</option>
            <option value="Suisse">Suisse</option>
            <option value="Luxembourg">Luxembourg</option>
          </select>
        </div>
      </div>
    </div>
  );
}
