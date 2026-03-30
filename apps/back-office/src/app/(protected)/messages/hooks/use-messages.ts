'use client';

import { useState, useCallback, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import {
  getInfoRequestStatus,
  INFO_REQUEST_STATUS_MAP,
  FORM_STATUS_MAP,
} from '../components/message-card';
import type { UnifiedMessage } from '../components/message-card';

export function useMessages() {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const results: UnifiedMessage[] = [];

      // 1. Fetch LinkMe info requests
      const { data: infoRequests, error: irError } = await supabase
        .from('linkme_info_requests')
        .select(
          `
          id,
          recipient_email,
          recipient_name,
          recipient_type,
          sent_at,
          completed_at,
          cancelled_at,
          token_expires_at,
          sales_order_id,
          created_at,
          sales_orders!inner(order_number)
        `
        )
        .not('sent_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (irError) {
        console.error('[MessagesHub] Info requests error:', irError);
      } else {
        for (const row of infoRequests ?? []) {
          const r = row as Record<string, unknown>;
          const salesOrder = r.sales_orders as Record<string, unknown> | null;
          const orderNumber =
            (salesOrder?.order_number as string | undefined) ?? 'N/A';
          const status = getInfoRequestStatus(r);

          results.push({
            id: r.id as string,
            type: 'info_request',
            channel: 'linkme',
            status,
            statusLabel: INFO_REQUEST_STATUS_MAP[status]?.label ?? status,
            title: `Demande d'infos — ${orderNumber}`,
            subtitle: `Envoyee a ${(r.recipient_name as string) || (r.recipient_email as string)}`,
            date: (r.sent_at as string) || (r.created_at as string),
            linkHref: `/canaux-vente/linkme/commandes/${r.sales_order_id as string}`,
            metadata: { orderNumber, status },
          });
        }
      }

      // 2. Fetch form submissions
      const { data: submissions, error: fsError } = await supabase
        .from('form_submissions')
        .select(
          'id, first_name, last_name, email, company_name, subject, message, status, priority, source, form_type, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (fsError) {
        console.error('[MessagesHub] Form submissions error:', fsError);
      } else {
        for (const row of submissions ?? []) {
          const s = row as Record<string, unknown>;
          const source = s.source as string;
          const channel: UnifiedMessage['channel'] =
            source === 'linkme'
              ? 'linkme'
              : source === 'website'
                ? 'site_internet'
                : 'other';

          const fullName = [s.first_name, s.last_name]
            .filter(Boolean)
            .join(' ');
          const subject = (s.subject as string) || (s.message as string) || '';

          results.push({
            id: s.id as string,
            type: 'form_submission',
            channel,
            status: s.status as string,
            statusLabel:
              FORM_STATUS_MAP[s.status as string]?.label ??
              (s.status as string),
            title: fullName || (s.email as string),
            subtitle:
              subject.length > 80 ? `${subject.slice(0, 80)}...` : subject,
            date: s.created_at as string,
            linkHref: `/prises-contact/${s.id as string}`,
            metadata: {
              company: s.company_name,
              priority: s.priority,
              formType: s.form_type,
            },
          });
        }
      }

      results.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMessages(results);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      console.error('[MessagesHub] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return { messages, loading, error, fetchMessages };
}

export function useFilteredMessages(
  messages: UnifiedMessage[],
  statusFilter: string
) {
  return useMemo(() => {
    const filtered = messages.filter(m => {
      if (statusFilter === 'new') {
        return m.status === 'new' || m.status === 'pending';
      }
      if (statusFilter === 'in_progress') {
        return m.status === 'open' || m.status === 'pending';
      }
      if (statusFilter === 'resolved') {
        return (
          m.status === 'completed' ||
          m.status === 'replied' ||
          m.status === 'closed'
        );
      }
      return true;
    });

    const linkmeMessages = filtered.filter(m => m.channel === 'linkme');
    const formMessages = filtered.filter(m => m.type === 'form_submission');

    return { filtered, linkmeMessages, formMessages };
  }, [messages, statusFilter]);
}
