# 🚀 Vérone Back Office - Claude Code 2025

**CRM/ERP modulaire** pour décoration et mobilier d'intérieur haut de gamme
**Stack** : Next.js 15 + Supabase + shadcn/ui

---

## 🇫🇷 LANGUE

**TOUJOURS communiquer en français** - Messages, docs, commentaires, erreurs

---

## 🧠 WORKFLOW 2025

**Plan-First → Agent Orchestration → Console Clean → Deploy**

### Phase 1: PLAN-FIRST
```typescript
// Tâches complexes (>3 étapes) → Sequential Thinking MANDATORY
mcp__sequential-thinking__sequentialthinking
```

### Phase 2: AGENT ORCHESTRATION
```typescript
Think: Sequential Thinking + Serena (symbols overview)
Research: Context7 (docs) + Serena (code analysis)
Implement: Serena (symbolic editing) + Supabase (validation)
Test: Playwright Browser (console) + Supabase (logs)
Deploy: GitHub (PR) + Vercel (auto)
Monitor: Sentry (issues) + Supabase (advisors)
```

### Phase 3: CONSOLE ERROR CHECKING (Règle Sacrée)
```typescript
// 🚫 INTERDIT: Scripts test (*.js, *.mjs, *.ts)
// ✅ OBLIGATOIRE: MCP Playwright Browser direct

1. mcp__playwright__browser_navigate(url)
2. mcp__playwright__browser_console_messages()
3. Si erreurs → STOP → Fix ALL → Re-test
4. mcp__playwright__browser_take_screenshot()
5. Zero tolerance: 1 erreur = échec complet
```

---

## 📁 FILE ORGANIZATION

**RÈGLE ABSOLUE** : JAMAIS créer fichiers MD à la racine (sauf README.md, CLAUDE.md)

### Dossiers Standards
```
docs/               # Guides, migrations, architecture, API
manifests/          # Business rules, PRDs, features
MEMORY-BANK/        # Sessions, context, learnings
TASKS/              # active, completed, testing
supabase/migrations/  # Database migrations
```

### Auto-Classification Patterns
```typescript
"migration" → docs/migrations/
"session" → MEMORY-BANK/sessions/
"RAPPORT-" → MEMORY-BANK/sessions/
"business rule" → manifests/business-rules/
"PRD:" → manifests/prd/
```

---

## 📚 DOCUMENTATION STRUCTURE

**Source de vérité unique** : `/docs/` (consolidée 2025-10-16)

### Structure docs/ (8 sections)
```
docs/
├── README.md                # Index principal navigation
├── auth/                    # Rôles, Permissions, RLS
│   ├── roles-permissions-matrix.md    # Matrice Owner/Admin
│   ├── rls-policies.md                # Policies Supabase SQL
│   ├── user-profiles.md               # Profils utilisateurs
│   └── authentication-flows.md        # Flows login/signup
├── metrics/                 # Métriques & Analytics
│   ├── dashboard-kpis.md              # 16 hooks documentés
│   ├── database-triggers.md           # 13 triggers automatiques
│   ├── calculations.md                # 21 formules mathématiques
│   └── components.md                  # Graphiques + KPI Cards
├── database/                # Database Architecture
│   ├── schema-overview.md
│   ├── triggers-hooks.md
│   ├── functions-rpc.md
│   └── migrations/
├── workflows/               # Business Workflows
│   ├── owner-daily-workflow.md
│   ├── admin-daily-workflow.md
│   ├── orders-lifecycle.md
│   ├── stock-movements.md
│   └── sourcing-validation.md
├── api/                     # API Reference
├── guides/                  # Guides Pratiques
├── architecture/            # Architecture Système
└── troubleshooting/         # Dépannage
```

### Best Practices Documentation
```typescript
// Naming: kebab-case
✅ roles-permissions-matrix.md
❌ RolesPermissions.md

// Profondeur: Max 2 niveaux
✅ docs/auth/rls-policies.md
❌ docs/auth/advanced/rls/policies.md

// README: Obligatoire par section
✅ docs/auth/README.md (navigation)
❌ docs/auth/ sans README

// Templates: Utiliser .templates/
docs/.templates/roles-permissions-matrix.md
docs/.templates/metric-documentation.md
docs/.templates/section-readme.md
```

### ⚠️ RÈGLES MODIFICATION DOCUMENTATION

