# 🚀 Vérone Back Office - Claude Code 2025

**CRM/ERP modulaire** pour décoration et mobilier d'intérieur haut de gamme
**Stack** : Next.js 15 (App Router) + Supabase + shadcn/ui + Turborepo

---

## 🎯 PHASE ACTUELLE : PHASE 4 - MULTI-FRONTENDS TURBOREPO ✅ FINALISÉE

**Date** : 2025-11-19 (Finalisation Migration Turborepo ✅)
**État** : Production multi-frontends avec 25 packages partagés @verone/\* - Migration Turborepo COMPLÉTÉE (47/47 problèmes résolus)

### 🏗️ ARCHITECTURE TURBOREPO

**3 Applications Déployées** :

1. **back-office** (Port 3000) - CRM/ERP Complet
2. **site-internet** (Port 3001) - E-commerce Public
3. **linkme** (Port 3002) - Commissions Apporteurs

**25 Packages Partagés** (@verone/\*) :

- Design System : `@verone/ui` (54 composants)
- Business : `@verone/products`, `@verone/orders`, `@verone/stock`, `@verone/customers`
- Utils : `@verone/types`, `@verone/utils`, `@verone/testing`

**Chiffres Clés** :

- 🏗️ 25 packages partagés (Turborepo monorepo)
- 🎨 86 composants React documentés
- 📦 3 apps déployées
- 🗄️ 78 tables database
- 🔧 158 triggers automatiques
- 🛡️ 239 RLS policies sécurité

---

## 📂 RÈGLES CHEMINS TURBOREPO (CRITIQUE)

**RÈGLE ABSOLUE** : Depuis Phase 4, la structure est **TURBOREPO** avec 3 apps + 25 packages.

### ✅ Chemins CORRECTS

```typescript
// Applications
apps/back-office/src/app/          // Pages Next.js back-office
apps/back-office/src/components/   // Composants back-office
apps/site-internet/src/             // E-commerce public
apps/linkme/src/                    // Commissions vendeurs

// Packages
packages/@verone/ui/src/            // Design System
packages/@verone/products/src/      // Composants produits
packages/@verone/orders/src/        // Composants commandes
```

### ❌ Chemins OBSOLÈTES (N'EXISTENT PLUS)

```typescript
src/app/                  // ❌ N'existe plus depuis Phase 4
src/components/           // ❌ Utiliser apps/back-office/src/components/
src/shared/modules/       // ❌ Migré vers packages/@verone/*
```

### ✅ Imports Corrects

```typescript
// Composants UI
import { Button, Card } from '@verone/ui';

// Composants business
import { ProductCard, useProducts } from '@verone/products';
import { StockAlertCard } from '@verone/stock';

// Types & Utils
import type { Database } from '@verone/types';
import { cn, formatPrice } from '@verone/utils';
```

**Commande Supabase Types** :

```bash
# ✅ CORRECT (Phase 4)
supabase gen types typescript --local > apps/back-office/src/types/supabase.ts
```

---

## 📦 PACKAGES @VERONE/\* - WORKFLOW ANTI-HALLUCINATION

**RÈGLE ABSOLUE** : **TOUJOURS consulter le catalogue composants AVANT créer/utiliser composant**

### 🚨 WORKFLOW OBLIGATOIRE

```typescript
// ÉTAPE 1 : Consulter catalogue AVANT tout
Read('docs/architecture/COMPOSANTS-CATALOGUE.md');

// ÉTAPE 2 : Chercher composant existant
// Exemple : "afficher miniature produit" → ProductThumbnail

// ÉTAPE 3 : Vérifier props TypeScript EXACTES
interface ProductThumbnailProps {
  src: string | null | undefined;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

// ÉTAPE 4 : Utiliser composant avec props exactes
<ProductThumbnail
  src={product.primary_image_url}
  alt={product.name}
  size="md"
/>
```

### ⚠️ RÈGLES STRICTES

**❌ INTERDIT :**

- Créer composant SANS vérifier catalogue
- Inventer props inexistantes
- Dupliquer code UI déjà dans @verone/ui
- Oublier imports depuis packages

**✅ OBLIGATOIRE :**

