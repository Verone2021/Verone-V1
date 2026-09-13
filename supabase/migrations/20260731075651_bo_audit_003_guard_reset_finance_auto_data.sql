-- Fichier reconstruit le 2026-09-12 [BO-AUDIT-SEC-S1] à l'identique depuis
-- supabase_migrations.schema_migrations.statements (version 20260731075651) : la migration était appliquée et
-- inscrite au carnet depuis le 2026-07-31, mais aucun fichier local ne lui correspondait. Ne pas la rejouer.

-- [BO-AUDIT-003] Durcissement de reset_finance_auto_data
--
-- Avant : SECURITY DEFINER sans controle interne, EXECUTE accorde a anon et
-- authenticated. N'importe quel porteur de la cle publique anon (embarquee
-- dans le JS des sites publics, et presente dans l'historique git public),
-- ou tout compte authentifie (affilies LinkMe inclus), pouvait supprimer les
-- organisations auto-creees, delier les transactions bancaires et desactiver
-- toutes les regles de rapprochement.
--
-- Apres :
--   1. Controle interne : execution reservee aux roles back-office
--      owner/admin actifs (user_app_roles). La page /finance/admin/reset
--      continue de fonctionner a l'identique pour ces roles.
--   2. REVOKE EXECUTE FROM anon (defense en profondeur).
--
-- Corps de la fonction inchange par ailleurs (recopie de la production,
-- pg_get_functiondef du 2026-07-30).

CREATE OR REPLACE FUNCTION public.reset_finance_auto_data(p_dry_run boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_auto_orgs UUID[];
  v_auto_org_names TEXT[];
  v_unlinked_count INT := 0;
  v_deleted_orgs_count INT := 0;
  v_disabled_rules_count INT := 0;
  v_transactions_to_unlink INT := 0;
  v_rules_to_disable INT := 0;
BEGIN
  -- [BO-AUDIT-003] Garde d'acces : owner/admin back-office uniquement.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role IN ('owner', 'admin')
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acces refuse: role back-office owner/admin requis'
      USING ERRCODE = '42501';
  END IF;

  SELECT
    array_agg(id),
    array_agg(legal_name)
  INTO v_auto_orgs, v_auto_org_names
  FROM organisations
  WHERE source = 'transaction_linking';

  SELECT COUNT(*) INTO v_transactions_to_unlink
  FROM bank_transactions
  WHERE counterparty_organisation_id = ANY(COALESCE(v_auto_orgs, ARRAY[]::UUID[]));

  SELECT COUNT(*) INTO v_rules_to_disable
  FROM matching_rules
  WHERE is_active = true;

  IF p_dry_run THEN
    RETURN jsonb_build_object(
      'dry_run', true,
      'preview', jsonb_build_object(
        'organisations_to_delete', COALESCE(array_length(v_auto_orgs, 1), 0),
        'organisation_names', COALESCE(v_auto_org_names, ARRAY[]::TEXT[]),
        'rules_to_disable', v_rules_to_disable,
        'transactions_to_unlink', v_transactions_to_unlink
      ),
      'message', 'This is a preview. Call with p_dry_run=false to apply changes.'
    );
  ELSE
    IF v_auto_orgs IS NOT NULL AND array_length(v_auto_orgs, 1) > 0 THEN
      UPDATE bank_transactions
      SET counterparty_organisation_id = NULL, updated_at = now()
      WHERE counterparty_organisation_id = ANY(v_auto_orgs);
      GET DIAGNOSTICS v_unlinked_count = ROW_COUNT;

      DELETE FROM organisations WHERE id = ANY(v_auto_orgs);
      GET DIAGNOSTICS v_deleted_orgs_count = ROW_COUNT;
    END IF;

    UPDATE matching_rules
    SET is_active = false, disabled_at = now()
    WHERE is_active = true;
    GET DIAGNOSTICS v_disabled_rules_count = ROW_COUNT;

    RETURN jsonb_build_object(
      'dry_run', false,
      'success', true,
      'result', jsonb_build_object(
        'deleted_organisations', v_deleted_orgs_count,
        'disabled_rules', v_disabled_rules_count,
        'unlinked_transactions', v_unlinked_count
      ),
      'message', 'Finance auto-data has been reset successfully.'
    );
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.reset_finance_auto_data(boolean) FROM anon;
