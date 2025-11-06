# 📦 INVENTAIRE COMPLET - Google Merchant Center

**Date**: 2025-11-06 | Format: Référence rapide pour navigation  
**Usage**: Ctrl+F pour chercher fichiers/routes spécifiques

---

## 🗂️ STRUCTURE FICHIERS

### 1. API ROUTES (7/9 implémentées)

```
src/app/api/google-merchant/
├── test-connection/
│   └── route.ts                           ✅ GET/POST test GCP + API
│
├── products/
│   ├── batch-add/
│   │   └── route.ts                       ✅ POST ajouter batch
│   │
│   ├── [id]/
│   │   ├── route.ts                       ✅ DELETE retirer produit
│   │   ├── price/
│   │   │   └── route.ts                   ✅ PUT modifier prix HT
│   │   ├── metadata/
│   │   │   └── route.ts                   ✅ PATCH titre/description
│   │   └── visibility/
│   │       └── route.ts                   ✅ PATCH toggle visible
│   │
│   └── (pas de route.ts au level products/)
│
├── poll-statuses/
│   └── route.ts                           ✅ POST polling manuel
│
└── batch-sync/
    └── route.ts                           ✅ POST sync batch tous produits

MANQUANTES:
├── export-excel/
│   └── route.ts                           ❌ GET export feed Excel
└── sync-product/
    └── [id]/
        └── route.ts                       ⚠️ Exists mais MOCK
```

### 2. HOOKS REACT QUERY (10/10)

```
src/hooks/

Fetch Hooks (Queries):
├── use-google-merchant-products.ts        ✅ Produits synchronisés
├── google-merchant/
│   ├── use-google-merchant-eligible-products.ts  ✅ Produits éligibles
│   └── use-poll-google-merchant-statuses.ts       ✅ Stats polling

Mutation Hooks:
├── use-google-merchant-sync.ts            ✅ Sync globale batch
├── google-merchant/
│   ├── use-add-products-to-google-merchant.ts    ✅ Ajouter batch
│   ├── use-update-google-merchant-price.ts       ✅ Modifier prix
│   ├── use-update-google-merchant-metadata.ts    ✅ Modifier titre/desc
│   ├── use-toggle-google-merchant-visibility.ts  ✅ Toggle visible
│   └── use-remove-from-google-merchant.ts        ✅ Retirer produit

Config Hook:
└── use-google-merchant-config.ts          ✅ Tester connexion + config
```

### 3. COMPOSANTS UI

```
src/components/business/
├── google-merchant-config-modal.tsx       ✅ Modal configuration

src/app/canaux-vente/google-merchant/
└── page.tsx                               ✅ Page principale (550 lignes)
    Contains:
    - GoogleMerchantProductManager (706 lignes - selection produits)
    - GoogleMerchantProductCard (353 lignes - affichage produit)
    - GoogleMerchantPriceEditor (262 lignes - édition prix modal)
    - GoogleMerchantMetadataEditor (301 lignes - édition métadonnées)
    - Tabs: Produits | Ajouter | Paramètres
```

### 4. LIBRAIRIES UTILITAIRES

```
src/lib/google-merchant/

Core:
├── config.ts                              ✅ Configuration (Account ID, API version, scopes)
├── auth.ts                                ✅ Service Account JWT authentication (320 lignes)
├── client.ts                              ⚠️ Google Merchant API client (350 lignes, MOCK)

Transformers:
├── transformer.ts                         ✅ Supabase → Google format (280 lignes)
├── excel-transformer.ts                   ✅ Export Excel 31 colonnes (200 lignes)
├── product-mapper.ts                      ✅ Mapping champs produits (150 lignes)
└── sync-client.ts                         ⚠️ Sync batch client (200 lignes, MOCK)
```

### 5. DATABASE MIGRATIONS

