-- [BO-FIN-031] Allow customer_quote to have sales_order_id (same as customer_invoice)
-- Previously, only customer_invoice could link to a sales_order. With BO-FIN-029
-- (regenerate) and BO-FIN-031 (shipping/billing rework), customer_quote devis
-- from order need this link too.

ALTER TABLE financial_documents
  DROP CONSTRAINT IF EXISTS check_sales_order_only_customer;

ALTER TABLE financial_documents
  ADD CONSTRAINT check_sales_order_only_customer CHECK (
    sales_order_id IS NULL
    OR document_type IN ('customer_invoice', 'customer_quote')
  );
