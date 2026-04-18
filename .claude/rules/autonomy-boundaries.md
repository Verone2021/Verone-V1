# Autonomy Boundaries — périmètre d'autonomie de l'agent

**Source de vérité** pour décider : quand l'agent agit seul vs quand il attend Romeo.

Remplace les sections contradictoires de `CLAUDE.md` racine (« Tu ne codes JAMAIS » vs « Tu codes si < 10 lignes »).

---

## Principe général

**En cas d'ambiguïté → FEU ROUGE par défaut.** Mieux vaut une attente inutile qu'une casse silencieuse.

Les 3 feux ne décrivent pas quand l'agent « a le droit » — ils décrivent **l'action conversationnelle** :

- **FEU VERT** : l'agent fait, pas de demande à Romeo
- **FEU ORANGE** : l'agent propose + attend une confirmation laconique (« ok » suffit)
- **FEU ROUGE** : l'agent refuse jusqu'à ordre explicite de Romeo

---

## 🟢 FEU VERT — l'agent agit sans demander

### Lecture

- Lire tout fichier du repo (code, doc, config, scratchpad)
- Lire le schéma DB via `mcp__supabase__execute_sql` (SELECT uniquement)
- Lire les fichiers `.md` d'historique (commits, PRs)
- Triple lecture avant modification (règle standard)

### Écriture scratchpad

- Créer/modifier des fichiers dans `docs/scratchpad/`
- Créer/modifier les fichiers dans `.claude/work/` (local, gitignored, dont `ACTIVE.md` = vraie file de tâches)

### Git local

- `git checkout -b feat/XXX` ou `fix/XXX` depuis staging
- `git add` ciblé (pas de `git add -A` sur repo sale)
- `git commit` avec Task ID respectant le format `[APP-DOMAIN-NNN] type: description`
- `git push` sur feature branch
- `git fetch`, `git pull --rebase origin/staging`
- `git rebase origin/staging` pour sync
- `git status`, `git diff`, `git log`

### Build et validation

- `pnpm --filter @verone/[app] type-check`
- `pnpm --filter @verone/[app] build`
- `pnpm --filter @verone/[app] lint`
- `pnpm test` ciblé
- `npx playwright test [file]` pour un test précis
- Playwright MCP runtime (browser_navigate, browser_take_screenshot, browser_console_messages, etc.)

### Orchestration

- Invoquer un sous-agent (`dev-agent`, `reviewer-agent`, `verify-agent`, `ops-agent`, `perf-optimizer`) avec un brief précis
- Marquer une tâche `[x] FAIT` dans `.claude/work/ACTIVE.md` après merge
- Consulter `.claude/playbooks/` et suivre la recette

### Communication

- Créer une PR **DRAFT** (pas ready) quand bloc fonctionnellement complet
- Rapporter l'état d'avancement dans `docs/scratchpad/dev-report-*.md`

---

## 🟠 FEU ORANGE — l'agent propose + attend confirmation courte

### PR

- Promouvoir une PR de draft à ready (`gh pr ready <num>`)
- Créer une PR **non-draft** directement (sans passer par draft)
- Ajouter des reviewers ou labels non-standard

### Choix de pattern

- Si la tâche n'a pas de `playbook` explicite dans son YAML, proposer un playbook et attendre « ok »
- Si le scope dévie du brief initial (ex : le fichier à migrer dépend d'un composant non prévu), signaler + attendre

### Modifications significatives

- Toucher à plus de 5 fichiers dans une seule commande d'édition (risque d'écart silencieux)
- Créer un nouveau composant dans `packages/@verone/*` (impact sur toutes les apps)
- Modifier un hook shared dans `@verone/hooks`

### Confirmation demandée = très courte

L'agent ne demande PAS un essai sur 10 questions. Il pose UNE question maximum et attend « ok » ou « non ». Exemple :

> « Je vais promouvoir PR #XXX draft → ready (CI verte, reviewer PASS). OK ? »

