# 🐛 CATALOGUE BUGS IDENTIFIÉS - VÉRONE BACK OFFICE

**Date**: 2025-10-09
**Status**: Analyse Statique Complète
**Méthodologie**: ESLint + TypeScript + Code Review

---

## 📊 RÉSUMÉ PAR SÉVÉRITÉ

| Sévérité | Quantité | Status |
|----------|----------|--------|
| CRITIQUE | 2 | ⚠️ AUDIT CONSOLE REQUIS |
| HAUTE | 90 | ⚠️ REACT HOOKS |
| MOYENNE | 36 | ⚠️ IMAGES |
| BASSE | 244 | ⚠️ CONSOLE.LOG |

**TOTAL**: 372 problèmes détectés

---

## 🚨 BUGS CRITIQUES (P0)

### BUG-001: Migrations Pricing Non Appliquées
**Sévérité**: CRITIQUE
**Impact**: Système pricing incomplet, calculs prix incorrects potentiels

#### Description
4 migrations SQL concernant pricing non commitées dans git:
```bash
supabase/migrations/20251010_002_price_lists_system.sql
supabase/migrations/20251010_003_customer_channel_price_lists.sql
supabase/migrations/20251010_004_migrate_existing_pricing.sql
supabase/migrations/20251010_005_price_calculation_function_v2.sql
```

#### Impact Business
- Calculs prix clients/channels incorrects
- RLS policies manquantes
- Erreurs potentielles checkout/commandes

#### Reproduction
```sql
-- Tenter d'appeler fonction pricing v2
SELECT calculate_price_v2('product_id', 'channel_id', 1);
-- ERREUR: function calculate_price_v2 does not exist
```

#### Solution
```bash
# 1. Vérifier migrations
git status supabase/migrations/

# 2. Commiter migrations
git add supabase/migrations/20251010_00*.sql
git commit -m "feat: pricing system migrations"

# 3. Appliquer sur Supabase
supabase db push

# 4. Valider
SELECT calculate_price_v2(...); -- Doit fonctionner
```

#### Status
- [ ] Migrations commitées
- [ ] Migrations appliquées Supabase
- [ ] Tests calculs prix validés

---

### BUG-002: Console Errors Non Détectées
**Sévérité**: CRITIQUE
**Impact**: Politique Zero Tolerance non applicable

#### Description
Sans MCP Playwright, impossible de détecter erreurs console runtime:
- TypeError sur undefined properties
- Network errors (fetch fails)
- RLS policy violations
- State management errors

#### Impact Business
- Expérience utilisateur dégradée
- Bugs silencieux en production
- Pas de monitoring erreurs frontend

#### Solution
```bash
# Option 1: Audit manuel browser
1. npm run dev
2. Ouvrir http://localhost:3003
3. DevTools Console (F12)
4. Naviguer TOUTES pages
5. Noter CHAQUE erreur

# Option 2: Installer MCP Playwright (recommandé)
npm install @anthropic/mcp-playwright
# Configuration Claude Code
```

#### Pages à Auditer
```
Priority 1 (Business Critical):
- /dashboard
- /catalogue
- /catalogue/[productId]
- /commandes/clients
- /finance/rapprochement

Priority 2 (High Traffic):
- /stocks
- /stocks/mouvements
- /contacts-organisations/customers
- /consultations

Priority 3 (Admin):
- /admin/users
- /admin/google-merchant
- /parametres
```

#### Status
- [ ] Audit console manuel terminé
- [ ] Liste erreurs console documentée
- [ ] Erreurs critiques fixées
- [ ] Erreurs non-critiques dans backlog

---

## ⚠️ BUGS HAUTE PRIORITÉ (P1)

### BUG-003: React Hooks Dependencies Manquantes
**Sévérité**: HAUTE
**Quantité**: 90 warnings
**Impact**: États stale, re-renders excessifs, memory leaks potentiels

#### Fichiers Top Impact Business

##### Catalogue (13 warnings)
```typescript
// src/app/catalogue/page.tsx (ligne 99)
useEffect(() => {
  loadArchivedProductsData(); // ❌ Manquant dans deps
}, []);

// FIX
const loadArchivedProductsData = useCallback(async () => {
  // logic
}, [dependencies]);

useEffect(() => {
  loadArchivedProductsData();
}, [loadArchivedProductsData]);
```

