-- [BO-SOURCING-COST-005] Répartition des frais fournisseur : corriger le calcul.
--
-- Trois défauts corrigés, tous constatés sur des données réelles le 2026-09-16.
--
-- 1. LIGNE MODIFIÉE = FRAIS PERDUS. `allocate_po_fees_and_calculate_unit_cost`
--    calcule le total des articles en sommant la table, puis n'ajoute `NEW` qu'en
--    INSERT. Sur un UPDATE, la somme contient donc l'ANCIENNE valeur de la ligne
--    en cours, et le rapport est faux dès qu'on corrige un prix ou une quantité.
--    Constat : 5 commandes réceptionnées, jusqu'à 487,41 € de transport imputés à
--    rien (PLN-0001 : 18,58 € enregistrés contre 20,53 € réels, soit -10 %).
--    Correction : la somme exclut la ligne en cours (`id <> NEW.id`) et lui ajoute
--    sa valeur NEW. Une seule écriture, juste en INSERT comme en UPDATE.
--
-- 2. LES AUTRES LIGNES NE SUIVENT PAS. Le déclencheur est `FOR EACH ROW` et
--    n'écrit que `NEW` : ajouter, modifier ou retirer une ligne laisse les autres
--    sur leur ancienne part. La somme des frais répartis ne fait alors plus le
--    total des frais. Rendu courant par la commande d'échantillons groupée
--    (`request_sample_order` empile plusieurs produits dans la même commande).
--    Correction : un déclencheur AFTER réaligne les autres lignes de la commande.
--
-- 3. REMISE IGNORÉE. `unit_cost_net` part de `unit_price_ht` brut alors que le
--    rapport de répartition, lui, utilise le prix remisé. Constat : 3 vases remisés
--    de 16 à 23 % portent 9,00 € et 12,00 € au lieu de 7,50 € et 9,95 €.
--    Correction : le coût part du prix réellement payé.
--
-- Ce que cette migration NE fait PAS :
--   - aucun déclencheur de stock touché. `handle_po_item_quantity_change_confirmed`
--     (protégé) ne réagit qu'à un écart de quantité et seulement sur une commande
--     `validated`/`partially_received` ; les écritures ci-dessous laissent toute
--     quantité inchangée.
--   - aucune donnée corrigée ici. Le rattrapage des lignes déjà fausses est fait
--     séparément, après accord de Roméo, en réécrivant les lignes pour que les
--     déclencheurs officiels recalculent (jamais d'écriture directe d'un coût).
--   - `archived_at` n'est pas ajouté à `recalculate_purchase_order_totals` : même
--     incohérence, mais elle change des totaux de commandes ; aucune ligne archivée
--     n'existe aujourd'hui, c'est traité à part.
--
-- Append-only. Aucune route Qonto touchée.

BEGIN;

SET LOCAL lock_timeout = '5s';

-- ---------------------------------------------------------------------------
-- 1) Le calcul d'une ligne
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.allocate_po_fees_and_calculate_unit_cost()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_po              RECORD;
  v_total_items_ht  NUMERIC;
  v_line_ht         NUMERIC;
  v_unit_price_net  NUMERIC;
  v_ratio           NUMERIC;
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

  -- Total des articles = les AUTRES lignes encore actives, plus celle-ci dans sa
  -- valeur NEW. Exclure `NEW.id` couvre l'UPDATE (la table porte encore l'ancienne
  -- valeur) sans gêner l'INSERT (la ligne n'y est pas encore).
  SELECT COALESCE(SUM(
    quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
  ), 0)
  INTO v_total_items_ht
  FROM purchase_order_items
  WHERE purchase_order_id = NEW.purchase_order_id
    AND id <> NEW.id
    AND archived_at IS NULL;

  v_line_ht := NEW.quantity * v_unit_price_net;
  v_total_items_ht := v_total_items_ht + v_line_ht;

  IF v_total_items_ht > 0 THEN
    v_ratio := v_line_ht / v_total_items_ht;

    NEW.allocated_shipping_ht  := ROUND(v_po.shipping  * v_ratio, 2);
    NEW.allocated_customs_ht   := ROUND(v_po.customs   * v_ratio, 2);
    NEW.allocated_insurance_ht := ROUND(v_po.insurance * v_ratio, 2);

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
  'Répartit les frais de la commande sur la ligne au prorata de sa valeur remisée, et en déduit le coût net unitaire (BO-SOURCING-COST-005). Le total des articles exclut la ligne en cours puis lui rajoute sa valeur NEW : juste en INSERT comme en UPDATE. Une ligne archivée ne porte aucun frais.';

-- ---------------------------------------------------------------------------
-- 2) Réaligner les autres lignes de la commande
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.realign_po_fee_allocation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_po_id   uuid;
  v_item_id uuid;
  v_fees    NUMERIC;
