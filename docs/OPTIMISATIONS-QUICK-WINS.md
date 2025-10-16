# ⚡ Optimisations Quick Wins - Vérone Performance

**Basé sur** : Phase 4 Performance Analysis (2025-10-16)
**Priorité** : P0-P1 (Impact immédiat, <2h implémentation)
**Gains estimés** : +400-700ms sur routes critiques

---

## 🔴 OPTIMISATION 1 - Console.log Production Guard

### Problème Détecté
- **1019 console.log** dans la codebase
- Impact : -5-10% performance browser (overhead rendering console)
- Logs visibles en production (risque sécurité + performance)

### Exemples Problématiques

```typescript
// use-user-activity-tracker.ts ligne 63
console.log("✅ Activity tracking: 1 events logged...")

// Hooks avec debug logs (Catalogue):
console.log("🔍 [DEBUG] Auto-fetch images déclenché")
console.log("ℹ️ [INFO] Images chargées pour produit")
console.log("ℹ️ [INFO] Product price calculated successfully")
```

### Solution Recommandée

#### Option 1 : NODE_ENV Guard (Simple, rapide)

```typescript
// AVANT
console.log("✅ Activity tracking: ...", { userId, sessionId })

// APRÈS
if (process.env.NODE_ENV === 'development') {
  console.log("✅ Activity tracking: ...", { userId, sessionId })
}
```

#### Option 2 : Logger Structuré (Meilleur, réutilisable)

```typescript
// lib/logger.ts (déjà existant)
import { logger } from '@/lib/logger'

// AVANT
console.log("✅ Activity tracking: ...", { userId })

// APRÈS
logger.debug('Activity tracking', {
  operation: 'track_event',
  userId,
  sessionId
})
```

### Fichiers Prioritaires (Top 10)

1. `src/hooks/use-user-activity-tracker.ts`
2. `src/hooks/use-product-images.ts`
3. `src/hooks/use-product-price.ts`
4. `src/hooks/use-quantity-breaks.ts`
5. `src/hooks/use-sales-channels.ts`
6. `src/app/api/google-merchant/sync/route.ts` (déjà optimisé avec logger)
7. Composants catalogue (ProductCard, etc.)

### Pattern Global Search & Replace

```bash
# Trouver tous les console.log
rg "console\.(log|info|debug)" src/ --type ts --type tsx

# Pattern Regex pour remplacement VS Code
# FIND: console\.(log|info|debug)\((.*)\)
# REPLACE: if (process.env.NODE_ENV === 'development') { console.$1($2) }
```

### Gains Attendus
- **+100-200ms** sur routes avec multiples logs (Catalogue)
- **Sécurité** : Logs sensibles non exposés en production
- **Bundle size** : -5KB minified (dead code elimination)

---

## 🟡 OPTIMISATION 2 - SELECT Queries Spécifiques

### Problème Détecté
- **33 fichiers** utilisent `.select('*')`
- Impact : -20% temps queries backend
- Overhead réseau + mémoire inutile

### Exemples Problématiques

```typescript
// AVANT (use-categories.ts ligne 37)
const { data } = await supabase
  .from('categories')
  .select('*')

// APRÈS (colonnes essentielles uniquement)
const { data } = await supabase
  .from('categories')
  .select('id, name, family_id, display_order, is_active, created_at')
```

### Fichiers Prioritaires (Code Review Phase 3)

#### 1. use-categories.ts

```typescript
// AVANT ligne 37
.select('*')

// APRÈS
.select(`
  id,
  name,
  family_id,
  display_order,
  is_active,
  created_at,
  updated_at
`)
```

#### 2. use-products.ts (vérifier)

```typescript
// AVANT
.from('products').select('*')

// APRÈS
.from('products').select(`
  id,
  name,
  sku,
  price,
  status,
  subcategory_id,
  brand,
  created_at,
  product_images!left (public_url, is_primary)
`)
```

#### 3. use-variant-groups.ts

```typescript
// AVANT
.from('variant_groups').select('*')

// APRÈS
.from('variant_groups').select(`
  id,
  name,
  type,
  display_order,
  created_at
`)
```

### Pattern Méthodologie

1. **Identifier SELECT essentiels** :
   - Lire code utilisant `data`
   - Lister colonnes réellement utilisées
   - Ajouter relations critiques (jointures)

