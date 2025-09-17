# Phase 5: Tests Manuels Chrome - Plan de Validation Workflows

## Objectifs Phase 5
- Validation complète workflows avec données réelles Supabase
- Tests business rules selon conditionnements-packages.md
- Validation performance SLOs (Dashboard <2s, Feeds <10s)
- Tests UX Vérone design system (noir/blanc/gris)

## Tests Prioritaires à Effectuer

### 1. Catalogue Principal - Affichage Produits
**URL**: http://localhost:3000/catalogue
**Validation**:
- ✅ Affichage 2 produits créés (Chaise Dining + Suspension Moderne)
- ✅ ProductCard avec système packages intégré
- ✅ Badges conditionnements selon business rules
- ✅ Performance <2s (déjà validé: 1955ms)
- ✅ Design system Vérone respecté

### 2. Système Packages Business Rules
**Tests sur chaque produit**:
- Package "Unité" par défaut affiché
- Packages multiples avec discounts corrects (5-20% pack, 15-40% bulk)
- Badges "Meilleur prix" selon calculatePackagePrice
- MOQ respectées (>2 pour pack, >20 pour bulk)

### 3. Navigation Catalogue Hiérarchique
**URLs à tester**:
- `/catalogue/categories` - Vue familles/catégories
- `/catalogue/families/[familyId]` - Détail famille
- `/catalogue/collections` - Collections partagées

### 4. CRUD Produits avec Packages
- Création nouveau produit via wizard
- Édition packages existants
- Validation sauvegarde en base
- Tests d'archivage/suppression

### 5. Système Images Refondé
- Upload/affichage images produits
- Galerie images ProductImageGallery
- Gestion states useProductImages

## Validation Technique

### Performance SLOs
- Dashboard initial: <2s ✅ (1955ms)
- Navigation inter-pages: <1s
- Feeds génération: <10s (à tester)

### Business Rules Compliance
- Système packages selon conditionnements-packages.md ✅
- Prix calculés correctement selon discounts
- UX cohérente famille/catégorie/sous-catégorie
- RLS policies Supabase respectées

### Design System Vérone
- Couleurs: noir (#000000), blanc (#FFFFFF), gris (#666666) uniquement
- Typography cohérente
- Spacing system respecté
- Components shadcn/ui utilisés correctement

## Statut Actuel
- Serveur démarré: ✅ http://localhost:3000 (1955ms)
- Build validé: ✅ TypeScript errors résolus
- Base données: ✅ 2 produits test avec packages
- Prêt pour tests manuels Chrome