BEGIN
  -- Le réalignement réécrit des lignes, ce qui rappellerait ce déclencheur :
  -- le drapeau de session coupe la récursion. `true` = valable pour la
  -- transaction en cours seulement.
  IF COALESCE(current_setting('verone.realigning_po_fees', true), 'off') = 'on' THEN
    RETURN NULL;
  END IF;

  -- Rien de pertinent n'a changé : la part des autres lignes est inchangée.
  IF TG_OP = 'UPDATE'
     AND NEW.quantity            IS NOT DISTINCT FROM OLD.quantity
     AND NEW.unit_price_ht       IS NOT DISTINCT FROM OLD.unit_price_ht
     AND NEW.discount_percentage IS NOT DISTINCT FROM OLD.discount_percentage
     AND NEW.archived_at         IS NOT DISTINCT FROM OLD.archived_at THEN
    RETURN NULL;
  END IF;

  v_po_id   := COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  v_item_id := COALESCE(NEW.id, OLD.id);

  IF v_po_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Sans frais, il n'y a rien à répartir : on épargne la réécriture des autres
  -- lignes (la majorité des commandes sont dans ce cas).
  SELECT COALESCE(shipping_cost_ht, 0)
       + COALESCE(customs_cost_ht, 0)
       + COALESCE(insurance_cost_ht, 0)
    INTO v_fees
    FROM purchase_orders
   WHERE id = v_po_id;

  IF COALESCE(v_fees, 0) = 0 THEN
    RETURN NULL;
  END IF;

  PERFORM set_config('verone.realigning_po_fees', 'on', true);

  -- Réécriture sans changement de valeur : le déclencheur BEFORE recalcule la
  -- part de chaque ligne. Aucune quantité ni aucun prix n'est modifié, donc
  -- aucun déclencheur de stock ne bouge.
  UPDATE purchase_order_items
     SET quantity = quantity
   WHERE purchase_order_id = v_po_id
     AND id <> v_item_id
     AND archived_at IS NULL;

  PERFORM set_config('verone.realigning_po_fees', 'off', true);

  RETURN NULL;
END;
$function$;

COMMENT ON FUNCTION public.realign_po_fee_allocation() IS
  'Après ajout, modification ou retrait d''une ligne de commande fournisseur, recalcule la part de frais des autres lignes (BO-SOURCING-COST-005). Sans cela, la somme des frais répartis ne fait plus le total des frais de la commande. Protégé contre la récursion par le drapeau de session verone.realigning_po_fees.';

DROP TRIGGER IF EXISTS trigger_realign_po_fees ON public.purchase_order_items;
CREATE TRIGGER trigger_realign_po_fees
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.realign_po_fee_allocation();

REVOKE EXECUTE ON FUNCTION public.realign_po_fee_allocation()
  FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Changement de frais sur la commande : une seule formule
-- ---------------------------------------------------------------------------
-- `reallocate_po_fees_on_charges_change` réécrivait la formule à la main, en
-- boucle. Elle délègue désormais au déclencheur de ligne : une seule formule à
-- maintenir, plus de divergence possible.

CREATE OR REPLACE FUNCTION public.reallocate_po_fees_on_charges_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.shipping_cost_ht  IS NOT DISTINCT FROM OLD.shipping_cost_ht
 AND NEW.customs_cost_ht   IS NOT DISTINCT FROM OLD.customs_cost_ht
 AND NEW.insurance_cost_ht IS NOT DISTINCT FROM OLD.insurance_cost_ht THEN
    RETURN NEW;
  END IF;

  PERFORM set_config('verone.realigning_po_fees', 'on', true);

  UPDATE purchase_order_items
     SET quantity = quantity
   WHERE purchase_order_id = NEW.id
     AND archived_at IS NULL;

  PERFORM set_config('verone.realigning_po_fees', 'off', true);

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.reallocate_po_fees_on_charges_change() IS
  'Quand le transport, la douane ou l''assurance d''une commande changent, réécrit ses lignes pour que le déclencheur de ligne recalcule leur part (BO-SOURCING-COST-005). La formule ne vit plus qu''à un seul endroit.';

-- ---------------------------------------------------------------------------
-- 4) Adoption d'une offre : refuser une monnaie qu'on ne sait pas convertir
-- ---------------------------------------------------------------------------
-- `adopt_sourcing_offer` écrivait `cost_price = quoted_price` sans regarder
-- `quoted_currency`. Aucun taux de change n'existe en base et le formulaire
-- n'expose pas la monnaie : le cas est aujourd'hui inatteignable, mais un prix
-- faux passerait sans un mot. Refus explicite plutôt qu'une conversion inventée.

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

  IF coalesce(v_candidate.quoted_currency, 'EUR') <> 'EUR' THEN
    RAISE EXCEPTION 'Cette offre est en % : convertissez-la en euros avant de la retenir',
      v_candidate.quoted_currency USING ERRCODE = 'VO002';
  END IF;

  SELECT sourcing_status INTO v_from
    FROM products WHERE id = p_product_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable' USING ERRCODE = 'P0002';
  END IF;

  UPDATE products
     SET supplier_id  = v_candidate.supplier_id,
         cost_price   = v_candidate.quoted_price,
         supplier_moq = coalesce(v_candidate.quoted_moq, supplier_moq)
   WHERE id = p_product_id;

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

-- ---------------------------------------------------------------------------
-- 5) Droits des fonctions de déclencheur (règle R-GRANT, point 4)
-- ---------------------------------------------------------------------------
-- Ces deux fonctions naissent de février 2026, avant la règle : elles étaient
-- restées exécutables par un visiteur non connecté. PostgreSQL ne vérifie
-- `EXECUTE` qu'à la création du déclencheur, jamais à son déclenchement — les
-- retirer ne change donc rien au fonctionnement.

REVOKE EXECUTE ON FUNCTION public.allocate_po_fees_and_calculate_unit_cost()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reallocate_po_fees_on_charges_change()
  FROM PUBLIC, anon, authenticated;

COMMIT;

-- ---------------------------------------------------------------------------
-- RETOUR ARRIÈRE
--   DROP TRIGGER IF EXISTS trigger_realign_po_fees ON public.purchase_order_items;
--   DROP FUNCTION IF EXISTS public.realign_po_fee_allocation();
--   puis rejouer 20260209_001_ecotax_fee_allocation_system.sql (définitions de
--   allocate_po_fees_and_calculate_unit_cost et reallocate_po_fees_on_charges_change)
--   et 20260916190000_bo_sourcing_offres_004.sql (adopt_sourcing_offer),
--   suivis de 20260312150000_fix_phase6_rls_and_search_path.sql pour le search_path.
-- ---------------------------------------------------------------------------
