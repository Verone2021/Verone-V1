'use client';

import { ButtonUnified } from '@verone/ui';
import { Loader2, Mail, Plus, Trash2 } from 'lucide-react';

interface EmailRecipientsSectionProps {
  emails: string[];
  newEmail: string;
  loading: boolean;
  saving: boolean;
  onNewEmailChange: (value: string) => void;
  onAddEmail: (e: React.FormEvent) => void;
  onRemoveEmail: (email: string) => void;
}

export function EmailRecipientsSection({
  emails,
  newEmail,
  loading,
  saving,
  onNewEmailChange,
  onAddEmail,
  onRemoveEmail,
}: EmailRecipientsSectionProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Destinataires email (systeme)
          </h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Adresses qui recoivent les emails de formulaire (contact, SAV,
          selections LinkMe)
        </p>
      </div>

      <div className="px-6 py-4 border-b border-gray-100">
        <form onSubmit={onAddEmail} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={e => onNewEmailChange(e.target.value)}
            placeholder="email@verone.fr"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={saving}
          />
          <ButtonUnified
            type="submit"
            variant="default"
            icon={Plus}
            iconPosition="left"
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Ajouter
          </ButtonUnified>
        </form>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center">
          <Loader2 className="h-6 w-6 text-gray-400 animate-spin mx-auto" />
        </div>
      ) : emails.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Mail className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucun destinataire</p>
          <p className="text-xs text-gray-400">
            Seules les notifications in-app seront actives
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {emails.map(email => (
            <div
              key={email}
              className="px-6 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-gray-500" />
                </div>
                <span className="text-sm text-gray-900">{email}</span>
              </div>
              <button
                onClick={() => onRemoveEmail(email)}
                disabled={saving}
                className="p-2 md:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors h-11 w-11 md:h-9 md:w-9 flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