**NE PLUS MODIFIER sans demande explicite** :
- `docs/auth/*` (rôles Owner/Admin figés Phase 1)
- `docs/metrics/*` (métriques Phase 1 complètes)
- `docs/database/triggers-hooks.md` (triggers validés)
- `docs/workflows/owner-daily-workflow.md` (workflow validé)
- `docs/workflows/admin-daily-workflow.md` (workflow validé)

**Modifications autorisées uniquement** :
- Ajout nouveaux modules Phase 2+ (catalogue, commandes, stocks)
- Corrections erreurs factuelles (après validation utilisateur)
- Mise à jour versions (dates, numéros version)
- Ajout liens vers nouvelle documentation

**Si doute** : Demander confirmation utilisateur AVANT modification

### Archive Documentation
```
archive/documentation-2025-10-16/
├── README.md                # Pourquoi archivé
├── roles-permissions-v1.md  # Ancienne spec (17 fichiers)
└── ... (fichiers consolidés dans docs/)
```

**Archive = Référence historique seulement**. Toujours privilégier `/docs/`.

---

## 🤖 AGENTS MCP - USAGE PRIORITAIRE

### Serena - Code Intelligence
```typescript
mcp__serena__get_symbols_overview   // Explorer fichier AVANT modification
mcp__serena__find_symbol            // Localiser symboles
mcp__serena__replace_symbol_body    // Édition précise
mcp__serena__write_memory           // Context persistant
```

### Supabase - Database
```typescript
// 🔑 CREDENTIALS: TOUJOURS lire depuis .env.local (ligne 19)
// Fichier: /Users/romeodossantos/verone-back-office-V1/.env.local
// Connection: aws-1-eu-west-3.pooler.supabase.com:5432
// Password: ADFVKDJCJDNC934

mcp__supabase__execute_sql          // Queries directes
mcp__supabase__get_advisors         // Sécurité/performance
mcp__supabase__generate_typescript_types  // Types après migrations

// Workflow automatisé:
1. Read .env.local pour DATABASE_URL
2. Essayer Session Pooler (5432) en priorité
3. Si échec → Direct Connection (6543)
4. JAMAIS demander credentials manuellement
```

### Playwright - Browser Testing
```typescript
// 🚫 INTERDIT: Créer scripts test
// ✅ OBLIGATOIRE: MCP Browser direct visible

mcp__playwright__browser_navigate
mcp__playwright__browser_console_messages
mcp__playwright__browser_click
mcp__playwright__browser_take_screenshot
mcp__playwright__browser_snapshot   // Accessibility
```

### Autres Agents
```typescript
mcp__context7__get-library-docs           // Docs officielles frameworks
mcp__sequential-thinking__sequentialthinking  // Architecture complexe
mcp__github__create_pull_request          // PR automatisées
mcp__sentry__get_recent_issues            // Monitoring production
```

---

## 🧪 STRATÉGIE TESTS

### Ancien Système ❌
- 677 tests exhaustifs (supprimé)
- Parser complexe (supprimé)
- Sync Supabase exhaustive (supprimée)

### Nouveau Système ✅
```typescript
// ~50 tests ciblés max (vs 677)
1. Console Error Checking (Playwright) - PRIORITÉ 1
2. Sentry MCP monitoring temps réel - PRIORITÉ 2
3. Tests manuels ciblés browser - PRIORITÉ 3
4. Accessibility snapshots - PRIORITÉ 4
```

---

## 🚨 RÈGLES BUSINESS CRITIQUES

### Console Error Protocol
```typescript
// Zero tolerance: 1 erreur console = échec
1. MCP Browser navigate avant validation
2. Check console messages
3. Screenshot comme preuve
4. Fix ALL errors before success
```

### Product Images Pattern (BR-TECH-002)
```typescript
// ✅ OBLIGATOIRE: Jointure product_images
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

// ❌ INTERDIT: products.primary_image_url (colonne supprimée)
```

### Design System Vérone V2 (2025)
```typescript
// Palette Moderne 2025 - Inspirée Odoo, Figma, Dribbble, shadcn/ui
--verone-primary: #3b86d1      /* Bleu professionnel */
--verone-success: #38ce3c      /* Vert validation */
--verone-warning: #ff9b3e      /* Orange attention */
--verone-accent: #844fc1       /* Violet créatif */
--verone-danger: #ff4d6b       /* Rouge critique */
--verone-neutral: #6c7293      /* Gris interface */

// 📁 Fichiers Design System V2:
// src/lib/design-system/       → Tokens, themes, utils
// src/lib/theme-v2.ts          → Thème complet avec gradients
// src/components/ui-v2/        → Composants modernes (Button, KPI Cards, etc.)

// ✅ Couleurs vives et gradients autorisés
// ✅ Tendances 2025: Rounded corners, micro-interactions, shadows élégantes
```