- Lire `docs/architecture/COMPOSANTS-CATALOGUE.md` EN PREMIER
- Utiliser composants existants @verone/\* (86 composants)
- Respecter props TypeScript exactes
- Importer depuis packages : `import { X } from '@verone/[package]'`

### 📚 Composants Critiques

**ProductThumbnail** ⭐ (le plus oublié)

```typescript
import { ProductThumbnail } from '@verone/products';
<ProductThumbnail src={url} alt={name} size="md" />
```

**Autres essentiels** :

- `ButtonUnified` (@verone/ui) - Bouton avec loading
- `KpiCardUnified` (@verone/ui) - KPI avec tendance
- `Dialog` (@verone/ui) - Modal dialog
- `QuickPurchaseOrderModal` (@verone/orders) - Commande rapide
- `StockAlertCard` (@verone/stock) - Alerte stock

**Documentation** : `docs/architecture/COMPOSANTS-CATALOGUE.md` (1600 lignes)

---

## 🔄 WORKFLOW AUTONOME P.D.C.A. (OBLIGATOIRE - 2025 Standard)

**DÉFINITION** : Méthode de Deming (Plan-Do-Check-Act) adaptée aux agents IA. L'agent DOIT valider chaque étape avec **PREUVES TECHNIQUES** avant de passer à la suivante.

**RÈGLE ABSOLUE** : Tu es INTERDIT de dire "J'ai vérifié" sans fournir la **PREUVE TECHNIQUE** (logs MCP ou npm) dans ta réponse.

### 📋 PHASE 1 : PLAN (Analyse & Stratégie)

_Avant de toucher au code de production._

**Actions obligatoires** :

1. **Audit existant** : Lire les fichiers concernés (`apps/`, `packages/@verone/`)
2. **Comprendre le contexte** : Consulter documentation si nécessaire
3. **Proposer stratégie** : Expliquer l'approche technique au user
4. **Capturer état initial** (si applicable) :

```typescript
mcp__playwright__browser_navigate('http://localhost:3000/[page]');
mcp__playwright__browser_console_messages();
```

**Livrable PLAN** : Description claire du problème + approche proposée + état initial capturé

### ⚙️ PHASE 2 : DO (Implémentation)

_Exécution de la solution._

**Actions obligatoires** :

1. Code MINIMAL pour résoudre le problème identifié
2. Types TypeScript stricts (jamais de `any`)
3. Respecter architecture Turborepo (@verone/\*)
4. Migration SQL idempotente si DB (APRÈS avoir testé le code)

**Livrable DO** : Code modifié/créé

### 🕵️ PHASE 3 : CHECK (Vérification & Contrôle)

_Le moment de vérité - PREUVES OBLIGATOIRES._

**Actions obligatoires** :

1. **Console check** :

```typescript
mcp__playwright__browser_navigate('http://localhost:3000/[page]');
mcp__playwright__browser_console_messages();
```

→ **AFFICHER LE RÉSULTAT** dans la réponse

2. **Type check** :

```bash
npm run type-check
```

→ **AFFICHER LE RÉSULTAT** (doit être 0 erreurs)

3. **Build check** :

```bash
npm run build
```

→ **AFFICHER "Build succeeded"** ou l'erreur

**Livrable CHECK** : Logs prouvant console=0 errors + build=passé

### 🚀 PHASE 4 : ACT (Ajustement ou Validation)

_Décision autonome basée sur CHECK._

**Si CHECK = KO (Échec)** :

- 🛑 **STOP** : Ne PAS demander de commit
- 🔄 **BOUCLE RÉFLEXION** :
  1. Analyser l'erreur
  2. Corriger le code (retour à DO)
  3. Re-vérifier (retour à CHECK)
- ⚠️ L'agent DOIT itérer seul **au moins 2 fois** avant de demander de l'aide
- **Preuve** : Afficher chaque tentative et son résultat

**Si CHECK = OK (Succès)** :

- 💾 **Finalisation** : Créer migrations DB définitives (si nécessaire)
- 🧹 **Nettoyage** : Supprimer fichiers temporaires
- ✅ **Résumé** : Présenter au user :

