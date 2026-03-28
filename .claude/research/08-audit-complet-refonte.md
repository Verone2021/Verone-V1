# Recherche 8 : Audit Complet Repository + Plan de Refonte depuis Zero

**Date** : 2026-03-27
**Objectif** : Croiser les 7 recherches avec l'etat reel du repository pour definir la refonte complete

---

## AUDIT COMPLET DU REPOSITORY

### Fichiers racine

| Fichier | Lignes | Verdict | Action |
|---|---|---|---|
| `CLAUDE.md` | 42 | **GARDER** — minimaliste, OK | Renforcer avec chemins critiques + instruction sous-projet |
| `AGENTS.md` | 332 | **OBSOLETE** — doublon avec `.claude/agents/` | SUPPRIMER (redondant, genere confusion) |
| `CHANGELOG.md` | 235 | **GARDER** — dernier entry 2025-11-08 | A jour avec Memory Manager automatique |
| `PROTECTED_FILES.json` | 128 | **EVALUER** — date 2025-12-10 | Verifier si encore utilise par un hook/script |
| `README.md` | ? | **GARDER** | Mettre a jour si necessaire |
| `package.json` | scripts OK | **GARDER** | Scripts audit bien structures |
| `turbo.json` | OK | **GARDER** | Config Turborepo standard |
| `.env.example` | OK | **GARDER** | Reference env vars |
| `.env.local` | OK | **GARDER** | Gitignored |

### Dossier `.plans/` (RACINE — a ne pas confondre avec `.claude/plans/`)

| Fichier | Lignes | Verdict |
|---|---|---|
| `README.md` | 88 | **OBSOLETE** — plans doivent etre dans `.claude/work/ACTIVE.md` |
| `batch1-linkme-hooks-checklist.md` | 108 | **OBSOLETE** — date 2026-01-28, taches probablement terminees |
| `enforce-professional-workflow-2026.md` | 583 | **OBSOLETE** — date 2026-01-17, remplace par rules actuelles |

**Action** : SUPPRIMER tout le dossier `.plans/`. Les plans vont dans `.claude/work/ACTIVE.md`.

### Dossier `scripts/` (11 fichiers)

| Script | Lignes | Verdict | Action |
|---|---|---|---|
| `validate-env.sh` | 141 | **GARDER** — utilise par `pnpm dev:safe` | OK |
| `dev-stop.sh` | 31 | **GARDER** — utilise par `pnpm dev:stop` | OK |
| `dev-clean.sh` | 25 | **GARDER** — utilise par `pnpm dev:clean` | OK |
| `clean-screenshots.sh` | 25 | **GARDER** — utilise par `pnpm clean:screenshots` | OK |
| `turbo-cleanup.sh` | 26 | **GARDER** — cache cleanup | OK |
| `audit-component-advanced.sh` | 301 | **EVALUER** — utilise par `pnpm audit:component` | Garder si utilise |
| `audit-all-components.sh` | 139 | **EVALUER** — utilise par `pnpm audit:batch` | Garder si utilise |
| `check-console-errors.ts` | 394 | **EVALUER** — monitoring console | Potentiellement remplacable par Playwright |
| `check-db-type-alignment.ts` | 327 | **EVALUER** — verification types DB | Utile, garder |
| `sync-all-branches-with-main.sh` | 87 | **GARDER** — maintenance branches | OK |
| `monitor-health.sh` | 51 | **EVALUER** — surveillance continue | Potentiellement utile |

### Dossier `.claude/` (apres nettoyage INFRA-001/002)

| Element | Verdict | Action |
|---|---|---|
| `settings.json` | **GARDER** — hooks bien configures | Renforcer SessionStart |
| `settings.local.json` | **GARDER** — minimal | OK |
| `INDEX.md` | **GARDER** — cree aujourd'hui | Mettre a jour apres refonte |
| `README.md` | **GARDER** — v13.0.0 | OK |
| `MANUAL_MODE.md` | **EVALUER** — 190 lignes | Potentiellement redondant avec rules/dev/git-workflow.md |
| `test-credentials.md` | **GARDER** — credentials test | OK |

### Dossier `.claude/agents/` (7 agents)

| Agent | Verdict | Action refonte |
|---|---|---|
| `linkme-expert.md` | **GARDER** — cree aujourd'hui | Enrichir avec Skills + memory |
| `back-office-expert.md` | **GARDER** — cree aujourd'hui | Enrichir avec Skills + memory |
| `site-internet-expert.md` | **GARDER** — cree aujourd'hui | Enrichir avec Skills + memory |
| `code-reviewer.md` | **GARDER** | Ajouter skills review |
| `database-architect.md` | **GARDER** | Ajouter skill Schema Sync |
| `frontend-architect.md` | **EVALUER** | Potentiellement redondant avec agents par app |
| `perf-optimizer.md` | **GARDER** | Ajouter verification Playwright post-fix |

