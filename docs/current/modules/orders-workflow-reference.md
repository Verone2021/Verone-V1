# Orders Workflow Reference

**Version** : 2.0 (consolidated)
**Date** : 2026-02-26
**Sources** : 6 archived documents (see bottom)

---

## Sales Orders (SO) - Status Transitions

### Statuses

| Status              | Label                  | Editable    | Deletable |
| ------------------- | ---------------------- | ----------- | --------- |
| `draft`             | Brouillon              | Yes         | Yes       |
| `confirmed`         | Validee                | If not paid | No        |
| `partially_shipped` | Partiellement expediee | No          | No        |
| `shipped`           | Expediee               | No          | No        |
| `delivered`         | Livree                 | No          | No        |
| `cancelled`         | Annulee                | No          | No        |

### Transitions

```
draft ──[validate]──> confirmed ──[ship partial]──> partially_shipped ──[ship rest]──> shipped ──[confirm delivery]──> delivered
  │                       │                              │
  └──[cancel]──> cancelled  └──[devalidate]──> draft     └──[cancel]──> cancelled
                              └──[cancel]──> cancelled
```

### What Fires at Each Transition

| Transition                        | Trigger / Side-Effect                                                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `draft -> confirmed`              | `stock_forecasted_out += quantity` per item; stock movement type `sales_order_forecast` created; order locked (limited edits) |
| `confirmed -> draft` (devalidate) | `stock_forecasted_out -= quantity`; rollback forecast movement                                                                |
| `confirmed -> partially_shipped`  | `stock_real -= shipped_qty` per item; shipment movement created (type `shipment`); `warehouse_exit_at` timestamp set          |
| `partially_shipped -> shipped`    | Remaining `stock_real -= remaining_qty`; final shipment movement                                                              |
| `shipped -> delivered`            | `delivered_at` timestamp set; no stock impact                                                                                 |
| Any -> `cancelled`                | Full rollback of `stock_forecasted_out`; history preserved                                                                    |

### Payment Status (gates shipping)

| payment_status | Can Ship?                     |
| -------------- | ----------------------------- |
| `pending`      | Only if B2B credit authorized |
| `partial`      | No                            |
| `paid`         | Yes                           |
| `refunded`     | No                            |
| `overdue`      | No                            |

### Editability Rules

- `draft`: all fields editable
- `confirmed` + not paid: products/quantities with restrictions; addresses and notes editable; prices locked
- `confirmed` + paid: locked (notes only with restrictions)
- `shipped` / `delivered`: fully locked

---

## Purchase Orders (PO) - Status Transitions

### Statuses

| Status               | Label               | Editable               | Stock Alert Color         |
| -------------------- | ------------------- | ---------------------- | ------------------------- |
| `draft`              | Brouillon           | Yes                    | Red (need supply)         |
| `validated`          | Validee             | Limited (notes, dates) | Green (order in progress) |
| `partially_received` | Partiellement recue | Reception fields only  | Green                     |
| `received`           | Recue               | No                     | Disappears (fulfilled)    |
| `cancelled`          | Annulee             | No                     | Red (reverts)             |

### Transitions

```
draft ──[validate]──> validated ──[receive partial]──> partially_received ──[receive rest]──> received
  │                       │                                  │
  └──[cancel]──> cancelled  └──[devalidate]──> draft         └──[cancel]──> cancelled
                              └──[cancel]──> cancelled
```

**Important**: Never use `sent` status for POs. `sent` exists in the enum for SO legacy compatibility only.

### What Fires at Each Transition

