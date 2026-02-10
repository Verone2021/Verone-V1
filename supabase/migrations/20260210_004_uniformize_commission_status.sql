-- ============================================================================
-- Migration: Uniformisation payable → validated
-- Date: 2026-02-10
-- Description: Migre les 3 dernières commissions 'payable' (legacy) vers
--              'validated' pour uniformiser le système.
--
-- CONTEXTE:
-- - Audit système a révélé divergence 'payable' vs 'validated' (même statut)
-- - Triggers créent 'validated' depuis décembre 2025
-- - RPCs supportent les 2 statuts (rétrocompatibilité intégrée)
-- - 3 commissions legacy restaient en 'payable'
--
-- IMPACT:
-- - 3 commissions migrées
-- - AUCUN breaking change (système déjà compatible)
-- - Fix bug back-office (tab "Payables" vide)
--
-- ROLLBACK:
-- UPDATE linkme_commissions SET status = 'payable'
-- WHERE id IN (...);  -- IDs sauvegardés en logs
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
  v_ids TEXT[];
BEGIN
  RAISE NOTICE '🔧 Uniformisation payable → validated';

  -- Sauvegarder IDs pour rollback éventuel
  SELECT ARRAY_AGG(id::TEXT) INTO v_ids
  FROM linkme_commissions
  WHERE status = 'payable';

  IF v_ids IS NOT NULL THEN
    RAISE NOTICE 'IDs à migrer (pour rollback): %', v_ids;
  END IF;

  -- Migrer les commissions legacy
  UPDATE linkme_commissions
  SET status = 'validated', updated_at = NOW()
  WHERE status = 'payable';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RAISE NOTICE '✅ Aucune commission à migrer (déjà fait?)';
  ELSE
    RAISE NOTICE '✅ % commissions migrées payable → validated', v_count;
  END IF;
END $$;

-- ============================================================================
-- VALIDATIONS POST-MIGRATION
-- ============================================================================

DO $$
DECLARE
  v_remaining INTEGER;
  v_validated INTEGER;
  v_pending INTEGER;
BEGIN
  RAISE NOTICE '🔍 Validations post-migration:';

  -- Vérifier plus aucune 'payable'
  SELECT COUNT(*) INTO v_remaining
  FROM linkme_commissions
  WHERE status = 'payable';

  IF v_remaining > 0 THEN
    RAISE EXCEPTION '❌ Migration incomplète: % commissions payable restantes', v_remaining;
  END IF;

  -- Vérifier distribution statuts
  SELECT
    COUNT(*) FILTER (WHERE status = 'validated'),
    COUNT(*) FILTER (WHERE status = 'pending')
  INTO v_validated, v_pending
  FROM linkme_commissions;

  RAISE NOTICE '   ✅ 0 commissions payable (uniformisation réussie)';
  RAISE NOTICE '   ✅ % commissions validated', v_validated;
  RAISE NOTICE '   ✅ % commissions pending', v_pending;
END $$;

-- ============================================================================
-- COMMENTAIRE TABLE (Documentation workflow)
-- ============================================================================

COMMENT ON COLUMN linkme_commissions.status IS
'Statut de la commission LinkMe.

WORKFLOW:
- pending: Commission créée, client n''a pas payé
- validated: Client a payé, commission éligible pour versement
- requested: Demande de versement en cours (via linkme_payment_requests)
- paid: Commission versée à l''affilié
- cancelled: Commission annulée (commande annulée)

DEPRECATED (2026-02-10):
- payable: Ancien alias de "validated", uniformisé par migration 20260210_004

TRIGGERS ACTIFS:
- create_linkme_commission_on_order_update: Crée commission sur sales_orders.status=delivered
- sync_commission_status_on_payment: Met à validated quand sales_orders.payment_status=paid
- sync_commissions_on_payment_request_paid: Met à paid quand demande versement payée';

-- ============================================================================
-- ROLLBACK (Si Nécessaire)
-- ============================================================================

-- En cas de problème, exécuter:
--
-- UPDATE linkme_commissions
-- SET status = 'payable', updated_at = NOW()
-- WHERE id IN (
--   -- Remplacer par les IDs affichés dans les logs RAISE NOTICE
--   '...', '...', '...'
-- );
--
-- Vérifier:
-- SELECT status, COUNT(*) FROM linkme_commissions GROUP BY status;
