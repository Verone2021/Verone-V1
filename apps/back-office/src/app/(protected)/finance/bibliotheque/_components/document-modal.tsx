'use client';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Download, ExternalLink, FileText } from 'lucide-react';

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

interface DocumentModalProps {
  document: LibraryDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentModal({
  document: doc,
  open,
  onOpenChange,
}: DocumentModalProps) {
  if (!doc) return null;

  const pdfUrl = getPdfUrl(doc);

  const date = doc.document_date
    ? new Date(doc.document_date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
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
          <div className="border-r overflow-hidden">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title={doc.document_number ?? 'Document PDF'}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/30">
                <div className="text-center space-y-2">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground/30" />
                  <p className="text-muted-foreground">Aucun PDF disponible</p>
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
                  : 'Facture client (Abby)'}
              </p>
            </div>

            {/* Actions */}
            {pdfUrl && (
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href={pdfUrl} download>
                    <Download className="h-4 w-4" />
                    Telecharger
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir dans un nouvel onglet
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
