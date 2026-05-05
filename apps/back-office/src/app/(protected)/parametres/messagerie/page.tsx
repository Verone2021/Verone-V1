/**
 * Page : /parametres/messagerie
 * Server Component — fetch initial des 50 derniers emails.
 *
 * Fonctionnalités :
 * - Liste des emails reçus sur les groupes contact@ et commandes@
 *   des deux marques (Vérone + LinkMe)
 * - Filtres : marque, adresse destinataire, statut lu/non-lu, recherche
 * - Détail email (drawer) avec corps HTML sécurisé
 * - Lien automatique vers la fiche commande si numéro détecté
 */

import { createServerClient } from '@verone/utils/supabase/server';

import type { EmailMessageEnriched } from './types';
import { MessagerieClient } from './MessagerieClient';

export const metadata = {
  title: 'Messagerie | Vérone Back-Office',
  description: 'Emails reçus sur les groupes contact@ et commandes@',
};

export default async function MessageriePage() {
  const supabase = await createServerClient();

  // Fetch 50 derniers emails — colonnes explicites + jointures organisations/contacts
  // pour afficher le client identifié (BO-MSG-009).
  const { data, error } = await supabase
    .from('email_messages')
    .select(
      `
        id,
        gmail_message_id,
        gmail_thread_id,
        gmail_history_id,
        brand,
        to_address,
        from_email,
        from_name,
        subject,
        snippet,
        body_text,
        body_html,
        received_at,
        is_read,
        has_attachments,
        raw_headers,
        linked_order_id,
        linked_order_number,
        linked_organisation_id,
        linked_contact_id,
        linked_user_id,
        replied_at,
        sent_by_user_id,
        reply_message_id,
        created_at,
        updated_at,
        organisation:organisations!email_messages_linked_organisation_id_fkey ( id, name ),
        contact:contacts!email_messages_linked_contact_id_fkey ( id, first_name, last_name )
      `
    )
    .order('received_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Messagerie] Erreur fetch emails', error);
  }

  const emails = (data ?? []) as unknown as EmailMessageEnriched[];

  // Adresses de surveillance pour le filtre
  const watchAddresses = (process.env.GMAIL_WATCH_ADDRESSES ?? '')
    .split(',')
    .map(a => a.trim().toLowerCase())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <MessagerieClient
        initialEmails={emails}
        watchAddresses={watchAddresses}
      />
    </div>
  );
}
