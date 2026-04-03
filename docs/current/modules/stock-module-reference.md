# Stock Module - Reference Document

**Last Updated:** 2026-02-26
**Sources:** 7 recovered exploration/audit documents (2025-10 to 2026-01)

---

## 1. Architecture Overview

### Pages (Back-Office)

| Route                        | Purpose                                                              |
| ---------------------------- | -------------------------------------------------------------------- |
| `/stocks`                    | Dashboard hub - KPIs, stock real vs forecast sections, alerts widget |
| `/stocks/mouvements`         | Movement history (real movements only by default, tabs: All/In/Out)  |
| `/stocks/inventaire`         | Inventory per product (stock real + forecast + value)                |
| `/stocks/alertes`            | Stock alerts with Active/History tabs                                |
| `/stocks/previsionnel`       | Forecast view (KPIs for incoming/outgoing)                           |
| `/stocks/analytics`          | Stock analytics                                                      |
| `/stocks/receptions`         | Purchase order receptions                                            |
| `/stocks/expeditions`        | Sales order shipments                                                |
| `/stocks/ajustements`        | Manual adjustment audit log                                          |
| `/stocks/ajustements/create` | Create manual adjustment form                                        |
| `/stocks/stockage`           | Storage & billing KPIs                                               |
| `/stocks/produits`           | Products in stock (redirects to inventaire)                          |
| `/stocks/entrees`            | Redirects to `/stocks/mouvements?tab=entrees`                        |
| `/stocks/sorties`            | Redirects to `/stocks/mouvements?tab=sorties`                        |

All 14 pages audited 2026-01-11: 0 console errors.

---

## 2. Database Tables

### 2.1 Key Architectural Fact: NO `stock_levels` Table

Stock levels are NOT stored in a dedicated table. They are:

- **Denormalized on `products`** table (`stock_real`, `stock_forecasted_in`, `stock_forecasted_out`)
- **Calculated from `stock_movements`** aggregation in frontend hooks
- A `stock_snapshot` materialized view exists for performance (auto-refreshed by trigger)

### 2.2 `products` (Stock Columns)

| Column                 | Type    | Default | Description                             |
| ---------------------- | ------- | ------- | --------------------------------------- |
| `stock_quantity`       | integer | 0       | LEGACY - do not use                     |
| `stock_real`           | integer | 0       | Physical inventory count                |
| `stock_forecasted_in`  | integer | 0       | Incoming from validated purchase orders |
| `stock_forecasted_out` | integer | 0       | Reserved by validated sales orders      |
| `min_stock`            | integer | 0       | Alert threshold (0 = no monitoring)     |
| `reorder_point`        | integer | 10      | Recommended reorder point               |

**Stock formula (app-side):**

```
stock_available = stock_real + stock_forecasted_in - stock_forecasted_out
```

### 2.3 `stock_movements`

Primary table for all stock movement history.

| Column             | Type                   | Description                                                                        |
| ------------------ | ---------------------- | ---------------------------------------------------------------------------------- |
| `id`               | uuid PK                |                                                                                    |
| `product_id`       | uuid FK products       |                                                                                    |
| `movement_type`    | enum                   | `'IN'`, `'OUT'`, `'ADJUST'`, `'TRANSFER'`                                          |
| `quantity_change`  | integer                | Positive or negative                                                               |
| `quantity_before`  | integer                | Stock before movement                                                              |
| `quantity_after`   | integer                | Stock after movement                                                               |
| `affects_forecast` | boolean                | `false` = real movement, `true` = forecast                                         |
| `forecast_type`    | text                   | `'in'` or `'out'` (only when `affects_forecast=true`)                              |
| `reference_type`   | text                   | See section 4 (movement types)                                                     |
| `reference_id`     | uuid                   | Links to reception/shipment/etc.                                                   |
| `reason_code`      | enum                   | 25+ codes: `'sale'`, `'purchase_reception'`, `'damage_transport'`, `'theft'`, etc. |
| `performed_by`     | uuid FK                | User who created                                                                   |
| `performed_at`     | timestamptz            | When movement occurred                                                             |
| `channel_id`       | uuid FK sales_channels | For OUT movements                                                                  |
| `carrier_name`     | text                   | e.g., Chronopost                                                                   |
| `tracking_number`  | text                   |                                                                                    |
| `notes`            | text                   |                                                                                    |

