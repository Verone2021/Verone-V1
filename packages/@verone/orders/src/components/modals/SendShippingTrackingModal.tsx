'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

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
  formatDateFr,
  type ShipmentForEmail,
} from './shipping-tracking-helpers';
import { TrackingRecapCard } from './TrackingRecapCard';

// ── Types ──────────────────────────────────────────────────────────────

export interface SendShippingTrackingModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Toutes les expéditions de la commande qui ont un tracking_number — on
   * filtre côté caller pour exclure les modes sans tracking (main propre,
   * retrait, manuel sans tracking saisi). Si la liste contient 2+ items,
   * l'utilisateur peut cocher / décocher chaque colis et l'email regroupe
   * tous les trackings sélectionnés (Romeo : "1 email avec les 2 trackings
   * côte à côte").
   */
  shipments: ShipmentForEmail[];
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
  shipments,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const contacts: EmailContact[] = buildContactList(order);

  // Sous-ensemble des shipments effectivement cochés (ordre stable de
  // shipments[]). Si une seule expédition existe, elle est sélectionnée
  // implicitement.
  const selectedShipments = useMemo(
    () => shipments.filter(s => selectedIds.has(s.id)),
    [shipments, selectedIds]
  );

  const resetState = useCallback(() => {
    const allIds = new Set(shipments.map(s => s.id));
    setSelectedIds(allIds);
    setRecipients([]);
    setManualEmail('');
    setSubject(buildDefaultSubject(order.order_number, shipments.length));
    setMessage(
      buildDefaultMessage({
        orderNumber: order.order_number,
        shipments,
      })
    );
    setSending(false);
    setPreviewHtml(null);
  }, [order.order_number, shipments]);

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, resetState]);

  // Quand le user coche / décoche, on régénère le sujet et le message par
  // défaut pour qu'ils restent cohérents avec ce qui sera envoyé. Si le user
  // a déjà personnalisé le message, il reste prioritaire — on ne touche que
  // le sujet / message tant qu'ils correspondent au défaut courant.
  useEffect(() => {
    if (!open) return;
    setSubject(prev => {
      const previousDefault = buildDefaultSubject(
        order.order_number,
        shipments.length === selectedShipments.length
          ? shipments.length
          : selectedShipments.length || 1
      );
      const newDefault = buildDefaultSubject(
        order.order_number,
        selectedShipments.length || 1
      );
      // Si le sujet courant est encore un sujet par défaut (peu importe le N),
      // on le rafraîchit.
      const isStillDefault =
        prev === previousDefault ||
        prev === buildDefaultSubject(order.order_number, 1) ||
        prev === buildDefaultSubject(order.order_number, shipments.length);
      return isStillDefault ? newDefault : prev;
    });
  }, [selectedShipments.length, order.order_number, shipments.length, open]);

  const toggleShipment = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const handlePreview = async () => {
    if (selectedShipments.length === 0) {
      toast({
        title: 'Aucune expédition sélectionnée',
        description: 'Cochez au moins une expédition à prévisualiser.',
        variant: 'destructive',
      });
      return;
    }
    try {
      // Appel serveur pour générer un aperçu identique à l'email réel :
      // même enrichissement Packlink (date pickup réelle + tracking_url
      // récupéré à la volée + persistance DB).
      const response = await fetch('/api/emails/preview-shipping-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesOrderId: order.id,
          shipmentIds: selectedShipments.map(s => s.id),
          customMessage: message,
        }),
      });
      const data = (await response.json()) as {
        success: boolean;
        html?: string;
        error?: string;
      };
      if (!response.ok || !data.success || !data.html) {
        // Fallback : preview client-side si la route serveur échoue
        // (transporteur non Packlink, panne réseau, etc.)
        console.error(
          '[SendShippingTrackingModal] preview server failed, fallback client:',
          data.error
        );
        setPreviewHtml(
          buildPreviewHtml({
            customerName: '',
            orderNumber: order.order_number,
            shipments: selectedShipments,
            customMessage: message,
          })
        );
        return;
      }
      setPreviewHtml(data.html);
    } catch (err) {
      console.error('[SendShippingTrackingModal] preview error:', err);
      setPreviewHtml(
        buildPreviewHtml({
          customerName: '',
          orderNumber: order.order_number,
          shipments: selectedShipments,
          customMessage: message,
        })
      );
    }
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
    if (selectedShipments.length === 0) {
      toast({
        title: 'Aucune expédition sélectionnée',
        description: "Cochez au moins une expédition à inclure dans l'email.",
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
          shipmentIds: selectedShipments.map(s => s.id),
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
        description: `Suivi de ${selectedShipments.length} colis envoyé à ${String(recipients.length)} destinataire(s)`,
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

  const canSend =
    recipients.length > 0 &&
    selectedShipments.length > 0 &&
    subject.trim() &&
    message.trim();

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
            {/* Sélecteur multi-shipments — masqué si une seule expédition */}
            {shipments.length > 1 && (
              <div className="space-y-1.5">
                <Label>Expéditions à inclure</Label>
                <div className="rounded-md border border-slate-200 divide-y divide-slate-100">
                  {shipments.map((s, idx) => {
                    const checked = selectedIds.has(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleShipment(s.id)}
                          className="h-4 w-4 accent-slate-700"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-medium text-slate-900">
                            Colis {idx + 1} / {shipments.length}
                            {s.carrier_name && (
                              <span className="ml-1 font-normal text-slate-500">
                                · {s.carrier_name}
                              </span>
                            )}
                          </p>
                          <p className="text-slate-500 truncate">
                            {s.tracking_number ?? '(pas de tracking)'}
                            {s.shipped_at && (
                              <span className="ml-1">
                                · {formatDateFr(s.shipped_at)}
                              </span>
                            )}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

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
              shipments={selectedShipments}
              orderNumber={order.order_number}
            />

            {/* Aperçu */}
            <div className="flex justify-end">
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => {
                  void handlePreview().catch(err => {
                    console.error(
                      '[SendShippingTrackingModal] handlePreview rejected:',
                      err
                    );
                  });
                }}
                className="h-11 md:h-9"
                disabled={selectedShipments.length === 0}
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
