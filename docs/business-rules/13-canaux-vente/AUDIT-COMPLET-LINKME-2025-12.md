# Audit Complet LinkMe - CMS Back-Office & Application Affiliés

**Date:** 2025-12-17
**Scope:** Plateforme LinkMe complète (Back-Office CMS + App Affiliés)

---

## 📋 Résumé Exécutif

LinkMe est une plateforme d'affiliation B2B2C permettant aux enseignes et organisations de créer des sélections de produits personnalisées et de percevoir des commissions sur les ventes.

**Architecture:**
- **apps/back-office** : CMS administrateur LinkMe (port 3000)
- **apps/linkme** : Application front affiliés (port 3002)
- **Base de données** : Supabase (tables linkme_affiliates, linkme_selections, linkme_commissions, etc.)

**Statut global:** ✅ Plateforme fonctionnelle avec 85% des fonctionnalités opérationnelles

---

## 🎯 PARTIE 1 : CMS LinkMe (Back-Office)

### Navigation (LinkMeSidebar.tsx:47-160)

```
1. Tableau de Bord
2. Utilisateurs
3. Enseignes & Orgs
4. Catalogue
   ├─ Produits
   ├─ Vedettes
   ├─ Fournisseurs
   └─ Configuration Prix
5. Sélections
6. Commandes
7. Rémunération
8. Demandes paiement
9. Analytics
   ├─ Vue d'ensemble
   ├─ Performance
   └─ Rapports (🔒 Désactivé)
10. Configuration
    ├─ Paramètres
    ├─ Commissions (🔒 Désactivé)
    └─ Intégrations (🔒 Désactivé)
```

### ✅ Fonctionnalités Opérationnelles

#### 1. Dashboard (page.tsx)
- **Fichier:** `apps/back-office/src/app/canaux-vente/linkme/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Vue d'ensemble plateforme
  - KPIs globaux (affiliés actifs, commandes, CA, commissions)
  - Graphiques évolution
  - Activité récente
  - Actions rapides

#### 2. Utilisateurs (/utilisateurs)
- **Fichiers:**
  - `apps/back-office/src/app/canaux-vente/linkme/utilisateurs/page.tsx`
  - `apps/back-office/src/app/canaux-vente/linkme/utilisateurs/[id]/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Liste complète utilisateurs LinkMe
  - Filtres par rôle (enseigne_admin, org_independante, etc.)
  - Création nouvel utilisateur
  - Modification utilisateur
  - Suppression utilisateur
  - Reset mot de passe
  - Vue détail utilisateur

#### 3. Enseignes & Organisations (/enseignes)
- **Fichiers:**
  - `apps/back-office/src/app/canaux-vente/linkme/enseignes/page.tsx`
  - `apps/back-office/src/app/canaux-vente/linkme/enseignes/[id]/page.tsx`
  - `apps/back-office/src/app/canaux-vente/linkme/organisations/[id]/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Liste enseignes avec profils LinkMe
  - Vue détail enseigne avec :
    - Profil affilié
    - Marges par défaut
    - Commissions
    - Utilisateurs liés
    - Sélections
    - Performance

#### 4. Catalogue (/catalogue)
- **Fichiers:**
  - `apps/back-office/src/app/canaux-vente/linkme/catalogue/page.tsx` - Liste produits
  - `apps/back-office/src/app/canaux-vente/linkme/catalogue/[id]/page.tsx` - Détail produit
  - `apps/back-office/src/app/canaux-vente/linkme/catalogue/vedettes/page.tsx` - Produits vedettes
  - `apps/back-office/src/app/canaux-vente/linkme/catalogue/fournisseurs/page.tsx` - Fournisseurs
  - `apps/back-office/src/app/canaux-vente/linkme/catalogue/configuration/page.tsx` - Config prix
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Liste produits catalogue LinkMe
  - Recherche et filtres
  - Détail produit avec pricing, marges, stats
  - Gestion produits vedettes
  - Gestion fournisseurs visibles
  - Configuration marges et commissions

#### 5. Sélections (/selections)
- **Fichiers:**
  - `apps/back-office/src/app/canaux-vente/linkme/selections/page.tsx`
  - `apps/back-office/src/app/canaux-vente/linkme/selections/[id]/page.tsx`
  - `apps/back-office/src/app/canaux-vente/linkme/selections/new/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Liste toutes sélections
  - Filtres par affilié, statut
  - Vue détail sélection
  - Création nouvelle sélection (admin)
  - Stats par sélection (produits, vues, CA)

