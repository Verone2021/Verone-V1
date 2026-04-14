'use client';

import React from 'react';

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
  type LinkedQuote,
} from './ConsultationEmailAttachments';
import { PdfPreviewDialog } from './PdfPreviewDialog';
import { useConsultationEmail } from './use-consultation-email';

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
  const {
    to,
    setTo,
    subject,
    setSubject,
    message,
    setMessage,
    attachConsultationPdf,
    setAttachConsultationPdf,
    selectedQuoteIds,
    sending,
    blobs,
    previewUrl,
    previewTitle,
    allSelectedReady,
    toggleQuote,
    handlePreview,
    handleDownload,
    handleSend,
    setPreviewUrl,
  } = useConsultationEmail({
    open,
    onClose,
    consultationId,
    clientEmail,
    clientName,
    consultationPdfDocument,
    linkedQuotes,
    onSent,
  });

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

      <PdfPreviewDialog
        previewUrl={previewUrl}
        previewTitle={previewTitle}
        onClose={() => setPreviewUrl(null)}
      />
    </>
  );
}
