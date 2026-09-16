-- [BO-SOURCING-COMPLETUDE-001] Règle de complétude unique, partagée écran / base.
--
-- Contexte : depuis le 13/09, « Commander l'échantillon » et « Valider au
-- catalogue » exigent un fournisseur et un prix d'achat. La règle était écrite
-- en dur dans chaque fonction et l'écran n'affichait aucune explication : les
-- boutons semblaient cassés. Cette migration :
--   1. crée `sourcing_missing_fields(produit, portée)`, seule source de vérité,
--      miroir exact de packages/@verone/products/src/utils/sourcing-completeness.ts ;
--   2. branche `apply_product_lifecycle_action` (action `validate`) dessus, et
--      autorise la réouverture d'un produit au statut `archived` ;
--   3. branche `request_sample_order` dessus.
--
-- Portées : 'sample' = fournisseur + prix d'achat.
--           'catalogue' = + sous-catégorie + au moins une photo + référence fournisseur.
-- Le poids reste conseillé côté écran et n'est PAS contrôlé ici.
--
-- Append-only. Aucun déclencheur de stock touché. Aucune route Qonto touchée.
-- Les corps des deux fonctions sont recopiés à l'identique depuis
-- `pg_get_functiondef` ; les seules différences sont marquées « DELTA ».

BEGIN;

SET LOCAL lock_timeout = '5s';

-- ---------------------------------------------------------------------------
-- 1) Source de vérité unique des champs manquants
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sourcing_missing_fields(
  p_product_id uuid,
  p_scope      text          -- 'sample' | 'catalogue'
)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $fn$
  SELECT coalesce(array_agg(k ORDER BY k), ARRAY[]::text[])
  FROM products p
  CROSS JOIN LATERAL (
    SELECT 'supplier_id' AS k WHERE p.supplier_id IS NULL
    UNION ALL
    SELECT 'cost_price' WHERE coalesce(p.cost_price, 0) <= 0
    UNION ALL
    SELECT 'subcategory_id'
      WHERE p_scope = 'catalogue' AND p.subcategory_id IS NULL
    UNION ALL
    SELECT 'supplier_reference'
      WHERE p_scope = 'catalogue'
        AND nullif(btrim(coalesce(p.supplier_reference, '')), '') IS NULL
    UNION ALL
    SELECT 'images'
      WHERE p_scope = 'catalogue'
        AND NOT EXISTS (
          SELECT 1 FROM product_images pi WHERE pi.product_id = p.id
        )
  ) missing(k)
  WHERE p.id = p_product_id;
$fn$;

