-- =====================================================================
-- [BO-SOURCING-P4-001] « Valider au catalogue » : le produit rejoint le catalogue
-- =====================================================================
-- Décision de Roméo du 2026-09-13 (soir) : un produit validé au sourcing
-- rejoint le catalogue en brouillon non publié et sort de la liste sourcing.
--
-- Seul changement par rapport à 20260913190000 (P3) : l'action 'validate' écrit
-- sourcing_status = 'validated' ET creation_mode = 'complete'.
--   - product_status inchangé (le produit reste en brouillon, non publié) ;
--   - aucune colonne de stock écrite (règle stock-triggers-protected) ;
--   - mêmes gardes : statut en cours, fournisseur lié, prix d'achat > 0 ;
--   - toutes les autres actions strictement identiques.
-- Aucun déclencheur de products ne lit creation_mode ni sourcing_status
-- (vérifié le 2026-09-13 sur les 17 déclencheurs de la table).
--
-- Application : via execute_sql après accord écrit de Roméo, jamais
-- `supabase db push` ; inscription au carnet ; types inchangés (même signature).
-- Codes d'erreur inchangés : 42501 · P0002 · VL001 · VL002 · VL003 · VL004.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.apply_product_lifecycle_action(
  p_product_id uuid,
  p_action text,
  p_to_stage text DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
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
      IF v_from IS NULL OR NOT (v_from = ANY (ARRAY['refused', 'cancelled'])) THEN
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
      IF v_product.supplier_id IS NULL THEN
        RAISE EXCEPTION 'Un fournisseur doit être lié avant la validation' USING ERRCODE = 'VL004';
      END IF;
      IF coalesce(v_product.cost_price, 0) <= 0 THEN
        RAISE EXCEPTION 'Le prix d''achat doit être supérieur à 0 avant la validation' USING ERRCODE = 'VL004';
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
$fn$;

REVOKE EXECUTE ON FUNCTION public.apply_product_lifecycle_action(uuid, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_product_lifecycle_action(uuid, text, text, text)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.apply_product_lifecycle_action(uuid, text, text, text) IS
  'Seule porte d''entrée du cycle de vie sourcing (BO-SOURCING-P3-001, P4-001) : set_stage | pause | resume | refuse | reopen | validate | withdraw | restore. Journal status_change dans la même transaction. validate fait rejoindre le catalogue (creation_mode complete, product_status inchangé) et n''écrit aucune colonne de stock.';

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (sur décision de Roméo) : ré-exécuter le bloc 3 de
-- 20260913190000_bo_sourcing_p3_cycle_de_vie.sql en remplaçant
-- « CREATE FUNCTION » par « CREATE OR REPLACE FUNCTION ». Les produits déjà
-- validés restent au catalogue (aucune correction automatique de données).
-- ---------------------------------------------------------------------
