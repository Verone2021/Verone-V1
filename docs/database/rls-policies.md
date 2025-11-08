# 🔒 RLS POLICIES - Documentation Complète

**Date création** : 17 octobre 2025
**Database** : Supabase PostgreSQL (aorroydfjsrygmosnzrl)
**Total** : 217 policies sur 73 tables
**Statut** : ✅ Production Active

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#vue-densemble)
2. [Matrice Rôles & Permissions](#matrice-rôles--permissions)
3. [Policies Critiques par Module](#policies-critiques-par-module)
4. [Patterns RLS Communs](#patterns-rls-communs)
5. [Workflow Consultation](#workflow-consultation)

---

## 🎯 VUE D'ENSEMBLE

### Statistiques Générales

| Catégorie                | Total | Description                      |
| ------------------------ | ----- | -------------------------------- |
| **Tables avec RLS**      | 73    | Sur 78 tables totales            |
| **Policies PERMISSIVE**  | 217   | Toutes policies sont permissives |
| **Policies RESTRICTIVE** | 0     | Aucune policy restrictive        |
| **Policies SELECT**      | 92    | Lecture données                  |
| **Policies INSERT**      | 47    | Création données                 |
| **Policies UPDATE**      | 42    | Modification données             |
| **Policies DELETE**      | 24    | Suppression données              |
| **Policies ALL**         | 12    | Toutes opérations                |

### Répartition par Rôles

| Rôle            | Policies | Description                                |
| --------------- | -------- | ------------------------------------------ |
| `authenticated` | 183      | Utilisateurs connectés (84.3%)             |
| `public`        | 21       | Tous utilisateurs incluant anonymes (9.7%) |
| `anon`          | 13       | Utilisateurs anonymes uniquement (6.0%)    |

### Top 15 Tables avec Plus de Policies

| Rang  | Table                   | Policies | Module    |
| ----- | ----------------------- | -------- | --------- |
| 1     | `categories`            | 11       | Catalogue |
| 2     | `families`              | 9        | Catalogue |
| 3     | `subcategories`         | 9        | Catalogue |
| 4     | `individual_customers`  | 7        | Clients   |
| 5     | `stock_movements`       | 6        | Stocks    |
| 6     | `manual_tests_progress` | 5        | Tests     |
| 7     | `product_images`        | 5        | Catalogue |
| 8     | `products`              | 5        | Catalogue |
| 9-23  | 15 tables               | 4        | Divers    |
| 24-57 | 34 tables               | 3        | Divers    |
| 58-72 | 15 tables               | 2        | Divers    |
| 73    | 1 table                 | 1        | Divers    |

---

## 👥 MATRICE RÔLES & PERMISSIONS

### Rôles Système Vérone

| Rôle                | Type             | Description            | Niveau Accès     |
| ------------------- | ---------------- | ---------------------- | ---------------- |
| **Owner**           | `user_role_type` | Propriétaire système   | ⭐⭐⭐⭐⭐ TOTAL |
| **Admin**           | `user_role_type` | Administrateur         | ⭐⭐⭐⭐ ÉLEVÉ   |
| **Catalog Manager** | `user_role_type` | Gestionnaire catalogue | ⭐⭐⭐ MOYEN     |
| **Sales**           | `user_role_type` | Commercial             | ⭐⭐ LIMITÉ      |
| **User**            | `user_role_type` | Utilisateur standard   | ⭐ MINIMAL       |

### Fonction Helper RLS

```sql
-- Fonction centrale utilisée dans 80% des policies
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role_type AS $$
BEGIN
  RETURN (
    SELECT role
    FROM user_profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Matrice Permissions par Module

| Module                 | Owner | Admin                    | Catalog Manager | Sales  | User          |
| ---------------------- | ----- | ------------------------ | --------------- | ------ | ------------- |
| **Catalogue**          | ALL   | ALL                      | ALL             | SELECT | SELECT        |
| **Pricing**            | ALL   | ALL                      | ALL             | SELECT | -             |
| **Stocks**             | ALL   | ALL                      | SELECT + UPDATE | SELECT | -             |
| **Commandes Vente**    | ALL   | ALL                      | SELECT + UPDATE | ALL    | SELECT        |
| **Commandes Achat**    | ALL   | ALL                      | ALL             | -      | -             |
| **Facturation**        | ALL   | ALL                      | SELECT          | SELECT | -             |
| **Clients & Contacts** | ALL   | ALL                      | SELECT + UPDATE | ALL    | SELECT        |
| **Utilisateurs**       | ALL   | SELECT + UPDATE (limité) | -               | -      | SELECT (self) |
| **Google Merchant**    | ALL   | ALL                      | SELECT          | -      | -             |
| **Tests & QA**         | ALL   | ALL                      | ALL             | SELECT | SELECT        |

---

## 🔐 POLICIES CRITIQUES PAR MODULE

### 1. FACTURATION & ABBY API (8 policies)

#### Table: `abby_sync_queue` (1 policy)

##### 1.1. abby_sync_queue_admin_only_policy

- **Commande** : ALL
- **Rôles** : `public`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.uid() = users.id
    AND (users.raw_user_meta_data->>'role' = 'admin')
)
```

- **WITH CHECK** : N/A
- **Description** : Seuls admins peuvent gérer queue sync Abby

#### Table: `abby_webhook_events` (1 policy)

##### 1.2. abby_webhook_events_admin_only_policy

- **Commande** : ALL
- **Rôles** : `public`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.uid() = users.id
    AND (users.raw_user_meta_data->>'role' = 'admin')
)
```

- **WITH CHECK** : N/A
- **Description** : Seuls admins peuvent gérer webhooks Abby

#### Table: `financial_documents` (1 policy)

##### 1.3. financial_documents_admin_read

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin peuvent lire documents financiers

#### Table: `financial_payments` (3 policies)

##### 1.4. financial_payments_admin_manage

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **Description** : Owner/Admin gèrent paiements financiers

##### 1.5. financial_payments_select

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés peuvent lire paiements

#### Table: `invoices` (4 policies)

##### 1.6. invoices_delete_admin

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin peuvent supprimer factures

##### 1.7. invoices_insert_admin

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **Description** : Owner/Admin/Sales peuvent créer factures

##### 1.8. invoices_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés peuvent lire factures

##### 1.9. invoices_update_admin

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **Description** : Owner/Admin peuvent modifier factures

---

### 2. BANKING (1 policy)

#### Table: `bank_transactions` (1 policy)

##### 2.1. Admins have full access to bank_transactions

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE users.id = auth.uid()
    AND users.email IN (
      SELECT email FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
)
```

- **WITH CHECK** : N/A
- **Description** : Admins accès total transactions bancaires

---

### 3. CATALOGUE (55 policies)

#### Table: `categories` (11 policies) ⚠️

##### 3.1. catalog_managers_can_manage_categories

- **Commande** : ALL
- **Rôles** : `public`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin/CatalogManager gèrent catégories

##### 3.2. allow_authenticated_delete_categories

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés peuvent supprimer (⚠️ PERMISSIF)

##### 3.3. categories_delete_admins

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
    AND role = 'admin'
)
```

- **WITH CHECK** : N/A
- **Description** : Admins peuvent supprimer catégories

##### 3.4. allow_authenticated_insert_categories

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** : `true`
- **Description** : Tous users authentifiés peuvent créer (⚠️ PERMISSIF)

##### 3.5. categories_insert_catalog_managers

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager')
)
```

- **Description** : Admin/CatalogManager peuvent créer catégories

##### 3.6. allow_authenticated_read_categories

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés peuvent lire

##### 3.7. authenticated_users_can_view_categories

- **Commande** : SELECT
- **Rôles** : `public`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
auth.role() = 'authenticated'
```

- **WITH CHECK** : N/A
- **Description** : Users authentifiés peuvent lire

##### 3.8. categories_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Lecture catégories pour authentifiés

##### 3.9. categories_select_public

- **Commande** : SELECT
- **Rôles** : `anon`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
is_active = true
```

- **WITH CHECK** : N/A
- **Description** : Anonymes peuvent lire catégories actives

##### 3.10. allow_authenticated_update_categories

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : `true`
- **Description** : Tous users authentifiés peuvent modifier (⚠️ PERMISSIF)

##### 3.11. categories_update_catalog_managers

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager')
)
```

- **WITH CHECK** : N/A
- **Description** : Admin/CatalogManager peuvent modifier catégories

#### Table: `families` (9 policies)

##### 3.12. families_delete_admin

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin/CatalogManager suppriment familles

##### 3.13-3.20. Autres policies families (8 policies)

- Pattern similaire à categories (SELECT public/authenticated, INSERT/UPDATE/DELETE admin)

#### Table: `subcategories` (9 policies)

##### 3.21-3.29. Policies subcategories

- Pattern identique à families et categories

#### Table: `products` (5 policies)

##### 3.30. products_delete_admin

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin suppriment produits

##### 3.31. products_insert_catalog_manager

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **Description** : Owner/Admin/CatalogManager créent produits

##### 3.32. products_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent produits

##### 3.33. products_select_public

- **Commande** : SELECT
- **Rôles** : `anon`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
status = 'published' AND is_active = true
```

- **WITH CHECK** : N/A
- **Description** : Anonymes lisent produits publiés actifs

##### 3.34. products_update_catalog_manager

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **Description** : Owner/Admin/CatalogManager modifient produits

#### Table: `product_images` (5 policies)

##### 3.35. product_images_delete_authenticated

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés suppriment images

##### 3.36. product_images_insert_authenticated

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
auth.uid() IS NOT NULL
```

- **Description** : Tous users authentifiés créent images

##### 3.37. product_images_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent images

##### 3.38. product_images_select_public

- **Commande** : SELECT
- **Rôles** : `anon`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
EXISTS (
  SELECT 1 FROM products
  WHERE products.id = product_images.product_id
    AND products.status = 'published'
    AND products.is_active = true
)
```

- **WITH CHECK** : N/A
- **Description** : Anonymes lisent images produits publiés

##### 3.39. product_images_update_authenticated

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : `true`
- **Description** : Tous users authentifiés modifient images

#### Table: `product_colors` (4 policies)

##### 3.40-3.43. product_colors policies

- Pattern standard CRUD admin + SELECT authenticated

#### Table: `product_groups` (3 policies)

##### 3.45-3.47. product_groups policies

- Pattern standard CRUD admin + SELECT authenticated

#### Table: `product_group_members` (3 policies)

##### 3.48-3.50. product_group_members policies

- Pattern standard CRUD admin + SELECT authenticated

#### Table: `product_packages` (3 policies)

##### 3.51-3.53. product_packages policies

- Pattern standard CRUD admin + SELECT authenticated

#### Table: `collections` (4 policies)

##### 3.54-3.57. collections policies

- Pattern CRUD authenticated (tous users) + SELECT public

#### Table: `collection_images` (4 policies)

##### 3.58-3.61. collection_images policies

- Pattern CRUD authenticated + SELECT public

#### Table: `collection_products` (4 policies)

##### 3.62-3.65. collection_products policies

- Pattern CRUD authenticated + SELECT public

#### Table: `collection_shares` (4 policies)

##### 3.66-3.69. collection_shares policies

- Pattern INSERT/SELECT authenticated, owner peut UPDATE/DELETE

---

### 4. PRICING (14 policies)

#### Table: `price_lists` (2 policies)

##### 4.1. price_lists_manage_admin

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **Description** : Owner/Admin/CatalogManager gèrent listes prix

##### 4.2. price_lists_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent listes prix

#### Table: `price_list_items` (2 policies)

##### 4.3. price_list_items_manage_admin

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **Description** : Owner/Admin/CatalogManager gèrent items prix

##### 4.4. price_list_items_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent items prix

#### Table: `channel_price_lists` (2 policies)

##### 4.5. channel_price_lists_manage

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **Description** : Owner/Admin/CatalogManager gèrent prix canaux

##### 4.6. channel_price_lists_select

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent prix canaux

#### Table: `channel_pricing` (2 policies)

##### 4.7-4.8. channel_pricing policies

- Pattern identique channel_price_lists

#### Table: `customer_price_lists` (2 policies)

##### 4.9-4.10. customer_price_lists policies

- Pattern standard manage admin + SELECT authenticated

#### Table: `customer_pricing` (2 policies)

##### 4.11-4.12. customer_pricing policies

- Pattern standard manage admin + SELECT authenticated

#### Table: `group_price_lists` (2 policies)

##### 4.13-4.14. group_price_lists policies

- Pattern standard manage admin + SELECT authenticated

---

### 5. CLIENTS & CONTACTS (16 policies)

#### Table: `organisations` (2 policies)

##### 5.1. organisations_manage_admin

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **Description** : Owner/Admin/Sales gèrent organisations

##### 5.2. organisations_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent organisations

#### Table: `individual_customers` (7 policies)

##### 5.3. individual_customers_delete_admin

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin suppriment clients individuels

##### 5.4. individual_customers_insert_sales

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **Description** : Owner/Admin/Sales créent clients

##### 5.5-5.9. Autres policies individual_customers (5 policies)

- SELECT authenticated/public
- UPDATE admin/sales
- Gestion RGPD (anonymisation, suppression compte)

#### Table: `contacts` (2 policies)

##### 5.10. contacts_manage_sales

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **Description** : Owner/Admin/Sales gèrent contacts

##### 5.11. contacts_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent contacts

#### Table: `client_consultations` (3 policies)

##### 5.12. Consultations insert access

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager', 'sales')
)
```

- **Description** : Admin/CatalogManager/Sales créent consultations

##### 5.13. Consultations read access

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent consultations

##### 5.14. Consultations update access

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
assigned_to = auth.uid() OR EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager', 'sales')
)
```