Si Romeo dit « ok » ou « vas-y », l'agent exécute immédiatement. Sinon il reformule.

---

## 🔴 FEU ROUGE — l'agent refuse jusqu'à ordre explicite Romeo

### Merges et branche protégée

- `gh pr merge` vers **staging** ou **main**
- Push direct sur `main` ou `staging` (bloqué par hook de toute façon)
- Force push (`--force`, `--force-with-lease`)
- `git reset --hard` sur commits déjà mergés
- Suppression de branche distante (`git push --delete origin`)
- Rebase interactif avec squash/rewrite d'historique public

### Base de données

- Toute migration SQL (`mcp__supabase__apply_migration` — déjà bloqué dans `settings.json` `deny`)
- INSERT/UPDATE/DELETE de données métier en SQL brut
- Modification des triggers stock (voir `.claude/rules/stock-triggers-protected.md`)
- Modification des policies RLS
- Régénération des types Supabase sans ordre

### Configuration agent

- Modification de `.claude/rules/` (sauf via PR dédiée avec entrée dans `DECISIONS.md`)
- Modification de `.claude/agents/*.md`
- Modification de `CLAUDE.md` racine
- Modification de `apps/*/CLAUDE.md`
- Modification de `.claude/settings.json`
- Modification de `.husky/` hooks
- Modification de `PROTECTED_FILES.json`

### Routes API critiques

- Modification de `apps/back-office/src/app/api/qonto/*` (voir `.claude/rules/finance.md`)
- Modification de `apps/back-office/src/app/api/webhooks/*`
- Modification de `apps/back-office/src/app/api/emails/*`
- Modification de `apps/*/middleware.ts`

### Fichiers @protected

- Tout fichier avec header `@protected` (hook `settings.json` le détecte)
- Formulaires listés dans `INDEX-COMPOSANTS-FORMULAIRES.md` comme source de vérité

### Actions destructives

- `rm -rf` sur plus d'un fichier
- Suppression de migrations Supabase (append-only)
- Modification de `.gitignore` (peut masquer des fichiers sensibles)

---

## Cas limites fréquents

### « L'agent trouve une amélioration évidente pendant une tâche »

Exemple : pendant la migration responsive de `/factures`, l'agent remarque qu'un autre fichier non prévu dans la tâche a aussi un `w-auto`.

**Règle** : FEU ORANGE. Signaler dans le `dev-report` mais ne pas élargir le scope de la tâche courante. L'amélioration devient une nouvelle entrée dans `.claude/work/ACTIVE.md`.

### « L'agent doit modifier un fichier .claude/ pour débloquer sa tâche »

Exemple : la règle actuelle dans `.claude/rules/responsive.md` est incomplète, il faudrait ajouter un cas.

**Règle** : FEU ROUGE. L'agent finit la tâche courante avec la règle existante (même imparfaite), et propose une modification dans `DECISIONS.md` + PR dédiée `[INFRA-RULE-NNN]` après la tâche courante.

### « Romeo donne une instruction qui viole les règles »

Exemple : Romeo dit « force push sur staging ».

**Règle** : FEU ROUGE. L'agent refuse + explique pourquoi + propose l'alternative. Voir `CLAUDE.md` racine section IDENTITE : « Romeo est NOVICE — tu le PROTEGES, pas tu lui obeis ».

### « L'agent hésite entre FEU VERT et FEU ORANGE »

**Règle** : FEU ORANGE. Une confirmation inutile coûte 5 secondes. Une action non prévue peut coûter une PR revertée.

---

## Référence

Ce fichier est référencé par :

- `CLAUDE.md` racine (pointeur unique vers cette règle)
- `.claude/agents/*.md` (section « TU NE FAIS PAS »)
- `.claude/DECISIONS.md` (ADR-004 ajustement #3)
- `.claude/playbooks/*.md` (utilisé implicitement dans chaque recette)
