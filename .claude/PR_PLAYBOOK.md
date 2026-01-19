# PR Playbook (MANUAL MODE) — Vérone TurboRepo

Objectif: créer des PRs propres, rapides à reviewer, sans PR automatique, sans surprises.

## Règles non négociables
- AUCUNE PR créée automatiquement par workflow/agent.
- AUCUN merge automatique.
- Toujours: 1 objectif = 1 PR (sauf si urgence "pompier mode").
- Toujours: PR description = Summary + Commits + Test Plan + Impact + Rollback.
- Si incertitude: STOP → demander instruction (ne pas "deviner").

---

## Phrase type (quand Roméo dit "fais une PR")
**Tu dois répondre en 2 lignes:**
1) "Je prépare la PR en mode manuel: titre + scope + checklist tests."
2) "Je te donne la commande `gh pr create` + un résumé, puis j'attends ton GO pour merge."

---

## Process standard (1 minute)

### Étape A — Analyse (1 minute)
- `git status --short`
- `git log --oneline --decorate -10`
- `git diff --stat origin/main...HEAD`
- Confirmer: branche, scope, fichiers sensibles.

### Étape B — Qualité minimum (selon repo)
- Lancer la commande la plus légère possible:
  - `pnpm lint` (si rapide) OU
  - `pnpm -w lint` (si monorepo) OU
  - `turbo lint type-check build` (si c'est ton gate)
- Si ça prend trop: expliquer et proposer "smoke check" + laisser CI faire le reste.

### Étape C — Rédaction PR
**Format PR body:**
- ## Summary (3-6 bullets max)
- ## Commits (liste)
- ## Test Plan (checklist)
- ## Impact (risques / périmètre)
- ## Rollback (1-2 lignes)

### Étape D — Création PR (commande)
Créer la PR avec `gh pr create` (pas de merge).
- Toujours mettre un titre clair.
- Toujours mentionner le test plan.
- Toujours indiquer "MANUAL MODE".

### Étape E — Attente GO
Ne merge PAS tant que Roméo n'a pas dit explicitement: "MERGE".

---

## Merge (uniquement sur ordre explicite)

Quand Roméo dit "MERGE":
1) Vérifier checks: `gh pr checks <NUM>`
2) Vérifier mergeable: `gh pr view <NUM> --json mergeable,mergeStateStatus`
3) Merger avec squash (par défaut):
   - `gh pr merge <NUM> --squash --delete-branch`
4) Confirmer résultat:
   - hash du commit merge
   - ce qui a changé (1 phrase)
   - next step proposée (1 action)

---

## Cas 1 — "Fais une PR maintenant" (prompt court à utiliser par Roméo)
Roméo → Agent:
> Crée une PR MANUAL MODE depuis la branche actuelle.
> Titre: "<TITRE>".
> Scope: uniquement les changements déjà commit.
> Donne-moi la commande `gh pr create` + body complet (Summary/Commits/Test Plan/Impact/Rollback).
> Ne merge pas sans mon GO.

---

## Cas 2 — "Fais la PR et merge" (prompt court)
Roméo → Agent:
> Crée la PR MANUAL MODE depuis la branche actuelle, puis attends la fin des checks.
> Quand tout est vert, propose le merge (squash) et attends mon "MERGE".
> Après mon "MERGE", tu merges et tu confirmes le commit final + suppression de branche.

---

## Cas 3 — Split multi-PRs (split propre)

### Principe expert
- On ne "split" pas une branche pleine au hasard.
- On fait soit:
  A) **cherry-pick** vers branches propres, ou
  B) **git reset --soft** + recommit par lots (si local et pas encore partagé), ou
  C) **git rebase -i** (si à l'aise, sinon éviter).

### Méthode recommandée (safe): Cherry-pick
1) Identifier lots logiques:
   - `git log --oneline origin/main..HEAD`
2) Créer une branche par PR:
   - `git checkout -b chore/pr-1 origin/main`
   - `git cherry-pick <sha1> <sha2> ...`
3) Push + PR #1
4) Refaire pour PR #2, etc.

### Prompt court pour split
Roméo → Agent:
> Je veux SPLIT en 2-3 PRs max.
> Regroupe par objectifs cohérents.
> Utilise uniquement cherry-pick depuis ma branche actuelle vers de nouvelles branches basées sur origin/main.
> Donne-moi: (1) le plan de split, (2) les commandes exactes, (3) crée les PRs (sans merge).

---

## PR naming (convention)
- `[NO-TASK] chore: ...` (infra/docs)
- `[NO-TASK] fix: ...` (bug)
- `[NO-TASK] feat: ...` (feature)

Branches:
- `chore/...`
- `fix/...`
- `feat/...`

---

## Anti-bordel (toujours)
- Pas de fichiers générés committés (logs, backups, audits) sauf exception validée.
- Pas de changement Vercel/GitHub rules sans instruction explicite.
- Si un workflow crée une PR automatiquement → le désactiver (workflow_dispatch only + dry_run par défaut).

---