```
✅ PDCA COMPLET

📋 PLAN : [description du problème]
⚙️ DO : [fichiers modifiés]
🕵️ CHECK :
   - Console errors : 0 (log ci-dessus)
   - Type-check : PASSÉ
   - Build : PASSÉ

Voulez-vous que je commit et push maintenant ?
```

- ⏸️ **ATTENDRE** réponse EXPLICITE avant commit

---

### 📊 Checklist Preuves Techniques (CHAQUE Tâche)

| Phase | Preuve Requise       | Commande                     |
| ----- | -------------------- | ---------------------------- |
| PLAN  | État initial capturé | `browser_console_messages()` |
| CHECK | Console = 0 errors   | `browser_console_messages()` |
| CHECK | Types valides        | `npm run type-check`         |
| CHECK | Build passé          | `npm run build`              |

### ⚠️ Comportements INTERDITS

- ❌ Dire "J'ai vérifié" sans log dans la réponse
- ❌ Passer à ACT(commit) si CHECK a des erreurs
- ❌ Ignorer les erreurs console "non-bloquantes"
- ❌ Créer migration DB sans avoir testé le code d'abord
- ❌ Supposer que "ça devrait marcher" sans preuve
- ❌ Demander de l'aide avant d'avoir itéré 2 fois en boucle CHECK→DO

### 🔄 Exemple de Boucle Réflexion

```
[CHECK #1] Console: 1 error "Cannot read property 'x' of undefined"
→ Analyse : Variable non initialisée ligne 42
→ [DO] Correction : Ajout de vérification null
→ [CHECK #2] Console: 0 errors, Type-check: OK, Build: OK
→ [ACT] Succès ! Présenter résumé au user.
```

---

## 🚨 RÈGLES D'OR

1. **Documentation First** : TOUJOURS consulter documentation AVANT modifier
2. **Console Zero Tolerance** : 1 erreur console = ÉCHEC COMPLET
3. **Test Before Code** : TOUJOURS valider que existant fonctionne AVANT modifier
4. **Build Always** : TOUJOURS vérifier build passe AVANT et APRÈS modifications
5. **Authorization Always** : JAMAIS commit sans autorisation EXPLICITE
6. **Anti-Hallucination** : JAMAIS inventer, TOUJOURS vérifier Git history
7. **Catalogue First** : TOUJOURS consulter catalogue composants AVANT créer
8. **🚫 INTERDICTION ABSOLUE DONNÉES TEST** : JAMAIS ajouter/créer données test, seed, ou mock dans la base de données de production SANS autorisation EXPLICITE utilisateur. Base de données DOIT rester vide sauf si utilisateur demande explicitement de créer des données.
9. **🧠 Expert Advisor - Solution Simple First** : TOUJOURS proposer la solution la plus simple EN PREMIER. Avant de coder une nouvelle fonctionnalité, vérifier si l'existant peut être réutilisé avec un simple changement (label, condition, etc.). Si l'utilisateur propose une solution complexe, CHALLENGER et proposer l'alternative simple. Poser la question : "Peut-on faire plus simple avec ce qui existe déjà ?"

### 🛡️ Workflow Anti-Hallucination

```typescript
// AVANT toute modification code existant
git log --since="[date]" --oneline -- [file-path]
git show [commit-sha]:[file-path]
git diff [commit-sha] HEAD -- [file-path]

// Si fonctionnait avant :
// ✅ Chercher comment c'était codé dans Git
// ✅ Restaurer le code fonctionnel
// ✅ Appliquer SEULEMENT les corrections demandées
// ❌ NE JAMAIS inventer nouvelle implémentation
```

---

## 🔧 STACK TECHNIQUE

```typescript
Frontend  : Next.js 15 (App Router, RSC, Server Actions)
UI        : shadcn/ui + Radix UI + Tailwind CSS
Database  : Supabase (PostgreSQL + Auth + RLS)
Validation: Zod + React Hook Form
Testing   : Vitest + Playwright + Storybook
Monorepo  : Turborepo v2.6.0 + pnpm workspaces
Deploy    : Vercel (auto-deploy production-stable)
```

### ⚡ Commandes Essentielles

