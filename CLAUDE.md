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

## 📋 BUSINESS RULES - STRUCTURE COMPLÈTE

**Nouvelle organisation modulaire** : `docs/business-rules/`

### Organisation

Structure complète **93 dossiers** correspondant aux **19 modules applicatifs** + aspects transverses.

```
docs/business-rules/
├── 01-authentification/          # /login, /profile
├── 02-dashboard/                 # /dashboard
├── 03-organisations-contacts/    # /contacts-organisations
│   ├── organisations/
│   ├── contacts/
│   ├── customers/
│   ├── suppliers/
│   └── partners/
├── 04-produits/                  # /produits
│   ├── catalogue/
│   │   ├── categories/
│   │   ├── families/
│   │   ├── collections/
│   │   ├── products/
│   │   ├── variants/
│   │   ├── packages/
│   │   └── images/
│   └── sourcing/
├── 05-pricing-tarification/      # Pricing multi-canaux
├── 06-stocks/                    # /stocks
│   ├── movements/
│   ├── inventaire/
│   ├── alertes/
│   ├── receptions/
│   ├── expeditions/
│   ├── entrees/
│   ├── sorties/
│   └── backorders/
├── 07-commandes/                 # /commandes
│   ├── clients/
│   ├── fournisseurs/
│   └── expeditions/
├── 08-consultations/             # /consultations
├── 09-ventes/                    # /ventes
├── 10-finance/                   # /finance
│   ├── depenses/
│   ├── rapprochement/
│   └── accounting/
├── 11-factures/                  # /factures
├── 12-tresorerie/                # /tresorerie
├── 13-canaux-vente/              # /canaux-vente
│   ├── google-merchant/
│   ├── prix-clients/
│   └── integrations/
├── 14-admin/                     # /admin
│   ├── users/
│   └── activite-utilisateurs/
├── 15-notifications/             # /notifications
├── 16-parametres/                # /parametres
├── 17-organisation/              # /organisation
├── 98-ux-ui/                     # Design patterns transverses
└── 99-transverses/               # Aspects cross-module
    ├── workflows/
    ├── integrations/
    ├── data-quality/
    └── compliance/
```

### Règles de Classification Automatique

**Pour ajouter une nouvelle business rule** :

1. **Identifier le module** : Quel route dans `src/app/` ?
2. **Placer dans dossier numéroté** : 01-17 selon module
3. **Si multi-module** : `99-transverses/workflows/`
4. **Si UX/Design** : `98-ux-ui/`

**Exemples** :
```typescript
// Règle remises clients → Pricing
"docs/business-rules/05-pricing-tarification/discount-rules.md"

// Workflow commande→expédition → Transverse
"docs/business-rules/99-transverses/workflows/order-to-shipment.md"

// Pattern modal → UX
"docs/business-rules/98-ux-ui/modal-pattern.md"

// Règle stock minimum → Stocks/Alertes
"docs/business-rules/06-stocks/alertes/minimum-stock-rules.md"
```

**Ressource complète** : `docs/business-rules/README.md` (index exhaustif avec statistiques)

---

## 📊 CLASSIFICATION AUTOMATIQUE RAPPORTS

**Système organisé pour tous types de rapports**

### Rapports d'Audit

**Structure** : `docs/audits/`

```typescript
// Audits par phase
docs/audits/phases/
├── phase-a-baseline/    // Audit initial baseline
├── phase-b-testing/     // Tests exhaustifs
├── phase-c-security/    // Audits sécurité
└── phase-d-final/       // Audit final pré-production

// Rapports mensuels
docs/audits/YYYY-MM/
├── RAPPORT-AUDIT-COMPLET-2025-10-25.md
├── RAPPORT-ERREURS-TYPESCRIPT-2025-10-25.md
└── RAPPORT-FIXES-PHASE-1-2-2025-10-25.md
```

**Règles de placement** :

1. **Rapports d'audit phase** → `docs/audits/phases/phase-{x}-{nom}/`
2. **Rapports finaux** → `docs/audits/YYYY-MM/RAPPORT-{TYPE}-{DATE}.md`
3. **Fichiers temporaires** → Supprimer après consolidation

### Rapports Techniques

**Structure** : `docs/workflows/` ou dossier spécifique

```typescript
// Rapports performance
docs/metrics/performance-reports/
└── perf-report-2025-10-26.md

// Rapports sécurité
docs/security/security-audits/
└── security-scan-2025-10-26.md

// Rapports database
docs/database/schema-reports/
└── schema-analysis-2025-10-26.md
```

### Workflow Automatique Claude

**Quand vous générez un rapport** :

```typescript
// 1. Identifier le type
const reportType = detectReportType(content)

// 2. Classification automatique
switch (reportType) {
  case "audit-phase":
    path = `docs/audits/phases/phase-${phase}-${name}/`
    break
  case "audit-monthly":
    path = `docs/audits/${YYYY-MM}/RAPPORT-${TYPE}-${DATE}.md`
    break
  case "performance":
    path = `docs/metrics/performance-reports/`
    break
  case "security":
    path = `docs/security/security-audits/`
    break
  case "database":
    path = `docs/database/schema-reports/`
    break
  case "business-rule":
    path = `docs/business-rules/${module}/`
    break
}

// 3. Créer fichier au bon endroit
await createReport(path, content)

// 4. Nettoyer racine projet
await cleanupProjectRoot()
```

**Convention naming** :
- **Dates** : `YYYY-MM-DD` (ISO 8601)
- **Format** : `{TYPE}-{DESCRIPTION}-{DATE}.md`
- **Exemples** :
  - `RAPPORT-AUDIT-COMPLET-2025-10-26.md`
  - `perf-analysis-dashboard-2025-10-26.md`
  - `security-scan-pre-deploy-2025-10-26.md`

**RÈGLE ABSOLUE** : **Aucun fichier .md à la racine projet** (sauf CLAUDE.md, README.md, CHANGELOG.md)

---

**Version** : 3.1.0 (Organisation Documentation Complète 2025)
**Dernière mise à jour** : 2025-10-26
**Mainteneur** : Romeo Dos Santos
