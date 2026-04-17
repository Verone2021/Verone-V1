# Diagnostic — Bug expédition SO-2026-00124 (17 avril 2026)

## TL;DR — Root cause identifiée

**La fonction `update_stock_on_shipment()` est définie SANS `SECURITY DEFINER` et s'exécute avec les permissions de l'utilisateur appelant (staff back-office). Elle tente un `UPDATE sales_order_items SET quantity_shipped = ...` mais la table n'a AUCUNE policy RLS UPDATE pour les staff.**

Résultat : l'UPDATE se fait silencieusement sur **0 lignes** (comportement PostgreSQL normal quand aucune policy ne matche). Aucune erreur remontée. Les `stock_movements` et `products.stock_real` sont bien mis à jour (tables avec policies staff OK), mais `sales_order_items.quantity_shipped` reste à 0 et `sales_orders.status` reste `validated`.

---

## 1. Code actuel de `update_stock_on_shipment()` (DB live)

Source : `mcp__supabase__execute_sql` sur `pg_get_functiondef('update_stock_on_shipment'::regproc)`.

```plpgsql
CREATE OR REPLACE FUNCTION public.update_stock_on_shipment()
RETURNS trigger LANGUAGE plpgsql    -- ⚠️ PAS de SECURITY DEFINER
AS $function$
DECLARE
    v_order_number TEXT;
    v_total_quantity INTEGER;
    v_total_shipped INTEGER;
    v_stock_before INTEGER;
    v_stock_after INTEGER;
BEGIN
    -- Skip si Packlink a_payer (normal)
    IF NEW.packlink_status = 'a_payer' THEN ... RETURN NEW; END IF;

    -- ✅ Étape 1 : UPDATE products (policies staff OK → MARCHE)
    SELECT stock_real INTO v_stock_before FROM products WHERE id = NEW.product_id;
    UPDATE products SET
        stock_real = stock_real - NEW.quantity_shipped,
        stock_forecasted_out = stock_forecasted_out - NEW.quantity_shipped
    WHERE id = NEW.product_id RETURNING stock_real INTO v_stock_after;

    -- ✅ Étape 2 : INSERT stock_movements (policies staff OK → MARCHE)
    INSERT INTO stock_movements (...) VALUES (...);

    -- ❌ Étape 3 : UPDATE sales_order_items — POLICY UPDATE STAFF MANQUANTE
    --   → 0 rows affected, pas d'erreur
    UPDATE sales_order_items
    SET quantity_shipped = quantity_shipped + NEW.quantity_shipped
    WHERE sales_order_id = NEW.sales_order_id AND product_id = NEW.product_id;

    -- ❌ Étape 4 : v_total_shipped = 0 (car SUM des quantity_shipped non modifiés)
    --   → status reste 'validated'
    SELECT SUM(quantity), SUM(quantity_shipped)
    INTO v_total_quantity, v_total_shipped
    FROM sales_order_items WHERE sales_order_id = NEW.sales_order_id;

    IF v_total_shipped >= v_total_quantity THEN ... -- jamais vrai
    ELSIF v_total_shipped > 0 THEN ... -- jamais vrai

    RETURN NEW;
END;
$function$
```

**Diagnostic fonction** :

- ✅ Fait les `UPDATE sales_order_items` et `UPDATE sales_orders` (code correct)
- ✅ Pas de `EXCEPTION WHEN OTHERS` silencieux
- ❌ **Pas de `SECURITY DEFINER`** → hérite des permissions du caller

## 2. Policies RLS sur `sales_order_items`

```
polname                                cmd       Pour qui
─────────────────────────────────────────────────────────────────────────
Public can create sales_order_items    INSERT    public (anon)
affiliates_select_own_order_items      SELECT    Affilié LinkMe only
linkme_users_update_own_order_items    UPDATE    Affilié LinkMe only + status='draft'
linkme_users_delete_own_order_items    DELETE    Affilié LinkMe only + status='draft'
staff_select_sales_order_items         SELECT    Staff back-office
staff_delete_sales_order_items         DELETE    Staff back-office
```

**⚠️ Il n'existe AUCUNE policy UPDATE pour staff back-office.**

Quand un staff fait l'INSERT dans `sales_order_shipments` :

- Le trigger `update_stock_on_shipment` tourne en SECURITY INVOKER (mode staff)
- Son `UPDATE sales_order_items` est filtré : aucune policy ne matche → 0 rows affected, silencieux
- Pareil pour `UPDATE sales_orders SET status = 'shipped'` (à vérifier, probablement même cause)

## 3. Triggers actifs sur `sales_order_shipments`

Tous `tgenabled = 'O'` (enabled) :