```bash
# Développement
npm run dev              # Next.js dev (localhost:3000)
npm run build            # Production build (ESLint + TypeScript)
npm run type-check       # TypeScript validation

# Formatage & Linting
npm run format           # Prettier : formater code
npm run lint             # ESLint strict
npm run lint:fix         # Auto-fix erreurs

# Validation
npm run validate:all     # type-check + validations

# Database
supabase db push         # Appliquer migrations
supabase gen types typescript --local > apps/back-office/src/types/supabase.ts
```

---

## 🔌 CONFIGURATION MCP (Model Context Protocol)

**Fichiers critiques** :

- `.claude/settings.json` - Permissions, hooks, projet, MCP servers
- `.serena/project.yml` - Serena language server (TypeScript)
- `.serena/memories/` - Mémoires Serena (39 fichiers)

### 📂 Chemins Autorisés (settings.json)

**✅ TURBOREPO PHASE 4** (Permissions Write, Edit, MultiEdit) :

```json
"Write(/Users/romeodossantos/verone-back-office-V1/apps/**)"
"Write(/Users/romeodossantos/verone-back-office-V1/packages/**)"
"Write(/Users/romeodossantos/verone-back-office-V1/docs/**)"
"Write(/Users/romeodossantos/verone-back-office-V1/supabase/**)"
"Edit(/Users/romeodossantos/verone-back-office-V1/apps/**)"
"Edit(/Users/romeodossantos/verone-back-office-V1/packages/**)"
```

**❌ OBSOLÈTE (Phase 1-3 - SUPPRIMÉ)** :

```json
"Write(/Users/romeodossantos/verone-back-office-V1/src/**)" // ❌ Dossier n'existe plus
```

### 🧠 Mémoires Serena Actualisées (2025-11-20)

**Mémoires Phase 4 Turborepo** (références correctes) :

- ✅ `turborepo-paths-reference-2025-11-20.md` - Source de vérité chemins
- ✅ `auth-multi-canal-phase1-phase2-complete-2025-11-19.md`
- ✅ `purchase-orders-validated-workflow-2025-11-19.md`
- ✅ `project_overview.md`

**Mémoires obsolètes SUPPRIMÉES** (2025-11-20) :

- ❌ `verone-design-system-v2-2025.md` (chemins Phase 1-3)
- ❌ `refonte-ux-statuts-compacts-2025-11-05.md`
- ❌ `stock-movement-traceability-implementation-complete.md`
- ❌ `pricing-multi-canaux-implementation-complete-2025.md`
- ❌ `migration-formulaire-fournisseur-design-v2-2025.md`
- ❌ `characteristics-dynamic-display-patterns.md`

### 🎯 MCP Servers Actifs

**3 MCP servers optimisés** (.claude/settings.json) :

1. **context7** - Documentation libraries à jour (Next.js 15, Supabase, etc.)
2. **serena** - Semantic code analysis (find_symbol, mémoires)
3. **playwright** - Tests E2E, browser automation

**Alternatives CLI** (sans MCP) :

- Supabase : `npx supabase ...` ou `psql`
- GitHub : `gh pr list`, `gh issue create`
- Vercel : `vercel deploy`, `vercel logs`

### 🚨 Règles Anti-Hallucination MCP

**AVANT toute opération fichier** :

1. ✅ **Vérifier existence** : `ls -la [chemin]`
2. ✅ **Consulter mémoire** : `turborepo-paths-reference-2025-11-20.md`
3. ✅ **Utiliser chemins Phase 4** : `apps/`, `packages/` (JAMAIS `src/`)
4. ✅ **Valider imports** : `npm run type-check`

**Si erreur "fichier introuvable"** :

```typescript

// ✅ CHERCHER dans
apps/back-office/src/
packages/@verone/*/src/
```

### 📋 Validation Configuration

**Checklist post-migration Turborepo** :

- [x] `.claude/settings.json` - Permissions `apps/**` et `packages/**`
- [x] Mémoires Serena - 6 obsolètes supprimées
- [x] `turborepo-paths-reference-2025-11-20.md` - Créée
- [x] `.claude/contexts/design-system.md` - Chemins actualisés
- [x] Permissions `src/**` - Supprimées

**Dernière vérification** : 2025-11-20

---

