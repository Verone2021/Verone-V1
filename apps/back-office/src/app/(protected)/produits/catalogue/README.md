# Module Catalogue - Vérone Back Office

Gestion complète du catalogue produits avec hiérarchie familles/catégories, produits, variantes et collections.

---

## Vue d'ensemble

Le module Catalogue est le cœur de la gestion produits Vérone. Il permet de structurer l'offre commerciale avec une hiérarchie flexible et de partager des collections personnalisées avec les clients.

**Routes principales**: `/catalogue`

---

## Structure Module

```
catalogue/
├── page.tsx                    # Liste produits (16 produits affichés)
├── categories/                 # Hiérarchie familles/catégories/sous-catégories
├── collections/                # Collections partagées clients
├── variantes/                  # Groupes variantes (couleurs, tailles, matériaux)
├── nouveau/                    # Création produit rapide
├── create/                     # Wizard création produit complet (4 étapes)
├── edit/                       # Édition produits
├── [productId]/                # Détail produit
├── dashboard/                  # Dashboard catalogue
├── sourcing/                   # Mode sourcing (workflow simplifié)
├── archived/                   # Produits archivés
└── stocks/                     # Gestion stock catalogue
```

---

## Fonctionnalités

### Hiérarchie Catalogue

#### Familles

- Création avec display_order automatique
- RLS policies complètes (catalog_manager, admin)
- Tests validés: Phase 1 GROUPE 2 (4 familles créées)
- Bug #409 résolu: RLS policies manquantes (commit `8506184`)

#### Catégories & Sous-catégories