```
supabase/migrations/

├── 20251106_117_google_merchant_syncs_table.sql
│   ├── Table: google_merchant_syncs (18 colonnes)
│   ├── Indexes: 5 (product_id, google_product_id, sync_status, google_status, synced_at)
│   ├── Triggers: updated_at automatique
│   ├── RLS: service_role write, authenticated read
│   ├── Views: google_merchant_stats (materialized)
│   └── RPCs: get_google_merchant_stats(), get_google_merchant_products()
│
└── 20251106_118_google_merchant_channel_extensions.sql
    ├── Tables:
    │   ├── channel_product_metadata (7 colonnes)
    │   └── channel_product_pricing (5 colonnes)
    ├── RPCs (8):
    │   ├── batch_add_google_merchant_products()
    │   ├── get_google_merchant_eligible_products()
    │   ├── update_google_merchant_price()
    │   ├── update_google_merchant_metadata()
    │   ├── toggle_google_merchant_visibility()
    │   ├── remove_from_google_merchant()
    │   ├── poll_google_merchant_statuses()
    │   └── get_google_merchant_product_price()
    └── INSERT sales_channels (canal google_merchant)
```

### 6. DOCUMENTATION BUSINESS

```
docs/business-rules/13-canaux-vente/

├── README.md                              ✅ Overview canaux
├── google-merchant/
│   └── README.md                          ✅ Business rules complètes (89 KB)
│       Contient: eligibility, mapping 31 colonnes, workflows, pricing, errors, tests
├── futurs-canaux.md                       ✅ Roadmap Phase 2+
└── prix-clients/
    └── README.md                          ✅ Pricing multi-canaux
```

### 7. GUIDES TECHNIQUES

```
docs/guides/

├── GOOGLE-MERCHANT-RESUME-EXECUTIF.md
│   Résumé 40-50 min configuration, architecture validée
│
├── GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md
│   Guide pas-à-pas credentials GCP + Service Account
│
├── GOOGLE-MERCHANT-INTEGRATION-PLAN-COMPLET.md
│   Architecture complète (161 lignes)
│
├── GOOGLE-MERCHANT-SERVICE-ACCOUNT-CREDENTIALS.md
│   Créer Service Account dans GCP
│
├── GOOGLE-MERCHANT-DOMAIN-VERIFICATION.md
│   Vérifier domaine Vérone dans GMC
│
└── (fichiers .md supplémentaires)
```

### 8. RAPPORTS & ANALYSES

```
docs/audits/2025-11/

└── RAPPORT-SESSION-GOOGLE-MERCHANT-2025-11-06.md
    Session report: Features livrées, stats, learnings, next steps

À la racine du projet:

├── ANALYSE-COMPLET.md     📄 (15 min) 
│   Analyse technique exhaustive, gaps, workflows, recommendations
│
└── EXECUTIVE-SUMMARY.md   📄 (5 min)
    One-page summary exécutive, checklist, décisions
```

---

## 🗄️ DATABASE SCHEMA

### Tables Nouvelles (Migrations 117+118)

#### 1. google_merchant_syncs (18 colonnes)

```sql
CREATE TABLE google_merchant_syncs (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Google IDs
  google_product_id TEXT NOT NULL UNIQUE,
  merchant_id TEXT NOT NULL,
  
  -- Statuts
  sync_status TEXT NOT NULL,              -- success | pending | error | skipped
  sync_operation TEXT NOT NULL,            -- insert | update | delete
  google_status TEXT,                      -- approved | pending | rejected | not_synced
  google_status_detail JSONB,              -- Détails erreurs Google
  
  -- Metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_ht DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  google_status_checked_at TIMESTAMPTZ,
  
  -- Metadata
  error_message TEXT,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

Indexes:
  - idx_google_merchant_syncs_product_id
  - idx_google_merchant_syncs_google_product_id (UNIQUE)
  - idx_google_merchant_syncs_sync_status
  - idx_google_merchant_syncs_google_status
  - idx_google_merchant_syncs_synced_at DESC

RLS: service_role INSERT/UPDATE/DELETE, authenticated SELECT
Trigger: update_google_merchant_syncs_updated_at
```

#### 2. channel_product_metadata (7 colonnes)

