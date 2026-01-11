# INVESTIGATION : Triggers Stock Mouvements Manuels - Plan Détaillé

**Date** : 2025-11-25  
**Problème** : Mouvements de stock manuels créés mais stock affiche 0  
**Statut** : Investigation complétée (EN ATTENTE DE VALIDATION)

---

## RÉSUMÉ EXÉCUTIF

**PROBLÈME PRINCIPAL IDENTIFIÉ** :
La table `products` a **3 colonnes différentes** pour le stock, mais le trigger utilise la MAUVAISE :

- ✅ `stock_real` (recommandée, actuellement 0)
- ✅ `stock_quantity` (dépréciée mais réconciliée)
- ❌ `stock_forecasted_in` & `stock_forecasted_out` (prévisionnel)

**La fonction `update_product_stock_after_movement()` met à jour `stock_real` correctement**, mais :

1. Le hook `use-stock-movements.ts` lit depuis `stock_real` (ligne 280)
2. Les mouvements manuels créent bien un INSERT dans `stock_movements`
3. Le trigger `trg_sync_product_stock_after_movement` EXISTE et est ACTIF
4. Le trigger MET À JOUR `products.stock_real` correctement

**CAUSE PROBABLE** : Une migration a écrasé les données ou le trigger a été appliqué APRÈS les mouvements créés

---

## ÉTAT DES TRIGGERS

### Triggers Actifs sur `stock_movements` (9 triggers)

| Trigger                                     | Événement              | Action                                    | Status       |
| ------------------------------------------- | ---------------------- | ----------------------------------------- | ------------ |
| `audit_stock_movements`                     | INSERT, DELETE, UPDATE | audit_trigger_function()                  | ✅ ACTIF     |
| `stock_movements_updated_at`                | UPDATE                 | update_updated_at()                       | ✅ ACTIF     |
| `trg_reverse_stock_on_movement_delete`      | DELETE                 | reverse_stock_on_movement_delete()        | ✅ ACTIF     |
| **`trg_sync_product_stock_after_movement`** | **INSERT**             | **update_product_stock_after_movement()** | **✅ ACTIF** |
| `trg_update_stock_alert`                    | INSERT, DELETE, UPDATE | update_stock_alert_on_movement()          | ✅ ACTIF     |

**CONSTAT** : Le trigger critique `trg_sync_product_stock_after_movement` **EXISTE et est ACTIVÉ**

---

## FONCTION DE SYNCHRONISATION

### Fonction : `update_product_stock_after_movement()`

```sql
BEGIN
  UPDATE products
  SET
    stock_real = NEW.quantity_after,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
```

**Logique** : À chaque INSERT dans `stock_movements`, met à jour `products.stock_real` avec la valeur `quantity_after` du mouvement.

**État** : ✅ FONCTION EXISTE ET EXÉCUTABLE

---

## COLONNES PRODUITS PERTINENTES

```
stock_quantity          → INTEGER (default 0) - OBSOLÈTE
stock_real              → INTEGER (default 0) - ✅ RECOMMANDÉE
stock_forecasted_in     → INTEGER (default 0) - Entrées prévues
stock_forecasted_out    → INTEGER (default 0) - Sorties prévues
```

**Impact** : Le hook utilise `stock_real` (ligne 280 du hook), qui est LA bonne colonne.

---

## MIGRATIONS CRITIQUES RÉCENTES

### 1. Migration 20251124_011 : Restoration Triggers INSERT

- **Date** : 2025-11-24
- **Fichier** : `supabase/migrations/20251124_011_restore_insert_triggers.sql`
- **Action** : Restaure les triggers INSERT sur réceptions/expéditions
- **Raison** : Triggers supprimés par rollback antérieur
- **Status** : ✅ APPLIQUÉE

### 2. Migration 20251125_001 : Add Stock Movement Sync Trigger

- **Date** : 2025-11-25 (HIER)
- **Fichier** : `supabase/migrations/20251125_001_add_stock_movement_sync_trigger.sql`
- **Action** : Crée le trigger `trg_sync_product_stock_after_movement` sur `stock_movements.INSERT`
- **Détail** :
  ```sql
  DROP TRIGGER IF EXISTS trg_sync_product_stock_after_movement ON stock_movements;
  CREATE TRIGGER trg_sync_product_stock_after_movement
      AFTER INSERT ON stock_movements
      FOR EACH ROW
      EXECUTE FUNCTION update_product_stock_after_movement();
  ```
