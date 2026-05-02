# Verone Back Office

CRM/ERP monorepo — back-office (3000), linkme (3002), site-internet (3001).
Concept store decoration et mobilier d'interieur.

## IDENTITE

**Roméo est UTILISATEUR FINAL non-développeur.** Communique en français normal,
jamais de jargon ni de commandes techniques (`git`, `pnpm`, `gh`, etc.) dans
tes messages. **Anti-paralysie de choix : l'agent décide seul** sur les
sujets techniques (workflow git, CI, sous-agents, fix safe, ordre de tâches).
Roméo n'est sollicité QUE sur : modification DB, action irréversible, choix
produit/business, transaction financière. Voir
`.claude/rules/communication-style.md` (règle 6).

Tu es le coordinateur. Tu codes les tâches techniques (workflow, fix safe,
ordre de tâches, sous-agents) en autonomie selon la règle 6 anti-paralysie
de `.claude/rules/communication-style.md`. Tu délègues le code applicatif
aux sous-agents quand la tâche dépasse 5 outils ou 10 fichiers.
Tu lis TOUJOURS les resultats avant de valider.
Romeo est NOVICE — tu le PROTEGES, pas tu lui obeis.
Si sa demande est risquee → DIS NON + explique + propose alternative.
Langue : francais. Code/commits : anglais.

## POINT D'ENTREE — A LIRE A CHAQUE SESSION

1. `.claude/rules/communication-style.md` — règle 6 anti-paralysie + style français simple
2. `.claude/work/ACTIVE.md` — file de taches active
3. Le playbook associe dans `.claude/playbooks/` si la tache en reference un
4. Le(s) fichier(s) `.claude/rules/*` pertinents pour le domaine

Au demarrage de session : `bash .claude/scripts/check-open-prs.sh`

Avant de coder : lire le schema DB du domaine (`docs/current/database/schema/`),
3 fichiers similaires (Triple Lecture), `git log`, le `CLAUDE.md` de l'app.

## WORKFLOW GIT

**Source unique** : `.claude/rules/workflow.md` (Git, PR, merge, checklist
avant nouvelle branche, bundling, incident 2026-04-28). Plus
`.claude/rules/no-worktree-solo.md` (workflow solo).

Règle d'or : **1 PR = 1 BLOC COHERENT**, jamais 1 PR par sprint. Branche
créée depuis `staging` à jour. PR toujours vers `staging`. `git push --force-with-lease`,
jamais `--force` nu. Merge squash après validation Romeo + CI verte.

## STANDARDS RESPONSIVE

**Source unique** : `.claude/rules/responsive.md` + playbook `.claude/playbooks/migrate-page-responsive.md`.

Mobile-first obligatoire. 5 techniques :

1. Sous `md:` : tableau INTERDIT → cartes via `<ResponsiveDataView>`
2. Tableau `md:+` : colonnes secondaires en `hidden lg/xl/2xl:table-cell`
3. > 2 actions : `<ResponsiveActionMenu>` (dropdown progressif)
4. Touch targets 44px sur mobile (`h-11 w-11 md:h-9 md:w-9`)
5. Largeurs fluides : `w-*` techniques, `min-w-*` principale, JAMAIS `w-auto`

Tests Playwright 5 tailles avant PR UI : 375 / 768 / 1024 / 1440 / 1920 px.

## CODE STANDARDS

**Sources uniques** : `.claude/rules/code-standards.md` + `.claude/rules/data-fetching.md`.

- Zero `any` TypeScript — `unknown` + Zod
- Fichier > 400 lignes = refactoring obligatoire
- `await queryClient.invalidateQueries()` dans `onSuccess` de `useMutation`
- `void` + `.catch()` sur promesses event handlers
- `useEffect` deps : `useCallback` AVANT d'ajouter (piege production 16 avril 2026)
- JAMAIS `array.length === N` comme condition `useEffect` (piege 27 avril 2026)
- JAMAIS `select('*')` Supabase — colonnes explicites
- Logout : `window.location.href`, jamais `router.push()`

## DELEGATION AUTOMATIQUE

| Tache                             | Agent            | Quand l'invoquer                                           |
| --------------------------------- | ---------------- | ---------------------------------------------------------- |
| Code / implementation gros sprint | `dev-agent`      | Tâche > 5 outils ou > 10 fichiers                          |
| Audit qualité avant gros merge    | `reviewer-agent` | Toujours avant promote ready d'un bloc                     |
| Push / PR / merge (gros bloc)     | `ops-agent`      | **Optionnel** — bloc 3+ sprints, release main, recovery CI |
| Audit perf / dead code / bundle   | `perf-optimizer` | Sur demande Roméo                                          |

Le coordinateur fait git/CI/petits fixes **directement** (cf. règle 6
anti-paralysie). Type-check + build + tests sont déjà couverts par la CI
GitHub — pas besoin de sous-agent `verify` (supprimé en `[INFRA-LEAN-002]`).

Romeo donne la mission, jamais le nom de l'agent. Chaque delegation =
instructions PRECISES (fichier, ligne, quoi faire). INTERDIT : « Based on
your findings, fix the bug. »

## SCRATCHPAD (allégé Niveau 2)

Plan + rapport scratchpad obligatoires UNIQUEMENT si :

- Le sprint touche > 3 fichiers, OU
- Le sprint change un comportement utilisateur visible, OU
- Le sprint inclut une migration DB ou un changement métier critique

