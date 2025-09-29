# 🏗️ Architecture Technique Vérone - Consolidée

**Version** : 2.0 Consolidée
**Stack** : Next.js + Supabase + shadcn/ui
**Mise à jour** : 27 septembre 2025

---

## 🎯 **ARCHITECTURE SYSTÈME**

### **Stack Technique**
```
Frontend: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
Backend: Supabase (PostgreSQL + Auth + RLS + APIs)
Deploy: Vercel (frontend) + Supabase Cloud (backend)
```

### **Structure Application**
```
src/
├── app/           # Next.js App Router
├── components/    # shadcn/ui + composants métier
├── hooks/         # Hooks React + Supabase
└── lib/          # Utilities + configurations
```

---

## 🔐 **SÉCURITÉ & AUTHENTIFICATION**

### **Row Level Security (RLS)**
- Filtrage automatique par `organisation_id`
- Politiques Supabase niveau base de données
- Isolation complète entre organisations

### **Authentification**
```typescript
// Header API standard
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 📡 **API CATALOGUE REST**

### **Base Configuration**
- **Base URL** : `https://verone.com/api/v1`
- **Auth** : Bearer Token + RLS
- **Performance** : Cache Redis + pagination
- **Format** : JSON standardisé

### **Endpoints Principaux**
```typescript
GET /api/v1/products              // Liste produits
GET /api/v1/products/:id          // Détail produit
GET /api/v1/product-groups        // Groupes/variantes
GET /api/v1/categories            // Catégories
GET /api/v1/feeds/google          // Export Google Merchant
GET /api/v1/feeds/facebook        // Export Facebook Meta
```

### **Pagination Standard**
```typescript
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 📊 **BASE DE DONNÉES**

### **Tables Principales**
```sql
-- Organisations (multi-tenant)
organisations (id, name, settings)

-- Catalogue
product_groups (id, name, organisation_id)
products (id, group_id, name, sku, price_ht, price_ttc)
categories (id, name, parent_id, organisation_id)
characteristics (id, product_id, name, value)

-- Stock
stock_movements (id, product_id, quantity, type, user_id)
stock_levels (product_id, quantity_available, quantity_reserved)
```

### **Performance & Index**
- Index sur `organisation_id` (RLS)
- Index sur `sku` (recherche produits)
- Index composites pour filtres fréquents

---

## 🔄 **INTÉGRATIONS FEEDS**

### **Google Merchant Center**
```xml
<!-- Format Google Product Feed -->
<item>
  <g:id>SKU-123</g:id>
  <g:title>Nom Produit</g:title>
  <g:price>99.99 EUR</g:price>
  <g:availability>in stock</g:availability>
  <g:item_group_id>GROUP-456</g:item_group_id>
</item>
```

### **Facebook Meta Catalog**
```typescript
// Mapping statuts
en_stock → "in stock"
sur_commande → "preorder"
rupture → "out of stock"
discontinue → non inclus
```

### **Performance SLO**
- Génération feeds : <10s
- Export quotidien automatique
- Validation format avant publication

---

## 🎨 **DESIGN SYSTEM**

### **Couleurs Vérone**
```css
:root {
  --verone-primary: #000000;    /* Noir signature */
  --verone-secondary: #FFFFFF;  /* Blanc pur */
  --verone-accent: #666666;     /* Gris élégant */
}
```

### **Composants shadcn/ui**
- Button, Input, Select, Dialog
- Table, Card, Badge, Toast
- Form validation avec react-hook-form + zod

---

## ⚡ **PERFORMANCE TARGETS**

### **Frontend**
- Dashboard : <2s First Contentful Paint
- Catalogue : <3s Time to Interactive
- Images : WebP + lazy loading + CDN

### **Backend**
- API endpoints : <500ms response time
- Database queries : Index optimisés
- Cache Redis : TTL adapté par endpoint

### **Monitoring**
```typescript
// Métriques critiques
- Page load time (Core Web Vitals)
- API response time
- Database query performance
- Error rate (<1%)
```

---

## 🚀 **DÉPLOIEMENT**

### **Environnements**
- **Production** : Vercel + Supabase Production
- **Staging** : Vercel Preview + Supabase Staging
- **Development** : Local + Supabase Local

### **CI/CD Pipeline**
```yaml
1. Push → GitHub Actions
2. Tests automatisés (Playwright)
3. Build Next.js
4. Deploy Vercel
5. Migrations Supabase si nécessaires
```

*Vérone Back Office - Architecture Technique Consolidée*