# API Catalogue V1 — Spécifications Endpoints

> **Version** : 1.0 MVP  
> **Base URL** : `https://verone.com/api/v1`  
> **Authentification** : Bearer Token + RLS

## 🎯 Vue d'Ensemble

### **Architecture API**
- **REST** : Endpoints standardisés CRUD
- **Sécurité** : Row Level Security intégré
- **Performance** : Cache Redis + pagination
- **Monitoring** : Logs détaillés + métriques

### **Authentification**
```javascript
// Header requis pour tous les endpoints
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## 📦 **Endpoints Catalogue**

### **Product Groups** — `/api/v1/product-groups`

#### **GET /product-groups** — Liste Groupes
```typescript
// Requête
GET /api/v1/product-groups?page=1&limit=20&status=active&category_id=uuid

// Réponse
{
  "data": [
    {
      "id": "uuid",
      "name": "Tabouret Romeo",
      "description": "Collection de tabourets design",
      "slug": "tabouret-romeo",
      "category_id": "uuid",
      "brand": "Vérone",
      "status": "active",
      "products_count": 4,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

#### **POST /product-groups** — Créer Groupe
```typescript
// Requête
POST /api/v1/product-groups
{
  "name": "Nouvelle Collection",
  "description": "Description du groupe",
  "category_id": "uuid",
  "brand": "Vérone",
  "status": "draft"
}

// Réponse
{
  "data": {
    "id": "uuid",
    "name": "Nouvelle Collection",
    // ... autres champs
  },
  "message": "Groupe produit créé avec succès"
}
```

#### **GET /product-groups/:id** — Détail Groupe
```typescript
// Réponse avec produits inclus
{
  "data": {
    "id": "uuid",
    "name": "Tabouret Romeo",
    "description": "Collection de tabourets design",
    "category": {
      "id": "uuid",
      "name": "Mobilier Salon",
      "slug": "mobilier-salon"
    },
    "products": [
      {
        "id": "uuid",
        "sku": "VER-TAB-001-BLANC",
        "name": "Tabouret Romeo Blanc",
        "price_ht": 7500,  // centimes
        "status": "in_stock",
        "primary_image_url": "https://...",
        "variant_attributes": {
          "color": "Blanc",
          "material": "Métal"
        }
      }
    ],
    "products_count": 4
  }
}
```

### **Products** — `/api/v1/products`

#### **GET /products** — Liste Produits
```typescript
// Requête avec filtres avancés
GET /api/v1/products?
  page=1&
  limit=50&
  status=in_stock,preorder&
  category_id=uuid&
  group_id=uuid&
  sku=VER-TAB&
  search=tabouret&
  sort=updated_at&
  order=desc

// Réponse
{
  "data": [
    {
      "id": "uuid",
      "product_group_id": "uuid",
      "sku": "VER-TAB-001-BLANC",
      "name": "Tabouret Romeo Blanc",
      "slug": "tabouret-romeo-blanc",
      "price_ht": 7500,
      "price_ttc": 9000,
      "tax_rate": 0.2000,
      "status": "in_stock",
      "condition": "new",
      "variant_attributes": {
        "color": "Blanc",
        "material": "Métal"
      },
      "dimensions": {
        "length": 40,
        "width": 40,
        "height": 75
      },
      "weight": 8.5,
      "primary_image_url": "https://cdn.verone.com/images/prod-123.jpg",
      "gallery_images": ["https://...", "https://..."],
      "brand": "Vérone",
      "gtin": "1234567890123",
      "supplier_reference": "TAB-ROMEO-001",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1247,
    "total_pages": 25
  },
  "filters_applied": {
    "status": ["in_stock", "preorder"],
    "category_id": "uuid"
  }
}
```

#### **POST /products** — Créer Produit
```typescript
// Requête
POST /api/v1/products
{
  "product_group_id": "uuid",
  "sku": "VER-TAB-002-NOIR",
  "name": "Tabouret Romeo Noir",
  "price_ht": 7500,
  "tax_rate": 0.2000,
  "status": "in_stock",
  "condition": "new",
  "variant_attributes": {
    "color": "Noir",
    "material": "Métal"
  },
  "dimensions": {
    "length": 40,
    "width": 40,
    "height": 75
  },
  "weight": 8.5,
  "primary_image_url": "https://cdn.verone.com/images/prod-124.jpg",
  "gallery_images": ["https://..."],
  "brand": "Vérone",
  "supplier_reference": "TAB-ROMEO-002"
}

// Réponse
{
  "data": {
    "id": "uuid",
    "sku": "VER-TAB-002-NOIR",
    // ... produit créé avec packages par défaut
    "packages": [
      {
        "id": "uuid",
        "name": "Unité",
        "type": "single",
        "base_quantity": 1,
        "is_default": true,
        "min_order_quantity": 1
      }
    ]
  },
  "message": "Produit créé avec succès"
}
```

#### **PUT /products/:id** — Modifier Produit
```typescript
// Requête PATCH partielle supportée
PUT /api/v1/products/uuid
{
  "price_ht": 8000,
  "status": "preorder",
  "variant_attributes": {
    "color": "Noir",
    "material": "Métal",
    "finish": "Mat"  // Nouvel attribut
  }
}

// Réponse
{
  "data": {
    "id": "uuid",
    "price_ht": 8000,
    "status": "preorder",
    // ... produit mis à jour
  },
  "message": "Produit mis à jour avec succès"
}
```

### **Product Packages** — `/api/v1/products/:id/packages`

#### **GET /products/:id/packages** — Liste Conditionnements
```typescript
// Réponse
{
  "data": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "name": "Unité",
      "type": "single",
      "base_quantity": 1,
      "min_order_quantity": 1,
      "discount_rate": null,
      "unit_price_ht": null,
      "calculated_price_ht": 7500,  // Prix calculé
      "calculated_price_ttc": 9000,
      "is_default": true,
      "is_active": true,
      "display_order": 0
    },
    {
      "id": "uuid",
      "product_id": "uuid", 
      "name": "Pack 4 tabourets",
      "type": "pack",
      "base_quantity": 4,
      "min_order_quantity": 1,
      "discount_rate": 0.1000,  // 10% remise
      "unit_price_ht": null,
      "calculated_price_ht": 27000,  // 7500 × 4 × 0.9
      "calculated_price_ttc": 32400,
      "is_default": false,
      "is_active": true,
      "display_order": 1
    }
  ]
}
```

#### **POST /products/:id/packages** — Créer Conditionnement
```typescript
// Requête
POST /api/v1/products/uuid/packages
{
  "name": "Pack 6 tabourets",
  "type": "pack",
  "base_quantity": 6,
  "discount_rate": 0.15,  // 15% remise
  "min_order_quantity": 1,
  "description": "Pack familial avec remise avantageuse"
}

// Réponse
{
  "data": {
    "id": "uuid",
    "name": "Pack 6 tabourets",
    "calculated_price_ht": 38250,  // 7500 × 6 × 0.85
    "calculated_price_ttc": 45900,
    // ... autres champs
  },
  "message": "Conditionnement créé avec succès"
}
```

## 📤 **Endpoints Exports Feeds**

### **Feed Configs** — `/api/v1/feeds`

#### **GET /feeds** — Liste Configurations
```typescript
// Réponse
{
  "data": [
    {
      "id": "uuid",
      "name": "Google Merchant France",
      "platform": "google_merchant",
      "language": "fr",
      "format": "csv",
      "schedule_frequency": "weekly",
      "schedule_day": 0,  // Dimanche
      "schedule_hour": 6,  // 6h UTC
      "filters": {
        "category_ids": ["uuid1", "uuid2"],
        "status": ["in_stock", "preorder"],
        "exclude_draft": true
      },
      "is_active": true,
      "last_export_at": "2024-01-14T06:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### **POST /feeds** — Créer Configuration
```typescript
// Requête
POST /api/v1/feeds
{
  "name": "Facebook Meta Export",
  "platform": "facebook_meta",
  "language": "fr",
  "format": "csv",
  "schedule_frequency": "weekly",
  "schedule_day": 0,
  "schedule_hour": 6,
  "filters": {
    "category_ids": ["uuid1"],
    "exclude_draft": true
  },
  "webhook_url": "https://webhook.site/uuid"
}

// Réponse
{
  "data": {
    "id": "uuid",
    "access_token": "ft_live_abc123...",  // Token généré
    // ... configuration créée
  },
  "feed_url": "https://verone.com/api/v1/feeds/uuid/export.csv?token=ft_live_abc123",
  "message": "Configuration feed créée avec succès"
}
```

### **Feed Exports** — `/api/v1/feeds/:id/export`

#### **POST /feeds/:id/export** — Lancer Export Manuel
```typescript
// Requête
POST /api/v1/feeds/uuid/export
{
  "force_regenerate": true,  // Ignorer cache
  "notify_webhook": true     // Notifier fin d'export
}

// Réponse immédiate
{
  "export_id": "uuid",
  "status": "processing",
  "estimated_duration": 120,  // secondes
  "started_at": "2024-01-15T14:30:00Z"
}
```

#### **GET /feeds/:id/exports** — Historique Exports
```typescript
// Réponse
{
  "data": [
    {
      "id": "uuid",
      "feed_config_id": "uuid",
      "status": "completed",
      "file_url": "https://cdn.verone.com/exports/google-20240115.csv",
      "file_size": 2048576,  // octets
      "products_count": 1247,
      "started_at": "2024-01-15T06:00:00Z",
      "completed_at": "2024-01-15T06:02:14Z",
      "duration_seconds": 134,
      "error_message": null,
      "logs": [
        {
          "level": "info",
          "message": "Export démarré pour 1247 produits",
          "timestamp": "2024-01-15T06:00:00Z"
        }
      ]
    }
  ]
}
```

#### **GET /feeds/:id/export.csv** — URL Publique Feed
```typescript
// URL publique avec token (pour Google/Facebook)
GET /api/v1/feeds/uuid/export.csv?token=ft_live_abc123

// Headers réponse
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="verone-products-20240115.csv"
Cache-Control: public, max-age=3600
Last-Modified: Mon, 15 Jan 2024 06:02:14 GMT

// Contenu CSV direct
id,title,description,link,image_link,price,availability,condition,brand...
VER-TAB-001-BLANC,"Tabouret Romeo Blanc en Métal","Tabouret design...","https://...
```

## 🗂️ **Endpoints Collections**

### **Collections** — `/api/v1/collections`

#### **GET /collections** — Liste Collections
```typescript
// Requête
GET /api/v1/collections?
  page=1&
  limit=20&
  is_public=true&
  is_featured=false&
  created_by=uuid&
  language=fr

// Réponse
{
  "data": [
    {
      "id": "uuid",
      "name": "Collection Moderne 2024",
      "slug": "collection-moderne-2024",
      "description": "Mobilier design contemporain",
      "is_public": true,
      "is_featured": true,
      "season": "Automne 2024",
      "style_tags": ["moderne", "minimaliste"],
      "products_count": 24,
      "created_by": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "translations": [
        {
          "language": "fr",
          "name": "Collection Moderne 2024",
          "description": "Mobilier design contemporain"
        },
        {
          "language": "en", 
          "name": "Modern Collection 2024",
          "description": "Contemporary design furniture"
        }
      ]
    }
  ]
}
```

#### **GET /collections/:id/products** — Produits Collection
```typescript
// Réponse
{
  "data": [
    {
      "id": "uuid",
      "collection_id": "uuid",
      "product_group": {
        "id": "uuid",
        "name": "Tabouret Romeo",
        "brand": "Vérone",
        "products_count": 4
      },
      "display_order": 1,
      "is_featured": true,
      "added_at": "2024-01-05T10:00:00Z"
    }
  ]
}
```

## 🔍 **Endpoints Recherche & Filtres**

### **Search** — `/api/v1/search`

#### **POST /search/products** — Recherche Avancée
```typescript
// Requête
POST /api/v1/search/products
{
  "query": "tabouret metal blanc",
  "filters": {
    "categories": ["uuid1", "uuid2"],
    "price_range": {
      "min": 5000,  // centimes
      "max": 15000
    },
    "attributes": {
      "color": ["Blanc", "Noir"],
      "material": ["Métal"]
    },
    "status": ["in_stock", "preorder"],
    "brands": ["Vérone"]
  },
  "sort": {
    "field": "price_ht",
    "order": "asc"
  },
  "page": 1,
  "limit": 20
}

// Réponse avec scoring
{
  "data": [
    {
      "score": 0.95,  // Pertinence 0-1
      "product": {
        "id": "uuid",
        "sku": "VER-TAB-001-BLANC",
        "name": "Tabouret Romeo Blanc",
        // ... produit complet
      },
      "match_highlights": [
        "tabouret",
        "blanc", 
        "métal"
      ]
    }
  ],
  "aggregations": {
    "brands": {
      "Vérone": 156,
      "Autre": 23
    },
    "colors": {
      "Blanc": 45,
      "Noir": 32
    },
    "price_ranges": {
      "0-5000": 12,
      "5000-10000": 89,
      "10000+": 55
    }
  },
  "total": 156,
  "query_time_ms": 24
}
```

## 🔒 **Sécurité & Authentification**

### **JWT Token Structure**
```typescript
// Payload JWT
{
  "sub": "user-uuid",
  "role": "catalog_manager",
  "scopes": [
    "catalog:rcud",
    "feeds:export",
    "collections:rcud"
  ],
  "iat": 1705312800,
  "exp": 1705399200
}
```

### **Rate Limiting**
```typescript
// Headers réponse rate limiting
X-RateLimit-Limit: 1000      // Requêtes/heure
X-RateLimit-Remaining: 950   // Restantes
X-RateLimit-Reset: 1705316400 // Reset timestamp

// Réponse 429 si dépassé
{
  "error": "rate_limit_exceeded",
  "message": "Limite de 1000 requêtes/heure dépassée",
  "retry_after": 3600
}
```

### **Validation Erreurs**
```typescript
// Réponse 422 validation
{
  "error": "validation_failed",
  "message": "Données invalides",
  "details": [
    {
      "field": "price_ht",
      "message": "Prix doit être supérieur à 0",
      "value": -100
    },
    {
      "field": "sku",
      "message": "SKU doit être unique",
      "value": "VER-TAB-001"
    }
  ]
}
```

## 📊 **Performance & Cache**

### **Cache Strategy**
- **Products** : 5 minutes (données fréquemment mises à jour)
- **Categories** : 1 heure (structure stable)
- **Feed Exports** : 30 minutes (optimisation export)
- **Collections** : 15 minutes (changements modérés)

### **Headers Cache**
```typescript
// Response headers optimisées
Cache-Control: public, max-age=300, stale-while-revalidate=60
ETag: "abc123def456"
Last-Modified: Mon, 15 Jan 2024 14:30:00 GMT

// Request validation cache
If-None-Match: "abc123def456"
If-Modified-Since: Mon, 15 Jan 2024 14:30:00 GMT

// 304 Not Modified si pas de changement
```

Cette API assure performance optimale et sécurité robuste pour toutes les opérations catalogue Vérone.