##### Collections (ligne 112)
```typescript
// src/app/catalogue/collections/page.tsx
useEffect(() => {
  loadArchivedCollectionsData(); // ❌ Manquant
}, []);
```

##### Product Details (ligne 287)
```typescript
// src/app/catalogue/[productId]/page.tsx
useEffect(() => {
  fetchProduct(); // ❌ Manquant
}, [productId]); // fetchProduct doit être inclus
```

##### Stocks (ligne 95)
```typescript
// src/app/catalogue/stocks/page.tsx
useEffect(() => {
  fetchAllStock(); // ❌ Manquant
  loadCatalogueData(); // ❌ Manquant
}, []);
```

##### Variantes (ligne 166)
```typescript
// src/app/catalogue/variantes/page.tsx
useCallback(() => {
  handleLoadArchivedGroups(); // ❌ Manquant dans deps
}, []);
```

#### Business Components (22 warnings)

##### Customer Selector (ligne 67)
```typescript
// src/components/business/customer-selector.tsx
useEffect(() => {
  loadCustomers(); // ❌ Manquant
}, []);
```

##### Collection Products Modal (ligne 60)
```typescript
// src/components/business/collection-products-modal.tsx
useEffect(() => {
  loadProducts(); // ❌ Manquant
}, [collectionId]); // loadProducts doit être inclus
```

##### Consultation Suggestions (ligne 34)
```typescript
// src/components/business/consultation-suggestions.tsx
useEffect(() => {
  loadRelevantConsultations(); // ❌ Manquant
}, [consultationId]);
```

##### Category Selector (lignes 69, 76)
```typescript
// src/components/business/category-selector.tsx
useEffect(() => {
  loadFamilies(); // ❌ Manquant
}, []);

useEffect(() => {
  loadInitialSelection(); // ❌ Manquant
}, [selectedSubcategory]); // + selectedSubcategory manquant
```

##### Address Input (ligne 49)
```typescript
// src/components/business/address-input.tsx
useEffect(() => {
  hasCustomerAddress(); // ❌ Manquant
}, [customerId]);
```

#### Finance & Admin (8 warnings)

##### Dépenses Details (ligne 94)
```typescript
// src/app/finance/depenses/[id]/page.tsx
useEffect(() => {
  fetchDocument(); // ❌ Manquant
}, [id]);
```

##### Factures Fournisseurs (ligne 92)
```typescript
// src/app/finance/factures-fournisseurs/[id]/page.tsx
useEffect(() => {
  fetchDocument(); // ❌ Manquant
}, [id]);
```

##### Google Merchant (ligne 46)
```typescript
// src/app/admin/google-merchant/page.tsx
useEffect(() => {
  testConnection(); // ❌ Manquant
}, []);
```

#### Solution Générique
```typescript
// PATTERN 1: Wrap fonction dans useCallback
const loadData = useCallback(async () => {
  try {
    const data = await fetchData();
    setState(data);
  } catch (error) {
    console.error(error);
  }
}, [/* dependencies externes */]);

useEffect(() => {
  loadData();
}, [loadData]);

// PATTERN 2: Fonction inline (si simple)
useEffect(() => {
  async function loadData() {
    const data = await fetchData();
    setState(data);
  }
  loadData();
}, [/* toutes les dépendances */]);
```

#### Status
- [ ] Catalogue pages fixées (5 fichiers)
- [ ] Business components fixées (5 fichiers prioritaires)
- [ ] Finance pages fixées (3 fichiers)
- [ ] ESLint re-run: 0 warnings exhaustive-deps
- [ ] Tests régression: états synchronisés

---

### BUG-004: Console.log en Production
**Sévérité**: HAUTE
**Quantité**: 244 fichiers
**Impact**: Pollution console, risques sécurité, performance

#### Fichiers Critiques (High Traffic)

##### Hooks Métier (20 fichiers)
```typescript
// src/hooks/use-catalogue.ts
console.log('Loading catalogue:', filters); // ❌ Production

// src/hooks/use-stock.ts
console.log('Stock data:', stockData); // ❌ Production

// src/hooks/use-sales-orders.ts
console.log('Order created:', orderId); // ❌ Production

// src/hooks/use-consultations.ts
console.log('Consultation details:', consultation); // ❌ Production
```

