# Size Thresholds Reference

Version: 1.0.0

## File Size Limits

| Category              | Warning   | Error     | Notes                                                        |
| --------------------- | --------- | --------- | ------------------------------------------------------------ |
| Any `.ts`/`.tsx` file | 300 lines | 500 lines | Excludes auto-generated files                                |
| Auto-generated files  | N/A       | N/A       | `supabase.ts`, `supabase.d.ts`, `*.gen.ts`, `*.generated.ts` |

## Function/Component Size Limits

| Category                        | Warning   | Error     | Notes                                |
| ------------------------------- | --------- | --------- | ------------------------------------ |
| Regular function                | 50 lines  | 75 lines  | Any named function or arrow function |
| React stateless component       | 40 lines  | 80 lines  | No hooks, pure render                |
| React component with hooks      | 100 lines | 150 lines | useState, useEffect, custom hooks    |
| Page component (`page.tsx`)     | 150 lines | 250 lines | App Router pages                     |
| Layout component (`layout.tsx`) | 150 lines | 250 lines | App Router layouts                   |

## Complexity Limits

| Metric                | Warning  | Error    | Description                               |
| --------------------- | -------- | -------- | ----------------------------------------- |
| Function parameters   | 3        | 5        | Use options object pattern above 3 params |
| Nesting depth         | 3 levels | 4 levels | if/for/while/switch nested blocks         |
| Cyclomatic complexity | 10       | 15       | Number of independent paths through code  |

## Decomposition Strategies

When a file exceeds thresholds, propose specific decomposition using these patterns:

### Strategy 1: Extract Component

When a JSX block within a component is self-contained (has its own logic, renders a distinct UI section).

```
BEFORE: ProductPage.tsx (450 lines)
  - Lines 1-30: imports
  - Lines 31-80: useProductData hook logic
  - Lines 81-150: ProductHeader render section
  - Lines 151-300: ProductTable render section
  - Lines 301-400: ProductFilters render section
  - Lines 401-450: main return with layout

AFTER:
  - ProductPage.tsx (120 lines) — layout + composition
  - components/ProductHeader.tsx (70 lines)
  - components/ProductTable.tsx (150 lines)
  - components/ProductFilters.tsx (100 lines)
```

### Strategy 2: Extract Custom Hook

When stateful logic (useState, useEffect, useMemo, React Query) can be isolated.

```
BEFORE: OrderForm.tsx (380 lines)
  - Lines 10-45: form state (useState x6)
  - Lines 46-90: validation logic
  - Lines 91-130: submit handler with API call
  - Lines 131-380: JSX render

AFTER:
  - OrderForm.tsx (260 lines) — render + hook usage
  - hooks/useOrderForm.ts (120 lines) — state, validation, submit
```

### Strategy 3: Extract Utility Functions

When pure functions (no React state, no side effects) exist within a component.

```
BEFORE: InvoicePage.tsx (320 lines)
  - Lines 15-45: formatCurrency, calculateTax, buildLineItems
  - Lines 46-320: component logic + render

AFTER:
  - InvoicePage.tsx (275 lines)
  - utils/invoice-calculations.ts (45 lines)
```

### Strategy 4: Extract Type Definitions

When inline types or interfaces exceed 20 lines.

```
BEFORE: DashboardPage.tsx (350 lines)
  - Lines 5-40: interface DashboardProps, type FilterState, type ChartData
  - Lines 41-350: component

AFTER:
  - DashboardPage.tsx (315 lines)
  - types/dashboard.ts (35 lines)
```

## Parameters Pattern

When a function exceeds 3 parameters, refactor to options object:

```typescript
// BEFORE (5 params — exceeds threshold)
function createOrder(
  customerId: string,
  items: OrderItem[],
  discount: number,
  shippingMethod: string,
  notes: string
) {}

// AFTER (1 options object)
interface CreateOrderOptions {
  customerId: string;
  items: OrderItem[];
  discount: number;
  shippingMethod: string;
  notes: string;
}

function createOrder(options: CreateOrderOptions) {}
```

## Nesting Depth

Count nested control flow structures. Each `if`, `for`, `while`, `switch`, `try` adds one level.

```typescript
// Nesting depth = 4 (EXCEEDS threshold)
function process(items: Item[]) {
  for (const item of items) {
    // Level 1
    if (item.active) {
      // Level 2
      for (const sub of item.children) {
        // Level 3
        if (sub.type === 'special') {
          // Level 4 — TOO DEEP
          // ...
        }
      }
    }
  }
}

// Refactored with early returns and extracted functions
function processSpecialChild(sub: SubItem) {
  if (sub.type !== 'special') return;
  // ...
}

function processItem(item: Item) {
  if (!item.active) return; // Early return
  for (const sub of item.children) {
    // Level 1
    processSpecialChild(sub); // Extracted
  }
}

function process(items: Item[]) {
  for (const item of items) {
    // Level 1
    processItem(item); // Level 2 max
  }
}
```

## Severity Classification

| Condition            | Severity   |
| -------------------- | ---------- |
| File > 500 lines     | IMPORTANT  |
| File 300-500 lines   | SUGGESTION |
| Function > 75 lines  | IMPORTANT  |
| Function 50-75 lines | SUGGESTION |
| Nesting > 4 levels   | IMPORTANT  |
| Nesting = 4 levels   | SUGGESTION |
| Parameters > 5       | IMPORTANT  |
| Parameters 4-5       | SUGGESTION |
