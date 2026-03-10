'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ── Types ────────────────────────────────────────────────────────────

export type HistoryEventType =
  | 'created'
  | 'responded'
  | 'validated'
  | 'archived'
  | 'email_sent'
  | 'email_failed'
  | 'quote_created';

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  date: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useConsultationHistory(consultationId: string | undefined) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!consultationId) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const allEvents: HistoryEvent[] = [];

      // 1. Fetch consultation lifecycle dates
      const { data: consultation } = await supabase
        .from('client_consultations')
        .select(
          'created_at, responded_at, validated_at, archived_at, created_by, responded_by, validated_by, archived_by'
        )
        .eq('id', consultationId)
        .single();

      if (consultation) {
        allEvents.push({
          id: `created-${consultationId}`,
          type: 'created',
          date: consultation.created_at ?? new Date().toISOString(),
          title: 'Consultation creee',
          description: '',
        });

        if (consultation.responded_at) {
          allEvents.push({
            id: `responded-${consultationId}`,
            type: 'responded',
            date: consultation.responded_at,
            title: 'Consultation repondue',
            description: '',
          });
        }

        if (consultation.validated_at) {
          allEvents.push({
            id: `validated-${consultationId}`,
            type: 'validated',
            date: consultation.validated_at,
            title: 'Consultation validee',
            description: '',
          });
        }

        if (consultation.archived_at) {
          allEvents.push({
            id: `archived-${consultationId}`,
            type: 'archived',
            date: consultation.archived_at,
            title: 'Consultation archivee',
            description: '',
          });
        }
      }

      // 2. Fetch emails sent
      const { data: emails } = await supabase
        .from('consultation_emails')
        .select(
          'id, recipient_email, subject, status, attachments, sent_at, created_at'
        )
        .eq('consultation_id', consultationId)
        .order('sent_at', { ascending: false });

      if (emails) {
        for (const email of emails) {
          const attachmentList =
            typeof email.attachments === 'string'
              ? (JSON.parse(email.attachments) as Array<{ type: string }>)
              : ((email.attachments as Array<{ type: string }>) ?? []);

          const attachmentLabels = attachmentList.map(a =>
            a.type === 'consultation_pdf' ? 'PDF consultation' : 'Devis'
          );

          allEvents.push({
            id: `email-${email.id}`,
            type: email.status === 'sent' ? 'email_sent' : 'email_failed',
            date: email.sent_at ?? email.created_at,
            title: email.status === 'sent' ? 'Email envoye' : 'Email echoue',
            description: `→ ${email.recipient_email}${attachmentLabels.length > 0 ? ` | ${attachmentLabels.join(' + ')}` : ''}`,
            metadata: { subject: email.subject },
          });
        }
      }

      // 3. Fetch linked quotes
      const { data: quotes } = await supabase
        .from('financial_documents')
        .select('id, document_number, quote_status, total_ht, created_at')
        .eq('consultation_id', consultationId)
        .eq('document_type', 'customer_quote')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (quotes) {
        for (const quote of quotes) {
          const statusLabels: Record<string, string> = {
            draft: 'Brouillon',
            sent: 'Envoye',
            accepted: 'Accepte',
            declined: 'Refuse',
            expired: 'Expire',
            converted: 'Converti',
          };

          allEvents.push({
            id: `quote-${quote.id}`,
            type: 'quote_created',
            date: quote.created_at,
            title: `Devis ${quote.document_number} cree`,
            description: `Montant: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quote.total_ht)} HT — Statut: ${statusLabels[quote.quote_status ?? ''] ?? quote.quote_status}`,
            metadata: { quoteId: quote.id, quoteStatus: quote.quote_status },
          });
        }
      }

      // Sort by date descending
      allEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEvents(allEvents);
    } catch (err) {
      console.error('[useConsultationHistory] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    void fetchHistory().catch((err: unknown) => {
      console.error('[useConsultationHistory] auto-fetch error:', err);
    });
  }, [fetchHistory]);

  return { events, loading, fetchHistory };
}
