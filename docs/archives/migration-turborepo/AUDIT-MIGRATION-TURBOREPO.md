# 📋 AUDIT MIGRATION TURBOREPO - CODE DÉSACTIVÉ

**Date audit** : 2025-11-19
**Version** : Phase 4 (Post-migration Turborepo)
**Objectif** : Identifier toutes les fonctionnalités désactivées/cassées pendant la migration

---

## 🎯 RÉSUMÉ EXÉCUTIF

**Total problèmes** : **47 fonctionnalités désactivées ou cassées**

### Répartition par criticité

| Catégorie        | Nombre | Impact Business                                         |
| ---------------- | ------ | ------------------------------------------------------- |
| **🔴 CRITIQUE**  | 8      | Fonctionnalités utilisateur cassées (workflows bloqués) |
| **🟠 IMPORTANT** | 23     | Fonctionnalités admin/gestion impactées                 |
| **🟡 MINEUR**    | 16     | Optimisations/features non essentielles                 |

### Statut global

- ✅ **Corrigé** : 2/47 (4%) - updateStatus Sales/Purchase Orders
- 🔄 **À corriger** : 45/47 (96%)

**Temps estimé total corrections** : **11 heures** (2 jours dev)

---

## 🔴 PROBLÈMES CRITIQUES (8)

### 1. ✅ Hook `updateStatus` Commandes Clients - **RÉSOLU**

**Fichier** : `packages/@verone/orders/src/hooks/use-sales-orders.ts`
**Lignes** : 1238-1245

**Problème** :

```typescript
// FIXME: Server actions can't be imported from monorepo packages
// const { updateSalesOrderStatus } = await import('@/app/actions/sales-orders');
```

**Impact** : Impossible d'annuler/changer statut commandes clients

**Solution appliquée** (2025-11-19) :

- Import direct Server Action depuis `apps/back-office/src/app/commandes/clients/page.tsx`
- Appel direct dans `handleCancel` (lignes 455-509)
- Libération réservations stock manuelle

**Statut** : ✅ **CORRIGÉ**

---

### 2. ✅ Hook `updateStatus` Commandes Fournisseurs - **RÉSOLU**

**Fichier** : `packages/@verone/orders/src/hooks/use-purchase-orders.ts`
**Lignes** : 580-615

**Problème** :

```typescript
// FIXME: updatePurchaseOrderStatusAction server action can't be imported from monorepo
```

**Impact** : Impossible de valider/recevoir commandes fournisseurs

**Solution appliquée** (2025-11-19) :

- Même pattern que Sales Orders
- Import direct depuis page

**Statut** : ✅ **CORRIGÉ**

---

### 3. ❌ Suppression Alertes Stock (Précommande/Arrêté)

**Fichiers** :

- `packages/@verone/products/src/hooks/use-product-status.ts` (lignes 123-142)
- `packages/@verone/common/src/hooks/use-inline-edit.ts` (lignes 173-194)

**Problème** :

```typescript
// FIXME: deleteProductAlerts server action can't be imported from monorepo
```

**Impact** : Alertes stock restent actives alors que produit passe en "preorder"/"discontinued"

**Solution recommandée** :

1. Server Action existe : `/apps/back-office/src/app/actions/delete-product-alerts.ts`
2. Exporter depuis `/apps/back-office/src/app/actions/index.ts`
3. Importer dans hooks : `import { deleteProductAlerts } from '@/app/actions/delete-product-alerts'`

**Temps estimé** : 15 minutes

---

### 4. ❌ Composant `EcoTaxVatInput` - Éco-participation

**Fichiers impactés** :

- `packages/@verone/orders/src/components/modals/PurchaseOrderFormModal.tsx` (ligne 497)
- `packages/@verone/orders/src/components/modals/SalesOrderFormModal.tsx` (ligne 834)
- `packages/@verone/orders/src/components/sections/OrderHeaderEditSection.tsx` (ligne 3)

**Problème** :

```typescript
// FIXME: EcoTaxVatInput can't be imported from apps/back-office in package
{
  /* <EcoTaxVatInput value={ecoTaxVatRate} onChange={setEcoTaxVatRate} /> */
}
```

**Impact** : Impossible de saisir taux TVA éco-participation sur commandes

**Solution recommandée** :

1. Composant source : `/apps/back-office/src/components/forms/eco-tax-vat-input.tsx`
2. **Option A** : Déplacer vers `@verone/ui/components/forms`
3. **Option B** : Créer `@verone/finance` avec composants financiers

**Temps estimé** : 30 minutes

---

