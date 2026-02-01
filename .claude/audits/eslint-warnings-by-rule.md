# Audit ESLint - Warnings Groupés par Règle

**Date** : 2026-02-01
**Total** : ~1,946 warnings
**Source** : Analyse output ESLint complet

---

## Vue d'Ensemble

| Règle                       | Count | %   | Sévérité  | Fix Auto | Impact                               |
| --------------------------- | ----- | --- | --------- | -------- | ------------------------------------ |
| `prefer-nullish-coalescing` | ~800  | 41% | 🟡 Medium | ✅ Oui   | Bugs silencieux (`0`, `''`, `false`) |
| `no-unsafe-assignment`      | ~400  | 21% | 🟠 High   | ❌ Non   | Type-safety compromise               |
| `no-unsafe-member-access`   | ~300  | 15% | 🟠 High   | ❌ Non   | Runtime errors possibles             |
| `no-unsafe-call`            | ~200  | 10% | 🟠 High   | ❌ Non   | Runtime errors possibles             |
| `no-unsafe-argument`        | ~150  | 8%  | 🟡 Medium | ❌ Non   | Type-safety compromise               |
| `no-explicit-any`           | ~50   | 3%  | 🟡 Medium | ❌ Non   | Type-safety compromise               |
| `no-unsafe-return`          | ~30   | 2%  | 🟡 Medium | ❌ Non   | Type-safety compromise               |
| Autres                      | ~16   | <1% | 🟢 Low    | Varié    | Varié                                |

---

## 1. @typescript-eslint/prefer-nullish-coalescing

**Count** : ~800 warnings (41% du total)
**Sévérité** : 🟡 Medium (mais HIGH impact en production)
**Fix automatique** : ✅ Oui (`pnpm lint:fix`)

### Description

Utilisation de `||` au lieu de `??` pour fallback values.

### Problème

```typescript
// ❌ BUG : Si price = 0, retourne "Non disponible"
const display = product.price || 'Non disponible';

// ❌ BUG : Si name = '', retourne "Anonyme"
const userName = user.name || 'Anonyme';

// ❌ BUG : Si isActive = false, retourne true
const status = config.isActive || true;
```

### Solution

```typescript
// ✅ CORRECT : Si price = 0, retourne 0
const display = product.price ?? 'Non disponible';

// ✅ CORRECT : Si name = '', retourne ''
const userName = user.name ?? 'Anonyme';

// ✅ CORRECT : Si isActive = false, retourne false
const status = config.isActive ?? true;
```

### Impact Production

**Bugs réels possibles** :

- Prix gratuits (0€) affichés comme "Non disponible"
- Quantités nulles ignorées dans calculs
- Flags `false` traités comme `true`

### Packages Affectés

| Package                 | Count | Top Files                                                           |
| ----------------------- | ----- | ------------------------------------------------------------------- |
| `@verone/products`      | ~150  | `products-table-view.tsx`, `product-card.tsx`, `column-filters.tsx` |
| `@verone/linkme`        | ~180  | `selections/page.tsx`, `selection-card.tsx`, `order-form.tsx`       |
| `@verone/orders`        | ~120  | `order-table.tsx`, `order-form.tsx`, `use-orders.ts`                |
| `@verone/customers`     | ~100  | `customer-form.tsx`, `customer-table.tsx`                           |
| `@verone/organisations` | ~80   | `organisation-form.tsx`, `use-organisations.ts`                     |
| Autres                  | ~170  | Divers                                                              |

### Plan de Fix

**Phase 1** : Fix automatique (30 min)

```bash
# 1. Backup (au cas où)
git checkout -b fix/eslint-prefer-nullish-coalescing

# 2. Fix automatique
pnpm lint:fix

# 3. Vérifier changements
git diff

# 4. Tester
pnpm --filter @verone/back-office type-check
pnpm --filter @verone/linkme type-check
pnpm --filter @verone/products type-check

# 5. Commit si OK
git add .
git commit -m "[NO-TASK] fix: replace || with ?? (800 warnings fixed)"
git push
```

**Risque** : TRÈS FAIBLE (transformation mécanique `||` → `??`)

**Validation** :

- Type-check DOIT passer (0 erreurs)
- Build DOIT passer
- Tests E2E recommandés (smoke tests)

