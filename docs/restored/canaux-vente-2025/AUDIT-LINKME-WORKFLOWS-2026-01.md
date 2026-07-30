# Audit LinkMe - Documentation Complète Décembre 2025

**Date audit:** 2026-01-04
**Sources:** Code réel, mémoires Serena, docs/, git commits

---

## 1. Documents de Référence Récents (Décembre 2025)

### Documentation Principale

| Document                 | Date       | Localisation                                                          |
| ------------------------ | ---------- | --------------------------------------------------------------------- |
| **Audit Complet LinkMe** | 2025-12-17 | `docs/business-rules/13-canaux-vente/AUDIT-COMPLET-LINKME-2025-12.md` |
| **Présentation Figma**   | 2025-12-17 | `docs/business-rules/13-canaux-vente/PRESENTATION-LINKME-FIGMA.md`    |
| **Architecture Finale**  | 2025-12-05 | Mémoire Serena: `linkme-architecture-final-2025-12`                   |
| **Credentials Test**     | 2025-12-20 | Mémoire Serena: `linkme-test-credentials-critical`                    |

### Migrations Base de Données (Décembre 2025)

- `20251201_001_create_user_app_roles.sql` - Table auth multi-app
- `20251204_001_add_org_independante_role.sql` - Nouveau rôle
- `20251205_001_add_default_margin_rate.sql` - Marges par défaut
- `20251205_002_rls_linkme_selections.sql` - Policies RLS
- `20251206_*` - Soft delete, cleanup selections
- `20251207_*` - Fix RLS circular dependency
- `20251208_*` - Sync channel pricing, fix catalog RPC
- `20251209_*` - Commission TTC columns, trigger commissions

---

## 2. Architecture LinkMe (Décembre 2025)

### Architecture 2 Tables

```
AUTHENTIFICATION                    DONNÉES BUSINESS
┌─────────────────────┐            ┌─────────────────────────────┐
│ user_app_roles      │            │ linkme_affiliates           │
│ - app='linkme'      │ ──JOIN──▶  │ - enseigne_id XOR org_id    │
│ - enseigne_id       │            │ - default_margin_rate (15%) │
│ - organisation_id   │            │ - linkme_commission_rate(5%)│
└─────────────────────┘            └─────────────────────────────┘
```

### Rôles Actifs

| Rôle               | Description                     |
| ------------------ | ------------------------------- |
| `enseigne_admin`   | Admin d'une chaîne (ex: Pokawa) |
| `org_independante` | Organisation autonome           |

### Tables Principales

- `linkme_affiliates` - Profils business (marges, commissions)
- `linkme_selections` - Mini-boutiques affiliés
- `linkme_selection_items` - Produits dans sélections
- `linkme_commissions` - Commissions générées
- `linkme_orders` / `linkme_order_items` - Commandes
- `linkme_payment_requests` - Demandes versement
- `user_app_roles` - Rôles utilisateurs multi-app

---

## 3. Structure Application LinkMe (apps/linkme)

