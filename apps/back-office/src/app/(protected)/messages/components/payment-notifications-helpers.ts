/**
 * Helpers and types for PaymentNotificationsTab
 */

import type { DatabaseNotification } from '@verone/notifications';
import { isToday, isYesterday, isThisWeek } from 'date-fns';

// ============================================================================
// Type guards / predicates
// ============================================================================

export function isPaymentNotification(n: DatabaseNotification): boolean {
  return (
    n.title === 'Paiement entrant' ||
    n.title === 'Paiement recu' ||
    n.title === 'Paiement sortant'
  );
}

export function isIncoming(title: string): boolean {
  return title === 'Paiement entrant' || title === 'Paiement recu';
}

export function extractTransactionId(actionUrl: string | null): string | null {
  if (!actionUrl) return null;
  try {
    const url = new URL(actionUrl, 'http://localhost');
    return url.searchParams.get('transaction');
  } catch {
    return null;
  }
}

// ============================================================================
// Payment parsing
// ============================================================================

export interface ParsedPayment {
  sign: string;
  amount: number;
  counterparty: string;
  date: string;
  isMatched: boolean;
  statusLabel: string;
}

export function parsePaymentMessage(message: string): ParsedPayment {
  const parts = message.split(' | ');
  const mainPart = parts[0] ?? '';
  const datePart = parts[1] ?? '';
  const statusPart = parts[2] ?? '';

  const match = mainPart.match(/^([+-])\s*([\d.,]+)\s*E\s*--\s*(.+)$/);
  return {
    sign: match?.[1] ?? '+',
    amount: parseFloat(match?.[2]?.replace(',', '.') ?? '0'),
    counterparty: match?.[3]?.trim() ?? '',
    date: datePart.trim(),
    isMatched:
      statusPart.trim() === 'Rapproche' || statusPart.trim() === 'Rapproché',
    statusLabel: statusPart.trim(),
  };
}

// ============================================================================
// Date grouping
// ============================================================================

export const DATE_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  thisWeek: 'Cette semaine',
  older: 'Plus ancien',
};

export function groupByDate(notifications: DatabaseNotification[]) {
  const groups: Record<string, DatabaseNotification[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach(notif => {
    const date = new Date(notif.created_at ?? new Date());
    if (isToday(date)) groups.today.push(notif);
    else if (isYesterday(date)) groups.yesterday.push(notif);
    else if (isThisWeek(date, { weekStartsOn: 1 })) groups.thisWeek.push(notif);
    else groups.older.push(notif);
  });

  return groups;
}

// ============================================================================
// Action type
// ============================================================================

export type SheetAction = 'view' | 'rapprocher' | 'upload';
