'use client';

import { useToast as _useToast } from '@verone/common';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Loader2, Mail } from 'lucide-react';

import { OrderDocumentsList, type LinkedDocument } from './OrderDocumentsList';
import { OrderPdfPreviewDialog } from './OrderPdfPreviewDialog';
import { useOrderDocumentsEmail } from './use-order-documents-email';

export type { LinkedDocument };

export interface OrderContact {
  label: string;
  email: string;
}

export interface SendOrderDocumentsModalProps {
  open: boolean;
  onClose: () => void;
  salesOrderId: string;
  orderNumber: string;
  customerName: string;
  contacts: OrderContact[];
  linkedDocuments: LinkedDocument[];
  onSent?: () => void;
}

export function SendOrderDocumentsModal({
  open,
  onClose,
  salesOrderId,
  orderNumber,
  customerName,
  contacts,
  linkedDocuments,
  onSent,
}: SendOrderDocumentsModalProps) {
  const {
    to,
    setTo,
    subject,
    setSubject,
    message,
    setMessage,
    selectedDocIds,
    sending,
    blobs,
    previewUrl,
    previewTitle,
    allSelectedReady,
    toggleDoc,
    handlePreview,
    handleDownload,
    handleSend,
    setPreviewUrl,
  } = useOrderDocumentsEmail({
    open,
    onClose,
    salesOrderId,
    orderNumber,
    customerName,
    contacts,
    linkedDocuments,
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
              Envoyer documents par email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="email-to">Destinataire</Label>
              {contacts.length > 1 ? (
                <div className="space-y-2">
                  <Select value={to} onValueChange={setTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map(c => (
                        <SelectItem key={c.email} value={c.email}>
                          {c.label} — {c.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="email-to"
                    type="email"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    placeholder="Ou saisir un email manuellement"
                    className="text-sm"
                  />
                </div>
              ) : (
                <Input
                  id="email-to"
                  type="email"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  placeholder="email@exemple.com"
                />
              )}
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

            <OrderDocumentsList
              blobs={blobs}
              linkedDocuments={linkedDocuments}
              selectedDocIds={selectedDocIds}
              onToggleDoc={toggleDoc}
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
                  console.error('[SendOrderDocs] Unhandled:', error);
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

      <OrderPdfPreviewDialog
        previewUrl={previewUrl}
        previewTitle={previewTitle}
        onClose={() => setPreviewUrl(null)}
      />
    </>
  );
}
