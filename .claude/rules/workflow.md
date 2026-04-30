# Regles Workflow Verone

**Source de verite pour le workflow Git / PR / merge. Lecture obligatoire
par tous les agents avant toute action git.**

**Voir aussi (obligatoire avant tout `git checkout -b` / `gh pr create`)** :

- `.claude/rules/multi-agent-workflow.md` — Branche tôt, push draft immédiat, rebase précoce, worktree obligatoire en multi-agents, stacked PRs, fix CI sans `--admin`. Cette règle complète le présent fichier sur la pratique senior 2026.
- `.claude/rules/branch-strategy.md` — Checklist 4 questions avant nouvelle branche.

---

## RÈGLE ABSOLUE — Cible des branches

**Toute branche feature/fix/hotfix part de `staging` et PR vers `staging`. JAMAIS vers `main`.**

```bash
# CORRECT
git checkout staging && git pull
git checkout -b feat/XXX
gh pr create --base staging --head feat/XXX

# INTERDIT
git checkout main
git checkout -b feat/XXX        # ← branche partie de main
gh pr create --base main ...    # ← PR vers main
```

Seule exception autorisée vers `main` : la **release PR** `staging → main`, créée **EXCLUSIVEMENT par Romeo** (manuellement ou via le workflow `auto-release-staging-to-main.yml`). **L'agent ne crée JAMAIS cette release PR de sa propre initiative**, peu importe le contexte (staging ahead, fix urgent, ordre antérieur "merge sur main", etc.). Romeo décide du timing — chaque jour, chaque semaine, ou selon son rythme.

Toute autre PR vers `main` est **bloquée par le workflow `protect-main-source.yml`** (CI fail). Le bypass via label `hotfix-direct` est réservé à Romeo lui-même — l'agent ne l'applique JAMAIS.

Pourquoi : si tu PR vers main directement, main avance avant staging → la release PR staging→main devient un calvaire de conflits. Cf incident 2026-04-25 (6 PRs ouvertes vers main au lieu de staging, 72h perdues à débrouiller).

**Avant tout `gh pr create` : vérifie deux fois la base.** Si tu hésites, c'est `--base staging`.

---

## Principe fondamental : 1 PR = 1 bloc de travail coherent

Les vrais developpeurs seniors **ne creent PAS une PR par sprint/sous-tache**.
Ils creent une PR par **bloc coherent** qui a du sens pour le reviewer.

### MAUVAIS workflow (a bannir)

```
Sprint 1 -> branche -> commit -> push -> PR -> CI -> merge (15 min perdues)
Sprint 2 -> branche -> commit -> push -> PR -> CI -> merge (15 min perdues)
Sprint 3 -> branche -> commit -> push -> PR -> CI -> merge (15 min perdues)
```

= 45 min en overhead CI/review/merge pour 3 sprints.

### BON workflow (obligatoire)

```
Bloc (ex: Migration Responsive) -> 1 branche ->
  commit 1 + push (sauvegarde)
  commit 2 + push (sauvegarde)
  commit 3 + push (sauvegarde)
  ...
  commit N + push (sauvegarde)
  -> 1 PR quand le bloc est fini -> 1 CI -> 1 merge
```

= 15 min de CI total, meme pour 10 sous-taches.

---

## Regles strictes

### Commits & Push

**TOUJOURS** :

- Commit apres chaque sous-tache terminee (bonne granularite pour rollback)
- Push apres chaque commit (sauvegarde, pas de travail perdu)
- Format commit : `[APP-DOMAIN-NNN] type: description`
- **Rebase précoce** : `git fetch origin staging && git rebase origin/staging` AVANT chaque push (toutes les 1-2h). Absorbe les changes des autres agents au fil de l'eau, conflits petits et résolus en 5 min au lieu d'exploser en 30 min au merge final. Voir `.claude/rules/multi-agent-workflow.md`.
- **Push draft immédiat** dès la branche créée : `gh pr create --draft --base staging` même avec juste un scratchpad de plan. La PR draft = sauvegarde GitHub + signal pour les autres agents « je touche à X ». Promouvoir draft → ready quand le bloc est complet.
- **`git push --force-with-lease`** au lieu de `--force` nu. Garde-fou contre l'écrasement accidentel.

**JAMAIS** :

- Commit "WIP" vague sans contenu clair
- Push force (`--force` nu) — toujours `--force-with-lease`
- Commit sans Task ID (sauf `[NO-TASK]` pour chores)
- « J'attends que l'autre agent finisse avant de créer ma branche » — anti-pattern. Brancher tôt, rebaser souvent.
- `git checkout` ou `git pull --rebase` dans le working dir partagé si un autre agent y travaille — utiliser `git worktree add` (cf. `multi-agent-workflow.md`).

### Pull Requests

**UNE PR = UN BLOC COHERENT**, pas une sous-tache.

