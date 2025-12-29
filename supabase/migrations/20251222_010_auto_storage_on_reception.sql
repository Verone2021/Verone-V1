-- =====================================================
-- MIGRATION: Auto-creation stockage sur reception affilie
-- Date: 2025-12-22
-- Description:
--   - Modifie le trigger de reception pour creer/mettre a jour
--     une entree dans storage_allocations
--   - Corrige les donnees existantes (receptions deja faites)
-- =====================================================

-- =====================================================
-- PARTIE 1: Modifier le trigger pour auto-creer stockage
-- =====================================================

CREATE OR REPLACE FUNCTION create_stock_on_affiliate_reception_confirm()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_before INTEGER;
  v_stock_after INTEGER;
  v_enseigne_id UUID;
  v_org_id UUID;
BEGIN
  -- Uniquement pour les receptions affilies passant a completed/partial
  IF NEW.reference_type = 'affiliate_product'
     AND OLD.status = 'pending'
     AND NEW.status IN ('completed', 'partial')
     AND COALESCE(NEW.quantity_received, 0) > 0 THEN

    -- Recuperer stock actuel
    SELECT COALESCE(stock_real, 0) INTO v_stock_before
    FROM products WHERE id = NEW.product_id;

    v_stock_after := v_stock_before + NEW.quantity_received;

    -- Creer mouvement de stock IN
    INSERT INTO stock_movements (
      product_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reference_type,
      reference_id,
      notes,
      reason_code,
      performed_by
    ) VALUES (
      NEW.product_id,
      'IN',
      NEW.quantity_received,
      v_stock_before,
      v_stock_after,
      'reception',
      NEW.id,
      'Reception produit affilie - ' || COALESCE(NEW.notes, 'Stock recu'),
      'affiliate_reception',
      NEW.received_by
    );

    -- Mettre a jour stock_real et stock_forecasted_in du produit
    UPDATE products
    SET stock_real = v_stock_after,
        stock_forecasted_in = GREATEST(0, COALESCE(stock_forecasted_in, 0) - NEW.quantity_received),
        updated_at = NOW()
    WHERE id = NEW.product_id;

    -- =====================================================
    -- NOUVEAU: Auto-creer/mettre a jour stockage
    -- =====================================================

    -- Recuperer l'enseigne/org de l'affilie
    SELECT la.enseigne_id, la.organisation_id
    INTO v_enseigne_id, v_org_id
    FROM linkme_affiliates la
    WHERE la.id = NEW.affiliate_id;

    -- Si on a trouve l'affilie, creer/mettre a jour l'allocation
    IF v_enseigne_id IS NOT NULL OR v_org_id IS NOT NULL THEN
      INSERT INTO storage_allocations (
        product_id,
        owner_enseigne_id,
        owner_organisation_id,
        stock_quantity,
        billable_in_storage
      ) VALUES (
        NEW.product_id,
        v_enseigne_id,
        v_org_id,
        NEW.quantity_received,
        true
      )
      ON CONFLICT ON CONSTRAINT storage_allocations_pkey DO NOTHING;

      -- Si le conflit etait sur la contrainte unique, faire un UPDATE
      -- Note: On utilise une approche differente car la contrainte unique
      -- est sur un index fonctionnel
      UPDATE storage_allocations
      SET stock_quantity = stock_quantity + NEW.quantity_received,
          updated_at = NOW()
      WHERE product_id = NEW.product_id
        AND (
          (owner_enseigne_id = v_enseigne_id AND v_enseigne_id IS NOT NULL) OR
          (owner_organisation_id = v_org_id AND v_org_id IS NOT NULL)
        );

      -- Si aucune ligne n'a ete mise a jour, c'est qu'on doit inserer
      IF NOT FOUND THEN
        INSERT INTO storage_allocations (
          product_id,
          owner_enseigne_id,
          owner_organisation_id,
          stock_quantity,
          billable_in_storage
        ) VALUES (
          NEW.product_id,
          v_enseigne_id,
          v_org_id,
          NEW.quantity_received,
          true
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    -- Marquer date de reception
    NEW.received_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreer le trigger
DROP TRIGGER IF EXISTS trigger_stock_on_affiliate_reception ON purchase_order_receptions;
CREATE TRIGGER trigger_stock_on_affiliate_reception
  BEFORE UPDATE ON purchase_order_receptions
  FOR EACH ROW
  WHEN (NEW.reference_type = 'affiliate_product')
  EXECUTE FUNCTION create_stock_on_affiliate_reception_confirm();

-- =====================================================
-- PARTIE 2: Corriger donnees existantes
-- =====================================================

-- Creer les allocations manquantes pour les receptions deja completees
INSERT INTO storage_allocations (
  product_id,
  owner_enseigne_id,
  owner_organisation_id,
  stock_quantity,
  billable_in_storage,
  allocated_at
)
SELECT
  por.product_id,
  la.enseigne_id,
  la.organisation_id,
  SUM(COALESCE(por.quantity_received, 0))::INTEGER,
  true,
  MIN(por.received_at)
FROM purchase_order_receptions por
JOIN linkme_affiliates la ON la.id = por.affiliate_id
WHERE por.reference_type = 'affiliate_product'
  AND por.status IN ('completed', 'partial')
  AND COALESCE(por.quantity_received, 0) > 0
  AND por.affiliate_id IS NOT NULL
  -- Exclure celles qui existent deja
  AND NOT EXISTS (
    SELECT 1 FROM storage_allocations sa
    WHERE sa.product_id = por.product_id
      AND (
        (sa.owner_enseigne_id = la.enseigne_id AND la.enseigne_id IS NOT NULL) OR
        (sa.owner_organisation_id = la.organisation_id AND la.organisation_id IS NOT NULL)
      )
  )
GROUP BY por.product_id, la.enseigne_id, la.organisation_id;

-- =====================================================
-- PARTIE 3: Commentaires
-- =====================================================

COMMENT ON FUNCTION create_stock_on_affiliate_reception_confirm IS
'Trigger function qui:
1. Cree un mouvement de stock (IN) lors de la reception
2. Met a jour stock_real du produit
3. Decremente stock_forecasted_in
4. NOUVEAU: Cree/met a jour une allocation dans storage_allocations
   pour que le produit apparaisse dans la page de stockage';

-- =====================================================
-- FIN MIGRATION
-- =====================================================