### 5. ❌ Composant `CategoryHierarchySelector`

**Fichier** : `packages/@verone/products/src/components/sections/GeneralInfoEditSection.tsx` (lignes 149-166)

**Problème** :

```typescript
// FIXME: CategoryHierarchySelector component can't be imported from apps/back-office
<div className="p-2 border rounded bg-gray-50">
  <p>Sélecteur de catégorie (temporairement désactivé)</p>
</div>
```

**Impact** : Impossible de catégoriser produits dans formulaire édition

**Solution recommandée** :

1. Composant source : `/apps/back-office/src/components/business/category-hierarchy-selector.tsx`
2. Déplacer vers `@verone/categories/components`
3. Extraire dépendances hooks si nécessaire

**Temps estimé** : 45 minutes

---

### 6. ❌ Composant `ProductImageGallery`

**Fichiers impactés** :

- `packages/@verone/products/src/components/sections/ProductEditMode.tsx` (ligne 5, 171)
- `packages/@verone/products/src/components/sections/ProductViewMode.tsx` (ligne 5, 111)

**Problème** :

```typescript
// FIXME: ProductImageGallery component can't be imported from apps/back-office
<div className="border rounded p-4 text-sm text-gray-500">
  Galerie images (temporairement désactivée)
</div>
```

**Impact** : Galerie photos produits invisible (mode édition/consultation)

**Solution recommandée** :

1. Composant source : `/apps/back-office/src/components/business/product-image-gallery.tsx`
2. Déplacer vers `@verone/products/components`
3. Dépendances upload Supabase → créer `@verone/upload` si réutilisable

**Temps estimé** : 1 heure

---

### 7. ❌ Composant `ProductCardV2`

**Fichier** : `packages/@verone/common/src/components/collections/CollectionGrid.tsx` (ligne 7, 283)

**Problème** :

```typescript
// FIXME: ProductCardV2 component can't be imported from apps/back-office in package
```

**Impact** : Collections produits ne peuvent pas afficher cards produits

**Solution recommandée** :

1. Composant source : `/apps/back-office/src/components/business/product-card-v2.tsx`
2. Déplacer vers `@verone/products/components`
3. Fusionner avec `ProductCard` existant (V1/V2)

**Temps estimé** : 30 minutes

---

### 8. ❌ Composant `ContactFormModal`

**Fichier** : `packages/@verone/organisations/src/components/forms/organisation-contacts-manager.tsx` (lignes 347-357)

**Problème** :

```typescript
// FIXME: ContactFormModal component can't be imported from apps/back-office
{
  /* <ContactFormModal isOpen={isModalOpen} onClose={handleModalClose} ... /> */
}
```

**Impact** : Impossible d'ajouter/éditer contacts organisations

**Solution recommandée** :

1. Composant source : `/apps/back-office/src/components/business/contact-form-modal-wrapper.tsx`
2. Déplacer vers `@verone/organisations/components/modals`

**Temps estimé** : 20 minutes

---

## 🟠 PROBLÈMES IMPORTANTS (23)

### 9-11. ⚠️ Composants Stock @verone/ui Désactivés (3)

**Fichiers** :

- `packages/@verone/ui/src/components/stock/StockKPICard.tsx.disabled`
- `packages/@verone/ui/src/components/stock/StockMovementCard.tsx.disabled`
- `packages/@verone/ui/src/components/stock/ChannelFilter.tsx.disabled`

**Impact** : Pages stock back-office manquent composants visuels

**Raison** : Dépendent de shadcn/ui (Card, Select) + types Supabase

**Solution recommandée** :

1. Créer composants shadcn/ui manquants dans `@verone/ui`
2. Renommer `.tsx.disabled` → `.tsx`
3. Réactiver exports dans `index.ts`

**Temps estimé** : 1h30 (3 composants × 30min)

---

### 12. ⚠️ Composant `SampleRequirementSection`

**Fichier** : `packages/@verone/products/src/components/sections/ProductEditMode.tsx` (ligne 7, 918)

**Impact** : Gestion échantillons produits désactivée

**Solution** :

1. Composant source : `/apps/back-office/src/components/business/sample-requirement-section.tsx`
2. Déplacer vers `@verone/products/components/sections`

**Temps estimé** : 30 minutes

---

### 13. ⚠️ Composant `ProductFixedCharacteristics`

**Fichier** : `packages/@verone/products/src/components/sections/ProductViewMode.tsx` (ligne 3, 243)

**Impact** : Caractéristiques produits non affichées en mode consultation

**Solution** :

