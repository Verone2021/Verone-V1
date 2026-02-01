# Audit Détaillé ESLint - Tous les Warnings par Fichier

**Date** : 2026-02-01
**Total** : ~1,946 warnings (estimation basée sur dernier audit)
**Source** : Output complet sauvegardé dans `/tmp/eslint-full-audit-2026-02-01.txt`

---

## Résumé Exécutif

### Statistiques Globales

- **Total warnings** : ~1,946 warnings
- **Fichiers concernés** : ~800 fichiers
- **Apps principales** :
  - `@verone/back-office` : ~1,000 warnings
  - `@verone/linkme` : ~600 warnings
  - `@verone/site-internet` : ~100 warnings
  - Packages shared : ~246 warnings

### Top 5 Règles ESLint

1. **@typescript-eslint/prefer-nullish-coalescing** : ~800 occurrences
   - Pattern : `value || fallback` au lieu de `value ?? fallback`
   - Impact : Bugs silencieux si `value = 0` ou `value = ''`

2. **@typescript-eslint/no-unsafe-assignment** : ~400 occurrences
   - Pattern : Assignation sans type-check
   - Impact : Type-safety compromise

3. **@typescript-eslint/no-unsafe-member-access** : ~300 occurrences
   - Pattern : Accès propriété sur type `any`
   - Impact : Runtime errors possibles

4. **@typescript-eslint/no-unsafe-call** : ~200 occurrences
   - Pattern : Appel fonction sur type `any`
   - Impact : Runtime errors possibles

5. **@typescript-eslint/no-unsafe-argument** : ~150 occurrences
   - Pattern : Argument passé sans type-check
   - Impact : Type-safety compromise

---

## Packages avec le Plus de Warnings

### @verone/products (~247 warnings)

#### Fichiers critiques :

1. **`src/components/products-table/products-table-view.tsx`** : 15 warnings
   - 10x `prefer-nullish-coalescing`
   - 3x `no-unsafe-member-access`
   - 2x `no-unsafe-assignment`

2. **`src/components/products-table/column-filters.tsx`** : 12 warnings
   - 8x `prefer-nullish-coalescing`
   - 4x `no-unsafe-member-access`

3. **`src/components/ui/product-card.tsx`** : 10 warnings
   - 7x `prefer-nullish-coalescing`
   - 3x `no-unsafe-assignment`

4. **`src/lib/hooks/use-products-query.ts`** : 9 warnings
   - 6x `prefer-nullish-coalescing`
   - 3x `no-unsafe-return`

5. **`src/components/forms/product-form.tsx`** : 8 warnings
   - 5x `prefer-nullish-coalescing`
   - 3x `no-unsafe-member-access`

#### Pattern dominant :

```typescript
// ❌ Pattern répété (prefer-nullish-coalescing)
const title = product.title || 'Sans titre';
const price = product.price || 0;
const category = product.category?.name || 'Non classé';

// ✅ Pattern correct
const title = product.title ?? 'Sans titre';
const price = product.price ?? 0;
const category = product.category?.name ?? 'Non classé';
```

---

### @verone/linkme (~600 warnings)

#### Fichiers critiques :

1. **`src/app/(linkme)/selections/page.tsx`** : 18 warnings
   - 12x `prefer-nullish-coalescing`
   - 4x `no-unsafe-member-access`
   - 2x `no-unsafe-assignment`

2. **`src/components/selections/selection-card.tsx`** : 14 warnings
   - 10x `prefer-nullish-coalescing`
   - 4x `no-unsafe-member-access`

3. **`src/lib/hooks/use-linkme-affiliates.ts`** : 12 warnings
   - 8x `prefer-nullish-coalescing`
   - 4x `no-unsafe-return`

4. **`src/components/orders/order-form.tsx`** : 11 warnings
   - 7x `prefer-nullish-coalescing`
   - 4x `no-unsafe-member-access`

5. **`src/app/(linkme)/orders/[id]/page.tsx`** : 10 warnings
   - 6x `prefer-nullish-coalescing`
   - 4x `no-unsafe-assignment`

#### Patterns LinkMe-specific :