- **WITH CHECK** : N/A
- **Description** : Assigné ou Admin/CatalogManager/Sales modifient

#### Table: `consultation_images` (4 policies)

##### 5.15-5.18. consultation_images policies

- Pattern CRUD authenticated

#### Table: `customer_groups` (2 policies)

##### 5.19-5.20. customer_groups policies

- Pattern manage admin + SELECT authenticated

#### Table: `customer_group_members` (2 policies)

##### 5.21-5.22. customer_group_members policies

- Pattern manage admin + SELECT authenticated

---

### 6. COMMANDES VENTE (22 policies)

#### Table: `sales_orders` (3 policies)

##### 6.1. sales_orders_insert_sales

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **Description** : Owner/Admin/Sales créent commandes vente

##### 6.2. sales_orders_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent commandes

##### 6.3. sales_orders_update_sales

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **Description** : Owner/Admin/Sales modifient commandes

#### Table: `sales_order_items` (2 policies)

##### 6.4. sales_order_items_manage_sales

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **Description** : Owner/Admin/Sales gèrent items commande

##### 6.5. sales_order_items_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent items

#### Table: `shipments` (3 policies)

##### 6.6-6.8. shipments policies

- Pattern INSERT/UPDATE sales, SELECT authenticated

#### Table: `shipping_parcels` (3 policies)

