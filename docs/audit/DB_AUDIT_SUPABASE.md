# DB_AUDIT_SUPABASE.md - Audit Base de Données Supabase

**Date** : 2025-12-15
**Scope** : Vérone V1 - Supabase PostgreSQL
**Mode** : READ-ONLY Audit

---

## 1. Ce qui est en place

### Vue d'ensemble

| Métrique        | Valeur        | Source                                   |
| --------------- | ------------- | ---------------------------------------- |
| Migrations      | 75 fichiers   | `ls supabase/migrations/ \| wc -l`       |
| Tables          | ~78           | Types générés + CLAUDE.md                |
| Views           | 8             | supabase.ts (Views section)              |
| Enums           | 38            | supabase.ts (Enums section)              |
| Functions (RPC) | 50+           | supabase.ts (Functions section)          |
| Triggers        | 32+           | `grep CREATE TRIGGER`                    |
| RLS Policies    | 30+           | `grep CREATE POLICY`                     |
| Types générés   | 10,002 lignes | `apps/back-office/src/types/supabase.ts` |

### Tables Principales (Top 30 par usage)

**Tables les plus requêtées (back-office)** :

| Table                    | Requêtes | Domaine      |
| ------------------------ | -------- | ------------ |
| `products`               | 38       | Catalogue    |
| `linkme_affiliates`      | 35       | LinkMe       |
| `organisations`          | 34       | Contacts     |
| `linkme_selections`      | 26       | LinkMe       |
| `user_profiles`          | 20       | Auth         |
| `channel_pricing`        | 20       | Tarification |
| `linkme_commissions`     | 13       | LinkMe       |
| `linkme_selection_items` | 12       | LinkMe       |
| `enseignes`              | 12       | Contacts     |
| `sales_channels`         | 11       | Canaux       |

**Tables les plus requêtées (LinkMe)** :

| Table                     | Requêtes | Opérations                 |
| ------------------------- | -------- | -------------------------- |
| `linkme_selection_items`  | 10       | CRUD complet               |
| `linkme_selections`       | 8        | SELECT, INSERT, UPDATE     |
| `linkme_commissions`      | 7        | SELECT, COUNT              |
| `product_images`          | 6        | SELECT (is_primary)        |
| `linkme_payment_requests` | 6        | SELECT                     |
| `linkme_affiliates`       | 5        | SELECT, SINGLE             |
| `channel_pricing`         | 5        | SELECT (LINKME_CHANNEL_ID) |

### Relations Clés (Foreign Keys)

```sql
-- Produits & Catalogue
product_images.product_id → products(id) ON DELETE CASCADE
product_colors.product_id → products(id)
collection_products.product_id → products(id)

-- LinkMe
linkme_affiliates.user_id → auth.users(id)
linkme_affiliates.enseigne_id → enseignes(id)
linkme_affiliates.organisation_id → organisations(id)
linkme_selections.affiliate_id → linkme_affiliates(id)
linkme_selection_items.selection_id → linkme_selections(id)
linkme_commissions.affiliate_id → linkme_affiliates(id)
linkme_payment_request_items.commission_id → linkme_commissions(id)

-- Commandes
sales_orders.customer_id → organisations(id) / individual_customers(id)
purchase_orders.supplier_id → organisations(id)
```

### Enums Majeurs

```typescript
// Statuts commandes
purchase_order_status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'received' | 'cancelled'
sales_order_status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

// Produits
product_status_type: 'draft' | 'active' | 'discontinued' | 'archived'
stock_status_type: 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order'

// Mouvements stock
movement_type: 'in' | 'out' | 'adjustment' | 'reservation' | 'transfer'
stock_reason_code: 'purchase' | 'sale' | 'return' | 'adjustment' | 'inventory'

// Utilisateurs
user_role_type: 'admin' | 'staff' | 'viewer' | 'enseigne_admin' | 'org_independante' | ...
organisation_type: 'supplier' | 'customer' | 'partner' | 'internal'
```

---

## 2. RLS Policies - Couverture

### Policies Identifiées

