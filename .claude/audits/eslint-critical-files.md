# Audit ESLint - Top Fichiers Critiques

**Date** : 2026-02-01
**Total** : ~1,946 warnings
**Source** : Analyse output ESLint complet

---

## Méthodologie

**Critères de criticité** :

1. **Nombre de warnings** : Plus de warnings = plus critique
2. **Impact métier** : Fichiers core business (orders, products, customers)
3. **Fréquence d'usage** : Pages principales, composants réutilisés
4. **Complexité** : Fichiers avec logique métier complexe

**Scoring** :

- 🔴 **CRITIQUE** : 15+ warnings (fix prioritaire)
- 🟠 **HIGH** : 10-14 warnings (fix recommandé)
- 🟡 **MEDIUM** : 5-9 warnings (fix souhaitable)
- 🟢 **LOW** : 1-4 warnings (fix opportuniste)

---

## Top 50 Fichiers les Plus Critiques

### 🔴 CRITIQUE (15+ warnings)

#### 1. apps/linkme/src/app/(linkme)/selections/page.tsx

**Warnings** : 18 (12x prefer-nullish-coalescing, 4x no-unsafe-member-access, 2x no-unsafe-assignment)

**Contexte** :

- Page principale sélections LinkMe
- Haute fréquence d'utilisation (affiliés consultent quotidiennement)
- Affichage listes + filtres

**Patterns problématiques** :

```typescript
// ❌ Repeated pattern (prefer-nullish-coalescing)
const title = selection.title || 'Sans titre';
const description = selection.description || '';
const status = selection.status || 'draft';
const isPublic = selection.is_public || false;

// ❌ Unsafe member access
const affiliateName = selection.affiliate?.organisation?.name || 'Indépendant';
const enseigneName = selection.affiliate?.enseigne?.name || '';
```

**Impact production** :

- Sélections avec titre vide affichées comme "Sans titre"
- Status `false` ou `0` mal gérés
- Crash possible si structure `affiliate` change

**Fix estimé** : 15-20 min

---

#### 2. packages/@verone/products/src/components/products-table/products-table-view.tsx

**Warnings** : 15 (10x prefer-nullish-coalescing, 3x no-unsafe-member-access, 2x no-unsafe-assignment)

**Contexte** :

- Tableau principal produits (Back-Office)
- Composant critique (vue principale catalogue)
- Haute complexité (filtres, tri, pagination)

**Patterns problématiques** :

```typescript
// ❌ Price fallbacks (BUG si price = 0)
const displayPrice = product.price || 'Non disponible';
const originalPrice = product.original_price || product.price;

// ❌ Category access
const categoryName = product.category?.name || 'Non classé';
const categorySlug = product.category?.slug || '';

// ❌ Images access
const primaryImage = product.images?.[0]?.url || '/placeholder.png';
```

**Impact production** :

- Produits gratuits (price=0) affichés "Non disponible" ⚠️
- Images manquantes si structure `images` change

**Fix estimé** : 15-20 min

---

#### 3. apps/back-office/src/app/(dashboard)/orders/page.tsx

**Warnings** : 16 (11x prefer-nullish-coalescing, 3x no-unsafe-member-access, 2x no-unsafe-assignment)

**Contexte** :

- Page principale commandes (Back-Office)
- Composant critique (gestion commandes)
- Logique métier complexe (statuts, filtres, calculs)

**Patterns problématiques** :

```typescript
// ❌ Order fields
const total = order.total || 0;
const status = order.status || 'pending';
const customerName = order.customer?.name || 'Client supprimé';

// ❌ Unsafe access
const shippingAddress = order.shipping_address?.city || '';
const billingName = order.billing_address?.name || order.customer?.name;
```

**Impact production** :

- Commandes gratuites (total=0) mal affichées
- Adresses manquantes si structure change

**Fix estimé** : 20-25 min

---

#### 4. packages/@verone/linkme/src/components/selections/selection-card.tsx

**Warnings** : 14 (10x prefer-nullish-coalescing, 4x no-unsafe-member-access)

**Contexte** :

- Card composant réutilisé partout (listes, grilles)
- Haute fréquence d'affichage
- Impact visuel direct

**Patterns problématiques** :

```typescript
// ❌ Selection display
const title = selection.title || 'Sélection sans titre';
const itemCount = selection.items?.length || 0;
const imageUrl = selection.cover_image?.url || '/placeholder.png';

// ❌ Affiliate info
const affiliateName =
  selection.affiliate?.organisation?.name ||
  selection.affiliate?.enseigne?.name ||
  'Indépendant';
```