### Dossier `.claude/commands/` (9 commandes)

| Commande | Verdict | Action refonte |
|---|---|---|
| `/implement` | **REFONDRE** → `/apex` | Methode Apex (Explore → Plan → Execute → Review) |
| `/explore` | **GARDER** | Integrer dans phase Exploration d'Apex |
| `/research` | **GARDER** | Integrer dans phase Exploration d'Apex |
| `/plan` | **GARDER** | Phase Planification d'Apex |
| `/review` | **GARDER** → renommer `/review-code` | Ajouter sous-agent Clean Code |
| `/fix-warnings` | **GARDER** | OK |
| `/pr` | **GARDER** | STOP obligatoire deja ajoute |
| `/db` | **GARDER** | OK |
| `/teach` | **GARDER** | OK |

### Dossier `.claude/rules/` (12 regles)

| Regle | Verdict | Action refonte |
|---|---|---|
| `dev/context-loading.md` | **RENFORCER** | Ajouter "Triple Lecture" (3 fichiers similaires) |
| `dev/git-workflow.md` | **GARDER** | CRITICAL en haut deja fait |
| `dev/build-commands.md` | **GARDER** | OK |
| `dev/hooks-bloquants.md` | **GARDER** | OK |
| `dev/servers.md` | **GARDER** | OK |
| `dev/multi-agent.md` | **REFONDRE** | Adapter pour TMUX multi-agent |
| `dev/deployment-verification.md` | **GARDER** | OK |
| `dev/playwright-screenshots.md` | **GARDER** | OK |
| `frontend/async-patterns.md` | **GARDER** | OK |
| `backend/api.md` | **RENFORCER** | Trop minimal (27 lignes), ajouter patterns |
| `database/supabase.md` | **GARDER** | OK |
| `database/rls-patterns.md` | **GARDER** | OK |

### Dossier `.claude/guides/` (3 guides)

| Guide | Verdict |
|---|---|
| `expert-workflow.md` | **EVALUER** — 444 lignes, potentiellement redondant avec Apex |
| `cross-app-protection.md` | **GARDER** — pattern unique multi-app |
| `typescript-errors-debugging.md` | **GARDER** — reference utile |

### Dossier `.claude/patterns/` et `.claude/templates/`

| Fichier | Verdict |
|---|---|
| `patterns/auth-logout.md` | **GARDER** — pattern specifique |
| `templates/supabase-client-pattern.md` | **GARDER** — template utile |
| `templates/component.tsx` | **GARDER** — template composant |

### MCP Servers (.mcp.json)

| MCP | Verdict selon recherches | Action |
|---|---|---|
| **Supabase** | **GARDER** — indispensable (SQL, tables, advisors) | Pas de CLI equivalent |
| **Playwright lane-1 + lane-2** | **GARDER** — indispensable (tests visuels) | Pas de CLI equivalent |
| **Context7** | **GARDER** — documentation librairies a jour | Leger, utile |
| **Serena** | **EVALUER** — memories deja en fichiers, find_symbol = Grep/Glob | Potentiellement remplacable |
| **Magic** | **SUPPRIMER** — composants UI rarement utilises | Remplacer par skills templates |

### Husky hooks

| Hook | Verdict |
|---|---|
| `commit-msg` | **GARDER** — validation format commit |
| `pre-commit` | **GARDER** — Prettier + lint-staged + protection main |
| `pre-push` | **GARDER** — minimal, CI/CD prend le relais |

---

## RECHERCHES WEB — Resultats complementaires

### Agents : Skills, Memory, Orchestration

