# [INFRA-CI-002] — Supabase TS types drift skip-when-noop

**Date** : 2026-05-02
**Branche** : `chore/INFRA-CI-002-types-drift-skip-when-noop`
**Worktree** : `/Users/romeodossantos/verone-infra-ci-002`

## Problème

Le job `supabase-types-drift` dans `.github/workflows/quality.yml` est défini
en check `required` côté branch protection. Il est gaté par
`if: needs.detect-changes.outputs.migrations == 'true'` au niveau **job**
(ligne 389 de l'ancien fichier).

Conséquence : pour toute PR qui ne touche pas à `supabase/migrations/**` ni
à `packages/@verone/types/src/supabase.ts`, GitHub Actions reporte le job
comme `skipped`. Or, en branch protection, un check `skipped` ne satisfait
pas la condition « required » → la PR reste indéfiniment bloquée par le
status check, alors qu'aucune vérification n'a réellement lieu.

Pattern reconnu (cf. issues GitHub Actions) : path-based job skipping +
required status checks = blocage systémique. Solution officielle : faire
tourner le job toujours, et laisser les **steps** être conditionnels.

## Audit fait

Lecture intégrale de :
- `.github/workflows/quality.yml` (job `detect-changes`, `quality`,
  `e2e-smoke`, `db-drift-check`, `supabase-types-drift`,
  `supabase-advisors-security`)
- `.github/workflows/protect-main-source.yml`
- `.github/workflows/db-drift-cron.yml`
- `.github/workflows/auto-release-staging-to-main.yml`
- `.github/workflows/scratchpad-cleanup.yml`

Identifié : seul `supabase-types-drift` souffre du pattern
« required + skipped ». Les autres jobs blocking (`quality`,
`db-drift-check`) tournent toujours ou sont conditionnés à `github.event_name`
(toujours satisfait sur PR).

## Fix appliqué

Refactor du job `supabase-types-drift` :

1. **Retiré** le `if: needs.detect-changes.outputs.migrations == 'true'` au
   niveau job (ligne 389).
2. **Ajouté** une variable d'env `MIGRATIONS_TOUCHED` au niveau job qui
   propage la sortie de `detect-changes`.
3. **Ajouté** un step initial « No-op (no DB migration in this PR) » qui ne
   s'exécute que quand `MIGRATIONS_TOUCHED != 'true'` et écrit un message
   explicite dans le `$GITHUB_STEP_SUMMARY`.
4. **Conditionné** tous les steps existants (checkout, setup pnpm,
   setup Node, install deps, install Supabase CLI, regenerate types,
   upload artifact, comment PR) par `MIGRATIONS_TOUCHED == 'true'`.
5. **Préservé** la condition existante `env.SUPABASE_DB_URL != ''` (combinée
   avec le nouveau garde via `&&`).
6. **Préservé** le comportement bloquant : si une migration est ajoutée et
   que les types ne sont pas régénérés → `exit 1` du step regen → job FAIL.

Résultat attendu :
- PR sans migration DB : job tourne, step no-op écrit summary, autres steps
  skippés, **conclusion = success** → PR débloquée.
- PR avec migration DB + types à jour : job tourne, regen + diff vide,
  **conclusion = success**.
- PR avec migration DB + types pas à jour : regen + diff non vide,
  **conclusion = failure** → PR bloquée comme avant (comportement préservé).

## Hors scope (non touché)

- Pas de modification de la branch protection elle-même (FEU ROUGE
  d'après `autonomy-boundaries.md`).
- Pas de modification des autres checks required (`db-drift-check`,
  `quality`).
- Pas de modification du script `scripts/db-drift-check.py` ni des autres
  scripts de drift.
- Pas de touche à `e2e-smoke` (déjà non-blocking via `continue-on-error`).

## Validation locale

- YAML valide via `python3 -c "import yaml; yaml.safe_load(...)"`.
- Diff du fichier strictement limité au job `supabase-types-drift`.

## Validation CI attendue (après push)

Cette PR ne touche AUCUNE migration ni `supabase.ts`. Donc :

- Job `Supabase TS types drift (blocking)` : doit tourner et reporter
  **success** (vs. `skipped` aujourd'hui).
- Job `quality` : doit passer (le diff ne touche que le YAML workflow,
  les apps n'ont rien changé donc filter `packages: false` →
  fallback `--filter=all`, build de tout).
- Job `db-drift-check` : doit passer (rien touché côté DB).
- Job `e2e-smoke` : non-blocking, tournera ou non selon `paths-filter`.

Si le check `Supabase TS types drift (blocking)` reporte success sur cette
PR → fix validé.

## Fichiers touchés

- `.github/workflows/quality.yml` (job `supabase-types-drift` uniquement)
- `docs/scratchpad/dev-report-2026-05-02-INFRA-CI-002.md` (ce fichier)
