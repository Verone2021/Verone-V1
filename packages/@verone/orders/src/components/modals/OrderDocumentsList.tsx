'use client';

/**
 * OrderDocumentsList - Documents section for SendOrderDocumentsModal
 */

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

export interface LinkedDocument {
  id: string;
  document_number: string;
  document_type: 'customer_quote' | 'customer_invoice';
  qonto_invoice_id: string | null;
  qonto_pdf_url: string | null;
  total_ttc: number;
  status: string;
  quote_status: string | null;
}

export interface AttachmentBlob {
  blob: Blob;
  url: string;
  ready: boolean;
  error: string | null;
}

// ── Status badge ──────────────────────────────────────────────────────────────

export function OrderDocumentStatusBadge({
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

function documentTypeLabel(type: string): string {
  return type === 'customer_quote' ? 'Devis' : 'Facture';
}

// ── Documents list ────────────────────────────────────────────────────────────

interface OrderDocumentsListProps {
  blobs: Map<string, AttachmentBlob>;
  linkedDocuments: LinkedDocument[];
  selectedDocIds: Set<string>;
  onToggleDoc: (docId: string, checked: boolean) => void;
  onPreview: (id: string, title: string) => void;
  onDownload: (id: string, filename: string) => void;
}

export function OrderDocumentsList({
  blobs,
  linkedDocuments,
  selectedDocIds,
  onToggleDoc,
  onPreview,
  onDownload,
}: OrderDocumentsListProps) {
  const hasDocuments = linkedDocuments.length > 0;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Paperclip className="h-3.5 w-3.5 text-gray-500" />
        Pieces jointes
      </Label>

      {!hasDocuments && (
        <p className="text-sm text-gray-500 italic">
          Aucun devis ou facture lie a cette commande. Generez-en un avant
          d&apos;envoyer.
        </p>
      )}

      {linkedDocuments.map(doc => {
        const typeLabel = documentTypeLabel(doc.document_type);
        const filename = `${typeLabel.toLowerCase()}-${doc.document_number}.pdf`;

        return (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded border border-gray-100 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Checkbox
                id={`attach-${doc.id}`}
                checked={selectedDocIds.has(doc.id)}
                onCheckedChange={checked =>
                  onToggleDoc(doc.id, checked === true)
                }
                disabled={!blobs.get(doc.id)?.ready}
              />
              <label
                htmlFor={`attach-${doc.id}`}
                className="text-sm cursor-pointer"
              >
                {typeLabel} {doc.document_number}
              </label>
              <OrderDocumentStatusBadge id={doc.id} blobs={blobs} />
            </div>
            <div className="flex items-center gap-1">
              <ButtonUnified
                variant="ghost"
                size="sm"
                disabled={!blobs.get(doc.id)?.ready}
                onClick={() =>
                  onPreview(doc.id, `${typeLabel} ${doc.document_number}`)
                }
                title="Apercu"
              >
                <Eye className="h-3.5 w-3.5" />
              </ButtonUnified>
              <ButtonUnified
                variant="ghost"
                size="sm"
                disabled={!blobs.get(doc.id)?.ready}
                onClick={() => onDownload(doc.id, filename)}
                title="Telecharger"
              >
                <Download className="h-3.5 w-3.5" />
              </ButtonUnified>
            </div>
          </div>
        );
      })}
    </div>
  );
}
