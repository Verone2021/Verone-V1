# Module Commandes Clients - Vérone Back Office

**Version**: 1.0.0
**Dernière mise à jour**: 2026-01-23
**Responsable**: Romeo Dos Santos

---

## Vue d'ensemble

Le module Commandes Clients gère le cycle de vie complet des commandes B2B et B2C au sein de Vérone CRM/ERP. Il s'intègre étroitement avec les modules Stocks, Finance et LinkMe.

### Scope fonctionnel

- Création et gestion des commandes de vente
- Workflow de validation et approbation
- Suivi des expéditions partielles et totales
- Calcul automatique des montants (HT, TVA, TTC)
- Intégration avec le système de stocks prévisionnels
- Gestion des commissions (canal LinkMe)

---

## Architecture

### Tables Supabase principales

```
sales_orders                 # Table principale des commandes
├── sales_order_items        # Lignes de commande (1:N)
├── sales_order_shipments    # Expéditions associées (1:N)
├── organisations            # Client (organisation) lié (N:1)
├── channels                 # Canal de vente (N:1)
└── linkme_commissions       # Commission affilié si canal LinkMe (1:1)
```

#### Table `sales_orders`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| order_number | text | Numéro séquentiel (SO-YYYY-NNNNN) |
| status | enum | Statut workflow (voir FSM) |
| organisation_id | uuid | FK vers organisations |
| channel_id | uuid | FK vers channels (nullable) |
| total_ht | numeric | Montant HT calculé |
| total_ttc | numeric | Montant TTC calculé |
| total_vat | numeric | TVA totale |
| shipping_address | jsonb | Adresse de livraison |
| billing_address | jsonb | Adresse de facturation |
| notes | text | Notes internes |
| validated_at | timestamptz | Date validation |
| shipped_at | timestamptz | Date expédition complète |
| delivered_at | timestamptz | Date livraison |
| created_at | timestamptz | Date création |
| updated_at | timestamptz | Date mise à jour |

#### Table `sales_order_items`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| sales_order_id | uuid | FK vers sales_orders |
| product_id | uuid | FK vers products |
| quantity | integer | Quantité commandée |
| quantity_shipped | integer | Quantité expédiée (0 par défaut) |
| unit_price_ht | numeric | Prix unitaire HT |
| discount_percent | numeric | Remise en % |
| vat_rate | numeric | Taux TVA (20%, 10%, 5.5%) |
| line_total_ht | numeric | Total ligne HT |
| line_total_ttc | numeric | Total ligne TTC |

---

## Machine à États (FSM)

### Diagramme des transitions

```
                    ┌─────────────────────────────────────────────┐
                    │                                             │
                    v                                             │
┌─────────┐    ┌───────────┐    ┌───────────────────┐    ┌────────────┐    ┌───────────┐
│  DRAFT  │───>│ VALIDATED │───>│ PARTIALLY_SHIPPED │───>│   SHIPPED  │───>│ DELIVERED │
└─────────┘    └───────────┘    └───────────────────┘    └────────────┘    └───────────┘
     │              │                    │                      │
     │              │                    │                      │
     v              v                    v                      v
┌───────────────────────────────────────────────────────────────────────┐
│                           CANCELLED                                    │
└───────────────────────────────────────────────────────────────────────┘
```

### Définition des états

| État | Description | Actions possibles |
|------|-------------|-------------------|
| `draft` | Brouillon, en cours de saisie | Modifier, Valider, Supprimer |
| `validated` | Commande validée, réservation stock | Expédier, Annuler |
| `partially_shipped` | Expédition partielle effectuée | Expédier reste, Annuler |
| `shipped` | Commande entièrement expédiée | Marquer livrée, Annuler |
| `delivered` | Livraison confirmée | Aucune (état final) |
| `cancelled` | Commande annulée | Aucune (état final) |

### Règles de transition

```typescript
const VALID_TRANSITIONS: Record<Status, Status[]> = {
  draft: ['validated', 'cancelled'],
  validated: ['partially_shipped', 'shipped', 'cancelled'],
  partially_shipped: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [], // État final
  cancelled: [], // État final
};
```

---

## Impacts sur les Stocks

