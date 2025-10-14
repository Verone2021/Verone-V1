# ⚡ ACTIONS PRIORITAIRES - DEBUGGING VÉRONE

**Date**: 2025-10-09
**Status**: AUDIT COMPLET TERMINÉ

---

## 🚨 TOP 5 ACTIONS CRITIQUES

### 1. CONSOLE ERROR CHECK MANUEL (P0 - BLOQUANT)
**Durée**: 1-2 heures
**Raison**: Politique Zero Tolerance non applicable sans inspection console

#### Actions Immédiates
```bash
# 1. Ouvrir application locale
http://localhost:3003

# 2. Ouvrir DevTools Console (F12)
# 3. Naviguer pages critiques:
- /dashboard
- /catalogue
- /catalogue/[productId]
- /stocks
- /stocks/mouvements
- /commandes/clients
- /finance/rapprochement

# 4. Noter CHAQUE erreur console:
- Message exact
- Stack trace
- Page concernée
- Steps reproduction
```

#### Livrables
- Screenshot chaque erreur
- Liste complète erreurs console
- Prioritisation par impact utilisateur

---

### 2. APPLIQUER MIGRATIONS PRICING (P0 - BLOQUANT)
**Durée**: 30 minutes
**Raison**: Système pricing incomplet (4 migrations non commitées)

#### Actions
```bash
# 1. Vérifier migrations en attente
git status supabase/migrations/

# 2. Appliquer migrations
supabase db push

# 3. Vérifier RLS policies
supabase db execute "SELECT * FROM pg_policies WHERE tablename LIKE '%price%'"

# 4. Tester calculs prix
# Via API: /api/pricing/calculate
# Via UI: Page produit détails
```

#### Validation
- [ ] Migrations appliquées sans erreurs
- [ ] RLS policies actives
- [ ] Calculs prix corrects (tests manuels)
- [ ] Pas d'erreurs console sur pages pricing

---

### 3. FIXER REACT HOOKS DEPENDENCIES (P1 - HAUTE)
**Durée**: 4-6 heures
**Raison**: 90 warnings = risques états stale + re-renders excessifs

#### Fichiers Prioritaires (Top 10)
```typescript
// Catalogue (impact business critique)
1. src/app/catalogue/page.tsx
2. src/app/catalogue/collections/page.tsx
3. src/app/catalogue/[productId]/page.tsx
4. src/app/catalogue/stocks/page.tsx

// Business Components (haute fréquence utilisation)
5. src/components/business/customer-selector.tsx
6. src/components/business/collection-products-modal.tsx
7. src/components/business/consultation-suggestions.tsx
8. src/components/business/category-selector.tsx

// Finance (données critiques)
9. src/app/finance/depenses/[id]/page.tsx
10. src/app/finance/factures-fournisseurs/[id]/page.tsx
```

#### Pattern Fix Standard
```typescript
// ❌ AVANT (Warning)
useEffect(() => {
  loadData();
}, []); // Missing dependency: loadData

// ✅ APRÈS (Fix)
const loadData = useCallback(async () => {
  // logic
}, [/* dependencies */]);

useEffect(() => {
  loadData();
}, [loadData]);
```

#### Validation
- [ ] ESLint clean (0 warnings sur fichiers fixés)
- [ ] Pas de re-renders excessifs (React DevTools)
- [ ] États synchronisés correctement
- [ ] Pas de memory leaks (Chrome Memory Profiler)

---

### 4. NETTOYER CONSOLE.LOG PRODUCTION (P1 - HAUTE)
**Durée**: 3-4 heures
**Raison**: 244 fichiers avec console.log = pollution + risques sécurité

#### Stratégie
1. **Créer Logger Centralisé**
   ```typescript
   // lib/logger.ts
   export const logger = {
     debug: (msg: string, context?: any) => {
       if (process.env.NODE_ENV === 'development') {
         console.log(`[VÉRONE:DEBUG] ${msg}`, context);
       }
     },
     error: (msg: string, error: any) => {
       console.error(`[VÉRONE:ERROR] ${msg}`, error);
       // Sentry integration
       if (process.env.NODE_ENV === 'production') {
         Sentry.captureException(error, { extra: { message: msg } });
       }
     },
     warn: (msg: string, context?: any) => {
       console.warn(`[VÉRONE:WARN] ${msg}`, context);
     }
   };
   ```

2. **Remplacer console.log par logger.debug**
   ```bash
   # Identifier tous les console.log
   grep -r "console.log" src/ > /tmp/console-log-list.txt

   # Remplacer manuellement ou script:
   # - Hooks critiques (use-catalogue, use-stock, etc.)
   # - API routes (webhooks, cron jobs)
   # - Business components (formulaires)
   ```

3. **Build Production & Vérifier**
   ```bash
   npm run build
   # Console devrait être vide en production
   ```

