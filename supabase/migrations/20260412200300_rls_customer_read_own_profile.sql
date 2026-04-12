-- Fix: individual_customers had no SELECT policy for site-internet customers
-- A connected client could not read their own profile via RLS
-- This policy allows customers to read their own row via auth_user_id

CREATE POLICY "customer_read_own_profile"
  ON individual_customers
  FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()));