### 2.4 `stock_alert_tracking`

Tracks active stock alerts per product.

| Column                 | Type        | Description                                               |
| ---------------------- | ----------- | --------------------------------------------------------- |
| `id`                   | uuid PK     |                                                           |
| `product_id`           | uuid FK     |                                                           |
| `supplier_id`          | uuid FK     |                                                           |
| `alert_type`           | text        | `'low_stock'`, `'out_of_stock'`, `'no_stock_but_ordered'` |
| `alert_priority`       | integer     | 2=important (low_stock), 3=urgent (out_of_stock)          |
| `stock_real`           | integer     | Snapshot                                                  |
| `stock_forecasted_in`  | integer     | Snapshot                                                  |
| `stock_forecasted_out` | integer     | Snapshot                                                  |
| `min_stock`            | integer     | Snapshot                                                  |
| `shortage_quantity`    | integer     | Gap to min_stock                                          |
| `draft_order_id`       | uuid        | FK purchase_orders (draft PO linked)                      |
| `quantity_in_draft`    | integer     | Qty in draft PO                                           |
| `is_in_draft`          | boolean     | Computed: draft PO exists                                 |
| `validated`            | boolean     | `true` if PO validated (alert turns green)                |
| `validated_at`         | timestamptz |                                                           |
| `validated_by`         | uuid        |                                                           |

**Constraint:** `UNIQUE (product_id, alert_type)` -- max 2 alerts per product.

### 2.5 `stock_snapshot` (Materialized View)

Pre-calculated stock aggregates per product. Auto-refreshed via trigger on `stock_movements`.

| Column                     | Type                | Description                   |
| -------------------------- | ------------------- | ----------------------------- |
| `product_id`               | uuid (unique index) |                               |
| `stock_real`               | integer             | SUM of real movements         |
| `stock_forecasted_in`      | integer             | SUM of forecast IN movements  |
| `stock_forecasted_out`     | integer             | SUM of forecast OUT movements |
| `total_movements_real`     | integer             | Count real movements          |
| `total_movements_forecast` | integer             | Count forecast movements      |
| `last_movement_at`         | timestamptz         |                               |

### 2.6 Related Order Tables

| Table                       | Key Columns                                                                         | Role                    |
| --------------------------- | ----------------------------------------------------------------------------------- | ----------------------- |
| `purchase_orders`           | `status` (enum: draft, validated, partially_received, received, cancelled)          | Triggers forecast IN    |
| `purchase_order_items`      | `quantity`, `quantity_received`                                                     | Per-item tracking       |
| `purchase_order_receptions` | `quantity_received`, `received_by`                                                  | Triggers stock_real IN  |
| `sales_orders`              | `status` (enum: draft, validated, partially_shipped, shipped, delivered, cancelled) | Triggers forecast OUT   |
| `sales_order_items`         | `quantity`, `quantity_shipped`                                                      | Per-item tracking       |
| `sales_order_shipments`     | `quantity_shipped`                                                                  | Triggers stock_real OUT |

---

## 3. Alert System (3-Color)

### Lifecycle

```
1. ROUGE (Red)    -- stock_real < min_stock, no validated PO
2. VERT (Green)   -- PO validated, stock_previsionnel >= min_stock
3. DISPARUE       -- Stock received, stock_real >= min_stock
```

### Color Logic (StockAlertCard.tsx `getSeverityColor()`)

