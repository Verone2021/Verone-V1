'use client';

import { useCallback, useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@verone/ui';
import { toast } from 'sonner';

import { createClient } from '@verone/utils/supabase/client';

import type { OrderWithDetails } from './types';

// ============================================
// CONSTANTS
// ============================================

const ROLE_LABELS = {
  responsable: 'responsable',
  billing: 'facturation',
  delivery: 'livraison',
} as const;

type ContactRole = 'responsable' | 'billing' | 'delivery';

// ============================================
// PROPS
// ============================================

interface RequestMissingFieldModalProps {
  open: boolean;
  onClose: () => void;
  order: OrderWithDetails;
  role: ContactRole | null;
  onSuccess?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function RequestMissingFieldModal({
  open,
  onClose,
  order,
  role,
  onSuccess,
}: RequestMissingFieldModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const buildDefaultMessage = useCallback(
    (r: ContactRole) => {
      return `Bonjour,\n\nPour finaliser votre commande ${order.order_number}, nous avons besoin du contact ${ROLE_LABELS[r]}.\n\nMerci de nous transmettre ces informations via le lien sécurisé ci-dessous.\n\nCordialement,\nL'équipe Vérone`;
    },
    [order.order_number]
  );

  useEffect(() => {
    if (!open || !role) return;
    const requesterEmail = order.linkmeDetails?.requester_email ?? '';
    const requesterName = order.linkmeDetails?.requester_name ?? '';
    const orgEmail = order.organisation?.email ?? '';
    const orgName =
      order.organisation?.trade_name ?? order.organisation?.legal_name ?? '';
    setEmail(requesterEmail || orgEmail);
    setName(requesterName || orgName);
    setMessage(buildDefaultMessage(role));
  }, [open, role, order, buildDefaultMessage]);

  if (!role) return null;

  const handleSend = async () => {
    if (!order.id || !order.order_number) {
      toast.error('Commande non chargée, réessayez');
      return;
    }
    if (!email) {
      toast.error('Email destinataire requis');
      return;
    }
    if (!currentUser?.id) {
      toast.error('Utilisateur non authentifié');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/emails/linkme-info-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesOrderId: order.id,
          orderNumber: order.order_number,
          recipientEmail: email,
          recipientName: name,
          recipientType: 'manual',
          organisationName:
            order.organisation?.trade_name ??
            order.organisation?.legal_name ??
            null,
          totalTtc: order.total_ttc ?? 0,
          requestedFields: [
            {
              key: `contact_${role}`,
              label: `Contact ${ROLE_LABELS[role]}`,
              category: role,
              inputType: 'contact',
            },
          ],
          customMessage: message.trim() || undefined,
          sentBy: currentUser.id,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Erreur envoi demande');
      }
      toast.success('Demande envoyée');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'envoi"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="h-screen md:h-auto md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Demander le contact {ROLE_LABELS[role]}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto md:max-h-[60vh] space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="request-email">Email destinataire *</Label>
            <Input
              id="request-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contact@entreprise.fr"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="request-name">Nom destinataire</Label>
            <Input
              id="request-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Prénom Nom"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="request-message">Message</Label>
            <Textarea
              id="request-message"
              rows={8}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <Button
            variant="outline"
            className="w-full md:w-auto h-11 md:h-9"
            onClick={onClose}
            disabled={sending}
          >
            Annuler
          </Button>
          <Button
            className="w-full md:w-auto h-11 md:h-9"
            onClick={() => {
              void handleSend().catch(err => {
                console.error(
                  '[RequestMissingFieldModal] handleSend failed:',
                  err
                );
              });
            }}
            disabled={!email || sending || !currentUser?.id}
          >
            {sending ? 'Envoi...' : 'Envoyer la demande'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