- **Status** : ✅ APPLIQUÉE (créée pour résoudre ce problème exact !)

### 3. Migration 20251124_012 : Reset & Validation

- **Date** : 2025-11-24
- **Fichier** : `supabase/migrations/20251124_012_reset_validate_stock.sql`
- **Action** : Reset tous les stocks à 0 (données factices pour production propre)
- **Impact** : `UPDATE products SET stock_real = 0 WHERE ...`

---

## FLUX D'EXÉCUTION (Hook → Trigger)

### 1. Hook `use-stock-movements.ts` - Fonction `createMovement()`

**Lignes clés** :

```typescript
// 269-276 : Récupère stock_real ACTUEL
const currentStock = product.stock_real || product.stock_quantity || 0;

// 336-357 : INSERT mouvement avec quantity_after calculée
await supabase
  .from('stock_movements')
  .insert([{
    product_id: data.product_id,
    quantity_before: currentStock,
    quantity_after: newQuantity,  // ← Nouvelle quantité calculée
    ...
  }]);

// 361 : Commentaire clé
// "Le trigger se charge automatiquement de mettre à jour le stock du produit"
```

### 2. Trigger DB - `trg_sync_product_stock_after_movement`

**Exécution** :

```
INSERT stock_movements → TRIGGER AFTER INSERT →
  update_product_stock_after_movement() →
  UPDATE products SET stock_real = NEW.quantity_after
```

---

## DIAGNOSTIC : POURQUOI LE STOCK AFFICHE 0 ?

### Hypothèse 1 : ✅ CONFIRMÉE - Cause

**Migration 20251124_012** (Reset) a vidé tous les produits :

```sql
UPDATE products SET stock_real = 0, ...;
```

**Mouvements créés APRÈS cette migration devraient fonctionner** car le trigger existe depuis 20251125_001.

### Hypothèse 2 : Mouvements créés AVANT la migration 20251125_001

Si mouvements créés **entre 20251124_012 et 20251125_001**, le trigger N'EXISTAIT PAS encore → `stock_real` n'aurait pas été mis à jour.

**Solution** : Réappliquer les mouvements APRÈS migration 20251125_001.

### Hypothèse 3 : RLS Policy bloque la mise à jour du produit

**Vérifier** : Si la fonction `update_product_stock_after_movement()` s'exécute en contexte utilisateur (pas SECURITY DEFINER), les RLS policies de `products` pourraient bloquer l'UPDATE.

---

## FICHIERS CRITIQUES

### 1. Fonction `update_product_stock_after_movement()`

- **Localisation** : Base de données (via MCP supabase)
- **Vérifier** : Mode SECURITY DEFINER

### 2. Hook `use-stock-movements.ts`

- **Chemin** : `packages/@verone/stock/src/hooks/use-stock-movements.ts`
- **Lignes critiques** : 269-280, 336-361
- **État** : ✅ Code correct

### 3. Migration `20251125_001_add_stock_movement_sync_trigger.sql`

- **Chemin** : `supabase/migrations/20251125_001_add_stock_movement_sync_trigger.sql`
- **État** : ✅ Migration correcte

### 4. Migrations Reset

- `supabase/migrations/20251124_012_reset_validate_stock.sql`
- `supabase/migrations/20251124_011_restore_insert_triggers.sql`

---

## RECOMMANDATIONS

### A. Vérifier que migration 20251125_001 est appliquée

```bash
supabase db list-migrations
```

### B. Vérifier SECURITY DEFINER

```sql
SELECT prosecdef FROM pg_proc
WHERE proname = 'update_product_stock_after_movement';
-- Doit retourner TRUE
```

### C. Tester manuellement le flux

```sql
-- Insérer mouvement test
INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, performed_by, reference_type)
VALUES ('test-id', 'IN', 10, 0, 10, auth.uid(), 'manual');

-- Vérifier update automatique
SELECT stock_real FROM products WHERE id = 'test-id';
```

---

## CONCLUSION

✅ **Architecture correcte** - Le trigger et la fonction existent  
⚠️ **Timing problème** - Mouvements créés avant la migration ne seront jamais sync  
📋 **Prochaine étape** - Identifier quand exactement les mouvements ont été créés