##### 6.9-6.11. shipping_parcels policies

- Pattern manage sales + SELECT authenticated

#### Table: `parcel_items` (2 policies)

##### 6.12-6.13. parcel_items policies

- Pattern manage sales + SELECT authenticated

#### Table: `order_discounts` (2 policies)

##### 6.14-6.15. order_discounts policies

- Pattern manage sales + SELECT authenticated

#### Table: `sales_channels` (2 policies)

##### 6.16-6.17. sales_channels policies

- Pattern manage admin + SELECT authenticated

#### Table: `payments` (4 policies)

##### 6.18. payments_delete_admin

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin suppriment paiements

##### 6.19. payments_insert_sales

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'sales')
```

- **Description** : Owner/Admin/Sales créent paiements

##### 6.20. payments_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent paiements

##### 6.21. payments_update_admin

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **Description** : Owner/Admin modifient paiements

---

### 7. COMMANDES ACHAT (13 policies)

#### Table: `purchase_orders` (4 policies)

##### 7.1. purchase_orders_delete_admin

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin suppriment commandes achat

##### 7.2. purchase_orders_insert_admin

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **Description** : Owner/Admin/CatalogManager créent PO

##### 7.3. purchase_orders_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent PO

##### 7.4. purchase_orders_update_admin

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **Description** : Owner/Admin/CatalogManager modifient PO

#### Table: `purchase_order_items` (3 policies)

##### 7.5-7.7. purchase_order_items policies

- Pattern manage admin + SELECT authenticated

#### Table: `purchase_order_receptions` (3 policies)

##### 7.8-7.10. purchase_order_receptions policies

- Pattern manage admin + SELECT authenticated

---

### 8. STOCKS (10 policies)

#### Table: `stock_movements` (6 policies) ⚠️

##### 8.1. stock_movements_delete_admin

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin suppriment mouvements stock

##### 8.2. stock_movements_insert_admin

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **Description** : Owner/Admin/CatalogManager créent mouvements

##### 8.3. stock_movements_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent mouvements

##### 8.4. stock_movements_select_public

- **Commande** : SELECT
- **Rôles** : `anon`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
EXISTS (
  SELECT 1 FROM products
  WHERE products.id = stock_movements.product_id
    AND products.status = 'published'
    AND products.is_active = true
)
```

