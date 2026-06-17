-- [BO-COMPTA-001] Suivi "transféré au comptable"
--
-- Permet de savoir, pièce par pièce, ce qui a déjà été envoyé au cabinet
-- comptable (Welyb / Audamex), pour ne jamais envoyer deux fois.
-- Renseigné au moment d'un envoi MANUEL réussi (déclenché par Roméo depuis
-- le back-office). L'historique détaillé des emails reste dans document_emails.
--
-- Additif pur (colonnes nullable) : aucune donnée existante impactée.

-- bank_transactions : pièces issues de la banque (achats/ventes 2024-2025)
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS transferred_to_accountant_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transferred_to_accountant_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.bank_transactions.transferred_to_accountant_at
  IS 'Date d envoi de la piece au comptable (Welyb). NULL = non transfere.';
COMMENT ON COLUMN public.bank_transactions.transferred_to_accountant_by
  IS 'Utilisateur ayant declenche le transfert manuel.';

-- financial_documents : factures/avoirs (2026+ Qonto, factures de service)
ALTER TABLE public.financial_documents
  ADD COLUMN IF NOT EXISTS transferred_to_accountant_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transferred_to_accountant_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.financial_documents.transferred_to_accountant_at
  IS 'Date d envoi du document au comptable (Welyb). NULL = non transfere.';
COMMENT ON COLUMN public.financial_documents.transferred_to_accountant_by
  IS 'Utilisateur ayant declenche le transfert manuel.';

-- Index pour le filtre "non transférés" dans le cockpit
CREATE INDEX IF NOT EXISTS bank_transactions_transferred_idx
  ON public.bank_transactions (transferred_to_accountant_at);
CREATE INDEX IF NOT EXISTS financial_documents_transferred_idx
  ON public.financial_documents (transferred_to_accountant_at);
