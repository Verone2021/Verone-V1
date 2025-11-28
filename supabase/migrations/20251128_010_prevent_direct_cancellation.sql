-- ============================================================================
-- Migration: Bloquer Annulation Directe des Commandes Validées
-- Date: 2025-11-28
-- Description: Empêcher la transition directe validated → cancelled
--              Les commandes doivent être dévalidées (→ draft) avant annulation
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : PURCHASE ORDERS (Commandes Fournisseurs)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_po_direct_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- ❌ Bloquer validated → cancelled (doit passer par draft d'abord)
  IF OLD.status = 'validated' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande fournisseur validée. Veuillez d''abord la dévalider (remettre en brouillon).';
  END IF;

  -- ❌ Bloquer partially_received → cancelled (utiliser "Annuler reliquat")
  IF OLD.status = 'partially_received' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande partiellement reçue. Utilisez "Annuler reliquat" pour annuler les quantités restantes.';
  END IF;

  -- ❌ Bloquer received → cancelled (commande terminée)
  IF OLD.status = 'received' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande entièrement reçue.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger BEFORE UPDATE pour bloquer en amont
DROP TRIGGER IF EXISTS trigger_prevent_po_direct_cancellation ON purchase_orders;
CREATE TRIGGER trigger_prevent_po_direct_cancellation
  BEFORE UPDATE OF status ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION prevent_po_direct_cancellation();

COMMENT ON FUNCTION prevent_po_direct_cancellation() IS
'Bloque les transitions invalides de statut PO:
- validated → cancelled (doit passer par draft)
- partially_received → cancelled (utiliser annuler reliquat)
- received → cancelled (impossible)
Migration: 20251128_010';


-- ============================================================================
-- PARTIE 2 : SALES ORDERS (Commandes Clients)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_so_direct_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- ❌ Bloquer validated → cancelled (doit passer par draft d'abord)
  IF OLD.status = 'validated' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande client validée. Veuillez d''abord la dévalider (remettre en brouillon).';
  END IF;

  -- ❌ Bloquer partially_shipped → cancelled
  IF OLD.status = 'partially_shipped' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande partiellement expédiée.';
  END IF;

  -- ❌ Bloquer shipped → cancelled (commande expédiée)
  IF OLD.status = 'shipped' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande expédiée.';
  END IF;

  -- ❌ Bloquer delivered → cancelled (commande livrée)
  IF OLD.status = 'delivered' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande livrée.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger BEFORE UPDATE pour bloquer en amont
DROP TRIGGER IF EXISTS trigger_prevent_so_direct_cancellation ON sales_orders;
CREATE TRIGGER trigger_prevent_so_direct_cancellation
  BEFORE UPDATE OF status ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION prevent_so_direct_cancellation();

COMMENT ON FUNCTION prevent_so_direct_cancellation() IS
'Bloque les transitions invalides de statut SO:
- validated → cancelled (doit passer par draft)
- partially_shipped/shipped/delivered → cancelled (impossible)
Migration: 20251128_010';


-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  v_po_trigger_exists BOOLEAN;
  v_so_trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'trigger_prevent_po_direct_cancellation'
    AND c.relname = 'purchase_orders'
  ) INTO v_po_trigger_exists;

  SELECT EXISTS(
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'trigger_prevent_so_direct_cancellation'
    AND c.relname = 'sales_orders'
  ) INTO v_so_trigger_exists;

  RAISE NOTICE '✅ Trigger PO prevent_direct_cancellation: %',
    CASE WHEN v_po_trigger_exists THEN 'CRÉÉ' ELSE 'ÉCHEC' END;
  RAISE NOTICE '✅ Trigger SO prevent_direct_cancellation: %',
    CASE WHEN v_so_trigger_exists THEN 'CRÉÉ' ELSE 'ÉCHEC' END;
END $$;