```sql
-- User Profiles
"user_profiles_insert_admin_back_office"

-- Sales Orders
"Staff can insert sales_order_items"
"Partners can insert sales_order_items for their organisation"

-- LinkMe Catalog
linkme_catalog_products_staff_all ON linkme_catalog_products
linkme_catalog_products_public_read ON linkme_catalog_products
linkme_catalog_products_anon_read ON linkme_catalog_products

-- LinkMe Selections
linkme_selections_staff_all ON linkme_selections
linkme_selections_affiliate_select ON linkme_selections
linkme_selections_affiliate_insert ON linkme_selections
linkme_selections_affiliate_update ON linkme_selections
linkme_selections_affiliate_delete ON linkme_selections
linkme_selections_public_read ON linkme_selections

-- LinkMe Selection Items
linkme_selection_items_staff_all ON linkme_selection_items
linkme_selection_items_affiliate_select ON linkme_selection_items
linkme_selection_items_affiliate_insert ON linkme_selection_items
linkme_selection_items_affiliate_update ON linkme_selection_items
linkme_selection_items_affiliate_delete ON linkme_selection_items
linkme_selection_items_public_read ON linkme_selection_items

-- User App Roles
"Admins can view all user_app_roles"
"Users can view their own roles"
"Enseigne admins can view their enseigne roles"
"Admins can insert/update/delete user_app_roles"
"Enseigne admins can insert/update roles for their enseigne"
```

### Tables Sensibles - État RLS

| Table                    | RLS Enabled | Policies         | Risque                                            |
| ------------------------ | ----------- | ---------------- | ------------------------------------------------- |
| `products`               | ?           | NON CONFIRMÉ     | Moyen - données publiques mais édition restreinte |
| `organisations`          | ?           | NON CONFIRMÉ     | Élevé - données clients/fournisseurs              |
| `user_profiles`          | ✅          | Oui              | Bas                                               |
| `linkme_affiliates`      | ?           | NON CONFIRMÉ     | Élevé - isolation affiliés                        |
| `linkme_selections`      | ✅          | Oui (6 policies) | Bas                                               |
| `linkme_selection_items` | ✅          | Oui (6 policies) | Bas                                               |
| `linkme_commissions`     | ?           | NON CONFIRMÉ     | Élevé - données financières                       |
| `sales_orders`           | ?           | NON CONFIRMÉ     | Élevé - commandes clients                         |
| `purchase_orders`        | ?           | NON CONFIRMÉ     | Moyen - commandes fournisseurs                    |
| `channel_pricing`        | ?           | NON CONFIRMÉ     | Moyen - tarification par canal                    |

---

## 3. Risques / Dettes

### Risques Identifiés

| #   | Risque                                   | Gravité | Impact                           | Recommandation                   |
| --- | ---------------------------------------- | ------- | -------------------------------- | -------------------------------- |
| 1   | RLS non vérifié sur `linkme_commissions` | Élevé   | Accès cross-affilié possible     | Audit + policy SELECT            |
| 2   | RLS non vérifié sur `channel_pricing`    | Élevé   | Filtrage client-side dans LinkMe | Policy SELECT par canal/enseigne |
| 3   | 75 migrations à auditer                  | Moyen   | Dettes potentielles              | Audit triggers + constraints     |
| 4   | Colonnes JSON non typées                 | Moyen   | Validation faible                | Ajouter CHECK constraints        |
| 5   | Indexes manquants probables              | Moyen   | Performance queries              | Analyser EXPLAIN plans           |

### Points de Fragilité DB

**Triggers complexes** (32+ définis) :

- Stock movements (insert/update/delete)
- Purchase order validation
- Sales order status changes
- Commission calculations
- Alert tracking

**Risque cascade** : Un trigger mal configuré peut bloquer des opérations métier.

### Colonnes JSON

Tables avec colonnes JSON (validation faible) :

- `products.specifications` (JSON)
- `audit_logs.old_data`, `new_data` (JSON)
- `abby_sync_queue.abby_payload` (JSON)
- `abby_webhook_events.event_data` (JSON)

---

## 4. Data Readiness - Checklist Seed Minimal

### Ordre de Seed (Dépendances Respectées)

