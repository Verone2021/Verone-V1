# Workflow Notifications Commandes - Système Complet

**Module** : Commandes (Clients + Fournisseurs)
**Date création** : 2025-11-10
**Statut** : ✅ ACTIF - 13 triggers fonctionnels
**Version** : 2.0 (URLs dynamiques avec ?id={uuid})

---

## 🎯 Vue d'Ensemble

Le système de notifications commandes génère automatiquement des notifications pour tous les événements importants du cycle de vie des commandes clients et fournisseurs.

### Statistiques Système

- **13 triggers actifs** (5 clients + 5 fournisseurs + 3 expéditions)
- **URLs dynamiques** : Redirection directe vers modal avec ?id={uuid}
- **Temps réel** : Notifications affichées instantanément via Supabase Realtime
- **CASCADE DELETE** : Notifications supprimées automatiquement si commande supprimée

---

## 📋 Commandes Clients (5 Triggers)

### 1. Commande Validée

**Trigger** : `trigger_order_confirmed_notification`
**Fonction** : `notify_order_confirmed()`
**Événement** : `UPDATE sales_orders SET status = 'confirmed'`

```sql
CREATE OR REPLACE FUNCTION notify_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',                                      -- type
    'info',                                          -- severity
    'Commande validée',                              -- title
    'La commande ' || NEW.order_number || ' a été validée avec succès',  -- message
    '/commandes/clients?id=' || NEW.id,              -- ✅ action_url dynamique
    'Voir Détails',                                  -- action_label
    NULL,                                            -- related_product_id
    NEW.id,                                          -- ✅ related_sales_order_id (CASCADE DELETE)
    NULL                                             -- related_purchase_order_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Exemple notification UI** :

- **Title** : "Commande validée"
- **Message** : "La commande SO-2025-001 a été validée avec succès"
- **Bouton** : "Voir Détails" → `/commandes/clients?id=abc123-def456`
- **Severity** : Info (badge bleu)

### 2. Paiement Reçu

**Trigger** : `trigger_payment_received_notification`
**Fonction** : `notify_payment_received()`
**Événement** : `UPDATE sales_orders SET payment_status = 'paid'`

```sql
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'info',
    'Paiement reçu',
    'Le paiement de la commande ' || NEW.order_number || ' a été reçu',
    '/commandes/clients?id=' || NEW.id,
    'Voir Commande',
    NULL,
    NEW.id,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Commande Expédiée

**Trigger** : `trigger_order_shipped_notification`
**Fonction** : `notify_order_shipped()`
**Événement** : `UPDATE sales_orders SET shipping_status = 'shipped'`

```sql
CREATE OR REPLACE FUNCTION notify_order_shipped()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'info',
    'Commande expédiée',
    'La commande ' || NEW.order_number || ' a été expédiée',
    '/commandes/clients?id=' || NEW.id,
    'Suivre Expédition',
    NULL,
    NEW.id,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4. Commande Livrée

**Trigger** : `trigger_order_delivered_notification`
**Fonction** : `notify_order_delivered()`
**Événement** : `UPDATE sales_orders SET shipping_status = 'delivered'`

```sql
CREATE OR REPLACE FUNCTION notify_order_delivered()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'info',
    'Commande livrée',
    'La commande ' || NEW.order_number || ' a été livrée au client',
    '/commandes/clients?id=' || NEW.id,
    'Voir Détails',
    NULL,
    NEW.id,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5. Commande Annulée

**Trigger** : `trigger_order_cancelled_notification`
**Fonction** : `notify_order_cancelled()`
**Événement** : `UPDATE sales_orders SET status = 'cancelled'`

```sql
CREATE OR REPLACE FUNCTION notify_order_cancelled()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'important',                                     -- ⚠️ severity important (orange)
    'Commande annulée',
    'La commande ' || NEW.order_number || ' a été annulée',
    '/commandes/clients?id=' || NEW.id,
    'Voir Motif',
    NULL,
    NEW.id,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📦 Commandes Fournisseurs (5 Triggers)

### 1. Commande Fournisseur Créée

**Trigger** : `trigger_po_created_notification`
**Fonction** : `notify_po_created()`
**Événement** : `INSERT INTO purchase_orders`

```sql
CREATE OR REPLACE FUNCTION notify_po_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'info',
    'Commande fournisseur créée',
    'La commande fournisseur ' || NEW.po_number || ' a été créée',
    '/commandes/fournisseurs?id=' || NEW.id,
    'Voir Commande',
    NULL,
    NULL,
    NEW.id                                           -- ✅ related_purchase_order_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Commande Fournisseur Confirmée

