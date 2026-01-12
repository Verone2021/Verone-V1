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

| Commande     | Usage                  |
| ------------ | ---------------------- |
| `/implement` | Implementation feature |
| `/explore`   | Exploration codebase   |
| `/commit`    | Commit rapide          |
| `/pr`        | Creer PR               |
| `/db`        | Operations Supabase    |

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
