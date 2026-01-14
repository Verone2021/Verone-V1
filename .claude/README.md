# Configuration Claude Code - Verone Back Office

Configuration optimisee basee sur Anthropic Best Practices 2025.

**Version** : 3.0.0
**Date** : 2025-12-19

---

## Structure

```
.claude/
├── settings.json           # Configuration principale (hooks, permissions, MCP)
├── settings.local.json     # Overrides locaux (optionnel)
├── README.md               # Ce fichier
│
├── agents/                 # Agents specialises (5)
│   ├── database-architect.md       # Migrations & schema DB
│   ├── verone-debug-investigator.md # Investigation bugs systematique
│   ├── verone-orchestrator.md      # Coordination multi-domaines
│   ├── frontend-architect.md       # UI/UX & composants
│   └── action.md                   # Executeur conditionnel
│
├── commands/               # Commandes slash (8)
│   ├── implement.md               # /implement - Explore-Code-Verify
│   ├── commit.md                  # /commit - Git commit rapide
│   ├── pr.md                      # /pr - Creer Pull Request
│   ├── explore.md                 # /explore - Exploration codebase
│   ├── db.md                      # /db - Operations database
│   ├── arch.md                    # /arch - Audit architecture
│   ├── update-docs.md             # /update-docs - Mise a jour doc
│   └── senior-stabilization-protocol.md  # Protocole urgence
│
├── contexts/               # Contextes charges a la demande (2)
│   ├── design-system.md    # UI/UX patterns
│   └── monorepo.md         # Architecture Turborepo
│
├── scripts/                # Scripts automatisation
│   ├── validate-command.js # Hook securite pre-execution
│   ├── hook-post-file.ts   # Auto-format TypeScript
│   ├── repo-audit.sh       # Audit contradictions
│   └── [autres scripts]
│
└── logs/                   # Logs securite
    └── security.log
```

---

## Commandes Disponibles

| Commande     | Description                    | Usage                  |
| ------------ | ------------------------------ | ---------------------- |
| `/implement` | Explore-Code-Verify (unifie)   | Features               |
| `/commit`    | Commit rapide Conventional     | Apres modifications    |
| `/pr`        | Creer PR avec checks           | Avant merge            |
| `/explore`   | Exploration parallele codebase | Recherche code         |
| `/db`        | Operations Supabase            | Requetes, migrations   |
| `/arch`      | Audit architecture Turborepo   | Verification structure |

---

## Agents Specialises

| Agent                         | Role                                       | Verification                     |
| ----------------------------- | ------------------------------------------ | -------------------------------- |
| **database-architect**        | Schema DB, migrations, triggers, RLS       | type-check + build               |
| **frontend-architect**        | Composants UI, pages, forms                | type-check + build + smoke tests |
| **verone-debug-investigator** | Investigation bugs systematique            | type-check                       |
| **verone-orchestrator**       | Coordination features multi-domaines       | type-check                       |
| **action**                    | Executeur conditionnel (verify before act) | type-check                       |

---

## Workflow Obligatoire

**Voir [CLAUDE.md](../CLAUDE.md)** pour le workflow complet en 5 etapes.

### Quand utiliser quel agent?

| Besoin                          | Agent/Command               |
| ------------------------------- | --------------------------- |
| Feature multi-domaines          | `verone-orchestrator`       |
| Audit, cleanup, dette technique | `audit-governor`            |
| Bug investigation               | `verone-debug-investigator` |
| UI/UX, composants               | `frontend-architect`        |
| Database, migrations            | `database-architect`        |
| Exploration code                | `/explore` command          |

---

## MCP Servers

**Source de verite** : `.mcp.json`

| Server         | Usage                   | Outils Principaux                         |
| -------------- | ----------------------- | ----------------------------------------- |
| **context7**   | Documentation libraries | resolve_library_id, get_library_docs      |
| **serena**     | Analyse semantique code | find_symbol, search_for_pattern, memories |
| **playwright** | Browser automation      | navigate, screenshot, console_messages    |

---

## Changelog

### v3.0.0 (2025-12-19) - Optimisation Anthropic Best Practices

- **CLAUDE.md** : Reecrit v6.0 (174 → 90 lignes)
- **Commandes** : Fusionne `/epct` + `/oneshot` → `/implement`
- **Agents** : Supprime `explore-codebase` (doublon avec `/explore`)
- **Contextes** : Supprime `database.md`, `deployment.md` (doublons memories Serena)
- **Workflows** : Supprime PDCA.md, universal-workflow.md (integres dans CLAUDE.md)
- **Verification** : Smoke tests obligatoires pour TOUTE modification UI

### v2.0.0 (2025-12-10) - Migration AIBlueprint

- Ajout commandes (/commit, /pr, /epct, /oneshot, /explore)
- Ajout agents (explore-codebase, action)
- Ajout hooks securite (validate-command.js)

### v1.0.0 (2025-11)

- Configuration initiale Verone
