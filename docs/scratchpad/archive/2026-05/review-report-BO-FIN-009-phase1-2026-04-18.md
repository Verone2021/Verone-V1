Verdict : PASS

# Review Report — BO-FIN-009 Phase 1 — 2026-04-18

Sprint : BO-FIN-009 Phase 1 (round-per-line trigger DB)
Branche : `feat/BO-FIN-009-phase1-round-per-line`
Migration : `supabase/migrations/20260423_bo_fin_009_phase1_round_per_line.sql` (appliquee en live)

---

## Synthese des 7 points verifies

### Point 1 — Formule round-per-line en DB : VALIDE

La definition en live de `recalc_sales_order_on_charges_change` contient bien `SUM(ROUND(..., 2))` par ligne pour `v_items_ttc`, puis `ROUND(v_eco_tax_total * (1 + v_fees_vat_rate), 2)` et `ROUND(v_total_charges_ht * (1 + v_fees_vat_rate), 2)`. Pas de `ROUND(SUM(...))` global. Identique au fichier migration.

### Point 2 — Zero divergence SO apres backfill : VALIDE

`mismatch_count = 0`. Les 162 SO non-cancelled hors site-internet matchent la nouvelle formule a moins de 0.001 EUR. Le `DO $$` interne a la migration a passe sans `RAISE EXCEPTION`.

### Point 3 — Contrainte `check_totals_coherent` sur financial_documents : VALIDE

`violations_check_totals = 0`. Aucun `financial_documents` (non-supprime) ne viole `abs(total_ttc - (total_ht + tva_amount)) < 0.01`. Migration n'a pas touche financial_documents directement.

### Point 4 — SO site-internet non backfillees : VALIDE (vacuolaire)

`total_site_internet_so = 0`. Aucune commande avec `channel_id = '0c2639e9-df80-41fa-84d0-9da96a128f7f'` en base. Guard correcte dans migration + trigger, non sollicitee en pratique.

### Point 5 — Triggers stock proteges intacts : VALIDE

Les 5 triggers proteges (`trigger_so_update_forecasted_out`, `trg_so_devalidation_forecasted_stock`, `trigger_so_insert_validated_forecast`, `trigger_so_cancellation_rollback`, `trigger_prevent_so_direct_cancellation`) presents et actifs sur `sales_orders`. Aucun modifie.

### Point 6 — Migration propre, append-only, idempotente : VALIDE

Nouveau fichier. Aucune migration existante editee. Structure `BEGIN/COMMIT` + `DO $$` embedded. `CREATE OR REPLACE FUNCTION` idempotent.

### Point 7 — Code applicatif non touche : VALIDE

`git diff main..HEAD -- apps/ packages/ --name-only` : aucun fichier. Scope DB-only confirme.

---

## WARNING 1 — Ecart pre-existant SO b4e87439 / PROFORMA F-2026-017 — 3355.48 EUR

La requete de coherence R1 (ecart > 0.01 EUR entre `sales_orders.total_ttc` et `financial_documents.total_ttc`) retourne 1 couple. SO `b4e87439` (3639.40 EUR, validated) liee a PROFORMA `F-2026-017-PROFORMA` (283.92 EUR, draft). Ecart = 3355.48 EUR.

Cause : la proforma ne contient aucun item (`financial_document_items` vide), tandis que la SO a 12 lignes. Cette proforma a vraisemblablement ete generee partiellement avant le fix BO-FIN-014 (guard ecrasement).

**Pas un artefact de BO-FIN-009 Phase 1.** Investigation a planifier dans un ticket dedie (regenerer la proforma via la route corrigee).

---

## WARNING 2 — Rollback irreversible non documente dans la migration

Le backfill `UPDATE sales_orders SET total_ttc = ...` est irreversible sur les donnees. En cas de rollback de la fonction, les 18 SO backfillees garderont leurs nouveaux `total_ttc`. Dette documentaire, pas de defaillance fonctionnelle. A ajouter en commentaire de tete de la migration.

---

## INFO 1 — Trigger ne recalcule pas total_ht ni tva_amount

Le trigger ne met a jour que `total_ttc`. Apres modification de `shipping_cost_ht`, le `total_ht` reste inchange. Comportement pre-existant, hors perimetre Phase 1. A tracker dans BO-FIN-009 Phase 3.

---

## Autorisation PR

Migration correcte, appliquee en live, 7 points valides. Seul ecart R1 (PROFORMA F-2026-017) pre-existant, non bloquant.

**PR autorisee vers staging.**

### Conditions post-merge

1. Monitor Vercel pendant 24h sur routes lisant `sales_orders.total_ttc` (bank-matching.ts, persist-financial-document.ts).
2. Verifier badge BO-FIN-011 passe a 0 sur les 18 SO modifiees apres prochain sync Qonto.
3. Ouvrir ticket pour SO `b4e87439` / PROFORMA `F-2026-017-PROFORMA` (investigation independante).