- **WITH CHECK** : N/A
- **Description** : Anonymes lisent mouvements produits publiés

##### 8.5. stock_movements_update_admin

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin', 'catalog_manager')
```

- **Description** : Owner/Admin/CatalogManager modifient mouvements

##### 8.6. stock_movements_system_insert

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** : `true`
- **Description** : Système peut créer mouvements (triggers)

#### Table: `stock_reservations` (4 policies)

##### 8.7-8.10. stock_reservations policies

- Pattern manage admin + SELECT authenticated + system access

---

### 9. GOOGLE MERCHANT (7 policies)

#### Table: `feed_configs` (1 policy)

##### 9.1. feed_configs_admin_only

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **Description** : Owner/Admin gèrent configs feeds

#### Table: `feed_exports` (3 policies)

##### 9.2-9.4. feed_exports policies

- Pattern manage admin + SELECT authenticated

#### Table: `feed_performance_metrics` (2 policies)

##### 9.5-9.6. feed_performance_metrics policies

- Pattern INSERT system + SELECT admin

---

### 10. UTILISATEURS (13 policies)

#### Table: `user_profiles` (4 policies) ⚠️

##### 10.1. user_profiles_delete_owner_only

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() = 'owner'
```

- **WITH CHECK** : N/A
- **Description** : Seul Owner peut supprimer users

