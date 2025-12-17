---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - supabase/migrations/
  - packages/@verone/types/src/supabase.ts
references:
  - docs/database/SCHEMA-REFERENCE.md
  - docs/database/triggers.md
  - docs/database/rls-policies.md
  - docs/database/functions-rpc.md
  - docs/database/enums.md
---

# Database Verone

PostgreSQL via Supabase Cloud.

## Vue d'ensemble

| Element | Nombre | Documentation detaillee |
|---------|--------|-------------------------|
| **Tables** | 78 | [SCHEMA-REFERENCE.md](../database/SCHEMA-REFERENCE.md) |
| **Triggers** | 158 | [triggers.md](../database/triggers.md) |
| **RLS Policies** | 239 | [rls-policies.md](../database/rls-policies.md) |
| **Fonctions RPC** | 254 | [functions-rpc.md](../database/functions-rpc.md) |
| **Enums** | 34 | [enums.md](../database/enums.md) |
| **Foreign Keys** | 143 | [foreign-keys.md](../database/foreign-keys.md) |
| **Migrations** | 150+ | `supabase/migrations/` |

**Project ID Supabase**: `aorroydfjsrygmosnzrl`

## Tables principales par module

### Catalogue (18 tables)
- `products` - Produits (46 colonnes, table centrale)
- `product_variants`, `product_variant_groups` - Variantes
- `product_images` - Images
- `categories`, `families` - Classification
- `collections`, `product_collections` - Collections
- `price_lists`, `price_list_items` - Tarification

### Organisations (5 tables)
- `organisations` - Clients B2B + Fournisseurs (type enum)
- `individual_customers` - Clients B2C
- `contacts` - Contacts lies
- `organisation_addresses` - Adresses

### Commandes (8 tables)
- `sales_orders`, `sales_order_items` - Ventes
- `purchase_orders`, `purchase_order_items` - Achats
- `shipments`, `shipment_items` - Expeditions
- `receptions`, `reception_items` - Receptions

### Stock (4 tables)
- `stock_movements` - Mouvements
- `stock_reservations` - Reservations
- `stock_alerts` - Alertes
- `stock_alert_tracking` - Suivi alertes

### LinkMe (5 tables)
- `linkme_affiliates` - Affilies
- `linkme_referrals` - Referrals
- `linkme_orders` - Commandes affiliation
- `linkme_commissions` - Commissions
- `payment_requests` - Demandes paiement

## Regles anti-hallucination

### INTERDIT - Ne pas creer

| Table interdite | Utiliser a la place |
|-----------------|---------------------|
| `suppliers` | `organisations WHERE type IN ('supplier', 'manufacturer')` |
| `customers` | `organisations WHERE type = 'customer'` ou `individual_customers` |

### INTERDIT - Ne pas ajouter

| Colonne interdite | Systeme existant |
|-------------------|------------------|
| `products.cost_price` | `price_lists` + `price_list_items` |
| `products.price_ht` | `price_list_items.unit_price` |

### INTERDIT - Ne pas modifier sans consultation

Les **12 triggers stock** sont interdependants. Toujours lire [triggers.md](../database/triggers.md) avant modification.

## Workflow migrations

### Convention nommage
```
supabase/migrations/YYYYMMDD_NNN_description.sql
```

Exemple: `20251217_001_fix_commission_workflow.sql`

### Commandes
```bash
# Appliquer migrations (dev local)
supabase db push

# Generer types TypeScript
supabase gen types typescript --local > packages/@verone/types/src/supabase.ts

# Voir diff
supabase db diff
```

### Template migration
```sql
-- Migration: YYYYMMDD_NNN_description
-- Description: [Ce que fait la migration]
-- Author: [Nom]
-- Date: YYYY-MM-DD

BEGIN;

-- Votre SQL ici

COMMIT;
```

## Colonnes automatiques (triggers)

Ces colonnes sont calculees automatiquement, ne pas les modifier manuellement:

| Table | Colonne | Trigger |
|-------|---------|---------|
| `products` | `stock_quantity` | Calcule depuis `stock_real - reserved` |
| `products` | `stock_real` | Somme `stock_movements` |
| `products` | `stock_forecasted_in` | Somme `purchase_order_items` pending |
| `products` | `stock_forecasted_out` | Somme `sales_order_items` pending |
| `sales_orders` | `total_ht`, `total_ttc` | Somme items |
| `purchase_orders` | `total_ht`, `total_ttc` | Somme items |

## RLS (Row Level Security)

Toutes les tables ont RLS active. Roles:

| Role | Description |
|------|-------------|
| `owner` | Acces complet |
| `admin` | Acces complet sauf config |
| `catalog_manager` | Produits, categories |
| `sales` | Commandes, clients |
| `authenticated` | Base (lecture limitee) |

Voir [rls-policies.md](../database/rls-policies.md) pour details.

## Liens

- [Architecture](./02-architecture.md)
- [Auth](./04-auth.md) - Roles, permissions
- [Best practices](../database/best-practices.md) - Guide complet

---

*Derniere verification: 2025-12-17*
