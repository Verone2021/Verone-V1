'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { useToast } from '@verone/common';

import type { AttachmentBlob, LinkedDocument } from './OrderDocumentsList';

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

interface UseOrderDocumentsEmailOptions {
  open: boolean;
  onClose: () => void;
  salesOrderId: string;
  orderNumber: string;
  customerName: string;
  contacts: Array<{ label: string; email: string }>;
  linkedDocuments: LinkedDocument[];
  onSent?: () => void;
}

export function useOrderDocumentsEmail({
  open,
  onClose,
  salesOrderId,
  orderNumber,
  customerName,
  contacts,
  linkedDocuments,
  onSent,
}: UseOrderDocumentsEmailOptions) {
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
  const [blobs, setBlobs] = useState<Map<string, AttachmentBlob>>(new Map());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const generatingRef = useRef(false);

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

  const allSelectedReady = (() => {
    if (selectedDocIds.size === 0) return true;
    for (const docId of selectedDocIds) {
      const entry = blobs.get(docId);
      if (!entry?.ready) return false;
    }
    return true;
  })();

  const toggleDoc = (docId: string, checked: boolean) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(docId);
      else next.delete(docId);
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
    if (entry?.url) {
      const a = document.createElement('a');
      a.href = entry.url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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

  return {
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
  };
}
