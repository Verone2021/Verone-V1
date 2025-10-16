# 🧠 Active Context - Vérone Back Office 2025

**Dernière Mise à Jour**: 2025-10-10
**Status**: Production Active
**Version Application**: MVP Catalogue + Finance + Stocks + Commandes

---

## 🎯 État Actuel du Projet

### ✅ Application Déployée Production

**URL Production**: https://verone-backoffice-7f270yhir-verone2021s-projects.vercel.app
**Stack Technique**:
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS + Design System Vérone
- **Database**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Deployment**: Vercel (auto-deploy depuis main)
- **Monitoring**: Sentry
- **Testing**: Playwright (MCP Browser)

---

## 📊 Modules Fonctionnels Actuels

### 1. 🏠 Dashboard
- **Status**: ✅ STABLE
- **Features**: KPIs temps réel, métriques business, navigation sidebar
- **Performance**: <2s chargement
- **Fichier**: `src/app/dashboard/page.tsx`

### 2. 📦 Catalogue Produits
- **Status**: ✅ FONCTIONNEL
- **Features**: CRUD produits, gestion variantes, conditionnements, images multiples
- **Data**: 241+ produits
- **Fichier**: `src/app/catalogue/page.tsx`

### 3. 📊 Stocks & Mouvements
- **Status**: ✅ OPÉRATIONNEL
- **Features**: Inventaire, mouvements stocks, traçabilité complète
- **Fichier**: `src/app/stocks/mouvements/page.tsx`

### 4. 🛒 Commandes Clients
- **Status**: ✅ ACTIF
- **Features**: Gestion commandes, workflow validation, expéditions
- **Fichier**: `src/app/commandes/clients/page.tsx`

### 5. 💰 Finance & Rapprochement Bancaire
- **Status**: ✅ COMPLET
- **Features**: Intégration Qonto, Abby facturation, rapprochement bancaire
- **Fichier**: `src/app/finance/rapprochement/page.tsx`
- **Intégrations**: Qonto API, Abby API

### 6. 💲 Admin Pricing (Système Prix Multi-Canaux)
- **Status**: ✅ IMPLÉMENTÉ (2025-10-10)
- **Features**: Prix par canal vente, prix par client, groupes clients
- **Tables BDD**: `price_lists`, `price_list_items`, `customer_price_lists`, `channel_price_lists`
- **Fichier**: `src/app/admin/pricing/page.tsx`

### 7. 📞 Consultations Clients
- **Status**: ✅ FONCTIONNEL
- **Features**: Workflow sourcing, validation échantillons, conversion devis
- **Fichier**: `src/app/consultations/page.tsx`

### 8. 🏢 Organisations & Fournisseurs
- **Status**: ✅ STABLE
- **Features**: CRUD organisations, gestion fournisseurs
- **Fichier**: `src/app/contacts-organisations/page.tsx`

---

## 🔐 Sécurité & Authentification

### Row Level Security (RLS)
- **Status**: ✅ ACTIF Production
- **Policies**: organisation_id filtering sur toutes tables sensibles
- **Migration Critique**: 2025-10-08 (RLS activé)

### Authentification
- **Provider**: Supabase Auth
- **Features**: Login, logout, reset password, middleware protection
- **Rôles**: Admin, Manager, User

---

## 🎨 Design System

### Composants UI
- **Bibliothèque**: shadcn/ui (44 composants)
- **Design**: Compact professionnel CRM/ERP
- **Rollback**: 2025-10-10 (design spacieux → compact)
- **Couleurs**: Noir/Blanc strict (pas de jaune/doré)

### Spacing & Densité
- Card padding: p-4
- Button height: h-9
- Table cell: py-2.5 (densité +25%)

---

## 🗄️ Base de Données Production

### Tables Principales (52+)
- **Catalogue**: `products`, `product_variants`, `product_characteristics`, `product_images`
- **Stocks**: `stock_movements`, `stock_locations`
- **Commandes**: `customer_orders`, `order_items`, `shipments`
- **Finance**: `financial_documents`, `financial_payments`, `bank_transactions`
- **Pricing**: `price_lists`, `price_list_items`, `customer_price_lists`
- **Organisations**: `organisations`, `organisation_types`
- **Auth**: `user_profiles`, `user_sessions`

### Migrations Récentes
- 2025-10-11: Système facturation Abby complet
- 2025-10-10: Système pricing multi-canaux
- 2025-10-08: Migration RLS critique production

---

## 🚀 Intégrations Externes

### 1. Qonto (API Bancaire)
- **Status**: ✅ CONNECTÉ
- **Features**: Synchronisation transactions, webhooks
- **Config**: OAuth 2.0

### 2. Abby (Facturation)
- **Status**: ✅ INTÉGRÉ (2025-10-11)
- **Features**: Génération factures, synchronisation, webhooks
- **API**: REST complète

### 3. Google Merchant Center
- **Status**: ✅ CONFIGURÉ
- **Features**: Feed produits automatisé
- **Credentials**: Service Account

### 4. Packlink (Expéditions)
- **Status**: ✅ TESTÉ
- **Features**: Gestion multi-transporteurs
- **Modal**: v2 avec hooks optimisés

---

## 📝 Workflow Développement 2025

### Méthodologie
- **Plan-First**: Sequential Thinking obligatoire
- **Agent Orchestration**: Serena MCP + Playwright + Context7
- **Console Clean**: Zero tolerance erreurs (MCP Browser)
- **Auto-Update Repository**: Manifests + MEMORY-BANK

### Git Flow
- **Branche production**: `main`
- **Feature branches**: `feature/*`
- **Hotfix branches**: `hotfix/*`
- **CI/CD**: Vercel auto-deploy

### Testing Strategy
- **Approche**: Tests ciblés (50 tests vs 677 abandonnés)
- **Tools**: MCP Playwright Browser visible uniquement
- **Monitoring**: Sentry temps réel

---

## 🎯 Objectifs Actuels

### Court Terme (1-2 semaines)
- ✅ Système pricing multi-canaux (COMPLÉTÉ 2025-10-10)
- ✅ Intégration Abby facturation (COMPLÉTÉ 2025-10-11)
- 🔄 Documentation complète par page (EN COURS)
- ⏳ PRDs alignés code actuel

### Moyen Terme (1 mois)
- ⏳ Optimisation performance (<2s dashboard, <3s catalogue)
- ⏳ Accessibilité WCAG 2.1 AAA
- ⏳ Tests E2E complets (50 tests critiques)

### Long Terme (3 mois)
- ⏳ Module CRM complet
- ⏳ Analytics & Reporting avancés
- ⏳ Mobile app (React Native)

---

## 📌 Notes Importantes

### Décisions Récentes
- **2025-10-10**: Rollback design system spacieux → compact CRM/ERP
- **2025-10-11**: Abandon système 677 tests → 50 tests ciblés
- **2025-10-10**: Nettoyage repository massif (~150 fichiers obsolètes)

### Leçons Apprises
- CRM/ERP nécessite design dense, pas spacieux
- Rollback rapide > migration progressive longue (5min vs 20h)
- Zero tolerance console errors = qualité production
- Migration BDD incomplète = risque production

---

**Maintenu Par**: Équipe Vérone + Claude Code 2025
**Workflow**: Plan-First → Agent Orchestration → Console Clean → Deploy
