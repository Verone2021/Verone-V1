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

import { PdfPreviewDialog } from './PdfPreviewDialog';
import { RecipientSelector } from './RecipientSelector';
import {
  type AttachmentBlob,
  blobToBase64,
  DOC_TYPE_LABELS,
  DOC_TYPE_FILENAME_PREFIX,
  getDefaultMessage,
  getDefaultSubject,
  sendToRecipients,
} from './send-document-helpers';

// ── Types ──────────────────────────────────────────────────────────

export type DocumentEmailType =
  | 'quote'
  | 'invoice'
  | 'proforma'
  | 'credit_note';

export interface EmailContact {
  id: string;
  name: string;
  email: string;
  role: string;
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
  /** Contacts from linked sales order (billing, responsable, etc.) */
  contacts?: EmailContact[];
  onSent?: () => void;
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
  contacts = [],
  onSent,
}: SendDocumentEmailModalProps) {
  const { toast: _toast } = useToast();

  const [recipients, setRecipients] = useState<string[]>([]);
  const [manualEmail, setManualEmail] = useState('');
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
      // Pre-fill recipients: client email if available
      const initial = clientEmail ? [clientEmail] : [];
      setRecipients(initial);
      setManualEmail('');
      setSubject(getDefaultSubject(documentType, documentNumber));
      setMessage(getDefaultMessage(documentType, documentNumber));
      setAttachPdf(true);
      setSending(false);
      setPdfBlob(null);
      setPreviewUrl(null);
      fetchingRef.current = false;
    }
  }, [open, clientEmail, documentType, documentNumber]);

  // ── Recipient helpers ──
  const addRecipient = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (
      trimmed &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) &&
      !recipients.includes(trimmed)
    ) {
      setRecipients(prev => [...prev, trimmed]);
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(prev => prev.filter(r => r !== email));
  };

  const handleManualEmailKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addRecipient(manualEmail);
      setManualEmail('');
    }
  };

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
  const canSend =
    recipients.length > 0 && subject && message && (!attachPdf || pdfReady);

  // ── Send handler ──
  const handleSend = async () => {
    if (recipients.length === 0 || !subject || !message) {
      _toast({
        title: 'Champs requis',
        description:
          'Au moins un destinataire, objet et message sont obligatoires.',
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

      const { succeeded, failed } = await sendToRecipients({
        recipients,
        documentType,
        documentId,
        documentNumber,
        subject,
        message,
        attachments,
      });

      if (failed > 0 && succeeded > 0) {
        _toast({
          title: 'Envoi partiel',
          description: `${String(succeeded)} envoye(s), ${String(failed)} echoue(s)`,
          variant: 'destructive',
        });
      } else if (failed > 0) {
        throw new Error(`Echec d'envoi pour ${String(failed)} destinataire(s)`);
      } else {
        _toast({
          title: 'Email envoye',
          description: `${docLabel} envoye a ${String(succeeded)} destinataire(s)`,
        });
      }

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
            {/* Recipients */}
            <RecipientSelector
              recipients={recipients}
              manualEmail={manualEmail}
              contacts={contacts}
              onAddRecipient={addRecipient}
              onRemoveRecipient={removeRecipient}
              onManualEmailChange={setManualEmail}
              onManualEmailKeyDown={handleManualEmailKeyDown}
              onManualEmailBlur={() => {
                if (manualEmail.trim()) {
                  addRecipient(manualEmail);
                  setManualEmail('');
                }
              }}
            />

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

      <PdfPreviewDialog
        previewUrl={previewUrl}
        onClose={() => setPreviewUrl(null)}
        title={`${docLabel} ${documentNumber}`}
      />
    </>
  );
}
