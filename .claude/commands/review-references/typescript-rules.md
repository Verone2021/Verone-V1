# TypeScript Quality Rules Reference

Version: 1.0.0

## Zero Tolerance Rules (BLOCKING)

### Rule: no-explicit-any

**Pattern** : Zero `any` in TypeScript code.

```typescript
// BLOCKING — explicit any
const data: any = await fetchData();
function process(input: any) {}
const items: any[] = [];

// CORRECT — unknown + validation
const data: unknown = await fetchData();
const validated = Schema.parse(data);

// CORRECT — specific type
function process(input: OrderInput) {}
const items: OrderItem[] = [];
```

**Detection patterns** (Grep):

- `: any` (not in comments, not in `.d.ts` auto-generated files)
- `as any`
- `any[]`
- `any>` (generic with any)
- `<any>` (type assertion)

**Exclusions** :

- `supabase.ts`, `supabase.d.ts` (auto-generated types)
- `*.d.ts` in `node_modules`
- Comments containing `any`
- String literals containing "any" (e.g., `"company"`)

### Rule: no-ts-ignore

**Pattern** : Zero `@ts-ignore` without justification.

```typescript
// BLOCKING — no justification
// @ts-ignore
const value = obj.field;

// ACCEPTABLE — with justification (still SUGGESTION to remove)
// @ts-ignore — Third-party library types incorrect, reported issue #123
const value = obj.field;

// CORRECT — use @ts-expect-error instead (enforces that error exists)
// @ts-expect-error — Library X types missing overload for 2-arg version
const value = obj.field;
```

**Detection patterns** :

- `@ts-ignore` not followed by `—` or `-` explanation on same line
- `@ts-expect-error` (verify justification exists)

## Async Rules (BLOCKING)

### Rule: no-floating-promises

A promise that is neither awaited, returned, nor explicitly voided is a floating promise. If it rejects, the error is silently lost.

```typescript
// BLOCKING — floating promise (rejection = silent failure)
onClick={() => {
  createOrder(orderData);
}}

// CORRECT — void + catch
onClick={() => {
  void createOrder(orderData).catch(error => {
    console.error('[Component] Order creation failed:', error);
    toast.error('Erreur lors de la creation');
  });
}}

// CORRECT — await in async context
const handleClick = async () => {
  try {
    await createOrder(orderData);
  } catch (error) {
    console.error('[Component] Order creation failed:', error);
  }
};
```

**Detection patterns** :

- Function call returning Promise without `await`, `void`, `return`, or `.then`/`.catch`
- Common async functions: `mutateAsync`, `invalidateQueries`, `refetch`, `supabase.from`

### Rule: no-misused-promises

Async functions must not be passed directly as event handlers.

```typescript
// BLOCKING — async handler passed directly
<form onSubmit={handleSubmit}>        // handleSubmit is async
<button onClick={handleDelete}>       // handleDelete is async

// CORRECT — synchronous wrapper
<form onSubmit={(e) => {
  void handleSubmit(e).catch(console.error);
}}>

<button onClick={() => {
  void handleDelete().catch(console.error);
}}>
```

**Detection patterns** :

- `onSubmit={` followed by identifier (check if function is async)
- `onClick={` followed by identifier (check if function is async)
- `onChange={` followed by identifier (check if function is async)

### Rule: invalidateQueries must be awaited

In React Query mutations, `invalidateQueries` in `onSuccess` must be awaited, otherwise the UI renders stale data.

```typescript
// BLOCKING — not awaited (UI shows stale data)
const mutation = useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});

// CORRECT — awaited
const mutation = useMutation({
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    toast.success('Succes');
  },
  onError: error => {
    console.error('[Mutation]:', error);
    toast.error('Erreur');
  },
});
```

**Detection patterns** :

- `invalidateQueries` not preceded by `await` inside `onSuccess`
- `onSuccess` callback that is not `async` but calls `invalidateQueries`

## Supabase Error Handling (IMPORTANT)

### Rule: check-supabase-error

Always check `error` before using `data` from Supabase queries.

```typescript
// IMPORTANT — error not checked
const { data } = await supabase.from('orders').select('id, status');
return data.map(/* ... */); // data could be null if error

// CORRECT — error checked
const { data, error } = await supabase.from('orders').select('id, status');
if (error) {
  console.error('Supabase error:', error.message);
  return { error: error.message };
}
return data.map(/* ... */);
```

**Detection patterns** :

- `const { data }` (destructuring without `error`) from supabase query
- `supabase.from(` where result `.data` is used without prior error check

## Zod Validation (IMPORTANT)

### Rule: api-zod-validation

All API route handlers must validate inputs with Zod.

```typescript
// IMPORTANT — no validation
export async function POST(request: Request) {
  const body = await request.json();
  // Using body directly — unsafe
}

// CORRECT — Zod validation
import { z } from 'zod';

const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive(),
    })
  ),
});

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const result = CreateOrderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }
  const { customerId, items } = result.data;
  // Safe to use
}
```

**Detection patterns** :

- `app/api/` route files without `import.*zod` or `import.*z.*from`
- `request.json()` without subsequent `.safeParse` or `.parse`

## Severity Classification

| Rule                                         | Severity   |
| -------------------------------------------- | ---------- |
| `any` in application code                    | BLOCKING   |
| `as any` cast                                | BLOCKING   |
| `@ts-ignore` without justification           | BLOCKING   |
| Floating promise                             | BLOCKING   |
| Misused promise in handler                   | BLOCKING   |
| `invalidateQueries` not awaited              | BLOCKING   |
| Supabase error not checked                   | IMPORTANT  |
| API route without Zod validation             | IMPORTANT  |
| `@ts-expect-error` (even with justification) | SUGGESTION |
| Missing `onError` in mutation                | SUGGESTION |
