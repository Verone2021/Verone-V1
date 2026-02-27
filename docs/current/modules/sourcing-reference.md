# Sourcing & Catalogue Workflows Reference

## Sourcing Product State Machine

```
sourcing (initial)
  |
  +-- requires_sample = true  --> echantillon_a_commander
  |                                 |
  |                             sample validated + order
  |                                 |
  +-- requires_sample = false --> pret_a_commander
                                    |
                              first order OR stock > 0
                                    |
                                in_stock (active)
```

### Status Values (availability_status_type)

| Status                    | Color  | Icon          | Description                         |
| ------------------------- | ------ | ------------- | ----------------------------------- |
| `sourcing`                | gray   | Clock         | Product in research phase           |
| `pret_a_commander`        | blue   | CheckCircle   | Supplier linked, ready for first PO |
| `echantillon_a_commander` | orange | AlertTriangle | Sample required before ordering     |
| `in_stock`                | green  | Package       | Product activated and available     |

### Automatic Status Calculation

SQL function `calculate_sourcing_product_status(product_id UUID)`:

1. If `requires_sample = true` --> `echantillon_a_commander`
2. If no purchase orders AND no stock --> `pret_a_commander`
3. If has purchase orders OR stock > 0 --> `in_stock`
4. Otherwise --> `sourcing`

---

## Sourcing Quick Create (3 Required Fields)

| Field                | Required | Validation              |
| -------------------- | -------- | ----------------------- |
| `name`               | Yes      | Min 3 characters        |
| `supplier_page_url`  | Yes      | Valid URL               |
| `cost_price`         | Yes      | > 0                     |
| `assigned_client_id` | No       | If set: type = 'client' |

On creation:

- `creation_mode = 'sourcing'`
- `status = 'sourcing'`
- `completion_percentage = 30`
- Trigger `generate_product_sku()` generates SKU (PRD-XXXX)
- `sourcing_type` auto-set: `'client'` if assigned_client_id, else `'interne'`

---

## Validation Rules

**Supplier is mandatory before validation.** No sourcing product can be validated without `supplier_id`.

Validation function `validate_sourcing_product(draft_id)` checks:

1. `supplier_id IS NOT NULL` (required)
2. `cost_price > 0` (required)
3. If `requires_sample = true` --> `sample_status = 'validated'`

---

## Conversion: Sourcing --> Catalogue Product

When "Valider au catalogue" is clicked:

```sql
UPDATE products SET
  status = 'in_stock',
  stock_real = 1,
  completion_percentage = 100,
  creation_mode = 'complete'
WHERE id = $1;

INSERT INTO stock_movements (
  product_id, movement_type, quantity_change,
  quantity_before, quantity_after,
  reason_code
) VALUES (
  $1, 'sourcing_validation', 1, 0, 1,
  'sourcing_completed'
);
```

After validation, product appears in `/produits/catalogue/[id]` and disappears from `/produits/sourcing`.

---

## Sample Workflow (when requires_sample = true)

```
sourcing_validated
  --> sample_request_pending (approval request)
  --> approved
  --> ordered (PO created with qty=1)
  --> delivered (reception)
  --> sample_approved (quality validation)
  --> product_created (catalogue)

// OR rejection path:
sample_rejected --> back to sourcing OR archive
```

### Sample DB Columns (product_drafts)

| Column                  | Type          | Description                                                           |
| ----------------------- | ------------- | --------------------------------------------------------------------- |
| `sourcing_status`       | TEXT enum     | draft, sourcing_validated, ready_for_catalog, archived                |
| `sample_status`         | TEXT enum     | not_required, request_pending, ordered, delivered, approved, rejected |
| `sample_request_status` | TEXT enum     | pending_approval, approved, rejected                                  |
| `sourcing_validated_at` | TIMESTAMPTZ   | When sourcing was validated                                           |
| `sample_requested_at`   | TIMESTAMPTZ   | When sample was requested                                             |
| `sample_ordered_at`     | TIMESTAMPTZ   | When sample PO was created                                            |
| `sample_delivered_at`   | TIMESTAMPTZ   | When sample was received                                              |
| `sample_validated_at`   | TIMESTAMPTZ   | When sample passed QA                                                 |
| `sample_estimated_cost` | DECIMAL(10,2) | Estimated sample cost                                                 |

