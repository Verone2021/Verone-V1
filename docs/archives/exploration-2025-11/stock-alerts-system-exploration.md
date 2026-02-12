# Stock Alerts System - Comprehensive Exploration Report

**Date:** 2025-11-25  
**Status:** Analysis Complete (Read-Only)

---

## Executive Summary

The Vérone stock alerts system is a sophisticated tri-state system that manages product availability warnings based on real, forecasted (incoming), and committed (outgoing) inventory. The system integrates purchase order validation with forecasted stock calculations, creating a workflow where stock alerts transition from RED → GREEN → RESOLVED as purchase orders progress through their lifecycle.

---

## 1. Stock Alert System Architecture

### 1.1 Three-Color Alert System

The system uses a color-coded alert mechanism based on stock status:

```
🔴 RED (Critical)     → Product has insufficient stock
🟢 GREEN (Caution)    → Purchase order validated (stock on the way)
✅ RESOLVED           → Stock received/alert disappears
```

### 1.2 Alert Types and Severity

From `/packages/@verone/stock/src/hooks/use-stock-alerts.ts`:

```typescript
export type StockAlertType =
  | 'low_stock' // Stock < min_stock threshold
  | 'out_of_stock' // Stock <= 0
  | 'no_stock_but_ordered'; // No current stock but purchase order exists

export interface StockAlert {
  severity: 'critical' | 'warning' | 'info';

  // Stock levels
  stock_real: number;
  stock_forecasted_in: number; // Incoming (purchase orders)
  stock_forecasted_out: number; // Outgoing (sales orders)
  min_stock: number; // Configured threshold
  shortage_quantity: number; // Gap to min_stock

  // Draft tracking
  is_in_draft: boolean; // Tracked in draft purchase order
  quantity_in_draft: number;
  draft_order_id: string;

  // Validation state
  validated: boolean; // Draft → Validated transition
  validated_at: string;
}
```

---

## 2. How Stock Alerts Trigger When Adding Products to Purchase Orders

### 2.1 Flow: Draft State (Red Alert)

**Step 1: Product Added to Draft Purchase Order**

- Product is selected and quantity specified in draft PO
- Status: `draft` (not yet affecting stock)
- **Alert State:** 🔴 RED (no forecasted stock yet)
- **Stock Impact:** NONE

**Step 2: Data Stored**

- Entry created in `purchase_order_items` with quantity specified
- `quantity_received = 0` (not received yet)
- No automatic stock movements created in draft state
- Alert tracking records product's shortage

**Code Location:** `/packages/@verone/orders/src/hooks/use-purchase-orders.ts`

```typescript
export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number; // Ordered quantity
  quantity_received: number; // Initially 0
  // ... other fields
}
```

---

## 3. Forecasted Stock Calculation (stock_forecasted_in)

### 3.1 When Does stock_forecasted_in Get Updated?

**Trigger Point:** When purchase order status changes to `validated`

From `/apps/back-office/src/app/actions/purchase-orders.ts`:

```typescript
if (newStatus === 'validated') {
  // ✅ VALIDATION : rouge → vert (alerte stock)
  updateFields.validated_at = new Date().toISOString();
  updateFields.validated_by = userId;
}
```

### 3.2 The Validation Workflow (3 Steps)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: DRAFT (draft)                                          │
├─────────────────────────────────────────────────────────────────┤
│  ✗ Stock Impact:        NONE                                    │
│  ✗ Alert Color:         🔴 RED (no order yet)                   │
│  ✗ Stock Movements:     NOT CREATED                             │
│  ✓ Modifiable:          YES (all fields)                         │
│  ✓ Can be deleted:      YES                                      │
│                                                                  │
│  Action: User clicks "Valider la commande" button               │
└─────────────────────────────────────────────────────────────────┘
                              ↓↓↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: VALIDATED (validated)                                  │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Stock Impact:        stock_forecasted_in += quantity         │
│  ✓ Alert Color:         🟢 GREEN (order in progress)            │
│  ✓ Stock Movements:     CREATED (type='IN')                     │
│  ✗ Modifiable:          LIMITED (notes, dates only)             │
│  ✗ Can be deleted:      NO                                      │
│                                                                  │
│  Trigger Activated:                                             │
│  - Database constraint prevents status transitions               │
│  - Stock forecasted calculated from sum of items                │
│                                                                  │
│  Action: Items received, user clicks "Réceptionner" button      │
└─────────────────────────────────────────────────────────────────┘
                              ↓↓↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: RECEIVED (received)                                    │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Stock Impact:        stock_real += quantity                  │
