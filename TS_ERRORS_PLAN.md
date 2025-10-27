# 🎯 TypeScript Errors - Plan de Correction

**Date** : 27/10/2025
**Total erreurs** : 975
**Familles** : 72

---

## 📊 Vue d'ensemble

| Priorité | Familles | Erreurs |
|----------|----------|---------|
| P0 (Blocking) | 1 | 16 |
| P1 (Critical) | 11 | 710 |
| P2 (High) | 4 | 106 |
| P3 (Low) | 56 | 143 |

---

## 🏆 Milestones

- [ ] **M1** : 100 erreurs résolues (975→875)
- [ ] **M2** : 250 erreurs résolues (975→725)
- [ ] **M3** : 500 erreurs résolues (975→475)
- [ ] **M4** : Toutes P0+P1 résolues
- [ ] **M5** : 0 erreurs TypeScript

---

## P0 - Blocking (1 familles)

### 📋 TS7006-parameter-x-implicitly-has-an-

**Code** : TS7006
**Count** : 16 erreurs
**Files** : 5 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Parameter 'X' implicitly has an 'any' type.
```

**Stratégie** : Explicit typing, remove implicit any

**Exemples** :
- `src/components/testing/error-detection-panel.tsx:266` - Parameter 'e' implicitly has an 'any' type....
- `src/components/testing/error-detection-panel.tsx:267` - Parameter 'e' implicitly has an 'any' type....
- `src/components/testing/error-detection-panel.tsx:268` - Parameter 'e' implicitly has an 'any' type....

**Commande** : `/typescript-fix TS7006-parameter-x-implicitly-has-an-`

---

## P1 - Critical (11 familles)

### 📋 TS2339-property-x-does-not-exist-on-t

**Code** : TS2339
**Count** : 265 erreurs
**Files** : 71 fichiers
**Estimation** : 22-25h
**Status** : TODO

**Pattern** :
```
Property 'X' does not exist on type 'X'.
```

**Stratégie** : Interface extension, optional properties

**Exemples** :
- `src/app/produits/catalogue/[productId]/page.tsx:589` - Property 'legal_name' does not exist on type '{ id: string; name: string; email:...
- `src/app/produits/catalogue/[productId]/page.tsx:589` - Property 'trade_name' does not exist on type '{ id: string; name: string; email:...
- `src/app/produits/catalogue/categories/[categoryId]/page.tsx:294` - Property 'products_count' does not exist on type '{ category_id: string; created...

**Commande** : `/typescript-fix TS2339-property-x-does-not-exist-on-t`

---

### 📋 TS2322-type-x-is-not-assignable-to-ty

**Code** : TS2322
**Count** : 242 erreurs
**Files** : 110 fichiers
**Estimation** : 12-15h
**Status** : TODO

**Pattern** :
```
Type 'X' is not assignable to type 'X'.
```

**Stratégie** : Null coalescing (??), optional chaining (?.)

**Exemples** :
- `src/app/canaux-vente/prix-clients/page.tsx:118` - Type '{ customer_name: string; product_name: string; id: string; customer_id: st...
- `src/app/consultations/page.tsx:169` - Type 'import("/Users/romeodossantos/verone-back-office-V1/src/hooks/use-consulta...
- `src/app/produits/catalogue/[productId]/page.tsx:418` - Type '(updatedData: Partial<Product>) => Promise<void>' is not assignable to typ...

**Commande** : `/typescript-fix TS2322-type-x-is-not-assignable-to-ty`

---

### 📋 TS2345-argument-of-type-x-is-not-assi

**Code** : TS2345
**Count** : 152 erreurs
**Files** : 90 fichiers
**Estimation** : 10-13h
**Status** : TODO

**Pattern** :
```
Argument of type 'X' is not assignable to parameter of type 'X'.
```

**Stratégie** : Type assertions, generic constraints

**Exemples** :
- `src/app/produits/catalogue/[productId]/page.tsx:222` - Argument of type '{ archived_at: string | null; assigned_client_id: string | nul...
- `src/app/produits/catalogue/[productId]/page.tsx:243` - Argument of type '{ updated_at: string; id?: string | undefined; name?: string |...
- `src/app/produits/catalogue/[productId]/page.tsx:257` - Argument of type '{ archived_at: string | null; assigned_client_id: string | nul...

**Commande** : `/typescript-fix TS2345-argument-of-type-x-is-not-assi`

---

### 📋 TS2339-property-x-does-not-exist-on-t

**Code** : TS2339
**Count** : 17 erreurs
**Files** : 1 fichiers
**Estimation** : 1-3h
**Status** : TODO

**Pattern** :
```
Property 'X' does not exist on type 'X'room_category' does not exist on 'collections'.">'.
```

**Stratégie** : Interface extension, optional properties

**Exemples** :
- `src/hooks/use-smart-suggestions.ts:75` - Property 'style' does not exist on type 'SelectQueryError<"column 'room_category...
- `src/hooks/use-smart-suggestions.ts:76` - Property 'style' does not exist on type 'SelectQueryError<"column 'room_category...
- `src/hooks/use-smart-suggestions.ts:76` - Property 'style' does not exist on type 'SelectQueryError<"column 'room_category...

**Commande** : `/typescript-fix TS2339-property-x-does-not-exist-on-t`

---

### 📋 TS2339-property-x-does-not-exist-on-t

**Code** : TS2339
**Count** : 13 erreurs
**Files** : 1 fichiers
**Estimation** : 1-3h
**Status** : TODO

**Pattern** :
```
Property 'X' does not exist on type 'X'id' does not exist on 'families'."> | SelectQueryError<"column 'id' does not exist on 'categories'."> | ... 51 more ... | SelectQueryError<...>'.
```

**Stratégie** : Interface extension, optional properties

**Exemples** :
- `src/hooks/use-sales-shipments.ts:366` - Property 'id' does not exist on type 'SelectQueryError<"column 'id' does not exi...
- `src/hooks/use-sales-shipments.ts:367` - Property 'shipped_at' does not exist on type 'SelectQueryError<"column 'id' does...
- `src/hooks/use-sales-shipments.ts:368` - Property 'delivered_at' does not exist on type 'SelectQueryError<"column 'id' do...

**Commande** : `/typescript-fix TS2339-property-x-does-not-exist-on-t`

---

### 📋 TS2339-property-x-does-not-exist-on-t

**Code** : TS2339
**Count** : 7 erreurs
**Files** : 5 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Property 'X' does not exist on type 'X'name' does not exist on 'organisations'.">'.
```

