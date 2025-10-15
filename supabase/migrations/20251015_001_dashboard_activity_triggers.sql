-- =====================================================
-- Migration: Dashboard Activity Triggers - Vérone
-- Date: 2025-10-15
-- Description: Triggers automatiques pour logger les actions
--              importantes affichées dans le dashboard
-- =====================================================

-- =====================================================
-- TRIGGER: Log création produit
-- =====================================================
CREATE OR REPLACE FUNCTION log_product_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity_logs (
    user_id,
    organisation_id,
    action,
    table_name,
    record_id,
    new_data,
    severity,
    metadata
  ) VALUES (
    auth.uid(),
    NEW.organisation_id,
    'create_product',
    'products',
    NEW.id::text,
    jsonb_build_object(
      'product_name', NEW.name,
      'sku', NEW.sku,
      'category', NEW.category
    ),
    'info',
    jsonb_build_object(
      'stock_initial', NEW.stock_quantity,
      'price', NEW.price_ht
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_product_created
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_created();

-- =====================================================
-- TRIGGER: Log modification produit
-- =====================================================
CREATE OR REPLACE FUNCTION log_product_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Log seulement si changements significatifs
  IF (OLD.name != NEW.name)
     OR (OLD.stock_quantity != NEW.stock_quantity)
     OR (OLD.price_ht != NEW.price_ht)
     OR (OLD.status != NEW.status) THEN

    INSERT INTO user_activity_logs (
      user_id,
      organisation_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      severity,
      metadata
    ) VALUES (
      auth.uid(),
      NEW.organisation_id,
      'update_product',
      'products',
      NEW.id::text,
      jsonb_build_object(
        'product_name', OLD.name,
        'stock', OLD.stock_quantity,
        'price', OLD.price_ht,
        'status', OLD.status
      ),
      jsonb_build_object(
        'product_name', NEW.name,
        'stock', NEW.stock_quantity,
        'price', NEW.price_ht,
        'status', NEW.status
      ),
      'info',
      jsonb_build_object(
        'fields_changed', ARRAY(
          SELECT field FROM (
            VALUES
              ('name', OLD.name != NEW.name),
              ('stock', OLD.stock_quantity != NEW.stock_quantity),
              ('price', OLD.price_ht != NEW.price_ht),
              ('status', OLD.status != NEW.status)
          ) AS t(field, changed)
          WHERE changed = true
        )
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_product_updated
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_updated();

-- =====================================================
-- TRIGGER: Log création sales_order
-- =====================================================
CREATE OR REPLACE FUNCTION log_sales_order_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity_logs (
    user_id,
    organisation_id,
    action,
    table_name,
    record_id,
    new_data,
    severity,
    metadata
  ) VALUES (
    auth.uid(),
    NEW.created_by,
    'create_sales_order',
    'sales_orders',
    NEW.id::text,
    jsonb_build_object(
      'order_number', NEW.order_number,
      'status', NEW.status
    ),
    'info',
    jsonb_build_object(
      'total_ht', NEW.total_ht,
      'customer_id', NEW.customer_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_sales_order_created
  AFTER INSERT ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_sales_order_created();

-- =====================================================
-- TRIGGER: Log création purchase_order
-- =====================================================
CREATE OR REPLACE FUNCTION log_purchase_order_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity_logs (
    user_id,
    organisation_id,
    action,
    table_name,
    record_id,
    new_data,
    severity,
    metadata
  ) VALUES (
    auth.uid(),
    NEW.created_by,
    'create_purchase_order',
    'purchase_orders',
    NEW.id::text,
    jsonb_build_object(
      'po_number', NEW.po_number,
      'status', NEW.status
    ),
    'info',
    jsonb_build_object(
      'total_ht', NEW.total_ht,
      'supplier_id', NEW.supplier_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_purchase_order_created
  AFTER INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_purchase_order_created();

-- =====================================================
-- TRIGGER: Log changement statut sales_order
-- =====================================================
CREATE OR REPLACE FUNCTION log_sales_order_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  -- Log seulement si le statut change
  IF OLD.status != NEW.status THEN
    INSERT INTO user_activity_logs (
      user_id,
      organisation_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      severity,
      metadata
    ) VALUES (
      auth.uid(),
      NEW.created_by,
      'update_sales_order',
      'sales_orders',
      NEW.id::text,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      CASE
        WHEN NEW.status = 'cancelled' THEN 'warning'
        WHEN NEW.status = 'delivered' THEN 'info'
        ELSE 'info'
      END,
      jsonb_build_object(
        'order_number', NEW.order_number,
        'status_change', format('%s → %s', OLD.status, NEW.status)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_sales_order_status_changed
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_sales_order_status_changed();

-- =====================================================
-- TRIGGER: Log changement statut purchase_order
-- =====================================================
CREATE OR REPLACE FUNCTION log_purchase_order_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  -- Log seulement si le statut change
  IF OLD.status != NEW.status THEN
    INSERT INTO user_activity_logs (
      user_id,
      organisation_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      severity,
      metadata
    ) VALUES (
      auth.uid(),
      NEW.created_by,
      'update_purchase_order',
      'purchase_orders',
      NEW.id::text,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      CASE
        WHEN NEW.status = 'cancelled' THEN 'warning'
        WHEN NEW.status = 'received' THEN 'info'
        ELSE 'info'
      END,
      jsonb_build_object(
        'po_number', NEW.po_number,
        'status_change', format('%s → %s', OLD.status, NEW.status)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_purchase_order_status_changed
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_purchase_order_status_changed();

-- =====================================================
-- TRIGGER: Log mouvement stock important
-- =====================================================
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_product_name text;
  v_movement_type text;
  v_quantity_change int;
BEGIN
  -- Calculer le changement de stock
  v_quantity_change := NEW.stock_real - OLD.stock_real;

  -- Ignorer les petits changements (<5 unités)
  IF ABS(v_quantity_change) < 5 THEN
    RETURN NEW;
  END IF;

  -- Récupérer le nom du produit
  SELECT name INTO v_product_name
  FROM products
  WHERE id = NEW.id;

  -- Déterminer type de mouvement
  v_movement_type := CASE
    WHEN v_quantity_change > 0 THEN 'stock_in'
    ELSE 'stock_out'
  END;

  INSERT INTO user_activity_logs (
    user_id,
    organisation_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    severity,
    metadata
  ) VALUES (
    auth.uid(),
    NEW.organisation_id,
    v_movement_type,
    'products',
    NEW.id::text,
    jsonb_build_object('stock', OLD.stock_real),
    jsonb_build_object('stock', NEW.stock_real),
    CASE
      WHEN NEW.stock_real < 5 THEN 'critical'
      WHEN NEW.stock_real < 10 THEN 'warning'
      ELSE 'info'
    END,
    jsonb_build_object(
      'product_name', v_product_name,
      'quantity_change', v_quantity_change,
      'movement_type', v_movement_type
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_stock_movement
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.stock_real IS DISTINCT FROM NEW.stock_real)
  EXECUTE FUNCTION log_stock_movement();

-- =====================================================
-- COMMENTAIRES DOCUMENTATION
-- =====================================================
COMMENT ON FUNCTION log_product_created IS 'Trigger: Log automatique création produit pour dashboard';
COMMENT ON FUNCTION log_product_updated IS 'Trigger: Log automatique modification produit significative';
COMMENT ON FUNCTION log_sales_order_created IS 'Trigger: Log automatique création commande vente';
COMMENT ON FUNCTION log_purchase_order_created IS 'Trigger: Log automatique création commande achat';
COMMENT ON FUNCTION log_sales_order_status_changed IS 'Trigger: Log automatique changement statut commande vente';
COMMENT ON FUNCTION log_purchase_order_status_changed IS 'Trigger: Log automatique changement statut commande achat';
COMMENT ON FUNCTION log_stock_movement IS 'Trigger: Log automatique mouvement stock important (±5 unités)';

-- =====================================================
-- VALIDATION MIGRATION
-- =====================================================
DO $$
BEGIN
  -- Vérifier triggers créés
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_log_product_created'
  ) THEN
    RAISE EXCEPTION 'Trigger trigger_log_product_created non créé';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_log_sales_order_created'
  ) THEN
    RAISE EXCEPTION 'Trigger trigger_log_sales_order_created non créé';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_log_purchase_order_created'
  ) THEN
    RAISE EXCEPTION 'Trigger trigger_log_purchase_order_created non créé';
  END IF;

  RAISE NOTICE '✅ Migration dashboard activity triggers completed successfully';
  RAISE NOTICE '📊 Triggers: product_created, product_updated, sales_order_created, purchase_order_created, sales_order_status_changed, purchase_order_status_changed, stock_movement';
  RAISE NOTICE '🔔 Auto-logging pour dashboard activité récente activé';
END;
$$;
