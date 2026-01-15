-- Table pour thread de conversation (réponses, notes internes)
-- Permet de suivre tout l'historique des échanges avec le client
CREATE TABLE form_submission_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,

  -- Auteur
  author_type TEXT NOT NULL CHECK (author_type IN ('client', 'staff', 'system')),
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT, -- Nom affiché

  -- Contenu
  message_body TEXT NOT NULL,
  message_type TEXT DEFAULT 'reply' CHECK (message_type IN ('reply', 'note', 'status_change')),

  -- Email
  sent_via TEXT DEFAULT 'internal' CHECK (sent_via IN ('internal', 'email')),
  email_id TEXT, -- Resend email ID
  email_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_form_messages_submission ON form_submission_messages(form_submission_id, created_at ASC);
CREATE INDEX idx_form_messages_author ON form_submission_messages(author_user_id);

COMMENT ON TABLE form_submission_messages IS 'Conversation thread for form submissions (replies, internal notes, status changes)';
COMMENT ON COLUMN form_submission_messages.author_type IS 'Who created this message: client (external), staff (back-office user), or system (automated)';
COMMENT ON COLUMN form_submission_messages.message_type IS 'reply = response to client, note = internal only, status_change = system log';
COMMENT ON COLUMN form_submission_messages.sent_via IS 'internal = visible in back-office only, email = sent via Resend';
