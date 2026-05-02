# Multi-Agent Workflow — Branche tôt, rebase souvent, fail fast

**Source de vérité** pour le travail en parallèle (plusieurs agents Claude
Code, ou un agent + Romeo qui code lui-même, ou un agent qui dispatche un
sous-agent `dev-agent`).

Lecture obligatoire AVANT :

- Tout `git checkout -b`
- Tout `gh pr create`
- Tout `gh pr merge`
- Tout brief envoyé à un autre agent (Agent tool, Task tool, sous-agent)

Cette règle complète :

- `.claude/rules/workflow.md` (règle « 1 PR = 1 bloc cohérent »)
- `.claude/rules/branch-strategy.md` (checklist 4 questions avant nouvelle branche)
- `.claude/rules/autonomy-boundaries.md` (FEU VERT / ORANGE / ROUGE)

---

## Principe fondamental : pas d'attente, du rebase

**Anti-pattern à bannir absolument** : « j'attends que l'autre agent
finisse avant de créer ma branche ». L'attente cache les conflits jusqu'au
dernier moment où ils explosent en gros bloc impossible à débrouiller en
30 min de CI.

**Pratique senior** : chaque agent crée sa branche **immédiatement** depuis
`staging` à jour, push sa PR draft tout de suite (sauvegarde + visibilité),
et **rebase souvent** (avant chaque push) pour absorber les changements des
autres au fur et à mesure. Les conflits éventuels apparaissent petits, dès
qu'ils existent (5 min de résolution), au lieu d'exploser plus tard
(30 min + retry CI).

Ce workflow est la pratique mainstream chez Stripe, Shopify, Meta (via
Phabricator), Anthropic. Il est standardisé via les outils :

- `git worktree` (Git 2.5+, 2015) pour l'isolation locale
- Stacked PRs (Phabricator, Graphite) pour les dépendances
- Branch protection rules GitHub (enforce_admins) pour empêcher les bypass

---

## 1. Workflow standard SOLO (un seul agent travaille)

### Au démarrage du sprint

```bash
# Sync staging local
git fetch origin staging
git checkout staging
git pull --rebase origin staging

# Créer la branche IMMÉDIATEMENT (même avec juste un scratchpad)
git checkout -b feat/[APP-DOMAIN-NNN]-description

# Premier commit (peut être juste le scratchpad de plan)
git add docs/scratchpad/dev-plan-*.md
git commit -m "[APP-DOMAIN-NNN] chore: scaffold task plan"
git push -u origin feat/[APP-DOMAIN-NNN]-description

# Push draft IMMÉDIAT pour visibilité multi-agents
gh pr create --draft --base staging \
  --title "[APP-DOMAIN-NNN] type: description (draft)" \
  --body "$(cat <<'EOF'
## Fichiers touchés (visibilité multi-agents)
- path/to/file1.ts (à modifier)
- path/to/file2.tsx (à modifier)
- nouveau: path/to/file3.tsx

## Statut
🚧 En cours — sprint démarré, pas encore prêt pour review.

## À ne PAS toucher en parallèle
- [autres fichiers en conflit potentiel]
EOF
)"
```

**Pourquoi push draft immédiat** : la PR existe = signal pour les autres
agents « je touche à X ». Sauvegarde permanente sur GitHub (pas de perte si
crash machine). CI peut tourner en background.

### Avant chaque push suivant (réflexe toutes les 1-2h)

```bash
# Sync staging à jour
git fetch origin staging

# Rebase sur staging
git rebase origin/staging

# Si conflit : résoudre TOUT DE SUITE (5 min vs 30 min plus tard)
# Si pas de conflit : push direct
git push --force-with-lease
```

**`--force-with-lease` au lieu de `--force`** : refuse de pousser si
quelqu'un d'autre a poussé sur la même branche depuis ton dernier fetch.
Garde-fou contre l'écrasement accidentel.

### Avant de promouvoir draft → ready

