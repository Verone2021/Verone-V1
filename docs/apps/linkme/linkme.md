# LinkMe - Plateforme Affiliation B2B2C

**Date:** 2026-01-20
**Status:** Opérationnel à 85%

---

## Vue d'Ensemble

LinkMe est une plateforme d'affiliation B2B2C permettant aux enseignes et organisations de créer des sélections de produits personnalisées et de percevoir des commissions sur les ventes.

**Proposition de valeur:**

- **Pour les affiliés** : Monétiser leur réseau en recommandant des produits Vérone
- **Pour Vérone** : Canal de vente B2B avec réseau de prescripteurs
- **Pour les clients finaux** : Accès à une sélection curatée par un expert de confiance

---

## Documentation Connexe

- **Architecture technique** : [architecture.md](./architecture.md) - Tables, RLS, triggers
- **Modèle commissions** : [commissions.md](./commissions.md) - Formules, sources de vérité
- **Workflows détaillés** : [workflows.md](./workflows.md) - 5 workflows complets
- **Designs Figma** : [presentation-figma.md](./presentation-figma.md) - Maquettes UI/UX

---

## Applications

### App Affiliés (Port 3002)

Application front-office pour les enseignes et organisations affiliées.

**URL locale:** `http://localhost:3002`

**Structure (17 routes):**

```
apps/linkme/src/app/
├── (public)/s/[id]/         # Sélection publique white-label
├── (main)/
│   ├── dashboard/           # ✅ Tableau de bord affilié
│   ├── catalogue/           # ✅ Catalogue produits
│   ├── ma-selection/        # ✅ Gestion sélections
│   │   ├── nouvelle/        # Créer sélection
│   │   └── [id]/produits/   # Produits d'une sélection
│   ├── commissions/         # ✅ Commissions + KPIs
│   │   └── demandes/        # Demandes paiement
│   ├── commandes/           # ✅ Suivi commandes
│   ├── statistiques/        # ✅ Analytics détaillées
│   ├── profil/              # ✅ Profil affilié
│   ├── mes-produits/        # ✅ Produits affilié
│   ├── reseau/              # ✅ Carte France réseau
│   ├── stockage/            # ✅ Page stockage m³
│   ├── cart/                # Panier
│   ├── checkout/            # Passage commande
│   ├── confirmation/        # Confirmation
│   └── login/               # Authentification
```

**Hooks App Affiliés (12 hooks):**

- `use-affiliate-analytics.ts` - Analytics affilié
- `use-affiliate-commissions.ts` - Commissions
- `use-affiliate-network.ts` - Réseau (carte)
- `use-affiliate-orders.ts` - Commandes
- `use-affiliate-products.ts` - Mes produits
- `use-affiliate-storage.ts` - Stockage
- `use-linkme-catalog.ts` - Catalogue
- `use-linkme-public.ts` - Pages publiques
- `use-payment-requests.ts` - Demandes paiement
- `use-product-images.ts` - Upload images
- `use-user-profile.ts` - Profil utilisateur
- `use-user-selection.ts` - Sélections

### CMS Back-Office (Port 3000)

Interface d'administration LinkMe pour les administrateurs Vérone.

**URL locale:** `http://localhost:3000/canaux-vente/linkme`

#### Navigation (10 sections)

1. **Tableau de Bord** [✅ Opérationnel]
   - Vue d'ensemble plateforme
   - KPIs globaux (affiliés actifs, commandes, CA, commissions)
   - Graphiques évolution
   - Activité récente

2. **Utilisateurs** [✅ Opérationnel]
   - Liste complète utilisateurs LinkMe
   - Filtres par rôle (enseigne_admin, org_independante)
   - CRUD comptes (création, modification, suppression)
   - Reset mot de passe

3. **Enseignes & Organisations** [✅ Opérationnel]
   - Liste enseignes avec profils LinkMe
   - Vue détail enseigne :
     - Profil affilié
     - Marges par défaut
     - Commissions
     - Utilisateurs liés
     - Sélections
     - Performance

4. **Catalogue** [✅ Opérationnel]
   - **Produits** : Liste produits catalogue LinkMe
     - Recherche et filtres
     - Détail produit avec pricing, marges, stats
   - **Vedettes** : Gestion produits vedettes (mise en avant)
   - **Fournisseurs** : Gestion fournisseurs visibles
   - **Configuration Prix** : Configuration marges et commissions

5. **Sélections** [✅ Opérationnel]
   - Liste toutes sélections
   - Filtres par affilié, statut
   - Vue détail sélection
   - Création nouvelle sélection (admin)
   - Stats par sélection (produits, vues, CA)