```
1. organisations (fournisseur test)
   └── 1 row : { name: "Fournisseur Test", type: "supplier" }

2. categories (hiérarchie)
   └── 3 rows : Mobilier > Chaises > Chaises de bureau

3. products (avec fournisseur)
   └── 3 rows : { name, sku, cost_price, stock_quantity, organisation_id, category_id }

4. product_images (images primaires)
   └── 3 rows : { product_id, url, is_primary: true }

5. channel_pricing (tarifs LinkMe)
   └── 3 rows : { product_id, channel_id: LINKME_CHANNEL_ID, price_ht, margin }

6. enseignes (enseigne test)
   └── 1 row : { name: "Enseigne Test", slug: "enseigne-test" }

7. user (via Supabase Auth)
   └── 1 user : { email: "test@verone.fr", password: "..." }

8. user_app_roles (rôle LinkMe)
   └── 1 row : { user_id, app: "linkme", role: "enseigne_admin", enseigne_id }

9. linkme_affiliates (affilié test)
   └── 1 row : { user_id, enseigne_id, slug: "enseigne-test" }

10. linkme_selections (sélection test)
    └── 1 row : { affiliate_id, name: "Ma Sélection", slug: "ma-selection" }
```

### Seed Script Recommandé

```sql
-- 1. Fournisseur test
INSERT INTO organisations (id, legal_name, type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Fournisseur Test', 'supplier');

-- 2. Catégorie test
INSERT INTO categories (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Mobilier', 'mobilier');

-- 3. Produits test
INSERT INTO products (id, name, sku, cost_price, stock_quantity, status, organisation_id) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Chaise Bureau A', 'SKU-001', 50.00, 10, 'active', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000102', 'Table Réunion B', 'SKU-002', 150.00, 5, 'active', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000103', 'Lampe Design C', 'SKU-003', 30.00, 20, 'active', '00000000-0000-0000-0000-000000000001');

-- 4. Channel pricing pour LinkMe
INSERT INTO channel_pricing (product_id, channel_id, price_ht, margin_rate) VALUES
  ('00000000-0000-0000-0000-000000000101', '93c68db1-5a30-4168-89ec-6383152be405', 75.00, 0.50),
  ('00000000-0000-0000-0000-000000000102', '93c68db1-5a30-4168-89ec-6383152be405', 225.00, 0.50),
  ('00000000-0000-0000-0000-000000000103', '93c68db1-5a30-4168-89ec-6383152be405', 45.00, 0.50);
```

---

## 5. Preuves

### Commandes Exécutées

```bash
# Migrations
ls supabase/migrations/ | wc -l → 75
ls supabase/migrations/ | tail -20 → (dernières migrations Nov-Dec 2025)

# Types générés
wc -l apps/back-office/src/types/supabase.ts → 10002

# Tables
grep -E "Tables:\s*\{" -A 5000 supabase.ts | grep "Row:" | wc -l → ~78

# RLS Policies
grep -h "CREATE POLICY" supabase/migrations/*.sql | head -30

# Triggers
grep -h "CREATE TRIGGER" supabase/migrations/*.sql | wc -l → 32

# Foreign Keys
grep -h "REFERENCES" supabase/migrations/*.sql | head -20
```

### Fichiers Référencés

- `supabase/migrations/*.sql` : 75 fichiers migration
- `apps/back-office/src/types/supabase.ts` : Types générés (10002 lignes)
- `supabase/config.toml` : Configuration Supabase locale

---

## 6. Décisions à prendre

### Decision 1: Audit RLS Complet

**Options** :

1. **Audit manuel** - Lire chaque policy dans les migrations
2. **Script automatisé** - `psql` + query système `pg_policies`
3. **Dashboard Supabase** - Vérifier visuellement

**Recommandation** : Option 2 (script) pour exhaustivité + traçabilité.

```sql
-- Query pour lister toutes les policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Decision 2: Indexes Performance

**Tables à analyser prioritairement** :

- `products` (requêtes fréquentes, filtres multiples)
- `channel_pricing` (JOIN avec products)
- `linkme_commissions` (agrégations par période)
- `stock_movements` (historique, filtres date)

**Recommandation** : Exécuter `EXPLAIN ANALYZE` sur les queries critiques du dashboard.

---

**Dernière mise à jour** : 2025-12-15 13:20 UTC+1
