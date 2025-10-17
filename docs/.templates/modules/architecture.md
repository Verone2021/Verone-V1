# [MODULE_NAME] - Architecture Détaillée

**Last Updated** : [DATE]
**Code Analysis** : Automated via `/audit-module`

---

## 📁 File Structure

### Complete File Tree
```
src/app/[module]/
├── page.tsx                    # Main list view
├── [id]/
│   └── page.tsx               # Detail view
├── new/
│   └── page.tsx               # Creation form
└── layout.tsx (if applicable)

src/hooks/
├── use-[module].ts            # Main CRUD hook
├── use-[module]-filters.ts    # Filtering logic
└── metrics/
    └── use-[module]-metrics.ts # Analytics hook

src/components/business/
├── [module]-card.tsx          # List item component
├── [module]-modal.tsx         # Modal dialogs
├── [module]-form.tsx          # Form component
└── [module]-filters.tsx       # Filters UI

src/app/api/[module]/
├── route.ts                   # List & Create endpoints
└── [id]/
    └── route.ts              # Get, Update, Delete
```

---

## 🧩 Component Architecture

### Main Page Component
**File** : `src/app/[module]/page.tsx`

```typescript
// Structure type
export default function [Module]Page() {
  // 1. Hooks
  const { data, loading, error, create, update, delete } = use[Module]()
  const { filters, setFilters } = use[Module]Filters()

  // 2. State management
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 3. Event handlers
  const handleCreate = async (data) => { ... }
  const handleUpdate = async (id, data) => { ... }
  const handleDelete = async (id) => { ... }

  // 4. Render
  return (
    <div>
      <[Module]Filters />
      <[Module]List items={data} />
      <[Module]Modal />
    </div>
  )
}
```

**Key Features** :
- [Feature 1 description]
- [Feature 2 description]
- [Feature 3 description]

**Dependencies** :
- Hooks : [list]
- Components : [list]
- Utils : [list]

---

## 🔗 Data Flow

### Read Flow (GET)
```
User Action
  ↓
Page Component
  ↓
use[Module]() hook
  ↓
Supabase Query (.select())
  ↓
RLS Policy Check
  ↓
Data Enrichment (if needed)
  ↓
Return to Component
  ↓
Render UI
```

### Write Flow (CREATE/UPDATE)
```
User Action (Form Submit)
  ↓
Validation (Zod schema)
  ↓
use[Module]() hook mutation
  ↓
Supabase Mutation (.insert/.update)
  ↓
RLS Policy Check
  ↓
Database Trigger (if any)
  ↓
Return success/error
  ↓
UI Update (optimistic or refetch)
  ↓
Toast Notification
```

### Delete Flow
```
User Action (Delete button)
  ↓
Confirmation Dialog
  ↓
use[Module]() hook delete
  ↓
Supabase Delete (.delete())
  ↓
RLS Policy Check
  ↓
Cascade Delete (if configured)
  ↓
Return success
  ↓
UI Update (remove from list)
  ↓
Toast Notification
```

---

## 🎨 Design Patterns

### Pattern 1: Custom Hook for CRUD
```typescript
// src/hooks/use-[module].ts
export function use[Module]() {
  const supabase = createClient()

  const { data, error, isLoading } = useQuery({
    queryKey: ['[module]'],
    queryFn: async () => {
      const { data } = await supabase
        .from('[table]')
        .select('*')
      return data
    }
  })

  const createMutation = useMutation({
    mutationFn: async (newItem) => { ... }
  })

  return {
    data,
    loading: isLoading,
    error,
    create: createMutation.mutate,
    update: ...,
    delete: ...
  }
}
```

**Advantages** :
- Separation of concerns
- Reusable across pages
- Centralized data fetching
- Type-safe with TypeScript

### Pattern 2: Component Composition
```typescript
// Atomic Design inspired

// Atoms
<Button />
<Input />
<Label />

// Molecules
<[Module]Card /> = Button + Input + Label

// Organisms
<[Module]List /> = Multiple <[Module]Card />

// Templates
<[Module]Page /> = Layout + <[Module]List /> + Filters
```

