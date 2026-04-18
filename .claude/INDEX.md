# INDEX — Verone Back Office

## Taches en cours

- `.claude/work/ACTIVE.md` — Sprints et taches actives
- `.claude/work/plan-canaux-de-vente.md` — Plan canaux de vente

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
- `.claude/commands/review-references/` — 4 fichiers reference (perf, securite, taille, TS)

## Skills (3 fichiers)

- `.claude/skills/oneshot/SKILL.md` — Fix rapide (typo, CSS, renommage)
- `.claude/skills/new-component/SKILL.md` — Template composant React
- `.claude/skills/schema-sync/SKILL.md` — Reference rapide schema DB

## Guides

- `.claude/guides/cross-app-protection.md` — Protection cross-app (isolation BO/LinkMe)
- `.claude/guides/typescript-errors-debugging.md` — Debug erreurs TypeScript

## Templates

- `.claude/templates/component.tsx` — Template composant React

## Scratchpad

- `docs/scratchpad/` — Plans, rapports, verdicts inter-agents

## Documentation projet

- `docs/current/database/schema/` — Schema DB par domaine (SOURCE DE VERITE)
- `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` — Composants et hooks
- `docs/current/DEPENDANCES-PACKAGES.md` — Dependances inter-packages
- `docs/current/WORKFLOWS-CRITIQUES.md` — 5 workflows critiques + mapping tests E2E
- `apps/back-office/CLAUDE.md` — Regles specifiques back-office
- `apps/linkme/CLAUDE.md` — Regles specifiques LinkMe
- `apps/site-internet/CLAUDE.md` — Regles specifiques site-internet

## Memoire persistante

- `~/.claude/projects/.../memory/MEMORY.md` — Index memoire (feedbacks, projets, references)

## Credentials et config

- `.claude/test-credentials.md` — Playwright (BO, LinkMe, Site) — LOCAL ONLY
- `.claude/settings.json` — Permissions + hooks (14 PreToolUse, 2 PostToolUse)

## Commandes Slash

| Fichier                                                   | Contenu                    |
| --------------------------------------------------------- | -------------------------- |
| `.claude/commands/review-references/performance-rules.md` | Performance Rules          |
| `.claude/commands/review-references/security-rules.md`    | Security Rules             |
| `.claude/commands/review-references/size-thresholds.md`   | Size Thresholds            |
| `.claude/commands/review-references/typescript-rules.md`  | Typescript Rules           |
| `.claude/templates/sprint-responsive-template.md`         | Sprint Responsive Template |
| `.claude/work/AGENT-ENTRY-POINT.md` | Agent Entry Point |
| `.claude/work/NEXT-SPRINTS.md` | Next Sprints |
| `.claude/work/PROMPTS-TO-COPY.md` | Prompts To Copy |

---

## Regles

| Fichier                       | Contenu    |
| ----------------------------- | ---------- |
| `.claude/rules/finance.md`    | Finance    |
| `.claude/rules/responsive.md` | Responsive |

---
