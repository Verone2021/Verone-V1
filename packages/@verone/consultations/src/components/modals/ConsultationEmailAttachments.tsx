'use client';

/**
 * Attachment components for SendConsultationEmailModal
 */

import React from 'react';

import { ButtonUnified } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  Loader2,
  Paperclip,
} from 'lucide-react';

export interface AttachmentBlob {
  blob: Blob;
  url: string;
  ready: boolean;
  error: string | null;
}

export interface LinkedQuote {
  id: string;
  document_number: string;
  qonto_pdf_url: string | null;
  qonto_invoice_id: string | null;
}

// ── Status badge ──────────────────────────────────────────────────────────────

export function AttachmentStatusBadge({
  id,
  blobs,
}: {
  id: string;
  blobs: Map<string, AttachmentBlob>;
}) {
  const entry = blobs.get(id);
  if (!entry) {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />;
  }
  if (entry.error) {
    return (
      <span title={entry.error}>
        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
      </span>
    );
  }
  if (entry.ready) {
    return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
  }
  return <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />;
}

// ── Attachments section ───────────────────────────────────────────────────────

interface ConsultationEmailAttachmentsProps {
  blobs: Map<string, AttachmentBlob>;
  clientName: string;
  consultationPdfDocument: React.ReactElement | null;
  linkedQuotes: LinkedQuote[];
  attachConsultationPdf: boolean;
  selectedQuoteIds: Set<string>;
  onToggleConsultationPdf: (checked: boolean) => void;
  onToggleQuote: (quoteId: string, checked: boolean) => void;
  onPreview: (id: string, title: string) => void;
  onDownload: (id: string, filename: string) => void;
}

export function ConsultationEmailAttachments({
  blobs,
  clientName,
  consultationPdfDocument,
  linkedQuotes,
  attachConsultationPdf,
  selectedQuoteIds,
  onToggleConsultationPdf,
  onToggleQuote,
  onPreview,
  onDownload,
}: ConsultationEmailAttachmentsProps) {
  const consultationFilename = `consultation-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Paperclip className="h-3.5 w-3.5 text-gray-500" />
        Pieces jointes
      </Label>

      {/* Consultation PDF */}
      {consultationPdfDocument && (
        <div className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="attach-consultation-pdf"
              checked={attachConsultationPdf}
              onCheckedChange={checked =>
                onToggleConsultationPdf(checked === true)
              }
            />
            <label
              htmlFor="attach-consultation-pdf"
              className="text-sm cursor-pointer"
            >
              PDF consultation
            </label>
            <AttachmentStatusBadge id="consultation" blobs={blobs} />
          </div>
          <div className="flex items-center gap-1">
            <ButtonUnified
              variant="ghost"
              size="sm"
              disabled={!blobs.get('consultation')?.ready}
              onClick={() =>
                onPreview('consultation', `Consultation — ${clientName}`)
              }
              title="Apercu"
            >
              <Eye className="h-3.5 w-3.5" />
            </ButtonUnified>
            <ButtonUnified
              variant="ghost"
              size="sm"
              disabled={!blobs.get('consultation')?.ready}
              onClick={() => onDownload('consultation', consultationFilename)}
              title="Telecharger"
            >
              <Download className="h-3.5 w-3.5" />
            </ButtonUnified>
          </div>
        </div>
      )}

      {/* Quote PDFs */}
      {linkedQuotes.map(quote => (
        <div
          key={quote.id}
          className="flex items-center justify-between rounded border border-gray-100 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Checkbox
              id={`attach-quote-${quote.id}`}
              checked={selectedQuoteIds.has(quote.id)}
              onCheckedChange={checked =>
                onToggleQuote(quote.id, checked === true)
              }
            />
            <label
              htmlFor={`attach-quote-${quote.id}`}
              className="text-sm cursor-pointer"
            >
              Devis {quote.document_number}
            </label>
            <AttachmentStatusBadge id={quote.id} blobs={blobs} />
          </div>
          <div className="flex items-center gap-1">
            <ButtonUnified
              variant="ghost"
              size="sm"
              disabled={!blobs.get(quote.id)?.ready}
              onClick={() =>
                onPreview(quote.id, `Devis ${quote.document_number}`)
              }
              title="Apercu"
            >
              <Eye className="h-3.5 w-3.5" />
            </ButtonUnified>
            <ButtonUnified
              variant="ghost"
              size="sm"
              disabled={!blobs.get(quote.id)?.ready}
              onClick={() =>
                onDownload(quote.id, `devis-${quote.document_number}.pdf`)
              }
              title="Telecharger"
            >
              <Download className="h-3.5 w-3.5" />
            </ButtonUnified>
          </div>
        </div>
      ))}
    </div>
  );
}