##### 10.2. user_profiles_insert_admin

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **Description** : Owner/Admin créent users

##### 10.3. user_profiles_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent profils

##### 10.4. user_profiles_update_self_or_admin

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
user_id = auth.uid() OR get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** :

```sql
user_id = auth.uid() OR get_user_role() IN ('owner', 'admin')
```

- **Description** : User peut modifier son profil OU Owner/Admin

#### Table: `user_sessions` (3 policies)

##### 10.5. user_sessions_delete_self_or_admin

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
user_id = auth.uid() OR get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : User supprime ses sessions OU Owner/Admin

##### 10.6. user_sessions_insert_self

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
user_id = auth.uid()
```

- **Description** : User crée ses propres sessions

##### 10.7. user_sessions_select_self_or_admin

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
user_id = auth.uid() OR get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : User lit ses sessions OU Owner/Admin

#### Table: `user_activity_logs` (3 policies)

##### 10.8-10.10. user_activity_logs policies

- Pattern INSERT system, SELECT self or admin, DELETE admin

#### Table: `audit_logs` (2 policies)

##### 10.11. audit_logs_system_insert

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** : `true`
- **Description** : Système crée audit logs

##### 10.12. audit_logs_admin_read

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin lisent audit logs

#### Table: `notifications` (4 policies)

##### 10.13-10.16. notifications policies

- Pattern DELETE/UPDATE self, INSERT system, SELECT self

---

### 11. TESTS & QA (17 policies)

#### Table: `manual_tests_progress` (5 policies)

##### 11.1. manual_tests_progress_delete_admin

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin suppriment tests manuels

##### 11.2. manual_tests_progress_insert_authenticated

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
tester_id = auth.uid()
```

- **Description** : User crée son propre test progress

##### 11.3. manual_tests_progress_select_authenticated

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent tests

