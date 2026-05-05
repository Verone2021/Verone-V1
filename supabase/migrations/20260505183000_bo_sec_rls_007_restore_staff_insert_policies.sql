-- =======================================================================
-- BO-SEC-RLS-007 — Restaurer les policies staff INSERT manquantes
-- =======================================================================
-- Date         : 2026-05-05
-- Suite de    : #844 (BO-SEC-RLS-004), #846 (BO-SEC-RLS-005), #847 (BO-SEC-RLS-006)
-- Incident   : production cassée — staff back-office ne peut plus créer
--              de commande LinkMe ni d'autres documents métier.
--
-- Cause racine
-- -----------
-- La migration `20260430_sec_rls_004_drop_anon_insert_policies.sql` a DROP
-- la policy `Public can create sales_orders` (qui avait WITH CHECK true et
-- couvrait incidemment tous les inserts authentifiés, y compris staff
-- back-office) en justifiant que la policy `LinkMe users can create
-- sales_orders` couvrait les commandes LinkMe authentifiées.
--
-- Cette analyse était **incomplète** : elle n'a vérifié que `apps/site-internet/`,
-- pas `apps/back-office/`. Or `apps/back-office/src/app/(protected)/canaux-vente/
-- linkme/hooks/use-linkme-orders.mutations.ts:202` fait un INSERT direct via
-- le client utilisateur (pas service_role, pas RPC SECURITY DEFINER) en tant
-- que staff back-office. Ce chemin n'a aucune policy applicable depuis le
-- 30 avril.
--
-- Le même angle mort touche purchase_orders, financial_documents, et plusieurs
-- tables liées. L'audit RLS ci-dessous restaure la couverture complète staff.
--
-- Tables couvertes
-- ----------------
-- 1. sales_orders                    (création commande client)
-- 2. sales_order_items               (lignes de commande)
-- 3. sales_order_events              (événements / notes internes)
-- 4. sales_order_shipments           (création expédition)
-- 5. purchase_orders                 (création commande fournisseur)
-- 6. purchase_order_items            (lignes PO)
-- 7. financial_documents             (factures, devis, proformas via BO)
-- 8. financial_document_items        (lignes factures/devis)
-- 9. organisations                   (création organisation depuis BO)
--
-- Pattern : `is_backoffice_user()` — fonction officielle du repo, déjà
-- utilisée sur 30+ tables. Aucun risque sécurité supplémentaire.
--
-- Vérification post-migration (à exécuter manuellement) :
--   SELECT tablename, policyname FROM pg_policies
--   WHERE tablename IN ('sales_orders','sales_order_items','sales_order_events',
--     'sales_order_shipments','purchase_orders','purchase_order_items',
--     'financial_documents','financial_document_items','organisations')
--     AND cmd = 'INSERT' AND policyname LIKE 'staff_insert%'
--   ORDER BY tablename;
-- =======================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- 1. sales_orders — staff INSERT
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS staff_insert_sales_orders ON public.sales_orders;
CREATE POLICY staff_insert_sales_orders
  ON public.sales_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 2. sales_order_items — staff INSERT
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS staff_insert_sales_order_items ON public.sales_order_items;
CREATE POLICY staff_insert_sales_order_items
  ON public.sales_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 3. sales_order_events — staff INSERT
-- -----------------------------------------------------------------------
-- La policy `anon_insert_confirmation_events` (anon, type=email_confirmation_sent)
-- reste active pour les confirmations publiques.
DROP POLICY IF EXISTS staff_insert_sales_order_events ON public.sales_order_events;
CREATE POLICY staff_insert_sales_order_events
  ON public.sales_order_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 4. sales_order_shipments — staff INSERT
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS staff_insert_sales_order_shipments ON public.sales_order_shipments;
CREATE POLICY staff_insert_sales_order_shipments
  ON public.sales_order_shipments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 5. purchase_orders — staff INSERT
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS staff_insert_purchase_orders ON public.purchase_orders;
CREATE POLICY staff_insert_purchase_orders
  ON public.purchase_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 6. purchase_order_items — staff INSERT
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS staff_insert_purchase_order_items ON public.purchase_order_items;
CREATE POLICY staff_insert_purchase_order_items
  ON public.purchase_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 7. financial_documents — staff INSERT
-- -----------------------------------------------------------------------
-- Permet la création directe par le BO (classify-dialog, supplier-invoice-sync).
-- Les flux Qonto via /api/qonto/* utilisent service_role et bypassent RLS.
DROP POLICY IF EXISTS staff_insert_financial_documents ON public.financial_documents;
CREATE POLICY staff_insert_financial_documents
  ON public.financial_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 8. financial_document_items — staff INSERT
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS staff_insert_financial_document_items ON public.financial_document_items;
CREATE POLICY staff_insert_financial_document_items
  ON public.financial_document_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 9. organisations — staff INSERT
-- -----------------------------------------------------------------------
-- La policy `linkme_users_insert_organisations` reste active pour les
-- enseigne_admin LinkMe authentifiés (création depuis l'app LinkMe).
DROP POLICY IF EXISTS staff_insert_organisations ON public.organisations;
CREATE POLICY staff_insert_organisations
  ON public.organisations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_backoffice_user());


COMMIT;
