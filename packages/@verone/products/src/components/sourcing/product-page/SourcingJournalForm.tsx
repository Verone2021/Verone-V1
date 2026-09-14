'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui/components/ui/button';

import type { NewSourcingJournalEntry } from '../../../hooks/sourcing/use-sourcing-notebook';
import { JOURNAL_CHANNELS } from './journal-channels';

export type SourcingJournalFormMode = 'exchange' | 'note';

interface SourcingJournalFormProps {
  mode: SourcingJournalFormMode;
  onCancel: () => void;
  onSubmit: (entry: NewSourcingJournalEntry) => Promise<void>;
}

const EMPTY_FORM = {
  channel: 'alibaba',
  direction: 'outbound' as 'inbound' | 'outbound',
  contact_name: '',
  summary: '',
  next_action: '',
  follow_up_date: '',
};

const FIELD =
  'h-11 w-full rounded-md border border-gray-300 bg-white px-2 text-sm md:h-9';

/** Ajout d'un échange fournisseur ou d'une note interne au journal. */
export function SourcingJournalForm({
  mode,
  onCancel,
  onSubmit,
}: SourcingJournalFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const summary = form.summary.trim();

  const handleSubmit = async () => {
    if (!summary) return;
    setSaving(true);
    setFailed(false);
    const followUp = {
      next_action: form.next_action.trim() || undefined,
      follow_up_date: form.follow_up_date || undefined,
    };
    try {
      await onSubmit(
        mode === 'note'
          ? { entry_type: 'note', summary, ...followUp }
          : {
              entry_type: 'exchange',
              channel: form.channel,
              direction: form.direction,
              contact_name: form.contact_name.trim() || undefined,
              summary,
              ...followUp,
            }
      );
      setForm(EMPTY_FORM);
      onCancel();
    } catch (error) {
      console.error('[SourcingJournalForm] save failed:', error);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
      <p className="text-sm font-medium text-gray-900">
        {mode === 'note'
          ? 'Nouvelle note interne'
          : 'Nouvel échange fournisseur'}
      </p>

      {mode === 'exchange' && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <select
            aria-label="Canal"
            value={form.channel}
            onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
            className={FIELD}
          >
            {Object.entries(JOURNAL_CHANNELS).map(([key, { label, emoji }]) => (
              <option key={key} value={key}>
                {emoji} {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Sens"
            value={form.direction}
            onChange={e =>
              setForm(f => ({
                ...f,
                direction:
                  e.target.value === 'inbound' ? 'inbound' : 'outbound',
              }))
            }
            className={FIELD}
          >
            <option value="outbound">Envoyé</option>
            <option value="inbound">Reçu</option>
          </select>
          <input
            type="text"
            placeholder="Nom du contact (optionnel)"
            value={form.contact_name}
            onChange={e =>
              setForm(f => ({ ...f, contact_name: e.target.value }))
            }
            className={FIELD}
          />
        </div>
      )}

      <textarea
        placeholder={mode === 'note' ? 'Votre note…' : "Résumé de l'échange…"}
        value={form.summary}
        onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
        rows={3}
        className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
        autoFocus
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input
          type="text"
          placeholder="Prochaine action (optionnel)"
          value={form.next_action}
          onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))}
          className={FIELD}
        />
        <input
          type="date"
          aria-label="Date de relance"
          value={form.follow_up_date}
          onChange={e =>
            setForm(f => ({ ...f, follow_up_date: e.target.value }))
          }
          className={FIELD}
        />
      </div>

      {failed && (
        <p className="text-sm text-red-600">
          Enregistrement impossible, réessayez.
        </p>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:justify-end">
        <ButtonV2
          variant="outline"
          size="sm"
          className="h-11 w-full md:h-9 md:w-auto"
          onClick={onCancel}
          disabled={saving}
        >
          Annuler
        </ButtonV2>
        <ButtonV2
          variant="primary"
          size="sm"
          className="h-11 w-full md:h-9 md:w-auto"
          disabled={!summary || saving}
          loading={saving}
          onClick={() => {
            void handleSubmit().catch(error => {
              console.error('[SourcingJournalForm] submit failed:', error);
            });
          }}
        >
          Enregistrer
        </ButtonV2>
      </div>
    </div>
  );
}
