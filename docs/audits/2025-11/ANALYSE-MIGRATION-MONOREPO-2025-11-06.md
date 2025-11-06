# ANALYSE EXHAUSTIVE MIGRATION MONOREPO - VÉRONE BACK-OFFICE V1
**Date** : 2025-11-06  
**Analyste** : Claude Code  
**Objectif** : Préparer migration vers architecture monorepo (backoffice + website + packages partagés)

---

## 📊 STATISTIQUES GLOBALES DU REPOSITORY

### Inventaire Code
- **Total fichiers TypeScript** : 602 fichiers (.ts + .tsx)
- **Total lignes de code** : ~180 278 lignes
- **Composants** : 
  - UI (shadcn/ui + custom) : 54 composants
  - UI-v2 (Design System) : 4 composants
  - Business : 202 composants
  - Forms : 2 composants
  - Layout : 3 composants
  - Providers : 3 composants
  - Admin : X composants
  - Testing : X composants
  - Profile : X composants
- **Hooks** : 105 hooks
- **Lib utilities** : 65 fichiers
- **Pages (App Router)** : 72 pages
- **Client Components** : 415 fichiers avec 'use client'

### Dépendances Clés
```json
{
  "core": {
    "next": "^15.2.2",
    "react": "18.3.1",
    "typescript": "^5.3.3"
  },
  "ui": {
    "@radix-ui/*": "~20 packages",
    "tailwindcss": "^3.4.1",
    "lucide-react": "^0.309.0"
  },
  "backend": {
    "@supabase/supabase-js": "^2.57.4",
    "@supabase/ssr": "^0.7.0",
    "@tanstack/react-query": "^5.20.1"
  },
  "forms": {
    "react-hook-form": "^7.64.0",
    "zod": "^4.1.12"
  },
  "business": {
    "exceljs": "^4.4.0",
    "jspdf": "^3.0.3",
    "recharts": "^3.2.1"
  }
}
```

---

## 🗂️ ARBORESCENCE ACTUELLE (Structure Existante)

