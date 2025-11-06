# 🚀 Vérone Back Office - Claude Code 2025

**CRM/ERP modulaire** pour décoration et mobilier d'intérieur haut de gamme
**Stack** : Next.js 15 (App Router) + Supabase + shadcn/ui

---

## 🎯 ÉTAT ACTUEL DU PROJET

**Date** : 2025-11-06
**État** : Développement continu - Tous modules actifs

### ✅ Modules Fonctionnels

- Authentification + Dashboard + Admin
- Organisations & Contacts
- Produits (Catalogue + Sourcing)
- Stocks (finalisation ajustements en cours)

### 🚧 En Développement Actif

- **Commandes** (travail actuel - clients + fournisseurs)
- **Consultations** (à développer ensuite)

### 🎯 Objectif Court Terme

**Préparation Écosystème Multi-Apps** :
1. Finaliser Commandes + Consultations
2. Migration monorepo (Turborepo)
3. Déploiement site ecommerce (vitrine produits)
4. Interface commissions affiliés (futur)

**Vision Architecture** :
```
packages/
├── apps/
│   ├── backoffice/      # Gestion interne (actuel)
│   ├── ecommerce/       # Site clients (priorité)
│   └── commissions/     # Affiliés (futur)
└── shared/
    └── modules/
        ├── products/    # Réutilisé dans les 3 apps
        ├── stock/       # Réutilisé dans les 3 apps
        └── orders/      # Réutilisé dans les 3 apps
```

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

## 🚀 WORKFLOW UNIVERSEL 2025

**Philosophy Core** : Think → Test → Code → Re-test

**Applicable à** : Formulaires, Pages, Composants, Boutons, Hooks, Business Logic, Database, API

---

### 🧠 PHASE 1 : THINK (Analyse & Planification)

**Durée** : 5-15 minutes | **Objectif** : Comprendre COMPLÈTEMENT avant de coder

**Actions Obligatoires** :

```typescript
// 1. Sequential Thinking (si tâche >3 étapes)
mcp__sequential - thinking__sequentialthinking;

// 2. Analyse Code Existant (Serena - MANDATORY)
mcp__serena__read_memory('context-previous');
mcp__serena__get_symbols_overview(targetFile); // TOUJOURS en premier
mcp__serena__find_referencing_symbols(symbol); // Impact analysis

// 3. Documentation Officielle (Context7)
mcp__context7__get - library - docs({ library: 'next.js', topic: '...' });

// 4. Database Schema (si modification data)
Read('docs/database/SCHEMA-REFERENCE.md');

// 5. Business Rules (si logique métier)
Read('docs/business-rules/[module]/');
```

**Checklist** :

- [ ] Sequential Thinking exécuté (si >3 étapes)
- [ ] Serena `get_symbols_overview` sur fichiers impactés
- [ ] Context7 consulté pour patterns framework
- [ ] Documentation database lue (si applicable)
- [ ] Business rules vérifiées (si applicable)
- [ ] Edge cases identifiés (minimum 3)
- [ ] Plan technique rédigé

---

### 🧪 PHASE 2 : TEST (Validation Hypothèses)

**Durée** : 5-10 minutes | **Objectif** : Tester environnement actuel AVANT modifier

**Actions Obligatoires** :

```typescript
// 1. Console Error Checking (RÈGLE SACRÉE)
mcp__playwright__browser_navigate("http://localhost:3000/page")
mcp__playwright__browser_console_messages()
// Si erreurs → STOP complet

// 2. Test Fonctionnel Existant
mcp__playwright__browser_click("[data-testid='button']")
mcp__playwright__browser_take_screenshot("before-changes.png")

// 3. Database Validation (si applicable)
mcp__supabase__execute_sql("SELECT * FROM table LIMIT 1")
mcp__supabase__get_advisors("security")

// 4. Build Validation
npm run build  // Doit passer SANS erreurs
```