| Transition                        | Trigger / Side-Effect                                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `draft -> validated`              | `stock_forecasted_in += quantity` per item; `validated_at` / `validated_by` set; stock alert red -> green                                                             |
| `validated -> draft` (devalidate) | `stock_forecasted_in -= quantity`; stock alert green -> red                                                                                                           |
| `validated -> partially_received` | Differential calc: `delta = new_qty_received - old_qty_received`; `stock_real += delta`; `stock_forecasted_in -= delta`; 2 movements created (forecast OUT + real IN) |
| `partially_received -> received`  | Same differential calc for remaining; status set to `received`; stock alert disappears if stock >= threshold                                                          |
| Any -> `cancelled`                | Full rollback `stock_forecasted_in`; history preserved; stock alert reverts to red                                                                                    |

---

## Partial Reception / Shipment Workflow

### Partial Reception (PO)

The system uses **differential calculation** on `quantity_received`:

1. User sets `quantity_received` to cumulative total (not incremental)
2. Trigger computes `delta = NEW.quantity_received - OLD.quantity_received`
3. Only delta units are processed: `stock_real += delta`, `stock_forecasted_in -= delta`
4. Two stock movements per partial reception: forecast OUT + real IN

**Example** (100 units ordered):

| Step            | quantity_received | stock_real delta | forecasted_in delta |
| --------------- | ----------------- | ---------------- | ------------------- |
| Receive 40      | 40                | +40              | -40                 |
| Receive 35 more | 75                | +35              | -35                 |
| Receive 25 more | 100               | +25              | -25                 |

### Partial Shipment (SO)

Same differential pattern on `quantity_shipped`:

1. User sets `quantity_shipped` to cumulative total
2. Trigger computes delta
3. `stock_real -= delta` (immediate physical exit)
4. `stock_forecasted_out` remains unchanged (reservation maintained until fully shipped)
5. One stock movement per partial shipment: real OUT

**Example** (50 units ordered):

| Step         | quantity_shipped | stock_real delta | forecasted_out |
| ------------ | ---------------- | ---------------- | -------------- |
| Ship 20      | 20               | -20              | unchanged      |
| Ship 15 more | 35               | -15              | unchanged      |
| Ship 15 more | 50               | -15              | unchanged      |

---

## Stock Movement Types

| movement_type  | affects_forecast | forecast_type | Context                              |
| -------------- | ---------------- | ------------- | ------------------------------------ |
| OUT (negative) | true             | out           | SO validation (forecast reservation) |
| OUT (negative) | false            | null          | SO shipment (physical exit)          |
| OUT (negative) | true             | in            | PO reception (cancel forecast)       |
| IN (positive)  | false            | null          | PO reception (add to real stock)     |

**Formula**: `stock_quantity = stock_real + stock_forecasted_in - stock_forecasted_out`

---

## Key Database Triggers (10 active)

| Trigger                                    | Table                     | Purpose                                          |
| ------------------------------------------ | ------------------------- | ------------------------------------------------ |
| `trigger_po_update_forecasted_in`          | purchase_orders           | Validation -> stock_forecasted_in                |
| `trigger_reception_update_stock`           | purchase_order_receptions | Reception -> stock_real + sync quantity_received |
| `trigger_update_po_status_after_reception` | purchase_order_receptions | Auto-set partially_received / received           |
| `trigger_so_update_forecasted_out`         | sales_orders              | Validation -> stock_forecasted_out               |
| `trigger_shipment_update_stock`            | sales_order_shipments     | Shipment -> stock_real + sync quantity_shipped   |
| `trigger_update_so_status_after_shipment`  | sales_order_shipments     | Auto-set partially_shipped / shipped             |
| + 4 triggers                               | various                   | Stock alerts + notifications                     |

**Known fix**: Migration `20251128_016_remove_duplicate_shipment_trigger.sql` removed redundant `sales_order_shipment_trigger` on `sales_orders` that caused double stock deduction on shipments.

---

## Key Files

### Server Actions (ADR-0008: Server Actions over API Routes)