#### 6. Commandes (/commandes)
- **Fichier:** `apps/back-office/src/app/canaux-vente/linkme/commandes/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Liste toutes commandes LinkMe
  - Filtres statut, affilié, dates
  - Détail commande modal
  - Création manuelle commande
  - Statistiques commandes

#### 7. Rémunération (/commissions)
- **Fichier:** `apps/back-office/src/app/canaux-vente/linkme/commissions/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Vue d'ensemble commissions
  - Commissions par statut (pending, validated, paid)
  - Tableau détaillé commissions
  - Filtres et recherche

#### 8. Demandes Paiement (/demandes-paiement)
- **Fichier:** `apps/back-office/src/app/canaux-vente/linkme/demandes-paiement/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Liste demandes de versement
  - Badge notification (compte en attente)
  - Approbation/Rejet demandes
  - Historique demandes
  - Génération factures

#### 9. Analytics (/analytics)
- **Fichiers:**
  - `apps/back-office/src/app/canaux-vente/linkme/analytics/page.tsx` - Vue d'ensemble
  - `apps/back-office/src/app/canaux-vente/linkme/analytics/performance/page.tsx` - Performance globale
  - `apps/back-office/src/app/canaux-vente/linkme/analytics/performance/[affiliateId]/page.tsx` - Performance affilié
  - `apps/back-office/src/app/canaux-vente/linkme/analytics/performance/[affiliateId]/[selectionId]/page.tsx` - Performance sélection
- **Statut:** ✅ Majoritairement opérationnel
- **Fonctionnalités:**
  - KPIs globaux (affiliés actifs, commandes, CA, panier moyen)
  - Graphiques évolution CA
  - Top affiliés
  - Commissions par statut
  - Filtres temporels (Tout, année, mois multiples)
  - Performance détaillée par affilié
  - Performance détaillée par sélection
  - Tableau sélections avec métriques

#### 10. Configuration (/configuration)
- **Fichiers:**
  - `apps/back-office/src/app/canaux-vente/linkme/configuration/page.tsx`
  - `apps/back-office/src/app/canaux-vente/linkme/configuration/commissions/page.tsx` (🔒)
  - `apps/back-office/src/app/canaux-vente/linkme/configuration/integrations/page.tsx` (🔒)
- **Statut:** ⚠️ Partiel
- **Fonctionnalités opérationnelles:**
  - Page paramètres généraux
- **Fonctionnalités désactivées:**
  - Configuration commissions globales
  - Intégrations externes

### 🎨 Composants Clés (components/)

**Hooks disponibles (14 hooks):**
- `use-linkme-dashboard.ts` - Dashboard KPIs
- `use-linkme-analytics.ts` - Analytics globales
- `use-performance-analytics.ts` - Analytics performance
- `use-linkme-users.ts` - CRUD utilisateurs
- `use-linkme-enseignes.ts` - Gestion enseignes
- `use-linkme-affiliates.ts` - Gestion affiliés
- `use-linkme-selections.ts` - Gestion sélections
- `use-linkme-catalog.ts` - Catalogue produits
- `use-linkme-suppliers.ts` - Fournisseurs
- `use-linkme-orders.ts` - Commandes
- `use-linkme-enseigne-customers.ts` - Clients enseigne
- `use-linkme-margin-calculator.ts` - Calcul marges
- `use-payment-requests-admin.ts` - Demandes paiement admin
- `use-tracking-stats.ts` - Stats tracking

**Composants UI (36 composants):**
- Modals : UserCreateModal, UserEditModal, UserViewModal, LinkMeDeleteUserDialog, LinkMeResetPasswordDialog, CreateLinkMeOrderModal, LinkMeOrderDetailModal, SelectionProductDetailModal, PaymentRequestModalAdmin
- Sections : DashboardSection, UsersSection, EnseignesSection, AffiliatesSection, SelectionsSection, CommissionsSection, ConfigurationSection
- Cards : ProductInfoCard, ProductPricingCard, ProductVariantsCard, ProductStatsCard, ProductReadOnlyCard, ProductDetailHeader, ProductMarginEditor, CommissionsStatusCard
- Charts : LinkMeRevenueChart, TopAffiliatesChart
- Autres : LinkMeSidebar, MarginSlider, SelectionsPerformanceTable, AnalyticsDateFilter

### ❌ Fonctionnalités Manquantes/À Développer

#### Priorité HAUTE
1. **Analytics/Rapports** (actuellement désactivé)
   - Génération rapports PDF/Excel
   - Rapports personnalisés (période, affilié, sélection)
   - Export données analytics
   - Rapports automatiques mensuels

2. **Configuration/Commissions** (actuellement désactivé)
   - Gestion taux commission plateforme global
   - Règles commissions par catégorie produit
   - Paliers commissions par volume
   - Historique modifications taux

3. **Configuration/Intégrations** (actuellement désactivé)
   - Webhook configurables
   - Intégrations API tierces
   - Export automatique vers comptabilité
   - Synchronisation stocks

#### Priorité MOYENNE
4. **Notifications système**
   - Alertes admin (nouvelle demande paiement, commande problème)
   - Notifications par email
   - Centre notifications dans le back-office

5. **Gestion avancée catalogue**
   - Import/Export CSV produits
   - Duplication produits
   - Produits sur mesure par enseigne (actuellement via linkme_custom_products)
   - Historique modifications prix

6. **Analytics avancés**
   - Taux conversion par sélection
   - Analyse panier moyen par affilié
   - Prévisions CA
   - Comparaison périodes

#### Priorité BASSE
7. **Logs et audit**
   - Historique actions admin
   - Logs connexions
   - Traçabilité modifications

8. **Support/Tickets**
   - Système tickets support affiliés
   - Chat admin-affilié
   - FAQ/Documentation intégrée

---

## 🌐 PARTIE 2 : Application LinkMe (Affiliés)

### Pages Publiques
- `/` - Landing page (page.tsx:38)
- `/[affiliateSlug]` - Page affilié publique
- `/[affiliateSlug]/[selectionSlug]` - Boutique sélection publique

### Pages Authentifiées

#### ✅ Fonctionnalités Opérationnelles

##### 1. Authentification
- **Fichiers:**
  - `apps/linkme/src/app/login/page.tsx`
  - `apps/linkme/src/contexts/AuthContext.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Login avec email/password
  - Gestion session via Supabase Auth
  - Context user + linkMeRole (user_app_roles)
  - Auto-redirect selon rôle