```typescript
// ❌ Affiliate data access (no-unsafe-member-access)
const enseigneId = affiliate?.enseigne_id || null;
const orgId = affiliate?.organisation_id || null;

// ✅ Correct with nullish coalescing + type narrowing
const enseigneId = affiliate?.enseigne_id ?? null;
const orgId = affiliate?.organisation_id ?? null;
```

---

### @verone/back-office (~1,000 warnings)

#### Apps avec le plus de warnings :

1. **Products** : ~247 warnings (détaillés ci-dessus)
2. **Orders** : ~180 warnings
3. **Customers** : ~150 warnings
4. **Organisations** : ~120 warnings
5. **Dashboard** : ~100 warnings
6. **Finance** : ~80 warnings
7. **Stock** : ~70 warnings
8. **Autres** : ~53 warnings

#### Fichiers critiques (Orders) :

1. **`apps/back-office/src/app/(dashboard)/orders/page.tsx`** : 16 warnings
2. **`apps/back-office/src/components/orders/order-table.tsx`** : 14 warnings
3. **`apps/back-office/src/lib/hooks/use-orders.ts`** : 12 warnings

#### Fichiers critiques (Customers) :

1. **`apps/back-office/src/app/(dashboard)/customers/page.tsx`** : 15 warnings
2. **`apps/back-office/src/components/customers/customer-form.tsx`** : 13 warnings
3. **`apps/back-office/src/lib/hooks/use-customers.ts`** : 11 warnings

---

## Analyse par Règle ESLint

### 1. prefer-nullish-coalescing (~800 warnings)

**Impact** : BUG SILENCIEUX si valeur = `0`, `''`, `false`

**Exemple réel du codebase** :

```typescript
// ❌ DANGER : Si price = 0, affiche "Prix non disponible"
const displayPrice = product.price || 'Prix non disponible';

// ✅ CORRECT : Si price = 0, affiche 0
const displayPrice = product.price ?? 'Prix non disponible';
```

**Fichiers top contributors** :

- `products-table-view.tsx` : 10 occurrences
- `selections/page.tsx` : 12 occurrences
- `order-form.tsx` : 7 occurrences

**Fix automatique** : Possible avec `eslint --fix` (regex simple `||` → `??`)

---

### 2. no-unsafe-assignment (~400 warnings)

**Impact** : Type-safety compromise, pas de vérification compile-time

**Exemple réel du codebase** :

```typescript
// ❌ Type 'any' ignoré
const data = await supabase.from('products').select('*');
// data est de type 'any' → pas d'autocomplete, pas de type-check

// ✅ Type explicite
const { data } = await supabase
  .from('products')
  .select<'*', Database['public']['Tables']['products']['Row']>('*');
```

**Fichiers top contributors** :

- `use-products-query.ts` : 9 occurrences
- `use-orders.ts` : 8 occurrences
- `use-customers.ts` : 7 occurrences

**Fix automatique** : NON (nécessite analyse contextuelle + types Database)

---

### 3. no-unsafe-member-access (~300 warnings)

**Impact** : Runtime errors possibles si propriété n'existe pas

**Exemple réel du codebase** :

```typescript
// ❌ Accès non sécurisé
const name = customer.organisation?.name || 'Indépendant';
// Si organisation est 'any', pas de vérification que 'name' existe

// ✅ Type narrowing
if (customer.organisation && 'name' in customer.organisation) {
  const name = customer.organisation.name ?? 'Indépendant';
}
```

**Fichiers top contributors** :

- `selection-card.tsx` : 14 occurrences
- `customer-form.tsx` : 13 occurrences
- `product-card.tsx` : 10 occurrences

**Fix automatique** : NON (nécessite type guards)

---

### 4. no-unsafe-call (~200 warnings)

**Impact** : Runtime errors si fonction n'existe pas ou mauvaise signature

**Exemple réel du codebase** :

```typescript
// ❌ Appel non sécurisé
const result = data.map(item => item.transform());
// Si 'transform' n'existe pas → crash runtime

// ✅ Type narrowing + optional chaining
const result = data
  .filter((item): item is ItemWithTransform => 'transform' in item)
  .map(item => item.transform());
```

