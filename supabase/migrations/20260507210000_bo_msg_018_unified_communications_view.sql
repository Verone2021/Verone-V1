-- BO-MSG-018 : vue unifiée des communications client (sortants + entrants)
--
-- Agrège dans une vue unique :
--   - email_messages (entrants Gmail tous canaux)
--   - document_emails (devis / factures / proformas / avoirs sortants)
--   - consultation_emails (consultations sortantes)
--   - linkme_info_requests (demandes infos manquantes LinkMe sortantes)
--
-- Permet d'afficher la timeline d'un client / commande / contact dans un
-- seul endroit (HUB messagerie + carte Communications page commande).
--
-- Pas de table physique : SELECT only via UNION ALL.
-- RLS : appliqué via SECURITY INVOKER (vue hérite des policies des tables sources).

CREATE OR REPLACE VIEW public.client_communications_unified
WITH (security_invoker = true) AS
-- ============================================================================
-- 1. ENTRANTS : email_messages (Gmail inbound, déjà tous canaux)
-- ============================================================================
SELECT
  em.id AS id,
  'received'::text AS direction,
  'inbound_email'::text AS kind,
  em.brand AS brand,
  em.from_email AS counterparty_email,
  em.from_name AS counterparty_name,
  em.to_address AS our_address,
  em.subject AS subject,
  em.snippet AS preview,
  em.body_text AS body_text,
  em.body_html AS body_html,
  NULL::jsonb AS attachments,
  em.has_attachments AS has_attachments,
  em.received_at AS event_at,
  em.is_read AS is_read,
  em.replied_at AS replied_at,
  em.sent_by_user_id AS sent_by,
  em.linked_organisation_id AS organisation_id,
  em.linked_contact_id AS contact_id,
  em.linked_order_id AS sales_order_id,
  em.linked_order_number AS sales_order_number,
  NULL::uuid AS consultation_id,
  NULL::text AS document_type,
  NULL::text AS document_id,
  NULL::text AS document_number,
  em.gmail_thread_id AS gmail_thread_id,
  em.gmail_message_id AS gmail_message_id,
  'received'::text AS status,
  NULL::text AS error_message
FROM public.email_messages em

UNION ALL

-- ============================================================================
-- 2. SORTANTS : document_emails (devis, factures, proformas, avoirs)
-- sales_order_id récupéré via sub-query safe (document_id est text, pas uuid)
-- ============================================================================
SELECT
  de.id AS id,
  'sent'::text AS direction,
  ('document_' || de.document_type)::text AS kind,
  'verone'::text AS brand,
  de.recipient_email AS counterparty_email,
  NULL::text AS counterparty_name,
  NULL::text AS our_address,
  de.subject AS subject,
  NULL::text AS preview,
  de.message_body AS body_text,
  NULL::text AS body_html,
  de.attachments AS attachments,
  CASE
    WHEN jsonb_typeof(de.attachments) = 'array' AND jsonb_array_length(de.attachments) > 0 THEN TRUE
    ELSE FALSE
  END AS has_attachments,
  de.sent_at AS event_at,
  TRUE AS is_read,
  NULL::timestamptz AS replied_at,
  de.sent_by AS sent_by,
  NULL::uuid AS organisation_id,
  NULL::uuid AS contact_id,
  (
    SELECT fd.sales_order_id
    FROM public.financial_documents fd
    WHERE fd.id::text = de.document_id
    LIMIT 1
  ) AS sales_order_id,
  de.document_number AS sales_order_number,
  NULL::uuid AS consultation_id,
  de.document_type AS document_type,
  de.document_id AS document_id,
  de.document_number AS document_number,
  NULL::text AS gmail_thread_id,
  NULL::text AS gmail_message_id,
  de.status AS status,
  de.error_message AS error_message
FROM public.document_emails de

UNION ALL

-- ============================================================================
-- 3. SORTANTS : consultation_emails
-- ============================================================================
SELECT
  ce.id AS id,
  'sent'::text AS direction,
  'consultation'::text AS kind,
  'verone'::text AS brand,
  ce.recipient_email AS counterparty_email,
  NULL::text AS counterparty_name,
  NULL::text AS our_address,
  ce.subject AS subject,
  NULL::text AS preview,
  ce.message_body AS body_text,
  NULL::text AS body_html,
  ce.attachments AS attachments,
  CASE
    WHEN jsonb_typeof(ce.attachments) = 'array' AND jsonb_array_length(ce.attachments) > 0 THEN TRUE
    ELSE FALSE
  END AS has_attachments,
  ce.sent_at AS event_at,
  TRUE AS is_read,
  NULL::timestamptz AS replied_at,
  ce.sent_by AS sent_by,
  NULL::uuid AS organisation_id,
  NULL::uuid AS contact_id,
  NULL::uuid AS sales_order_id,
  NULL::text AS sales_order_number,
  ce.consultation_id AS consultation_id,
  NULL::text AS document_type,
  NULL::text AS document_id,
  NULL::text AS document_number,
  NULL::text AS gmail_thread_id,
  NULL::text AS gmail_message_id,
  ce.status AS status,
  ce.error_message AS error_message
FROM public.consultation_emails ce

UNION ALL

-- ============================================================================
-- 4. SORTANTS : linkme_info_requests (demandes infos manquantes LinkMe)
-- ============================================================================
SELECT
  lir.id AS id,
  'sent'::text AS direction,
  'info_request'::text AS kind,
  'linkme'::text AS brand,
  lir.recipient_email AS counterparty_email,
  lir.recipient_name AS counterparty_name,
  NULL::text AS our_address,
  COALESCE(
    'Demande d''infos pour ' || so.order_number,
    'Demande d''infos manquantes'
  )::text AS subject,
  lir.custom_message AS preview,
  lir.custom_message AS body_text,
  NULL::text AS body_html,
  NULL::jsonb AS attachments,
  FALSE AS has_attachments,
  lir.sent_at AS event_at,
  TRUE AS is_read,
  lir.completed_at AS replied_at,
  lir.sent_by AS sent_by,
  NULL::uuid AS organisation_id,
  NULL::uuid AS contact_id,
  lir.sales_order_id AS sales_order_id,
  so.order_number AS sales_order_number,
  NULL::uuid AS consultation_id,
  NULL::text AS document_type,
  NULL::text AS document_id,
  NULL::text AS document_number,
  NULL::text AS gmail_thread_id,
  NULL::text AS gmail_message_id,
  CASE
    WHEN lir.completed_at IS NOT NULL THEN 'completed'
    WHEN lir.cancelled_at IS NOT NULL THEN 'cancelled'
    WHEN lir.token_expires_at < NOW() THEN 'expired'
    ELSE 'pending'
  END AS status,
  NULL::text AS error_message
FROM public.linkme_info_requests lir
LEFT JOIN public.sales_orders so ON so.id = lir.sales_order_id;

COMMENT ON VIEW public.client_communications_unified IS
  'Vue unifiée des mails entrants + sortants tous canaux (Vérone + LinkMe). Source pour le HUB messagerie et la carte Communications page commande. BO-MSG-018.';
