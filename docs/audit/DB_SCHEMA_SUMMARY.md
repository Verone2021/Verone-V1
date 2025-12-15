# DB SCHEMA SUMMARY - Supabase Vérone

**Date** : 2025-12-15
**Source** : `apps/back-office/src/types/supabase.ts` + `supabase/migrations/`

---

## VUE D'ENSEMBLE

| Métrique           | Valeur      | Source                 |
| ------------------ | ----------- | ---------------------- |
| Tables             | ~78         | CLAUDE.md              |
| Triggers           | ~158        | CLAUDE.md              |
| RLS Policies       | ~239        | CLAUDE.md              |
| Migrations         | 73 fichiers | `supabase/migrations/` |
| Dernière migration | 2025-12-13  | Listing répertoire     |

**Projet Supabase** : `aorroydfjsrygmosnzrl` (unique pour DEV/PREVIEW/PROD)

---

## TABLES PRINCIPALES (Top 30)

### Core Business

| Table              | Description                 | Relations clés                 |
| ------------------ | --------------------------- | ------------------------------ |
| `products`         | Catalogue produits          | → variants, images, categories |
| `product_variants` | Variantes (couleur, taille) | → products, stock_movements    |
| `product_images`   | Images produits             | → products                     |
| `categories`       | Catégories produits         | → products (M2M)               |
| `collections`      | Collections curées          | → collection_products          |

### Orders & Stock

| Table                  | Description            | Relations clés                              |
| ---------------------- | ---------------------- | ------------------------------------------- |
| `sales_orders`         | Commandes clients      | → sales_order_items, customers              |
| `sales_order_items`    | Lignes commande        | → sales_orders, product_variants            |
| `purchase_orders`      | Commandes fournisseurs | → purchase_order_items, suppliers           |
| `purchase_order_items` | Lignes achat           | → purchase_orders, product_variants         |
| `stock_movements`      | Mouvements stock       | → product_variants, receptions, expeditions |
| `stock_alerts`         | Alertes stock bas      | → product_variants                          |

### Organizations & Users

| Table           | Description                      | Relations clés              |
| --------------- | -------------------------------- | --------------------------- |
| `organisations` | Organisations (multi-tenant)     | → user_profiles, contacts   |
| `user_profiles` | Profils utilisateurs             | → auth.users, organisations |
| `user_roles`    | Rôles utilisateurs               | → user_profiles             |
| `contacts`      | Contacts (clients, fournisseurs) | → organisations             |
| `customers`     | Clients B2B/B2C                  | → contacts, sales_orders    |
| `suppliers`     | Fournisseurs                     | → contacts, purchase_orders |

### Finance & Invoicing

| Table               | Description            | Relations clés               |
| ------------------- | ---------------------- | ---------------------------- |
| `invoices`          | Factures               | → sales_orders, customers    |
| `invoice_items`     | Lignes facture         | → invoices, product_variants |
| `bank_transactions` | Transactions bancaires | → bank_accounts              |
| `bank_accounts`     | Comptes bancaires      | → organisations              |
| `expenses`          | Dépenses               | → organisations              |

### LinkMe (Affiliation)

| Table                | Description         | Relations clés                    |
| -------------------- | ------------------- | --------------------------------- |
| `linkme_affiliates`  | Affiliés LinkMe     | → user_profiles                   |
| `linkme_selections`  | Sélections affiliés | → linkme_affiliates, products     |
| `linkme_commissions` | Commissions         | → linkme_affiliates, sales_orders |
| `linkme_catalog`     | Catalogue LinkMe    | → products                        |

### Pricing & Channels

| Table                 | Description     | Relations clés       |
| --------------------- | --------------- | -------------------- |
| `channel_pricing`     | Prix par canal  | → products, channels |
| `channel_price_lists` | Listes de prix  | → channels           |
| `price_tiers`         | Paliers de prix | → products           |

### Audit & System

| Table           | Description   | Relations clés  |
| --------------- | ------------- | --------------- |
| `audit_logs`    | Logs d'audit  | → user_profiles |
| `notifications` | Notifications | → user_profiles |
| `bug_reports`   | Rapports bugs | → user_profiles |
| `mcp_tasks`     | Tâches MCP    | -               |

---

## ENUMS PRINCIPAUX

**Source** : `apps/back-office/src/types/supabase.ts` (section Enums)

| Enum                     | Valeurs                                  | Usage                  |
| ------------------------ | ---------------------------------------- | ---------------------- |
| `bank_provider`          | qonto, bridge, ...                       | Intégrations bancaires |
| `client_type`            | b2b, b2c                                 | Type client            |
| `availability_type_enum` | in_stock, out_of_stock, preorder         | Disponibilité          |
| `order_status`           | draft, pending, validated, ...           | Statut commandes       |
| `purchase_order_status`  | draft, pending, validated, received, ... | Statut achats          |
| `sales_order_status`     | draft, pending, validated, shipped, ...  | Statut ventes          |
| `stock_movement_type`    | in, out, adjustment                      | Type mouvement         |
| `user_role`              | owner, admin, employee, affiliate        | Rôles utilisateurs     |

---

