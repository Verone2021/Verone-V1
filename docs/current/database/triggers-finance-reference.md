# Triggers & Finance Reference

**Last consolidated** : 2026-04-19
**Scope** : triggers et fonctions DB du domaine finance (sales_orders.total_ttc, financial_documents, proformas, TVA round-per-line).

---

## 1. Fonction de reference : `recalc_sales_order_on_charges_change`

### Role

Recalcule `sales_orders.total_ttc` a chaque modification des charges annexes (`shipping_cost_ht`, `insurance_cost_ht`, `handling_cost_ht`, `fees_vat_rate`). Source de verite du total_ttc cote DB.

### Trigger associe

| Table          | Trigger                                        | Fonction                                 | Event         |
| -------------- | ---------------------------------------------- | ---------------------------------------- | ------------- |
| `sales_orders` | `recalc_sales_order_on_charges_change_trigger` | `recalc_sales_order_on_charges_change()` | BEFORE UPDATE |

### Formule actuelle (round-per-line, depuis Phase 1)

```
total_ttc =
  SUM( ROUND(line_ttc, 2) )              -- items arrondis un par un
  + ROUND(eco_tax_total * (1 + fees_vat_rate), 2)
  + ROUND(charges_ht * (1 + fees_vat_rate), 2)
```

ou `charges_ht = shipping_cost_ht + insurance_cost_ht + handling_cost_ht`.

**Exclusion** : les SO avec `channel_id = '0c2639e9-...'` (site-internet) sont skip car leur total vient de Stripe.

---

## 2. BO-FIN-009 Phase 1 — Historique

### Avant Phase 1 (round-per-total)

```
total_ttc = ROUND( SUM(line_ttc_float), 2 )
```

Somme de tous les items non-arrondis, puis un seul `ROUND` sur le total. Cree une **discordance de 0.01 EUR** avec Qonto qui fait `SUM(ROUND(line_ttc, 2))` (round-per-line).

### Apres Phase 1 (round-per-line, aligne Qonto)

Voir formule section 1. Chaque item est arrondi **avant** d'etre somme. Aligne strictement avec Qonto → violation de la regle **R1 finance** (zero discordance) eliminee a la source.

### Migration

`supabase/migrations/20260423_bo_fin_009_phase1_round_per_line.sql`

Contenu en 3 etapes :

1. `CREATE OR REPLACE FUNCTION recalc_sales_order_on_charges_change` avec round-per-line
2. `UPDATE sales_orders` backfill complet (hors cancelled + hors site-internet)
3. `DO $$ ... $$` verification : 0 SO en divergence apres backfill sinon `RAISE EXCEPTION`

### Impact backfill

- **18 SO** recalculees avec delta
- Delta observe : **-0.01 a +0.02 EUR** par SO
- **144 SO** restantes : touchees par le `UPDATE` mais delta nul (formule deja equivalente)
- Contraintes DB (`check_totals_coherent`) toutes respectees
- `financial_documents` **non touchees** (Phase 1 aligne la source, pas les documents)
- Triggers stock **non touches**
- Code applicatif **non touche**

### PR / Commits

- Commit : `74709141e` — `[BO-FIN-009] feat: phase1 round-per-line DB trigger + backfill 18 SO`
- PR : `#641` (merged 2026-04-17)
- Deploy staging → main : inclus dans les merges quotidiens post-17/04

---

## 3. Rollback BO-FIN-009 Phase 1

### ⛔ Aucun rollback automatique possible

Les 18 SO ayant subi le backfill **n'ont pas de snapshot** de leur `total_ttc` d'origine. La migration ne contient pas de sauvegarde pre-UPDATE.

Si un rollback etait necessaire, il faudrait :

1. Recreer la fonction `recalc_sales_order_on_charges_change` avec l'ancienne formule round-per-total (voir section 2 "Avant Phase 1")
2. Re-declencher le trigger sur les 18 SO concernees via un UPDATE no-op (`UPDATE sales_orders SET shipping_cost_ht = shipping_cost_ht WHERE id = ...`)
3. Les 18 SO retourneraient a leur ancien `total_ttc` **approximatif** — il peut y avoir un resultat different du snapshot originel si des items ont ete ajoutes/modifies entre temps.

**Aucun script de rollback n'est fourni** — le risque et l'effort ne justifient pas sa maintenance vu l'impact minimal (voir ci-dessous).

