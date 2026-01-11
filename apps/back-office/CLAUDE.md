# Back-Office - Instructions Claude Code

## Description

CRM/ERP principal Verone - Port 3000

## Commandes

```bash
npm run dev:back-office    # Dev uniquement back-office
npm run build:back-office  # Build back-office
```

---

## Structure

```
apps/back-office/src/
├── app/                    # Pages Next.js (App Router)
│   ├── (authenticated)/   # Routes protegees
│   ├── api/               # API Routes
│   └── layout.tsx         # Layout principal
├── components/            # Composants specifiques back-office
├── lib/                   # Utilitaires back-office
└── types/                 # Types (supabase.ts genere)
```

---

## Pages Principales

| Route                     | Description                 |
| ------------------------- | --------------------------- |
| `/dashboard`              | Dashboard principal         |
| `/produits/catalogue`     | Gestion catalogue           |
| `/commandes/clients`      | Commandes clients (SO)      |
| `/commandes/fournisseurs` | Commandes fournisseurs (PO) |
| `/canaux-vente/linkme`    | Gestion LinkMe              |

---

## Patterns UI

### Server Components (defaut)

```typescript
// app/produits/page.tsx
export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}
```

### Client Components (interactions)

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@verone/ui';

export function ProductActions() {
  const [loading, setLoading] = useState(false);
  // ...
}
```

---

## Imports

```typescript
// Design System
import { Button, Card, Dialog } from '@verone/ui';

// Business Components
import { ProductCard } from '@verone/products';
import { StockAlertCard } from '@verone/stock';

// Types
import type { Database } from '@/types/supabase';
```

---

## Regles Specifiques

1. **RSC par defaut** : Client uniquement pour interactions
2. **Server Actions** : Pour mutations DB
3. **Layouts imbriques** : Heriter du layout parent
4. **Loading states** : Skeleton via Suspense

---

## References

- `/docs/current/serena/products-architecture.md`
- `/docs/current/serena/stock-orders-logic.md`
- `/docs/current/serena/qonto-never-finalize.md`