**Stratégie** : Interface extension, optional properties

**Exemples** :
- `src/components/business/universal-order-details-modal.tsx:120` - Property 'name' does not exist on type 'SelectQueryError<"column 'name' does not...
- `src/components/business/universal-order-details-modal.tsx:180` - Property 'name' does not exist on type 'SelectQueryError<"column 'name' does not...
- `src/hooks/metrics/use-order-metrics.ts:106` - Property 'name' does not exist on type 'SelectQueryError<"column 'name' does not...

**Commande** : `/typescript-fix TS2339-property-x-does-not-exist-on-t`

---

### 📋 TS2339-property-x-does-not-exist-on-t

**Code** : TS2339
**Count** : 6 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Property 'X' does not exist on type 'X'product_id' does not exist on 'families'."> | SelectQueryError<"column 'product_id' does not exist on 'categories'."> | ... 51 more ... | SelectQueryError<...>'.
```

**Stratégie** : Interface extension, optional properties

**Exemples** :
- `src/hooks/use-stock-dashboard.ts:212` - Property 'product_id' does not exist on type 'SelectQueryError<"column 'product_...
- `src/hooks/use-stock-dashboard.ts:214` - Property 'product_id' does not exist on type 'SelectQueryError<"column 'product_...
- `src/hooks/use-stock-dashboard.ts:215` - Property 'product_name' does not exist on type 'SelectQueryError<"column 'produc...

**Commande** : `/typescript-fix TS2339-property-x-does-not-exist-on-t`

---

### 📋 TS2339-property-x-does-not-exist-on-t

**Code** : TS2339
**Count** : 3 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Property 'X' does not exist on type 'X'has_different_trade_name' does not exist on 'organisations'.">'.
```

**Stratégie** : Interface extension, optional properties

**Exemples** :
- `src/hooks/use-organisations.ts:650` - Property 'type' does not exist on type 'SelectQueryError<"column 'has_different_...
- `src/hooks/use-organisations.ts:655` - Property 'id' does not exist on type 'SelectQueryError<"column 'has_different_tr...
- `src/hooks/use-organisations.ts:657` - Property '_count' does not exist on type 'SelectQueryError<"column 'has_differen...

**Commande** : `/typescript-fix TS2339-property-x-does-not-exist-on-t`

---

### 📋 TS2339-property-x-does-not-exist-on-t

**Code** : TS2339
**Count** : 2 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Property 'X' does not exist on type 'X'amount_paid' does not exist on 'families'."> | SelectQueryError<"column 'amount_paid' does not exist on 'categories'."> | ... 51 more ... | SelectQueryError<...>'.
```

**Stratégie** : Interface extension, optional properties

**Exemples** :
- `src/components/business/payment-form.tsx:137` - Property 'amount_paid' does not exist on type 'SelectQueryError<"column 'amount_...
- `src/components/business/payment-form.tsx:139` - Property 'total_ttc' does not exist on type 'SelectQueryError<"column 'amount_pa...

**Commande** : `/typescript-fix TS2339-property-x-does-not-exist-on-t`

---

### 📋 TS2339-property-x-does-not-exist-on-t

**Code** : TS2339
**Count** : 2 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Property 'X' does not exist on type 'X'alert_status' does not exist on 'families'."> | SelectQueryError<"column 'alert_status' does not exist on 'categories'."> | ... 51 more ... | SelectQueryError<...>'.
```

