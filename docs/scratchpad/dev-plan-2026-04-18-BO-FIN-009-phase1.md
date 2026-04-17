# Dev Plan — BO-FIN-009 Phase 1 : round-per-line (2026-04-18)

## Contexte

Branche : `feat/BO-FIN-009-phase1-round-per-line`
Audit prerequis : `docs/scratchpad/audit-consommateurs-tva-amount.md` (merged staging).
Regle cible : `.claude/rules/finance.md` R1 (zero discordance DB <-> Qonto).

## Portee Phase 1 stricte

**UNIQUEMENT le trigger DB** `recalc_sales_order_on_charges_change`. Pas de modification du code applicatif (`persist-financial-document.ts` reste sur son calcul float non-rounded ; un alignement supplementaire sera fait en Phase 2 si necessaire).

**Pas de refactoring** hors de la fonction cible.

## Analyse DB (verifie en live)

### Trigger actuel

```sql
-- Formule actuelle (round-per-total)
NEW.total_ttc := ROUND(v_items_ttc + (v_eco_tax_total * (1 + v_fees_vat_rate)) + (v_total_charges_ht * (1 + v_fees_vat_rate)), 2);
```

- `v_items_ttc` = SUM(quantity _ unit_price_ht _ (1 - discount/100) \* (1 + tax_rate)) — somme des TTC items sans ROUND par ligne.
- ROUND applique sur le total final uniquement.
- Qonto utilise SUM(ROUND(line_ttc, 2)) — d'ou l'ecart.

### Impact mesure (162 SO)

| Metric                                          | Valeur     |
| ----------------------------------------------- | ---------- |
| Total SO (status != cancelled)                  | 162        |
| SO avec delta round-per-total vs round-per-line | 17         |
| SO necessitant backfill                         | 18         |
| Delta min                                       | -0.01 EUR  |
| Delta max                                       | +0.02 EUR  |
| Delta moyen abs                                 | 0.0011 EUR |

Impact limite : 17/162 = 10.5 % des SO. Ecart max : 2 centimes.

### Contraintes DB a verifier

- `financial_documents` a `check_totals_coherent` (`abs(total_ttc - (total_ht + tva_amount)) < 0.01`).
- `sales_orders` n'a PAS de contrainte `check_totals_coherent`. Seules contraintes : `tax_rate BETWEEN 0 AND 1`, `total_discount_amount >= 0`, `currency ~ '^[A-Z]{3}$'`.

Donc le changement de formule SO ne peut PAS violer de CHECK DB. Safe.

## Changement de formule

### Nouvelle formule (round-per-line)

```sql
SELECT
  COALESCE(SUM(ROUND(
    quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))
  , 2)), 0),
  COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0)
INTO v_items_ttc, v_eco_tax_total
FROM sales_order_items
WHERE sales_order_id = NEW.id;

-- Total = somme items rounded + eco_tax rounded + charges rounded
NEW.total_ttc :=
  v_items_ttc
  + ROUND(v_eco_tax_total * (1 + v_fees_vat_rate), 2)
  + ROUND(v_total_charges_ht * (1 + v_fees_vat_rate), 2);
```

Justification :

- `v_items_ttc` = SUM(ROUND(line_ttc)) — round par ligne, identique a Qonto.
- `eco_tax_total * (1+vat)` et `charges * (1+vat)` sont des scalaires — ROUND apres multiplication, une seule fois chacun.
- Pas de ROUND sur le total final (chaque composant est deja arrondi).

## Migration SQL

### Nom du fichier

`supabase/migrations/20260423_bo_fin_009_phase1_round_per_line.sql`

### Contenu (structure attendue)

