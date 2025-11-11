# [MODULE_NAME] - Hooks Reference

**Custom Hooks Documentation** - Auto-generated from code analysis

---

## 📚 Hooks Overview

### Available Hooks

1. `use[Module]()` - Main CRUD hook
2. `use[Module]Filters()` - Filtering & search
3. `use[Module]Metrics()` - Analytics (if applicable)
4. `use[Module]Validation()` - Form validation (if applicable)

---

## 🎣 Main Hook: `use[Module]()`

**File** : `apps/back-office/apps/back-office/src/hooks/use-[module].ts`

### Purpose

Main hook for CRUD operations on [module] data.

### API

```typescript
function use[Module](options?: UseModuleOptions): UseModuleReturn

interface UseModuleOptions {
  filters?: Filters
  enabled?: boolean
  refetchInterval?: number
}

interface UseModuleReturn {
  // Data
  data: Module[] | null
  isLoading: boolean
  error: Error | null

  // Mutations
  create: (data: CreateModuleData) => Promise<Module>
  update: (id: string, data: UpdateModuleData) => Promise<Module>
  delete: (id: string) => Promise<void>

  // Utilities
  refetch: () => Promise<void>
  invalidate: () => void
}
```

### Usage Example

```typescript
import { use[Module] } from '@/hooks/use-[module]'

function [Module]Page() {
  const {
    data,
    isLoading,
    error,
    create,
    update,
    delete: deleteItem
  } = use[Module]()

  const handleCreate = async () => {
    try {
      const newItem = await create({
        name: 'New Item',
        status: 'active'
      })
      toast.success('Created successfully')
    } catch (error) {
      toast.error('Failed to create')
    }
  }

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  return (
    <div>
      {data?.map(item => (
        <[Module]Card
          key={item.id}
          item={item}
          onUpdate={(data) => update(item.id, data)}
          onDelete={() => deleteItem(item.id)}
        />
      ))}
      <Button onClick={handleCreate}>Create New</Button>
    </div>
  )
}
```

### Implementation Details

```typescript
// apps/back-office/src/hooks/use-[module].ts
export function use[Module](options?: UseModuleOptions) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Query for reading data
  const query = useQuery({
    queryKey: ['[module]', options?.filters],
    queryFn: async () => {
      let query = supabase
        .from('[table]')
        .select('*')

      // Apply filters if provided
      if (options?.filters) {
        query = applyFilters(query, options.filters)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newData: CreateModuleData) => {
      const { data, error } = await supabase
        .from('[table]')
        .insert(newData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['[module]'])
      toast.success('Created successfully')
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`)
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: updated, error } = await supabase
        .from('[table]')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['[module]'])
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('[table]')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['[module]'])
    }
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutateAsync,
    update: (id, data) => updateMutation.mutateAsync({ id, data }),
    delete: deleteMutation.mutateAsync,
    refetch: query.refetch,
    invalidate: () => queryClient.invalidateQueries(['[module]'])
  }
}
```

### Performance Considerations

- ✅ Uses React Query for caching
- ✅ Automatic refetch on window focus
- ✅ Optimistic updates for better UX
- ✅ Error handling with toast notifications

---

## 🔍 Filter Hook: `use[Module]Filters()`

**File** : `apps/back-office/apps/back-office/src/hooks/use-[module]-filters.ts`

### Purpose

Manage filtering and search state for [module] list.

### API

```typescript
function use[Module]Filters(): UseFiltersReturn

interface UseFiltersReturn {
  filters: Filters
  setFilters: (filters: Partial<Filters>) => void
  resetFilters: () => void
  activeFiltersCount: number
}