```
verone-back-office-V1/
├── src/
│   ├── app/                                    # Next.js App Router (72 pages)
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── profile/
│   │   ├── admin/                              # ❌ BACK-OFFICE ONLY
│   │   │   ├── users/
│   │   │   └── activite-utilisateurs/
│   │   ├── canaux-vente/                       # ❌ BACK-OFFICE ONLY
│   │   │   ├── google-merchant/
│   │   │   └── prix-clients/
│   │   ├── commandes/                          # ❌ BACK-OFFICE ONLY
│   │   │   ├── clients/
│   │   │   └── fournisseurs/
│   │   ├── consultations/                      # ❌ BACK-OFFICE ONLY
│   │   ├── contacts-organisations/             # ❌ BACK-OFFICE ONLY
│   │   │   ├── customers/
│   │   │   ├── suppliers/
│   │   │   ├── partners/
│   │   │   └── contacts/
│   │   ├── dashboard/                          # ❌ BACK-OFFICE ONLY
│   │   ├── factures/                           # ❌ BACK-OFFICE ONLY
│   │   ├── finance/                            # ❌ BACK-OFFICE ONLY
│   │   ├── notifications/                      # ❌ BACK-OFFICE ONLY
│   │   ├── organisation/                       # ❌ BACK-OFFICE ONLY
│   │   ├── parametres/                         # ❌ BACK-OFFICE ONLY
│   │   ├── produits/                           # ❌ BACK-OFFICE ONLY
│   │   │   ├── catalogue/
│   │   │   └── sourcing/
│   │   ├── stocks/                             # ❌ BACK-OFFICE ONLY
│   │   │   ├── alertes/
│   │   │   ├── mouvements/
│   │   │   ├── receptions/
│   │   │   └── expeditions/
│   │   ├── tresorerie/                         # ❌ BACK-OFFICE ONLY
│   │   └── ventes/                             # ❌ BACK-OFFICE ONLY
│   │
│   ├── components/
│   │   ├── ui/                                 # ✅ PARTAGEABLE (shadcn/ui)
│   │   │   ├── button.tsx                      # 54 composants UI
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (tous composants shadcn/ui)
│   │   │
│   │   ├── ui-v2/                              # ✅ PARTAGEABLE (Design System V2)
│   │   │   └── stock/
│   │   │       ├── ChannelBadge.tsx
│   │   │       ├── ChannelFilter.tsx
│   │   │       ├── StockKPICard.tsx
│   │   │       └── StockMovementCard.tsx
│   │   │
│   │   ├── business/                           # ⚠️ MIXTE (202 composants)
│   │   │   ├── ✅ PARTAGEABLES (génériques métier) :
│   │   │   │   ├── address-input.tsx
│   │   │   │   ├── customer-badge.tsx
│   │   │   │   ├── stock-status-badge.tsx
│   │   │   │   ├── category-selector.tsx
│   │   │   │   ├── image-upload.tsx
│   │   │   │   ├── kpi-card.tsx
│   │   │   │   └── ... (~50 composants métier génériques)
│   │   │   │
│   │   │   └── ❌ SPÉCIFIQUES BACK-OFFICE :
│   │   │       ├── abc-analysis-view.tsx
│   │   │       ├── aging-report-view.tsx
│   │   │       ├── bug-reporter.tsx
│   │   │       ├── inventory-adjustment-modal.tsx
│   │   │       ├── order-detail-modal.tsx
│   │   │       ├── movements-table.tsx
│   │   │       └── ... (~152 composants admin/gestion)
│   │   │
│   │   ├── forms/                              # ⚠️ MIXTE
│   │   │   ├── CategoryForm.tsx                # ❌ BACK-OFFICE
│   │   │   ├── SubcategoryForm.tsx             # ❌ BACK-OFFICE
│   │   │   └── ImageUpload.tsx                 # ✅ PARTAGEABLE
│   │   │
│   │   ├── layout/                             # ⚠️ MIXTE
│   │   │   ├── auth-wrapper.tsx                # ✅ PARTAGEABLE
│   │   │   ├── page-header.tsx                 # ✅ PARTAGEABLE
│   │   │   ├── sidebar-provider.tsx            # ❌ BACK-OFFICE
│   │   │   └── public-layout.tsx               # ✅ PARTAGEABLE
│   │   │
│   │   ├── providers/                          # ✅ PARTAGEABLE
│   │   │   ├── react-query-provider.tsx
│   │   │   ├── activity-tracker-provider.tsx
│   │   │   └── console-error-tracker-provider.tsx
│   │   │
│   │   ├── admin/                              # ❌ BACK-OFFICE ONLY
│   │   ├── testing/                            # ❌ BACK-OFFICE ONLY (peut être partagé en devDep)
│   │   └── profile/                            # ✅ PARTAGEABLE
│   │
│   ├── hooks/                                  # ⚠️ MIXTE (105 hooks)
│   │   ├── ✅ HOOKS UI GÉNÉRIQUES (partageables) :
│   │   │   ├── use-toast.ts
│   │   │   ├── use-image-upload.ts
│   │   │   ├── use-logo-upload.ts
│   │   │   ├── use-simple-image-upload.ts
│   │   │   ├── use-inline-edit.ts
│   │   │   └── use-section-locking.ts
│   │   │
│   │   ├── ✅ HOOKS BASE (partageables avec adaptation) :
│   │   │   ├── base/
│   │   │   │   ├── use-supabase-query.ts       # Générique DB
│   │   │   │   ├── use-supabase-mutation.ts    # Générique DB
│   │   │   │   └── use-supabase-crud.ts        # Générique CRUD
│   │   │   └── use-base-hook.ts
│   │   │
│   │   ├── ❌ HOOKS MÉTIER BACK-OFFICE ONLY :
│   │   │   ├── use-products.ts
│   │   │   ├── use-stock.ts
│   │   │   ├── use-stock-movements.ts
│   │   │   ├── use-purchase-orders.ts
│   │   │   ├── use-sales-orders.ts
│   │   │   ├── use-organisations.ts
│   │   │   ├── use-suppliers.ts
│   │   │   ├── use-customers.ts
│   │   │   ├── use-dashboard-analytics.ts
│   │   │   └── ... (~80 hooks métier admin)
│   │   │
│   │   ├── ❌ HOOKS METRICS (back-office analytics) :
│   │   │   └── metrics/
│   │   │       ├── use-activity-metrics.ts
│   │   │       ├── use-order-metrics.ts
│   │   │       ├── use-product-metrics.ts
│   │   │       ├── use-revenue-metrics.ts
│   │   │       ├── use-stock-metrics.ts
│   │   │       └── use-user-metrics.ts
│   │   │
│   │   └── ❌ HOOKS GOOGLE MERCHANT (back-office specific) :
│   │       └── google-merchant/
│   │           └── ... (4 hooks)
│   │
│   ├── lib/                                    # ⚠️ MIXTE (65 fichiers)
│   │   ├── ✅ UTILITAIRES GÉNÉRIQUES (100% partageables) :
│   │   │   ├── utils.ts                        # ⭐ CORE (cn, formatPrice, dates, slugs...)
│   │   │   ├── design-system/                  # ⭐ DESIGN SYSTEM COMPLET
│   │   │   │   ├── index.ts
│   │   │   │   ├── tokens/
│   │   │   │   │   ├── colors.ts
│   │   │   │   │   ├── spacing.ts
│   │   │   │   │   ├── typography.ts
│   │   │   │   │   └── shadows.ts
│   │   │   │   ├── themes/
│   │   │   │   │   ├── light.ts
│   │   │   │   │   └── dark.ts
│   │   │   │   └── utils/
│   │   │   │       └── index.ts
│   │   │   ├── pricing-utils.ts                # Formatage prix, remises
│   │   │   ├── validation/                     # Zod schemas génériques
│   │   │   │   ├── form-security.ts
│   │   │   │   └── profile-validation.ts
│   │   │   ├── upload/                         # Upload images génériques
│   │   │   │   ├── image-optimization.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── upload-performance-monitor.ts
│   │   │   ├── analytics/                      # Analytics GDPR-friendly
│   │   │   │   ├── gdpr-analytics.ts
│   │   │   │   └── privacy.ts
│   │   │   └── logger.ts                       # Logger générique
│   │   │
│   │   ├── ⚠️ PARTAGEABLE AVEC ADAPTATION :
│   │   │   ├── supabase/                       # Client DB (à adapter par app)
│   │   │   │   ├── client.ts
│   │   │   │   ├── server.ts
│   │   │   │   └── types.ts
│   │   │   ├── auth/                           # Auth (à adapter)
│   │   │   │   └── session-config.ts
│   │   │   ├── export/                         # Export CSV (générique)
│   │   │   │   └── csv.ts
│   │   │   └── pdf-utils.ts                    # PDF génération (générique)
│   │   │
│   │   └── ❌ SPÉCIFIQUES BACK-OFFICE :
│   │       ├── abby/                           # Intégration Abby (comptabilité)
│   │       ├── google-merchant/                # Google Merchant Center
│   │       ├── qonto/                          # Intégration Qonto (banque)
│   │       ├── stock/                          # Business logic stocks
│   │       │   └── movement-mappers.ts
│   │       ├── business-rules/                 # Règles métier
│   │       │   └── naming-rules.ts
│   │       ├── actions/                        # Server Actions admin
│   │       │   └── user-management.ts
│   │       ├── validators/                     # Validateurs métier
│   │       │   └── order-status-validator.ts
│   │       ├── reports/                        # Rapports business
│   │       │   └── export-aging-report.ts
│   │       ├── monitoring/                     # Monitoring back-office
│   │       ├── middleware/                     # Middleware API
│   │       ├── mcp/                            # MCP Playwright integration
│   │       ├── security/                       # Security headers
│   │       ├── testing/                        # Tests spécifiques
│   │       ├── sku-generator.ts                # SKU business logic
│   │       ├── product-status-utils.ts         # Statuts produits
│   │       ├── stock-history.ts                # Historique stocks
│   │       ├── feature-flags.ts                # Feature flags
│   │       ├── deployed-modules.ts             # Modules actifs
│   │       └── theme-v2.ts                     # Theme spécifique (legacy)
│   │
│   └── types/                                  # ⚠️ MIXTE (11 fichiers)
│       ├── ✅ POTENTIELLEMENT PARTAGEABLES :
│       │   ├── business-rules.ts               # Types business génériques
│       │   ├── collections.ts                  # Collections produits
│       │   ├── room-types.ts                   # Types pièces (peut être partagé)
│       │   └── reception-shipment.ts           # Types logistique (peut être partagé)
│       │
│       └── ❌ SPÉCIFIQUES BACK-OFFICE :
│           ├── supabase.ts                     # Types DB Supabase (générés)
│           ├── supabase-generated.ts
│           ├── supabase-new.ts
│           ├── database.ts                     # Types DB custom
│           ├── database-old.ts
│           ├── variant-attributes-types.ts     # Variantes produits
│           └── variant-groups.ts
│
├── public/                                     # ✅ Assets (partageables sélectivement)
├── docs/                                       # ✅ Documentation (peut rester racine monorepo)
├── supabase/                                   # ❌ Migrations DB (back-office only)
├── scripts/                                    # ⚠️ Scripts build/validation (à adapter)
├── tests/                                      # ⚠️ Tests E2E (à organiser par app)
└── .claude/                                    # ✅ Config Claude (peut rester racine)
```

---

## 🎯 CLASSIFICATION PAR DOMAINE

### ✅ CODE 100% PARTAGEABLE (33% du code total)

#### A. Composants UI Génériques (54 composants)
**Destination** : `packages/shared/components/ui`

Tous les composants shadcn/ui + custom UI :
- accordion, alert, alert-dialog, badge, breadcrumb, button, calendar, card, checkbox, collapsible, combobox, command, command-palette, dialog, dropdown-menu, form, input, label, popover, progress, radio-group, scroll-area, select, separator, sidebar, skeleton, switch, table, tabs, textarea, tooltip
- Composants UI custom : action-button, activity-timeline, compact-kpi-card, data-status-badge, elegant-kpi-card, group-navigation, image-upload-zone, medium-kpi-card, notification-system, pagination, phase-indicator, quick-actions-list, role-badge, room-multi-select, stat-pill, tabs-navigation, verone-card, view-mode-toggle

**Caractéristiques** :
- Aucune dépendance Supabase
- Purement presentational
- Basés sur Radix UI + Tailwind
- Utilisent uniquement `@/lib/utils` (cn function)

#### B. Design System (42 fichiers tokens + themes)
**Destination** : `packages/shared/design-system`

```
packages/shared/design-system/
├── tokens/
│   ├── colors.ts           # Palette complète (primary, success, warning, danger, accent...)
│   ├── spacing.ts          # Espacements (xs → 5xl)
│   ├── typography.ts       # Typographie (font families, sizes, line-heights)
│   └── shadows.ts          # Ombres (sm, md, lg, xl)
├── themes/
│   ├── light.ts            # Thème clair
│   └── dark.ts             # Thème sombre
├── utils/
│   └── index.ts            # Utilitaires design system
└── index.ts                # Export centralisé
```

