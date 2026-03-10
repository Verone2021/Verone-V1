# Database Verone

**Derniere mise a jour:** 2026-01-09

PostgreSQL via Supabase Cloud.

---

## Vue d'Ensemble

| Element       | Nombre | Source de Verite            |
| ------------- | ------ | --------------------------- |
| Tables        | 78+    | `supabase/migrations/*.sql` |
| Triggers      | 158+   | `supabase/migrations/*.sql` |
| RLS Policies  | 239+   | `supabase/migrations/*.sql` |
| Fonctions RPC | 254+   | `supabase/migrations/*.sql` |
| Migrations    | 180+   | `supabase/migrations/`      |

**Project ID Supabase:** `aorroydfjsrygmosnzrl`

---

## Tables par Module

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

### LinkMe (8 tables)

- `linkme_affiliates` - Profils affilies
- `linkme_selections` - Mini-boutiques
- `linkme_selection_items` - Produits dans selections
- `linkme_orders`, `linkme_order_items` - Commandes
- `linkme_commissions` - Commissions
- `linkme_payment_requests` - Demandes paiement
- `user_app_roles` - Roles multi-app

---

## Regles Anti-Hallucination

### INTERDIT - Ne pas creer ces tables

| Table Interdite | Utiliser a la Place                                               |
| --------------- | ----------------------------------------------------------------- |
| `suppliers`     | `organisations WHERE type IN ('supplier', 'manufacturer')`        |
| `customers`     | `organisations WHERE type = 'customer'` ou `individual_customers` |

### INTERDIT - Ne pas ajouter ces colonnes

| Colonne Interdite     | Systeme Existant                   |
| --------------------- | ---------------------------------- |
| `products.cost_price` | `price_lists` + `price_list_items` |
| `products.price_ht`   | `price_list_items.unit_price`      |

### INTERDIT - Ne pas modifier sans consultation

Les **12 triggers stock** sont interdependants. Voir migrations `20251127_*` et `20251128_*`.

---

## Colonnes Calculees (Triggers)

Ces colonnes sont calculees automatiquement, ne pas modifier manuellement:

| Table             | Colonne                 | Source                  |
| ----------------- | ----------------------- | ----------------------- |
| `products`        | `stock_quantity`        | `stock_real - reserved` |
| `products`        | `stock_real`            | Somme `stock_movements` |
| `products`        | `stock_forecasted_in`   | Somme PO pending        |
| `products`        | `stock_forecasted_out`  | Somme SO pending        |
| `sales_orders`    | `total_ht`, `total_ttc` | Somme items             |
| `purchase_orders` | `total_ht`, `total_ttc` | Somme items             |

---

## Workflow Migrations

### Convention Nommage

```
supabase/migrations/YYYYMMDD_NNN_description.sql
```

Exemple: `20260109_001_fix_commission_workflow.sql`

### Commandes

```bash
# Appliquer migrations
supabase db push

# Generer types TypeScript (cloud)
supabase gen types typescript --linked > packages/@verone/types/src/supabase.ts

# Alternative : Via MCP Supabase (recommandé)
# Utiliser Claude Code : mcp__supabase__generate_typescript_types

# Voir diff
supabase db diff
```

### Template Migration

```sql
-- Migration: YYYYMMDD_NNN_description
-- Description: [Ce que fait la migration]
-- Author: [Nom]
-- Date: YYYY-MM-DD

BEGIN;

-- Votre SQL ici

COMMIT;
```

---

## RLS (Row Level Security)

Voir [security-auth.md](./security-auth.md) pour les details RLS.

---

_Source de verite: `supabase/migrations/`_