```bash
# Ultime sync
git fetch origin staging
git rebase origin/staging

# Validations finales
pnpm --filter @verone/back-office type-check
pnpm --filter @verone/back-office build

# Mettre à jour la section "## Fichiers touchés" si elle a évolué
# (lister les fichiers réellement modifiés via git diff --stat origin/staging...HEAD)

git push --force-with-lease

# Promouvoir
gh pr ready <num>
```

---

## 2. Workflow MULTI-AGENTS (ex: Romeo lance dev-agent en parallèle)

### Règle critique : working directory partagé

Quand plusieurs agents travaillent en même temps sur la machine de Romeo,
ils partagent le **même working directory physique**
`/Users/romeodossantos/verone-back-office-V1/`. Faire `git checkout
<branche>` ou `git pull --rebase` dedans **change la branche active sous
les pieds de l'autre agent** et casse son contexte.

**Solution OBLIGATOIRE** : `git worktree`.

### Quand un autre agent travaille en parallèle dans le même working dir

```bash
# 1. Vérifier les PRs ouvertes (autres agents)
gh pr list --state open --base staging --json number,title,headRefName,isDraft

# 2. Créer un worktree isolé (dossier séparé, branche séparée)
git fetch origin staging
git worktree add /Users/romeodossantos/verone-[task-short] -b feat/[APP-DOMAIN-NNN]-description origin/staging

# 3. Travailler ENTIÈREMENT dans ce dossier
cd /Users/romeodossantos/verone-[task-short]

# 4. Workflow standard (push draft immédiat, rebase précoce, etc.)
git push -u origin feat/[APP-DOMAIN-NNN]-description
gh pr create --draft --base staging --head feat/[APP-DOMAIN-NNN]-description ...

# 5. À la fin (PR mergée par Romeo)
cd /Users/romeodossantos/verone-back-office-V1   # retour au working dir principal
git worktree remove /Users/romeodossantos/verone-[task-short]
git branch -d feat/[APP-DOMAIN-NNN]-description   # cleanup local
```

### Quand l'agent dispatche un sous-agent (Agent tool)

Le tool Agent supporte nativement `isolation: "worktree"` → utiliser
**systématiquement** quand un autre agent humain est en cours dans le
working dir partagé.

Exemple :

```js
Agent({
  description: 'Sprint BO-VAR-FORM-002 implementation',
  subagent_type: 'dev-agent',
  isolation: 'worktree',
  prompt: '...',
});
```

Sans `isolation: "worktree"`, le sous-agent peut faire un `git checkout`
qui casse le contexte de l'agent humain en cours. **Risque réel observé le
2026-04-30.**

### Brief multi-agents — scope explicite obligatoire

Quand l'agent prépare un brief pour un autre agent (en parallèle), il doit
préciser :

```markdown
Tu fais [Bloc X — Description].

Référence : [chemin scratchpad]

## Scope (fichiers que tu peux toucher)

- path/to/file1.ts
- path/to/file2.tsx
- nouveau : path/to/file3.tsx

## Tu ne dois PAS toucher à

- packages/@verone/types/src/supabase.ts (en cours sur PR #XXX)
- [autres fichiers en conflit potentiel]

## Workflow obligatoire

1. `git worktree add` (autre agent dans working dir partagé)
2. Push PR draft IMMÉDIATEMENT (visibilité multi-agents)
3. Rebase sur `origin/staging` avant chaque push (toutes les 1-2h)
4. Avant promote ready : ultime rebase + type-check + tests
5. PAS de `--admin` (cf. règle FEU ROUGE)
6. Liste les fichiers touchés en haut de la PR description (section `## Fichiers touchés`)

Ne merge PAS sans ordre explicite Romeo.
```

### Détection d'overlap

Avant de créer ta branche, vérifier les PRs ouvertes :

```bash
gh pr list --state open --base staging --json number,title,headRefName,files
```

Si une autre PR touche le même fichier que toi :

- **Option A — Stacked** : si dépendance forte (B ne compile pas sans A) →
  brancher depuis la branche A (cf. section 3 ci-dessous)
- **Option B — Coordination** : signaler à Romeo en UNE phrase :
  > « PR #XXX touche aussi `<file>` — je propose stacked sur la sienne ou
  > j'attends son merge — laquelle ? »
- **Option C — Indépendant** : si le fichier touché est gros et les zones
  édit ne se chevauchent pas → continuer, rebaser au croisement

---

## 3. Stacked PRs (B dépend de A)

Quand la branche B nécessite du code de la branche A pas encore mergé sur
staging :

```bash
# A est déjà créée, en cours sur PR #XXX
# B branche depuis A (pas depuis staging)
git fetch origin
git checkout feat/agent-A-task
git pull --rebase origin feat/agent-A-task
git checkout -b feat/agent-B-task

