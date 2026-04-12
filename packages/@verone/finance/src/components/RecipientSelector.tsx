'use client';

import React from 'react';

import { Input } from '@verone/ui';
import { Label } from '@verone/ui';

import type { EmailContact } from './SendDocumentEmailModal';

// ── Types ──────────────────────────────────────────────────────────

interface RecipientSelectorProps {
  recipients: string[];
  manualEmail: string;
  contacts: EmailContact[];
  onAddRecipient: (email: string) => void;
  onRemoveRecipient: (email: string) => void;
  onManualEmailChange: (value: string) => void;
  onManualEmailKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onManualEmailBlur: () => void;
}

// ── Component ──────────────────────────────────────────────────────

export function RecipientSelector({
  recipients,
  manualEmail,
  contacts,
  onAddRecipient,
  onRemoveRecipient,
  onManualEmailChange,
  onManualEmailKeyDown,
  onManualEmailBlur,
}: RecipientSelectorProps) {
  return (
    <div className="space-y-1.5">
      <Label>Destinataire(s)</Label>

      {/* Contact suggestions from linked order */}
      {contacts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {contacts.map(contact => {
            const isSelected = recipients.includes(contact.email.toLowerCase());
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onRemoveRecipient(contact.email.toLowerCase());
                  } else {
                    onAddRecipient(contact.email);
                  }
                }}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-teal-100 text-teal-800 ring-1 ring-teal-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{contact.name || contact.email}</span>
                <span className="text-[10px] opacity-70">({contact.role})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected recipients chips */}
      {recipients.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {recipients.map(email => (
            <span
              key={email}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
            >
              {email}
              <button
                type="button"
                onClick={() => onRemoveRecipient(email)}
                className="ml-0.5 rounded-full hover:bg-blue-200 p-0.5"
                aria-label={`Retirer ${email}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Manual email input */}
      <Input
        id="doc-email-to"
        type="email"
        value={manualEmail}
        onChange={e => onManualEmailChange(e.target.value)}
        onKeyDown={onManualEmailKeyDown}
        onBlur={onManualEmailBlur}
        placeholder={
          recipients.length > 0 ? 'Ajouter un email...' : 'email@exemple.com'
        }
      />
    </div>
  );
}
