# TS ERRORS RESOLUTION PLAN - Migration Modulaire

**Date de création** : 2025-11-07
**Contexte** : Migration vers architecture modulaire (`src/shared/modules/`)
**Objectif** : Réduire 249 erreurs TypeScript → 0

---

## 📊 ÉTAT INITIAL

**Total** : 249 erreurs TypeScript

**Distribution par code** :

- TS2339 : 122 erreurs (49.0%) - Property does not exist
- TS2345 : 42 erreurs (16.9%) - Argument type not assignable
- TS2307 : 42 erreurs (16.9%) - Cannot find module
- TS2305 : 21 erreurs (8.4%) - Module has no exported member
- TS2322 : 9 erreurs (3.6%) - Type not assignable
- TS2724 : 5 erreurs (2.0%) - No exported member (alternative)
- TS2552 : 4 erreurs (1.6%) - Cannot find name
- TS2769 : 2 erreurs (0.8%) - No overload matches
- TS2304 : 1 erreur (0.4%) - Cannot find name
- TS2352 : 1 erreur (0.4%) - Conversion error

---

## 🎯 FAMILLES D'ERREURS (Priorisées)

### FAMILLE 1: TS2307 - Cannot Find Module (P0 - BLOQUANT BUILD)

**Count** : 42 erreurs (16.9%)
**Priority** : P0 - BLOQUANT BUILD
**Status** : ⏳ TODO

**Pattern identifié** :

```typescript
error TS2307: Cannot find module './component-name' or its corresponding type declarations.
```

**Fichiers impactés** :

- `src/app/stocks/mouvements/page.tsx` : MovementsStatsCards
- `src/shared/modules/categories/components/modals/CategorizeModal.tsx` : category-hierarchy-selector
- `src/shared/modules/common/components/address/AddressInput.tsx` : customer-selector
- `src/shared/modules/common/components/collections/CollectionCreationWizard.tsx` : room-types
- `src/shared/modules/common/components/collections/CollectionFormModal.tsx` : room-types, collection-image-upload
- `src/shared/modules/common/components/collections/CollectionGrid.tsx` : product-card
- `src/shared/modules/consultations/components/associations/ConsultationProductAssociation.tsx` : product-selector
- `src/shared/modules/consultations/components/images/ConsultationImageGallery.tsx` : ConsultationPhotosModal
- `src/shared/modules/customers/components/sections/OrganisationContactsManager.tsx` : contact-form-modal
- `src/shared/modules/dashboard/hooks/use-complete-dashboard-metrics.ts` : use-stock-orders-metrics
- `src/shared/modules/logistics/components/shipment-forms/ManualShipmentForm.tsx` : shipment-recap-modal
- `src/shared/modules/orders/components/modals/ShippingManagerModal.tsx` : carrier-selector, shipment-recap-modal, packlink-shipment-form, mondial-relay-shipment-form, chronotruck-shipment-form, manual-shipment-form
- `src/shared/modules/products/components/modals/CreateCollectionModal.tsx` : collection-image-upload

**Stratégie** :

1. Vérifier existence fichiers cibles
2. Si fichier existe : Corriger import path (relatif vs barrel export)
3. Si fichier n'existe pas : Corriger import vers fichier correct
4. Éviter création fichiers manquants - corriger imports

**Estimation** : 2-3h

**Tests requis** :

- ✅ `npm run type-check` : Réduction 42 erreurs
- ✅ `npm run build` : Success maintenu

---

### FAMILLE 2: TS2305 - No Exported Member (P1 - CRITIQUE)

**Count** : 21 erreurs (8.4%) + 5 TS2724 = 26 erreurs totales
**Priority** : P1 - CRITIQUE
**Status** : ⏳ TODO

**Pattern identifié** :

```typescript
error TS2305: Module '"@/shared/modules/xxx/hooks"' has no exported member 'TypeName'.
error TS2724: '"@/shared/modules/xxx/hooks"' has no exported member named 'TypeName'. Did you mean 'OtherName'?
```

**Fichiers impactés** :

