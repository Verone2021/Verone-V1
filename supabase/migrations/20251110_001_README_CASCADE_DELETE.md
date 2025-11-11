# 📋 Guide d'Application - Migration CASCADE DELETE Notifications

**Fichier** : `20251110_001_notifications_cascade_delete_system.sql`
**Date** : 2025-11-10
**Auteur** : Claude Code
**Statut** : ⏳ Prêt à appliquer

---

## 🎯 Objectif

Supprimer automatiquement les notifications orphelines quand l'entité liée (commande, produit, etc.) est supprimée.

---

## ⚠️ Problème de Synchronisation Détecté

```
Remote migration versions not found in local migrations directory.
```

Il y a des migrations dans Supabase remote qui ne sont pas présentes localement.

---

## 🔧 Solution: Application Manuelle (RECOMMANDÉE)

### Option 1: Via Supabase Dashboard (Plus Sûr)

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet Vérone

2. **Ouvrir SQL Editor**
   - Menu → SQL Editor
   - New Query

3. **Copier/Coller la Migration**
   - Ouvrir `20251110_001_notifications_cascade_delete_system.sql`
   - Copier tout le contenu
   - Coller dans SQL Editor
   - **Run** ▶️

4. **Vérifier Résultat**

   ```sql
   -- Vérifier colonnes ajoutées
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'notifications'
     AND column_name LIKE 'related_%';

   -- Résultat attendu:
   -- related_product_id       | uuid
   -- related_sales_order_id   | uuid
   -- related_purchase_order_id| uuid
   ```

---

### Option 2: Via psql (Pour Experts)

```bash
# 1. Se connecter à Supabase
PGPASSWORD="VOTRE_PASSWORD" psql \
  -h aws-1-eu-west-3.pooler.supabase.com \
  -p 5432 \
  -d postgres \
  -U postgres.aorroydfjsrygmosnzrl

# 2. Exécuter migration
\i supabase/migrations/20251110_001_notifications_cascade_delete_system.sql

# 3. Vérifier
SELECT COUNT(*) FROM notifications;
```

---

## ✅ Tests de Validation

### Test 1: CASCADE DELETE sur Produit

```sql
-- 1. Créer notification test liée à un produit
DO $$
DECLARE
  v_test_product_id UUID;
  v_user_id UUID;
BEGIN
  -- Récupérer premier produit
  SELECT id INTO v_test_product_id FROM products LIMIT 1;

  -- Récupérer premier user
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- Créer notification test
  INSERT INTO notifications (
    type, severity, title, message, user_id, related_product_id
  ) VALUES (
    'business', 'urgent', 'Test CASCADE DELETE',
    'Cette notification devrait être supprimée avec le produit',
    v_user_id, v_test_product_id
  );

  RAISE NOTICE 'Notification test créée pour produit %', v_test_product_id;
END $$;

-- 2. Vérifier notification créée
SELECT id, title, related_product_id
FROM notifications
WHERE title = 'Test CASCADE DELETE';

-- 3. Supprimer produit (TEST UNIQUEMENT - NE PAS EXÉCUTER EN PRODUCTION)
-- DELETE FROM products WHERE id = '<ID_DU_PRODUIT_TEST>';

-- 4. Vérifier notification supprimée automatiquement
-- SELECT COUNT(*) FROM notifications WHERE title = 'Test CASCADE DELETE';
-- Résultat attendu: 0
```

### Test 2: Fonction create_notification_for_owners

```sql
-- Tester avec FK produit
SELECT create_notification_for_owners(
  'business',
  'info',
  'Test Fonction Helper',
  'Test avec FK produit',
  '/stocks/inventaire',
  'Voir',
  (SELECT id FROM products LIMIT 1), -- p_related_product_id
  NULL,                               -- p_related_sales_order_id
  NULL                                -- p_related_purchase_order_id
);

-- Vérifier notifications créées
SELECT COUNT(*)
FROM notifications
WHERE title = 'Test Fonction Helper'
  AND related_product_id IS NOT NULL;
```

### Test 3: Fonction cleanup_old_notifications

```sql
-- Exécuter nettoyage
SELECT cleanup_old_notifications();

-- Résultat attendu dans les NOTICE logs:
-- [CLEANUP] Notifications lues >30j: X supprimées
-- [CLEANUP] Orphelines legacy >7j: Y supprimées
-- [STATS] Total notifications: Z (dont W avec FK)
```

---

## 📊 Statistiques Post-Migration

Après application, vérifier la répartition des notifications:

