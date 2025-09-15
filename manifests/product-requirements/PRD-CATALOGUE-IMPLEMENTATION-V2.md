# 📋 Plan de Développement Complet — Module Catalogue Vérone

> **Version**: 2.0
> **Date**: 14 Janvier 2025
> **Phase**: Post-Admin MVP → Catalogue Core Implementation
> **Priorité**: CRITIQUE - Module central du système

## 🎯 Vue d'Ensemble du Plan

### **Contexte Post-Admin**
Avec le module d'administration pleinement opérationnel (dashboard, utilisateurs, métriques dynamiques), nous entrons dans la phase 2 : **implémentation du cœur métier catalogue**.

### **Objectif Business**
Créer le système de catalogue partageable qui transformera la productivité commerciale Vérone :
- **-70% temps création catalogues clients**
- **15% conversion catalogue → devis**
- **99% uptime liens partagés**
- **<10s génération feeds Meta/Google**

## 🏗️ Architecture Générale du Module

### **Structure des Pages (9 pages principales)**

```
src/app/catalogue/
├── page.tsx                           # 1. Liste produits avec filtres avancés
├── [id]/
│   ├── page.tsx                       # 2. Détail produit + variantes
│   └── edit/page.tsx                  # 3. Édition produit existant
├── new/page.tsx                       # 4. Création nouveau produit
├── categories/
│   ├── page.tsx                       # 5. Gestion hiérarchie catégories
│   └── [id]/page.tsx                  # 5b. Détail catégorie + produits
├── collections/
│   ├── page.tsx                       # 6. Liste collections internes
│   ├── [id]/page.tsx                  # 6b. Détail collection + partage
│   └── new/page.tsx                   # 6c. Création collection
├── suppliers/
│   ├── page.tsx                       # 7. Gestion fournisseurs
│   └── [id]/page.tsx                  # 7b. Détail fournisseur
└── analytics/page.tsx                 # 8. Analytics catalogue
```

### **Pages Publiques (Hors admin)**

```
src/app/
├── collections/
│   └── [token]/page.tsx               # 9. Catalogue public partagé
└── api/
    ├── feeds/
    │   ├── facebook.csv/route.ts      # Feed Meta Business
    │   └── google.csv/route.ts        # Feed Google Merchant
    └── collections/
        └── [id]/pdf/route.ts          # Export PDF branded
```

## 📊 Phase 1 : Pages Principales (Priorité Maximum)

### **1. Page Liste Produits (`/catalogue`)**

#### **Features Core**
- **Table paginée** : 50 produits/page avec tri et filtres
- **Recherche temps réel** : Nom, référence, description
- **Filtres avancés** :
  - Catégorie (hiérarchique)
  - Statut stock (en_stock, sur_commande, rupture)
  - Prix (fourchettes personnalisables)
  - Fournisseur
  - Date création/modification
- **Actions en masse** : Activation/désactivation, export CSV
- **Vues personnalisables** : Grille, liste, compacte

#### **Interface UX**
```typescript
// Composants principaux
<ProductsHeader /> // Titre, bouton "Nouveau", vues, export
<ProductsFilters /> // Sidebar filtres avec reset
<ProductsTable /> // Table avec colonnes configurables
<ProductsPagination /> // Navigation + sélecteur taille page
```

#### **API Endpoints**
```typescript
// API nécessaires
GET /api/products?page=1&limit=50&search=...&filters=...
POST /api/products/bulk-update
GET /api/products/export.csv
```

### **2. Page Détail Produit (`/catalogue/[id]`)**

#### **Features Core**
- **Informations complètes** : Nom, description, références, prix
- **Galerie images** : Image principale + galerie secondaire
- **Variantes** : Couleurs, tailles, finitions avec stock individuel
- **Tarification contextuelle** : Prix particuliers/professionnels
- **Historique modifications** : Audit trail complet
- **Actions rapides** : Édition, duplication, archivage

#### **Layout Responsive**
```typescript
// Structure responsive
<ProductHeader /> // Nom, statut, actions
<ProductGallery /> // Images avec zoom
<ProductInfo /> // Infos générales + variantes
<ProductPricing /> // Tarifs + conditions
<ProductHistory /> // Modifications + activité
```

### **3. Création/Édition Produit (`/catalogue/new`, `/catalogue/[id]/edit`)**