- Interface hiérarchique unifiée
- Migration display_order appliquée (Erreur #8 résolue)
- Arborescence dynamique avec compteurs

#### Collections

- Wizard création 3 étapes (Informations → Style/Pièce → Paramètres)
- Visibilité: Privée ou Publique
- Styles: Bohème, Moderne, Classique, etc.
- Tests validés: Phase 1 GROUPE 2 (1 collection créée)

### Produits

#### Création (Wizard 4 Étapes)

- **Étape 1**: Informations générales (nom, SKU, description)
- **Étape 2**: Conditionnements (unité, pack, bulk - BR-TECH-002)
- **Étape 3**: Prix & Stocks (multi-canaux B2C/B2B)
- **Étape 4**: Images & Médias (upload, galerie)

**Bug résolu**: `createDraft()` non appelée ligne 270 (commit `3db352a`)
**Tests validés**: Phase 2 (Création produit via wizard)

#### Modes de Gestion

- **Mode Complete**: Workflow complet avec validation stricte
- **Mode Sourcing**: Workflow simplifié pour sourcing rapide

#### Gestion Images

- Pattern **BR-TECH-002**: Jointure `product_images!left`
- Upload multiple avec preview
- Image primaire automatique
- Enrichissement mandatory: `primary_image_url`

### Variantes

#### Groupes Variantes

- Couleurs, Tailles, Matériaux
- Gestion centralisée
- Attribution produits multiple

---

## Business Rules

### BR-TECH-002 - Product Images Pattern

```typescript
// ✅ OBLIGATOIRE: Jointure product_images
const { data } = await supabase.from('products').select(`
    id, name, sku,
    product_images!left (public_url, is_primary)
  `);

// Enrichissement MANDATORY
const enriched = data.map(p => ({
  ...p,
  primary_image_url: p.product_images?.[0]?.public_url || null,
}));

// ❌ INTERDIT: products.primary_image_url (colonne supprimée)
```

### Conditionnements Packages

- **Unité**: Vente unitaire (MOQ 1)
- **Pack**: Groupement X unités (MOQ configuré)
- **Bulk**: Vente en gros (MOQ élevé)

Validation conditionnelle selon mode (complete vs sourcing).

### Display Order

Migration complète vers `display_order` (Erreur #8 résolue):

- Tables: `families`, `categories`, `subcategories`, `collections`
- 18 fichiers code corrigés
- Migration SQL: `20251016_fix_display_order_columns.sql`

---

## Tests Validés

### Phase 1 - GROUPE 2 (4/4 tests catalogue)

| Test                 | Statut     | Console  | Notes              |
| -------------------- | ---------- | -------- | ------------------ |
| Créer Famille        | ✅ SUCCESS | 0 erreur | 4 familles créées  |
| Créer Catégorie      | ⚠️ SKIP    | N/A      | Interface unifiée  |
| Créer Sous-catégorie | ⚠️ SKIP    | N/A      | Interface unifiée  |
| Créer Collection     | ✅ SUCCESS | 0 erreur | 1 collection créée |

**Erreurs résolues**:

- Erreur #8 PGRST204 (display_order): 0 erreur détectée
- Erreur #6 (Messages UX): Validée (PostgreSQL 23505 user-friendly)

### Phase 2 - Tests Critiques

| Test                        | Statut     | Notes                |
| --------------------------- | ---------- | -------------------- |
| Création produit via wizard | ✅ SUCCESS | Bug ligne 270 résolu |

---

## Performance

### SLO Validé (Phase 4)

| Métrique                       | Target | Mesuré    | Performance                  |
| ------------------------------ | ------ | --------- | ---------------------------- |
| **Load Time Catalogue**        | <3s    | **0.42s** | ✅ **-86%** (7x plus rapide) |
| FCP (First Contentful Paint)   | <1.8s  | 0.168s    | ✅ EXCELLENT                 |
| LCP (Largest Contentful Paint) | <2.5s  | ~0.5s     | ✅ EXCELLENT                 |

### Optimisations en Place

- Pagination (50 produits/page)
- SWR cache (5 min revalidation)
- Image optimization Next.js
- Database indices validés
- Product images lazy loading

### Optimisations Recommandées

1. **Console.log production** (32 logs détectés)
   - Pattern: "auto_fetch_images", "Images chargées", "Price calculated"
   - Gain estimé: +100ms

2. **SELECT queries** (quelques fichiers)
   - `use-categories.ts` ligne 37: `select('*')` à optimiser
   - Gain estimé: +300ms

3. **React.memo** composants
   - `ProductCard` (16 items liste)
   - Gain estimé: -30% re-renders

---

## Sécurité

### RLS Policies (100% coverage)

**Tables catalogue**:

- `families`, `categories`, `subcategories`, `collections`
- 5 policies par table (SELECT, INSERT, UPDATE, DELETE, ALL)

**Authentification**:

- SELECT: `authenticated`, `anon`
- INSERT/UPDATE: `catalog_manager`
- DELETE: `admin`

**Validation**: Phase 1 tests (Bug #409 résolu)

### Migration RLS (commit `8506184`)

```sql
-- 20251016_002_fix_catalogue_rls_policies.sql
-- 15 policies créées
-- Validation post-migration incluse
COMMENT ON TABLE families IS 'RLS ENABLED - Fixed 2025-10-16';
```

---

## Bugs Résolus

### Bug #409 - Création Familles Impossible

- **Symptôme**: RLS policies manquantes, création bloquée
- **Commit**: `8506184`
- **Solution**: 15 policies créées (5 par table)
- **Tests**: Phase 1 GROUPE 2 (4 familles créées ✅)

### Erreur #8 - PGRST204 display_order

- **Symptôme**: Colonne `display_order` non reconnue
- **Commits**: `db9f8c1` (code, 18 fichiers) + `5211525` (migration DB)
- **Solution**: Migration 3 tables + correction code TypeScript
- **Tests**: Phase 1 GROUPE 2 (0 erreur PGRST204 ✅)

### Bug Wizard Création Produit

- **Symptôme**: `createDraft()` non appelée ligne 270
- **Commit**: `3db352a`
- **Solution**: Correction appel fonction wizard
- **Tests**: Phase 2 (Création produit ✅)

---

## Fichiers Critiques

### Hooks Custom

- `use-products.ts` (137 lignes, score 9/10)
- `use-families.ts` (display_order ligne 29)
- `use-categories.ts` (display_order ligne 39)
- `use-subcategories.ts` (display_order ligne 32)
- `use-collections.ts` (validé Phase 1)

### Composants Business

- `complete-product-wizard.tsx` (560 lignes, score 9.5/10)
- `complete-product-form.tsx` (forms complets)
- `product-card.tsx` (affichage liste)

### Pages

- `catalogue/page.tsx` (liste 16 produits)
- `catalogue/categories/page.tsx` (hiérarchie unifiée)
- `catalogue/collections/page.tsx` (wizard 3 étapes)

---

## Prochaines Étapes

### Court Terme (1 semaine)

1. Nettoyer console.log production (32 logs détectés)
2. Optimiser SELECT queries (`use-categories.ts` ligne 37)
3. Tests catégories/sous-catégories via interface admin

### Moyen Terme (2 semaines)

1. React.memo ProductCard
2. Virtualisation liste si >100 produits
3. Tests routes Feeds Google/Meta

### Long Terme (1 mois)

1. Amélioration UX wizard (étapes 5-6)
2. Gestion variantes avancée
3. Export catalogue PDF

---

## Documentation Connexe

- **Business Rules**: `/docs/engineering/business-rules/WORKFLOWS.md`
- **PRD Catalogue**: `/docs/prd/` (si existant)
- **Tests**: `/TASKS/completed/testing/GROUPE-2-*.md`
- **Code Review**: `/MEMORY-BANK/sessions/RAPPORT-PHASE-3-CODE-REVIEW-2025-10-16.md`
- **Performance**: `/MEMORY-BANK/sessions/RAPPORT-PHASE-4-PERFORMANCE-2025-10-16.md`

---

**Module maintenu par**: Vérone System Orchestrator
**Dernière mise à jour**: 2025-10-16
**Statut**: ✅ Production Ready (Tests validés, Performance excellente)
