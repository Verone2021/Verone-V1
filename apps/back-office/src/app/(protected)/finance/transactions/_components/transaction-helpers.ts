import { BANK_PAYMENT_METHODS } from '@verone/finance';

// =====================================================================
// TYPES
// =====================================================================

export interface SyncApiResponse {
  success: boolean;
  itemsCreated?: number;
  itemsUpdated?: number;
}

export interface ApiErrorResponse {
  error?: string;
}

export type StatusFilter =
  | 'all'
  | 'to_process'
  | 'classified'
  | 'matched'
  | 'cca'
  | 'ignored';
export type SideFilter = 'all' | 'credit' | 'debit';

// =====================================================================
// HELPERS
// =====================================================================

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date inconnue';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function getMonthKey(dateStr: string | null): string {
  if (!dateStr) return 'unknown';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(key: string): string {
  if (key === 'unknown') return 'Date inconnue';
  return new Date(`${key}-01`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

// Mapping Qonto operation_type → payment_method pour auto-détection
export const OPERATION_TYPE_MAP: Record<
  string,
  { method: string; label: string }
> = {
  card: { method: 'cb', label: 'CB' },
  transfer: { method: 'virement', label: 'Virement' },
  income: { method: 'virement', label: 'Virement' },
  direct_debit: { method: 'prelevement', label: 'Prélèvement' },
  qonto_fee: { method: 'prelevement', label: 'Frais' },
};

export function getPaymentMethodDisplay(tx: {
  payment_method: string | null;
  operation_type: string | null;
}): { label: string; isAuto: boolean } | null {
  if (tx.payment_method) {
    const pm = BANK_PAYMENT_METHODS.find(p => p.value === tx.payment_method);
    return pm
      ? { label: pm.label, isAuto: false }
      : { label: tx.payment_method, isAuto: false };
  }
  if (tx.operation_type && OPERATION_TYPE_MAP[tx.operation_type]) {
    return { label: OPERATION_TYPE_MAP[tx.operation_type].label, isAuto: true };
  }
  return null;
}
