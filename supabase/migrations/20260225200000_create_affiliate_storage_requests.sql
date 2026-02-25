-- =====================================================
-- MIGRATION: Workflow demande d'envoi stock affilie
-- Date: 2026-02-25
-- Description:
--   - Table affiliate_storage_requests
--   - RPCs: approve/reject/cancel + count
--   - RLS: staff full access + affilie propres demandes
-- =====================================================

-- =====================================================
-- PARTIE 1: Table affiliate_storage_requests
-- =====================================================

CREATE TABLE affiliate_storage_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES linkme_affiliates(id) ON DELETE CASCADE,
  owner_enseigne_id UUID REFERENCES enseignes(id),
  owner_organisation_id UUID REFERENCES organisations(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'reception_created')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  reception_id UUID REFERENCES purchase_order_receptions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_storage_request_owner_xor CHECK (
    (owner_enseigne_id IS NOT NULL AND owner_organisation_id IS NULL) OR
    (owner_enseigne_id IS NULL AND owner_organisation_id IS NOT NULL)
  )
);

-- Index pour les requetes frequentes
CREATE INDEX idx_storage_requests_status ON affiliate_storage_requests (status)
  WHERE status = 'pending';
CREATE INDEX idx_storage_requests_affiliate ON affiliate_storage_requests (affiliate_id);
CREATE INDEX idx_storage_requests_product ON affiliate_storage_requests (product_id);

-- Unique partiel: 1 seule demande pending par produit+affilie
CREATE UNIQUE INDEX idx_storage_requests_unique_pending
  ON affiliate_storage_requests (product_id, affiliate_id)
  WHERE status = 'pending';

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_storage_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_storage_request_updated_at
  BEFORE UPDATE ON affiliate_storage_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_request_updated_at();

-- =====================================================
-- PARTIE 2: RLS
-- =====================================================

ALTER TABLE affiliate_storage_requests ENABLE ROW LEVEL SECURITY;

-- Staff back-office: acces complet
CREATE POLICY "staff_full_access" ON affiliate_storage_requests
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Affilie: lecture de ses propres demandes
CREATE POLICY "affiliate_read_own" ON affiliate_storage_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      JOIN linkme_affiliates la ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR
        (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND la.id = affiliate_storage_requests.affiliate_id
    )
  );

-- Affilie: insertion de ses propres demandes
CREATE POLICY "affiliate_insert_own" ON affiliate_storage_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      JOIN linkme_affiliates la ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR
        (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND la.id = affiliate_storage_requests.affiliate_id
    )
  );

-- Affilie: mise a jour uniquement pour annuler ses propres demandes pending
CREATE POLICY "affiliate_cancel_own" ON affiliate_storage_requests
  FOR UPDATE TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM user_app_roles uar
      JOIN linkme_affiliates la ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR
        (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND la.id = affiliate_storage_requests.affiliate_id
    )
  );

-- =====================================================
-- PARTIE 3: RPC approve_storage_request
-- =====================================================

CREATE OR REPLACE FUNCTION approve_storage_request(p_request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_reception_id UUID;
  v_enseigne_id UUID;
  v_org_id UUID;
BEGIN
  -- Verifier que l'utilisateur est staff back-office
  IF NOT is_backoffice_user() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: back-office staff only');
  END IF;

  -- Recuperer la demande
  SELECT * INTO v_request
  FROM affiliate_storage_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Request is not pending (current: ' || v_request.status || ')');
  END IF;

  -- Recuperer enseigne/org de l'affilie
  SELECT la.enseigne_id, la.organisation_id
  INTO v_enseigne_id, v_org_id
  FROM linkme_affiliates la
  WHERE la.id = v_request.affiliate_id;

  -- Creer la reception pending
  INSERT INTO purchase_order_receptions (
    product_id,
    affiliate_id,
    reference_type,
    status,
    quantity_expected,
    quantity_received,
    notes,
    received_by
  ) VALUES (
    v_request.product_id,
    v_request.affiliate_id,
    'affiliate_product',
    'pending',
    v_request.quantity,
    0,
    'Demande envoi stock #' || v_request.id::TEXT || ' - ' || COALESCE(v_request.notes, ''),
    (SELECT auth.uid())
  )
  RETURNING id INTO v_reception_id;

  -- Incrementer stock_forecasted_in
  UPDATE products
  SET stock_forecasted_in = COALESCE(stock_forecasted_in, 0) + v_request.quantity,
      updated_at = NOW()
  WHERE id = v_request.product_id;

  -- Mettre a jour la demande
  UPDATE affiliate_storage_requests
  SET status = 'reception_created',
      reception_id = v_reception_id,
      reviewed_by = (SELECT auth.uid()),
      reviewed_at = NOW()
  WHERE id = p_request_id;

  RETURN json_build_object(
    'success', true,
    'reception_id', v_reception_id,
    'request_id', p_request_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION approve_storage_request(UUID) TO authenticated;

-- =====================================================
-- PARTIE 4: RPC reject_storage_request
-- =====================================================

CREATE OR REPLACE FUNCTION reject_storage_request(p_request_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Verifier que l'utilisateur est staff back-office
  IF NOT is_backoffice_user() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: back-office staff only');
  END IF;

  -- Recuperer la demande
  SELECT * INTO v_request
  FROM affiliate_storage_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Request is not pending (current: ' || v_request.status || ')');
  END IF;

  -- Mettre a jour la demande
  UPDATE affiliate_storage_requests
  SET status = 'rejected',
      rejection_reason = p_reason,
      reviewed_by = (SELECT auth.uid()),
      reviewed_at = NOW()
  WHERE id = p_request_id;

  RETURN json_build_object('success', true, 'request_id', p_request_id);
END;
$$;

GRANT EXECUTE ON FUNCTION reject_storage_request(UUID, TEXT) TO authenticated;

-- =====================================================
-- PARTIE 5: RPC get_pending_storage_requests_count
-- =====================================================

CREATE OR REPLACE FUNCTION get_pending_storage_requests_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM affiliate_storage_requests
  WHERE status = 'pending';
$$;

GRANT EXECUTE ON FUNCTION get_pending_storage_requests_count() TO authenticated;

-- =====================================================
-- PARTIE 6: Commentaires
-- =====================================================

COMMENT ON TABLE affiliate_storage_requests IS
'Demandes d''envoi de stock par les affilies LinkMe vers l''entrepot Verone.
Workflow: pending → approved/rejected/cancelled → reception_created (si approuve)';

COMMENT ON FUNCTION approve_storage_request IS
'Approuve une demande d''envoi stock:
1. Cree une purchase_order_reception pending
2. Incremente stock_forecasted_in du produit
3. Met a jour la demande avec reception_id';

COMMENT ON FUNCTION reject_storage_request IS
'Rejette une demande d''envoi stock avec raison optionnelle';

COMMENT ON FUNCTION get_pending_storage_requests_count IS
'Retourne le nombre de demandes d''envoi stock en attente (pour badge sidebar)';

-- =====================================================
-- FIN MIGRATION
-- =====================================================
