-- =====================================================================
-- [BO-SOURCING-P3-001] Commande d'échantillon : un seul échantillon actif par produit (D6)
-- =====================================================================
-- PROPOSITION DE REMPLACEMENT — fichier séparé de la migration de cycle de vie
-- (20260913190000) pour que le remplacement soit visible et décidé à part.
--
-- Décision Roméo D6 (audit sourcing 2026-09-12 § 7) : pas de deuxième commande
-- d'échantillon tant qu'une commande échantillon non annulée contient le produit ;
-- possible de nouveau si elle est annulée.
--
-- Une fonction du même nom existe déjà :
--   request_sample_order(p_draft_id uuid, p_sample_description text,
--                        p_estimated_cost numeric DEFAULT NULL,
--                        p_delivery_time_days integer DEFAULT NULL)
-- Constat du 2026-09-13 : elle lit `product_drafts`, table qui n'existe plus, donc
-- elle échoue à chaque appel ; aucun appelant dans le code (apps, packages) ni dans
-- une autre fonction SQL ; SECURITY INVOKER exécutable par anon. Son corps complet
-- est reproduit dans le compte rendu P3. Elle est retirée et remplacée ici.
--
-- Nouvelle fonction : SECURITY INVOKER (RLS appliquée), garde is_backoffice_user(),
-- verrou de ligne sur le produit (deux clics simultanés ne créent pas deux lignes),
-- même comportement que l'écran actuel (use-sourcing-sample-order.ts) : réutilise
-- la commande échantillon brouillon du fournisseur, sinon en crée une
-- (generate_po_number, po_type 'sample') ; ligne quantité 1 au prix d'achat.
-- Les totaux sont recalculés par le déclencheur existant sur purchase_order_items.
-- N'écrit PAS products.sourcing_status : l'état échantillon est dérivé de la commande (P4).
-- Aucun déclencheur modifié.
--
-- Codes d'erreur : 42501 accès refusé · P0002 produit introuvable ·
-- VS001 échantillon déjà commandé (DETAIL = id de la commande) ·
-- VS002 fournisseur ou prix d'achat manquant.
--
-- Application : via execute_sql après accord écrit de Roméo (« OK P3 »), avec la
-- migration 20260913190000 ; jamais `supabase db push` ; types régénérés.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

DROP FUNCTION public.request_sample_order(uuid, text, numeric, integer);

CREATE FUNCTION public.request_sample_order(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
DECLARE
  v_product record;
  v_active record;
  v_order_id uuid;
  v_order_number text;
  v_order_created boolean := false;
  v_item_id uuid;
BEGIN
  IF NOT is_backoffice_user() THEN
    RAISE EXCEPTION 'Action réservée au back-office' USING ERRCODE = '42501';
  END IF;

  SELECT p.id, p.supplier_id, p.cost_price, p.assigned_client_id,
         coalesce(o.trade_name, o.legal_name) AS client_name
    INTO v_product
    FROM products p
    LEFT JOIN organisations o ON o.id = p.assigned_client_id
   WHERE p.id = p_product_id
     FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable' USING ERRCODE = 'P0002';
  END IF;
  IF v_product.supplier_id IS NULL THEN
    RAISE EXCEPTION 'Un fournisseur doit être lié avant de commander un échantillon' USING ERRCODE = 'VS002';
  END IF;
  IF coalesce(v_product.cost_price, 0) <= 0 THEN
    RAISE EXCEPTION 'Le prix d''achat doit être supérieur à 0 avant de commander un échantillon' USING ERRCODE = 'VS002';
  END IF;

  -- D6 : un seul échantillon actif par produit (commande non annulée, ligne non archivée)
  SELECT po.id, po.po_number
    INTO v_active
    FROM purchase_order_items poi
    JOIN purchase_orders po ON po.id = poi.purchase_order_id
   WHERE poi.product_id = p_product_id
     AND po.po_type = 'sample'
     AND po.status <> 'cancelled'
     AND poi.archived_at IS NULL
   ORDER BY po.created_at DESC
   LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Un échantillon de ce produit est déjà commandé (%)', v_active.po_number
      USING ERRCODE = 'VS001',
            DETAIL = v_active.id::text,
            HINT = 'Annuler la commande échantillon existante pour en passer une nouvelle';
  END IF;

  -- Réutiliser la commande échantillon brouillon du fournisseur, sinon la créer
  SELECT po.id, po.po_number
    INTO v_order_id, v_order_number
    FROM purchase_orders po
   WHERE po.supplier_id = v_product.supplier_id
     AND po.po_type = 'sample'
     AND po.status = 'draft'
   ORDER BY po.created_at DESC
   LIMIT 1
     FOR UPDATE;

  IF v_order_id IS NULL THEN
    v_order_number := generate_po_number();
    INSERT INTO purchase_orders (
      po_number, supplier_id, status, po_type, currency, notes, created_by
    ) VALUES (
      v_order_number, v_product.supplier_id, 'draft', 'sample', 'EUR',
      'Commande échantillon automatique', auth.uid()
    )
    RETURNING id INTO v_order_id;
    v_order_created := true;
  END IF;

  INSERT INTO purchase_order_items (
    purchase_order_id, product_id, quantity, unit_price_ht, discount_percentage,
    sample_type, customer_organisation_id, notes
  ) VALUES (
    v_order_id, p_product_id, 1, v_product.cost_price, 0,
    CASE WHEN v_product.assigned_client_id IS NULL THEN 'internal' ELSE 'customer' END,
    v_product.assigned_client_id,
    CASE WHEN v_product.client_name IS NULL
      THEN 'Échantillon pour validation'
      ELSE 'Échantillon sourcing - Client: ' || v_product.client_name
    END
  )
  RETURNING id INTO v_item_id;

  RETURN jsonb_build_object(
    'product_id', p_product_id,
    'purchase_order_id', v_order_id,
    'po_number', v_order_number,
    'order_created', v_order_created,
    'purchase_order_item_id', v_item_id
  );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.request_sample_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_sample_order(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.request_sample_order(uuid) IS
  'Commande d''échantillon d''un produit (BO-SOURCING-P3-001, décision D6) : refusée (VS001) si une commande échantillon non annulée le contient déjà.';

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (sur décision de Roméo) : retirer la nouvelle fonction.
-- L'ancienne n'est pas recréée : elle lisait une table supprimée et ne pouvait
-- plus fonctionner (corps conservé dans le compte rendu P3).
-- ---------------------------------------------------------------------
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
-- DROP FUNCTION public.request_sample_order(uuid);
-- COMMIT;