6. **Commandes** [✅ Opérationnel]
   - Liste toutes commandes LinkMe
   - Filtres statut, affilié, dates
   - Détail commande modal
   - Création manuelle commande
   - Statistiques commandes

7. **Rémunération** [✅ Opérationnel]
   - Vue d'ensemble commissions
   - Commissions par statut (pending, validated, paid)
   - Tableau détaillé commissions avec filtres
   - Validation commissions

8. **Demandes paiement** [✅ Opérationnel]
   - Liste demandes de versement
   - Badge notification (compte en attente)
   - Approbation/Rejet demandes
   - Historique demandes
   - Génération factures

9. **Analytics** [✅ Opérationnel]
   - **Vue d'ensemble** [✅]
     - KPIs globaux (affiliés actifs, commandes, CA, panier moyen)
     - Graphiques évolution CA
     - Top affiliés
     - Commissions par statut
   - **Performance** [✅]
     - Filtres temporels (Tout, année, mois multiples)
     - Performance détaillée par affilié
     - Performance détaillée par sélection
     - Tableau sélections avec métriques
   - **Rapports** [🔒 Désactivé]
     - Export PDF/Excel (à implémenter)
     - Rapports personnalisés (à implémenter)

10. **Configuration** [⚠️ Partiel]
    - **Paramètres** [✅] : Page paramètres généraux
    - **Commissions** [🔒 Désactivé] : Configuration commissions globales
    - **Intégrations** [🔒 Désactivé] : Intégrations externes

**Hooks CMS (18 hooks):**

- `use-linkme-dashboard.ts` - Dashboard KPIs
- `use-linkme-analytics.ts` - Analytics globales
- `use-performance-analytics.ts` - Performance drill-down
- `use-linkme-users.ts` - CRUD utilisateurs
- `use-linkme-enseignes.ts` - Gestion enseignes
- `use-linkme-affiliates.ts` - Gestion affiliés
- `use-linkme-affiliates-for-storage.ts` - Stockage affiliés
- `use-linkme-selections.ts` - Gestion sélections
- `use-linkme-catalog.ts` - Catalogue
- `use-linkme-suppliers.ts` - Fournisseurs
- `use-linkme-orders.ts` - Commandes
- `use-linkme-enseigne-customers.ts` - Clients enseigne
- `use-linkme-margin-calculator.ts` - Calcul marges
- `use-linkme-storage.ts` - Stockage
- `use-payment-requests-admin.ts` - Admin paiements
- `use-tracking-stats.ts` - Stats tracking
- `use-product-approvals.ts` - Approbations produits
- `use-products-for-affiliate.ts` - Produits par affilié

---

## Fonctionnalités Opérationnelles

### ✅ Complètes (17 fonctionnalités)

1. **Authentification** - Login, sessions isolées, multi-app
2. **Dashboard** - KPIs, actions rapides, résumé mois
3. **Catalogue** - Recherche, filtres, ajout sélection, vedettes
4. **Sélections** - CRUD, marges, prévisualisation, partage URL
5. **Commissions** - 4 KPIs TTC, graphiques, demandes paiement
6. **Commandes** - Liste, détail, création manuelle, accordéon
7. **Analytics** - Performance globale/affilié/sélection, drill-down
8. **E-commerce** - Panier, checkout, confirmation
9. **Page publique** - White-label `/s/[slug]`
10. **Réseau** - Carte France, système archives
11. **Stockage** - Page m³, facturation
12. **Profil** - Page profil affilié
13. **Mes Produits** - Gestion produits affilié (approbation)
14. **Utilisateurs CMS** - CRUD comptes, rôles, suspension
15. **Enseignes CMS** - Gestion enseignes et organisations
16. **Demandes paiement CMS** - Approbation, historique
17. **API & Webhooks** - Création commande, webhook Revolut

### ⚠️ Partielles (3 fonctionnalités)

1. **Configuration/Commissions** - Page existe mais désactivée
2. **Configuration/Intégrations** - Page existe mais désactivée
3. **Analytics/Rapports** - Export PDF/Excel non implémenté

### ❌ À développer (5 priorités)

1. **Export rapports** PDF/Excel (Analytics)
2. **Notifications système** (alertes, emails automatiques)
3. **Onboarding affilié** (tunnel première connexion)
4. **Webhooks configurables** (Configuration/Intégrations)
5. **Paiement Revolut B2C** (pour clients particuliers - plus tard)

---

## Statut Global

### Métriques Globales

**CMS Back-Office:**
- Pages totales: 28
- Pages opérationnelles: 24 (86%)
- Pages désactivées: 3 (11%)
- Hooks: 18
- Composants: 36

