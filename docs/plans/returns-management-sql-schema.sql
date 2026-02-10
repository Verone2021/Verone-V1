-- ============================================================================
-- RETURNS MANAGEMENT - Complete SQL Schema
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-02-10
-- Description: SQL complet pour gestion retours & avoirs (Option B)
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Table: returns (RMA - Return Merchandise Authorization)
CREATE TABLE returns (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE NOT NULL, -- Format: RET-YYYY-NNNN

  -- Référence commande/facture origine
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,
  invoice_id UUID REFERENCES financial_documents(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,

  -- Workflow & Status
  status TEXT NOT NULL CHECK (status IN (
    'requested', 'approved', 'rejected', 'received', 'inspected', 'completed', 'cancelled'
  )) DEFAULT 'requested',

  -- Motif retour
  return_reason TEXT NOT NULL CHECK (return_reason IN (
    'defective', 'wrong_item', 'not_as_described', 'customer_regret', 'damaged_shipping', 'other'
  )),
  return_reason_details TEXT,

  -- Résultat inspection
  inspection_result TEXT CHECK (inspection_result IN (
    'resellable', 'damaged_repairable', 'damaged_scrap', 'pending'
  )) DEFAULT 'pending',
  inspection_notes TEXT,

  -- Remboursement
  refund_method TEXT CHECK (refund_method IN (
    'credit_note', 'bank_transfer', 'store_credit', 'exchange'
  )) DEFAULT 'credit_note',
  credit_note_id UUID REFERENCES financial_documents(id) ON DELETE SET NULL,

  -- Logistique
  return_shipping_carrier TEXT,
  return_tracking_number TEXT,

  -- Traçabilité (qui, quand)
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ,
  inspected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inspected_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,

  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: return_items (Lignes retour)
CREATE TABLE return_items (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,

  -- Référence produit & ligne commande
  sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Quantités (workflow progressif)
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  quantity_approved INTEGER CHECK (quantity_approved >= 0),
  quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
  quantity_restocked INTEGER DEFAULT 0 CHECK (quantity_restocked >= 0),

  -- État produit à réception
  condition_on_return TEXT CHECK (condition_on_return IN (
    'new', 'good', 'damaged', 'unusable'
  )),
  condition_notes TEXT,

  -- Lien mouvement stock
  stock_movement_id UUID REFERENCES stock_movements(id) ON DELETE SET NULL,

  -- Prix unitaire (pour calcul avoir)
  unit_price_ht NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,4) DEFAULT 0.20,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints métier
  CONSTRAINT check_quantities CHECK (
    quantity_approved IS NULL OR quantity_approved <= quantity_requested
  ),
  CONSTRAINT check_received_approved CHECK (
    quantity_received <= COALESCE(quantity_approved, quantity_requested)
  )
);

-- ============================================================================
-- 2. INDEXES (Performance)
-- ============================================================================

-- Indexes returns
CREATE INDEX idx_returns_sales_order_id ON returns(sales_order_id);
CREATE INDEX idx_returns_customer_id ON returns(customer_id);
CREATE INDEX idx_returns_status ON returns(status);
CREATE INDEX idx_returns_created_at ON returns(created_at);
CREATE INDEX idx_returns_invoice_id ON returns(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX idx_returns_credit_note_id ON returns(credit_note_id) WHERE credit_note_id IS NOT NULL;

-- Indexes return_items
CREATE INDEX idx_return_items_return_id ON return_items(return_id);
CREATE INDEX idx_return_items_product_id ON return_items(product_id);
CREATE INDEX idx_return_items_sales_order_item_id ON return_items(sales_order_item_id);
CREATE INDEX idx_return_items_stock_movement_id ON return_items(stock_movement_id) WHERE stock_movement_id IS NOT NULL;

-- ============================================================================
-- 3. MODIFY EXISTING TABLES
-- ============================================================================

-- Table: financial_documents (Avoirs)
ALTER TABLE financial_documents
  ADD COLUMN related_sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  ADD COLUMN related_invoice_id UUID REFERENCES financial_documents(id) ON DELETE SET NULL,
  ADD COLUMN related_return_id UUID REFERENCES returns(id) ON DELETE SET NULL,
  ADD COLUMN is_credit_note BOOLEAN DEFAULT false,
  ADD COLUMN credit_note_reason TEXT CHECK (credit_note_reason IN (
    'product_return', 'shipping_refund', 'overcharge', 'discount', 'other'
  ));

CREATE INDEX idx_financial_documents_related_sales_order ON financial_documents(related_sales_order_id) WHERE related_sales_order_id IS NOT NULL;
CREATE INDEX idx_financial_documents_related_return ON financial_documents(related_return_id) WHERE related_return_id IS NOT NULL;
CREATE INDEX idx_financial_documents_is_credit_note ON financial_documents(is_credit_note);

-- Table: stock_movements (Statut Stock)
ALTER TABLE stock_movements
  ADD COLUMN stock_status TEXT CHECK (stock_status IN (
    'sellable', 'damaged', 'expired', 'lost', 'quarantine', 'reserved'
  )) DEFAULT 'sellable',
  ADD COLUMN quality_check_notes TEXT;

CREATE INDEX idx_stock_movements_stock_status ON stock_movements(stock_status);

-- Table: sales_order_items (Traçabilité Retours)
ALTER TABLE sales_order_items
  ADD COLUMN returned_quantity INTEGER DEFAULT 0 CHECK (returned_quantity >= 0),
  ADD COLUMN last_return_id UUID REFERENCES returns(id) ON DELETE SET NULL,
  ADD COLUMN last_returned_at TIMESTAMPTZ;

ALTER TABLE sales_order_items
  ADD CONSTRAINT check_returned_quantity_max CHECK (returned_quantity <= quantity);

CREATE INDEX idx_sales_order_items_last_return_id ON sales_order_items(last_return_id) WHERE last_return_id IS NOT NULL;

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- Function: Génération numéro retour RET-YYYY-NNNN
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year TEXT := TO_CHAR(NOW(), 'YYYY');
  seq_name TEXT := 'returns_number_seq_' || year;
  next_num INTEGER;
  return_number TEXT;
BEGIN
  -- Créer séquence si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = seq_name) THEN
    EXECUTE format('CREATE SEQUENCE %I START WITH 1', seq_name);
  END IF;

  EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_num;
  return_number := 'RET-' || year || '-' || LPAD(next_num::TEXT, 4, '0');

  RETURN return_number;
END;
$$;

-- Function: Calcul montant avoir depuis retour
CREATE OR REPLACE FUNCTION calculate_credit_note_amount(p_return_id UUID)
RETURNS TABLE(total_ht NUMERIC, total_ttc NUMERIC, tva_amount NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(ri.quantity_approved * ri.unit_price_ht) AS total_ht,
    SUM(ri.quantity_approved * ri.unit_price_ht * (1 + ri.tax_rate)) AS total_ttc,
    SUM(ri.quantity_approved * ri.unit_price_ht * ri.tax_rate) AS tva_amount
  FROM return_items ri
  WHERE ri.return_id = p_return_id;
END;
$$;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_return_items_updated_at
  BEFORE UPDATE ON return_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Link credit note → return (auto-complete)
CREATE OR REPLACE FUNCTION link_credit_note_to_return()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_credit_note = true AND NEW.related_return_id IS NOT NULL THEN
    UPDATE returns
    SET
      status = 'completed',
      credit_note_id = NEW.id,
      completed_at = NOW(),
      completed_by = NEW.created_by
    WHERE id = NEW.related_return_id
      AND status = 'inspected';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER after_credit_note_created
  AFTER INSERT ON financial_documents
  FOR EACH ROW
  WHEN (NEW.is_credit_note = true AND NEW.related_return_id IS NOT NULL)
  EXECUTE FUNCTION link_credit_note_to_return();

-- Trigger: Update sales_order_items.returned_quantity
CREATE OR REPLACE FUNCTION update_sales_order_item_returned_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quantity_restocked IS DISTINCT FROM OLD.quantity_restocked THEN
    UPDATE sales_order_items
    SET
      returned_quantity = returned_quantity + (NEW.quantity_restocked - COALESCE(OLD.quantity_restocked, 0)),
      last_return_id = NEW.return_id,
      last_returned_at = NOW()
    WHERE id = NEW.sales_order_item_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER after_return_item_restocked
  AFTER UPDATE ON return_items
  FOR EACH ROW
  WHEN (NEW.quantity_restocked IS DISTINCT FROM OLD.quantity_restocked)
  EXECUTE FUNCTION update_sales_order_item_returned_quantity();

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Policy: Staff back-office full access
CREATE POLICY "staff_full_access_returns" ON returns
  FOR ALL TO authenticated
  USING (is_backoffice_user());

CREATE POLICY "staff_full_access_return_items" ON return_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM returns r
      WHERE r.id = return_items.return_id
        AND is_backoffice_user()
    )
  );

