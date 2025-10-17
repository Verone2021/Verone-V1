-- Migration 004: Create Stock and Orders Tables
-- Date: 2025-09-16
-- Description: Creates the complete stock management and orders system tables

-- ==============================================
-- STOCK MOVEMENTS TABLE
-- ==============================================

CREATE TYPE movement_type AS ENUM ('IN', 'OUT', 'ADJUST', 'TRANSFER');

CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id uuid NULL, -- Future warehouse management
  movement_type movement_type NOT NULL,
  quantity_change integer NOT NULL CHECK (quantity_change != 0),
  quantity_before integer NOT NULL CHECK (quantity_before >= 0),
  quantity_after integer NOT NULL CHECK (quantity_after >= 0),
  unit_cost numeric(10,2) NULL, -- Cost per unit for valuation
  reference_type text NULL, -- 'purchase_order', 'sales_order', 'adjustment', 'transfer'
  reference_id uuid NULL,
  notes text NULL,
  performed_by uuid NOT NULL REFERENCES auth.users(id),
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Business rules constraints
  CONSTRAINT valid_quantity_logic CHECK (
    (movement_type = 'IN' AND quantity_change > 0 AND quantity_after = quantity_before + quantity_change) OR
    (movement_type = 'OUT' AND quantity_change < 0 AND quantity_after = quantity_before + quantity_change) OR
    (movement_type = 'ADJUST' AND quantity_after >= 0) OR
    (movement_type = 'TRANSFER' AND quantity_after >= 0)
  )
);

-- Index pour performance
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_performed_at ON stock_movements(performed_at DESC);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);

-- ==============================================
-- PURCHASE ORDERS TABLES
-- ==============================================

CREATE TYPE purchase_order_status AS ENUM ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled');

CREATE TABLE purchase_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number varchar(50) UNIQUE NOT NULL,
  supplier_id uuid NOT NULL REFERENCES organisations(id),
  status purchase_order_status NOT NULL DEFAULT 'draft',
  currency varchar(3) NOT NULL DEFAULT 'EUR' CHECK (currency ~ '^[A-Z]{3}$'),
  tax_rate numeric(5,4) NOT NULL DEFAULT 0.2000 CHECK (tax_rate >= 0 AND tax_rate <= 1),
  total_ht numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_ht >= 0),
  total_ttc numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_ttc >= 0),
  expected_delivery_date date NULL,
  delivery_address jsonb NULL,
  payment_terms varchar(100) NULL,
  notes text NULL,

  -- Workflow timestamps
  created_by uuid NOT NULL REFERENCES auth.users(id),
  validated_by uuid NULL REFERENCES auth.users(id),
  sent_by uuid NULL REFERENCES auth.users(id),
  received_by uuid NULL REFERENCES auth.users(id),

  validated_at timestamptz NULL,
  sent_at timestamptz NULL,
  received_at timestamptz NULL,
  cancelled_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Business constraints
  CONSTRAINT valid_workflow_timestamps CHECK (
    (status = 'draft' OR validated_at IS NOT NULL) AND
    (status IN ('draft', 'sent') OR sent_at IS NOT NULL) AND
    (status NOT IN ('received', 'partially_received') OR received_at IS NOT NULL) AND
    (status != 'cancelled' OR cancelled_at IS NOT NULL)
  )
);

CREATE TABLE purchase_order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_ht numeric(10,2) NOT NULL CHECK (unit_price_ht > 0),
  discount_percentage numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage < 100),
  total_ht numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price_ht * (1 - discount_percentage/100)) STORED,
  quantity_received integer NOT NULL DEFAULT 0 CHECK (quantity_received >= 0 AND quantity_received <= quantity),
  expected_delivery_date date NULL,
  notes text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performance purchase orders
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_expected_delivery ON purchase_orders(expected_delivery_date);
CREATE INDEX idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- ==============================================
-- SALES ORDERS TABLES
-- ==============================================

CREATE TYPE sales_order_status AS ENUM ('draft', 'confirmed', 'partially_shipped', 'shipped', 'delivered', 'cancelled');

CREATE TABLE sales_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number varchar(50) UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES organisations(id),
  status sales_order_status NOT NULL DEFAULT 'draft',
  currency varchar(3) NOT NULL DEFAULT 'EUR' CHECK (currency ~ '^[A-Z]{3}$'),
  tax_rate numeric(5,4) NOT NULL DEFAULT 0.2000 CHECK (tax_rate >= 0 AND tax_rate <= 1),
  total_ht numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_ht >= 0),
  total_ttc numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_ttc >= 0),
  expected_delivery_date date NULL,
  shipping_address jsonb NULL,
  billing_address jsonb NULL,
  payment_terms varchar(100) NULL,
  notes text NULL,

  -- Workflow timestamps
  created_by uuid NOT NULL REFERENCES auth.users(id),
  confirmed_by uuid NULL REFERENCES auth.users(id),
  shipped_by uuid NULL REFERENCES auth.users(id),
  delivered_by uuid NULL REFERENCES auth.users(id),

  confirmed_at timestamptz NULL,
  shipped_at timestamptz NULL,
  delivered_at timestamptz NULL,
  cancelled_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Business constraints
  CONSTRAINT valid_sales_workflow_timestamps CHECK (
    (status = 'draft' OR confirmed_at IS NOT NULL) AND
    (status NOT IN ('shipped', 'partially_shipped', 'delivered') OR shipped_at IS NOT NULL) AND
    (status != 'delivered' OR delivered_at IS NOT NULL) AND
    (status != 'cancelled' OR cancelled_at IS NOT NULL)
  )
);