**Checklist** :

- [ ] Console = 0 errors sur page cible
- [ ] Feature existante fonctionne (si modification)
- [ ] Build passe sans erreurs
- [ ] Screenshot "before" capturé
- [ ] Performance baseline mesurée

---

### ⚙️ PHASE 3 : CODE (Implémentation)

**Durée** : 20-40 minutes | **Objectif** : Code MINIMAL avec Serena

**Actions Obligatoires** :

```typescript
// 1. Édition Symbolique Précise (Serena - MANDATORY)
mcp__serena__replace_symbol_body({
  symbol_name: "MyComponent",
  new_body: `// Implementation`
})

// 2. Database Migration (si applicable)
// Fichier: supabase/migrations/YYYYMMDD_NNN_description.sql
CREATE TABLE IF NOT EXISTS new_table (...);  // Idempotent

// 3. TypeScript Types Update
mcp__supabase__generate_typescript_types()
```

**Checklist** :

- [ ] Code minimal fonctionnel
- [ ] Serena utilisé pour toutes modifications
- [ ] Types TypeScript stricts (pas de `any`)
- [ ] Migration SQL idempotente (si DB)
- [ ] Commentaires business logic ajoutés
- [ ] Pas de secrets/credentials

---

### 🔄 PHASE 4 : RE-TEST (Validation Finale)

**Durée** : 10-20 minutes | **Objectif** : Validation COMPLÈTE sans régression

**Actions Obligatoires (ORDRE STRICT)** :

```typescript
// 1. Type Check
npm run type-check  // = 0 erreurs

// 2. Build Validation
npm run build  // Doit passer

// 3. Console Error Checking (RÈGLE SACRÉE)
// RÈGLE ABSOLUE: 1 erreur = ÉCHEC COMPLET
mcp__playwright__browser_navigate("/feature-modifiée")
mcp__playwright__browser_console_messages()

// 4. Test Fonctionnel Workflow Complet
mcp__playwright__browser_click("[data-testid='submit']")
mcp__playwright__browser_take_screenshot("after-changes.png")

// 5. Database Validation (si applicable)
mcp__supabase__execute_sql("SELECT * FROM new_table")
mcp__supabase__get_advisors("performance")
```

**Checklist** :

- [ ] Type check = 0 erreurs
- [ ] Build successful
- [ ] Console = 0 errors (TOUTES pages impactées)
- [ ] Feature fonctionne (workflow complet)
- [ ] Screenshot "after" capturé
- [ ] Database constraints validées (si applicable)
- [ ] Performance SLO respectés (<2s dashboard, <3s pages)
- [ ] Aucune régression détectée

**Si Erreur Détectée** → STOP IMMÉDIAT → Retour PHASE 3 → Fix ALL → Re-test

---

### 📝 PHASE 5 : DOCUMENT (Préservation Context)

**Durée** : 5 minutes | **Objectif** : Sauvegarder décisions pour sessions futures

**Actions Obligatoires** :

```typescript
// 1. Serena Memory
mcp__serena__write_memory({
  key: 'feature-[nom]',
  content: `
    ## Décisions Architecturales
    - [décision 1]

    ## Edge Cases Résolus
    - [edge case 1]

    ## Learnings
    - [learning 1]
  `,
});

// 2. Update Documentation (si applicable)
Write('docs/business-rules/[module]/[feature].md');
Update('docs/database/SCHEMA-REFERENCE.md');
```

**Checklist** :

- [ ] Serena memory écrite avec décisions clés
- [ ] Documentation business rules mise à jour (si applicable)
- [ ] SCHEMA-REFERENCE.md mis à jour (si DB modifiée)

---

### 🚀 PHASE 6 : COMMIT & DEPLOY (Autorisation Obligatoire)

**Durée** : 2 minutes | **RÈGLE ABSOLUE** : JAMAIS sans autorisation EXPLICITE

**Workflow Obligatoire** :

```typescript
// 1. ✅ Préparation
git status && git diff