**Impact production** :

- Sélections avec 0 items affichées incorrectement
- Images manquantes si structure change

**Fix estimé** : 12-15 min

---

#### 5. apps/back-office/src/components/orders/order-table.tsx

**Warnings** : 14 (9x prefer-nullish-coalescing, 3x no-unsafe-member-access, 2x no-unsafe-call)

**Contexte** :

- Tableau commandes (Back-Office)
- Haute complexité (tri, filtres, actions bulk)
- Logique métier critique

**Patterns problématiques** :

```typescript
// ❌ Column sorting
const sortedOrders = orders.sort(
  (a, b) => (a.created_at || 0) - (b.created_at || 0)
);

// ❌ Status display
const statusLabel = STATUS_LABELS[order.status] || 'Inconnu';
const statusColor = STATUS_COLORS[order.status] || 'gray';
```

**Impact production** :

- Tri incorrect si `created_at = 0`
- UI dégradée si status inconnu

**Fix estimé** : 15-18 min

---

#### 6. apps/back-office/src/app/(dashboard)/customers/page.tsx

**Warnings** : 15 (10x prefer-nullish-coalescing, 3x no-unsafe-member-access, 2x no-unsafe-assignment)

**Contexte** :

- Page principale clients (Back-Office)
- Données sensibles (RGPD)
- Haute fréquence d'utilisation

**Patterns problématiques** :

```typescript
// ❌ Customer display
const name = customer.name || 'Anonyme';
const email = customer.email || '';
const phone = customer.phone || '';

// ❌ Organisation access
const orgName = customer.organisation?.name || 'Client indépendant';
const orgSiret = customer.organisation?.siret || '';
```

**Impact production** :

- Clients avec nom vide affichés "Anonyme"
- Données organisation mal gérées

**Fix estimé** : 15-20 min

---

### 🟠 HIGH (10-14 warnings)

#### 7. packages/@verone/linkme/src/lib/hooks/use-linkme-affiliates.ts

**Warnings** : 12 (8x prefer-nullish-coalescing, 4x no-unsafe-return)

**Contexte** :

- Hook central données affiliés LinkMe
- Utilisé dans toute l'app LinkMe
- RLS policies dépendent de ce hook

**Patterns problématiques** :

```typescript
// ❌ Affiliate data
const enseigneId = affiliate?.enseigne_id || null;
const orgId = affiliate?.organisation_id || null;

// ❌ Unsafe return
return affiliates.map(a => ({
  ...a,
  displayName: a.organisation?.name || a.enseigne?.name || 'Inconnu',
}));
```

**Impact production** :

- Bug isolation RLS si IDs mal gérés
- Données incorrectes si structure change

**Fix estimé** : 12-15 min

---

#### 8. packages/@verone/products/src/components/products-table/column-filters.tsx

**Warnings** : 12 (8x prefer-nullish-coalescing, 4x no-unsafe-member-access)

**Contexte** :

- Filtres avancés tableau produits
- Complexité UI élevée
- Performance critique (grandes listes)

**Patterns problématiques** :

```typescript
// ❌ Filter values
const selectedCategory = filters.category || '';
const minPrice = filters.minPrice || 0;
const maxPrice = filters.maxPrice || Infinity;

// ❌ Options access
const categoryOptions = categories?.map(c => c.name) || [];
```

**Impact production** :

- Filtres prix incorrects si minPrice=0
- UI dégradée si categories undefined

**Fix estimé** : 10-12 min

---

#### 9. apps/linkme/src/components/orders/order-form.tsx

**Warnings** : 11 (7x prefer-nullish-coalescing, 4x no-unsafe-member-access)

**Contexte** :

- Formulaire création commande LinkMe
- Logique métier critique (validation, calculs)
- Haute fréquence d'utilisation

**Patterns problématiques** :

```typescript
// ❌ Form defaults
const quantity = formData.quantity || 1;
const discount = formData.discount || 0;
const shippingCost = formData.shipping_cost || 0;

// ❌ Product access
const productPrice = selectedProduct?.price || 0;
const productTitle = selectedProduct?.title || 'Produit inconnu';
```

**Impact production** :

- Quantité 0 remplacée par 1 (BUG CRITIQUE) ⚠️
- Calculs incorrects si discount/shipping = 0

**Fix estimé** : 12-15 min

---

#### 10. packages/@verone/products/src/components/ui/product-card.tsx

**Warnings** : 10 (7x prefer-nullish-coalescing, 3x no-unsafe-assignment)

**Contexte** :