│                         stock_forecasted_in -= quantity         │
│  ✓ Alert Color:         ✅ DISAPPEARS (need satisfied)         │
│  ✓ Stock Movements:     UPDATED (from forecast to real)         │
│  ✗ Modifiable:          NO                                      │
│  ✗ Can be deleted:      NO                                      │
│                                                                  │
│  Trigger Activated:                                             │
│  - Stock movements converted from forecast to real              │
│  - Purchase order status auto-updated                           │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Where stock_forecasted_in is Calculated

**From Migration 20251124_005:**

The `update_stock_on_reception()` function handles the transition:

```sql
-- When a reception is inserted (NEW.quantity_received)
UPDATE products
SET
    stock_real = stock_real + NEW.quantity_received,
    stock_forecasted_in = stock_forecasted_in - NEW.quantity_received  -- ✅ DECREMENTED
WHERE id = NEW.product_id
```

**Key Insight:** `stock_forecasted_in` is **initially zero** in the product table.

**The Missing Link:** Currently, there's **NO automatic increment of stock_forecasted_in when a PO is validated**. The system appears to expect manual tracking or a missing trigger.

---

## 4. Stock Movements and Receptions

### 4.1 Reception Creation and Stock Movement Flow

**File:** `/supabase/migrations/20251124_011_restore_insert_triggers.sql`

When a reception is inserted:

```
┌──────────────────────────────────────────────────────────┐
│ INSERT INTO purchase_order_receptions                    │
│   (product_id, quantity_received, received_by)           │
└──────────────────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────┐
│ TRIGGER: trigger_reception_update_stock                 │
│   AFTER INSERT ON purchase_order_receptions             │
│   FOR EACH ROW                                           │
│   EXECUTE update_stock_on_reception()                   │
└──────────────────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────┐
│ Function: update_stock_on_reception()                   │
│ ────────────────────────────────────────────────────────│
│ 1. stock_real += NEW.quantity_received                  │
│ 2. stock_forecasted_in -= NEW.quantity_received        │
│ 3. INSERT stock_movements (                             │
│      movement_type = 'IN',                              │
│      reference_type = 'reception',  ✅ CORRECTED       │
│      reference_id = reception_id    ✅ CORRECTED       │
│    )                                                     │
│ 4. UPDATE purchase_order_items.quantity_received        │
│ 5. Check if PO fully/partially received                 │
│ 6. Update purchase_orders.status                        │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Stock Movement Table Structure

From `packages/@verone/types/src/supabase.ts`:

```typescript
export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUST'; // Direction
  quantity_change: number; // +/- value
  quantity_before: number; // Stock before
  quantity_after: number; // Stock after

  // ✅ CORRECTED: Now properly linked to source
  reference_type: 'reception' | 'shipment' | 'manual_adjustment';
  reference_id: string; // ID of reception/shipment

  // Traceability
  reason_code: string; // 'purchase_reception', 'sale', etc.
  performed_by: string; // User who created
  notes: string;
}
```

### 4.3 Reception Deletion Handling

**File:** `/supabase/migrations/20251124_001_trigger_delete_reception_reverse_stock.sql`

When a reception is deleted:

```sql
BEFORE DELETE ON purchase_order_receptions
FOR EACH ROW
EXECUTE handle_reception_deletion()

-- Function does:
1. stock_real -= quantity_received  (REVERSE the stock increase)
2. DELETE FROM stock_movements      (Remove the IN movement)
3. RETURN OLD                       (Allow deletion to proceed)
```

### 4.4 Reception Update Handling

**File:** `/supabase/migrations/20251124_003_trigger_update_reception_adjust_stock.sql`

When a reception's quantity is modified:

```sql
BEFORE UPDATE ON purchase_order_receptions
FOR EACH ROW
EXECUTE handle_reception_quantity_update()

-- Function does:
1. IF quantity_received changed:
   - Calculate delta = new_qty - old_qty
   - stock_real += delta
   - Update stock_movements quantity_change
2. IF quantity_received unchanged:
   - Do nothing (other field changed)
```

---

## 5. Products Without Stock Thresholds (min_stock = 0)

### 5.1 Special Handling

From `/supabase/migrations/20251012_001_smart_stock_alerts_system.sql`:

Products can have `min_stock = 0`, indicating:

- **No alert threshold configured**
- Product doesn't require stock monitoring
- Alert system still tracks it if it's been ordered before

### 5.2 Alert Decision Logic

```typescript
function get_smart_stock_status(product_id):
  stock = product.stock_real
  min = product.min_stock
  has_been_ordered = has_any_IN_movements()

  IF NOT has_been_ordered:
    return 'ready_to_order'      // No alert

  IF has_been_ordered AND stock <= 0:
    return 'out_of_stock'        // 🔴 CRITICAL

  IF has_been_ordered AND min > 0 AND stock < min:
    return 'low_stock'           // 🔴 WARNING

  ELSE:
    return 'in_stock'            // Normal
