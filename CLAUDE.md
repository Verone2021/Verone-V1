# 🚀 Vérone Back Office - Claude Code 2025

**CRM/ERP modulaire** pour décoration et mobilier d'intérieur haut de gamme
**Stack actuelle** : Next.js 15 (App Router) + Supabase + shadcn/ui
**Roadmap** : Migration progressive vers architecture NestJS (backend) + Next.js (frontend)

---

## 📋 TABLE DES MATIÈRES

1. [Contexte & Objectif](#contexte--objectif)
2. [Stack Technique](#stack-technique)
3. [Langue](#langue)
4. [Workflow 2025](#workflow-2025)
5. [Structure Repository](#structure-repository)
6. [Agents MCP - Usage Prioritaire](#agents-mcp---usage-prioritaire)
7. [Database Schema (Anti-Hallucination)](#database-schema-anti-hallucination)
8. [Design System V2 & Storybook](#design-system-v2--storybook)
9. [KPI & Documentation](#kpi--documentation)
10. [Scripts d'Audit](#scripts-daudit)
11. [CI/CD Rules](#cicd-rules)
12. [Déploiement](#déploiement)
13. [Règles Business Critiques](#règles-business-critiques)
14. [Protected Files](#protected-files)
15. [Monorepo (Roadmap)](#monorepo-roadmap)

---

## 🎯 CONTEXTE & OBJECTIF

Ce fichier est le **guide principal** pour Claude Code sur le projet Vérone Back Office.

### Objectifs prioritaires

- ✅ **Qualité** : Zero console errors, code audité, tests ciblés
- ✅ **Stabilité** : Rollback documentés, migrations idempotentes, feature flags
- ✅ **Scalabilité** : Structure monorepo préparée, composants Storybook, KPI centralisés
- ✅ **Collaboration** : PR atomiques, documentation vivante, CODEOWNERS

### Phase actuelle : Phase 1 - Déploiement Stabilisé ✅

**Date stabilisation** : 2025-10-23
**État** : Production-ready avec modules core validés

#### ✅ Modules ACTIFS (Déployés)
- **Authentification** : Login, Logout, Profils utilisateurs (`/login`, `/profile`)
- **Dashboard** : Vue d'ensemble, KPIs business (`/dashboard`)
- **Organisations & Contacts** : Fournisseurs, Clients B2B, Prestataires (`/contacts-organisations`)
- **Administration** : Gestion utilisateurs, rôles, permissions (`/admin`)
- **Paramètres** : Configuration application (`/parametres`)

#### ❌ Modules DÉSACTIVÉS (Phase 2+)
- **Produits & Catalogue** : `/produits` → Middleware bloque accès
- **Stocks & Inventaire** : `/stocks` → Middleware bloque accès
- **Commandes** : `/commandes` → Middleware bloque accès
- **Finance & Trésorerie** : `/finance`, `/factures`, `/tresorerie` → Middleware bloque accès
- **Canaux de Vente** : `/canaux-vente`, `/ventes` → Middleware bloque accès
- **Interactions** : `/interactions`, `/consultations` → Middleware bloque accès
- **Notifications** : `/notifications` → Middleware bloque accès

#### 🛡️ Protection Routes
- **Middleware** : `src/middleware.ts` bloque accès modules désactivés
- **Page dédiée** : `/module-inactive` avec message phase déploiement
- **Feature flags** : `src/lib/feature-flags.ts` configuration centralisée

### Prochaines phases

- **Phase 2 (Q4 2025)** : Produits, Catalogue, Stocks, Commandes
- **Phase 3 (Q1 2026)** : Finance, Trésorerie, Canaux vente, Interactions
- **Phase 4 (Q2 2026)** : Migration monorepo (apps/api NestJS + apps/web Next.js)

---

## 🔧 STACK TECHNIQUE

### Architecture actuelle (Phase 1)

```typescript
Frontend : Next.js 15 (App Router, RSC, Server Actions)
UI Library : shadcn/ui + Radix UI + Tailwind CSS
Database : Supabase (PostgreSQL + Auth + Storage + RLS)
Validation : Zod
State : Zustand (global) + React Query (server state)
Forms : React Hook Form + Zod
Testing : Vitest (unitaires) + Playwright (e2e) + Storybook (composants)
Deployment : Vercel (auto-deploy depuis main)
```

### Architecture future (Phase 2 - Monorepo)

```typescript
apps/
  ├── api/          # Backend NestJS (REST + GraphQL)
  │   ├── modules/  # Modules métier (auth, catalogue, orders, etc.)
  │   └── database/ # Migrations, seeds, Prisma/TypeORM
  └── web/          # Frontend Next.js 15
      ├── app/      # App Router pages
      └── features/ # Modules fonctionnels

packages/
  ├── ui/           # Design system + Storybook
  ├── kpi/          # KPI documentés (YAML + tests)
  ├── types/        # DTO partagés (API ↔ Frontend)
  ├── config/       # Config ESLint, Prettier, TSConfig
  └── utils/        # Helpers communs

tools/
  ├── scripts/      # Scripts d'audit, migration
  └── generators/   # Générateurs de code (Plop, Hygen)
```

### Migration progressive

- **Pas de big bang** : Migration module par module
- **Cohabitation** : Next.js API Routes → NestJS endpoints graduellement
- **Feature flags** : Activation progressive des nouvelles APIs
- **Rollback** : Toujours possible de revenir à Next.js pur

---

## 🇫🇷 LANGUE

**TOUJOURS communiquer en français**

- Messages, commentaires code, docs, erreurs, commit messages, PR
- Exceptions : Code (variables, fonctions en anglais), logs techniques

---

## 🧠 WORKFLOW 2025

**Plan-First → Agent Orchestration → Console Clean → Deploy**

### Phase 1 : PLAN-FIRST

```typescript
// Tâches complexes (>3 étapes) → Sequential Thinking MANDATORY
mcp__sequential-thinking__sequentialthinking

// Clarifications → AskUserQuestion si ambiguïté
AskUserQuestion({ questions: [...] })

// Todo List → Tracking progression
TodoWrite({ todos: [...] })
```

### Phase 2 : AGENT ORCHESTRATION

```typescript
// Recherche & Exploration
Context7        // Docs officielles frameworks
Serena          // Code analysis, symbols overview

// Implémentation
Serena          // Symbolic editing (précis)
Supabase        // Database queries, advisors

// Tests
Playwright      // Browser testing, console errors
Supabase        // Logs monitoring

// Déploiement
GitHub          // PR automatisées
Vercel          // Auto-deploy
```

### Phase 3 : CONSOLE ERROR CHECKING (Règle Sacrée)

```typescript
// 🚫 INTERDIT : Scripts test (*.js, *.mjs, *.ts)
// ✅ OBLIGATOIRE : MCP Playwright Browser direct

1. mcp__playwright__browser_navigate(url)
2. mcp__playwright__browser_console_messages()
3. Si erreurs → STOP → Fix ALL → Re-test
4. mcp__playwright__browser_take_screenshot()
5. Zero tolerance : 1 erreur = échec complet
```

**Aucune exception** : Les console.errors masquent souvent des bugs critiques.

### Phase 4 : DEPLOY

```typescript
1. PR atomique + tests verts
2. Revue obligatoire (CODEOWNERS)
3. Vercel preview deploy
4. Validation staging
5. Merge → Auto-deploy production
6. Monitoring Sentry + Supabase logs
```

---

## 📁 STRUCTURE REPOSITORY

### Organisation actuelle

```
.claude/commands/        # Custom slash commands
.github/
  ├── workflows/         # GitHub Actions (CI/CD)
  └── PULL_REQUEST_TEMPLATE.md

src/                     # Next.js app
  ├── app/               # App Router pages
  ├── components/        # React components
  │   ├── ui/            # shadcn/ui base
  │   └── ui-v2/         # Design System V2
  ├── hooks/             # Custom hooks
  ├── lib/               # Utils, Supabase client
  └── types/             # TypeScript types

docs/                    # Documentation technique
  ├── auth/              # Rôles, permissions, RLS
  ├── database/          # Schema, triggers, functions
  ├── metrics/           # KPI, calculs, triggers
  ├── workflows/         # Business workflows
  └── ci-cd/             # Déploiement, rollback

manifests/               # Business rules (auto-updated)
MEMORY-BANK/             # Context sessions
TASKS/                   # Task management
supabase/migrations/     # Database migrations

packages/                # Future monorepo (préparation)
  ├── ui/                # Design system (à migrer)
  ├── kpi/               # KPI docs YAML
  └── [autres...]        # À créer progressivement

archive/                 # Fichiers obsolètes (référence historique)
```

### Règles organisation fichiers

**JAMAIS créer fichiers MD à la racine** (sauf README.md, CLAUDE.md)

**Auto-Classification Patterns** :

```typescript
"migration" → docs/migrations/
"session" → MEMORY-BANK/sessions/
"RAPPORT-" → MEMORY-BANK/sessions/
"business rule" → manifests/business-rules/
"PRD:" → manifests/prd/
"KPI" → packages/kpi/
"component" → src/components/ (+ Storybook story)
```

**Naming conventions** :

- Fichiers : `kebab-case.ts`, `kebab-case.md`
- Composants : `PascalCase.tsx`
- Variables : `camelCase`
- Constantes : `UPPER_SNAKE_CASE`
- Types : `PascalCase`

---

## 🤖 AGENTS MCP - USAGE PRIORITAIRE

### Serena - Code Intelligence

```typescript
mcp__serena__get_symbols_overview   // Explorer fichier AVANT modification
mcp__serena__find_symbol            // Localiser symboles
mcp__serena__replace_symbol_body    // Édition précise
mcp__serena__write_memory           // Context persistant
mcp__serena__search_for_pattern     // Recherche patterns
```

**Best practices** :

- TOUJOURS `get_symbols_overview` avant éditer un fichier
- Éviter lecture fichiers entiers (token-inefficient)
- Préférer édition symbolique vs regex quand possible

### Supabase - Database

```typescript
// 🔑 CREDENTIALS : TOUJOURS lire depuis .env.local (ligne 19)
// Fichier : /Users/romeodossantos/verone-back-office-V1/.env.local
// Connection : aws-1-eu-west-3.pooler.supabase.com:5432
// Password : ADFVKDJCJDNC934

mcp__supabase__execute_sql           // Queries directes
mcp__supabase__get_advisors          // Sécurité/performance
mcp__supabase__generate_typescript_types  // Types après migrations

// Workflow automatisé :
1. Read .env.local pour DATABASE_URL
2. Essayer Session Pooler (5432) en priorité
3. Si échec → Direct Connection (6543)
4. JAMAIS demander credentials manuellement
```

### Playwright - Browser Testing

```typescript
// 🚫 INTERDIT : Créer scripts test
// ✅ OBLIGATOIRE : MCP Browser direct visible

mcp__playwright__browser_navigate
mcp__playwright__browser_console_messages
mcp__playwright__browser_click
mcp__playwright__browser_take_screenshot
mcp__playwright__browser_snapshot   // Accessibility
```

### Autres Agents

```typescript
mcp__context7__get-library-docs              // Docs officielles
mcp__sequential-thinking__sequentialthinking // Architecture complexe
mcp__github__create_pull_request             // PR automatisées
mcp__memory__*                               // Knowledge graph
```

---

## 🗄️ DATABASE SCHEMA (Anti-Hallucination)

**Source de vérité unique** : `/docs/database/` (extraction complète 2025-10-17)

### 📊 Statistiques Database

- **78 tables** exhaustivement documentées
- **158 triggers** avec 10 interdépendants (stock)
- **217 RLS policies** (sécurité par rôle)
- **254 fonctions PostgreSQL** (89 triggers, 72 RPC, 45 helpers)
- **34 types enum** (194 valeurs)
- **85 foreign keys** (intégrité référentielle)

### 🚫 RÈGLE ANTI-HALLUCINATION

**Problème historique** :

> *"À chaque fois, mon agent hallucine et crée des tables en plus. Par exemple, il créé une table `suppliers` alors qu'on a déjà `organisations`."*

**WORKFLOW OBLIGATOIRE avant toute modification database** :

```typescript
// ÉTAPE 1 : TOUJOURS consulter documentation AVANT création
Read("docs/database/SCHEMA-REFERENCE.md")       // 78 tables
Read("docs/database/best-practices.md")         // Anti-hallucination guide

// ÉTAPE 2 : Rechercher structure similaire existante
mcp__serena__search_for_pattern({
  pattern: "supplier|customer|price",
  relative_path: "docs/database/"
})

// ÉTAPE 3 : Si doute → Demander confirmation utilisateur
AskUserQuestion({
  question: "Table `suppliers` existe-t-elle déjà sous autre forme ?"
})

// ÉTAPE 4 : Migration SQL documentée uniquement
// Fichier : supabase/migrations/YYYYMMDD_NNN_description.sql
```

### ❌ TABLES À NE JAMAIS CRÉER (Hallucinations Fréquentes)

| ❌ NE PAS Créer       | ✅ Utiliser À La Place                          |
| --------------------- | ----------------------------------------------- |
| `suppliers`           | `organisations WHERE type='supplier'`           |
| `customers`           | `organisations WHERE type='customer'` + `individual_customers` |
| `products_pricing`    | `price_list_items` + `calculate_product_price_v2()` |
| `product_stock`       | `stock_movements` (triggers calculent automatiquement) |
| `user_roles`          | `user_profiles.role` (enum user_role_type)      |

### ❌ COLONNES À NE JAMAIS AJOUTER (Hallucinations Fréquentes)

| ❌ NE PAS Ajouter             | ✅ Utiliser À La Place                          |
| ----------------------------- | ----------------------------------------------- |
| `products.cost_price`         | `price_list_items.cost_price`                   |
| `products.sale_price`         | `calculate_product_price_v2()` (RPC multi-canal) |
| `products.primary_image_url`  | `product_images WHERE is_primary=true` (LEFT JOIN) |
| `products.stock_quantity`     | Calculé par trigger `maintain_stock_totals()`   |
| `sales_orders.total_amount`   | Calculé par trigger `calculate_sales_order_total()` |

### 📖 Documentation Database Complète

```
docs/database/
├── SCHEMA-REFERENCE.md        # 78 tables exhaustives (SOURCE VÉRITÉ)
├── triggers.md                # 158 triggers documentés
├── rls-policies.md            # 217 RLS policies
├── functions-rpc.md           # 254 fonctions PostgreSQL
├── enums.md                   # 34 types enum (194 valeurs)
├── foreign-keys.md            # 85 contraintes FK
└── best-practices.md          # Guide anti-hallucination
```

### ⚠️ CHECKLIST MODIFICATION DATABASE (MANDATORY)

```markdown
Avant toute création table/colonne/trigger :

- [ ] Lire SCHEMA-REFERENCE.md section concernée
- [ ] Vérifier enums.md si ajout contrainte
- [ ] Vérifier foreign-keys.md si ajout relation
- [ ] Vérifier triggers.md si modification colonne calculée
- [ ] Vérifier functions-rpc.md si modification logique métier
- [ ] Rechercher structure similaire existante (search_for_pattern)
- [ ] AskUserQuestion si doute sur architecture
- [ ] Créer migration YYYYMMDD_NNN_description.sql
- [ ] Tester migration sur dev AVANT production
```

### Database Migrations Convention (Supabase)

```typescript
// 📁 EMPLACEMENT : supabase/migrations/
// 📝 NAMING OBLIGATOIRE : YYYYMMDD_NNN_description.sql

// ✅ EXEMPLES CORRECTS :
20251021_001_add_tax_rate_column.sql
20251021_002_create_invoices_rpc.sql
20251021_003_add_rls_policies_stock_movements.sql

// ❌ EXEMPLES INCORRECTS :
20251021_add_tax_rate.sql              // Manque _NNN_
add-tax-rate.sql                       // Pas de date
202510215_005_create_table.sql         // Date invalide (9 chiffres)
20251021-create-table.sql              // Séparateur incorrect

// 🔑 FORMAT DÉTAILLÉ :
// YYYYMMDD : Date création (ex : 20251021)
// NNN      : Numéro séquentiel du jour (001, 002, 003...)
// description : Description kebab-case (snake_case accepté)
// .sql     : Extension obligatoire

// 📋 RÈGLES :
// 1. TOUJOURS utiliser supabase/migrations/ (jamais docs/, scripts/, etc.)
// 2. Une migration = Un fichier SQL pur (pas de bash, python, etc.)
// 3. Idempotent (IF NOT EXISTS, IF EXISTS) quand possible
// 4. Commentaires explicatifs obligatoires
// 5. Archiver (pas supprimer) migrations obsolètes → archive/migrations-YYYY-MM/

// 📂 STRUCTURE :
supabase/migrations/
├── YYYYMMDD_NNN_*.sql    // Migrations actives
├── archive/              // Migrations archivées (référence historique)
│   ├── 2025-10-rollbacks/
│   ├── 2025-10-debug-iterations/
│   └── YYYY-phase-name/
└── README.md             // Documentation process

// ⚠️ ARCHIVAGE (Best Practices 2025) :
// Archiver quand : Migration remplacée, rollback appliqué, iteration debug consolidée
// Ne JAMAIS delete migrations appliquées production (archive > delete)
```

---

## 🎨 DESIGN SYSTEM V2 & STORYBOOK

### Design System Vérone V2 (2025)

**Palette Moderne 2025** - Inspirée Odoo, Figma, Dribbble, shadcn/ui

```css
--verone-primary: #3b86d1      /* Bleu professionnel */
--verone-success: #38ce3c      /* Vert validation */
--verone-warning: #ff9b3e      /* Orange attention */
--verone-accent: #844fc1       /* Violet créatif */
--verone-danger: #ff4d6b       /* Rouge critique */
--verone-neutral: #6c7293      /* Gris interface */
```

**Fichiers Design System V2** :

```
src/lib/design-system/       # Tokens, themes, utils
src/lib/theme-v2.ts          # Thème complet avec gradients
src/components/ui-v2/        # Composants modernes (Button, KPI Cards, etc.)
```

**Tendances 2025** :

- ✅ Couleurs vives et gradients autorisés
- ✅ Rounded corners (border-radius: 8-16px)
- ✅ Micro-interactions (hover, focus, active states)
- ✅ Shadows élégantes (drop-shadow, box-shadow subtiles)
- ✅ Transitions fluides (200-300ms ease-in-out)

### Storybook - Composants UI

**Installation** : `npx storybook@latest init`

**Structure stories** :

```
src/stories/
├── design-system/
│   ├── Colors.stories.tsx
│   ├── Typography.stories.tsx
│   └── Spacing.stories.tsx
├── components/
│   ├── Button.stories.tsx
│   ├── Input.stories.tsx
│   ├── Card.stories.tsx
│   └── [autres...]
└── pages/
    ├── Dashboard.stories.tsx
    └── ProductDetail.stories.tsx
```

**Règles Storybook** :

1. **Tout composant réutilisable DOIT avoir une story**
2. **Stories = documentation vivante** (props, variants, examples)
3. **Tests visuels** : Chromatic ou Percy pour régression visuelle
4. **Accessibilité** : Addon a11y activé par défaut

**Workflow création composant** :

```typescript
1. Créer composant : src/components/ui-v2/NewComponent.tsx
2. Créer story : src/stories/components/NewComponent.stories.tsx
3. Tester dans Storybook : npm run storybook
4. Documenter props, variants, best practices
5. Ajouter tests unitaires (Vitest)
6. PR avec screenshots Storybook
```

### Product Images Pattern (BR-TECH-002)

```typescript
// ✅ OBLIGATOIRE : Jointure product_images
const { data } = await supabase
  .from('products')
  .select(`
    id, name, sku,
    product_images!left (public_url, is_primary)
  `)

// Enrichissement MANDATORY
const enriched = data.map(p => ({
  ...p,
  primary_image_url: p.product_images?.[0]?.public_url || null
}))

// ❌ INTERDIT : products.primary_image_url (colonne supprimée)
```

---

## 📊 KPI & DOCUMENTATION

### Format KPI (YAML)

Tous les KPI métier doivent être documentés en YAML dans `packages/kpi/`.

**Structure obligatoire** :

```yaml
# packages/kpi/stock-turnover-rate.yaml
name: Stock Turnover Rate
description: Mesure la vitesse de rotation du stock sur une période
category: Stock
formula: |
  turnover_rate = cost_of_goods_sold / average_inventory_value
inputs:
  - name: cost_of_goods_sold
    type: number
    source: sales_order_items.unit_cost * quantity
    query: |
      SELECT SUM(unit_cost * quantity) as cogs
      FROM sales_order_items
      WHERE created_at BETWEEN :start_date AND :end_date
  - name: average_inventory_value
    type: number
    source: products.stock_real * price_list_items.cost_price
    query: |
      SELECT AVG(p.stock_real * pli.cost_price) as avg_inventory
      FROM products p
      LEFT JOIN price_list_items pli ON pli.product_id = p.id
      WHERE pli.price_list_id = :default_price_list_id
output:
  type: number
  unit: ratio
  format: "0.00"
thresholds:
  excellent: "> 8"
  good: "4-8"
  warning: "2-4"
  critical: "< 2"
tests:
  - scenario: "Stock rapide (turnover = 10)"
    inputs:
      cost_of_goods_sold: 100000
      average_inventory_value: 10000
    expected_output: 10.0
  - scenario: "Stock lent (turnover = 1.5)"
    inputs:
      cost_of_goods_sold: 30000
      average_inventory_value: 20000
    expected_output: 1.5
references:
  - docs/metrics/calculations.md
  - src/hooks/use-stock-metrics.ts
last_updated: 2025-10-21
validated_by: Romeo Dos Santos
```

### Documentation KPI

**Emplacement** : `packages/kpi/`

**Index obligatoire** : `packages/kpi/README.md` listant tous les KPI

**Validation** : Tests unitaires basés sur la section `tests:` du YAML

**Hooks associés** : Chaque KPI doit avoir un hook React (`use-[kpi-name].ts`)

### KPI Tracking & Automation (2025-10-22)

**État actuel** : 48 KPI documentés / 48 identifiés (100% coverage modules déployés)
**Dernier audit** : 2025-10-22 (voir `tools/reports/2025-10-22/kpi-inventory-exhaustif.md`)
**Catalogue** : `packages/kpi/catalogue.md` version 2.0.0 (index complet)

#### Workflow Audit KPI Automatisé

```typescript
// WORKFLOW OBLIGATOIRE pour tout nouveau KPI

1. **Identification** : Repérer un compteur/métrique dans l'UI
   - Exemple : "Total Organisations", "Score engagement", "CA du mois"
   - Vérifier si déjà documenté dans packages/kpi/

2. **Recherche source** :
   - Identifier le hook React (use*Metrics, use*Stats)
   - Trouver la table database source
   - Identifier la query SQL ou le calcul

3. **Documentation YAML** :
   - Copier template : packages/kpi/EXAMPLE.yaml
   - Remplir TOUTES les sections obligatoires
   - Ajouter au moins 1 scénario de test
   - Référencer composant affichant le KPI

4. **Mise à jour catalogue** :
   - Ajouter entrée dans packages/kpi/catalogue.md
   - Mettre à jour statistiques globales
   - Ajouter dans index alphabétique

5. **Validation** :
   - Vérifier format YAML valide
   - Tester formule avec scénarios
   - Vérifier références code existent
```

#### Règles Création Nouveau KPI

**MANDATORY avant créer un nouveau KPI** :

```bash
# 1. Vérifier si KPI existe déjà
grep -r "name: Nom KPI" packages/kpi/

# 2. Consulter catalogue
cat packages/kpi/catalogue.md | grep "Nom KPI"

# 3. Si nouveau, créer YAML complet
cp packages/kpi/EXAMPLE.yaml packages/kpi/module/nouveau-kpi.yaml

# 4. Remplir sections obligatoires (checklist ci-dessous)
```

**Checklist sections YAML obligatoires** :

- [ ] `id` : Unique, format `kpi-module-nom-kebab-case`
- [ ] `name` : Nom lisible français
- [ ] `description` : Minimum 2 phrases explicatives
- [ ] `module` : Organisations | Profil et rôles | Dashboard | Stock | etc.
- [ ] `category` : Compteurs | Métriques | Engagement | Activité | etc.
- [ ] `owner` : Romeo Dos Santos (par défaut)
- [ ] `formula` : Formule mathématique explicite
- [ ] `inputs` : Liste complète avec sources
- [ ] `output` : Type, unit, format
- [ ] `source.table` : Table database
- [ ] `source.hook` : Hook React
- [ ] `source.query` : Query SQL complète
- [ ] `displayed_in` : Au moins 1 composant avec ligne exacte
- [ ] `thresholds` : Seuils interprétation (si applicable)
- [ ] `tests` : Au moins 1 scénario de test
- [ ] `metadata.created_at` : Date création (YYYY-MM-DD)
- [ ] `metadata.validated_by` : Validateur
- [ ] `metadata.version` : 1.0.0 (SemVer)
- [ ] `metadata.status` : active | draft | deprecated

**Sections optionnelles mais recommandées** :

- `references` : Liens docs/code/database
- `business_notes` : Contexte métier Vérone spécifique
- `alerts` : Alertes automatiques futures

#### CI/CD Intégration (Future - Phase 2)

**GitHub Actions workflow** à implémenter :

```yaml
# .github/workflows/kpi-validation.yml
name: KPI Validation & Auto-Update

on:
  pull_request:
    paths:
      - 'packages/kpi/**/*.yaml'
      - 'src/hooks/**/*-metrics.ts'
      - 'src/components/**/stats*.tsx'

  schedule:
    - cron: '0 0 * * 0' # Audit hebdomadaire dimanche 00:00

jobs:
  validate-yaml:
    runs-on: ubuntu-latest
    steps:
      - Vérifier syntaxe YAML
      - Valider sections obligatoires présentes
      - Vérifier références code existent
      - Exécuter tests scenarios YAML

  auto-update-catalogue:
    needs: validate-yaml
    runs-on: ubuntu-latest
    steps:
      - Compter KPI par module
      - Régénérer packages/kpi/catalogue.md automatiquement
      - Commit + Push si changements

  kpi-audit:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - Scanner tous composants pour nouveaux KPI
      - Comparer avec KPI documentés
      - Générer rapport audit tools/reports/<date>/kpi-audit.md
      - Créer issue si coverage < 80%
```

#### État Actuel KPI (Audit 2025-10-22)

**KPI documentés (11)** :

##### Module Organisations (8 KPI)
- ✅ Total Organisations
- ✅ Total Fournisseurs
- ✅ Fournisseurs Actifs
- ✅ Fournisseurs Archivés
- ✅ Fournisseurs Favoris
- ✅ Total Clients Professionnels
- ✅ Total Prestataires
- ✅ Produits référencés (par fournisseur)

##### Module Profil et rôles (3 KPI)
- ✅ Sessions totales (utilisateur)
- ✅ Score d'engagement (utilisateur)
- ✅ Temps passé par module (utilisateur)

**KPI à documenter (17 prioritaires)** :

##### Dashboard (4 KPI - PRIORITÉ CRITIQUE)
- [ ] CA du mois
- [ ] Valeur stock
- [ ] Commandes ventes (count)
- [ ] Commandes achats (count)

##### Organisations - Onglets (3 KPI - PRIORITÉ HAUTE)
- [ ] Contacts par organisation
- [ ] Commandes par organisation
- [ ] Produits par organisation (compteur onglet)

##### Utilisateurs (5 KPI - PRIORITÉ HAUTE)
- [ ] Durée moyenne session
- [ ] Fréquence de connexion
- [ ] Ancienneté compte (jours)
- [ ] Statut activité (actif/dormant)
- [ ] Type de compte (staff/standard)

##### Organisations - Clients/Prestataires (5 KPI - PRIORITÉ MOYENNE)
- [ ] Clients actifs/archivés/favoris (3 KPI)
- [ ] Prestataires actifs/archivés (2 KPI)

**Objectif Q4 2025** : Coverage 100% (28/28 KPI documentés)

#### Hooks React KPI (À Créer - Phase 2)

**Convention naming** : `use-[kpi-id]-kpi.ts`

```typescript
// Exemple : packages/kpi/hooks/use-total-organisations-kpi.ts
import { useOrganisations } from '@/hooks/use-organisations'

export function useTotalOrganisationsKPI(includeArchived = false) {
  const { organisations, loading, error } = useOrganisations({})

  const total = organisations.filter(o =>
    includeArchived || !o.archived_at
  ).length

  const threshold =
    total > 200 ? 'excellent' :
    total > 100 ? 'good' :
    total > 50 ? 'warning' : 'critical'

  return { total, threshold, loading, error }
}
```

**Avantages hooks KPI** :
- Logique calcul centralisée
- Réutilisable cross-composants
- Tests unitaires isolés
- Seuils interprétation inclus

#### Métriques Succès KPI

**Coverage** :
- Phase 1 (Oct 2025) : 39% (11/28) ✅
- Phase 2 (Nov 2025) : 75% (21/28) 🎯
- Phase 3 (Déc 2025) : 100% (28/28) 🎯

**Qualité** :
- Format YAML valide : 100%
- Sections obligatoires complètes : 100%
- Tests scenarios présents : 100%
- References code valides : 100%

**Automatisation** :
- CI/CD validation YAML : ⏳ À implémenter
- Auto-update catalogue : ⏳ À implémenter
- Hooks React KPI : ⏳ À créer
- Tests unitaires Vitest : ⏳ À implémenter

---

## 🔍 SCRIPTS D'AUDIT

### Outils installés

```bash
npm install -D jscpd madge dependency-cruiser knip ts-prune cspell
```

### Scripts package.json

```json
{
  "scripts": {
    "audit:duplicates": "jscpd src/ --min-lines 5 --min-tokens 50",
    "audit:cycles": "madge --circular src/",
    "audit:dependencies": "depcruiser --config .dependency-cruiser.js src/",
    "audit:deadcode": "knip",
    "audit:unused": "ts-prune",
    "audit:spelling": "cspell 'src/**/*.{ts,tsx,md}' 'docs/**/*.md'",
    "audit:all": "npm run audit:duplicates && npm run audit:cycles && npm run audit:deadcode && npm run audit:spelling"
  }
}
```

### GitHub Actions (CI)

Voir `.github/workflows/audit.yml` - Exécution automatique sur chaque PR.

**Seuils de tolérance** :

- Duplication : Max 5% (ajustable)
- Cycles : 0 toléré (strict)
- Dead code : Warning uniquement
- Spelling : Dictionnaire personnalisé (`.cspell.json`)

---

## 🗄️ DATABASE AUDIT AUTOMATION

### Système d'Audit Automatisé

**Objectif** : Garantir synchronisation permanente entre schema live Supabase et documentation.

**Problème résolu** : Anti-hallucination database (créations de tables/colonnes déjà existantes).

### Workflow Automatisé

```typescript
// ✅ WORKFLOW OBLIGATOIRE avant toute modification database
1. mcp__supabase__get_database_schema     // Schema live
2. Compare avec docs/database/SCHEMA-REFERENCE.md
3. mcp__supabase__generate_typescript_types → src/types/supabase.ts
4. Détection drift (supabase db diff)
5. Update documentation si drift détecté
6. CI check sur chaque PR
```

### Script d'Audit

**Emplacement** : `tools/scripts/audit-database.js`

**Usage manuel** :

```bash
# Audit complet avec rapport HTML
node tools/scripts/audit-database.js --report=html

# Audit + auto-fix documentation
node tools/scripts/audit-database.js --fix --report=both

# Mode CI (exit code 1 si drift)
node tools/scripts/audit-database.js --ci
```

**Audits effectués** :

1. ✅ **Schema vs Doc** : Compare tables live vs docs/database/SCHEMA-REFERENCE.md
2. ✅ **Triggers** : Vérifie docs/database/triggers.md synchronisé
3. ✅ **RLS Policies** : Vérifie docs/database/rls-policies.md complet
4. ✅ **Drift Detection** : `supabase db diff` pour changements non documentés
5. ✅ **Types Generation** : Auto-génère src/types/supabase.ts

**Rapports** :

```bash
tools/reports/
├── db_audit_YYYYMMDD_HHMMSS.json    # Rapport JSON (CI)
└── db_audit_YYYYMMDD_HHMMSS.html    # Rapport HTML (humain)
```

### Intégration CI/CD

**GitHub Actions** : `.github/workflows/database-audit.yml`

**Déclencheurs** :

```yaml
on:
  pull_request:
    paths:
      - 'supabase/migrations/**'      # Migrations modifiées
      - 'docs/database/**'            # Documentation modifiée
      - 'src/types/supabase.ts'       # Types modifiés
  workflow_dispatch:                  # Manuel
  schedule:
    - cron: '0 0 * * 0'               # Hebdomadaire (dimanche 00:00)
```

**Actions automatiques** :

1. ✅ Exécute audit complet
2. ✅ Génère rapports JSON + HTML
3. ✅ Commente PR avec résultats
4. ✅ Échoue si drift détecté (exit code 1)
5. ✅ Upload artifacts (rapports 30 jours rétention)

**Auto-fix optionnel** :

```bash
# Ajouter label "auto-fix-db-docs" sur PR
# → Job séparé met à jour docs/database/ automatiquement
```

### Règles Permanentes (CLAUDE.md)

**WORKFLOW OBLIGATOIRE avant toute création table/colonne** :

```typescript
// ❌ INTERDIT : Créer table sans vérification
CREATE TABLE suppliers (...);  // STOP! Vérifier d'abord

// ✅ OBLIGATOIRE : Workflow anti-hallucination
1. Read("docs/database/SCHEMA-REFERENCE.md")
2. mcp__serena__search_for_pattern({ pattern: "supplier|customer" })
3. AskUserQuestion si doute sur existence
4. Migration SQL documentée SEULEMENT après vérification
```

**Checklist modification database** (MANDATORY) :

- [ ] Lire SCHEMA-REFERENCE.md section concernée
- [ ] Vérifier enums.md si ajout contrainte
- [ ] Vérifier foreign-keys.md si ajout relation
- [ ] Vérifier triggers.md si modification colonne calculée
- [ ] Rechercher structure similaire (search_for_pattern)
- [ ] AskUserQuestion si doute architecture
- [ ] Créer migration YYYYMMDD_NNN_description.sql
- [ ] Tester migration dev AVANT production
- [ ] Exécuter audit : `node tools/scripts/audit-database.js`
- [ ] Vérifier types générés : `src/types/supabase.ts`

### Documentation Source de Vérité

**Emplacement** : `/docs/database/` (extraction complète 2025-10-17)

**Fichiers critiques** :

```bash
docs/database/
├── SCHEMA-REFERENCE.md       # 78 tables (SOURCE VÉRITÉ)
├── triggers.md               # 158 triggers
├── rls-policies.md           # 217 RLS policies
├── functions-rpc.md          # 254 fonctions PostgreSQL
├── enums.md                  # 34 types enum (194 valeurs)
├── foreign-keys.md           # 85 contraintes FK
└── best-practices.md         # Guide anti-hallucination
```

**Synchronisation** :

- 📊 **Live DB** : Source de vérité absolue (Supabase production/local)
- 📝 **Documentation** : Vue synchronisée (mise à jour via audit script)
- 🔄 **CI** : Détection automatique drift sur chaque PR
- 🤖 **Types** : Auto-générés après chaque changement schema

### Exemples Anti-Hallucination

**❌ Tables à NE JAMAIS créer** :

| ❌ NE PAS Créer | ✅ Utiliser À La Place |
|-----------------|------------------------|
| `suppliers` | `organisations WHERE type='supplier'` |
| `customers` | `organisations WHERE type='customer'` + `individual_customers` |
| `products_pricing` | `price_list_items` + `calculate_product_price_v2()` |

**❌ Colonnes à NE JAMAIS ajouter** :

| ❌ NE PAS Ajouter | ✅ Utiliser À La Place |
|-------------------|------------------------|
| `products.cost_price` | `price_list_items.cost_price` |
| `products.primary_image_url` | `product_images WHERE is_primary=true` (LEFT JOIN) |

---

## ⚙️ CI/CD RULES

### Intégration Continue (CI)

**Exécution automatique sur chaque PR** :

1. ✅ **Lint & Format** : ESLint + Prettier (refus si non conforme)
2. ✅ **Tests unitaires** : Vitest (coverage > 80% pour nouveaux modules)
3. ✅ **Audit code** : jscpd, madge, knip (voir Scripts d'Audit)
4. ✅ **Zero Console Error** : Playwright browser console check
5. ✅ **Types** : TypeScript compilation sans erreurs
6. ✅ **Build** : Next.js build réussi

**Aucune PR ne peut être mergée si CI échoue.**

### Déploiement Continu (CD)

**Stratégie actuelle (Phase 1)** :

```
main branch → Vercel auto-deploy production
feature/* → Vercel preview deploy (URL unique par PR)
```

**Stratégie future (Phase 2 - Monorepo)** :

```bash
# Utiliser Nx ou Turborepo pour builds sélectifs
nx affected:build --base=main
nx affected:test --base=main
nx affected:deploy --base=main
```

**Feature Flags** :

```typescript
// .env.local ou .env.production
FEATURE_NEW_INVOICING=true
FEATURE_ADVANCED_ANALYTICS=false

// Usage dans le code
import { env } from '@/lib/env'

if (env.FEATURE_NEW_INVOICING) {
  // Nouveau code
} else {
  // Ancien code (fallback)
}
```

**Rollback testés** :

- Chaque migration DB doit avoir un script `down` documenté
- Déploiements Vercel : Rollback instantané via dashboard
- Feature flags : Désactivation sans redéploiement

**Backups automatiques** :

- Base de données : Backup quotidien Supabase (automatique)
- Backup manuel avant migration critique (procédure docs/ci-cd/rollback-procedures.md)

---

## 🚀 DÉPLOIEMENT

### Workflow GitHub

```bash
main                    # Production (protected)
├── feature/nom        # Feature branches
└── hotfix/critical    # Emergency fixes

# Règles branches protégées (main) :
- Require PR reviews (1 minimum)
- Require status checks (CI green)
- No force push
- No direct commits
```

### Pull Requests (PR)

**Template obligatoire** : `.github/PULL_REQUEST_TEMPLATE.md`

**PR doit inclure** :

1. **Contexte** : Pourquoi ce changement ?
2. **Description** : Quoi exactement ?
3. **Tests** : Comment validé ?
4. **Risques** : Impacts potentiels ?
5. **Rollback** : Procédure retour arrière si problème
6. **Screenshots** : Si changement UI
7. **Console check** : Capture Playwright console clean

**PR atomiques** : 1 PR = 1 fonctionnalité cohérente (éviter mega-PRs)

### Feature Flags

**Approche simple** : Variables d'environnement

```bash
# .env.local
FEATURE_NEW_DASHBOARD=true
FEATURE_BETA_SEARCH=false

# Vercel Environment Variables
# Production : FEATURE_NEW_DASHBOARD=true
# Staging : FEATURE_BETA_SEARCH=true
```

**Utilisation** :

```typescript
// src/lib/feature-flags.ts
export const featureFlags = {
  newDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true',
  betaSearch: process.env.FEATURE_BETA_SEARCH === 'true',
} as const

// Dans composants
import { featureFlags } from '@/lib/feature-flags'

export default function Dashboard() {
  return featureFlags.newDashboard ? <NewDashboard /> : <OldDashboard />
}
```

### Déploiement progressif (Dark Launch)

1. **Phase 1** : Feature flag OFF, code déployé en prod (inactif)
2. **Phase 2** : Activation staging uniquement
3. **Phase 3** : Activation 10% users production (A/B testing)
4. **Phase 4** : Rollout 100% si metrics OK
5. **Phase 5** : Suppression ancien code + feature flag

---

## 🚨 RÈGLES BUSINESS CRITIQUES

### Console Error Protocol

```typescript
// Zero tolerance : 1 erreur console = échec
1. MCP Browser navigate avant validation
2. Check console messages (errors, warnings critiques)
3. Screenshot comme preuve
4. Fix ALL errors before success
```

**Aucune exception**. Les erreurs console masquent des bugs critiques.

### Validation Input (Backend)

```typescript
// TOUJOURS valider inputs avec Zod
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  price: z.number().positive(),
  supplier_id: z.string().uuid(),
})

// Utilisation
export async function createProduct(input: unknown) {
  const validated = createProductSchema.parse(input) // Throw si invalide
  // ... logique métier
}
```

### Tests obligatoires

**Tout nouveau composant/API doit avoir** :

- ✅ Tests unitaires (Vitest) : Logique métier, edge cases
- ✅ Storybook story (si composant UI)
- ✅ Console check (Playwright) : Zero errors

**Exemple test unitaire** :

```typescript
// src/lib/calculate-margin.test.ts
import { describe, it, expect } from 'vitest'
import { calculateMargin } from './calculate-margin'

describe('calculateMargin', () => {
  it('calcule marge correctement', () => {
    expect(calculateMargin(100, 80)).toBe(20)
  })

  it('gère division par zéro', () => {
    expect(calculateMargin(100, 0)).toBe(100)
  })
})
```

---

## 🔒 PROTECTED FILES

**Fichier de configuration** : `PROTECTED_FILES.json` (racine)

### Fichiers/dossiers INTERDITS de modification directe

```json
{
  "protected": [
    "docs/auth/**",
    "docs/metrics/**",
    "docs/database/triggers.md",
    "docs/workflows/owner-daily-workflow.md",
    "docs/workflows/admin-daily-workflow.md",
    "supabase/migrations/*.sql",
    ".env.local",
    "CLAUDE.md",
    "PROTECTED_FILES.json"
  ],
  "requiresReview": [
    "src/lib/supabase/**",
    "src/hooks/use-*.ts",
    "packages/kpi/**",
    ".github/workflows/**"
  ]
}
```

### CODEOWNERS

```
# .github/CODEOWNERS
/docs/auth/                    @owner
/docs/metrics/                 @owner
/supabase/migrations/          @owner @tech-lead
PROTECTED_FILES.json           @owner
CLAUDE.md                      @owner
```

**Modification fichiers protégés** :

1. Demander confirmation utilisateur EXPLICITE
2. Justification détaillée dans PR
3. Revue obligatoire owner/tech-lead
4. Backup avant modification critique

---

## 🏗️ MONOREPO (ROADMAP)

### Quand migrer ?

**Après Phase 1 - Critères** :

- ✅ Phase 1 déployée en production stable
- ✅ Tous modules core validés (auth, catalogue, commandes, stock)
- ✅ Storybook complet avec tous composants documentés
- ✅ KPI centralisés en YAML
- ✅ Zéro erreur console sur tous workflows

### Pourquoi monorepo ?

- **Partage code** : Packages communs (ui, types, kpi, config)
- **Build optimisé** : Nx/Turborepo - Build uniquement code modifié
- **Versioning cohérent** : Toutes dépendances alignées
- **DX améliorée** : Générateurs de code, scripts communs
- **Scalabilité** : Ajouter apps/services facilement

### Architecture cible

```
apps/
  ├── api/          # Backend NestJS
  │   ├── src/
  │   │   ├── modules/
  │   │   │   ├── auth/
  │   │   │   ├── catalogue/
  │   │   │   ├── orders/
  │   │   │   └── stock/
  │   │   └── database/
  │   └── package.json
  └── web/          # Frontend Next.js
      ├── app/
      ├── components/
      └── package.json

packages/
  ├── ui/           # Design system Storybook
  ├── kpi/          # KPI YAML + hooks
  ├── types/        # DTO communs API ↔ Web
  ├── config/       # ESLint, Prettier, TS
  └── utils/        # Helpers communs

tools/
  ├── scripts/      # Audit, migration, seeds
  └── generators/   # Plop templates

docs/             # Documentation (inchangée)
supabase/         # Migrations DB (inchangée)
```

### Outils monorepo

**Choix recommandé** : Turborepo (simple, performant)

**Alternative** : Nx (plus features, plus complexe)

### Migration progressive

**Pas de big bang** :

1. **Étape 1** : Créer structure monorepo vide
2. **Étape 2** : Migrer `packages/ui` (composants + Storybook)
3. **Étape 3** : Migrer `packages/types`
4. **Étape 4** : Créer `apps/web` (Next.js existant)
5. **Étape 5** : Créer `apps/api` (nouveau NestJS)
6. **Étape 6** : Migrer API Routes Next.js → NestJS endpoints (module par module)
7. **Étape 7** : Cleanup ancien code

**Plan détaillé** : `docs/monorepo/migration-plan.md`

---

## 📚 DOCUMENTATION STRUCTURE

**Source de vérité** : `/docs/` (consolidée 2025-10-16)

```
docs/
├── README.md                # Index principal navigation
├── auth/                    # Rôles, Permissions, RLS
├── metrics/                 # Métriques & Analytics
├── database/                # Database Architecture
├── workflows/               # Business Workflows
├── api/                     # API Reference
├── guides/                  # Guides Pratiques
├── architecture/            # Architecture Système
├── ci-cd/                   # Déploiement, rollback
├── monorepo/                # Migration monorepo
└── troubleshooting/         # Dépannage
```

**Règles documentation** :

- Naming : `kebab-case.md`
- Profondeur : Max 2 niveaux
- README obligatoire par section
- Templates : `docs/.templates/`

**Modifications documentation** :

- ✅ Ajout nouveaux modules Phase 2+
- ✅ Corrections erreurs factuelles (après validation)
- ✅ Mise à jour versions
- ❌ Modification fichiers protégés sans autorisation (voir PROTECTED_FILES)

---

## ⚡ COMMANDES ESSENTIELLES

### Développement

```bash
npm run dev              # Next.js dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # TypeScript check
npm run test             # Vitest tests
npm run storybook        # Storybook UI (http://localhost:6006)
```

### Audit

```bash
npm run audit:all        # Tous audits (duplicates, cycles, deadcode, spelling)
npm run audit:duplicates # jscpd
npm run audit:cycles     # madge
npm run audit:deadcode   # knip
npm run audit:spelling   # cspell
```

### Custom Commands (.claude/commands/)

```bash
/feature-start <name>    # Démarrer feature
/error-check             # Console checking
/test-critical           # Tests essentiels
/context-update          # Update manifests
```

### Database

```bash
# Migrations Supabase
supabase db push         # Appliquer migrations
supabase db reset        # Reset DB (dev uniquement !)
supabase gen types typescript --local > src/types/supabase.ts
```

---

## 🎯 SUCCESS METRICS

### Performance Targets (SLOs)

- Dashboard : <2s
- Catalogue : <3s
- Feeds Google Merchant : <10s
- PDF generation : <5s

### Code Quality

- ✅ Zero console errors (tolérance zéro)
- ✅ Test coverage > 80% (nouveaux modules)
- ✅ Duplication code < 5%
- ✅ Zero cycles dépendances
- ✅ Tous composants Storybook documentés

### Development Efficiency

- **-80% temps tests** (50 tests ciblés vs 677 exhaustifs)
- **+300% vitesse dev** (agents MCP systématiques)
- **0 erreur console** (checking automatisé)
- **10x vitesse déploiement** (GitHub Flow simple)

---

## 🏆 RÉVOLUTION 2025

- ❌ 677 tests exhaustifs → ✅ 50 tests ciblés
- ❌ Dev manuel → ✅ Agent orchestration (Serena, Playwright, Context7)
- ❌ GitFlow complexe → ✅ GitHub Flow simple
- ❌ Console errors ignorées → ✅ Zero tolerance
- ❌ Composants dupliqués → ✅ Storybook centralisé
- ❌ KPI non documentés → ✅ YAML structuré + tests
- ❌ Monorepo bloquant → ✅ Migration progressive

---

**Vérone Back Office 2025 - Professional AI-Assisted Development**

*Dernière mise à jour : 2025-10-21*
*Mainteneur : Romeo Dos Santos*
*Version : 2.0.0*
