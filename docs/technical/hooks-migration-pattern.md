# Pattern Migration Hooks vers Base Architecture

**Date** : 2025-10-29
**Phase** : Refactoring Phase 3 - Réduction Boilerplate
**Status** : ✅ Proof-of-Concept Validé

---

## 🎯 Objectif

Réduire le boilerplate répété dans 60+ hooks tout en **conservant la logique métier spécifique**.

**Problème initial** : Pattern `useState` + `useEffect` + `createClient()` répété dans chaque hook (~40 lignes boilerplate).

**Solution** : Base hooks architecture avec 3 hooks composables :
- `useSupabaseQuery<T>()` - Queries read-only
- `useSupabaseMutation<T>()` - Mutations (create, update, delete)
- `useSupabaseCRUD<T>()` - Combinaison query + mutations

---

## 📊 Proof-of-Concept : use-collection-products.ts

### Résultats Migration

| Métrique | Avant | Après | Δ |
|----------|-------|-------|---|
| **Lignes totales** | 117 | 101 | -16 (-14%) |
| **Boilerplate** | 40 lignes | 8 lignes | -32 lignes (-80%) |
| **Logique métier** | 77 lignes | 77 lignes | 0 (conservée) |
| **Type errors** | 0 | 0 | ✅ |

### Code Avant (117 lignes)

```typescript
export function useCollectionProducts(collectionId: string) {
  const [products, setProducts] = useState<CollectionProductWithMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchCollectionProducts = async () => {
    if (!collectionId) {
      setProducts([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('collection_products')
        .select(`...`)
        .eq('collection_id', collectionId)
        .eq('products.creation_mode', 'complete')
        .order('position', { ascending: true })

      if (fetchError) throw fetchError

      const transformedProducts = (data || [])
        .filter(item => item.products)
        .map(item => ({
          // ... transformation logique métier
        }))

      setProducts(transformedProducts)
    } catch (err) {
      console.error('Error fetching collection products:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollectionProducts()
  }, [collectionId])

  const productIds = products.map(item => item.product_id)

  return { products, productIds, loading, error, refetch: fetchCollectionProducts }
}
```

**❌ Problèmes** :
- 40 lignes boilerplate répétées (useState, useEffect, try/catch)
- Gestion manuelle loading/error states
- `createClient()` appelé manuellement
- Difficile à maintenir à grande échelle (60+ hooks)

### Code Après (101 lignes)

```typescript
export function useCollectionProducts(collectionId: string) {
  // ✅ BASE HOOK : Remplace 40 lignes de boilerplate
  const { data, loading, error, refetch } = useSupabaseQuery<any>({
    tableName: 'collection_products',
    select: `
      id, collection_id, product_id, position,
      products!inner (
        id, name, sku, status, creation_mode, cost_price,
        product_images!left (id, public_url, is_primary, ...)
      )
    `,
    filters: (query) => {
      if (!collectionId) return query.limit(0)
      return query
        .eq('collection_id', collectionId)
        .eq('products.creation_mode', 'complete')
    },
    orderBy: { column: 'position', ascending: true },
    autoFetch: !!collectionId
  })

  // ✅ LOGIQUE MÉTIER CONSERVÉE : Transformation spécifique
  const products = useMemo(() => {
    return (data || [])
      .filter(item => item.products)
      .map(item => ({
        // ... transformation identique (logique métier préservée)
      }))
  }, [data])

  const productIds = useMemo(() => {
    return products.map(item => item.product_id)
  }, [products])

  return { products, productIds, loading, error, refetch }
}
```

**✅ Avantages** :
- -80% boilerplate (40→8 lignes)
- Logique métier 100% conservée
- Code plus lisible et maintenable
- Optimisation avec `useMemo`
- Pattern réutilisable pour 60+ hooks

---

## 🔧 Patterns Migration selon Type de Hook

### Pattern 1 : Query Read-Only (comme use-collection-products)

**Candidats** : Hooks qui ne font QUE fetcher des données sans mutations