**Stratégie** : Interface extension, optional properties

**Exemples** :
- `src/hooks/use-stock-dashboard.ts:150` - Property 'alert_status' does not exist on type 'SelectQueryError<"column 'alert_...
- `src/hooks/use-stock-dashboard.ts:151` - Property 'alert_status' does not exist on type 'SelectQueryError<"column 'alert_...

**Commande** : `/typescript-fix TS2339-property-x-does-not-exist-on-t`

---

### 📋 TS2339-property-x-does-not-exist-on-t

**Code** : TS2339
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Property 'X' does not exist on type 'X'price_ttc' does not exist on 'products'.">'.
```

**Stratégie** : Interface extension, optional properties

**Exemples** :
- `src/hooks/use-archived-products.ts:81` - Property 'images' does not exist on type 'SelectQueryError<"column 'price_ttc' d...

**Commande** : `/typescript-fix TS2339-property-x-does-not-exist-on-t`

---

## P2 - High (4 familles)

### 📋 TS2769-no-overload-matches-this-call-

**Code** : TS2769
**Count** : 84 erreurs
**Files** : 36 fichiers
**Estimation** : 6-9h
**Status** : TODO

**Pattern** :
```
No overload matches this call.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/app/produits/catalogue/dashboard/page.tsx:88` - No overload matches this call....
- `src/app/produits/catalogue/subcategories/[subcategoryId]/page.tsx:252` - No overload matches this call....
- `src/app/profile/page.tsx:153` - No overload matches this call....

**Commande** : `/typescript-fix TS2769-no-overload-matches-this-call-`

---

### 📋 TS2307-cannot-find-module-x-or-its-co

**Code** : TS2307
**Count** : 20 erreurs
**Files** : 12 fichiers
**Estimation** : 1-3h
**Status** : TODO

**Pattern** :
```
Cannot find module 'X' or its corresponding type declarations.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/error-reporting-dashboard.tsx:36` - Cannot find module '@/lib/error-detection/error-processing-queue' or its corresp...
- `src/components/business/error-reporting-dashboard.tsx:37` - Cannot find module '@/lib/error-detection/error-processing-queue' or its corresp...
- `src/components/business/error-reporting-dashboard.tsx:38` - Cannot find module '@/lib/error-detection/verone-error-system' or its correspond...

**Commande** : `/typescript-fix TS2307-cannot-find-module-x-or-its-co`

---

### 📋 TS2783--success-is-specified-more-tha

**Code** : TS2783
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'success' is specified more than once, so this usage will be overwritten.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-test-persistence.ts:241` - 'success' is specified more than once, so this usage will be overwritten....

**Commande** : `/typescript-fix TS2783--success-is-specified-more-tha`

---

### 📋 TS18046--error-is-of-type-x-

**Code** : TS18046
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'error' is of type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/lib/ai/sequential-thinking-processor.ts:134` - 'error' is of type 'unknown'....

**Commande** : `/typescript-fix TS18046--error-is-of-type-x-`

---

## P3 - Low (56 familles)

### 📋 TS2353-object-literal-may-only-specif

**Code** : TS2353
**Count** : 33 erreurs
**Files** : 4 fichiers
**Estimation** : 2-4h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, and 'operation' does not exist in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-price-lists.ts:154` - Object literal may only specify known properties, and 'operation' does not exist...
- `src/hooks/use-price-lists.ts:169` - Object literal may only specify known properties, and 'operation' does not exist...
- `src/hooks/use-price-lists.ts:201` - Object literal may only specify known properties, and 'operation' does not exist...

**Commande** : `/typescript-fix TS2353-object-literal-may-only-specif`

---

### 📋 TS2352-conversion-of-type-x-to-type-x

**Code** : TS2352
**Count** : 18 erreurs
**Files** : 11 fichiers
**Estimation** : 1-3h
**Status** : TODO

**Pattern** :
```
Conversion of type 'X' to type 'X' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/app/finance/depenses/[id]/page.tsx:97` - Conversion of type '{ id: string; document_type: "customer_invoice" | "customer_...
- `src/components/forms/CategoryForm.tsx:219` - Conversion of type '{ created_at: string | null; description: string | null; dis...
- `src/components/forms/FamilyForm.tsx:184` - Conversion of type '{ created_at: string | null; created_by: string | null; desc...

**Commande** : `/typescript-fix TS2352-conversion-of-type-x-to-type-x`

---

### 📋 TS2554-expected-0-arguments-but-got-1