## VUES PRINCIPALES

| Vue                  | Description                   |
| -------------------- | ----------------------------- |
| `v_users_with_roles` | Utilisateurs avec leurs rôles |
| `v_linkme_users`     | Utilisateurs LinkMe           |
| `v_stock_levels`     | Niveaux de stock calculés     |
| `v_product_catalog`  | Catalogue produits enrichi    |

---

## TRIGGERS CRITIQUES

### Stock Management

| Trigger                              | Table              | Action                        |
| ------------------------------------ | ------------------ | ----------------------------- |
| `trg_stock_movement_update_quantity` | `stock_movements`  | Mise à jour stock automatique |
| `trg_reception_create_movements`     | `receptions`       | Créé mouvements entrée        |
| `trg_expedition_create_movements`    | `expeditions`      | Créé mouvements sortie        |
| `trg_stock_alert_check`              | `product_variants` | Vérifie seuils alertes        |

### Order Lifecycle

| Trigger                       | Table             | Action              |
| ----------------------------- | ----------------- | ------------------- |
| `trg_sales_order_validate`    | `sales_orders`    | Validation commande |
| `trg_purchase_order_validate` | `purchase_orders` | Validation achat    |
| `trg_invoice_generate`        | `sales_orders`    | Génération facture  |

### Audit

| Trigger                | Table    | Action            |
| ---------------------- | -------- | ----------------- |
| `trg_audit_log_insert` | Multiple | Log modifications |

---

## RLS POLICIES (Principes)

### Pattern Multi-Tenant

```sql
-- Toutes les tables avec organisation_id
CREATE POLICY "Users can only see their organisation data"
ON table_name
FOR ALL
USING (organisation_id = auth.jwt() ->> 'organisation_id');
```

### Pattern Role-Based

```sql
-- Tables sensibles
CREATE POLICY "Only owners and admins"
ON sensitive_table
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('owner', 'admin')
  )
);
```

### Tables avec RLS

| Table             | Policy Type                |
| ----------------- | -------------------------- |
| `products`        | Organisation + Public read |
| `sales_orders`    | Organisation only          |
| `user_profiles`   | Self + Organisation        |
| `stock_movements` | Organisation only          |
| `invoices`        | Organisation only          |

**Fichiers définition** :

- `supabase/migrations/` (dans les migrations SQL)
- `docs/database/rls-policies.md` (documentation)

---

## MIGRATIONS RÉCENTES (Nov-Dec 2025)

| Migration                                                 | Description                         |
| --------------------------------------------------------- | ----------------------------------- |
| `20251124_001_trigger_delete_reception_reverse_stock.sql` | Rollback stock sur delete réception |
| `20251124_005_fix_stock_movements_reference_type.sql`     | Fix type référence mouvements       |
| `20251127_002_reactivate_critical_triggers.sql`           | Réactivation triggers critiques     |
| `20251128_009_audit_disabled_triggers_cleanup.sql`        | Cleanup triggers désactivés         |
| `20251128_010_prevent_direct_cancellation.sql`            | Empêche annulation directe          |

**Total** : 73 migrations dans `supabase/migrations/`

---

## FONCTIONS RPC IMPORTANTES

| Fonction                                | Usage                        |
| --------------------------------------- | ---------------------------- |
| `calculate_stock_forecasted`            | Calcul stock prévisionnel    |
| `calculate_price_ttc`                   | Calcul prix TTC              |
| `create_purchase_order`                 | Création commande achat      |
| `create_sales_order_forecast_movements` | Mouvements prévisionnels     |
| `check_orders_stock_consistency`        | Vérification cohérence stock |

---

## DIAGRAMME RELATIONS SIMPLIFIÉ

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│ organisations│◄──────│ user_profiles│──────►│  user_roles │
└─────┬───────┘       └──────────────┘       └─────────────┘
      │
      ├─────────────────────────────────────────────────────┐
      │                                                     │
      ▼                                                     ▼
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  customers  │◄──────│ sales_orders │──────►│sales_order_ │
│             │       │              │       │   items     │
└─────────────┘       └──────────────┘       └──────┬──────┘
                                                    │
┌─────────────┐       ┌──────────────┐             │
│  suppliers  │◄──────│purchase_orders│             │
│             │       │              │             ▼
└─────────────┘       └──────────────┘       ┌─────────────┐
                             │               │  products   │
                             ▼               │             │
                      ┌──────────────┐       └──────┬──────┘
                      │purchase_order│              │
                      │   _items     │              │
                      └──────┬───────┘              │
                             │                      │
                             ▼                      ▼
                      ┌──────────────────────────────┐
                      │      product_variants        │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │       stock_movements        │
                      └──────────────────────────────┘
```

---

## COMMANDES UTILES

```bash
# Générer types Supabase
supabase gen types typescript --local > apps/back-office/src/types/supabase.ts

# Voir migrations
ls -la supabase/migrations/

# Appliquer migrations
supabase db push

# Reset local (DANGER)
supabase db reset
```

---

**Note** : Ce résumé est partiel. Pour le schéma complet, consulter `docs/database/SCHEMA-REFERENCE.md`.
