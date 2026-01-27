# Analyse Async Safety Warnings - Phase 2B

**Date:** 2026-01-27
**Total warnings:** 680
- `no-floating-promises`: 397 (58%)
- `no-misused-promises`: 283 (42%)

---

## Patterns Identifiés (Documentation Officielle)

### Pattern #1: React Query `invalidateQueries` (non-awaited)

**Source:** [TanStack Query V5 Documentation](https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations)

**Problème actuel:**
```typescript
// ❌ INCORRECT - Promise not handled
onSuccess: count => {
  queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
  console.log(`✅ ${count} produits ajoutés`);
},
```

**Solution correcte (doc officielle):**
```typescript
// ✅ CORRECT - Await invalidation
onSuccess: async (count) => {
  await queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
  console.log(`✅ ${count} produits ajoutés`);
},
```

**Raison (citation doc):**
> "Returning a Promise in `onSuccess` ensures that the mutation's `isPending` state remains true until all invalidation operations are complete."

**Fichiers concernés (estimation):** ~200 warnings
**Exemple:** `use-linkme-catalog.ts` lignes 480, 503, 562, 621, 680, 740, 772, 804, 1089, 1092, 1124, 1127, 1157, 1158, 1197, 1200

---

### Pattern #2: Event Handlers (onClick, onSubmit) avec async

**Problème actuel:**
```typescript
// ❌ INCORRECT - Async function in onClick
<Button onClick={async () => {
  await someAsyncOperation();
  doSomethingElse();
}}>
```

**Solutions possibles:**

**Option A: Wrapper avec void (fire-and-forget)**
```typescript
// ✅ Si on ne veut pas bloquer l'UI
<Button onClick={() => {
  void someAsyncOperation().catch(console.error);
}}>
```

**Option B: Fonction handler explicite**
```typescript
// ✅ Si on veut gérer l'état (loading, error)
const handleClick = async () => {
  setIsLoading(true);
  try {
    await someAsyncOperation();
    doSomethingElse();
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};

<Button onClick={() => { void handleClick(); }} disabled={isLoading}>
```

**Fichiers concernés (estimation):** ~283 warnings (tous les no-misused-promises)

---

### Pattern #3: Supabase operations (non-awaited)

**Source:** [Supabase JS Client](https://github.com/supabase/supabase-js)

**Problème potentiel:**
```typescript
// ❌ Si dans un event handler sans await
const handleClick = () => {
  supabase.from('table').insert({ ... }); // Promise not handled
};
```

**Solution:**
```typescript
// ✅ Await + error handling
const handleClick = async () => {
  const { data, error } = await supabase.from('table').insert({ ... });
  if (error) {
    console.error('Insertion failed:', error.message);
    return;
  }
  // Continue...
};
```

---

## Stratégie de Correction (3 Étapes)

### Étape 1: Corrections React Query (HAUTE PRIORITÉ)
- **Cible:** ~200 warnings dans hooks (use-linkme-*.ts, use-site-internet-*.ts)
- **Pattern:** Marquer callbacks `onSuccess`/`onSettled` comme `async` + `await invalidateQueries`
- **Risk:** FAIBLE (pattern documenté officiellement)
- **Estimation:** 1-2 batches

### Étape 2: Event Handlers Components (~150 warnings)
- **Cible:** onClick, onSubmit, onChange dans composants UI
- **Pattern:** Analyser cas par cas (void vs handler explicite)
- **Risk:** MOYEN (dépend du contexte UX)
- **Estimation:** 3-4 batches

### Étape 3: API Routes & Server Actions (~100 warnings)
- **Cible:** src/app/api/*, src/app/actions/*
- **Pattern:** Assurer await sur toutes les operations DB
- **Risk:** ÉLEVÉ (peut casser fonctionnalités)
- **Estimation:** 2-3 batches avec tests manuels

---

## Fichiers Prioritaires Identifiés

**Hooks LinkMe (nombreux warnings):**
1. `use-linkme-catalog.ts` - 15+ warnings invalidateQueries
2. `use-linkme-users.ts` - ~10 warnings
3. `use-linkme-orders.ts` - ~8 warnings
4. `use-linkme-enseignes.ts` - ~7 warnings
5. `use-linkme-selections.ts` - ~6 warnings

**Hooks Site Internet:**
6. `use-site-internet-products.ts` - ~5 warnings
7. `use-site-internet-categories.ts` - ~4 warnings

**Components avec event handlers:**
- À identifier lors de l'Étape 2

**API Routes:**
- À identifier lors de l'Étape 3

---

## Validation Requise

Après chaque batch:
```bash
pnpm type-check   # DOIT passer
pnpm build        # DOIT passer
pnpm lint 2>&1 | grep -E "(no-floating-promises|no-misused-promises)" | wc -l
```

**Tests manuels recommandés:**
- Mutations LinkMe (ajout produit, création order)
- Mutations Site Internet (publish/unpublish product)
- Event handlers modifiés (submit forms)

---

## Prochain Step: Batch 14 - React Query Invalidations

**Fichiers cibles:**
1. `use-linkme-catalog.ts` (15 warnings)
2. `use-linkme-users.ts` (10 warnings)
3. `use-linkme-orders.ts` (8 warnings)

**Pattern de correction:**
```typescript
// Trouver: onSuccess: (...) => {
//   queryClient.invalidateQueries(...)
// }

// Remplacer: onSuccess: async (...) => {
//   await queryClient.invalidateQueries(...)
// }
```

**Commit message:**
```
[NO-TASK] fix: await React Query invalidateQueries in mutations (Batch 14 - 33 warnings)
```

---

**Analyse complète - Prêt pour corrections**
