/**
 * Types pour le module Email Messages (BO-MSG-001)
 *
 * Pipeline Gmail Inbound — emails reçus sur les groupes contact@ et commandes@
 * des deux marques (Vérone + LinkMe).
 *
 * Note : ces types correspondent à la table `email_messages` créée dans la
 * migration 20260505_bo_msg_001_email_messages.sql. La régénération automatique
 * des types Supabase sera faite une fois la migration appliquée en production.
 */

/** Marque destinataire déduite de l'adresse to_address */
export type EmailBrand = 'verone' | 'linkme';

/**
 * Row de la table email_messages.
 * Reflète fidèlement le schéma SQL de la migration BO-MSG-001.
 */
export interface EmailMessage {
  id: string;

  /** Identifiant unique Gmail (MIME Message-ID) */
  gmail_message_id: string;
  gmail_thread_id: string;
  gmail_history_id: string | null;

  /** Marque destinataire : 'verone' | 'linkme' */
  brand: EmailBrand;

  /** Adresse email du groupe destinataire (contact@, commandes@) */
  to_address: string;

  /** Adresse email de l'expéditeur */
  from_email: string;
  from_name: string | null;

  subject: string | null;
  snippet: string | null;
  body_text: string | null;
  body_html: string | null;

  received_at: string; // ISO 8601 string (TIMESTAMPTZ retourné par Supabase)
  is_read: boolean;
  has_attachments: boolean;

  /** Headers MIME bruts (snapshot) */
  raw_headers: Record<string, string> | null;

  /** Référence commande détectée dans subject ou body */
  linked_order_id: string | null;
  linked_order_number: string | null;

  /** Organisation cliente identifiée à partir de from_email (BO-MSG-009) */
  linked_organisation_id: string | null;
  /** Contact identifié à partir de from_email (BO-MSG-009) */
  linked_contact_id: string | null;
  /** Utilisateur LinkMe identifié à partir de from_email (BO-MSG-009) */
  linked_user_id: string | null;

  /** Timestamp de la réponse depuis le BO (BO-MSG-010, anticipé en BO-MSG-009) */
  replied_at: string | null;
  /** Auteur de la réponse côté BO. NULL pour les mails entrants. */
  sent_by_user_id: string | null;
  /** Gmail message id de la réponse envoyée depuis le BO. */
  reply_message_id: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * EmailMessage enrichi avec les jointures vers organisations et contacts
 * (utilisé par la liste Messagerie pour afficher le client identifié).
 */
export interface EmailMessageEnriched extends EmailMessage {
  organisation: {
    id: string;
    legal_name: string | null;
    trade_name: string | null;
  } | null;
  contact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

/**
 * Payload pour le marquage lu/non-lu.
 */
export interface ToggleReadPayload {
  id: string;
  is_read: boolean;
}

/**
 * Filtres pour la liste des emails.
 */
export interface EmailMessageFilters {
  brand?: EmailBrand | 'all';
  to_address?: string | 'all';
  is_read?: boolean | 'all';
  date_from?: string | null;
  date_to?: string | null;
}