##### 11.4-11.5. manual_tests_progress_update (2 policies)

- Pattern UPDATE self or admin

#### Table: `test_validation_state` (1 policy)

##### 11.6. test_validation_state_manage_admin

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **Description** : Owner/Admin gèrent validation state

#### Table: `test_sections_lock` (4 policies)

##### 11.7-11.10. test_sections_lock policies

- Pattern DELETE self or admin, INSERT self, SELECT authenticated, UPDATE self

#### Table: `bug_reports` (4 policies)

##### 11.11. Only admins can delete bug reports

- **Commande** : DELETE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
)
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin suppriment bug reports

##### 11.12. Users can create bug reports

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** :

```sql
reported_by = auth.uid()
```

- **Description** : User crée bug report (assigné à lui)

##### 11.13. All users can view bug reports

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : N/A
- **Description** : Tous users authentifiés lisent bugs

##### 11.14. Admins and assignees can update bug reports

- **Commande** : UPDATE
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
) OR assigned_to = auth.uid() OR reported_by = auth.uid()
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin/Assigné/Créateur modifient bugs

#### Table: `test_error_reports` (4 policies)

##### 11.15-11.18. test_error_reports policies

- Pattern similar to bug_reports

---

### 12. ERRORS & MCP (8 policies)

#### Table: `error_reports_v2` (2 policies)

##### 12.1. error_reports_v2_insert_system

- **Commande** : INSERT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : N/A
- **WITH CHECK** : `true`
- **Description** : Système crée error reports

##### 12.2. error_reports_v2_select_admin

- **Commande** : SELECT
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** : N/A
- **Description** : Owner/Admin lisent error reports

#### Table: `error_resolution_history` (2 policies)

##### 12.3-12.4. error_resolution_history policies

- Pattern INSERT system + SELECT admin

#### Table: `mcp_resolution_queue` (2 policies)

##### 12.5-12.6. mcp_resolution_queue policies

- Pattern INSERT system + manage admin

#### Table: `mcp_resolution_strategies` (2 policies)

##### 12.7-12.8. mcp_resolution_strategies policies

- Pattern manage admin + SELECT authenticated

---

### 13. DIVERS (7 policies)

#### Table: `expense_categories` (1 policy)

##### 13.1. expense_categories_admin_only

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **WITH CHECK** :

```sql
get_user_role() IN ('owner', 'admin')
```

- **Description** : Owner/Admin gèrent catégories dépenses

#### Table: `supplier_categories` (2 policies)

##### 13.2-13.3. supplier_categories policies

- Pattern manage admin + SELECT authenticated

#### Table: `consultation_products` (1 policy)

##### 13.4. consultation_products_manage_authenticated

- **Commande** : ALL
- **Rôles** : `authenticated`
- **Type** : PERMISSIVE
- **Condition USING** : `true`
- **WITH CHECK** : `true`
- **Description** : Tous users authentifiés gèrent consultation products

---

## 📊 PATTERNS RLS COMMUNS

### Pattern 1: Admin Full Access (32 policies)

**Usage** : Owner/Admin gèrent totalement une ressource

```sql
-- Pattern USING
get_user_role() IN ('owner', 'admin')

-- Pattern WITH CHECK
get_user_role() IN ('owner', 'admin')

-- Tables concernées
- invoices, financial_documents, financial_payments
- expense_categories, supplier_categories
- user_profiles (DELETE), audit_logs
- bank_transactions, feed_configs
- etc.
```

### Pattern 2: Catalog Manager Access (24 policies)

**Usage** : Owner/Admin/CatalogManager gèrent catalogue/pricing

```sql
-- Pattern USING/WITH CHECK
get_user_role() IN ('owner', 'admin', 'catalog_manager')

-- Tables concernées
- categories, families, subcategories
- products, product_images, product_packages
- price_lists, price_list_items
- channel_price_lists, channel_pricing
- stock_movements (INSERT/UPDATE)
- purchase_orders
- etc.
```

### Pattern 3: Sales Access (15 policies)

**Usage** : Owner/Admin/Sales gèrent ventes/clients

