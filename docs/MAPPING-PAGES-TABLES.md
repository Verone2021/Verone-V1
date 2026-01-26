# Mapping Pages → Tables Supabase

**Dernière mise à jour** : 2026-01-23
**Format** : Page | Tables principales | Vues | Type query

---

## 📊 Dashboard

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/dashboard` | `commandes_clients_internal`, `stock_alerts`, `client_consultations`, `sales_orders`, `organisations` | `stock_alerts_unified_view` | Parallel (11 queries) |

---

## 📦 Produits

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/produits` | `products`, `stock_alerts` | - | Aggregate |
| `/produits/sourcing` | `products` (status=sourcing) | - | SELECT + FILTER |
| `/produits/catalogue` | `products` (status=catalogue) | - | SELECT + FILTER |
| `/produits/catalogue/[productId]` | `products`, `product_variants`, `product_prices`, `product_images` | - | JOIN multi |
| `/produits/catalogue/categories` | `categories` | - | SELECT |
| `/produits/catalogue/collections` | `collections`, `collection_products` | - | JOIN |
| `/produits/catalogue/variantes` | `product_variant_groups`, `product_variant_options` | - | JOIN |

---

## 📊 Stocks

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/stocks` | `stock_alerts` | `stock_alerts_unified_view` | Aggregate |
| `/stocks/inventaire` | `stock_locations`, `stock_items` | - | JOIN |
| `/stocks/mouvements` | `stock_movements` | - | SELECT + ORDER |
| `/stocks/alertes` | - | `stock_alerts_unified_view` | SELECT |
| `/stocks/receptions` | `purchase_orders`, `purchase_order_items` | - | JOIN |
| `/stocks/expeditions` | `sales_orders`, `sales_order_items` | - | JOIN |
| `/stocks/ajustements` | `stock_adjustments` | - | SELECT |
| `/stocks/previsionnel` | `stock_movements`, `sales_orders` | - | Aggregate |

---

## 🛒 Commandes

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/commandes` | `sales_orders`, `purchase_orders` | - | COUNT |
| `/commandes/clients` | `commandes_clients_internal` OU `sales_orders` | - | SELECT + JOIN |
| `/commandes/clients/[id]` | `commandes_clients_internal`, `sales_order_items`, `organisations` | - | JOIN multi |
| `/commandes/fournisseurs` | `purchase_orders`, `purchase_order_items` | - | JOIN |

---

## 👥 Contacts & Organisations

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/contacts-organisations` | `organisations`, `enseignes` | `enseignes_with_stats` | Aggregate |
| `/contacts-organisations/[id]` | `organisations`, `addresses`, `contacts` | - | JOIN multi |
| `/contacts-organisations/contacts` | `contacts` | - | SELECT |
| `/contacts-organisations/enseignes` | `enseignes` | `enseignes_with_stats` | SELECT |
| `/contacts-organisations/suppliers` | `organisations` (type=supplier) | - | SELECT + FILTER |
| `/contacts-organisations/customers` | `organisations` (type=customer) | - | SELECT + FILTER |

---

## 🔗 LinkMe

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/canaux-vente/linkme` | `sales_orders`, `linkme_affiliates` | `linkme_orders_enriched` | Aggregate |
| `/canaux-vente/linkme/catalogue` | `linkme_catalog_products`, `products` | - | JOIN |
| `/canaux-vente/linkme/commandes` | `sales_orders` | `linkme_orders_enriched`, `linkme_orders_with_margins` | SELECT |
| `/canaux-vente/linkme/commandes/[id]` | `sales_orders`, `sales_order_items` | `linkme_orders_enriched` | JOIN |
| `/canaux-vente/linkme/selections` | `linkme_selections`, `linkme_selection_items` | - | JOIN |
| `/canaux-vente/linkme/commissions` | `linkme_commissions` | - | Aggregate |
| `/canaux-vente/linkme/utilisateurs` | `linkme_affiliates` | `v_linkme_users` | SELECT |
| `/canaux-vente/linkme/enseignes` | `enseignes`, `linkme_affiliates` | - | JOIN |
| `/canaux-vente/linkme/organisations` | `organisations`, `linkme_affiliates` | - | JOIN |
| `/canaux-vente/linkme/stockage` | `affiliate_storage_allocations` | - | SELECT |
| `/canaux-vente/linkme/analytics/performance` | `sales_orders`, `linkme_commissions` | `linkme_orders_with_margins` | Aggregate |