---

## 2. @typescript-eslint/no-unsafe-assignment

**Count** : ~400 warnings (21% du total)
**Sévérité** : 🟠 High
**Fix automatique** : ❌ Non (annotations de types requises)

### Description

Assignation de valeur de type `any` à une variable sans type explicite.

### Problème

```typescript
// ❌ 'data' est de type 'any' → pas d'autocomplete, pas de type-check
const data = await supabase.from('products').select('*');
const firstProduct = data[0]; // Type 'any'
console.log(firstProduct.unknownField); // Pas d'erreur compile-time

// ❌ Assignation depuis JSON parse
const config = JSON.parse(jsonString); // Type 'any'
```

### Solution

```typescript
// ✅ Type explicite avec generics Supabase
const { data } = await supabase
  .from('products')
  .select<'*', Database['public']['Tables']['products']['Row']>('*');

const firstProduct = data[0]; // Type 'ProductRow'
console.log(firstProduct.title); // Autocomplete + type-check

// ✅ Validation avec Zod
const configSchema = z.object({ theme: z.string(), port: z.number() });
const config = configSchema.parse(JSON.parse(jsonString));
```

### Impact Production

**Risques** :

- Runtime errors si propriété n'existe pas
- Pas d'autocomplete (DX dégradée)
- Refactoring difficile (pas de "Find All References")

### Packages Affectés

| Package             | Count | Top Files                                        |
| ------------------- | ----- | ------------------------------------------------ |
| `@verone/products`  | ~80   | `use-products-query.ts`, `product-form.tsx`      |
| `@verone/linkme`    | ~90   | `use-linkme-affiliates.ts`, `selection-card.tsx` |
| `@verone/orders`    | ~70   | `use-orders.ts`, `order-form.tsx`                |
| `@verone/customers` | ~60   | `use-customers.ts`, `customer-form.tsx`          |
| Autres              | ~100  | Divers                                           |

### Plan de Fix

**Phase 2** : Fix manuel (20-40 heures)

**Approche** :

1. Identifier toutes les queries Supabase sans types
2. Ajouter types générés (`Database['public']['Tables'][...]`)
3. Valider avec `pnpm type-check`
4. Boy Scout Rule : 1 fichier complet à la fois

**Template** :

```typescript
// Avant
const { data } = await supabase.from('products').select('*');

// Après
import type { Database } from '@verone/types/supabase';

type ProductRow = Database['public']['Tables']['products']['Row'];

const { data } = await supabase.from('products').select<'*', ProductRow>('*');
```

**Risque** : MEDIUM (nécessite compréhension types Supabase)

---

## 3. @typescript-eslint/no-unsafe-member-access

**Count** : ~300 warnings (15% du total)
**Sévérité** : 🟠 High
**Fix automatique** : ❌ Non (type guards requis)

### Description

Accès à une propriété sur un objet de type `any`.

### Problème

```typescript
// ❌ 'customer' est 'any' → pas de vérification que 'organisation' existe
const orgName = customer.organisation?.name || 'Indépendant';

// ❌ Accès nested sur 'any'
const primaryImage = product.images?.[0]?.url || '/placeholder.png';
```

### Solution

```typescript
// ✅ Type guard
if (customer && 'organisation' in customer && customer.organisation) {
  const orgName = customer.organisation.name ?? 'Indépendant';
}

// ✅ Type explicite
type Customer = {
  id: string;
  name: string;
  organisation?: { name: string };
};

const customer: Customer = await getCustomer();
const orgName = customer.organisation?.name ?? 'Indépendant';
```

### Impact Production

**Risques** :

- Runtime errors si structure change
- Bugs silencieux si propriété renommée
- Maintenance difficile (pas de type-check)

### Packages Affectés

| Package                 | Count | Top Files                                       |
| ----------------------- | ----- | ----------------------------------------------- |
| `@verone/linkme`        | ~90   | `selection-card.tsx`, `affiliate-card.tsx`      |
| `@verone/products`      | ~60   | `product-card.tsx`, `product-table.tsx`         |
| `@verone/customers`     | ~50   | `customer-form.tsx`, `customer-table.tsx`       |
| `@verone/organisations` | ~40   | `organisation-form.tsx`, `use-organisations.ts` |
| Autres                  | ~60   | Divers                                          |

