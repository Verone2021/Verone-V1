-- Migration: Relâcher la contrainte check_sales_order_only_customer
-- Objectif: Autoriser les customer_invoice sans sales_order_id (factures de service)
--
-- Contexte: La route /api/qonto/invoices/service crée des factures directes
--           sans commande associée. L'ancienne contrainte bloquait l'INSERT local.
--           Standard industrie (Odoo, Dynamics 365, ERP.net) : sales_order_id nullable.
--
-- Vérifications effectuées le 2026-04-08:
--   - 0 customer_invoice existante avec sales_order_id IS NULL → migration safe
--   - 0 non-customer_invoice avec sales_order_id IS NOT NULL → pas de régression
--
-- Impact RLS: linkme_affiliates_read_own_invoices filtre sur sales_order_id IS NOT NULL
--             → les factures service (sales_order_id NULL) restent invisibles aux affiliés (correct)
-- Impact vue: v_library_documents ne filtre pas sur sales_order_id → OK

ALTER TABLE financial_documents
  DROP CONSTRAINT check_sales_order_only_customer;

ALTER TABLE financial_documents
  ADD CONSTRAINT check_sales_order_only_customer CHECK (
    -- Cas 1: sales_order_id absent → valide pour tout type de document
    -- (customer_invoice service, supplier_invoice, customer_quote, credit notes...)
    sales_order_id IS NULL
    OR
    -- Cas 2: sales_order_id présent → uniquement pour customer_invoice liée à commande
    (sales_order_id IS NOT NULL AND document_type = 'customer_invoice')
  );
