'use client';

import { useState } from 'react';

import { PenLine } from 'lucide-react';

import type { AddressResult } from './address-autocomplete.types';

interface ManualFields {
  street: string;
  postalCode: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: string;
  longitude: string;
}

export const defaultManualFields: ManualFields = {
  street: '',
  postalCode: '',
  city: '',
  country: 'France',
  countryCode: 'FR',
  latitude: '',
  longitude: '',
};

interface AddressManualFormProps {
  showGpsFields: boolean;
  onChange?: (value: string) => void;
  onSelect?: (address: AddressResult) => void;
  onClose: () => void;
  setInputValue: (value: string) => void;
}

export function AddressManualForm({
  showGpsFields,
  onChange,
  onSelect,
  onClose,
  setInputValue,
}: AddressManualFormProps) {
  const [fields, setFields] = useState<ManualFields>(defaultManualFields);

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const gridInputClass =
    'px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const handleSubmit = () => {
    const label = [
      fields.street,
      fields.postalCode,
      fields.city,
      fields.country !== 'France' ? fields.country : '',
    ]
      .filter(Boolean)
      .join(', ');

    const result: AddressResult = {
      label,
      streetAddress: fields.street,
      city: fields.city,
      postalCode: fields.postalCode,
      countryCode: fields.countryCode || 'FR',
      country: fields.country || 'France',
      latitude: parseFloat(fields.latitude) || 0,
      longitude: parseFloat(fields.longitude) || 0,
      source: 'ban',
    };

    setInputValue(label);
    onChange?.(label);
    onSelect?.(result);
    onClose();
    setFields(defaultManualFields);
  };

  const isValid = Boolean(fields.street && fields.postalCode && fields.city);

  return (
    <div className="mt-2 border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Saisie manuelle
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Retour a la recherche
        </button>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Numero et rue"
          value={fields.street}
          onChange={e => setFields(f => ({ ...f, street: e.target.value }))}
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Code postal"
            value={fields.postalCode}
            onChange={e =>
              setFields(f => ({ ...f, postalCode: e.target.value }))
            }
            className={gridInputClass}
          />
          <input
            type="text"
            placeholder="Ville"
            value={fields.city}
            onChange={e => setFields(f => ({ ...f, city: e.target.value }))}
            className={gridInputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Pays"
            value={fields.country}
            onChange={e => setFields(f => ({ ...f, country: e.target.value }))}
            className={gridInputClass}
          />
          <input
            type="text"
            placeholder="Code pays (FR, BE...)"
            value={fields.countryCode}
            onChange={e =>
              setFields(f => ({
                ...f,
                countryCode: e.target.value.toUpperCase(),
              }))
            }
            maxLength={2}
            className={gridInputClass}
          />
        </div>
        {showGpsFields && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Latitude"
              value={fields.latitude}
              onChange={e =>
                setFields(f => ({ ...f, latitude: e.target.value }))
              }
              className={gridInputClass}
            />
            <input
              type="text"
              placeholder="Longitude"
              value={fields.longitude}
              onChange={e =>
                setFields(f => ({ ...f, longitude: e.target.value }))
              }
              className={gridInputClass}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!isValid}
        onClick={handleSubmit}
        className={
          isValid
            ? 'w-full py-2 px-4 rounded-md text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors'
            : 'w-full py-2 px-4 rounded-md text-sm font-medium bg-gray-200 text-gray-400 cursor-not-allowed'
        }
      >
        Valider l&apos;adresse
      </button>
    </div>
  );
}

interface ManualModeLinkProps {
  disabled: boolean;
  onOpen: () => void;
}

export function AddressManualModeLink({
  disabled,
  onOpen,
}: ManualModeLinkProps) {
  if (disabled) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-1 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
    >
      <PenLine className="h-3 w-3" />
      Saisir manuellement
    </button>
  );
}