### Pages (17 routes)

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
│   ├── mes-produits/        # ✅ Produits affilié (nouveau!)
│   ├── reseau/              # ✅ Carte France réseau
│   ├── stockage/            # ✅ Page stockage m3
│   ├── cart/                # Panier
│   ├── checkout/            # Passage commande
│   ├── confirmation/        # Confirmation
│   └── login/               # Authentification
```

### Hooks App Affiliés (12 hooks)

```
apps/linkme/src/lib/hooks/
├── use-affiliate-analytics.ts     # Analytics affilié
├── use-affiliate-commissions.ts   # Commissions
├── use-affiliate-network.ts       # Réseau (carte)
├── use-affiliate-orders.ts        # Commandes
├── use-affiliate-products.ts      # Mes produits
├── use-affiliate-storage.ts       # Stockage
├── use-linkme-catalog.ts          # Catalogue
├── use-linkme-public.ts           # Pages publiques
├── use-payment-requests.ts        # Demandes paiement
├── use-product-images.ts          # Upload images
├── use-user-profile.ts            # Profil utilisateur
└── use-user-selection.ts          # Sélections
```

### Composants (11 dossiers, 30+ composants)

- `analytics/` - KPIs, graphiques, performance
- `cart/` - CartProvider, CartDrawer
- `catalogue/` - AddToSelectionModal
- `commissions/` - Table, Chart, KPIs, PaymentRequestModal
- `forms/` - ProductImageUpload
- `layout/` - Header, Footer
- `network/` - FranceMap, NetworkCard
- `selection/` - EditMarginModal
- `storage/` - StorageKPICard, PricingGrid

---

## 4. Structure CMS Back-Office (canaux-vente/linkme)

### Pages CMS (10 sections)

```
apps/back-office/src/app/canaux-vente/linkme/
├── page.tsx                  # Dashboard
├── utilisateurs/             # Gestion users LinkMe
├── enseignes/               # Enseignes + orgs
├── catalogue/               # Produits, vedettes, fournisseurs
├── selections/              # Toutes sélections
├── commandes/               # Commandes LinkMe
├── commissions/             # Rémunération
├── demandes-paiement/       # Versements
├── analytics/               # KPIs, performance
└── configuration/           # Paramètres (partiel)
```

### Hooks CMS (18 hooks)

```
apps/back-office/src/app/canaux-vente/linkme/hooks/
├── use-linkme-dashboard.ts           # Dashboard KPIs
├── use-linkme-analytics.ts           # Analytics globales
├── use-performance-analytics.ts      # Performance drill-down
├── use-linkme-users.ts               # CRUD utilisateurs
├── use-linkme-enseignes.ts           # Gestion enseignes
├── use-linkme-affiliates.ts          # Gestion affiliés
├── use-linkme-affiliates-for-storage.ts
├── use-linkme-selections.ts          # Gestion sélections
├── use-linkme-catalog.ts             # Catalogue
├── use-linkme-suppliers.ts           # Fournisseurs
├── use-linkme-orders.ts              # Commandes
├── use-linkme-enseigne-customers.ts  # Clients enseigne
├── use-linkme-margin-calculator.ts   # Calcul marges
├── use-linkme-storage.ts             # Stockage
├── use-payment-requests-admin.ts     # Admin paiements
├── use-tracking-stats.ts             # Stats tracking
├── use-product-approvals.ts          # Approbations produits
└── use-products-for-affiliate.ts     # Produits par affilié
```

---

## 5. Fonctionnalités Opérationnelles (85%)

### ✅ Complètes

- **Authentification** - Login, sessions isolées, multi-app
- **Dashboard** - KPIs, actions rapides, résumé mois
- **Catalogue** - Recherche, filtres, ajout sélection, vedettes
- **Sélections** - CRUD, marges, prévisualisation, partage URL
- **Commissions** - 4 KPIs TTC, graphiques, demandes paiement
- **Commandes** - Liste, détail, création manuelle, accordéon
- **Analytics** - Performance globale/affilié/sélection, drill-down
- **E-commerce** - Panier, checkout, confirmation
- **Page publique** - White-label `/s/[slug]`
- **Réseau** - Carte France, système archives
- **Stockage** - Page m3, facturation
- **Profil** - Page profil affilié
- **Mes Produits** - Gestion produits affilié (nouveau!)

### ⚠️ Partielles

- **Configuration/Commissions** - Désactivé (page existe)
- **Configuration/Intégrations** - Désactivé
- **Analytics/Rapports** - Export PDF/Excel non implémenté
- **Paiement Revolut** - Reporté (B2B = virement uniquement)

### ❌ À développer (priorités)

1. Export rapports PDF/Excel
2. Notifications système
3. Onboarding affilié
4. Webhooks configurables
5. Paiement Revolut (B2C - plus tard)

---

## 6. Commits Git Décembre 2025 (25+ commits)

Principaux changements:

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

## 7. Credentials Test (À jour 2025-12-20)

### Back-Office (Port 3000)

- URL: `http://localhost:3000/login`
- Bouton "Accès test MVP"
- Email: `veronebyromeo@gmail.com` / Pwd: `<credential retire 2026-07-30 — voir .claude/local/test-credentials.md>`