-- Policy: Affiliés LinkMe voient leurs retours
CREATE POLICY "affiliate_own_returns" ON returns
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      JOIN sales_orders so ON so.customer_id = uar.organisation_id
      WHERE so.id = returns.sales_order_id
        AND uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE returns IS
  'Return Merchandise Authorization (RMA). ' ||
  'Workflow: requested → approved → received → inspected → completed. ' ||
  'Links to sales_orders (origin), financial_documents (credit note), stock_movements (restock).';

COMMENT ON TABLE return_items IS
  'Line items for returns. ' ||
  'Tracks quantities through workflow: requested → approved → received → restocked. ' ||
  'Links to sales_order_items (origin) and stock_movements (restock operation).';

COMMENT ON COLUMN financial_documents.related_sales_order_id IS
  'Sales order this credit note is related to (for traceability).';

COMMENT ON COLUMN financial_documents.related_return_id IS
  'Return (RMA) this credit note was generated from.';

COMMENT ON COLUMN financial_documents.is_credit_note IS
  'True if this document is a credit note (avoir). Use for filtering CA net.';

COMMENT ON COLUMN stock_movements.stock_status IS
  'Status of stock after this movement. Allows tracking sellable vs damaged/lost inventory.';

COMMENT ON COLUMN sales_order_items.returned_quantity IS
  'Total quantity returned for this line item (cumulative if multiple returns).';

-- ============================================================================
-- 8. EXAMPLE QUERIES
-- ============================================================================

-- Query 1: List all returns with details
/*
SELECT
  r.return_number,
  r.status,
  r.return_reason,
  o.legal_name AS customer,
  so.order_number,
  COUNT(ri.id) AS nb_items,
  SUM(ri.quantity_requested) AS qty_requested,
  SUM(ri.quantity_approved) AS qty_approved
FROM returns r
JOIN organisations o ON o.id = r.customer_id
JOIN sales_orders so ON so.id = r.sales_order_id
LEFT JOIN return_items ri ON ri.return_id = r.id
GROUP BY r.id, o.legal_name, so.order_number
ORDER BY r.created_at DESC;
*/

-- Query 2: Calculate total credit note amount for a return
/*
SELECT * FROM calculate_credit_note_amount('uuid-return-id');
*/

-- Query 3: Find products with high return rates
/*
SELECT
  p.sku,
  p.name,
  COUNT(DISTINCT ri.return_id) AS nb_returns,
  SUM(ri.quantity_requested) AS total_returned
FROM return_items ri
JOIN products p ON p.id = ri.product_id
GROUP BY p.id
ORDER BY nb_returns DESC
LIMIT 10;
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
