'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@verone/common';
import type { EmailContact } from '@verone/finance/components';
import { RecipientSelector } from '@verone/finance/components';
import { ButtonV2 } from '@verone/ui';
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
import { Eye, Loader2, Mail, Send } from 'lucide-react';

import { ShippingEmailPreviewDialog } from './ShippingEmailPreviewDialog';
import {
  buildContactList,
  buildDefaultMessage,
  buildDefaultSubject,
  buildPreviewHtml,
} from './shipping-tracking-helpers';
import { TrackingRecapCard } from './TrackingRecapCard';

// ── Types ──────────────────────────────────────────────────────────────

export interface SendShippingTrackingModalProps {
  open: boolean;
  onClose: () => void;
  shipment: {
    id: string;
    tracking_number: string | null;
    tracking_url: string | null;
    carrier_name: string | null;
    shipped_at: string | null;
  };
  order: {
    id: string;
    order_number: string;
    organisations?: {
      id: string;
      email: string | null;
      trade_name: string | null;
    } | null;
    individual_customers?: {
      id: string;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
    } | null;
    responsable_contact?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
    billing_contact?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
    delivery_contact?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
  };
  onSuccess?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────

export function SendShippingTrackingModal({
  open,
  onClose,
  shipment,
  order,
  onSuccess,
}: SendShippingTrackingModalProps) {
  const { toast } = useToast();

  const [recipients, setRecipients] = useState<string[]>([]);
  const [manualEmail, setManualEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const contacts: EmailContact[] = buildContactList(order);

  const resetState = useCallback(() => {
    setRecipients([]);
    setManualEmail('');
    setSubject(buildDefaultSubject(order.order_number));
    setMessage(
      buildDefaultMessage({
        orderNumber: order.order_number,
        carrierName: shipment.carrier_name,
        trackingNumber: shipment.tracking_number,
        shippedAt: shipment.shipped_at,
      })
    );
    setSending(false);
    setPreviewHtml(null);
  }, [order.order_number, shipment]);

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, resetState]);

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

  // ── Preview ──

  const handlePreview = () => {
    setPreviewHtml(
      buildPreviewHtml({
        customerName: '',
        orderNumber: order.order_number,
        carrierName: shipment.carrier_name,
        trackingNumber: shipment.tracking_number,
        trackingUrl: shipment.tracking_url,
        shippedAt: shipment.shipped_at,
        customMessage: message,
      })
    );
  };

  // ── Send ──

  const handleSend = async () => {
    if (recipients.length === 0) {
      toast({
        title: 'Destinataire requis',
        description: 'Ajoutez au moins un destinataire.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/emails/send-shipping-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesOrderId: order.id,
          shipmentId: shipment.id,
          to: recipients,
          subject,
          message,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${String(response.status)}`);
      }

      toast({
        title: 'Email envoyé',
        description: `Suivi envoyé à ${String(recipients.length)} destinataire(s)`,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[SendShippingTrackingModal] send error:', err);
      toast({
        title: "Erreur d'envoi",
        description:
          err instanceof Error ? err.message : "Impossible d'envoyer l'email",
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const canSend = recipients.length > 0 && subject.trim() && message.trim();

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={() => {
          if (!sending) onClose();
        }}
      >
        <DialogContent className="h-screen md:h-auto md:max-w-2xl flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Envoyer le suivi d'expédition
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto md:max-h-[65vh] space-y-4 py-2">
            {/* Destinataires */}
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

            {/* Sujet */}
            <div className="space-y-1.5">
              <Label htmlFor="tracking-subject">Objet</Label>
              <Input
                id="tracking-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-11 md:h-9"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="tracking-message">Message</Label>
              <Textarea
                id="tracking-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={8}
                className="resize-y"
              />
            </div>

            {/* Récap tracking */}
            <TrackingRecapCard
              shipment={shipment}
              orderNumber={order.order_number}
            />

            {/* Aperçu */}
            <div className="flex justify-end">
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="h-11 md:h-9"
              >
                <Eye className="h-4 w-4 mr-2" />
                Aperçu de l'email
              </ButtonV2>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 md:flex-row">
            <ButtonV2
              variant="outline"
              onClick={onClose}
              disabled={sending}
              className="w-full md:w-auto h-11 md:h-9"
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="default"
              onClick={() => {
                void handleSend().catch(err =>
                  console.error('[SendShippingTrackingModal] unhandled:', err)
                );
              }}
              loading={sending}
              disabled={!canSend || sending}
              className="w-full md:w-auto h-11 md:h-9"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShippingEmailPreviewDialog
        html={previewHtml}
        onClose={() => setPreviewHtml(null)}
      />
    </>
  );
}