### LinkMe (Port 3002)

- URL: `http://localhost:3002/login`
- Bouton jaune "Comptes de test (DEV)"
- **Enseigne Admin**: `admin@pokawa-test.fr` / `<credential retire 2026-07-30>`
- **Org Indépendante**: `test-org@verone.fr` / `<credential retire 2026-07-30>`

**Note**: Sessions isolées avec cookies distincts (back-office et LinkMe séparés).

---

## 8. Fichiers Critiques pour Nouvelles Fonctionnalités

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

## 9. WORKFLOWS DÉTAILLÉS

### Workflow 1: Connexion Affilié

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ACCÈS LOGIN (/login)                                        │
│     → Bouton "Comptes de test (DEV)" si env DEV                │
│     → Formulaire email/password                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. AUTHENTIFICATION SUPABASE                                   │
│     → supabase.auth.signInWithPassword()                       │
│     → Cookie isolé: sb-linkme-auth                              │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. RÉCUPÉRATION RÔLE (AuthContext.tsx)                        │
│     → Query: user_app_roles WHERE app='linkme'                  │
│     → Extraction: role, enseigne_id, organisation_id            │
│     → Rôles: enseigne_admin | org_independante                  │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. LIAISON AFFILIATE (use-user-selection.ts)                   │
│     → Si enseigne_admin: linkme_affiliates.enseigne_id          │
│     → Si org_independante: linkme_affiliates.organisation_id    │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. REDIRECTION DASHBOARD                                       │
│     → Context user + linkMeRole + affiliate disponibles         │
└─────────────────────────────────────────────────────────────────┘
```

**Fichiers clés:**

- `apps/linkme/src/contexts/AuthContext.tsx`
- `apps/linkme/src/lib/hooks/use-user-selection.ts:90-177`

---

### Workflow 2: Création Sélection

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ACCÈS "MA SÉLECTION" (/ma-selection)                        │
│     → KPIs globaux toutes sélections                            │
│     → Liste cartes sélections existantes                        │
│     → Bouton "+ Nouvelle sélection"                             │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. CRÉATION (/ma-selection/nouvelle)                           │
│     → Formulaire: nom, description                              │
│     → useCreateSelection() mutation                             │
│     → Génère slug unique: "{nom}-{timestamp.base36}"            │
│     → Insert linkme_selections (status: draft, is_public: false)│
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. AJOUT PRODUITS (/ma-selection/[id]/produits)                │
│     → Catalogue avec produits disponibles                       │
│     → Filtres: recherche, catégorie, vedettes                   │
│     → Bouton "Ajouter" → Modal AddToSelectionModal              │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. CONFIGURATION MARGE (AddToSelectionModal)                   │
│     → Slider "feux tricolores":                                 │
│       🟢 Vert (0% → suggérée) = Compétitif                     │
│       🟠 Orange (suggérée → 2×suggérée) = Équilibré            │
│       🔴 Rouge (2×suggérée → max) = Proche public              │
│     → Affichage en temps réel:                                  │
│       - Votre gain: prix_base × marge%                         │
│       - Prix final HT: prix_base × (1 + marge%)                │
│       - Prix client TTC: prix_final × 1.20                     │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. SAUVEGARDE ITEM (useAddToSelectionWithMargin)               │
│     → Validation marge vs min/max channel_pricing               │
│     → API POST /api/linkme/selections/add-item                  │
│     → Insert linkme_selection_items:                            │
│       - product_id, selection_id                                │
│       - base_price_ht, margin_rate                              │
│       - selling_price_ht (GENERATED column)                     │
│     → Update linkme_selections.products_count                   │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. PUBLICATION (useToggleSelectionPublished)                   │
│     → Toggle is_public: true                                    │
│     → Update status: 'active', published_at: now()              │
│     → URL publique: /s/{slug}                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Fichiers clés:**

- `apps/linkme/src/app/(main)/ma-selection/nouvelle/page.tsx`
- `apps/linkme/src/app/(main)/ma-selection/[id]/produits/page.tsx`
- `apps/linkme/src/lib/hooks/use-user-selection.ts:306-571`
- `apps/linkme/src/components/catalogue/AddToSelectionModal.tsx`

---

### Workflow 3: Commande Client (B2B - Entreprises)

> **⚠️ NOTE IMPORTANTE (Janvier 2026):**
>
> - Clients actuels = **Organisations/Enseignes uniquement** (B2B)
> - Paiement = **Par virement uniquement** (pas de Revolut pour l'instant)
> - Revolut sera implémenté plus tard pour les clients particuliers (B2C)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ACCÈS SÉLECTION PUBLIQUE (/s/[slug])                        │
│     → Page white-label avec produits affilié                    │
│     → Accessible sans auth (vitrine publique)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. AJOUT PANIER (CartProvider + CartDrawer)                    │
│     → localStorage persistant                                   │
│     → Calcul total TTC automatique                              │
│     → Drawer panier accessible partout                          │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. CHECKOUT (/checkout) - Workflow Entreprise                  │
│     → Formulaire Zod validé:                                    │
│       - Infos entreprise (raison sociale, SIRET)               │
│       - Contact (nom, email, téléphone)                        │
│       - Adresse livraison                                       │
│       - Adresse facturation                                     │
│     → Résumé panier + frais livraison                           │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. CONFIRMATION COMMANDE                                       │
│     → Insert linkme_orders (status: draft)                      │
│     → Insert linkme_order_items                                 │
│     → Génération numéro commande                                │
│     → ⚠️ Pas de paiement en ligne (virement ultérieur)         │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. TRAITEMENT BACK-OFFICE (Vérone)                             │
│     → Validation commande (draft → validated)                   │
│     → Envoi facture pro forma par email                         │
│     → Réception virement bancaire                               │
│     → Update payment_status                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. EXPÉDITION & COMMISSION                                     │
│     → Préparation commande                                      │
│     → Expédition (status: shipped)                              │
│     → Trigger: création commission automatique                  │
└─────────────────────────────────────────────────────────────────┘
```