**Code** : TS2554
**Count** : 6 erreurs
**Files** : 6 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Expected 0 arguments, but got 1.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/forms/CategoryForm.tsx:104` - Expected 0 arguments, but got 1....
- `src/components/forms/FamilyForm.tsx:79` - Expected 0 arguments, but got 1....
- `src/components/forms/SubcategoryForm.tsx:127` - Expected 0 arguments, but got 1....

**Commande** : `/typescript-fix TS2554-expected-0-arguments-but-got-1`

---

### 📋 TS2304-cannot-find-name-x-

**Code** : TS2304
**Count** : 5 erreurs
**Files** : 5 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Cannot find name 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/error-reporting-dashboard.tsx:717` - Cannot find name 'getQueueSnapshot'....
- `src/components/business/product-creation-wizard.tsx:221` - Cannot find name 'CompleteProductWizard'....
- `src/components/business/sample-order-validation.tsx:98` - Cannot find name 'useDrafts'....

**Commande** : `/typescript-fix TS2304-cannot-find-name-x-`

---

### 📋 TS7053-element-implicitly-has-an-any-

**Code** : TS7053
**Count** : 5 erreurs
**Files** : 4 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Element implicitly has an 'any' type because expression of type 'X' can't be used to index type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-error-reporting-integration.ts:392` - Element implicitly has an 'any' type because expression of type 'string' can't b...
- `src/hooks/use-treasury-stats.ts:122` - Element implicitly has an 'any' type because expression of type '0' can't be use...
- `src/lib/ai/sequential-thinking-processor.ts:256` - Element implicitly has an 'any' type because expression of type 'any' can't be u...

**Commande** : `/typescript-fix TS7053-element-implicitly-has-an-any-`

---

### 📋 TS2698-spread-types-may-only-be-creat

**Code** : TS2698
**Count** : 4 erreurs
**Files** : 4 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Spread types may only be created from object types.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-archived-products.ts:80` - Spread types may only be created from object types....
- `src/hooks/use-automation-triggers.ts:247` - Spread types may only be created from object types....
- `src/hooks/use-stock-reservations.ts:133` - Spread types may only be created from object types....

**Commande** : `/typescript-fix TS2698-spread-types-may-only-be-creat`

---

### 📋 TS2358-the-left-hand-side-of-an-insta

**Code** : TS2358
**Count** : 3 erreurs
**Files** : 3 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
The left-hand side of an 'instanceof' expression must be of type 'X', an object type or a type parameter.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/app/produits/catalogue/collections/page.tsx:625` - The left-hand side of an 'instanceof' expression must be of type 'any', an objec...
- `src/app/produits/catalogue/variantes/page.tsx:543` - The left-hand side of an 'instanceof' expression must be of type 'any', an objec...
- `src/app/produits/sourcing/produits/page.tsx:303` - The left-hand side of an 'instanceof' expression must be of type 'any', an objec...

**Commande** : `/typescript-fix TS2358-the-left-hand-side-of-an-insta`

---

### 📋 TS18048--variant-variant-details-is-po

**Code** : TS18048
**Count** : 3 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'variant.variant_details' is possibly 'undefined'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/product-variants-section.tsx:317` - 'variant.variant_details' is possibly 'undefined'....
- `src/components/business/product-variants-section.tsx:317` - 'variant.variant_details' is possibly 'undefined'....
- `src/components/business/product-variants-section.tsx:323` - 'variant.variant_details' is possibly 'undefined'....

**Commande** : `/typescript-fix TS18048--variant-variant-details-is-po`

---

### 📋 TS18048--variant-variant-details-image

**Code** : TS18048
**Count** : 3 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'variant.variant_details.images' is possibly 'undefined'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/product-variants-section.tsx:317` - 'variant.variant_details.images' is possibly 'undefined'....
- `src/components/business/product-variants-section.tsx:317` - 'variant.variant_details.images' is possibly 'undefined'....
- `src/components/business/product-variants-section.tsx:323` - 'variant.variant_details.images' is possibly 'undefined'....

**Commande** : `/typescript-fix TS18048--variant-variant-details-image`

---

### 📋 TS2589-type-instantiation-is-excessiv

**Code** : TS2589
**Count** : 3 erreurs
**Files** : 3 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Type instantiation is excessively deep and possibly infinite.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-financial-payments.ts:80` - Type instantiation is excessively deep and possibly infinite....
- `src/hooks/use-price-lists.ts:236` - Type instantiation is excessively deep and possibly infinite....
- `src/hooks/use-pricing.ts:316` - Type instantiation is excessively deep and possibly infinite....

**Commande** : `/typescript-fix TS2589-type-instantiation-is-excessiv`

---

### 📋 TS2740-type-x-is-missing-the-followin

**Code** : TS2740
**Count** : 3 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Type 'X' is missing the following properties from type 'X': has_different_trade_name, logo_url, siren, first_name, and 6 more.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-organisations.ts:205` - Type '{ address_line1: string | null; address_line2: string | null; archived_at:...
- `src/hooks/use-organisations.ts:366` - Type '{ address_line1: string | null; address_line2: string | null; archived_at:...
- `src/hooks/use-organisations.ts:413` - Type '{ address_line1: string | null; address_line2: string | null; archived_at:...

