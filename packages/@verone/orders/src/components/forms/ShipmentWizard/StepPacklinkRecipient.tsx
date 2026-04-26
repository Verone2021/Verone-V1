'use client';

import { MapPin, User } from 'lucide-react';

import type { SalesOrderForShipment } from '@verone/orders/hooks';

import { parseShippingAddress } from './parse-address';
import type { RecipientForm, RecipientSource } from './types';

interface ContactOption {
  source: Exclude<RecipientSource, 'manual'>;
  label: string;
  contact: SalesOrderForShipment['delivery_contact'];
}

interface StepPacklinkRecipientProps {
  salesOrder: SalesOrderForShipment;
  recipientForm: RecipientForm;
  recipientSource: RecipientSource;
  setRecipientField: (key: keyof RecipientForm, value: string) => void;
  selectRecipientContact: (source: RecipientSource) => void;
  onBack: () => void;
  onNext: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValid(form: RecipientForm): boolean {
  return (
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    EMAIL_REGEX.test(form.email.trim()) &&
    form.phone.trim().length >= 6
  );
}

function buildContactOptions(
  salesOrder: SalesOrderForShipment
): ContactOption[] {
  const raw: ContactOption[] = [
    {
      source: 'delivery',
      label: 'Contact livraison',
      contact: salesOrder.delivery_contact,
    },
    {
      source: 'responsable',
      label: 'Contact responsable',
      contact: salesOrder.responsable_contact,
    },
    {
      source: 'billing',
      label: 'Contact facturation',
      contact: salesOrder.billing_contact,
    },
  ];
  // Garde uniquement les contacts existants, dedoublonne par id (les 3 roles
  // pointent souvent vers le meme contact).
  const seen = new Set<string>();
  const result: ContactOption[] = [];
  for (const opt of raw) {
    const id = opt.contact?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(opt);
  }
  return result;
}

export function StepPacklinkRecipient({
  salesOrder,
  recipientForm,
  recipientSource,
  setRecipientField,
  selectRecipientContact,
  onBack,
  onNext,
}: StepPacklinkRecipientProps) {
  const addr = parseShippingAddress(salesOrder.shipping_address);
  const contactOptions = buildContactOptions(salesOrder);
  const valid = isValid(recipientForm);
  const inputsLocked = recipientSource !== 'manual';

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-blue-50 p-3 text-sm text-blue-900">
        Ces informations partent telles quelles a Packlink. Choisissez un
        contact de la commande pour pre-remplir, ou saisissez manuellement.
      </div>

      {/* Selecteur de contact */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="mb-2 flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Contact destinataire
          </span>
        </div>

        {contactOptions.length === 0 && (
          <p className="text-xs italic text-gray-500">
            Aucun contact rattache a cette commande. Saisissez manuellement
            ci-dessous.
          </p>
        )}

        {contactOptions.map(opt => {
          const c = opt.contact!;
          const fullName = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
          const checked = recipientSource === opt.source;
          return (
            <label
              key={opt.source}
              className={`flex cursor-pointer items-start gap-3 rounded border p-2 transition-colors hover:bg-blue-50 ${
                checked ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="recipient-source"
                className="mt-0.5"
                checked={checked}
                onChange={() => selectRecipientContact(opt.source)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {fullName || '(Nom manquant)'}{' '}
                  <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-normal text-gray-600">
                    {opt.label}
                  </span>
                </p>
                <p className="truncate text-xs text-gray-500">
                  {c.email ?? 'Email manquant'}
                </p>
                {(c.mobile ?? c.phone) && (
                  <p className="text-xs text-gray-400">{c.mobile ?? c.phone}</p>
                )}
              </div>
            </label>
          );
        })}

        <label
          className={`flex cursor-pointer items-start gap-3 rounded border p-2 transition-colors hover:bg-gray-50 ${
            recipientSource === 'manual'
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200'
          }`}
        >
          <input
            type="radio"
            name="recipient-source"
            className="mt-0.5"
            checked={recipientSource === 'manual'}
            onChange={() => selectRecipientContact('manual')}
          />
          <div>
            <p className="text-sm font-medium">Saisie manuelle</p>
            <p className="text-xs text-gray-500">
              Renseignez les 4 champs ci-dessous a la main.
            </p>
          </div>
        </label>
      </div>

      {/* Formulaire 4 champs */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Prenom *</label>
          <input
            type="text"
            value={recipientForm.firstName}
            disabled={inputsLocked}
            onChange={e => setRecipientField('firstName', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Lucie"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Nom *</label>
          <input
            type="text"
            value={recipientForm.lastName}
            disabled={inputsLocked}
            onChange={e => setRecipientField('lastName', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Vandecapelle"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium text-gray-600">
            Entreprise{' '}
            <span className="text-gray-400 font-normal">(facultatif)</span>
          </label>
          <input
            type="text"
            value={recipientForm.company}
            disabled={inputsLocked}
            onChange={e => setRecipientField('company', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Pokawa Marseille Terrasses du Port"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Email *</label>
          <input
            type="email"
            value={recipientForm.email}
            disabled={inputsLocked}
            onChange={e => setRecipientField('email', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="contact@entreprise.fr"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">
            Telephone mobile *
          </label>
          <input
            type="tel"
            value={recipientForm.phone}
            disabled={inputsLocked}
            onChange={e => setRecipientField('phone', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="+33612345678"
          />
        </div>
      </div>

      {inputsLocked && (
        <p className="text-xs text-gray-500">
          Pour modifier ces valeurs, choisissez « Saisie manuelle » ci-dessus.
        </p>
      )}

      {/* Adresse de livraison (info, non editable) */}
      <div className="rounded-lg border bg-gray-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Adresse de livraison (issue de la commande)
          </span>
        </div>
        {addr ? (
          <div className="space-y-0.5 text-sm text-gray-800">
            {addr.address_line1 && <p>{addr.address_line1}</p>}
            {(addr.postal_code ?? addr.city) && (
              <p>{[addr.postal_code, addr.city].filter(Boolean).join(' ')}</p>
            )}
            {addr.country && addr.country !== 'FR' && <p>{addr.country}</p>}
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">
            Aucune adresse de livraison renseignee sur la commande.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          onClick={onBack}
        >
          Precedent
        </button>
        <button
          type="button"
          disabled={!valid}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          onClick={onNext}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
