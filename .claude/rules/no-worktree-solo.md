# Pas de worktree — workflow solo

**Source de vérité unique** pour la stratégie de branche. Annule et remplace
l'ancienne règle `multi-agent-workflow.md` (supprimée le 2026-05-02 — ADR-023
marquée ANNULÉE dans `DECISIONS.md`).

---

## Principe

Roméo travaille **seul** sur ce repo, dans **un seul dossier physique** :

```
/Users/romeodossantos/verone-back-office-V1
```

Les sprints n'ont besoin que d'**une branche à la fois**. La bascule entre
branches se fait via `git checkout`. Pas de worktree, pas de dossier secondaire,
pas de checkout dans un autre chemin.

---

## INTERDICTION ABSOLUE

L'agent NE FAIT JAMAIS :

- `git worktree add ...`
- `git worktree list` / `git worktree remove` (sauf pour vérifier qu'aucun
  worktree résiduel ne traîne après cette règle — alors `git worktree remove
<path>` est autorisé pour faire le ménage)
- Tool `Agent` avec `isolation: "worktree"` — toujours laisser ce paramètre vide
  ou non spécifié

---

## Workflow standard à appliquer

### Démarrage d'un sprint

```bash
cd /Users/romeodossantos/verone-back-office-V1
git fetch origin staging
git checkout staging
git pull --ff-only origin staging
git checkout -b <type>/<TASK-ID>-<description>
```

### Pendant le sprint

```bash
# Travailler sur les fichiers
git add <fichiers>
git commit -m "[TASK-ID] type: description"
git push -u origin <branche>           # 1er push
git push --force-with-lease            # pushs suivants si rebase
```

### Bascule entre branches

Si l'agent ou Roméo doit changer de branche pendant qu'il y a du dirty state :

```bash
git status --short                     # vérifier ce qui est modifié
git stash push -m "<contexte court>"   # sauvegarder le dirty
git checkout <autre-branche>
# ... travail sur l'autre branche ...
git checkout <branche-d-origine>
git stash list                         # vérifier les stashs
git stash pop                          # restaurer (ou apply selon préférence)
```

### Clôture d'un sprint

```bash
gh pr ready <num>
gh pr checks <num> --watch
gh pr merge <num> --squash             # JAMAIS --admin
git checkout staging
git pull --ff-only origin staging
git branch -d <branche>                # cleanup local
```

---

## Cas particuliers

### Romeo lance un autre agent en parallèle (rare)

Si **vraiment** un deuxième agent travaille en même temps (cas rare) : ils
partagent le même dossier et la même branche. Coordination par `git status`
et `git pull --ff-only` simple. **Pas de worktree.** Si conflit récurrent,
arrêter un des deux agents.

### Reprendre une branche distante (ex: continuer une PR existante)

```bash
git fetch origin
git checkout <branche-distante>        # suit auto la remote tracking
```

### Si une PR ouverte couvre déjà le sujet

Voir `.claude/rules/branch-strategy.md` checklist : commit sur la branche
existante, pas de nouvelle branche.

---

## Pourquoi ce revert (2026-05-02)

L'ancienne règle `multi-agent-workflow.md` (introduite le 2026-04-30 dans
PR #862, ADR-023) imposait `git worktree add` pour gérer plusieurs agents en
parallèle dans le working dir partagé. **Le résultat a été chaotique pour Roméo
qui travaille en solo** :

- Worktrees créés à `/Users/romeodossantos/verone-mkt-002/`,
  `/Users/romeodossantos/verone-bo-var-form-002/`,
  `/Users/romeodossantos/verone-hotfix-003/`, etc. — Roméo perdait le fil de
  quel dossier contenait quel sprint.
- Confusion entre dossier principal et worktree → erreurs de serveur dev (le
  serveur Next.js servait le code d'un autre worktree, pages 500
  inexpliquées).
- Cycles CI doublés sur des PRs qui n'auraient pas dû exister.

Le worktree est utile dans les équipes multi-développeurs/CI sharded ; il est
néfaste pour un développeur solo. Cette règle restaure le workflow standard.

---

## Référence

Référencé par :

- `CLAUDE.md` racine (section WORKFLOW GIT + INTERDICTIONS ABSOLUES)
- `.claude/INDEX.md`
- `.claude/DECISIONS.md` (ADR-023 ANNULÉE 2026-05-02)
- `.claude/rules/workflow.md` (complémentaire — règle « 1 PR = 1 bloc »)
- `.claude/rules/branch-strategy.md` (complémentaire — checklist 4 questions)
- `.claude/rules/autonomy-boundaries.md` (FEU VERT inclut `git checkout -b`,
  `git stash`, mais PAS `git worktree add`)