#### **Formulaire Multi-Étapes**
1. **Étape 1** : Informations générales (nom, description, catégorie)
2. **Étape 2** : Images (upload + organisation)
3. **Étape 3** : Tarification (prix d'achat, vente, conditions)
4. **Étape 4** : Stock et logistique (quantités, fournisseur, MOQ)
5. **Étape 5** : Variantes (optionnel)
6. **Étape 6** : Visibilité et publication

#### **Validation Business Rules**
```typescript
// Règles de validation critiques
const productValidation = {
  nom: { min: 5, max: 200, required: true },
  prix_vente: { min: 0.01, mustBeGreaterThan: 'prix_achat' },
  images: { min: 1, formats: ['jpg', 'png', 'webp'] },
  categorie: { required: true, mustExist: true },
  stock_min: { min: 0, integer: true }
}
```

## 📊 Phase 2 : Gestion Avancée (Priorité Élevée)

### **4. Gestion Catégories (`/catalogue/categories`)**

#### **Hiérarchie à 3 Niveaux**
```
Famille (Mobilier, Décoration, Éclairage, Textile)
  └── Catégorie (Canapés, Tables, Luminaires, Rideaux)
      └── Sous-catégorie (Canapés d'angle, Tables basses)
```

#### **Interface Arbre**
- **Vue arborescente** : Drag & drop pour réorganisation
- **Compteurs produits** : Nombre produits par niveau
- **Actions contextuelles** : Création, édition, fusion
- **URL slugs** : SEO-friendly pour navigation publique

### **5. Collections et Partage (`/catalogue/collections`)**

#### **Gestion Collections**
- **Création assistée** : Sélection produits avec filtres
- **Organisation** : Drag & drop pour ordre d'affichage
- **Partage sécurisé** : Liens avec token + expiration
- **Personnalisation** : Titre, description, branding client

#### **Fonctionnalités Partage**
```typescript
// Paramètres de partage
interface CollectionShare {
  token: string
  expires_at: Date
  password_protected: boolean
  show_prices: boolean
  client_type: 'particulier' | 'professionnel'
  custom_branding?: {
    logo_url?: string
    primary_color?: string
    client_name?: string
  }
}
```

## 📊 Phase 3 : Intégrations et Analytics (Priorité Moyenne)

### **6. Gestion Fournisseurs (`/catalogue/suppliers`)**

#### **Base Fournisseurs**
- **Informations complètes** : Contact, conditions, délais
- **Produits associés** : Catalogue par fournisseur
- **Performance** : Délais livraison, qualité, prix
- **Import/Export** : CSV pour mise à jour en masse

### **7. Analytics Catalogue (`/catalogue/analytics`)**

#### **Métriques Business**
- **Produits** : Les plus consultés, vendus, profitables
- **Collections** : Taux d'ouverture, temps consultation, conversion
- **Catégories** : Performance par segment
- **Fournisseurs** : ROI et satisfaction client

#### **Graphiques Interactifs**
```typescript
// Métriques à afficher
const analytics = {
  topProducts: 'Produits les plus consultés (30j)',
  conversionFunnel: 'Catalogue → Devis → Commande',
  seasonalTrends: 'Tendances saisonnières par catégorie',
  priceOptimization: 'Analyse optimisation prix'
}
```

## 🌐 Phase 4 : Interfaces Publiques (Priorité Critique)

### **8. Catalogue Public (`/collections/[token]`)**

#### **Experience Client Premium**
- **Design Vérone** : Charte graphique élégante
- **Navigation fluide** : Filtres, recherche, tri
- **Images haute qualité** : Zoom, galerie, 360° (futur)
- **Demande devis** : Formulaire intégré avec CRM
- **Responsive excellence** : Mobile-first design

#### **Optimisations Performance**
- **Lazy loading** : Images et contenus on-demand
- **CDN images** : Supabase Storage avec optimisation
- **Cache stratégique** : 24h pour collections statiques
- **SEO basique** : Meta tags, structured data

### **9. Exports et Feeds**

#### **Export PDF Branded**
```typescript
// Paramètres PDF personnalisable
interface PDFConfig {
  template: 'standard' | 'premium' | 'custom'
  branding: {
    logo: boolean
    colors: boolean
    contact_info: boolean
  }
  content: {
    prices: boolean
    descriptions: 'short' | 'full'
    technical_specs: boolean
  }
  layout: 'grid' | 'list' | 'catalog'
}
```

#### **Feeds E-commerce**
```typescript
// Formats conformes Meta/Google
const feedMappings = {
  facebook: {
    id: 'product.id',
    title: 'product.name',
    description: 'product.description',
    link: `https://verone.com/produits/${id}`,
    image_link: 'product.main_image_url',
    price: 'product.price_display + " EUR"',
    availability: 'mapStockStatus(product.status)'
  }
}
```

## 🛠️ Stack Technique Détaillé

### **Frontend Components**

#### **Composants Métier Spécialisés**
```typescript
// Composants catalogue spécifiques
<ProductCard />           // Carte produit avec image + prix
<ProductGrid />           // Grille responsive avec lazy loading
<CategoryTree />          // Arbre hiérarchique avec drag & drop
<CollectionBuilder />     // Interface création collection
<ShareDialog />           // Modal partage avec options
<PriceDisplay />          // Affichage prix contextuel B2B/B2C
<StockIndicator />        // Statut stock avec couleurs métier
<VariantSelector />       // Sélecteur variantes (couleur, taille)
<ImageUploader />         // Upload multiple avec preview
<ProductFilters />        // Filtres avancés avec état persistant
```

### **Hooks Personnalisés**
```typescript
// Hooks métier catalogue
useProductCRUD()          // CRUD produits avec cache SWR
useCollectionShare()      // Gestion partage et permissions
useCategoryTree()         // Navigation hiérarchie catégories
useImageUpload()          // Upload et gestion images Supabase
usePriceCalculator()      // Calculs tarification contextuelle
useProductFilters()       // État et logique filtres avancés
useAnalytics()           // Métriques et données analytics
```

### **Database Schema Additions**

#### **Tables Principales à Créer**
```sql
-- Produits et variantes
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  reference VARCHAR(100) UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  status product_status_type DEFAULT 'draft',
  price_purchase DECIMAL(10,2),
  price_retail DECIMAL(10,2),
  price_wholesale DECIMAL(10,2),
  tax_rate DECIMAL(5,2) DEFAULT 20.00,
  weight_kg DECIMAL(8,3),
  dimensions JSONB, -- {length, width, height, unit}
  moq INTEGER DEFAULT 1,
  stock_quantity INTEGER DEFAULT 0,
  stock_min_level INTEGER DEFAULT 5,
  images JSONB, -- [{url, alt, is_primary, order}]
  technical_specs JSONB,
  seo_data JSONB, -- {slug, meta_title, meta_description}
  visibility_settings JSONB, -- {particuliers, professionnels, affilies}
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variantes produits
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_type VARCHAR(50) NOT NULL, -- 'color', 'size', 'finish'
  variant_value VARCHAR(100) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections (catalogues partagés)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  share_token VARCHAR(255) UNIQUE,
  share_config JSONB, -- {expires_at, password, show_prices, client_type}
  branding_config JSONB, -- {logo_url, colors, client_name}
  product_ids UUID[] NOT NULL,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  organisation_id UUID REFERENCES organisations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hiérarchie catégories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  sort_order INTEGER DEFAULT 0,
  image_url TEXT,
  seo_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fournisseurs
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  contact_info JSONB, -- {email, phone, address, website}
  business_terms JSONB, -- {payment_terms, delivery_time, minimum_order}
  performance_metrics JSONB, -- {rating, delivery_rate, quality_score}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics et tracking