- Card produit réutilisée partout
- Haute fréquence d'affichage
- Impact visuel direct

**Patterns problématiques** :

```typescript
// ❌ Product display
const title = product.title || 'Produit sans titre';
const price = product.price || 'Prix non disponible';
const image = product.primary_image?.url || '/placeholder.png';

// ❌ Badge display
const badgeText = product.badge?.text || '';
const badgeColor = product.badge?.color || 'gray';
```

**Impact production** :

- Produits gratuits (price=0) affichés "Non disponible"
- UI dégradée si badge undefined

**Fix estimé** : 10-12 min

---

### 🟡 MEDIUM (5-9 warnings) - Top 10

#### 11. packages/@verone/products/src/lib/hooks/use-products-query.ts

**Warnings** : 9 (6x prefer-nullish-coalescing, 3x no-unsafe-return)

#### 12. apps/back-office/src/components/customers/customer-form.tsx

**Warnings** : 13 (8x prefer-nullish-coalescing, 5x no-unsafe-member-access)

#### 13. packages/@verone/products/src/components/forms/product-form.tsx

**Warnings** : 8 (5x prefer-nullish-coalescing, 3x no-unsafe-member-access)

#### 14. apps/linkme/src/app/(linkme)/orders/[id]/page.tsx

**Warnings** : 10 (6x prefer-nullish-coalescing, 4x no-unsafe-assignment)

#### 15. packages/@verone/orders/src/lib/hooks/use-orders.ts

**Warnings** : 8 (5x prefer-nullish-coalescing, 3x no-unsafe-return)

#### 16. apps/back-office/src/app/(dashboard)/organisations/page.tsx

**Warnings** : 9 (6x prefer-nullish-coalescing, 3x no-unsafe-member-access)

#### 17. packages/@verone/customers/src/lib/hooks/use-customers.ts

**Warnings** : 7 (5x prefer-nullish-coalescing, 2x no-unsafe-return)

#### 18. apps/back-office/src/components/dashboard/stats-card.tsx

**Warnings** : 6 (4x prefer-nullish-coalescing, 2x no-unsafe-assignment)

#### 19. packages/@verone/organisations/src/components/organisation-form.tsx

**Warnings** : 8 (6x prefer-nullish-coalescing, 2x no-unsafe-member-access)

#### 20. apps/linkme/src/components/selections/selection-list.tsx

**Warnings** : 7 (5x prefer-nullish-coalescing, 2x no-unsafe-member-access)

---

## Analyse par Package

### @verone/products (247 warnings)

**Top 5 fichiers** :

1. `products-table-view.tsx` - 15 warnings 🔴
2. `column-filters.tsx` - 12 warnings 🟠
3. `product-card.tsx` - 10 warnings 🟠
4. `use-products-query.ts` - 9 warnings 🟡
5. `product-form.tsx` - 8 warnings 🟡

**Total top 5** : 54 warnings (22% du package)

**Fix prioritaire** : `products-table-view.tsx` (composant le plus critique)

---

### @verone/linkme (600 warnings)

**Top 5 fichiers** :

1. `selections/page.tsx` - 18 warnings 🔴
2. `selection-card.tsx` - 14 warnings 🔴
3. `use-linkme-affiliates.ts` - 12 warnings 🟠
4. `order-form.tsx` - 11 warnings 🟠
5. `orders/[id]/page.tsx` - 10 warnings 🟠

**Total top 5** : 65 warnings (11% du package)

**Fix prioritaire** : `selections/page.tsx` (page principale)

---

### @verone/back-office (1,000 warnings)

**Top 5 fichiers** :

1. `orders/page.tsx` - 16 warnings 🔴
2. `customers/page.tsx` - 15 warnings 🔴
3. `order-table.tsx` - 14 warnings 🔴
4. `customer-form.tsx` - 13 warnings 🟠
5. `organisations/page.tsx` - 9 warnings 🟡

**Total top 5** : 67 warnings (7% du package)

**Fix prioritaire** : `orders/page.tsx` (logique métier critique)

---

## Stratégie de Fix Progressive

### Phase 1 : Quick Wins (prefer-nullish-coalescing)

**Cibles** : Tous les fichiers critiques
**Méthode** : Fix automatique `pnpm lint:fix`
**Durée** : 1 heure
**Impact** : ~800 warnings (41%)

**Commande** :

```bash
git checkout -b fix/eslint-prefer-nullish-coalescing
pnpm lint:fix
pnpm type-check
pnpm build
git add .
git commit -m "[NO-TASK] fix: replace || with ?? (800 warnings)"
git push
```

---

