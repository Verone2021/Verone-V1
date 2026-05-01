# [INFRA-RULES-003] Fix commit-msg hook regex — Plan

**Date** : 2026-05-01
**Branche** : `chore/INFRA-RULES-003-fix-commit-msg-hook`
**Worktree** : `/Users/romeodossantos/verone-infra-rules-003`
**Base** : `staging`
**Statut** : 🚧 Plan — push draft immédiat puis fix + tests

---

## Contexte

Le hook `.husky/commit-msg` actuel refuse les Task IDs avec **suffixe lettre
minuscule** (ex: `[BO-BRAND-003b]`). La regex finale `[0-9]{3}` exige des
chiffres uniquement, sans suffixe.

Bloque les sprints sub-séquencés (003b, 004c, etc.) qui sont fréquents en
pratique pour split un sprint en blocs cohérents (DB-only / UI-only) tout en
gardant le même domaine fonctionnel.

**Constaté empiriquement le 2026-05-01** : sprint BO-BRAND-003b a été
contraint de rebasculer sur `[BO-BRAND-003]` pour le commit dev-agent
(`a105f48a`), créant une incohérence cosmétique sur la branche.

Ordre Romeo en conversation Cowork du 2026-05-01 : FEU ROUGE levé pour
modifier `.husky/commit-msg` via cette PR dédiée.

---

## État actuel

`/Users/romeodossantos/verone-infra-rules-003/.husky/commit-msg` :

```sh
pattern="^\[(([A-Z]{2,5}(-[A-Z0-9]{2,10}){1,3}-[0-9]{3})|NO-TASK)\] (feat|fix|chore|docs|refactor|test|style|perf):"
```

Tests empiriques du 2026-05-01 :
- `[BO-BRAND-003] feat: test` → ✅ MATCH
- `[BO-BRAND-003b] feat: test` → ❌ NO MATCH (refusé)

---

## Solution proposée

Modifier la regex pour accepter un **suffixe lettre minuscule optionnel** (1
lettre max). Le `?` rend le suffixe optionnel → rétrocompat totale (tous les
Task IDs existants restent valides).

```sh
# AVANT
pattern="^\[(([A-Z]{2,5}(-[A-Z0-9]{2,10}){1,3}-[0-9]{3})|NO-TASK)\] ...:"

# APRÈS
pattern="^\[(([A-Z]{2,5}(-[A-Z0-9]{2,10}){1,3}-[0-9]{3}[a-z]?)|NO-TASK)\] ...:"
```

Diff = `[0-9]{3}` → `[0-9]{3}[a-z]?`.

---

## Tests obligatoires

### Cas valides (doivent passer)

| Task ID | Pourquoi | Avant fix | Après fix |
|---|---|---|---|
| `[LM-ORD-009] feat: ...` | Standard | ✅ | ✅ |
| `[BO-DASH-001] fix: ...` | Standard | ✅ | ✅ |
| `[BO-UI-RESP-001] feat: ...` | Domaine composé | ✅ | ✅ |
| `[INFRA-DOC-002] chore: ...` | Domaine INFRA | ✅ | ✅ |
| `[NO-TASK] chore: ...` | Bypass intentionnel | ✅ | ✅ |
| **`[BO-BRAND-003b] feat: ...`** | Suffixe lettre | ❌ → ✅ | ✅ (NOUVEAU) |
| **`[BO-MKT-001a] chore: ...`** | Suffixe lettre | ❌ → ✅ | ✅ (NOUVEAU) |
| **`[INFRA-RULES-003] chore: ...`** | Cette PR elle-même | ✅ | ✅ |

### Cas invalides (doivent refuser)

| Mauvais format | Pourquoi |
|---|---|
| `[invalid] feat: ...` | Pas de Task ID |
| `feat: missing brackets` | Pas de crochets |
| `[BO-BRAND-003ab] feat: ...` | 2 lettres (refusé par `[a-z]?`) |
| `[BO-BRAND-003B] feat: ...` | Lettre majuscule (déjà dans `[A-Z0-9]` peut potentiellement matcher 003B, mais devra être testé) |
| `[BO-BRAND-3] feat: ...` | Pas 3 chiffres |

---

## Plan de commits (2 commits, 1 PR)

### Commit 1 — Scaffold dev-plan (push draft immédiat)

```
[INFRA-RULES-003] chore: scaffold INFRA-RULES-003 plan
```

**Fichier** : `docs/scratchpad/dev-plan-INFRA-RULES-003.md` (ce fichier)

### Commit 2 — Fix regex commit-msg hook

```
[INFRA-RULES-003] chore: extend commit-msg regex to allow letter suffix
```

**Fichiers modifiés** :
- `.husky/commit-msg` : regex étendue + commentaire explicatif
- (optionnel) `.claude/rules/workflow.md` : note sur le format Task ID

**Tests manuels avant push** :
1. Test bash direct (regex isolée) : 8 cas valides + 5 cas invalides
2. Test git réel : `git commit --allow-empty -m "[BO-BRAND-003b] test"` doit passer
3. Test git réel : `git commit --allow-empty -m "[invalid] test"` doit refuser
4. `git reset HEAD~1` après tests pour ne pas polluer l'historique

---

## Workflow

- ✅ Commit 1 + push draft IMMÉDIAT
- 🔁 `git fetch origin staging` + `git rebase origin/staging` AVANT push commit 2
- 🔒 `git push --force-with-lease`
- 🚫 Pas de `--no-verify` (le test du hook nécessite que le hook tourne !)
- 🚫 Pas de `--admin` au merge

---

## Acceptance criteria

- [ ] Commit 1 — dev-plan committé
- [ ] Commit 2 — regex étendue + commentaire à jour dans le hook
- [ ] Tests bash : 8 cas valides MATCH, 5 cas invalides NO MATCH
- [ ] Tests git réels OK
- [ ] CI 100% verte
- [ ] Reviewer-agent PASS (optionnel pour ce sprint trivial — Romeo décidera)

---

## Hors scope

- ❌ Modification d'autres hooks (pre-commit, pre-push)
- ❌ Modification de la doc CLAUDE.md
- ❌ Ajout de validation supplémentaire (longueur, ponctuation)

---

## Estimation

- Commit 1 (scaffold + push draft) : 5 min
- Commit 2 (fix regex + tests) : 15 min
- CI : ~5 min (pas de build, juste lint sh + check format)
- **Total** : ~25 min

---

## Référence

- Sprint déclencheur : BO-BRAND-003b (PR #870, draft)
- Hook actuel : `.husky/commit-msg`
- Workflow Verone : `.claude/rules/workflow.md` (format `[APP-DOMAIN-NNN]`)