### Validation (draft → validated)

```sql
-- Trigger: trigger_so_update_forecasted_out
-- Action: Réserve stock prévisionnel

UPDATE products
SET stock_forecasted_out = stock_forecasted_out + NEW.quantity
WHERE id IN (SELECT product_id FROM sales_order_items WHERE sales_order_id = NEW.id);
```

**Formule stock prévisionnel**:
```
stock_previsionnel = stock_real + stock_forecasted_in - stock_forecasted_out
```

### Expédition (validated → partially_shipped/shipped)

```sql
-- Trigger: trigger_shipment_update_stock
-- Action: Décrémente stock réel et prévisionnel

UPDATE products
SET
  stock_real = stock_real - shipment.quantity,
  stock_forecasted_out = stock_forecasted_out - shipment.quantity
WHERE id = shipment.product_id;
```

### Annulation (→ cancelled)

```sql
-- Trigger: rollback_so_forecasted
-- Action: Libère réservation (SEULEMENT si depuis validated/partially_shipped)

IF OLD.status IN ('validated', 'partially_shipped') THEN
  UPDATE products
  SET stock_forecasted_out = stock_forecasted_out - (quantity - quantity_shipped)
  WHERE id IN (SELECT product_id FROM sales_order_items WHERE sales_order_id = OLD.id);
END IF;
```

