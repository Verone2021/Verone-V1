'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { saveAs } from 'file-saver';

import { useToast } from '@verone/common';
import { ButtonUnified } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import {
  Mail,
  Loader2,
  Paperclip,
  Eye,
  Download,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────

export type DocumentEmailType =
  | 'quote'
  | 'invoice'
  | 'proforma'
  | 'credit_note';

interface AttachmentBlob {
  blob: Blob;
  url: string;
  ready: boolean;
  error: string | null;
}

interface SendDocumentEmailModalProps {
  open: boolean;
  onClose: () => void;
  documentType: DocumentEmailType;
  documentId: string;
  documentNumber: string;
  clientEmail: string;
  clientName: string;
  pdfUrl: string;
  onSent?: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const DOC_TYPE_LABELS: Record<DocumentEmailType, string> = {
  quote: 'Devis',
  invoice: 'Facture',
  proforma: 'Facture proforma',
  credit_note: 'Avoir',
};

const DOC_TYPE_FILENAME_PREFIX: Record<DocumentEmailType, string> = {
  quote: 'devis',
  invoice: 'facture',
  proforma: 'facture-proforma',
  credit_note: 'avoir',
};

function getDefaultMessage(
  docType: DocumentEmailType,
  docNumber: string
): string {
  const label = DOC_TYPE_LABELS[docType].toLowerCase();
  return `Bonjour,

Veuillez trouver ci-joint votre ${label} n${String.fromCharCode(176)}${docNumber}.

N'hesitez pas a nous contacter pour toute question.

Cordialement,
L'equipe Verone`;
}

function getDefaultSubject(
  docType: DocumentEmailType,
  docNumber: string
): string {
  return `${DOC_TYPE_LABELS[docType]} ${docNumber} — Verone`;
}

// ── Component ───────────────────────────────────────────────────────

export function SendDocumentEmailModal({
  open,
  onClose,
  documentType,
  documentId,
  documentNumber,
  clientEmail,
  clientName: _clientName,
  pdfUrl,
  onSent,
}: SendDocumentEmailModalProps) {
  const { toast: _toast } = useToast();

  const [to, setTo] = useState(clientEmail);
  const [subject, setSubject] = useState(
    getDefaultSubject(documentType, documentNumber)
  );
  const [message, setMessage] = useState(
    getDefaultMessage(documentType, documentNumber)
  );
  const [attachPdf, setAttachPdf] = useState(true);
  const [sending, setSending] = useState(false);

  const [pdfBlob, setPdfBlob] = useState<AttachmentBlob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const docLabel = DOC_TYPE_LABELS[documentType];
  const filenamePrefix = DOC_TYPE_FILENAME_PREFIX[documentType];

  // ── Reset state when modal opens ──
  useEffect(() => {
    if (open) {
      setTo(clientEmail);
      setSubject(getDefaultSubject(documentType, documentNumber));
      setMessage(getDefaultMessage(documentType, documentNumber));
      setAttachPdf(true);
      setSending(false);
      setPdfBlob(null);
      setPreviewUrl(null);
      fetchingRef.current = false;
    }
  }, [open, clientEmail, documentType, documentNumber]);

  // ── Fetch PDF when modal opens ──
  const fetchPdf = useCallback(async () => {
    if (fetchingRef.current || !pdfUrl) return;
    fetchingRef.current = true;

    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('PDF vide');
      const url = URL.createObjectURL(blob);
      setPdfBlob({ blob, url, ready: true, error: null });
    } catch (err) {
      console.error(`[SendDocumentEmail] PDF fetch failed:`, err);
      setPdfBlob({
        blob: new Blob(),
        url: '',
        ready: false,
        error: err instanceof Error ? err.message : 'Erreur PDF',
      });
    }
  }, [pdfUrl]);

  useEffect(() => {
    if (open) {
      void fetchPdf().catch(err => {
        console.error('[SendDocumentEmail] PDF fetch error:', err);
      });
    }
    return () => {
      if (pdfBlob?.url) URL.revokeObjectURL(pdfBlob.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on open
  }, [open]);

  const pdfReady = pdfBlob?.ready ?? false;
  const canSend = to && subject && message && (!attachPdf || pdfReady);

  // ── Send handler ──
  const handleSend = async () => {
    if (!to || !subject || !message) {
      _toast({
        title: 'Champs requis',
        description: 'Email, objet et message sont obligatoires.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const attachments: Array<{
        filename: string;
        contentBase64: string;
        type: string;
      }> = [];

      if (attachPdf && pdfBlob?.ready) {
        const base64 = await blobToBase64(pdfBlob.blob);
        attachments.push({
          filename: `${filenamePrefix}-${documentNumber}.pdf`,
          contentBase64: base64,
          type: documentType,
        });
      }

      const response = await fetch('/api/emails/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          documentId,
          documentNumber,
          to,
          subject,
          message,
          attachments,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error ?? 'Erreur inconnue');
      }

      _toast({
        title: 'Email envoye',
        description: `${docLabel} envoye a ${to}`,
      });
      onSent?.();
      onClose();
    } catch (error) {
      console.error('[SendDocumentEmail] Send failed:', error);
      _toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer l'email",
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // ── Status badge ──
  const StatusBadge = () => {
    if (!pdfBlob) {
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />;
    }
    if (pdfBlob.error) {
      return (
        <span title={pdfBlob.error}>
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
        </span>
      );
    }
    if (pdfBlob.ready) {
      return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    }
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />;
  };

  const pdfFilename = `${filenamePrefix}-${documentNumber}.pdf`;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={() => {
          if (!sending) onClose();
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Envoyer {docLabel.toLowerCase()} par email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Recipient */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-email-to">Destinataire</Label>
              <Input
                id="doc-email-to"
                type="email"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-email-subject">Objet</Label>
              <Input
                id="doc-email-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-email-message">Message</Label>
              <Textarea
                id="doc-email-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                className="resize-y"
              />
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-gray-500" />
                Piece jointe
              </Label>

              <div className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="attach-doc-pdf"
                    checked={attachPdf}
                    onCheckedChange={checked => setAttachPdf(checked === true)}
                  />
                  <label
                    htmlFor="attach-doc-pdf"
                    className="text-sm cursor-pointer"
                  >
                    PDF {docLabel.toLowerCase()} — {documentNumber}
                  </label>
                  <StatusBadge />
                </div>
                <div className="flex items-center gap-1">
                  <ButtonUnified
                    variant="ghost"
                    size="sm"
                    disabled={!pdfReady}
                    onClick={() => {
                      if (pdfBlob?.url) {
                        setPreviewUrl(pdfBlob.url);
                      }
                    }}
                    title="Apercu"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </ButtonUnified>
                  <ButtonUnified
                    variant="ghost"
                    size="sm"
                    disabled={!pdfReady}
                    onClick={() => {
                      if (pdfBlob?.blob) {
                        saveAs(pdfBlob.blob, pdfFilename);
                      }
                    }}
                    title="Telecharger"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </ButtonUnified>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <ButtonUnified
              variant="outline"
              onClick={onClose}
              disabled={sending}
            >
              Annuler
            </ButtonUnified>
            <ButtonUnified
              onClick={() => {
                void handleSend().catch(error => {
                  console.error('[SendDocumentEmail] Unhandled:', error);
                });
              }}
              disabled={sending || !canSend}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </ButtonUnified>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent
          dialogSize="full"
          hideCloseButton
          className="flex flex-col !p-0 !h-[90vh]"
        >
          <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold">
                {docLabel} {documentNumber}
              </DialogTitle>
              <ButtonUnified
                variant="outline"
                size="sm"
                onClick={() => setPreviewUrl(null)}
              >
                Fermer
              </ButtonUnified>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title={`${docLabel} ${documentNumber}`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