**Fichiers clés:**

- `apps/linkme/src/app/(public)/s/[id]/page.tsx`
- `apps/linkme/src/components/cart/CartProvider.tsx`
- `apps/linkme/src/app/(main)/checkout/page.tsx`
- `apps/linkme/src/app/api/create-order/route.ts`

**À implémenter plus tard (B2C):**

- `apps/linkme/src/app/api/webhook/revolut/route.ts` - Webhook paiement
- Intégration Revolut pour clients particuliers

---

### Workflow 4: Cycle Commissions

```
┌─────────────────────────────────────────────────────────────────┐
│  1. GÉNÉRATION AUTOMATIQUE (Trigger SQL)                        │
│     → Après commande payée/livrée                               │
│     → Insert linkme_commissions:                                │
│       - order_id, selection_id, affiliate_id                   │
│       - affiliate_commission (HT)                               │
│       - affiliate_commission_ttc (HT × 1.20)                   │
│       - linkme_commission                                       │
│       - status: 'pending'                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. VUE AFFILIÉ (/commissions)                                  │
│     → 4 KPIs TTC cliquables:                                    │
│       ⏱️ En attente (pending)                                  │
│       💵 Payables (validated)                                  │
│       ⌛ En cours (in_payment)                                 │
│       ✓ Payées (paid)                                          │
│     → Graphique évolution CA                                    │
│     → Table commissions avec checkboxes                         │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. VALIDATION VÉRONE (CMS Back-Office)                         │
│     → Admin valide commissions (pending → validated)            │
│     → Commissions deviennent "Payables"                         │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. DEMANDE VERSEMENT (useCreatePaymentRequest)                 │
│     → Affilié sélectionne commissions validated                 │
│     → Bouton "Percevoir (X €)"                                  │
│     → Insert linkme_payment_requests:                           │
│       - total_amount_ht, total_amount_ttc                       │
│       - status: 'pending'                                       │
│       - request_number: auto-generated                          │
│     → Insert linkme_payment_request_items (liaison)             │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. UPLOAD FACTURE (useUploadInvoice)                           │
│     → Modal upload PDF (max 5 Mo)                               │
│     → Storage: linkme-invoices/invoices/invoice_{id}_{ts}.pdf   │
│     → Update status: 'invoice_received'                         │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. PAIEMENT VÉRONE (CMS Back-Office)                           │
│     → Admin effectue virement bancaire                          │
│     → Upload preuve de paiement                                 │
│     → Update status: 'paid'                                     │
│     → Update commissions liées: status → 'paid'                 │
└─────────────────────────────────────────────────────────────────┘
```

