# Dev Plan — BO-SHIP-BACKORDER-001 (Clôture backorder + libération stock)

**Date** : 2026-04-22
**Branche à créer** : feat/BO-SHIP-BACKORDER-001
**Statut** : EN ATTENTE — accord Romeo requis (migration DB + trigger stock)

---

## Contexte

Cette PR a été retirée de `BO-SHIP-FEAT-001` car elle nécessite une migration DB
créant un nouveau trigger stock — action FEU ROUGE selon
`.claude/rules/stock-triggers-protected.md`.

---

## Objectif

Permettre à un gestionnaire de clôturer manuellement une commande en statut
`partially_shipped` (backorder) pour libérer le stock prévisionnel restant
(`stock_forecasted_out`).

---

## Migration DB requise (FEU ROUGE — accord Romeo nécessaire)

### Trigger à créer

```sql
-- Fichier : supabase/migrations/YYYYMMDDHHMMSS_so_closed_forecasted_rollback.sql

CREATE OR REPLACE FUNCTION rollback_forecasted_on_so_close()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer les stock_movements de type forecast liés à cette commande
  DELETE FROM stock_movements
  WHERE sales_order_id = NEW.id
    AND movement_type = 'forecast_out';

  -- Remettre à zéro stock_forecasted_out pour les produits concernés
  UPDATE products p
  SET stock_forecasted_out = GREATEST(
    0,
    p.stock_forecasted_out - (
      SELECT COALESCE(SUM(soi.quantity - COALESCE(soi.quantity_shipped, 0)), 0)
      FROM sales_order_items soi
      WHERE soi.sales_order_id = NEW.id
        AND soi.product_id = p.id
    )
  )
  WHERE p.id IN (
    SELECT DISTINCT product_id FROM sales_order_items
    WHERE sales_order_id = NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET row_security = off;

CREATE TRIGGER trg_so_closed_forecasted_rollback
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  WHEN (OLD.status = 'partially_shipped' AND NEW.status = 'closed')
  EXECUTE FUNCTION rollback_forecasted_on_so_close();
```

**Note** : La logique est similaire à `rollback_so_forecasted` (annulation SO).
Adapter en ne rollbackant que la quantité restante (quantité totale - quantité déjà
expédiée), car une partie du stock a déjà été consommée réellement.

---

## Code TS (déjà écrit — à restaurer depuis git history de `fix/BO-SHIP-FEAT-001-email-backorder`)

Le bouton + AlertDialog de clôture ont été implémentés dans
`packages/@verone/orders/src/components/modals/order-detail/OrderActionsCard.tsx`
sur la branche `fix/BO-SHIP-FEAT-001-email-backorder`.

Ils ont été retirés lors de la correction review round 1 (2026-04-22).

Pour restaurer : `git show 8ca1ad6aa:packages/@verone/orders/src/components/modals/order-detail/OrderActionsCard.tsx`

### Composants à restaurer

- Bouton "Clôturer (libérer stock réservé)" visible si `order.status === 'partially_shipped' && !readOnly`
- AlertDialog de confirmation avec textarea raison (optionnelle, max 200 chars)
- Handler `handleConfirmClose` : UPDATE `sales_orders SET status='closed', closed_at, closed_by, notes`
- Prop `onOrderUpdated?: () => void` sur `OrderActionsCardProps`

### Champs DB requis

Vérifier que `sales_orders` a les colonnes :

- `closed_at TIMESTAMPTZ`
- `closed_by UUID REFERENCES auth.users`

Si absents : migration supplémentaire requise.

---

## Checklist avant PR

- [ ] Accord Romeo sur migration trigger (FEU ROUGE levé)
- [ ] Colonnes `closed_at` / `closed_by` vérifiées ou migrées
- [ ] Trigger `trg_so_closed_forecasted_rollback` créé et testé en staging
- [ ] Code TS restauré depuis git history
- [ ] `isOrderLocked` inclut déjà `'closed'` (fait dans BO-SHIP-FEAT-001)
- [ ] `buildUpdateFields` dans `sales-orders.ts` gère `newStatus === 'closed'`
- [ ] Type-check + lint PASS
- [ ] Test manuel : clôturer une commande partially_shipped, vérifier stock_forecasted_out du produit

---

## Contraintes

- JAMAIS modifier `rollback_so_forecasted` ou `update_stock_on_shipment` existants
- Le nouveau trigger est ADDITIONNEL, pas un remplacement
- Après migration : `python3 scripts/generate-docs.py --db` obligatoire
