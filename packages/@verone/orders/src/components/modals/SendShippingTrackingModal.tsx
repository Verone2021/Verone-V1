'use client';

import { useState } from 'react';

import { useToast } from '@verone/common';
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
import { Send } from 'lucide-react';

export interface SendShippingTrackingModalProps {
  open: boolean;
  onClose: () => void;
  shipment: {
    tracking_number: string | null;
    tracking_url: string | null;
    carrier_name: string | null;
  };
  order: {
    id: string;
    order_number: string;
    organisations?: { email: string | null; trade_name: string | null } | null;
    individual_customers?: {
      email: string | null;
      first_name: string | null;
      last_name: string | null;
    } | null;
  };
  onSuccess?: () => void;
}

const SITE_INTERNET_URL =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_SITE_INTERNET_URL ??
      'https://www.veronecollections.fr')
    : 'https://www.veronecollections.fr';

function resolveEmail(order: SendShippingTrackingModalProps['order']): string {
  return order.organisations?.email ?? order.individual_customers?.email ?? '';
}

function resolveCustomerName(
  order: SendShippingTrackingModalProps['order']
): string {
  if (order.organisations?.trade_name) return order.organisations.trade_name;
  const ic = order.individual_customers;
  if (ic?.first_name ?? ic?.last_name) {
    return `${ic?.first_name ?? ''} ${ic?.last_name ?? ''}`.trim();
  }
  return '';
}

export function SendShippingTrackingModal({
  open,
  onClose,
  shipment,
  order,
  onSuccess,
}: SendShippingTrackingModalProps) {
  const { toast } = useToast();

  const [email, setEmail] = useState(() => resolveEmail(order));
  const [customerName, setCustomerName] = useState(() =>
    resolveCustomerName(order)
  );
  const [sending, setSending] = useState(false);

  const noEmail = !email.trim();

  const handleSend = async () => {
    if (noEmail) return;
    setSending(true);
    try {
      const body: Record<string, string> = {
        email: email.trim(),
        customerName: customerName.trim() || 'Client',
        orderId: order.order_number,
      };
      if (shipment.tracking_number) {
        body.trackingNumber = shipment.tracking_number;
      }
      if (shipment.carrier_name) {
        body.carrierName = shipment.carrier_name;
      }

      const response = await fetch(
        `${SITE_INTERNET_URL}/api/emails/shipping-notification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      toast({
        title: 'Email envoyé',
        description: `Suivi de livraison envoyé à ${email.trim()}`,
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-lg flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" />
            Envoyer le tracking au client
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto md:max-h-[60vh] space-y-4 py-2">
          {/* Récap commande + tracking */}
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs space-y-1">
            <p className="text-blue-800 font-medium">
              Commande {order.order_number}
            </p>
            {shipment.tracking_number && (
              <p className="text-blue-700">
                <span className="font-medium">Suivi :</span>{' '}
                {shipment.tracking_number}
                {shipment.carrier_name ? ` (${shipment.carrier_name})` : ''}
              </p>
            )}
            {!shipment.tracking_number && (
              <p className="text-amber-700">Aucun numéro de suivi disponible</p>
            )}
          </div>

          {/* Email destinataire */}
          <div className="space-y-1.5">
            <Label htmlFor="tracking-email" className="text-xs font-medium">
              Email destinataire
            </Label>
            <Input
              id="tracking-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="client@exemple.fr"
              className="h-11 md:h-9 text-sm"
            />
            {noEmail && (
              <p className="text-xs text-amber-600">
                Aucun email client disponible — saisissez une adresse
                manuellement.
              </p>
            )}
          </div>

          {/* Nom client */}
          <div className="space-y-1.5">
            <Label htmlFor="tracking-name" className="text-xs font-medium">
              Nom du client
            </Label>
            <Input
              id="tracking-name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Nom affiché dans l'email"
              className="h-11 md:h-9 text-sm"
            />
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
            disabled={noEmail || sending}
            className="w-full md:w-auto h-11 md:h-9"
          >
            <Send className="h-4 w-4 mr-2" />
            Envoyer
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
