# Verone Back Office

CRM/ERP modulaire pour decoration et mobilier d'interieur haut de gamme.

## Commandes

```bash
npm run dev          # Dev (localhost:3000)
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run e2e:smoke    # Smoke tests UI
```

## Workflow Obligatoire

**IMPORTANT: Suivre ces etapes DANS L'ORDRE pour TOUTE modification.**

### 1. Explorer

- Lire les fichiers concernes AVANT de coder
- Comprendre le contexte existant

### 2. Planifier

- Expliquer l'approche AVANT d'implementer
- Si complexe: utiliser "think hard" ou "ultrathink"

### 3. Coder

- Implementer la solution
- Suivre les patterns existants

### 4. Verifier

**YOU MUST executer apres CHAQUE modification:**

```bash
npm run type-check   # Doit = 0 erreurs
npm run build        # Doit = Build succeeded
npm run e2e:smoke    # Si UI modifiee (obligatoire)
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

## Definition Console Zero

**ERREURS (bloquantes):**

- `console.error()`
- Unhandled promise rejection
- React/Next.js error overlay

**OK (pas bloquant):**

- `console.log`, `console.warn`
- Deprecation warnings tiers

## Regles Absolues

1. **JAMAIS** commit sans autorisation explicite
2. **JAMAIS** dire "done" sans preuves de verification
3. **1 seule** DB Supabase (pas de duplication)
4. Francais pour communication, anglais pour code

## Stack

- Next.js 15 (App Router, RSC, Server Actions)
- shadcn/ui + Radix UI + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Zod + React Hook Form
- Turborepo v2.6.0 + pnpm

## Chemins

```
apps/back-office/src/     # CRM/ERP (Port 3000)
apps/linkme/src/          # Commissions (Port 3002)
apps/site-internet/src/   # E-commerce (Port 3001)
packages/@verone/         # Packages partages
```

## Git

```
main       → Production Vercel (auto-deploy)
feature/*  → Branches de developpement
```

---

_Version 6.0.0 - 2025-12-19_
_Structure Anthropic Best Practices_
