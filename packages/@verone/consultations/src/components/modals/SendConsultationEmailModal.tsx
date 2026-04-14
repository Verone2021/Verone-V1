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
import { Loader2, Mail } from 'lucide-react';

import {
  ConsultationEmailAttachments,
  type AttachmentBlob,
  type LinkedQuote,
} from './ConsultationEmailAttachments';

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

const DEFAULT_MESSAGE = `Bonjour,

Suite a notre echange, veuillez trouver ci-joint le resume de votre consultation.

N'hesitez pas a nous contacter pour toute question.

Cordialement,
L'equipe Verone`;

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
  const [blobs, setBlobs] = useState<Map<string, AttachmentBlob>>(new Map());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const generatingRef = useRef(false);

  // Reset on open
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

  // Generate PDFs when modal opens
  const generatePdfs = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;

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

  const toggleQuote = (quoteId: string, checked: boolean) => {
    setSelectedQuoteIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(quoteId);
      else next.delete(quoteId);
      return next;
    });
  };

  const handlePreview = (id: string, title: string) => {
    const entry = blobs.get(id);
    if (entry?.url) {
      setPreviewUrl(entry.url);
      setPreviewTitle(title);
    }
  };

  const handleDownload = (id: string, filename: string) => {
    const entry = blobs.get(id);
    if (entry?.blob) {
      saveAs(entry.blob, filename);
    }
  };

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

            <div className="space-y-1.5">
              <Label htmlFor="email-subject">Objet</Label>
              <Input
                id="email-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

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

            <ConsultationEmailAttachments
              blobs={blobs}
              clientName={clientName}
              consultationPdfDocument={consultationPdfDocument}
              linkedQuotes={linkedQuotes}
              attachConsultationPdf={attachConsultationPdf}
              selectedQuoteIds={selectedQuoteIds}
              onToggleConsultationPdf={setAttachConsultationPdf}
              onToggleQuote={toggleQuote}
              onPreview={handlePreview}
              onDownload={handleDownload}
            />
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