**Commande** : `/typescript-fix TS2740-type-x-is-missing-the-followin`

---

### 📋 TS2678-type-x-is-not-comparable-to-ty

**Code** : TS2678
**Count** : 3 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Type 'X' is not comparable to type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-stock.ts:200` - Type '"IN"' is not comparable to type '"add" | "remove" | "adjust"'....
- `src/hooks/use-stock.ts:206` - Type '"OUT"' is not comparable to type '"add" | "remove" | "adjust"'....
- `src/hooks/use-stock.ts:215` - Type '"ADJUST"' is not comparable to type '"add" | "remove" | "adjust"'....

**Commande** : `/typescript-fix TS2678-type-x-is-not-comparable-to-ty`

---

### 📋 TS2719-type-x-is-not-assignable-to-ty

**Code** : TS2719
**Count** : 2 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Type 'X' is not assignable to type 'X'. Two different types with this name exist, but they are unrelated.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/app/produits/catalogue/[productId]/page.tsx:474` - Type 'Product' is not assignable to type 'Product'. Two different types with thi...
- `src/app/produits/catalogue/[productId]/page.tsx:546` - Type 'Product' is not assignable to type 'Product'. Two different types with thi...

**Commande** : `/typescript-fix TS2719-type-x-is-not-assignable-to-ty`

---

### 📋 TS18047--image-display-order-is-possib

**Code** : TS18047
**Count** : 2 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'image.display_order' is possibly 'null'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/product-image-management.tsx:286` - 'image.display_order' is possibly 'null'....
- `src/components/business/product-image-management.tsx:351` - 'image.display_order' is possibly 'null'....

**Commande** : `/typescript-fix TS18047--image-display-order-is-possib`

---

### 📋 TS2353-object-literal-may-only-specif

**Code** : TS2353
**Count** : 2 erreurs
**Files** : 2 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, and 'productType' does not exist in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/primary-image-upload.tsx:53` - Object literal may only specify known properties, and 'productType' does not exi...
- `src/components/business/product-image-management.tsx:53` - Object literal may only specify known properties, and 'productType' does not exi...

**Commande** : `/typescript-fix TS2353-object-literal-may-only-specif`

---

### 📋 TS2353-object-literal-may-only-specif

**Code** : TS2353
**Count** : 2 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, and 'archived_at' does not exist in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-consultations.ts:333` - Object literal may only specify known properties, and 'archived_at' does not exi...
- `src/hooks/use-consultations.ts:372` - Object literal may only specify known properties, and 'archived_at' does not exi...

**Commande** : `/typescript-fix TS2353-object-literal-may-only-specif`

---

### 📋 TS2353-object-literal-may-only-specif

**Code** : TS2353
**Count** : 2 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, and 'logo_url' does not exist in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-logo-upload.ts:105` - Object literal may only specify known properties, and 'logo_url' does not exist ...
- `src/hooks/use-logo-upload.ts:171` - Object literal may only specify known properties, and 'logo_url' does not exist ...

**Commande** : `/typescript-fix TS2353-object-literal-may-only-specif`

---

### 📋 TS18048--result-is-possibly-undefined-

**Code** : TS18048
**Count** : 2 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'result' is possibly 'undefined'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/forms/ImageUploadV2.tsx:65` - 'result' is possibly 'undefined'....
- `src/components/forms/ImageUploadV2.tsx:66` - 'result' is possibly 'undefined'....

**Commande** : `/typescript-fix TS18048--result-is-possibly-undefined-`

---

### 📋 TS2349-this-expression-is-not-callabl

**Code** : TS2349
**Count** : 2 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
This expression is not callable.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/ui/calendar.tsx:55` - This expression is not callable....
- `src/components/ui/calendar.tsx:60` - This expression is not callable....

**Commande** : `/typescript-fix TS2349-this-expression-is-not-callabl`

---

### 📋 TS7016-could-not-find-a-declaration-f

**Code** : TS7016
**Count** : 2 erreurs
**Files** : 2 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Could not find a declaration file for module 'react-dom'. '/Users/romeodossantos/verone-back-office-V1/node_modules/react-dom/index.js' implicitly has an 'any' type.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/ui/command-palette.tsx:10` - Could not find a declaration file for module 'react-dom'. '/Users/romeodossantos...
- `src/components/ui/notification-system.tsx:10` - Could not find a declaration file for module 'react-dom'. '/Users/romeodossantos...

**Commande** : `/typescript-fix TS7016-could-not-find-a-declaration-f`

---

### 📋 TS2538-type-x-cannot-be-used-as-an-in

**Code** : TS2538
**Count** : 2 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Type 'X' cannot be used as an index type.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-movements-history.ts:292` - Type 'null' cannot be used as an index type....
- `src/hooks/use-movements-history.ts:292` - Type 'null' cannot be used as an index type....