```sql
CREATE TABLE channel_product_metadata (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  channel_id UUID NOT NULL REFERENCES sales_channels(id),
  
  custom_title TEXT CHECK (LENGTH <= 150),
  custom_description TEXT CHECK (LENGTH <= 5000),
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_product_channel_metadata UNIQUE (product_id, channel_id)
);

Indexes:
  - idx_channel_product_metadata_product_id
  - idx_channel_product_metadata_channel_id
  - idx_channel_product_metadata_lookup (product_id, channel_id)

RLS: service_role write, authenticated read
```

#### 3. channel_product_pricing (5 colonnes)

```sql
CREATE TABLE channel_product_pricing (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  channel TEXT NOT NULL,
  
  price_ht_cents INTEGER NOT NULL CHECK (>= 0),
  tva_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_product_channel_pricing UNIQUE (product_id, channel)
);

Indexes:
  - idx_channel_product_pricing_product_id
  - idx_channel_product_pricing_channel
```

### Vue Materialized

```sql
CREATE MATERIALIZED VIEW google_merchant_stats AS
SELECT
  COUNT(*) AS total_products,
  COUNT(*) FILTER (WHERE google_status = 'approved') AS approved_products,
  COUNT(*) FILTER (WHERE google_status = 'pending') AS pending_products,
  COUNT(*) FILTER (WHERE google_status = 'rejected') AS rejected_products,
  COUNT(*) FILTER (WHERE sync_status = 'error') AS error_products,
  COALESCE(SUM(impressions), 0) AS total_impressions,
  COALESCE(SUM(clicks), 0) AS total_clicks,
  COALESCE(SUM(conversions), 0) AS total_conversions,
  COALESCE(SUM(revenue_ht), 0) AS total_revenue_ht,
  CASE WHEN SUM(clicks) > 0 THEN ROUND((SUM(conversions)::DECIMAL / SUM(clicks)::DECIMAL) * 100, 2) ELSE 0 END AS conversion_rate,
  MAX(synced_at) AS last_sync_at,
  NOW() AS refreshed_at
FROM google_merchant_syncs;
```

---

## 📡 RPCs SUPABASE (16 total)

### Groupe 1: Fetch Données (4 RPCs)

| RPC | Arguments | Retourne | Ligne Clé |
|-----|-----------|----------|-----------|
| `get_google_merchant_products()` | None | Table produits sync | `ORDER BY synced_at DESC` |
| `get_google_merchant_stats()` | None | 1 row agrégée | Materialize view |
| `get_google_merchant_eligible_products()` | None | Produits non sync | `WHERE NOT EXISTS sync` |
| `get_google_merchant_product_price()` | `product_id, country_code` | Prix HT/TTC | Waterfall: channel > base |

### Groupe 2: Ajouter/Modifier (5 RPCs)

| RPC | Arguments | Retourne | Action |
|-----|-----------|----------|--------|
| `batch_add_google_merchant_products()` | `product_ids[], merchant_id` | { success, product_id, google_product_id, error } | INSERT google_merchant_syncs |
| `update_google_merchant_price()` | `product_id, price_ht_cents, tva_rate` | { success, error } | UPSERT channel_product_pricing |
| `update_google_merchant_metadata()` | `product_id, custom_title, custom_description` | { success, error } | UPSERT channel_product_metadata |
| `toggle_google_merchant_visibility()` | `product_id, visible` | { success, error } | UPDATE sync_status |
| `remove_from_google_merchant()` | `product_id` | { success, error } | UPDATE sync_status='pending', sync_operation='delete' |

### Groupe 3: Polling (2 RPCs)

| RPC | Arguments | Retourne | Action |
|-----|-----------|----------|--------|
| `poll_google_merchant_statuses()` | `product_ids[], statuses_data` | { success, updated_count, error } | UPDATE google_status |
| `refresh_google_merchant_stats()` | None | Void | REFRESH MATERIALIZED VIEW |

### Groupe 4: Helpers (1 RPC)

