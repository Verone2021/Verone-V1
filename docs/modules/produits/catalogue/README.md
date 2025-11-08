# Catalogue Produits

**Module** : Produits → Catalogue
**Status** : ✅ PRODUCTION READY
**Date Validation** : 2025-10-27

---

## 📊 Vue d'Ensemble

Le **Catalogue** est le cœur du module Produits. Il gère l'ensemble du cycle de vie des produits :

- Création (wizard 4 étapes : Info, Images, Prix, Stock)
- Édition complète
- Archivage/Restauration
- Stock réel + prévis

ionnel (in/out)

- Statuts automatiques via triggers
- Conditionnements flexibles (packages)

---

## ✅ Features Validées

### CRUD Produits

- ✅ **Création via wizard** : 4 étapes (Informations, Images, Prix, Stock)
- ✅ **Création rapide** : Formulaire simplifié 3 champs minimum
- ✅ **Modification** : Page détail avec tous les champs
- ✅ **Archivage** : Soft delete (archived_at timestamp)
- ✅ **Restauration** : Produits archivés récupérables
- ✅ **Duplication** : Cloner produit existant (TODO Phase 2)

### Système Stock

- ✅ **Stock réel** : stock_real (quantité physique)
- ✅ **Stock prévisionnel entrée** : stock_forecasted_in (achats en cours)
- ✅ **Stock prévisionnel sortie** : stock_forecasted_out (ventes en cours)
- ✅ **Seuils** : min_stock, reorder_point
- ✅ **Calcul automatique** : stock_quantity (calculé via trigger)

### Images

- ✅ **Multi-images** : Galerie illimitée
- ✅ **Image primaire** : Détection automatique (is_primary)
- ✅ **Upload** : Supabase Storage (product-images bucket)
- ✅ **Optimisation** : Compression automatique

### UI/UX

- ✅ **Vue grille** : Cards responsive
- ✅ **Vue liste** : Tableau détaillé
- ✅ **Filtres** : Statut, Fournisseur, Catégorie, Recherche
- ✅ **Pagination** : 20 produits/page
- ✅ **Recherche** : Par nom ou SKU (debounced 300ms)

---

## 📁 Pages & Routes

### `/produits/catalogue` - Liste Catalogue

**Fichier** : `src/app/produits/catalogue/page.tsx`

**Features** :

- Grille 4×3 cards produits
- Filtres : Statut, Fournisseur, Recherche
- Statistiques : Total, En stock, Rupture, Archivés
- Actions : Nouveau produit, Export CSV (TODO)

**Composants** :

- `ProductCard` : Card produit avec image, nom, prix, stock
- `ProductFilters` : Barre filtres
- `ProductStats` : Cartes statistiques

---

### `/produits/catalogue/[productId]` - Détail Produit

**Fichier** : `src/app/produits/catalogue/[productId]/page.tsx`

**Sections** :

1. **Informations générales** : Nom, SKU, Description, Catégorie
2. **Images** : Galerie + Sélection primaire
3. **Fournisseur** : Supplier, Référence, URL page produit
4. **Prix** : Cost price, Margin %, Estimated selling price
5. **Stock** : Stock réel, Prévu in/out, Seuils
6. **Conditionnements** : Packages flexibles
7. **Variantes** : Si membre groupe variantes
8. **Métadonnées** : SKU, Dates création/modification

**Actions** :

- Modifier (tous champs)
- Archiver
- Dupliquer (TODO Phase 2)

---

### `/produits/catalogue/nouveau` - Wizard Création

**Fichier** : `src/app/produits/catalogue/nouveau/page.tsx`

**Wizard 4 Étapes** :

#### Étape 1 : Informations Générales

- Nom produit (REQUIRED)
- Fournisseur (SupplierSelector)
- Catégorie (CategorySelector)
- Sous-catégorie
- Famille
- Description
- Points de vente (selling_points)

#### Étape 2 : Images

- Upload multiple images
- Sélection image primaire
- Drag & drop
- Aperçu galerie

#### Étape 3 : Prix

- Prix achat HT (cost_price)
- Marge % (margin_percentage)
- Prix vente estimé (calculé auto)

#### Étape 4 : Stock

- Stock réel initial (stock_real)
- Stock minimum (min_stock)
- Point de réapprovisionnement (reorder_point)

**Validation** :

- Étape 1 : Nom obligatoire
- Étape 2 : Au moins 1 image recommandée
- Étape 3 : Prix HT > 0 (recommandé)
- Étape 4 : Stock initial ≥ 0

**Soumission** :

- Création produit avec completion_percentage calculé
- Upload images vers Supabase Storage
- Redirection vers `/produits/catalogue/[productId]`

---

### `/produits/catalogue/archived` - Produits Archivés