**Commande** : `/typescript-fix TS2538-type-x-cannot-be-used-as-an-in`

---

### 📋 TS2300-duplicate-identifier-margin-pe

**Code** : TS2300
**Count** : 2 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Duplicate identifier 'margin_percentage'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-sourcing-products.ts:15` - Duplicate identifier 'margin_percentage'....
- `src/hooks/use-sourcing-products.ts:38` - Duplicate identifier 'margin_percentage'....

**Commande** : `/typescript-fix TS2300-duplicate-identifier-margin-pe`

---

### 📋 TS2352-conversion-of-type-x-is-cover-

**Code** : TS2352
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Conversion of type 'X'is_cover' does not exist on 'collection_images'.">[]' to type 'X' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-collection-images.ts:81` - Conversion of type 'SelectQueryError<"column 'is_cover' does not exist on 'colle...

**Commande** : `/typescript-fix TS2352-conversion-of-type-x-is-cover-`

---

### 📋 TS18047--product-stock-quantity-is-pos

**Code** : TS18047
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'product.stock_quantity' is possibly 'null'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/app/produits/catalogue/[productId]/page.tsx:591` - 'product.stock_quantity' is possibly 'null'....

**Commande** : `/typescript-fix TS18047--product-stock-quantity-is-pos`

---

### 📋 TS2353-object-literal-may-only-specif

**Code** : TS2353
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, and 'meta_title' does not exist in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/app/produits/catalogue/collections/[collectionId]/page.tsx:328` - Object literal may only specify known properties, and 'meta_title' does not exis...

**Commande** : `/typescript-fix TS2353-object-literal-may-only-specif`

---

### 📋 TS2353-object-literal-may-only-specif

**Code** : TS2353
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, and 'variant_attributes' does not exist in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/variant-add-product-modal.tsx:73` - Object literal may only specify known properties, and 'variant_attributes' does ...

**Commande** : `/typescript-fix TS2353-object-literal-may-only-specif`

---

### 📋 TS2353-object-literal-may-only-specif

**Code** : TS2353
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, and 'deleted_at' does not exist in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-consultations.ts:415` - Object literal may only specify known properties, and 'deleted_at' does not exis...

**Commande** : `/typescript-fix TS2353-object-literal-may-only-specif`

---

### 📋 TS2353-object-literal-may-only-specif

**Code** : TS2353
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, and 'last_contact_date' does not exist in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-contacts.ts:416` - Object literal may only specify known properties, and 'last_contact_date' does n...

**Commande** : `/typescript-fix TS2353-object-literal-may-only-specif`

---

### 📋 TS2353-object-literal-may-only-specif

**Code** : TS2353
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, and 'mediaSource' does not exist in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-error-reporting.ts:372` - Object literal may only specify known properties, and 'mediaSource' does not exi...

**Commande** : `/typescript-fix TS2353-object-literal-may-only-specif`

---

### 📋 TS2353-object-literal-may-only-specif

**Code** : TS2353
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, and 'action' does not exist in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-google-merchant-sync.ts:173` - Object literal may only specify known properties, and 'action' does not exist in...

**Commande** : `/typescript-fix TS2353-object-literal-may-only-specif`

---

### 📋 TS2561-object-literal-may-only-specif

**Code** : TS2561
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Object literal may only specify known properties, but 'meta_description' does not exist in type 'X'. Did you mean to write 'description'?
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/app/produits/catalogue/collections/[collectionId]/page.tsx:352` - Object literal may only specify known properties, but 'meta_description' does no...

**Commande** : `/typescript-fix TS2561-object-literal-may-only-specif`

---

### 📋 TS2554-expected-1-arguments-but-got-2

**Code** : TS2554
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Expected 1 arguments, but got 2.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/app/produits/catalogue/collections/page.tsx:191` - Expected 1 arguments, but got 2....

**Commande** : `/typescript-fix TS2554-expected-1-arguments-but-got-2`

---

### 📋 TS2724--hooks-use-collections-has-no-

**Code** : TS2724
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'"../../hooks/use-collections"' has no exported member named 'CollectionStyle'. Did you mean 'Collection'?
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/collection-form-modal.tsx:12` - '"../../hooks/use-collections"' has no exported member named 'CollectionStyle'. ...

**Commande** : `/typescript-fix TS2724--hooks-use-collections-has-no-`

---

### 📋 TS2724--product-card-has-no-exported-