// 2. ⏸️ STOP - DEMANDER AUTORISATION
"Voulez-vous que je commit et push maintenant ?"
// ATTENDRE réponse EXPLICITE

// 3. ✅ Si "OUI" → Commit structuré
git add [files]
git commit -m "$(cat <<'EOF'
feat(module): Description concise

- Detail 1
- Detail 2

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

// 4. ✅ Push
git push origin [branch]
```

**Checklist** :

- [ ] Autorisation utilisateur obtenue EXPLICITEMENT
- [ ] Commit message structuré avec émoji
- [ ] Tests passés (console = 0 errors)
- [ ] Build successful

---

## 🚨 RÈGLES D'OR (À MÉMORISER)

1. **Documentation First** : TOUJOURS consulter documentation AVANT toute modification
2. **Console Zero Tolerance** : 1 erreur console = ÉCHEC COMPLET, retour PHASE 3
3. **Serena Before Code** : TOUJOURS `get_symbols_overview` AVANT modifier fichier
4. **Test Before Code** : TOUJOURS valider que existant fonctionne AVANT modifier
5. **Build Always** : TOUJOURS vérifier build passe AVANT et APRÈS modifications
6. **Authorization Always** : JAMAIS commit sans autorisation EXPLICITE utilisateur

---

## 📋 CHECKLIST UNIVERSELLE (Pour TOUT type de feature)

### AVANT DE COMMENCER

- [ ] Objective clairement défini
- [ ] Complexité évaluée (simple/moyen/complexe)
- [ ] Durée estimée (<1h / 1-3h / >3h)

### PHASE 1: THINK ✅

- [ ] Sequential Thinking (si >3 étapes)
- [ ] Serena get_symbols_overview
- [ ] Context7 documentation
- [ ] Edge cases identifiés (min 3)
- [ ] Plan technique rédigé

### PHASE 2: TEST ✅

- [ ] Console = 0 errors
- [ ] Build passe
- [ ] Screenshot "before"

### PHASE 3: CODE ✅

- [ ] Serena symbolic editing
- [ ] Types TypeScript stricts
- [ ] Code minimal

### PHASE 4: RE-TEST ✅

- [ ] Type check = 0 errors
- [ ] Build successful
- [ ] Console = 0 errors (TOUTES pages)
- [ ] Feature fonctionne
- [ ] Screenshot "after"
- [ ] Aucune régression

### PHASE 5: DOCUMENT ✅

- [ ] Serena memory écrite
- [ ] Documentation à jour

### PHASE 6: COMMIT ✅

- [ ] Autorisation obtenue EXPLICITEMENT
- [ ] Commit structuré
- [ ] Push effectué

---

**Exemples détaillés** : Voir `.claude/workflows/universal-workflow-examples.md`
**Checklist rapide** : Voir `.claude/workflows/universal-workflow-checklist.md`

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

### Branch Strategy (Production)

**Configuration actuelle** :

```typescript
// Branches principales
production-stable  → Production Vercel (auto-deploy)
main              → Staging/Development (tests)

