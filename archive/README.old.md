# 🏢 Vérone Back Office

Interface d'administration CRM/ERP pour Vérone - Mobilier et décoration d'intérieur haut de gamme.

## 🎯 Vision & Mission

**MVP Catalogue Partageable** - Phase 1 prioritaire :
- Interface administration → liens partageables + PDF branded + feeds auto
- **Objectif** : -70% temps création catalogues clients
- **SLO Critique** : Dashboard <2s, interface responsive mobile-first

## 🏗️ Architecture Technique

- **Framework** : Next.js 15 App Router + React 18 + TypeScript
- **UI/UX** : Design system Vérone (noir/blanc) + Tailwind CSS + shadcn/ui
- **Backend** : Supabase (Auth + Database + RLS)
- **Performance** : React Server Components + Streaming + Optimized bundles
- **Monorepo** : Intégration packages Vérone (@verone/database, @verone/shared-ui, @verone/business-logic)

## 🚀 Quick Start

### Prérequis
- Node.js ≥18.0.0
- npm ≥8.0.0
- Variables d'environnement Supabase configurées

### Installation & Développement

```bash
# Depuis le répertoire racine du monorepo
npm install

# Démarrer le serveur de développement
cd apps/back-office
npm run dev

# L'application sera disponible sur http://localhost:3001
```

### Variables d'environnement

Copiez `.env.example` vers `.env.local` et configurez :

```bash
cp .env.example .env.local
```

Variables critiques :
- `NEXT_PUBLIC_SUPABASE_URL` : URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (backend only)

## 📱 Modules & Navigation

### Modules Vérone (Phase 1)
1. **📊 Dashboard** - KPIs temps réel, alertes, tâches
2. **📦 Catalogue** - Produits, variantes, collections (MVP)
3. **📋 Stock** - Inventaires, approvisionnements
4. **🛒 Commandes** - Devis, commandes, livraisons
5. **💰 Facturation** - Factures, avoirs, comptabilité
6. **👥 CRM** - Clients, prospects, relations
7. **⚙️ Paramètres** - Configuration système

### SLOs Business Critiques
- **Dashboard load time** : <2s (interface quotidienne)
- **Feeds generation** : <10s (Meta/Google exports)
- **PDF export** : <5s (catalogues clients)
- **Search response** : <1s (recherche produits)
- **Uptime** : 99.5% minimum

## 🎨 Design System Vérone

### Couleurs Officielles
```css
/* Couleurs principales */
--verone-noir: #000000;    /* Couleur principale */
--verone-blanc: #ffffff;   /* Couleur secondaire */

/* Couleurs système (usage exceptionnel) */
--system-success: #22c55e;
--system-warning: #000000;
--system-error: #ef4444;
--system-info: #3b82f6;
```

### Principes Design
- **Minimalisme sophistiqué** : Noir/blanc exclusivement
- **Coins droits** : Aucun border-radius (border-radius: 0)
- **Pas d'ombres** : Design épuré sans box-shadow
- **Contraste AAA** : Accessibilité maximale
- **Mobile-first** : >40% usage mobile

### Composants UI Vérone
- `.btn-verone-primary` : Bouton principal noir
- `.btn-verone-secondary` : Bouton secondaire blanc
- `.card-verone` : Carte avec bordure noire
- `.input-verone` : Input avec focus ring noir
- `.nav-verone` : Navigation avec bordure bottom

## 📂 Structure du Projet

```
apps/back-office/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Layout racine avec providers
│   │   ├── page.tsx           # Dashboard principal
│   │   └── globals.css        # Styles globaux Vérone
│   ├── components/
│   │   ├── dashboard/         # Composants dashboard
│   │   ├── layout/            # Navigation, topbar
│   │   └── ui/                # Composants UI réutilisables
│   ├── lib/
│   │   └── utils.ts           # Utilitaires (cn, etc.)
│   └── types/                 # Types TypeScript
├── tailwind.config.js         # Configuration Tailwind + Design System
├── next.config.js             # Configuration Next.js + monorepo
└── tsconfig.json              # Configuration TypeScript
```

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev                # Serveur dev sur port 3001
npm run build              # Build production
npm run start              # Serveur production

# Qualité code
npm run lint               # Linting ESLint
npm run lint:fix           # Fix automatique
npm run type-check         # Vérification TypeScript

# Tests
npm run test               # Tests Jest
npm run test:watch         # Tests en mode watch
npm run test:e2e           # Tests E2E Playwright
npm run test:e2e:ui        # Tests E2E avec UI

# Maintenance
npm run clean              # Nettoyer .next et dist
```

## 🏅 Standards de Qualité

### Performance
- **First Contentful Paint** : <1.5s
- **Largest Contentful Paint** : <2.5s
- **Cumulative Layout Shift** : <0.1
- **Bundle optimization** : Code splitting automatique

### Accessibilité
- **Contraste** : AAA sur tous les textes (21:1 noir/blanc)
- **Touch targets** : Minimum 44px × 44px
- **Keyboard navigation** : 100% accessible
- **Screen readers** : Labels ARIA complets

### SEO & Security
- **Robots** : Pas d'indexation (back office privé)
- **Headers** : Security headers (CSP, HSTS, etc.)
- **Authentication** : Supabase Auth + RLS policies
- **Environment** : Variables sensibles protégées

## 🔗 Intégrations Vérone

### Packages Monorepo
- `@verone/database` : Types Supabase + client
- `@verone/shared-ui` : Composants UI réutilisables
- `@verone/business-logic` : Règles métier + validations

### Services Externes (Future)
- **Brevo** : Marketing automation, webhooks
- **Google Merchant** : Feeds produits automatisés
- **Meta Catalog** : Publicités Facebook/Instagram
- **PDF Engine** : Génération catalogues branded

## 📊 Monitoring & Analytics

### Métriques Business
- **Adoption** : 100% équipe utilise quotidiennement sous 30 jours
- **Productivité** : +70% produits ajoutés/jour
- **Efficacité** : -60% temps création devis
- **Qualité** : <2% produits avec données incomplètes

### Monitoring Technique
- **Erreurs** : <1% error rate
- **Performance** : Core Web Vitals tracking
- **Uptime** : 99.5% monitoring
- **Bundle size** : Surveillance automatique

## 🚀 Déploiement

### Environnements
- **Development** : http://localhost:3001
- **Staging** : Vercel preview deployments
- **Production** : back-office.verone.com (à configurer)

### CI/CD Pipeline
1. **Tests** : Unit + E2E automatiques
2. **Quality** : ESLint + TypeScript + Performance audit
3. **Build** : Next.js optimized build
4. **Deploy** : Vercel automatic deployments

---

## 🧠 Notes d'Implémentation

### Business Rules Respect
- Tous les développements doivent respecter `/manifests/business-rules/`
- PRDs dans `/manifests/prd/` comme référence authoritative
- Design system dans `/manifests/design-specifications/`

### Performance First
- SLO Dashboard <2s est **critique** pour adoption équipe
- React Server Components pour réduire JavaScript client
- Streaming avec Suspense pour perception performance
- Bundle optimization avec Next.js 15 Turbopack

### Évolutivité
- Architecture modulaire pour phases ultérieures
- Design system extensible vers autres applications Vérone
- API design compatible avec futurs front-ends (website-public, website-pro)

---

**🎯 Objectif : Révolutionner l'efficacité opérationnelle Vérone avec une interface moderne, performante et intuitive.**