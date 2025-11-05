-- Migration 114: Correction Trigger Validation Strict
-- Date: 2025-11-05
-- Contexte: TRIGGER 4 trop permissif - Valide alerte sur ANY status change (même cancelled)
--
-- Objectif:
-- Corriger condition TRIGGER 4 pour validation UNIQUEMENT sur:
-- - confirmed (commande validée)
-- - sent (commande expédiée)
-- - received (commande réceptionnée)
--
-- Problème actuel:
-- WHEN (OLD.status = 'draft' AND NEW.status != 'draft')
-- → Valide AUSSI sur cancelled ❌
--
-- Solution:
-- WHEN (OLD.status = 'draft' AND NEW.status IN ('confirmed', 'sent', 'received'))
-- → Validation STRICTE ✅
--
-- Références:
-- - Commit 6bd7bdb (4 nov 23:19) : Version fonctionnelle complète
-- - Migration 102: TRIGGER 4 base (trop permissif)
-- - Migration 113: TRIGGER 6 annulation (gère cancelled)

-- =============================================================================
-- Correction TRIGGER 4: Validation Stricte
-- =============================================================================

-- Recréer trigger avec condition stricte
DROP TRIGGER IF EXISTS trigger_auto_validate_alerts_on_order_confirmed ON purchase_orders;

CREATE TRIGGER trigger_auto_validate_alerts_on_order_confirmed
  AFTER UPDATE OF status ON purchase_orders
  FOR EACH ROW
  WHEN (
    OLD.status = 'draft'
    AND NEW.status IN ('confirmed', 'sent', 'received')  -- ✅ STRICTEMENT ces 3 status
  )
  EXECUTE FUNCTION auto_validate_alerts_on_order_confirmed();

COMMENT ON TRIGGER trigger_auto_validate_alerts_on_order_confirmed ON purchase_orders IS
'TRIGGER 4 (v2 - Strict): Valide alertes stock UNIQUEMENT si commande passe de draft → confirmed/sent/received.
Workflow: draft → confirmed/sent/received → Card VERTE
NOTE: draft → cancelled est géré par TRIGGER 6 (Migration 113)';

-- =============================================================================
-- Vérification
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 114 COMPLÉTÉE - TRIGGER 4 STRICT';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 CORRECTION EFFECTUÉE:';
    RAISE NOTICE '   Trigger: trigger_auto_validate_alerts_on_order_confirmed';
    RAISE NOTICE '   AVANT: WHEN (OLD.status = ''draft'' AND NEW.status != ''draft'')';
    RAISE NOTICE '   APRÈS: WHEN (OLD.status = ''draft'' AND NEW.status IN (''confirmed'', ''sent'', ''received''))';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 WORKFLOWS:';
    RAISE NOTICE '   draft → confirmed/sent/received → TRIGGER 4 → Card VERTE ✅';
    RAISE NOTICE '   draft → cancelled               → TRIGGER 6 → Card ROUGE ✅';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPACT:';
    RAISE NOTICE '   - Commandes annulées NE valident PLUS les alertes';
    RAISE NOTICE '   - Workflow annulation géré par TRIGGER 6 (Migration 113)';
    RAISE NOTICE '   - Validation stricte = sécurité renforcée';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
