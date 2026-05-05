-- BO-MSG-007: track last seen historyId per watched mailbox
-- Pub/Sub envoie l'historyId APRÈS la mutation, mais users.history.list
-- traite startHistoryId comme EXCLUSIVE. Sans cette table, le code rate
-- systématiquement le message qui a déclenché la notification.

CREATE TABLE IF NOT EXISTS public.gmail_watch_state (
  email_address text PRIMARY KEY,
  last_history_id text NOT NULL,
  watch_expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gmail_watch_state IS
  'Etat persistent par boite Gmail surveillee : last_history_id sert de startHistoryId exclusif au prochain fetch declenche par Pub/Sub.';

-- RLS : staff back-office uniquement (consultation diag)
ALTER TABLE public.gmail_watch_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_gmail_watch_state" ON public.gmail_watch_state
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_gmail_watch_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_gmail_watch_state_updated_at
  BEFORE UPDATE ON public.gmail_watch_state
  FOR EACH ROW
  EXECUTE FUNCTION public.set_gmail_watch_state_updated_at();