#### C. Hooks UI Génériques (~10 hooks)
**Destination** : `packages/shared/hooks`

- `use-toast.ts` : Toast notifications (100% client-side, aucune dépendance)
- `use-inline-edit.ts` : Édition inline générique
- `use-section-locking.ts` : Lock sections pour édition
- `use-image-upload.ts` : Upload images (à adapter pour supprimer dépendance Supabase)
- `use-logo-upload.ts` : Upload logos (à adapter)
- `use-simple-image-upload.ts` : Upload simplifié (à adapter)

#### D. Utilitaires Core (lib/utils.ts + helpers)
**Destination** : `packages/shared/utils`

**lib/utils.ts** (277 lignes) :
- `cn()` : Merge classes Tailwind
- `formatPrice()`, `formatPriceFromCents()` : Formatage prix euros
- `formatCurrency()` : Formatage devises multiples
- `formatDate()`, `formatDateShort()` : Formatage dates FR
- `formatWeight()` : Poids (kg/g)
- `formatDimensions()` : Dimensions produits
- `generateSKU()`, `validateSKU()` : SKU (peut être adapté)
- `generateSlug()` : Slugs URL-friendly
- `validateEmail()` : Validation email
- `calculateDiscountPercentage()`, `applyDiscount()` : Calculs remises
- `debounce()` : Debounce function
- `checkSLOCompliance()` : Validation performance (peut rester ou être adapté)

**Autres utils partageables** :
- `lib/pricing-utils.ts` : Calculs pricing (formatage, marges, remises)
- `lib/logger.ts` : Logger générique
- `lib/analytics/gdpr-analytics.ts` : Analytics GDPR-friendly
- `lib/analytics/privacy.ts` : Privacy helpers
- `lib/export/csv.ts` : Export CSV générique
- `lib/pdf-utils.ts` : Génération PDF (jsPDF)

#### E. Validation Générique
**Destination** : `packages/shared/validation`

- `lib/validation/form-security.ts` : Sanitization XSS
- `lib/validation/profile-validation.ts` : Schemas Zod profil utilisateur (adaptable)

#### F. Upload/Media Génériques
**Destination** : `packages/shared/upload`

- `lib/upload/image-optimization.ts` : Compression/resize images
- `lib/upload/validation.ts` : Validation fichiers (types, tailles)
- `lib/upload/upload-performance-monitor.ts` : Monitoring uploads

#### G. Providers Génériques
**Destination** : `packages/shared/providers`

- `components/providers/react-query-provider.tsx` : TanStack Query
- `components/providers/console-error-tracker-provider.tsx` : Error tracking
- `components/providers/activity-tracker-provider.tsx` : Activity tracking (à adapter)

#### H. Layout Génériques
**Destination** : `packages/shared/components/layout`

- `components/layout/public-layout.tsx` : Layout pages publiques
- `components/layout/page-header.tsx` : Header pages
- `components/layout/auth-wrapper.tsx` : Wrapper auth (à adapter)

---

### ⚠️ CODE SEMI-PARTAGEABLE (17% du code)

#### A. Composants Business Génériques (~50 composants)
**Destination** : `packages/shared/components/business`

Composants métier réutilisables entre back-office et website :

**Product-related** :
- `category-selector.tsx`, `category-hierarchy-selector.tsx` : Sélection catégories
- `stock-status-badge.tsx` : Badge statut stock (peut être simplifié pour website)
- `customer-badge.tsx` : Badge client
- `kpi-card.tsx` : Carte KPI générique

**Forms/Input** :
- `address-input.tsx` : Input adresse (réutilisable checkout website)
- `image-upload.tsx` : Upload image générique
- `color-material-selector.tsx` : Sélecteur couleur/matériau

**UI Business** :
- `heart-badge.tsx` : Badge favori
- `favorite-toggle-button.tsx` : Toggle favori (wishlist website)

**ATTENTION** : Ces composants ont des dépendances Supabase à extraire/adapter

#### B. Hooks Base Database (~3 hooks)
**Destination** : `packages/shared/hooks/database` (avec abstraction)

- `hooks/base/use-supabase-query.ts` : Query générique read-only
- `hooks/base/use-supabase-mutation.ts` : Mutation générique
- `hooks/base/use-supabase-crud.ts` : CRUD générique

**REFACTOR NÉCESSAIRE** : Abstraire la couche Supabase pour permettre utilisation avec d'autres backends

#### C. Types Business Partiels
**Destination** : `packages/shared/types`

- `types/business-rules.ts` : Règles business génériques
- `types/collections.ts` : Collections produits (peut être partagé pour website)
- `types/room-types.ts` : Types pièces (si website a besoin)

---

### ❌ CODE SPÉCIFIQUE BACK-OFFICE (50% du code)

#### A. Pages App Router (100% back-office)
**Destination** : `packages/apps/backoffice/src/app`

Toutes les routes admin/gestion (72 pages) :
- `/admin/*` : Gestion utilisateurs, activité
- `/canaux-vente/*` : Google Merchant, prix clients
- `/commandes/*` : Commandes clients/fournisseurs
- `/consultations/*` : Consultations clients
- `/contacts-organisations/*` : CRM
- `/dashboard/*` : Dashboard analytics
- `/factures/*` : Facturation
- `/finance/*` : Finance/comptabilité
- `/notifications/*` : Notifications back-office
- `/organisation/*` : Gestion organisation
- `/parametres/*` : Paramètres
- `/produits/*` : Catalogue produits, sourcing
- `/stocks/*` : Gestion stocks (alertes, mouvements, inventaire)
- `/tresorerie/*` : Trésorerie
- `/ventes/*` : Ventes

#### B. Composants Business Admin (~152 composants)
**Destination** : `packages/apps/backoffice/src/components/business`

Composants spécifiques gestion/admin :
- `abc-analysis-view.tsx`, `aging-report-view.tsx` : Analyses
- `inventory-adjustment-modal.tsx` : Ajustements inventaire
- `movements-table.tsx`, `movements-filters.tsx` : Mouvements stocks
- `order-detail-modal.tsx`, `order-items-table.tsx` : Gestion commandes
- `bug-reporter.tsx`, `error-report-modal.tsx` : Reporting erreurs
- `organisation-*` : Gestion organisations (15+ composants)
- `consultation-*` : Consultations (10+ composants)
- `financial-*` : Finance (5+ composants)
- Tous modaux/forms admin (50+ composants)

#### C. Hooks Métier Admin (~80 hooks)
**Destination** : `packages/apps/backoffice/src/hooks`

Hooks spécifiques à la gestion back-office :
- `use-products.ts`, `use-catalogue.ts` : Gestion catalogue admin
- `use-stock*.ts` (12 hooks) : Stocks, mouvements, alertes, inventaire
- `use-*-orders.ts` : Commandes (purchase, sales, draft)
- `use-organisations.ts`, `use-suppliers.ts`, `use-customers.ts` : CRM
- `use-dashboard-*.ts` : Métriques dashboard admin
- `hooks/metrics/*` : Analytics (6 hooks)
- `hooks/google-merchant/*` : Google Merchant (4 hooks)
- `use-consultations.ts`, `use-bank-reconciliation.ts`, etc.

#### D. Lib Métier Admin
**Destination** : `packages/apps/backoffice/src/lib`

