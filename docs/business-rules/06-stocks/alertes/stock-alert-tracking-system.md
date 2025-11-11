# Système Stock Alert Tracking - Architecture Complète

**Module** : Stocks / Alertes
**Date création** : 2025-11-10
**Statut** : ✅ ACTIF depuis migration 112 (5 Nov 2025)
**Remplace** : Ancien système triggers legacy (notify_stock_alert, notify_stock_replenished)

---

## 🎯 Vue d'Ensemble

Le système `stock_alert_tracking` est une architecture moderne pour gérer les alertes de stock critique avec notifications automatiques.

### Évolution Architecture

**AVANT (Oct 2025)** :

- Triggers directs sur table `products`
- Fonction `notify_stock_alert()` appelée sur UPDATE
- Colonne legacy `stock_quantity` (obsolète)
- Notifications créées sans tracking d'état

**APRÈS (Nov 2025)** :

- Table dédiée `stock_alert_tracking` (historique + état)
- Triggers sur `products` → INSERT/UPDATE `stock_alert_tracking`
- Trigger sur `stock_alert_tracking` → Création notifications
- Colonnes modernes `stock_real`, `stock_forecasted`
- Validation manuelle alertes possible

---

## 🏗️ Architecture Database

### Table stock_alert_tracking

```sql
CREATE TABLE stock_alert_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'restock_needed')),
  alert_priority INTEGER NOT NULL CHECK (alert_priority BETWEEN 1 AND 3),
  -- 1 = low, 2 = important, 3 = urgent
  stock_level_at_alert INTEGER NOT NULL,
  min_stock_threshold INTEGER NOT NULL,
  validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index performance
CREATE INDEX idx_stock_alert_tracking_product ON stock_alert_tracking(product_id);
CREATE INDEX idx_stock_alert_tracking_validated ON stock_alert_tracking(validated);
CREATE INDEX idx_stock_alert_tracking_priority ON stock_alert_tracking(alert_priority DESC);
```

**Colonnes clés** :

- `alert_type` : Type d'alerte (low_stock, out_of_stock, restock_needed)
- `alert_priority` : Priorité 1-3 (map vers severity notification)
- `validated` : Alerte traitée par user (FALSE = active, TRUE = résolue)
- `stock_level_at_alert` : Stock au moment de l'alerte (historique)

---

## 🔄 Workflow Complet

### Scénario 1 : Stock Passe Sous Seuil Minimum

```
┌─────────────────────────────────────────────────────────────┐
│  ÉVÉNEMENT : Vente produit "Canapé Stockholm"               │
│  UPDATE products SET stock_real = 2 WHERE min_stock = 10    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER : sync_stock_alert_tracking                         │
│  - Condition : NEW.stock_real < NEW.min_stock                │
│  - Détecte : 2 < 10 = TRUE                                   │
│  - Calcule alert_priority basé sur ratio stock               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  INSERT INTO stock_alert_tracking                            │
│  - product_id: {uuid}                                        │
│  - alert_type: 'low_stock'                                   │
│  - alert_priority: 2 (important)                             │
│  - stock_level_at_alert: 2                                   │
│  - min_stock_threshold: 10                                   │
│  - validated: FALSE                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER : trigger_create_notification_on_stock_alert_insert│
│  - Condition : validated=FALSE AND alert_priority >= 2       │
│  - Appelle fonction create_notification_on_stock_alert()    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  CRÉATION NOTIFICATIONS (tous owners)                        │
│  INSERT INTO notifications (                                 │
│    type: 'business',                                         │
│    severity: 'important',  -- ⚠️ (priority 2)                │
│    title: 'Stock Faible',                                    │
│    message: 'Canapé Stockholm: 2 unités (seuil: 10)',       │
│    action_url: '/stocks/alertes',                            │
│    action_label: 'Réapprovisionner',                         │
│    related_product_id: {uuid}  -- ✅ CASCADE DELETE          │
│  )                                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  UI : Notification affichée dans dropdown                    │
│  - Badge orange "Important"                                  │
│  - User clique → Redirection /stocks/alertes                 │
│  - Page alertes affiche produit avec bouton réappro          │
└─────────────────────────────────────────────────────────────┘
```

### Scénario 2 : Réapprovisionnement Effectué

