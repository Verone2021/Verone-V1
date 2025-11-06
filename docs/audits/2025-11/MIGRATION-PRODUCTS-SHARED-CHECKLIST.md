# CHECKLIST MIGRATION - Products Shared Module

**Date de début**: 2025-11-06  
**Date cible**: 2025-11-27 (3 semaines)  
**Responsable**: Équipe Dev

---

## ✅ PHASE 1 - SETUP & CORE (Semaine 1)

### Jour 1 - Setup Infrastructure
- [ ] Créer structure `src/shared/modules/products/`
- [ ] Créer sous-dossiers (components, hooks, types, utils, constants)
- [ ] Initialiser package.json si monorepo
- [ ] Setup CI/CD pour shared modules
- [ ] Créer README.md principal

### Jour 2-3 - Migration ProductThumbnail + ProductCard
- [ ] Migrer ProductThumbnail (103 lignes)
  - [ ] Copier fichier vers `components/images/`
  - [ ] Adapter imports (@/lib → @verone/shared)
  - [ ] Tests unitaires
  - [ ] Story Storybook
- [ ] Migrer ProductCard-v2 → ProductCard (308 lignes)
  - [ ] Copier vers `components/cards/`
  - [ ] Adapter imports
  - [ ] Extraire ProductStatus composant
  - [ ] Extraire ProductPrice composant
  - [ ] Tests unitaires
  - [ ] Story Storybook
- [ ] Renommer product-card.tsx → product-card-legacy.tsx

### Jour 4-5 - Migration use-product-images
- [ ] Migrer use-product-images (394 lignes)
  - [ ] Copier vers `hooks/`
  - [ ] Adapter imports Supabase client
  - [ ] Tests unitaires complets
  - [ ] JSDoc documentation
- [ ] Créer types/product-images.types.ts
- [ ] Valider intégration avec ProductCard

---

## ✅ PHASE 2 - SELECTOR & IMAGES (Semaine 2)

### Jour 6-7 - Migration UniversalProductSelector
- [ ] Migrer universal-product-selector-v2 (1181 lignes)
  - [ ] Copier vers `components/selectors/`
  - [ ] Adapter imports
  - [ ] Tests E2E complets
  - [ ] Documentation props
  - [ ] Story Storybook avec tous contextes
- [ ] Créer ProductCardSkeleton
- [ ] Créer ProductEmptyState

### Jour 8 - Migration ProductImageGallery
- [ ] Migrer product-image-gallery (249 lignes)
  - [ ] Copier vers `components/images/`
  - [ ] Adapter imports
  - [ ] Tests unitaires
  - [ ] Story Storybook

### Jour 9-10 - Fusion Images Manager
- [ ] Analyser product-photos-modal (477 lignes)
- [ ] Analyser product-image-management
- [ ] Créer ProductImagesManager fusionné
  - [ ] Upload multiple
  - [ ] Drag & drop
  - [ ] Gestion display_order
  - [ ] Tests E2E
  - [ ] Story Storybook
- [ ] Migrer product-image-viewer-modal

---

## ✅ PHASE 3 - FORMS & HOOKS (Semaine 3)

### Jour 11-12 - Migration Forms
- [ ] Migrer ProductCreationModal → ProductQuickCreateModal
  - [ ] Copier vers `components/forms/`
  - [ ] Adapter imports
  - [ ] Tests unitaires
- [ ] Migrer ProductCreationWizard
  - [ ] Copier vers `components/forms/`
  - [ ] Adapter imports
  - [ ] Tests E2E

### Jour 13-14 - Refactoring use-products
- [ ] Analyser use-products (557 lignes)
- [ ] Extraire use-product-search
- [ ] Extraire use-product-filters
- [ ] Extraire use-product-mutations
- [ ] Créer types/product.types.ts
- [ ] Tests unitaires pour chaque hook

### Jour 15 - Migration Hooks Avancés
- [ ] Migrer use-product-variants (164 lignes)
- [ ] Migrer use-product-packages (162 lignes)
- [ ] Créer use-product-pricing
- [ ] Créer use-product-stock

---

## ✅ PHASE 4 - LISTS & UTILS (Semaine 4)

### Jour 16-17 - Création Components Lists
- [ ] Créer ProductGrid
  - [ ] Layout responsive
  - [ ] Filtres intégrés
  - [ ] Pagination
  - [ ] Tests E2E
- [ ] Créer ProductList (compact)
- [ ] Créer ProductTable (données)

### Jour 18 - Utils & Constants
- [ ] Créer utils/product-formatters.ts
- [ ] Créer utils/product-validators.ts
- [ ] Créer utils/product-filters.ts
- [ ] Migrer lib/product-status-utils.ts
- [ ] Créer constants/product-statuses.ts
- [ ] Créer constants/product-conditions.ts

### Jour 19-20 - Tests & Validation
- [ ] Tests unitaires coverage >80% hooks
- [ ] Tests unitaires coverage >60% composants
- [ ] Tests E2E workflows complets
- [ ] Validation build sans erreurs
- [ ] Performance audit (Lighthouse)

### Jour 21 - Documentation Finale
- [ ] README.md complet avec exemples
- [ ] Storybook publié
- [ ] JSDoc pour tous hooks
- [ ] Guide migration pour équipe
- [ ] Formation équipe (1h session)

---

## 📋 VALIDATION FINALE

### Critères Acceptation
- [ ] Build production successful
- [ ] 0 TypeScript errors
- [ ] Tests coverage atteint
- [ ] Documentation complète
- [ ] Formation équipe effectuée
- [ ] 3 apps peuvent importer modules

### KPIs
- [ ] Réutilisation code: >80%
- [ ] Lignes code dupliquées: <5%
- [ ] Performance: pas de régression
- [ ] DX: temps intégration <30min par app

---

## 🚨 ROLLBACK PLAN

Si problèmes critiques:
1. Garder versions legacy en parallèle
2. Feature flags pour basculer
3. Rollback progressif par composant
4. Post-mortem pour identifier issues

---

**Dernière mise à jour**: 2025-11-06
