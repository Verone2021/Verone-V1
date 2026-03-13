'use client';

import { Badge } from '@verone/ui';
import { FileText } from 'lucide-react';

import type { LibraryDocument } from '@verone/finance';
import { getPdfUrl } from '@verone/finance';

function formatDocType(doc: LibraryDocument): string {
  switch (doc.document_type) {
    case 'supplier_invoice':
      return 'Facture achat';
    case 'customer_invoice':
    case 'invoice':
      return 'Facture vente';
    case 'credit_note':
      return 'Avoir';
    default:
      return doc.document_type;
  }
}

function formatMoney(amount: number | null): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

interface DocumentCardProps {
  document: LibraryDocument;
  onSelect: (doc: LibraryDocument) => void;
}

export function DocumentCard({ document: doc, onSelect }: DocumentCardProps) {
  const pdfUrl = getPdfUrl(doc);
  const date = doc.document_date
    ? new Date(doc.document_date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      })
    : null;

  return (
    <button
      onClick={() => onSelect(doc)}
      className="group flex flex-col rounded-lg border bg-card text-left transition-all hover:shadow-md hover:border-primary/50 overflow-hidden"
    >
      {/* PDF preview thumbnail */}
      <div className="relative h-[180px] bg-muted/30 overflow-hidden border-b">
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-[300px] origin-top-left scale-[0.6] pointer-events-none"
            title={doc.document_number ?? 'Document'}
            tabIndex={-1}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-3 space-y-1.5">
        <p className="font-medium text-sm truncate">
          {doc.partner_name ?? 'Sans partenaire'}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {formatDocType(doc)}
          </Badge>
          {date && (
            <span className="text-xs text-muted-foreground">{date}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-700">
          {formatMoney(doc.total_ht)} HT
        </p>
      </div>
    </button>
  );
}