- `lib/abby/*` : Intégration comptabilité Abby
- `lib/google-merchant/*` : Google Merchant Center (6 fichiers)
- `lib/qonto/*` : Intégration banque Qonto (5 fichiers)
- `lib/stock/*` : Business logic stocks
- `lib/business-rules/*` : Règles métier
- `lib/actions/user-management.ts` : Server Actions admin
- `lib/validators/order-status-validator.ts` : Validateurs métier
- `lib/reports/*` : Rapports business
- `lib/monitoring/*` : Monitoring back-office
- `lib/middleware/*` : Middleware API
- `lib/mcp/*` : MCP integration
- `lib/security/*` : Security headers
- `lib/sku-generator.ts` : Générateur SKU
- `lib/product-status-utils.ts` : Statuts produits
- `lib/stock-history.ts` : Historique stocks
- `lib/feature-flags.ts` : Feature flags
- `lib/deployed-modules.ts` : Modules actifs
- `lib/theme-v2.ts` : Theme legacy

#### E. Types Database Spécifiques
**Destination** : `packages/apps/backoffice/src/types`

- `types/supabase*.ts` : Types générés Supabase (4 fichiers)
- `types/database*.ts` : Types DB custom (2 fichiers)
- `types/variant-*.ts` : Variantes produits (2 fichiers)

---

## 🏗️ ARBORESCENCE CIBLE MONOREPO

```
verone-monorepo/
├── packages/
│   ├── apps/
│   │   ├── backoffice/                         # ❌ App back-office actuelle
│   │   │   ├── src/
│   │   │   │   ├── app/                        # 72 pages admin/gestion
│   │   │   │   │   ├── (auth)/
│   │   │   │   │   ├── admin/
│   │   │   │   │   ├── canaux-vente/
│   │   │   │   │   ├── commandes/
│   │   │   │   │   ├── consultations/
│   │   │   │   │   ├── contacts-organisations/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── factures/
│   │   │   │   │   ├── finance/
│   │   │   │   │   ├── notifications/
│   │   │   │   │   ├── organisation/
│   │   │   │   │   ├── parametres/
│   │   │   │   │   ├── produits/
│   │   │   │   │   ├── stocks/
│   │   │   │   │   ├── tresorerie/
│   │   │   │   │   └── ventes/
│   │   │   │   │
│   │   │   │   ├── components/
│   │   │   │   │   ├── business/              # 152 composants admin
│   │   │   │   │   ├── forms/                 # Forms spécifiques
│   │   │   │   │   ├── layout/                # Layouts admin (sidebar, header)
│   │   │   │   │   ├── admin/                 # Composants admin
│   │   │   │   │   └── testing/               # Tests components
│   │   │   │   │
│   │   │   │   ├── hooks/                     # 80 hooks métier
│   │   │   │   │   ├── metrics/               # Analytics hooks
│   │   │   │   │   ├── google-merchant/       # Google Merchant hooks
│   │   │   │   │   └── use-*.ts               # Hooks business
│   │   │   │   │
│   │   │   │   ├── lib/                       # Lib spécifique back-office
│   │   │   │   │   ├── abby/                  # Intégration Abby
│   │   │   │   │   ├── google-merchant/       # Google Merchant
│   │   │   │   │   ├── qonto/                 # Intégration Qonto
│   │   │   │   │   ├── stock/                 # Business logic stocks
│   │   │   │   │   ├── business-rules/        # Règles métier
│   │   │   │   │   ├── actions/               # Server Actions
│   │   │   │   │   ├── validators/            # Validateurs métier
│   │   │   │   │   ├── reports/               # Rapports
│   │   │   │   │   ├── monitoring/            # Monitoring
│   │   │   │   │   ├── middleware/            # Middleware API
│   │   │   │   │   ├── mcp/                   # MCP integration
│   │   │   │   │   ├── security/              # Security
│   │   │   │   │   └── *.ts                   # Utils spécifiques
│   │   │   │   │
│   │   │   │   └── types/                     # Types spécifiques
│   │   │   │       ├── supabase*.ts           # Types DB (générés)
│   │   │   │       ├── database*.ts           # Types DB custom
│   │   │   │       └── *.ts                   # Types métier
│   │   │   │
│   │   │   ├── public/                        # Assets back-office
│   │   │   ├── supabase/                      # Migrations DB
│   │   │   ├── package.json                   # Dependencies back-office
│   │   │   ├── next.config.js
│   │   │   ├── tailwind.config.ts
│   │   │   └── tsconfig.json
│   │   │
│   │   └── website/                            # 🆕 Site public (futur)
│   │       ├── src/
│   │       │   ├── app/
│   │       │   │   ├── (public)/
│   │       │   │   │   ├── /                  # Homepage
│   │       │   │   │   ├── produits/          # Catalogue public
│   │       │   │   │   ├── collections/       # Collections
│   │       │   │   │   ├── a-propos/          # À propos
│   │       │   │   │   └── contact/           # Contact
│   │       │   │   └── (checkout)/
│   │       │   │       ├── panier/            # Panier
│   │       │   │       ├── commande/          # Tunnel commande
│   │       │   │       └── confirmation/      # Confirmation
│   │       │   │
│   │       │   ├── components/                # Composants spécifiques website
│   │       │   │   ├── product/               # Product display
│   │       │   │   ├── cart/                  # Panier
│   │       │   │   ├── checkout/              # Checkout
│   │       │   │   └── navigation/            # Nav publique
│   │       │   │
│   │       │   ├── hooks/                     # Hooks website
│   │       │   │   ├── use-cart.ts
│   │       │   │   ├── use-public-products.ts
│   │       │   │   └── use-checkout.ts
│   │       │   │
│   │       │   └── lib/                       # Utils website
│   │       │       ├── cart-utils.ts
│   │       │       └── checkout-utils.ts
│   │       │
│   │       ├── package.json
│   │       ├── next.config.js
│   │       ├── tailwind.config.ts
│   │       └── tsconfig.json
│   │
│   └── shared/                                 # ✅ Code partagé
│       ├── components/
│       │   ├── ui/                            # 54 composants shadcn/ui
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── form.tsx
│       │   │   ├── input.tsx
│       │   │   ├── select.tsx
│       │   │   ├── table.tsx
│       │   │   └── ... (tous shadcn/ui)
│       │   │   └── index.ts                   # Barrel export
│       │   │
│       │   ├── business/                      # ~50 composants métier génériques
│       │   │   ├── address-input.tsx
│       │   │   ├── category-selector.tsx
│       │   │   ├── stock-status-badge.tsx
│       │   │   ├── customer-badge.tsx
│       │   │   ├── image-upload.tsx
│       │   │   ├── kpi-card.tsx
│       │   │   ├── favorite-toggle-button.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── layout/                        # Layouts génériques
│       │   │   ├── public-layout.tsx
│       │   │   ├── page-header.tsx
│       │   │   ├── auth-wrapper.tsx
│       │   │   └── index.ts
│       │   │
│       │   └── providers/                     # Providers génériques
│       │       ├── react-query-provider.tsx
│       │       ├── console-error-tracker.tsx
│       │       └── index.ts
│       │
│       ├── design-system/                     # Design System V2
│       │   ├── tokens/
│       │   │   ├── colors.ts
│       │   │   ├── spacing.ts
│       │   │   ├── typography.ts
│       │   │   └── shadows.ts
│       │   ├── themes/
│       │   │   ├── light.ts
│       │   │   └── dark.ts
│       │   ├── utils/
│       │   │   └── index.ts
│       │   └── index.ts
│       │
│       ├── hooks/                             # Hooks génériques
│       │   ├── ui/
│       │   │   ├── use-toast.ts
│       │   │   ├── use-inline-edit.ts
│       │   │   └── use-section-locking.ts
│       │   ├── database/                      # Hooks DB abstraits
│       │   │   ├── use-query.ts               # Abstraction query
│       │   │   ├── use-mutation.ts            # Abstraction mutation
│       │   │   └── use-crud.ts                # Abstraction CRUD
│       │   ├── upload/
│       │   │   ├── use-image-upload.ts
│       │   │   └── use-logo-upload.ts
│       │   └── index.ts
│       │
│       ├── utils/                             # Utilitaires core
│       │   ├── cn.ts                          # Tailwind merge
│       │   ├── formatters.ts                  # Prix, dates, poids...
│       │   │   ├── formatPrice()
│       │   │   ├── formatCurrency()
│       │   │   ├── formatDate()
│       │   │   ├── formatWeight()
│       │   │   └── formatDimensions()
│       │   ├── validators.ts                  # Validations génériques
│       │   │   ├── validateEmail()
│       │   │   └── validateSKU()
│       │   ├── slugs.ts                       # Génération slugs
│       │   │   └── generateSlug()
│       │   ├── pricing.ts                     # Calculs pricing
│       │   │   ├── calculateDiscountPercentage()
│       │   │   ├── applyDiscount()
│       │   │   └── calculateMinimumSellingPrice()
│       │   ├── performance.ts                 # Performance utils
│       │   │   ├── debounce()
│       │   │   └── checkSLOCompliance()
│       │   └── index.ts                       # Re-exports
│       │
│       ├── validation/                        # Validation Zod
│       │   ├── form-security.ts
│       │   ├── profile-validation.ts
│       │   └── index.ts
│       │
│       ├── upload/                            # Upload/Media
│       │   ├── image-optimization.ts
│       │   ├── validation.ts
│       │   ├── performance-monitor.ts
│       │   └── index.ts
│       │
│       ├── analytics/                         # Analytics GDPR
│       │   ├── gdpr-analytics.ts
│       │   ├── privacy.ts
│       │   └── index.ts
│       │
│       ├── export/                            # Export données
│       │   ├── csv.ts
│       │   ├── pdf.ts
│       │   └── index.ts
│       │
│       ├── types/                             # Types partagés
│       │   ├── business-rules.ts
│       │   ├── collections.ts
│       │   ├── common.ts
│       │   └── index.ts
│       │
│       ├── logger/                            # Logger
│       │   ├── logger.ts
│       │   └── index.ts
│       │
│       └── package.json                       # Dependencies partagées
│
├── docs/                                       # Documentation (racine)
├── .claude/                                    # Config Claude (racine)
├── pnpm-workspace.yaml                         # Config workspace
├── turbo.json                                  # Config Turborepo
├── package.json                                # Root package
└── README.md                                   # README monorepo
```

