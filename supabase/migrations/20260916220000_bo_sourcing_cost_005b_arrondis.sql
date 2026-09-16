-- [BO-SOURCING-COST-005] Répartition des frais : le centime doit retomber.
--
-- `20260916210000` a corrigé le rapport de répartition, mais chaque part reste
-- arrondie pour elle-même : `ROUND(frais × rapport, 2)` ligne par ligne. La
-- somme des parts peut donc manquer le total des frais de quelques centimes
-- (jusqu'à ±0,005 € par ligne, soit ±0,11 € sur les 23 lignes de la plus grosse
-- commande, et ce pour chacun des trois postes). Trois lignes à un tiers chacune
-- de 100 € de transport donnent 33,33 × 3 = 99,99 € : un centime s'évapore.
--
-- Correction : chaque ligne reçoit la DIFFÉRENCE entre deux cumuls arrondis,
-- pris dans un ordre stable (l'identifiant de la ligne) :
--
--   part(ligne) = ROUND(frais × cumul_jusquà_cette_ligne_incluse,  2)
--               - ROUND(frais × cumul_jusquà_cette_ligne_exclue,   2)
--
-- Les termes se télescopent : la somme des parts vaut exactement
-- `ROUND(frais × 1, 2)`, donc les frais de la commande, au centime. Sur
-- l'exemple ci-dessus : 33,33 + 33,34 + 33,33 = 100,00 €.
--
-- La méthode ne vaut que si toutes les lignes sont recalculées avec le même
-- total et le même ordre : c'est ce que garantit `realign_po_fee_allocation`,
-- posé par la migration précédente.
--
-- Append-only. Aucun déclencheur de stock touché. Aucune route Qonto touchée.
-- Aucune donnée corrigée ici : le rattrapage des lignes existantes est fait
-- séparément, par réécriture sans changement de valeur, après accord de Roméo.

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.allocate_po_fees_and_calculate_unit_cost()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_po              RECORD;
  v_others_ht       NUMERIC;  -- toutes les autres lignes actives
  v_before_ht       NUMERIC;  -- celles qui précèdent, dans l'ordre des id
  v_line_ht         NUMERIC;
  v_total_ht        NUMERIC;
  v_unit_price_net  NUMERIC;
  v_cut_before      NUMERIC;
  v_cut_after       NUMERIC;
BEGIN
  -- Prix réellement payé par unité : la remise fait partie du coût.
  v_unit_price_net :=
    NEW.unit_price_ht * (1 - COALESCE(NEW.discount_percentage, 0) / 100);

  -- Une ligne retirée ne porte aucun frais.
  IF NEW.archived_at IS NOT NULL THEN
    NEW.allocated_shipping_ht  := 0;
    NEW.allocated_customs_ht   := 0;
    NEW.allocated_insurance_ht := 0;
    NEW.unit_cost_net := ROUND(v_unit_price_net + COALESCE(NEW.eco_tax, 0), 4);
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(shipping_cost_ht, 0)  AS shipping,
    COALESCE(customs_cost_ht, 0)   AS customs,
    COALESCE(insurance_cost_ht, 0) AS insurance
  INTO v_po
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  IF v_po.shipping = 0 AND v_po.customs = 0 AND v_po.insurance = 0 THEN
    NEW.allocated_shipping_ht  := 0;
    NEW.allocated_customs_ht   := 0;
    NEW.allocated_insurance_ht := 0;
    NEW.unit_cost_net := ROUND(v_unit_price_net + COALESCE(NEW.eco_tax, 0), 4);
    RETURN NEW;
  END IF;

  -- Les autres lignes actives, et parmi elles celles qui précèdent la nôtre.
  -- Exclure `NEW.id` couvre l'UPDATE (la table porte encore l'ancienne valeur)
  -- sans gêner l'INSERT (la ligne n'y est pas encore).
  SELECT
    COALESCE(SUM(quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)), 0),
    COALESCE(SUM(quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100))
             FILTER (WHERE id < NEW.id), 0)
  INTO v_others_ht, v_before_ht
  FROM purchase_order_items
  WHERE purchase_order_id = NEW.purchase_order_id
    AND id <> NEW.id
    AND archived_at IS NULL;

  v_line_ht  := NEW.quantity * v_unit_price_net;
  v_total_ht := v_others_ht + v_line_ht;

  IF v_total_ht > 0 THEN
    v_cut_before := v_before_ht / v_total_ht;
    v_cut_after  := (v_before_ht + v_line_ht) / v_total_ht;

    NEW.allocated_shipping_ht :=
      ROUND(v_po.shipping * v_cut_after, 2) - ROUND(v_po.shipping * v_cut_before, 2);
    NEW.allocated_customs_ht :=
      ROUND(v_po.customs * v_cut_after, 2) - ROUND(v_po.customs * v_cut_before, 2);
    NEW.allocated_insurance_ht :=
      ROUND(v_po.insurance * v_cut_after, 2) - ROUND(v_po.insurance * v_cut_before, 2);

    NEW.unit_cost_net := ROUND(
      v_unit_price_net
      + COALESCE(NEW.eco_tax, 0)
      + (NEW.allocated_shipping_ht + NEW.allocated_customs_ht + NEW.allocated_insurance_ht)
        / GREATEST(NEW.quantity, 1),
      4
    );
  ELSE
    NEW.allocated_shipping_ht  := 0;
    NEW.allocated_customs_ht   := 0;
    NEW.allocated_insurance_ht := 0;
    NEW.unit_cost_net := ROUND(v_unit_price_net + COALESCE(NEW.eco_tax, 0), 4);
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.allocate_po_fees_and_calculate_unit_cost() IS
  'Répartit les frais de la commande sur la ligne au prorata de sa valeur remisée, et en déduit le coût net unitaire (BO-SOURCING-COST-005). La part est la différence de deux cumuls arrondis, pris dans l''ordre des identifiants : la somme des parts retombe exactement sur les frais de la commande. Le total des articles exclut la ligne en cours puis lui rajoute sa valeur NEW, donc le calcul est juste en INSERT comme en UPDATE. Une ligne archivée ne porte aucun frais.';

REVOKE EXECUTE ON FUNCTION public.allocate_po_fees_and_calculate_unit_cost()
  FROM PUBLIC, anon, authenticated;

COMMIT;

-- ---------------------------------------------------------------------------
-- RETOUR ARRIÈRE
--   Rejouer la définition de `allocate_po_fees_and_calculate_unit_cost` du
--   fichier 20260916210000_bo_sourcing_cost_005_repartition_frais.sql, puis
--   réécrire les lignes sans changement de valeur pour que les parts soient
--   recalculées :
--     UPDATE purchase_order_items SET quantity = quantity WHERE archived_at IS NULL;
-- ---------------------------------------------------------------------------
