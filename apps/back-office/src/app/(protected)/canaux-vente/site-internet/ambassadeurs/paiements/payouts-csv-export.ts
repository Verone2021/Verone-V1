/**
 * CSV export helper for ambassador paid attributions
 * ADR-021 D12 — payout CSV mensuel
 */

import type { PaidAttributionRow } from '../../hooks/use-pending-payouts';

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(isoString: string | null): string {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('fr-FR');
}

export function exportPayoutsCsv(
  rows: PaidAttributionRow[],
  year: number,
  month: number
): void {
  const headers = [
    'ID attribution',
    'Email ambassadeur',
    'Nom ambassadeur',
    'Date attribution',
    'Montant prime (EUR)',
    'Date paiement',
  ];

  const lines = rows.map(r =>
    [
      escapeCsv(r.id),
      escapeCsv(r.customer_email),
      escapeCsv(r.customer_name),
      escapeCsv(formatDate(r.attribution_date)),
      escapeCsv(Number(r.prime_amount).toFixed(2)),
      escapeCsv(formatDate(r.paid_at)),
    ].join(',')
  );

  const csvContent = [headers.join(','), ...lines].join('\n');

  const blob = new Blob(['﻿' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `primes-ambassadeurs-${year}-${String(month).padStart(2, '0')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