# ... travail ...

# PR de B avec base = branche A
gh pr create --draft \
  --base feat/agent-A-task \
  --head feat/agent-B-task \
  --title "[APP-DOMAIN-NNN] type: description (stacked sur #XXX)" \
  --body "Stacked sur #XXX — merger A first."
```

**Comportement GitHub** : quand A est mergée sur staging, GitHub change
automatiquement la base de B vers staging. B reste mergeable sans manip.

**Quand utiliser stacked** :

- Dépendance forte (B casse sans A)
- Review parallèle souhaitée (A peut être reviewée pendant que B continue)

**Quand NE PAS utiliser stacked** :

- Sujets indépendants (rebase suffit, pas besoin d'empiler)
- A est instable (force-push fréquent → B doit rebase à chaque fois)

**Si A change de scope (force-push)** :

```bash
git rebase --onto origin/feat/agent-A-task <ancien-base> feat/agent-B-task
```

---

## 4. Communication PR — section « Fichiers touchés »

**Toujours en haut du body de chaque PR** (draft ou ready) :

```markdown
## Fichiers touchés (visibilité multi-agents)

- packages/@verone/categories/src/hooks/use-catalogue.ts
- apps/back-office/src/app/(protected)/produits/catalogue/page.tsx
- nouveau: apps/back-office/.../CatalogueBulkActionsBar.tsx

## Tu ne dois PAS toucher à (si applicable)

- [fichiers couverts par d'autres PRs ouvertes]
```

**Pourquoi** : sans cette section, un autre agent doit faire `gh pr diff
<num> --stat` pour comprendre le scope. Avec, la visibilité est immédiate.

**Mise à jour obligatoire** : si le scope évolue pendant le travail, mettre
à jour la section AVANT le promote ready :

```bash
gh pr edit <num> --body "$(cat <<'EOF'
## Fichiers touchés (visibilité multi-agents)
[liste à jour via git diff --stat origin/staging...HEAD]
...
EOF
)"
```

---

## 5. Fix CI blocking sans `--admin`

Si un check blocking fail (ex: `Supabase TS types drift`, `DB FK drift`,
`E2E Smoke`), la pratique senior est d'**ouvrir un commit atomique de fix
sur la même branche** plutôt qu'utiliser `gh pr merge --admin`.

```bash
git checkout feat/branche-en-cours
git pull --rebase origin feat/branche-en-cours

# Fix le problème (regen types, ajustement, etc.)
git add packages/@verone/types/src/supabase.ts
git commit -m "[APP-DOMAIN-NNN] chore: fix Supabase types drift"
git push --force-with-lease

