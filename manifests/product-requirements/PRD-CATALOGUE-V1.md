# PRD Catalogue V1 — MVP Catalogue Partageable

> **Version** : 1.0 MVP  
> **Statut** : Spécifications Techniques  
> **Objectif** : Catalogue flexible avec conditionnements et exports feeds

## 🎯 Vue d'Ensemble

### **Vision MVP**
Système de catalogue produit flexible permettant la gestion de conditionnements complexes et l'export automatique vers Facebook Meta et Google Merchant Center.

### **Périmètre V1**
- ✅ Gestion produits avec conditionnements flexibles
- ✅ Architecture multilingue (FR, EN, PT)
- ✅ Exports feeds publicitaires automatisés
- ✅ API REST complète pour intégrations externes
- ✅ Interface back-office pour gestion catalogue

### **Non-Scope V1**
- ❌ Gestion stock temps réel
- ❌ Workflow validation produits
- ❌ Import automatique fournisseurs
- ❌ Synchronisation multi-entrepôts

## 🏗️ Architecture Catalogue

### **Entités Core**

#### **Product Groups** — Groupes Produits
```typescript
interface ProductGroup {
  id: string;                    // UUID
  name: string;                  // "Tabouret Romeo"
  description?: string;          // Description groupe
  category_id: string;           // Catégorie principale
  brand?: string;                // "Vérone" | marque fournisseur
  status: ProductStatus;         // Statut global groupe
  created_at: DateTime;
  updated_at: DateTime;
}

type ProductStatus = 
  | 'draft'           // Brouillon
  | 'active'          // Actif (visible feeds)
  | 'inactive'        // Inactif (masqué)
  | 'discontinued';   // Arrêté
```

#### **Products** — Produits Individuels
```typescript
interface Product {
  id: string;                    // UUID
  product_group_id: string;      // Référence groupe
  sku: string;                   // Code unique "VER-TAB-001-BLANC"
  name: string;                  // "Tabouret Romeo Blanc"
  slug: string;                  // URL-friendly
  
  // Prix & Disponibilité
  price_ht: number;              // Prix HT de base
  tax_rate: number;              // Taux TVA (0.20)
  cost_price?: number;           // Prix d'achat
  status: AvailabilityStatus;    // Disponibilité
  
  // Variantes & Attributs
  variant_attributes: Record<string, any>; // {color: "Blanc", material: "Métal"}
  dimensions?: Dimensions;       // L x P x H
  weight?: number;               // kg
  
  // Images & Médias
  primary_image_url: string;     // Image principale
  gallery_images: string[];     // Images supplémentaires
  video_url?: string;           // Vidéo démo
  
  // Métadonnées
  supplier_reference?: string;   // Référence fournisseur
  gtin?: string;                // Code-barres EAN13
  condition: ProductCondition;   // État produit
  
  created_at: DateTime;
  updated_at: DateTime;
}

type AvailabilityStatus = 
  | 'in_stock'        // En stock
  | 'out_of_stock'    // Rupture
  | 'preorder'        // Précommande
  | 'coming_soon'     // Bientôt disponible
  | 'discontinued';   // Arrêté

type ProductCondition = 'new' | 'refurbished' | 'used';

interface Dimensions {
  length: number;     // cm
  width: number;      // cm  
  height: number;     // cm
}
```

### **Système Conditionnements**

#### **Product Packages** — Conditionnements Flexibles
```typescript
interface ProductPackage {
  id: string;                    // UUID
  product_id: string;            // Produit de base
  name: string;                  // "Pack 4 tabourets"
  type: PackageType;             // Type conditionnement
  
  // Configuration
  base_quantity: number;         // Quantité de base
  unit_price_ht?: number;        // Prix unitaire spécifique
  discount_rate?: number;        // Remise (0.15 = -15%)
  min_order_quantity: number;    // MOQ pour ce conditionnement
  
  // Métadonnées
  description?: string;          // Description conditionnement
  is_default: boolean;           // Conditionnement par défaut
  is_active: boolean;           // Disponible commande
  
  created_at: DateTime;
  updated_at: DateTime;
}

type PackageType = 
  | 'single'          // Unité (par défaut)
  | 'pack'            // Pack multi-unités
  | 'bulk'            // Vrac/palette
  | 'custom';         // Conditionnement spécial

// Exemples d'usage
const singleUnit: ProductPackage = {
  name: "Unité",
  type: "single",
  base_quantity: 1,
  min_order_quantity: 1,
  is_default: true
};

const pack4: ProductPackage = {
  name: "Pack 4 tabourets",
  type: "pack", 
  base_quantity: 4,
  discount_rate: 0.10,        // -10% sur pack 4
  min_order_quantity: 1
};

const bulk50: ProductPackage = {
  name: "Palette 50 unités",
  type: "bulk",
  base_quantity: 50,
  discount_rate: 0.25,        // -25% sur palette
  min_order_quantity: 1
};
```