**Source** : [Claude Code Docs - Subagents](https://code.claude.com/docs/en/sub-agents), [Shipyard Multi-Agent](https://shipyard.build/blog/claude-code-multi-agent/), [Claude Code Agent Teams](https://claudefa.st/blog/guide/agents/agent-teams)

1. **Skills dans agents** : le skill definit QUOI faire, l'agent definit COMMENT. Skills = reutilisables, agents = specialises
2. **Memory par agent** : `memory: .claude/agent-memory/<agent-name>/` — accumule insights across conversations (patterns codebase, issues recurrentes)
3. **Subagents ne peuvent PAS spawner d'autres subagents** — si workflow necessite delegation imbriquee, utiliser Skills ou chainer depuis conversation principale
4. **Agent Teams** : Team Lead coordonne via task list partagee, teammates dans leurs propres context windows
5. **Partage fichiers entre agents** : via workspace partage (fichiers sur disque), pas via memoire interne
6. **UNIX philosophy** : etat des taches ecrit sur filesystem local, pas dans cloud proprietaire

### Structure .claude/ definitive (best practices 2026)

**Source** : [Claude Code Docs - Skills](https://code.claude.com/docs/en/skills), [Claude Code Showcase](https://github.com/ChrisWiles/claude-code-showcase), [alexop.dev](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/)

```
.claude/
├── settings.json          # Hooks, permissions, MCP
├── settings.local.json    # Overrides locaux (gitignored)
├── agents/                # Subagents specialises
│   ├── <agent-name>.md    # Frontmatter YAML + system prompt
├── commands/              # Slash commands (/command)
│   ├── <command>.md       # Frontmatter + instructions
├── skills/                # Competences on-demand
│   ├── <skill-name>/
│   │   ├── SKILL.md       # Instructions + scripts
│   │   └── templates/     # Fichiers template associes
├── rules/                 # Regles auto-discovered (toujours chargees)
│   ├── dev/
│   ├── frontend/
│   ├── backend/
│   └── database/
├── agent-memory/          # Memoire persistante par agent
│   ├── <agent-name>/
│   │   └── MEMORY.md
├── work/                  # Taches en cours
│   └── ACTIVE.md
└── research/              # Recherches accumulees
    └── INDEX.md
```

### Distinction critique : Rules vs Skills vs Hooks

| | Rules | Skills | Hooks |
|---|---|---|---|
| **Quand** | TOUJOURS charges | On-demand (quand pertinent) | TOUJOURS executes |
| **Type** | Instructions texte | Instructions + scripts + templates | Shell/HTTP/Prompt/Agent |
| **Controle** | Suggestif (Claude peut ignorer si contexte sature) | Suggestif mais cible | **Deterministe** (0 exception) |
| **Usage** | Conventions, patterns, interdictions | Workflows, procedures, templates | Formatage, validation, securite |

→ Pour les regles CRITIQUES (commit sur main, TypeScript any) : **Hooks** (deterministe)
→ Pour les patterns de code (API, nommage) : **Rules** avec Emphasis CRITICAL
→ Pour les workflows (Apex, review) : **Skills/Commands**

---

## PLAN DE REFONTE INFRA-003

### Phase 1 : Nettoyage (supprimer l'obsolete)
- [ ] Supprimer `AGENTS.md` racine (redondant avec .claude/agents/)
- [ ] Supprimer `.plans/` racine (3 fichiers obsoletes)
- [ ] Supprimer MCP Magic de `.mcp.json`
- [ ] Evaluer `PROTECTED_FILES.json` — supprimer si non utilise
- [ ] Evaluer `MANUAL_MODE.md` — fusionner avec rules ou supprimer
- [ ] Nettoyer `.claude/work/` — supprimer PLAN-LM-COLLAB-004/005 (plans obsoletes)

### Phase 2 : Renforcer les Rules avec Emphasis CRITICAL
- [ ] `rules/dev/context-loading.md` : ajouter "CRITICAL: Triple Lecture — lire 3 fichiers similaires avant toute modification"
- [ ] `rules/backend/api.md` : enrichir avec patterns concrets (27 → 80+ lignes)
- [ ] `rules/dev/multi-agent.md` : refondre pour TMUX multi-agent
- [ ] Ajouter `rules/dev/clean-code.md` : fichier > 400 lignes = refactoring obligatoire

### Phase 3 : Creer des Skills metier
- [ ] `skills/apex/SKILL.md` : workflow Explore → Plan → Execute → Review
- [ ] `skills/oneshot/SKILL.md` : correctif rapide sans exploration profonde
- [ ] `skills/schema-sync/SKILL.md` : reference miroir structure DB
- [ ] `skills/new-component/SKILL.md` : template creation composant

### Phase 4 : Enrichir les Agents
- [ ] Chaque agent par app : ajouter `skills` dans frontmatter
- [ ] Chaque agent : `memory` pointant vers `.claude/agent-memory/<name>/`
- [ ] Ajouter instructions "Triple Lecture" dans chaque agent
- [ ] Evaluer suppression `frontend-architect` (redondant avec agents par app)

### Phase 5 : CLAUDE.md root — refonte finale
- [ ] Ultra-minimaliste (< 40 lignes)
- [ ] Chemins critiques en HAUT (Lost in the Middle)
- [ ] Instruction sous-projet explicite pour Turborepo
- [ ] Pointer vers INDEX.md pour le detail
- [ ] Rules CRITICAL en bas (rappel)

### Phase 6 : Verification E2E
- [ ] Aucune reference cassee
- [ ] Tous les agents ont skills + memory
- [ ] INDEX.md a jour
- [ ] ACTIVE.md nettoye (plans obsoletes supprimes)
- [ ] Test : nouvel agent peut trouver toute l'info depuis INDEX.md