**Code** : TS2724
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'"./product-card"' has no exported member named 'ProductCardProps'. Did you mean 'ProductCard'?
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/index.ts:12` - '"./product-card"' has no exported member named 'ProductCardProps'. Did you mean...

**Commande** : `/typescript-fix TS2724--product-card-has-no-exported-`

---

### 📋 TS2724--collection-grid-has-no-export

**Code** : TS2724
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'"./collection-grid"' has no exported member named 'CollectionGridProps'. Did you mean 'CollectionGrid'?
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/index.ts:17` - '"./collection-grid"' has no exported member named 'CollectionGridProps'. Did yo...

**Commande** : `/typescript-fix TS2724--collection-grid-has-no-export`

---

### 📋 TS2305-module-hooks-use-collections-h

**Code** : TS2305
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Module '"../../hooks/use-collections"' has no exported member 'RoomCategory'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/collection-form-modal.tsx:12` - Module '"../../hooks/use-collections"' has no exported member 'RoomCategory'....

**Commande** : `/typescript-fix TS2305-module-hooks-use-collections-h`

---

### 📋 TS2722-cannot-invoke-an-object-which-

**Code** : TS2722
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Cannot invoke an object which is possibly 'undefined'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/financial-payment-form.tsx:112` - Cannot invoke an object which is possibly 'undefined'....

**Commande** : `/typescript-fix TS2722-cannot-invoke-an-object-which-`

---

### 📋 TS18048--item-products-is-possibly-und

**Code** : TS18048
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'item.products' is possibly 'undefined'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/order-detail-modal.tsx:237` - 'item.products' is possibly 'undefined'....

**Commande** : `/typescript-fix TS18048--item-products-is-possibly-und`

---

### 📋 TS18048--organisation-certification-la

**Code** : TS18048
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'organisation.certification_labels.length' is possibly 'undefined'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/performance-edit-section.tsx:294` - 'organisation.certification_labels.length' is possibly 'undefined'....

**Commande** : `/typescript-fix TS18048--organisation-certification-la`

---

### 📋 TS18048--product-cost-price-is-possibl

**Code** : TS18048
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'product.cost_price' is possibly 'undefined'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/product-info-section.tsx:31` - 'product.cost_price' is possibly 'undefined'....

**Commande** : `/typescript-fix TS18048--product-cost-price-is-possibl`

---

### 📋 TS18048--variant-variant-details-image

**Code** : TS18048
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
'variant.variant_details.images.length' is possibly 'undefined'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/product-variants-section.tsx:313` - 'variant.variant_details.images.length' is possibly 'undefined'....

**Commande** : `/typescript-fix TS18048--variant-variant-details-image`

---

### 📋 TS2367-this-comparison-appears-to-be-

**Code** : TS2367
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
This comparison appears to be unintentional because the types '"add" | "adjust"' and '"OUT"' have no overlap.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/components/business/stock-movement-modal.tsx:303` - This comparison appears to be unintentional because the types '"add" | "adjust"'...

**Commande** : `/typescript-fix TS2367-this-comparison-appears-to-be-`

---

### 📋 TS2367-this-comparison-appears-to-be-

**Code** : TS2367
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
This comparison appears to be unintentional because the types 'number' and 'string' have no overlap.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-consultations.ts:158` - This comparison appears to be unintentional because the types 'number' and 'stri...

**Commande** : `/typescript-fix TS2367-this-comparison-appears-to-be-`

---

### 📋 TS2367-this-comparison-appears-to-be-

**Code** : TS2367
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
This comparison appears to be unintentional because the types '"IN" | "OUT" | "ADJUST" | "TRANSFER"' and '"in"' have no overlap.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-dashboard-analytics.ts:132` - This comparison appears to be unintentional because the types '"IN" | "OUT" | "A...

**Commande** : `/typescript-fix TS2367-this-comparison-appears-to-be-`

---

### 📋 TS2367-this-comparison-appears-to-be-

**Code** : TS2367
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
This comparison appears to be unintentional because the types '"IN" | "OUT" | "ADJUST" | "TRANSFER"' and '"purchase_order"' have no overlap.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-dashboard-analytics.ts:132` - This comparison appears to be unintentional because the types '"IN" | "OUT" | "A...

**Commande** : `/typescript-fix TS2367-this-comparison-appears-to-be-`

---

### 📋 TS2367-this-comparison-appears-to-be-

**Code** : TS2367
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
This comparison appears to be unintentional because the types '"IN" | "OUT" | "ADJUST" | "TRANSFER"' and '"out"' have no overlap.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-dashboard-analytics.ts:134` - This comparison appears to be unintentional because the types '"IN" | "OUT" | "A...

**Commande** : `/typescript-fix TS2367-this-comparison-appears-to-be-`

---

### 📋 TS2367-this-comparison-appears-to-be-

**Code** : TS2367
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
This comparison appears to be unintentional because the types '"IN" | "OUT" | "ADJUST" | "TRANSFER"' and '"sales_order"' have no overlap.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-dashboard-analytics.ts:134` - This comparison appears to be unintentional because the types '"IN" | "OUT" | "A...

