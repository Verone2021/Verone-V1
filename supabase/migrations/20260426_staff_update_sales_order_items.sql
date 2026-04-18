-- BO-FIN-024 Fix 3 : policy RLS UPDATE pour les staff back-office sur sales_order_items
-- Sans cette policy, les mises à jour depuis le BO échouent silencieusement (0 rows updated)
-- car seule linkme_users_update_own_order_items existait (affiliés LinkMe uniquement).

CREATE POLICY "staff_update_sales_order_items"
ON sales_order_items
FOR UPDATE
TO authenticated
USING (is_backoffice_user())
WITH CHECK (is_backoffice_user());