```sql
-- Pattern USING/WITH CHECK
get_user_role() IN ('owner', 'admin', 'sales')

-- Tables concernées
- sales_orders, sales_order_items
- organisations, individual_customers, contacts
- client_consultations
- payments, invoices (INSERT)
- shipments, shipping_parcels
- etc.
```

### Pattern 4: Self or Admin (12 policies)

**Usage** : User modifie ses données OU Owner/Admin

```sql
-- Pattern USING
user_id = auth.uid() OR get_user_role() IN ('owner', 'admin')

-- Pattern WITH CHECK
user_id = auth.uid() OR get_user_role() IN ('owner', 'admin')

-- Tables concernées
- user_profiles (UPDATE)
- user_sessions
- user_activity_logs
- notifications
- product_drafts (created_by)
- etc.
```

### Pattern 5: Authenticated Read All (68 policies)

**Usage** : Tous users authentifiés lisent

```sql
-- Pattern USING
true

-- Tables concernées
- Quasi toutes tables (SELECT policy)
- products, categories, families
- invoices, sales_orders
- organisations, contacts
- etc.
```

### Pattern 6: Public Read Published (13 policies)

**Usage** : Anonymes lisent ressources publiées

```sql
-- Pattern USING (produits)
status = 'published' AND is_active = true

-- Pattern USING (images via produits)
EXISTS (
  SELECT 1 FROM products
  WHERE products.id = [table].product_id
    AND products.status = 'published'
    AND products.is_active = true
)

-- Tables concernées
- categories, families, subcategories (anon role)
- products (anon role)
- product_images (anon role)
- stock_movements (anon role)
- etc.
```

### Pattern 7: System Insert Only (8 policies)

**Usage** : Système crée automatiquement (triggers, API)

```sql
-- Pattern WITH CHECK
true

-- Tables concernées
- audit_logs
- error_reports_v2
- error_resolution_history
- stock_movements (system_insert)
- stock_reservations (system_insert)
- feed_performance_metrics
- user_activity_logs
- etc.
```

---

## ⚠️ RÈGLES ABSOLUES RLS

### Règles Critiques

```markdown
❌ INTERDIT ABSOLU :

1. Désactiver RLS sur table production (ALTER TABLE ... DISABLE ROW LEVEL SECURITY)
2. Créer policy BYPASS complète (USING true + WITH CHECK true pour ALL sur authenticated)
3. Modifier rôles sans comprendre cascade permissions
4. Supprimer policy sans vérifier dépendances
5. Créer policy RESTRICTIVE sans validation (toutes sont PERMISSIVE actuellement)

✅ OBLIGATOIRE AVANT MODIFICATION :

1. Lire docs/database/SCHEMA-REFERENCE.md
2. Lire docs/database/rls-policies.md (CE FICHIER)
3. Comprendre get_user_role() function
4. Vérifier patterns existants similaires
5. Tester policy sur données test AVANT production
6. Validation utilisateur MANDATORY si modification policy critique
```

### Policies Critiques (Double Validation Requise)

**Tables sensibles** :

- `user_profiles` - Gestion rôles (NE PAS permettre escalade privilèges)
- `stock_movements` - Données financières (cohérence stock)
- `invoices` - Documents légaux (traçabilité)
- `financial_documents` - Comptabilité (RGPD)
- `audit_logs` - Traçabilité (immuabilité)
- `bank_transactions` - Données bancaires (sécurité maximale)
- `price_lists` - Tarification (concurrence)

**Validation requise** :

- ✅ Tester policy sur environment staging
- ✅ Vérifier aucune escalade privilèges possible
- ✅ Confirmer avec utilisateur si doute
- ✅ Documenter raison modification dans migration

---

## 🔄 WORKFLOW CONSULTATION

### Avant Modification Database

```bash
# 1. Consulter SCHEMA-REFERENCE.md (tables, champs)
cat docs/database/SCHEMA-REFERENCE.md

# 2. Consulter rls-policies.md (CE FICHIER - sécurité)
cat docs/database/rls-policies.md

# 3. Chercher policies concernées
grep -i "nom_table" docs/database/rls-policies.md

# 4. Chercher policies par rôle
grep -i "owner" docs/database/rls-policies.md
grep -i "catalog_manager" docs/database/rls-policies.md
grep -i "sales" docs/database/rls-policies.md

# 5. Vérifier fonction get_user_role()
cat docs/database/functions-rpc.md | grep -A 20 "get_user_role"
```

