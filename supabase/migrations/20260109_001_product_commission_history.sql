-- =====================================================
-- Migration: Product Commission History (Audit Trail)
-- Date: 2026-01-09
-- Description: Table et trigger pour auditer les modifications
--              de commission sur les produits affilies
-- =====================================================

-- 1. Creer la table d'historique
CREATE TABLE IF NOT EXISTS product_commission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Anciennes valeurs
  old_commission_rate NUMERIC(5,2),
  old_payout_ht NUMERIC(10,2),

  -- Nouvelles valeurs
  new_commission_rate NUMERIC(5,2),
  new_payout_ht NUMERIC(10,2),

  -- Metadata
  change_reason TEXT,
  modified_by UUID REFERENCES auth.users(id),
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Context
  change_type TEXT NOT NULL CHECK (change_type IN ('approval', 'update', 'system'))
);

-- 2. Index pour les requetes frequentes
CREATE INDEX IF NOT EXISTS idx_product_commission_history_product
  ON product_commission_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_commission_history_modified_at
  ON product_commission_history(modified_at DESC);

-- 3. RLS Policies
ALTER TABLE product_commission_history ENABLE ROW LEVEL SECURITY;

-- Lecture: admins uniquement
CREATE POLICY "product_commission_history_select_admin"
  ON product_commission_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles
      WHERE user_id = auth.uid()
        AND app = 'back-office'
        AND role IN ('admin', 'super_admin')
        AND is_active = true
    )
  );

-- Insertion: via trigger ou admin
CREATE POLICY "product_commission_history_insert_admin"
  ON product_commission_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_app_roles
      WHERE user_id = auth.uid()
        AND app = 'back-office'
        AND role IN ('admin', 'super_admin')
        AND is_active = true
    )
  );

-- 4. Fonction trigger pour logger les modifications
CREATE OR REPLACE FUNCTION log_product_commission_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne logger que si les valeurs de commission ont change
  IF (OLD.affiliate_commission_rate IS DISTINCT FROM NEW.affiliate_commission_rate)
     OR (OLD.affiliate_payout_ht IS DISTINCT FROM NEW.affiliate_payout_ht) THEN

    INSERT INTO product_commission_history (
      product_id,
      old_commission_rate,
      new_commission_rate,
      old_payout_ht,
      new_payout_ht,
      modified_by,
      change_type,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.affiliate_commission_rate,
      NEW.affiliate_commission_rate,
      OLD.affiliate_payout_ht,
      NEW.affiliate_payout_ht,
      auth.uid(),
      CASE
        WHEN OLD.affiliate_approval_status = 'pending_approval'
             AND NEW.affiliate_approval_status = 'approved' THEN 'approval'
        ELSE 'update'
      END,
      NULL -- Peut etre rempli manuellement via RPC
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Creer le trigger
DROP TRIGGER IF EXISTS trg_log_product_commission_change ON products;

CREATE TRIGGER trg_log_product_commission_change
  AFTER UPDATE OF affiliate_commission_rate, affiliate_payout_ht
  ON products
  FOR EACH ROW
  WHEN (OLD.created_by_affiliate IS NOT NULL)
  EXECUTE FUNCTION log_product_commission_change();

-- 6. Commentaires
COMMENT ON TABLE product_commission_history IS
  'Audit trail des modifications de commission sur les produits affilies';
COMMENT ON COLUMN product_commission_history.change_type IS
  'approval = lors de l approbation initiale, update = modification ulterieure, system = correction automatique';

-- =====================================================
-- Verification
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Table product_commission_history creee avec succes';
  RAISE NOTICE 'Trigger trg_log_product_commission_change actif';
END $$;
