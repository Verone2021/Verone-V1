# Règle Métier - Suppression Automatique Notifications Orphelines

**Module** : Notifications
**Date création** : 2025-11-10
**Priorité** : HIGH (Data Integrity)
**Migration associée** : `20251110_001_notifications_cascade_delete_system.sql`

---

## 🎯 Règle Métier

**Quand une entité est supprimée** (commande, produit, facture, etc.), **toutes les notifications liées doivent être automatiquement supprimées** pour éviter les notifications orphelines avec liens cassés.

### Contexte Business

**Problème utilisateur** :

- User reçoit notification "Commande SO-2025-001 validée"
- User clique sur bouton "Voir Détails" → Redirection `/commandes/clients?id=abc123`
- Erreur : Commande n'existe plus (supprimée par admin)
- Notification reste visible indéfiniment avec lien cassé

**Impact** :

- ❌ Mauvaise expérience utilisateur (liens cassés)
- ❌ Confusion (notification pour entité qui n'existe plus)
- ❌ Data pollution (notifications inutiles accumulées)

**Solution** :

- ✅ Suppression automatique CASCADE DELETE PostgreSQL
- ✅ Notification disparaît en même temps que l'entité
- ✅ Aucune action manuelle requise

---

## 📋 Règles d'Application

### Règle 1 : Lien Notification → Entité Obligatoire

**Toute notification liée à une entité** doit contenir une Foreign Key vers cette entité.

**Entités supportées actuellement** :

- `products` → Notifications stock critique, réapprovisionnement, catalogue
- `sales_orders` → Notifications commandes clients (validation, expédition, livraison, paiement, annulation)
- `purchase_orders` → Notifications commandes fournisseurs (création, confirmation, réception, retard)

**Exemple concret** :

```sql
-- Notification "Commande SO-2025-001 validée"
INSERT INTO notifications (
  title: 'Commande validée',
  message: 'La commande SO-2025-001 a été validée avec succès',
  action_url: '/commandes/clients?id=abc123-def456',
  related_sales_order_id: 'abc123-def456'  -- ✅ FK obligatoire
);
```

### Règle 2 : Suppression Cascade Automatique

**Quand l'entité est supprimée**, PostgreSQL supprime automatiquement les notifications liées.

**Exemples** :

**Cas 1 - Suppression Commande Client** :

```sql
-- Admin supprime commande SO-2025-001
DELETE FROM sales_orders WHERE id = 'abc123-def456';

-- PostgreSQL CASCADE DELETE automatique (invisible)
-- DELETE FROM notifications WHERE related_sales_order_id = 'abc123-def456';

-- Résultat : 5 notifications (validation, expédition, livraison, paiement, confirmation) supprimées automatiquement
```

**Cas 2 - Suppression Produit** :

```sql
-- Admin supprime produit "Canapé Stockholm"
DELETE FROM products WHERE id = 'xyz789-uvw012';

-- PostgreSQL CASCADE DELETE automatique
-- DELETE FROM notifications WHERE related_product_id = 'xyz789-uvw012';

-- Résultat : 3 notifications (stock critique, réapprovisionnement, catalogue) supprimées automatiquement
```

**Cas 3 - Suppression Commande Fournisseur** :

```sql
-- Admin annule et supprime PO-2025-042
DELETE FROM purchase_orders WHERE id = 'mno345-pqr678';

-- PostgreSQL CASCADE DELETE automatique
-- DELETE FROM notifications WHERE related_purchase_order_id = 'mno345-pqr678';

-- Résultat : 4 notifications (création, confirmation, réception, retard) supprimées automatiquement
```

### Règle 3 : Une Notification = Une Seule Entité

**Contrainte** : Une notification peut être liée à maximum UNE entité à la fois.

**Interdit** :

```sql
-- ❌ Notification liée à product ET sales_order en même temps
INSERT INTO notifications (
  related_product_id: 'abc123',
  related_sales_order_id: 'def456'  -- ERREUR : Contrainte CHECK violation
);
```

**Autorisé** :

```sql
-- ✅ Notification liée à product uniquement
INSERT INTO notifications (
  related_product_id: 'abc123',
  related_sales_order_id: NULL
);

-- ✅ Notification liée à sales_order uniquement
INSERT INTO notifications (
  related_product_id: NULL,
  related_sales_order_id: 'def456'
);

-- ✅ Notification sans lien (legacy, notifications systèmes)
INSERT INTO notifications (
  related_product_id: NULL,
  related_sales_order_id: NULL,
  related_purchase_order_id: NULL
);
```

### Règle 4 : Notifications Legacy Sans FK

**Notifications créées AVANT migration** (sans FK) ne sont PAS supprimées par CASCADE DELETE.

**Nettoyage automatique** :

- Fonction `cleanup_old_notifications()` supprime notifications legacy >7 jours
- Exécution recommandée : CRON hebdomadaire (dimanche 4h)

**Rationale** : Période de grâce 7 jours pour éviter suppression accidentelle notifications importantes.

---

## 🔄 Workflows Détaillés

### Workflow 1 : Notification Commande Client

```
┌─────────────────────────────────────────────────────────────┐
│  ÉVÉNEMENT : Commande SO-2025-001 validée                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER : trigger_order_confirmed_notification              │
│  - Détecte UPDATE sales_orders SET status='confirmed'        │
│  - Appelle fonction notify_order_confirmed()                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  CRÉATION NOTIFICATION avec FK                               │
│  INSERT INTO notifications (                                 │
│    title: 'Commande validée',                                │
│    related_sales_order_id: 'abc123-def456'  ✅ FK            │
│  )                                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  UI : Notification affichée avec bouton "Voir Détails"       │
│  - User clique → Redirection /commandes/clients?id=abc123    │
│  - Modal s'ouvre avec détails commande                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉVÉNEMENT : Admin supprime commande SO-2025-001             │
│  DELETE FROM sales_orders WHERE id = 'abc123-def456'         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  CASCADE DELETE AUTOMATIQUE                                  │
│  - PostgreSQL supprime notification automatiquement          │
│  - Notification disparaît de l'UI                            │
│  - User ne voit plus notification avec lien cassé           │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 2 : Notification Stock Critique

```
┌─────────────────────────────────────────────────────────────┐
│  ÉVÉNEMENT : Produit "Canapé Stockholm" stock < min_stock    │
│  UPDATE products SET stock_real = 2 WHERE min_stock = 10     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER : sync_stock_alert_tracking                         │
│  - Insert stock_alert_tracking (alert_type='low_stock')      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER : trigger_create_notification_on_stock_alert_insert │
│  - Appelle create_notification_on_stock_alert()              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  CRÉATION NOTIFICATION avec FK                               │
│  INSERT INTO notifications (                                 │
│    title: 'Stock Faible',                                    │
│    related_product_id: 'xyz789-uvw012'  ✅ FK                │
│  )                                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  UI : Notification affichée avec bouton "Réapprovisionner"   │
│  - User clique → Redirection /stocks/alertes                 │
│  - Page alertes affiche produit avec stock critique          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉVÉNEMENT : Admin supprime produit "Canapé Stockholm"       │
│  DELETE FROM products WHERE id = 'xyz789-uvw012'             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  CASCADE DELETE AUTOMATIQUE                                  │
│  - PostgreSQL supprime notification automatiquement          │
│  - Notification stock critique disparaît                     │
│  - Aucune notification orpheline dans UI                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Statistiques & Monitoring

### KPI Notifications

**Métriques à surveiller** :

1. **Taux notifications orphelines** :

   ```sql
   SELECT
     COUNT(*) FILTER (WHERE related_product_id IS NULL
                       AND related_sales_order_id IS NULL
                       AND related_purchase_order_id IS NULL
                       AND created_at < now() - interval '7 days') as orphan_count,
     COUNT(*) as total_notifications,
     ROUND(100.0 * COUNT(*) FILTER (...) / COUNT(*), 2) as orphan_percentage
   FROM notifications;
   ```

   **Cible** : <5% après stabilisation système

2. **Distribution notifications par type d'entité** :

   ```sql
   SELECT
     COUNT(*) FILTER (WHERE related_product_id IS NOT NULL) as produits,
     COUNT(*) FILTER (WHERE related_sales_order_id IS NOT NULL) as commandes_clients,
     COUNT(*) FILTER (WHERE related_purchase_order_id IS NOT NULL) as commandes_fournisseurs,
     COUNT(*) FILTER (WHERE related_product_id IS NULL
                       AND related_sales_order_id IS NULL
                       AND related_purchase_order_id IS NULL) as legacy_sans_fk
   FROM notifications;
   ```

3. **Taux ouverture notifications** :
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE read = true) as read_count,
     COUNT(*) as total,
     ROUND(100.0 * COUNT(*) FILTER (WHERE read = true) / COUNT(*), 2) as read_percentage
   FROM notifications
   WHERE created_at > now() - interval '30 days';
   ```
   **Cible** : >60% (notifications lues)

### Dashboard Admin Recommandé

**Page `/admin/notifications`** devrait afficher :

- Total notifications actives
- Notifications non lues
- Notifications orphelines (legacy sans FK)
- Distribution par entité (produits, commandes clients, commandes fournisseurs)
- Tendances 30 derniers jours

---

## 🚀 Extensibilité Futures Entités

### Ajouter Support Factures (Exemple)

**Étape 1 - Migration SQL** :

```sql
-- Ajouter colonne FK vers invoices
ALTER TABLE notifications
ADD COLUMN related_invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;

