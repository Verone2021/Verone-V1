'use client';

/**
 * NewAddressForm - Formulaire inline de création d'adresse
 *
 * Champs:
 * - Label (optionnel)
 * - Adresse ligne 1 (requis)
 * - Adresse ligne 2 (optionnel)
 * - Code postal (requis)
 * - Ville (requis)
 * - Pays (défaut FR)
 *
 * @module NewAddressForm
 * @since 2026-01-20
 */

import { useState } from 'react';

import { Check, X, Loader2 } from 'lucide-react';

import { cn } from '@verone/ui';

// ============================================================================
// TYPES
// ============================================================================

export interface NewAddressFormData {
  label: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  legalName?: string;
  siret?: string;
  vatNumber?: string;
}

interface NewAddressFormProps {
  /** Callback lors de la soumission */
  onSubmit: (data: NewAddressFormData) => Promise<void>;
  /** Callback pour annuler */
  onCancel: () => void;
  /** En cours de soumission */
  isSubmitting?: boolean;
  /** Label de la section */
  sectionLabel?: string;
  /** Afficher les champs légaux (raison sociale, SIRET, TVA) */
  showLegalFields?: boolean;
  /** Pays par défaut */
  defaultCountry?: string;
  /** Classes additionnelles */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NewAddressForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  sectionLabel = 'Nouvelle adresse',
  showLegalFields = false,
  defaultCountry = 'FR',
  className,
}: NewAddressFormProps) {
  const [label, setLabel] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState(defaultCountry);

  // Legal fields (optional)
  const [legalName, setLegalName] = useState('');
  const [siret, setSiret] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  const canSubmit =
    addressLine1.trim() !== '' &&
    postalCode.trim() !== '' &&
    city.trim() !== '' &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    await onSubmit({
      label: label.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      postalCode: postalCode.trim(),
      city: city.trim(),
      country: country.trim() || 'FR',
      legalName: legalName.trim() || undefined,
      siret: siret.trim() || undefined,
      vatNumber: vatNumber.trim() || undefined,
    });
  };

  return (
    <div
      className={cn(
        'p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3',
        className
      )}
    >
      <p className="text-sm font-medium text-purple-800">{sectionLabel}</p>

      {/* Label */}
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Libellé (ex: Siège social)"
        disabled={isSubmitting}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
      />

      {/* Legal fields if enabled */}
      {showLegalFields && (
        <>
          <input
            type="text"
            value={legalName}
            onChange={e => setLegalName(e.target.value)}
            placeholder="Raison sociale"
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={siret}
              onChange={e => setSiret(e.target.value)}
              placeholder="SIRET"
              disabled={isSubmitting}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <input
              type="text"
              value={vatNumber}
              onChange={e => setVatNumber(e.target.value)}
              placeholder="N° TVA"
              disabled={isSubmitting}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>
        </>
      )}

      {/* Adresse ligne 1 */}
      <input
        type="text"
        value={addressLine1}
        onChange={e => setAddressLine1(e.target.value)}
        placeholder="Adresse *"
        disabled={isSubmitting}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
      />

      {/* Adresse ligne 2 */}
      <input
        type="text"
        value={addressLine2}
        onChange={e => setAddressLine2(e.target.value)}
        placeholder="Complément d'adresse"
        disabled={isSubmitting}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
      />

      {/* Code postal + Ville */}
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={postalCode}
          onChange={e => setPostalCode(e.target.value)}
          placeholder="Code postal *"
          disabled={isSubmitting}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        />
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Ville *"
          disabled={isSubmitting}
          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        />
      </div>

      {/* Pays */}
      <select
        value={country}
        onChange={e => setCountry(e.target.value)}
        disabled={isSubmitting}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 bg-white"
      >
        <option value="FR">France</option>
        <option value="BE">Belgique</option>
        <option value="LU">Luxembourg</option>
        <option value="CH">Suisse</option>
        <option value="DE">Allemagne</option>
        <option value="ES">Espagne</option>
        <option value="IT">Italie</option>
        <option value="PT">Portugal</option>
        <option value="NL">Pays-Bas</option>
        <option value="GB">Royaume-Uni</option>
      </select>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Création...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Créer et sélectionner
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white text-sm disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default NewAddressForm;
