# Regles Workflow Verone

**Source de vérité unique** pour le workflow Git / PR / merge. Inclut la
**checklist obligatoire avant nouvelle branche / nouvelle PR** (anciennement
`branch-strategy.md`, fusionnée ici en `[INFRA-LEAN-001]`).

**Voir aussi** : `.claude/rules/no-worktree-solo.md` — workflow solo, JAMAIS `git worktree add`.

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

## Checklist OBLIGATOIRE avant nouvelle branche / nouvelle PR

L'agent doit répondre aux **4 questions** ci-dessous AVANT toute création
de branche ou de PR. Si **une seule** réponse est ambiguë → demander Romeo
avant d'agir.

### 1. Existe-t-il déjà une PR ouverte sur le même sujet fonctionnel ?

Action attendue :

```bash
gh pr list --state open --base staging --json number,title,headRefName
```

Le "même sujet fonctionnel" = même tag domaine `[APP-DOMAIN-*]` (ex:
`[BO-LM-MISSING-*]`, `[BO-SHIP-WIZ-*]`) OU même page / même feature
métier (ex: bandeau missing-info, formulaire commande LinkMe).

**Si OUI** → continuer sur sa branche, ajouter un commit. Pas de nouvelle PR.

### 2. La correction demandée est-elle dans la même boucle d'itération ?

Si Romeo enchaîne plusieurs corrections sur le même écran ou la même
feature dans la même session, c'est UNE seule itération → UNE seule branche.

**Exemple concret** : redesign du bandeau missing-info, puis ajout d'un
bouton inline, puis filtre destinataire. Tout sur la même feature →
empiler les commits sur la même branche.

**Si OUI** → continuer sur la branche actuelle.

### 3. Romeo a-t-il explicitement dit "fais une nouvelle PR" ?

L'agent ne décide PAS seul de séparer les changements en plusieurs PRs.
Soit Romeo a explicitement demandé une PR séparée ("fais une PR à part pour ça"),
soit la règle par défaut s'applique : **commit sur la branche en cours**.

**Si NON** → reste sur la branche en cours.

### 4. Le sujet touche-t-il un RPC, une fonction DB, ou une colonne ?

Si oui, la PR DOIT inclure dans le même commit (ou un 2e commit sur la même branche) :

```bash
pnpm run generate:types
git add packages/@verone/types/src/supabase.ts
```

**Pourquoi** : sans ça, le check `Supabase TS types drift (blocking)` du workflow Quality fail au moment du merge release staging→main. Il faut alors créer une PR de rattrapage qui ajoute ~25 min de plus.

Si `pnpm run generate:types` échoue (CLI Supabase non auth), utiliser `mcp__supabase__generate_typescript_types`. **Attention** : le MCP omet le schema `graphql_public`. Pour un fichier byte-for-byte conforme au CI, télécharger l'artifact `supabase-types-drift` du run failed du CI et utiliser `supabase.ts.generated`.

### Règle d'or de cette checklist

**Par défaut, commit sur la branche en cours.** La création d'une nouvelle
branche est l'exception, pas la règle. Une nouvelle branche se justifie
SEULEMENT si :

- Sujet **complètement** différent (pas de lien fonctionnel)
- Romeo demande explicitement une PR séparée
- La PR ouverte précédente est déjà mergée et le sujet a changé

### Au démarrage de chaque session

L'agent DOIT exécuter en première action :

```bash
gh pr list --state open --base staging --json number,title,headRefName,isDraft
```

Et garder en tête les sujets en cours pour ne pas en créer de redondants.

### Si la règle semble impossible à respecter

Cas typique : Romeo demande pendant une PR ouverte un fix totalement
indépendant et urgent. Alors :

1. **Demander** : "Je suis sur la branche X (PR #YYY pour le sujet A). Tu veux que ce nouveau fix B parte sur la même PR ou je crée une PR dédiée ?"
2. **Attendre** la réponse explicite
3. Agir selon

Une demande inutile coûte 5 secondes. Une PR éclatée coûte 1h de rebase.

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
- **`git push --force-with-lease`** au lieu de `--force` nu. Garde-fou contre l'écrasement accidentel après rebase.

**JAMAIS** :

- Commit "WIP" vague sans contenu clair
- Push force (`--force` nu) — toujours `--force-with-lease`
- Commit sans Task ID (sauf `[NO-TASK]` pour chores)
- `git worktree add` (cf. `.claude/rules/no-worktree-solo.md`)

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

=> BANNI. Regrouper en 1 seule PR "[BO-UI-RESP-003] Pattern A critique".

### Merge

- **1 merge squash par PR** (pour garder historique propre)
- Merge SEULEMENT quand le bloc entier est fini
- NE JAMAIS merger en cours de bloc pour "avancer"

### Branches

- Une seule branche par bloc de travail
- Branche vit plusieurs jours si necessaire (normal pour senior)
- Bascule entre branches via `git checkout <autre-branche>` (avec `git stash` si dirty). Voir `.claude/rules/no-worktree-solo.md`.

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
- PR 3 `[BO-UI-RESP-FORMS] Patterns E + F (modals et forms)` = sprint 008
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

## Anti-patterns interdits (checklist branche/PR)

- ❌ Créer une nouvelle branche pour ajouter un fix UX à un bandeau qui est déjà l'objet d'une PR ouverte
- ❌ Créer 2 branches pour 2 commits qui touchent les mêmes fichiers
- ❌ Merger une PR puis créer immédiatement une autre PR sur le même écran pour un raffinement (le raffinement aurait dû être un commit de plus avant le merge)
- ❌ Force-rebase à répétition parce que les branches partent de staging à des moments différents

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

## Playbooks

Pour la migration responsive uniquement, consulter `.claude/playbooks/migrate-page-responsive.md` qui capture le fix du bug "Rendered more hooks" du pilote v1 FAIL.

Les autres playbooks ont ete supprimes (voir `DECISIONS.md` ADR-011) car ils dupliquaient les capacites natives de Claude Code.

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

Voir question 4 de la checklist en haut de fichier.

### 3. Détection systématique des onglets fantômes

Si on touche au composant `apps/back-office/src/components/layout/channel-tabs.tsx` ou si on découvre un lien 404, audit complet des onglets de TOUS les canaux à faire **dans la même PR**, pas un canal à la fois.

---

## Référence

Référence externe :

- `.claude/rules/no-worktree-solo.md` — workflow solo, JAMAIS `git worktree add`

Référencé par :

- `CLAUDE.md` racine (section WORKFLOW GIT + INTERDICTIONS ABSOLUES)
- `.claude/agents/ops-agent.md`, `dev-agent.md`
- `.claude/commands/pr.md`
- `.claude/DECISIONS.md` (ADR-022 — incident bundling 2026-04-28, ADR-024 — workflow solo restauré 2026-05-02, ADR-025 — fusion `[INFRA-LEAN-001]` 2026-05-02)