**ATTENTION**: Pas de rollback si annulation depuis `draft` (aucune réservation n'avait été faite).

---

## Calculs Financiers

### Montant ligne

```typescript
function calculateLineTotal(item: SalesOrderItem) {
  const basePrice = item.unit_price_ht * item.quantity;
  const discount = basePrice * (item.discount_percent / 100);
  const lineHT = basePrice - discount;
  const lineVAT = lineHT * (item.vat_rate / 100);
  const lineTTC = lineHT + lineVAT;

  return { lineHT, lineVAT, lineTTC };
}
```

### Montant commande

```typescript
function calculateOrderTotals(order: SalesOrder) {
  const totals = order.items.reduce(
    (acc, item) => {
      const line = calculateLineTotal(item);
      return {
        totalHT: acc.totalHT + line.lineHT,
        totalVAT: acc.totalVAT + line.lineVAT,
        totalTTC: acc.totalTTC + line.lineTTC,
      };
    },
    { totalHT: 0, totalVAT: 0, totalTTC: 0 }
  );

  // Appliquer frais de port si applicable
  if (order.shipping_cost) {
    totals.totalHT += order.shipping_cost;
    totals.totalVAT += order.shipping_cost * 0.20; // TVA 20% sur port
    totals.totalTTC += order.shipping_cost * 1.20;
  }

  return totals;
}
```

---

## Intégration LinkMe

### Détection canal LinkMe

```typescript
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

function isLinkmeOrder(order: SalesOrder): boolean {
  return order.channel_id === LINKME_CHANNEL_ID;
}
```

### Calcul commission

À la validation d'une commande LinkMe, un trigger crée automatiquement une commission:

```sql
-- Trigger: trg_create_linkme_commission
-- Table: linkme_commissions

INSERT INTO linkme_commissions (
  sales_order_id,
  affiliate_id,
  order_total_ttc,
  commission_rate,
  commission_amount,
  status
)
SELECT
  NEW.id,
  so.affiliate_id,
  NEW.total_ttc,
  a.commission_rate,
  NEW.total_ttc * a.commission_rate / 100,
  'pending'
FROM sales_orders so
JOIN affiliates a ON so.affiliate_id = a.id
WHERE so.id = NEW.id AND NEW.status = 'validated';
```

---

## API et Actions

### Server Actions principales

| Action | Fichier | Description |
|--------|---------|-------------|
| `createSalesOrder` | `app/actions/orders.ts` | Créer brouillon |
| `validateSalesOrder` | `app/actions/orders.ts` | Valider commande |
| `shipSalesOrder` | `app/actions/orders.ts` | Enregistrer expédition |
| `cancelSalesOrder` | `app/actions/orders.ts` | Annuler commande |

### Exemple: Validation

```typescript
'use server'

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';

const validateSchema = z.object({
  orderId: z.string().uuid(),
});

export async function validateSalesOrder(formData: FormData) {
  const { orderId } = validateSchema.parse(Object.fromEntries(formData));

  const supabase = createServerClient(/* ... */);

  // Vérifier que la commande est en draft
  const { data: order } = await supabase
    .from('sales_orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (order?.status !== 'draft') {
    return { error: 'Seul un brouillon peut être validé' };
  }

  // Mettre à jour le statut (les triggers gèrent le reste)
  const { error } = await supabase
    .from('sales_orders')
    .update({
      status: 'validated',
      validated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/commandes/clients');
  return { success: true };
}
```

---

## Vues et Requêtes

### Vue enrichie pour liste

```sql
CREATE VIEW sales_orders_list_view AS
SELECT
  so.id,
  so.order_number,
  so.status,
  so.total_ttc,
  so.created_at,
  so.validated_at,
  o.name AS customer_name,
  o.city AS customer_city,
  ch.name AS channel_name,
  COUNT(soi.id) AS items_count,
  SUM(soi.quantity) AS total_quantity,
  SUM(soi.quantity_shipped) AS total_shipped
FROM sales_orders so
LEFT JOIN organisations o ON so.organisation_id = o.id
LEFT JOIN channels ch ON so.channel_id = ch.id
LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
GROUP BY so.id, o.name, o.city, ch.name;
```

---

## Règles Métier

### Validation

1. **Stock disponible**: Vérifier `stock_previsionnel >= quantity` pour chaque item
2. **Client valide**: Organisation avec statut actif
3. **Montant minimum**: `total_ttc >= 50€` (configurable)
4. **Adresse complète**: Adresse de livraison obligatoire

### Annulation

1. **Depuis draft**: Suppression autorisée
2. **Depuis validated**: Rollback stock prévisionnel
3. **Depuis partially_shipped**: Rollback stock restant non expédié
4. **Depuis shipped/delivered**: Nécessite note justificative

### Expédition

1. **Quantité max**: `quantity_to_ship <= quantity - quantity_shipped`
2. **Stock réel**: Vérifier disponibilité avant expédition
3. **Tracking**: Numéro de suivi obligatoire si transporteur

---

## Tests

### Scénarios E2E

```typescript
// packages/e2e-linkme/tests/orders.spec.ts

test('Workflow complet commande client', async ({ page }) => {
  // 1. Créer brouillon
  await page.goto('/commandes/clients/nouveau');
  await page.fill('[name="customer"]', 'ACME Corp');
  await page.click('button:has-text("Ajouter produit")');
  // ...

  // 2. Valider
  await page.click('button:has-text("Valider")');
  await expect(page.locator('.status-badge')).toHaveText('Validée');

  // 3. Vérifier stock réservé
  const stockBefore = await getProductStock(productId);
  expect(stockBefore.forecasted_out).toBeGreaterThan(0);

  // 4. Expédier
  await page.click('button:has-text("Expédier")');
  // ...
});
```

---

## Monitoring

### Métriques clés

| Métrique | Description | Alerte si |
|----------|-------------|-----------|
| `orders.draft.count` | Brouillons > 7 jours | > 10 |
| `orders.validated.pending_shipment` | En attente expédition | > 20 |
| `orders.average_processing_time` | Temps moyen draft→shipped | > 48h |
| `orders.cancellation_rate` | Taux d'annulation | > 5% |

### Logs applicatifs

```typescript
// Pattern de logging
console.log('[SalesOrder] Validation started', { orderId, userId });
console.log('[SalesOrder] Stock reserved', { orderId, items: reservedItems });
console.log('[SalesOrder] Validation completed', { orderId, duration: elapsed });
```

---

## Fichiers de référence

| Type | Chemin |
|------|--------|
| Types | `packages/@verone/types/src/orders.ts` |
| Actions | `apps/back-office/app/actions/orders.ts` |
| Composants | `apps/back-office/src/components/orders/` |
| Hooks | `packages/@verone/orders/src/hooks/` |
| Migrations | `supabase/migrations/*_sales_orders*.sql` |
| Tests | `packages/e2e-linkme/tests/orders.spec.ts` |

---

**Changelog**:
- 2026-01-23: Création documentation module