### Plan de Fix

**Phase 2** : Fix manuel (15-30 heures)

**Approche** :

1. Identifier tous les accès `?.` ou `?.[` sur objets non typés
2. Ajouter types explicites ou type guards
3. Valider avec `pnpm type-check`

**Template** :

```typescript
// Avant
const orgName = customer.organisation?.name || 'Indépendant';

// Après (Option 1 : Type explicite)
type Customer = Database['public']['Tables']['customers']['Row'] & {
  organisation?: { name: string };
};
const orgName = (customer as Customer).organisation?.name ?? 'Indépendant';

// Après (Option 2 : Type guard)
function hasOrganisation(c: unknown): c is { organisation: { name: string } } {
  return typeof c === 'object' && c !== null && 'organisation' in c;
}
const orgName = hasOrganisation(customer)
  ? customer.organisation.name
  : 'Indépendant';
```

**Risque** : MEDIUM (nécessite type guards ou annotations)

---

## 4. @typescript-eslint/no-unsafe-call

**Count** : ~200 warnings (10% du total)
**Sévérité** : 🟠 High
**Fix automatique** : ❌ Non (type guards requis)

### Description

Appel de fonction sur un objet de type `any`.

### Problème

```typescript
// ❌ 'transform' n'est peut-être pas une fonction
const result = data.map(item => item.transform());

// ❌ Méthode sur objet 'any'
await cache.invalidate();
```

### Solution

```typescript
// ✅ Type guard
const result = data
  .filter(
    (item): item is ItemWithTransform =>
      typeof item === 'object' &&
      item !== null &&
      'transform' in item &&
      typeof item.transform === 'function'
  )
  .map(item => item.transform());

// ✅ Type explicite
type Cache = { invalidate: () => Promise<void> };
const cache: Cache = getCache();
await cache.invalidate();
```

### Impact Production

**Risques** :

- Runtime errors si fonction n'existe pas
- Crash application si mauvaise signature

### Packages Affectés

| Package            | Count | Top Files                                        |
| ------------------ | ----- | ------------------------------------------------ |
| `@verone/products` | ~50   | `use-products-query.ts`, `product-utils.ts`      |
| `@verone/linkme`   | ~60   | `use-linkme-affiliates.ts`, `selection-utils.ts` |
| `@verone/orders`   | ~40   | `use-orders.ts`, `order-utils.ts`                |
| Autres             | ~50   | Divers                                           |

### Plan de Fix

**Phase 2** : Fix manuel (10-20 heures)

**Approche** :

1. Identifier tous les appels `.method()` sur objets non typés
2. Ajouter type guards pour vérifier existence fonction
3. Valider avec `pnpm type-check`

**Risque** : MEDIUM

---

## 5. @typescript-eslint/no-unsafe-argument

**Count** : ~150 warnings (8% du total)
**Sévérité** : 🟡 Medium
**Fix automatique** : ❌ Non (annotations de types requises)

### Description

Argument passé à une fonction sans type explicite.

### Problème

```typescript
// ❌ 'updates' est 'any'
function updateProduct(productId, updates) {
  return supabase.from('products').update(updates).eq('id', productId);
}

// ❌ Callback avec param 'any'
items.forEach(item => processItem(item));
```

### Solution

```typescript
// ✅ Types explicites
type ProductUpdate = Database['public']['Tables']['products']['Update'];

function updateProduct(productId: string, updates: ProductUpdate) {
  return supabase.from('products').update(updates).eq('id', productId);
}

// ✅ Type param callback
type Item = { id: string; name: string };
items.forEach((item: Item) => processItem(item));
```

### Impact Production

**Risques** :

- Type-safety compromise
- Pas de validation arguments
- Bugs runtime si mauvais type passé

### Packages Affectés

| Package            | Count | Top Files                              |
| ------------------ | ----- | -------------------------------------- |
| `@verone/products` | ~40   | `product-form.tsx`, `product-utils.ts` |
| `@verone/linkme`   | ~35   | `selection-form.tsx`, `order-form.tsx` |
| `@verone/orders`   | ~30   | `order-form.tsx`, `order-utils.ts`     |
| Autres             | ~45   | Divers                                 |