**Trigger** : `trigger_po_confirmed_notification`
**Fonction** : `notify_po_confirmed()`
**Événement** : `UPDATE purchase_orders SET status = 'confirmed'`

```sql
CREATE OR REPLACE FUNCTION notify_po_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'info',
    'Commande fournisseur confirmée',
    'Le fournisseur a confirmé la commande ' || NEW.po_number,
    '/commandes/fournisseurs?id=' || NEW.id,
    'Voir Détails',
    NULL,
    NULL,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Réception Complète

**Trigger** : `trigger_po_received_notification`
**Fonction** : `notify_po_received()`
**Événement** : `UPDATE purchase_orders SET reception_status = 'received'`

```sql
CREATE OR REPLACE FUNCTION notify_po_received()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'info',
    'Commande fournisseur reçue',
    'La commande ' || NEW.po_number || ' a été intégralement réceptionnée',
    '/commandes/fournisseurs?id=' || NEW.id,
    'Voir Réception',
    NULL,
    NULL,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4. Réception Partielle

**Trigger** : `trigger_po_partial_received_notification`
**Fonction** : `notify_po_partial_received()`
**Événement** : `UPDATE purchase_orders SET reception_status = 'partial'`

```sql
CREATE OR REPLACE FUNCTION notify_po_partial_received()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'important',                                     -- ⚠️ severity important
    'Réception partielle',
    'La commande ' || NEW.po_number || ' a été partiellement réceptionnée',
    '/commandes/fournisseurs?id=' || NEW.id,
    'Voir Manquants',
    NULL,
    NULL,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5. Commande Retardée

**Trigger** : `trigger_po_delayed_notification`
**Fonction** : `notify_po_delayed()`
**Événement** : `UPDATE purchase_orders WHERE expected_date < now() AND status != 'received'`

```sql
CREATE OR REPLACE FUNCTION notify_po_delayed()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification_for_owners(
    'business',
    'urgent',                                        -- 🚨 severity urgent (rouge)
    'Commande fournisseur en retard',
    'La commande ' || NEW.po_number || ' n''a pas été reçue à la date prévue',
    '/commandes/fournisseurs?id=' || NEW.id,
    'Contacter Fournisseur',
    NULL,
    NULL,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 Workflow Complet : Cycle de Vie Commande Client

### Exemple Concret : Commande SO-2025-001

```
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : Création Commande (status='draft')               │
│  - Aucune notification                                       │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : Validation Commande (status='confirmed')         │
│  - Trigger: trigger_order_confirmed_notification            │
│  - Notification: "Commande validée"                          │
│  - Action: /commandes/clients?id=abc123                      │
│  - related_sales_order_id = abc123 ✅                        │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : Paiement Reçu (payment_status='paid')            │
│  - Trigger: trigger_payment_received_notification           │
│  - Notification: "Paiement reçu"                             │
│  - Action: /commandes/clients?id=abc123                      │
│  - related_sales_order_id = abc123 ✅                        │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 : Expédition (shipping_status='shipped')           │
│  - Trigger: trigger_order_shipped_notification              │
│  - Notification: "Commande expédiée"                         │
│  - Action: /commandes/clients?id=abc123                      │
│  - related_sales_order_id = abc123 ✅                        │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 : Livraison (shipping_status='delivered')          │
│  - Trigger: trigger_order_delivered_notification            │
│  - Notification: "Commande livrée"                           │
│  - Action: /commandes/clients?id=abc123                      │
│  - related_sales_order_id = abc123 ✅                        │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  RÉSULTAT : 4 notifications créées pour SO-2025-001         │
│  - Toutes avec FK related_sales_order_id                    │
│  - Si commande supprimée → CASCADE DELETE automatique       │
└─────────────────────────────────────────────────────────────┘
```

**Total notifications possibles pour 1 commande client** : 5 (validation, paiement, expédition, livraison, annulation)

---

## 🎨 Design System Notifications UI

### Badge Severity

Les notifications utilisent 3 niveaux de severity avec codes couleur Design System V2 :

| Severity      | Couleur        | Badge     | Usage Commandes                                              |
| ------------- | -------------- | --------- | ------------------------------------------------------------ |
| **info**      | Bleu #3b86d1   | Info      | Validée, Payée, Expédiée, Livrée, PO Créée, Confirmée, Reçue |
| **important** | Orange #ff9b3e | Important | Annulée, Réception Partielle                                 |
| **urgent**    | Rouge #ff4d6b  | Urgent    | Commande Retardée                                            |

### Boutons Actions

**Composant** : `ButtonV2` (Design System V2)

- **Variant** : `default` (Bleu #3b86d1)
- **Size** : `sm` (32px height)
- **Icône** : `ExternalLink` (Lucide React)

**Code** :

```tsx
<Button
  variant="default"
  size="sm"
  onClick={() => {
    window.location.href = notification.action_url; // Redirection
  }}
>
  {notification.action_label}
  <ExternalLink className="ml-1 h-3 w-3" />
</Button>
```

### Layout Notification Card

```tsx
<div className="p-3 border-b hover:bg-neutral-50">
  {/* Badge non lu */}
  {!notification.read && (
    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary-500" />
  )}

  {/* Icône + Contenu */}
  <div className="flex items-start gap-3">
    <NotificationIcon type={type} severity={severity} />{' '}
    {/* CheckCircle, Info, AlertCircle */}
    <div className="flex-1">
      {/* Header : Titre + Badge Severity */}
      <h4 className="font-semibold text-[15px]">{notification.title}</h4>
      <SeverityBadge severity={severity} />

      {/* Timestamp */}
      <p className="text-xs text-muted">{timeAgo}</p>

      {/* Message */}
      <p className="text-sm text-subtle">{notification.message}</p>

      {/* Actions */}
      <Button variant="default" size="sm">
        Voir Détails
      </Button>
      <Button variant="ghost" size="icon">
        Marquer lu
      </Button>
      <Button variant="ghost" size="icon">
        Supprimer
      </Button>
    </div>
  </div>
</div>
```

---

## 🔗 URLs Dynamiques & Redirections

### Pattern URL Dynamique (Fix 30 Oct 2025)

**Migration** : `20251030_002_fix_notification_urls_dynamic_ids.sql`

**AVANT** (URLs statiques) :

```sql
action_url: '/commandes/clients'  -- ❌ Page liste générale
```

**APRÈS** (URLs dynamiques) :

```sql
action_url: '/commandes/clients?id=' || NEW.id  -- ✅ Modal auto-ouverture
```

### Workflow Redirection Complète

```
┌─────────────────────────────────────────────────────────────┐
│  USER : Clique sur notification "Commande SO-2025-001"      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  UI : NotificationsDropdown                                  │
│  - onClick() → window.location.href = action_url            │
│  - Redirection : /commandes/clients?id=abc123-def456         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  PAGE : /commandes/clients                                   │
│  - useSearchParams().get('id')                               │
│  - orderId = 'abc123-def456'                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  HOOK : useEffect(() => {                                    │
│    if (orderId) {                                            │
│      handleOpenOrderDetails(orderId);  // Ouvrir modal       │
│    }                                                         │
│  }, [orderId])                                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  MODAL : Détails Commande SO-2025-001                       │
│  - Chargement données : useQuery(['sales_order', orderId])  │
│  - Affichage : Numéro, Client, Montant, Statuts, Items      │
│  - Actions : Modifier, Expédier, Annuler                    │
└─────────────────────────────────────────────────────────────┘
```

**Code page commandes/clients** :

```tsx
'use client';

export default function CommandesClientsPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (orderId) {
      setIsModalOpen(true); // ✅ Ouvrir modal automatiquement
    }
  }, [orderId]);

  return (
    <>
      <DataTable data={orders} columns={columns} />

      {isModalOpen && (
        <OrderDetailsModal
          orderId={orderId}
          onClose={() => {
            setIsModalOpen(false);
            // Supprimer ?id= de l'URL
            router.push('/commandes/clients');
          }}
        />
      )}
    </>
  );
}
```

---

## 🧪 Tests Validation Fonctionnels

### Test 1 : Commande Client Validée

**Objectif** : Vérifier notification créée avec FK et URL dynamique

```sql
-- 1. Créer commande draft
INSERT INTO sales_orders (
  order_number, customer_id, status, payment_status, shipping_status
) VALUES (
  'TEST-SO-001', (SELECT id FROM organisations WHERE type='customer' LIMIT 1),
  'draft', 'pending', 'pending'
);

-- 2. Valider commande (déclenche trigger)
UPDATE sales_orders
SET status = 'confirmed'
WHERE order_number = 'TEST-SO-001';

-- 3. Vérifier notification créée
SELECT
  id, title, message, severity, action_url, related_sales_order_id
FROM notifications
WHERE title = 'Commande validée'
ORDER BY created_at DESC
LIMIT 1;

-- ✅ Résultat attendu :
-- title: 'Commande validée'
-- message: 'La commande TEST-SO-001 a été validée avec succès'
-- severity: 'info'
-- action_url: '/commandes/clients?id={uuid}'
-- related_sales_order_id: {uuid} (non NULL)
```

### Test 2 : CASCADE DELETE

**Objectif** : Vérifier suppression automatique notifications si commande supprimée

```sql
-- 1. Compter notifications pour commande TEST-SO-001
SELECT COUNT(*) FROM notifications
WHERE related_sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'TEST-SO-001');
-- Résultat : 1 notification

-- 2. Supprimer commande
DELETE FROM sales_orders WHERE order_number = 'TEST-SO-001';

-- 3. Vérifier notifications supprimées automatiquement
SELECT COUNT(*) FROM notifications
WHERE related_sales_order_id = '{uuid-ancien}';
-- ✅ Résultat attendu : 0 (CASCADE DELETE automatique)
```

### Test 3 : Redirection UI Browser

**Objectif** : Tester workflow complet redirection modal

**Procédure MCP Playwright** :

```typescript
// 1. Naviguer vers dashboard
await browser_navigate('http://localhost:3000/dashboard');

// 2. Ouvrir dropdown notifications
await browser_click('[title*="notifications"]'); // Bell icon

// 3. Screenshot modal notifications
await browser_take_screenshot('test-notifications-modal.png');

// 4. Vérifier console errors = 0
const errors = await browser_console_messages();
// ✅ Attendu : errors.length === 0

// 5. Cliquer sur bouton "Voir Détails" première notification commande
await browser_click('button:has-text("Voir Détails")');

// 6. Attendre redirection
await browser_wait_for({ time: 2 });

// 7. Vérifier URL contient ?id=
const url = await browser_evaluate({ function: '() => window.location.href' });
// ✅ Attendu : url.includes('/commandes/clients?id=')

// 8. Vérifier modal s'ouvre automatiquement
await browser_snapshot();
// ✅ Attendu : Modal visible avec détails commande
```

---

## 📊 Métriques & Monitoring

### KPI Notifications Commandes

**Requête SQL métriques** :

```sql
SELECT
  COUNT(*) FILTER (WHERE type='business' AND message LIKE '%commande%') as total_notifications_commandes,
  COUNT(*) FILTER (WHERE related_sales_order_id IS NOT NULL) as notifications_commandes_clients,
  COUNT(*) FILTER (WHERE related_purchase_order_id IS NOT NULL) as notifications_commandes_fournisseurs,
  COUNT(*) FILTER (WHERE read = true AND type='business') as notifications_lues,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60), 2) as temps_moyen_lecture_minutes
FROM notifications
WHERE created_at > now() - interval '30 days';
```

**Cibles Performance** :

- Taux lecture >60% (users consultent notifications)
- Temps moyen lecture <10 minutes (réactivité)
- Taux orphelines <5% (CASCADE DELETE efficace)

### Dashboard Admin Recommandé

**Page `/admin/notifications/stats`** :

- Total notifications commandes 30j
- Distribution par type (clients vs fournisseurs)
- Top 10 commandes avec plus de notifications
- Taux ouverture par severity (info, important, urgent)
- Temps moyen entre création notification et lecture

---

## 📞 Fichiers Associés

### Migrations SQL

- `supabase/migrations/20251012_002_notification_triggers.sql` (Création initiale triggers)
- `supabase/migrations/20251030_002_fix_notification_urls_dynamic_ids.sql` (Fix URLs dynamiques)
- `supabase/migrations/20251110_001_notifications_cascade_delete_system.sql` (CASCADE DELETE)

### Code Source

- `packages/@verone/notifications/src/hooks/use-database-notifications.ts` (Hooks React)
- `packages/@verone/notifications/src/components/dropdowns/NotificationsDropdown.tsx` (UI)
- `src/app/commandes/clients/page.tsx` (Page redirections)
- `src/app/commandes/fournisseurs/page.tsx` (Page redirections)

### Documentation Associée

- `docs/database/cascade-delete-notifications.md` (Architecture CASCADE DELETE)
- `docs/business-rules/15-notifications/cascade-delete-system.md` (Règles métier)
- `docs/database/triggers.md` (Liste exhaustive triggers)

---

## 📅 Historique Modifications

| Date       | Modification                                            | Auteur      |
| ---------- | ------------------------------------------------------- | ----------- |
| 2025-10-12 | Création triggers notifications commandes (13 au total) | Claude Code |
| 2025-10-30 | Fix URLs dynamiques avec ?id={uuid}                     | Claude Code |
| 2025-11-10 | Ajout CASCADE DELETE avec FK optionnelles               | Claude Code |
| 2025-11-10 | Documentation workflow complet                          | Claude Code |

---

**Statut** : ✅ PRODUCTION-READY - Système 100% fonctionnel
**Version** : 2.0.0
**Mainteneur** : Romeo Dos Santos