### **Collections & Organisation**

#### **Collections** — Regroupements Métier
```typescript
interface Collection {
  id: string;                    // UUID
  name: string;                  // "Collection Moderne 2024"
  slug: string;                  // URL-friendly
  description?: string;
  
  // Visibilité
  is_public: boolean;            // Partageable externes
  is_featured: boolean;          // Collection mise en avant
  
  // Multilingue
  translations: CollectionTranslation[];
  
  // Métadonnées
  season?: string;               // "Automne 2024"
  style_tags: string[];         // ["moderne", "minimaliste"]
  created_by: string;            // UUID user
  
  created_at: DateTime;
  updated_at: DateTime;
}

interface CollectionTranslation {
  language: 'fr' | 'en' | 'pt';
  name: string;
  description?: string;
}

// Table de liaison
interface CollectionProduct {
  collection_id: string;
  product_group_id: string;
  display_order: number;        // Ordre affichage
  is_featured: boolean;         // Produit vedette collection
}
```

#### **Categories** — Hiérarchie Produits
```typescript
interface Category {
  id: string;                    // UUID
  name: string;                  // "Mobilier Salon"
  slug: string;                  // "mobilier-salon"
  parent_id?: string;            // Hiérarchie
  level: number;                 // 0 = racine, 1 = sous-cat
  
  // Mappings externes
  google_category_id?: number;   // Google Taxonomy
  facebook_category?: string;    // Facebook category
  
  // Multilingue
  translations: CategoryTranslation[];
  
  // SEO & Display
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  
  created_at: DateTime;
  updated_at: DateTime;
}

interface CategoryTranslation {
  language: 'fr' | 'en' | 'pt';
  name: string;
  description?: string;
}
```

## 🌍 Système Multilingue

### **Product Translations**
```typescript
interface ProductTranslation {
  id: string;
  product_id: string;
  language: 'fr' | 'en' | 'pt';
  
  // Contenu traduit
  name: string;                  // Nom produit
  description?: string;          // Description
  meta_title?: string;          // SEO title
  meta_description?: string;     // SEO description
  
  // Attributs traduits
  variant_attributes?: Record<string, string>; // {color: "White", material: "Metal"}
  
  created_at: DateTime;
  updated_at: DateTime;
}

// Usage exemple
const productFR: ProductTranslation = {
  product_id: "prod-123",
  language: "fr",
  name: "Tabouret Romeo Blanc",
  description: "Tabouret design moderne en métal blanc",
  variant_attributes: {
    color: "Blanc",
    material: "Métal"
  }
};

const productEN: ProductTranslation = {
  product_id: "prod-123", 
  language: "en",
  name: "Romeo White Stool",
  description: "Modern design stool in white metal",
  variant_attributes: {
    color: "White", 
    material: "Metal"
  }
};
```

## 🔄 Exports Feeds

### **Feed Configuration**
```typescript
interface FeedConfig {
  id: string;                    // UUID
  name: string;                  // "Google Merchant France"
  platform: FeedPlatform;       // Plateforme cible
  language: 'fr' | 'en' | 'pt'; // Langue export
  
  // Configuration export
  format: 'csv' | 'xml' | 'json';
  schedule: FeedSchedule;        // Planification
  is_active: boolean;
  
  // Filtres produits
  filters: FeedFilters;
  
  // URLs & Tokens
  webhook_url?: string;          // Notification fin export
  access_token: string;          // Token sécurisé
  
  created_at: DateTime;
  updated_at: DateTime;
}

type FeedPlatform = 
  | 'google_merchant'
  | 'facebook_meta'
  | 'custom';

interface FeedSchedule {
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  day_of_week?: number;          // 0=dimanche pour weekly
  hour: number;                  // Heure UTC
}

interface FeedFilters {
  category_ids?: string[];       // Filtrer par catégories
  collection_ids?: string[];     // Filtrer par collections
  status?: AvailabilityStatus[]; // Filtrer par statuts
  exclude_draft: boolean;        // Exclure brouillons
}
```

