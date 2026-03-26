'use client';

import { Button, ScrollArea } from '@verone/ui';
import { Money, StatusPill } from '@verone/ui-business';
import { Download, ExternalLink, FileText } from 'lucide-react';

import { type LibraryDocument, getPdfUrl } from '@verone/finance/hooks';

// =====================================================================
// TYPES
// =====================================================================

interface PdfPreviewProps {
  document: LibraryDocument | null;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// =====================================================================
// SUB-COMPONENTS
// =====================================================================

interface PdfFrameProps {
  pdfUrl: string | null;
  documentId: string;
  documentNumber: string | null;
}

function PdfFrame({ pdfUrl, documentId, documentNumber }: PdfFrameProps) {
  if (pdfUrl) {
    return (
      <iframe
        src={pdfUrl}
        className="w-full h-full min-h-[400px]"
        title={`PDF ${documentNumber ?? documentId}`}
      />
    );
  }
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 min-h-[400px]">
      <FileText className="h-12 w-12 opacity-30" />
      <p className="text-sm">Aucun PDF disponible</p>
    </div>
  );
}

interface PdfMetadataProps {
  doc: LibraryDocument;
  pdfUrl: string | null;
}

function PdfMetadata({ doc, pdfUrl }: PdfMetadataProps) {
  return (
    <div className="p-4 space-y-3">
      <h3 className="font-semibold text-sm">
        {doc.document_number ?? 'Sans numéro'}
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span>{formatDate(doc.document_date)}</span>
        </div>
        {doc.partner_name && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Partenaire</span>
            <span className="text-right truncate ml-2">{doc.partner_name}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Montant HT</span>
          <Money amount={doc.total_ht} size="sm" bold />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Montant TTC</span>
          <Money amount={doc.total_ttc} size="sm" />
        </div>
        {doc.status && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Statut</span>
            <StatusPill status={doc.status} size="sm" />
          </div>
        )}
      </div>

      {pdfUrl && (
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            asChild
          >
            <a
              href={pdfUrl}
              download={`${doc.document_number ?? 'document'}.pdf`}
            >
              <Download className="h-3.5 w-3.5" />
              Télécharger
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            asChild
          >
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Ouvrir
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// COMPONENT
// =====================================================================

export function PdfPreview({ document: doc }: PdfPreviewProps) {
  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-6">
        <FileText className="h-16 w-16 opacity-20" />
        <p className="text-sm text-center">
          Sélectionnez un document pour afficher l&apos;aperçu
        </p>
      </div>
    );
  }

  const pdfUrl = getPdfUrl(doc);

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex-1 min-h-[400px] border-b">
          <PdfFrame
            pdfUrl={pdfUrl}
            documentId={doc.id}
            documentNumber={doc.document_number}
          />
        </div>
        <PdfMetadata doc={doc} pdfUrl={pdfUrl} />
      </div>
    </ScrollArea>
  );
}
