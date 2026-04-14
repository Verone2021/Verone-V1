import type { DocumentType, QontoDocument } from './types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    invoice: 'Facture',
    quote: 'Devis',
    credit_note: 'Avoir',
  };
  return labels[type] ?? type;
}

export function getDocumentNumber(
  doc: QontoDocument,
  type: DocumentType
): string {
  switch (type) {
    case 'invoice':
      return doc.invoice_number ?? doc.id;
    case 'quote':
      return doc.quote_number ?? doc.id;
    case 'credit_note':
      return doc.credit_note_number ?? doc.id;
    default:
      return doc.id;
  }
}

export function getApiEndpoint(type: DocumentType, id: string): string {
  switch (type) {
    case 'invoice':
      return `/api/qonto/invoices/${id}`;
    case 'quote':
      return `/api/qonto/quotes/${id}`;
    case 'credit_note':
      return `/api/qonto/credit-notes/${id}`;
    default:
      return `/api/qonto/invoices/${id}`;
  }
}
