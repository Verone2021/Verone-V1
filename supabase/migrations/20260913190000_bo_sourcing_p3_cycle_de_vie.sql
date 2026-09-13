-- =====================================================================
-- [BO-SOURCING-P3-001] Cycle de vie sourcing : statuts, journal, fonction unique
-- =====================================================================
-- Programme 2026-09-12 ligne A9 (P3) ; rapport 2026-09-11 § 8.1 ; audit sourcing
-- 2026-09-12 § 2, Q2, § 5, § 6, § 7 (décisions D1-D8 tranchées).
--
-- EXPANSION SEULEMENT (staging et production partagent la base) : rien n'est
-- retiré, aucune donnée n'est réécrite. Le rattrapage des anciens statuts et le
-- resserrement des contraintes sont la phase P6 (contraction), après mise en
-- ligne de P3-P5.
--
--   1. products.sourcing_status : CHECK sur-ensemble = 13 valeurs actuelles +
--      'refused' + 'validated'. Le plugin Chrome continue d'écrire
--      'supplier_search' (contrat du rapport 11/09 § 5, inchangé).
--   2. sourcing_communications devient le journal unique : entry_type
--      (exchange | note | status_change), from_status, to_status. channel et
--      direction restent obligatoires pour un échange, facultatifs pour une
--      note ou un changement de statut.
--   3. apply_product_lifecycle_action : SECURITY INVOKER (RLS appliquée), garde
--      is_backoffice_user(), verrou de ligne sur le produit, transitions
--      autorisées seulement, entrée de journal dans la même transaction.
--      'validate' n'écrit AUCUNE colonne de stock et ne change pas creation_mode.
--
-- Aucun déclencheur modifié (règle stock-triggers-protected). Volumes au
-- 2026-09-13 : products 236, sourcing_communications 0.
--
-- Application : via execute_sql après accord écrit de Roméo (« OK P3 »),
-- jamais `supabase db push` ; inscription au carnet ; types régénérés dans la
-- même PR ; import plugin 200 puis 409 vérifié après application.
-- Codes d'erreur : 42501 accès refusé · P0002 produit introuvable ·
-- VL001 transition interdite · VL002 motif obligatoire · VL003 action ou étape
-- inconnue · VL004 fournisseur ou prix d'achat manquant pour valider.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- 1. Statuts sourcing (sur-ensemble) --------------------------------------
ALTER TABLE public.products
  DROP CONSTRAINT products_sourcing_status_check,
  ADD CONSTRAINT products_sourcing_status_check
    CHECK ((sourcing_status IS NULL) OR (sourcing_status = ANY (ARRAY[
      'need_identified'::text, 'supplier_search'::text, 'initial_contact'::text,
      'evaluation'::text, 'negotiation'::text, 'sample_requested'::text,
      'sample_received'::text, 'sample_approved'::text, 'order_placed'::text,
      'received'::text, 'on_hold'::text, 'cancelled'::text, 'archived'::text,
      'refused'::text, 'validated'::text
    ])));

-- 2. Journal ----------------------------------------------------------------
ALTER TABLE public.sourcing_communications
  ADD COLUMN entry_type text NOT NULL DEFAULT 'exchange'
    CONSTRAINT sourcing_communications_entry_type_check
      CHECK (entry_type IN ('exchange', 'note', 'status_change')),
  ADD COLUMN from_status text NULL,
  ADD COLUMN to_status text NULL,
  ALTER COLUMN channel DROP NOT NULL,
  ALTER COLUMN direction DROP NOT NULL;

ALTER TABLE public.sourcing_communications
  ADD CONSTRAINT sourcing_communications_exchange_fields_check
    CHECK (entry_type <> 'exchange' OR (channel IS NOT NULL AND direction IS NOT NULL)),
  ADD CONSTRAINT sourcing_communications_status_change_fields_check
    CHECK (entry_type <> 'status_change' OR to_status IS NOT NULL);

-- 3. Fonction unique de cycle de vie ---------------------------------------
CREATE FUNCTION public.apply_product_lifecycle_action(
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

-- 4. Documentation ------------------------------------------------------------
COMMENT ON FUNCTION public.apply_product_lifecycle_action(uuid, text, text, text) IS
  'Seule porte d''entrée du cycle de vie sourcing (BO-SOURCING-P3-001) : set_stage | pause | resume | refuse | reopen | validate | withdraw | restore. Journal status_change dans la même transaction. validate n''écrit aucune colonne de stock.';
COMMENT ON COLUMN public.sourcing_communications.entry_type IS
  'exchange = échange avec le fournisseur (canal et sens obligatoires) · note = note interne · status_change = écrit par apply_product_lifecycle_action (BO-SOURCING-P3-001).';
COMMENT ON COLUMN public.sourcing_communications.to_status IS
  'Statut sourcing après le changement ; withdrawn / restored pour un retrait ou une restauration (BO-SOURCING-P3-001).';

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (à n'exécuter que sur décision de Roméo) :
-- les produits en 'refused' / 'validated' et les entrées note / status_change
-- doivent d'abord être traités (décision métier : aucune suppression automatique).
-- ---------------------------------------------------------------------
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
-- DROP FUNCTION public.apply_product_lifecycle_action(uuid, text, text, text);
-- ALTER TABLE public.sourcing_communications
--   DROP CONSTRAINT sourcing_communications_status_change_fields_check,
--   DROP CONSTRAINT sourcing_communications_exchange_fields_check;
-- ALTER TABLE public.sourcing_communications
--   ALTER COLUMN channel SET NOT NULL,      -- échoue tant qu'une note / un changement de statut existe
--   ALTER COLUMN direction SET NOT NULL,
--   DROP COLUMN to_status,
--   DROP COLUMN from_status,
--   DROP COLUMN entry_type;
-- ALTER TABLE public.products
--   DROP CONSTRAINT products_sourcing_status_check,
--   ADD CONSTRAINT products_sourcing_status_check
--     CHECK ((sourcing_status IS NULL) OR (sourcing_status = ANY (ARRAY[
--       'need_identified'::text, 'supplier_search'::text, 'initial_contact'::text,
--       'evaluation'::text, 'negotiation'::text, 'sample_requested'::text,
--       'sample_received'::text, 'sample_approved'::text, 'order_placed'::text,
--       'received'::text, 'on_hold'::text, 'cancelled'::text, 'archived'::text
--     ])));                                  -- échoue tant qu'un produit est en refused / validated
-- COMMIT;
