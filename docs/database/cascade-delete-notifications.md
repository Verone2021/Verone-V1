# CASCADE DELETE - Système Notifications Automatique

**Date création** : 2025-11-10
**Migration associée** : `20251110_001_notifications_cascade_delete_system.sql`
**Statut** : ⏳ Migration prête (application manuelle requise)

---

## 🎯 Objectif

Supprimer automatiquement les notifications orphelines lorsque l'entité liée (commande, produit, etc.) est supprimée de la base de données.

### Problème Résolu

**AVANT** :

- Commande `SO-2025-001` supprimée → Notification reste dans table
- Utilisateur clique sur notification → Redirection vers `/commandes/clients?id=abc123`
- Erreur 404 : Commande n'existe plus
- Notification "cassée" reste affichée indéfiniment

**APRÈS** :

- Commande `SO-2025-001` supprimée → PostgreSQL CASCADE DELETE automatique
- Notification supprimée en même temps que commande
- Aucune notification orpheline dans UI

---

## 🏗️ Architecture Technique

### 1. Colonnes Foreign Keys Optionnelles

La table `notifications` dispose de 3 colonnes FK optionnelles vers les entités sources :

```sql
ALTER TABLE notifications
ADD COLUMN related_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
ADD COLUMN related_sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
ADD COLUMN related_purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE;
```

**Caractéristiques** :

- ✅ **Optionnelles** (NULL autorisé) : Rétrocompatibilité avec notifications existantes
- ✅ **ON DELETE CASCADE** : Suppression automatique si entité parente supprimée
- ✅ **Indexes partiels** : Performance optimale (WHERE column IS NOT NULL)

### 2. Contrainte CHECK (Une Seule FK à la Fois)

```sql
ALTER TABLE notifications
ADD CONSTRAINT check_single_related_entity
CHECK (
  (related_product_id IS NOT NULL)::int +
  (related_sales_order_id IS NOT NULL)::int +
  (related_purchase_order_id IS NOT NULL)::int <= 1
);
```

**Garantit** : Une notification est liée à maximum UNE entité (product OU sales_order OU purchase_order).

### 3. Indexes Partiels Performants

```sql
CREATE INDEX idx_notifications_product
  ON notifications(related_product_id)
  WHERE related_product_id IS NOT NULL;

CREATE INDEX idx_notifications_sales_order
  ON notifications(related_sales_order_id)
  WHERE related_sales_order_id IS NOT NULL;

CREATE INDEX idx_notifications_purchase_order
  ON notifications(related_purchase_order_id)
  WHERE related_purchase_order_id IS NOT NULL;
```

**Avantages** :

- Index plus petit (seulement lignes avec FK non-NULL)
- Queries plus rapides pour recherche notifications par entité
- Maintenance automatique par PostgreSQL lors CASCADE DELETE

---

## 🔄 Workflow Cascade Delete

### Exemple Concret : Suppression Commande Client

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTION : Supprimer commande SO-2025-001               │
│  DELETE FROM sales_orders WHERE id = 'abc123-def456'        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  POSTGRESQL CASCADE DELETE                                   │
│  - Détecte FK related_sales_order_id = 'abc123-def456'       │
│  - Supprime automatiquement TOUTES notifications liées       │
│  - Action atomique (transaction SQL)                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  RÉSULTAT : Notifications orphelines supprimées              │
│  - Aucune notification cassée dans UI                        │
│  - Aucune action manuelle requise                            │
│  - Data integrity préservée                                  │
└─────────────────────────────────────────────────────────────┘
```

**SQL Exécuté en arrière-plan** :

```sql
-- Commande utilisateur
DELETE FROM sales_orders WHERE id = 'abc123-def456';