```sql
-- BO-FIN-009 Phase 1 : alignement round-per-line trigger recalc_sales_order_on_charges_change
-- Impact : 17 SO avec delta <= 0.02 EUR. Aucune contrainte DB violee.
-- Audit prerequis : docs/scratchpad/audit-consommateurs-tva-amount.md

BEGIN;

-- 1. Redefinir la fonction avec round-per-line
CREATE OR REPLACE FUNCTION public.recalc_sales_order_on_charges_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_items_ttc NUMERIC(12,2);
  v_eco_tax_total NUMERIC(12,2);
  v_total_charges_ht NUMERIC(12,2);
  v_fees_vat_rate NUMERIC(5,4);
  v_site_internet_channel_id UUID := '0c2639e9-df80-41fa-84d0-9da96a128f7f';
BEGIN
  -- Skip site-internet orders: total comes from Stripe
  IF NEW.channel_id = v_site_internet_channel_id THEN
    RETURN NEW;
  END IF;

  IF NEW.shipping_cost_ht IS DISTINCT FROM OLD.shipping_cost_ht
     OR NEW.insurance_cost_ht IS DISTINCT FROM OLD.insurance_cost_ht
     OR NEW.handling_cost_ht IS DISTINCT FROM OLD.handling_cost_ht
     OR NEW.fees_vat_rate IS DISTINCT FROM OLD.fees_vat_rate THEN

    -- Round-per-line sur items (aligne avec Qonto)
    SELECT
      COALESCE(SUM(ROUND(
        quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))
      , 2)), 0),
      COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0)
    INTO v_items_ttc, v_eco_tax_total
    FROM sales_order_items
    WHERE sales_order_id = NEW.id;

    v_fees_vat_rate := COALESCE(NEW.fees_vat_rate, 0.2);
    v_total_charges_ht := COALESCE(NEW.shipping_cost_ht, 0) + COALESCE(NEW.insurance_cost_ht, 0) + COALESCE(NEW.handling_cost_ht, 0);

    -- Pas de ROUND sur le total (composants deja arrondis)
    NEW.total_ttc :=
      v_items_ttc
      + ROUND(v_eco_tax_total * (1 + v_fees_vat_rate), 2)
      + ROUND(v_total_charges_ht * (1 + v_fees_vat_rate), 2);
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Backfill : recalculer total_ttc pour TOUTES les SO non-cancelled
-- (touche aux 17 SO avec delta, inoffensif pour les 145 autres)
UPDATE sales_orders so
SET total_ttc = (
  SELECT
    COALESCE(SUM(ROUND(
      quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))
    , 2)), 0)
    + ROUND(COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
    + ROUND((COALESCE(so.shipping_cost_ht, 0) + COALESCE(so.insurance_cost_ht, 0) + COALESCE(so.handling_cost_ht, 0)) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
  FROM sales_order_items soi
  WHERE soi.sales_order_id = so.id
)
WHERE so.status != 'cancelled'
  AND so.channel_id IS DISTINCT FROM '0c2639e9-df80-41fa-84d0-9da96a128f7f'::uuid; -- Skip site-internet

-- 3. DO $$ verification : count SO ecart > 0.02 apres backfill (doit etre 0)
DO $$
DECLARE
  v_mismatch_count INT;
BEGIN
  SELECT COUNT(*)
  INTO v_mismatch_count
  FROM sales_orders so
  WHERE so.status != 'cancelled'
    AND so.channel_id IS DISTINCT FROM '0c2639e9-df80-41fa-84d0-9da96a128f7f'::uuid
    AND ABS(so.total_ttc - (
      SELECT
        COALESCE(SUM(ROUND(
          quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))
        , 2)), 0)
        + ROUND(COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
        + ROUND((COALESCE(so.shipping_cost_ht, 0) + COALESCE(so.insurance_cost_ht, 0) + COALESCE(so.handling_cost_ht, 0)) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
      FROM sales_order_items soi
      WHERE soi.sales_order_id = so.id
    )) > 0.001;

  IF v_mismatch_count > 0 THEN
    RAISE EXCEPTION 'BO-FIN-009 Phase 1 backfill INCOHERENT: % SO ne matchent pas la nouvelle formule', v_mismatch_count;
  END IF;

  RAISE NOTICE 'BO-FIN-009 Phase 1 backfill OK : 0 SO en divergence';
END $$;

COMMIT;
```

**Transaction** : la migration est encadree par `BEGIN/COMMIT`. Si le `DO $$` leve `EXCEPTION`, le COMMIT est annule et TOUT rollback.

## Etapes d'implementation

1. **dev-agent** cree `supabase/migrations/20260423_bo_fin_009_phase1_round_per_line.sql` avec le contenu ci-dessus.

2. **dev-agent** applique la migration en live via `mcp__supabase__execute_sql` (le BEGIN/COMMIT garantit l'atomicite).

3. **dev-agent** regenere les docs DB (`python3 scripts/generate-docs.py --db`).

4. **dev-agent** verifie post-migration :
   - `SELECT COUNT(*) FROM sales_orders WHERE total_ttc <> [formule round-per-line]` doit retourner 0 (hors site-internet).
   - Relis la definition du trigger pour verifier qu'elle est bien la nouvelle version.
   - Teste un `UPDATE sales_orders SET shipping_cost_ht = shipping_cost_ht WHERE id = '...'` pour declencher le trigger sur une SO donnee (dry test).

5. **reviewer-agent** :
   - Verifier que la formule round-per-line est correcte.
   - Confirmer qu'aucune contrainte DB n'est violee (CHECK, FK).
   - Verifier que la migration est reversible en theorie (rollback = restaurer l'ancienne definition de fonction).
   - Confirmer que `persist-financial-document.ts` et `bank-matching.ts` restent coherents apres le changement (lecture seule, pas d'impact direct car ils derivent total_ttc).
   - Verdict dans `docs/scratchpad/review-report-BO-FIN-009-phase1-2026-04-18.md`.

6. **verify-agent** : type-check + build back-office.

7. **ops-agent** : push + PR + attente CI + merge.

## Risques

- **R1** : Si une SO a des items avec `tax_rate NULL`, le fallback `0.2` s'applique. Pas de regression, comportement identique a l'original.
- **R2** : Les SO site-internet sont EXCLUES par `channel_id`. Comportement identique a l'original.
- **R3** : Si `financial_documents` liees ont un delta < 0.01 (ancienne formule), elles ne sont PAS retouchees. Leur `total_ttc` reste tel quel. La contrainte `check_totals_coherent` reste satisfaite.
- **R4** : Le backfill UPDATE declenche potentiellement les autres triggers sur `sales_orders` (stock_prévisionnel, etc.). Attention : les triggers stock sont declenches par changement de status/quantite, pas par total_ttc. Devrait etre safe. A verifier dans le reviewer.

## Validation post-merge

- Monitor les logs Vercel pendant 24h pour detecter toute anomalie `total_ttc`.
- Le badge BO-FIN-011 (discordance total DB vs Qonto) devrait passer a 0 eleve sur les SO nouvellement modifiees.

## Commit target

`[BO-FIN-009] feat(db): phase1 round-per-line trigger recalc_sales_order_on_charges_change + backfill 17 SO`