```typescript
const stock_previsionnel =
  alert.stock_real +
  (alert.stock_forecasted_in || 0) -
  (alert.stock_forecasted_out || 0);

// GREEN: PO validated AND forecast sufficient
if (alert.validated && stock_previsionnel >= alert.min_stock) {
  return 'border-green-600 !bg-green-50';
}

// RED: In draft OR forecast insufficient
if (alert.is_in_draft || stock_previsionnel < alert.min_stock) {
  return 'border-red-600 !bg-red-50';
}

// Fallback by severity: critical=red, warning=orange, info=blue
```

### Alert Trigger Thresholds

| Condition                          | Status              | Severity |
| ---------------------------------- | ------------------- | -------- |
| `stock_real <= 0`                  | `out_of_stock`      | critical |
| `stock_real < min_stock` (but > 0) | `low_stock`         | warning  |
| `stock_available < min_stock`      | `forecast_shortage` | info     |
| `min_stock = 0` AND never ordered  | No alert            | --       |

**Rule:** Alerts only activate for products that have received at least one IN movement.

### Purchase Order Workflow Impact on Alerts

| PO Status          | Alert Color   | stock_forecasted_in | Button State                      |
| ------------------ | ------------- | ------------------- | --------------------------------- |
| draft              | RED           | 0                   | "Commander Fournisseur" (enabled) |
| validated          | GREEN\*       | += qty              | "Deja commande" (disabled)        |
| partially_received | GREEN/partial | decreasing          | disabled                          |
| received           | GONE          | 0                   | --                                |
| cancelled          | RED           | 0                   | re-enabled                        |

---

## 4. Movement Types (Manual vs Automatic)

### Distinction via `reference_type` Column

| reference_type      | Origin                            | Deletable?      | Created By                                       |
| ------------------- | --------------------------------- | --------------- | ------------------------------------------------ |
| `manual_adjustment` | User via InventoryAdjustmentModal | YES             | User action                                      |
| `manual_entry`      | User manual entry                 | YES             | User action                                      |
| `reception`         | Purchase order reception          | NO (API blocks) | DB trigger on `purchase_order_receptions` INSERT |
| `shipment`          | Sales order shipment              | NO (API blocks) | DB trigger on `sales_order_shipments` INSERT     |
| `sales_order`       | DEPRECATED                        | NO              | Legacy                                           |
| `purchase_order`    | DEPRECATED                        | NO              | Legacy                                           |

### Deletion Rules (API `/api/stock-movements/[id]`)

1. `affects_forecast = true` --> 403 Forbidden (forecast movements never deletable)
2. `reference_type` not in (`manual_adjustment`, `manual_entry`) --> 403 Forbidden
3. Only manual, real movements can be deleted by users

### Manual Adjustment Reason Codes

**Increases:** `found_inventory`, `manual_adjustment`, `return_from_client`, `purchase_reception`

**Decreases:** `damage_transport`, `damage_handling`, `damage_storage`, `theft`, `loss_unknown`, `write_off`, `obsolete`

---

## 5. Database Triggers

### Stock Forecast Triggers (PO/SO Validation)

| Trigger                               | Table           | Event                            | Function                        | Effect                          |
| ------------------------------------- | --------------- | -------------------------------- | ------------------------------- | ------------------------------- |
| `trigger_po_update_forecasted_in`     | purchase_orders | UPDATE status (draft->validated) | `update_po_forecasted_in()`     | `stock_forecasted_in += qty`    |
| `trigger_validate_stock_alerts_on_po` | purchase_orders | UPDATE status (draft->validated) | `validate_stock_alerts_on_po()` | `validated = true` in alert     |
| `trigger_po_cancellation_rollback`    | purchase_orders | UPDATE status (->cancelled)      | `rollback_po_forecasted()`      | Rollback `stock_forecasted_in`  |
| `trigger_so_update_forecasted_out`    | sales_orders    | UPDATE status (draft->validated) | `update_so_forecasted_out()`    | `stock_forecasted_out += qty`   |
| `trigger_so_cancellation_rollback`    | sales_orders    | UPDATE status (->cancelled)      | `rollback_so_forecasted()`      | Rollback `stock_forecasted_out` |