-- PostgreSQL exécute automatiquement (invisible pour utilisateur)
DELETE FROM notifications WHERE related_sales_order_id = 'abc123-def456';
```

---

## 📝 Fonction Helper Mise à Jour

### create_notification_for_owners()

La fonction de création de notifications a été mise à jour pour accepter les FK en paramètres optionnels :

```sql
CREATE OR REPLACE FUNCTION create_notification_for_owners(
  p_type text,
  p_severity text,
  p_title text,
  p_message text,
  p_action_url text,
  p_action_label text,
  p_related_product_id uuid DEFAULT NULL,        -- ✅ NOUVEAU
  p_related_sales_order_id uuid DEFAULT NULL,    -- ✅ NOUVEAU
  p_related_purchase_order_id uuid DEFAULT NULL  -- ✅ NOUVEAU
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_notification_count INTEGER := 0;
BEGIN
  FOR v_user IN
    SELECT id FROM auth.users
  LOOP
    INSERT INTO notifications (
      type, severity, title, message, action_url, action_label, user_id,
      related_product_id,           -- ✅ NOUVEAU
      related_sales_order_id,        -- ✅ NOUVEAU
      related_purchase_order_id      -- ✅ NOUVEAU
    ) VALUES (
      p_type, p_severity, p_title, p_message, p_action_url, p_action_label, v_user.id,
      p_related_product_id,
      p_related_sales_order_id,
      p_related_purchase_order_id
    );
    v_notification_count := v_notification_count + 1;
  END LOOP;

  RETURN v_notification_count;
END;
$$;
```

**Usage dans triggers** :

```sql
-- AVANT (sans FK)
PERFORM create_notification_for_owners(
  'business', 'urgent', 'Commande validée', '...', '/commandes/clients', 'Voir'
);

-- APRÈS (avec FK)
PERFORM create_notification_for_owners(
  'business', 'urgent', 'Commande validée', '...', '/commandes/clients', 'Voir',
  NULL,           -- related_product_id
  NEW.id,         -- ✅ related_sales_order_id (lien vers commande)
  NULL            -- related_purchase_order_id
);
```

---

## 🧹 Fonction Cleanup Périodique

### cleanup_old_notifications()

Nettoie automatiquement les notifications anciennes + orphelines legacy :

```sql
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- 1. Supprimer notifications lues >30 jours (archivage automatique)
  DELETE FROM notifications
  WHERE read = true
    AND updated_at < now() - interval '30 days';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE '[CLEANUP] Notifications lues >30j: % supprimées', v_deleted_count;

  -- 2. Supprimer notifications sans FK >7 jours (orphelines legacy)
  DELETE FROM notifications
  WHERE related_product_id IS NULL
    AND related_sales_order_id IS NULL
    AND related_purchase_order_id IS NULL
    AND created_at < now() - interval '7 days';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE '[CLEANUP] Orphelines legacy >7j: % supprimées', v_deleted_count;

  -- Statistiques post-nettoyage
  DECLARE
    v_total_notifications INTEGER;
    v_with_fk INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_total_notifications FROM notifications;
    SELECT COUNT(*) INTO v_with_fk FROM notifications
    WHERE related_product_id IS NOT NULL
       OR related_sales_order_id IS NOT NULL
       OR related_purchase_order_id IS NOT NULL;

    RAISE NOTICE '[STATS] Total notifications: % (dont % avec FK)', v_total_notifications, v_with_fk;
  END;
END;
$$;
```

**Exécution recommandée** : CRON hebdomadaire (dimanche 4h du matin)

```sql
-- Via extension pg_cron (si disponible Supabase)
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 4 * * 0',  -- Dimanche 4h du matin
  $$SELECT cleanup_old_notifications();$$
);
```

---

## 🧪 Tests Validation

### Test 1 : CASCADE DELETE Produit

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
-- Résultat attendu : 0
```

### Test 2 : Fonction Helper avec FK

```sql
-- Tester création notification avec FK produit
SELECT create_notification_for_owners(
  'business',
  'info',
  'Test Fonction Helper',
  'Test avec FK produit',
  '/stocks/inventaire',
  'Voir',
  (SELECT id FROM products LIMIT 1),  -- p_related_product_id
  NULL,                                -- p_related_sales_order_id
  NULL                                 -- p_related_purchase_order_id
);

-- Vérifier notifications créées
SELECT COUNT(*)
FROM notifications
WHERE title = 'Test Fonction Helper'
  AND related_product_id IS NOT NULL;
```

### Test 3 : Fonction Cleanup

```sql
-- Exécuter nettoyage
SELECT cleanup_old_notifications();

-- Vérifier NOTICE logs PostgreSQL :
-- [CLEANUP] Notifications lues >30j: X supprimées
-- [CLEANUP] Orphelines legacy >7j: Y supprimées
-- [STATS] Total notifications: Z (dont W avec FK)
```

---

## 📊 Statistiques Post-Migration

Après application migration, vérifier répartition notifications :

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

**Évolution attendue après mise à jour triggers** :

- Les nouvelles notifications auront FK renseignées
- Les anciennes notifications legacy seront progressivement nettoyées (cleanup hebdomadaire)