- `src/components/business/wizard-sections/*.tsx` (7 fichiers) : WizardFormData
- `src/shared/modules/consultations/components/interfaces/ConsultationOrderInterface.tsx` : ConsultationItem (suggestion: useConsultationItems)
- `src/shared/modules/consultations/components/interfaces/ConsultationOrderInterface.tsx` : SourcingProductModal (suggestion: EditSourcingProductModal)
- `src/shared/modules/orders/components/forms/SalesOrderShipmentForm.tsx` : SalesOrderForShipment
- `src/shared/modules/orders/components/modals/create-organisation-modal.tsx` : CreateOrganisationData
- `src/shared/modules/orders/components/modals/PurchaseOrderFormModal.tsx` : CreatePurchaseOrderData
- `src/shared/modules/orders/components/modals/SalesOrderFormModal.tsx` : CreateSalesOrderData
- `src/shared/modules/orders/components/modals/SalesOrderShipmentModal.tsx` : SalesOrderForShipment

**Stratégie** :

1. Audit barrel exports dans `src/shared/modules/*/hooks/index.ts`
2. Audit barrel exports dans `src/shared/modules/*/components/index.ts`
3. Ajouter exports manquants ou corriger noms exports
4. Suivre suggestions TypeScript quand disponibles

**Estimation** : 1-2h

**Tests requis** :

- ✅ `npm run type-check` : Réduction 26 erreurs
- ✅ `npm run build` : Success maintenu

---

### FAMILLE 3: TS2339 - Property Does Not Exist (P2 - HIGH)

**Count** : 122 erreurs (49.0%)
**Priority** : P2 - HIGH
**Status** : ⏳ TODO

**Pattern identifié** :

```typescript
error TS2339: Property 'property_name' does not exist on type 'TypeName'.
```

**Sous-familles détectées** :

#### 3.1 - Notification Type (43 erreurs)

Propriétés manquantes : `severity`, `created_at`, `read`, `action_url`, `action_label`, `unreadCount`, `loading`, `markAsRead`, `markAllAsRead`, `deleteNotification`

Fichiers :

- `src/app/notifications/page.tsx`
- `src/shared/modules/notifications/components/dropdowns/NotificationsDropdown.tsx`

**Stratégie** : Vérifier type `Notification` dans `src/types/supabase.ts` et hooks notifications

#### 3.2 - Auth User Type (6 erreurs)

Propriétés manquantes : `id`, `email`, `email_confirmed_at`, `created_at`, `user_metadata`

Fichiers :

- `src/app/admin/users/page.tsx`

**Stratégie** : Typer correctement objet user Supabase Auth

#### 3.3 - SelectQueryError (73 erreurs)

Erreurs sur objets résultant de requêtes SQL avec colonnes manquantes

Fichiers :

- `src/shared/modules/orders/components/modals/UniversalOrderDetailsModal.tsx` (majorité)
- `src/shared/modules/orders/hooks/use-sales-orders.ts`

**Stratégie** : Corriger requêtes SQL pour inclure colonnes manquantes (`eco_tax_vat_rate`, `customer_type`, `customer_id`, etc.)

**Estimation** : 3-4h

**Tests requis** :

- ✅ `npm run type-check` : Réduction 122 erreurs
- ✅ `npm run build` : Success maintenu
- ✅ MCP Playwright Browser : `/notifications`, `/admin/users`

---

### FAMILLE 4: TS2345 - Argument Type Not Assignable (P2 - HIGH)

**Count** : 42 erreurs (16.9%)
**Priority** : P2 - HIGH
**Status** : ⏳ TODO

**Pattern identifié** :

```typescript
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'.
```

**Sous-familles détectées** :

#### 4.1 - Array Type Inference (16 erreurs)

Type `'never'` dans arrays

Fichiers :

- `src/app/contacts-organisations/contacts/[contactId]/page.tsx`
- `src/app/contacts-organisations/contacts/page.tsx`
- `src/app/organisation/components/contacts-tab.tsx`
- `src/shared/modules/customers/components/sections/*.tsx`