```sql
SELECT
  COUNT(*) FILTER (WHERE related_product_id IS NOT NULL) as notifications_produits,
  COUNT(*) FILTER (WHERE related_sales_order_id IS NOT NULL) as notifications_commandes_clients,
  COUNT(*) FILTER (WHERE related_purchase_order_id IS NOT NULL) as notifications_commandes_fournisseurs,
  COUNT(*) FILTER (
    WHERE related_product_id IS NULL
      AND related_sales_order_id IS NULL
      AND related_purchase_order_id IS NULL
  ) as notifications_legacy_sans_fk,
  COUNT(*) as total_notifications
FROM notifications;
```

**Résultat attendu initial** :

- `notifications_produits`: 0 (nouvelles notifications pas encore créées)
- `notifications_commandes_clients`: 0
- `notifications_commandes_fournisseurs`: 0
- `notifications_legacy_sans_fk`: ~21 (notifications existantes avant migration)
- `total_notifications`: ~21

---

## 🔄 Prochaines Étapes (Après Migration)

### 1. Mettre à Jour Triggers (Progressive)

Les triggers existants doivent être mis à jour pour passer les FK aux fonctions de création de notifications.

**Ordre prioritaire** :

1. ✅ `notify_stock_alert()` - Notifications stock critique
2. ✅ `notify_stock_replenished()` - Notifications réapprovisionnement
3. ✅ `notify_order_confirmed()` - Notifications commandes confirmées
4. Autres triggers (15 au total)

**Exemple de mise à jour** :

```sql
-- AVANT (ancien trigger sans FK)
CREATE OR REPLACE FUNCTION notify_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'urgent',
    'Stock critique',
    'Produit: ' || NEW.name,
    '/stocks/inventaire?id=' || NEW.id,
    'Réapprovisionner'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- APRÈS (trigger avec FK product)
CREATE OR REPLACE FUNCTION notify_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'urgent',
    'Stock critique',
    'Produit: ' || NEW.name,
    '/stocks/inventaire?id=' || NEW.id,
    'Réapprovisionner',
    NEW.id,  -- ✅ AJOUT: related_product_id
    NULL,    -- related_sales_order_id
    NULL     -- related_purchase_order_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Configurer CRON Nettoyage Hebdomadaire

```sql
-- Via extension pg_cron (si disponible Supabase)
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 4 * * 0', -- Dimanche 4h du matin
  $$SELECT cleanup_old_notifications();$$
);
```

**Alternative sans pg_cron** : Créer job Vercel Cron ou GitHub Actions.

### 3. Ajouter Autres Entités (Extensibilité)

Quand vous identifierez d'autres types de notifications, ajouter colonnes FK:

```sql
-- Exemple: Ajouter FK vers invoices
ALTER TABLE notifications
ADD COLUMN related_invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;

CREATE INDEX idx_notifications_invoice
  ON notifications(related_invoice_id)
  WHERE related_invoice_id IS NOT NULL;

-- Mettre à jour contrainte CHECK
ALTER TABLE notifications
DROP CONSTRAINT check_single_related_entity;

ALTER TABLE notifications
ADD CONSTRAINT check_single_related_entity
CHECK (
  (related_product_id IS NOT NULL)::int +
  (related_sales_order_id IS NOT NULL)::int +
  (related_purchase_order_id IS NOT NULL)::int +
  (related_invoice_id IS NOT NULL)::int <= 1  -- ✅ AJOUT
);

-- Mettre à jour fonction helper
CREATE OR REPLACE FUNCTION create_notification_for_owners(
  ...
  p_related_invoice_id uuid DEFAULT NULL  -- ✅ AJOUT
)
...
```

---

## 🚨 Rollback (Si Problème)

Si besoin de revenir en arrière:

```sql
-- Supprimer colonnes FK
ALTER TABLE notifications
DROP COLUMN IF EXISTS related_product_id CASCADE,
DROP COLUMN IF EXISTS related_sales_order_id CASCADE,
DROP COLUMN IF EXISTS related_purchase_order_id CASCADE;

-- Supprimer indexes
DROP INDEX IF EXISTS idx_notifications_product;
DROP INDEX IF EXISTS idx_notifications_sales_order;
DROP INDEX IF EXISTS idx_notifications_purchase_order;

-- Supprimer contrainte
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS check_single_related_entity;

-- Restaurer fonction helper originale (si backup existe)
-- CREATE OR REPLACE FUNCTION create_notification_for_owners(...) ...
```

---

## 📞 Support

Si problèmes lors de l'application:

1. Vérifier logs PostgreSQL dans Supabase Dashboard
2. Vérifier permissions utilisateur (doit être Owner)
3. Vérifier que tables `products`, `sales_orders`, `purchase_orders` existent

---

**Date Création** : 2025-11-10
**Statut** : ⏳ Prêt à appliquer manuellement via Supabase Dashboard