**App Affiliés:**
- Pages totales: 18
- Pages opérationnelles: 17 (94%)
- Hooks: 12
- Composants: 25

**Architecture Base de Données:**
- Tables principales: 8 (linkme_affiliates, linkme_selections, linkme_selection_items, linkme_commissions, linkme_orders, linkme_order_items, linkme_payment_requests, user_app_roles)
- Vues: 3 (linkme_order_items_enriched, linkme_orders_with_margins, linkme_orders_enriched)
- Triggers: Automatiques (commissions, audits)

### Types d'Utilisateurs

| Type               | Rôle                | Description           |
| ------------------ | ------------------- | --------------------- |
| Enseigne Admin     | `enseigne_admin`    | Admin d'une chaîne    |
| Org Indépendante   | `org_independante`  | Organisation autonome |
| Client             | `client`            | Employé/Shop          |

---

## Fichiers Critiques

### App LinkMe - Patterns à suivre

```
apps/linkme/src/
├── contexts/AuthContext.tsx           # Auth + linkMeRole
├── lib/hooks/use-user-selection.ts    # Pattern liaison user→affiliate
├── lib/hooks/use-affiliate-*.ts       # Pattern hooks affilié
├── components/commissions/            # Pattern composants modulaires
└── app/(main)/layout.tsx              # Layout authentifié
```

### CMS Back-Office - Patterns à suivre

```
apps/back-office/src/app/canaux-vente/linkme/
├── layout.tsx                         # Layout avec sidebar
├── components/LinkMeSidebar.tsx       # Navigation
├── hooks/use-linkme-*.ts              # Pattern hooks CMS
└── components/*Section.tsx            # Pattern sections
```

### Base de données

```
supabase/migrations/20251201_001_create_user_app_roles.sql  # Référence auth
supabase/migrations/20251205_002_rls_linkme_selections.sql  # Référence RLS
```

---

## Credentials Test

### Back-Office (Port 3000)

- URL: `http://localhost:3000/login`
- Bouton "Accès test MVP"
- Email: `veronebyromeo@gmail.com` / Pwd: `Abc123456`

### LinkMe (Port 3002)

- URL: `http://localhost:3002/login`
- Bouton jaune "Comptes de test (DEV)"
- **Enseigne Admin**: `admin@pokawa-test.fr` / `TestLinkMe2025`
- **Org Indépendante**: `test-org@verone.fr` / `TestLinkMe2025`

**Note**: Sessions isolées avec cookies distincts (back-office et LinkMe séparés).

---

## Commits Git Récents (Décembre 2025)

Principaux commits:

- `feat(linkme): add white-label public selection page with slug URL`
- `feat(linkme): add Storage page with m3 tracking`
- `feat(linkme): add Mes Produits page for affiliate products`
- `feat(linkme): enhance dashboard with improved navigation`
- `fix(auth): isolate sessions between back-office and linkme apps`
- `feat(linkme): add network page with France map`
- `feat(linkme): migrate to SSR-safe Supabase client, add profile page`
- `feat(linkme): implement orders page with accordion and tax_rate`
- `feat(linkme): Refonte UI compacte + gestion sélections + analytics`
- `feat(linkme): Modal édition marge avec indicateurs zones`
- `feat(linkme): Auth E2E complet + migration contacts polymorphique`
- `feat(linkme): CMS utilisateurs multi-app + migration user_app_roles`

---

## Patterns Techniques

- **Auth:** Supabase Auth + user_app_roles (app='linkme')
- **Data Fetching:** React Query (@tanstack/react-query)
- **Forms:** React Hook Form + Zod
- **UI:** shadcn/ui + Radix UI + Tailwind
- **Paiement:** Revolut Payment API
- **Routing:** Next.js 15 App Router
- **Architecture:** Turborepo monorepo

---

## Points d'Attention

1. **RLS Policies** - Vérifier que toutes les tables ont des policies correctes
2. **Migrations** - Documenter migrations Supabase (dossier supabase/migrations/)
3. **Types** - Générer types Supabase régulièrement
4. **Testing** - Tests à créer (E2E Playwright pour workflows critiques)
5. **Documentation** - Maintenir à jour avec nouvelles fonctionnalités

---

## Références

**Documents sources:**
- Audit complet: AUDIT-COMPLET-2025-12.md (2025-12-17)
- Workflows détaillés: workflows.md (2026-01-20)
- Architecture: architecture.md (2025-12-05)
- Commissions: commissions.md (2026-01-20)

**Mémoires Serena:**
- `linkme-architecture-final-2025-12`
- `linkme-test-credentials-critical`

---

**Dernière mise à jour:** 2026-01-20
