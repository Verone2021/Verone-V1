/**
 * Page : /parametres/messagerie — HUB messagerie unifié
 * Server Component — fetch initial des 100 dernières communications.
 *
 * BO-MSG-018 : agrège mails entrants Gmail + sortants (devis, factures,
 * consultations, demandes infos LinkMe) via la vue
 * `client_communications_unified`.
 *
 * Fonctionnalités :
 * - Liste unifiée sent + received tous canaux (Vérone + LinkMe)
 * - Filtres : direction, marque, type, lu/non-lu, recherche
 * - Détail (drawer) avec corps + pièces jointes
 * - Lien direct vers commande / consultation / contact si rattaché
 */

import { createServerClient } from '@verone/utils/supabase/server';

import type { Communication } from './types';
import { MessagerieClient } from './MessagerieClient';

export const metadata = {
  title: 'Messagerie | Vérone Back-Office',
  description: 'Mails entrants et sortants tous canaux (Vérone + LinkMe)',
};

const COLUMNS =
  'id, direction, kind, brand, counterparty_email, counterparty_name, our_address, subject, preview, body_text, body_html, attachments, has_attachments, event_at, is_read, replied_at, sent_by, organisation_id, contact_id, sales_order_id, sales_order_number, consultation_id, document_type, document_id, document_number, gmail_thread_id, gmail_message_id, status, error_message';

interface MessageriePageProps {
  searchParams?: Promise<{
    direction?: string;
    brand?: string;
    kind?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function MessageriePage({
  searchParams,
}: MessageriePageProps) {
  const supabase = await createServerClient();
  const params = (await searchParams) ?? {};

  // Fetch 100 dernières communications via la vue unifiée (BO-MSG-018)
  const { data, error } = await (
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
          };
        };
      };
    }
  )
    .from('client_communications_unified')
    .select(COLUMNS)
    .order('event_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[Messagerie] Erreur fetch communications', error);
  }

  const communications = data ?? [];

  // Adresses de surveillance pour le filtre (mails entrants)
  const watchAddresses = (process.env.GMAIL_WATCH_ADDRESSES ?? '')
    .split(',')
    .map(a => a.trim().toLowerCase())
    .filter(Boolean);

  return (
    <MessagerieClient
      initialCommunications={communications}
      watchAddresses={watchAddresses}
      initialFilters={{
        direction:
          params.direction === 'sent' || params.direction === 'received'
            ? params.direction
            : 'all',
        brand:
          params.brand === 'verone' || params.brand === 'linkme'
            ? params.brand
            : 'all',
        kind: ([
          'inbound_email',
          'document',
          'consultation',
          'info_request',
        ].includes(params.kind ?? '')
          ? params.kind
          : 'all') as
          | 'all'
          | 'inbound_email'
          | 'document'
          | 'consultation'
          | 'info_request',
        status:
          params.status === 'read' || params.status === 'unread'
            ? params.status
            : 'all',
        search: params.search ?? '',
      }}
    />
  );
}
