-- BO-MSG-001 : table email_messages pour le pipeline Gmail inbound
-- Stocke les emails reçus sur les groupes contact@ et commandes@ des deux marques
-- (Vérone + LinkMe) pour les rendre consultables dans le back-office.

CREATE TABLE IF NOT EXISTS public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiants Gmail
  gmail_message_id TEXT UNIQUE NOT NULL,
  gmail_thread_id TEXT NOT NULL,
  gmail_history_id TEXT,

  -- Routage : marque et adresse destinataire (groupe)
  brand TEXT NOT NULL CHECK (brand IN ('verone', 'linkme')),
  to_address TEXT NOT NULL,

  -- Émetteur
  from_email TEXT NOT NULL,
  from_name TEXT,

  -- Contenu
  subject TEXT,
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,

  -- Méta
  received_at TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  has_attachments BOOLEAN NOT NULL DEFAULT false,
  raw_headers JSONB,

  -- Lien automatique vers commande (si numéro détecté)
  linked_order_id UUID REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  linked_order_number TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_email_messages_received_at
  ON public.email_messages (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_messages_to_address
  ON public.email_messages (to_address);

CREATE INDEX IF NOT EXISTS idx_email_messages_brand
  ON public.email_messages (brand);

CREATE INDEX IF NOT EXISTS idx_email_messages_linked_order
  ON public.email_messages (linked_order_id)
  WHERE linked_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_messages_unread
  ON public.email_messages (is_read)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_email_messages_thread
  ON public.email_messages (gmail_thread_id);

-- Trigger updated_at
CREATE TRIGGER set_email_messages_updated_at
  BEFORE UPDATE ON public.email_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS : seul le staff back-office accède à ces emails
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_email_messages"
  ON public.email_messages
  FOR ALL TO authenticated
  USING (public.is_backoffice_user());

-- Commentaires
COMMENT ON TABLE public.email_messages IS
  'Emails reçus sur les groupes contact@ et commandes@ (Vérone + LinkMe) — pipeline Gmail inbound (BO-MSG-001)';
COMMENT ON COLUMN public.email_messages.brand IS
  'Marque destinataire : verone ou linkme (déduite de to_address)';
COMMENT ON COLUMN public.email_messages.linked_order_id IS
  'Référence sales_orders si un numéro de commande a été détecté dans subject/body';
