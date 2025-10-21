# 🔧 TRIGGERS - Documentation Complète

**Date création** : 17 octobre 2025
**Dernière mise à jour** : 19 octobre 2025 (Réceptions/Expéditions - 22 triggers + Algorithme Idempotent)
**Database** : Supabase PostgreSQL (aorroydfjsrygmosnzrl)
**Total** : 159 triggers sur 59 tables
**Statut** : ✅ Production Active

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#vue-densemble)
2. [Triggers Critiques Interdépendants](#triggers-critiques-interdépendants)
3. [Triggers par Module](#triggers-par-module)
4. [Types de Triggers](#types-de-triggers)
5. [Workflow Consultation](#workflow-consultation)

---

## 🎯 VUE D'ENSEMBLE

### Statistiques Générales

| Catégorie | Total | Description |
|-----------|-------|-------------|
| **Tables avec triggers** | 59 | Sur 78 tables totales |
| **Triggers BEFORE** | 89 | Validation/modification avant INSERT/UPDATE |
| **Triggers AFTER** | 69 | Actions après INSERT/UPDATE/DELETE |
| **Triggers conditionnels** | 23 | Avec clause WHEN |
| **Triggers sur INSERT** | 51 | Nouvelles lignes |
| **Triggers sur UPDATE** | 94 | Modifications |
| **Triggers sur DELETE** | 13 | Suppressions |

### Top 10 Tables avec Plus de Triggers

| Rang | Table | Triggers | Module |
|------|-------|----------|--------|
| 1 | `products` | 18 | Catalogue |
| 2 | `price_list_items` | 10 | Pricing |
| 3 | `stock_movements` | 10 | ⚠️ Stocks (Interdépendants) |
| 4 | `sales_orders` | 8 | Commandes Vente |
| 5 | `product_images` | 7 | Catalogue |
| 6 | `purchase_orders` | 7 | Commandes Achat |
| 7 | `user_profiles` | 6 | Utilisateurs |
| 8 | `collection_images` | 5 | Collections |
| 9 | `error_reports_v2` | 5 | Monitoring |
| 10 | `invoices` | 4 | Facturation |

---

## ⚠️ TRIGGERS CRITIQUES INTERDÉPENDANTS

### Stock Movements (10 Triggers) - ATTENTION MAXIMALE

**Table** : `stock_movements`
**Triggers** : 10 triggers interdépendants
**Criticité** : 🔴 MAXIMALE - Modification peut casser tout le système stock

#### Liste des 10 Triggers Stocks

1. **check_stock_reservation_before_delete** (BEFORE DELETE)
   - **Fonction** : `check_stock_reservation_before_delete()`
   - **Condition** : Aucune
   - **Action** : Empêche suppression si réservation existe

2. **prevent_manual_stock_movement_modification** (BEFORE UPDATE)
   - **Fonction** : `prevent_manual_stock_movement_modification()`
   - **Condition** : Aucune
   - **Action** : Empêche modification manuelle mouvements stock

3. **trigger_check_stock_movement_type** (BEFORE INSERT)
   - **Fonction** : `check_stock_movement_type()`
   - **Condition** : Aucune
   - **Action** : Valide type mouvement (IN/OUT/TRANSFER/ADJUSTMENT)

4. **trigger_check_stock_movement_type** (BEFORE UPDATE)
   - **Fonction** : `check_stock_movement_type()`
   - **Condition** : Aucune
   - **Action** : Valide type mouvement à la modification

5. **trigger_maintain_stock_totals** (AFTER DELETE)
   - **Fonction** : `maintain_stock_totals()`
   - **Condition** : Aucune
   - **Action** : Recalcule totaux stock après suppression

6. **trigger_maintain_stock_totals** (AFTER INSERT)
   - **Fonction** : `maintain_stock_totals()`
   - **Condition** : Aucune
   - **Action** : Recalcule totaux stock après ajout

7. **trigger_maintain_stock_totals** (AFTER UPDATE)
   - **Fonction** : `maintain_stock_totals()`
   - **Condition** : Aucune
   - **Action** : Recalcule totaux stock après modification

8. **trigger_stock_movements_updated_at** (BEFORE UPDATE)
   - **Fonction** : `update_stock_movements_updated_at()`
   - **Condition** : Aucune
   - **Action** : Met à jour timestamp updated_at

9. **trigger_update_product_stock_on_insert** (AFTER INSERT)
   - **Fonction** : `update_product_stock()`
   - **Condition** : Aucune
   - **Action** : Synchronise stock produit après ajout mouvement

10. **trigger_update_product_stock_on_update** (AFTER UPDATE)
    - **Fonction** : `update_product_stock()`
    - **Condition** : WHEN ((old.quantity <> new.quantity) OR (old.movement_type <> new.movement_type))
    - **Action** : Synchronise stock produit si quantité/type change

#### ⚠️ RÈGLES ABSOLUES Triggers Stocks

```markdown
❌ INTERDIT ABSOLU :
- Modifier/supprimer triggers stock sans lire CETTE documentation
- Créer nouveau trigger stock sans comprendre interdépendances
- Désactiver temporairement un trigger (casse toute la chaîne)
- Modifier ordre d'exécution (BEFORE/AFTER critique)

✅ OBLIGATOIRE AVANT MODIFICATION :
1. Lire cette section complète
2. Lire docs/database/functions-rpc.md pour fonctions liées
3. Comprendre flux complet : INSERT → BEFORE checks → AFTER totals → products.stock_quantity
4. Tester sur données test AVANT production
5. Validation utilisateur MANDATORY
```

#### Workflow Flux Stock Complet

```
INSERT stock_movement
    ↓
BEFORE INSERT: trigger_check_stock_movement_type
    → Valide movement_type IN('IN','OUT','TRANSFER','ADJUSTMENT')
    ↓
AFTER INSERT: trigger_update_product_stock_on_insert
    → Appelle update_product_stock()
    → Met à jour products.stock_quantity
    ↓
AFTER INSERT: trigger_maintain_stock_totals
    → Recalcule stock_real, stock_forecasted_in, stock_forecasted_out
    → Met à jour products aggregates
    ↓
✅ Stock synchronisé products + stock_movements
```

---

## 📊 TRIGGERS PAR MODULE

### 1. FACTURATION & ABBY API (8 triggers)

#### Table: `abby_sync_queue` (2 triggers)

##### 1.1. calculate_next_retry_trigger
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : `WHEN ((old.status <> new.status) AND (new.status = 'failed'::text))`
- **Fonction** : `calculate_next_retry()`
- **Description** : Calcule prochain retry automatique quand sync échoue
- **Définition SQL** :
```sql
CREATE TRIGGER calculate_next_retry_trigger
BEFORE UPDATE ON public.abby_sync_queue
FOR EACH ROW
WHEN (((old.status <> new.status) AND (new.status = 'failed'::text)))
EXECUTE FUNCTION calculate_next_retry()
```

##### 1.2. mark_sync_operation_success_trigger
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : `WHEN (new.status = 'success'::text)`
- **Fonction** : `mark_sync_operation_success()`
- **Description** : Marque opération comme succès et enregistre timestamp
- **Définition SQL** :
```sql
CREATE TRIGGER mark_sync_operation_success_trigger
BEFORE UPDATE ON public.abby_sync_queue
FOR EACH ROW
WHEN ((new.status = 'success'::text))
EXECUTE FUNCTION mark_sync_operation_success()
```

#### Table: `abby_webhook_events` (1 trigger)

##### 1.3. set_webhook_event_expiry_trigger
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `set_webhook_event_expiry()`
- **Description** : Définit expiration automatique webhook events (7 jours)
- **Définition SQL** :
```sql
CREATE TRIGGER set_webhook_event_expiry_trigger
BEFORE INSERT ON public.abby_webhook_events
FOR EACH ROW
EXECUTE FUNCTION set_webhook_event_expiry()
```

#### Table: `financial_documents` (1 trigger)

##### 1.4. set_financial_document_ref
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `set_financial_document_ref()`
- **Description** : Génère référence unique document financier (facture, avoir, etc.)
- **Définition SQL** :
```sql
CREATE TRIGGER set_financial_document_ref
BEFORE INSERT ON public.financial_documents
FOR EACH ROW
EXECUTE FUNCTION set_financial_document_ref()
```

#### Table: `financial_payments` (2 triggers)

##### 1.5. financial_payments_updated_at (BEFORE UPDATE)
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER financial_payments_updated_at
BEFORE UPDATE ON public.financial_payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 1.6. trigger_update_invoice_paid_amount (AFTER INSERT/UPDATE/DELETE)
- **Timing** : AFTER INSERT/UPDATE/DELETE
- **Événement** : INSERT, UPDATE, DELETE
- **Condition** : Aucune
- **Fonction** : `update_invoice_paid_amount()`
- **Description** : Recalcule montant payé invoice après paiements
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_update_invoice_paid_amount
AFTER INSERT OR DELETE OR UPDATE ON public.financial_payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_paid_amount()
```

#### Table: `invoices` (4 triggers)

##### 1.7. invoices_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 1.8. trigger_invoice_status_change
- **Timing** : AFTER UPDATE
- **Événement** : UPDATE
- **Condition** : `WHEN (old.status IS DISTINCT FROM new.status)`
- **Fonction** : `handle_invoice_status_change()`
- **Description** : Gère changements statut invoice (paid, overdue, cancelled)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_invoice_status_change
AFTER UPDATE ON public.invoices
FOR EACH ROW
WHEN ((old.status IS DISTINCT FROM new.status))
EXECUTE FUNCTION handle_invoice_status_change()
```

##### 1.9. trigger_set_invoice_reference (BEFORE INSERT)
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `set_invoice_reference()`
- **Description** : Génère numéro facture unique séquentiel
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_set_invoice_reference
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION set_invoice_reference()
```

##### 1.10. trigger_update_invoice_total (AFTER INSERT/UPDATE/DELETE on invoice_items)
- **Note** : Trigger sur `invoice_items` mais impacte `invoices`
- **Timing** : AFTER INSERT/UPDATE/DELETE
- **Événement** : INSERT, UPDATE, DELETE
- **Condition** : Aucune
- **Fonction** : `update_invoice_total()`
- **Description** : Recalcule total facture après modifications items

---

### 2. BANKING (1 trigger)

#### Table: `bank_transactions` (1 trigger)

##### 2.1. set_bank_transactions_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at_column()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER set_bank_transactions_updated_at
BEFORE UPDATE ON public.bank_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column()
```

---

### 3. CATALOGUE (48 triggers)

#### Table: `products` (18 triggers) ⭐

##### 3.1. check_product_variant_rules (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `check_product_variant_rules()`
- **Description** : Valide règles variantes produits (couleur, taille requises si is_variant=true)
- **Définition SQL** :
```sql
CREATE TRIGGER check_product_variant_rules
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION check_product_variant_rules()
```

##### 3.2. handle_product_deletion (BEFORE DELETE)
- **Timing** : BEFORE DELETE
- **Événement** : DELETE
- **Condition** : Aucune
- **Fonction** : `handle_product_deletion()`
- **Description** : Gère suppression produit (cascade images, variantes, etc.)
- **Définition SQL** :
```sql
CREATE TRIGGER handle_product_deletion
BEFORE DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION handle_product_deletion()
```

##### 3.3. prevent_primary_image_deletion (BEFORE DELETE)
- **Timing** : BEFORE DELETE
- **Événement** : DELETE
- **Condition** : Aucune
- **Fonction** : `prevent_primary_image_deletion()`
- **Description** : Empêche suppression produit si image primaire existe
- **Définition SQL** :
```sql
CREATE TRIGGER prevent_primary_image_deletion
BEFORE DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION prevent_primary_image_deletion()
```

##### 3.4. set_product_display_order (BEFORE INSERT)
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `set_product_display_order()`
- **Description** : Définit ordre affichage automatique nouveaux produits
- **Définition SQL** :
```sql
CREATE TRIGGER set_product_display_order
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION set_product_display_order()
```

##### 3.5. trigger_generate_product_sku (BEFORE INSERT)
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `generate_product_sku()`
- **Description** : Génère SKU unique si non fourni
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_generate_product_sku
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION generate_product_sku()
```

##### 3.6. trigger_products_updated_at (BEFORE UPDATE)
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_products_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at()
```

##### 3.7. trigger_set_product_published_at (BEFORE UPDATE)
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : `WHEN (((old.status <> 'published'::product_status) AND (new.status = 'published'::product_status)))`
- **Fonction** : `set_product_published_at()`
- **Description** : Enregistre date publication quand statut passe à published
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_set_product_published_at
BEFORE UPDATE ON public.products
FOR EACH ROW
WHEN (((old.status <> 'published'::product_status) AND (new.status = 'published'::product_status)))
EXECUTE FUNCTION set_product_published_at()
```

##### 3.8. trigger_sync_stock_quantity (AFTER UPDATE)
- **Timing** : AFTER UPDATE
- **Événement** : UPDATE
- **Condition** : `WHEN ((old.stock_quantity IS DISTINCT FROM new.stock_quantity))`
- **Fonction** : `sync_stock_quantity()`
- **Description** : Synchronise stock_quantity avec totaux calculés
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_sync_stock_quantity
AFTER UPDATE ON public.products
FOR EACH ROW
WHEN ((old.stock_quantity IS DISTINCT FROM new.stock_quantity))
EXECUTE FUNCTION sync_stock_quantity()
```

##### 3.9. trigger_update_product_search_vector (BEFORE INSERT)
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `update_product_search_vector()`
- **Description** : Génère vecteur recherche full-text (nom, description, SKU)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_update_product_search_vector
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_product_search_vector()
```

##### 3.10. trigger_update_product_search_vector (BEFORE UPDATE)
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_product_search_vector()`
- **Description** : Met à jour vecteur recherche si nom/description/SKU change
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_update_product_search_vector
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_product_search_vector()
```

##### 3.11-3.18. Autres triggers products
- `validate_product_category` (BEFORE INSERT/UPDATE) - Valide catégorie/famille/subcategory
- `validate_product_dimensions` (BEFORE INSERT/UPDATE) - Valide dimensions produit
- `validate_product_prices` (BEFORE INSERT/UPDATE) - Valide cohérence prix
- `validate_product_stock` (BEFORE INSERT/UPDATE) - Valide stock négatif interdit
- Plusieurs autres triggers validation business rules

#### Table: `product_images` (7 triggers)

##### 3.19. product_images_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER product_images_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 3.20. trigger_ensure_single_primary_image (AFTER INSERT/UPDATE)
- **Timing** : AFTER INSERT, AFTER UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : `WHEN (new.is_primary = true)`
- **Fonction** : `ensure_single_primary_image()`
- **Description** : Assure qu'UN SEUL is_primary=true par produit
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_ensure_single_primary_image
AFTER INSERT OR UPDATE ON public.product_images
FOR EACH ROW
WHEN ((new.is_primary = true))
EXECUTE FUNCTION ensure_single_primary_image()
```

##### 3.21. trigger_generate_product_image_url (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `generate_product_image_url()`
- **Description** : Génère URL publique Supabase Storage
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_generate_product_image_url
BEFORE INSERT OR UPDATE ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION generate_product_image_url()
```

##### 3.22. trigger_product_images_display_order (BEFORE INSERT)
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `set_product_image_display_order()`
- **Description** : Définit ordre affichage automatique nouvelles images
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_product_images_display_order
BEFORE INSERT ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION set_product_image_display_order()
```

##### 3.23-3.25. Autres triggers product_images
- `trigger_update_product_image_count` (AFTER INSERT/DELETE) - Met à jour compteur images produit
- `validate_product_image_type` (BEFORE INSERT/UPDATE) - Valide format image (JPEG, PNG, WEBP)

#### Table: `categories` (1 trigger)

##### 3.26. trigger_categories_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `families` (1 trigger)

##### 3.27. trigger_families_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_families_updated_at
BEFORE UPDATE ON public.families
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `subcategories` (1 trigger)

##### 3.28. trigger_subcategories_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_subcategories_updated_at
BEFORE UPDATE ON public.subcategories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `product_colors` (1 trigger)

##### 3.29. product_colors_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER product_colors_updated_at
BEFORE UPDATE ON public.product_colors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `product_groups` (1 trigger)

##### 3.31. product_groups_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER product_groups_updated_at
BEFORE UPDATE ON public.product_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `product_group_members` (2 triggers)

##### 3.32-3.33. update_group_product_count (AFTER INSERT/DELETE/UPDATE)
- **Timing** : AFTER INSERT/DELETE/UPDATE
- **Événement** : INSERT, DELETE, UPDATE
- **Condition** : Aucune
- **Fonction** : `update_group_product_count()`
- **Description** : Met à jour compteur produits dans groupe
- **Définition SQL** :
```sql
CREATE TRIGGER update_group_product_count
AFTER INSERT OR DELETE OR UPDATE ON public.product_group_members
FOR EACH ROW
EXECUTE FUNCTION update_group_product_count()
```

#### Table: `product_packages` (3 triggers)

##### 3.34. product_packages_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER product_packages_updated_at
BEFORE UPDATE ON public.product_packages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 3.35-3.36. trigger_validate_package_dimensions (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `validate_package_dimensions()`
- **Description** : Valide dimensions package (poids, volume cohérents)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_validate_package_dimensions
BEFORE INSERT OR UPDATE ON public.product_packages
FOR EACH ROW
EXECUTE FUNCTION validate_package_dimensions()
```

#### Table: `collections` (1 trigger)

##### 3.37. trigger_collections_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `collection_images` (5 triggers)

##### 3.38. collection_images_generate_url (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `generate_collection_image_url()`
- **Description** : Génère URL publique Supabase Storage
- **Définition SQL** :
```sql
CREATE TRIGGER collection_images_generate_url
BEFORE INSERT OR UPDATE ON public.collection_images
FOR EACH ROW
EXECUTE FUNCTION generate_collection_image_url()
```

##### 3.39. collection_images_single_primary (AFTER INSERT/UPDATE)
- **Timing** : AFTER INSERT, AFTER UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `ensure_single_primary_collection_image()`
- **Description** : Assure qu'UN SEUL is_primary=true par collection
- **Définition SQL** :
```sql
CREATE TRIGGER collection_images_single_primary
AFTER INSERT OR UPDATE ON public.collection_images
FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_collection_image()
```

##### 3.40. trigger_update_collection_images_updated_at (BEFORE UPDATE)
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_collection_images_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_update_collection_images_updated_at
BEFORE UPDATE ON public.collection_images
FOR EACH ROW
EXECUTE FUNCTION update_collection_images_updated_at()
```

#### Table: `collection_products` (2 triggers)

##### 3.41-3.42. trigger_collection_product_count (AFTER INSERT/DELETE)
- **Timing** : AFTER INSERT, AFTER DELETE
- **Événement** : INSERT, DELETE
- **Condition** : Aucune
- **Fonction** : `update_collection_product_count()`
- **Description** : Met à jour compteur produits dans collection
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_collection_product_count
AFTER INSERT OR DELETE ON public.collection_products
FOR EACH ROW
EXECUTE FUNCTION update_collection_product_count()
```

#### Table: `collection_shares` (1 trigger)

##### 3.43. trigger_update_collection_shared_count
- **Timing** : AFTER INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `update_collection_shared_count()`
- **Description** : Met à jour compteur partages collection
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_update_collection_shared_count
AFTER INSERT ON public.collection_shares
FOR EACH ROW
EXECUTE FUNCTION update_collection_shared_count()
```

---

### 4. PRICING (19 triggers)

#### Table: `price_lists` (2 triggers)

##### 4.1. ensure_single_default_price_list (AFTER INSERT/UPDATE)
- **Timing** : AFTER INSERT, AFTER UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : `WHEN (new.is_default = true)`
- **Fonction** : `ensure_single_default_price_list()`
- **Description** : Assure qu'UNE SEULE price_list is_default=true
- **Définition SQL** :
```sql
CREATE TRIGGER ensure_single_default_price_list
AFTER INSERT OR UPDATE ON public.price_lists
FOR EACH ROW
WHEN ((new.is_default = true))
EXECUTE FUNCTION ensure_single_default_price_list()
```

##### 4.2. price_lists_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER price_lists_updated_at
BEFORE UPDATE ON public.price_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `price_list_items` (10 triggers) ⚠️

##### 4.3. price_list_items_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER price_list_items_updated_at
BEFORE UPDATE ON public.price_list_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 4.4. trigger_calculate_price_margins (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `calculate_price_margins()`
- **Description** : Calcule marge automatiquement (prix vente - coût)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_calculate_price_margins
BEFORE INSERT OR UPDATE ON public.price_list_items
FOR EACH ROW
EXECUTE FUNCTION calculate_price_margins()
```

##### 4.5. trigger_enforce_price_minimum (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `enforce_price_minimum()`
- **Description** : Empêche prix < 0.01€
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_enforce_price_minimum
BEFORE INSERT OR UPDATE ON public.price_list_items
FOR EACH ROW
EXECUTE FUNCTION enforce_price_minimum()
```

##### 4.6-4.13. Autres triggers price_list_items
- `trigger_validate_discount_rules` (BEFORE INSERT/UPDATE) - Valide règles discount (max 100%)
- `trigger_validate_quantity_breaks` (BEFORE INSERT/UPDATE) - Valide paliers quantité (min < max)
- `trigger_sync_product_base_price` (AFTER INSERT/UPDATE) - Synchronise products.base_price
- `trigger_invalidate_cached_prices` (AFTER INSERT/UPDATE/DELETE) - Invalide cache pricing
- Plusieurs autres triggers validation pricing

#### Table: `channel_price_lists` (3 triggers)

##### 4.14. channel_price_lists_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER channel_price_lists_updated_at
BEFORE UPDATE ON public.channel_price_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 4.15-4.16. ensure_single_default_channel (AFTER INSERT/UPDATE)
- **Timing** : AFTER INSERT, AFTER UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : `WHEN (new.is_default = true)`
- **Fonction** : `ensure_single_default_channel_list()`
- **Description** : Assure qu'UNE SEULE channel_price_list is_default=true par canal
- **Définition SQL** :
```sql
CREATE TRIGGER ensure_single_default_channel
AFTER INSERT OR UPDATE ON public.channel_price_lists
FOR EACH ROW
WHEN ((new.is_default = true))
EXECUTE FUNCTION ensure_single_default_channel_list()
```

#### Table: `channel_pricing` (1 trigger)

##### 4.17. channel_pricing_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER channel_pricing_updated_at
BEFORE UPDATE ON public.channel_pricing
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `customer_price_lists` (3 triggers)

##### 4.18. customer_price_lists_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER customer_price_lists_updated_at
BEFORE UPDATE ON public.customer_price_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 4.19-4.20. Autres triggers customer_price_lists
- `trigger_validate_price_list_dates` (BEFORE INSERT/UPDATE) - Valide start_date < end_date
- `trigger_notify_customer_price_change` (AFTER UPDATE) - Notifie client changement prix

#### Table: `customer_pricing` (1 trigger)

##### 4.21. customer_pricing_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER customer_pricing_updated_at
BEFORE UPDATE ON public.customer_pricing
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

---

### 5. CLIENTS & CONTACTS (16 triggers)

#### Table: `organisations` (4 triggers)

##### 5.1. organisations_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER organisations_updated_at
BEFORE UPDATE ON public.organisations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 5.2. trigger_generate_org_code (BEFORE INSERT)
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `generate_org_code()`
- **Description** : Génère code organisation unique (ORG-XXXX)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_generate_org_code
BEFORE INSERT ON public.organisations
FOR EACH ROW
EXECUTE FUNCTION generate_org_code()
```

##### 5.3-5.4. trigger_validate_org_type (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `validate_org_type()`
- **Description** : Valide type IN('supplier','manufacturer','customer','partner')
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_validate_org_type
BEFORE INSERT OR UPDATE ON public.organisations
FOR EACH ROW
EXECUTE FUNCTION validate_org_type()
```

#### Table: `individual_customers` (1 trigger)

##### 5.5. individual_customers_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER individual_customers_updated_at
BEFORE UPDATE ON public.individual_customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `contacts` (3 triggers)

##### 5.6. trigger_contacts_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_contacts_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION update_contacts_updated_at()
```

##### 5.7-5.8. trigger_validate_contact_constraints (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `validate_contact_constraints()`
- **Description** : Valide contraintes (email OU phone obligatoire)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_validate_contact_constraints
BEFORE INSERT OR UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION validate_contact_constraints()
```

#### Table: `client_consultations` (1 trigger)

##### 5.9. trigger_consultations_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at_column()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_consultations_updated_at
BEFORE UPDATE ON public.client_consultations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column()
```

#### Table: `consultation_images` (3 triggers)

##### 5.10-5.11. trigger_manage_consultation_primary_image (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `manage_consultation_primary_image()`
- **Description** : Gère image primaire consultation
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_manage_consultation_primary_image
BEFORE INSERT OR UPDATE ON public.consultation_images
FOR EACH ROW
EXECUTE FUNCTION manage_consultation_primary_image()
```

##### 5.12. trigger_update_consultation_images_updated_at (BEFORE UPDATE)
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_consultation_images_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_update_consultation_images_updated_at
BEFORE UPDATE ON public.consultation_images
FOR EACH ROW
EXECUTE FUNCTION update_consultation_images_updated_at()
```

#### Table: `customer_groups` (1 trigger)

##### 5.13. customer_groups_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER customer_groups_updated_at
BEFORE UPDATE ON public.customer_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `customer_group_members` (3 triggers)

##### 5.14-5.16. update_member_count (AFTER INSERT/UPDATE/DELETE)
- **Timing** : AFTER INSERT, AFTER UPDATE, AFTER DELETE
- **Événement** : INSERT, UPDATE, DELETE
- **Condition** : Aucune
- **Fonction** : `update_group_member_count()`
- **Description** : Met à jour compteur membres dans groupe
- **Définition SQL** :
```sql
CREATE TRIGGER update_member_count
AFTER INSERT OR DELETE OR UPDATE ON public.customer_group_members
FOR EACH ROW
EXECUTE FUNCTION update_group_member_count()
```

---

### 6. COMMANDES VENTE (15 triggers)

#### Table: `sales_orders` (8 triggers)

##### 6.1. prevent_completed_order_modification (BEFORE UPDATE)
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `prevent_completed_order_modification()`
- **Description** : Empêche modification commande status='completed'
- **Définition SQL** :
```sql
CREATE TRIGGER prevent_completed_order_modification
BEFORE UPDATE ON public.sales_orders
FOR EACH ROW
EXECUTE FUNCTION prevent_completed_order_modification()
```

##### 6.2. sales_orders_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER sales_orders_updated_at
BEFORE UPDATE ON public.sales_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 6.3. trigger_calculate_order_total (AFTER INSERT/UPDATE on sales_order_items)
- **Note** : Trigger sur `sales_order_items` mais impacte `sales_orders`
- **Timing** : AFTER INSERT/UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `calculate_sales_order_total()`
- **Description** : Recalcule total commande après modifications items
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_calculate_order_total
AFTER INSERT OR UPDATE ON public.sales_order_items
FOR EACH ROW
EXECUTE FUNCTION calculate_sales_order_total()
```

##### 6.4. trigger_handle_order_cancellation (AFTER UPDATE)
- **Timing** : AFTER UPDATE
- **Événement** : UPDATE
- **Condition** : `WHEN ((old.status <> 'cancelled'::sales_order_status) AND (new.status = 'cancelled'::sales_order_status))`
- **Fonction** : `handle_order_cancellation()`
- **Description** : Gère annulation commande (libère stock réservé)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_handle_order_cancellation
AFTER UPDATE ON public.sales_orders
FOR EACH ROW
WHEN (((old.status <> 'cancelled'::sales_order_status) AND (new.status = 'cancelled'::sales_order_status)))
EXECUTE FUNCTION handle_order_cancellation()
```

##### 6.5. trigger_reserve_stock_on_confirmation (AFTER UPDATE)
- **Timing** : AFTER UPDATE
- **Événement** : UPDATE
- **Condition** : `WHEN ((old.status <> 'confirmed'::sales_order_status) AND (new.status = 'confirmed'::sales_order_status))`
- **Fonction** : `reserve_stock_for_order()`
- **Description** : Réserve stock quand commande confirmée
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_reserve_stock_on_confirmation
AFTER UPDATE ON public.sales_orders
FOR EACH ROW
WHEN (((old.status <> 'confirmed'::sales_order_status) AND (new.status = 'confirmed'::sales_order_status)))
EXECUTE FUNCTION reserve_stock_for_order()
```

##### 6.6. trigger_set_order_number (BEFORE INSERT)
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `set_sales_order_number()`
- **Description** : Génère numéro commande unique (SO-YYYY-XXXX)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.sales_orders
FOR EACH ROW
EXECUTE FUNCTION set_sales_order_number()
```

##### 6.7-6.8. trigger_validate_order_customer (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `validate_order_customer()`
- **Description** : Valide customer_id existe (organisation OU individual_customer)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_validate_order_customer
BEFORE INSERT OR UPDATE ON public.sales_orders
FOR EACH ROW
EXECUTE FUNCTION validate_order_customer()
```

#### Table: `sales_order_items` (1 trigger)

##### 6.9. sales_order_items_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER sales_order_items_updated_at
BEFORE UPDATE ON public.sales_order_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `shipments` (1 trigger)

##### 6.10. shipments_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `order_discounts` (1 trigger)

##### 6.11. order_discounts_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER order_discounts_updated_at
BEFORE UPDATE ON public.order_discounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `sales_channels` (1 trigger)

##### 6.12. sales_channels_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER sales_channels_updated_at
BEFORE UPDATE ON public.sales_channels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `payments` (4 triggers)

##### 6.13. payments_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 6.14-6.15. trigger_update_order_paid_amount (AFTER INSERT/UPDATE/DELETE)
- **Timing** : AFTER INSERT, AFTER UPDATE, AFTER DELETE
- **Événement** : INSERT, UPDATE, DELETE
- **Condition** : Aucune
- **Fonction** : `update_order_paid_amount()`
- **Description** : Recalcule montant payé commande après paiements
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_update_order_paid_amount
AFTER INSERT OR DELETE OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_order_paid_amount()
```

##### 6.16. trigger_validate_payment_amount (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `validate_payment_amount()`
- **Description** : Valide montant > 0 et <= total commande
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_validate_payment_amount
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION validate_payment_amount()
```

---

### 7. COMMANDES ACHAT (12 triggers)

#### 🏗️ Architecture Bi-Trigger (2025-10-18)

**Problème historique** : Le trigger `handle_purchase_order_forecast()` (sur `purchase_orders`) ne pouvait PAS gérer les réceptions partielles car le LATERAL JOIN pour comparer OLD vs NEW `quantity_received` était cassé (OLD.id = NEW.id → même table déjà updated).

**Solution adoptée** : Séparation des responsabilités en 2 triggers spécialisés :

| Trigger | Table | Responsabilité |
|---------|-------|----------------|
| **Trigger A** : `handle_purchase_order_forecast()` | `purchase_orders` | Transitions status globales (confirmed, cancelled, received TOTAL) |
| **Trigger B** : `handle_purchase_order_item_receipt()` | `purchase_order_items` | Réceptions partielles item par item (quantity_received changes) |

**Workflow réceptions partielles** :
1. PO passe en `partially_received` → Trigger A ne fait RIEN
2. User update `quantity_received` sur item → **Trigger B s'active**
3. Trigger B détecte OLD.quantity_received vs NEW.quantity_received
4. Trigger B crée 2 mouvements : OUT forecast (-delta) + IN real (+delta)
5. Répéter étapes 2-4 pour chaque réception partielle

**Avantages** :
- ✅ Accès direct OLD/NEW values sur `purchase_order_items`
- ✅ Trigger auto-filtré via clause WHEN (performance)
- ✅ Traçabilité item par item via `stock_movements.purchase_order_item_id`
- ✅ Logique simple et testable (Single Responsibility)

---

#### Table: `purchase_orders` (7 triggers)

##### 7.1. prevent_completed_po_modification (BEFORE UPDATE)
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `prevent_completed_po_modification()`
- **Description** : Empêche modification purchase order status='completed'
- **Définition SQL** :
```sql
CREATE TRIGGER prevent_completed_po_modification
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION prevent_completed_po_modification()
```

##### 7.2. purchase_orders_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 7.3. trigger_calculate_po_total (AFTER INSERT/UPDATE on purchase_order_items)
- **Note** : Trigger sur `purchase_order_items` mais impacte `purchase_orders`
- **Timing** : AFTER INSERT/UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `calculate_purchase_order_total()`
- **Description** : Recalcule total commande achat après modifications items
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_calculate_po_total
AFTER INSERT OR UPDATE ON public.purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION calculate_purchase_order_total()
```

##### 7.4. trigger_handle_po_cancellation (AFTER UPDATE)
- **Timing** : AFTER UPDATE
- **Événement** : UPDATE
- **Condition** : `WHEN ((old.status <> 'cancelled'::purchase_order_status) AND (new.status = 'cancelled'::purchase_order_status))`
- **Fonction** : `handle_po_cancellation()`
- **Description** : Gère annulation commande achat (annule prévisions)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_handle_po_cancellation
AFTER UPDATE ON public.purchase_orders
FOR EACH ROW
WHEN (((old.status <> 'cancelled'::purchase_order_status) AND (new.status = 'cancelled'::purchase_order_status)))
EXECUTE FUNCTION handle_po_cancellation()
```

##### 7.5. trigger_set_po_number (BEFORE INSERT)
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `set_purchase_order_number()`
- **Description** : Génère numéro commande achat unique (PO-YYYY-XXXX)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_set_po_number
BEFORE INSERT ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION set_purchase_order_number()
```

##### 7.6-7.7. trigger_validate_po_supplier (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `validate_po_supplier()`
- **Description** : Valide supplier_id existe (organisation type='supplier')
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_validate_po_supplier
BEFORE INSERT OR UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION validate_po_supplier()
```

#### Table: `purchase_order_items` (2 triggers)

##### 7.8. trigger_purchase_order_item_receipt (AFTER UPDATE) ⭐ NOUVEAU 2025-10-18
- **Timing** : AFTER UPDATE
- **Événement** : UPDATE OF quantity_received
- **Condition** : `WHEN (NEW.quantity_received IS DISTINCT FROM OLD.quantity_received)`
- **Fonction** : `handle_purchase_order_item_receipt()`
- **Description** : **Architecture Bi-Trigger** - Gère réceptions partielles item par item
- **Workflow** :
  1. Détecte changements `quantity_received` (OLD vs NEW)
  2. Vérifie PO parent status (must be `partially_received` ou `received`)
  3. Cas 1 (première réception) : OUT prévisionnel + IN réel
  4. Cas 2 (réception supplémentaire) : OUT prévisionnel + IN réel
  5. Enregistre `purchase_order_item_id` pour traçabilité
- **Création** : Migration `20251018_001_add_purchase_order_item_receipt_trigger.sql`
- **Root Cause Fix** : Résout problème LATERAL JOIN cassé (OLD.id = NEW.id dans trigger sur purchase_orders)
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_purchase_order_item_receipt
AFTER UPDATE OF quantity_received ON public.purchase_order_items
FOR EACH ROW
WHEN (NEW.quantity_received IS DISTINCT FROM OLD.quantity_received)
EXECUTE FUNCTION handle_purchase_order_item_receipt()
```

##### 7.9. purchase_order_items_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER purchase_order_items_updated_at
BEFORE UPDATE ON public.purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `purchase_order_receptions` (2 triggers)

##### 7.9. purchase_order_receptions_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER purchase_order_receptions_updated_at
BEFORE UPDATE ON public.purchase_order_receptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 7.10. trigger_create_stock_movement_on_reception (AFTER INSERT)
- **Timing** : AFTER INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `create_stock_movement_on_reception()`
- **Description** : Crée mouvement stock automatique à la réception PO
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_create_stock_movement_on_reception
AFTER INSERT ON public.purchase_order_receptions
FOR EACH ROW
EXECUTE FUNCTION create_stock_movement_on_reception()
```

---

### 8. STOCKS (12 triggers)

#### Table: `stock_movements` (10 triggers) ⚠️ CRITIQUE

**VOIR SECTION [TRIGGERS CRITIQUES INTERDÉPENDANTS](#triggers-critiques-interdépendants)**

#### Table: `stock_reservations` (1 trigger)

##### 8.1. stock_reservations_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER stock_reservations_updated_at
BEFORE UPDATE ON public.stock_reservations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

---

### 9. GOOGLE MERCHANT (3 triggers)

#### Table: `feed_configs` (1 trigger)

##### 9.1. feed_configs_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER feed_configs_updated_at
BEFORE UPDATE ON public.feed_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `feed_performance_metrics` (1 trigger)

##### 9.2. trigger_update_feed_metrics_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_update_feed_metrics_updated_at
BEFORE UPDATE ON public.feed_performance_metrics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

---

### 10. UTILISATEURS (11 triggers)

#### Table: `user_profiles` (6 triggers)

##### 10.1. trigger_user_profiles_updated_at (BEFORE UPDATE)
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_user_profiles_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at()
```

##### 10.2-10.3. trigger_validate_user_role (BEFORE INSERT/UPDATE)
- **Timing** : BEFORE INSERT, BEFORE UPDATE
- **Événement** : INSERT, UPDATE
- **Condition** : Aucune
- **Fonction** : `validate_user_role()`
- **Description** : Valide role IN('owner','admin','user')
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_validate_user_role
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION validate_user_role()
```

##### 10.4-10.5. trigger_prevent_last_owner_removal (BEFORE UPDATE/DELETE)
- **Timing** : BEFORE UPDATE, BEFORE DELETE
- **Événement** : UPDATE, DELETE
- **Condition** : Aucune
- **Fonction** : `prevent_last_owner_removal()`
- **Description** : Empêche suppression/modification dernier owner
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_prevent_last_owner_removal
BEFORE UPDATE OR DELETE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_last_owner_removal()
```

##### 10.6. trigger_log_role_change (AFTER UPDATE)
- **Timing** : AFTER UPDATE
- **Événement** : UPDATE
- **Condition** : `WHEN (old.role IS DISTINCT FROM new.role)`
- **Fonction** : `log_role_change()`
- **Description** : Enregistre audit trail changements rôle
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_log_role_change
AFTER UPDATE ON public.user_profiles
FOR EACH ROW
WHEN ((old.role IS DISTINCT FROM new.role))
EXECUTE FUNCTION log_role_change()
```

#### Table: `user_sessions` (1 trigger)

##### 10.7. trigger_cleanup_expired_sessions
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `cleanup_expired_sessions()`
- **Description** : Nettoie sessions expirées à chaque nouvelle session
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_cleanup_expired_sessions
BEFORE INSERT ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION cleanup_expired_sessions()
```

#### Table: `user_activity_logs` (1 trigger)

##### 10.8. trigger_partition_activity_logs
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `partition_activity_logs()`
- **Description** : Partitionne logs activité par mois
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_partition_activity_logs
BEFORE INSERT ON public.user_activity_logs
FOR EACH ROW
EXECUTE FUNCTION partition_activity_logs()
```

#### Table: `notifications` (1 trigger)

##### 10.9. notifications_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

---

### 11. TESTS & QA (9 triggers)

#### Table: `manual_tests_progress` (4 triggers)

##### 11.1. trigger_update_manual_tests_progress_updated_at (BEFORE UPDATE)
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_manual_tests_progress_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_update_manual_tests_progress_updated_at
BEFORE UPDATE ON public.manual_tests_progress
FOR EACH ROW
EXECUTE FUNCTION update_manual_tests_progress_updated_at()
```

##### 11.2-11.4. Autres triggers manual_tests_progress
- `trigger_update_test_completion` (AFTER UPDATE) - Met à jour % complétion
- `trigger_validate_test_status` (BEFORE INSERT/UPDATE) - Valide status
- `trigger_notify_test_completion` (AFTER UPDATE) - Notifie quand test terminé

#### Table: `test_validation_state` (1 trigger)

##### 11.5. trigger_test_validation_state_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_test_validation_state_updated_at
BEFORE UPDATE ON public.test_validation_state
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `test_sections_lock` (1 trigger)

##### 11.6. trigger_cleanup_expired_locks
- **Timing** : BEFORE INSERT
- **Événement** : INSERT
- **Condition** : Aucune
- **Fonction** : `cleanup_expired_locks()`
- **Description** : Nettoie locks expirés tests
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_cleanup_expired_locks
BEFORE INSERT ON public.test_sections_lock
FOR EACH ROW
EXECUTE FUNCTION cleanup_expired_locks()
```

#### Table: `bug_reports` (1 trigger)

##### 11.7. trigger_bug_reports_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_bug_reports_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER trigger_bug_reports_updated_at
BEFORE UPDATE ON public.bug_reports
FOR EACH ROW
EXECUTE FUNCTION update_bug_reports_updated_at()
```

#### Table: `test_error_reports` (3 triggers)

##### 11.8. test_error_reports_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER test_error_reports_updated_at
BEFORE UPDATE ON public.test_error_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 11.9-11.10. Autres triggers test_error_reports
- `trigger_group_similar_errors` (AFTER INSERT) - Groupe erreurs similaires
- `trigger_auto_resolve_duplicate_errors` (AFTER INSERT) - Résout duplicatas auto

---

### 12. ERRORS & MCP (6 triggers)

#### Table: `error_reports_v2` (5 triggers)

##### 12.1. error_reports_v2_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER error_reports_v2_updated_at
BEFORE UPDATE ON public.error_reports_v2
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

##### 12.2-12.5. Autres triggers error_reports_v2
- `trigger_deduplicate_errors` (AFTER INSERT) - Déduplique erreurs identiques
- `trigger_enqueue_critical_errors` (AFTER INSERT) - Enfile erreurs critiques queue MCP
- `trigger_update_error_frequency` (AFTER INSERT) - Met à jour fréquence erreur
- `trigger_auto_resolve_known_errors` (AFTER INSERT) - Résout erreurs connues auto

#### Table: `mcp_resolution_queue` (1 trigger)

##### 12.6. mcp_resolution_queue_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER mcp_resolution_queue_updated_at
BEFORE UPDATE ON public.mcp_resolution_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

---

### 13. DIVERS (4 triggers)

#### Table: `expense_categories` (1 trigger)

##### 13.1. expense_categories_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER expense_categories_updated_at
BEFORE UPDATE ON public.expense_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

#### Table: `supplier_categories` (1 trigger)

##### 13.2. supplier_categories_updated_at
- **Timing** : BEFORE UPDATE
- **Événement** : UPDATE
- **Condition** : Aucune
- **Fonction** : `update_updated_at()`
- **Description** : Met à jour timestamp updated_at
- **Définition SQL** :
```sql
CREATE TRIGGER supplier_categories_updated_at
BEFORE UPDATE ON public.supplier_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

---

## 📚 TYPES DE TRIGGERS

### 1. Triggers `updated_at` (54 triggers)

**Pattern commun** : Mise à jour automatique timestamp `updated_at`

```sql
-- Fonction commune
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Usage
CREATE TRIGGER [table]_updated_at
BEFORE UPDATE ON [table]
FOR EACH ROW
EXECUTE FUNCTION update_updated_at()
```

**Tables concernées** : 54 tables (70% des tables avec triggers)

---

### 2. Triggers Validation (38 triggers)

**Exemples** :
- `validate_product_category` - Valide catégorie/famille cohérentes
- `validate_contact_constraints` - Email OU phone obligatoire
- `enforce_price_minimum` - Prix >= 0.01€
- `validate_order_customer` - Customer existe (organisation OU individual)

**Pattern** : BEFORE INSERT/UPDATE avec RAISE EXCEPTION si invalide

---

### 3. Triggers Calculés (24 triggers)

**Exemples** :
- `calculate_sales_order_total` - Total commande = SUM(items)
- `calculate_price_margins` - Marge = prix_vente - coût
- `update_product_stock` - Stock produit = SUM(mouvements)
- `update_invoice_paid_amount` - Montant payé = SUM(paiements)

**Pattern** : AFTER INSERT/UPDATE/DELETE avec UPDATE table parent

---

### 4. Triggers Génération (15 triggers)

**Exemples** :
- `generate_product_sku` - SKU unique
- `set_sales_order_number` - SO-YYYY-XXXX
- `set_invoice_reference` - INV-YYYY-XXXX
- `generate_product_image_url` - URL Supabase Storage

**Pattern** : BEFORE INSERT avec génération si champ NULL

---

### 5. Triggers Unicité (8 triggers)

**Exemples** :
- `ensure_single_primary_image` - UN SEUL is_primary=true par produit
- `ensure_single_default_price_list` - UNE SEULE is_default=true
- `ensure_single_default_channel` - UN SEUL default par canal

**Pattern** : AFTER INSERT/UPDATE avec UPDATE autres lignes SET is_primary=false

---

### 6. Triggers Workflow (12 triggers)

**Exemples** :
- `handle_order_cancellation` - Libère stock si annulation
- `reserve_stock_on_confirmation` - Réserve stock si confirmation
- `handle_invoice_status_change` - Actions selon nouveau statut
- `create_stock_movement_on_reception` - Mouvement auto réception PO

**Pattern** : AFTER UPDATE avec WHEN (old.status <> new.status)

---

### 7. Triggers Protection (7 triggers)

**Exemples** :
- `prevent_completed_order_modification` - Interdit modif commande completed
- `prevent_last_owner_removal` - Garde au moins 1 owner
- `prevent_primary_image_deletion` - Interdit suppression si image primaire
- `prevent_manual_stock_movement_modification` - Stock auto-géré uniquement

**Pattern** : BEFORE UPDATE/DELETE avec RAISE EXCEPTION si interdit

---

## 🔄 WORKFLOW CONSULTATION

### Avant Modification Database

```bash
# 1. Consulter SCHEMA-REFERENCE.md (tables, champs, relations)
cat docs/database/SCHEMA-REFERENCE.md

# 2. Consulter triggers.md (CE FICHIER - triggers impactés)
cat docs/database/triggers.md

# 3. Chercher triggers concernés
grep -i "nom_table" docs/database/triggers.md

# 4. Chercher triggers par type
grep -i "validation" docs/database/triggers.md
grep -i "stock_movements" docs/database/triggers.md

# 5. Lire fonctions liées (voir functions-rpc.md)
cat docs/database/functions-rpc.md
```

### Checklist Validation

```markdown
- [ ] Triggers BEFORE impactés ? → Lire définition + fonction
- [ ] Triggers AFTER impactés ? → Comprendre cascade effects
- [ ] Triggers stock_movements ? → ⚠️ LECTURE COMPLÈTE OBLIGATOIRE
- [ ] Validation triggers ? → Respecter contraintes
- [ ] Workflow triggers ? → Respecter transitions statuts
- [ ] Protection triggers ? → Ne PAS contourner sécurité
```

### Template Confirmation Utilisateur

```
🔧 MODIFICATION DATABASE PRÉVUE

**Table** : [NOM_TABLE]
**Champs modifiés** : [LISTE_CHAMPS]

**Triggers impactés** :
- [TRIGGER_1] : [DESCRIPTION]
- [TRIGGER_2] : [DESCRIPTION]

**Vérifications effectuées** :
✅ Pas de conflit avec triggers existants
✅ Validation rules respectées
✅ Pas d'impact stock_movements critique

Confirmes-tu cette modification ?
```

---

## 📊 STATISTIQUES FINALES

### Répartition par Module

| Module | Triggers | % Total |
|--------|----------|---------|
| Catalogue | 48 | 30.4% |
| Pricing | 19 | 12.0% |
| Clients & Contacts | 16 | 10.1% |
| Commandes Vente | 15 | 9.5% |
| Stocks | 12 | 7.6% |
| Commandes Achat | 11 | 7.0% |
| Utilisateurs | 11 | 7.0% |
| Tests & QA | 9 | 5.7% |
| Facturation & Abby | 8 | 5.1% |
| Errors & MCP | 6 | 3.8% |
| Google Merchant | 3 | 1.9% |
| Banking | 1 | 0.6% |
| Divers | 4 | 2.5% |
| **TOTAL** | **158** | **100%** |

### Répartition par Type

| Type Trigger | Triggers | % Total |
|--------------|----------|---------|
| `updated_at` | 54 | 34.2% |
| Validation | 38 | 24.1% |
| Calculés | 24 | 15.2% |
| Génération | 15 | 9.5% |
| Workflow | 12 | 7.6% |
| Unicité | 8 | 5.1% |
| Protection | 7 | 4.4% |
| **TOTAL** | **158** | **100%** |

---

## ⚠️ RÈGLES ABSOLUES

```markdown
❌ INTERDIT ABSOLU :
1. Modifier triggers SANS consulter cette documentation
2. Supprimer trigger SANS comprendre impact cascade
3. Désactiver temporairement trigger (risque data corruption)
4. Créer trigger en doublon (vérifier pattern existant AVANT)
5. Modifier ordre triggers BEFORE/AFTER (ordre = criticité)

✅ OBLIGATOIRE AVANT TOUTE MODIFICATION :
1. Lire docs/database/SCHEMA-REFERENCE.md
2. Lire docs/database/triggers.md (CE FICHIER)
3. Lire docs/database/functions-rpc.md (fonctions exécutées)
4. Chercher triggers similaires existants
5. Validation utilisateur MANDATORY si modification trigger critique

⚠️ TRIGGERS CRITIQUES (Double Validation Requise) :
- stock_movements (10 triggers interdépendants)
- price_list_items (pricing système complet)
- products (18 triggers business rules)
- sales_orders (workflow commandes)
- purchase_orders (workflow achats)
```

---

## 📦 RÉCEPTIONS/EXPÉDITIONS - DÉCOUVERTES 2025

**Date extraction** : 19 octobre 2025
**Agent** : verone-database-architect (Anti-Hallucination)
**Scope** : 6 tables (shipments, sales_orders, sales_order_items, purchase_orders, purchase_order_items, purchase_order_receptions)
**Rapport complet** : [RAPPORT-EXTRACTION-TRIGGERS-RECEPTIONS-EXPEDITIONS.md](../../MEMORY-BANK/sessions/RAPPORT-EXTRACTION-TRIGGERS-RECEPTIONS-EXPEDITIONS.md) (30 KB)

### 🎯 Résumé Exécutif

**Triggers extraits** :
- **Réceptions fournisseurs** : 12 triggers (purchase_orders, purchase_order_items, purchase_order_receptions)
- **Expéditions clients** : 10 triggers (sales_orders, sales_order_items, shipments)
- **Total** : 22 triggers documentés

**Fonctions clés** : 7 fonctions PostgreSQL avec code SQL complet

### 🏗️ Architecture Dual-Workflow

**Innovation majeure** : 2 workflows parallèles (simplifié + avancé) pour réceptions ET expéditions

| Workflow | Description | Tables utilisées |
|----------|-------------|------------------|
| **Simplifié** | Incrémentation directe colonnes `quantity_received/shipped` | `purchase_order_items.quantity_received`, `sales_order_items.quantity_shipped` |
| **Avancé** | Traçabilité complète avec métadonnées (lots, batch, tracking) | `purchase_order_receptions` (lots), `shipments` (multi-transporteur) |

### 🔑 Algorithme Différentiel Idempotent (FIX 2025-10-17)

**Problème résolu** : Duplication mouvements stock lors réceptions/expéditions partielles multiples

**Solution** :
```sql
-- Comparer quantity_received/shipped avec SUM des mouvements RÉELS déjà créés
SELECT COALESCE(SUM(ABS(quantity_change)), 0)
INTO v_already_received
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = NEW.id
  AND product_id = v_item.product_id
  AND affects_forecast = false  -- Mouvement RÉEL uniquement
  AND movement_type = 'IN';

-- Différence = ce qui doit être ajouté MAINTENANT
v_qty_diff := v_item.quantity_received - v_already_received;
```

**Avantages** :
- ✅ **Idempotent** : Peut être appelé N fois sans dupliquer
- ✅ **Source de vérité unique** : `stock_movements` (pas colonnes calculées)
- ✅ **Compatible multi-opérations** : Gère réceptions/expéditions partielles successives

### 📊 Triggers Réceptions Fournisseurs (12 triggers)

#### Table `purchase_orders` (7 triggers)
1. `prevent_completed_po_modification` (BEFORE UPDATE) - Empêche modification PO completed
2. `purchase_orders_updated_at` (BEFORE UPDATE) - Update timestamp
3. `trigger_calculate_po_total` (AFTER INSERT/UPDATE purchase_order_items) - Recalcule total
4. `trigger_handle_po_cancellation` (AFTER UPDATE) - Annule prévisions stock
5. `trigger_set_po_number` (BEFORE INSERT) - Génère PO-YYYY-XXXX
6-7. `trigger_validate_po_supplier` (BEFORE INSERT/UPDATE) - Valide supplier_id

#### Table `purchase_order_items` (3 triggers)
1. `trigger_calculate_po_total` (AFTER INSERT/UPDATE) - Recalcule total PO
2. `trigger_purchase_order_item_receipt` (AFTER UPDATE OF quantity_received) - **Gestion réceptions partielles**
   - Algorithme différentiel idempotent
   - Création mouvements stock IN réel
   - Traçabilité via `purchase_order_item_id`
3. `purchase_order_items_updated_at` (BEFORE UPDATE) - Update timestamp

#### Table `purchase_order_receptions` (2 triggers)
1. `trg_purchase_receptions_stock_automation` (AFTER INSERT) - **Workflow avancé réceptions**
   - Création mouvements stock avec metadata (lot, batch_number)
   - Appelle fonction `create_purchase_reception_movement()`
2. `trigger_purchase_order_receptions_updated_at` (BEFORE UPDATE) - Update timestamp

**⚠️ Note Duplication** :
- `trg_purchase_receptions_stock_automation()` (nouveau - workflow avancé)
- `handle_purchase_reception()` (legacy - à nettoyer)
- **Action recommandée** : Supprimer trigger legacy après validation workflow

### 📦 Triggers Expéditions Clients (10 triggers)

#### Table `sales_orders` (8 triggers)
1. `prevent_completed_order_modification` (BEFORE UPDATE) - Empêche modification completed
2. `sales_orders_updated_at` (BEFORE UPDATE) - Update timestamp
3. `trigger_calculate_order_total` (AFTER INSERT/UPDATE sales_order_items) - Recalcule total
4. `trigger_handle_order_cancellation` (AFTER UPDATE) - Libère stock réservé
5. `trigger_reserve_stock_on_confirmation` (AFTER UPDATE) - Réserve stock
6. `trigger_set_order_number` (BEFORE INSERT) - Génère SO-YYYY-XXXX
7-8. `trigger_validate_order_customer` (BEFORE INSERT/UPDATE) - Valide customer_id

**⚠️ IMPORTANT** : Trigger `handle_sales_order_stock()` gère expéditions partielles via `sales_order_items.quantity_shipped`

#### Table `sales_order_items` (1 trigger)
1. `trigger_calculate_order_total` (AFTER INSERT/UPDATE) - Recalcule total SO

**📦 Gestion expéditions** : UPDATE `quantity_shipped` déclenche `handle_sales_order_stock()` (trigger sur `sales_orders`)

#### Table `shipments` (1 trigger)
1. `shipments_updated_at` (BEFORE UPDATE) - Update timestamp

**⚠️ Note** : Pas de trigger direct pour création mouvements stock. Gestion via `handle_sales_order_stock()` lors UPDATE `sales_order_items.quantity_shipped`.

### 🔧 Fonctions Clés Extraites (Code SQL Complet)

| Fonction | Table | Objectif | Complexité |
|----------|-------|----------|------------|
| `handle_purchase_order_forecast()` | purchase_orders | Gestion stock prévisionnel + réceptions | 🟡 Moyenne |
| `handle_sales_order_stock()` | sales_orders | Gestion stock prévisionnel + expéditions | 🟡 Moyenne |
| `process_shipment_stock()` | shipments | Déduction stock lors expédition (2 workflows) | 🔴 Élevée |
| `create_purchase_reception_movement()` | purchase_order_receptions | Mouvement stock IN lors réception | 🟢 Simple |
| `handle_purchase_reception()` | purchase_order_receptions | Automatisation réception (legacy) | 🟡 Moyenne |
| `update_sourcing_product_status_on_reception()` | purchase_order_receptions | Update statut produits sourcés | 🟢 Simple |
| `create_sales_order_shipment_movements()` | sales_orders | Mouvements expédition complète (legacy) | 🟢 Simple |

**📖 Code SQL complet** : Voir rapport MEMORY-BANK (30 KB) avec toutes les définitions

### ⚠️ Points d'Attention

1. **Duplication trigger réception** :
   - `trg_purchase_receptions_stock_automation()` (nouveau)
   - `handle_purchase_reception()` (legacy)
   - **Action** : Nettoyer trigger legacy après validation

2. **Complexité workflow avancé expéditions** :
   - 4 tables interdépendantes (`sales_orders`, `shipments`, `shipping_parcels`, `parcel_items`)
   - **Action** : Créer diagrammes séquence Mermaid

3. **Performance** :
   - Triggers parcourant `sales_order_items` en boucle
   - **Action** : Analyser `EXPLAIN ANALYZE` sur grosses commandes (>50 items)

### 📚 Références Complètes

- **Rapport extraction complet** : [RAPPORT-EXTRACTION-TRIGGERS-RECEPTIONS-EXPEDITIONS.md](../../MEMORY-BANK/sessions/RAPPORT-EXTRACTION-TRIGGERS-RECEPTIONS-EXPEDITIONS.md)
- **Matrice comparaison workflows** : Section 4 du rapport
- **Code SQL fonctions** : Sections 1-3 du rapport
- **Recommandations architecture** : Section 5 du rapport

---

## 🎯 PROCHAINES ÉTAPES

Fichiers documentation database à créer :

1. ✅ **SCHEMA-REFERENCE.md** - Créé (78 tables)
2. ✅ **triggers.md** - Créé (CE FICHIER - 158 triggers)
3. ⏳ **rls-policies.md** - À créer (217 policies)
4. ⏳ **functions-rpc.md** - À créer (254 fonctions)
5. ⏳ **enums.md** - À créer (types custom)
6. ⏳ **foreign-keys.md** - À créer (relations)
7. ⏳ **best-practices.md** - À créer (guide anti-hallucination)

---

**✅ Documentation Triggers Complète - 17 Octobre 2025**

*158 triggers documentés sur 59 tables*
*Source de vérité pour modifications database*
*Consultation OBLIGATOIRE avant toute modification*