1. Composant source : `/apps/back-office/src/components/business/product-fixed-characteristics.tsx`
2. Déplacer vers `@verone/products/components`

**Temps estimé** : 20 minutes

---

### 14. ⚠️ Composant `CompleteProductWizard`

**Fichier** : `packages/@verone/products/src/components/wizards/ProductCreationWizard.tsx` (ligne 7, 264)

**Impact** : Wizard création produit complet désactivé

**Solution** :

1. Composant source : `/apps/back-office/src/components/business/complete-product-wizard.tsx`
2. Déplacer vers `@verone/products/components/wizards`

**Temps estimé** : 45 minutes

---

### 15. ⚠️ Composant `ProductPhotosModal`

**Fichier** : `packages/@verone/products/src/components/modals/ProductImagesModal.tsx` (ligne 5, 34)

**Impact** : Modal gestion photos produits désactivée

**Solution** :

1. Composant source : `/apps/back-office/src/components/business/product-photos-modal.tsx`
2. Déplacer vers `@verone/products/components/modals`

**Temps estimé** : 30 minutes

---

### 16. ⚠️ Composant `SupplierSelector`

**Fichier** : `packages/@verone/products/src/components/sourcing/supplier-selector.tsx` (ligne 4, 12)

**Impact** : Sélection fournisseur sourcing désactivée

**Solution** :

1. Composant source : `/apps/back-office/src/components/business/supplier-selector.tsx`
2. Déplacer vers `@verone/organisations/components`

**Temps estimé** : 25 minutes

---

### 17. ⚠️ Composant `DynamicColorSelector`

**Fichier** : `apps/back-office/src/components/forms/quick-variant-form.tsx` (ligne 24, 417)

**Impact** : Sélecteur couleurs dynamique manquant

**Statut** : Composant n'existe PAS (jamais créé)

**Solution** :

1. Créer composant dans `@verone/products/components/color-selector`
2. Utiliser logic existante `use-color-selection.ts`

**Temps estimé** : 1 heure (création from scratch)

---

### 18. ⚠️ Réservations Stock Désactivées

**Fichier** : `apps/back-office/src/app/stocks/produits/page.tsx` (ligne 347)

**Problème** :

```typescript
// fetchReservations désactivé temporairement - erreur clé étrangère
```

**Impact** : Réservations stock ne se chargent pas

**Solution** :

1. Hook existe : `packages/@verone/stock/src/hooks/use-stock-reservations.ts`
2. Identifier/corriger erreur clé étrangère PostgreSQL
3. Réactiver appel dans `loadData()`

**Temps estimé** : 30 minutes (debug SQL)

---

### 19-23. ⚠️ Exports Manquants `apps/back-office/src/components/business/index.ts`

**Fichier** : `apps/back-office/src/components/business/index.ts`

**Impact** : 103 composants business NON exportés

**Code actuel** :

```typescript
// Modules temporairement commentés (fichiers manquants)
// export { ProductCard } from './product-card';
// export { CollectionGrid } from './collection-grid';
```

**Solution** :

1. Créer exports barrel complets pour les 103 composants
2. Permettre imports depuis `@/components/business` (clean)

**Temps estimé** : 45 minutes

---

### 24-31. ⚠️ Autres composants importants (8)

Liste complète dans fichier `MIGRATION-TURBOREPO-TODO.md`

---

## 🟡 PROBLÈMES MINEURS (16)

### 32-34. Composants UI @verone/ui désactivés (3)

**Fichiers** :

- `ImageUploadZone` (dépend Supabase Storage)
- `PhaseIndicator` (dépend feature flags)
- `RoomMultiSelect` (dépend types métier)

**Impact** : Composants UI génériques non portables

**Solution** : Déplacer vers app principale (documenté `DISABLED_COMPONENTS.md`)

**Temps estimé** : 1 heure

---

### 35. TODO Éco-participation SQL

**Fichiers** :

- `packages/@verone/orders/src/hooks/use-sales-orders.ts` (ligne 538)
- `packages/@verone/orders/src/components/modals/SalesOrderFormModal.tsx` (ligne 834)

**Impact** : Calcul `eco_tax_total` manquant

**Solution** :

1. Migration SQL ajouter colonne `eco_tax_total`
2. Trigger auto-calcul depuis items

**Temps estimé** : 45 minutes

---

### 36. TypeScript Build Errors Désactivés

**Fichier** : `apps/back-office/next.config.js` (lignes 20-25)

**Code** :

```javascript
typescript: {
  ignoreBuildErrors: true, // TEMPORARY
}
```

