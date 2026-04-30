-- =======================================================================
-- BO-SEC-RLS-005 — Scoper 25+ RLS authenticated-true vers is_backoffice_user()
-- =======================================================================
-- Date         : 2026-04-30
-- Suite de    : #840, #841, #842, #843, #844, #845
--
-- Cible : ~25 policies sur 9 tables critiques staff-only qui ouvraient à
-- TOUS les utilisateurs authentifiés (y compris affiliés LinkMe non-staff).
-- Risque : un affilié LinkMe authentifié peut potentiellement modifier des
-- règles de matching finance, des templates emails, des comptes bancaires
-- contrepartie, etc.
--
-- Stratégie :
--   - DROP les policies actuelles (USING true / WITH CHECK true).
--   - CREATE des policies staff-only USING `is_backoffice_user()` qui
--     filtre sur user_app_roles WHERE app = 'back-office'.
--   - Service_role et postgres conservent leur bypass RLS automatique.
--
-- Tables traitées (ordre alphabétique) :
--   1. affiliate_archive_requests (ALL public-true → staff)
--   2. consultation_images (read/update/delete public-true → staff,
--      l'insert déjà fait par #844)
--   3. counterparty_bank_accounts (4 policies authenticated-true → staff)
--   4. email_templates (3 policies authenticated-true → staff)
--   5. finance_settings (read/update public-true → staff)
--   6. matching_rules (ALL authenticated-true → staff)
--   7. mcp_resolution_queue (ALL authenticated-true → staff)
--   8. webhook_configs (4 policies authenticated-true → staff)
--   9. webhook_logs (2 policies authenticated-true → staff)
--
-- + DROP des policies orphelines sur `collection_shares` (table 0 lignes,
--   feature jamais finalisée — peut être recréée si besoin futur avec un
--   scoping correct).
--
-- Hors scope :
--   - 30+ policies authenticated-true sur channel_*, stock_*, etc. À traiter
--     dans une PR future avec audit case-by-case (ces tables sont
--     consommées par les apps en authentifié et un scoping mal calibré
--     pourrait casser des écrans).
--
-- Ces 25+ fixes représentent la **dette critique restante** sur les
-- rls_policy_always_true.
-- =======================================================================

BEGIN;


-- -----------------------------------------------------------------------
-- 1. affiliate_archive_requests — PUBLIC ALL → staff ALL
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Back-office full access on affiliate_archive_requests"
  ON public.affiliate_archive_requests;

CREATE POLICY staff_full_access_affiliate_archive_requests
  ON public.affiliate_archive_requests
  FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 2. consultation_images — read/update/delete PUBLIC → staff
--    (l'insert déjà fait par #844 — staff_insert_consultation_images)
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS consultation_images_read   ON public.consultation_images;
DROP POLICY IF EXISTS consultation_images_update ON public.consultation_images;
DROP POLICY IF EXISTS consultation_images_delete ON public.consultation_images;

CREATE POLICY staff_read_consultation_images
  ON public.consultation_images
  FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

CREATE POLICY staff_update_consultation_images
  ON public.consultation_images
  FOR UPDATE TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());

CREATE POLICY staff_delete_consultation_images
  ON public.consultation_images
  FOR DELETE TO authenticated
  USING (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 3. counterparty_bank_accounts — 4 policies → staff
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can delete bank accounts"
  ON public.counterparty_bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can insert bank accounts"
  ON public.counterparty_bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can read bank accounts"
  ON public.counterparty_bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can update bank accounts"
  ON public.counterparty_bank_accounts;

CREATE POLICY staff_full_access_counterparty_bank_accounts
  ON public.counterparty_bank_accounts
  FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 4. email_templates — 3 policies → staff
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can insert email templates"
  ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can read email templates"
  ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can update email templates"
  ON public.email_templates;

CREATE POLICY staff_full_access_email_templates
  ON public.email_templates
  FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 5. finance_settings — read/update PUBLIC → staff
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS finance_settings_read   ON public.finance_settings;
DROP POLICY IF EXISTS finance_settings_update ON public.finance_settings;

CREATE POLICY staff_read_finance_settings
  ON public.finance_settings
  FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

CREATE POLICY staff_update_finance_settings
  ON public.finance_settings
  FOR UPDATE TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 6. matching_rules — ALL authenticated-true → staff ALL
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users full access matching_rules"
  ON public.matching_rules;

CREATE POLICY staff_full_access_matching_rules
  ON public.matching_rules
  FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 7. mcp_resolution_queue — ALL authenticated-true → staff ALL
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS mcp_queue_authenticated_all
  ON public.mcp_resolution_queue;

CREATE POLICY staff_full_access_mcp_resolution_queue
  ON public.mcp_resolution_queue
  FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 8. webhook_configs — 4 policies authenticated-true → staff
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can delete webhook configs"
  ON public.webhook_configs;
DROP POLICY IF EXISTS "Authenticated users can insert webhook configs"
  ON public.webhook_configs;
DROP POLICY IF EXISTS "Authenticated users can read webhook configs"
  ON public.webhook_configs;
DROP POLICY IF EXISTS "Authenticated users can update webhook configs"
  ON public.webhook_configs;

CREATE POLICY staff_full_access_webhook_configs
  ON public.webhook_configs
  FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 9. webhook_logs — 2 policies authenticated-true → staff
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can read webhook logs"
  ON public.webhook_logs;
DROP POLICY IF EXISTS "Service role can insert webhook logs"
  ON public.webhook_logs;

CREATE POLICY staff_read_webhook_logs
  ON public.webhook_logs
  FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

-- L'insert webhook_logs reste pour service_role uniquement (bypass RLS auto).
-- Pas de policy INSERT explicite nécessaire.


-- -----------------------------------------------------------------------
-- 10. collection_shares — DROP toutes (table 0 lignes, feature inactive)
-- -----------------------------------------------------------------------
-- Ces 4 policies étaient {-} (PUBLIC) USING true / WITH CHECK true →
-- exposition complète anon. Vu que la table est vide et que la feature
-- "share collection" n'est pas finalisée, on DROP les policies. Si la
-- feature est réactivée plus tard, recréer les policies avec un scoping
-- correct (`is_backoffice_user()` + scope par owner_id par exemple).

DROP POLICY IF EXISTS collection_shares_read   ON public.collection_shares;
DROP POLICY IF EXISTS collection_shares_insert ON public.collection_shares;
DROP POLICY IF EXISTS collection_shares_update ON public.collection_shares;
DROP POLICY IF EXISTS collection_shares_delete ON public.collection_shares;

-- RLS reste activée — sans policy, anon/authenticated ne peuvent rien faire.
-- service_role et postgres conservent l'accès via bypass RLS automatique.

COMMIT;