```

**Key Rule:** Alert only activates if product has received at least one shipment (proven via stock_movements with type='IN').

---

## 6. Database Triggers Involved

### 6.1 Stock Movements Triggers

| Trigger                           | Event         | Table                       | Function                             | Purpose                                 |
| --------------------------------- | ------------- | --------------------------- | ------------------------------------ | --------------------------------------- |
| `trigger_reception_update_stock`  | AFTER INSERT  | `purchase_order_receptions` | `update_stock_on_reception()`        | Create IN movements, update stock_real  |
| `trigger_shipment_update_stock`   | AFTER INSERT  | `sales_order_shipments`     | `update_stock_on_shipment()`         | Create OUT movements, update stock_real |
| `trigger_before_delete_reception` | BEFORE DELETE | `purchase_order_receptions` | `handle_reception_deletion()`        | Reverse stock and delete movements      |
| `trigger_before_update_reception` | BEFORE UPDATE | `purchase_order_receptions` | `handle_reception_quantity_update()` | Adjust stock delta on quantity changes  |
| `trigger_before_update_shipment`  | BEFORE UPDATE | `sales_order_shipments`     | Similar to reception                 | Adjust stock delta on shipment edits    |

### 6.2 Alert Update Triggers

| Trigger                  | Event                      | Table             | Function                           |
| ------------------------ | -------------------------- | ----------------- | ---------------------------------- | --------------------------- |
| `trg_update_stock_alert` | AFTER INSERT/UPDATE/DELETE | `stock_movements` | `update_stock_alert_on_movement()` | Recalculate alerts via view |

---

## 7. Key Files and Their Roles

### 7.1 Core Hook Files

**`/packages/@verone/stock/src/hooks/use-stock-alerts.ts`** (165 lines)

- Fetches alerts from `stock_alert_tracking` table
- Transforms raw data into `StockAlert[]` objects
- Provides helper methods (critical, warning, in-draft filters)
- Handles alert visibility (hides validated alerts)

**`/packages/@verone/stock/src/hooks/use-stock.ts`** (350+ lines)

- Main hook for stock management
- `fetchAllStock()` - Get all products' stock data
- `createManualMovement()` - Add manual stock adjustments
- `createForecastMovement()` - Add forecast (reserved) movements
- `getStockAlerts()` - Filter products with alerts

**`/packages/@verone/orders/src/hooks/use-purchase-orders.ts`** (450+ lines)

- `createOrder()` - Create draft PO
- `updateStatus()` - Change PO status (triggers forecasted stock)
- `receiveItems()` - Record receptions
- `getStockWithForecasted()` - Get stock with forecast values

### 7.2 Server Action Files

**`/apps/back-office/src/app/actions/purchase-orders.ts`** (100 lines)

- `updatePurchaseOrderStatus()` - Main action to change PO status
- Uses admin client to bypass RLS
- Sets timestamps for each status change (validated_at, received_at, etc.)
- Revalidates cache after status change

### 7.3 Migration Files (Most Recent)

| File                                                      | Date   | Purpose                                                     |
| --------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| `20251124_001_trigger_delete_reception_reverse_stock.sql` | Nov 24 | Handle reception deletion                                   |
| `20251124_002_trigger_delete_shipment_reverse_stock.sql`  | Nov 24 | Handle shipment deletion                                    |
| `20251124_003_trigger_update_reception_adjust_stock.sql`  | Nov 24 | Handle reception edits                                      |
| `20251124_004_trigger_update_shipment_adjust_stock.sql`   | Nov 24 | Handle shipment edits                                       |
| `20251124_005_fix_stock_movements_reference_type.sql`     | Nov 24 | Corrected reference_type/id to 'reception' and reception_id |
| `20251124_011_restore_insert_triggers.sql`                | Nov 24 | Restored INSERT triggers that were accidentally dropped     |

### 7.4 View and Function Files

**`stock_alerts_view` (Database View)**

- Real-time calculation of alert status
- Uses `get_smart_stock_status()` function
- Filters to only show products with active alerts
- Orders by priority (critical first) then low stock

**`calculate_stock_forecasted` (RPC Function)**

- Calculates forecasted stock for a product
- Used by hooks to get advanced stock data
- Returns: `stock_real`, `stock_forecasted_in`, `stock_forecasted_out`, `stock_available`

---

## 8. The Stock Calculation Formula

### 8.1 Stock Levels in Database

```sql
-- On products table:
stock_real           -- Physically available inventory
stock_forecasted_in  -- On the way from suppliers (purchase orders validated)
stock_forecasted_out -- Reserved for customers (sales orders validated)
```

### 8.2 Calculated Stock Levels (in app)

```typescript
// From use-stock.ts
stock_available = stock_real + stock_forecasted_in - stock_forecasted_out;
stock_total_forecasted = stock_forecasted_in - stock_forecasted_out;

