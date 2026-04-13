-- Fix: promotion_usages RLS was too permissive
-- SELECT USING(true) exposed all usages to any authenticated user
-- INSERT WITH CHECK(true) allowed any user to insert arbitrary usages
-- Now: staff only for SELECT, INSERT only via service role (webhook)

DROP POLICY IF EXISTS "authenticated_read_own_promotion_usages" ON promotion_usages;
DROP POLICY IF EXISTS "authenticated_insert_promotion_usages" ON promotion_usages;

-- Staff can read all promotion usages (back-office analytics)
CREATE POLICY "staff_read_promotion_usages"
  ON promotion_usages
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- No INSERT policy for authenticated users — inserts happen via service role
-- (webhook Stripe uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS)