### **Feed Exports**
```typescript
interface FeedExport {
  id: string;                    // UUID
  feed_config_id: string;        // Configuration utilisée
  
  // Métadonnées export
  status: ExportStatus;
  file_url?: string;             // URL fichier généré
  file_size?: number;            // Taille en octets
  products_count: number;        // Nombre produits exportés
  
  // Logs & Erreurs
  started_at: DateTime;
  completed_at?: DateTime;
  error_message?: string;
  logs: ExportLog[];
  
  created_at: DateTime;
}

type ExportStatus = 
  | 'pending'     // En attente
  | 'processing'  // En cours
  | 'completed'   // Terminé avec succès
  | 'failed'      // Échec
  | 'cancelled';  // Annulé

interface ExportLog {
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: DateTime;
  context?: Record<string, any>;
}
```

## 🎨 Interface Back-Office

### **Pages Principales**

#### **Dashboard Catalogue**
- 📊 Métriques globales (total produits, par statut, derniers exports)
- 📈 Graphiques évolution catalogue
- 🚨 Alertes stock/erreurs feeds
- ⚡ Actions rapides (export immédiat, nouveau produit)

#### **Gestion Produits**
- 📋 Liste produits avec filtres avancés
- 🔍 Recherche multicritères (nom, SKU, catégorie, attributs)
- ✏️ Édition en lot (prix, statuts, catégories)
- 📱 Aperçu rendu feeds (Google/Facebook)

#### **Gestion Collections**
- 🗂️ Arborescence collections privées/publiques
- 🎯 Glisser-déposer organisation produits
- 🌍 Gestion traductions multilingues
- 📤 Export collections spécifiques

#### **Configuration Feeds**
- ⚙️ Paramétrage exports Google/Facebook
- 📅 Planification automatique
- 📊 Historique exports avec logs détaillés
- 🔑 Gestion tokens sécurisés

### **Formulaires Produits**

#### **Onglet Informations Générales**
```typescript
// Champs obligatoires
- nom_produit: string (multilingue)
- description: text (multilingue)  
- categorie: select
- prix_ht: number
- taux_tva: select (20%, 10%, 5.5%, 2.1%)
- statut: select
- image_principale: file upload

// Champs optionnels
- marque: string
- reference_fournisseur: string
- code_barre: string
- poids: number
- dimensions: {longueur, largeur, hauteur}
```

#### **Onglet Variantes & Attributs**
```typescript
// Système clé-valeur flexible
variant_attributes: {
  couleur: ["Blanc", "Noir", "Gris"],
  matiere: ["Métal", "Bois", "Tissu"],
  style: ["Moderne", "Classique", "Industriel"],
  finition: ["Laqué", "Mat", "Brillant"]
}
```

#### **Onglet Conditionnements**
```typescript
// Gestion packages multiples
packages: [
  {
    nom: "Unité",
    type: "single", 
    quantite: 1,
    moq: 1,
    par_defaut: true
  },
  {
    nom: "Pack 4",
    type: "pack",
    quantite: 4, 
    remise: 10,
    moq: 1
  }
]
```

## 🔒 Sécurité & Permissions

### **Accès Données**
- **Owner/Admin** : CRUD complet sur tous produits
- **Catalog Manager** : CRUD produits + exports feeds
- **Sales** (V2) : Lecture seule produits actifs
- **Guest** : Accès collections publiques uniquement

### **Row Level Security**
```sql
-- Produits : accès selon rôle
CREATE POLICY "products_access" ON products
  FOR ALL USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager') OR
    (get_user_role() = 'sales' AND status = 'active')
  );

-- Collections privées : créateur + admins
CREATE POLICY "collections_private" ON collections  
  FOR ALL USING (
    created_by = auth.uid() OR
    get_user_role() IN ('owner', 'admin') OR
    is_public = true
  );
```

### **API Tokens**
- 🔐 Tokens feeds avec expiration
- 🎯 Scopes granulaires par feed
- 📝 Logs accès API complets
- 🚨 Rate limiting par token

## 📊 Métriques & Analytics

### **KPIs Catalogue**
- Nombre total produits actifs
- Répartition par catégories/collections
- Évolution ajouts/suppressions
- Taux de conversion feeds (produits exportés/total)

### **Performance Exports**
- Durée moyenne génération feeds
- Taille fichiers par plateforme
- Fréquence erreurs export
- Délai synchronisation externes

Cette architecture MVP permet une gestion flexible du catalogue tout en préparant les évolutions V2 (workflow validation, gestion stock avancée, imports automatiques).