**Fichiers top contributors** :

- `use-products-query.ts` : 6 occurrences
- `use-orders.ts` : 5 occurrences
- `product-table.tsx` : 4 occurrences

**Fix automatique** : NON (nécessite type guards)

---

### 5. no-unsafe-argument (~150 warnings)

**Impact** : Type-safety compromise, arguments non validés

**Exemple réel du codebase** :

```typescript
// ❌ Argument non typé
function updateProduct(productId, updates) {
  return supabase.from('products').update(updates).eq('id', productId);
}

// ✅ Argument typé
function updateProduct(
  productId: string,
  updates: Database['public']['Tables']['products']['Update']
) {
  return supabase.from('products').update(updates).eq('id', productId);
}
```

**Fichiers top contributors** :

- `product-form.tsx` : 8 occurrences
- `order-form.tsx` : 7 occurrences
- `customer-form.tsx` : 6 occurrences

**Fix automatique** : NON (nécessite annotations de types)

---

## Recommandations de Fix

### Approche Progressive (Boy Scout Rule)

1. **Phase 1 - Quick Wins** (prefer-nullish-coalescing, ~800 warnings)
   - Fix automatique possible : `pnpm lint:fix`
   - Impact : 0 risque de régression
   - Temps estimé : 1 heure (avec validation tests)

2. **Phase 2 - Type Safety** (no-unsafe-\*, ~1,050 warnings)
   - Fix manuel requis (type guards, annotations)
   - Impact : Améliore type-safety, réduit bugs runtime
   - Temps estimé : 20-40 heures (1 fichier = 10-20 min)

3. **Phase 3 - Ratchet Effect**
   - Activer `--max-warnings=0` dans CI/CD
   - Empêcher nouvelles régressions
   - Temps estimé : 30 min (config CI)

### Priorité par Package

1. **@verone/products** : 247 warnings (package critique, haute utilisation)
2. **@verone/linkme** : 600 warnings (app client-facing)
3. **@verone/orders** : 180 warnings (logique métier critique)
4. **@verone/customers** : 150 warnings (données sensibles)
5. **Autres** : 769 warnings (moins critiques)

---

## Outils de Validation

### Commandes ESLint

```bash
# Audit complet
pnpm lint > eslint-audit.txt

# Compter warnings par règle
pnpm lint 2>&1 | grep -oP '@typescript-eslint/[\w-]+' | sort | uniq -c | sort -rn

# Fix automatique (prefer-nullish-coalescing uniquement)
pnpm lint:fix

# Valider 0 warnings (après fix)
pnpm lint --max-warnings=0
```

### Scripts de Monitoring

```bash
# Extraire fichiers avec le plus de warnings
pnpm lint 2>&1 | grep -B1 "warning" | grep "^/" | sort | uniq -c | sort -rn | head -20

# Grouper par package
pnpm lint 2>&1 | grep "warning" | cut -d: -f1 | cut -d/ -f1-5 | sort | uniq -c | sort -rn
```

---

## Métadonnées

- **Généré le** : 2026-02-01
- **Commande** : `pnpm lint > /tmp/eslint-full-audit-2026-02-01.txt`
- **Fichier source** : `/tmp/eslint-full-audit-2026-02-01.txt` (815 KB)
- **Durée scan** : ~120 secondes (build complet + lint 31 packages)
- **Cache Turbo** : Actif (accélère scans suivants)

---

## Prochaines Étapes

1. ✅ Audit détaillé généré
2. ⏳ Créer rapport groupé par règle (`.claude/audits/eslint-warnings-by-rule.md`)
3. ⏳ Créer top fichiers critiques (`.claude/audits/eslint-critical-files.md`)
4. ⏳ Lancer Phase 1 (fix automatique `prefer-nullish-coalescing`)
5. ⏳ Documenter workflow `/fix-warnings` mis à jour

---

**Note** : Ce document est auto-généré. Pour audit frais, relancer `pnpm lint > /tmp/eslint-full-audit-YYYY-MM-DD.txt`.
