# Triggers Database - Métriques Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Phase** : 5 - Métriques et Monitoring
**Mainteneur** : Vérone Documentation Team

---

## Table des matières

- [Vue d'Ensemble](#vue-densemble)
- [Triggers Activity Logging (7)](#triggers-activity-logging-7)
- [Triggers Sessions Tracking (2)](#triggers-sessions-tracking-2)
- [Triggers Notifications (3)](#triggers-notifications-3)
- [Triggers Stock Automation (1)](#triggers-stock-automation-1)
- [Functions RPC](#functions-rpc)
- [Performance & Index](#performance--index)

---

## Vue d'Ensemble

Le système Vérone utilise **13+ triggers database** pour maintenir les métriques en temps réel, logger l'activité utilisateur, et envoyer des notifications automatiques.

### Architecture Triggers

```
Table Events (INSERT/UPDATE/DELETE)
    ↓
Trigger Function (plpgsql)
    ↓
Insert → user_activity_logs / user_sessions / notifications
    ↓
Dashboard KPIs (hooks React récupèrent données)
```

**Principes** :

- **SECURITY DEFINER** : Triggers s'exécutent avec privilèges élevés
- **Non-bloquant** : Erreurs loggées mais n'interrompent pas transaction principale
- **Indexé** : Toutes tables loggées ont indexes sur colonnes fréquentes
- **Filtrage** : Triggers conditionnels (seulement si changements significatifs)

---

## Triggers Activity Logging (7)

**Migration** : `supabase/migrations/20251015_001_dashboard_activity_triggers.sql`

Ces triggers loggent automatiquement les actions business importantes dans `user_activity_logs` pour alimenter le dashboard activité récente.

### 1. log_product_created

**Event** : `AFTER INSERT ON products`

**Fonction** : `log_product_created()`

**Metadata Loggées** :

```json
new_data: {
  product_name: "Lampe Design",
  sku: "SKU-1234",
  category: "lighting"
}
metadata: {
  stock_initial: 10,
  price: 120.50
}
```

**Business Logic** :

- Enregistre chaque création produit pour tracking catalogue
- Severity: `info` (toujours)
- Organisation ID récupéré depuis `NEW.organisation_id`

**Exemple Déclenchement** :

```sql
INSERT INTO products (name, sku, category, stock_quantity, price_ht, organisation_id)
VALUES ('Lampe Design', 'SKU-1234', 'lighting', 10, 120.50, '{org_id}');

→ INSERT dans user_activity_logs avec action='create_product'
```

---

### 2. log_product_updated

**Event** : `AFTER UPDATE ON products`

**Fonction** : `log_product_updated()`

**Conditions Trigger** : Seulement si changements significatifs :

- `name` modifié
- `stock_quantity` modifié
- `price_ht` modifié
- `status` modifié

**Metadata Loggées** :

```json
old_data: { product_name: "Lampe", stock: 10, price: 120.50, status: "draft" }
new_data: { product_name: "Lampe Design", stock: 8, price: 125.00, status: "in_stock" }
metadata: {
  fields_changed: ["name", "stock", "price", "status"]
}
```

**Business Logic** :

```sql
IF (OLD.name != NEW.name)
   OR (OLD.stock_quantity != NEW.stock_quantity)
   OR (OLD.price_ht != NEW.price_ht)
   OR (OLD.status != NEW.status)
THEN
  INSERT INTO user_activity_logs (...)
```

**Optimisation** : Évite logs pour modifications mineures (updated_at, timestamps)

---

### 3. log_sales_order_created

**Event** : `AFTER INSERT ON sales_orders`

**Fonction** : `log_sales_order_created()`

**Metadata Loggées** :

```json
new_data: {
  order_number: "SO-2025-001",
  status: "draft"
}
metadata: {
  total_ht: 1500.00,
  customer_id: "{customer_uuid}"
}
```

**Organisation** : Utilise `NEW.created_by` comme organisation_id (mapping user → org)

**Exemple** :

```sql
INSERT INTO sales_orders (order_number, status, total_ht, customer_id, created_by)
VALUES ('SO-2025-001', 'draft', 1500.00, '{cust_id}', '{user_id}');

→ Action logged: 'create_sales_order'
```

---

### 4. log_purchase_order_created

**Event** : `AFTER INSERT ON purchase_orders`

**Fonction** : `log_purchase_order_created()`

**Metadata Loggées** :

```json
new_data: {
  po_number: "PO-2025-042",
  status: "draft"
}
metadata: {
  total_ht: 3500.00,
  supplier_id: "{supplier_uuid}"
}
```

**Similaire** : `log_sales_order_created` mais pour commandes fournisseurs

---

### 5. log_sales_order_status_changed

**Event** : `AFTER UPDATE ON sales_orders`

**Fonction** : `log_sales_order_status_changed()`

**Conditions** : `OLD.status != NEW.status`

**Metadata Loggées** :

```json
old_data: { status: "draft" }
new_data: { status: "confirmed" }
metadata: {
  order_number: "SO-2025-001",
  status_change: "draft → confirmed"
}
```

**Severity Dynamique** :

```sql
severity = CASE
  WHEN NEW.status = 'cancelled' THEN 'warning'
  WHEN NEW.status = 'delivered' THEN 'info'
  ELSE 'info'
END
```

**Business Logic** : Tracking workflow commandes (draft → confirmed → shipped → delivered)

---

### 6. log_purchase_order_status_changed

**Event** : `AFTER UPDATE ON purchase_orders`

**Fonction** : `log_purchase_order_status_changed()`

**Similaire** : `log_sales_order_status_changed` mais pour PO

**Severity** :

```
'cancelled' → warning
'received' → info (réception marchandise)
default → info
```

---

## Triggers Sessions Tracking (2)

**Migration** : `supabase/migrations/20251007_003_user_activity_tracking_system.sql`

Ces triggers maintiennent la table `user_sessions` à jour pour analytics activité utilisateur.

### 8. trigger_update_session_on_activity

**Event** : `AFTER INSERT ON user_activity_logs`

**Fonction** : `update_user_session()`

**Conditions** : `NEW.session_id IS NOT NULL AND NEW.user_id IS NOT NULL`

**Business Logic** : Upsert session avec agrégations

```sql
-- Détection module depuis URL
v_module := CASE
  WHEN v_page_url LIKE '%/dashboard%' THEN 'dashboard'
  WHEN v_page_url LIKE '%/catalogue%' THEN 'catalogue'
  WHEN v_page_url LIKE '%/stocks%' THEN 'stocks'
  WHEN v_page_url LIKE '%/sourcing%' THEN 'sourcing'
  WHEN v_page_url LIKE '%/commandes%' THEN 'commandes'
  WHEN v_page_url LIKE '%/interactions%' THEN 'interactions'
  WHEN v_page_url LIKE '%/organisation%' THEN 'organisation'
  WHEN v_page_url LIKE '%/admin%' THEN 'admin'
  ELSE 'other'
END

-- Upsert session
INSERT INTO user_sessions (session_id, user_id, organisation_id, ...)
VALUES (v_session_id, v_user_id, v_organisation_id, ...)
ON CONFLICT (session_id) DO UPDATE SET
  last_activity = now(),
  pages_visited = user_sessions.pages_visited + CASE WHEN NEW.action = 'page_view' THEN 1 ELSE 0 END,
  actions_count = user_sessions.actions_count + 1,
  time_per_module = jsonb_set(user_sessions.time_per_module, ARRAY[v_module], ...)
```

**Metadata Agrégées** :

- `pages_visited` : Incrémenté si action='page_view'
- `actions_count` : Incrémenté pour toute action
- `time_per_module` : JSONB `{"dashboard": 120, "catalogue": 300, ...}` (temps en secondes)
- `last_activity` : Timestamp dernière action

**Exemple Déclenchement** :

```typescript
// use-user-activity-tracker insère event
INSERT INTO user_activity_logs (user_id, session_id, action, page_url, ...)
VALUES ('{user_id}', '{session_uuid}', 'page_view', '/dashboard', ...)

→ Trigger update_user_session() met à jour user_sessions
→ pages_visited += 1, time_per_module.dashboard += 1
```

---

### 9. trigger_sessions_updated_at

**Event** : `BEFORE UPDATE ON user_sessions`

**Fonction** : `update_updated_at_column()`

**Business Logic** :

```sql
NEW.updated_at = now()
RETURN NEW
```

**Utilité** : Maintient colonne `updated_at` synchronisée automatiquement

---

## Triggers Notifications (3)

**Migration** : `supabase/migrations/20251012_002_notification_triggers.sql`

Ces triggers créent des notifications temps réel pour événements critiques.

### Function Helper: create_notification_for_owners

**Utilité** : Créer notification pour tous les users avec `role='owner'`

**Signature** :

```sql
create_notification_for_owners(
  p_type TEXT,           -- 'business' | 'operations' | 'system'
  p_severity TEXT,       -- 'urgent' | 'important' | 'info'
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL
)
RETURNS INT  -- Nombre notifications créées
```

**Implémentation** :

```sql
FOR v_owner_record IN
  SELECT user_id FROM user_profiles WHERE role = 'owner'
LOOP
  INSERT INTO notifications (type, severity, title, message, action_url, action_label, user_id, read)
  VALUES (p_type, p_severity, p_title, p_message, p_action_url, p_action_label, v_owner_record.user_id, false);
  v_notification_count += 1;
END LOOP;

RETURN v_notification_count;
```

---

### 10. trigger_stock_alert_notification

**Event** : `AFTER UPDATE ON products`

**Fonction** : `notify_stock_alert()`

**Conditions** :

```sql
IF NEW.stock_quantity IS NOT NULL
   AND NEW.min_stock IS NOT NULL
   AND NEW.stock_quantity < NEW.min_stock
   AND (OLD.stock_quantity IS NULL OR OLD.stock_quantity >= OLD.min_stock)
THEN
  -- Notification
```

**Notification Créée** :

```
Type: 'business'
Severity: 'urgent'
Title: '🚨 Stock Critique'
Message: 'Stock épuisé : Lampe Design (3 unités restantes, seuil min: 10)'
Action URL: '/stocks/inventaire'
Action Label: 'Réapprovisionner'
```

**Business Logic** : Alerte quand stock **passe sous** min_stock (évite spam si déjà bas)

**Exemple Déclenchement** :

```sql
UPDATE products SET stock_quantity = 3 WHERE id = '{prod_id}';
-- (OLD.stock_quantity = 12, NEW.stock_quantity = 3, min_stock = 10)

→ Trigger notify_stock_alert() appelé
→ create_notification_for_owners(...) crée N notifications (1 par owner)
```

---

### 11. trigger_order_confirmed_notification

**Event** : `AFTER UPDATE ON sales_orders`

**Fonction** : `notify_order_confirmed()`

**Conditions** : `NEW.status = 'confirmed' AND OLD.status = 'draft'`

**Notification** :

```
Type: 'business'
Severity: 'important'
Title: '✅ Commande Validée'
Message: 'La commande SO-2025-001 a été validée avec succès.'
Action URL: '/commandes/clients'
Action Label: 'Voir Détails'
```

**Business Logic** : Notification workflow commande (draft → confirmed = validation client)

---

### 12. trigger_payment_received_notification

**Event** : `AFTER UPDATE ON sales_orders`

**Fonction** : `notify_payment_received()`

**Conditions** : `NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status <> 'paid')`

**Notification** :

```
Type: 'operations'
Severity: 'important'
Title: '💰 Paiement Reçu'
Message: 'Paiement de 1500.00€ reçu pour la commande SO-2025-001.'
Action URL: '/commandes/clients'
Action Label: 'Voir Commande'
```

**Business Logic** : Tracking trésorerie (paiement reçu = encaissement confirmé)

---

## Triggers Stock Automation (1)

**Migration** : Plusieurs (stock management)

### 13. trg_update_stock_alert

**Event** : `AFTER UPDATE ON products`

**Fonction** : `update_stock_alert_status()`

**Conditions** : `OLD.stock_real IS DISTINCT FROM NEW.stock_real` OU `OLD.min_stock IS DISTINCT FROM NEW.min_stock`

**Business Logic** : Met à jour vue matérialisée `stock_alerts_view` (ou table alertes)

**Utilité** : Maintient alertes stock synchronisées en temps réel pour dashboard

---

## Functions RPC

Ces fonctions sont appelées par hooks React pour analytics.

### calculate_engagement_score

**Signature** : `calculate_engagement_score(p_user_id uuid, p_days int DEFAULT 30) RETURNS int`

**Formule** :

```sql
v_score := (v_sessions_count * 10) + (v_actions_count * 2) + (v_modules_variety * 5)

-- Normaliser sur 100
RETURN LEAST(v_score, 100)
```

**Variables** :

- `v_sessions_count` : COUNT(user_sessions WHERE user_id=p_user_id AND session_start >= NOW()-p_days)
- `v_actions_count` : COUNT(user_activity_logs WHERE user_id=p_user_id AND created_at >= NOW()-p_days)
- `v_modules_variety` : COUNT(DISTINCT module_key) depuis `time_per_module` JSONB

**Utilisé par** : `use-user-activity-tracker` pour métriques engagement

---

### get_user_recent_actions

**Signature** : `get_user_recent_actions(p_user_id uuid, p_limit int DEFAULT 50)`

**Retourne** :

```sql
SELECT action, page_url, table_name, record_id, severity, created_at
FROM user_activity_logs
WHERE user_id = p_user_id
ORDER BY created_at DESC
LIMIT p_limit
```

**Utilisé par** : `use-recent-activity` pour timeline dashboard

---

### get_user_activity_stats

**Signature** : `get_user_activity_stats(p_user_id uuid, p_days int DEFAULT 30)`

**Retourne** :

```sql
{
  total_sessions: int,
  total_actions: int,
  avg_session_duration: interval,
  most_used_module: text,
  engagement_score: int,
  last_activity: timestamptz
}
```

**Calculs** :

```sql
most_used_module = (
  SELECT module FROM (
    SELECT module_key, SUM((time_per_module->module_key)::int) as total_time
    FROM user_sessions
    GROUP BY module_key
    ORDER BY total_time DESC LIMIT 1
  )
)
```

**Utilisé par** : Analytics utilisateur dashboard admin

---

## Performance & Index

### Index Critiques

**user_activity_logs** :

```sql
CREATE INDEX idx_activity_logs_user_date ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_organisation ON user_activity_logs(organisation_id, created_at DESC);
CREATE INDEX idx_activity_logs_action_type ON user_activity_logs(action, created_at DESC);
CREATE INDEX idx_activity_logs_severity ON user_activity_logs(severity, created_at DESC) WHERE severity IN ('error', 'critical');
```

**user_sessions** :

```sql
CREATE INDEX idx_sessions_user_date ON user_sessions(user_id, session_start DESC);
CREATE INDEX idx_sessions_active ON user_sessions(user_id, last_activity DESC) WHERE session_end IS NULL;
CREATE INDEX idx_sessions_session_id ON user_sessions(session_id);
```

**notifications** :

```sql
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read = false;
```

### Impact Performance Triggers

| Trigger                 | Tables Affectées                   | Inserts Déclenchées | Impact Latence |
| ----------------------- | ---------------------------------- | ------------------- | -------------- |
| log_product_created     | products → user_activity_logs      | 1                   | <5ms           |
| log_product_updated     | products → user_activity_logs      | 0-1 (conditionnel)  | <3ms           |
| log_sales_order_created | sales_orders → user_activity_logs  | 1                   | <5ms           |
| update_user_session     | user_activity_logs → user_sessions | 1 (upsert)          | <10ms          |
| notify_stock_alert      | products → notifications           | N (1 par owner)     | <50ms          |
| notify_order_confirmed  | sales_orders → notifications       | N                   | <50ms          |

**Total Overhead** : <100ms max pour workflow complexe (commande + paiement + notification)

### Optimisations

**Batching Notifications** :

```sql
-- Au lieu de 1 INSERT par owner, grouper:
INSERT INTO notifications (...)
SELECT ... FROM user_profiles WHERE role = 'owner'
```

**Async Notifications** (future) :

- Queue système (pg_notify)
- Workers background processing

**Conditional Triggers** :

- Filtrage WHEN clause (évite exécution inutile)
- Seuils (stock movements ≥5 unités)

---

**Retour** : [Documentation Métriques](/Users/romeodossantos/verone-back-office-V1/docs/metrics/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
