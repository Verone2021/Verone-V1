'use client';

/**
 * NewContactForm - Formulaire inline de création de contact
 *
 * Champs:
 * - Prénom (requis)
 * - Nom (requis)
 * - Email (requis)
 * - Téléphone (optionnel)
 * - Fonction/Titre (optionnel)
 *
 * @module NewContactForm
 * @since 2026-01-20
 */

import { useState } from 'react';

import { Check, X, Loader2 } from 'lucide-react';

import { cn } from '@verone/ui';

// ============================================================================
// TYPES
// ============================================================================

export interface NewContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
}

interface NewContactFormProps {
  /** Callback lors de la soumission */
  onSubmit: (data: NewContactFormData) => Promise<void>;
  /** Callback pour annuler */
  onCancel: () => void;
  /** En cours de soumission */
  isSubmitting?: boolean;
  /** Label de la section */
  sectionLabel?: string;
  /** Classes additionnelles */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NewContactForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  sectionLabel = 'Nouveau contact',
  className,
}: NewContactFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');

  const canSubmit =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    email.trim() !== '' &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      title: title.trim(),
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

      {/* Prénom + Nom */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          placeholder="Prénom *"
          disabled={isSubmitting}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        />
        <input
          type="text"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          placeholder="Nom *"
          disabled={isSubmitting}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        />
      </div>

      {/* Email */}
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email *"
        disabled={isSubmitting}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
      />

      {/* Téléphone + Fonction */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Téléphone"
          disabled={isSubmitting}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        />
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Fonction"
          disabled={isSubmitting}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        />
      </div>

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

export default NewContactForm;