---

## 🚀 Extensibilité : Ajouter Nouvelles Entités

### Exemple : Ajouter FK vers `invoices`

```sql
-- 1. Ajouter colonne FK
ALTER TABLE notifications
ADD COLUMN related_invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;

COMMENT ON COLUMN notifications.related_invoice_id IS
'FK vers invoices - CASCADE DELETE automatique si facture supprimée.';

-- 2. Créer index partiel
CREATE INDEX idx_notifications_invoice
  ON notifications(related_invoice_id)
  WHERE related_invoice_id IS NOT NULL;

-- 3. Mettre à jour contrainte CHECK
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

-- 4. Mettre à jour fonction helper
CREATE OR REPLACE FUNCTION create_notification_for_owners(
  p_type text,
  p_severity text,
  p_title text,
  p_message text,
  p_action_url text,
  p_action_label text,
  p_related_product_id uuid DEFAULT NULL,
  p_related_sales_order_id uuid DEFAULT NULL,
  p_related_purchase_order_id uuid DEFAULT NULL,
  p_related_invoice_id uuid DEFAULT NULL  -- ✅ AJOUT
)
RETURNS integer
...
```

### Template Ajout Entité

```sql
-- Template générique pour ajouter nouvelle entité
ALTER TABLE notifications
ADD COLUMN related_<entity>_id UUID REFERENCES <table>(id) ON DELETE CASCADE;

CREATE INDEX idx_notifications_<entity>
  ON notifications(related_<entity>_id)
  WHERE related_<entity>_id IS NOT NULL;

-- Mettre à jour contrainte CHECK et fonction helper
```

---

## 🔄 Prochaines Étapes Après Migration

### Priorité 1 : Mettre à Jour Triggers (Progressive)

Les triggers existants doivent être mis à jour pour passer les FK aux fonctions de création de notifications.

**Ordre prioritaire** :

1. ✅ `notify_stock_alert()` - Notifications stock critique
2. ✅ `notify_stock_replenished()` - Notifications réapprovisionnement
3. ✅ `notify_order_confirmed()` - Notifications commandes confirmées
4. Autres triggers (15 au total)

**Exemple mise à jour trigger** :

```sql
-- AVANT (ancien trigger sans FK)
CREATE OR REPLACE FUNCTION notify_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business', 'urgent', 'Stock critique',
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
    'business', 'urgent', 'Stock critique',
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

### Priorité 2 : Configurer CRON Nettoyage Hebdomadaire

```sql
-- Via extension pg_cron (si disponible Supabase)
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 4 * * 0',  -- Dimanche 4h du matin
  $$SELECT cleanup_old_notifications();$$
);
```

**Alternative sans pg_cron** : Créer job Vercel Cron ou GitHub Actions.

### Priorité 3 : Ajouter Autres Entités

Quand vous identifierez d'autres types de notifications nécessitant CASCADE DELETE :

- `related_invoice_id` (factures)
- `related_stock_movement_id` (mouvements stock)
- `related_expense_id` (dépenses)
- Etc.

Utiliser le template extensibilité ci-dessus.

---

## 🚨 Rollback (Si Problème)

Si besoin de revenir en arrière après application migration :

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

-- Restaurer fonction helper originale (version sans FK)
-- CREATE OR REPLACE FUNCTION create_notification_for_owners(...) ...
```

---

## 📞 Fichiers Associés

### Migration SQL

- `supabase/migrations/20251110_001_notifications_cascade_delete_system.sql`
- `supabase/migrations/20251110_001_README_CASCADE_DELETE.md` (Guide application manuelle)

### Documentation Business Rules

- `docs/business-rules/15-notifications/cascade-delete-system.md`

### Code Source

- `packages/@verone/notifications/src/hooks/use-database-notifications.ts`
- `packages/@verone/notifications/src/components/dropdowns/NotificationsDropdown.tsx`

---

## 📅 Historique Modifications

| Date       | Action                                                      | Auteur      |
| ---------- | ----------------------------------------------------------- | ----------- |
| 2025-11-10 | Création documentation CASCADE DELETE                       | Claude Code |
| 2025-11-10 | Migration 20251110_001 créée (application manuelle requise) | Claude Code |

---

**Statut** : ⏳ Migration prête (application manuelle via Supabase Dashboard requise)
**Version** : 1.0.0
**Mainteneur** : Romeo Dos Santos