---

## 📋 MAPPING FICHIER PAR FICHIER (Extrait représentatif)

### Composants UI (54 fichiers)

| Fichier Actuel | Fichier Cible | Raison |
|---------------|---------------|--------|
| `src/components/ui/button.tsx` | `packages/shared/components/ui/button.tsx` | Composant UI pur shadcn/ui |
| `src/components/ui/card.tsx` | `packages/shared/components/ui/card.tsx` | Composant UI pur |
| `src/components/ui/dialog.tsx` | `packages/shared/components/ui/dialog.tsx` | Composant UI pur |
| `src/components/ui/form.tsx` | `packages/shared/components/ui/form.tsx` | Composant UI pur |
| `src/components/ui/input.tsx` | `packages/shared/components/ui/input.tsx` | Composant UI pur |
| `src/components/ui/select.tsx` | `packages/shared/components/ui/select.tsx` | Composant UI pur |
| ... (tous les 54 composants UI) | `packages/shared/components/ui/*.tsx` | 100% partageables |

### Design System (6 fichiers)

| Fichier Actuel | Fichier Cible | Raison |
|---------------|---------------|--------|
| `src/lib/design-system/tokens/colors.ts` | `packages/shared/design-system/tokens/colors.ts` | Tokens couleurs |
| `src/lib/design-system/tokens/spacing.ts` | `packages/shared/design-system/tokens/spacing.ts` | Tokens espacements |
| `src/lib/design-system/tokens/typography.ts` | `packages/shared/design-system/tokens/typography.ts` | Tokens typo |
| `src/lib/design-system/tokens/shadows.ts` | `packages/shared/design-system/tokens/shadows.ts` | Tokens ombres |
| `src/lib/design-system/themes/light.ts` | `packages/shared/design-system/themes/light.ts` | Thème clair |
| `src/lib/design-system/themes/dark.ts` | `packages/shared/design-system/themes/dark.ts` | Thème sombre |

### Utils Core

| Fichier Actuel | Fichier Cible | Action Nécessaire |
|---------------|---------------|-------------------|
| `src/lib/utils.ts` | `packages/shared/utils/index.ts` | **REFACTOR** : Splitter en modules |
| → `cn()` | `packages/shared/utils/cn.ts` | Extraire fonction CN |
| → `formatPrice()`, etc. | `packages/shared/utils/formatters.ts` | Extraire formatters |
| → `validateEmail()`, etc. | `packages/shared/utils/validators.ts` | Extraire validators |
| → `generateSlug()` | `packages/shared/utils/slugs.ts` | Extraire slugs |
| → `calculateDiscount*()` | `packages/shared/utils/pricing.ts` | Extraire pricing |
| → `debounce()` | `packages/shared/utils/performance.ts` | Extraire performance |

### Hooks

| Fichier Actuel | Fichier Cible | Action Nécessaire |
|---------------|---------------|-------------------|
| `src/hooks/use-toast.ts` | `packages/shared/hooks/ui/use-toast.ts` | **DIRECT** : Aucune modif |
| `src/hooks/base/use-supabase-query.ts` | `packages/shared/hooks/database/use-query.ts` | **REFACTOR** : Abstraire Supabase |
| `src/hooks/use-products.ts` | `packages/apps/backoffice/src/hooks/use-products.ts` | **MOVE** : Spécifique back-office |
| `src/hooks/use-stock.ts` | `packages/apps/backoffice/src/hooks/use-stock.ts` | **MOVE** : Spécifique back-office |

### Composants Business

| Fichier Actuel | Fichier Cible | Action Nécessaire |
|---------------|---------------|-------------------|
| `src/components/business/stock-status-badge.tsx` | `packages/shared/components/business/stock-status-badge.tsx` | **ADAPT** : Supprimer dépendances Supabase |
| `src/components/business/address-input.tsx` | `packages/shared/components/business/address-input.tsx` | **ADAPT** : Généraliser pour checkout |
| `src/components/business/category-selector.tsx` | `packages/shared/components/business/category-selector.tsx` | **REFACTOR** : Abstraire data fetching |
| `src/components/business/abc-analysis-view.tsx` | `packages/apps/backoffice/src/components/business/abc-analysis-view.tsx` | **MOVE** : Admin only |
| `src/components/business/inventory-adjustment-modal.tsx` | `packages/apps/backoffice/src/components/business/inventory-adjustment-modal.tsx` | **MOVE** : Admin only |

### Pages

| Fichier Actuel | Fichier Cible | Action |
|---------------|---------------|--------|
| `src/app/dashboard/page.tsx` | `packages/apps/backoffice/src/app/dashboard/page.tsx` | **MOVE** |
| `src/app/produits/catalogue/page.tsx` | `packages/apps/backoffice/src/app/produits/catalogue/page.tsx` | **MOVE** |
| `src/app/stocks/alertes/page.tsx` | `packages/apps/backoffice/src/app/stocks/alertes/page.tsx` | **MOVE** |
| ... (toutes les 72 pages) | `packages/apps/backoffice/src/app/**/*.tsx` | **MOVE** |

---

## 🔧 REFACTORS NÉCESSAIRES

### 1. Abstraire la Couche Database

