-- Migration: Auto-clean sales_orders.quote_qonto_id when linked quote is deleted
-- When a customer_quote is deleted (hard or soft) from financial_documents,
-- automatically clear quote_qonto_id and quote_number on the linked sales_order.

-- Trigger for hard delete
CREATE OR REPLACE FUNCTION clean_order_quote_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.document_type = 'customer_quote' AND OLD.sales_order_id IS NOT NULL THEN
    UPDATE sales_orders
    SET quote_qonto_id = NULL, quote_number = NULL
    WHERE id = OLD.sales_order_id
      AND quote_qonto_id = OLD.qonto_invoice_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_clean_order_quote_on_delete ON financial_documents;
CREATE TRIGGER trg_clean_order_quote_on_delete
  AFTER DELETE ON financial_documents
  FOR EACH ROW
  EXECUTE FUNCTION clean_order_quote_on_delete();

-- Trigger for soft delete (deleted_at set)
CREATE OR REPLACE FUNCTION clean_order_quote_on_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.document_type = 'customer_quote'
    AND NEW.sales_order_id IS NOT NULL
    AND OLD.deleted_at IS NULL
    AND NEW.deleted_at IS NOT NULL
  THEN
    UPDATE sales_orders
    SET quote_qonto_id = NULL, quote_number = NULL
    WHERE id = NEW.sales_order_id
      AND quote_qonto_id = NEW.qonto_invoice_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clean_order_quote_on_soft_delete ON financial_documents;
CREATE TRIGGER trg_clean_order_quote_on_soft_delete
  AFTER UPDATE OF deleted_at ON financial_documents
  FOR EACH ROW
  EXECUTE FUNCTION clean_order_quote_on_soft_delete();
