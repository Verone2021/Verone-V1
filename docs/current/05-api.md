---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - apps/back-office/src/app/api/
  - supabase/migrations/*rpc*.sql
references:
  - docs/api/
  - docs/database/functions-rpc.md
---

# API Verone

Next.js API Routes + Supabase RPC.

## Types d'API

| Type | Emplacement | Usage |
|------|-------------|-------|
| **API Routes** | `apps/[app]/src/app/api/` | Endpoints REST Next.js |
| **Server Actions** | `apps/[app]/src/actions/` | Actions serveur Next.js |
| **RPC Supabase** | `supabase/migrations/` | Fonctions PostgreSQL |

## API Routes principales

| Route | Methode | Description |
|-------|---------|-------------|
| `/api/products` | GET, POST | Produits |
| `/api/orders` | GET, POST | Commandes |
| `/api/webhooks/supabase` | POST | Webhooks Supabase |
| `/api/integrations/abby` | POST | Integration Abby |

## Fonctions RPC (254 fonctions)

```typescript
// Appeler une fonction RPC
const { data } = await supabase.rpc('get_dashboard_metrics', {
  org_id: organisationId
});
```

### Fonctions critiques

| Fonction | Description |
|----------|-------------|
| `get_dashboard_metrics` | KPIs dashboard |
| `calculate_stock_forecasts` | Previsions stock |
| `get_sales_analytics` | Analytics ventes |
| `sync_product_to_channels` | Sync canaux vente |

Voir [functions-rpc.md](../database/functions-rpc.md) pour liste complete.

## Webhooks

| Source | Endpoint | Description |
|--------|----------|-------------|
| Supabase | `/api/webhooks/supabase` | Events database |
| Abby | `/api/webhooks/abby` | Factures |
| Packlink | `/api/webhooks/packlink` | Expeditions |

## Liens

- [Database](./03-database.md) - Schema et triggers
- [Integrations](./08-integrations.md) - APIs externes

---

*Derniere verification: 2025-12-17*