**Fichier** : `src/app/produits/catalogue/archived/page.tsx`

**Features** :

- Liste produits archivés (WHERE archived_at IS NOT NULL)
- Action : Restaurer produit
- Filtres : Date archivage, Raison archivage

---

### `/produits/catalogue/stocks` - Vue Stocks

**Fichier** : `src/app/produits/catalogue/stocks/page.tsx`

**Features** :

- Vue centralisée tous stocks
- Alertes : Stock < min_stock
- Filtres : Rupture, Stock faible, Réapprovisionnement
- Export CSV stocks

---

### `/produits/catalogue/dashboard` - Dashboard Catalogue

**Fichier** : `src/app/produits/catalogue/dashboard/page.tsx`

**KPIs** :

- Total produits catalogue
- % En stock vs Rupture
- Valeur stock (cost_price × stock_real)
- Top produits (ventes)
- Alertes stock faible

**Graphiques** :

- Évolution stock mensuel
- Répartition par catégorie
- Répartition par fournisseur

---

## 🎯 Hooks Catalogue

Voir [hooks.md](./hooks.md) pour documentation complète.

**Principaux** :

- `useProducts()` : CRUD principal
- `useProduct(id)` : Détail produit
- `useArchivedProducts()` : Produits archivés
- `useProductImages()` : Gestion images
- `useProductPackages()` : Conditionnements

---

## 🧩 Composants

Voir [components.md](./components.md) pour documentation complète.

**Principaux** :

- `ProductCreationWizard` : Wizard 4 étapes
- `ProductCard` : Card grille
- `ProductForm` : Formulaire édition
- `SupplierSelector` : Sélection fournisseur
- `CategorySelector` : Sélection catégorie

---

## 🔄 Workflows

Voir [workflows.md](./workflows.md) pour workflows détaillés.

**Principaux** :

1. **Création Produit** : Wizard → Upload images → Validation → Catalogue
2. **Modification Produit** : Détail → Édition → Save → Refresh
3. **Archivage** : Action → Confirmation → archived_at timestamp
4. **Restauration** : Liste archivés → Restaurer → archived_at = NULL

---

## 🗄️ Database

**Table principale** : `products` (44 colonnes)

**Colonnes clés catalogue** :

- `id`, `sku`, `name`, `slug`
- `status` (availability_status_type)
- `stock_real`, `stock_forecasted_in`, `stock_forecasted_out`
- `cost_price`, `margin_percentage`
- `supplier_id` (FK organisations)
- `subcategory_id` (FK subcategories)
- `completion_percentage` (0-100)
- `archived_at` (NULL si actif)

**Triggers** :

- `calculate_product_completion()` : % complétude
- `generate_product_sku()` : SKU auto (PRD-XXXX)

**RLS Policies** :

- Owner : CRUD complet
- Admin : CRUD complet
- Catalog Manager : CRUD complet
- Sales : SELECT, UPDATE limité
- User : SELECT uniquement

---

## 🧪 Tests

**E2E Tests** : `test-catalogue-products.spec.ts`

```typescript
// Test création produit via wizard
test('Créer produit via wizard 4 étapes', async ({ page }) => {
  // Étape 1 : Informations
  await page.fill('input[name="name"]', 'Fauteuil Test');
  // Étape 2 : Images
  await page.setInputFiles('input[type="file"]', 'test-image.jpg');
  // Étape 3 : Prix
  await page.fill('input[name="cost_price"]', '150');
  // Étape 4 : Stock
  await page.fill('input[name="stock_real"]', '10');

  await page.click('button:has-text("Créer Produit")');
  await expect(page).toHaveURL(/\/produits\/catalogue\/.+/);
});

// Test modification produit
test('Modifier produit existant', async ({ page, productId }) => {
  await page.goto(`/produits/catalogue/${productId}`);
  await page.click('button:has-text("Modifier")');
  await page.fill('input[name="name"]', 'Nouveau Nom');
  await page.click('button:has-text("Enregistrer")');

  await expect(page.locator('h1')).toContainText('Nouveau Nom');
});
```

---

## 📊 Performance

**SLOs** :

- ✅ Page liste catalogue : <2s (SLO respecté)
- ✅ Page détail produit : <1.5s
- ✅ Upload image : <3s
- ✅ Recherche (debounced) : <500ms

**Optimisations** :

- Pagination (20 produits/page)
- Images lazy loading
- Debounce recherche (300ms)
- Cache SWR (revalidation 60s)

---

## 🔗 Liens Utiles

- [Hooks Documentation](./hooks.md)
- [Composants](./components.md)
- [Workflows](./workflows.md)
- [Database Schema](../../database/SCHEMA-REFERENCE.md)

---

**Dernière Mise à Jour** : 2025-10-27
**Mainteneur** : Vérone Dev Team
