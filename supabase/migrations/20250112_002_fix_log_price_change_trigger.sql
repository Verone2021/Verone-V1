-- 🐛 FIX: Trigger log_price_change bloque suppression produits
-- Problème: Le trigger essaie de log dans price_list_history APRÈS cascade delete
-- Solution: Skip logging si produit n'existe plus (suppression cascade)

CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: Log création prix
  IF TG_OP = 'INSERT' THEN
    INSERT INTO price_list_history (
      price_list_item_id, price_list_id, product_id,
      price_ht_after, change_type, min_quantity, max_quantity,
      changed_by, source
    ) VALUES (
      NEW.id, NEW.price_list_id, NEW.product_id,
      NEW.price_ht, 'create', NEW.min_quantity, NEW.max_quantity,
      NEW.created_by, 'admin_ui'
    );
    RETURN NEW;

  -- UPDATE: Log modification prix
  ELSIF TG_OP = 'UPDATE' AND OLD.price_ht != NEW.price_ht THEN
    INSERT INTO price_list_history (
      price_list_item_id, price_list_id, product_id,
      price_ht_before, price_ht_after, change_type,
      min_quantity, max_quantity, changed_by, source
    ) VALUES (
      NEW.id, NEW.price_list_id, NEW.product_id,
      OLD.price_ht, NEW.price_ht, 'update',
      NEW.min_quantity, NEW.max_quantity, NEW.updated_by, 'admin_ui'
    );
    RETURN NEW;

  -- DELETE: Log suppression prix (si pas cascade depuis product)
  ELSIF TG_OP = 'DELETE' THEN
    -- Skip logging si produit supprimé (cascade delete)
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = OLD.product_id) THEN
      RETURN OLD; -- Produit supprimé → skip history
    END IF;

    -- Log suppression manuelle du prix
    INSERT INTO price_list_history (
      price_list_item_id, price_list_id, product_id,
      price_ht_before, price_ht_after, change_type,
      min_quantity, max_quantity, source
    ) VALUES (
      OLD.id, OLD.price_list_id, OLD.product_id,
      OLD.price_ht, 0, 'delete',
      OLD.min_quantity, OLD.max_quantity, 'admin_ui'
    );
    RETURN OLD; -- FIX: Était RETURN NEW (erreur)
  END IF;

  -- Fallback
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Commentaire: Fix appliqué pour permettre suppression products sans erreur trigger