Exemples de blocs coherents (= 1 PR chacun) :

- **Infrastructure responsive** = 1 PR = ~18 fichiers d'un coup
- **Migration responsive Pattern A critique** = 1 PR = toutes les pages du pattern (factures + commandes + stocks ensemble)
- **Migration responsive Pattern A + B** = 1 PR = patterns apparentes fusionnes
- **Sprint finance entier** = 1 PR = ensemble des fixes lies

Exemples de ce qu'il NE faut PAS faire (1 PR par page) :

- PR "migrer /factures"
- PR "migrer /commandes/clients"
- PR "migrer /commandes/fournisseurs"
- PR "migrer /stocks/inventaire"
- ...

=> BANNI. Regrouper en 1 seule PR "[BO-UI-RESP-003] Pattern A critique".

### Merge

- **1 merge squash par PR** (pour garder historique propre)
- Merge SEULEMENT quand le bloc entier est fini
- NE JAMAIS merger en cours de bloc pour "avancer"

### Branches

- Une seule branche par bloc de travail
- Branche vit plusieurs jours si necessaire (normal pour senior)
- **Rebase précoce** sur staging avant chaque push (réflexe toutes les 1-2h) : `git fetch origin staging && git rebase origin/staging && git push --force-with-lease`. Pas une fois en fin de bloc, à chaque push. Conflits petits, résolus tout de suite.
- En multi-agents (autre agent dans le working dir) : créer la branche dans un **worktree isolé** via `git worktree add /Users/romeodossantos/verone-[task-short] -b <branche> origin/staging`. Voir `.claude/rules/multi-agent-workflow.md`.

---

## Comment regrouper les sprints

### Sprint responsive (exemple)

Au lieu de 7 PRs (003, 004, 005, 006, 007, 008, 009), creer 2-3 PRs :

**Option A : 1 grosse PR**

- 1 branche `feat/responsive-migration-global`
- 7 commits (un par pattern)
- 1 PR `[BO-UI-RESP-MIGRATION] Migration responsive complete (150+ pages)`

**Option B : 2-3 PRs thematiques** (recommande pour reviews plus faciles)

- PR 1 `[BO-UI-RESP-LISTS] Patterns A + B (listes CRUD et filtres)` = sprints 003, 004, 005
- PR 2 `[BO-UI-RESP-DETAILS] Patterns C + D (detail et dashboards)` = sprints 006, 007
- PR 3 `[BO-UI-RESP-FORMS] Patterns E + F (modals et forms)` = sprints 008
- PR 4 `[BO-UI-RESP-APPS] LinkMe + site-internet` = sprint 009

### Point de controle

Commit apres chaque pattern migre (sauvegarde intermediaire), push systematique,
mais PR UNIQUEMENT quand plusieurs patterns sont fusibles en un bloc coherent.

---

## Quand CREER une PR (et pas avant)

Creer une PR SEULEMENT si tous ces criteres sont remplis :

- [ ] Le bloc de travail est fonctionnellement complet (pas mi-fini)
- [ ] Pas de regression sur les pages deja migrees
- [ ] Type-check + build verts localement
- [ ] Tests Playwright OK (si applicable)
- [ ] Reviewer-agent PASS
- [ ] Le bloc regroupe 3+ sous-taches ou est un bloc atomique critique

Si un seul critere manque : continuer a commit/push sur la branche, pas de PR.

---

## Quand MERGER une PR

Merger SEULEMENT si :

- [ ] CI verte (type-check + build + tests)
- [ ] Reviewer-agent PASS
- [ ] Romeo a valide explicitement (ou workflow autonome pre-approuve)
- [ ] Aucun CRITICAL dans le review report

Merger en `--squash` pour garder historique propre.

---

## Ce que ca change concretement pour les agents

### Avant (mauvais)

```
Sprint 003 :
- branche feat/BO-UI-RESP-003
- commits
- PR #XXX
- merge
- ACTIVE.md update

Sprint 004 :
- branche feat/BO-UI-RESP-004
- commits
- PR #YYY
- merge
- ACTIVE.md update
```

### Apres (bon)

```
Bloc "Migration listes" :
- branche feat/responsive-lists
- commit (sprint 003) + push
- commit (sprint 004) + push
- commit (sprint 005) + push
- 1 PR [BO-UI-RESP-LISTS] Migration responsive listes (40 pages)
- 1 merge
- ACTIVE.md update : 3 sprints marques FAIT d'un coup
```

---

## Exceptions (quand 1 sprint = 1 PR)

Cas ou c'est OK d'avoir 1 PR par sprint :

1. **Sprint d'infrastructure** : pose les fondations (ex: BO-UI-RESP-001)
2. **Sprint d'audit pur** : pas de code, juste un rapport
3. **Hotfix urgent** : bug production a deployer vite
4. **Sprint experimental** : test d'approche, peut etre annule