-- Index partiel
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
```

**Étape 2 - Mettre à jour fonction helper** :

```sql
CREATE OR REPLACE FUNCTION create_notification_for_owners(
  ...,
  p_related_invoice_id uuid DEFAULT NULL  -- ✅ NOUVEAU PARAMÈTRE
)
RETURNS integer
AS $$
BEGIN
  INSERT INTO notifications (
    ...,
    related_invoice_id  -- ✅ NOUVEAU CHAMP
  ) VALUES (
    ...,
    p_related_invoice_id
  );
END;
$$;
```

**Étape 3 - Créer triggers factures** :

```sql
-- Notification facture payée
CREATE OR REPLACE FUNCTION notify_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business', 'info', 'Facture payée',
    'La facture ' || NEW.invoice_number || ' a été payée',
    '/factures?id=' || NEW.id,
    'Voir Facture',
    NULL,      -- related_product_id
    NULL,      -- related_sales_order_id
    NULL,      -- related_purchase_order_id
    NEW.id     -- ✅ related_invoice_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoice_paid_notification
  AFTER UPDATE ON invoices
  FOR EACH ROW
  WHEN (OLD.payment_status = 'pending' AND NEW.payment_status = 'paid')
  EXECUTE FUNCTION notify_invoice_paid();
```

### Template Générique Nouvelle Entité

```sql
-- 1. Colonne FK
ALTER TABLE notifications
ADD COLUMN related_<entity>_id UUID REFERENCES <table>(id) ON DELETE CASCADE;

