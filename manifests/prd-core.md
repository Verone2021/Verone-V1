# 📋 PRD Core Vérone - MVP Catalogue

**Version** : 2.0 Consolidé
**Status** : MVP Catalogue Partageable ✅
**Objectif** : Catalogue flexible + Feeds exports

---

## 🎯 **VISION MVP**

### **Objectif Principal**
Système catalogue produit flexible avec :
- ✅ Gestion conditionnements complexes
- ✅ Export automatique Facebook Meta + Google Merchant
- ✅ Architecture multilingue (FR, EN, PT)
- ✅ API REST complète
- ✅ Interface back-office intuitive

### **Scope V1 (TERMINÉ)**
- Catalogue produits + variantes
- Groupes produits (`product_group_id`)
- Exports feeds quotidiens automatiques
- API endpoints RESTful
- Interface admin back-office

### **Non-Scope V1**
- ❌ Gestion stock temps réel (V2)
- ❌ Workflow validation produits (V2)
- ❌ Import automatique fournisseurs (V2)
- ❌ Synchronisation multi-entrepôts (V2)

---

## 🏢 **ORGANISATIONS & MULTI-TENANT**

### **Architecture Sécurisée**
- Row Level Security (RLS) Supabase
- Isolation données par `organisation_id`
- Gestion permissions par rôle
- Auth JWT + policies automatiques

### **Rôles Utilisateurs**
```typescript
Admin: Gestion complète organisation
Manager: Gestion équipe + produits
Commercial: Consultation + commandes
Consultant: Lecture seule
```

---

## 📦 **CATALOGUE & PRODUITS**

### **Structure Produits**
```
Catégorie
├── Groupe Produits (variantes couleur/taille)
│   ├── Produit A (SKU-001, Rouge, 60cm)
│   ├── Produit B (SKU-002, Bleu, 60cm)
│   └── Produit C (SKU-003, Rouge, 90cm)
└── Caractéristiques (Matériau, Dimensions, etc.)
```

### **Données Produit**
- **Identification** : SKU, nom, description
- **Pricing** : Prix HT/TTC, prix pro/particulier
- **Stock** : Statut (en_stock, sur_commande, rupture)
- **Media** : Images, fiches techniques PDF
- **SEO** : Meta title/description, URL slug

### **Conditionnements Flexibles**
- MOQ (Minimum Order Quantity)
- Multiples vente : `[1, 3, 6, 12]`
- Unités mesure : pièce, mètre, m², kg

---

## 🔗 **INTÉGRATIONS FEEDS**

### **Google Merchant Center**
- Format XML Google Product Feed
- Mapping automatique statuts stock
- Groupes variantes (`item_group_id`)
- Export quotidien automatique

### **Facebook Meta Catalog**
- Format JSON Facebook Product Catalog
- Images optimisées WebP
- Synchronisation prix temps réel
- Targeting publicitaire par catégorie

### **Performance SLO**
- Génération feeds : <10s
- Disponibilité : 99.9%
- Synchronisation : quotidienne

---

## 💰 **TARIFICATION & BUSINESS**

### **Structure Prix**
```
Prix d'achat HT (coût fournisseur)
    ↓
Prix de vente HT (base calculs)
    ↓
Prix particulier TTC (public)
Prix professionnel HT (B2B avec remises)
```

### **TVA & Fiscalité**
- Taux standard : 20%
- Modulable par produit
- Calculs automatiques prix TTC

### **Remises Commerciales**
- Remises par volume
- Tarifs préférentiels B2B
- Promotions temporaires

---

## 🌍 **INTERNATIONALISATION**

### **Langues Supportées**
- **FR** : Français (défaut)
- **EN** : Anglais (export international)
- **PT** : Portugais (marché spécifique)

### **Localisation**
- Noms produits multilingues
- Descriptions traduites
- URLs localisées (`/fr/`, `/en/`, `/pt/`)
- Devises multiples (EUR, USD, BRL)

---

## 📊 **MÉTRIQUES & ANALYTICS**

### **KPIs Catalogue**
- Nombre produits actifs
- Taux conversion par catégorie
- Performance feeds (impressions, clics)
- Temps chargement pages

### **KPIs Business**
- CA par canal (direct, Google, Facebook)
- Marge moyenne par produit
- Top produits vendeurs
- Taux rotation stock

---

## 🚀 **ROADMAP FUTURES VERSIONS**

### **V2 - Stock Temps Réel**
- Synchronisation stock multi-entrepôts
- Réservations automatiques
- Alerts rupture stock

### **V3 - Workflow Validation**
- Workflow approbation nouveaux produits
- Validation images/descriptions
- Gestion versions brouillon/publié

### **V4 - Import Automatique**
- Connecteurs fournisseurs EDI
- Import automatique catalogues
- Synchronisation prix fournisseurs

*Vérone Back Office - PRD Core MVP Catalogue*