-- [BO-SOURCING-OFFRES-004] Comparatif d'offres fournisseurs et adoption d'une offre.
--
-- Contexte : `sourcing_candidate_suppliers` porte déjà le prix, la quantité
-- minimale et le délai annoncés par chaque fournisseur, mais pas les frais.
-- Comparer deux offres revenait donc à comparer un prix départ usine et un prix
-- livré. Et rien ne permettait de « retenir » une offre : le fournisseur et le
-- prix d'achat du produit devaient être recopiés à la main.
--
-- Cette migration :
--   1. ajoute 4 colonnes FACULTATIVES aux offres (transport, douane, devise,
--      portée des frais) — le plugin Chrome, qui n'insère que product_id,
--      supplier_id et le statut, continue de fonctionner sans changement ;
--   2. aligne la devise par défaut de l'historique de prix sur l'euro
--      (elle était en dollars, incohérente avec le reste du back-office) ;
--   3. ajoute `adopt_sourcing_offer` : retenir une offre écrit le fournisseur
--      et le prix d'achat du produit, passe l'offre en « retenue », et
--      journalise — le tout dans une seule transaction.
--
-- Append-only. Aucun déclencheur de stock touché. Aucune route Qonto touchée.
-- Aucune donnée existante modifiée (les 5 offres en base gardent leurs valeurs,
-- les nouvelles colonnes naissent à NULL ou à leur défaut).

BEGIN;

SET LOCAL lock_timeout = '5s';

-- ---------------------------------------------------------------------------
-- 1) Frais annoncés par le fournisseur sur une offre non encore commandée
-- ---------------------------------------------------------------------------

ALTER TABLE public.sourcing_candidate_suppliers
  ADD COLUMN IF NOT EXISTS quoted_shipping_ht numeric(10, 2),
  ADD COLUMN IF NOT EXISTS quoted_customs_ht  numeric(10, 2),
  ADD COLUMN IF NOT EXISTS quoted_currency    text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS shipping_scope     text NOT NULL DEFAULT 'per_order';

ALTER TABLE public.sourcing_candidate_suppliers
  ADD CONSTRAINT sourcing_candidate_suppliers_quoted_shipping_check
    CHECK (quoted_shipping_ht IS NULL OR quoted_shipping_ht >= 0),
  ADD CONSTRAINT sourcing_candidate_suppliers_quoted_customs_check
    CHECK (quoted_customs_ht IS NULL OR quoted_customs_ht >= 0),
  ADD CONSTRAINT sourcing_candidate_suppliers_quoted_currency_check
    CHECK (quoted_currency ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT sourcing_candidate_suppliers_shipping_scope_check
    CHECK (shipping_scope IN ('per_order', 'per_unit'));

COMMENT ON COLUMN public.sourcing_candidate_suppliers.quoted_shipping_ht IS
  'Transport annoncé par le fournisseur pour cette offre, HT (BO-SOURCING-OFFRES-004). `shipping_scope` dit si le montant vaut pour le lot (quoted_moq) ou par unité.';
COMMENT ON COLUMN public.sourcing_candidate_suppliers.quoted_customs_ht IS
  'Douane annoncée pour cette offre, HT (BO-SOURCING-OFFRES-004).';
COMMENT ON COLUMN public.sourcing_candidate_suppliers.shipping_scope IS
  'Portée des frais annoncés : per_order (pour le lot) ou per_unit (par unité).';

-- ---------------------------------------------------------------------------
-- 2) Devise par défaut de l'historique de prix : euro, comme partout ailleurs
-- ---------------------------------------------------------------------------

ALTER TABLE public.sourcing_price_history
  ALTER COLUMN currency SET DEFAULT 'EUR';