// From use-purchase-orders.ts
stock_future = stock_real + stock_forecasted_in;
```

### 8.3 Alert Trigger Threshold

```
IF stock_real <= 0:
  Status = 'out_of_stock'        🔴 CRITICAL

ELSE IF stock_real < min_stock:
  Status = 'low_stock'           🔴 WARNING

ELSE IF stock_available < min_stock:
  Status = 'forecast_shortage'   ⚠️  INFO

ELSE:
  Status = 'in_stock'            ✅ OK
```

---

## 9. Current Limitations & Missing Pieces

### 9.1 Gap: Forecasted Stock Not Incremented on PO Validation

**Problem:** When a PO moves from `draft` → `validated`, the code only sets timestamps:

```typescript
if (newStatus === 'validated') {
  updateFields.validated_at = new Date().toISOString();
  updateFields.validated_by = userId;
  // ❌ NO: updateFields.stock_forecasted_in += quantity
}
```

**Missing Trigger/Function:** There should be a trigger that:

1. Detects when `purchase_orders.status` changes to `validated`
2. Sums quantities from `purchase_order_items`
3. Updates `products.stock_forecasted_in` accordingly

**Current Behavior:** Alerts remain RED even after validation because `stock_forecasted_in` is never updated.

### 9.2 Gap: No Rollback on Status Changes

**Scenario:** PO `validated` → `cancelled` should:

- ✅ Create `cancelled_at` timestamp
- ❌ But doesn't decrement `stock_forecasted_in`

### 9.3 Missing Stock Alert Tracking Table

The code references `stock_alert_tracking` table in:

```typescript
const { data } = await supabase
  .from('stock_alert_tracking')
  .select(...)
```

But this table's structure and update triggers are unclear in migrations.

---

## 10. Complete Flow Diagram

```
USER INTERFACE
     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. CREATE PURCHASE ORDER (Draft State)                         │
│    - Select product(s)                                         │
│    - Specify quantities                                        │
│    - Save as DRAFT                                             │
│                                                                │
│    Hook: usePurchaseOrders.createOrder()                       │
│    Action: purchase_orders.ts (not shown, may be client-side)  │
│    Alert State: 🔴 RED (no forecast)                          │
└─────────────────────────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. VALIDATE PURCHASE ORDER (Change to Validated)               │
│    - User clicks "Valider la commande"                         │
│    - Status changes: draft → validated                         │
│                                                                │
│    Hook: usePurchaseOrders.updateStatus(orderId, 'validated') │
│    Action: updatePurchaseOrderStatus() [server action]        │
│    → Sets: validated_at, validated_by                         │
│    → Updates: purchase_orders.status = 'validated'            │
│                                                                │
│    ❌ MISSING: Should update stock_forecasted_in += quantity  │
│                                                                │
│    Alert State: 🟢 GREEN (should be - if trigger worked)     │
└─────────────────────────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. RECORD RECEPTION (Items Received)                           │
│    - User enters "Réceptionner" modal                          │
│    - Specifies quantity_received for item(s)                  │
│                                                                │
│    Hook: usePurchaseOrders.receiveItems()                      │
│    → Updates: purchase_order_items.quantity_received += qty    │
│                                                                │
│    Database Trigger: AFTER INSERT on purchase_order_receptions│
│    → Function: update_stock_on_reception()                    │
│      1. stock_real += quantity_received                       │
│      2. stock_forecasted_in -= quantity_received              │
│      3. INSERT stock_movements (type='IN')                    │
│      4. UPDATE purchase_order_items.quantity_received         │
│      5. Check if fully/partially received                     │
│      6. UPDATE purchase_orders.status                         │
│                                                                │
│    Alert State: ✅ DISAPPEARS (need satisfied)               │
└─────────────────────────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. (Optional) MODIFY RECEPTION                                 │
│    - User edits quantity_received upward/downward             │
│                                                                │
│    Database Trigger: BEFORE UPDATE on purchase_order_receptions│
│    → Function: handle_reception_quantity_update()             │
│      1. Calculate delta = new_qty - old_qty                   │
│      2. stock_real += delta                                   │
│      3. UPDATE stock_movements (quantity_change += delta)      │
│                                                                │
│    Alert State: Updated dynamically                           │
└─────────────────────────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. (Optional) DELETE/CANCEL                                    │
│    - User deletes draft or cancels validated order            │
│                                                                │
│    Database Triggers:                                         │
│    - DELETE on purchase_order_receptions                      │
│      → handle_reception_deletion()                            │
│         1. stock_real -= quantity_received (REVERSE)          │
│         2. DELETE stock_movements                             │
│                                                                │
│    Alert State: Back to 🔴 RED (if stock < min)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. TypeScript Type Definitions

