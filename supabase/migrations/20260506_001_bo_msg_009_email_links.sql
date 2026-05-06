-- BO-MSG-009 : reconnaissance automatique du client/organisation sur les mails
--
-- Ajoute à email_messages les FK qui permettront de lier un mail entrant
-- à l'organisation cliente, au contact connu, ou à l'utilisateur LinkMe
-- correspondant. Ajoute aussi les colonnes pour tracker les réponses
-- (anticipe BO-MSG-010 compose/reply).

-- 1. Nouvelles colonnes (FK declarees via ALTER TABLE ADD CONSTRAINT pour
-- compatibilite avec le drift checker qui matche FOREIGN KEY (col) REFERENCES).
ALTER TABLE public.email_messages
  ADD COLUMN IF NOT EXISTS linked_organisation_id uuid NULL,
  ADD COLUMN IF NOT EXISTS linked_contact_id uuid NULL,
  ADD COLUMN IF NOT EXISTS linked_user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS sent_by_user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS reply_message_id text NULL;

ALTER TABLE public.email_messages
  DROP CONSTRAINT IF EXISTS email_messages_linked_organisation_id_fkey,
  ADD CONSTRAINT email_messages_linked_organisation_id_fkey
    FOREIGN KEY (linked_organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

ALTER TABLE public.email_messages
  DROP CONSTRAINT IF EXISTS email_messages_linked_contact_id_fkey,
  ADD CONSTRAINT email_messages_linked_contact_id_fkey
    FOREIGN KEY (linked_contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- 2. Indexes pour filtres et FK
CREATE INDEX IF NOT EXISTS idx_email_messages_linked_organisation_id
  ON public.email_messages(linked_organisation_id)
  WHERE linked_organisation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_messages_linked_contact_id
  ON public.email_messages(linked_contact_id)
  WHERE linked_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_messages_linked_user_id
  ON public.email_messages(linked_user_id)
  WHERE linked_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_messages_sent_by_user_id
  ON public.email_messages(sent_by_user_id)
  WHERE sent_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_messages_replied_at
  ON public.email_messages(replied_at)
  WHERE replied_at IS NOT NULL;

-- 3. Fonction de reconnaissance — croise un email avec organisations/contacts/users
CREATE OR REPLACE FUNCTION public.resolve_email_links(p_from_email text)
RETURNS TABLE (
  linked_organisation_id uuid,
  linked_contact_id uuid,
  linked_user_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH normalized AS (
    SELECT lower(trim(p_from_email)) AS e
  ),
  org AS (
    SELECT id FROM public.organisations
    WHERE lower(email) = (SELECT e FROM normalized)
       OR lower(secondary_email) = (SELECT e FROM normalized)
    LIMIT 1
  ),
  ct AS (
    SELECT id, organisation_id FROM public.contacts
    WHERE lower(email) = (SELECT e FROM normalized)
       OR lower(secondary_email) = (SELECT e FROM normalized)
    LIMIT 1
  ),
  usr AS (
    SELECT id FROM auth.users
    WHERE lower(email) = (SELECT e FROM normalized)
    LIMIT 1
  )
  SELECT
    COALESCE((SELECT id FROM org), (SELECT organisation_id FROM ct)),
    (SELECT id FROM ct),
    (SELECT id FROM usr);
$$;

GRANT EXECUTE ON FUNCTION public.resolve_email_links(text) TO authenticated, service_role;

-- 4. Trigger BEFORE INSERT — peuple les FK automatiquement à l'arrivée du mail
CREATE OR REPLACE FUNCTION public.email_messages_link_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_org_id uuid;
  v_contact_id uuid;
  v_user_id uuid;
BEGIN
  -- Skip si déjà rempli (cas backfill ou import manuel)
  IF NEW.linked_organisation_id IS NOT NULL
     OR NEW.linked_contact_id IS NOT NULL
     OR NEW.linked_user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT linked_organisation_id, linked_contact_id, linked_user_id
    INTO v_org_id, v_contact_id, v_user_id
    FROM public.resolve_email_links(NEW.from_email);

  NEW.linked_organisation_id := v_org_id;
  NEW.linked_contact_id := v_contact_id;
  NEW.linked_user_id := v_user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_messages_link_on_insert ON public.email_messages;
CREATE TRIGGER trg_email_messages_link_on_insert
  BEFORE INSERT ON public.email_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.email_messages_link_on_insert();

-- 5. Backfill — applique resolve_email_links sur les mails existants.
-- LATERAL nécessaire car la fonction set-returning est corrélée au FROM.
WITH resolved AS (
  SELECT
    em.id,
    links.linked_organisation_id,
    links.linked_contact_id,
    links.linked_user_id
  FROM public.email_messages em
  CROSS JOIN LATERAL public.resolve_email_links(em.from_email) AS links
  WHERE em.linked_organisation_id IS NULL
    AND em.linked_contact_id IS NULL
    AND em.linked_user_id IS NULL
)
UPDATE public.email_messages em
SET
  linked_organisation_id = resolved.linked_organisation_id,
  linked_contact_id = resolved.linked_contact_id,
  linked_user_id = resolved.linked_user_id
FROM resolved
WHERE em.id = resolved.id;

COMMENT ON COLUMN public.email_messages.linked_organisation_id IS
  'Organisation cliente identifiée à partir de from_email (croisement organisations.email/secondary_email ou contacts.organisation_id). Auto-rempli par trg_email_messages_link_on_insert.';
COMMENT ON COLUMN public.email_messages.linked_contact_id IS
  'Contact identifié à partir de from_email (croisement contacts.email/secondary_email).';
COMMENT ON COLUMN public.email_messages.linked_user_id IS
  'Utilisateur LinkMe identifié à partir de from_email (croisement auth.users.email).';
COMMENT ON COLUMN public.email_messages.replied_at IS
  'Timestamp de la réponse depuis le BO. NULL = mail jamais répondu.';
COMMENT ON COLUMN public.email_messages.sent_by_user_id IS
  'Auteur de la réponse côté BO (FK auth.users). NULL pour les mails entrants.';
COMMENT ON COLUMN public.email_messages.reply_message_id IS
  'Gmail message id de la réponse envoyée depuis le BO.';