-- ---------------------------------------------------------------------------
-- 3) Retenir une offre
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.adopt_sourcing_offer(
  p_product_id   uuid,
  p_candidate_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_candidate record;
  v_from text;
  v_communication_id uuid;
BEGIN
  IF NOT is_backoffice_user() THEN
    RAISE EXCEPTION 'Action réservée au back-office' USING ERRCODE = '42501';
  END IF;

  SELECT c.id, c.supplier_id, c.quoted_price, c.quoted_moq, c.quoted_currency
    INTO v_candidate
    FROM sourcing_candidate_suppliers c
   WHERE c.id = p_candidate_id
     AND c.product_id = p_product_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offre introuvable pour ce produit' USING ERRCODE = 'P0002';
  END IF;

  IF coalesce(v_candidate.quoted_price, 0) <= 0 THEN
    RAISE EXCEPTION 'Cette offre n''a pas de prix : renseignez-le avant de la retenir'
      USING ERRCODE = 'VO001';
  END IF;

  SELECT sourcing_status INTO v_from
    FROM products WHERE id = p_product_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable' USING ERRCODE = 'P0002';
  END IF;

  -- Le produit prend le fournisseur et le prix de l'offre retenue.
  -- Aucune colonne de stock, aucun statut de cycle de vie n'est touché ici :
  -- l'étape se change par apply_product_lifecycle_action, séparément.
  UPDATE products
     SET supplier_id  = v_candidate.supplier_id,
         cost_price   = v_candidate.quoted_price,
         supplier_moq = coalesce(v_candidate.quoted_moq, supplier_moq)
   WHERE id = p_product_id;

  -- Une seule offre retenue à la fois : les autres redescendent en
  -- présélection, sans jamais écraser un refus déjà prononcé.
  UPDATE sourcing_candidate_suppliers
     SET status = 'shortlisted'
   WHERE product_id = p_product_id
     AND id <> p_candidate_id
     AND status = 'selected';

  UPDATE sourcing_candidate_suppliers
     SET status = 'selected',
         response_date = coalesce(response_date, now())
   WHERE id = p_candidate_id;

  INSERT INTO sourcing_price_history (
    product_id, supplier_id, price, currency, quantity, proposed_by, notes
  ) VALUES (
    p_product_id, v_candidate.supplier_id, v_candidate.quoted_price,
    v_candidate.quoted_currency, v_candidate.quoted_moq, 'supplier',
    'Offre retenue'
  );

  INSERT INTO sourcing_communications (
    product_id, supplier_id, entry_type, from_status, to_status,
    summary, logged_by, communicated_at
  ) VALUES (
    p_product_id, v_candidate.supplier_id, 'note', v_from, v_from,
    'Offre retenue : ' || to_char(v_candidate.quoted_price, 'FM999999990.00')
      || ' ' || v_candidate.quoted_currency,
    auth.uid(), now()
  )
  RETURNING id INTO v_communication_id;

  RETURN jsonb_build_object(
    'product_id', p_product_id,
    'candidate_id', p_candidate_id,
    'supplier_id', v_candidate.supplier_id,
    'cost_price', v_candidate.quoted_price,
    'communication_id', v_communication_id
  );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.adopt_sourcing_offer(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adopt_sourcing_offer(uuid, uuid)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.adopt_sourcing_offer(uuid, uuid) IS
  'Retient une offre fournisseur (BO-SOURCING-OFFRES-004) : écrit supplier_id, cost_price et supplier_moq du produit, passe l''offre en selected (les autres selected redescendent en shortlisted), enregistre le prix et une entrée de journal. N''écrit aucune colonne de stock et ne change pas l''étape de sourcing.';

COMMIT;

-- ---------------------------------------------------------------------------
-- RETOUR ARRIÈRE
--   DROP FUNCTION public.adopt_sourcing_offer(uuid, uuid);
--   ALTER TABLE public.sourcing_price_history ALTER COLUMN currency SET DEFAULT 'USD';
--   ALTER TABLE public.sourcing_candidate_suppliers
--     DROP CONSTRAINT sourcing_candidate_suppliers_shipping_scope_check,
--     DROP CONSTRAINT sourcing_candidate_suppliers_quoted_currency_check,
--     DROP CONSTRAINT sourcing_candidate_suppliers_quoted_customs_check,
--     DROP CONSTRAINT sourcing_candidate_suppliers_quoted_shipping_check,
--     DROP COLUMN shipping_scope,
--     DROP COLUMN quoted_currency,
--     DROP COLUMN quoted_customs_ht,
--     DROP COLUMN quoted_shipping_ht;
-- ---------------------------------------------------------------------------
