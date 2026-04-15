# INDEX — Verone Back Office

## Taches en cours

- `.claude/work/ACTIVE.md` — Sprints et taches actives

## Rules (5 fichiers, auto-discovered)

- `.claude/rules/database.md` — Migrations, RLS patterns, post-migration
- `.claude/rules/workflow.md` — Git, builds, serveurs, contexte, deploiement
- `.claude/rules/code-standards.md` — TypeScript, async, composants, API, logout
- `.claude/rules/playwright.md` — Mode vision, screenshots, workflow
- `.claude/rules/stock-triggers-protected.md` — Triggers stock IMMUABLES

## Agents (6 fichiers)

- `.claude/agents/dev-agent.md` — Developpeur senior, code + TDD + changelog
- `.claude/agents/reviewer-agent.md` — Code reviewer impartial, read-only
- `.claude/agents/verify-agent.md` — Validateur types + build + tests
- `.claude/agents/ops-agent.md` — Deploiement apres review PASS
- `.claude/agents/writer-agent.md` — Documentation technique
- `.claude/agents/market-agent.md` — Positionnement produit, communication

## Commands (5 fichiers)

- `.claude/commands/search.md` — Exploration DB + code + RLS
- `.claude/commands/review.md` — Audit qualite code avec rapport
- `.claude/commands/pr.md` — Push + PR vers staging
- `.claude/commands/status.md` — Resume rapide projet

## Skills (3 utiles)

- `.claude/skills/oneshot/SKILL.md` — Fix rapide (typo, CSS, renommage)
- `.claude/skills/new-component/SKILL.md` — Template composant React
- `.claude/skills/schema-sync/SKILL.md` — Reference rapide schema DB

## Scratchpad (communication inter-agents)

- `docs/scratchpad/` — Plans, rapports, verdicts (1 fichier = 1 jour)

## Documentation projet

- `docs/current/database/schema/` — Schema DB par domaine (SOURCE DE VERITE)
- `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` — Composants et hooks
- `docs/current/DEPENDANCES-PACKAGES.md` — Dependances inter-packages
- `docs/current/INDEX-PAGES-BACK-OFFICE.md` — 165 pages back-office
- `docs/current/linkme/GUIDE-COMPLET-LINKME.md` — Guide complet LinkMe
- `apps/back-office/CLAUDE.md` — Regles specifiques back-office
- `apps/linkme/CLAUDE.md` — Regles specifiques LinkMe
- `apps/site-internet/CLAUDE.md` — Regles specifiques site-internet

## Memoire persistante

- `~/.claude/projects/.../memory/MEMORY.md` — Index memoire (feedbacks, projets, references)

## Credentials de test

- `.claude/test-credentials.md` — Playwright (BO, LinkMe, Site) — LOCAL ONLY

## Audits

| Fichier                                       | Contenu                   |
| --------------------------------------------- | ------------------------- |
| `.claude/audits/security-audit-2026-02-04.md` | Security Audit 2026 02 04 |
| `.claude/skills/rls-patterns/SKILL.md`        | Skill                     |
| `.claude/work/plan-canaux-de-vente.md`        | Plan Canaux De Vente      |

---

## Commandes Slash

| Fichier                                                   | Contenu           |
| --------------------------------------------------------- | ----------------- |
| `.claude/commands/review-references/performance-rules.md` | Performance Rules |
| `.claude/commands/review-references/security-rules.md`    | Security Rules    |
| `.claude/commands/review-references/size-thresholds.md`   | Size Thresholds   |
| `.claude/commands/review-references/typescript-rules.md`  | Typescript Rules  |

---

## Guides

| Fichier                                         | Contenu                     |
| ----------------------------------------------- | --------------------------- |
| `.claude/guides/cross-app-protection.md`        | Cross App Protection        |
| `.claude/guides/expert-workflow.md`             | Expert Workflow             |
| `.claude/guides/typescript-errors-debugging.md` | Typescript Errors Debugging |

---

## Patterns

| Fichier                           | Contenu     |
| --------------------------------- | ----------- |
| `.claude/patterns/auth-logout.md` | Auth Logout |

---

## Regles

| Fichier                                         | Contenu                  |
| ----------------------------------------------- | ------------------------ |
| `.claude/rules/backend/api.md`                  | Api                      |
| `.claude/rules/database/post-migration.md`      | Post Migration           |
| `.claude/rules/database/rls-patterns.md`        | Rls Patterns             |
| `.claude/rules/database/supabase.md`            | Supabase                 |
| `.claude/rules/dev/build-commands.md`           | Build Commands           |
| `.claude/rules/dev/clean-code.md`               | Clean Code               |
| `.claude/rules/dev/component-safety.md`         | Component Safety         |
| `.claude/rules/dev/context-loading.md`          | Context Loading          |
| `.claude/rules/dev/deployment-verification.md`  | Deployment Verification  |
| `.claude/rules/dev/git-workflow.md`             | Git Workflow             |
| `.claude/rules/dev/hooks-bloquants.md`          | Hooks Bloquants          |
| `.claude/rules/dev/multi-agent.md`              | Multi Agent              |
| `.claude/rules/dev/playwright-large-pages.md`   | Playwright Large Pages   |
| `.claude/rules/dev/playwright-screenshots.md`   | Playwright Screenshots   |
| `.claude/rules/dev/servers.md`                  | Servers                  |
| `.claude/rules/dev/stock-triggers-protected.md` | Stock Triggers Protected |
| `.claude/rules/frontend/async-patterns.md`      | Async Patterns           |

---

## Templates

| Fichier                                        | Contenu                 |
| ---------------------------------------------- | ----------------------- |
| `.claude/templates/supabase-client-pattern.md` | Supabase Client Pattern |

---

## MCP Servers

- Supabase — SQL, tables, migrations, types
- Playwright (lane-1, lane-2) — Tests visuels, screenshots
- Context7 — Documentation librairies a jour
- shadcn — Registre composants shadcn/ui