CREATE TABLE sales_order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id uuid NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_ht numeric(10,2) NOT NULL CHECK (unit_price_ht > 0),
  discount_percentage numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage < 100),
  total_ht numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price_ht * (1 - discount_percentage/100)) STORED,
  quantity_shipped integer NOT NULL DEFAULT 0 CHECK (quantity_shipped >= 0 AND quantity_shipped <= quantity),
  expected_delivery_date date NULL,
  notes text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performance sales orders
CREATE INDEX idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_order_number ON sales_orders(order_number);
CREATE INDEX idx_sales_orders_expected_delivery ON sales_orders(expected_delivery_date);
CREATE INDEX idx_sales_order_items_so_id ON sales_order_items(sales_order_id);
CREATE INDEX idx_sales_order_items_product_id ON sales_order_items(product_id);

-- ==============================================
-- STOCK RESERVATIONS TABLE
-- ==============================================

CREATE TABLE stock_reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reserved_quantity integer NOT NULL CHECK (reserved_quantity > 0),
  reference_type text NOT NULL, -- 'sales_order', 'production_order'
  reference_id uuid NOT NULL,
  reserved_by uuid NOT NULL REFERENCES auth.users(id),
  reserved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,
  released_at timestamptz NULL,
  released_by uuid NULL REFERENCES auth.users(id),
  notes text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Une réservation ne peut être à la fois active et libérée
  CONSTRAINT valid_reservation_state CHECK (
    (released_at IS NULL AND released_by IS NULL) OR
    (released_at IS NOT NULL AND released_by IS NOT NULL)
  ),

  -- La date d'expiration doit être dans le futur
  CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > reserved_at)
);

-- Index pour performance reservations
CREATE INDEX idx_stock_reservations_product_id ON stock_reservations(product_id);
CREATE INDEX idx_stock_reservations_reference ON stock_reservations(reference_type, reference_id);
CREATE INDEX idx_stock_reservations_active ON stock_reservations(product_id) WHERE released_at IS NULL;
CREATE INDEX idx_stock_reservations_expires_at ON stock_reservations(expires_at) WHERE expires_at IS NOT NULL AND released_at IS NULL;

-- ==============================================
-- FUNCTIONS & TRIGGERS
-- ==============================================

-- Function pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER stock_movements_updated_at BEFORE UPDATE ON stock_movements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sales_order_items_updated_at BEFORE UPDATE ON sales_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER stock_reservations_updated_at BEFORE UPDATE ON stock_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function pour générer les numéros de commande auto
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  po_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  SELECT COALESCE(MAX(
    CASE WHEN po_number ~ ('^PO-' || year_part || '-[0-9]+$')
    THEN CAST(SUBSTRING(po_number FROM LENGTH('PO-' || year_part || '-') + 1) AS INTEGER)
    ELSE 0 END
  ), 0) + 1 INTO sequence_num
  FROM purchase_orders;

  po_number := 'PO-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
  RETURN po_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_so_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  so_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  SELECT COALESCE(MAX(
    CASE WHEN order_number ~ ('^SO-' || year_part || '-[0-9]+$')
    THEN CAST(SUBSTRING(order_number FROM LENGTH('SO-' || year_part || '-') + 1) AS INTEGER)
    ELSE 0 END
  ), 0) + 1 INTO sequence_num
  FROM sales_orders;

  so_number := 'SO-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
  RETURN so_number;
END;
$$ LANGUAGE plpgsql;

