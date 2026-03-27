# Performance Rules Reference

Version: 1.0.0

## Database Query Performance (IMPORTANT)

### Rule: no-select-star

Always specify columns explicitly. `select('*')` fetches all columns, including large text fields, JSON blobs, and unused relations.

```typescript
// IMPORTANT — fetches everything
const { data } = await supabase.from('products').select('*');

// CORRECT — only needed columns
const { data } = await supabase
  .from('products')
  .select('id, name, price, status');
```

**Detection** : Grep for `.select('*')`, `.select("*")`

### Rule: limit-on-large-tables

Queries on tables that can grow large must include `.limit()` to prevent fetching thousands of rows.

```typescript
// IMPORTANT — unbounded query
const { data } = await supabase.from('products').select('id, name');

// CORRECT — limited
const { data } = await supabase.from('products').select('id, name').limit(50);

// CORRECT — paginated
const { data } = await supabase
  .from('products')
  .select('id, name')
  .range(offset, offset + pageSize - 1);
```

**Known large tables** (check with SQL if unsure):

- `products`, `sourcing_products`
- `sales_orders`, `purchase_orders`
- `financial_documents`, `financial_document_lines`
- `stock_movements`
- `notifications`
- `linkme_selection_items`

**Detection** : `.from('large_table').select(` without `.limit(` or `.range(` or `.single()` or `.maybeSingle()`

### Rule: no-n-plus-one

Avoid N+1 queries. Use Supabase joins instead of looping queries.

```typescript
// IMPORTANT — N+1 queries
const { data: orders } = await supabase
  .from('orders')
  .select('id, customer_id');
for (const order of orders) {
  const { data: customer } = await supabase
    .from('customers')
    .select('name')
    .eq('id', order.customer_id);
}

// CORRECT — single query with join
const { data: orders } = await supabase.from('orders').select(`
  id,
  customer:customers(name)
`);
```

**Detection** : `supabase.from(` inside a `for` loop or `.map(` or `.forEach(`

## Next.js Performance (IMPORTANT)

### Rule: use-next-image

Always use `next/image` instead of raw `<img>` tags. Next.js Image optimizes format, size, and lazy loading.

```tsx
// IMPORTANT — unoptimized
<img src="/photo.jpg" alt="Product" />;

// CORRECT — optimized
import Image from 'next/image';
<Image src="/photo.jpg" alt="Product" width={400} height={300} />;
```

**Detection** : Grep for `<img ` in `.tsx` files (excluding comments)

**Exclusions** :

- SVG inline (`<img` for tiny icons may be acceptable)
- External URLs that cannot be configured in `next.config.js`
- Email templates / PDF templates (they do not support next/image)

### Rule: server-components-default

Components should be Server Components by default. Only add `"use client"` when the component needs:

- React hooks (useState, useEffect, useContext, etc.)
- Browser APIs (window, document, localStorage)
- Event handlers (onClick, onChange, onSubmit)
- Third-party client libraries

```tsx
// SUGGESTION — unnecessary "use client"
'use client';
export default function StaticInfo({ data }: Props) {
  return <div>{data.name}</div>; // No hooks, no events — RSC would work
}

// CORRECT — no directive needed for pure render
export default function StaticInfo({ data }: Props) {
  return <div>{data.name}</div>;
}
```

**Detection** : Files with `"use client"` that do not import any hooks or use event handlers.

### Rule: no-useeffect-for-fetch

In Next.js 15 App Router, initial data fetching should use Server Components or Server Actions, not `useEffect`.

```tsx
// SUGGESTION — client-side fetch
'use client';
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(setOrders);
  }, []);
  return <OrderList orders={orders} />;
}

// CORRECT — Server Component with direct fetch
export default async function OrdersPage() {
  const orders = await getOrders();
  return <OrderList orders={orders} />;
}
```

**Detection** : `useEffect` containing `fetch(`, `supabase.from(`, or similar data-fetching calls.

**Note** : This is a SUGGESTION, not BLOCKING. Some cases legitimately require client-side fetching (real-time subscriptions, user-triggered fetches, search-as-you-type).

### Rule: use-next-font

Use `next/font` for font loading instead of CSS `@import` or `<link>` tags.

```tsx
// SUGGESTION — blocks rendering
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />;

// CORRECT — optimized
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```

**Detection** : Grep for `fonts.googleapis.com` or `@import.*font` in CSS/TSX files.

## Bundle Size (SUGGESTION)

### Rule: no-barrel-exports

Barrel exports (`index.ts` that re-exports everything) prevent tree-shaking and increase bundle size.

```typescript
// SUGGESTION — barrel export
// components/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';
// ... 50 more exports

// CORRECT — direct imports
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
```

**Detection** : `index.ts` or `index.tsx` files that contain only `export { ... } from` or `export * from` statements.

**Exclusions** :

- Package entry points (`packages/@verone/*/src/index.ts`) — these are expected
- Files with actual logic, not just re-exports

### Rule: loading-tsx-exists

App Router routes should have `loading.tsx` files for Suspense boundaries to show loading states during navigation.

**Detection** : `page.tsx` files in route directories without a corresponding `loading.tsx`.

**Note** : Not every route needs one. Focus on routes that fetch data (have `async` in the page component or use React Query).

## Severity Classification

| Rule                                   | Severity   |
| -------------------------------------- | ---------- |
| `select('*')` in production queries    | IMPORTANT  |
| No `.limit()` on large table queries   | IMPORTANT  |
| N+1 queries in loops                   | IMPORTANT  |
| Raw `<img>` instead of `next/image`    | IMPORTANT  |
| `useEffect` for initial data fetch     | SUGGESTION |
| Unnecessary `"use client"`             | SUGGESTION |
| Barrel exports                         | SUGGESTION |
| Missing `loading.tsx`                  | SUGGESTION |
| CSS font import instead of `next/font` | SUGGESTION |