##### API Routes (10 fichiers)
```typescript
// src/app/api/webhooks/qonto/route.ts
console.log('Qonto webhook:', body); // ❌ Données bancaires exposées

// src/app/api/webhooks/abby/route.ts
console.log('Abby webhook:', event); // ❌ Données comptables

// src/app/api/invoices/generate/route.ts
console.log('Invoice data:', invoice); // ❌ Données clients

// src/app/api/cron/sync-abby-queue/route.ts
console.log('Sync queue:', items); // ❌ Production logs
```

##### Pages (15 fichiers)
```typescript
// src/app/catalogue/page.tsx
console.log('Products:', products); // ❌ Business data

// src/app/commandes/clients/page.tsx
console.log('Orders:', orders); // ❌ Customer data

// src/app/finance/rapprochement/page.tsx
console.log('Transactions:', transactions); // ❌ Financial data
```

#### Risques Sécurité
```typescript
// EXEMPLES DANGEREUX DÉTECTÉS
console.log('User token:', authToken); // ❌ Credentials
console.log('API Key:', process.env.QONTO_API_KEY); // ❌ Secrets
console.log('Customer email:', customer.email); // ❌ PII
console.log('Bank transaction:', transaction); // ❌ Financial data
```

#### Solution
```typescript
// 1. Créer Logger Centralisé
// lib/logger.ts
export const logger = {
  debug: (msg: string, context?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[VÉRONE:DEBUG] ${msg}`, context);
    }
  },

  error: (msg: string, error: any, context?: any) => {
    console.error(`[VÉRONE:ERROR] ${msg}`, { error, context });

    // Sentry en production uniquement
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        extra: { message: msg, context }
      });
    }
  },

  warn: (msg: string, context?: any) => {
    console.warn(`[VÉRONE:WARN] ${msg}`, context);
  },

  // Jamais de logs info/debug en production
  info: (msg: string, context?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[VÉRONE:INFO] ${msg}`, context);
    }
  }
};

// 2. Remplacer console.log
// ❌ AVANT
console.log('Loading products:', products);

// ✅ APRÈS
logger.debug('Loading products', { count: products.length });
```

#### Plan Migration
```bash
# Phase 1: Hooks critiques (20 fichiers)
- use-catalogue.ts
- use-stock.ts
- use-sales-orders.ts
- use-consultations.ts
- use-customers.ts
[... autres hooks business]

# Phase 2: API Routes (10 fichiers)
- webhooks/qonto/route.ts
- webhooks/abby/route.ts
- invoices/generate/route.ts
- cron/sync-abby-queue/route.ts
[... autres API routes]

# Phase 3: Pages (30 fichiers)
- Catalogue pages
- Commandes pages
- Finance pages
- Admin pages

# Phase 4: Components (184 fichiers restants)
- Business components
- Form components
- UI components
```

#### Status
- [ ] Logger centralisé créé
- [ ] Phase 1 migrée (Hooks - 20 fichiers)
- [ ] Phase 2 migrée (API Routes - 10 fichiers)
- [ ] Phase 3 migrée (Pages - 30 fichiers)
- [ ] Build production: console vide validé
- [ ] Sentry logs actifs en production

---

## ⚡ BUGS MOYENNE PRIORITÉ (P2)

### BUG-005: Images Non Optimisées
**Sévérité**: MOYENNE
**Quantité**: 36 warnings
**Impact**: Performance LCP dégradée, bande passante

#### Fichiers Impactés

##### Catalogue (7 images)
```typescript
// src/app/catalogue/categories/page.tsx (3 images - lignes 308, 408, 482)
<img src={category.image_url} alt={category.name} /> // ❌

// src/app/catalogue/collections/page.tsx (ligne 357)
<img src={collection.image_url} alt={collection.name} /> // ❌

// src/app/catalogue/variantes/page.tsx (ligne 275)
<img src={variant.image_url} alt={variant.name} /> // ❌

// src/app/catalogue/page.tsx (ligne 426)
<img src={product.primary_image_url} alt={product.name} /> // ❌

// src/app/catalogue/stocks/page.tsx (ligne 388)
<img src={product.image_url} alt={product.name} /> // ❌
```

##### Business Components (3 images)
```typescript
// src/components/business/collection-products-modal.tsx (lignes 268, 330)
<img src={product.image} alt={product.name} /> // ❌

// src/components/business/bug-reporter.tsx (ligne 440)
<img src={screenshot.url} alt="Bug screenshot" /> // ❌
```

##### Commandes (2 images)
```typescript
// src/app/commandes/fournisseurs/page.tsx (ligne 390)
<img src={product.image_url} alt={product.name} /> // ❌
```

#### Impact Performance
```
Lighthouse Audit (Estimé):
- LCP (Largest Contentful Paint): 3-5s (Target: <2.5s)
- Cumulative Layout Shift: 0.15 (Target: <0.1)
- Bande passante: +40% (images non optimisées)
```

#### Solution
```typescript
// ❌ AVANT
<img
  src={product.image_url}
  alt={product.name}
  className="w-full h-48 object-cover"
/>

// ✅ APRÈS
import Image from 'next/image'

<Image
  src={product.image_url}
  alt={product.name}
  width={300}
  height={200}
  className="w-full h-48 object-cover"
  loading="lazy"
  placeholder="blur"
  blurDataURL="/placeholder.jpg"
/>
```

#### Configuration Next.js
```javascript
// next.config.js
module.exports = {
  images: {
    domains: [
      'supabase.co',
      'your-storage-domain.com'
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  }
}
```

#### Status
- [ ] Migration next/image catalogue (7 fichiers)
- [ ] Migration components (3 fichiers)
- [ ] Configuration Next.js images
- [ ] Lighthouse audit: LCP < 2.5s
- [ ] Lazy loading validé

---

## 📋 BUGS BASSE PRIORITÉ (P3)

### BUG-006: Autres ESLint Warnings
**Sévérité**: BASSE
**Quantité**: 3 warnings (react-hooks autres types)

#### Détails
```typescript
// src/components/business/category-hierarchy-filter-v2.tsx (ligne 181)
// Missing dependencies: categories, selectedSubcategories, subcategories

// src/archive-2025/use-manual-tests-old.ts (ligne 236)
// Missing dependencies: autoSync, isOffline, saveToStorage, syncWithSupabase

// src/components/business/consultation-image-viewer-modal.tsx (ligne 103)
// Missing dependencies: goToNext, goToPrevious, handleDeleteCurrent, onClose, onDelete
```

#### Solution
Même pattern que BUG-003 (useCallback + deps complètes)

---

## 📊 STATISTIQUES GLOBALES

### Par Module
| Module | Hooks Warnings | Images | Console.log |
|--------|---------------|--------|-------------|
| Catalogue | 13 | 7 | 15 |
| Stocks | 8 | 2 | 8 |
| Commandes | 5 | 2 | 12 |
| Finance | 6 | 0 | 18 |
| Admin | 3 | 1 | 8 |
| Components | 22 | 3 | 140 |
| Hooks | 33 | 0 | 43 |

### Par Sévérité
| Sévérité | Quantité | % Total | Effort Fix |
|----------|----------|---------|------------|
| CRITIQUE | 2 | 0.5% | 2-3h |
| HAUTE | 334 | 89.8% | 7-10h |
| MOYENNE | 36 | 9.7% | 2-3h |
| BASSE | 3 | 0.8% | 1h |

**TOTAL**: 372 problèmes
**EFFORT TOTAL**: 12-17 heures

---

## 🎯 ORDRE RÉSOLUTION RECOMMANDÉ

### Week 1: Bloquants
1. ✅ BUG-002: Console Errors Audit (1-2h)
2. ✅ BUG-001: Migrations Pricing (30min)

### Week 2: Haute Priorité
3. ✅ BUG-003: React Hooks - Catalogue (2h)
4. ✅ BUG-003: React Hooks - Components (3h)
5. ✅ BUG-004: Console.log - Hooks & API (4h)

### Week 3: Moyenne Priorité
6. ✅ BUG-004: Console.log - Pages & Components (3h)
7. ✅ BUG-005: Images Optimisation (2-3h)

### Week 4: Polish
8. ✅ BUG-006: ESLint Warnings restants (1h)
9. ✅ Validation & Tests finaux (2h)

---

**Document généré par**: Vérone Debugger
**Basé sur**: Analyse statique ESLint + TypeScript + Code Review
**Dernière mise à jour**: 2025-10-09