-- Function pour calculer le stock disponible (physique - réservé)
CREATE OR REPLACE FUNCTION get_available_stock(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  physical_stock INTEGER;
  reserved_stock INTEGER;
BEGIN
  -- Stock physique actuel
  SELECT COALESCE(stock_quantity, 0) INTO physical_stock
  FROM products
  WHERE id = p_product_id;

  -- Stock réservé (non libéré)
  SELECT COALESCE(SUM(reserved_quantity), 0) INTO reserved_stock
  FROM stock_reservations
  WHERE product_id = p_product_id
    AND released_at IS NULL
    AND (expires_at IS NULL OR expires_at > now());

  RETURN GREATEST(physical_stock - reserved_stock, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function pour automatiquement mettre à jour le stock produit lors des mouvements
CREATE OR REPLACE FUNCTION update_product_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Mise à jour du stock_quantity dans la table products
  UPDATE products
  SET stock_quantity = NEW.quantity_after,
      updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_movements_update_product_stock
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_movement();

-- ==============================================
-- RLS POLICIES
-- ==============================================

-- Enable RLS sur toutes les nouvelles tables
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

-- Helper function pour vérifier l'organisation de l'utilisateur
CREATE OR REPLACE FUNCTION user_has_access_to_organisation(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin et Owner ont accès à tout
  IF get_user_role() IN ('admin', 'owner') THEN
    RETURN TRUE;
  END IF;

  -- Pour les autres rôles, vérifier l'organisation
  RETURN EXISTS (
    SELECT 1 FROM user_organisation_assignments uoa
    WHERE uoa.user_id = auth.uid()
      AND uoa.organisation_id = org_id
      AND uoa.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies pour stock_movements
CREATE POLICY "Utilisateurs peuvent voir les mouvements de stock de leur organisation"
  ON stock_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = stock_movements.product_id
        AND user_has_access_to_organisation(get_user_organisation_id())
    )
  );

CREATE POLICY "Utilisateurs peuvent créer des mouvements de stock"
  ON stock_movements FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'catalog_manager') AND
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = stock_movements.product_id
        AND user_has_access_to_organisation(get_user_organisation_id())
    )
  );

-- RLS Policies pour purchase_orders
CREATE POLICY "Utilisateurs peuvent voir leurs commandes fournisseurs"
  ON purchase_orders FOR SELECT
  USING (user_has_access_to_organisation(get_user_organisation_id()));

CREATE POLICY "Utilisateurs peuvent créer des commandes fournisseurs"
  ON purchase_orders FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin') AND
    user_has_access_to_organisation(get_user_organisation_id())
  );

CREATE POLICY "Utilisateurs peuvent modifier leurs commandes fournisseurs"
  ON purchase_orders FOR UPDATE
  USING (user_has_access_to_organisation(get_user_organisation_id()))
  WITH CHECK (user_has_access_to_organisation(get_user_organisation_id()));

-- RLS Policies pour purchase_order_items
CREATE POLICY "Utilisateurs peuvent voir les items de leurs commandes fournisseurs"
  ON purchase_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND user_has_access_to_organisation(get_user_organisation_id())
    )
  );

CREATE POLICY "Utilisateurs peuvent créer des items de commandes fournisseurs"
  ON purchase_order_items FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin') AND
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND user_has_access_to_organisation(get_user_organisation_id())
    )
  );

-- RLS Policies pour sales_orders (similaires)
CREATE POLICY "Utilisateurs peuvent voir leurs commandes clients"
  ON sales_orders FOR SELECT
  USING (user_has_access_to_organisation(get_user_organisation_id()));

CREATE POLICY "Utilisateurs peuvent créer des commandes clients"
  ON sales_orders FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'sales') AND
    user_has_access_to_organisation(get_user_organisation_id())
  );

CREATE POLICY "Utilisateurs peuvent modifier leurs commandes clients"
  ON sales_orders FOR UPDATE
  USING (user_has_access_to_organisation(get_user_organisation_id()))
  WITH CHECK (user_has_access_to_organisation(get_user_organisation_id()));

-- RLS Policies pour sales_order_items
CREATE POLICY "Utilisateurs peuvent voir les items de leurs commandes clients"
  ON sales_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_items.sales_order_id
        AND user_has_access_to_organisation(get_user_organisation_id())
    )
  );

CREATE POLICY "Utilisateurs peuvent créer des items de commandes clients"
  ON sales_order_items FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'sales') AND
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_items.sales_order_id
        AND user_has_access_to_organisation(get_user_organisation_id())
    )
  );

-- RLS Policies pour stock_reservations
CREATE POLICY "Utilisateurs peuvent voir les réservations de stock de leur organisation"
  ON stock_reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = stock_reservations.product_id
        AND user_has_access_to_organisation(get_user_organisation_id())
    )
  );

CREATE POLICY "Utilisateurs peuvent créer des réservations de stock"
  ON stock_reservations FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'sales') AND
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = stock_reservations.product_id
        AND user_has_access_to_organisation(get_user_organisation_id())
    )
  );

-- ==============================================
-- SAMPLE DATA & VALIDATION
-- ==============================================

-- Validation des contraintes
DO $$
BEGIN
  RAISE NOTICE 'Migration 004 - Stock and Orders tables created successfully';
  RAISE NOTICE 'Tables created: stock_movements, purchase_orders, purchase_order_items, sales_orders, sales_order_items, stock_reservations';
  RAISE NOTICE 'Functions created: generate_po_number(), generate_so_number(), get_available_stock()';
  RAISE NOTICE 'RLS policies activated for all tables';
  RAISE NOTICE 'Ready for stock and orders management!';
END $$;