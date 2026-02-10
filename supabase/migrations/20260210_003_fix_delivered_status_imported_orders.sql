-- ============================================================================
-- Migration: Correction Statuts Commandes Importées (shipped → delivered)
-- Date: 2026-02-10
-- Description: 99 commandes importées ont delivered_at renseigné mais
--              status = 'shipped' (incohérent). Cette migration corrige
--              le statut SANS impact stock ni notifications spam.
--
-- SÉCURITÉ:
-- - Triggers notifications désactivés pendant migration (éviter spam)
-- - Triggers stock désactivés pendant migration (transition administrative)
-- - Triggers commission ACTIFS (UPSERT idempotent, mise à jour statut)
-- - Validations pré/post migration (stock identique)
--
-- CONTEXTE:
-- - 133 commandes en base (imports historiques)
-- - 99 commandes shipped avec delivered_at renseigné (incohérence)
-- - 0 commandes en statut delivered actuellement
-- - Workflow correct: shipped → delivered → closed
-- ============================================================================

-- ============================================================================
-- PHASE 1: VALIDATIONS PRÉ-MIGRATION
-- ============================================================================

DO $$
DECLARE
  v_commandes_a_corriger INTEGER;
  v_incohérence_draft INTEGER;
  v_stock_real_avant NUMERIC;
  v_stock_forecasted_in_avant NUMERIC;
  v_stock_forecasted_out_avant NUMERIC;
