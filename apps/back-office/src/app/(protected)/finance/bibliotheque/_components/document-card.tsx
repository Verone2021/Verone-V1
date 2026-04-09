'use client';

import { memo, useState } from 'react';

import { Badge, Button, ConfirmDialog } from '@verone/ui';
import {
  Download,
  ExternalLink,
  FileText,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import type { LibraryDocument } from '@verone/finance';
import { formatDocType, formatMoney, getPdfUrl } from '@verone/finance';

interface DocumentCardProps {
  document: LibraryDocument;
  onSelect: (doc: LibraryDocument) => void;
  onPdfDeleted?: () => Promise<void>;
}

export const DocumentCard = memo(function DocumentCard({
  document: doc,
  onSelect,
  onPdfDeleted,
}: DocumentCardProps) {
  const pdfUrl = getPdfUrl(doc);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const date = doc.document_date
    ? new Date(doc.document_date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      })
    : null;

  const canDeletePdf = !!doc.pdf_url;

  const handleDeletePdf = async () => {
    try {
      const response = await fetch(
        `/api/library/documents/${doc.id}?source=${doc.source_table}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          body &&
          typeof body === 'object' &&
          'error' in body &&
          body.error &&
          typeof body.error === 'object' &&
          'message' in body.error &&
          typeof body.error.message === 'string'
            ? body.error.message
            : `Erreur ${response.status}`;
        throw new Error(message);
      }

      toast.success('PDF supprime de la bibliotheque locale');
      if (onPdfDeleted) {
        await onPdfDeleted();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la suppression'
      );
      throw error; // Re-throw so ConfirmDialog stays open
    }
  };

  const handleCardClick = () => {
    if (!menuOpen) {
      onSelect(doc);
    }
  };

  return (
    <>
      <div
        className="group relative flex flex-col rounded-lg border bg-card text-left transition-all hover:shadow-md hover:border-primary/50 overflow-hidden cursor-pointer"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`${doc.partner_name ?? 'Document'} — ${formatDocType(doc)} — ${date ?? ''} — ${formatMoney(doc.total_ht)} HT`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* PDF preview thumbnail */}
        <div className="relative h-[180px] bg-muted/30 overflow-hidden border-b">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-[300px] origin-top-left scale-[0.6] pointer-events-none"
              title={doc.document_number ?? 'Document'}
              tabIndex={-1}
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* CTA buttons — visible on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="relative">
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 shadow-sm"
              onClick={e => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              aria-label="Actions du document"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>

            {/* Dropdown menu */}
            {menuOpen && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-20"
                  onClick={e => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-8 z-30 w-48 rounded-md border bg-popover p-1 shadow-md">
                  {pdfUrl && (
                    <>
                      <a
                        href={pdfUrl}
                        download
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Telecharger
                      </a>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ouvrir dans un onglet
                      </a>
                    </>
                  )}
                  {canDeletePdf && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        setConfirmDeleteOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer le PDF
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
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
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Supprimer le PDF ?"
        description="Le PDF sera supprime de la bibliotheque locale. Le justificatif original sur Qonto ne sera pas affecte."
        variant="destructive"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeletePdf}
      />
    </>
  );
});
