# 🔤 @verone/types - Types TypeScript Partagés

**Types TypeScript partagés** entre API et Frontend pour garantir la cohérence des contrats.

⚠️ **Statut** : Préparation (migration effective après Phase 1)

---

## 🎯 Objectif

Centraliser les types DTO (Data Transfer Objects) partagés entre Backend et Frontend.

---

## 📦 Contenu futur

```
packages/types/
├── src/
│   ├── catalogue/
│   │   ├── product.ts
│   │   ├── variant.ts
│   │   └── collection.ts
│   ├── orders/
│   │   ├── sales-order.ts
│   │   └── purchase-order.ts
│   ├── stock/
│   │   ├── stock-movement.ts
│   │   └── inventory.ts
│   ├── auth/
│   │   ├── user.ts
│   │   └── role.ts
│   ├── common/
│   │   ├── pagination.ts
│   │   ├── filters.ts
│   │   └── api-response.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## 🚀 Usage futur (après migration)

```typescript
// Dans apps/api (Backend NestJS)
import { CreateProductDTO, Product } from '@verone/types'

@Post('products')
async createProduct(@Body() dto: CreateProductDTO): Promise<Product> {
  // ...
}

// Dans apps/web (Frontend Next.js)
import { Product, ProductsResponse } from '@verone/types'

async function getProducts(): Promise<ProductsResponse> {
  // ...
}
```

---

## ✅ Avantages

- **Type-safety** : Contrat partagé API ↔ Frontend
- **DX** : Autocomplétion IDE partout
- **Maintenance** : Changements centralisés
- **Documentation** : Types = documentation vivante

---

## 📚 Types à migrer

**De** : `src/types/` (Next.js)
**Vers** : `packages/types/src/`

**Liste initiale** :

- [ ] Types Supabase générés
- [ ] DTOs API (create, update, delete)
- [ ] Types métier (Product, Order, Stock, etc.)
- [ ] Types utils (Pagination, Filters, etc.)

---

_À migrer : Après Phase 1_
_Référence actuelle : src/types/_