##### 2. Dashboard (/dashboard)
- **Fichier:** `apps/linkme/src/app/dashboard/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Vue d'ensemble minimaliste
  - KPI principal : Commissions en attente
  - 3 actions rapides : Ma sélection, Mes ventes, Mon profil
  - Résumé du mois (CA, Commissions, Commandes)
  - Lien vers statistiques détaillées

##### 3. Catalogue (/catalogue)
- **Fichier:** `apps/linkme/src/app/catalogue/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Liste produits disponibles (généraux + sur mesure)
  - Filtres recherche et catégories
  - Vue grille/liste
  - Ajout produits à sélection
  - Badge "Sur mesure" pour produits personnalisés enseigne
  - Badge "Vedette" pour produits mis en avant
  - Prix client calculé avec commission
  - Modal AddToSelectionModal avec choix marge

##### 4. Ma Sélection (/ma-selection)
- **Fichiers:**
  - `apps/linkme/src/app/ma-selection/page.tsx` - Liste sélections
  - `apps/linkme/src/app/ma-selection/nouvelle/page.tsx` - Créer sélection
  - `apps/linkme/src/app/ma-selection/[id]/page.tsx` - Détail sélection
  - `apps/linkme/src/app/ma-selection/[id]/produits/page.tsx` - Produits sélection
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - KPIs globaux (toutes sélections)
  - Top 5 produits vendus
  - Cartes sélections cliquables
  - Création nouvelle sélection
  - Édition sélection (nom, description, image, slug, visibilité)
  - Ajout/Retrait produits
  - Modification marges produits individuels
  - Prévisualisation boutique publique

##### 5. Commissions (/commissions)
- **Fichiers:**
  - `apps/linkme/src/app/commissions/page.tsx`
  - `apps/linkme/src/app/commissions/demandes/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - 4 KPI Cards (Total TTC, Payées, Validées, En attente)
  - Graphique évolution CA
  - Donut répartition statuts
  - Tableau détaillé commissions avec filtres
  - Sélection multiple commissions
  - Création demande versement
  - Modal PaymentRequestModal avec RIB et montant
  - Historique demandes paiement

##### 6. Ventes (/ventes)
- **Fichier:** `apps/linkme/src/app/ventes/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Liste commandes de l'affilié
  - Détail commande
  - Filtres par statut
  - Stats ventes