| File                                                         | Purpose                       |
| ------------------------------------------------------------ | ----------------------------- |
| `packages/@verone/orders/src/actions/purchase-receptions.ts` | `validatePurchaseReception()` |
| `packages/@verone/orders/src/actions/sales-shipments.ts`     | `validateSalesShipment()`     |
| `apps/back-office/src/app/actions/purchase-orders.ts`        | `updatePurchaseOrderStatus()` |

### Hooks

| File                                                            | Purpose                  |
| --------------------------------------------------------------- | ------------------------ |
| `packages/@verone/orders/src/hooks/use-purchase-orders.ts`      | PO CRUD + status changes |
| `packages/@verone/orders/src/hooks/use-sales-orders.ts`         | SO CRUD + status changes |
| `packages/@verone/orders/src/hooks/use-purchase-receptions.ts`  | Reception workflow       |
| `packages/@verone/orders/src/hooks/use-sales-shipments.ts`      | Shipment workflow        |
| `packages/@verone/orders/src/hooks/use-draft-purchase-order.ts` | Draft PO management      |
| `packages/@verone/orders/src/hooks/use-order-items.ts`          | Order items shared logic |

### UI Components

| File                                                                            | Purpose                          |
| ------------------------------------------------------------------------------- | -------------------------------- |
| `apps/back-office/src/app/commandes/fournisseurs/page.tsx`                      | PO list page (tabs, KPIs, table) |
| `apps/back-office/src/app/commandes/clients/page.tsx`                           | SO list page                     |
| `apps/back-office/src/app/commandes/expeditions/page.tsx`                       | Shipments page                   |
| `packages/@verone/orders/src/components/modals/PurchaseOrderDetailModal.tsx`    | PO detail (2-column layout)      |
| `packages/@verone/orders/src/components/modals/PurchaseOrderFormModal.tsx`      | PO create/edit form              |
| `packages/@verone/orders/src/components/modals/PurchaseOrderReceptionModal.tsx` | Reception modal                  |

### Database Tables

| Table                                                  | Purpose                                               |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `sales_orders` / `sales_order_items`                   | Client orders                                         |
| `purchase_orders` / `purchase_order_items`             | Supplier orders                                       |
| `sales_order_shipments` / `sales_order_shipment_items` | Shipment records                                      |
| `purchase_order_receptions`                            | Reception records                                     |
| `stock_movements`                                      | Full audit trail                                      |
| `stock_alert_tracking`                                 | Stock alert state                                     |
| `products`                                             | stock_real, stock_forecasted_in, stock_forecasted_out |

---

## ADR-0008: Server Actions over API Routes

**Decision**: Replace internal API Routes with Server Actions (Next.js 15 best practice).

**Rationale**:

- API Routes are for public/external endpoints only
- Server Actions eliminate HTTP/JSON overhead (+15-30% perf)
- Native TypeScript end-to-end (no serialization)
- Native integration with `revalidatePath()` for cache

**Migration**: Old `/api/purchase-receptions/validate` and `/api/sales-shipments/validate` routes deleted. Replaced by `validatePurchaseReception()` and `validateSalesShipment()` Server Actions with `'use server'` directive + Zod validation.

**Database triggers were NOT modified** -- the existing 10 triggers already handle all stock logic correctly.

---

## Consolidated Sources

1. `docs/recovered/archive-2026-01/COMMANDES-WORKFLOW-VALIDATION-EXPEDITION.md` (2025-10-11)
2. `docs/recovered/audits/AUDIT-COMPLETE-ORDERS-STOCK-LIFECYCLE-2025-11-28.md` (2025-11-28)
3. `docs/recovered/workflows/partial-shipments-receptions.md` (2025-10-18)
4. `docs/recovered/archive-2026-01/0008-migration-server-actions-receptions-expeditions.md` (2025-11-22)
5. `docs/recovered/serena-snapshots/purchase-orders-validated-workflow-2025-11-19.md` (2025-11-19)
6. `docs/recovered/serena-snapshots/purchase-orders-exploration-2025-11-25.md` (2025-11-25)