CREATE TABLE collection_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id),
  viewer_ip INET,
  viewer_agent TEXT,
  session_duration INTEGER, -- secondes
  pages_viewed INTEGER DEFAULT 1,
  products_clicked UUID[],
  quote_requested BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚀 Plan d'Implémentation Séquentiel

### **Sprint 1 (Semaine 1-2) : Core CRUD**
1. ✅ **Migration DB** : Tables products, categories, suppliers
2. ✅ **Page liste produits** : Table + filtres de base
3. ✅ **Page détail produit** : Affichage complet
4. ✅ **Création produit** : Formulaire multi-étapes
5. ✅ **Tests E2E** : Workflows CRUD de base

### **Sprint 2 (Semaine 3-4) : Images et Variantes**
1. **Upload images** : Intégration Supabase Storage
2. **Gestion variantes** : Interface couleurs/tailles
3. **Optimisation images** : Compression, formats WebP
4. **Page édition** : Formulaire complet avec validation
5. **Tests performance** : Upload et affichage images

### **Sprint 3 (Semaine 5-6) : Collections et Partage**
1. **Création collections** : Interface sélection produits
2. **Système partage** : Tokens sécurisés + expiration
3. **Page publique** : Catalogue client responsive
4. **Branding client** : Personnalisation visuelle
5. **Tests intégration** : Workflow complet partage

### **Sprint 4 (Semaine 7-8) : Exports et Intégrations**
1. **Export PDF** : Template branded avec Puppeteer
2. **Feeds Meta/Google** : CSV conformes avec cron
3. **Analytics de base** : Vues collections + produits populaires
4. **Optimisations** : Cache, CDN, performance
5. **Tests E2E complets** : Tous workflows métier

