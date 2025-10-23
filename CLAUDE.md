# 🚀 Vérone Back Office - Claude Code 2025

**CRM/ERP modulaire** pour décoration et mobilier d'intérieur haut de gamme
**Stack** : Next.js 15 (App Router) + Supabase + shadcn/ui

---

## 🎯 PHASE ACTUELLE : PHASE 1 - STABILISATION ✅

**Date** : 2025-10-23
**État** : Production-ready avec modules core validés

### ✅ Modules ACTIFS
- Authentification (`/login`, `/profile`)
- Dashboard (`/dashboard`)
- Organisations & Contacts (`/contacts-organisations`)
- Administration (`/admin`)

### ❌ Modules DÉSACTIVÉS (Phase 2+)
- Produits, Stocks, Commandes, Finance, Canaux vente
- Protection : `src/middleware.ts` + Feature flags

---

## 🔧 STACK TECHNIQUE

```typescript
Frontend  : Next.js 15 (App Router, RSC, Server Actions)
UI        : shadcn/ui + Radix UI + Tailwind CSS
Database  : Supabase (PostgreSQL + Auth + RLS)
Validation: Zod + React Hook Form
Testing   : Vitest + Playwright + Storybook
Deploy    : Vercel (auto-deploy main)
```

---

## 🇫🇷 LANGUE

**TOUJOURS communiquer en français**
- Messages, docs, commit messages, PR
- Exceptions : Code (variables, fonctions en anglais)

---

## 🧠 WORKFLOW 2025

**Plan-First → Agent Orchestration → Console Clean → Deploy**

### Phase 1 : PLAN-FIRST

```typescript
// Tâches complexes (>3 étapes)
mcp__sequential-thinking__sequentialthinking

// Clarifications
AskUserQuestion({ questions: [...] })

// Todo List
TodoWrite({ todos: [...] })
```

### Phase 2 : AGENT ORCHESTRATION

```typescript
Context7    // Docs officielles frameworks
Serena      // Code analysis, symbolic editing
Playwright  // Browser testing, console errors
Supabase    // Database queries, advisors
GitHub      // PR automatisées
Vercel      // Auto-deploy
```

### Phase 3 : CONSOLE ERROR CHECKING (RÈGLE SACRÉE)

```typescript
// 🚫 INTERDIT : Scripts test
// ✅ OBLIGATOIRE : MCP Playwright Browser direct

1. mcp__playwright__browser_navigate(url)
2. mcp__playwright__browser_console_messages()
3. Si erreurs → STOP → Fix ALL → Re-test
4. Screenshot comme preuve
5. Zero tolerance : 1 erreur = échec complet
```

---

## 🚫 GIT WORKFLOW - AUTORISATION OBLIGATOIRE

**RÈGLE ABSOLUE** : **JAMAIS commit, push, ou toute opération git SANS demander autorisation EXPLICITE de l'utilisateur.**

### Workflow Obligatoire

```typescript
1. ✅ Effectuer modifications demandées
2. ✅ Tester localhost (MCP Playwright Browser)
3. ✅ Vérifier build (npm run build)
4. ✅ Vérifier console errors = 0
5. ⏸️ **STOP - DEMANDER AUTORISATION** :
   - Présenter résumé modifications
   - Message : "Voulez-vous que je commit et push maintenant ?"
   - **ATTENDRE réponse EXPLICITE**
6. ✅ Si "OUI" → git add, commit, push
7. ❌ Si "NON" ou ambiguë → NE PAS commit
```

**AUCUNE EXCEPTION** - Même si tout est validé.

---

## 🤖 MCP AGENTS - USAGE PRIORITAIRE

### Serena - Code Intelligence

```typescript
mcp__serena__get_symbols_overview   // Explorer fichier AVANT modification
mcp__serena__find_symbol            // Localiser symboles
mcp__serena__replace_symbol_body    // Édition précise
mcp__serena__search_for_pattern     // Recherche patterns
```

**Best practice** : TOUJOURS `get_symbols_overview` avant éditer fichier

### Supabase - Database

```typescript
// 🔑 Credentials : Read .env.local ligne 19
// Connection : aws-1-eu-west-3.pooler.supabase.com:5432

mcp__supabase__execute_sql           // Queries directes
mcp__supabase__get_advisors          // Sécurité/performance
mcp__supabase__generate_typescript_types  // Types après migrations
```

### Playwright - Browser Testing

```typescript
mcp__playwright__browser_navigate
mcp__playwright__browser_console_messages
mcp__playwright__browser_click
mcp__playwright__browser_take_screenshot
```

---

## 📖 CONTEXTES SPÉCIALISÉS

**Charger à la demande selon tâche** :

```typescript
// 🗄️ Travail database (migrations, schema, queries)
Read(".claude/contexts/database.md")

// 🚀 Déploiement (CI/CD, Vercel, rollback, PR)
Read(".claude/contexts/deployment.md")

// 📊 KPI (métriques, documentation YAML)
Read(".claude/contexts/kpi.md")

// 🎨 Design/UI (composants, Storybook, design V2)
Read(".claude/contexts/design-system.md")

// 🏗️ Monorepo (architecture, migration progressive)
Read(".claude/contexts/monorepo.md")
```

**Principe** : Ne charger que le contexte nécessaire pour éviter token overhead.

---

## 📁 STRUCTURE REPOSITORY

```
src/                     # Next.js app
  ├── app/               # App Router pages
  ├── components/        # React components
  │   ├── ui/            # shadcn/ui base
  │   └── ui-v2/         # Design System V2
  ├── hooks/             # Custom hooks
  ├── lib/               # Utils, Supabase client
  └── types/             # TypeScript types

docs/                    # Documentation technique exhaustive
  ├── auth/              # Rôles, permissions, RLS
  ├── database/          # Schema, triggers, functions (78 tables)
  ├── metrics/           # KPI, calculs, triggers
  ├── workflows/         # Business workflows
  └── ci-cd/             # Déploiement, rollback

.claude/
  ├── contexts/          # Contextes spécialisés (chargés à la demande)
  └── commands/          # Custom slash commands

packages/                # KPI docs YAML, future monorepo
supabase/migrations/     # Database migrations
```

---

## ⚡ COMMANDES ESSENTIELLES

```bash
# Développement
npm run dev              # Next.js dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # TypeScript check

# Audit
npm run audit:all        # Tous audits (duplicates, cycles, deadcode, spelling)

# Database
supabase db push         # Appliquer migrations
supabase gen types typescript --local > src/types/supabase.ts
```

---

## 🎯 SUCCESS METRICS (SLOS)

- ✅ **Zero console errors** (tolérance zéro)
- ✅ **Dashboard** : <2s
- ✅ **Build** : <20s
- ✅ **Test coverage** : >80% (nouveaux modules)

---

## 📚 NAVIGATION DOCUMENTATION

**Documentation exhaustive** : `/docs/`

- **Auth** : `docs/auth/` (Rôles, permissions, RLS)
- **Database** : `docs/database/` (78 tables, 158 triggers, anti-hallucination)
- **Metrics** : `docs/metrics/` (KPI, calculs)
- **Workflows** : `docs/workflows/` (Business workflows)
- **CI/CD** : `docs/ci-cd/` (Déploiement, rollback)

**Best Practices** :
- Naming : `kebab-case.md`
- Profondeur : Max 2 niveaux
- README obligatoire par section

---

**Version** : 3.0.0 (Architecture Modulaire 2025)
**Dernière mise à jour** : 2025-10-23
**Mainteneur** : Romeo Dos Santos