##### 7. Statistiques (/statistiques)
- **Fichier:** `apps/linkme/src/app/statistiques/page.tsx`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Analytics détaillées
  - KPIs complets
  - Graphiques performance
  - Top produits
  - Performance par sélection

##### 8. E-commerce Public
- **Fichiers:**
  - `apps/linkme/src/app/cart/page.tsx` - Panier
  - `apps/linkme/src/app/checkout/page.tsx` - Passage commande
  - `apps/linkme/src/app/confirmation/page.tsx` - Confirmation
  - `apps/linkme/src/components/cart/CartProvider.tsx` - Context panier
  - `apps/linkme/src/components/cart/CartDrawer.tsx` - Drawer panier
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - Panier persistant (localStorage)
  - Ajout/Modification/Suppression articles
  - Calcul total TTC automatique
  - Formulaire checkout (infos client, livraison, facturation)
  - Validation Zod
  - Intégration paiement Revolut
  - Confirmation commande
  - Tracking commande

##### 9. API & Webhooks
- **Fichiers:**
  - `apps/linkme/src/app/api/create-order/route.ts`
  - `apps/linkme/src/app/api/webhook/revolut/route.ts`
  - `apps/linkme/src/lib/revolut/client.ts`
- **Statut:** ✅ Opérationnel
- **Fonctionnalités:**
  - API création commande depuis formulaire checkout
  - Webhook Revolut pour confirmation paiement
  - Client Revolut pour création ordres paiement
  - Mise à jour statut commande automatique

### 🎨 Composants & Hooks

**Hooks (6 hooks):**
- `use-user-selection.ts` - Sélections utilisateur
- `use-linkme-catalog.ts` - Catalogue produits
- `use-linkme-public.ts` - Pages publiques
- `use-affiliate-analytics.ts` - Analytics affilié
- `use-affiliate-commissions.ts` - Commissions affilié
- `use-payment-requests.ts` - Demandes paiement

**Composants (25 composants):**
- **Commissions** : CommissionsChart, CommissionsTable, CommissionKPICard, PaymentRequestModal, InvoiceTemplate
- **Analytics** : AffiliateKPIGrid, CommissionsOverview, RevenueChart, SelectionPerformanceCard, TopProductsTable
- **Catalogue** : AddToSelectionModal
- **Sélection** : EditMarginModal
- **Cart** : CartProvider, CartDrawer
- **Layout** : Header, Footer, UserMenu
- **Auth** : UserMenu (avec logout)
- **Providers** : Providers (QueryClient + CartProvider)

### ❌ Fonctionnalités Manquantes/À Développer

#### Priorité HAUTE
1. **Page Profil (/profil)** - ⚠️ MANQUANT
   - Fichier : `apps/linkme/src/app/profil/page.tsx` n'existe pas
   - Lien présent dans dashboard (dashboard/page.tsx:175)
   - Fonctionnalités attendues :
     - Informations affilié (nom, logo, bio, slug)
     - Édition profil
     - Coordonnées bancaires (RIB par défaut)
     - Marges par défaut
     - Paramètres notifications

2. **Gestion compte utilisateur**
   - Changement mot de passe
   - Email notifications (préférences)
   - Langue/Devise

3. **Onboarding affilié**
   - Tunnel première connexion
   - Configuration initiale profil
   - Tutoriel création sélection

#### Priorité MOYENNE
4. **Notifications in-app**
   - Centre notifications
   - Alertes commandes
   - Alertes commissions validées
   - Badge compteur non lus

5. **Analytics avancés sélection**
   - Taux conversion visiteurs → acheteurs
   - Sources trafic
   - Produits les plus vus vs les plus achetés
   - Abandon panier

6. **Partage social sélections**
   - Boutons partage (FB, Twitter, WhatsApp)
   - QR Code sélection
   - Lien raccourci personnalisé
   - Preview Open Graph optimisé

#### Priorité BASSE
7. **Favoris/Wishlist**
   - Produits favoris
   - Alertes dispo/prix

8. **Support/Aide**
   - Chat avec admin
   - FAQ intégrée
   - Base de connaissances

9. **Multi-langue**
   - i18n FR/EN
   - Devises EUR/USD

---

## 📊 Métriques Globales

### CMS Back-Office
- **Pages totales:** 28
- **Pages opérationnelles:** 24 (86%)
- **Pages désactivées:** 3 (11%)
- **Pages à créer:** 1 (3%)
- **Hooks:** 14
- **Composants:** 36