## 📊 Métriques de Succès

### **Techniques (SLOs)**
- **Page liste** : <2s chargement 500 produits
- **Upload images** : <5s pour image 2MB
- **Export PDF** : <10s pour collection 50 produits
- **Feeds génération** : <10s pour 1000+ produits
- **Page publique** : <1s First Contentful Paint

### **Business (KPIs)**
- **Adoption** : 100% équipe commerciale <30 jours
- **Productivité** : -70% temps création catalogues
- **Engagement** : >60% temps moyen consultation
- **Conversion** : 15% catalogues → demandes devis
- **Qualité** : 0 régression fonctionnelle

## 🔐 Sécurité et Permissions

### **RLS Policies Critiques**
```sql
-- Produits : accès selon organisation
CREATE POLICY "org_products_access" ON products
  FOR ALL TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM user_organisation_assignments
      WHERE user_id = auth.uid()
    )
  );

-- Collections : propriétaire ou partage public
CREATE POLICY "collections_access" ON collections
  FOR SELECT TO anon, authenticated
  USING (
    created_by = auth.uid() OR
    (share_token IS NOT NULL AND share_config->>'expires_at' > NOW()::text)
  );
```

### **Validation Business Rules**
```typescript
// Règles métier critiques à implémenter
const businessRules = {
  pricing: 'prix_vente > prix_achat (alerte si non respecté)',
  stock: 'passage automatique "rupture" si stock = 0',
  moq: 'quantité commande doit respecter MOQ et multiples',
  visibility: 'produits discontinués non visibles publiquement',
  sharing: 'liens partagés expiration max 90 jours',
  images: 'minimum 1 image, formats JPG/PNG/WebP uniquement'
}
```

## 📋 Checklist de Livraison

### **Phase 1 : MVP Catalogue**
- [ ] **CRUD produits** : Création, lecture, modification, archivage
- [ ] **Upload images** : Multiple avec preview et optimisation
- [ ] **Catégories** : Hiérarchie 3 niveaux avec navigation
- [ ] **Collections** : Création et gestion interne
- [ ] **Tests E2E** : Workflows complets validés

### **Phase 2 : Partage Public**
- [ ] **Partage sécurisé** : Tokens + expiration + mot de passe
- [ ] **Page publique** : Responsive avec design Vérone
- [ ] **Export PDF** : Branded avec template personnalisable
- [ ] **Analytics** : Suivi consultations et engagement
- [ ] **Performance** : SLOs respectés (<10s génération)

### **Phase 3 : Intégrations**
- [ ] **Feeds e-commerce** : Meta/Google conformes
- [ ] **Webhooks** : Brevo events pour marketing automation
- [ ] **API publique** : Endpoints pour partenaires (futur)
- [ ] **Monitoring** : Alertes et métriques temps réel
- [ ] **Documentation** : Guide utilisateur et API

## 🔄 Évolutions Post-MVP

### **Court Terme (Q2 2025)**
- Import en masse (CSV, Excel)
- Historique prix et promotions
- Système de tags et étiquettes
- Recherche avancée (filtres combinés)
- Notifications stock et événements

### **Moyen Terme (Q3 2025)**
- Machine Learning : Recommandations produits
- Images 360° et réalité augmentée
- Intégration comptabilité (Sage, Ciel)
- API REST complète pour partenaires
- Application mobile commerciaux

### **Long Terme (Q4 2025)**
- Intelligence artificielle : Description auto
- Blockchain : Traçabilité et authenticité
- Marketplace : Ouverture tiers partenaires
- Internationalisation multilingue
- Analytics prédictives avancées

---

## 🎯 Conclusion

Ce plan d'implémentation transformera Vérone en leader digital de la décoration d'intérieur grâce à :

### **Innovation Technique**
- Architecture modulaire évolutive
- Performance optimisée (<10s SLOs)
- Sécurité renforcée (RLS + audit)
- UX premium mobile-first

### **Impact Business**
- Productivité commerciale +70%
- Conversion clients +15%
- Satisfaction utilisateur maximale
- Avantage concurrentiel durable

### **Scalabilité**
- Support croissance 10x produits
- Intégrations externes fluides
- Évolutions futures préparées
- Maintenance simplifiée

**Le module catalogue sera le cœur battant du système Vérone, propulsant l'entreprise vers l'excellence digitale.**

---

*Document de référence pour l'implémentation du module catalogue Vérone - Version 2.0*
*Créé le 14 Janvier 2025 par Claude Code Assistant*