REVOKE EXECUTE ON FUNCTION public.sourcing_missing_fields(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sourcing_missing_fields(uuid, text)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.sourcing_missing_fields(uuid, text) IS
  'Champs obligatoires manquants d''un produit sourcing (BO-SOURCING-COMPLETUDE-001). Portée « sample » ou « catalogue ». Miroir exact de packages/@verone/products/src/utils/sourcing-completeness.ts (test de parité dans __tests__/sourcing-completeness.test.ts).';

-- ---------------------------------------------------------------------------
-- 2) Cycle de vie : validation branchée sur la règle, réouverture d'un archivé
--    Corps recopié depuis 20260913220000_bo_sourcing_p4_validate_to_catalogue.sql.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_product_lifecycle_action(
  p_product_id uuid,
  p_action text,
  p_to_stage text DEFAULT NULL::text,
  p_reason text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  -- Les 4 étapes de l'écran (rapport 11/09 § 8.1)
  c_stages CONSTANT text[] := ARRAY['supplier_search', 'initial_contact', 'evaluation', 'negotiation'];
  -- Statuts « en cours » acceptés jusqu'à la contraction P6 (anciens codes compris)
  c_in_progress CONSTANT text[] := ARRAY[
    'need_identified', 'supplier_search', 'initial_contact', 'evaluation', 'negotiation',
    'sample_requested', 'sample_received', 'sample_approved', 'order_placed', 'received'
  ];
  v_product record;
  v_from text;
  v_to text;
  v_journal_to text;
  v_archived_at timestamptz;
  v_reason text := NULLIF(btrim(p_reason), '');
  v_summary text;
  v_communication_id uuid;
  v_missing text[];                                    -- DELTA A
BEGIN
  IF NOT is_backoffice_user() THEN
    RAISE EXCEPTION 'Action réservée au back-office' USING ERRCODE = '42501';
  END IF;

  SELECT id, sourcing_status, archived_at, supplier_id, cost_price
    INTO v_product
    FROM products
   WHERE id = p_product_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable' USING ERRCODE = 'P0002';
  END IF;

  v_from := v_product.sourcing_status;
  v_to := v_from;
  v_archived_at := v_product.archived_at;

  CASE p_action
    WHEN 'set_stage' THEN
      IF p_to_stage IS NULL OR NOT (p_to_stage = ANY (c_stages)) THEN
        RAISE EXCEPTION 'Étape inconnue : %', coalesce(p_to_stage, '(vide)') USING ERRCODE = 'VL003';
      END IF;
      IF v_from IS NULL OR NOT (v_from = ANY (c_in_progress)) OR v_from = p_to_stage THEN
        RAISE EXCEPTION 'Changement d''étape impossible depuis « % »', coalesce(v_from, '(aucun)') USING ERRCODE = 'VL001';
      END IF;
      v_to := p_to_stage;
      v_summary := 'Étape : ' || coalesce(v_from, '(aucune)') || ' → ' || v_to;

    WHEN 'pause' THEN
      IF v_from IS NULL OR NOT (v_from = ANY (c_in_progress)) THEN
        RAISE EXCEPTION 'Mise en pause impossible depuis « % »', coalesce(v_from, '(aucun)') USING ERRCODE = 'VL001';
      END IF;
      v_to := 'on_hold';
      v_summary := 'Mis en pause';

    WHEN 'resume' THEN
      IF v_from IS DISTINCT FROM 'on_hold' THEN
        RAISE EXCEPTION 'Reprise impossible : le produit n''est pas en pause' USING ERRCODE = 'VL001';
      END IF;
      IF p_to_stage IS NOT NULL THEN
        IF NOT (p_to_stage = ANY (c_stages)) THEN
          RAISE EXCEPTION 'Étape inconnue : %', p_to_stage USING ERRCODE = 'VL003';
        END IF;
        v_to := p_to_stage;
      ELSE
        -- Revenir à l'étape d'avant la pause, lue dans le journal
        SELECT sc.from_status
          INTO v_to
          FROM sourcing_communications sc
         WHERE sc.product_id = p_product_id
           AND sc.entry_type = 'status_change'
           AND sc.to_status = 'on_hold'
           AND sc.from_status IS DISTINCT FROM 'on_hold'
         ORDER BY sc.communicated_at DESC, sc.created_at DESC
         LIMIT 1;
        IF v_to IS NULL OR NOT (v_to = ANY (c_in_progress)) THEN
          v_to := 'supplier_search';
        END IF;
      END IF;
      v_summary := 'Reprise : ' || v_to;

    WHEN 'refuse' THEN
      IF v_reason IS NULL THEN
        RAISE EXCEPTION 'Motif obligatoire pour refuser' USING ERRCODE = 'VL002';
      END IF;
      IF v_from IS NULL OR NOT (v_from = ANY (c_in_progress || ARRAY['on_hold'])) THEN
        RAISE EXCEPTION 'Refus impossible depuis « % »', coalesce(v_from, '(aucun)') USING ERRCODE = 'VL001';
      END IF;
      v_to := 'refused';
      v_summary := 'Refusé : ' || v_reason;

    WHEN 'reopen' THEN
      -- DELTA B : 'archived' rejoint les statuts réouvrables. Un produit à ce
      -- statut s'affichait « Refusé » sans qu'aucune action ne puisse le sortir
      -- de là, ni à l'écran ni en base.
      IF v_from IS NULL OR NOT (v_from = ANY (ARRAY['refused', 'cancelled', 'archived'])) THEN
        RAISE EXCEPTION 'Réouverture impossible depuis « % »', coalesce(v_from, '(aucun)') USING ERRCODE = 'VL001';
      END IF;
      IF p_to_stage IS NOT NULL AND NOT (p_to_stage = ANY (c_stages)) THEN
        RAISE EXCEPTION 'Étape inconnue : %', p_to_stage USING ERRCODE = 'VL003';
      END IF;
      v_to := coalesce(p_to_stage, 'supplier_search');
      v_summary := 'Réouvert : ' || v_to;

    WHEN 'validate' THEN
      IF v_from IS NULL OR NOT (v_from = ANY (c_in_progress)) THEN
        RAISE EXCEPTION 'Validation impossible depuis « % »', coalesce(v_from, '(aucun)') USING ERRCODE = 'VL001';
      END IF;
      -- DELTA C : les deux contrôles fournisseur / prix d'achat sont remplacés
      -- par la règle unique. Le détail de l'erreur porte la liste des clés
      -- manquantes, que l'écran retraduit en libellés.
      v_missing := sourcing_missing_fields(p_product_id, 'catalogue');
      IF array_length(v_missing, 1) IS NOT NULL THEN
        RAISE EXCEPTION 'Champs obligatoires manquants avant la validation au catalogue'
          USING ERRCODE = 'VL004',
                DETAIL = array_to_string(v_missing, ','),
                HINT = 'Compléter la fiche produit puis réessayer';
      END IF;
      v_to := 'validated';
      v_summary := 'Validé au catalogue';

    WHEN 'withdraw' THEN
      IF v_reason IS NULL THEN
        RAISE EXCEPTION 'Motif obligatoire pour retirer' USING ERRCODE = 'VL002';
      END IF;
      IF v_product.archived_at IS NOT NULL THEN
        RAISE EXCEPTION 'Produit déjà retiré' USING ERRCODE = 'VL001';
      END IF;
      v_archived_at := now();
      v_summary := 'Retiré : ' || v_reason;

    WHEN 'restore' THEN
      IF v_product.archived_at IS NULL THEN
        RAISE EXCEPTION 'Produit non retiré' USING ERRCODE = 'VL001';
      END IF;
      v_archived_at := NULL;
      v_summary := 'Restauré';

    ELSE
      RAISE EXCEPTION 'Action inconnue : %', coalesce(p_action, '(vide)') USING ERRCODE = 'VL003';
  END CASE;

  IF v_reason IS NOT NULL AND p_action NOT IN ('refuse', 'withdraw') THEN
    v_summary := v_summary || ' — ' || v_reason;
  END IF;

  IF p_action IN ('withdraw', 'restore') THEN
    -- Retrait / restauration : seule la date de retrait change
    UPDATE products SET archived_at = v_archived_at WHERE id = p_product_id;
    v_journal_to := CASE p_action WHEN 'withdraw' THEN 'withdrawn' ELSE 'restored' END;
  ELSIF p_action = 'validate' THEN
    -- Validation : le produit rejoint le catalogue (brouillon, product_status
    -- inchangé). Aucune colonne de stock écrite.
    UPDATE products
       SET sourcing_status = v_to,
           creation_mode = 'complete'
     WHERE id = p_product_id;
    v_journal_to := v_to;
  ELSE
    -- Seul le statut sourcing change (aucune colonne de stock, creation_mode inchangé)
    UPDATE products SET sourcing_status = v_to WHERE id = p_product_id;
    v_journal_to := v_to;
  END IF;

  INSERT INTO sourcing_communications (
    product_id, supplier_id, entry_type, from_status, to_status,
    summary, logged_by, communicated_at
  ) VALUES (
    p_product_id, v_product.supplier_id, 'status_change', v_from, v_journal_to,
    v_summary, auth.uid(), now()
  )
  RETURNING id INTO v_communication_id;

  RETURN jsonb_build_object(
    'product_id', p_product_id,
    'action', p_action,
    'from_status', v_from,
    'sourcing_status', v_to,
    'archived_at', v_archived_at,
    'communication_id', v_communication_id
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.apply_product_lifecycle_action(uuid, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_product_lifecycle_action(uuid, text, text, text)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) Commande d'échantillon branchée sur la même règle
--    Corps recopié depuis 20260913190100_bo_sourcing_p3_sample_order_guard.sql.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.request_sample_order(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_product record;
  v_active record;
  v_order_id uuid;
  v_order_number text;
  v_order_created boolean := false;
  v_item_id uuid;
  v_missing text[];                                    -- DELTA A
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

  -- DELTA B : les deux contrôles fournisseur / prix d'achat sont remplacés par
  -- la règle unique, portée « sample ».
  v_missing := sourcing_missing_fields(p_product_id, 'sample');
  IF array_length(v_missing, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'Champs obligatoires manquants avant la commande d''échantillon'
      USING ERRCODE = 'VS002',
            DETAIL = array_to_string(v_missing, ','),
            HINT = 'Compléter la fiche produit puis réessayer';
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
$function$;

REVOKE EXECUTE ON FUNCTION public.request_sample_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_sample_order(uuid)
  TO authenticated, service_role;

COMMIT;

-- ---------------------------------------------------------------------------
-- RETOUR ARRIÈRE
--   Ré-exécuter tels quels :
--     supabase/migrations/20260913220000_bo_sourcing_p4_validate_to_catalogue.sql
--     supabase/migrations/20260913190100_bo_sourcing_p3_sample_order_guard.sql
--   puis :
--     DROP FUNCTION public.sourcing_missing_fields(uuid, text);
-- ---------------------------------------------------------------------------