// Workflow déploiement
1. Développement → Commit sur feature/* ou main
2. Tests validation → PR validation (15min)
3. Merge main → Tests staging
4. Validation staging → Merge main → production-stable
5. Auto-deploy production → Health checks automatiques
```

**Protection branches** :

- `production-stable` : Protected, require PR review
- `main` : Protected, require PR validation pass

**Hotfixes** :

- Si bug critique production → Cherry-pick fix sur `production-stable`
- Puis backport sur `main` pour sync

---

## 🚀 POST-PRODUCTION WORKFLOWS

**Contexte** : Phase post-déploiement avec données réelles.

**Objectif** : Corrections/features rapides SANS régression.

### Smoke Tests Post-Deployment (3min)

**Déclenchement** : Automatique après déploiement Vercel production.

**Tests critiques** :

```typescript
// 1. Health Check Endpoints
curl -f https://verone-v1.vercel.app/api/health || exit 1

// 2. Auth Flow Test
mcp__playwright__browser_navigate("https://verone-v1.vercel.app/login")
mcp__playwright__browser_console_messages()  // = 0 errors

// 3. Dashboard Load Test
mcp__playwright__browser_navigate("https://verone-v1.vercel.app/dashboard")
mcp__playwright__browser_console_messages()  // = 0 errors
mcp__playwright__browser_take_screenshot("smoke-dashboard.png")

// 4. Database Connection Test
PGPASSWORD="..." psql -h aws-1-eu-west-3.pooler.supabase.com \
  -c "SELECT 1 FROM users LIMIT 1"
```

**Workflow** :

1. Vercel deployment success → Trigger smoke tests
2. Wait 30s (stabilisation)
3. Execute 4 tests critiques
4. Si ÉCHEC → Auto-rollback + Alert
5. Si SUCCESS → Monitor 24h

**Implémentation future** : `.github/workflows/post-deploy-smoke-tests.yml`

### Health Checks + Auto-Rollback (30s)

**Protection production** : Rollback automatique si erreurs détectées.

**Checks executés** :

```typescript
// 1. Console Errors = 0 (RÈGLE SACRÉE)
mcp__playwright__browser_navigate("/dashboard")
const errors = await mcp__playwright__browser_console_messages()
if (errors.length > 0) → ROLLBACK

// 2. Performance SLOs respectés
const lcp = await measureLCP("/dashboard")
if (lcp > 2000ms) → WARNING (pas rollback immédiat)

// 3. Database queries OK
const dbHealth = await supabase.rpc('health_check')
if (!dbHealth) → ROLLBACK

// 4. Auth working
const authTest = await testLoginFlow()
if (!authTest) → ROLLBACK
```

**Rollback automatique** :

```bash
# Si health checks FAILED
vercel promote [previous-deployment-url] --token=$VERCEL_TOKEN

# Créer GitHub Issue automatique
gh issue create --title "🚨 AUTO-ROLLBACK: Health Checks Failed" \
  --label "critical,production" \
  --body "Deployment [sha] rolled back automatically..."
```

### Performance SLOs Tracking

**SLOs définis** :

- ✅ **Dashboard** : LCP <2s (Largest Contentful Paint)
- ✅ **Pages** : LCP <3s
- ✅ **Build** : <20s
- ✅ **API Response** : <500ms (p95)

**Monitoring continu** :

```typescript
// Vercel Analytics (actif)
import { Analytics } from '@vercel/analytics/react'

// Lighthouse CI (à implémenter)
// .lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    }
  }
}
```

**Alertes** :

- Régression >10% metrics → GitHub Issue automatique
- Console errors production → Slack alert immediate
- Performance SLO non respecté → Weekly report

### Canary Deployments (Progressive Rollout)

**Pattern** : Déployer code SANS activer feature (découplage deploy ≠ release).

**Implementation Feature Flags** :

```typescript
// .env.local / Vercel Environment Variables
NEXT_PUBLIC_FEATURE_NEW_DASHBOARD = false; // Production OFF
NEXT_PUBLIC_FEATURE_ROLLOUT_PERCENT = 0; // 0-100%

// src/lib/feature-flags.ts
export const featureFlags = {
  newDashboard: process.env.NEXT_PUBLIC_FEATURE_NEW_DASHBOARD === 'true',
  rolloutPercent: parseInt(
    process.env.NEXT_PUBLIC_FEATURE_ROLLOUT_PERCENT || '0'
  ),
};

// Usage avec distribution stable
export function shouldEnableFeature(userId: string): boolean {
  const rollout = featureFlags.rolloutPercent;
  if (rollout === 0) return false;
  if (rollout === 100) return true;

  // Hash stable basé userId
  const hash = hashString(userId) % 100;
  return hash < rollout;
}
```

**Workflow Canary** :

```typescript
1. Deploy code feature OFF (ROLLOUT=0)
   → 100% users version stable

2. Activate 10% users (ROLLOUT=10)
   → Monitor metrics 24h (errors, performance, engagement)

3. Si OK → Increase 50% (ROLLOUT=50)
   → Monitor 48h

4. Si OK → Rollout 100% (ROLLOUT=100)
   → Monitor 1 semaine

5. Cleanup feature flag (après 2 semaines validation)
   → Supprimer code conditionnel, garder seulement nouvelle version
```

**Kill-Switch** : Si problème détecté → `ROLLOUT=0` immédiat (pas besoin rollback deployment).

### Tests Ciblés Post-Production (20 critiques)

**Philosophy** : Tests rapides (5min) vs suite complète (45min).

**20 Tests Critiques** :

```typescript
// Auth (3 tests)
✅ Login flow
✅ Logout flow
✅ Protected routes redirect

// Dashboard (5 tests)
✅ KPIs load
✅ Charts render
✅ Recent activity
✅ Console = 0 errors
✅ Performance <2s

// Organisations (4 tests)
✅ List organisations
✅ Create organisation
✅ Edit organisation
✅ Search organisations

// Contacts (3 tests)
✅ List contacts
✅ Create contact
✅ Link contact → organisation

// Database (3 tests)
✅ Connection OK
✅ RLS policies enforced
✅ Triggers functional

// Build & Deploy (2 tests)
✅ Build success
✅ No TypeScript errors
```

**Exécution** :

```bash
# PR Validation (15min - 20 tests ciblés)
npm run test:critical

# Nightly (45min - 677 tests complets)
npm run test:all
```

---

## 🔧 TYPESCRIPT FIXES WORKFLOW - BEST PRACTICES 2025

**Approche Professionnelle** : Clustering + Batch Corrections par Famille

### Règles Absolues

**❌ INTERDIT :**

- Correction une par une sans plan
- Commits sans tests préalables
- Modifications sans classification famille

**✅ OBLIGATOIRE :**

- Export exhaustif erreurs : `npm run type-check 2>&1 > ts-errors-raw.log`
- Clustering automatique par famille
- Correction COMPLÈTE d'une famille avant passage suivante
- Tests MCP Browser AVANT chaque commit
- Fichier suivi : `TS_ERRORS_PLAN.md` à la racine

### Workflow Standard

```typescript
1. Export erreurs → ts-errors-raw.log
2. Clustering → error-clusters.json
3. Priorisation → TS_ERRORS_PLAN.md
4. Pour chaque famille :
   - Identifier pattern
   - Corriger TOUTE la famille
   - Tests (type-check + build + MCP Browser)
   - Commit structuré
   - Push
5. Répéter jusqu'à 0 erreurs
```

### Priorisation

- **P0 - BLOCKING** : Bloque build (0 actuellement)
- **P1 - CRITICAL** : Type safety critique (null/undefined, property missing core)
- **P2 - HIGH** : Type incompatibilities non-critiques
- **P3 - LOW** : Implicit any, warnings

### Commit Format

```
fix(types): [CODE-PATTERN] Description - X erreurs résolues (avant→après)

Famille : TS2322 - Null/Undefined incompatibility
Fichiers : 15 modifiés
Stratégie : Null coalescing operator (??)
Tests : ✅ MCP Browser 0 errors
Build : ✅ Success

Avant : 975 erreurs
Après : 825 erreurs
Delta : -150 erreurs
```

### Fichiers Clés

- `TS_ERRORS_PLAN.md` : Suivi progression par famille
- `ts-errors-raw.log` : Export brut erreurs TypeScript
- `error-clusters.json` : Clustering automatique
- `scripts/cluster-ts-errors.js` : Script clustering
- `TYPESCRIPT_FIXES_CHANGELOG.md` : Historique décisions

### Commandes Slash

- `/typescript-cluster` : Lance clustering erreurs
- `/typescript-fix <famille>` : Démarre correction famille
- `/typescript-status` : Affiche progression globale

---

## 🤖 MCP AGENTS - USAGE PRIORITAIRE

### Serena - Code Intelligence

```typescript
mcp__serena__get_symbols_overview; // Explorer fichier AVANT modification
mcp__serena__find_symbol; // Localiser symboles
mcp__serena__replace_symbol_body; // Édition précise
mcp__serena__search_for_pattern; // Recherche patterns
```

**Best practice** : TOUJOURS `get_symbols_overview` avant éditer fichier

### Supabase - Database

```typescript
// 🔑 Credentials : Read .env.local ligne 19
// Connection : aws-1-eu-west-3.pooler.supabase.com:5432

mcp__supabase__execute_sql; // Queries directes
mcp__supabase__get_advisors; // Sécurité/performance
mcp__supabase__generate_typescript_types; // Types après migrations
```

### Playwright - Browser Testing

```typescript
mcp__playwright__browser_navigate;
mcp__playwright__browser_console_messages;
mcp__playwright__browser_click;
mcp__playwright__browser_take_screenshot;
```

---

## 📖 CONTEXTES SPÉCIALISÉS

**Charger à la demande selon tâche** :

```typescript
// 🗄️ Travail database (migrations, schema, queries)
Read('.claude/contexts/database.md');

// 🚀 Déploiement (CI/CD, Vercel, rollback, PR)
Read('.claude/contexts/deployment.md');

// 📊 KPI (métriques, documentation YAML)
Read('.claude/contexts/kpi.md');

// 🎨 Design/UI (composants, Storybook, design V2)
Read('.claude/contexts/design-system.md');

// 🏗️ Monorepo (architecture, migration progressive)
Read('.claude/contexts/monorepo.md');
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
'docs/business-rules/05-pricing-tarification/discount-rules.md';

// Workflow commande→expédition → Transverse
'docs/business-rules/99-transverses/workflows/order-to-shipment.md';

// Pattern modal → UX
'docs/business-rules/98-ux-ui/modal-pattern.md';

// Règle stock minimum → Stocks/Alertes
'docs/business-rules/06-stocks/alertes/minimum-stock-rules.md';
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
const reportType = detectReportType(content);

// 2. Classification automatique
switch (reportType) {
  case 'audit-phase':
    path = `docs/audits/phases/phase-${phase}-${name}/`;
    break;
  case 'audit-monthly':
    path = `docs/audits/${YYYY - MM}/RAPPORT-${TYPE}-${DATE}.md`;
    break;
  case 'performance':
    path = `docs/metrics/performance-reports/`;
    break;
  case 'security':
    path = `docs/security/security-audits/`;
    break;
  case 'database':
    path = `docs/database/schema-reports/`;
    break;
  case 'business-rule':
    path = `docs/business-rules/${module}/`;
    break;
}

// 3. Créer fichier au bon endroit
await createReport(path, content);

// 4. Nettoyer racine projet
await cleanupProjectRoot();
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

**Version** : 3.2.0 (Post-Production Workflows + README Professionnel 2025)
**Dernière mise à jour** : 2025-10-30
**Mainteneur** : Romeo Dos Santos

**Changelog 3.2.0** :

- ✅ Section "POST-PRODUCTION WORKFLOWS" ajoutée (smoke tests, health checks, SLOs, canary deployments)
- ✅ Section "Branch Strategy" documentée (production-stable vs main)
- ✅ README.md professionnel créé (Quick start, Tech stack, Project status Phase 1→4)
- ✅ Tests ciblés post-production définis (20 critiques vs 677 complets)
- ✅ Performance SLOs tracking documenté (Lighthouse CI)