**Commande** : `/typescript-fix TS2367-this-comparison-appears-to-be-`

---

### 📋 TS2367-this-comparison-appears-to-be-

**Code** : TS2367
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
This comparison appears to be unintentional because the types '"draft" | "cancelled" | "confirmed" | "partially_shipped" | "shipped" | "delivered"' and '"validated"' have no overlap.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-sales-orders.ts:677` - This comparison appears to be unintentional because the types '"draft" | "cancel...

**Commande** : `/typescript-fix TS2367-this-comparison-appears-to-be-`

---

### 📋 TS2367-this-comparison-appears-to-be-

**Code** : TS2367
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
This comparison appears to be unintentional because the types '"remove" | "adjust"' and '"IN"' have no overlap.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-stock.ts:226` - This comparison appears to be unintentional because the types '"remove" | "adjus...

**Commande** : `/typescript-fix TS2367-this-comparison-appears-to-be-`

---

### 📋 TS2367-this-comparison-appears-to-be-

**Code** : TS2367
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
This comparison appears to be unintentional because the types '"adjust"' and '"OUT"' have no overlap.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-stock.ts:227` - This comparison appears to be unintentional because the types '"adjust"' and '"O...

**Commande** : `/typescript-fix TS2367-this-comparison-appears-to-be-`

---

### 📋 TS2741-property-x-is-missing-in-type-

**Code** : TS2741
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Property 'X' is missing in type 'X' but required in type 'X'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-error-reporting-integration.ts:321` - Property 'session_id' is missing in type '{ last_action: string; timestamp: Date...

**Commande** : `/typescript-fix TS2741-property-x-is-missing-in-type-`

---

### 📋 TS2365-operator-cannot-be-applied-to-

**Code** : TS2365
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Operator '>=' cannot be applied to types '{ stock_available: number; stock_forecasted_in: number; stock_forecasted_out: number; stock_real: number; stock_total_forecasted: number; }' and 'number'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-sales-orders.ts:463` - Operator '>=' cannot be applied to types '{ stock_available: number; stock_forec...

**Commande** : `/typescript-fix TS2365-operator-cannot-be-applied-to-`

---

### 📋 TS2820-type-x-is-not-assignable-to-ty

**Code** : TS2820
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Type 'X' is not assignable to type 'X'. Did you mean '"echantillon_a_commander"'?
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/hooks/use-sourcing-products.ts:463` - Type '"echantillon_commande"' is not assignable to type '"in_stock" | "out_of_st...

**Commande** : `/typescript-fix TS2820-type-x-is-not-assignable-to-ty`

---

### 📋 TS2484-export-declaration-conflicts-w

**Code** : TS2484
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Export declaration conflicts with exported declaration of 'LogEntry'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/lib/logger.ts:282` - Export declaration conflicts with exported declaration of 'LogEntry'....

**Commande** : `/typescript-fix TS2484-export-declaration-conflicts-w`

---

### 📋 TS2484-export-declaration-conflicts-w

**Code** : TS2484
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Export declaration conflicts with exported declaration of 'LogContext'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/lib/logger.ts:282` - Export declaration conflicts with exported declaration of 'LogContext'....

**Commande** : `/typescript-fix TS2484-export-declaration-conflicts-w`

---

### 📋 TS2484-export-declaration-conflicts-w

**Code** : TS2484
**Count** : 1 erreurs
**Files** : 1 fichiers
**Estimation** : 1h
**Status** : TODO

**Pattern** :
```
Export declaration conflicts with exported declaration of 'LogLevel'.
```

**Stratégie** : Manual review and fix

**Exemples** :
- `src/lib/logger.ts:282` - Export declaration conflicts with exported declaration of 'LogLevel'....

**Commande** : `/typescript-fix TS2484-export-declaration-conflicts-w`

---

## 📝 Workflow

1. **Sélectionner famille prioritaire** (ordre P0 → P1 → P2 → P3)
2. **Analyser pattern** : Lire exemples, comprendre cause racine
3. **Corriger TOUTE la famille** : Une session complète
4. **Tests AVANT commit** :
   - `npm run type-check` : Erreurs réduites
   - `npm run build` : Success
   - `/error-check` : 0 console errors
5. **Commit structuré** :
   ```
   fix(types): [CODE-PATTERN] Description - X erreurs (avant→après)
   ```
6. **Update ce fichier** : Marquer famille DONE
7. **Répéter** jusqu'à 0 erreurs

---

## 🎯 Prochaine Action

Famille recommandée : **TS7006-parameter-x-implicitly-has-an-**
- 16 erreurs
- Priorité P0
- Estimation 1h

```bash
/typescript-fix TS7006-parameter-x-implicitly-has-an-
```

---

**Généré automatiquement** : 2025-10-27T06:10:07.453Z