**Fichiers clés:**

- `supabase/migrations/20251209_002_create_linkme_commissions_trigger.sql`
- `apps/linkme/src/app/(main)/commissions/page.tsx`
- `apps/linkme/src/lib/hooks/use-affiliate-commissions.ts`
- `apps/linkme/src/lib/hooks/use-payment-requests.ts`
- `apps/linkme/src/components/commissions/PaymentRequestModal.tsx`

---

### Workflow 5: Analytics Affilié

```
┌─────────────────────────────────────────────────────────────────┐
│  1. DASHBOARD (/dashboard)                                      │
│     → KPI principal: Commissions en attente                     │
│     → Résumé du mois (CA, Commissions, Commandes)              │
│     → 3 actions rapides                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. STATISTIQUES DÉTAILLÉES (/statistiques)                     │
│     → Filtres temporels (mois, trimestre, année)                │
│     → KPIs: CA HT, Commandes, Panier moyen, Commissions        │
│     → Graphiques: évolution CA, répartition commissions        │
│     → Top produits vendus                                       │
│     → Performance par sélection                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Fichiers clés:**

- `apps/linkme/src/app/(main)/dashboard/page.tsx`
- `apps/linkme/src/app/(main)/statistiques/page.tsx`
- `apps/linkme/src/lib/hooks/use-affiliate-analytics.ts`
- `apps/linkme/src/components/analytics/`

---

## 10. Statuts et Transitions

### Statuts Sélection

```
draft ──────────▶ active (publication)
  │                  │
  └───── archived ◀──┘ (archivage)
```

### Statuts Commande

```
draft → validated → partially_shipped → shipped → delivered
         │                               │
         └────────── cancelled ◀─────────┘
```

### Statuts Commission

```
pending ──▶ validated ──▶ in_payment ──▶ paid
              │
              └──▶ cancelled
```

### Statuts Demande Paiement

```
pending ──▶ invoice_received ──▶ paid
    │              │
    └─── cancelled ◀┘
```

---

## Résumé Exécutif

**LinkMe est une plateforme d'affiliation B2B2C fonctionnelle à 85%.**

Les documents les plus récents et complets sont:

1. `docs/business-rules/13-canaux-vente/AUDIT-COMPLET-LINKME-2025-12.md` (2025-12-17)
2. `docs/business-rules/13-canaux-vente/PRESENTATION-LINKME-FIGMA.md` (2025-12-17)
3. `docs/business-rules/13-canaux-vente/AUDIT-LINKME-WORKFLOWS-2026-01.md` (ce document)
4. Mémoire Serena `linkme-architecture-final-2025-12`

Pour implémenter de nouvelles fonctionnalités, suivre les patterns existants dans les hooks et composants documentés ci-dessus.
