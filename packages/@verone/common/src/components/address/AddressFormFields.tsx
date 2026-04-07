'use client';

import { AddressAutocomplete, type AddressResult } from '@verone/ui';

import { COUNTRIES } from './address-edit.types';
import type { Organisation } from './address-edit.types';

type Prefix = 'billing' | 'shipping';

interface AddressFormFieldsProps {
  prefix: Prefix;
  editData: Organisation | null;
  onFieldChange: (field: string, value: string) => void;
  onAddressSelect: (address: AddressResult) => void;
  onCountryChange: (field: string, value: string) => void;
  headerSlot?: React.ReactNode;
}

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black';

export function AddressFormFields({
  prefix,
  editData,
  onFieldChange,
  onAddressSelect,
  onCountryChange,
  headerSlot,
}: AddressFormFieldsProps) {
  const f = (field: string) => `${prefix}_${field}`;
  const val = (field: string): string =>
    (editData?.[f(field) as keyof Organisation] as string | null | undefined) ??
    '';

  return (
    <div className="space-y-4">
      {headerSlot}

      <div className="md:col-span-2 mb-4">
        <AddressAutocomplete
          value={val('address_line1')}
          onChange={value => onFieldChange(f('address_line1'), value)}
          onSelect={onAddressSelect}
          placeholder="Rechercher une adresse..."
          label="Adresse"
          id={`${prefix}-address-edit`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-black mb-1">
            Complément d'adresse
          </label>
          <input
            type="text"
            value={val('address_line2')}
            onChange={e => onFieldChange(f('address_line2'), e.target.value)}
            className={INPUT_CLASS}
            placeholder="Bâtiment, étage, etc. (optionnel)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Code postal
          </label>
          <input
            type="text"
            value={val('postal_code')}
            onChange={e => onFieldChange(f('postal_code'), e.target.value)}
            className={INPUT_CLASS}
            placeholder="75001"
            maxLength={5}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Ville
          </label>
          <input
            type="text"
            value={val('city')}
            onChange={e => onFieldChange(f('city'), e.target.value)}
            className={INPUT_CLASS}
            placeholder="Paris"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Région / Département
          </label>
          <input
            type="text"
            value={val('region')}
            onChange={e => onFieldChange(f('region'), e.target.value)}
            className={INPUT_CLASS}
            placeholder="Île-de-France"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Pays
          </label>
          <select
            value={val('country') || 'FR'}
            onChange={e => onCountryChange(f('country'), e.target.value)}
            className={INPUT_CLASS}
          >
            {COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
