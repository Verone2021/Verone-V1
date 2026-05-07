'use client';

/**
 * Hook : récupère les communications client unifiées (mails entrants + sortants).
 *
 * Source : vue SQL `client_communications_unified` (BO-MSG-018) qui agrège :
 *   - email_messages (Gmail inbound, tous canaux)
 *   - document_emails (devis / factures / proformas / avoirs)
 *   - consultation_emails (consultations envoyées)
 *   - linkme_info_requests (demandes infos manquantes LinkMe)
 *
 * Filtres possibles : par marque, par commande, par contact, par organisation.
 *
 * @module use-communications
 * @since 2026-05-07 (BO-MSG-018)
 */

import { useEffect, useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export type CommunicationDirection = 'sent' | 'received';
export type CommunicationBrand = 'verone' | 'linkme';
export type CommunicationKind =
  | 'inbound_email'
  | 'document_quote'
  | 'document_invoice'
  | 'document_proforma'
  | 'document_credit_note'
  | 'consultation'
  | 'info_request';

export interface Communication {
  id: string;
  direction: CommunicationDirection;
  kind: CommunicationKind;
  brand: CommunicationBrand | null;
  counterparty_email: string;
  counterparty_name: string | null;
  our_address: string | null;
  subject: string | null;
  preview: string | null;
  body_text: string | null;
  body_html: string | null;
  attachments: Array<{ filename: string; type: string }> | null;
  has_attachments: boolean;
  event_at: string;
  is_read: boolean;
  replied_at: string | null;
  sent_by: string | null;
  organisation_id: string | null;
  contact_id: string | null;
  sales_order_id: string | null;
  sales_order_number: string | null;
  consultation_id: string | null;
  document_type: string | null;
  document_id: string | null;
  document_number: string | null;
  gmail_thread_id: string | null;
  gmail_message_id: string | null;
  status: string;
  error_message: string | null;
}

export interface UseCommunicationsFilters {
  /** Filtre par commande (sales_orders.id) — pour la carte page commande détail. */
  salesOrderId?: string;
  /** Filtre par contact (contacts.id). */
  contactId?: string;
  /** Filtre par organisation (organisations.id). */
  organisationId?: string;
  /** Filtre par marque (Vérone ou LinkMe). */
  brand?: CommunicationBrand;
  /** Filtre direction (sent/received). */
  direction?: CommunicationDirection;
  /** Limite de résultats (défaut 100). */
  limit?: number;
}

export interface UseCommunicationsResult {
  communications: Communication[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const COLUMNS =
  'id, direction, kind, brand, counterparty_email, counterparty_name, our_address, subject, preview, body_text, body_html, attachments, has_attachments, event_at, is_read, replied_at, sent_by, organisation_id, contact_id, sales_order_id, sales_order_number, consultation_id, document_type, document_id, document_number, gmail_thread_id, gmail_message_id, status, error_message';

export function useCommunications(
  filters: UseCommunicationsFilters = {}
): UseCommunicationsResult {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      // La vue n'est pas dans le typage Supabase généré, on cast.
      const query = (
        supabase as unknown as {
          from: (table: string) => {
            select: (cols: string) => {
              order: (
                col: string,
                opts: { ascending: boolean }
              ) => {
                limit: (n: number) => Promise<{
                  data: Communication[] | null;
                  error: { message: string } | null;
                }>;
                eq: (
                  col: string,
                  val: string
                ) => {
                  order: (
                    col: string,
                    opts: { ascending: boolean }
                  ) => {
                    limit: (n: number) => Promise<{
                      data: Communication[] | null;
                      error: { message: string } | null;
                    }>;
                  };
                };
              };
            };
          };
        }
      )
        .from('client_communications_unified')
        .select(COLUMNS);

      // Application des filtres en chaîne — supabase-js gère la compo
      const queryWithFilters = query as unknown as {
        eq: (col: string, val: string) => typeof queryWithFilters;
        order: (
          col: string,
          opts: { ascending: boolean }
        ) => {
          limit: (n: number) => Promise<{
            data: Communication[] | null;
            error: { message: string } | null;
          }>;
        };
      };

      let chain: typeof queryWithFilters = queryWithFilters;
      if (filters.salesOrderId) {
        chain = chain.eq('sales_order_id', filters.salesOrderId);
      }
      if (filters.contactId) {
        chain = chain.eq('contact_id', filters.contactId);
      }
      if (filters.organisationId) {
        chain = chain.eq('organisation_id', filters.organisationId);
      }
      if (filters.brand) {
        chain = chain.eq('brand', filters.brand);
      }
      if (filters.direction) {
        chain = chain.eq('direction', filters.direction);
      }

      const { data, error: queryError } = await chain
        .order('event_at', { ascending: false })
        .limit(filters.limit ?? 100);

      if (queryError) {
        console.error('[useCommunications] fetch error:', queryError);
        setError(queryError.message);
        return;
      }

      setCommunications(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useCommunications] error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    filters.salesOrderId,
    filters.contactId,
    filters.organisationId,
    filters.brand,
    filters.direction,
    filters.limit,
  ]);

  useEffect(() => {
    void fetchCommunications().catch((err: unknown) => {
      console.error('[useCommunications] auto-fetch error:', err);
    });
  }, [fetchCommunications]);

  return {
    communications,
    loading,
    error,
    refetch: fetchCommunications,
  };
}