### Pattern 3: Error Boundaries
```typescript
// src/app/[module]/page.tsx
<ErrorBoundary fallback={<ErrorState />}>
  <Suspense fallback={<LoadingState />}>
    <[Module]Content />
  </Suspense>
</ErrorBoundary>
```

---

## 🔐 Security Architecture

### RLS Policies
```sql
-- Read policy
CREATE POLICY "allow_select_[module]"
ON [table] FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
)

-- Write policies
[INSERT policy]
[UPDATE policy]
[DELETE policy]
```

### Client-Side Validation
- **Zod schemas** : [list validation rules]
- **Business rules** : [list rules enforced]
- **Permission checks** : [list permissions]

### Server-Side Validation
- **API routes** : Double validation
- **RLS enforcement** : Database level
- **Input sanitization** : XSS prevention

---

## ⚡ Performance Architecture

### Optimization Strategies

#### 1. Database Query Optimization
```typescript
// ❌ BAD: N+1 queries
for (const item of items) {
  const related = await supabase
    .from('related_table')
    .select('*')
    .eq('item_id', item.id)
}

// ✅ GOOD: Single query with JOIN
const { data } = await supabase
  .from('items')
  .select(`
    *,
    related_table (*)
  `)
```

#### 2. React Performance
```typescript
// useMemo for expensive computations
const filteredData = useMemo(
  () => data.filter(item => item.status === 'active'),
  [data]
)

// useCallback for event handlers
const handleClick = useCallback(
  (id) => { ... },
  [dependency]
)

// React.memo for pure components
export const [Module]Card = React.memo(({ item }) => {
  // ...
})
```

#### 3. Code Splitting
```typescript
// Lazy load heavy components
const [Module]Modal = dynamic(
  () => import('@/components/business/[module]-modal'),
  { loading: () => <Skeleton /> }
)
```

### Performance Metrics
- **Initial Load** : [X]s
- **Time to Interactive** : [X]s
- **First Contentful Paint** : [X]s
- **Largest Contentful Paint** : [X]s

---

## 🧬 State Management

### Local State (useState)
- UI state (modals, selected items)
- Form inputs
- Temporary filters

### Server State (React Query)
- Database data
- API responses
- Cache management

### URL State (Next.js)
- Filters (searchParams)
- Pagination (page number)
- Sorting (sort field)

---

## 🔄 Real-time Updates (if applicable)

### Supabase Subscriptions
```typescript
useEffect(() => {
  const channel = supabase
    .channel('[module]-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: '[table]'
    }, (payload) => {
      // Invalidate query cache
      queryClient.invalidateQueries(['[module]'])
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

---

## 📝 Code Quality

### TypeScript Usage
- **Type Coverage** : [X]%
- **Strict Mode** : ✅ Enabled
- **No `any`** : ✅ (except justified cases)

### Code Standards
- **ESLint** : ✅ No errors
- **Prettier** : ✅ Formatted
- **Naming Conventions** : camelCase, PascalCase, kebab-case

### Testing
- **Unit Tests** : [X]% coverage
- **Integration Tests** : [list critical paths]
- **E2E Tests** : [list user flows]

---

## 🔧 Dependencies

### NPM Packages
- `@supabase/supabase-js` : Database client
- `@tanstack/react-query` : Server state
- `zod` : Validation
- `react-hook-form` : Forms
- [other dependencies]

### Internal Dependencies
- `@/lib/supabase` : Supabase client
- `@/components/ui-v2` : Design System V2
- `@/hooks` : Shared hooks
- `@/lib/utils` : Utilities

---

## 🚀 Deployment Considerations

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [module-specific vars]

### Build Optimizations
- **Dynamic Imports** : Heavy components
- **Image Optimization** : next/image
- **Bundle Analysis** : [bundle size]

---

**Architecture Documentation - Generated from Real Code** ✅