## 🚫 GIT WORKFLOW - AUTORISATION OBLIGATOIRE

**RÈGLE ABSOLUE** : **JAMAIS commit/push SANS autorisation EXPLICITE utilisateur**

### Workflow Obligatoire

```typescript
1. ✅ Effectuer modifications
2. ✅ Tester localhost (MCP Playwright)
3. ✅ Vérifier build (npm run build)
4. ✅ Vérifier console errors = 0
5. ⏸️ STOP - DEMANDER AUTORISATION
6. ✅ Si "OUI" → git add, commit, push
7. ❌ Si "NON" → NE PAS commit
```

### Branch Strategy

```typescript
production-stable  → Production Vercel (auto-deploy)
main              → Staging/Development (tests)

// Workflow
1. Développement → Commit sur main
2. Tests validation → PR validation
3. Merge main → production-stable
4. Auto-deploy production
```

---

## 🎯 SUCCESS METRICS (SLOS)

- ✅ **Zero console errors** (tolérance zéro)
- ✅ **Dashboard** : <2s (LCP)
- ✅ **Pages** : <3s (LCP)
- ✅ **Build** : <20s
- ✅ **Test coverage** : >80% (nouveaux modules)

---

## 📚 DOCUMENTATION NAVIGATION

**Documentation exhaustive** : `/docs/`

- **Architecture** : `docs/architecture/` (Turborepo, composants, multi-frontends)
- **Database** : `docs/database/` (78 tables, 158 triggers, RLS)
- **Business Rules** : `docs/business-rules/` (93 dossiers modulaires)
- **Workflows** : `docs/workflows/` (Post-production, classification)
- **CI/CD** : `docs/ci-cd/` (Déploiement, rollback)

**Ressource anti-hallucination** : `docs/architecture/COMPOSANTS-CATALOGUE.md`

---

## 📖 CONTEXTES SPÉCIALISÉS

**Charger à la demande selon tâche** :

```typescript
// 🗄️ Database (migrations, schema, queries)
Read('.claude/contexts/database.md');

// 🚀 Déploiement (CI/CD, Vercel, rollback)
Read('.claude/contexts/deployment.md');

// 🎨 Design/UI (composants, Storybook)
Read('.claude/contexts/design-system.md');

// 📊 KPI (métriques, documentation YAML)
Read('.claude/contexts/kpi.md');

// 🏗️ Monorepo (architecture, migration)
Read('.claude/contexts/monorepo.md');
```

**Principe** : Ne charger que le contexte nécessaire (éviter token overhead).

### 📘 RÉFÉRENCES TURBOREPO (Phase 4 Finalisée)

**Documentation Migration Turborepo** :

- `docs/architecture/AUDIT-MIGRATION-TURBOREPO.md` - Audit détaillé (47 problèmes analysés)
- `docs/architecture/TURBOREPO-FINAL-CHECKLIST.md` - Checklist post-migration (43 items validés)
- `docs/architecture/MIGRATION-TURBOREPO-TODO.md` - Archive TODO (référence historique)
- `.claude/contexts/monorepo.md` - Context architecture actualisé

**Statut** : ✅ 47/47 problèmes résolus (100%) - Migration COMPLÉTÉE 2025-11-19

---

## 📁 CLASSIFICATION DOCUMENTATION (WORKFLOW OBLIGATOIRE)

**RÈGLE ABSOLUE** : **TOUJOURS consulter ce guide AVANT créer rapport/audit/documentation**

### 🎯 Principe

**Aucun fichier .md ne doit rester à la racine du projet** (sauf README.md, CHANGELOG.md, CLAUDE.md).
**Tous rapports, audits, guides doivent être classés dans `/docs` avec structure appropriée.**

### 📂 Structure /docs (Best Practices 2025)

