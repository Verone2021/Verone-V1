# Architecture CMS Canal "Site Internet" - Exploration Détaillée (2025-11-30)

## 1. STRUCTURE GÉNÉRALE DU CMS

### 1.1 Localisation et Navigation

**Chemin Principal**: `/apps/back-office/src/app/canaux-vente/site-internet/`

**Hiérarchie des Pages**:

```
/canaux-vente/                    # Hub centralisé (page.tsx)
  ├─ page.tsx                     # Sélecteur canaux (3 canaux: google-merchant, site-internet, linkme)
  │
  ├─ site-internet/               # CMS Principal Site Internet
  │  ├─ page.tsx                  # Page maître avec 7 onglets
  │  ├─ produits/[id]/            # Détail produit (sous-page)
  │  │  ├─ page.tsx
  │  │  └─ components/            # 6 sections éditables
  │  ├─ components/               # 7 composants UI
  │  ├─ hooks/                    # 10+ hooks métier
  │  ├─ types.ts                  # Types TypeScript (RPC + UI)
  │  │
  │  ├─ google-merchant/          # Canal Google Shopping (Phase 2)
  │  ├─ linkme/                   # Plateforme affiliation (Phase 1)
  │  └─ prix-clients/             # Tarification client (Phase 2)
```

### 1.2 Structure Page Maître (page.tsx - 232 lignes)

**7 Onglets Principaux** (Tabs):

1. **Dashboard** → `VercelAnalyticsDashboard` (KPI Vercel Analytics)
2. **Produits** → `ProductsSection` (Gestion produits + variantes)
3. **Collections** → `CollectionsSection` (Toggle visibilité collections)
4. **Catégories** → `CategoriesSection` (Arborescence catégories)
5. **Configuration** → `ConfigurationSection` (SEO, domaine, contact, analytics)
6. **Commandes** → Placeholder (prochainement)
7. **Clients** → Placeholder (prochainement)

**Header Sticky**:

