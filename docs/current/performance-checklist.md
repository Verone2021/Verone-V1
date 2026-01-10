# Checklist Performance - Quick Reference

> Référence rapide pour les développeurs. Documentation complète: `/reports/audits/2026-01-10_performance-governance.md`

---

## Avant toute PR

```bash
# 1. Build
npm run build
# Attendre: "Build succeeded"

# 2. Type-check
npm run type-check
# Attendre: "0 errors"

# 3. Console check (manuel)
# Ouvrir page modifiée → F12 → Console vide

# 4. Network check (manuel)
# F12 → Network → Recharger → < 20 requests
```

---

## Budgets Pages Critiques

| Page                  | Load Time | Network Calls | Stop-the-Line      |
| --------------------- | --------- | ------------- | ------------------ |
| `/dashboard`          | < 3000ms  | < 15          | > 6000ms = BLOQUER |
| `/stocks/alertes`     | < 3000ms  | < 20          | > 6000ms = BLOQUER |
| `/produits/catalogue` | < 3500ms  | < 25          | > 7000ms = BLOQUER |

**Stop-the-Line = Console errors OU Page load > 2x budget**

---

## Commandes Utiles

```bash
# Tests E2E performance
npm run test:e2e:performance

# Check console errors (CI)
npm run check:console:ci

# Audit bundle size
npm run build | grep "First Load JS"

# Vérifier ports dev
npm run ports:check

# Attendre serveurs prêts
npm run dev:wait
```

---

## Red Flags

**Bloquer PR si:**

- Console errors > 0
- Page load > 2x budget
- N+1 queries (même requête >3x)
- Memory leak détecté
- Build failed ou type errors

**Warn (ne pas bloquer) si:**

- Warnings tiers (Supabase, Next.js)
- Bundle size +10% mais < 500KB
- Page load légèrement au-dessus budget

---

## Quick Fixes

```typescript
// 1. Lazy load composant lourd
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
});

// 2. Memoize calculs coûteux
const expensiveValue = useMemo(() => {
  return computeExpensive(data);
}, [data]);

// 3. Debounce search
const debouncedSearch = useDebouncedValue(searchTerm, 300);
```

```sql
-- 4. Ajouter index si query lente
CREATE INDEX CONCURRENTLY idx_table_column
  ON table_name(column_name);
```

---

_Référence complète: /reports/audits/2026-01-10_performance-governance.md_
