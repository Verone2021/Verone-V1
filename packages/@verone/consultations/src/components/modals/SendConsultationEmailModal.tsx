'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { pdf } from '@react-pdf/renderer';
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

interface LinkedQuote {
  id: string;
  document_number: string;
  qonto_pdf_url: string | null;
  qonto_invoice_id: string | null;
}

interface AttachmentBlob {
  blob: Blob;
  url: string;
  ready: boolean;
  error: string | null;
}

interface SendConsultationEmailModalProps {
  open: boolean;
  onClose: () => void;
  consultationId: string;
  clientEmail: string;
  clientName: string;
  consultationPdfDocument: React.ReactElement | null;
  linkedQuotes?: LinkedQuote[];
  onSent?: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Strip data:...;base64, prefix — Resend expects raw base64
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ── Constants ───────────────────────────────────────────────────────

const DEFAULT_MESSAGE = `Bonjour,

Suite a notre echange, veuillez trouver ci-joint le resume de votre consultation.

N'hesitez pas a nous contacter pour toute question.

Cordialement,
L'equipe Verone`;

// ── Component ───────────────────────────────────────────────────────

export function SendConsultationEmailModal({
  open,
  onClose,
  consultationId,
  clientEmail,
  clientName,
  consultationPdfDocument,
  linkedQuotes = [],
  onSent,
}: SendConsultationEmailModalProps) {
  const { toast: _toast } = useToast();

  const [to, setTo] = useState(clientEmail);
  const [subject, setSubject] = useState(`Consultation Verone — ${clientName}`);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [attachConsultationPdf, setAttachConsultationPdf] = useState(true);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<Set<string>>(
    new Set()
  );
  const [sending, setSending] = useState(false);

  // PDF blob storage: key = 'consultation' | quote.id
  const [blobs, setBlobs] = useState<Map<string, AttachmentBlob>>(new Map());
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const generatingRef = useRef(false);

  // ── Reset state when modal opens ──
  useEffect(() => {
    if (open) {
      setTo(clientEmail);
      setSubject(`Consultation Verone — ${clientName}`);
      setMessage(DEFAULT_MESSAGE);
      setAttachConsultationPdf(true);
      setSelectedQuoteIds(new Set());
      setSending(false);
      setBlobs(new Map());
      setPreviewUrl(null);
      generatingRef.current = false;
    }
  }, [open, clientEmail, clientName]);

  // ── Generate PDFs when modal opens ──
  const generatePdfs = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;

    // Generate consultation PDF
    if (consultationPdfDocument) {
      try {
        const blob = await pdf(consultationPdfDocument).toBlob();
        const url = URL.createObjectURL(blob);
        setBlobs(prev => {
          const next = new Map(prev);
          next.set('consultation', { blob, url, ready: true, error: null });
          return next;
        });
      } catch (err) {
        console.error('[SendEmail] Consultation PDF generation failed:', err);
        setBlobs(prev => {
          const next = new Map(prev);
          next.set('consultation', {
            blob: new Blob(),
            url: '',
            ready: false,
            error: String(err),
          });
          return next;
        });
      }
    }

    // Fetch quote PDFs via API proxy (real-time from Qonto)
    for (const quote of linkedQuotes) {
      if (!quote.qonto_invoice_id) {
        setBlobs(prev => {
          const next = new Map(prev);
          next.set(quote.id, {
            blob: new Blob(),
            url: '',
            ready: false,
            error: "PDF non disponible — lier le devis à Qonto d'abord",
          });
          return next;
        });
        continue;
      }
      try {
        const response = await fetch(
          `/api/qonto/quotes/${quote.qonto_invoice_id}/pdf`
        );
        if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobs(prev => {
          const next = new Map(prev);
          next.set(quote.id, { blob, url, ready: true, error: null });
          return next;
        });
      } catch (err) {
        console.error(
          `[SendEmail] Quote ${quote.document_number} PDF failed:`,
          err
        );
        setBlobs(prev => {
          const next = new Map(prev);
          next.set(quote.id, {
            blob: new Blob(),
            url: '',
            ready: false,
            error: String(err),
          });
          return next;
        });
      }
    }
  }, [consultationPdfDocument, linkedQuotes]);

  useEffect(() => {
    if (open) {
      void generatePdfs().catch(err => {
        console.error('[SendEmail] PDF generation error:', err);
      });
    }
    // Cleanup blob URLs on close
    return () => {
      setBlobs(prev => {
        for (const entry of prev.values()) {
          if (entry.url) URL.revokeObjectURL(entry.url);
        }
        return new Map();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on open
  }, [open]);

  // ── Check if all selected attachments are ready ──
  const allSelectedReady = (() => {
    if (attachConsultationPdf) {
      const entry = blobs.get('consultation');
      if (!entry?.ready) return false;
    }
    for (const qId of selectedQuoteIds) {
      const entry = blobs.get(qId);
      if (!entry?.ready) return false;
    }
    return true;
  })();

  // ── Toggle quote selection ──
  const toggleQuote = (quoteId: string, checked: boolean) => {
    setSelectedQuoteIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(quoteId);
      else next.delete(quoteId);
      return next;
    });
  };

  // ── Status badge for an attachment ──
  const StatusBadge = ({ id }: { id: string }) => {
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
  };

  // ── Preview handler ──
  const handlePreview = (id: string, title: string) => {
    const entry = blobs.get(id);
    if (entry?.url) {
      setPreviewUrl(entry.url);
      setPreviewTitle(title);
    }
  };

  // ── Download handler ──
  const handleDownload = (id: string, filename: string) => {
    const entry = blobs.get(id);
    if (entry?.blob) {
      saveAs(entry.blob, filename);
    }
  };

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
      // Build attachments array with base64 content
      const attachments: Array<{
        filename: string;
        contentBase64: string;
        type: 'consultation_pdf' | 'quote';
        quoteId?: string;
      }> = [];

      if (attachConsultationPdf) {
        const entry = blobs.get('consultation');
        if (entry?.ready) {
          const base64 = await blobToBase64(entry.blob);
          attachments.push({
            filename: `consultation-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
            contentBase64: base64,
            type: 'consultation_pdf',
          });
        }
      }

      for (const qId of selectedQuoteIds) {
        const entry = blobs.get(qId);
        const quote = linkedQuotes.find(q => q.id === qId);
        if (entry?.ready && quote) {
          const base64 = await blobToBase64(entry.blob);
          attachments.push({
            filename: `devis-${quote.document_number}.pdf`,
            contentBase64: base64,
            type: 'quote',
            quoteId: qId,
          });
        }
      }

      const response = await fetch('/api/emails/send-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId,
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
        description: `Consultation envoyee a ${to}`,
      });
      onSent?.();
      onClose();
    } catch (error) {
      console.error('[SendConsultationEmail] Send failed:', error);
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

  // ── Consultation PDF filename ──
  const consultationFilename = `consultation-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`;

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
              Envoyer la consultation par email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Recipient */}
            <div className="space-y-1.5">
              <Label htmlFor="email-to">Destinataire</Label>
              <Input
                id="email-to"
                type="email"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="email-subject">Objet</Label>
              <Input
                id="email-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                className="resize-y"
              />
            </div>

            {/* Attachments */}
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
                        setAttachConsultationPdf(checked === true)
                      }
                    />
                    <label
                      htmlFor="attach-consultation-pdf"
                      className="text-sm cursor-pointer"
                    >
                      PDF consultation
                    </label>
                    <StatusBadge id="consultation" />
                  </div>
                  <div className="flex items-center gap-1">
                    <ButtonUnified
                      variant="ghost"
                      size="sm"
                      disabled={!blobs.get('consultation')?.ready}
                      onClick={() =>
                        handlePreview(
                          'consultation',
                          `Consultation — ${clientName}`
                        )
                      }
                      title="Apercu"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </ButtonUnified>
                    <ButtonUnified
                      variant="ghost"
                      size="sm"
                      disabled={!blobs.get('consultation')?.ready}
                      onClick={() =>
                        handleDownload('consultation', consultationFilename)
                      }
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
                        toggleQuote(quote.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={`attach-quote-${quote.id}`}
                      className="text-sm cursor-pointer"
                    >
                      Devis {quote.document_number}
                    </label>
                    <StatusBadge id={quote.id} />
                  </div>
                  <div className="flex items-center gap-1">
                    <ButtonUnified
                      variant="ghost"
                      size="sm"
                      disabled={!blobs.get(quote.id)?.ready}
                      onClick={() =>
                        handlePreview(
                          quote.id,
                          `Devis ${quote.document_number}`
                        )
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
                        handleDownload(
                          quote.id,
                          `devis-${quote.document_number}.pdf`
                        )
                      }
                      title="Telecharger"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </ButtonUnified>
                  </div>
                </div>
              ))}
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
                  console.error('[SendConsultationEmail] Unhandled:', error);
                });
              }}
              disabled={
                sending || !to || !subject || !message || !allSelectedReady
              }
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
                {previewTitle}
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
                title={previewTitle}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
