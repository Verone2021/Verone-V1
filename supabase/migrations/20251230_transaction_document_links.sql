-- Migration: Rapprochement Multi-Docs
-- Date: 2025-12-30
-- SLICE 4: Table de liaison transaction <-> documents (many-to-many)
--
-- Objectif: Permettre le rapprochement d'une transaction bancaire
-- avec plusieurs documents (factures, avoirs, commandes).
-- Use cases:
--   - 1 paiement groupé → plusieurs factures
--   - 1 facture → plusieurs paiements partiels
--   - 1 transaction → document + commande

-- =====================================================
-- 1. TABLE: transaction_document_links
-- =====================================================

CREATE TABLE IF NOT EXISTS transaction_document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- FK vers bank_transactions
  transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,

  -- FK vers financial_documents (nullable si lié à une commande)
  document_id UUID REFERENCES financial_documents(id) ON DELETE CASCADE,

  -- FK vers sales_orders (nullable si lié à un document)
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,

  -- FK vers purchase_orders (nullable si lié à un document)
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,

  -- Type de lien
  link_type VARCHAR(50) NOT NULL DEFAULT 'document' CHECK (link_type IN (
    'document',       -- Lié à un financial_document
    'sales_order',    -- Lié à une commande client
    'purchase_order', -- Lié à une commande fournisseur
    'partial'         -- Paiement partiel
  )),

  -- Montant alloué pour ce lien (utile pour paiements partiels)
  allocated_amount DECIMAL(15,2),

  -- Notes/commentaires
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte: au moins un des FK doit être renseigné
  CONSTRAINT chk_at_least_one_link CHECK (
    document_id IS NOT NULL OR
    sales_order_id IS NOT NULL OR
    purchase_order_id IS NOT NULL
  ),

  -- Contrainte: unicité du lien
  CONSTRAINT uq_transaction_document UNIQUE (transaction_id, document_id),
  CONSTRAINT uq_transaction_sales_order UNIQUE (transaction_id, sales_order_id),
  CONSTRAINT uq_transaction_purchase_order UNIQUE (transaction_id, purchase_order_id)
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_tdl_transaction ON transaction_document_links(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tdl_document ON transaction_document_links(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tdl_sales_order ON transaction_document_links(sales_order_id) WHERE sales_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tdl_purchase_order ON transaction_document_links(purchase_order_id) WHERE purchase_order_id IS NOT NULL;

-- =====================================================
-- 2. RLS POLICIES
-- =====================================================

ALTER TABLE transaction_document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transaction_document_links_select" ON transaction_document_links
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "transaction_document_links_insert" ON transaction_document_links
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "transaction_document_links_update" ON transaction_document_links
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "transaction_document_links_delete" ON transaction_document_links
  FOR DELETE TO authenticated USING (true);

-- =====================================================
-- 3. TRIGGER updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_transaction_document_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transaction_document_links_updated_at
  BEFORE UPDATE ON transaction_document_links
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_document_links_updated_at();

-- =====================================================
-- 4. MIGRATION DES DONNÉES EXISTANTES
-- =====================================================

-- Migrer les rapprochements existants (matched_document_id)
INSERT INTO transaction_document_links (transaction_id, document_id, link_type, allocated_amount, notes)
SELECT
  id AS transaction_id,
  matched_document_id AS document_id,
  'document' AS link_type,
  ABS(amount) AS allocated_amount,
  'Migration automatique depuis matched_document_id' AS notes
FROM bank_transactions
WHERE matched_document_id IS NOT NULL
ON CONFLICT (transaction_id, document_id) DO NOTHING;

-- =====================================================
-- 5. VUE: v_transaction_documents
-- =====================================================

CREATE OR REPLACE VIEW v_transaction_documents AS
SELECT
  tdl.id AS link_id,
  tdl.transaction_id,
  tdl.document_id,
  tdl.sales_order_id,
  tdl.purchase_order_id,
  tdl.link_type,
  tdl.allocated_amount,
  tdl.notes,
  tdl.created_at,

  -- Transaction info
  bt.label AS transaction_label,
  bt.amount AS transaction_amount,
  bt.emitted_at AS transaction_date,
  bt.side AS transaction_side,

  -- Document info (si lié)
  fd.document_type,
  fd.document_number,
  fd.total_ttc AS document_amount,
  fd.document_date,
  fd.status AS document_status,

  -- Organisation du document
  org.legal_name AS organisation_name,

  -- Sales order info (si lié)
  so.order_number AS sales_order_number,
  so.total_ht AS sales_order_amount,
  so.status AS sales_order_status,

  -- Purchase order info (si lié)
  po.order_number AS purchase_order_number,
  po.total_amount_ht AS purchase_order_amount,
  po.status AS purchase_order_status

FROM transaction_document_links tdl
JOIN bank_transactions bt ON tdl.transaction_id = bt.id
LEFT JOIN financial_documents fd ON tdl.document_id = fd.id
LEFT JOIN organisations org ON fd.partner_id = org.id
LEFT JOIN sales_orders so ON tdl.sales_order_id = so.id
LEFT JOIN purchase_orders po ON tdl.purchase_order_id = po.id;

GRANT SELECT ON v_transaction_documents TO authenticated;

-- =====================================================
-- 6. RPC: link_transaction_to_document
-- =====================================================

CREATE OR REPLACE FUNCTION link_transaction_to_document(
  p_transaction_id UUID,
  p_document_id UUID DEFAULT NULL,
  p_sales_order_id UUID DEFAULT NULL,
  p_purchase_order_id UUID DEFAULT NULL,
  p_allocated_amount DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_link_type VARCHAR(50);
  v_link_id UUID;
  v_amount DECIMAL;
BEGIN
  -- Déterminer le type de lien
  IF p_document_id IS NOT NULL THEN
    v_link_type := 'document';
  ELSIF p_sales_order_id IS NOT NULL THEN
    v_link_type := 'sales_order';
  ELSIF p_purchase_order_id IS NOT NULL THEN
    v_link_type := 'purchase_order';
  ELSE
    RAISE EXCEPTION 'Au moins un ID cible doit être fourni';
  END IF;

  -- Si pas de montant alloué, utiliser le montant de la transaction
  IF p_allocated_amount IS NULL THEN
    SELECT ABS(amount) INTO v_amount FROM bank_transactions WHERE id = p_transaction_id;
  ELSE
    v_amount := p_allocated_amount;
  END IF;

  -- Insérer le lien
  INSERT INTO transaction_document_links (
    transaction_id,
    document_id,
    sales_order_id,
    purchase_order_id,
    link_type,
    allocated_amount,
    notes
  ) VALUES (
    p_transaction_id,
    p_document_id,
    p_sales_order_id,
    p_purchase_order_id,
    v_link_type,
    v_amount,
    p_notes
  )
  ON CONFLICT (transaction_id, document_id) DO UPDATE SET
    allocated_amount = EXCLUDED.allocated_amount,
    notes = COALESCE(EXCLUDED.notes, transaction_document_links.notes),
    updated_at = NOW()
  RETURNING id INTO v_link_id;

  -- Mettre à jour le statut de la transaction
  UPDATE bank_transactions
  SET
    matching_status = 'manual_matched',
    matched_document_id = COALESCE(p_document_id, matched_document_id),
    updated_at = NOW()
  WHERE id = p_transaction_id;

  -- Si lié à un document, mettre à jour amount_paid
  IF p_document_id IS NOT NULL THEN
    UPDATE financial_documents
    SET
      amount_paid = COALESCE(amount_paid, 0) + v_amount,
      status = CASE
        WHEN COALESCE(amount_paid, 0) + v_amount >= total_ttc THEN 'paid'
        WHEN COALESCE(amount_paid, 0) + v_amount > 0 THEN 'partially_paid'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = p_document_id;
  END IF;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. RPC: unlink_transaction_document
-- =====================================================

CREATE OR REPLACE FUNCTION unlink_transaction_document(p_link_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_link RECORD;
BEGIN
  -- Récupérer les infos du lien
  SELECT * INTO v_link FROM transaction_document_links WHERE id = p_link_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Si lié à un document, décrémenter amount_paid
  IF v_link.document_id IS NOT NULL AND v_link.allocated_amount IS NOT NULL THEN
    UPDATE financial_documents
    SET
      amount_paid = GREATEST(0, COALESCE(amount_paid, 0) - v_link.allocated_amount),
      status = CASE
        WHEN GREATEST(0, COALESCE(amount_paid, 0) - v_link.allocated_amount) = 0 THEN 'sent'
        WHEN GREATEST(0, COALESCE(amount_paid, 0) - v_link.allocated_amount) < total_ttc THEN 'partially_paid'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = v_link.document_id;
  END IF;

  -- Supprimer le lien
  DELETE FROM transaction_document_links WHERE id = p_link_id;

  -- Si plus de liens, reset matching_status
  IF NOT EXISTS (SELECT 1 FROM transaction_document_links WHERE transaction_id = v_link.transaction_id) THEN
    UPDATE bank_transactions
    SET
      matching_status = 'unmatched',
      matched_document_id = NULL,
      updated_at = NOW()
    WHERE id = v_link.transaction_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. RPC: get_transaction_links
-- =====================================================

CREATE OR REPLACE FUNCTION get_transaction_links(p_transaction_id UUID)
RETURNS TABLE (
  link_id UUID,
  link_type VARCHAR(50),
  document_id UUID,
  document_number VARCHAR(100),
  document_amount DECIMAL,
  sales_order_id UUID,
  sales_order_number VARCHAR(50),
  purchase_order_id UUID,
  purchase_order_number VARCHAR(50),
  allocated_amount DECIMAL,
  organisation_name VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tdl.id AS link_id,
    tdl.link_type,
    tdl.document_id,
    fd.document_number,
    fd.total_ttc AS document_amount,
    tdl.sales_order_id,
    so.order_number AS sales_order_number,
    tdl.purchase_order_id,
    po.order_number AS purchase_order_number,
    tdl.allocated_amount,
    org.legal_name AS organisation_name
  FROM transaction_document_links tdl
  LEFT JOIN financial_documents fd ON tdl.document_id = fd.id
  LEFT JOIN organisations org ON fd.partner_id = org.id
  LEFT JOIN sales_orders so ON tdl.sales_order_id = so.id
  LEFT JOIN purchase_orders po ON tdl.purchase_order_id = po.id
  WHERE tdl.transaction_id = p_transaction_id
  ORDER BY tdl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE transaction_document_links IS 'Table de liaison many-to-many entre transactions bancaires et documents/commandes';
COMMENT ON COLUMN transaction_document_links.link_type IS 'Type de lien: document, sales_order, purchase_order, partial';
COMMENT ON COLUMN transaction_document_links.allocated_amount IS 'Montant alloué pour ce lien (utile pour paiements partiels)';

COMMENT ON FUNCTION link_transaction_to_document IS 'Crée ou met à jour un lien entre une transaction et un document/commande';
COMMENT ON FUNCTION unlink_transaction_document IS 'Supprime un lien et met à jour les montants associés';
COMMENT ON FUNCTION get_transaction_links IS 'Récupère tous les liens d''une transaction';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