### App Affiliés
- **Pages totales:** 18
- **Pages opérationnelles:** 17 (94%)
- **Pages manquantes critiques:** 1 (/profil)
- **Hooks:** 6
- **Composants:** 25

### Architecture Base de Données
**Tables principales:**
- `linkme_affiliates` - Profils business (marges, commissions)
- `linkme_selections` - Sélections créées par affiliés
- `linkme_selection_items` - Produits dans sélections
- `linkme_commissions` - Commissions générées
- `linkme_orders` - Commandes
- `linkme_order_items` - Articles commandes
- `linkme_payment_requests` - Demandes versement
- `user_app_roles` - Rôles utilisateurs LinkMe

---

## 🎯 Plan de Développement Prioritaire

### Phase 1 : Corrections critiques (1-2 jours)
1. ✅ Créer page Profil (/profil)
   - Fichier : `apps/linkme/src/app/profil/page.tsx`
   - Composants : EditProfileModal, BankDetailsForm
   - Hook : use-user-profile.ts

### Phase 2 : Fonctionnalités manquantes (3-5 jours)
2. ✅ Analytics/Rapports (CMS)
   - Export PDF/Excel
   - Rapports personnalisés

3. ✅ Configuration/Commissions (CMS)
   - Gestion taux globaux
   - Règles par catégorie

4. ✅ Configuration/Intégrations (CMS)
   - Webhooks configurables
   - API tierces

5. ✅ Notifications système (CMS + App)
   - Centre notifications
   - Emails automatiques

### Phase 3 : Améliorations (5-7 jours)
6. ✅ Onboarding affilié
7. ✅ Analytics avancés
8. ✅ Partage social
9. ✅ Support/Tickets

### Phase 4 : Nice-to-have (2-3 jours)
10. ✅ Multi-langue
11. ✅ Favoris/Wishlist
12. ✅ Logs audit complets

---

## 📝 Notes Techniques

### Patterns Identifiés
- **Auth:** Supabase Auth + user_app_roles (app='linkme')
- **Data Fetching:** React Query (@tanstack/react-query)
- **Forms:** React Hook Form + Zod
- **UI:** shadcn/ui + Radix UI + Tailwind
- **Paiement:** Revolut Payment API
- **Routing:** Next.js 15 App Router
- **Architecture:** Turborepo monorepo

### Points d'Attention
1. **RLS Policies** - Vérifier que toutes les tables ont des policies correctes
2. **Migrations** - Documenter migrations Supabase (dossier supabase/migrations/)
3. **Types** - Générer types Supabase régulièrement
4. **Testing** - Aucun test détecté, à créer
5. **Documentation** - Mettre à jour docs/ avec nouvelles fonctionnalités

---

## 🔗 Fichiers Critiques

### CMS Back-Office
```
apps/back-office/src/app/canaux-vente/linkme/
├── page.tsx                          # Dashboard
├── layout.tsx                        # Layout avec sidebar
├── components/
│   ├── LinkMeSidebar.tsx            # Navigation principale
│   ├── DashboardSection.tsx         # Dashboard KPIs
│   └── [36 autres composants]
├── hooks/
│   └── [14 hooks]
├── utilisateurs/
├── enseignes/
├── catalogue/
├── selections/
├── commandes/
├── commissions/
├── demandes-paiement/
├── analytics/
└── configuration/
```

### App Affiliés
```
apps/linkme/src/
├── app/
│   ├── page.tsx                     # Landing
│   ├── login/page.tsx              # Auth
│   ├── dashboard/page.tsx          # Dashboard
│   ├── catalogue/page.tsx          # Catalogue
│   ├── ma-selection/               # Sélections
│   ├── commissions/                # Commissions
│   ├── ventes/page.tsx             # Ventes
│   ├── statistiques/page.tsx       # Analytics
│   ├── cart/page.tsx               # Panier
│   ├── checkout/page.tsx           # Checkout
│   ├── confirmation/page.tsx       # Confirmation
│   ├── [affiliateSlug]/            # Pages publiques
│   └── api/                        # API routes
├── components/                      # [25 composants]
├── lib/hooks/                       # [6 hooks]
├── contexts/
│   └── AuthContext.tsx             # Auth context
└── types/
    └── analytics.ts                 # Types analytics
```

---

**Fin du rapport d'audit**