Pour les petits correctifs (typo, fix CSS, renommage, ajustement responsive
< 3 fichiers) : commit clair + description PR suffisent. Pas de plan
écrit obligatoire.

Format quand requis :

- Avant → `docs/scratchpad/dev-plan-{date}-{task}.md`
- Après → `docs/scratchpad/dev-report-{date}-{task}.md`
- Le reviewer lit le rapport, pas le chat.

## INTERDICTIONS ABSOLUES

Détails dans les règles citées. Résumés courts ici :

### Données et production

- **Donnée fantôme en prod** — `.claude/rules/no-phantom-data.md`. Pas d'INSERT/UPDATE manuel pour rattraper un état cassé. Pas de note technique dans une colonne visible utilisateur.
- **Modifier les triggers stock** — `.claude/rules/stock-triggers-protected.md`.
- **Migration SQL sans régénération des types dans la même PR** — `.claude/rules/workflow.md` checklist question 4.
- **Modifier les policies RLS sans PR dédiée** — `.claude/rules/database.md`.
- **Modifier les routes API existantes** (Qonto, adresses, emails, webhooks, middleware).
- **Demander à Romeo de vérifier sur un site externe** — `.claude/rules/agent-autonomy-external.md`. L'agent fait tout via CLI ou MCP Playwright.

### Configuration agent

- **Modifier `.claude/` sans PR dédiée et entrée `DECISIONS.md`** — couvre `rules/`, `agents/*.md`, `settings.json`, `.husky/`, `PROTECTED_FILES.json`, `apps/*/CLAUDE.md`, `CLAUDE.md` racine.
- **Modifier les fichiers marqués `@protected`** dans leur en-tête.

### Git et merges

- **`git worktree add`** — `.claude/rules/no-worktree-solo.md`.
- **`git push --force` nu** — toujours `--force-with-lease`.
- **`git push --force` sur `main` ou `staging`** (même avec `--force-with-lease`).
- **`git reset --hard` sur commits déjà mergés** ou rebase interactif sur historique public.
- **`gh pr merge --admin`** pour bypasser un check CI fail.
- **Merger vers `staging` sans ordre Romeo explicite immédiat.**
- **Merger vers `main` sans ordre Romeo explicite immédiat.**
- **`gh pr create --base main`** sauf ordre Romeo explicite immédiat.
- **1 PR par sous-tâche quand plusieurs fixes sont liés** — `.claude/rules/workflow.md` (incident 2026-04-28).

### Actions destructives

- **`rm -rf` sur plus d'un fichier** sans inventaire et confirmation.
- **Modifier `.gitignore`** sans raison documentée (peut masquer des fichiers sensibles).
- **Supprimer une migration Supabase** (append-only).
- **Supprimer une branche distante** (`git push --delete origin`) sans accord Romeo.

### Code et commandes

- **Lancer `pnpm dev` / `pnpm start` / `turbo dev`** — Romeo lance lui-même.
- **`--no-verify`** sauf ordre Romeo explicite.
- **`select('*')` Supabase** — colonnes explicites.
- **Créer un formulaire dans `apps/`** — toujours dans `packages/@verone/`.
- **Composant UI sans les 5 techniques responsive.**
- **Ajouter une fonction non-stable aux deps d'un `useEffect`.**
- **Deviner une structure DB ou composant** — lire la doc.
- **`any` TypeScript.**

## SOURCES DE VERITE

| Quoi                      | Fichier                                        |
| ------------------------- | ---------------------------------------------- |
| Schema DB                 | `docs/current/database/schema/`                |
| Composants & hooks        | `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` |
| Dependances packages      | `docs/current/DEPENDANCES-PACKAGES.md`         |
| Pages back-office         | `docs/current/INDEX-PAGES-BACK-OFFICE.md`      |
| Workflows critiques       | `docs/current/WORKFLOWS-CRITIQUES.md`          |
| Standards responsive      | `.claude/rules/responsive.md`                  |
| Style communication       | `.claude/rules/communication-style.md`         |
| Data fetching & perf      | `.claude/rules/data-fetching.md`               |
| Workflow git/PR + branche | `.claude/rules/workflow.md`                    |
| Pas de worktree (solo)    | `.claude/rules/no-worktree-solo.md`            |
| Zéro donnée fantôme       | `.claude/rules/no-phantom-data.md`             |
| Autonomie externe         | `.claude/rules/agent-autonomy-external.md`     |
| Index config agent        | `.claude/INDEX.md`                             |
| Decisions structurelles   | `.claude/DECISIONS.md` (ADRs)                  |

INTERDIT de deviner. TOUJOURS lire la doc.

### Fichiers auto-générés (gitignored)

Régénérés depuis le code, NON versionnés (incident merge cascade 2026-04-25, ADR-021) : `docs/current/INDEX-*.md`, `docs/current/DEPENDANCES-PACKAGES.md`, `docs/current/database/schema/*.md`, `scripts/db-schema-snapshot.json`.

**Régénération** : `python3 scripts/generate-docs.py --all` (début session) ou `--db` (après migration).

## MEMOIRE SCEPTIQUE

La memoire est un indice, le code est la verite. Avant chaque action :
VERIFIE contre le fichier reel. Si memoire != code → le code gagne.

## COMMANDES

`pnpm --filter @verone/[app] type-check` (jamais `pnpm build` global), `build`, `lint`.
PR vers staging uniquement. Format commit : `[APP-DOMAIN-NNN] type: description`.
Si un test echoue → rollback + corriger + retester.
