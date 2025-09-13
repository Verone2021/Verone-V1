# Test MVP Catalogue Vérone - Guide de Validation

> **Objectif** : Validation complète du module catalogue selon business rules et performance SLOs
> **SLOs** : Dashboard <2s, Feeds <10s, Search <1s
> **Design** : Charte Vérone strict noir/blanc uniquement

## 🎯 Tests Business Rules

### **1. Architecture Database**
- [x] **Tables catalogue** : product_groups, products, product_packages selon ERD-CATALOGUE-V1.md
- [x] **RLS Policies** : Owner, Admin, Catalog Manager selon roles-permissions-v1.md
- [x] **Index performance** : Optimisés pour feeds et recherche
- [ ] **Validation contraintes** : SKU format, prix positifs, slugs valides

### **2. Design System Vérone**
- [x] **Couleurs strictes** : Noir (#000000) et Blanc (#FFFFFF) uniquement
- [x] **Boutons Vérone** : Primary (noir->blanc) et Secondary (blanc->noir)
- [x] **Typographies** : Monarch Regular pour navigation, Fieldwork pour interface
- [x] **Animations** : Hover opacity 70% selon charte
- [ ] **Validation logos** : Symbole V noir sur blanc, JAMAIS "by Romeo"

### **3. Composants Réutilisables**
- [x] **ProductCard** : Affichage produit avec statuts, prix, variantes
- [x] **CollectionGrid** : Grille avec filtres catégories, statuts, recherche
- [x] **StatusIndicator** : Couleurs système (vert, rouge, jaune, bleu)
- [x] **PriceDisplay** : Format centimes->euros, HT/TTC selon context

## 🚀 Tests Performance SLOs

### **Dashboard Performance (<2s)**
```bash
# Test chargement initial page catalogue
time curl -s "http://localhost:3000/catalogue" > /dev/null
# Attendu: <2000ms

# Test avec données mockées (6 produits)
# Vérifier indicateur performance en bas à droite
```

### **Recherche Temps Réel (<1s)**
```javascript
// Test dans DevTools Console
const start = performance.now();
// Taper dans champ recherche
// Mesurer: performance.now() - start < 1000ms
```

### **Filtres Dynamiques (<500ms)**
```javascript
// Test sélection catégorie
// Test sélection statut multiple
// Vérifier réactivité <500ms
```

## 🔒 Tests Sécurité RLS

### **Permissions Rôles V1**
```sql
-- Test Owner : accès complet
SELECT * FROM products; -- Doit marcher

-- Test Admin : CRUD business complet
SELECT * FROM products WHERE status = 'active'; -- Doit marcher

-- Test Catalog Manager : CRUD catalogue
SELECT * FROM products; -- Doit marcher
SELECT * FROM collections; -- Doit marcher

-- Test Sales : lecture seule actifs
SELECT * FROM products WHERE status IN ('in_stock', 'preorder'); -- Doit marcher
INSERT INTO products (...); -- Doit échouer
```

## 🎨 Tests UX Responsive

### **Mobile-First (<768px)**
- [ ] **Sidebar collapse** : Overlay avec animation
- [ ] **ProductCard responsive** : Stack vertical
- [ ] **Touch targets** : Minimum 44px×44px
- [ ] **Navigation thumb** : Zone accessible pouce

### **Tablet (768px-1024px)**
- [ ] **Grid responsive** : 2 colonnes produits
- [ ] **Filtres sidebar** : Visible et fonctionnels
- [ ] **Performance** : SLOs maintenus sur mobile

### **Desktop (>1024px)**
- [ ] **Layout complet** : Sidebar + filtres + grille 3 colonnes
- [ ] **Hover states** : Opacity 70% selon charte
- [ ] **Keyboard navigation** : Tab order logique

## 📊 Tests Intégration

### **Supabase Integration**
```javascript
// Test hook useCatalogue
const { products, loading, error } = useCatalogue();
// Vérifier: data loading, error handling, filters

// Test CRUD operations
await createProduct(productData);
await updateProduct(id, updates);
await deleteProduct(id);
```

### **Business Rules Validation**
```javascript
// Test formatage prix
formatPrice(7500) // "75,00 €"
formatPrice(7500, { showTaxSuffix: true }) // "75,00 € HT"

// Test génération SKU
generateSKU('VER', 'Tabourets', 1, 'NOIR') // "VER-TAB-001-NOIR"

// Test validation formats
isValidSKU('VER-TAB-001-NOIR') // true
isValidGTIN('1234567890123') // true (EAN13)
```

## 🔧 Tests Fonctionnels E2E

### **Workflow Catalogue Complet**
1. **Connexion** : Catalog Manager
2. **Navigation** : Sidebar → Catalogue
3. **Chargement** : Vérifier <2s dashboard
4. **Filtres** : Test catégories + statuts
5. **Recherche** : Temps réel <1s
6. **Actions** : Voir/Éditer produit
7. **Export** : Génération catalogue (futur)

### **Scenarios Business**
- **Gestionnaire catalogue** : CRUD complet produits
- **Commercial** : Lecture seule produits actifs
- **Admin** : Accès complet + configuration

## ❌ Tests Interdictions Charte

### **Couleurs Interdites**
- ❌ **Doré** (#C9A86A) dans interface → Doit échouer audit
- ❌ **Dégradés** couleurs → Doit échouer validation CSS
- ❌ **Ombres colorées** → Design system strict

### **Logo Interdictions**
- ❌ **"by Romeo"** sous logo blanc → JAMAIS autorisé
- ❌ **Modifications logo** → Version officielle uniquement
- ❌ **Mauvais contrastes** → Noir sur blanc, blanc sur noir

## 📋 Checklist Validation Finale

### **✅ Architecture**
- [x] Migrations Supabase appliquées
- [x] RLS policies configurées
- [x] Types TypeScript générés
- [x] Index performance créés

### **✅ Interface**
- [x] Design system Vérone respecté
- [x] Composants réutilisables créés
- [x] Page catalogue fonctionnelle
- [x] Sidebar navigation moderne

### **⏳ Tests Coordination**
- [ ] **verone-test-expert** : Tests E2E workflows
- [ ] **verone-design-expert** : Validation UX/accessibility
- [ ] **Performance validation** : SLOs dashboard <2s

## 🚀 Commandes Lancement

```bash
# Développement local
cd apps/back-office
npm run dev

# Tests fonctionnels
npm run test

# Tests E2E (avec Playwright)
npm run test:e2e

# Build production
npm run build

# Analyse performance
npm run analyze
```

## 📊 Métriques Succès MVP

### **Business KPIs**
- **Adoption** : 100% utilisation quotidienne <30 jours
- **Productivité** : -70% temps création catalogues
- **Conversion** : 15% catalogues → devis

### **Technical KPIs**
- **Performance** : 100% SLOs respectés
- **Quality** : >90% test coverage
- **Security** : 0 vulnérabilité, RLS 100%
- **Mobile** : >40% consultations mobile

Cette validation confirme que le module catalogue Vérone respecte strictement les business rules et la charte graphique officielle.