# Verone Back Office

CRM/ERP modulaire pour decoration et mobilier d'interieur haut de gamme.

## Commandes

```bash
npm run dev          # Dev (localhost:3000)
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run test:e2e     # Tests E2E Playwright
npm run validate:pr  # Avant PR (format + lint + types + build)
```

---

## Workflow Obligatoire

**IMPORTANT: Suivre ces etapes DANS L'ORDRE pour TOUTE modification.**

### 1. Explorer

- Lire les fichiers concernes AVANT de coder
- Comprendre le contexte existant
- Consulter `docs/current/serena/` pour les regles critiques

### 2. Planifier

- Expliquer l'approche AVANT d'implementer
- Si complexe: utiliser "think hard" ou "ultrathink"
- **Pas d'options** : implementer LA meilleure solution

### 3. Coder

- Implementer la solution
- Suivre les patterns existants
- **Ne pas sur-ingenieriser** : minimum necessaire

### 4. Verifier

**OBLIGATOIRE apres CHAQUE modification:**

```bash
npm run type-check   # Doit = 0 erreurs
npm run build        # Doit = Build succeeded
npm run test:e2e     # Si UI modifiee (obligatoire)
```

**NE JAMAIS dire "done" sans ces preuves.**

### 5. Commiter

**AVANT tout commit/push, VERIFIER la branche :**

```bash
git branch --show-current   # Doit correspondre a la session
git status --porcelain      # Voir fichiers modifies
```

- DEMANDER autorisation explicite
- Utiliser `/commit` pour messages propres

---

## Workflow Task ID (Commits)

### Source de verite
`.claude/work/ACTIVE.md` - Plan actif versionne et partage entre sessions

### Format Task ID
`[APP]-[DOMAIN]-[NNN]` ou APP = BO | LM | WEB

| Prefixe | Application |
|---------|-------------|
| `BO-*` | back-office |
| `LM-*` | linkme |
| `WEB-*` | site-internet |

Exemples: `BO-DASH-001`, `LM-ORD-002`, `WEB-CMS-003`

### Commits
- **Obligatoire** : Task ID dans le message
- **Bypass** : `[NO-TASK]` (rare)
- **Prefixes autorises** : `chore(plan):`, `chore(deps):`, `Merge`

### Commandes
```bash
pnpm plan:sync   # Synchroniser ACTIVE.md apres commit
```

### Flow
1. Ajouter tache dans `.claude/work/ACTIVE.md` : `- [ ] BO-XXX-001 Description`
2. Coder
3. Commit avec Task ID : `git commit -m "[BO-XXX-001] fix: description"`
4. `pnpm plan:sync` (auto via hook PostToolUse)
5. `git commit -am "chore(plan): sync"`

---

## Handoff READ → WRITE (sans copy/paste)

| Session | Action |
|---------|--------|
| READ | Analyse, valide plan, STOP → export auto vers `~/.claude/handoff/LATEST.md` |
| WRITE | Au demarrage : `pnpm handoff:show` puis execute |

```bash
pnpm handoff:show   # Afficher le dernier plan exporte
pnpm handoff:open   # Details + apercu du plan
```

---

## Rôles Multi-Agents et Permissions

> **Workflow moderne**: Sessions spécialisées communiquant via `.claude/work/ACTIVE.md`

### Matrice des Rôles

| Rôle | Commande | Outils | Écriture Code | Git | Dev Server | Écriture ACTIVE.md |
|------|----------|--------|---------------|-----|------------|-------------------|
| **READ1** | `/read1` | playwright-lane-1, serena, read | ❌ | ❌ | ❌ | ✅ (observations) |
| **READ2** | `/read2` | playwright-lane-2, serena, read | ❌ | ❌ | ❌ | ✅ (observations) |
| **PLAN** | `/plan` | serena, read, grep, glob | ❌ | ❌ | ❌ | ✅ (checklist) |
| **WRITE** | `/write` | tous sauf playwright | ✅ | ✅ | ❌ | ✅ (status) |
| **DEV-RUNNER** | `/dev` | bash (dev uniquement) | ❌ | ❌ | ✅ | ❌ |

### Descriptions des Rôles

**READ1 & READ2** (Investigation)
- Testent l'application avec Playwright (lanes 1 et 2)
- Documentent bugs/comportements dans ACTIVE.md
- Fournissent: repro steps, screenshots, console errors, hypothèses
- Peuvent tourner en parallèle pour tester différents scénarios
- **Interdits**: modifier code, commit, lancer dev

**PLAN** (Planification)
- Lit les observations READ
- Explore le code concerné
- Conçoit une solution détaillée
- Écrit un plan actionnable (checklist) dans ACTIVE.md
- **Interdits**: modifier code, commit, lancer dev

**WRITE** (Implémentation)
- Lit le plan dans ACTIVE.md
- Implémente la solution
- Vérifie (type-check, build, lint)
- Commit avec format `[TASK-ID] type: description`
- Hook PostToolUse auto-sync le plan
- **Interdits**: lancer `pnpm dev` (déléguer à DEV-RUNNER)

**DEV-RUNNER** (Serveur Dev)
- Démarre/arrête `pnpm dev` sur les bons ports
- Surveille les logs console
- Une seule session autorisée à la fois
- **Interdits**: modifier code, commit

### Workflows Typiques

**Investigation → Fix**:
```bash
# Terminal 1 (optional): Dev server
claude /dev start --app=back-office

# Terminal 2: Investigation
claude /read1 TASK=BO-BUG-001 http://localhost:3000/orders login=admin

# Terminal 3: Planification
claude /plan TASK=BO-BUG-001

# Terminal 4: Implémentation
claude /write TASK=BO-BUG-001
```

