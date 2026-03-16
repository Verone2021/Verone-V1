'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ── Types ────────────────────────────────────────────────────────────

export type OrderHistoryEventType =
  | 'created'
  | 'email_sent'
  | 'email_failed'
  | 'approved'
  | 'rejected'
  | 'info_requested'
  | 'info_completed'
  | 'info_cancelled'
  | 'validated'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'paid'
  | 'invoiced'
  | 'quote_created'
  | 'invoice_created'
  | 'step4_completed';

export interface OrderHistoryEvent {
  id: string;
  type: OrderHistoryEventType;
  date: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useOrderHistory(orderId: string | undefined) {
  const [events, setEvents] = useState<OrderHistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const allEvents: OrderHistoryEvent[] = [];

      // ─── Source A: Lifecycle timestamps from sales_orders ───
      const { data: order } = await supabase
        .from('sales_orders')
        .select(
          'created_at, confirmed_at, shipped_at, delivered_at, cancelled_at, paid_at, invoiced_at'
        )
        .eq('id', orderId)
        .single();

      if (order) {
        allEvents.push({
          id: `created-${orderId}`,
          type: 'created',
          date: order.created_at ?? new Date().toISOString(),
          title: 'Commande creee',
          description: '',
        });

        if (order.confirmed_at) {
          allEvents.push({
            id: `validated-${orderId}`,
            type: 'validated',
            date: order.confirmed_at,
            title: 'Commande validee',
            description: '',
          });
        }

        if (order.shipped_at) {
          allEvents.push({
            id: `shipped-${orderId}`,
            type: 'shipped',
            date: order.shipped_at,
            title: 'Commande expediee',
            description: '',
          });
        }

        if (order.delivered_at) {
          allEvents.push({
            id: `delivered-${orderId}`,
            type: 'delivered',
            date: order.delivered_at,
            title: 'Commande livree',
            description: '',
          });
        }

        if (order.cancelled_at) {
          allEvents.push({
            id: `cancelled-${orderId}`,
            type: 'cancelled',
            date: order.cancelled_at,
            title: 'Commande annulee',
            description: '',
          });
        }

        if (order.paid_at) {
          allEvents.push({
            id: `paid-${orderId}`,
            type: 'paid',
            date: order.paid_at,
            title: 'Paiement recu',
            description: '',
          });
        }

        if (order.invoiced_at) {
          allEvents.push({
            id: `invoiced-${orderId}`,
            type: 'invoiced',
            date: order.invoiced_at,
            title: 'Facture emise',
            description: '',
          });
        }
      }

      // ─── Source B: Info requests from linkme_info_requests ───
      const { data: infoRequests } = await supabase
        .from('linkme_info_requests')
        .select(
          'id, sent_at, completed_at, cancelled_at, recipient_email, recipient_name, requested_fields'
        )
        .eq('sales_order_id', orderId)
        .order('sent_at', { ascending: false });

      if (infoRequests) {
        for (const req of infoRequests) {
          // Build description with requested field labels
          const fields = req.requested_fields as Array<{
            label: string;
            category: string;
          }> | null;
          const fieldLabels = fields?.map(f => f.label).join(', ') ?? '';
          const description = fieldLabels
            ? `→ ${req.recipient_name ?? req.recipient_email} | ${fieldLabels}`
            : `→ ${req.recipient_name ?? req.recipient_email}`;

          allEvents.push({
            id: `info-req-${req.id}`,
            type: 'info_requested',
            date: req.sent_at ?? new Date().toISOString(),
            title: 'Demande de complements envoyee',
            description,
            metadata: { recipient_email: req.recipient_email },
          });

          if (req.completed_at) {
            allEvents.push({
              id: `info-done-${req.id}`,
              type: 'info_completed',
              date: req.completed_at,
              title: 'Complements recus',
              description: `De ${req.recipient_name ?? req.recipient_email}`,
            });
          }

          if (req.cancelled_at) {
            allEvents.push({
              id: `info-cancel-${req.id}`,
              type: 'info_cancelled',
              date: req.cancelled_at,
              title: 'Demande annulee',
              description: '',
            });
          }
        }
      }

      // ─── Source C: Tracked events from sales_order_events ───
      const { data: trackedEvents } = await supabase
        .from('sales_order_events')
        .select('id, event_type, metadata, created_at')
        .eq('sales_order_id', orderId)
        .order('created_at', { ascending: false });

      if (trackedEvents) {
        const eventLabels: Record<
          string,
          { title: string; type: OrderHistoryEventType }
        > = {
          email_confirmation_sent: {
            title: 'Email confirmation envoye',
            type: 'email_sent',
          },
          email_approval_sent: {
            title: 'Email approbation envoye',
            type: 'email_sent',
          },
          email_rejection_sent: {
            title: 'Email refus envoye',
            type: 'email_sent',
          },
          email_info_request_sent: {
            title: 'Email demande complements envoye',
            type: 'email_sent',
          },
          email_step4_confirmed: {
            title: 'Etape 4 confirmee par email',
            type: 'step4_completed',
          },
          status_changed: { title: 'Statut modifie', type: 'validated' },
        };

        for (const evt of trackedEvents) {
          const config = eventLabels[evt.event_type];
          if (!config) continue;

          const meta = (evt.metadata ?? {}) as Record<string, unknown>;
          let description = '';
          if (meta.recipient_email) {
            description = `→ ${meta.recipient_email as string}`;
          }
          if (
            evt.event_type === 'status_changed' &&
            meta.old_status &&
            meta.new_status
          ) {
            description = `${meta.old_status as string} → ${meta.new_status as string}`;
          }

          allEvents.push({
            id: `evt-${evt.id}`,
            type: config.type,
            date: evt.created_at,
            title: config.title,
            description,
            metadata: meta,
          });
        }
      }

      // ─── Source D: Financial documents (quotes & invoices) ───
      const { data: financialDocs } = await supabase
        .from('financial_documents')
        .select(
          'id, document_type, document_number, total_ht, quote_status, created_at'
        )
        .eq('sales_order_id', orderId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (financialDocs) {
        const quoteStatusLabels: Record<string, string> = {
          draft: 'Brouillon',
          sent: 'Envoye',
          accepted: 'Accepte',
          declined: 'Refuse',
          expired: 'Expire',
          converted: 'Converti',
        };

        for (const doc of financialDocs) {
          const isQuote = doc.document_type === 'customer_quote';
          const formatAmount = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          }).format(doc.total_ht);

          allEvents.push({
            id: `doc-${doc.id}`,
            type: isQuote ? 'quote_created' : 'invoice_created',
            date: doc.created_at ?? new Date().toISOString(),
            title: isQuote
              ? `Devis ${doc.document_number} cree`
              : `Facture ${doc.document_number} emise`,
            description: isQuote
              ? `Montant: ${formatAmount} HT — Statut: ${quoteStatusLabels[doc.quote_status ?? ''] ?? doc.quote_status}`
              : `Montant: ${formatAmount} HT`,
            metadata: { documentId: doc.id, documentType: doc.document_type },
          });
        }
      }

      // Sort by date descending (most recent first)
      allEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEvents(allEvents);
    } catch (err) {
      console.error('[useOrderHistory] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void fetchHistory().catch((err: unknown) => {
      console.error('[useOrderHistory] auto-fetch error:', err);
    });
  }, [fetchHistory]);

  return { events, loading, fetchHistory };
}
