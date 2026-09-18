# Session 03 — S4 : CI de dérive hors production, build sous 20 min, secrets de test

Aucune base. Une PR. Détail de départ : `docs/scratchpad/audit-2026-09-11/sessions/session-4-controle-ci-derive.md`.

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  docs/scratchpad/audit-2026-09-11/sessions/session-4-controle-ci-derive.md
  .github/workflows/quality.yml, .github/workflows/db-drift-cron.yml, scripts/db-drift-check.py, scripts/generate-docs.py
  docs/scratchpad/audit-2026-09-16/AUDIT-COMPLET-2026-09-16.md, partie 4.6

═══ MISSION ═══
S4.1 `db-drift-check.py` et `generate-docs.py` : remplacer la requête `information_schema.table_constraints ⋈
     key_column_usage ⋈ constraint_column_usage` (5,5 s, 40 s max, 4,2 M de blocs) par l'équivalent `pg_catalog`
     (`pg_constraint`, `pg_attribute`, `confrelid`) — même résultat, mesuré < 100 ms. Test : sorties identiques sur la
     base (diff des deux JSON).
S4.2 Ne plus lire la production à chaque push de PR : `db-drift-check` en CI seulement sur `pull_request` vers
     `staging` **au moment de la fusion** (job `merge_group` ou déclenché sur label), plus le cron hebdo du lundi 06:00
     UTC conservé. Justifie le choix dans le fichier.
S4.3 Build à 20 min : `detect-changes` fait déjà du no-op pour docs-only ; un changement de `packages/@verone/types`
     déclenche les 3 apps (12 min). Proposer et appliquer : cache Turbo distant (Vercel remote cache si dispo) ou
     `turbo run build --filter=...[origin/staging]` avec `--affected`, délai porté à 30 min en filet, et build LinkMe /
     site seulement s'ils dépendent réellement du changement. Preuve : durée du job sur la PR de cette session.
S4.4 `E2E_TEST_EMAIL` / mot de passe : vérifier que les secrets du compte de test dédié (créé le 15/09) sont bien ceux
     lus par `quality.yml` ; retirer les jobs `smoke-*` « facultatifs rouges » restants ou les rendre verts.
S4.5 Alias « E2E Smoke » qui passe vert sur des jobs `skipped` (constat de juillet, `quality.yml:893-914`) : le
     supprimer ou le faire échouer sur `skipped`.
Preuves : run CI complet vert sur la PR, durée totale, `pg_stat_statements` : `calls` de la requête information_schema
n'augmente plus après la fusion (vérifié 24 h après). Compte rendu, ACTIVE.md.
```