BEGIN
  RAISE NOTICE '🔍 PHASE 1: Validations pré-migration';

  -- 1. Compter commandes à corriger
  SELECT COUNT(*) INTO v_commandes_a_corriger
  FROM sales_orders
  WHERE delivered_at IS NOT NULL AND status != 'delivered';

  RAISE NOTICE '   → Commandes à corriger: %', v_commandes_a_corriger;

  IF v_commandes_a_corriger = 0 THEN
    RAISE EXCEPTION 'Aucune commande à corriger (déjà migrées?)';
  END IF;

  -- 2. Vérifier qu'aucune commande draft/validated a delivered_at (incohérence grave)
  SELECT COUNT(*) INTO v_incohérence_draft
  FROM sales_orders
  WHERE delivered_at IS NOT NULL AND status IN ('draft', 'validated');

  IF v_incohérence_draft > 0 THEN
    RAISE EXCEPTION 'INCOHÉRENCE GRAVE: % commandes draft/validated avec delivered_at', v_incohérence_draft;
  END IF;

  RAISE NOTICE '   ✅ Aucune incohérence grave détectée';

  -- 3. Sauvegarder totaux stock AVANT migration (pour validation post-migration)
  SELECT
    COALESCE(SUM(stock_real), 0),
    COALESCE(SUM(stock_forecasted_in), 0),
    COALESCE(SUM(stock_forecasted_out), 0)
  INTO v_stock_real_avant, v_stock_forecasted_in_avant, v_stock_forecasted_out_avant
  FROM products;

  RAISE NOTICE '   → Stock AVANT migration:';
  RAISE NOTICE '      - stock_real: %', v_stock_real_avant;
  RAISE NOTICE '      - stock_forecasted_in: %', v_stock_forecasted_in_avant;
  RAISE NOTICE '      - stock_forecasted_out: %', v_stock_forecasted_out_avant;

  -- Stocker dans table temporaire pour validation post-migration
  CREATE TEMP TABLE IF NOT EXISTS migration_stock_snapshot (
    phase TEXT,
    stock_real NUMERIC,
    stock_forecasted_in NUMERIC,
    stock_forecasted_out NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  INSERT INTO migration_stock_snapshot (phase, stock_real, stock_forecasted_in, stock_forecasted_out)
  VALUES ('PRE_MIGRATION', v_stock_real_avant, v_stock_forecasted_in_avant, v_stock_forecasted_out_avant);

  RAISE NOTICE '✅ PHASE 1 terminée - Validations OK';
END $$;

-- ============================================================================
-- PHASE 2: DÉSACTIVER TRIGGERS (Notifications + Stock)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🛑 PHASE 2: Désactivation triggers';

  -- Désactiver triggers NOTIFICATIONS (avec gestion erreur si n'existent pas)
  BEGIN
    ALTER TABLE sales_orders DISABLE TRIGGER trigger_order_shipped_notification;
  EXCEPTION WHEN undefined_object THEN
    NULL; -- Trigger n'existe pas, continuer
  END;

  BEGIN
    ALTER TABLE sales_orders DISABLE TRIGGER trigger_order_confirmed_notification;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE sales_orders DISABLE TRIGGER trigger_so_delayed_notification;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE sales_orders DISABLE TRIGGER trigger_so_partial_shipped_notification;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  RAISE NOTICE '   ✅ Triggers notifications désactivés';

  -- Désactiver triggers STOCK (sécurité, normalement pas déclenché sur shipped→delivered)
  BEGIN
    ALTER TABLE sales_orders DISABLE TRIGGER trigger_so_update_forecasted_out;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE sales_orders DISABLE TRIGGER trg_so_devalidation_forecasted_stock;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE sales_orders DISABLE TRIGGER trigger_so_cancellation_rollback;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  RAISE NOTICE '   ✅ Triggers stock désactivés';

  -- GARDER ACTIFS les triggers commission (UPSERT idempotent)
  -- - trg_create_linkme_commission: Crée/met à jour commission
  -- - trg_sync_commission_on_payment: Synchronise statut commission

  RAISE NOTICE '   ⚠️  Triggers commission ACTIFS (mise à jour)';
  RAISE NOTICE '✅ PHASE 2 terminée';
END $$;

-- ============================================================================
-- PHASE 3: MIGRATION DONNÉES (Idempotent)
-- ============================================================================

DO $$
DECLARE
  v_updated_closed_at INTEGER;
  v_updated_status INTEGER;
BEGIN
  RAISE NOTICE '🔧 PHASE 3: Migration données';

  -- Étape 3.1: Ajouter closed_at si manquant
  UPDATE sales_orders
  SET
    closed_at = COALESCE(closed_at, delivered_at, NOW()),
    updated_at = NOW()
  WHERE delivered_at IS NOT NULL
    AND closed_at IS NULL;

  GET DIAGNOSTICS v_updated_closed_at = ROW_COUNT;
  RAISE NOTICE '   → % commandes: closed_at renseigné', v_updated_closed_at;

  -- Étape 3.2: Migrer statuts shipped → delivered
  UPDATE sales_orders
  SET
    status = 'delivered',
    updated_at = NOW()
  WHERE status = 'shipped'
    AND delivered_at IS NOT NULL;

  GET DIAGNOSTICS v_updated_status = ROW_COUNT;
  RAISE NOTICE '   → % commandes migrées: shipped → delivered', v_updated_status;

  IF v_updated_status = 0 THEN
    RAISE WARNING 'Aucune commande migrée (déjà fait?)';
  END IF;

  RAISE NOTICE '✅ PHASE 3 terminée';
END $$;

-- ============================================================================
-- PHASE 4: RÉACTIVER TRIGGERS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔄 PHASE 4: Réactivation triggers';

  -- Réactiver triggers notifications (avec gestion erreur si n'existent pas)
  BEGIN
    ALTER TABLE sales_orders ENABLE TRIGGER trigger_order_shipped_notification;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE sales_orders ENABLE TRIGGER trigger_order_confirmed_notification;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE sales_orders ENABLE TRIGGER trigger_so_delayed_notification;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE sales_orders ENABLE TRIGGER trigger_so_partial_shipped_notification;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  RAISE NOTICE '   ✅ Triggers notifications réactivés';

  -- Réactiver triggers stock
  BEGIN
    ALTER TABLE sales_orders ENABLE TRIGGER trigger_so_update_forecasted_out;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE sales_orders ENABLE TRIGGER trg_so_devalidation_forecasted_stock;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE sales_orders ENABLE TRIGGER trigger_so_cancellation_rollback;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  RAISE NOTICE '   ✅ Triggers stock réactivés';
  RAISE NOTICE '✅ PHASE 4 terminée';
END $$;

-- ============================================================================
-- PHASE 5: VALIDATIONS POST-MIGRATION (CRITIQUES)
-- ============================================================================

DO $$
DECLARE
  v_stock_real_avant NUMERIC;
  v_stock_forecasted_in_avant NUMERIC;
  v_stock_forecasted_out_avant NUMERIC;
  v_stock_real_apres NUMERIC;
  v_stock_forecasted_in_apres NUMERIC;
  v_stock_forecasted_out_apres NUMERIC;
  v_nb_delivered INTEGER;
  v_nb_shipped INTEGER;
  v_nb_commissions INTEGER;
  v_delivered_sans_delivered_at INTEGER;
BEGIN
  RAISE NOTICE '🔍 PHASE 5: Validations post-migration';

  -- 1. Vérifier AUCUNE RÉGRESSION STOCK (CRITIQUE)
  SELECT stock_real, stock_forecasted_in, stock_forecasted_out
  INTO v_stock_real_avant, v_stock_forecasted_in_avant, v_stock_forecasted_out_avant
  FROM migration_stock_snapshot
  WHERE phase = 'PRE_MIGRATION';

  SELECT
    COALESCE(SUM(stock_real), 0),
    COALESCE(SUM(stock_forecasted_in), 0),
    COALESCE(SUM(stock_forecasted_out), 0)
  INTO v_stock_real_apres, v_stock_forecasted_in_apres, v_stock_forecasted_out_apres
  FROM products;

  RAISE NOTICE '   → Comparaison stock:';
  RAISE NOTICE '      AVANT → APRÈS';
  RAISE NOTICE '      stock_real: % → %', v_stock_real_avant, v_stock_real_apres;
  RAISE NOTICE '      stock_forecasted_in: % → %', v_stock_forecasted_in_avant, v_stock_forecasted_in_apres;
  RAISE NOTICE '      stock_forecasted_out: % → %', v_stock_forecasted_out_avant, v_stock_forecasted_out_apres;

  IF v_stock_real_avant != v_stock_real_apres OR
     v_stock_forecasted_in_avant != v_stock_forecasted_in_apres OR
     v_stock_forecasted_out_avant != v_stock_forecasted_out_apres THEN
    RAISE EXCEPTION '❌ RÉGRESSION STOCK DÉTECTÉE - ROLLBACK REQUIS';
  END IF;

  RAISE NOTICE '   ✅ Stock IDENTIQUE (aucune régression)';

  -- 2. Vérifier distribution statuts
  SELECT
    COUNT(*) FILTER (WHERE status = 'delivered'),
    COUNT(*) FILTER (WHERE status = 'shipped')
  INTO v_nb_delivered, v_nb_shipped
  FROM sales_orders;

  RAISE NOTICE '   → Distribution statuts:';
  RAISE NOTICE '      - delivered: %', v_nb_delivered;
  RAISE NOTICE '      - shipped: %', v_nb_shipped;

  IF v_nb_delivered = 0 THEN
    RAISE EXCEPTION '❌ Aucune commande delivered après migration';
  END IF;

  -- 3. Vérifier commissions LinkMe
  SELECT COUNT(*) INTO v_nb_commissions
  FROM linkme_commissions;

  RAISE NOTICE '   → Commissions LinkMe: %', v_nb_commissions;

  -- 4. Vérifier cohérence timestamps
  SELECT COUNT(*) INTO v_delivered_sans_delivered_at
  FROM sales_orders
  WHERE status = 'delivered' AND delivered_at IS NULL;

  IF v_delivered_sans_delivered_at > 0 THEN
    RAISE EXCEPTION '❌ INCOHÉRENCE: % commandes delivered sans delivered_at', v_delivered_sans_delivered_at;
  END IF;

  RAISE NOTICE '   ✅ Cohérence timestamps validée';

  -- 5. Nettoyage table temporaire
  DROP TABLE IF EXISTS migration_stock_snapshot;

  RAISE NOTICE '✅ PHASE 5 terminée - TOUTES VALIDATIONS OK';
END $$;

-- ============================================================================
-- RÉSUMÉ FINAL
-- ============================================================================

DO $$
DECLARE
  v_total INTEGER;
  v_delivered INTEGER;
  v_shipped INTEGER;
  v_commissions_payable INTEGER;
  v_commissions_pending INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';

  SELECT COUNT(*) INTO v_total FROM sales_orders;
  SELECT COUNT(*) INTO v_delivered FROM sales_orders WHERE status = 'delivered';
  SELECT COUNT(*) INTO v_shipped FROM sales_orders WHERE status = 'shipped';

  RAISE NOTICE 'Commandes:';
  RAISE NOTICE '  - Total: %', v_total;
  RAISE NOTICE '  - Delivered: % (+ migrées)', v_delivered;
  RAISE NOTICE '  - Shipped: % (restantes)', v_shipped;

  SELECT
    COUNT(*) FILTER (WHERE status = 'payable'),
    COUNT(*) FILTER (WHERE status = 'pending')
  INTO v_commissions_payable, v_commissions_pending
  FROM linkme_commissions;

  RAISE NOTICE 'Commissions LinkMe:';
  RAISE NOTICE '  - Payable: % (client a payé)', v_commissions_payable;
  RAISE NOTICE '  - Pending: % (client n''a pas payé)', v_commissions_pending;

  RAISE NOTICE '';
  RAISE NOTICE '🎯 PROCHAINE ÉTAPE: Audit complet système (divergences statuts)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE sales_orders IS
'Table centrale des commandes de vente.

WORKFLOW STATUTS (2026-02-10):
1. draft - Commande créée (brouillon)
2. validated - Commande validée (stock réservé)
3. partially_shipped - Expédition partielle
4. shipped - Expédition complète
5. delivered - Livraison confirmée (delivered_at renseigné)
6. closed - Commande archivée/clôturée
7. cancelled - Commande annulée (rollback stock)

RÈGLE CRITIQUE: delivered_at renseigné ⟺ status = ''delivered''

TRIGGERS IMPACTANT STOCK:
- trigger_so_update_forecasted_out: draft → validated (réserve stock)
- trg_so_devalidation_forecasted_stock: validated → draft (libère stock)
- trigger_so_cancellation_rollback: → cancelled (rollback stock)

TRANSITION shipped → delivered: Administrative uniquement (pas de mouvement stock)';

-- ============================================================================
-- ROLLBACK (Si Nécessaire)
-- ============================================================================

-- Si problème détecté, exécuter manuellement:
--
-- UPDATE sales_orders
-- SET status = 'shipped', updated_at = NOW()
-- WHERE status = 'delivered'
--   AND delivered_at IS NOT NULL
--   AND delivered_at < '2026-02-10'::DATE;
--
-- Vérifier ensuite avec:
-- SELECT SUM(stock_real), SUM(stock_forecasted_in), SUM(stock_forecasted_out)
-- FROM products;