**Problème** : Les hooks base (`use-supabase-query`, `use-supabase-mutation`) sont couplés à Supabase.

**Solution** : Créer une abstraction générique permettant de changer de backend.

**Avant** (`src/hooks/base/use-supabase-query.ts`) :
```typescript
import { createClient } from '@/lib/supabase/client';

export function useSupabaseQuery<T>(options: QueryOptions<T>) {
  const supabase = createClient();
  
  const fetch = async () => {
    let query = supabase.from(options.tableName).select('*');
    // ...
  };
}
```

**Après** (`packages/shared/hooks/database/use-query.ts`) :
```typescript
import { DatabaseClient } from '@/types/database';

export function useQuery<T>(
  client: DatabaseClient,
  options: QueryOptions<T>
) {
  const fetch = async () => {
    const result = await client.query(options);
    // ...
  };
}
```

**Usage** :
```typescript
// Dans backoffice
import { useQuery } from '@verone/shared/hooks/database';
import { supabaseClient } from './lib/supabase';

const { data } = useQuery(supabaseClient, { table: 'products' });

// Dans website (si autre DB)
import { useQuery } from '@verone/shared/hooks/database';
import { apiClient } from './lib/api';

const { data } = useQuery(apiClient, { endpoint: '/products' });
```

### 2. Splitter lib/utils.ts

**Problème** : Fichier monolithique 277 lignes mêlant formatters, validators, pricing...

**Solution** : Splitter en modules thématiques.

**Structure cible** :
```typescript
packages/shared/utils/
├── cn.ts                      // cn() uniquement
├── formatters.ts              // formatPrice, formatDate, formatWeight...
├── validators.ts              // validateEmail, validateSKU...
├── slugs.ts                   // generateSlug
├── pricing.ts                 // calculateDiscount, applyDiscount...
├── performance.ts             // debounce, checkSLOCompliance
└── index.ts                   // Re-exports
```

**Exemple** (`packages/shared/utils/formatters.ts`) :
```typescript
/**
 * Formate un prix en euros avec devise
 */
export function formatPrice(priceInEuros: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(priceInEuros)
}

/**
 * Formate un prix stocké en centimes
 */
export function formatPriceFromCents(priceInCents: number): string {
  return formatPrice(priceInCents / 100)
}

// ... autres formatters
```

### 3. Adapter Composants Business pour Partage

**Problème** : Composants comme `stock-status-badge.tsx` utilisent `@/components/ui/badge` (import absolu).

**Solution** : Utiliser imports relatifs depuis shared ou exports du package.

**Avant** :
```typescript
import { Badge } from '@/components/ui/badge'
```

**Après** (option 1 - imports package) :
```typescript
import { Badge } from '@verone/shared/components/ui'
```

**Après** (option 2 - imports relatifs) :
```typescript
import { Badge } from '../ui/badge'
```

### 4. Extraire Types Business Partagés

**Problème** : Types mélangés entre DB spécifiques et business génériques.

**Solution** : Séparer types DB (back-office only) et types business (partageables).

**Structure cible** :
```typescript
packages/shared/types/
├── product.ts                 // Type Product générique (sans DB specifics)
├── category.ts                // Type Category
├── collection.ts              // Type Collection
├── customer.ts                // Type Customer (pour checkout website)
├── order.ts                   // Type Order (pour commandes publiques)
└── index.ts

packages/apps/backoffice/src/types/
├── supabase.ts                // Types DB Supabase (générés)
├── database.ts                // Types DB custom
└── admin.ts                   // Types admin spécifiques
```

### 5. Créer Barrel Exports

**Problème** : Imports individuels fastidieux.

**Solution** : Créer `index.ts` dans chaque package/module.

**Exemple** (`packages/shared/components/ui/index.ts`) :
```typescript
// Barrel export pour tous les composants UI
export { Button } from './button'
export { Card, CardHeader, CardTitle, CardContent } from './card'
export { Dialog, DialogTrigger, DialogContent } from './dialog'
export { Form, FormField, FormItem, FormLabel } from './form'
export { Input } from './input'
export { Select } from './select'
// ... tous les composants

// Usage simplifié :
import { Button, Card, Dialog } from '@verone/shared/components/ui'
```

---

## 📦 PLAN DE MIGRATION PAR PHASES

### PHASE 0 : PRÉPARATION (1 semaine)

**Objectifs** :
- Créer structure monorepo vide
- Configurer outils (pnpm, Turborepo)
- Valider build système

**Actions** :
1. Créer dossier `verone-monorepo/`
2. Initialiser workspace pnpm :
   ```bash
   pnpm init
   ```
3. Créer `pnpm-workspace.yaml` :
   ```yaml
   packages:
     - 'packages/*'
     - 'packages/apps/*'
     - 'packages/shared/*'
   ```
4. Créer `turbo.json` :
   ```json
   {
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": [".next/**", "dist/**"]
       },
       "dev": {
         "cache": false
       },
       "lint": {},
       "type-check": {}
     }
   }
   ```
5. Créer structure packages vide :
   ```bash
   mkdir -p packages/apps/backoffice
   mkdir -p packages/apps/website
   mkdir -p packages/shared/{components,hooks,utils,design-system,types}
   ```
6. Tests build vide OK

**Livrables** :
- Structure monorepo créée
- Workspace pnpm configuré
- Turborepo configuré
- Build système validé

---

### PHASE 1 : MIGRATION DESIGN SYSTEM & UTILS (2 semaines)

**Objectifs** :
- Migrer Design System complet
- Migrer tous utils (formatters, validators...)
- Créer package `@verone/shared`

**Actions** :

**1.1. Créer package shared (Jour 1-2)**
```bash
cd packages/shared
pnpm init --scope @verone
```