-- 2. Index partiel
CREATE INDEX idx_notifications_<entity>
  ON notifications(related_<entity>_id)
  WHERE related_<entity>_id IS NOT NULL;

-- 3. Contrainte CHECK (ajouter nouvelle entité)
ALTER TABLE notifications DROP CONSTRAINT check_single_related_entity;
ALTER TABLE notifications ADD CONSTRAINT check_single_related_entity CHECK (...);

-- 4. Fonction helper (ajouter paramètre)
CREATE OR REPLACE FUNCTION create_notification_for_owners(..., p_related_<entity>_id uuid DEFAULT NULL);

-- 5. Triggers (passer FK lors appels)
PERFORM create_notification_for_owners(..., NEW.id);
```

---

## ❓ FAQ Business

### Q1 : Que se passe-t-il si je supprime une commande avec 10 notifications ?

**R** : Les 10 notifications sont automatiquement supprimées en même temps que la commande. Aucune action manuelle requise.

**Exemple** :

- Commande SO-2025-001 a 10 notifications (validation, expédition, livraison, paiement, etc.)
- Admin supprime commande → CASCADE DELETE supprime 10 notifications automatiquement
- Users ne voient plus aucune notification liée à SO-2025-001

### Q2 : Les notifications anciennes sont-elles conservées ?

**R** : Oui, mais avec nettoyage automatique :

- **Notifications lues >30 jours** : Supprimées automatiquement (archivage)
- **Notifications non lues avec FK** : Conservées (sauf si entité supprimée)
- **Notifications orphelines legacy >7 jours** : Supprimées automatiquement

**Rationale** : Éviter pollution base données avec notifications périmées.

### Q3 : Puis-je désactiver CASCADE DELETE pour certaines entités ?

**R** : Non recommandé. CASCADE DELETE garantit data integrity.

**Alternative** : Si vous voulez conserver historique notifications :

- Créer table `notifications_archive`
- Trigger BEFORE DELETE sur entités → Copier notifications vers archive
- Puis laisser CASCADE DELETE supprimer notifications actives

### Q4 : Que se passe-t-il pour les notifications existantes (avant migration) ?

**R** : Notifications existantes (sans FK) restent visibles jusqu'à :

- User les marque comme lues + 30 jours → Supprimées par cleanup
- 7 jours après création → Supprimées par cleanup (orphelines legacy)

**Transition douce** : Période de grâce 7 jours pour éviter suppressions accidentelles.

### Q5 : Comment tester CASCADE DELETE sans supprimer vraiment l'entité ?

**R** : Utiliser transactions SQL avec ROLLBACK :

```sql
BEGIN;

-- Créer notification test
INSERT INTO notifications (related_product_id, ...) VALUES (...);

-- Supprimer produit (CASCADE DELETE déclenché)
DELETE FROM products WHERE id = 'test-id';

-- Vérifier notification supprimée
SELECT COUNT(*) FROM notifications WHERE related_product_id = 'test-id';  -- Résultat : 0

-- Annuler transaction (restaurer tout)
ROLLBACK;
```

---

## 📞 Support & Ressources

### Documentation Technique

- `docs/database/cascade-delete-notifications.md` (Architecture complète)
- `supabase/migrations/20251110_001_notifications_cascade_delete_system.sql` (Migration)
- `supabase/migrations/20251110_001_README_CASCADE_DELETE.md` (Guide application)

### Code Source

- `packages/@verone/notifications/apps/back-office/src/hooks/use-database-notifications.ts` (Hooks React)
- `packages/@verone/notifications/apps/back-office/src/components/dropdowns/NotificationsDropdown.tsx` (UI)

### Business Rules Associées

- `docs/business-rules/07-commandes/notifications-workflow.md` (Notifications commandes)
- `docs/business-rules/06-stocks/alertes/stock-alert-tracking-system.md` (Notifications stock)

---

## 📅 Historique

| Date       | Action                               | Auteur           |
| ---------- | ------------------------------------ | ---------------- |
| 2025-11-10 | Création règle métier CASCADE DELETE | Claude Code      |
| 2025-11-10 | Validation règle avec stakeholders   | Romeo Dos Santos |

---

**Statut** : ✅ Approuvé - Migration prête (application manuelle requise)
**Version** : 1.0.0
**Owner** : Romeo Dos Santos