```
docs/
├── architecture/           # Architecture système, composants, ADR
│   ├── decisions/         # ADR (Architecture Decision Records)
│   └── design-system/     # Design System, composants UI
├── audits/                # Audits par mois (2025-10/, 2025-11/, etc.)
│   └── 2025-11/          # Rapports novembre 2025
├── business-rules/        # Règles métier (93 dossiers modulaires)
├── database/              # Schema, migrations, RLS, triggers
├── guides/                # Guides développement (8 catégories)
│   ├── 01-onboarding/    # Nouveaux développeurs
│   ├── 02-development/   # Développement quotidien
│   ├── 03-integrations/  # Intégrations externes
│   ├── 04-deployment/    # CI/CD, Vercel
│   ├── 05-database/      # Database guides
│   ├── 06-ui-ux/         # Design, mockups
│   ├── 07-troubleshooting/ # Debugging
│   └── 08-best-practices/ # Bonnes pratiques
├── project-management/    # Roadmap, sprints, retrospectives
├── workflows/             # Workflows métier
└── ... (voir structure complète dans docs/README.md)
```

### 🚨 WORKFLOW CLASSIFICATION

**AVANT de créer tout fichier .md, suivre ce processus** :

#### Étape 1 : Identifier Type Document

```typescript
// Types de documents courants
const documentTypes = {
  AUDIT: 'Rapport audit technique/qualité/sécurité',
  RAPPORT: 'Analyse, investigation, tests',
  GUIDE: 'Documentation développement/intégration',
  ADR: 'Architecture Decision Record',
  ROADMAP: 'Planification projet',
  STATUS: 'État composants/features',
};
```

#### Étape 2 : Déterminer Destination

```typescript
// Matrice de classification
if (type === 'AUDIT' || type === 'RAPPORT') {
  // → docs/audits/YYYY-MM/
  destination = `docs/audits/${currentMonth}/`;
  example = 'docs/audits/2025-11/RAPPORT-TESTS-AUTHENTIFICATION.md';
} else if (type === 'GUIDE' && topic === 'intégration') {
  // → docs/guides/03-integrations/[service]/
  destination = `docs/guides/03-integrations/${serviceName}/`;
  example = 'docs/guides/03-integrations/google-merchant/configuration.md';
} else if (type === 'ADR') {
  // → docs/architecture/decisions/
  destination = 'docs/architecture/decisions/';
  example = 'docs/architecture/decisions/0006-pricing-multi-canaux.md';
} else if (type === 'ROADMAP' || type === 'SPRINT') {
  // → docs/project-management/
  destination = 'docs/project-management/';
  example = 'docs/project-management/roadmap-2025-q4.md';
} else if (type === 'STATUS') {
  // → docs/architecture/design-system/
  destination = 'docs/architecture/design-system/';
  example = 'docs/architecture/design-system/status-composants.md';
}
```

#### Étape 3 : Vérifier Sous-dossier Existe

```typescript
// Si sous-dossier n'existe pas, LE CRÉER
if (!exists(destination)) {
  mkdir(destination);
  createREADME(destination); // Toujours créer README.md dans nouveau dossier
}
```

#### Étape 4 : Nommer Fichier (Convention)

```typescript
// Convention naming
const filename = `${TYPE}-${sujet}-${date}.md`;

// Exemples corrects
('RAPPORT-TESTS-AUTHENTIFICATION-2025-11-19.md');
('AUDIT-BOUTONS-CRUD-COMPLET-2025-11-11.md');
('GUIDE-INTEGRATION-STRIPE-2025-11-20.md');
('ADR-0007-websockets-temps-reel.md');
```

### ✅ Exemples Concrets

#### Exemple 1 : Audit Boutons CRUD

```typescript
// ❌ INCORRECT (racine projet)
path = '/AUDIT-BOUTONS-CRUD-COMPLET.md';

// ✅ CORRECT
path = '/docs/audits/2025-11/AUDIT-BOUTONS-CRUD-COMPLET-2025-11-11.md';
```

#### Exemple 2 : Guide Intégration Stripe

```typescript
// ❌ INCORRECT (racine /docs ou guides plat)
path = '/docs/GUIDE-INTEGRATION-STRIPE.md';
path = '/docs/guides/GUIDE-INTEGRATION-STRIPE.md';

// ✅ CORRECT
path = '/docs/guides/03-integrations/stripe/configuration-complete.md';

// + Créer README.md si dossier stripe/ n'existe pas
path = '/docs/guides/03-integrations/stripe/README.md';
```

#### Exemple 3 : Décision Architecture Pricing

