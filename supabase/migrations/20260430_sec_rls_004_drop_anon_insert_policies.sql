-- =======================================================================
-- BO-SEC-RLS-004 — Durcir 5 RLS anon-INSERT (rls_policy_always_true)
-- =======================================================================
-- Date         : 2026-04-30
-- Suite de    : #840, #841, #842, #843
--
-- Cible : 5 policies INSERT ouvertes à `anon` (et `PUBLIC`) avec
-- `WITH CHECK (true)` qui permettaient à n'importe quel client anon de
-- spammer ces tables → DDoS pollution comptable / RGPD.
--
-- Audit code préalable :
--   - 0 occurrence de `.insert()` côté client anon dans `apps/site-internet/`
--     pour ces tables.
--   - Toutes les routes API qui insèrent ces données passent par
--     `service_role` (Stripe webhook pour sales_orders, contact form pour
--     site_contact_messages, etc.) qui bypasse RLS automatiquement.
--   - DROP des policies anon-INSERT donc safe sans casser les flux légit.
--
-- Stratégie :
--   - DROP les 4 policies clairement non utilisées :
--     `Public can insert form_submissions`, `anon_insert_newsletter`,
--     `anon_insert_contact_messages`, `Public can create sales_orders`.
--     Le service_role continuera à insérer (bypass RLS).
--     Pour sales_orders, la policy `LinkMe users can create sales_orders`
--     reste active pour les LinkMe authentifiés.
--   - DROP `Public can create sales_order_items` + CREATE policy parité
--     `LinkMe users can create sales_order_items` (sinon les LinkMe
--     authentifiés ne peuvent plus créer leurs items).
--   - DROP `consultation_images_insert` + CREATE policy staff-only
--     `staff_insert_consultation_images` (uploads admin BO).
--
-- Hors scope (PRs futures) :
--   - 42 autres policies always_true à durcir individuellement (audit case
--     by case → certaines sont legitimes pour service_role/triggers).
--   - 309 fonctions SECURITY DEFINER → BO-SEC-SDF-FUNCS-005.
-- =======================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- 1. DROP `Public can insert form_submissions` ON form_submissions
-- -----------------------------------------------------------------------
-- Audit : 0 client anon ne fait `from('form_submissions').insert()`.
-- Toutes les soumissions du formulaire site-internet passent par
-- `apps/site-internet/src/app/api/.../route.ts` en service_role.
DROP POLICY IF EXISTS "Public can insert form_submissions" ON public.form_submissions;


-- -----------------------------------------------------------------------
-- 2. DROP `anon_insert_newsletter` ON newsletter_subscribers
-- -----------------------------------------------------------------------
-- Audit : 0 client anon ne fait `from('newsletter_subscribers').insert()`.
-- L'inscription newsletter passe par une route API service_role.
DROP POLICY IF EXISTS anon_insert_newsletter ON public.newsletter_subscribers;


-- -----------------------------------------------------------------------
-- 3. DROP `anon_insert_contact_messages` ON site_contact_messages
-- -----------------------------------------------------------------------
-- Audit : 0 client anon ne fait `from('site_contact_messages').insert()`.
-- Les messages contact passent par une route API service_role.
DROP POLICY IF EXISTS anon_insert_contact_messages ON public.site_contact_messages;


-- -----------------------------------------------------------------------
-- 4. DROP `Public can create sales_orders` ON sales_orders
-- -----------------------------------------------------------------------
-- Audit : la policy `LinkMe users can create sales_orders` (authenticated
-- + role linkme) couvre déjà les commandes LinkMe authentifiées. Les
-- autres inserts (Stripe webhook checkout) passent par service_role.
-- DROP de la policy `{anon,authenticated} WITH CHECK (true)` empêche le
-- spam anon sans casser les flux légitimes.
DROP POLICY IF EXISTS "Public can create sales_orders" ON public.sales_orders;


-- -----------------------------------------------------------------------
-- 5. DROP `Public can create sales_order_items` + CREATE parité LinkMe
-- -----------------------------------------------------------------------
-- Pour préserver les inserts items côté LinkMe authentifié, on ajoute
-- une policy similaire à celle de sales_orders. Les inserts via Stripe
-- webhook continuent via service_role.
DROP POLICY IF EXISTS "Public can create sales_order_items" ON public.sales_order_items;

CREATE POLICY "LinkMe users can create sales_order_items"
  ON public.sales_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_app_roles
      WHERE user_app_roles.user_id = (SELECT auth.uid())
        AND user_app_roles.app = 'linkme'::app_type
    )
  );


-- -----------------------------------------------------------------------
-- 6. DROP `consultation_images_insert` + CREATE staff-only
-- -----------------------------------------------------------------------
-- Audit : les uploads images consultation passent par le back-office
-- admin authentifié (staff). Anon ne devrait JAMAIS pouvoir y insérer.
-- La policy actuelle `{-}` PUBLIC `WITH CHECK (true)` est trop laxiste.

DROP POLICY IF EXISTS consultation_images_insert ON public.consultation_images;

CREATE POLICY staff_insert_consultation_images
  ON public.consultation_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_backoffice_user());

COMMIT;
