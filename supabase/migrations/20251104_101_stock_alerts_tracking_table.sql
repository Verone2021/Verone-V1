-- Migration: Création table stock_alert_tracking pour tracking automatique des alertes stock
-- Date: 2025-11-04
-- Description: Table de persistence des alertes stock avec tracking commandes brouillon

-- =============================================
-- 1. TABLE PRINCIPALE
-- =============================================

CREATE TABLE IF NOT EXISTS stock_alert_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  -- État alerte
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'no_stock_but_ordered')),
  alert_priority INTEGER NOT NULL CHECK (alert_priority BETWEEN 1 AND 3),

  -- Stock info (snapshot à date création/MAJ alerte)
  stock_real INTEGER NOT NULL DEFAULT 0,
  stock_forecasted_out INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  shortage_quantity INTEGER NOT NULL DEFAULT 0,

  -- Tracking commandes brouillon
  draft_order_id uuid NULL REFERENCES purchase_orders(id) ON DELETE SET NULL,
  quantity_in_draft INTEGER NULL DEFAULT 0,
  added_to_draft_at TIMESTAMPTZ NULL,

  -- Validation alerte (automatique quand commande confirmée)
  validated BOOLEAN NOT NULL DEFAULT false,
  validated_at TIMESTAMPTZ NULL,
  validated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contraintes business
  CONSTRAINT unique_product_alert UNIQUE(product_id),
  CONSTRAINT draft_consistency CHECK (
    (draft_order_id IS NULL AND quantity_in_draft = 0 AND added_to_draft_at IS NULL)
    OR
    (draft_order_id IS NOT NULL AND quantity_in_draft > 0 AND added_to_draft_at IS NOT NULL)
  )
);

-- =============================================
-- 2. INDEX POUR PERFORMANCES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_stock_alert_tracking_supplier
  ON stock_alert_tracking(supplier_id);

CREATE INDEX IF NOT EXISTS idx_stock_alert_tracking_draft_order
  ON stock_alert_tracking(draft_order_id)
  WHERE draft_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_alert_tracking_validated
  ON stock_alert_tracking(validated)
  WHERE validated = false;

CREATE INDEX IF NOT EXISTS idx_stock_alert_tracking_product
  ON stock_alert_tracking(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_alert_tracking_alert_type
  ON stock_alert_tracking(alert_type);

CREATE INDEX IF NOT EXISTS idx_stock_alert_tracking_priority
  ON stock_alert_tracking(alert_priority DESC);

-- =============================================
-- 3. TRIGGER UPDATED_AT
-- =============================================

CREATE TRIGGER trigger_stock_alert_tracking_updated_at
  BEFORE UPDATE ON stock_alert_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. RLS POLICIES
-- =============================================

ALTER TABLE stock_alert_tracking ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Tous les users authentifiés
CREATE POLICY "stock_alert_tracking_select_policy"
  ON stock_alert_tracking
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy INSERT: Système uniquement (via triggers)
CREATE POLICY "stock_alert_tracking_insert_policy"
  ON stock_alert_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy UPDATE: Système uniquement (via triggers)
CREATE POLICY "stock_alert_tracking_update_policy"
  ON stock_alert_tracking
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy DELETE: Système uniquement (via triggers)
CREATE POLICY "stock_alert_tracking_delete_policy"
  ON stock_alert_tracking
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- 5. COMMENTAIRES DOCUMENTATION
-- =============================================

COMMENT ON TABLE stock_alert_tracking IS
'Table de tracking des alertes stock avec synchronisation automatique des commandes brouillon.
Maintenue à jour par triggers sur products et purchase_order_items.';

COMMENT ON COLUMN stock_alert_tracking.alert_type IS
'Type alerte: low_stock (stock < min), out_of_stock (stock = 0), no_stock_but_ordered (stock = 0 mais commandes en cours)';

COMMENT ON COLUMN stock_alert_tracking.alert_priority IS
'Priorité: 3 = Critique (out_of_stock, no_stock_but_ordered), 2 = Warning (low_stock), 1 = Info';

COMMENT ON COLUMN stock_alert_tracking.draft_order_id IS
'ID commande fournisseur brouillon contenant ce produit. NULL si pas dans brouillon.';

COMMENT ON COLUMN stock_alert_tracking.quantity_in_draft IS
'Quantité totale commandée dans les brouillons pour ce produit. Permet de désactiver bouton "Commander".';

COMMENT ON COLUMN stock_alert_tracking.validated IS
'Alerte validée automatiquement quand commande brouillon confirmée (via trigger auto_validate_alerts_on_order_confirmed)';