### 11.1 Purchase Order Status Enum

```typescript
export type PurchaseOrderStatus =
  | 'draft' // Not yet sent (alert RED)
  | 'validated' // Sent to supplier (alert GREEN)
  | 'partially_received' // Some items received
  | 'received' // All items received (alert GONE)
  | 'cancelled'; // Cancelled
```

### 11.2 Stock Alert Type

```typescript
export interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'no_stock_but_ordered';
  severity: 'critical' | 'warning' | 'info';
  stock_real: number;
  stock_forecasted_in: number; // ← Key for 🟢 GREEN state
  stock_forecasted_out: number;
  min_stock: number;
  shortage_quantity: number;
  quantity_in_draft?: number;
  draft_order_id?: string;
  validated: boolean; // ← Tracks visibility
  validated_at?: string;
}
```

---

## 12. RLS Policies Impact

The `updatePurchaseOrderStatus()` server action uses an **admin client** (`createAdminClient()`) to bypass RLS policies because:

1. Standard client hits RLS policy blocks
2. Admin client can force updates across organization boundaries
3. Used specifically for status transitions that need cross-tenant access

```typescript
// Server Action uses admin client to bypass RLS
const supabase = createAdminClient();
await supabase.from('purchase_orders').update(updateFields).eq('id', orderId);
```

---

## 13. Summary Table: Stock Status Transitions

| State              | Alert Color | stock_real | stock_forecasted_in | UI Actions                  | Trigger         |
| ------------------ | ----------- | ---------- | ------------------- | --------------------------- | --------------- |
| Draft              | 🔴 RED      | 0          | 0                   | Edit, Validate, Delete      | None            |
| Validated          | 🟢 GREEN\*  | 0          | qty\*               | Receive, Unvalidate, Cancel | Missing trigger |
| Partially Received | ✅ Partial  | qty        | (qty-received)      | Receive more, Cancel        | ✅ Works        |
| Fully Received     | ✅ Gone     | qty        | 0                   | None                        | ✅ Works        |
| Cancelled          | 🔴 RED      | varies     | 0                   | None                        | None            |

\*Note: The Validated state's stock_forecasted_in is currently NOT being set automatically - this is the missing piece.

---

## 14. Key Insights

1. **Stock Movement Traceability:** Each movement is precisely linked to its source (reception_id, shipment_id) via corrected reference_type and reference_id fields.

2. **Trigger-Based Automation:** All stock calculations happen in database triggers (AFTER/BEFORE INSERT/UPDATE/DELETE), not in application code.

3. **Three-Color System:** Alert system uses `stock_forecasted_in` to determine if stock is on the way:
   - No forecasted stock + low real stock = 🔴 RED
   - Forecasted stock incoming = 🟢 GREEN
   - Stock received = ✅ Resolved

4. **Missing Sync Point:** The gap between PO validation and stock_forecasted_in increment is a critical missing piece in the current implementation.

5. **Products Without Thresholds:** The system gracefully handles products with `min_stock = 0` by not generating alerts for them unless they've been ordered before.

---

## Files Summary

### Core Stock Hooks

- `/packages/@verone/stock/src/hooks/use-stock-alerts.ts` - Alert fetching and filtering
- `/packages/@verone/stock/src/hooks/use-stock.ts` - Stock operations and calculations
- `/packages/@verone/orders/src/hooks/use-purchase-orders.ts` - PO management

### Server Actions

- `/apps/back-office/src/app/actions/purchase-orders.ts` - PO status updates

### Database Migrations (Latest)

- `20251124_001_trigger_delete_reception_reverse_stock.sql` - Deletion handling
- `20251124_003_trigger_update_reception_adjust_stock.sql` - Quantity adjustments
- `20251124_005_fix_stock_movements_reference_type.sql` - Reference correction
- `20251124_011_restore_insert_triggers.sql` - INSERT trigger restoration
- `20251012_001_smart_stock_alerts_system.sql` - Alert calculation logic

### Type Definitions

- `/packages/@verone/types/src/supabase.ts` - Database types (auto-generated)

---

**End of Report**