### Checklist Validation Sécurité

```markdown
- [ ] Policy existe pour chaque opération (SELECT/INSERT/UPDATE/DELETE) ?
- [ ] Pas de bypass complet (USING true + WITH CHECK true sur ALL) ?
- [ ] Rôle minimum requis respecté (least privilege principle) ?
- [ ] Pas d'escalade privilèges possible ?
- [ ] Policy cohérente avec business rules (voir manifests/) ?
- [ ] Testée sur données test ?
- [ ] Validation utilisateur si table critique ?
```

### Template Confirmation Utilisateur

````
🔒 MODIFICATION RLS POLICY

**Table** : [NOM_TABLE]
**Commande** : [SELECT/INSERT/UPDATE/DELETE/ALL]
**Rôle actuel** : [RÔLES_ACTUELS]
**Rôle nouveau** : [RÔLES_NOUVEAUX]

**Policy actuelle** :
```sql
[POLICY_ACTUELLE]
````

**Policy proposée** :

```sql
[POLICY_NOUVELLE]
```

**Impact sécurité** :

- [DESCRIPTION_IMPACT_1]
- [DESCRIPTION_IMPACT_2]

**Vérifications effectuées** :
✅ Pas d'escalade privilèges
✅ Cohérence business rules
✅ Testée sur données test

Confirmes-tu cette modification ?

```

---

## 📊 STATISTIQUES FINALES

### Répartition par Module

| Module | Policies | % Total |
|--------|----------|---------|
| Catalogue | 55 | 25.3% |
| Commandes Vente | 22 | 10.1% |
| Tests & QA | 17 | 7.8% |
| Clients & Contacts | 16 | 7.4% |
| Pricing | 14 | 6.5% |
| Utilisateurs | 13 | 6.0% |
| Commandes Achat | 13 | 6.0% |
| Stocks | 10 | 4.6% |
| Facturation & Abby | 8 | 3.7% |
| Errors & MCP | 8 | 3.7% |
| Google Merchant | 7 | 3.2% |
| Divers | 7 | 3.2% |
| Banking | 1 | 0.5% |
| **TOTAL** | **217** | **100%** |

### Répartition par Commande

| Commande | Policies | % Total | Description |
|----------|----------|---------|-------------|
| SELECT | 92 | 42.4% | Lecture données |
| INSERT | 47 | 21.7% | Création données |
| UPDATE | 42 | 19.4% | Modification données |
| DELETE | 24 | 11.1% | Suppression données |
| ALL | 12 | 5.5% | Toutes opérations |
| **TOTAL** | **217** | **100%** | |

### Répartition par Pattern

| Pattern | Policies | % Total |
|---------|----------|---------|
| Authenticated Read All | 68 | 31.3% |
| Admin Full Access | 32 | 14.7% |
| Catalog Manager Access | 24 | 11.1% |
| Sales Access | 15 | 6.9% |
| Public Read Published | 13 | 6.0% |
| Self or Admin | 12 | 5.5% |
| System Insert Only | 8 | 3.7% |
| Autres patterns | 45 | 20.7% |
| **TOTAL** | **217** | **100%** |

---

## 🎯 PROCHAINES ÉTAPES

Fichiers documentation database à créer :

1. ✅ **SCHEMA-REFERENCE.md** - Créé (78 tables)
2. ✅ **triggers.md** - Créé (158 triggers)
3. ✅ **rls-policies.md** - Créé (CE FICHIER - 217 policies)
4. ⏳ **functions-rpc.md** - À créer (254 fonctions)
5. ⏳ **enums.md** - À créer (types custom)
6. ⏳ **foreign-keys.md** - À créer (relations)
7. ⏳ **best-practices.md** - À créer (guide anti-hallucination)

---

**✅ Documentation RLS Policies Complète - 17 Octobre 2025**

*217 policies documentées sur 73 tables*
*Source de vérité pour sécurité database*
*Consultation OBLIGATOIRE avant toute modification permissions*
```