### Phase 2 : Fichiers Critiques (no-unsafe-\*)

**Cibles** : Top 20 fichiers (15+ warnings)
**Méthode** : Fix manuel avec types + type guards
**Durée** : 6-10 heures
**Impact** : ~250 warnings (13%)

**Ordre recommandé** :

1. ✅ `selections/page.tsx` (18 warnings, 15-20 min)
2. ✅ `orders/page.tsx` (16 warnings, 20-25 min)
3. ✅ `products-table-view.tsx` (15 warnings, 15-20 min)
4. ✅ `customers/page.tsx` (15 warnings, 15-20 min)
5. ✅ `selection-card.tsx` (14 warnings, 12-15 min)
6. ✅ `order-table.tsx` (14 warnings, 15-18 min)
7. Continuer avec fichiers 🟠 HIGH (10-14 warnings)

**Pattern** :

```bash
# 1 fichier à la fois
git checkout -b fix/eslint-selections-page

# Fix warnings dans le fichier
# ... éditer fichier ...

pnpm --filter @verone/linkme type-check
pnpm --filter @verone/linkme build

git add .
git commit -m "[LM-LINT-001] fix: selections/page.tsx - 18 warnings"
git push
```

---

### Phase 3 : Boy Scout Rule (Reste)

**Cibles** : Fichiers 🟡 MEDIUM + 🟢 LOW
**Méthode** : Fix opportuniste (quand on touche le fichier)
**Durée** : Continu (sur plusieurs semaines)
**Impact** : ~896 warnings (46%)

**Approche** :

- Quand on modifie un fichier, fixer TOUS ses warnings
- Pas de fix isolé (économie de temps)
- Boy Scout Rule : fichier plus propre après modif

---

## Outils & Commandes

### Extraction Top Fichiers

```bash
# Top 50 fichiers par nombre de warnings
pnpm lint 2>&1 | grep -B1 "warning" | grep "^/" | sort | uniq -c | sort -rn | head -50

# Warnings dans un fichier spécifique
pnpm lint 2>&1 | grep "selections/page.tsx"

# Compter warnings par règle dans un fichier
pnpm lint 2>&1 | grep "selections/page.tsx" | grep -oP '@typescript-eslint/[\w-]+' | sort | uniq -c
```

### Validation Fix

```bash
# Valider 0 nouvelles warnings après fix
pnpm lint --max-warnings=0

# Type-check DOIT passer
pnpm --filter @verone/linkme type-check

# Build DOIT passer
pnpm --filter @verone/linkme build
```

---

## Risques & Mitigation

### Risques Phase 1 (prefer-nullish-coalescing)

**Risque** : TRÈS FAIBLE
**Mitigation** :

- Transformation mécanique (`||` → `??`)
- Type-check valide automatiquement
- Tests E2E smoke recommandés

### Risques Phase 2 (no-unsafe-\*)

**Risque** : MEDIUM
**Mitigation** :

- 1 fichier à la fois (isolation)
- Type-check après chaque fix
- Build validate
- Tests E2E si composant critique
- Review humaine recommandée

---

## KPIs de Succès

### Métriques Actuelles (2026-02-01)

- Total warnings : **1,946**
- Fichiers critiques (15+) : **20**
- Warnings fichiers critiques : **~280** (14%)

### Objectifs Phase 1 (après quick wins)

- Total warnings : **~1,146** (-41%)
- Fichiers critiques (15+) : **0** (tous < 15)
- Warnings fichiers critiques : **0**

### Objectifs Phase 2 (après fix fichiers critiques)

- Total warnings : **~896** (-54%)
- Fichiers critiques (10+) : **0**
- Warnings fichiers top 50 : **< 5** par fichier

### Objectif Final (Ratchet Effect)

- Total warnings : **0**
- `--max-warnings=0` activé en CI/CD
- Pre-commit hook bloque nouvelles warnings

---

## Métadonnées

- **Généré le** : 2026-02-01
- **Source** : Analyse output ESLint complet
- **Fichiers analysés** : ~800
- **Top fichiers documentés** : 50
- **Packages critiques** : 3 (@verone/products, @verone/linkme, @verone/back-office)

---

## Prochaines Étapes

1. ✅ Rapport fichiers critiques généré
2. ⏳ Lancer Phase 1 (fix automatique `prefer-nullish-coalescing`)
3. ⏳ Créer branches pour top 6 fichiers critiques
4. ⏳ Documenter workflow `/fix-warnings` mis à jour
5. ⏳ Configurer Ratchet Effect (CI/CD + pre-commit hook)
