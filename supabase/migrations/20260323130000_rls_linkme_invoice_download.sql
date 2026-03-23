-- =============================================================================
-- RLS: Allow LinkMe affiliates to read their own customer invoices
-- =============================================================================
-- Sprint 4: Enable invoice PDF download for LinkMe users
--
-- Two policies added:
-- 1. financial_documents: SELECT for customer_invoice linked to affiliate's orders
-- 2. storage.objects: SELECT for customer/ folder in justificatifs bucket
-- =============================================================================

-- 1. Financial Documents: LinkMe affiliates can read their own customer invoices
CREATE POLICY "linkme_affiliates_read_own_invoices" ON financial_documents
FOR SELECT TO authenticated
USING (
  document_type = 'customer_invoice'
  AND sales_order_id IS NOT NULL
  AND NOT is_backoffice_user()
  AND EXISTS (
    SELECT 1 FROM sales_orders so
    JOIN linkme_affiliates la ON so.created_by_affiliate_id = la.id
    JOIN user_app_roles uar ON (
      (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
      OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
    WHERE so.id = financial_documents.sales_order_id
      AND uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.is_active = true
  )
);

-- 2. Storage: LinkMe users can read customer invoices PDFs (customer/ folder only)
CREATE POLICY "linkme_read_customer_justificatifs" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'justificatifs'
  AND (storage.foldername(name))[1] = 'customer'
  AND EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.is_active = true
  )
);
