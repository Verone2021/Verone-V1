# Dev Report — BO-FIN-009 Phase 1 — 2026-04-18

Branche : `feat/BO-FIN-009-phase1-round-per-line`

## Execution

**Trigger cible dans liste protegee** : NON — `recalc_sales_order_on_charges_change` absent de `stock-triggers-protected.md`. Execution autorisee.

**Fichier migration cree** : `supabase/migrations/20260423_bo_fin_009_phase1_round_per_line.sql` (92 lignes)

**Migration appliquee** : OUI — 3 blocs appliques sequentiellement via `mcp__supabase__execute_sql` :

1. `CREATE OR REPLACE FUNCTION` (nouvelle formule round-per-line)
2. `UPDATE sales_orders` backfill (162 SO, 18 modifiees, 144 inchangees)
3. `DO $$` verification (0 RAISE EXCEPTION, 0 divergence)

## Resultats

- **SO avant backfill avec delta** : 18 SO sur 162 (hors cancelled, hors site-internet)
- **SO inchangees** : 144 SO (delta deja nul avant backfill)
- **SO apres backfill avec delta** : 0 confirme par SELECT direct + DO $$ sans RAISE
- **Delta observed** : -0.01 EUR a +0.02 EUR (max 2 centimes)

## Validations

- Definition trigger mise a jour : confirmee via `SELECT prosrc FROM pg_proc WHERE proname = 'recalc_sales_order_on_charges_change'` — nouvelle formule avec `SUM(ROUND(..., 2))` par ligne en place.
- Docs DB regenerees : `python3 scripts/generate-docs.py --db` : 142 tables, 9 domaines, fichiers `docs/current/database/schema/` mis a jour.

## Risques observes

- Aucune contrainte DB violee (sales_orders n'a pas de `check_totals_coherent`).
- Triggers stock non touches — backfill UPDATE sur `total_ttc` ne declenche aucun trigger stock (ils repondent a `status`, `quantity`, pas `total_ttc`).
- `financial_documents` non touchees — documents existants gardent leur `tva_amount` historique.
- Site-internet exclu correctement via `channel_id IS DISTINCT FROM` dans backfill et nouvelle fonction.

## Fichiers modifies

- `supabase/migrations/20260423_bo_fin_009_phase1_round_per_line.sql` (nouveau)
- `docs/current/database/schema/*.md` (9 fichiers regen)
- `docs/current/database/DATABASE-SCHEMA-COMPLETE.md` (regen)
- `scripts/db-schema-snapshot.json` (regen)