| RPC | Arguments | Retourne | Usage |
|-----|-----------|----------|-------|
| `calculate_price_ttc_cents()` | `price_ht_cents, tva_rate` | INTEGER | Calcul TTC dynamique |

---

## 🔐 VARIABLES ENVIRONNEMENT

### ✅ Configurées (Real Values)

```bash
# Google Cloud Platform
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL=google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com
GOOGLE_MERCHANT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GOOGLE_MERCHANT_PRIVATE_KEY_ID=e48f41155d7cd104ab59ce6e1e5d1f99823b21ff
GOOGLE_MERCHANT_CLIENT_ID=111311801636391452848
GOOGLE_CLOUD_PROJECT_ID=make-gmail-integration-428317

# Google Merchant Center Account
GOOGLE_MERCHANT_ACCOUNT_ID=5495521926
GOOGLE_MERCHANT_DATA_SOURCE_ID=10571293810

# Feature Flags
NEXT_PUBLIC_GOOGLE_MERCHANT_SYNC_ENABLED=true
NEXT_PUBLIC_CANAUX_VENTE_ENABLED=true
```

---

## 📊 STATISTIQUES

### Code

```
API Routes                  : 7 fichiers (route.ts)
Hooks React Query          : 10 fichiers
Composants UI              : 1 page (550 lignes) + inlined sous-composants
Librairies utilitaires     : 7 fichiers (580 lignes)
Database Migrations        : 2 fichiers (1500+ lignes SQL)
Documentations             : 8+ fichiers (600+ KB)
```

### Features Implémentées

```
✅ Interface complète      : 100%
✅ Database schema         : 100%
✅ API routes             : 88% (7/9)
✅ Hooks React Query      : 100%
✅ Authentification GCP   : 100% (credentials réels)
❌ Appels API Google      : 0% (mock only)
❌ Polling automatique    : 0% (route manquante)
❌ Export Excel           : 0% (route manquante)
```

---

## 🚀 FICHIERS À CONSULTER SELON BESOIN

### Pour Déboguer/Modifier Routes API

```
src/app/api/google-merchant/
  ├── test-connection/route.ts       → Test connexion GCP
  ├── products/batch-add/route.ts     → POST ajouter batch
  ├── products/[id]/price/route.ts    → PUT prix
  ├── products/[id]/metadata/route.ts → PATCH titre/desc
  └── poll-statuses/route.ts          → POST polling
```

### Pour Comprendre Business Logic

```
docs/business-rules/13-canaux-vente/google-merchant/README.md
  → Workflows, pricing rules, eligibility criteria
  
src/lib/google-merchant/transformer.ts
  → Transformation Supabase → Google format
```

### Pour Utiliser Hooks

```
src/hooks/use-google-merchant-sync.ts                   → Sync globale
src/hooks/google-merchant/use-add-products-to-google-merchant.ts → Ajouter
src/hooks/google-merchant/use-update-google-merchant-price.ts    → Modifier prix
```

### Pour Modifier UI

```
src/app/canaux-vente/google-merchant/page.tsx          → Page principale (3 tabs)
  Contient tous les composants inlined (ProductManager, Card, Modals)
```

### Pour Debugger Database

```
supabase/migrations/20251106_117_google_merchant_syncs_table.sql
supabase/migrations/20251106_118_google_merchant_channel_extensions.sql
  → RPCs + tables + triggers
```

---

## ✅ CHECKLIST NAVIGATION RAPIDE

- [ ] Lire `EXECUTIVE-SUMMARY.md` (5 min) → Vue d'ensemble
- [ ] Lire `ANALYSE-COMPLET.md` (15 min) → Détails techniques
- [ ] Lire `docs/business-rules/13-canaux-vente/google-merchant/README.md` (20 min) → Rules métier
- [ ] Consulter fichier API spécifique si modification
- [ ] Consulter RPC spécifique si debug database
- [ ] Consulter hook si modification UI

---

**Generated**: 2025-11-06 | **Type**: Quick Reference Guide