| Trigger                           | Action       | Fonction                            |
| --------------------------------- | ------------ | ----------------------------------- |
| `trigger_shipment_update_stock`   | AFTER INSERT | `update_stock_on_shipment()`        |
| `trigger_packlink_confirm_stock`  | AFTER UPDATE | `confirm_packlink_shipment_stock()` |
| `trigger_notify_shipment_created` | AFTER INSERT | `notify_shipment_created()`         |

**⚠️ Le trigger `trigger_before_delete_shipment` (migration `20251124_002_trigger_delete_shipment_reverse_stock.sql`) N'EXISTE PLUS en DB.** Il devait restaurer le stock sur DELETE d'une expédition. Sa disparition non documentée rend le cleanup plus risqué.

## 4. Historique git — Commits critiques

### Timeline triggers shipment

| Date             | Commit                                                                | Action                                                                                                                     |
| ---------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 2025-11-24       | `deb4508f3 feat(shipments): Système expéditions SO complet`           | Création initiale du système                                                                                               |
| 2025-11-24       | Migration `20251124_002_trigger_delete_shipment_reverse_stock.sql`    | Crée `handle_shipment_deletion` + `trigger_before_delete_shipment`                                                         |
| 2025-11-27       | Migration `20251127_004_fix_rls_sales_order_items_insert.sql`         | Fix RLS **INSERT** (mais pas UPDATE)                                                                                       |
| 2025-11-28       | `f730a6ced fix(triggers): Suppression trigger doublon expéditions SO` | Supprime `sales_order_shipment_trigger` + `handle_sales_order_shipment()` pour éviter doublon                              |
| 2026-02-23       | Migration `20260223170045_backfill_shipments_legacy_orders.sql`       | Backfill LINK-23/24 + F-25-%                                                                                               |
| 2026-03-23       | Migration `20260323100000_packlink_deferred_stock.sql`                | **Redéfinit `update_stock_on_shipment()` (version actuelle)** + crée `confirm_packlink_shipment_stock()`                   |
| 2026-04-07 13:01 | (non versionné)                                                       | **Backfill manuel** `sales_order_items.quantity_shipped` pour les SOs existantes (toutes updated_at = 2026-04-07 13:01:46) |
| 2026-04-16 23:36 | SO-2026-00124                                                         | Expédition manuelle → trigger tourne partiellement → bug observé                                                           |

### Commit de 2026-03-23 — cause probable introduite

La migration `20260323100000_packlink_deferred_stock.sql` a **recréé** `update_stock_on_shipment()` sans `SECURITY DEFINER`. La version précédente (celle qui marchait selon Romeo en novembre/décembre 2025) **avait peut-être le flag SECURITY DEFINER** — impossible de vérifier (pas de backup). Avant le 23 mars, la fonction provenait de `deb4508f3` — il faudrait retrouver la définition originale de ce commit.

Note : depuis ce commit du 23 mars, **aucune SO n'a pu mettre à jour `quantity_shipped` via le trigger**. Les SOs `shipped` actuelles avec `quantity_shipped` correct ont toutes `updated_at = 2026-04-07 13:01:46` → **backfill manuel unique** qui a camouflé le bug.

## 5. Vérification ajustement "Rond paille S" par Romeo

```
23:31:50 — ADJUST +1 (0 → 1) — reason: found_inventory [Trouvaille inventaire]
23:36:34 — OUT  -1 (1 → 0) — reason: sale (SO-2026-00124)
```

**✅ L'ajustement a BIEN été sauvegardé en DB.** Le produit Rond paille S a été incrémenté à 1, puis décrémenté à 0 par le shipment. Le modal de confirmation n'était PAS un faux positif.

État actuel :

- `products.stock_real = 0` (cohérent : 1 - 1 = 0)
- `stock_movements` : 2 lignes bien enregistrées

## 6. Conséquences du bug sur SO-2026-00124

| Table                                | État attendu | État réel      | Delta     |
| ------------------------------------ | ------------ | -------------- | --------- |
| `sales_order_shipments`              | 12 lignes    | ✅ 12 lignes   | OK        |
| `stock_movements` (OUT)              | 12 lignes    | ✅ 12 lignes   | OK        |
| `products.stock_real`                | -59 au total | ✅ -59         | OK        |
| `sales_order_items.quantity_shipped` | 59           | ❌ 0           | **CASSÉ** |
| `sales_orders.status`                | `shipped`    | ❌ `validated` | **CASSÉ** |

**Impact utilisateur** : l'UI voit la commande comme "à expédier" alors que le stock a été sorti. Double expédition possible si Romeo re-clique.

## 7. Plan de fix proposé (NON EXÉCUTÉ)

### Phase 1 — Cleanup SO-2026-00124 (urgent)

**Objectif** : remettre SO-2026-00124 dans l'état pré-expédition sans double décrémentation.

Comme `trigger_before_delete_shipment` n'existe plus en DB, on doit tout faire manuellement dans une transaction :