```
┌─────────────────────────────────────────────────────────────┐
│  ÉVÉNEMENT : Réception commande fournisseur                 │
│  UPDATE products SET stock_real = 50 WHERE min_stock = 10   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER : sync_stock_alert_tracking                         │
│  - Condition : NEW.stock_real >= NEW.min_stock               │
│  - Détecte : 50 >= 10 = TRUE (stock restauré)               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  UPDATE stock_alert_tracking                                 │
│  SET validated = TRUE, validated_at = now()                  │
│  WHERE product_id = {uuid} AND validated = FALSE            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  RÉSULTAT : Alerte marquée comme résolue automatiquement     │
│  - Notification reste visible jusqu'à user marque "lue"      │
│  - Historique conservé dans stock_alert_tracking             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Calcul Priorité Alerte

### Logique Calcul alert_priority

```sql
CREATE OR REPLACE FUNCTION calculate_alert_priority(
  current_stock INTEGER,
  min_stock INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  stock_ratio DECIMAL;
BEGIN
  -- Éviter division par zéro
  IF min_stock = 0 THEN
    RETURN 1;  -- Priority LOW si pas de seuil défini
  END IF;

  -- Calculer ratio stock/seuil
  stock_ratio := current_stock::DECIMAL / min_stock::DECIMAL;

  -- Priorité basée sur ratio
  CASE
    WHEN stock_ratio <= 0 THEN RETURN 3;      -- URGENT (rupture stock)
    WHEN stock_ratio < 0.3 THEN RETURN 3;     -- URGENT (< 30% seuil)
    WHEN stock_ratio < 0.7 THEN RETURN 2;     -- IMPORTANT (30-70% seuil)
    ELSE RETURN 1;                             -- LOW (> 70% seuil)
  END CASE;
END;
$$;
```

**Exemples** :

| Stock Actuel | Min Stock | Ratio | Priority | Severity       | Badge     |
| ------------ | --------- | ----- | -------- | -------------- | --------- |
| 0            | 10        | 0%    | 3        | urgent         | 🚨 Rouge  |
| 2            | 10        | 20%   | 3        | urgent         | 🚨 Rouge  |
| 4            | 10        | 40%   | 2        | important      | ⚠️ Orange |
| 8            | 10        | 80%   | 1        | info           | ℹ️ Bleu   |
| 15           | 10        | 150%  | N/A      | (pas d'alerte) | -         |

---

## 🔧 Triggers & Fonctions

### Trigger 1 : sync_stock_alert_tracking

**Objectif** : Maintenir table stock_alert_tracking synchronisée avec products

```sql
CREATE OR REPLACE FUNCTION sync_stock_alert_tracking()
RETURNS TRIGGER AS $$
DECLARE
  v_alert_priority INTEGER;
  v_existing_alert_id UUID;
BEGIN
  -- Calculer priorité
  v_alert_priority := calculate_alert_priority(NEW.stock_real, NEW.min_stock);

  -- Vérifier alerte active existante
  SELECT id INTO v_existing_alert_id
  FROM stock_alert_tracking
  WHERE product_id = NEW.id
    AND validated = FALSE
  LIMIT 1;

  -- Stock sous seuil → Créer/Mettre à jour alerte
  IF NEW.stock_real < NEW.min_stock THEN
    IF v_existing_alert_id IS NULL THEN
      -- Créer nouvelle alerte
      INSERT INTO stock_alert_tracking (
        product_id, alert_type, alert_priority,
        stock_level_at_alert, min_stock_threshold, validated
      ) VALUES (
        NEW.id,
        CASE WHEN NEW.stock_real = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
        v_alert_priority,
        NEW.stock_real,
        NEW.min_stock,
        FALSE
      );
    ELSE
      -- Mettre à jour alerte existante
      UPDATE stock_alert_tracking
      SET alert_priority = v_alert_priority,
          stock_level_at_alert = NEW.stock_real,
          updated_at = now()
      WHERE id = v_existing_alert_id;
    END IF;
  ELSE
    -- Stock restauré → Valider alerte
    IF v_existing_alert_id IS NOT NULL THEN
      UPDATE stock_alert_tracking
      SET validated = TRUE,
          validated_at = now(),
          notes = 'Stock restauré automatiquement'
      WHERE id = v_existing_alert_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_stock_alert_tracking
  AFTER UPDATE OF stock_real, min_stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_alert_tracking();
```

### Trigger 2 : create_notification_on_stock_alert

**Objectif** : Créer notifications quand nouvelle alerte priority >= 2

```sql
CREATE OR REPLACE FUNCTION create_notification_on_stock_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
  v_severity TEXT;
  v_user RECORD;
BEGIN
  -- Récupérer infos produit
  SELECT id, name, sku, stock_real, min_stock
  INTO v_product
  FROM products
  WHERE id = NEW.product_id;

  -- Mapper priority → severity
  v_severity := CASE NEW.alert_priority
    WHEN 3 THEN 'urgent'
    WHEN 2 THEN 'important'
    ELSE 'info'
  END;

  -- Créer notification pour chaque owner
  FOR v_user IN SELECT id FROM auth.users LOOP
    INSERT INTO notifications (
      type, severity, title, message, action_url, action_label, user_id,
      related_product_id  -- ✅ CASCADE DELETE
    ) VALUES (
      'business',
      v_severity,
      CASE NEW.alert_type
        WHEN 'out_of_stock' THEN 'Rupture Stock'
        WHEN 'low_stock' THEN 'Stock Faible'
        ELSE 'Réapprovisionnement Nécessaire'
      END,
      v_product.name || ' (' || v_product.sku || '): ' ||
      v_product.stock_real || ' unités restantes (seuil: ' || v_product.min_stock || ')',
      '/stocks/alertes',
      'Réapprovisionner',
      v_user.id,
      NEW.product_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_notification_on_stock_alert_insert
  AFTER INSERT ON stock_alert_tracking
  FOR EACH ROW
  WHEN (NEW.validated = false AND NEW.alert_priority >= 2)
  EXECUTE FUNCTION create_notification_on_stock_alert();
```

---

## 🎨 Interface Utilisateur

### Page /stocks/alertes

**Composants recommandés** :

```tsx
interface StockAlert {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    stock_real: number;
    min_stock: number;
    image_url: string;
  };
  alert_type: 'low_stock' | 'out_of_stock' | 'restock_needed';
  alert_priority: 1 | 2 | 3;
  stock_level_at_alert: number;
  validated: boolean;
  created_at: string;
}

export function StockAlertsPage() {
  const { data: alerts } = useQuery(['stock_alerts'], async () => {
    const { data } = await supabase
      .from('stock_alert_tracking')
      .select('*, product:products(*)')
      .eq('validated', false)
      .order('alert_priority', { ascending: false })
      .order('created_at', { ascending: false });
    return data;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Alertes Stock Critique</h1>

      {alerts?.map(alert => (
        <StockAlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

**StockAlertCard** :

```tsx
function StockAlertCard({ alert }: { alert: StockAlert }) {
  const priorityConfig = {
    3: { badge: 'urgent', color: 'red', icon: AlertCircle },
    2: { badge: 'important', color: 'orange', icon: AlertTriangle },
    1: { badge: 'info', color: 'blue', icon: Info },
  }[alert.alert_priority];

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Image produit */}
        <Image
          src={alert.product.image_url}
          width={80}
          height={80}
          className="rounded-lg"
        />

        <div className="flex-1">
          {/* Header : Nom + Badge Priority */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{alert.product.name}</h3>
            <Badge severity={priorityConfig.badge}>
              {priorityConfig.badge}
            </Badge>
          </div>

          {/* SKU */}
          <p className="text-sm text-muted">SKU: {alert.product.sku}</p>

          {/* Stock Info */}
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-xs text-muted">Stock Actuel</p>
              <p className="text-2xl font-bold text-danger">
                {alert.product.stock_real}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Seuil Minimum</p>
              <p className="text-2xl font-semibold">
                {alert.product.min_stock}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button variant="primary" size="sm">
              Créer Commande Fournisseur
            </Button>
            <Button variant="secondary" size="sm">
              Ajuster Seuil
            </Button>
            <Button variant="ghost" size="sm">
              Marquer Résolu
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## 📊 Requêtes Utiles

### Query 1 : Alertes Actives par Priorité

```sql
SELECT
  p.name,
  p.sku,
  p.stock_real,
  p.min_stock,
  sa.alert_type,
  sa.alert_priority,
  sa.created_at
FROM stock_alert_tracking sa
JOIN products p ON sa.product_id = p.id
WHERE sa.validated = FALSE
ORDER BY sa.alert_priority DESC, sa.created_at DESC;
```

### Query 2 : Historique Alertes Produit

```sql
SELECT
  sa.alert_type,
  sa.alert_priority,
  sa.stock_level_at_alert,
  sa.min_stock_threshold,
  sa.validated,
  sa.validated_at,
  sa.created_at
FROM stock_alert_tracking sa
WHERE sa.product_id = '{product_uuid}'
ORDER BY sa.created_at DESC
LIMIT 10;
```

### Query 3 : Top 10 Produits Alertes Fréquentes

```sql
SELECT
  p.name,
  p.sku,
  COUNT(*) as alert_count,
  MAX(sa.created_at) as last_alert_date
FROM stock_alert_tracking sa
JOIN products p ON sa.product_id = p.id
WHERE sa.created_at > now() - interval '30 days'
GROUP BY p.id, p.name, p.sku
ORDER BY alert_count DESC
LIMIT 10;
```

### Query 4 : Statistiques Alertes Global

```sql
SELECT
  COUNT(*) FILTER (WHERE validated = FALSE) as alertes_actives,
  COUNT(*) FILTER (WHERE validated = FALSE AND alert_priority = 3) as alertes_urgentes,
  COUNT(*) FILTER (WHERE validated = FALSE AND alert_priority = 2) as alertes_importantes,
  COUNT(*) FILTER (WHERE validated = TRUE) as alertes_resolues,
  ROUND(AVG(EXTRACT(EPOCH FROM (validated_at - created_at)) / 3600), 2) as temps_moyen_resolution_heures
FROM stock_alert_tracking
WHERE created_at > now() - interval '30 days';
```

---

## 🧪 Tests Validation

### Test 1 : Créer Alerte Stock Faible

```sql
-- 1. Sélectionner produit test
SELECT id, name, sku, stock_real, min_stock
FROM products
WHERE sku = 'CANAPE-STOCKHOLM-001';

-- 2. Définir seuil minimum
UPDATE products
SET min_stock = 10, stock_real = 15
WHERE sku = 'CANAPE-STOCKHOLM-001';

-- 3. Simuler vente (stock passe sous seuil)
UPDATE products
SET stock_real = 3
WHERE sku = 'CANAPE-STOCKHOLM-001';

-- 4. Vérifier alerte créée dans stock_alert_tracking
SELECT * FROM stock_alert_tracking
WHERE product_id = (SELECT id FROM products WHERE sku = 'CANAPE-STOCKHOLM-001')
ORDER BY created_at DESC LIMIT 1;

-- ✅ Résultat attendu :
-- alert_type: 'low_stock'
-- alert_priority: 2 (important) ou 3 (urgent)
-- stock_level_at_alert: 3
-- min_stock_threshold: 10
-- validated: FALSE

-- 5. Vérifier notification créée
SELECT * FROM notifications
WHERE related_product_id = (SELECT id FROM products WHERE sku = 'CANAPE-STOCKHOLM-001')
ORDER BY created_at DESC LIMIT 1;

-- ✅ Résultat attendu :
-- title: 'Stock Faible' ou 'Rupture Stock'
-- severity: 'important' ou 'urgent'
-- action_url: '/stocks/alertes'
-- related_product_id: {uuid} (non NULL)
```

### Test 2 : Résolution Automatique Alerte

```sql
-- 1. Réapprovisionner produit
UPDATE products
SET stock_real = 50
WHERE sku = 'CANAPE-STOCKHOLM-001';

-- 2. Vérifier alerte validée automatiquement
SELECT * FROM stock_alert_tracking
WHERE product_id = (SELECT id FROM products WHERE sku = 'CANAPE-STOCKHOLM-001')
  AND validated = TRUE
ORDER BY validated_at DESC LIMIT 1;

-- ✅ Résultat attendu :
-- validated: TRUE
-- validated_at: (timestamp récent)
-- notes: 'Stock restauré automatiquement'
```

---

## 📞 Fichiers Associés

### Migrations SQL

- `supabase/migrations/20251105_106_cleanup_obsolete_triggers_audit_complet.sql` (Suppression triggers legacy)
- `supabase/migrations/20251105_112_stock_alerts_to_notifications.sql` (Création système stock_alert_tracking)
- `supabase/migrations/20251110_001_notifications_cascade_delete_system.sql` (CASCADE DELETE)

### Code Source

- `src/app/stocks/alertes/page.tsx` (Page alertes stock)
- `packages/@verone/stock/src/hooks/use-stock-alerts.ts` (Hooks React)
- `packages/@verone/notifications/src/hooks/use-database-notifications.ts` (Notifications)

### Documentation Associée

- `docs/business-rules/06-stocks/alertes/guide-configuration-seuils.md` (Guide utilisateur)
- `docs/database/cascade-delete-notifications.md` (CASCADE DELETE)
- `docs/business-rules/15-notifications/cascade-delete-system.md` (Règles métier)

---

## 📅 Historique

| Date       | Modification                                          | Auteur      |
| ---------- | ----------------------------------------------------- | ----------- |
| 2025-11-05 | Création système stock_alert_tracking (migration 112) | Claude Code |
| 2025-11-05 | Suppression triggers legacy (migration 106)           | Claude Code |
| 2025-11-10 | Ajout CASCADE DELETE avec FK related_product_id       | Claude Code |
| 2025-11-10 | Documentation architecture complète                   | Claude Code |

---

**Statut** : ✅ PRODUCTION-READY - Système actif et fonctionnel
**Version** : 2.0.0
**Mainteneur** : Romeo Dos Santos