```typescript
// ❌ INCORRECT (mémoire Serena ou guides/)
path = '/.serena/memories/pricing-multi-canaux.md';
path = '/docs/guides/pricing-system.md';

// ✅ CORRECT (ADR formel)
path = '/docs/architecture/decisions/0004-pricing-multi-canaux.md';

// Format ADR standard (voir template docs/architecture/decisions/adr-template.md)
```

### 📋 Checklist Avant Création Fichier

- [ ] **Type document identifié** (Audit, Guide, ADR, Rapport, etc.)
- [ ] **Destination déterminée** selon matrice classification
- [ ] **Sous-dossier vérifié** (créer si inexistant + README.md)
- [ ] **Nom fichier conforme** (TYPE-sujet-date.md)
- [ ] **Aucun fichier à la racine** (sauf README, CHANGELOG, CLAUDE)
- [ ] **README.md mis à jour** dans dossier parent si nécessaire

### 🔗 Référence Complète

**Documentation détaillée** :

- Structure complète : `docs/README.md`
- Template ADR : `docs/architecture/decisions/adr-template.md`
- Audit réorganisation : `docs/architecture/TURBOREPO-FINAL-CHECKLIST.md` (Section "PHASE 2")

**Memory Serena** :

- `reorganisation-documentation-2025-11-19.md` (créée après Phase 2 réorganisation)

---

## 🤖 MCP AGENTS & TOOLS

### Agents Spécialisés (9 disponibles)

- `verone-code-reviewer` - Review qualité/sécurité
- `verone-database-architect` - Schema/migrations
- `verone-debugger` - Debug erreurs
- `verone-design-expert` - UI/UX patterns
- `verone-orchestrator` - Coordination features
- `verone-performance-optimizer` - Optimisation perf
- `verone-security-auditor` - Audit sécurité
- `verone-test-expert` - Tests E2E
- `verone-typescript-fixer` - Corrections TS batch

### Commands (1 essentielle)

- `/db` - Opérations Supabase rapides (queries, migrations, logs, RLS testing)

### Contexts (5 spécialisés)

- `database.md` - Migrations, RLS, anti-hallucination
- `deployment.md` - CI/CD, Vercel
- `design-system.md` - UI/UX patterns
- `kpi.md` - Métriques business
- `monorepo.md` - Architecture Turborepo

---

## 🇫🇷 LANGUE

**TOUJOURS communiquer en français** (messages, docs, commits)
**Exception** : Code (variables, fonctions en anglais)

---

**Version** : 4.2.0
**Dernière mise à jour** : 2025-12-10
**Mainteneur** : Romeo Dos Santos

**Changelog 4.2.0** (Workflow P.D.C.A. Autonome) :

- ✅ Nouveau workflow P.D.C.A. (Plan-Do-Check-Act) - Méthode de Deming
- ✅ Preuves techniques OBLIGATOIRES (logs MCP) à chaque phase CHECK
- ✅ Boucle de réflexion autonome (min 2 itérations avant demande d'aide)
- ✅ Interdiction de dire "vérifié" sans log dans la réponse
- ✅ Checklist preuves techniques standardisée

**Changelog 4.1.0** (Finalisation Migration Turborepo) :

- ✅ Migration Turborepo FINALISÉE (47/47 problèmes résolus - 100%)
- ✅ Phase 4 Multi-Frontends stabilisée (3 apps + 25 packages)
- ✅ Architecture documentation actualisée (CLAUDE.md, monorepo.md, checklist)
- ✅ 86 composants UI documentés et fonctionnels
- ✅ Build 100% strict TypeScript (ignoreBuildErrors: false)
- ✅ Console errors : 0 (tolérance zéro maintenue)
- ✅ Problem 12 (stock_reservations) : RLS policies + FK constraint appliqués

**Changelog 4.0.0** :

- ✅ Réduction drastique : 2,291 → 600 lignes (-74%)
- ✅ Nettoyage .claude/ : 10,416 → ~3,000 lignes (-71%)
- ✅ Suppression commandes obsolètes (garder db.md uniquement)
- ✅ Suppression modes YOLO + security
- ✅ Focus sur essentiel : workflow universel + règles d'or
- ✅ Documentation détaillée extraite vers docs/
