# 🏢 Vérone Back Office

**CRM/ERP modulaire** pour décoration et mobilier d'intérieur haut de gamme.

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_15-green?style=flat&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat&logo=vercel)](https://vercel.com/)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Supabase** account ([Sign up](https://supabase.com/))
- **Vercel** account (optional, for deployment)

### Installation

```bash
# Cloner le repository
git clone https://github.com/Verone2021/Verone-V1.git
cd Verone-V1

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Configurer Supabase credentials dans .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Configuration Database

```bash
# Appliquer les migrations Supabase
supabase db push

# Générer les types TypeScript
supabase gen types typescript --local > apps/back-office/src/types/supabase.ts
```

---

## 📊 Tech Stack

### Frontend

- **Framework** : [Next.js 15](https://nextjs.org/) (App Router, React Server Components)
- **UI Library** : [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/)
- **State Management** : React Hooks + Server Actions
- **Forms** : [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

### Backend

- **Database** : [Supabase](https://supabase.com/) (PostgreSQL 15)
- **Auth** : Supabase Auth (JWT, RLS policies)
- **Storage** : Supabase Storage (images, documents)
- **Real-time** : Supabase Realtime (subscriptions)

### Testing & Quality

- **Unit Tests** : [Vitest](https://vitest.dev/)
- **E2E Tests** : [Playwright](https://playwright.dev/)
- **Component Docs** : [Storybook](https://storybook.js.org/)
- **Type Safety** : [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **Linting** : [ESLint](https://eslint.org/)

### Deployment

- **Hosting** : [Vercel](https://vercel.com/) (auto-deploy `production-stable` branch)
- **CI/CD** : GitHub Actions (PR validation, tests, audits)
- **Analytics** : Vercel Analytics

---

## 🎯 Project Status

### ✅ Phase 4 : Multi-Frontends Turborepo (Production)

**Date** : 2025-11-08
**État** : ✅ **Production multi-apps** avec monorepo Turborepo

**3 Applications Déployées** :

#### 1. **back-office** (Port 3000) - CRM/ERP Complet

- 🔐 **Authentification** (`/login`, `/profile`) - Auth Supabase + RLS policies
- 📊 **Dashboard** (`/dashboard`) - KPIs temps réel, métriques, notifications
- 🏢 **Organisations & Contacts** (`/contacts-organisations`)
  - Customers (B2B + B2C)
  - Suppliers (fournisseurs)
  - Partners (apporteurs d'affaires)
  - Contacts (liés organisations)
- 📦 **Produits** (`/produits`)
  - Catalogue produits (31 routes)
  - Sourcing & fournisseurs
  - Variantes & packages
  - Images & caractéristiques
- 📊 **Stocks** (`/stocks`)
  - Mouvements (entrées, sorties, backorders)
  - Alertes intelligentes (seuils dynamiques)
  - Inventaire & réceptions
  - Expéditions
- 🛒 **Commandes** (`/commandes`)
  - Clients (B2B, B2C)
  - Fournisseurs (approvisionnement)
  - Expéditions & tracking
- 💰 **Finance** (`/finance`, `/factures`, `/tresorerie`)
  - Rapprochement bancaire automatique
  - Trésorerie & prévisions
  - Factures clients/fournisseurs
- 🌐 **Canaux Vente** (`/canaux-vente`)
  - Google Merchant Center (feeds XML)
  - Prix clients multi-canal
  - Intégrations externes
- ⚙️ **Administration** (`/admin`)
  - Users management (4 rôles)
  - Activity tracking (RGPD-compliant)

#### 2. **site-internet** (Port 3001) - E-commerce Public

- 🛍️ **Catalogue produits** avec filtres avancés
- 📦 **Pages produits** détaillées (images, specs, prix)
- 🛒 **Panier & Checkout** sécurisé
- 👤 **Compte client** (commandes, favoris)

#### 3. **linkme** (Port 3002) - Commissions Apporteurs

- 💼 **Suivi ventes** apportées par vendeur
- 💰 **Calcul commissions** automatique
- 📊 **Statistiques performances** détaillées

**Architecture Turborepo** :

- 🏗️ **25 packages** @verone/\* partagés (monorepo)
- 🎨 **86 composants** React documentés (54 UI + 32 Products)
- 📦 **3 apps** déployées (back-office, site-internet, linkme)
- 🗄️ **78 tables** database (schema stable)
- 🔧 **158 triggers** automatiques
- 🛡️ **239 RLS policies** sécurité
- 📝 **157 migrations** SQL

**Packages @verone/\* Partagés** :

- `@verone/ui` (54 composants Design System)
- `@verone/products` (32 composants produits)
- `@verone/orders`, `@verone/stock`, `@verone/customers`
- `@verone/categories`, `@verone/collections`, `@verone/channels`
- `@verone/dashboard`, `@verone/notifications`, `@verone/admin`
- `@verone/types`, `@verone/utils`, `@verone/testing`
- Plus 12 autres packages métiers

---

### 📅 Roadmap Future (Q1-Q2 2026)

**Modules Planifiés** :

- 📊 **Analytics Avancées** - Business Intelligence, prédictions stock IA
- 🤖 **Automatisations** - Workflows automatiques, triggers complexes
- 📱 **Apps Mobiles** - React Native (iOS/Android) pour vendeurs terrain
- 🔌 **APIs Publiques** - REST API + GraphQL pour intégrations partenaires
- 🌍 **Multi-langues** - i18n (FR/EN/ES) pour marchés internationaux
- 🎨 **White-Label** - Customisation marque pour clients B2B

**Documentation Turborepo** : [`CLAUDE.md`](./CLAUDE.md) § Architecture Turborepo

---

## 📚 Documentation

### 📖 Documentation Exhaustive

Le projet dispose d'une documentation complète dans le dossier [`/docs`](./docs/) :

- **[Auth](./docs/auth/)** - Rôles, permissions, RLS policies
- **[Database](./docs/database/)** - Schema (78 tables), triggers (158), functions (254)
- **[Metrics](./docs/metrics/)** - KPI, calculs, documentation YAML
- **[Workflows](./docs/workflows/)** - Business workflows détaillés
- **[CI/CD](./docs/ci-cd/)** - Déploiement, rollback, validation
- **[Business Rules](./docs/business-rules/)** - 93 dossiers règles métier (19 modules)

### 🤖 Instructions Claude Code

**[CLAUDE.md](./CLAUDE.md)** - Instructions complètes pour Claude Code :

- Workflow Universel 2025 (Think → Test → Code → Re-test → Document → Commit)
- Post-Production Workflows (smoke tests, health checks, canary deployments)
- MCP Agents usage (Serena, Supabase, Playwright)
- TypeScript Fixes workflow (clustering + batch corrections)
- Branch Strategy (production-stable vs main)

### 🎨 Design System

**Design System V2** : [`apps/back-office/src/components/ui-v2/`](./apps/back-office/src/components/ui-v2/)

- 270 composants React modulaires
- shadcn/ui + Radix UI foundation
- Storybook documentation (à venir)
- Dark mode support

---

## ⚡ Commandes Essentielles

### Développement

```bash
npm run dev              # Next.js dev server (localhost:3000)
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint
npm run type-check       # TypeScript check
```

### Testing

```bash
npm run test             # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run test:critical    # Tests critiques (20 tests - 5min)
npm run test:all         # Suite complète (677 tests - 45min)
```

### Audit & Quality

```bash
npm run audit:all        # Tous audits (duplicates, cycles, deadcode, spelling)
npm run audit:duplicates # Code duplication (jscpd)
npm run audit:cycles     # Circular dependencies (madge)
npm run audit:deadcode   # Dead code detection (knip)
npm run audit:spelling   # Spell checking (cspell)
```

### Database

```bash
supabase db push         # Appliquer migrations
supabase gen types typescript --local > apps/back-office/src/types/supabase.ts
supabase db reset        # Reset database (dev only)
```

---

## 🎯 Success Metrics (SLOs)

Le projet maintient des standards de qualité stricts :

- ✅ **Zero Console Errors** - Tolérance zéro (validation automatique PR)
- ✅ **Performance** - Dashboard <2s LCP, Pages <3s
- ✅ **Build Time** - <20s production build
- ✅ **Test Coverage** - >80% nouveaux modules
- ✅ **Type Safety** - TypeScript strict mode, 0 `any`

**Monitoring** : Vercel Analytics + Lighthouse CI (à implémenter)

---

## 🤝 Contributing

### Workflow Développement

1. **Créer une branche** : `git checkout -b feature/nom-feature`
2. **Suivre Workflow Universel** : Voir [CLAUDE.md](./CLAUDE.md) § Workflow Universel 2025
3. **Tests** : Valider `npm run test:critical` passe (console = 0 errors)
4. **Build** : Valider `npm run build` passe
5. **Pull Request** : Créer PR vers `main`
6. **Validation** : PR validation automatique (15min) via GitHub Actions
7. **Merge** : Après review + tests OK
8. **Deploy** : Auto-deploy Vercel après merge `main` → `production-stable`

### Standards Code

- **Language** : Français (messages, docs, commit messages) | English (code, variables)
- **Commit Format** : Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **TypeScript** : Strict mode, pas de `any`
- **Testing** : Tests critiques AVANT commit

**Détails** : [CLAUDE.md](./CLAUDE.md) § Git Workflow + Post-Production Workflows

---

## 🏗️ Architecture

### Structure Repository

```
verone-back-office-V1/
├── apps/                    # Applications Turborepo (3 apps)
│   ├── back-office/         # CRM/ERP complet (port 3000)
│   │   ├── src/app/         # Next.js App Router (71 routes)
│   │   ├── src/components/  # React components
│   │   │   ├── ui/          # shadcn/ui base
│   │   │   └── ui-v2/       # Design System V2
│   │   ├── src/hooks/       # Custom hooks
│   │   ├── src/lib/         # Utils, Supabase client
│   │   └── src/types/       # TypeScript types
│   ├── site-internet/       # E-commerce public (port 3001)
│   └── linkme/              # Commissions vendeurs (port 3002)
├── packages/                # 25 packages @verone/* partagés
│   └── @verone/
│       ├── ui/              # 54 composants Design System
│       ├── products/        # 32 composants produits
│       ├── orders/          # Composants commandes
│       ├── stock/           # Composants stock
│       ├── customers/       # Composants clients
│       ├── categories/      # Composants catégories
│       ├── types/           # Types partagés
│       ├── utils/           # Utils partagés
│       └── ... (17 autres packages)
├── docs/                    # Documentation exhaustive
│   ├── auth/
│   ├── database/            # 78 tables, 158 triggers, 239 RLS policies
│   ├── metrics/             # KPI documentation
│   ├── workflows/
│   ├── ci-cd/
│   └── business-rules/      # 93 dossiers (19 modules)
├── .claude/
│   ├── contexts/            # Contextes spécialisés
│   └── commands/            # Custom slash commands
├── supabase/migrations/     # Database migrations (157 fichiers)
├── scripts/                 # Automation scripts
└── .github/workflows/       # CI/CD GitHub Actions
```

### Database Schema

**PostgreSQL 15** via Supabase :

- **78 tables** - Architecture relationnelle normalisée
- **158 triggers** - Automation (stock, pricing, audit trails)
- **239 RLS policies** - Row-Level Security (auth granulaire)
- **254 functions** - Business logic database-side

**Documentation** : [`docs/database/SCHEMA-REFERENCE.md`](./docs/database/SCHEMA-REFERENCE.md)

---

## 📄 License

**Proprietary** - Vérone © 2025

Ce projet est la propriété exclusive de Vérone. Tous droits réservés.
Reproduction, distribution ou utilisation interdite sans autorisation écrite.

---

## 📞 Contact & Support

**Mainteneur** : Romeo Dos Santos
**Email** : [contact@verone.fr](mailto:contact@verone.fr)
**Website** : [https://verone.fr](https://verone.fr)

### Issues & Bugs

Pour signaler un bug ou demander une feature :

1. Vérifier [Issues existants](https://github.com/Verone2021/Verone-V1/issues)
2. Créer nouvel issue avec template approprié
3. Inclure :
   - Description claire du problème
   - Steps to reproduce (si bug)
   - Screenshots (si UI)
   - Console errors (si applicable)

### Documentation Additionnelle

- **Quick Start Guide** : [`docs/guides/quickstart.md`](./docs/guides/quickstart.md)
- **Troubleshooting** : [`docs/guides/troubleshooting.md`](./docs/guides/troubleshooting.md)
- **API Reference** : [`docs/api/README.md`](./docs/api/README.md)

---

**Version** : 3.1.0 (Phase 1 Production)
**Dernière mise à jour** : 2025-10-30
**Status** : ✅ Production-ready

---

<div align="center">

**Built with ❤️ by Vérone Team**

[Documentation](./docs/) • [CLAUDE.md](./CLAUDE.md) • [Changelog](./CHANGELOG.md)

</div>
