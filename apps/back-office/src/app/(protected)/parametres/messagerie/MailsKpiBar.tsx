'use client';

/**
 * MailsKpiBar — mini-dashboard 4 KPI au-dessus de la liste mails
 * (BO-MSG-015 phase 2). Compteurs calculés côté client depuis les emails
 * passés en props.
 */

import { useMemo } from 'react';

import { cn } from '@verone/utils';
import { Inbox, Link2, Mail, Reply } from 'lucide-react';

import type { EmailMessageEnriched } from './types';

interface MailsKpiBarProps {
  emails: EmailMessageEnriched[];
  /** Filtre actif sur la liste : permet d'afficher la KPI sélectionnée. */
  activeKpi?: 'unread' | 'replied_today' | 'linked_order' | null;
  onKpiClick?: (
    kpi: 'unread' | 'replied_today' | 'linked_order' | null
  ) => void;
}

export function MailsKpiBar({
  emails,
  activeKpi = null,
  onKpiClick,
}: MailsKpiBarProps): JSX.Element {
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    let unread = 0;
    let repliedToday = 0;
    let linkedOrder = 0;
    for (const e of emails) {
      if (!e.is_read) unread++;
      if (e.replied_at) {
        const r = new Date(e.replied_at);
        if (r >= startOfToday) repliedToday++;
      }
      if (e.linked_order_id) linkedOrder++;
    }
    return {
      total: emails.length,
      unread,
      repliedToday,
      linkedOrder,
    };
  }, [emails]);

  type CardKey = 'unread' | 'replied_today' | 'linked_order' | null;
  const cards: Array<{
    key: CardKey;
    label: string;
    value: number;
    icon: typeof Inbox;
    tone: string;
  }> = [
    {
      key: null,
      label: 'Total reçus',
      value: stats.total,
      icon: Inbox,
      tone: 'bg-gray-100 text-gray-700',
    },
    {
      key: 'unread',
      label: 'Non lus',
      value: stats.unread,
      icon: Mail,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      key: 'replied_today',
      label: "Répondus aujourd'hui",
      value: stats.repliedToday,
      icon: Reply,
      tone: 'bg-green-50 text-green-700',
    },
    {
      key: 'linked_order',
      label: 'Liés à commande',
      value: stats.linkedOrder,
      icon: Link2,
      tone: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => {
        const Icon = card.icon;
        const isActive = activeKpi === card.key;
        const clickable = Boolean(onKpiClick);
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onKpiClick?.(isActive ? null : card.key)}
            disabled={!clickable}
            className={cn(
              'rounded-lg border p-4 flex items-start gap-3 transition-all text-left',
              clickable &&
                'cursor-pointer hover:shadow-sm hover:border-gray-300',
              !clickable && 'cursor-default',
              isActive
                ? 'border-black ring-2 ring-black/10 bg-white'
                : 'border-gray-200 bg-white'
            )}
          >
            <div className={cn('rounded-md p-2 flex-shrink-0', card.tone)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide truncate">
                {card.label}
              </p>
              <p className="text-2xl font-semibold text-black mt-0.5">
                {card.value}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
