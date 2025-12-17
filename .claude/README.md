# Configuration Claude Code - Verone Back Office

Configuration optimisee basee sur AIBlueprint + adaptations specifiques Verone.

**Date migration** : 2025-12-10
**Version** : 2.0.0

---

## Structure

```
.claude/
├── settings.json           # Configuration principale (hooks, permissions, MCP)
├── settings.local.json     # Overrides locaux (optionnel)
├── README.md               # Ce fichier
│
├── agents/                 # Agents specialises (6)
│   ├── database-architect.md       # Migrations & schema DB
│   ├── verone-debug-investigator.md # Investigation bugs systematique
│   ├── verone-orchestrator.md      # Coordination multi-domaines
│   ├── frontend-architect.md       # UI/UX & composants
│   ├── explore-codebase.md         # Exploration code (AIBlueprint)
│   └── action.md                   # Executeur conditionnel (AIBlueprint)
│
├── commands/               # Commandes slash (9)
│   ├── commit.md                   # /commit - Git commit rapide
│   ├── pr.md                       # /pr - Creer Pull Request
│   ├── epct.md                     # /epct - Explore-Plan-Code-Test
│   ├── oneshot.md                  # /oneshot - Implementation rapide
│   ├── explore.md                  # /explore - Exploration codebase
│   ├── senior-stabilization-protocol.md  # Protocole urgence
│   ├── db.md                       # Operations database
│   ├── arch.md                     # Audit architecture
│   └── update-docs.md              # Mise a jour documentation
│
├── contexts/               # Contextes charges a la demande (5)
│   ├── database.md         # Schema, migrations, RLS
│   ├── deployment.md       # CI/CD, Vercel
│   ├── design-system.md    # UI/UX patterns
│   ├── kpi.md              # Metriques business
│   └── monorepo.md         # Architecture Turborepo
│
├── scripts/                # Scripts automatisation
│   ├── validate-command.js # Hook securite pre-execution (700+ regles)
│   ├── hook-post-file.ts   # Auto-format TypeScript apres edit
│   ├── task-completed.sh   # Notification fin de tache
│   ├── session-token-report.sh  # Rapport tokens
│   ├── validation-required.sh   # Notification validation
│   ├── agent-finished.sh        # Notification fin agent
│   └── token-cost-calculator.sh # Calcul couts
│
├── workflows/              # Documentation workflows
│   └── universal-workflow-checklist.md
│
├── logs/                   # Logs securite
│   └── security.log        # Historique commandes validees/bloquees
│
└── plans/                  # Plans d'implementation (historique)
```

---

## Commandes Disponibles

| Commande   | Description                           | Usage                  |
| ---------- | ------------------------------------- | ---------------------- |
| `/commit`  | Commit rapide (<50 chars) + push auto | Apres modifications    |
| `/pr`      | Creer PR avec titre/body auto         | Avant merge            |
| `/epct`    | Workflow Explore-Plan-Code-Test       | Features complexes     |
| `/oneshot` | Implementation ultra-rapide           | Features simples       |
| `/explore` | Exploration parallele codebase        | Recherche code         |
| `/db`      | Operations Supabase                   | Requetes, migrations   |
| `/arch`    | Audit architecture Turborepo          | Verification structure |

---

## Hooks Actifs

### PreToolUse (Securite)

- **validate-command.js** : Valide toutes les commandes Bash AVANT execution
  - 700+ regles de securite
  - Bloque : rm -rf /, sudo, commandes destructives
  - Logs : `.claude/logs/security.log`

### PostToolUse (Qualite)

- **hook-post-file.ts** : Auto-format fichiers TypeScript apres edition
  - Prettier formatting
  - ESLint --fix
  - Type checking

### Stop (Reporting)

- **task-completed.sh** : Notification audio fin de tache
- **session-token-report.sh** : Rapport utilisation tokens

---

## Agents Specialises

### Verone (metier)

- **database-architect** : Schema DB, migrations, triggers, RLS
- **verone-debug-investigator** : Investigation bugs systematique
- **verone-orchestrator** : Coordination features multi-domaines
- **frontend-architect** : Composants UI, pages, validation Playwright

### AIBlueprint (generiques)

- **explore-codebase** : Exploration exhaustive du code
- **action** : Executeur conditionnel (verify before act)

---

## MCP Servers

**Source de verite** : `.mcp.json` (racine du projet)

```json
{
  "mcpServers": {
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp@latest"] },
    "serena": { "command": "uvx", "args": ["--from", "git+https://github.com/oraios/serena", ...] },
    "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest", "--browser", "chrome"] }
  }
}
```

### Serveurs Actifs

| Server         | Usage                   | Outils Principaux                             |
| -------------- | ----------------------- | --------------------------------------------- |
| **context7**   | Documentation libraries | resolve_library_id, get_library_docs          |
| **serena**     | Analyse semantique code | find_symbol, search_for_pattern, memories     |
| **playwright** | Browser automation      | navigate, screenshot, console_messages, click |

### Permissions (settings.json)

Les permissions MCP utilisent des **wildcards** pour autoriser tous les outils :

```json
"mcp__*",
"mcp__serena__*",
"mcp__context7__*",
"mcp__playwright__*"
```

### Playwright - Regles d'Usage

- **INTERDIT** : `browser_snapshot` (genere 10k+ tokens)
- **UTILISER** : `browser_take_screenshot`, `browser_console_messages`, `browser_evaluate`

### Validation MCP

```bash
claude mcp list  # Doit afficher : context7: Connected, serena: Connected, playwright: Connected
```

---

## Runtime

- **Bun** : Runtime pour hooks (plus rapide que Node)
- **Installation** : `curl -fsSL https://bun.sh/install | bash`

---

## Changelog

### v2.0.0 (2025-12-10) - Migration AIBlueprint

- Ajout 5 nouvelles commandes (/commit, /pr, /epct, /oneshot, /explore)
- Ajout 2 nouveaux agents (explore-codebase, action)
- Ajout hooks securite (validate-command.js)
- Ajout hook auto-format TypeScript
- Simplification settings.json (378 -> 188 lignes)
- Suppression Storybook
- Suppression .aim/ (obsolete)
- Runtime Bun pour hooks

### v1.0.0 (2025-11)

- Configuration initiale Verone
- 4 agents metier
- 4 commandes slash
- 5 contextes
