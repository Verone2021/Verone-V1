# Plan: Purchase Order Complete vs Partial Fulfillment Tracking

**Date**: 2025-11-27
**Status**: Analysis Complete - Ready for Implementation Planning

---

## Executive Summary

### Current State Analysis

The purchase order system **ALREADY HAS** a foundation for tracking complete vs partial fulfillment:

1. **Database Columns Present** ✅
   - `purchase_orders.status` - ENUM with `partially_received` and `received` values
   - `purchase_order_items.quantity` - Total ordered quantity
   - `purchase_order_items.quantity_received` - Actual received quantity (tracks partial receipts)

2. **Status Display Working** ✅
   - UI shows `partially_received` (amber) vs `received` (green) with proper color coding
   - Status is determined by comparing quantities at line level

3. **Reception Workflow Implemented** ✅
   - `PurchaseOrderReceptionModal` allows receiving items with `quantity_received`
   - Logic compares all items: if ANY item is partial → order = `partially_received`
   - If ALL items fully received → order = `received`

---

## Current Architecture

### Database Tables Involved

```
purchase_orders (Header)
├── id (UUID)
├── po_number (unique identifier)
├── supplier_id (FK organisations)
├── status (ENUM: draft|validated|partially_received|received|cancelled)
├── total_ht, total_ttc (pricing)
├── validated_at, received_at, cancelled_at (timestamps)
└── purchase_order_items (Line Items)
    ├── id (UUID)
    ├── purchase_order_id (FK)
    ├── product_id (FK)
    ├── quantity (total ordered)
    ├── quantity_received (actual received)
    ├── unit_price_ht, discount_percentage
    └── created_at, updated_at

purchase_order_receptions (Detail Receipt Log)
├── id (UUID)
├── purchase_order_id (FK)
├── product_id (FK)
├── quantity_received (portion received in this receipt)
├── received_at, received_by
└── batch_number (optional traceability)
```

### Status Determination Logic (use-purchase-orders.ts lines 691-707)

```typescript
// Current implementation:
const allItemsFullyReceived = items.every(
  item => item.quantity_received >= item.quantity
);
const hasPartialReceipts = items.some(
  item => item.quantity_received > 0
);

if (allItemsFullyReceived) {
  newStatus = 'received';
} else if (hasPartialReceipts) {
  newStatus = 'partially_received';
}
```

---

## Missing Pieces for Full Traceability

### 1. **Incomplete Quantity Cancellation** ⚠️

**Issue**: When a partial shipment is received, the remaining quantity is never formally tracked:
- Example: Order 100 units, receive 60 → 40 remain in limbo
- No column to record "quantity_cancelled" at line item level

**Current Workaround**:
- Modal "CancelRemainderModal" allows users to mark remainder as cancelled
- But NO database column records this decision

**Missing Schema**:
```sql
ALTER TABLE purchase_order_items ADD COLUMN (
  quantity_cancelled INTEGER DEFAULT 0,  -- Units that won't be delivered
  reason_cancelled TEXT,                  -- Why cancelled (supplier out of stock, etc.)
  cancelled_at TIMESTAMPTZ               -- When decision made
);
```

### 2. **Reliquat Tracking Not Formally Stored** ⚠️

**Issue**: Only visual calculation at UI level, no persistent record
- Opening modal shows remainders but they're calculated on-the-fly
- No historical trace of what was cancelled vs what's still pending

### 3. **Billing Integration Gap** ⚠️

**Issue**: No link between PO fulfillment status and invoicing
- `financial_documents` table has `purchase_order_id` FK
- But no business logic prevents invoicing partial orders or validates fulfillment
- Missing: Is invoice created ONLY after full receipt? Or can be partial?

**Current State in financial_documents**:
- Just a foreign key reference
- No enforcement of fulfillment status

### 4. **Stock Movements Don't Differentiate** ⚠️

**Issue**: `stock_movements.reference_type` is generic
- Records "purchase_order" but doesn't distinguish:
  - Initial receipt (full)
  - Partial receipt 1
  - Partial receipt 2
  - Cancelled remainder

**Better**: Add `stock_movements.reception_id` FK to link to `purchase_order_receptions` for full traceability

---

## What Works Well Today

### ✅ UI Display (page.tsx lines 79-93)

```typescript
const statusLabels = {
  draft: 'Brouillon',
  validated: 'Validée',
  partially_received: 'Partiellement reçue',  // ✅ Clearly shown
  received: 'Reçue',                          // ✅ Clearly shown
  cancelled: 'Annulée',
};

const statusColors = {
  partially_received: 'bg-amber-100 text-amber-800',  // 🟠 Amber badge
  received: 'bg-green-100 text-green-800',            // 🟢 Green badge
};
```