#### Validation
- [ ] Logger centralisé créé et testé
- [ ] Hooks critiques migrés (20 fichiers prioritaires)
- [ ] API routes migrés (10 routes critiques)
- [ ] Build production = console vide
- [ ] Sentry logs actifs en production

---

### 5. OPTIMISER IMAGES (P2 - MOYENNE)
**Durée**: 2-3 heures
**Raison**: 36 warnings = performance LCP dégradée

#### Actions
```typescript
// 1. Migration next/image
// AVANT: <img src={url} alt={alt} />
// APRÈS:
import Image from 'next/image'
<Image
  src={url}
  alt={alt}
  width={300}
  height={300}
  loading="lazy"
  placeholder="blur"
/>

// 2. Configuration Next.js
// next.config.js
images: {
  domains: ['supabase.co', 'your-cdn.com'],
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200],
}
```

#### Fichiers Prioritaires
```
Catalogue (haute visibilité):
- src/app/catalogue/categories/page.tsx (3 images)
- src/app/catalogue/collections/page.tsx (1 image)
- src/app/catalogue/variantes/page.tsx (1 image)
- src/app/catalogue/page.tsx (1 image)
- src/app/catalogue/stocks/page.tsx (1 image)

Components:
- src/components/business/collection-products-modal.tsx (2 images)
```

#### Validation
- [ ] Migration next/image complète
- [ ] Lighthouse audit: LCP < 2.5s
- [ ] Images lazy loaded
- [ ] Formats WebP/AVIF servis

---

## 📊 RÉSUMÉ PRIORITÉS

| Action | Priorité | Durée | Impact Business | Bloquant? |
|--------|----------|-------|-----------------|-----------|
| Console Error Check | P0 | 1-2h | CRITIQUE | ✅ OUI |
| Migrations Pricing | P0 | 30min | CRITIQUE | ✅ OUI |
| React Hooks Fixes | P1 | 4-6h | HAUTE | ❌ NON |
| Console.log Cleanup | P1 | 3-4h | HAUTE | ❌ NON |
| Images Optimisation | P2 | 2-3h | MOYENNE | ❌ NON |

**TOTAL ESTIMÉ**: 11-16 heures

---

## 🎯 ORDRE EXÉCUTION RECOMMANDÉ

### Sprint 1 (Bloquants - 1 jour)
```
1. ✅ Console Error Check Manuel (1-2h)
   └─ Inspection navigateur DevTools

2. ✅ Migrations Pricing (30min)
   └─ supabase db push + validation

3. ✅ Fixer Top 5 Hooks (2h)
   └─ Catalogue pages uniquement
```

### Sprint 2 (Haute Priorité - 2 jours)
```
4. ✅ Fixer Reste Hooks (4h)
   └─ Business components + Finance

5. ✅ Logger Centralisé (3-4h)
   └─ Créer logger + migrer 50 fichiers prioritaires
```

### Sprint 3 (Optimisations - 1 jour)
```
6. ✅ Images Optimisation (2-3h)
   └─ Migration next/image catalogue

7. ✅ Validation Complète (2h)
   └─ Tests E2E + Lighthouse + Console check final
```

---

## 🔍 CRITÈRES SUCCÈS

### Console Errors
- [ ] **ZÉRO erreur console** sur toutes pages principales
- [ ] Screenshots validation sur 10+ pages clés
- [ ] Documentation erreurs résolues

### Code Quality
- [ ] ESLint warnings < 50 (vs 129 actuellement)
- [ ] Tous hooks dependencies correctes (0 warnings exhaustive-deps)
- [ ] Console.log production = 0

### Performance
- [ ] Lighthouse Score > 90 (Desktop)
- [ ] LCP < 2.5s sur catalogue
- [ ] Images all lazy loaded

### Database
- [ ] Migrations pricing appliquées
- [ ] RLS policies validées
- [ ] Calculs prix corrects

---

## 📋 CHECKLIST FINALE

### Avant Déploiement
- [ ] Audit console errors complet (ZÉRO toléré)
- [ ] Build production SUCCESS sans warnings
- [ ] Tests E2E passent (si disponibles)
- [ ] Lighthouse audit > 90
- [ ] Sentry logs propres (pas de flood)
- [ ] Migrations Supabase synchronisées
- [ ] RLS policies testées
- [ ] Documentation bugs résolus updated

### Monitoring Post-Déploiement
- [ ] Sentry dashboard configuré
- [ ] Alertes erreurs critiques actives
- [ ] Performance metrics tracking (Vercel Analytics)
- [ ] Console error tracking via Sentry

---

**Document généré par**: Vérone Debugger
**Basé sur**: AUDIT-DEBUGGING-COMPLET.md
**Prochaine action**: Console Error Check Manuel (PRIORITÉ P0)