**Stratégie** : Typer explicitement arrays `as const` ou définir type array

#### 4.2 - String to Never (8 erreurs)

Strings assignés à type `never`

Fichiers :

- `src/components/forms/QuickVariantForm.tsx`
- `src/shared/modules/categories/components/selectors/SubcategorySearchSelector.tsx`

**Stratégie** : Corriger types génériques ou type assertions

#### 4.3 - Object Type Mismatch (18 erreurs)

Incompatibilités types objets (null vs undefined, propriétés manquantes)

Fichiers :

- `src/shared/modules/customers/components/modals/CustomerFormModal.tsx`
- `src/shared/modules/orders/components/modals/create-individual-customer-modal.tsx`

**Stratégie** : Ajuster types interfaces ou normaliser null/undefined

**Estimation** : 2-3h

**Tests requis** :

- ✅ `npm run type-check` : Réduction 42 erreurs
- ✅ `npm run build` : Success maintenu

---

### FAMILLE 5: TS2322 + Autres (P3 - LOW)

**Count** : 23 erreurs (9.2%)
**Priority** : P3 - LOW
**Status** : ⏳ TODO

**Codes inclus** :

- TS2322 : 9 erreurs (Type not assignable)
- TS2552 : 4 erreurs (Cannot find name)
- TS2769 : 2 erreurs (No overload matches)
- TS2304 : 1 erreur (Cannot find name)
- TS2352 : 1 erreur (Conversion error)

**Stratégie** : Corrections au cas par cas selon pattern spécifique

**Estimation** : 1-2h

**Tests requis** :

- ✅ `npm run type-check` : 0 erreurs
- ✅ `npm run build` : Success maintenu

---

## 📋 WORKFLOW PAR FAMILLE

```typescript
1. Sélection famille prioritaire (P0 → P1 → P2 → P3)
2. Lecture 5-10 exemples représentatifs
3. Identification pattern commun
4. Correction COMPLÈTE famille en UNE session
5. Tests OBLIGATOIRES :
   - npm run type-check (vérifier réduction)
   - npm run build (non-régression)
   - MCP Browser pages affectées (si applicable)
6. Commit structuré :
   fix(types): [CODE-PATTERN] Description - X erreurs (avant→après)
7. Push
8. Mise à jour statut famille → DONE
9. Passage famille suivante
```

---

## 🎯 MÉTRIQUES SUCCÈS

### Quantitatives

- ✅ Erreurs TypeScript : 249 → 0
- ✅ Build : Success maintenu
- ✅ Console errors : 0 sur pages testées
- ✅ Temps total : <15h (3h/jour sur 5 jours)

### Qualitatives

- ✅ Code plus maintenable
- ✅ Type safety améliorée
- ✅ Aucune régression fonctionnelle
- ✅ Documentation patterns réutilisables

---

## 📝 PROGRESSION

| Famille | Code          | Count | Priority | Status  | Date | Commit |
| ------- | ------------- | ----- | -------- | ------- | ---- | ------ |
| 1       | TS2307        | 42    | P0       | ⏳ TODO | -    | -      |
| 2       | TS2305/TS2724 | 26    | P1       | ⏳ TODO | -    | -      |
| 3       | TS2339        | 122   | P2       | ⏳ TODO | -    | -      |
| 4       | TS2345        | 42    | P2       | ⏳ TODO | -    | -      |
| 5       | Autres        | 23    | P3       | ⏳ TODO | -    | -      |

**Total** : 249 erreurs → 0 erreurs

---

## 🔧 COMMANDES UTILES

```bash
# Export erreurs
npm run type-check 2>&1 > ts-errors-raw.log

# Statistiques erreurs
grep -oE "error TS[0-9]{4}:" ts-errors-raw.log | sort | uniq -c | sort -rn

# Rechercher pattern spécifique
grep "TS2307" ts-errors-raw.log

# Build validation
npm run build

# Type check seul
npm run type-check
```

---

**Version** : 1.0.0
**Mainteneur** : Claude Code + Romeo Dos Santos
**Dernière mise à jour** : 2025-11-07