```sql
BEGIN;

-- 1. Identifier les 12 shipments
WITH shipments_to_delete AS (
  SELECT id, product_id, quantity_shipped
  FROM sales_order_shipments
  WHERE sales_order_id = (SELECT id FROM sales_orders WHERE order_number='SO-2026-00124')
)

-- 2. Restaurer stock_real par produit (+= quantity_shipped)
UPDATE products p SET
  stock_real = stock_real + s.quantity_shipped,
  updated_at = NOW()
FROM shipments_to_delete s
WHERE p.id = s.product_id;

-- 3. DELETE stock_movements associés
DELETE FROM stock_movements
WHERE reference_type = 'shipment'
  AND reference_id IN (SELECT id FROM shipments_to_delete);

-- 4. DELETE les 12 shipments
DELETE FROM sales_order_shipments
WHERE sales_order_id = (SELECT id FROM sales_orders WHERE order_number='SO-2026-00124');

-- 5. Vérifier stock + état
SELECT p.name, p.stock_real FROM products p WHERE id IN (...);
SELECT status, total_ht FROM sales_orders WHERE order_number='SO-2026-00124';

-- ROLLBACK ou COMMIT après vérif manuelle
COMMIT;
```

**Avant cleanup** : `sales_order_items.quantity_shipped` est déjà à 0 (à cause du bug) → **pas besoin de le toucher**, c'est déjà la valeur attendue avant expédition.

### Phase 2 — Fix root cause (après Phase 1)

**Option A (recommandée) — Ajouter SECURITY DEFINER** à `update_stock_on_shipment()`

```sql
CREATE OR REPLACE FUNCTION public.update_stock_on_shipment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER                      -- ← ajouter
SET search_path = public              -- ← obligatoire avec SECURITY DEFINER
AS $function$ ... $function$;
```

Appliquer aussi à `confirm_packlink_shipment_stock()` (même structure, même bug).

**Avantages** : le trigger bypasse RLS, fonctionne pour tous les users (staff + futur LinkMe).
**Risque** : aucun, on ne change pas la logique métier.

**Option B — Ajouter une policy UPDATE staff** sur `sales_order_items` (moins propre)

```sql
CREATE POLICY "staff_update_sales_order_items" ON sales_order_items
  FOR UPDATE TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());
```

**Risque** : ouvre UPDATE staff sur toute la table (autres flows impactés).

### Phase 3 — Backfill des SOs cassées depuis le 23 mars

Les SOs expédiées entre 2026-03-23 (migration cassante) et 2026-04-07 (backfill manuel) sont peut-être déjà correctes (backfill du 7 avril). Celles expédiées **après le 7 avril** sont à vérifier :

```sql
-- Trouver toutes les SOs avec shipments mais quantity_shipped incohérent
SELECT so.order_number, so.status,
  (SELECT SUM(quantity_shipped) FROM sales_order_shipments WHERE sales_order_id=so.id) as actual_shipped,
  (SELECT SUM(quantity_shipped) FROM sales_order_items WHERE sales_order_id=so.id) as recorded_shipped
FROM sales_orders so
WHERE EXISTS (SELECT 1 FROM sales_order_shipments WHERE sales_order_id = so.id)
  AND (SELECT SUM(quantity_shipped) FROM sales_order_shipments WHERE sales_order_id=so.id) !=
      (SELECT SUM(quantity_shipped) FROM sales_order_items WHERE sales_order_id=so.id)
ORDER BY so.order_number;
```

Si résultats > 0 : backfill à refaire pour ces SOs.

### Phase 4 — Restaurer le trigger DELETE manquant

Re-appliquer la migration `20251124_002_trigger_delete_shipment_reverse_stock.sql` (qui a disparu de la DB). Utile pour tous les futurs cleanups.

## 8. Questions à Romeo avant action

1. **Phase 1 (cleanup SO-00124)** : OK pour exécuter le DELETE manuel via SQL ? Je propose d'abord un `BEGIN; ... ROLLBACK;` pour tester le résultat avant commit.
2. **Phase 2** : Option A (SECURITY DEFINER) ou Option B (policy UPDATE staff) ?
3. **Phase 3** : Lancer la requête de détection d'incohérences sur toutes les SOs ?
4. **Phase 4** : Recréer le trigger DELETE manquant ?

**Aucune écriture DB effectuée à ce stade.** J'attends ta validation point par point avant toute action.

## 9. Tests manuels à écrire (après fix)

- Test E2E : expédier SO draft → validated → shipped, vérifier `quantity_shipped` + `status`
- Test E2E : expédition partielle → status `partially_shipped`
- Test unitaire SQL : INSERT shipment role staff → trigger tourne, quantity_shipped mis à jour
- Test E2E : DELETE shipment → stock restauré
