'use client';

import { useState } from 'react';

import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import type { LibraryDocument } from '@verone/finance';
import { formatDocType, formatMoney, getPdfUrl } from '@verone/finance';

interface DocumentModalProps {
  document: LibraryDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPdfDeleted?: () => Promise<void>;
}

export function DocumentModal({
  document: doc,
  open,
  onOpenChange,
  onPdfDeleted,
}: DocumentModalProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);

  if (!doc) return null;

  const pdfUrl = getPdfUrl(doc);
  const canDeletePdf = doc.pdf_url && doc.source_table !== 'invoices';

  const date = doc.document_date
    ? new Date(doc.document_date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '-';

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
      onOpenChange(false);
      if (onPdfDeleted) {
        await onPdfDeleted();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la suppression'
      );
      throw error; // Re-throw so ConfirmDialog stays open for retry
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {doc.document_number ?? formatDocType(doc)}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-[1fr_320px] gap-0 overflow-hidden">
            {/* Left: PDF viewer */}
            <div className="border-r overflow-hidden relative">
              {pdfUrl ? (
                <>
                  {pdfLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    title={doc.document_number ?? 'Document PDF'}
                    onLoad={() => setPdfLoading(false)}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-muted/30">
                  <div className="text-center space-y-2">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground/30" />
                    <p className="text-muted-foreground">
                      Aucun PDF disponible
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Metadata */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Partner */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Partenaire
                </p>
                <p className="font-medium">
                  {doc.partner_name ?? 'Non renseigne'}
                </p>
              </div>

              {/* Type */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Type
                </p>
                <Badge variant="secondary">{formatDocType(doc)}</Badge>
              </div>

              {/* Number */}
              {doc.document_number && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Numero
                  </p>
                  <p className="font-mono text-sm">{doc.document_number}</p>
                </div>
              )}

              {/* Date */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Date
                </p>
                <p className="text-sm">{date}</p>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Montant HT
                  </p>
                  <p className="font-semibold">{formatMoney(doc.total_ht)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Montant TTC
                  </p>
                  <p className="font-semibold">{formatMoney(doc.total_ttc)}</p>
                </div>
              </div>

              {/* Status */}
              {doc.status && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Statut
                  </p>
                  <Badge variant="outline">{doc.status}</Badge>
                </div>
              )}

              {/* PCG */}
              {doc.pcg_code && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Compte PCG
                  </p>
                  <Badge variant="secondary">{doc.pcg_code}</Badge>
                </div>
              )}

              {/* Source */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Source
                </p>
                <p className="text-xs text-muted-foreground">
                  {doc.source_table === 'financial_documents'
                    ? 'Document financier (Qonto)'
                    : doc.source_table === 'bank_transactions'
                      ? 'Justificatif bancaire (Qonto)'
                      : 'Facture client (Abby)'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {pdfUrl && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      asChild
                    >
                      <a href={pdfUrl} download>
                        <Download className="h-4 w-4" />
                        Telecharger
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      asChild
                    >
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ouvrir dans un nouvel onglet
                      </a>
                    </Button>
                  </>
                )}
                {canDeletePdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer le PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
}
