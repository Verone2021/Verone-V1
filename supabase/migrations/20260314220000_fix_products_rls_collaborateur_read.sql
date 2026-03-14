-- Fix: enseigne_collaborateur can't see products → "Produit inconnu" in orders
-- Root cause: linkme_users_view_catalog_products only allows enseigne_admin + organisation_admin
-- Solution: Add enseigne_collaborateur to the allowed roles

DROP POLICY IF EXISTS "linkme_users_view_catalog_products" ON public.products;
CREATE POLICY "linkme_users_view_catalog_products" ON public.products
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.role IN ('enseigne_admin', 'organisation_admin', 'enseigne_collaborateur')
      AND uar.is_active = true
  )
);
