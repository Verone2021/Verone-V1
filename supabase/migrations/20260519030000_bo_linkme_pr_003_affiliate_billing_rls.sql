-- =============================================================================
-- [BO-LINKME-PR-003] RLS — permettre à l'affilié d'éditer ses infos de facturation
-- =============================================================================
-- L'affilié LinkMe doit pouvoir :
-- 1. UPDATE son organisation parente (legal_name, siret, vat_number, adresse)
-- 2. CRUD son IBAN dans counterparty_bank_accounts
--
-- Existant : la policy `linkme_users_update_organisations` couvre déjà
-- enseigne_admin / enseigne_collaborateur. Manque : organisation_admin
-- (rattachement direct affilié → organisation, pas via enseigne).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Étendre la policy UPDATE organisations à organisation_admin
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS linkme_users_update_organisations ON organisations;

CREATE POLICY linkme_users_update_organisations ON organisations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (uar.role IN ('enseigne_admin', 'enseigne_collaborateur')
            AND uar.enseigne_id IS NOT NULL
            AND uar.enseigne_id = organisations.enseigne_id)
          OR
          (uar.role = 'organisation_admin'
            AND uar.organisation_id IS NOT NULL
            AND uar.organisation_id = organisations.id)
        )
    )
  );

-- -----------------------------------------------------------------------------
-- 2. Policies sur counterparty_bank_accounts pour les affiliés LinkMe
-- -----------------------------------------------------------------------------
-- L'affilié peut lire / créer / mettre à jour le compte bancaire rattaché à
-- son organisation parente (résolue via get_affiliate_partner_organisation_id
-- ou directement via user_app_roles).

CREATE POLICY linkme_affiliate_select_own_bank_account ON counterparty_bank_accounts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (uar.role = 'organisation_admin'
            AND uar.organisation_id = counterparty_bank_accounts.organisation_id)
          OR
          (uar.role IN ('enseigne_admin', 'enseigne_collaborateur')
            AND uar.enseigne_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM organisations o
              WHERE o.id = counterparty_bank_accounts.organisation_id
                AND o.enseigne_id = uar.enseigne_id
                AND o.is_enseigne_parent = true
            ))
        )
    )
  );

CREATE POLICY linkme_affiliate_insert_own_bank_account ON counterparty_bank_accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (uar.role = 'organisation_admin'
            AND uar.organisation_id = counterparty_bank_accounts.organisation_id)
          OR
          (uar.role IN ('enseigne_admin', 'enseigne_collaborateur')
            AND uar.enseigne_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM organisations o
              WHERE o.id = counterparty_bank_accounts.organisation_id
                AND o.enseigne_id = uar.enseigne_id
                AND o.is_enseigne_parent = true
            ))
        )
    )
  );

CREATE POLICY linkme_affiliate_update_own_bank_account ON counterparty_bank_accounts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (uar.role = 'organisation_admin'
            AND uar.organisation_id = counterparty_bank_accounts.organisation_id)
          OR
          (uar.role IN ('enseigne_admin', 'enseigne_collaborateur')
            AND uar.enseigne_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM organisations o
              WHERE o.id = counterparty_bank_accounts.organisation_id
                AND o.enseigne_id = uar.enseigne_id
                AND o.is_enseigne_parent = true
            ))
        )
    )
  );

COMMIT;