---

## 💰 Finance

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/finance` | `bank_transactions`, `invoices` | - | Aggregate |
| `/finance/depenses` | `expenses`, `expense_categories` | - | JOIN |
| `/finance/transactions` | `bank_transactions` | - | SELECT |
| `/finance/justificatifs` | `document_uploads`, `invoices` | `v_pending_invoice_uploads` | SELECT |
| `/finance/livres` | `accounting_entries` | - | Aggregate |

---

## 📄 Factures

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/factures` | `invoices`, `invoice_items` | - | JOIN |
| `/factures/[id]` | `invoices`, `invoice_items`, `organisations` | - | JOIN multi |
| `/factures/qonto` | `qonto_connections`, `bank_transactions` | - | SELECT |

---

## 💬 Consultations

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/consultations` | `client_consultations` | - | SELECT |
| `/consultations/[consultationId]` | `client_consultations`, `consultation_products`, `products` | - | JOIN |

---

## ⚙️ Paramètres

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/parametres` | `app_settings` | - | SELECT |
| `/parametres/emails` | `email_templates` | - | SELECT |
| `/parametres/webhooks` | `webhook_configs` | - | SELECT |
| `/parametres/notifications` | `notification_settings` | - | SELECT |

---

## 👤 Admin

| Page | Tables | Vues | Query Type |
|------|--------|------|------------|
| `/admin/users` | `profiles`, `user_roles` | - | JOIN |
| `/admin/activite-utilisateurs` | `audit_logs` | - | SELECT + ORDER |

---

## 📋 Vues Principales Utilisées

| Vue | Description | Tables Sources |
|-----|-------------|----------------|
| `stock_alerts_unified_view` | Alertes stock agrégées | `products`, `stock_items`, `stock_thresholds` |
| `linkme_orders_enriched` | Commandes LinkMe + client + affilié | `sales_orders`, `organisations`, `linkme_affiliates` |
| `linkme_orders_with_margins` | Commandes + marge affilié | `linkme_orders_enriched`, `linkme_commissions` |
| `enseignes_with_stats` | Enseignes + statistiques | `enseignes`, `organisations`, `sales_orders` |
| `v_linkme_users` | Utilisateurs LinkMe | `linkme_affiliates`, `organisations` |
| `v_pending_invoice_uploads` | Uploads en attente | `document_uploads`, `invoices` |

---

## 🔧 RPCs Principales

| RPC | Description | Utilisée par |
|-----|-------------|--------------|
| `get_stock_alerts_count()` | Compte alertes stock | Dashboard, Sidebar badge |
| `get_consultation_eligible_products()` | Produits éligibles consultation | Consultations |
| `calculate_linkme_commission()` | Calcul commission | Commandes LinkMe |

---

## 📈 Patterns de Query

### Pattern 1: Aggregate (Dashboard/KPIs)
```sql
SELECT COUNT(*), SUM(total), AVG(value)
FROM table
WHERE conditions
```
**Utilisé par** : `/dashboard`, `/stocks`, `/finance`

### Pattern 2: JOIN Multi (Detail pages)
```sql
SELECT * FROM main_table
LEFT JOIN related_1 ON ...
LEFT JOIN related_2 ON ...
WHERE id = ?
```
**Utilisé par** : Toutes les pages `[id]`

### Pattern 3: View + Filter (Lists)
```sql
SELECT * FROM view_name
WHERE filter_conditions
ORDER BY created_at DESC
LIMIT 50
```
**Utilisé par** : `/stocks/alertes`, `/linkme/commandes`

---

**Note** : Ce mapping est basé sur l'analyse du code et peut nécessiter des mises à jour après évolutions.