---

## Catalogue Workflows (7 Workflows)

### 1. Product Creation (4-Step Wizard)

Steps: General Info --> Images --> Price & Margin --> Initial Stock

Key triggers on INSERT:

- `generate_product_sku()` --> auto SKU
- `calculate_product_completion()` --> completion_percentage (0-100%)
- `update_product_stock_status()` --> status based on stock

Completion scoring: name +20%, images +20%, price +20%, stock +20%, supplier +10%, category +10%.

### 2. Product Modification

Section-based editing: info, images, price, stock, packaging. Triggers recalculate completion and stock status on UPDATE.

### 3. Archive & Restore

Archive: `status = 'archived'`, sets `archived_reason` and `archived_at`.
Restore: `status = 'in_stock'` (recalculated by trigger), clears archived fields.

### 4. Image Management

- Bucket: `product-images`, path: `products/{productId}/{timestamp}-{random}.{ext}`
- Max 10 images, max 5MB each, JPEG/PNG/WebP
- Triggers: `generate_public_url()`, `ensure_single_primary_image()`

### 5. Packaging Management

- Types: single, pack, bulk, custom
- Business rule: at least 1 `type='single'` package, exactly 1 `is_default=true`
- Pricing: either `unit_price_ht` (specific) or `discount_rate` (percentage off base)

### 6. Stock Management

Stock adjustments create `stock_movements` records and update `products.stock_real`. Trigger `update_product_stock_status()` sets status: stock > 0 --> `in_stock`, stock = 0 --> `out_of_stock`.

### 7. Sourcing --> Catalogue Integration

See "Conversion" section above.

---

## Key Tables

| Table                  | Purpose                              |
| ---------------------- | ------------------------------------ |
| `products`             | Main product table                   |
| `product_drafts`       | Sourcing drafts with sample tracking |
| `product_images`       | Image gallery per product            |
| `product_packages`     | Packaging/conditioning options       |
| `stock_movements`      | Stock change audit trail             |
| `purchase_orders`      | Supplier orders                      |
| `purchase_order_items` | PO line items                        |

---

## Key Triggers

| Trigger                                          | On                            | Function                                             |
| ------------------------------------------------ | ----------------------------- | ---------------------------------------------------- |
| `generate_product_sku`                           | INSERT products               | Auto-generates SKU (PRD-XXXX)                        |
| `calculate_product_completion`                   | INSERT/UPDATE products        | Calculates completion_percentage                     |
| `update_product_stock_status`                    | UPDATE products.stock_real    | Sets status from stock level                         |
| `generate_public_url`                            | INSERT product_images         | Generates public URL                                 |
| `ensure_single_primary_image`                    | UPDATE product_images         | Enforces single primary image                        |
| `trigger_update_sourcing_status_on_po_reception` | UPDATE purchase_orders.status | Recalculates sourcing product status on PO reception |

---

## General Order State Machines

### Sales Order

```
BROUILLON --> ENVOYEE --> VALIDEE --> EXPEDIEE --> LIVREE
                 |           |
                 v           v
              REFUSEE     ANNULEE
```

Timestamps: `validated_at`, `shipped_at`, `delivered_at`, `cancelled_at`

### Invoice

```
BROUILLON --> EMIS --> PAYE
                |
                v
              ANNULE
```

Timestamps: `issued_at`, `paid_at`, `voided_at`

### Stock Movements

Types: IN, OUT, ADJUST, TRANSFER. Reserve at VALIDEE, decrement at EXPEDIEE.
