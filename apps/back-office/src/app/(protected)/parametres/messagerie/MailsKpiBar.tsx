'use client';

/**
 * MailsKpiBar — mini-dashboard 4 KPI au-dessus de la liste messagerie
 * (BO-MSG-018). Compteurs calculés côté client sur la vue unifiée.
 */

import { useMemo } from 'react';

import { cn } from '@verone/utils';
import { ArrowDownLeft, ArrowUpRight, Inbox, Link2 } from 'lucide-react';

import type { Communication } from './types';

interface MailsKpiBarProps {
  communications: Communication[];
  /** Filtre actif sur la liste : permet d'afficher la KPI sélectionnée. */
  activeKpi?: 'unread' | 'replied_today' | 'linked_order' | null;
  onKpiClick?: (
    kpi: 'unread' | 'replied_today' | 'linked_order' | null
  ) => void;
}

export function MailsKpiBar({
  communications,
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
    let received = 0;
    let sent = 0;
    let unread = 0;
    let linkedOrder = 0;
    let repliedToday = 0;
    for (const c of communications) {
      if (c.direction === 'received') {
        received++;
        if (!c.is_read) unread++;
      } else {
        sent++;
      }
      if (c.sales_order_id) linkedOrder++;
      if (c.replied_at) {
        const r = new Date(c.replied_at);
        if (r >= startOfToday) repliedToday++;
      }
    }
    return { received, sent, unread, linkedOrder, repliedToday };
  }, [communications]);

  type CardKey = 'unread' | 'replied_today' | 'linked_order' | null;
  const cards: Array<{
    key: CardKey;
    label: string;
    value: number;
    icon: typeof Inbox;
    tone: string;
  }> = [
    {
      key: 'unread',
      label: 'Mails non-lus',
      value: stats.unread,
      icon: ArrowDownLeft,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      key: null,
      label: 'Reçus',
      value: stats.received,
      icon: Inbox,
      tone: 'bg-gray-100 text-gray-700',
    },
    {
      key: null,
      label: 'Envoyés',
      value: stats.sent,
      icon: ArrowUpRight,
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
        const isActive = activeKpi === card.key && card.key !== null;
        const clickable = Boolean(onKpiClick) && card.key !== null;
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => {
              if (card.key !== null) {
                onKpiClick?.(isActive ? null : card.key);
              }
            }}
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
