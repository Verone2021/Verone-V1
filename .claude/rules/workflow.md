# Regles Workflow Verone

**Source de verite pour le workflow Git / PR / merge. Lecture obligatoire
par tous les agents avant toute action git.**

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

**JAMAIS** :

- Commit "WIP" vague sans contenu clair
- Push force (`--force`) sans autorisation Romeo
- Commit sans Task ID (sauf `[NO-TASK]` pour chores)

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
- Rebase regulier sur staging pour eviter conflits : `git rebase origin/staging`

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