- Bouton retour vers `/canaux-vente`
- Badge "Actif"
- Bouton "Voir le site" (https://verone.fr)

---

## 2. GESTION DES PRODUITS (SECTION CRITIQUE)

### 2.1 Hook Principal: `useSiteInternetProducts()`

**Fichier**: `hooks/use-site-internet-products.ts` (262 lignes)

**Fonction RPC**: `get_site_internet_products()` (Supabase)

**Retour (SiteInternetProduct)**:

```typescript
interface SiteInternetProduct {
  // Identifiant
  product_id: string;
  sku: string;
  name: string;
  slug: string | null;
  status: string;

  // SEO (editable canal)
  seo_title: string;
  seo_meta_description: string;
  metadata: Record<string, any>;

  // Prix
  price_ht: number;
  price_ttc: number;
  price_source: 'channel_pricing' | 'base_price';
  discount_rate: number | null;

  // Images
  primary_image_url: string | null;
  image_urls: string[];

  // Publication
  is_published: boolean;
  publication_date: string | null;

  // Variantes
  has_variants: boolean;
  variants_count: number;
  variant_group_id: string | null;
  eligible_variants_count: number;

  // Éligibilité
  is_eligible: boolean;
  ineligibility_reasons: string[];

  // Marketing (editable)
  description: string | null;
  technical_description: string | null;
  brand: string | null;
  selling_points: string[];

  // Produit (READ-ONLY)
  dimensions: Record<string, any> | null;
  weight: number | null;
  suitable_rooms: string[];
  subcategory_id: string | null;
  subcategory_name: string | null;
  product_type: string | null;
  video_url: string | null;
  supplier_moq: number | null;
}
```

### 2.2 Opérations CRUD Produits

#### 2.2.1 Ajouter Produits au Canal

**Fonction**: `useAddProductsToSiteInternet()`

**Workflow**:

```typescript
1. Récupérer canal_id depuis sales_channels WHERE code = 'site_internet'
2. Upsert dans channel_product_metadata (liaison produit ↔ canal)
3. Publier produits (is_published_online = true)
```

**Tables Impliquées**:

- `sales_channels` (lookup canal par code)
- `channel_product_metadata` (liaison produit-canal) ← **TABLE CLÉE**
- `products` (update publication)

#### 2.2.2 Supprimer Produit du Canal

**Fonction**: `useRemoveProductFromSiteInternet()`

**Workflow**:

```typescript
1. Dépublier produit (is_published_online = false)
2. Conserver métadonnées (historique) ← Soft delete pattern
```

#### 2.2.3 Toggle Publication

**Fonction**: `useToggleProductPublication()`

**Optimistic Update**: Mise à jour locale avant validation serveur

```typescript
- Modifier is_published_online dans products
- Remplir publication_date ou unpublication_date
```

#### 2.2.4 Mettre à Jour Métadonnées SEO

**Fonction**: `useUpdateProductMetadata()`

**Tables**:

- `channel_product_metadata` (upsert)
  - Fields: `custom_title`, `custom_description`, `metadata` (JSONB)

### 2.3 Composant ProductsSection (>180 lignes)

**Fonctionnalités**:

- Recherche avec debounce (300ms)
- Filtres: `status` (all|published|draft)
- Table produits avec:
  - Image thumbnail
  - SKU + Nom
  - Prix HT/TTC
  - Badge publication/variantes
  - Actions: Edit, Delete, Preview, Toggle publish

**Modales Associées**:

- `EditSiteInternetProductModal` (édition produits)
- `ProductPreviewModal` (aperçu site)

---

## 3. LIAISON PRODUITS ↔ CANAL (ARCHITECTURE CLÉE)

### 3.1 Table Centrale: `channel_product_metadata`

**Rôle**: Liaison polymorphique entre produits et canaux de vente

**Colonnes Clées** (exemple partiel):

```typescript
- id: uuid (PK)
- product_id: uuid (FK products)
- channel_id: uuid (FK sales_channels) ← **Lien canal**
- metadata: jsonb (custom fields)
- custom_title: text (SEO editable)
- custom_description: text (SEO editable)
- updated_at: timestamptz
```

**Pattern**: Upsert `ON CONFLICT(product_id, channel_id)`

- Évite doublons
- Permet édition séparée SEO par canal

### 3.2 Tables Complémentaires

#### 3.2.1 `channel_pricing`

**Rôle**: Prix spécifiques par canal

```typescript
- product_id: uuid (FK)
- channel_id: uuid (FK) ← sales_channels
- price_ht: numeric
- discount_rate: numeric
```

**Note**: Si NULL → utiliser `products.base_price`

#### 3.2.2 `sales_channels`

**Rôle**: Registre central des canaux de vente

```typescript
- id: uuid (PK)
- code: varchar UNIQUE (site_internet, google_merchant, linkme)
- name: varchar
- description: text
- config: jsonb (analytics, features, shipping)
- is_active: boolean
```

**Lookup Pattern** (utilisé partout):

```typescript
const { data: channel } = await supabase
  .from('sales_channels')
  .select('id')
  .eq('code', 'site_internet')
  .single();
```

### 3.3 Collections et Catégories

#### Collections

**Table**: `collections`

**Champ Clé**: `visible_channels` (UUID[] - array de channel_id)

**Logic**:

```typescript
// NULL = visible partout (défaut)
// [] = invisible partout
// [uuid1, uuid2] = visible que sur ces canaux

// Helper function:
function isCollectionVisibleOnChannel(collection, channelId): boolean {
  if (!collection.visible_channels) return collection.is_active;
  if (collection.visible_channels.length === 0) return false;
  return collection.visible_channels.includes(channelId);
}
```

#### Catégories

**Table**: `categories`

**Champ Clé**: `is_visible_menu` (boolean - niveau canal)

**Logic**:

- Simple toggle par catégorie
- Pas de multi-canal (actuellement)
- Arborescence via `family_id` (parent-child)

---

## 4. CONFIGURATION CANAL

### 4.1 Hook: `useSiteInternetConfig()`

**Fichier**: `hooks/use-site-internet-config.ts` (150 lignes)

**Fonction RPC**: `get_site_internet_config()` (Supabase)

**Retour (SiteInternetConfig)**:

```typescript
interface SiteInternetConfig {
  id: string;
  code: string;
  name: string;
  domain_url: string;
  site_name: string;
  site_logo_url: string | null;

  // SEO defaults
  default_meta_title: string;
  default_meta_description: string;
  meta_keywords: string[];

  // Contact
  contact_email: string;
  contact_phone: string;

  // Config JSONB
  config: {
    analytics?: {
      vercel_enabled?: boolean;
      google_analytics_id?: string | null;
      google_tag_manager_id?: string | null;
    };
    social_links?: {
      instagram?: string | null;
      facebook?: string | null;
      tiktok?: string | null;
    };
    features?: {
      enable_wishlist?: boolean;
      enable_reviews?: boolean;
      enable_live_chat?: boolean;
    };
    shipping?: {
      free_shipping_threshold?: number;
      regions?: string[];
    };
  };
}
```

### 4.2 ConfigurationSection (Composant)

**Fonctionnalités**:

- **Identité**: Domaine, nom site, logo
- **SEO**: Meta title, description, keywords
- **Contact**: Email, téléphone
- **Analytics**: Google Analytics ID, GTM ID, Facebook Pixel
- **Upload Logo**: Supabase Storage (`bucket: public`, `path: logos/`)

**Mutations**:

- `useUpdateSiteInternetConfig()` → Update `sales_channels`
- `useUploadSiteLogo()` → Storage + URL public
- `useUpdateSiteInternetConfigJSON()` → Merge JSONB `config`

---

## 5. DÉTAIL PRODUIT (SOUS-PAGE)

### 5.1 Route et Structure

**Route**: `/canaux-vente/site-internet/produits/[id]`

**Composant**: `produits/[id]/page.tsx` (>100 lignes)

**6 Sections Éditables**:

1. `ProductHeaderSection` - Titre, SKU, status
2. `ProductInfoSection` - Description, brand, selling points
3. `ProductPhotosSection` - Galerie images
4. `ProductPricingSection` - Prix HT/TTC, réductions
5. `ProductStockSection` - Stocks réel/prévisionnel
6. `ProductMetadataSection` - SEO, metadata JSONB

### 5.2 Hook: `useProductDetail(productId)`

**Fonction RPC**: `get_site_internet_products()` avec `eq('product_id', id).single()`

**Variantes**: Via `ProductVariantsDisplay`

---

## 6. DONNÉES DE BASE UTILISÉES

### 6.1 Tables Principales

| Table                      | Rôle                   | Rows | Notes                               |
| -------------------------- | ---------------------- | ---- | ----------------------------------- |
| `sales_channels`           | Registre canaux        | 3+   | Code, config JSONB                  |
| `channel_product_metadata` | Liaison produit-canal  | 250+ | Clée pour multi-canal               |
| `channel_pricing`          | Prix par canal         | ?    | Alternative à base_price            |
| `products`                 | Catalogue produits     | 19   | Stock global (pas séparé par canal) |
| `collections`              | Collections/catalogues | 2    | visible_channels array              |
| `categories`               | Catégories hiérarchie  | 11   | is_visible_menu toggle              |
| `product_images`           | Images produits        | 19   | storage_path + public_url           |
| `subcategories`            | Sous-catégories        | 39   | Parent via category_id              |

### 6.2 Exemple Flux Produit Vers Canal

```
1. Produit créé dans products (catalogue)
   ↓
2. Ajout à site-internet via useAddProductsToSiteInternet()
   ↓
3. Insert channel_product_metadata (product_id, channel_id)
   ↓
4. Update products (is_published_online = true)
   ↓
5. Affichage dans ProductsSection via RPC get_site_internet_products()
   ↓
6. Édition métadonnées SEO dans channel_product_metadata
   ↓
7. Visibilité contrôlée par is_published + is_active
```

---

## 7. TYPES TypeScript (types.ts - 333 lignes)

### 7.1 Types Database

```typescript
import type { Database } from '@verone/types';

export type SalesChannel =
  Database['public']['Tables']['sales_channels']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductImage =
  Database['public']['Tables']['product_images']['Row'];
export type Collection = Database['public']['Tables']['collections']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type ChannelProductMetadata =
  Database['public']['Tables']['channel_product_metadata']['Row'];
export type ChannelPricing =
  Database['public']['Tables']['channel_pricing']['Row'];
```

### 7.2 Types RPC

- `SiteInternetProduct` (liste produits publiés)
- `SiteInternetProductDetail` (détail complet avec variantes)
- `SiteInternetConfig` (configuration canal)

### 7.3 Types UI

- `ProductCardProps`
- `ProductSEOEditorProps`
- `ProductVariantsDisplayProps`
- `ChannelConfigEditorProps`

---

## 8. NAVIGATION (TAB STRUCTURE)

**Parent**: Page maître site-internet
**State**: `activeTab` (useState)
**Lib**: Radix UI `Tabs` component (@verone/ui)

**Pattern**:

```typescript
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="dashboard">
      <BarChart /> Dashboard
    </TabsTrigger>
    <!-- 6 autres tabs -->
  </TabsList>

  <TabsContent value="dashboard">
    <VercelAnalyticsDashboard />
  </TabsContent>
  <!-- Autres contents -->
</Tabs>
```

---

## 9. FLUX DE DONNÉES (OVERVIEW)

```
ProductsSection (UI)
  ↓
useSiteInternetProducts() (Hook)
  ↓
RPC: get_site_internet_products() (Backend)
  ↓
Query SELECT products
  JOIN channel_product_metadata ON product_id
  JOIN channel_pricing (si exists)
  WHERE channel_id = 'site_internet'
  ↓
SiteInternetProduct[] (typed)
  ↓
Filtrage + Affichage (Search, Status Filter)
  ↓
Actions Mutations:
  - useToggleProductPublication()
  - useRemoveProductFromSiteInternet()
  - useUpdateProductMetadata()
```

---

## 10. FICHIERS CLÉS À LIRE (PAR PRIORITÉ)

### Must-Read

1. `/page.tsx` (232 L) - Page maître, navigation
2. `/types.ts` (333 L) - Types de données
3. `/hooks/use-site-internet-products.ts` (262 L) - Logique CRUD
4. `/components/ProductsSection.tsx` (>180 L) - Gestion produits UI
5. `/hooks/use-site-internet-config.ts` (150 L) - Configuration

### Secondaire (Collections/Catégories)

6. `/components/CollectionsSection.tsx` - Visible_channels toggle
7. `/hooks/use-site-internet-collections.ts` - Collections CRUD
8. `/components/CategoriesSection.tsx` - Menu visibility
9. `/hooks/use-site-internet-categories.ts` - Categories CRUD

### Détail Produit

10. `/produits/[id]/page.tsx` - Sous-page détail
11. `/produits/[id]/components/ProductHeaderSection.tsx` - Et autres sections

### Configuration

12. `/components/ConfigurationSection.tsx` (>80 L) - Config globale canal
13. `/hooks/use-site-internet-config.ts` - Config mutations

---

## 11. PATTERNS DÉTECTÉS

### 11.1 Optimistic Update (React Query)

```typescript
onMutate: async ({ productId, isPublished }) => {
  await queryClient.cancelQueries({ queryKey: ['site-internet-products'] });
  const previousData = queryClient.getQueryData([...]);
  queryClient.setQueryData([...], old => /* update */);
  return { previousData };
}
onError: (err, vars, context) => {
  queryClient.setQueryData([...], context.previousData);
}
```

### 11.2 Soft Delete (Collections)

```typescript
// Pas de suppression physique
// visible_channels = [] = invisible
// Permet restoration futur
```

### 11.3 Polymorphic Relationship

```typescript
// channel_product_metadata = JOIN table
// Permet produit → multiples canaux
// Chaque canal a sa config SEO, prix, etc.
```

### 11.4 Debounced Search

```typescript
const debouncedSearch = useDebounce(searchTerm, 300);
// Évite re-render à chaque keystroke
```

---

## 12. MULTI-CANAL ARCHITECTURE (FUTURE)

### Canaux Actifs

1. **Google Merchant Center** (Active)
   - Sync produits Google Shopping
   - Historique: `google_merchant_syncs` table
2. **Site Internet** (Active) ← **CMS ACTUELLEMENT EXPLORÉ**
3. **LinkMe** (Active)
   - Plateforme affiliation B2B2C
   - Commission tracking

### Canaux Phase 2

4. Instagram Shopping
5. Facebook Marketplace

### Pattern Architecture

```
sales_channels (registry)
  ├─ google_merchant
  ├─ site_internet ← Ici
  └─ linkme

Chaque canal a:
  - channel_product_metadata (liaison)
  - channel_pricing (tarifs séparés)
  - Métadonnées spécifiques (SEO, visibilité, etc.)
```

---

## 13. NOTES IMPORTANTES

### Stocks

- **Stock GLOBAL** (pas séparé par canal)
- `products.stock_real` = Stock physique unique
- `products.stock_forecasted_in/out` = Prévisions
- `stock_movements.channel_id` = Pour analytics uniquement (traçabilité vente)

### Pricing

- **Base price** dans `products` (default)
- **Override** possible via `channel_pricing`
- **Selection logic**: `SiteInternetProduct.price_source` = enum

### Images

- Stored: Supabase Storage bucket `product-images`
- Reference: `product_images.storage_path` + `public_url`
- Display: `ProductThumbnail` component (@verone/products)

### Variantes

- Table: `variant_groups` (parent)
- Éligibilité: Seules variantes `is_active` comptées
- Affichage: Via RPC agrégation

---

## 14. SUPABASE RPC FUNCTIONS

### Principales

1. **`get_site_internet_products()`**
   - Retour: `SiteInternetProduct[]`
   - Filtre: canal = 'site_internet', is_published = true
   - Agrégation: images, variantes, pricing

2. **`get_site_internet_product_detail(product_id)`**
   - Retour: `SiteInternetProductDetail` (avec variantes détail)
3. **`get_site_internet_config()`**
   - Retour: `SiteInternetConfig`
   - Query: `sales_channels` WHERE code = 'site_internet'

---

## RÉSUMÉ EXÉCUTIF

**CMS Site Internet** = Interface complète gestion e-commerce Vérone

- **7 onglets** de gestion (produits, collections, catégories, config, etc.)
- **Table clée**: `channel_product_metadata` (liaison produit ↔ canal)
- **Pattern**: Polymorphic relationships (support multi-canal futur)
- **Optimisations**: Optimistic updates, debounced search, RPC caching
- **Features**: SEO éditable par canal, pricing override, toggle visibilité
- **Stock**: Global (pas de séparation par canal, traçabilité via movements)
- **Images**: Supabase Storage avec référencement DB
- **Extensibilité**: Prête pour Phase 2 (Instagram, Facebook, etc.)