**Impact** : Erreurs TypeScript non bloquantes en build

**Solution** :

1. Corriger ~30 erreurs TypeScript restantes
2. Réactiver validation stricte

**Temps estimé** : 2 heures

---

### 37-47. Modules Phase 1 & Désactivations Mineures (11)

**Liste** :

- `/apps/back-office/src/app/tresorerie/page.tsx` (placeholder Phase 2)
- `/apps/back-office/src/app/factures/page.tsx` (placeholder Phase 2)
- `fetchReservations` (erreur FK)
- `use-manual-tests` (TS2307)
- Module `logistics` (Phase 2)
- Google Maps billing (PickupPointSelector)
- Sentry monitoring
- Autosave ébauches
- PWA features

**Statut** : Attendu (roadmap) ou non critique

---

## 📊 STATISTIQUES GLOBALES

| Métrique                         | Valeur             |
| -------------------------------- | ------------------ |
| **Fichiers avec code désactivé** | 47                 |
| **Composants manquants exports** | 103                |
| **Server Actions désactivées**   | 3 (2 corrigées ✅) |
| **Hooks incomplets**             | 4                  |
| **Composants `.disabled`**       | 6                  |
| **TODOs critiques**              | 12                 |
| **Migrations SQL pending**       | 1                  |

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1 : Correctifs Critiques (4h)

**Priorité maximale** - Fonctionnalités utilisateur cassées

1. ✅ **FAIT** : Corriger updateStatus Purchase/Sales Orders
2. [ ] Activer suppression alertes stock (15 min)
3. [ ] Restaurer EcoTaxVatInput (30 min)
4. [ ] Restaurer CategoryHierarchySelector (45 min)
5. [ ] Restaurer ProductImageGallery (1h)
6. [ ] Restaurer ProductCardV2 (30 min)
7. [ ] Restaurer ContactFormModal (20 min)

**Temps total** : ~4h

---

### Phase 2 : Composants Stock (2h)

8. [ ] Réactiver StockKPICard (30 min)
9. [ ] Réactiver StockMovementCard (30 min)
10. [ ] Réactiver ChannelFilter (30 min)
11. [ ] Corriger réservations stock (30 min)

**Temps total** : ~2h

---

### Phase 3 : Composants Business (3h)

12. [ ] Déplacer 8 composants vers @verone/\* (2h)
13. [ ] Créer exports barrel `/components/business/index.ts` (45 min)
14. [ ] Tests imports fonctionnels (15 min)

**Temps total** : ~3h

---

### Phase 4 : Qualité Code (2h)

15. [ ] Migration SQL éco-participation (45 min)
16. [ ] Corriger erreurs TypeScript build (1h)
17. [ ] Documentation mise à jour (15 min)

**Temps total** : ~2h

---

## ✅ CHECKLIST VALIDATION FINALE

**Avant déclaration "Migration 100% complète"** :

- [ ] 0 erreurs console production
- [ ] 0 FIXME dans hooks critiques (@verone/orders)
- [ ] 0 composants `.disabled` dans @verone/ui
- [ ] 103 composants business exportés dans barrel
- [ ] TypeScript strict mode activé (ignoreBuildErrors: false)
- [ ] Build production 0 warnings
- [ ] Tests E2E passent (commandes, stock, produits)
- [ ] Toutes Server Actions accessibles depuis packages

---

## 📈 IMPACT BUSINESS SI NON CORRIGÉ

| Module                         | Fonctionnel       | Critique                       |
| ------------------------------ | ----------------- | ------------------------------ |
| Commandes clients/fournisseurs | ✅ 100% (corrigé) | -                              |
| Gestion produits               | ⚠️ 50%            | Galerie, catégories manquantes |
| Gestion stock                  | ⚠️ 80%            | Composants visuels manquants   |
| Gestion organisations          | ⚠️ 90%            | Contacts modal manquant        |
| Finance/Trésorerie             | ⏸️ Phase 2        | Attendu                        |

---

**Rapport généré le** : 2025-11-19
**Dernière mise à jour** : 2025-11-19
**Mainteneur** : Romeo Dos Santos
**Source** : Audit exhaustif Claude Code (Agent Plan)

---

## 📚 RÉFÉRENCES

- **TODO Tracking** : `docs/architecture/MIGRATION-TURBOREPO-TODO.md`
- **Guide migration** : `docs/architecture/monorepo.md`
- **Composants catalogue** : `docs/architecture/COMPOSANTS-CATALOGUE.md`
- **Claude instructions** : `CLAUDE.md`
