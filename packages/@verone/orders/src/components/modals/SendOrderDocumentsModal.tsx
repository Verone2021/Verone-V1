'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
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

export interface OrderContact {
  label: string;
  email: string;
}

interface AttachmentBlob {
  blob: Blob;
  url: string;
  ready: boolean;
  error: string | null;
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

function documentTypeLabel(type: string): string {
  return type === 'customer_quote' ? 'Devis' : 'Facture';
}

// ── Component ───────────────────────────────────────────────────────

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
  const { toast: _toast } = useToast();

  const defaultEmail = contacts[0]?.email ?? '';
  const defaultMessage = `Bonjour,

Veuillez trouver ci-joint les documents relatifs a votre commande ${orderNumber}.

N'hesitez pas a nous contacter pour toute question.

Cordialement,
L'equipe Verone`;

  const [to, setTo] = useState(defaultEmail);
  const [subject, setSubject] = useState(
    `Documents commande ${orderNumber} — ${customerName}`
  );
  const [message, setMessage] = useState(defaultMessage);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  // PDF blob storage: key = document.id
  const [blobs, setBlobs] = useState<Map<string, AttachmentBlob>>(new Map());
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const generatingRef = useRef(false);

  // ── Reset state when modal opens ──
  useEffect(() => {
    if (open) {
      setTo(defaultEmail);
      setSubject(`Documents commande ${orderNumber} — ${customerName}`);
      setMessage(defaultMessage);
      setSelectedDocIds(new Set());
      setSending(false);
      setBlobs(new Map());
      setPreviewUrl(null);
      generatingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open
  }, [open]);

  // ── Fetch PDFs when modal opens ──
  const fetchPdfs = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;

    for (const doc of linkedDocuments) {
      if (!doc.qonto_invoice_id) {
        setBlobs(prev => {
          const next = new Map(prev);
          next.set(doc.id, {
            blob: new Blob(),
            url: '',
            ready: false,
            error: 'PDF non disponible — document non synchronise avec Qonto',
          });
          return next;
        });
        continue;
      }

      try {
        // Use the appropriate proxy route depending on document type
        const proxyPath =
          doc.document_type === 'customer_quote'
            ? `/api/qonto/quotes/${doc.qonto_invoice_id}/pdf`
            : `/api/qonto/invoices/${doc.qonto_invoice_id}/pdf`;

        const response = await fetch(proxyPath);
        if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobs(prev => {
          const next = new Map(prev);
          next.set(doc.id, { blob, url, ready: true, error: null });
          return next;
        });
      } catch (err) {
        console.error(
          `[SendOrderDocs] PDF fetch failed for ${doc.document_number}:`,
          err
        );
        setBlobs(prev => {
          const next = new Map(prev);
          next.set(doc.id, {
            blob: new Blob(),
            url: '',
            ready: false,
            error: String(err),
          });
          return next;
        });
      }
    }
  }, [linkedDocuments]);

  useEffect(() => {
    if (open) {
      void fetchPdfs().catch(err => {
        console.error('[SendOrderDocs] PDF fetch error:', err);
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

  // ── Check if all selected attachments are ready ──
  const allSelectedReady = (() => {
    if (selectedDocIds.size === 0) return true;
    for (const docId of selectedDocIds) {
      const entry = blobs.get(docId);
      if (!entry?.ready) return false;
    }
    return true;
  })();

  // ── Toggle document selection ──
  const toggleDoc = (docId: string, checked: boolean) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(docId);
      else next.delete(docId);
      return next;
    });
  };

  // ── Status badge ──
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
    if (entry?.url) {
      const a = document.createElement('a');
      a.href = entry.url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      const attachments: Array<{
        filename: string;
        contentBase64: string;
        type: 'quote' | 'invoice';
        documentId?: string;
      }> = [];

      for (const docId of selectedDocIds) {
        const entry = blobs.get(docId);
        const doc = linkedDocuments.find(d => d.id === docId);
        if (entry?.ready && doc) {
          const base64 = await blobToBase64(entry.blob);
          const prefix =
            doc.document_type === 'customer_quote' ? 'devis' : 'facture';
          attachments.push({
            filename: `${prefix}-${doc.document_number}.pdf`,
            contentBase64: base64,
            type: doc.document_type === 'customer_quote' ? 'quote' : 'invoice',
            documentId: docId,
          });
        }
      }

      const response = await fetch('/api/emails/send-order-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesOrderId,
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
        description: `Documents envoyes a ${to}`,
      });
      onSent?.();
      onClose();
    } catch (error) {
      console.error('[SendOrderDocs] Send failed:', error);
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

  const hasDocuments = linkedDocuments.length > 0;

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
            {/* Recipient selector */}
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

              {!hasDocuments && (
                <p className="text-sm text-gray-500 italic">
                  Aucun devis ou facture lie a cette commande. Generez-en un
                  avant d&apos;envoyer.
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
                          toggleDoc(doc.id, checked === true)
                        }
                        disabled={!blobs.get(doc.id)?.ready}
                      />
                      <label
                        htmlFor={`attach-${doc.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {typeLabel} {doc.document_number}
                      </label>
                      <StatusBadge id={doc.id} />
                    </div>
                    <div className="flex items-center gap-1">
                      <ButtonUnified
                        variant="ghost"
                        size="sm"
                        disabled={!blobs.get(doc.id)?.ready}
                        onClick={() =>
                          handlePreview(
                            doc.id,
                            `${typeLabel} ${doc.document_number}`
                          )
                        }
                        title="Apercu"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </ButtonUnified>
                      <ButtonUnified
                        variant="ghost"
                        size="sm"
                        disabled={!blobs.get(doc.id)?.ready}
                        onClick={() => handleDownload(doc.id, filename)}
                        title="Telecharger"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </ButtonUnified>
                    </div>
                  </div>
                );
              })}
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
