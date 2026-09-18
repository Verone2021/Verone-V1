# Review Report — 2026-09-12

## Verdict : PASS WITH WARNINGS

Sprint `[BO-SEC-003]` (BO-AUDIT-SEC-S1 lots 1-6) — 3 commits, 13 fichiers, branche `fix/BO-AUDIT-SEC-S1-fonctions-anon`.
Audit couvre : 7 migrations SQL, script Python `supabase-advisors-check.py`, job CI `supabase-advisors-security`,
règle `R-GRANT`, ADR-039, dev-report S1. Revue lue via git (branche), état production vérifié en SELECT.

---

### WARNING — supabase/migrations/20260912{000000,010000,020000}…sql — DO blocks sans EXCEPTION handler

**Problème** : les DO blocks des lots 3, 4, 5 itèrent `EXECUTE format('REVOKE/GRANT … %s', sig)` sans
`EXCEPTION WHEN undefined_function`. Une signature absente interromprait la migration sur une base neuve.
**Décision coordinateur** : non corrigé — fichiers d'archive de lots déjà appliqués (`db push` interdit, application via
`execute_sql`) ; toutes les signatures existent en production. Noté pour le socle de test (BO-AUDIT-009).

### WARNING — .github/workflows/quality.yml / scripts/supabase-advisors-check.py — pas de contrôle si secrets absents

**Problème** : sans `SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_REF`, l'étape est sautée et le job sort vert.
**Décision coordinateur** : non bloquant ici — les secrets existent sur le dépôt ; les PR Dependabot n'ont pas accès
aux secrets et seraient bloquées à tort par un échec. Suivi : ajouter un `::warning::` visible dans l'étape « Skip note ».

### WARNING — 5 fonctions F2 conservées ouvertes à anon sans page publique confirmée

`check_linkme_access_by_email`, `get_activity_stats`, `get_pending_approvals_count`, `get_categories_with_real_counts`,
`get_linkme_public_stats`. Des appels `anon` existent dans `pg_stat_statements` (résiduels, probablement avant
hydratation de session). `check_linkme_access_by_email` permet l'énumération d'e-mails LinkMe sans connexion.
**Décision coordinateur** : lot « 4 bis » à programmer (identifier l'appelant anonyme, puis fermer ou garder).

### INFO — 20260731075651 reconstruit : `REVOKE … FROM anon` sans `PUBLIC` (historique, sans effet) — corrigé par le lot 1.

### INFO — ADR-039 : project ref en clair — public par nature (URL API), aucun risque.

---

## Vérifications positives

- 6 versions présentes dans `supabase_migrations.schema_migrations`.
- Gardes du lot 2 présentes en production (`pg_get_functiondef`) sur les 4 fonctions.
- `pg_default_acl` : global `{postgres=X}`, schéma public `{postgres=X, authenticated=X, service_role=X}`.
- Fonctions publiques F2 `anon_can_execute = true` ; fonctions dangereuses `false`.
- CI : aucun anti-raccourci, pas de `continue-on-error`, codes 0/1/2/3 corrects, `set +e`/`set -e` correct.
- Baseline 19/144/7/4/1 cohérente avec la mesure.
- Déclencheurs stock protégés : corps inchangés, seul le droit d'exécution manuelle retiré.
- Format des commits conforme, aucun fichier hors sujet, aucun secret.
