/**
 * Shared formatting utilities for library documents.
 * Single source of truth — used by DocumentCard, DocumentModal, and any future consumer.
 */

import type { LibraryDocument } from '../hooks/use-library-documents';

/** Human-readable document type label */
export function formatDocType(doc: LibraryDocument): string {
  if (doc.source_table === 'bank_transactions') {
    return doc.document_direction === 'inbound'
      ? 'Justificatif achat'
      : 'Justificatif vente';
  }
  switch (doc.document_type) {
    case 'supplier_invoice':
      return 'Facture achat';
    case 'customer_invoice':
    case 'invoice':
      return 'Facture vente';
    case 'supplier_credit_note':
    case 'customer_credit_note':
    case 'credit_note':
      return 'Avoir';
    default:
      return doc.document_type;
  }
}

/** Format a monetary amount in EUR with French locale */
export function formatMoney(amount: number | null): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}