interface Filters {
  search?: string
  status?: 'active' | 'inactive' | 'all'
  category?: string
  dateFrom?: Date
  dateTo?: Date
  [key: string]: any
}
```

### Usage Example

```typescript
function [Module]Page() {
  const { filters, setFilters, resetFilters, activeFiltersCount } = use[Module]Filters()
  const { data } = use[Module]({ filters })

  return (
    <div>
      <FilterBar>
        <SearchInput
          value={filters.search || ''}
          onChange={(value) => setFilters({ search: value })}
        />
        <StatusSelect
          value={filters.status || 'all'}
          onChange={(value) => setFilters({ status: value })}
        />
        {activeFiltersCount > 0 && (
          <Button onClick={resetFilters}>
            Clear {activeFiltersCount} filters
          </Button>
        )}
      </FilterBar>

      <[Module]List data={data} />
    </div>
  )
}
```

### Implementation

```typescript
// apps/back-office/src/hooks/use-[module]-filters.ts
export function use[Module]Filters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Read filters from URL
  const filters = useMemo(() => ({
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') as Filters['status'],
    category: searchParams.get('category') || undefined,
    dateFrom: searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined,
    dateTo: searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined
  }), [searchParams])

  // Update URL with new filters
  const setFilters = useCallback((newFilters: Partial<Filters>) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    router.replace(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  // Reset all filters
  const resetFilters = useCallback(() => {
    router.replace(pathname)
  }, [pathname, router])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== undefined).length
  }, [filters])

  return {
    filters,
    setFilters,
    resetFilters,
    activeFiltersCount
  }
}
```

---

## 📊 Metrics Hook: `use[Module]Metrics()` (if applicable)

**File** : `apps/back-office/apps/back-office/src/hooks/metrics/use-[module]-metrics.ts`

### Purpose

Fetch and compute analytics metrics for [module].

### API

```typescript
function use[Module]Metrics(period?: 'day' | 'week' | 'month'): MetricsReturn

interface MetricsReturn {
  // Metrics
  total: number
  active: number
  growth: number
  trend: 'up' | 'down' | 'stable'

  // Time series
  timeSeries: Array<{ date: string; value: number }>

  // Loading states
  isLoading: boolean
  error: Error | null
}
```

### Usage Example

```typescript
function [Module]Dashboard() {
  const { total, active, growth, trend, timeSeries, isLoading } = use[Module]Metrics('month')

  if (isLoading) return <Skeleton />

  return (
    <div>
      <KPICard
        title="Total [Module]"
        value={total}
        growth={growth}
        trend={trend}
      />
      <Chart data={timeSeries} />
    </div>
  )
}
```

---

## ✅ Validation Hook: `use[Module]Validation()` (if applicable)

**File** : `apps/back-office/apps/back-office/src/hooks/use-[module]-validation.ts`

### Purpose

Form validation logic with Zod schemas.

### API

```typescript
function use[Module]Validation(): ValidationReturn

interface ValidationReturn {
  schema: z.ZodSchema
  validate: (data: unknown) => ValidationResult
  errors: Record<string, string>
}
```

### Zod Schema

```typescript
// apps/back-office/src/hooks/use-[module]-validation.ts
const [module]Schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  status: z.enum(['active', 'inactive']),
  email: z.string().email('Invalid email format').optional(),
  quantity: z.number().min(0, 'Must be positive').optional(),
  // ... other fields
})

export function use[Module]Validation() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (data: unknown) => {
    try {
      [module]Schema.parse(data)
      setErrors({})
      return { success: true, data }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      }
      return { success: false, errors }
    }
  }

  return {
    schema: [module]Schema,
    validate,
    errors
  }
}
```

---

## 🎯 Best Practices

### 1. Hook Naming

✅ **DO** : `use[Module]()`
❌ **DON'T** : `get[Module]Data()`, `fetch[Module]()`

### 2. Error Handling

```typescript
// ✅ GOOD: Centralized error handling
const { data, error } = use[Module]()

if (error) {
  return <ErrorBoundary error={error} />
}
```

### 3. Loading States

```typescript
// ✅ GOOD: Show loading state
const { isLoading } = use[Module]()

if (isLoading) {
  return <Skeleton />
}
```

### 4. Memoization

```typescript
// ✅ GOOD: Memoize expensive computations
const filteredData = useMemo(() => data?.filter(applyFilters), [data, filters]);
```

### 5. Dependency Arrays

```typescript
// ✅ GOOD: Include all dependencies
useEffect(() => {
  fetchData(id, filters);
}, [id, filters, fetchData]);
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: Stale Data

**Problem** : Data doesn't update after mutation
**Solution** : Invalidate query cache

```typescript
queryClient.invalidateQueries(['[module]']);
```

#### Issue 2: Infinite Loops

**Problem** : useEffect runs infinitely
**Solution** : Fix dependency array or use useCallback

```typescript
const handler = useCallback(() => { ... }, [dep])
useEffect(() => { handler() }, [handler])
```

#### Issue 3: Type Errors

**Problem** : TypeScript errors on hook return
**Solution** : Explicit return type annotation

```typescript
function use[Module](): UseModuleReturn {
  // ...
}
```

---

**Hooks Documentation - Based on Real Implementation** ✅