`packages/shared/package.json` :
```json
{
  "name": "@verone/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    "./components/ui": "./dist/components/ui/index.js",
    "./components/business": "./dist/components/business/index.js",
    "./design-system": "./dist/design-system/index.js",
    "./hooks": "./dist/hooks/index.js",
    "./utils": "./dist/utils/index.js"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "react": "18.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

**1.2. Migrer Design System (Jour 3-5)**
1. Copier `src/lib/design-system/` → `packages/shared/design-system/`
2. Vérifier imports
3. Créer `packages/shared/design-system/index.ts` (barrel export)
4. Build + tests

**1.3. Migrer & Splitter lib/utils.ts (Jour 6-8)**
1. Créer modules :
   - `packages/shared/utils/cn.ts`
   - `packages/shared/utils/formatters.ts`
   - `packages/shared/utils/validators.ts`
   - `packages/shared/utils/slugs.ts`
   - `packages/shared/utils/pricing.ts`
   - `packages/shared/utils/performance.ts`
2. Créer `packages/shared/utils/index.ts` (re-exports)
3. Tests unitaires pour chaque module
4. Build + validation

**1.4. Migrer autres utils (Jour 9-10)**
1. Copier `src/lib/pricing-utils.ts` → `packages/shared/utils/pricing.ts` (merge)
2. Copier `src/lib/logger.ts` → `packages/shared/logger/`
3. Copier `src/lib/analytics/` → `packages/shared/analytics/`
4. Copier `src/lib/export/csv.ts` → `packages/shared/export/`
5. Copier `src/lib/pdf-utils.ts` → `packages/shared/export/pdf.ts`
6. Copier `src/lib/upload/` → `packages/shared/upload/`
7. Copier `src/lib/validation/` → `packages/shared/validation/`

**Livrables** :
- Package `@verone/shared` créé
- Design System migré
- Utils refactorés et splittés
- Tests unitaires OK
- Documentation usage

---

### PHASE 2 : MIGRATION COMPOSANTS UI (2 semaines)

**Objectifs** :
- Migrer tous composants shadcn/ui (54)
- Migrer composants UI-v2 (4)
- Migrer providers (3)
- Créer barrel exports

**Actions** :

**2.1. Migrer composants UI shadcn (Jour 1-7)**
1. Créer `packages/shared/components/ui/`
2. Copier les 54 composants :
   ```bash
   cp -r src/components/ui/*.tsx packages/shared/components/ui/
   ```
3. Mettre à jour imports :
   - Remplacer `@/lib/utils` → `@verone/shared/utils`
   - Remplacer `@/lib/design-system` → `@verone/shared/design-system`
4. Créer `packages/shared/components/ui/index.ts` (barrel export)
5. Tests chaque composant (Storybook)

**2.2. Migrer composants UI-v2 (Jour 8)**
1. Copier `src/components/ui-v2/stock/` → `packages/shared/components/ui-v2/stock/`
2. Vérifier dépendances
3. Barrel export

**2.3. Migrer providers (Jour 9)**
1. Copier `src/components/providers/` → `packages/shared/providers/`
2. Adapter imports
3. Barrel export

**2.4. Documentation & Storybook (Jour 10)**
1. Documenter chaque composant (JSDoc)
2. Créer stories Storybook
3. Générer documentation auto

**Livrables** :
- 54 composants UI migrés
- 4 composants UI-v2 migrés
- 3 providers migrés
- Storybook configuré
- Documentation complète

---

### PHASE 3 : MIGRATION HOOKS (2 semaines)

**Objectifs** :
- Migrer hooks UI génériques (10)
- Abstraire hooks database (3)
- Créer hooks upload (3)

**Actions** :

**3.1. Migrer hooks UI (Jour 1-3)**
1. Créer `packages/shared/hooks/ui/`
2. Copier hooks :
   - `use-toast.ts` (DIRECT)
   - `use-inline-edit.ts`
   - `use-section-locking.ts`
3. Barrel export

**3.2. Abstraire hooks database (Jour 4-8)**
1. Créer `packages/shared/hooks/database/`
2. Créer abstraction :
   ```typescript
   // packages/shared/hooks/database/types.ts
   export interface DatabaseClient {
     query<T>(options: QueryOptions<T>): Promise<T[]>
     mutate<T>(options: MutationOptions<T>): Promise<T>
   }
   ```
3. Refactorer hooks :
   - `use-supabase-query.ts` → `use-query.ts` (abstrait)
   - `use-supabase-mutation.ts` → `use-mutation.ts` (abstrait)
   - `use-supabase-crud.ts` → `use-crud.ts` (abstrait)
4. Tests avec mock client

**3.3. Migrer hooks upload (Jour 9-10)**
1. Créer `packages/shared/hooks/upload/`
2. Adapter hooks (supprimer dépendances Supabase directes) :
   - `use-image-upload.ts`
   - `use-logo-upload.ts`
   - `use-simple-image-upload.ts`
3. Utiliser abstraction storage générique

**Livrables** :
- 10 hooks UI migrés
- 3 hooks database abstraits
- 3 hooks upload migrés
- Tests unitaires OK
- Documentation

---

### PHASE 4 : MIGRATION COMPOSANTS BUSINESS PARTAGEABLES (3 semaines)

**Objectifs** :
- Identifier composants business réutilisables (~50)
- Refactorer pour supprimer couplages
- Migrer vers `packages/shared/components/business/`

**Actions** :

**4.1. Audit composants business (Jour 1-2)**
1. Liste exhaustive des 202 composants business
2. Classification :
   - ✅ PARTAGEABLE : Générique, utilisable website
   - ❌ BACK-OFFICE ONLY : Admin, gestion, analytics
3. Priorisation par criticité

**4.2. Refactor composants ciblés (Jour 3-12)**

**Exemples de refactors** :

**`address-input.tsx`** :
- **Avant** : Utilise `createClient()` Supabase
- **Après** : Props `onSave` callback, parent gère DB
```typescript
// Avant
const handleSave = async () => {
  const supabase = createClient()
  await supabase.from('addresses').insert(data)
}

// Après
interface AddressInputProps {
  onSave: (data: AddressData) => Promise<void>
}

const handleSave = async () => {
  await onSave(data)
}
```

**`category-selector.tsx`** :
- **Avant** : Fetch catégories via hook Supabase
- **Après** : Props `categories` + `onSelect`
```typescript
// Avant
const { data: categories } = useCategories()

// Après
interface CategorySelectorProps {
  categories: Category[]
  onSelect: (categoryId: string) => void
}
```

**4.3. Migration vers shared (Jour 13-15)**
1. Copier composants refactorés → `packages/shared/components/business/`
2. Créer barrel exports
3. Tests avec mock data
4. Storybook

**Livrables** :
- ~50 composants business migrés
- Tous découplés de Supabase
- Tests + Storybook
- Documentation usage

---

### PHASE 5 : MIGRATION APP BACK-OFFICE (2 semaines)

**Objectifs** :
- Migrer toute l'app back-office actuelle
- Mettre à jour imports vers packages shared
- Vérifier build + fonctionnement

**Actions** :

**5.1. Créer structure app backoffice (Jour 1)**
1. Créer `packages/apps/backoffice/`
2. Initialiser package.json :
   ```json
   {
     "name": "@verone/backoffice",
     "version": "1.0.0",
     "dependencies": {
       "@verone/shared": "workspace:*",
       "next": "^15.2.2",
       "@supabase/supabase-js": "^2.57.4"
     }
   }
   ```
3. Copier configs :
   - `next.config.js`
   - `tailwind.config.ts`
   - `tsconfig.json`

**5.2. Migrer code back-office (Jour 2-5)**
1. Copier :
   - `src/app/` → `packages/apps/backoffice/src/app/`
   - `src/components/business/` (spécifiques) → `packages/apps/backoffice/src/components/business/`
   - `src/components/admin/` → `packages/apps/backoffice/src/components/admin/`
   - `src/hooks/` (spécifiques) → `packages/apps/backoffice/src/hooks/`
   - `src/lib/` (spécifiques) → `packages/apps/backoffice/src/lib/`
   - `src/types/` → `packages/apps/backoffice/src/types/`
2. Copier autres :
   - `supabase/` → `packages/apps/backoffice/supabase/`
   - `public/` → `packages/apps/backoffice/public/`

**5.3. Mettre à jour tous les imports (Jour 6-8)**

**Avant** :
```typescript
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
```

**Après** :
```typescript
import { Button } from '@verone/shared/components/ui'
import { formatPrice } from '@verone/shared/utils'
import { useToast } from '@verone/shared/hooks'
```

**Script automatisé** :
```bash
# Remplacer tous imports UI
find packages/apps/backoffice/src -type f -name "*.tsx" -exec sed -i '' 's|@/components/ui/|@verone/shared/components/ui/|g' {} +

# Remplacer imports utils
find packages/apps/backoffice/src -type f -name "*.ts" -exec sed -i '' 's|@/lib/utils|@verone/shared/utils|g' {} +

# Remplacer imports hooks
find packages/apps/backoffice/src -type f -name "*.ts" -exec sed -i '' 's|@/hooks/use-toast|@verone/shared/hooks/ui/use-toast|g' {} +
```

**5.4. Tests build & fonctionnel (Jour 9-10)**
1. Build app :
   ```bash
   cd packages/apps/backoffice
   pnpm build
   ```
2. Tests critiques (login, dashboard, catalogue)
3. Tests console = 0 errors (RÈGLE SACRÉE)
4. Tests E2E Playwright (20 tests critiques)
5. Fix erreurs éventuelles

**Livrables** :
- App back-office migrée
- Build successful
- Tests critiques OK
- Console 0 errors
- Documentation migration

---

### PHASE 6 : PRÉPARATION APP WEBSITE (1 semaine - optionnel)

**Objectifs** :
- Créer squelette app website
- Utiliser packages shared
- Valider réutilisation composants

**Actions** :

**6.1. Créer structure website (Jour 1-2)**
1. Créer `packages/apps/website/`
2. Initialiser Next.js :
   ```bash
   cd packages/apps/website
   pnpm create next-app . --typescript --tailwind --app
   ```
3. Configurer package.json :
   ```json
   {
     "name": "@verone/website",
     "dependencies": {
       "@verone/shared": "workspace:*"
     }
   }
   ```

**6.2. Créer pages de démonstration (Jour 3-5)**
1. Homepage :
   - Utilise `Button` from shared
   - Utilise `Card` from shared
2. Page produits :
   - Utilise `category-selector` from shared
   - Utilise `formatPrice` from shared
3. Page panier :
   - Utilise `address-input` from shared
   - Crée `use-cart.ts` (nouveau hook)

**Livrables** :
- App website créée
- Démonstration réutilisation shared
- Build OK

---

## 🚨 POINTS D'ATTENTION & RISQUES

### 1. Dépendances Circulaires

**Risque** : Packages shared importent entre eux créant cycles.

**Solution** :
- Architecture stricte : `utils` → `hooks` → `components`
- Validation avec `madge --circular`

### 2. Couplage Supabase

**Risque** : Beaucoup de composants/hooks couplés à Supabase.

**Solution** :
- Abstraire couche DB (Phase 3)
- Props callbacks pour data fetching
- Tests avec mock data

### 3. Performance Build

**Risque** : Monorepo ralentit builds.

**Solution** :
- Turborepo cache
- Builds incrémentaux
- CI/CD optimisé

### 4. Breaking Changes

**Risque** : Migration casse fonctionnalités existantes.

**Solution** :
- Tests E2E exhaustifs après chaque phase
- Console 0 errors (RÈGLE SACRÉE)
- Rollback plan par phase

### 5. Import Paths

**Risque** : Confusion imports relatifs vs packages.

**Solution** :
- Convention stricte :
  - Shared : `@verone/shared/*`
  - Internal : Imports relatifs `../`
- Linter rules

---

## 📚 CONVENTIONS & PATTERNS

### 1. Naming Packages

```
@verone/shared          # Code partagé
@verone/backoffice      # App back-office
@verone/website         # App website (futur)
```

### 2. Structure Exports

**Barrel Exports (index.ts)** :
```typescript
// packages/shared/components/ui/index.ts
export { Button } from './button'
export { Card } from './card'
export { Dialog } from './dialog'
// ...

// Usage
import { Button, Card, Dialog } from '@verone/shared/components/ui'
```

### 3. Documentation Composants

**JSDoc obligatoire** :
```typescript
/**
 * Button - Composant bouton moderne Design System V2
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Cliquer ici
 * </Button>
 * ```
 *
 * @param variant - Style visuel (primary, secondary, outline...)
 * @param size - Taille (xs, sm, md, lg, xl)
 */