### Impact minimal — pourquoi un rollback n'a pas de sens

| Critere                    | Valeur                                   |
| -------------------------- | ---------------------------------------- |
| SO touchees                | 18 sur 162 (11%)                         |
| Delta par SO               | entre **-0.01 et +0.02 EUR**             |
| Ecart total cumule         | < 0.10 EUR sur l'ensemble des 18 SO      |
| Violation regle R1 avant   | OUI (discordance DB vs Qonto garantie)   |
| Violation regle R1 apres   | NON (alignement parfait)                 |
| Contraintes DB violees     | AUCUNE (avant et apres)                  |
| Impact client/comptabilite | Nul (les factures Qonto ne changent pas) |

**Conclusion** : la Phase 1 resout un probleme structurel (R1 finance) sans risque. Un rollback ferait **reintroduire** la discordance et couterait plus cher que son benefice (aucun).

### Verifier qu'une SO a ete backfillee

```sql
-- Liste des SO non-cancelled non-site-internet (= perimetre backfill Phase 1)
SELECT id, numero, total_ttc, updated_at
FROM sales_orders
WHERE status != 'cancelled'
  AND channel_id IS DISTINCT FROM '0c2639e9-df80-41fa-84d0-9da96a128f7f'::uuid
  AND updated_at >= '2026-04-17'::date
ORDER BY updated_at DESC;
```

### Verifier la coherence actuelle (0 SO en divergence)

Le `DO $$` de la migration a deja garanti ce resultat. Pour re-verifier a posteriori :

```sql
SELECT COUNT(*) AS mismatch_count
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
-- Doit retourner 0
```

---

## 4. Phases suivantes BO-FIN-009

| Phase | Objet                                               | Status                                           |
| ----- | --------------------------------------------------- | ------------------------------------------------ |
| 1     | Aligner `sales_orders.total_ttc` round-per-line     | ✅ FAIT (2026-04-17, PR #641)                    |
| 2     | Aligner `financial_documents.total_ttc`             | ✅ FAIT (2026-04-17, PR #643 BO-FIN-022, 4 docs) |
| 3     | Verrouillage items SO validated (R6)                | ⏳ A planifier                                   |
| 4     | Detection auto SO modifiee → regen draft (R3)       | ⏳ A planifier                                   |
| 5     | Source de verite `kind: from-order \| service` (R5) | ⏳ A planifier                                   |

---

## 5. Autres fonctions finance protegees

Voir `.claude/rules/stock-triggers-protected.md` pour les triggers stock (SO/PO/shipment/reception) qui **ne doivent jamais etre modifies sans ordre explicite de Romeo**.

### Fonctions finance critiques

| Fonction                                 | Role                                         | Statut             |
| ---------------------------------------- | -------------------------------------------- | ------------------ |
| `recalc_sales_order_on_charges_change()` | Total TTC SO (round-per-line depuis Phase 1) | Modifiable avec PR |
| `recalculate_sales_order_totals()`       | Totals items SO                              | Ne pas toucher     |
| `recalculate_purchase_order_totals()`    | Totals items PO                              | Ne pas toucher     |
| `calculate_retrocession_amount()`        | Retrocession LinkMe (depuis margin_rate)     | Ne pas toucher     |

### Regle BO-FIN-018 (multi-taux TVA)

`saveQuoteToLocalDb` utilise desormais round-per-line ligne par ligne (plus d'`avgVat`). Voir `apps/back-office/src/app/api/qonto/quotes/route.db.ts:65` :

> `JAMAIS avgVat (sum/count) : divergence garantie avec multi-taux TVA`

---

## 6. Sources

- Migration : `supabase/migrations/20260423_bo_fin_009_phase1_round_per_line.sql`
- Audit prerequis : `docs/scratchpad/audit-consommateurs-tva-amount.md`
- Review report : `docs/scratchpad/review-report-BO-FIN-009-phase1-2026-04-18.md`
- Regles domaine : `.claude/rules/finance.md` (regles R1 a R7)
- Regle stock : `.claude/rules/stock-triggers-protected.md`

---

**Note** : ce document complete `triggers-stock-reference.md` (domaine stock/PO/SO/shipment) et `.claude/rules/finance.md` (regles metier R1-R7).
