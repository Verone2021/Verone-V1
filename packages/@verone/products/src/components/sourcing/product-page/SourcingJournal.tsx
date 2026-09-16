'use client';

import { ButtonV2, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  MessageCircle,
  Plus,
  StickyNote,
} from 'lucide-react';

import type {
  NewSourcingJournalEntry,
  SourcingCommunication,
} from '../../../hooks/sourcing/use-sourcing-notebook';
import {
  statusChangeReason,
  statusChangeTitle,
} from '../../../utils/sourcing-journal';
import { isOverdueFollowUp } from '../../../utils/sourcing-stage-playbook';
import { useState } from 'react';

import { journalChannel } from './journal-channels';
import {
  SourcingJournalForm,
  type SourcingJournalFormMode,
} from './SourcingJournalForm';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface SourcingJournalProps {
  entries: SourcingCommunication[];
  formMode: SourcingJournalFormMode | null;
  onFormModeChange: (mode: SourcingJournalFormMode | null) => void;
  onAdd: (entry: NewSourcingJournalEntry) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
}

/**
 * Journal unique du produit sourcing : échanges fournisseur, notes internes et
 * changements d'étape (écrits par la base), du plus récent au plus ancien.
 */
export function SourcingJournal({
  entries,
  formMode,
  onFormModeChange,
  onAdd,
  onResolve,
}: SourcingJournalProps) {
  const [filter, setFilter] = useState<'all' | 'exchange' | 'note'>('all');

  const pendingFollowUps = entries.filter(
    entry => entry.follow_up_date && !entry.is_resolved
  );
  // Les relances dépassées d'abord : c'est ce qui demande une action.
  const sortedFollowUps = [...pendingFollowUps].sort((a, b) => {
    const aLate = isOverdueFollowUp(a) ? 0 : 1;
    const bLate = isOverdueFollowUp(b) ? 0 : 1;
    if (aLate !== bLate) return aLate - bLate;
    return (a.follow_up_date ?? '').localeCompare(b.follow_up_date ?? '');
  });
  const overdueCount = pendingFollowUps.filter(entry =>
    isOverdueFollowUp(entry)
  ).length;

  const visibleEntries =
    filter === 'all'
      ? entries
      : entries.filter(entry => entry.entry_type === filter);

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MessageCircle className="h-4 w-4" />
            Journal ({entries.length})
          </CardTitle>
          <div className="flex gap-2">
            <ButtonV2
              variant="outline"
              size="sm"
              icon={Plus}
              className="h-11 md:h-9"
              onClick={() => onFormModeChange('exchange')}
            >
              Échange
            </ButtonV2>
            <ButtonV2
              variant="outline"
              size="sm"
              icon={StickyNote}
              className="h-11 md:h-9"
              onClick={() => onFormModeChange('note')}
            >
              Note
            </ButtonV2>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {pendingFollowUps.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2">
            <p className="mb-1 flex items-center gap-1 text-sm font-medium text-amber-800">
              <Clock className="h-4 w-4" />
              {pendingFollowUps.length} relance(s) en attente
              {overdueCount > 0 ? `, dont ${overdueCount} en retard` : ''}
            </p>
            <ul className="space-y-1">
              {sortedFollowUps.map(entry => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-2 text-sm text-amber-800"
                >
                  <span className="min-w-0 truncate">
                    {isOverdueFollowUp(entry) && (
                      <span className="mr-1 rounded bg-amber-200 px-1 text-[10px] font-medium">
                        en retard
                      </span>
                    )}
                    {entry.next_action ?? entry.summary}
                    {entry.follow_up_date
                      ? ` — ${formatDate(entry.follow_up_date)}`
                      : ''}
                  </span>
                  <button
                    type="button"
                    aria-label="Marquer la relance comme faite"
                    title="Marquer comme faite"
                    onClick={() => {
                      void onResolve(entry.id).catch(error => {
                        console.error(
                          '[SourcingJournal] resolve failed:',
                          error
                        );
                      });
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-green-700 hover:bg-green-100 md:h-8 md:w-8"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {formMode && (
          <SourcingJournalForm
            key={formMode}
            mode={formMode}
            onCancel={() => onFormModeChange(null)}
            onSubmit={onAdd}
          />
        )}

        {entries.length > 0 && (
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Filtrer le journal"
          >
            {(
              [
                ['all', 'Tout'],
                ['exchange', 'Échanges'],
                ['note', 'Notes'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  'min-h-11 rounded-full border px-3 text-xs font-medium md:min-h-0 md:py-1',
                  filter === value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {visibleEntries.length === 0 && !formMode ? (
          <p className="py-4 text-center text-sm text-gray-500">
            {entries.length === 0
              ? 'Aucune entrée : les échanges, notes et changements d’étape apparaîtront ici.'
              : 'Aucune entrée de ce type.'}
          </p>
        ) : (
          <ol className="max-h-[480px] space-y-2 overflow-y-auto">
            {visibleEntries.map(entry => (
              <li key={entry.id}>
                <JournalEntry entry={entry} />
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function JournalEntry({ entry }: { entry: SourcingCommunication }) {
  if (entry.entry_type === 'status_change') {
    const reason = statusChangeReason(entry);
    return (
      <div className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-2 text-sm">
        <ArrowRightLeft className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-900">
              {statusChangeTitle(entry)}
            </span>
            <time className="shrink-0 text-xs text-gray-500">
              {formatDate(entry.communicated_at)}
            </time>
          </div>
          {reason && <p className="text-gray-600">Motif : {reason}</p>}
        </div>
      </div>
    );
  }

  const isNote = entry.entry_type === 'note';
  const isInbound = entry.direction === 'inbound';
  const channel = journalChannel(entry.channel);
  const Icon = isNote ? StickyNote : isInbound ? ArrowDownLeft : ArrowUpRight;

  return (
    <div
      className={cn(
        'rounded-md border p-2 text-sm',
        isNote && 'border-amber-200 bg-amber-50',
        !isNote && isInbound && 'border-gray-200 bg-white',
        !isNote && !isInbound && 'border-blue-200 bg-blue-50'
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon
            className={cn(
              'h-4 w-4 shrink-0',
              isNote && 'text-amber-600',
              !isNote && isInbound && 'text-green-600',
              !isNote && !isInbound && 'text-blue-600'
            )}
          />
          <span className="font-medium">
            {isNote ? 'Note interne' : `${channel.emoji} ${channel.label}`}
          </span>
          {!isNote && entry.contact_name && (
            <span className="truncate text-gray-500">
              — {entry.contact_name}
            </span>
          )}
        </div>
        <time className="shrink-0 text-xs text-gray-500">
          {formatDate(entry.communicated_at)}
        </time>
      </div>
      <p className="whitespace-pre-line text-gray-700">{entry.summary}</p>
      {entry.next_action && (
        <p
          className={cn(
            'mt-1 flex items-center gap-1 text-xs',
            entry.is_resolved ? 'text-green-700' : 'text-amber-700'
          )}
        >
          {entry.is_resolved ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {entry.next_action}
          {entry.follow_up_date ? ` — ${formatDate(entry.follow_up_date)}` : ''}
        </p>
      )}
    </div>
  );
}