### Plan de Fix

**Phase 2** : Fix manuel (8-15 heures)

**Approche** :

1. Identifier toutes les fonctions avec params non typés
2. Ajouter annotations de types explicites
3. Valider avec `pnpm type-check`

**Risque** : LOW

---

## Règles Mineures (< 100 warnings)

### @typescript-eslint/no-explicit-any (~50 warnings)

**Impact** : Type-safety compromise
**Fix** : Remplacer `any` par types précis ou `unknown`
**Temps estimé** : 3-5 heures

### @typescript-eslint/no-unsafe-return (~30 warnings)

**Impact** : Type-safety compromise (return values)
**Fix** : Ajouter type de retour explicite
**Temps estimé** : 2-3 heures

### Autres règles (~16 warnings)

- `@typescript-eslint/no-non-null-assertion`
- `@typescript-eslint/no-unnecessary-type-assertion`
- `@typescript-eslint/restrict-template-expressions`

**Temps estimé total** : 1-2 heures

---

## Roadmap de Fix

### Quick Wins (Phase 1)

**Durée** : 1-2 heures
**Impact** : 800 warnings (41%)
**Risque** : TRÈS FAIBLE

1. ✅ Fix automatique `prefer-nullish-coalescing`

   ```bash
   pnpm lint:fix
   pnpm type-check  # Valider 0 erreurs
   pnpm build       # Valider build OK
   ```

2. ✅ Commit & Push
   ```bash
   git add .
   git commit -m "[NO-TASK] fix: replace || with ?? (800 warnings)"
   git push
   ```

### Type Safety (Phase 2)

**Durée** : 40-80 heures (répartis sur plusieurs semaines)
**Impact** : 1,146 warnings (59%)
**Risque** : MEDIUM

**Approche progressive** :

1. Fixer 1 package complet à la fois (Boy Scout Rule)
2. Priorité : packages critiques (`@verone/products`, `@verone/linkme`)
3. Valider chaque fix avec `pnpm type-check`
4. Commits fréquents (1 fichier = 1 commit)

**Ordre recommandé** :

1. `@verone/products` (~247 warnings) - 12-20 heures
2. `@verone/linkme` (~600 warnings) - 30-40 heures
3. `@verone/orders` (~180 warnings) - 9-12 heures
4. Autres packages - 10-15 heures

### Ratchet Effect (Phase 3)

**Durée** : 30 min
**Impact** : Empêche nouvelles régressions

1. ✅ Activer `--max-warnings=0` dans CI/CD
2. ✅ Pre-commit hook bloque si nouvelles warnings
3. ✅ Documentation workflow `/fix-warnings` mis à jour

---

## Outils & Commandes

### Monitoring

```bash
# Compter warnings par règle
pnpm lint 2>&1 | grep -oP '@typescript-eslint/[\w-]+' | sort | uniq -c | sort -rn

# Top fichiers problématiques
pnpm lint 2>&1 | grep -B1 "warning" | grep "^/" | sort | uniq -c | sort -rn | head -20

# Compter warnings par package
pnpm lint 2>&1 | grep "warning" | cut -d: -f1 | cut -d/ -f1-5 | sort | uniq -c | sort -rn
```

### Fix Automatique

```bash
# Fix prefer-nullish-coalescing uniquement
pnpm lint:fix

# Valider 0 nouvelles warnings
pnpm lint --max-warnings=0
```

---

## Métadonnées

- **Généré le** : 2026-02-01
- **Source** : Analyse output ESLint complet (`/tmp/eslint-full-audit-2026-02-01.txt`)
- **Total warnings** : ~1,946
- **Règles analysées** : 8 principales + mineures
- **Packages analysés** : 31

---

## Prochaines Étapes

1. ✅ Rapport par règle généré
2. ⏳ Créer top fichiers critiques (`.claude/audits/eslint-critical-files.md`)
3. ⏳ Lancer Phase 1 (fix automatique `prefer-nullish-coalescing`)
4. ⏳ Planifier Phase 2 (fix manuel type-safety)
5. ⏳ Documenter workflow `/fix-warnings` mis à jour