### Physical Movement Triggers (Receptions/Shipments)

| Trigger                           | Table                     | Event         | Function                             | Effect                                                        |
| --------------------------------- | ------------------------- | ------------- | ------------------------------------ | ------------------------------------------------------------- |
| `trigger_reception_update_stock`  | purchase_order_receptions | AFTER INSERT  | `update_stock_on_reception()`        | stock_real +=, stock_forecasted_in -=, INSERT stock_movement  |
| `trigger_shipment_update_stock`   | sales_order_shipments     | AFTER INSERT  | `update_stock_on_shipment()`         | stock_real -=, stock_forecasted_out -=, INSERT stock_movement |
| `trigger_before_delete_reception` | purchase_order_receptions | BEFORE DELETE | `handle_reception_deletion()`        | Reverse stock_real, DELETE stock_movement                     |
| `trigger_before_update_reception` | purchase_order_receptions | BEFORE UPDATE | `handle_reception_quantity_update()` | Adjust delta on quantity changes                              |
| `trigger_before_delete_shipment`  | sales_order_shipments     | BEFORE DELETE | Similar                              | Reverse stock                                                 |
| `trigger_before_update_shipment`  | sales_order_shipments     | BEFORE UPDATE | Similar                              | Adjust delta                                                  |

### Alert & Sync Triggers

| Trigger                                 | Table           | Event                                  | Function                                | Effect                                 |
| --------------------------------------- | --------------- | -------------------------------------- | --------------------------------------- | -------------------------------------- |
| `trg_update_stock_alert`                | stock_movements | AFTER INSERT                           | `update_stock_alert_on_movement()`      | Recalculate alerts                     |
| `trg_sync_product_stock_after_movement` | stock_movements | AFTER INSERT                           | `update_product_stock_after_movement()` | Sync products.stock_real               |
| `trg_reverse_stock_on_movement_delete`  | stock_movements | BEFORE DELETE                          | `reverse_stock_on_movement_delete()`    | Reverse products.stock_real            |
| `trigger_refresh_stock_snapshot`        | stock_movements | AFTER INSERT/UPDATE/DELETE (STATEMENT) | `refresh_stock_snapshot()`              | REFRESH MATERIALIZED VIEW CONCURRENTLY |

### RPC Functions

| Function                      | Parameters                          | Returns                                          | Purpose                    |
| ----------------------------- | ----------------------------------- | ------------------------------------------------ | -------------------------- |
| `get_stock_timeline_forecast` | `(product_id UUID, days_ahead INT)` | Table (date, changes, cumulative)                | Dashboard timeline widget  |
| `get_product_stock_summary`   | `(product_id UUID)`                 | Table (stock_real, forecasted, is_below_minimum) | Product detail & dashboard |

---

## 6. Key Components & Hooks

### Hooks (`packages/@verone/stock/src/hooks/`)

| Hook                       | Purpose                                                                       |
| -------------------------- | ----------------------------------------------------------------------------- |
| `use-stock-alerts.ts`      | Fetch from `stock_alert_tracking`, filter by severity                         |
| `use-stock.ts`             | Main stock operations: fetchAll, createManualMovement, createForecastMovement |
| `use-stock-inventory.ts`   | Inventory page data: products + aggregated movements                          |
| `use-stock-dashboard.ts`   | Dashboard metrics and KPIs                                                    |
| `use-movements-history.ts` | Movement list with filters (default: `affects_forecast: false`)               |

### Components (`packages/@verone/stock/src/components/`)