# La CI re-run sur la même branche, le check passe vert
gh pr checks <num> --watch
gh pr merge <num> --squash
```

**`--admin` est INTERDIT ABSOLU pour l'agent** (cf.
`.claude/rules/autonomy-boundaries.md` FEU ROUGE), peu importe le
contexte. Le bypass `--admin` reste réservé à Romeo lui-même via le UI
GitHub. Si Romeo dit « merge tout maintenant » et qu'un check fail,
l'agent dit clairement :

> « Le check X fail, je propose de fix avant merge (5-15 min) — OK ? »

---

## 6. Anti-patterns interdits

| Anti-pattern                                                      | Pourquoi c'est interdit                                                    | Alternative                                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| « J'attends que l'autre agent finisse »                           | Cache les conflits jusqu'au dernier moment                                 | Branche tôt + rebase précoce                           |
| `git checkout` ou `git pull` dans working dir partagé             | Casse le contexte de l'autre agent                                         | `git worktree add`                                     |
| Push final sans rebase intermédiaire                              | Conflits massifs au merge                                                  | Rebase avant chaque push                               |
| PR créée seulement quand bloc complètement fini                   | Pas de visibilité multi-agents, pas de sauvegarde GitHub                   | Push draft IMMÉDIATEMENT après création de la branche  |
| `gh pr merge --admin` pour bypasser un check fail                 | Régression silencieuse en prod (incident 2026-04-30)                       | Commit de fix atomique sur la même branche             |
| `git push --force` (sans `--with-lease`)                          | Écrase les pushs des autres                                                | `git push --force-with-lease`                          |
| PR sans section `## Fichiers touchés`                             | Les autres agents ne voient pas le scope                                   | Toujours inclure la section en haut du body            |
| Brief sous-agent sans scope ni « fichiers à éviter »              | Conflit garanti si plusieurs agents touchent les mêmes fichiers            | Brief explicite avec scope + fichiers à ne pas toucher |
| Sous-agent dispatché sans `isolation: "worktree"` en multi-agents | Le sous-agent fait `git checkout` et casse le contexte de l'agent en cours | `Agent({ isolation: "worktree", ... })` systématique   |

---

## 7. Cas particulier : Romeo code en parallèle de l'agent

Quand Romeo code lui-même (ou via un autre Claude Code) et que l'agent
travaille en parallèle :

1. L'agent **demande** avant tout `git checkout` ou `git pull` :
   > « Je vais sync staging dans le working dir principal. Tu es sur quelle
   > branche actuellement ? »
2. Si Romeo répond qu'il est sur une branche → l'agent utilise un worktree
   isolé (cf. section 2) au lieu de toucher au working dir principal.
3. Si Romeo répond qu'il est sur staging et propre → l'agent peut sync
   normalement.

**Règle d'or** : `git fetch` est toujours safe (lecture pure des refs).
Mais `git checkout` et `git pull --rebase` modifient l'état local — donc
**demander avant** si quelqu'un d'autre travaille.

---

## 8. Checklist mentale avant chaque action git

- [ ] Est-ce que je sais quelles PRs sont ouvertes ?
      (`gh pr list --state open`)
- [ ] Est-ce qu'un autre agent travaille en parallèle dans le working dir ?
      → si oui, `git worktree add` au lieu de `git checkout`
- [ ] Est-ce que ma branche est rebasée sur `origin/staging` récente ?
      → si non, `git fetch && git rebase origin/staging` AVANT de push
- [ ] Est-ce que ma PR a la section `## Fichiers touchés` à jour ?
- [ ] Est-ce que je vais pousser en draft (sauvegarde) ou ready (review) ?
- [ ] Est-ce que la CI est verte ? Si non, fix par commit atomique, pas
      `--admin`.

---

## 9. Référence

Référencé par :

- `CLAUDE.md` racine (table SOURCES DE VERITE + section WORKFLOW GIT)
- `.claude/rules/workflow.md` (complémentaire — règle « 1 PR = 1 bloc »)
- `.claude/rules/branch-strategy.md` (complémentaire — checklist 4 questions)
- `.claude/rules/autonomy-boundaries.md` (FEU VERT inclut `git worktree add`)
- `.claude/agents/dev-agent.md` (workflow obligatoire)
- `.claude/agents/ops-agent.md` (rebase précoce + push draft immédiat)
- `.claude/commands/pr.md` (section « Fichiers touchés » dans body)
- `.claude/DECISIONS.md` (ADR-023)

Mémoires personnelles agent (héritage) :

- `feedback_rebase_first_branch_early.md`
- `feedback_stacked_prs_and_blocking_checks.md`
- `feedback_multi_agent_scope.md`
- `feedback_multi_agent_use_worktree.md`
- `feedback_no_release_main_without_explicit_order.md`

Sources externes (pratique senior 2026) :

- Trunk-based development (DORA, Accelerate book)
- Phabricator/Graphite stacked PRs (Meta)
- Git worktree docs (Git 2.5+, 2015)
- GitHub branch protection rules (enforce_admins)
- Atlassian rebase vs merge guide