export function Button({ variant, size, ...props }: ButtonProps) {
  // ...
}
```

### 4. Tests Obligatoires

**Chaque module partagé = tests unitaires** :
```typescript
// packages/shared/utils/formatters.test.ts
import { formatPrice } from './formatters'

describe('formatPrice', () => {
  it('formate prix euros correctement', () => {
    expect(formatPrice(149.90)).toBe('149,90 €')
  })
})
```

---

## 📊 RÉSUMÉ STATISTIQUES MIGRATION

### Répartition Code par Destination

| Destination | Fichiers | % Total | LOC | Actions |
|-------------|----------|---------|-----|---------|
| **packages/shared/** | ~200 | **33%** | ~60k | Migrer + Refactor |
| **packages/apps/backoffice/** | ~300 | **50%** | ~90k | Migrer + Update imports |
| **packages/apps/website/** | ~0 | **0%** | ~0 | Créer (futur) |
| **Supprimer** | ~100 | **17%** | ~30k | Cleanup (duplicates, legacy) |

### Temps Estimé par Phase

| Phase | Durée | Complexité | Risque |
|-------|-------|------------|--------|
| Phase 0 : Préparation | 1 semaine | Faible | Faible |
| Phase 1 : Design System & Utils | 2 semaines | Moyenne | Faible |
| Phase 2 : Composants UI | 2 semaines | Faible | Faible |
| Phase 3 : Hooks | 2 semaines | **Élevée** | Moyen |
| Phase 4 : Composants Business | 3 semaines | **Élevée** | **Élevé** |
| Phase 5 : App Back-office | 2 semaines | Moyenne | Moyen |
| Phase 6 : App Website (optionnel) | 1 semaine | Faible | Faible |
| **TOTAL** | **13 semaines** (~3 mois) | - | - |

### Effort par Catégorie

| Catégorie | Effort | Raison |
|-----------|--------|--------|
| **Composants UI** | ⭐ Faible | Copie directe, peu de refactor |
| **Design System** | ⭐ Faible | Copie directe, déjà isolé |
| **Utils** | ⭐⭐ Moyen | Refactor split fichiers |
| **Hooks** | ⭐⭐⭐ Élevé | Abstraction DB nécessaire |
| **Composants Business** | ⭐⭐⭐⭐ Très élevé | Découplage Supabase complexe |
| **App Back-office** | ⭐⭐ Moyen | Mise à jour imports massive |

---

## 🎯 RECOMMANDATIONS FINALES

### 1. Commencer par les Fondations

**Ordre critique** : Design System → Utils → Composants UI → Hooks → Business

**Raison** : Les couches supérieures dépendent des couches inférieures.

### 2. Automatiser au Maximum

**Scripts à créer** :
- `migrate-imports.sh` : Remplacement automatique imports
- `validate-structure.sh` : Vérification structure monorepo
- `check-circular-deps.sh` : Détection dépendances circulaires

### 3. Tests Continus

**RÈGLE ABSOLUE** : Après chaque phase, valider :
1. Build successful
2. Console 0 errors
3. Tests E2E critiques passent
4. Performance SLO respectés

### 4. Documentation Vivante

**Maintenir à jour** :
- README.md de chaque package
- CHANGELOG.md par phase
- Architecture Decision Records (ADR)

### 5. Rollback Plan

**Par phase** :
- Garder backups
- Tag git après chaque phase
- Script rollback automatique

---

## 📁 FICHIERS GÉNÉRÉS (À créer)

### 1. Configuration Monorepo

- `pnpm-workspace.yaml`
- `turbo.json`
- `package.json` (root)

### 2. Package Configs

- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/apps/backoffice/package.json`
- `packages/apps/backoffice/tsconfig.json`
- `packages/apps/website/package.json`
- `packages/apps/website/tsconfig.json`

### 3. Documentation

- `README.md` (root monorepo)
- `packages/shared/README.md`
- `packages/apps/backoffice/README.md`
- `MIGRATION-GUIDE.md`
- `ARCHITECTURE.md`

### 4. Scripts

- `scripts/migrate-imports.sh`
- `scripts/validate-monorepo.sh`
- `scripts/check-deps.sh`

---

**FIN DU RAPPORT**

**Prochaines étapes** :
1. Valider ce rapport avec l'équipe
2. Prioriser phases selon business needs
3. Lancer Phase 0 (Préparation)

**Contact** : Romeo Dos Santos / Claude Code  
**Date** : 2025-11-06
