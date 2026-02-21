# Système de Prix Moyen Pondéré (PMP)

**Version** : 2026-02-21
**Statut** : DOCUMENTATION CANONIQUE

---

## Qu'est-ce que le PMP ?

Le **Prix Moyen Pondéré** (PMP) est la méthode comptable standard pour évaluer les stocks en France.
Chaque fois qu'une commande fournisseur est réceptionnée, le prix d'achat moyen est recalculé :

```
PMP = SUM(prix_unitaire × quantité) / SUM(quantité)
```

**Pourquoi c'est important** :

- Calcul de marge commerciale réel (pas le dernier prix d'achat)
- Évaluation des stocks selon les normes comptables françaises
- Indicateur de performance achats (min/max/last permet de détecter les dérives tarifaires)

---

## Colonnes dans `products`

| Colonne            | Type          | Description                                             |
| ------------------ | ------------- | ------------------------------------------------------- |
| `cost_price`       | NUMERIC(10,2) | Alias de `cost_price_avg` (maintenu pour compatibilité) |
| `cost_price_avg`   | NUMERIC(10,2) | **PMP** : Prix moyen pondéré par les quantités          |
| `cost_price_min`   | NUMERIC(10,2) | Prix minimum historique (toutes réceptions confondues)  |
| `cost_price_max`   | NUMERIC(10,2) | Prix maximum historique                                 |
| `cost_price_last`  | NUMERIC(10,2) | Dernier prix chronologique (LPP — Last Purchase Price)  |
| `cost_price_count` | INTEGER       | Nombre total de réceptions pour ce produit              |
| `cost_net_avg`     | NUMERIC(10,2) | PMP avec frais alloués (port + douane + assurance)      |
| `cost_net_min`     | NUMERIC(10,2) | Prix NET minimum historique                             |
| `cost_net_max`     | NUMERIC(10,2) | Prix NET maximum historique                             |
| `cost_net_last`    | NUMERIC(10,2) | Dernier prix NET chronologique                          |

**Règle** : `cost_price_count = 0` signifie qu'aucune réception n'a encore été enregistrée (prix saisi manuellement uniquement).

---

## Table `product_purchase_history` (Source de Vérité)

Cette table est la **source de vérité** pour tous les calculs PMP.
Chaque ligne représente une ligne de commande fournisseur reçue.

```sql
product_purchase_history (
  id                     UUID PRIMARY KEY,
  product_id             UUID REFERENCES products(id),
  purchase_order_id      UUID REFERENCES purchase_orders(id),
  purchase_order_item_id UUID REFERENCES purchase_order_items(id) UNIQUE,
  unit_price_ht          NUMERIC(10,2) NOT NULL,  -- Prix HT de la réception
  unit_cost_net          NUMERIC(10,2),             -- Prix NET (HT + frais alloués)
  quantity               INTEGER NOT NULL,
  purchased_at           TIMESTAMPTZ NOT NULL        -- Date de réception
)
```

**Contrainte UNIQUE** : `(product_id, purchase_order_item_id)` — garantit l'idempotence des upserts.

**Indexes** :

- `idx_pph_product` — Requêtes par produit (calcul PMP)
- `idx_pph_product_purchased_desc` — Tri chronologique DESC (LPP)

---

## Les 2 Triggers : Rôles Complémentaires

### Trigger 1 : `trigger_update_cost_price_pmp` (sur `purchase_order_items`)

| Attribut  | Valeur                                                                       |
| --------- | ---------------------------------------------------------------------------- |
| Table     | `purchase_order_items`                                                       |
| Événement | AFTER INSERT OR UPDATE                                                       |
| Condition | `pg_trigger_depth() = 0 AND product_id IS NOT NULL`                          |
| Rôle      | Met à jour le PMP quand un item est modifié ET que la PO est déjà `received` |

**Cas d'usage** : Correction manuelle d'un prix sur une PO déjà reçue.

### Trigger 2 : `trg_update_pmp_on_po_received` (sur `purchase_orders`) ← _Ajouté 2026-02-21_

| Attribut       | Valeur                                                                     |
| -------------- | -------------------------------------------------------------------------- |
| Table          | `purchase_orders`                                                          |
| Événement      | AFTER UPDATE                                                               |
| Condition WHEN | `OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'received'`       |
| Rôle           | Met à jour le PMP de TOUS les items quand la PO passe au statut `received` |

**Cas d'usage** : Réception normale depuis l'UI (le cas standard).

---

## Le Bug de Séquencement (Pourquoi 2 Triggers sont Nécessaires)

### Ordre d'exécution lors d'une réception UI

Quand l'utilisateur clique "Réceptionner" dans l'interface :

| Étape | Action                                                                                                                             | Statut PO                 |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1     | API : `UPDATE purchase_order_items SET quantity_received = N`                                                                      | `validated`               |
| 2     | `trigger_allocate_po_fees` (BEFORE) → calcule `unit_cost_net`                                                                      | `validated`               |
| 3     | **`trigger_update_cost_price_pmp` (AFTER) → vérifie `status = 'received'`**                                                        | **`validated` ❌ → SKIP** |
| 4     | `trigger_handle_po_item_quantity_change_confirmed` (AFTER) → si tous items reçus, `UPDATE purchase_orders SET status = 'received'` | devient `received`        |
| 5     | PO status = `received` ✅ — **mais le PMP n'a pas été calculé**                                                                    | `received`                |
| 6     | **`trg_update_pmp_on_po_received` (AFTER) → se déclenche**                                                                         | `received` ✅             |

**Conclusion** : Le Trigger 1 (sur les items) ne peut pas voir `received` au moment où il s'exécute,
car le statut est mis à jour dans une étape ultérieure. Le Trigger 2 (sur les POs) résout ce problème
en se déclenchant exactement au moment de la transition de statut.

---

## Comment Vérifier que le Système Fonctionne

### Après une réception

```sql
-- 1. Vérifier les prix calculés
SELECT sku, cost_price_avg, cost_price_count
FROM products p
INNER JOIN purchase_order_items poi ON poi.product_id = p.id
WHERE poi.purchase_order_id = '<PO_ID>'
  AND poi.product_id IS NOT NULL
ORDER BY sku;
-- Attendu : cost_price_avg rempli, cost_price_count >= 1

-- 2. Vérifier l'historique
SELECT COUNT(*)
FROM product_purchase_history
WHERE purchase_order_id = '<PO_ID>';
-- Attendu : autant de lignes que d'items avec product_id

-- 3. Vérifier le trigger
SELECT trigger_name, action_timing, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trg_update_pmp_on_po_received';
-- Attendu : 1 ligne (AFTER UPDATE sur purchase_orders)
```

### RPC disponible pour l'UI

```typescript
// Récupère tous les détails PMP + historique pour un produit
const { data } = await supabase.rpc('get_product_cost_price_details', {
  p_product_id: productId,
});
```

---

## Procédure de Backfill (Si les Prix sont Incorrects)

Si une PO reçue a des produits avec `cost_price_avg = NULL` (bug de timing, migration manquante, etc.) :

```sql
-- Appel direct de la fonction de mise à jour PMP
SELECT update_product_pmp_on_po_received('<PO_ID>');
```

La fonction est **idempotente** : elle peut être appelée plusieurs fois sans effets de bord.

### Backfill de toutes les POs reçues

```sql
-- Utile après une migration majeure
DO $$
DECLARE
  v_po RECORD;
BEGIN
  FOR v_po IN
    SELECT id FROM purchase_orders WHERE status = 'received' ORDER BY created_at
  LOOP
    PERFORM update_product_pmp_on_po_received(v_po.id);
    RAISE NOTICE 'PMP updated for PO %', v_po.id;
  END LOOP;
END;
$$;
```

---

## Historique des Migrations

| Date           | Migration                                             | Changement                                                                      |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| 2026-02-08     | `20260208_001_add_cost_price_stats_columns`           | Ajout colonnes PMP sur `products`                                               |
| 2026-02-08     | `20260208_002_create_product_purchase_history`        | Création table historique                                                       |
| 2026-02-08     | `20260208_004_create_pmp_trigger`                     | Trigger initial (sur `purchase_order_items`)                                    |
| 2026-02-08     | `20260208_005_backfill_purchase_history`              | Backfill historique initial                                                     |
| 2026-02-08     | `20260208_007_create_rpc_product_cost_details`        | RPC UI analytics                                                                |
| 2026-02-18     | `20260218180000_backfill_stock_costs_and_fix_trigger` | Fix trigger + backfill                                                          |
| 2026-02-18     | `20260218200000_add_cost_net_columns`                 | Ajout colonnes NET (frais alloués)                                              |
| **2026-02-21** | **`20260221120000_fix_pmp_trigger_on_reception`**     | **Fix bug séquencement : trigger sur `purchase_orders` + backfill 21 produits** |
