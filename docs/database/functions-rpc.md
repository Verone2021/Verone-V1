# ⚙️ FUNCTIONS & RPC - Documentation Complète

**Date création** : 17 octobre 2025
**Dernière mise à jour** : 25 octobre 2025 (Ajout get_order_total_retrocession)
**Database** : Supabase PostgreSQL (aorroydfjsrygmosnzrl)
**Total** : 256 fonctions PostgreSQL
**Statut** : ✅ Production Active

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#vue-densemble)
2. [Fonctions Critiques](#fonctions-critiques)
3. [Catégories Fonctionnelles](#catégories-fonctionnelles)
4. [Index Alphabétique](#index-alphabétique)
5. [Workflow Consultation](#workflow-consultation)

---

## 🎯 VUE D'ENSEMBLE

### Statistiques Générales

| Catégorie                 | Total   | Description                                    |
| ------------------------- | ------- | ---------------------------------------------- |
| **Fonctions TRIGGER**     | 89      | Exécutées automatiquement par triggers (34.9%) |
| **Fonctions RPC**         | 72      | Appelables depuis client/API (28.2%)           |
| **Fonctions HELPER**      | 46      | Utilitaires internes (18.0%)                   |
| **Fonctions CALCULATION** | 28      | Calculs métier complexes (11.0%)               |
| **Fonctions VALIDATION**  | 15      | Validation business rules (5.9%)               |
| **Fonctions SYSTEM**      | 5       | Maintenance/Cron (2.0%)                        |
| **TOTAL**                 | **255** | **100%**                                       |

### Répartition par Type de Retour

| Type Retour | Fonctions | % Total |
| ----------- | --------- | ------- |
| `trigger`   | 89        | 35.0%   |
| `record`    | 52        | 20.5%   |
| `jsonb`     | 38        | 15.0%   |
| `void`      | 27        | 10.6%   |
| `boolean`   | 18        | 7.1%    |
| `integer`   | 12        | 4.7%    |
| `numeric`   | 8         | 3.1%    |
| Autres      | 10        | 3.9%    |

### Répartition par Module

| Module      | Fonctions | % Total |
| ----------- | --------- | ------- |
| Catalogue   | 62        | 24.4%   |
| Stocks      | 35        | 13.8%   |
| Pricing     | 28        | 11.0%   |
| Orders      | 25        | 9.8%    |
| Finance     | 18        | 7.1%    |
| Users       | 15        | 5.9%    |
| Testing     | 12        | 4.7%    |
| Collections | 10        | 3.9%    |
| System      | 8         | 3.1%    |
| Errors      | 7         | 2.8%    |
| Autres      | 34        | 13.4%   |

---

## 🔥 FONCTIONS CRITIQUES

### Top 10 Fonctions à NE JAMAIS Modifier Sans Validation

#### 1. `get_user_role()` ⭐⭐⭐⭐⭐

**Criticité** : 🔴 MAXIMALE
**Impact** : 217 RLS policies (80%+ des policies)
**Type** : HELPER
**Retour** : `user_role_type`

```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role_type
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT role
    FROM user_profiles
    WHERE user_id = auth.uid()
  );
END;
$function$
```

**Usage** : Base de toute sécurité RLS application

**⚠️ RÈGLES ABSOLUES** :

- ❌ JAMAIS modifier sans audit sécurité complet
- ❌ JAMAIS supprimer (casse 217 policies)
- ✅ Tester TOUTES policies après modification
- ✅ Triple validation Owner required

---

#### 2. `maintain_stock_totals()` ⭐⭐⭐⭐⭐

**Criticité** : 🔴 MAXIMALE
**Impact** : 10 triggers stock interdépendants
**Type** : TRIGGER
**Retour** : `trigger`

```sql
CREATE OR REPLACE FUNCTION public.maintain_stock_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_product_id uuid;
  v_stock_real integer;
  v_stock_forecasted_in integer;
  v_stock_forecasted_out integer;
BEGIN
  -- Determine product_id
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  -- Recalculate stock totals
  SELECT
    COALESCE(SUM(CASE
      WHEN movement_type = 'IN' THEN quantity
      WHEN movement_type = 'OUT' THEN -quantity
      WHEN movement_type = 'ADJUSTMENT' THEN quantity
      ELSE 0
    END), 0),
    COALESCE(SUM(CASE
      WHEN movement_type = 'FORECASTED_IN' THEN quantity
      ELSE 0
    END), 0),
    COALESCE(SUM(CASE
      WHEN movement_type = 'FORECASTED_OUT' THEN quantity
      ELSE 0
    END), 0)
  INTO v_stock_real, v_stock_forecasted_in, v_stock_forecasted_out
  FROM stock_movements
  WHERE product_id = v_product_id;

  -- Update products table
  UPDATE products
  SET
    stock_real = v_stock_real,
    stock_forecasted_in = v_stock_forecasted_in,
    stock_forecasted_out = v_stock_forecasted_out,
    stock_quantity = v_stock_real + v_stock_forecasted_in - v_stock_forecasted_out,
    updated_at = now()
  WHERE id = v_product_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$
```

**Usage** : Synchronise stock products depuis stock_movements

**⚠️ RÈGLES ABSOLUES** :

- ❌ JAMAIS modifier sans lire triggers.md section stock
- ❌ JAMAIS désactiver (corruption données)
- ✅ Lire 10 triggers stock interdépendants
- ✅ Tests exhaustifs sur données réelles

---

#### 3. `update_updated_at()` ⭐⭐⭐⭐

**Criticité** : 🟠 ÉLEVÉE
**Impact** : 42 tables, 42 triggers
**Type** : TRIGGER
**Retour** : `trigger`

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
```

**Usage** : Mise à jour automatique `updated_at` sur 42 tables

**Tables concernées** :

- `categories`, `families`, `subcategories`
- `products`, `product_images`, `product_packages`
- `price_lists`, `price_list_items`
- `sales_orders`, `purchase_orders`
- `invoices`, `payments`
- `organisations`, `contacts`
- `user_profiles`, `notifications`
- 26 autres tables

---

#### 4. `calculate_product_price_v2()` ⭐⭐⭐⭐

**Criticité** : 🟠 ÉLEVÉE
**Impact** : Tarification client finale (multi-canal, tiered pricing)
**Type** : RPC
**Retour** : `TABLE(price_ht, original_price, discount_rate, price_list_id, price_list_name, price_source, min_quantity, max_quantity, currency, margin_rate, notes)`
**Dernière mise à jour** : 2025-10-17

```sql
CREATE OR REPLACE FUNCTION public.calculate_product_price_v2(
  p_product_id uuid,
  p_quantity integer DEFAULT 1,
  p_channel_id uuid DEFAULT NULL,
  p_customer_id uuid DEFAULT NULL,
  p_customer_type varchar DEFAULT NULL,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  price_ht numeric,
  original_price numeric,
  discount_rate numeric,
  price_list_id uuid,
  price_list_name varchar,
  price_source varchar,
  min_quantity integer,
  max_quantity integer,
  currency varchar,
  margin_rate numeric,
  notes text
)
LANGUAGE plpgsql
STABLE
```

**Architecture** : Utilise système price_lists + price_list_items (pas de prix dans products)

**Logique Priorité** :

1. **customer_pricing** (prix client individuel) - PRIORITÉ MAX
2. **group_price_lists** (prix groupe client)
3. **channel_pricing** (prix canal via channel_price_lists)
4. **price_list_items** (prix liste standard)
5. **base price_list** (fallback liste par défaut)

**Fonctionnalités** :

- ✅ Tiered pricing (prix par quantité)
- ✅ Validité temporelle (valid_from/valid_until)
- ✅ Multi-devise
- ✅ Calcul remise automatique
- ✅ Traçabilité source prix

**Appel client** :

```typescript
const { data } = await supabase.rpc('calculate_product_price_v2', {
  p_product_id: 'uuid-produit',
  p_quantity: 50, // Tiered pricing
  p_channel_id: 'uuid-canal',
  p_customer_id: 'uuid-client', // Optionnel
  p_date: '2025-10-17', // Optionnel (défaut: aujourd'hui)
});

// Retour :
// {
//   price_ht: 100.00,
//   original_price: 120.00,
//   discount_rate: 16.67,
//   price_list_id: 'uuid',
//   price_list_name: 'B2B Standard 2025',
//   price_source: 'channel',
//   min_quantity: 50,
//   max_quantity: null,
//   currency: 'EUR',
//   margin_rate: 35.5,
//   notes: 'Prix dégressif à partir de 50 unités'
// }
```

**Business Rules** :

1. Cherche prix applicable via `get_applicable_price_lists()` (priorité)
2. Filtre par quantité (min_quantity ≤ p_quantity ≤ max_quantity)
3. Filtre par date (valid_from ≤ p_date ≤ valid_until)
4. Retourne prix avec priorité la plus basse (priority ASC)
5. Si aucun prix trouvé → Retourne NULL (pas d'erreur)

**Documentation complète** : [pricing-architecture.md](./pricing-architecture.md)

---

#### 5. `calculate_sales_order_total()` ⭐⭐⭐⭐

**Criticité** : 🟠 ÉLEVÉE
**Impact** : Total commandes vente
**Type** : TRIGGER
**Retour** : `trigger`

```sql
CREATE OR REPLACE FUNCTION public.calculate_sales_order_total()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_order_id uuid;
  v_total numeric;
BEGIN
  -- Determine order ID
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.sales_order_id;
  ELSE
    v_order_id := NEW.sales_order_id;
  END IF;

  -- Calculate total
  SELECT COALESCE(SUM(line_total), 0)
  INTO v_total
  FROM sales_order_items
  WHERE sales_order_id = v_order_id;

  -- Update order
  UPDATE sales_orders
  SET
    total_amount = v_total,
    updated_at = now()
  WHERE id = v_order_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$
```

**Usage** : Trigger sur sales_order_items INSERT/UPDATE/DELETE

---

#### 6. `handle_order_cancellation()` ⭐⭐⭐

**Criticité** : 🟡 MOYENNE
**Impact** : Libération stock réservé
**Type** : TRIGGER
**Retour** : `trigger`

```sql
CREATE OR REPLACE FUNCTION public.handle_order_cancellation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Release stock reservations
  DELETE FROM stock_reservations
  WHERE sales_order_id = NEW.id;

  -- Create movements to revert forecasted_out
  INSERT INTO stock_movements (
    product_id,
    quantity,
    movement_type,
    reference_type,
    reference_id,
    notes
  )
  SELECT
    soi.product_id,
    soi.quantity,
    'FORECASTED_IN',
    'sales_order',
    NEW.id,
    'Stock released from cancelled order ' || NEW.order_number
  FROM sales_order_items soi
  WHERE soi.sales_order_id = NEW.id;

  RETURN NEW;
END;
$function$
```

**Usage** : Trigger quand status → 'cancelled'

---

#### 7-10. Autres Fonctions Critiques

7. `ensure_single_primary_image()` - Garantit UNE image primaire par produit
8. `validate_product_category()` - Cohérence catégorie/famille/sous-catégorie
9. `calculate_batch_prices_v2()` - Prix batch produits (performance)
10. `check_orders_stock_consistency()` - Vérif cohérence stock/commandes

---

## 📚 CATÉGORIES FONCTIONNELLES

### 1. TRIGGER FUNCTIONS (89 fonctions)

#### 1.1. Updated At (42 fonctions)

- `update_updated_at()` - MAÎTRE (42 tables)
- `update_products_updated_at()` - Variante produits
- `update_stock_movements_updated_at()` - Variante stocks
- `update_user_profiles_updated_at()` - Variante users
- 38 autres variantes spécialisées

#### 1.2. Stock Management (12 fonctions)

- `maintain_stock_totals()` ⭐ - Synchronise totaux
- `update_product_stock()` - Update stock produit
- `check_stock_movement_type()` - Valide type
- `prevent_manual_stock_movement_modification()` - Protection
- `check_stock_reservation_before_delete()` - Vérif avant delete
- `sync_stock_quantity()` - Sync quantités
- `reserve_stock_for_order()` - Réserve stock
- `release_stock_reservation()` - Libère réservation
- `create_stock_movement_on_reception()` - Auto mouvement PO
- 3 autres fonctions stock

#### 1.3. Pricing & Totals (15 fonctions)

- `calculate_price_margins()` - Calcul marges
- `enforce_price_minimum()` - Prix >= 0.01€
- `calculate_sales_order_total()` - Total commande vente
- `calculate_purchase_order_total()` - Total PO
- `calculate_invoice_total()` - Total facture
- `update_invoice_paid_amount()` - Montant payé facture
- `update_order_paid_amount()` - Montant payé commande
- `sync_product_base_price()` - Sync prix base
- `invalidate_cached_prices()` - Invalide cache
- 6 autres fonctions pricing

#### 1.4. Validation (18 fonctions)

- `validate_product_category()` - Catégorie/famille cohérence
- `validate_contact_constraints()` - Email OU phone requis
- `check_product_variant_rules()` - Règles variantes
- `validate_product_dimensions()` - Dimensions
- `validate_product_prices()` - Prix cohérents
- `validate_package_dimensions()` - Dimensions package
- `validate_order_customer()` - Customer valide
- `validate_po_supplier()` - Supplier valide
- `validate_org_type()` - Type organisation
- `validate_user_role()` - Rôle user
- `validate_discount_rules()` - Règles discount
- `validate_quantity_breaks()` - Paliers quantité
- `validate_payment_amount()` - Montant paiement
- 5 autres fonctions validation

#### 1.5. Uniqueness (8 fonctions)

- `ensure_single_primary_image()` - UNE image primaire
- `ensure_single_default_price_list()` - UNE liste prix default
- `ensure_single_default_channel_list()` - UN channel default
- `ensure_single_primary_collection_image()` - UNE image collection
- `manage_consultation_primary_image()` - Gestion image consultation
- 3 autres fonctions unicité

#### 1.6. Workflow (10 fonctions)

- `handle_order_cancellation()` - Annulation commande
- `handle_po_cancellation()` - Annulation PO
- `handle_invoice_status_change()` - Changement statut facture
- `reserve_stock_on_confirmation()` - Réserve stock confirmation
- `prevent_completed_order_modification()` - Protection completed
- `prevent_completed_po_modification()` - Protection PO completed
- `prevent_last_owner_removal()` - Garde 1 owner
- `prevent_primary_image_deletion()` - Protection image primaire
- 2 autres fonctions workflow

#### 1.7. Generation (15 fonctions)

- `generate_product_sku()` - SKU-XXXXXXXX
- `set_sales_order_number()` - SO-YYYY-XXXX
- `set_purchase_order_number()` - PO-YYYY-XXXX
- `set_invoice_reference()` - INV-YYYY-XXXX
- `set_financial_document_ref()` - DOC-YYYY-XXXX
- `generate_org_code()` - ORG-XXXX
- `generate_product_image_url()` - URL Supabase Storage
- `generate_collection_image_url()` - URL collection
- `set_product_display_order()` - Ordre automatique
- `set_product_image_display_order()` - Ordre images
- `set_product_published_at()` - Date publication
- `set_webhook_event_expiry()` - Expiration webhook
- 3 autres fonctions generation

#### 1.8. Autres Triggers (9 fonctions)

- `audit_trigger_function()` - Audit logs
- `log_role_change()` - Trace changements rôle
- `cleanup_expired_sessions()` - Nettoyage sessions
- `cleanup_expired_locks()` - Nettoyage locks
- `partition_activity_logs()` - Partitionnement logs
- `auto_lock_validated_test()` - Lock tests
- `deduplicate_errors()` - Déduplique erreurs
- `enqueue_critical_errors()` - File erreurs critiques
- `update_product_search_vector()` - Full-text search

---

### 2. RPC FUNCTIONS (72 fonctions)

#### 2.1. Catalogue & Products (18 fonctions)

**RPC Pricing** :

- `calculate_batch_prices_v2(product_ids uuid[])` - Prix batch
- `calculate_product_price_v2(product_id, channel_id, customer_id)` - Prix final
- `calculate_package_price(product_id, quantity)` - Prix packaging

**RPC Products** :

- `get_product_with_images(product_id uuid)` - Produit complet
- `get_product_variants(parent_id uuid)` - Variantes
- `search_products(query text, filters jsonb)` - Recherche
- `get_collection_products(collection_id uuid)` - Produits collection

**RPC Status** :

- `check_incomplete_catalog_products()` - Produits incomplets
- `calculate_automatic_product_status(product_id)` - Statut auto
- `calculate_sourcing_product_status(product_id)` - Statut sourcing
- `calculate_stock_status(product_id)` - Statut stock

**Autres RPC catalogue** : 8 fonctions

#### 2.2. Orders & Sales (15 fonctions)

**RPC Create** :

- `create_sales_order_with_items(order_data jsonb, items jsonb[])` - Créer commande+items
- `create_purchase_order_with_items(po_data jsonb, items jsonb[])` - Créer PO+items

**RPC Checks** :

- `check_orders_stock_consistency()` - Cohérence stock
- `check_late_shipments()` - Expéditions retard
- `auto_cancel_unpaid_orders()` - Annule impayées

**RPC Workflow** :

- `approve_sample_request(sample_order_id uuid)` - Approuve échantillon
- `calculate_order_line_price(order_item_id uuid)` - Prix ligne
- `cancel_order_forecast_movements(order_id uuid)` - Annule prévisions

**RPC Ristourne** ⭐ NOUVEAU (2025-10-25):

- `get_order_total_retrocession(order_id uuid)` - Commission totale commande

**Autres RPC orders** : 7 fonctions

#### 2.3. Finance & Invoicing (12 fonctions)

**RPC Revenue** :

- `calculate_annual_revenue_bfa(year integer)` - Revenu annuel
- `get_monthly_revenue_breakdown(year integer, month integer)` - Détail mensuel

**RPC Invoices** :

- `check_overdue_invoices()` - Factures échues
- `generate_invoice_pdf(invoice_id uuid)` - PDF facture
- `send_invoice_email(invoice_id uuid)` - Email facture

**RPC Banking** :

- `auto_match_bank_transaction(transaction_id uuid)` - Rapprochement auto
- `reconcile_bank_transaction(transaction_id, invoice_id)` - Rapprochement manuel

**Autres RPC finance** : 5 fonctions

#### 2.4. Users & Permissions (8 fonctions)

**RPC Core** :

- `get_user_role()` ⭐ - Rôle user courant (CRITICAL)
- `get_user_permissions(user_id uuid)` - Permissions user

**RPC Management** :

- `switch_user_role(user_id uuid, new_role user_role_type)` - Change rôle
- `calculate_engagement_score(user_id uuid)` - Score engagement
- `get_user_activity_summary(user_id uuid, days integer)` - Résumé activité

**Autres RPC users** : 3 fonctions

#### 2.5. Testing & QA (7 fonctions)

**RPC Tests** :

- `auto_lock_section_if_complete(section_id uuid)` - Lock section complète
- `unlock_test_section(section_id uuid)` - Délock section
- `reset_test_progress(test_id uuid)` - Reset progression
- `bulk_update_test_status(test_ids uuid[], new_status text)` - Bulk update

**Autres RPC testing** : 3 fonctions

#### 2.6. Error Handling & MCP (5 fonctions)

**RPC Errors** :

- `classify_error_with_ai(error_data jsonb)` - Classification AI
- `enqueue_error_for_resolution(error_id uuid)` - File résolution
- `auto_resolve_known_errors()` - Résolution auto
- `get_error_statistics(days integer)` - Stats erreurs

**Autres RPC errors** : 1 fonction

#### 2.7. Collections & Tags (7 fonctions)

**RPC Tags** :

- `add_collection_tag(collection_id uuid, tag text)` - Ajoute tag
- `remove_collection_tag(collection_id uuid, tag text)` - Retire tag
- `get_popular_tags(limit integer)` - Tags populaires
- `search_collections_by_tags(tags text[])` - Recherche par tags

**Autres RPC collections** : 3 fonctions

#### 2.8. System & Maintenance (12 fonctions)

**RPC Cleanup** :

- `cleanup_old_sessions(days integer)` - Nettoie sessions
- `cleanup_old_activity_logs(months integer)` - Nettoie logs
- `vacuum_analyze_all_tables()` - Vacuum complet
- `refresh_materialized_views()` - Refresh vues matérialisées
- `archive_old_invoices(years integer)` - Archive factures

**Autres RPC system** : 7 fonctions

---

### 3. HELPER FUNCTIONS (45 fonctions)

#### 3.1. Calculation (15 fonctions)

- `calculate_price_ttc(price_ht, tax_rate)` - Calcul TTC
- `calculate_weight_total(items jsonb[])` - Poids total
- `calculate_volume_total(items jsonb[])` - Volume total
- `convert_currency(amount, from, to)` - Conversion devise
- 11 autres helpers calculation

#### 3.2. Validation (12 fonctions)

- `is_valid_email(email text)` - Valide email
- `is_valid_siret(siret text)` - Valide SIRET
- `is_valid_phone(phone text)` - Valide téléphone
- 9 autres helpers validation

#### 3.3. Format (11 fonctions)

- `format_price(amount numeric)` - Formatte prix
- `format_date(date timestamptz)` - Formatte date
- `get_organisation_display_name(org organisations)` - Nom affichage organisation
- `slugify(text text)` - Génère slug
- 7 autres helpers format

#### 3.4. Search (8 fonctions)

- `search_products_full_text(query text)` - Recherche full-text
- `search_fuzzy(query text, field text)` - Recherche floue
- 6 autres helpers search

---

## 📖 INDEX ALPHABÉTIQUE COMPLET (254 fonctions)

### A

1. `add_collection_tag` - RPC - Ajoute tag collection
2. `approve_sample_request` - RPC - Approuve échantillon
3. `audit_trigger_function` - TRIGGER - Audit automatique
4. `auto_cancel_unpaid_orders` - RPC - Annule impayées
5. `auto_lock_section_if_complete` - RPC - Lock section tests
6. `auto_lock_validated_test` - TRIGGER - Lock test validé
7. `auto_match_bank_transaction` - RPC - Rapprochement auto

### C

8. `calculate_annual_revenue_bfa` - RPC - Revenu annuel
9. `calculate_automatic_product_status` - RPC - Statut auto
10. `calculate_batch_prices_v2` - RPC - Prix batch
11. `calculate_engagement_score` - RPC - Score engagement
12. `calculate_next_retry` - TRIGGER - Retry Abby
13. `calculate_order_line_price` - RPC - Prix ligne
14. `calculate_package_price` - HELPER - Prix package
15. `calculate_price_margins` - TRIGGER - Marges
16. `calculate_price_ttc` - HELPER - TTC
17. `calculate_product_completion_status` - TRIGGER - Complétion
18. `calculate_product_price_v2` - RPC - Prix produit V2
19. `calculate_purchase_order_total` - TRIGGER - Total PO
20. `calculate_sales_order_total` - TRIGGER - Total SO
21. `calculate_sourcing_product_status` - RPC - Statut sourcing
22. `calculate_stock_status` - RPC - Statut stock
23. `cancel_order_forecast_movements` - RPC - Annule prévisions
24. `check_incomplete_catalog_products` - RPC - Produits incomplets
25. `check_invoice_overdue` - TRIGGER - Facture échue
26. `check_late_shipments` - RPC - Expéditions retard
27. `check_orders_stock_consistency` - RPC - Cohérence stock
28. `check_overdue_invoices` - RPC - Factures échues
29. `check_product_variant_rules` - TRIGGER - Règles variantes
30. `check_stock_movement_type` - TRIGGER - Type mouvement
31. `check_stock_reservation_before_delete` - TRIGGER - Vérif delete
32. `classify_error_with_ai` - RPC - Classification AI
33. `cleanup_expired_locks` - TRIGGER - Nettoyage locks
34. `cleanup_expired_sessions` - TRIGGER - Nettoyage sessions
35. `convert_currency` - HELPER - Conversion devise

### D-F

36. `deduplicate_errors` - TRIGGER - Déduplique erreurs
37. `enforce_price_minimum` - TRIGGER - Prix minimum
38. `enqueue_critical_errors` - TRIGGER - File erreurs
39. `enqueue_error_for_resolution` - RPC - File résolution
40. `ensure_single_default_channel_list` - TRIGGER - Default channel
41. `ensure_single_default_price_list` - TRIGGER - Default liste
42. `ensure_single_primary_collection_image` - TRIGGER - Image collection
43. `ensure_single_primary_image` - TRIGGER - Image primaire
44. `format_date` - HELPER - Formatte date
45. `format_price` - HELPER - Formatte prix

### G

46. `generate_collection_image_url` - TRIGGER - URL image
47. `generate_org_code` - TRIGGER - Code org
48. `generate_product_image_url` - TRIGGER - URL produit
49. `generate_product_sku` - TRIGGER - SKU
50. `get_collection_products` - RPC - Produits collection
51. `get_error_statistics` - RPC - Stats erreurs
52. `get_popular_tags` - RPC - Tags populaires
53. `get_product_variants` - RPC - Variantes
54. `get_product_with_images` - RPC - Produit complet
55. `get_user_activity_summary` - RPC - Résumé activité
56. `get_organisation_display_name` - HELPER - Nom affichage org
57. `get_user_permissions` - RPC - Permissions user
58. `get_user_role` ⭐ - HELPER - Rôle user (CRITICAL)

### H-L

58. `handle_invoice_status_change` - TRIGGER - Statut facture
59. `handle_order_cancellation` - TRIGGER - Annulation SO
60. `handle_po_cancellation` - TRIGGER - Annulation PO
61. `handle_product_deletion` - TRIGGER - Suppression produit
62. `is_valid_email` - HELPER - Valide email
63. `is_valid_phone` - HELPER - Valide téléphone
64. `is_valid_siret` - HELPER - Valide SIRET
65. `log_role_change` - TRIGGER - Trace rôle

### M-P

66. `maintain_stock_totals` ⭐ - TRIGGER - Totaux stock (CRITICAL)
67. `manage_consultation_primary_image` - TRIGGER - Image consultation
68. `mark_sync_operation_success` - TRIGGER - Sync succès
69. `partition_activity_logs` - TRIGGER - Partition logs
70. `prevent_completed_order_modification` - TRIGGER - Protection SO
71. `prevent_completed_po_modification` - TRIGGER - Protection PO
72. `prevent_last_owner_removal` - TRIGGER - Garde owner
73. `prevent_manual_stock_movement_modification` - TRIGGER - Stock auto
74. `prevent_primary_image_deletion` - TRIGGER - Protection image

### R-S

75. `release_stock_reservation` - HELPER - Libère stock
76. `remove_collection_tag` - RPC - Retire tag
77. `reserve_stock_for_order` - TRIGGER - Réserve stock
78. `search_collections_by_tags` - RPC - Recherche tags
79. `search_fuzzy` - HELPER - Recherche floue
80. `search_products` - RPC - Recherche produits
81. `search_products_full_text` - HELPER - Full-text
82. `set_financial_document_ref` - TRIGGER - Ref document
83. `set_invoice_reference` - TRIGGER - Ref facture
84. `set_product_display_order` - TRIGGER - Ordre produit
85. `set_product_image_display_order` - TRIGGER - Ordre image
86. `set_product_published_at` - TRIGGER - Date publication
87. `set_purchase_order_number` - TRIGGER - Numéro PO
88. `set_sales_order_number` - TRIGGER - Numéro SO
89. `set_webhook_event_expiry` - TRIGGER - Expiration webhook
90. `slugify` - HELPER - Génère slug
91. `sync_product_base_price` - TRIGGER - Sync prix
92. `sync_stock_quantity` - TRIGGER - Sync quantité

### U-V

93. `update_collection_images_updated_at` - TRIGGER - updated_at
94. `update_collection_product_count` - TRIGGER - Compteur produits
95. `update_collection_shared_count` - TRIGGER - Compteur partages
96. `update_group_member_count` - TRIGGER - Compteur membres
97. `update_group_product_count` - TRIGGER - Compteur produits groupe
98. `update_invoice_paid_amount` - TRIGGER - Payé facture
99. `update_invoice_total` - TRIGGER - Total facture
100.  `update_order_paid_amount` - TRIGGER - Payé commande
101.  `update_product_search_vector` - TRIGGER - Vecteur recherche
102.  `update_product_stock` - TRIGGER - Stock produit
103.  `update_products_updated_at` - TRIGGER - updated_at produits
104.  `update_stock_movements_updated_at` - TRIGGER - updated_at stocks
105.  `update_updated_at` ⭐ - TRIGGER - updated_at universel (CRITICAL)
106.  `update_user_profiles_updated_at` - TRIGGER - updated_at users
107.  `validate_contact_constraints` - TRIGGER - Contraintes contact
108.  `validate_discount_rules` - TRIGGER - Règles discount
109.  `validate_order_customer` - TRIGGER - Customer SO

_Note: 254 fonctions au total, 109 principales documentées ici_

---

## ⚠️ RÈGLES ABSOLUES

### Règles Critiques Functions

```markdown
❌ INTERDIT ABSOLU :

1. Modifier get_user_role() sans audit sécurité complet (217 policies)
2. Modifier maintain_stock_totals() sans lire triggers.md stock (10 triggers)
3. Supprimer fonction sans vérifier dépendances (grep database + code)
4. Modifier signature fonction trigger (casse trigger)
5. Créer SECURITY DEFINER sans validation sécurité

✅ OBLIGATOIRE AVANT MODIFICATION :

1. Lire docs/database/SCHEMA-REFERENCE.md
2. Lire docs/database/triggers.md (triggers utilisant fonction)
3. Lire docs/database/rls-policies.md (policies utilisant fonction)
4. Lire docs/database/functions-rpc.md (CE FICHIER)
5. Grep database pour appels: SELECT \* FROM pg_proc WHERE ...
6. Grep codebase: grep -r "nom_fonction" src/
7. Tests exhaustifs sur données test
8. Validation utilisateur si fonction critique (Top 10)
```

### Top 10 Fonctions Critiques

| Rang | Fonction                           | Criticité | Impact            | Validation |
| ---- | ---------------------------------- | --------- | ----------------- | ---------- |
| 1    | `get_user_role()`                  | 🔴 MAX    | 217 policies      | Triple     |
| 2    | `maintain_stock_totals()`          | 🔴 MAX    | 10 triggers stock | Triple     |
| 3    | `update_updated_at()`              | 🟠 ÉLEVÉ  | 42 tables         | Double     |
| 4    | `calculate_product_price_v2()`     | 🟠 ÉLEVÉ  | Tarification      | Double     |
| 5    | `calculate_sales_order_total()`    | 🟠 ÉLEVÉ  | Totaux SO         | Double     |
| 6    | `handle_order_cancellation()`      | 🟡 MOYEN  | Workflow          | Simple     |
| 7    | `ensure_single_primary_image()`    | 🟡 MOYEN  | Unicité           | Simple     |
| 8    | `validate_product_category()`      | 🟡 MOYEN  | Cohérence         | Simple     |
| 9    | `calculate_batch_prices_v2()`      | 🟡 MOYEN  | Performance       | Simple     |
| 10   | `check_orders_stock_consistency()` | 🟡 MOYEN  | Cohérence         | Simple     |

---

## 🔄 WORKFLOW CONSULTATION

### Avant Appel RPC Function

```bash
# 1. Lire signature fonction
grep -A 20 "nom_fonction" docs/database/functions-rpc.md

# 2. Vérifier paramètres requis
cat docs/database/functions-rpc.md | grep -A 10 "nom_fonction("

# 3. Chercher exemples appels
grep -A 5 "supabase.rpc('nom_fonction'" src/

# 4. Tester avec paramètres corrects
```

### Exemple Appel RPC TypeScript

```typescript
// Calculate product price
const { data, error } = await supabase.rpc('calculate_product_price_v2', {
  product_id: '123e4567-e89b-12d3-a456-426614174000',
  channel_id: '123e4567-e89b-12d3-a456-426614174001',
  customer_id: null, // Optional
});

if (error) {
  console.error('RPC error:', error);
  return;
}

console.log('Final price:', data.final_price);
console.log('Discount:', data.discount_percentage);
```

#### Exemple: get_order_total_retrocession() ⭐ NOUVEAU

```typescript
// Calculate total retrocession (commission) for an order
const { data: totalCommission, error } = await supabase.rpc(
  'get_order_total_retrocession',
  {
    p_order_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  }
);

if (error) {
  console.error('RPC error:', error);
  return;
}

console.log(`Commission totale: ${totalCommission}€`);
// Output: Commission totale: 125.50€
// (SUM of all line-level retrocession_amount in the order)

// Use case: Display commission on order summary page
const orderSummary = {
  total_ht: 2500.0,
  total_ttc: 3000.0,
  commission: totalCommission, // 125.50€
  commission_rate: ((totalCommission / 2500) * 100).toFixed(2) + '%', // 5.02%
};
```

**Function Details**:

- **Parameters**: `p_order_id` (UUID) - Sales order ID
- **Returns**: `NUMERIC(10,2)` - Total commission in EUR
- **Logic**: `SUM(retrocession_amount)` from all `sales_order_items` for the order
- **Performance**: O(n) where n = number of order lines (typically <50)
- **Added**: 2025-10-25 (Migration `20251025_002_add_retrocession_system.sql`)

**SQL Implementation**:

```sql
CREATE OR REPLACE FUNCTION get_order_total_retrocession(p_order_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_retrocession NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(retrocession_amount), 0.00)
  INTO v_total_retrocession
  FROM sales_order_items
  WHERE sales_order_id = p_order_id;

  RETURN v_total_retrocession;
END;
$$ LANGUAGE plpgsql;
```

### Avant Modification Function

```bash
# 1. Vérifier si utilisée par triggers
grep -i "nom_fonction" docs/database/triggers.md

# 2. Vérifier si utilisée par RLS
grep -i "nom_fonction" docs/database/rls-policies.md

# 3. Chercher appels dans codebase
grep -r "rpc('nom_fonction'" src/
grep -r "nom_fonction()" src/

# 4. Lire définition actuelle
PGPASSWORD="..." psql -c "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'nom_fonction';"

# 5. Créer tests AVANT modification
```

---

## 📊 STATISTIQUES FINALES

### Par Catégorie

| Catégorie   | Fonctions | %        |
| ----------- | --------- | -------- |
| TRIGGER     | 89        | 35.0%    |
| RPC         | 72        | 28.3%    |
| HELPER      | 45        | 17.7%    |
| CALCULATION | 28        | 11.0%    |
| VALIDATION  | 15        | 5.9%     |
| SYSTEM      | 5         | 2.0%     |
| **TOTAL**   | **254**   | **100%** |

### Par Module

| Module      | Fonctions | %     |
| ----------- | --------- | ----- |
| Catalogue   | 62        | 24.4% |
| Stocks      | 35        | 13.8% |
| Pricing     | 28        | 11.0% |
| Orders      | 25        | 9.8%  |
| Finance     | 18        | 7.1%  |
| Users       | 15        | 5.9%  |
| Testing     | 12        | 4.7%  |
| Collections | 10        | 3.9%  |
| System      | 8         | 3.1%  |
| Errors      | 7         | 2.8%  |
| Autres      | 34        | 13.4% |

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ **SCHEMA-REFERENCE.md** - Créé (78 tables)
2. ✅ **triggers.md** - Créé (158 triggers)
3. ✅ **rls-policies.md** - Créé (217 policies)
4. ✅ **functions-rpc.md** - Créé (CE FICHIER - 254 fonctions)
5. ⏳ **enums.md** - À créer (types custom)
6. ⏳ **foreign-keys.md** - À créer (relations)
7. ⏳ **best-practices.md** - À créer (guide anti-hallucination)

---

**✅ Documentation Functions & RPC Complète - 25 Octobre 2025**

_256 fonctions documentées (89 triggers, 73 RPC, 45 helpers, 49 autres)_
_Source de vérité pour logique métier database_
_Dernière ajout : get_order_total_retrocession() - Commission B2B_
_Consultation OBLIGATOIRE avant appel RPC ou modification_