### Database Migrations Convention (Supabase)
```typescript
// 📁 EMPLACEMENT: supabase/migrations/
// 📝 NAMING OBLIGATOIRE: YYYYMMDD_NNN_description.sql

// ✅ EXEMPLES CORRECTS:
20251017_001_add_tax_rate_column.sql
20251017_002_create_invoices_rpc.sql
20251017_003_add_rls_policies_stock_movements.sql

// ❌ EXEMPLES INCORRECTS:
20251017_add_tax_rate.sql              // Manque _NNN_
add-tax-rate.sql                       // Pas de date
202510115_005_create_table.sql         // Date invalide (9 chiffres)
20251017-create-table.sql              // Séparateur incorrect

// 🔑 FORMAT DÉTAILLÉ:
// YYYYMMDD : Date création (ex: 20251017)
// NNN      : Numéro séquentiel du jour (001, 002, 003...)
// description : Description kebab-case (snake_case accepté)
// .sql     : Extension obligatoire

// 📋 RÈGLES:
// 1. TOUJOURS utiliser supabase/migrations/ (jamais docs/, scripts/, etc.)
// 2. Une migration = Un fichier SQL pur (pas de bash, python, etc.)
// 3. Idempotent (IF NOT EXISTS, IF EXISTS) quand possible
// 4. Commentaires explicatifs obligatoires
// 5. Archiver (pas supprimer) migrations obsolètes → archive/YYYY-MM-category/

// 📂 STRUCTURE:
supabase/migrations/
├── YYYYMMDD_NNN_*.sql    // Migrations actives
├── archive/              // Migrations archivées (référence historique)
│   ├── 2025-10-rollbacks/
│   ├── 2025-10-debug-iterations/
│   └── YYYY-phase-name/
└── README.md             // Documentation process

// ⚠️ ARCHIVAGE (Best Practices 2025):
// Archiver quand: Migration remplacée, rollback appliqué, iteration debug consolidée
// Ne JAMAIS delete migrations appliquées production (archive > delete)
```

---

## 🔄 GITHUB FLOW

```bash
main                    # Production deployable
├── feature/nom        # Feature branches
└── hotfix/critical    # Emergency fixes

# Workflow:
1. /feature-start → Branch + Sequential Planning
2. Code avec agents MCP
3. /error-check → Console 100% clean
4. /test-critical → Tests essentiels
5. GitHub PR + auto-deployment
6. /context-update → Update manifests/memory-bank
```

---

## ⚡ COMMANDES ESSENTIELLES

```bash
# Développement
npm run dev              # Next.js dev server
npm run build            # Production build

# Custom Commands (.claude/commands/)
/feature-start <name>    # Démarrer feature
/error-check             # Console checking
/test-critical           # Tests essentiels
/context-update          # Update manifests

# Vérifications
ls .claude/commands/     # Commandes disponibles
cat manifests/business-rules/WORKFLOWS.md
```

---

## 📁 REPOSITORY STRUCTURE

```
.claude/commands/        # Custom slash commands
src/                    # Next.js app
manifests/              # Business rules (auto-updated)
MEMORY-BANK/            # Context sessions
TASKS/                  # Task management
supabase/migrations/    # Database migrations
```

---

## 🎯 SUCCESS METRICS

### Performance Targets
- Dashboard <2s, Catalogue <3s, Feeds <10s, PDF <5s

### Development Efficiency
- **-80% temps tests** (50 vs 677)
- **+300% vitesse dev** (agents systématiques)
- **0 erreur console** (checking automatisé)
- **10x déploiement** (GitHub Flow simple)

---

## 🏆 RÉVOLUTION 2025

- ❌ 677 tests → ✅ 50 tests ciblés
- ❌ Dev manuel → ✅ Agent orchestration
- ❌ GitFlow complexe → ✅ GitHub Flow simple
- ❌ Console errors ignored → ✅ Zero tolerance

*Vérone Back Office 2025 - Professional AI-Assisted Development*