### ✅ Reception Form (PurchaseOrderReceptionForm)

- Input `quantity_received` per item
- Creates `purchase_order_receptions` records
- Auto-updates `purchase_order_items.quantity_received`
- Triggers status recalculation

### ✅ Cancel Remainder Modal (page.tsx lines 689-708)

- Shows remaining quantity per item
- Allows user to cancel the remainder
- But: Changes NOT persisted to DB (only in transaction)

---

## Interactions with Billing System

### Current Connection

`financial_documents` table:
```sql
purchase_order_id UUID REFERENCES purchase_orders(id),
```

### Missing Validations

No business rule that says:
- ❌ "Cannot invoice until order fully received"
- ❌ "Can only invoice received quantities"
- ❌ "Invoice total must match order fulfillment"

### Implication

A user COULD:
1. Order 100 units
2. Receive 60 units
3. Create invoice for 100 units (WRONG - exposes overcharge risk)

---

## Key Findings

### Files Analyzed

1. **Database Schema** (via mcp__supabase__list_tables)
   - `purchase_orders` table structure
   - `purchase_order_items` with quantity_received column
   - `purchase_order_receptions` exists for audit trail

2. **Frontend Pages**
   - `/apps/back-office/src/app/commandes/fournisseurs/page.tsx` (1316 lines)
   - Shows proper status colors and labels for partial vs complete

3. **Business Logic Hooks**
   - `/packages/@verone/orders/src/hooks/use-purchase-orders.ts`
   - Lines 691-707: Status logic (simple comparison)
   - Lines 665-710: Reception update logic

4. **Server Actions**
   - `/apps/back-office/src/app/actions/purchase-orders.ts`
   - Only updates status, no fulfillment tracking

---

## Questions for Implementation Planning

Before proceeding, clarify:

1. **Partial Invoicing Policy**
   - Should invoices reflect received quantities only?
   - Or can customer be invoiced for full order with backorder clause?

2. **Remainder Cancellation**
   - Should cancelled items be reversible (status = "pending_cancellation")?
   - Or final once user confirms?

3. **Supplier Communication**
   - Should "partially_received" orders auto-notify supplier?
   - Should remainder cancellations auto-communicate?

4. **Multi-Reception Workflow**
   - Support 3+ partial shipments (current only handles 2)?
   - Or max 1 reception + 1 remainder?

5. **Historical Audit**
   - Log every reception event with user/timestamp?
   - Already done via `purchase_order_receptions` table?

---

## Technical Recommendations

### Phase 1: Schema Enhancement (Required)
1. Add `quantity_cancelled` + `cancelled_at` to `purchase_order_items`
2. Add `reception_id` FK to `stock_movements` for full traceability
3. Create trigger to auto-calculate `status` based on item quantities

### Phase 2: Business Rules (Required)
1. Enforce invoicing rules (can't invoice > received)
2. Add validation in financial_documents insert

### Phase 3: UI Enhancement (Optional)
1. Show breakdown: Ordered | Received | Cancelled | Pending
2. Add historical timeline of receptions
3. Add remainder cancellation reason selection

### Phase 4: Integration (Optional)
1. Auto-notify supplier on partial receipt
2. Auto-generate backorder PO for cancelled items

---

## Files to Modify

### Core Files
1. `/supabase/migrations/` - Schema changes
2. `packages/@verone/orders/src/hooks/use-purchase-orders.ts` - Status logic
3. `apps/back-office/src/app/commandes/fournisseurs/page.tsx` - UI display

### Supporting Files
4. `packages/@verone/orders/src/components/modals/CancelRemainderModal.tsx` - Form persistence
5. `packages/@verone/orders/src/actions/purchase-receptions.ts` - Business rules
6. `packages/@verone/orders/src/components/tables/` - Table enhancements

### Financial Integration
7. `packages/@verone/financial/` - Billing validations (if exists)

---

## Success Criteria

- [ ] `purchase_order_items.quantity_cancelled` persisted in DB
- [ ] All orders show correct status (partially_received vs received)
- [ ] Table displays cancellation reason alongside partial quantities
- [ ] Cannot invoice beyond received quantities
- [ ] Historical audit trail shows all receipts + cancellations
- [ ] Zero console errors
- [ ] Full test coverage for status determination logic

---

## Conclusion

**The foundation IS there**, but it's incomplete:

✅ **WORKING**: Status display (partially_received vs received)
✅ **WORKING**: Receiving workflow
❌ **MISSING**: Formal cancellation tracking
❌ **MISSING**: Billing integration/validation
❌ **MISSING**: Full stock movement traceability

**Recommendation**: Before coding, get stakeholder input on the 5 questions above. The actual implementation is straightforward once business rules are defined.