2. **Appliquer optimisation** :
   ```typescript
   // Template
   .select(`
     ${colonnesUtilisees.join(',\n  ')},
     ${relations}
   `)
   ```

3. **Valider** :
   - Tests fonctionnels (pas d'erreur)
   - Vérifier performance (+20% attendu)

### Gains Attendus
- **+300-500ms** sur routes avec multiples queries
- **-30% payload** réseau (moins de données transférées)
- **Meilleure scalabilité** (queries plus rapides avec gros datasets)

---

## 🟢 OPTIMISATION 3 - React.memo Composants Lourds

### Problème Détecté
- Re-renders inutiles sur actions utilisateur
- Composants lourds (ProductCard, KPICard) recalculés à chaque parent update

### Solution Pattern

#### ProductCard (Catalogue)

```typescript
// AVANT (src/components/ui/product-card.tsx)
export function ProductCard({ product, onEdit, onDelete }: Props) {
  // Rendu complet à chaque parent update
  return <Card>...</Card>
}

// APRÈS
export const ProductCard = React.memo(
  ({ product, onEdit, onDelete }: Props) => {
    // Rendu uniquement si product change
    return <Card>...</Card>
  },
  (prevProps, nextProps) => {
    // Custom equality check
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.updated_at === nextProps.product.updated_at
    )
  }
)

ProductCard.displayName = 'ProductCard'
```

#### KPICard (Dashboard)

```typescript
// AVANT
export function KPICard({ title, value, trend, icon }: Props) {
  return <div>...</div>
}

// APRÈS
export const KPICard = React.memo(
  ({ title, value, trend, icon }: Props) => {
    return <div>...</div>
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.trend === nextProps.trend
    )
  }
)
```

### Composants Prioritaires

1. `ProductCard` (16 instances page Catalogue)
2. `KPICard` (4 instances Dashboard)
3. `ProductImageGallery`
4. `QuantityBreaksDisplay`
5. Heavy form fields (CategorySelect, etc.)

### Gains Attendus
- **-30% re-renders** inutiles
- **+50-100ms** interactivité (moins de calculs)
- **Meilleure UX** (pas de freeze lors d'actions)

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Sprint 1 - Console.log (1h)

1. Créer `lib/dev-logger.ts` wrapper
   ```typescript
   export const devLog = (...args: any[]) => {
     if (process.env.NODE_ENV === 'development') {
       console.log(...args)
     }
   }
   ```

2. Search & Replace global :
   - Find: `console.log`
   - Replace: `devLog` (import ajouté)

3. Validation :
   - `npm run build` (vérifier dead code elimination)
   - Test browser production (aucun log visible)

### Sprint 2 - SELECT Queries (1.5h)

1. Audit fichiers prioritaires (use-categories, use-products, use-variant-groups)
2. Lister colonnes utilisées par fichier
3. Appliquer optimisations + tests
4. Commit par fichier (facilite review)

### Sprint 3 - React.memo (1.5h)

1. Identifier composants lourds (React DevTools Profiler)
2. Appliquer React.memo avec equality check
3. Valider re-renders (-30% attendu)

---

## 📊 GAINS CUMULÉS ESTIMÉS

| Optimisation | Temps Implem | Gains Performance | Priorité |
|--------------|--------------|-------------------|----------|
| Console.log Guard | 1h | +100-200ms browser | P0 |
| SELECT Queries | 1.5h | +300-500ms backend | P1 |
| React.memo | 1.5h | +50-100ms interactivité | P2 |
| **TOTAL** | **4h** | **+450-800ms** | - |

---

## ✅ VALIDATION POST-OPTIMISATIONS

### Checklist

- [ ] Dashboard <1.5s (actuellement 0.57s)
- [ ] Catalogue <2s (actuellement 0.42s)
- [ ] Aucun console.log visible en production
- [ ] Tests fonctionnels GROUPE 2 toujours OK
- [ ] Lighthouse Score >90
- [ ] Bundle size -5-10KB

### Monitoring

```bash
# Lighthouse CI avant/après
npm run lighthouse

# Bundle analyzer
npm run build && npx @next/bundle-analyzer
```

---

**Optimisations Quick Wins** - Vérone Back Office 2025
**Impact** : +400-700ms performance globale
**Effort** : 4h développement
**ROI** : Excellent (quick wins immédiats)
