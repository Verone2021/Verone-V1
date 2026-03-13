'use client';

import { Badge, Checkbox, ScrollArea } from '@verone/ui';
import { Money, StatusPill } from '@verone/ui-business';
import { cn } from '@verone/utils';
import { FileText, FileWarning } from 'lucide-react';

import type { LibraryDocument } from '@verone/finance/hooks';

// =====================================================================
// TYPES
// =====================================================================

interface DocumentListProps {
  documents: LibraryDocument[];
  selectedDocumentId: string | null;
  selectedIds: string[];
  onSelectDocument: (doc: LibraryDocument) => void;
  onToggleSelection: (id: string) => void;
  onToggleAll: () => void;
  loading?: boolean;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getPartnerName(doc: LibraryDocument): string {
  if (doc.partner) {
    return doc.partner.trade_name ?? doc.partner.legal_name;
  }
  return '—';
}

function hasPdf(doc: LibraryDocument): boolean {
  return !!(
    doc.local_pdf_path ??
    doc.qonto_pdf_url ??
    doc.qonto_attachment_id ??
    doc.uploaded_file_url
  );
}

// =====================================================================
// COMPONENT
// =====================================================================

export function DocumentList({
  documents,
  selectedDocumentId,
  selectedIds,
  onSelectDocument,
  onToggleSelection,
  onToggleAll,
  loading,
}: DocumentListProps) {
  const allSelected =
    documents.length > 0 && selectedIds.length === documents.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <FileText className="h-12 w-12 opacity-30" />
        <p className="text-sm">Aucun document pour cette période</p>
        <p className="text-xs">Sélectionnez un mois dans l&apos;arborescence</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b uppercase tracking-wide flex-shrink-0">
        <div className="col-span-1 flex items-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => onToggleAll()}
            aria-label="Tout sélectionner"
          />
        </div>
        <div className="col-span-3">N° Document</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Partenaire</div>
        <div className="col-span-2 text-right">Montant HT</div>
        <div className="col-span-1 text-center">Statut</div>
        <div className="col-span-1 text-center">PDF</div>
      </div>

      {/* Rows */}
      <ScrollArea className="flex-1">
        <div>
          {documents.map(doc => {
            const isSelected = selectedDocumentId === doc.id;
            const isChecked = selectedIds.includes(doc.id);

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={cn(
                  'grid grid-cols-12 gap-2 px-4 py-2.5 border-b cursor-pointer transition-colors items-center',
                  'hover:bg-muted/30',
                  isSelected && 'bg-primary/5 border-l-2 border-l-primary'
                )}
              >
                <div className="col-span-1 flex items-center">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={e => {
                      e.valueOf(); // prevent row click
                      onToggleSelection(doc.id);
                    }}
                    onClick={e => e.stopPropagation()}
                    aria-label={`Sélectionner ${doc.document_number ?? doc.id}`}
                  />
                </div>
                <div className="col-span-3">
                  <span className="text-sm font-medium truncate block">
                    {doc.document_number ?? '—'}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {formatDate(doc.document_date)}
                </div>
                <div className="col-span-2">
                  <span
                    className="text-sm truncate block"
                    title={getPartnerName(doc)}
                  >
                    {getPartnerName(doc)}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <Money amount={doc.total_ht} size="sm" />
                </div>
                <div className="col-span-1 flex justify-center">
                  {doc.status && <StatusPill status={doc.status} size="sm" />}
                </div>
                <div className="col-span-1 flex justify-center">
                  {hasPdf(doc) ? (
                    <Badge
                      variant="outline"
                      className="text-xs px-1.5 py-0 text-green-600 border-green-200"
                    >
                      PDF
                    </Badge>
                  ) : (
                    <span title="Pas de PDF">
                      <FileWarning className="h-4 w-4 text-amber-400" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex-shrink-0">
        <span>
          {documents.length} document{documents.length > 1 ? 's' : ''}
          {selectedIds.length > 0 &&
            ` — ${selectedIds.length} sélectionné${selectedIds.length > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
}
