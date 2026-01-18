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

| Commande     | Description                              | Usage                           |
| ------------ | ---------------------------------------- | ------------------------------- |
| `/write`     | Execution d'un plan existant (ACTIVE.md) | Implementation structuree       |
| `/implement` | Explore-Code-Verify (feature ad-hoc)     | Features avec exploration       |
| `/commit`    | Commit rapide Conventional               | Apres modifications             |
| `/pr`        | Creer PR avec checks                     | Avant merge                     |
| `/explore`   | Exploration parallele codebase           | Recherche code                  |
| `/db`        | Operations Supabase                      | Requetes, migrations            |
| `/arch`      | Audit architecture Turborepo             | Verification structure          |
| `/plan`      | Mode planification (wrapper EnterPlanMode) | Tasks complexes multi-etapes |

### Différence /write vs /implement

- **`/write`** : Mode execution d'un plan preexistant dans `.claude/work/ACTIVE.md`. Suit strictement le plan, fait des commits automatiques, synchronise le plan via hook PostToolUse.
- **`/implement`** : Mode exploration + implementation ad-hoc. Explore le codebase, cree un plan, code, puis verifie exhaustivement (type-check + build + tests).

---

## Agents Specialises

### database-architect
**Quand l'utiliser** : Modifications schema DB, migrations, triggers, RLS policies, indexation.

**Exemples** :
- "Ajoute une table `invoices` avec relations vers `organisations` et policies RLS"
- "Optimise les indexes de la table `purchase_orders` pour les requetes frequentes"

---

### frontend-architect
**Quand l'utiliser** : Creation/modification composants UI, pages, forms, integration design system.

**Exemples** :
- "Cree un formulaire de commande avec validation Zod et soumission serveur"
- "Refactorise le composant Dashboard pour utiliser les nouveaux KPI cards"

---

### verone-debug-investigator
**Quand l'utiliser** : Investigation systematique de bugs, erreurs inattendues, comportements anormaux.

**Exemples** :
- "Le bouton de validation de commande ne fonctionne plus depuis hier, enquete"
- "Pourquoi les utilisateurs ne peuvent plus se connecter sur production?"

---

### verone-orchestrator
**Quand l'utiliser** : Features complexes multi-domaines necessitant coordination (DB + UI + API + Auth).

**Exemples** :
- "Implemente le workflow complet de creation de commande (form + validation + DB + email)"
- "Ajoute l'export PDF des factures avec generation serveur et stockage S3"

---

### action
**Quand l'utiliser** : Operations conditionnelles (cleanup, delete, batch tasks) necessitant verification avant execution.

**Exemples** :
- "Si la table `old_inventory` existe, la supprimer avec backup prealable"
- "Pour chaque environnement (dev/staging/prod), verifier si la variable QONTO_API_KEY existe"

---

### data-layer-auditor
**Quand l'utiliser** : Investigation de lenteur de chargement des pages, problemes de performance data fetching.

**Exemples** :
- "Les pages du back-office sont toutes lentes, analyse pourquoi"
- "La page commandes met 3 secondes a charger, identifie les goulots d'etranglement"

---

### audit-governor
**Quand l'utiliser** : Audits profonds (database, codebase, docs, performance) avec rapports structures.

**Exemples** :
- "Audit la database pour identifier les tables/colonnes obsoletes apres la migration"
- "Analyse le bundle size et identifie les imports lourds inutilises"

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