| Component                   | Path                                   | Purpose                                               |
| --------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `StockAlertCard`            | `cards/StockAlertCard.tsx`             | Alert card with 3-color system, order button          |
| `MovementsTable`            | `tables/MovementsTable.tsx`            | Movement list with cancel action for manual movements |
| `MovementsFilters`          | (business) `movements-filters.tsx`     | Sidebar filters for movements page                    |
| `CancelMovementModal`       | `modals/CancelMovementModal.tsx`       | Confirm deletion of manual movements                  |
| `InventoryAdjustmentModal`  | `modals/InventoryAdjustmentModal.tsx`  | Create manual stock adjustments                       |
| `GeneralStockMovementModal` | `modals/GeneralStockMovementModal.tsx` | Create new movement                                   |
| `MovementDetailsModal`      | `modals/MovementDetailsModal.tsx`      | View movement details                                 |
| `MovementsStatsCards`       | (stats)                                | KPI cards for movements page                          |

### Pages (`apps/back-office/src/app/stocks/`)

| Page       | Key File                                                                |
| ---------- | ----------------------------------------------------------------------- |
| Dashboard  | `page.tsx` - Green section (stock real) + Blue section (stock forecast) |
| Mouvements | `mouvements/page.tsx` - Tabs (All/In/Out), default: real movements only |
| Inventaire | `inventaire/page.tsx` - Product table with stock columns                |

### Server Actions

| Action                      | File                                                  | Purpose                                             |
| --------------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| `updatePurchaseOrderStatus` | `apps/back-office/src/app/actions/purchase-orders.ts` | PO status changes (uses admin client to bypass RLS) |

### API Routes

| Route                       | Method | Purpose                                            |
| --------------------------- | ------ | -------------------------------------------------- |
| `/api/stock-movements/[id]` | DELETE | Delete manual movements (validates reference_type) |

---

## 7. Dashboard Design

The `/stocks` dashboard separates stock into two visually distinct sections:

- **Stock Real (Green):** `bg-green-50`, `border-green-500`, badge "Mouvements Effectues" with CheckCircle icon
- **Stock Previsionnel (Blue):** `bg-blue-50`, `border-blue-500`, badge "Commandes En Cours" with Clock icon, labeled "INFORMATIF uniquement"

Spacing between sections: `mt-8` (32px).

---

## 8. Key Migrations Reference

| Migration                                                | Purpose                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `20251012_001_smart_stock_alerts_system.sql`             | Alert calculation logic (`get_smart_stock_status()`)                     |
| `20251102_003_stock_indexes_performance.sql`             | Composite indexes on stock_movements                                     |
| `20251102_004_stock_snapshot_materialized_view.sql`      | `stock_snapshot` materialized view                                       |
| `20251102_005_stock_timeline_forecast_rpc.sql`           | RPC functions (timeline + summary)                                       |
| `20251124_001` through `20251124_005`                    | Reception/shipment triggers (insert, delete, update, reference_type fix) |
| `20251124_011_restore_insert_triggers.sql`               | Restored accidentally dropped INSERT triggers                            |
| `20251125_001_add_forecasted_stock_on_po_validation.sql` | Forecast stock on PO validation trigger                                  |
| `20251125_001_add_stock_movement_sync_trigger.sql`       | Sync products.stock_real after movement                                  |
| `20251125_002_trigger_delete_stock_movement_reverse.sql` | Reverse stock on movement deletion                                       |

---

## 9. Known Issues / Gaps (as of source documents)

1. **Alert archival trigger missing:** Alerts may not auto-disappear when `stock_real >= min_stock` after reception. A `auto_archive_resolved_alerts()` trigger was proposed but not confirmed implemented.

2. **Button disable incomplete in StockAlertCard:** `disabled={alert.is_in_draft}` should also check `|| alert.validated`.

3. **Forecast OUT for sales orders:** Trigger for `stock_forecasted_out` on SO validation was documented as missing in Nov 2025 explorations. May have been added since -- verify in current migrations.

4. **No `stock_alerts_history` table:** Resolved alerts are deleted, not archived. No historical audit trail for past alerts.
