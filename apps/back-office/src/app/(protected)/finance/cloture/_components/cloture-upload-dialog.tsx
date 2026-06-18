'use client';

/**
 * Dialog de dépôt d'une pièce pour une ligne de clôture manquante.
 * Réutilise le composant InvoiceUploadModal de @verone/finance
 * (upload vers Qonto via /api/qonto/attachments/upload).
 * [BO-COMPTA-001]
 */

import { InvoiceUploadModal } from '@verone/finance';
import type { TransactionForUpload } from '@verone/finance';

import type { ClotureRow } from '../types';

interface ClotureUploadDialogProps {
  row: ClotureRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

export function ClotureUploadDialog({
  row,
  open,
  onOpenChange,
  onUploadComplete,
}: ClotureUploadDialogProps) {
  if (!row) return null;

  // Transformer une ClotureRow en TransactionForUpload pour l'InvoiceUploadModal
  const txForUpload: TransactionForUpload | null = row.transaction_id
    ? {
        id: row.id,
        transaction_id: row.transaction_id,
        label: row.partner_name ?? row.document_number ?? '',
        counterparty_name: row.partner_name,
        amount: row.total_ttc ?? 0,
        currency: 'EUR',
        emitted_at: row.document_date ?? new Date().toISOString(),
        has_attachment: row.kind === 'present',
        matched_document_id: null,
        order_number: row.document_number,
      }
    : null;

  if (!txForUpload) return null;

  return (
    <InvoiceUploadModal
      transaction={txForUpload}
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
    />
  );
}