**Migration** :
```typescript
// AVANT
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)
const supabase = createClient()

const fetchData = async () => {
  setLoading(true)
  const { data, error } = await supabase.from('table').select('*')
  setData(data)
  setLoading(false)
}

useEffect(() => { fetchData() }, [])

// APRÈS
const { data, loading, error, refetch } = useSupabaseQuery({
  tableName: 'table',
  select: '*',
  autoFetch: true
})

// Logique métier custom conservée
const transformedData = useMemo(() => {
  return (data || []).map(item => ({ /* transformation */ }))
}, [data])
```

**Exemples candidats** :
- `use-collection-products.ts` ✅ MIGRÉ
- `use-stock-alerts.ts` (read-only avec calculs)
- `use-dashboard-analytics.ts` (read-only avec agrégations)

### Pattern 2 : CRUD Complet (avec mutations)

**Candidats** : Hooks avec create, update, delete + refetch

**Migration** :
```typescript
// APRÈS
const { data, loading, error, create, update, delete, refetch } = useSupabaseCRUD({
  tableName: 'table',
  select: '*',
  onSuccess: (data) => {
    toast.success('Opération réussie')
  }
})

// Logique métier conservée (slugs, validation, etc.)
const createWithSlug = async (item) => {
  return create({
    ...item,
    slug: generateSlug(item.name) // Logique métier
  })
}
```

**Exemples candidats** :
- `use-categories.ts` (avec generateSlug)
- `use-families.ts` (avec toggleStatus)
- Hooks simples CRUD sans logique complexe

### Pattern 3 : Hooks Complexes (conserver tel quel ou migration partielle)

**Candidats** : Hooks avec beaucoup de logique métier spécifique

**Stratégie** : NE PAS migrer complètement, ou utiliser base hooks partiellement

**Exemples** :
- `use-contacts.ts` (499 lignes, trop complexe)
- `use-stock-movements.ts` (logique traceability)
- Hooks avec 5+ méthodes custom

---

## 📋 Checklist Migration Hook

Pour chaque hook candidat :

- [ ] **Analyser type** : Read-only, CRUD, ou Complex ?
- [ ] **Identifier boilerplate** : useState, useEffect, createClient ?
- [ ] **Identifier logique métier** : Transformations, validations, helpers ?
- [ ] **Migrer boilerplate** : Remplacer par useSupabaseQuery/CRUD
- [ ] **Conserver logique métier** : useMemo, fonctions custom
- [ ] **Type-check** : `npm run type-check`
- [ ] **Tests E2E** : MCP Browser (si page accessible)
- [ ] **Commit** : Convention `refactor(hooks): Migrate {hook} to base architecture`

---

## 🎯 Prochaines Étapes

### Phase 1 : Migrations Simples (5-10 hooks)
- [ ] use-collection-images.ts (read-only, 90 lignes)
- [ ] use-automation-triggers.ts (CRUD simple)
- [ ] use-bank-reconciliation.ts (queries + calculs)

### Phase 2 : Migrations Moyennes (10-20 hooks)
- [ ] use-categories.ts (avec generateSlug)
- [ ] use-families.ts (avec toggleStatus)
- [ ] use-stock-alerts.ts (avec calculs)

### Phase 3 : Documentation & Cleanup
- [ ] Documenter pattern pour hooks restants
- [ ] Identifier hooks deadcode (20 non utilisés)
- [ ] Archiver hooks morts

---

## 📚 Ressources

- **Base Hooks** : `src/hooks/base/`
  - `use-supabase-query.ts` (92 lignes)
  - `use-supabase-mutation.ts` (147 lignes)
  - `use-supabase-crud.ts` (54 lignes)

- **Hook Migré** : `src/hooks/use-collection-products.ts` ✅

- **Rapport Duplications** : `docs/audits/2025-10/RAPPORT-DUPLICATIONS-HOOKS-2025-10-29.md`

---

**Conclusion** : Pattern validé avec -80% boilerplate tout en conservant 100% logique métier. Réplication progressive sur 60+ hooks selon priorisation.