Dans ces cas seulement, creer la PR juste apres le sprint.

Sinon : **grouper toujours**.

---

## Communication Romeo <-> agent

Romeo veut AVANCER vite. Les agents doivent :

- Commit/push regulier (rassurer que ca avance)
- NE PAS creer de PR intermediaires
- Rapport apres chaque commit important (pas apres chaque ligne)
- Demander validation UNIQUEMENT quand la PR est prete a merger

Si Romeo dit "continue", l'agent enchaine les sprints sur la meme branche
SANS creer de PR entre chaque.

---

## Playbooks (1 recette specifique Verone)

Pour la migration responsive uniquement, consulter `.claude/playbooks/migrate-page-responsive.md` qui capture le fix du bug "Rendered more hooks" du pilote v1 FAIL.

Les autres playbooks ont ete supprimes (voir `DECISIONS.md` ADR-011) car ils dupliquaient les capacites natives de Claude Code (workflow git, debug, CI). Pour ces cas, utiliser les regles de cette page + `.claude/rules/code-standards.md` + `.claude/rules/playwright.md`.

---

## Resume en 3 lignes

1. **Commit + push souvent** pour sauvegarder
2. **PR uniquement quand un bloc coherent (3+ sprints) est fini**
3. **Merge uniquement quand tout est valide**

---

## Incident 2026-04-28 — bundling thématique manqué (1h50 perdues)

**Contexte** : Romeo a enchaîné 3 demandes liées à la section Canaux de Vente :

1. Fix bug Meta (page liste vide après drop colonnes `custom_*`)
2. "Tu corriges Google Merchant"
3. "Tu corriges Site Internet"

**Erreur de l'agent** : a créé **4 PRs séparées** (#822 Meta, #823 Google, #824 Site, #826 types-drift de rattrapage) au lieu de **1 PR bundle** `[BO-CHAN-CLEANUP-001]`.

**Coût** : 4 cycles CI staging + 1 cycle CI main FAILED + 1 PR de rattrapage + 1 cycle CI staging + 1 cycle CI main re-run = **~1h50** de cycles CI, vs **~25 min** estimés pour un bundle propre.

**Causes racines** :

1. L'agent a interprété "L'un après l'autre" littéralement = 1 PR par sujet. Or "l'un après l'autre" voulait dire "fais d'abord X dans la branche puis Y dans la même branche, je merge le bloc à la fin".
2. La migration SQL Meta nécessitait une régénération `pnpm run generate:types` : pas faite dans la PR Meta → drift TS détecté à la PR release main → PR de rattrapage #826.

**Règles de prévention OBLIGATOIRES** :

### 1. Détecter le bundling potentiel à la 2e demande

Si Romeo demande un 2e fix et que ce fix est dans le même domaine fonctionnel que le 1er (mêmes pages, même section UI, même feature), **NE PAS créer une nouvelle branche/PR**. Au lieu de ça :

```
"Vu que [Y] suit [X] dans le même domaine ([canaux-vente]),
 je mets sur la même branche en 2 commits, 1 seule PR. OK ?"
```

Attendre confirmation. Si OK → continuer sur la branche actuelle.

### 2. Toujours bundler la régénération TS dans la PR de migration

Si une PR contient une migration SQL qui touche un RPC, une fonction, ou une colonne :

```bash
pnpm run generate:types
git add packages/@verone/types/src/supabase.ts
git commit -m "chore: regenerate Supabase types after [TASK-ID] migration"
```

**Ce commit doit être dans la même PR que la migration.** Sinon le check `Supabase TS types drift (blocking)` du CI release main fail et il faut une PR de rattrapage (incident 2026-04-28).

Si `pnpm run generate:types` échoue (Unauthorized par exemple), utiliser `mcp__supabase__generate_typescript_types` MAIS prendre conscience que le résultat omet le schema `graphql_public` et il faudra rectifier via l'artifact `supabase-types-drift` du CI.

### 3. Détection systématique des onglets fantômes

Si on touche au composant `apps/back-office/src/components/layout/channel-tabs.tsx` ou si on découvre un lien 404 :

```bash
# Vérifier que chaque href de vraie route (pas ?tab=...) existe en repo
ls apps/back-office/src/app/(protected)/canaux-vente/[channel]/
```

Audit complet des onglets de TOUS les canaux à faire **dans la même PR**, pas un canal à la fois.

---

## Référence

Référence :

- `.claude/rules/multi-agent-workflow.md` — pratique senior multi-agents (worktree, rebase précoce, push draft, stacked PRs, fix CI sans `--admin`)

Référencé par :

- `CLAUDE.md` racine (section INTERDICTIONS ABSOLUES)
- `.claude/rules/branch-strategy.md` (checklist 4 questions)
- `.claude/DECISIONS.md` (ADR-022 sur l'incident 2026-04-28, ADR-023 sur le multi-agent workflow)