**Parallel Investigation** (2 scénarios différents):
```bash
# Terminal 1: Scénario admin
claude /read1 TASK=LM-ORG-002 http://localhost:3002/organisations login=admin

# Terminal 2: Scénario commercial
claude /read2 TASK=LM-ORG-002 http://localhost:3002/organisations login=commercial
```

### Règles de Transition

1. **READ → ACTIVE.md** : Les observations sont déposées dans ACTIVE.md
2. **PLAN lit ACTIVE.md** : Transforme observations en checklist
3. **WRITE lit ACTIVE.md** : Implémente selon le plan
4. **WRITE commit** : Hook PostToolUse auto-exécute `plan:sync`
5. **WRITE maj ACTIVE.md** : Coche les tâches terminées

### Fichier Unique de Handoff

**`.claude/work/ACTIVE.md`** = Single Source of Truth

- READ1/READ2 ajoutent leurs observations
- PLAN ajoute la checklist d'implémentation
- WRITE lit et exécute, puis coche les tâches
- `plan-sync.js` maintient synchronisé avec git commits
- Archivage automatique > 200 lignes vers `.claude/archive/plans-YYYY-MM/`

---

## Narrow Bridges (Zones Critiques)

> **Consulter AVANT de modifier ces domaines.**

### Database

- **Schema mappings** : `docs/current/serena/database-schema-mappings.md`
- **Regles** : `organisations.legal_name` (pas `name`), `product_images` (pas colonne directe)

### Supabase Migrations

- **Workflow** : `docs/current/serena/migrations-workflow.md`
- **Commande** : `source .mcp.env && psql "$DATABASE_URL" -f <migration.sql>`
- **JAMAIS** : Docker, supabase start, supabase db push

### LinkMe Commissions

- **Formules** : `docs/current/serena/linkme-commissions.md`
- **Attention** : Taux de MARQUE (pas marge), `selling_price_ht × margin_rate`

### Stock & Commandes

- **Logique** : `docs/current/serena/stock-orders-logic.md`
- **Critique** : `quantity_change` NEGATIF pour sorties

### Qonto Factures

- **Regle** : `docs/current/serena/qonto-never-finalize.md`
- **JAMAIS** finaliser une facture en test

---

## Definition Console Zero

**ERREURS (bloquantes):**

- `console.error()`
- Unhandled promise rejection
- React/Next.js error overlay

**OK (pas bloquant):**

- `console.log`, `console.warn`
- Deprecation warnings tiers

---

## Playwright MCP

> **Note :** Une seule session peut lancer `pnpm dev`. Les autres sessions ne doivent jamais relancer dev/build.

### Ports Autorises

| Port | Application   |
| ---- | ------------- |
| 3000 | back-office   |
| 3001 | site-internet |
| 3002 | linkme        |

---

## Regles Absolues

1. **JAMAIS** commit sans autorisation explicite
2. **JAMAIS** dire "done" sans preuves de verification
3. **1 seule** DB Supabase (pas de duplication)
4. **JAMAIS** proposer d'options (implementer la meilleure solution)
5. Francais pour communication, anglais pour code

---

## Stack

- Next.js 15 (App Router, RSC, Server Actions)
- shadcn/ui + Radix UI + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Zod + React Hook Form
- Turborepo v2.6.0 + pnpm

---

## Architecture

```
verone-back-office/
├── apps/
│   ├── back-office/src/     # CRM/ERP (Port 3000)
│   ├── linkme/src/          # Commissions (Port 3002)
│   └── site-internet/src/   # E-commerce (Port 3001)
├── packages/@verone/         # 26 packages partages
├── supabase/migrations/      # Source de verite DB
└── docs/current/             # Documentation source-of-truth
    └── serena/               # 15 memories CRITICAL
```

---

## Imports Packages

```typescript
import { Button, Card } from '@verone/ui';
import { ProductCard } from '@verone/products';
import type { Database } from '@verone/types';
import { cn, formatPrice } from '@verone/utils';
```

---

## Git

```
main       → Production Vercel (auto-deploy)
feature/*  → Branches de developpement
```

---

## Documentation

| Ressource                      | Description             |
| ------------------------------ | ----------------------- |
| `docs/current/index.md`        | Index documentation     |
| `docs/current/serena/INDEX.md` | 15 memories CRITICAL    |
| `docs/current/architecture.md` | Architecture technique  |
| `docs/current/database.md`     | Schema database complet |

---

## Commandes Disponibles

| Commande     | Usage                            |
| ------------ | -------------------------------- |
| `/read1`     | Investigation Playwright lane-1  |
| `/read2`     | Investigation Playwright lane-2  |
| `/plan`      | Planification depuis observations|
| `/write`     | Implémentation depuis plan       |
| `/dev`       | Gestion serveur développement    |
| `/implement` | Implementation feature           |
| `/explore`   | Exploration codebase             |
| `/commit`    | Commit rapide                    |
| `/pr`        | Creer PR                         |
| `/db`        | Operations Supabase              |

---

## Agents Disponibles

| Agent                       | Role                         |
| --------------------------- | ---------------------------- |
| `database-architect`        | Migrations, triggers, RLS    |
| `frontend-architect`        | Pages, composants, forms     |
| `verone-debug-investigator` | Investigation bugs           |
| `verone-orchestrator`       | Orchestration multi-domaines |

---

_Version 7.1.0 - 2026-01-10_
_Structure Anthropic Best Practices_
_Source-of-truth: docs/current/_
