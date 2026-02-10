# Workflow Complet Purchase Orders (Commandes Fournisseurs)

**Date création** : 2025-11-19
**Dernière mise à jour** : 2025-11-19
**Statut** : ✅ Actif en production
**Version** : 1.0.0

---

## 📋 Vue d'Ensemble

Le workflow des commandes fournisseurs (purchase orders) suit un processus en **3 phases principales** optimisé pour la gestion des approvisionnements et le système d'alertes stock.

### Workflow Principal (3 étapes)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   BROUILLON │─────>│   VALIDÉE   │─────>│ RÉCEPTIONNÉE│
│   (draft)   │      │ (validated) │      │ (received)  │
└─────────────┘      └─────────────┘      └─────────────┘
      🔴                    🟢                    ✅
   Alerte RED         Alerte GREEN          Alerte OFF
```

### Statuts Disponibles (Enum PostgreSQL)

```sql
CREATE TYPE purchase_order_status AS ENUM (
  'draft',               -- 1. Brouillon (éditable, supprimable)
  'validated',           -- 2. Validée (alerte stock verte)
  'sent',                -- 3. Envoyée (legacy - pour commandes clients)
  'confirmed',           -- 4. Confirmée (legacy)
  'partially_received',  -- 5. Partiellement reçue
  'received',            -- 6. Complètement reçue
  'cancelled'            -- 7. Annulée (retour état initial)
);
```

**Source** : `supabase/migrations/20251119_004_add_validated_status_to_purchase_orders.sql`

---

## 🎯 Phase 1 : BROUILLON (draft)

### Caractéristiques

- **État initial** : Commande en cours de création
- **Modifiable** : ✅ Tous les champs (supplier, items, dates, notes)
- **Supprimable** : ✅ Oui (suppression directe autorisée)
- **Impact stock** : ❌ Aucun impact sur stock prévisionnel

### Système Alertes Stock

**Couleur** : 🔴 **ROUGE** (alerte active - besoin approvisionnement)

**Logique** :

```typescript
// Produit en rupture + commande draft = Alerte ROUGE
if (
  product.stock_real <= product.alert_threshold &&
  purchase_order.status === 'draft'
) {
  alert.color = 'RED';
  alert.message = 'Stock critique - Commande en brouillon';
  alert.action = 'Valider la commande';
}
```

### Actions Disponibles

| Action        | Disponible | Résultat                                      |
| ------------- | ---------- | --------------------------------------------- |
| **Éditer**    | ✅ Oui     | Ouvre modal `PurchaseOrderFormModal`          |
| **Valider**   | ✅ Oui     | Passe à statut `validated`                    |
| **Annuler**   | ✅ Oui     | Passe à statut `cancelled`                    |
| **Supprimer** | ✅ Oui     | Suppression définitive (CASCADE DELETE items) |

### Permissions

| Rôle      | Créer | Éditer | Supprimer | Valider |
| --------- | ----- | ------ | --------- | ------- |
| **Owner** | ✅    | ✅     | ✅        | ✅      |
| **Admin** | ✅    | ✅     | ✅        | ✅      |

---

## ✅ Phase 2 : VALIDATION (validated)

### Caractéristiques

- **Commande validée** : Prête à être envoyée au fournisseur
- **Modifiable** : ⚠️ Restreint (voir règles ci-dessous)
- **Supprimable** : ❌ Non (doit être annulée d'abord)
- **Impact stock** : ✅ **stock_forecasted_in += quantity** (réservation prévisionnel)

### Système Alertes Stock

**Couleur** : 🟢 **VERTE** (commande en cours - approvisionnement planifié)

**Logique** :

```typescript
// Produit en rupture + commande validated = Alerte VERTE
if (
  product.stock_real <= product.alert_threshold &&
  purchase_order.status === 'validated'
) {
  alert.color = 'GREEN';
  alert.message = 'Commande validée en cours';
  alert.details = `${purchase_order.total_quantity} unités attendues`;
  alert.eta = purchase_order.expected_delivery_date;
}
```

### Règles de Validation

#### 1. Timestamps Obligatoires

```sql
-- Contrainte PostgreSQL : valid_workflow_timestamps
CONSTRAINT valid_workflow_timestamps CHECK (
  (status = 'draft' OR validated_at IS NOT NULL)
)
```

**Champs mis à jour automatiquement** (Server Action) :

```typescript
if (newStatus === 'validated') {
  updateFields.validated_at = new Date().toISOString();
  updateFields.validated_by = userId;
}
```

#### 2. Conditions Pré-validation

- ✅ Fournisseur sélectionné (`supplier_id NOT NULL`)
- ✅ Au moins 1 item (`purchase_order_items.length > 0`)
- ✅ Tous les items ont `quantity > 0`
- ✅ Tous les items ont `unit_price_ht >= 0`
- ⚠️ `expected_delivery_date` recommandée (optionnelle)

#### 3. Impact Stock Prévisionnel

**Trigger automatique** : `purchase_order_forecast_trigger`

```sql
-- Ajout au stock prévisionnel entrant
FOR EACH item IN purchase_order_items LOOP
  INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity,
    affects_forecast,
    reference_type,
    reference_id
  ) VALUES (
    item.product_id,
    'IN',
    item.quantity,
    TRUE,  -- Affects forecast
    'purchase_order',
    purchase_order.id
  );
END LOOP;

-- Calcul automatique stock_forecasted_in
stock_forecasted_in =
  SUM(quantity WHERE movement_type='IN' AND affects_forecast=TRUE) -
  SUM(quantity WHERE movement_type='OUT' AND affects_forecast=TRUE);
```

**Source** : `docs/workflows/partial-shipments-receptions.md:32-88`

### Actions Disponibles

| Action           | Disponible | Résultat                                         |
| ---------------- | ---------- | ------------------------------------------------ |
| **Éditer**       | ⚠️ Limité  | Seulement notes, expected_delivery_date          |
| **Réceptionner** | ✅ Oui     | Ouvre modal `PurchaseReceptionModal`             |
| **Dévalider**    | ✅ Oui     | Retour à `draft` (stock_forecasted_in annulé)    |
| **Annuler**      | ✅ Oui     | Passe à `cancelled` (stock_forecasted_in annulé) |
| **Supprimer**    | ❌ Non     | Doit être annulée d'abord                        |

### Permissions

| Rôle      | Éditer Notes | Réceptionner | Dévalider | Annuler |
| --------- | ------------ | ------------ | --------- | ------- |
| **Owner** | ✅           | ✅           | ✅        | ✅      |
| **Admin** | ✅           | ✅           | ✅        | ✅      |

---

## 📦 Phase 3 : RÉCEPTION (received / partially_received)

### Caractéristiques

- **Marchandise reçue** : Stock physique mis à jour
- **Modifiable** : ❌ Non (commande fermée)
- **Supprimable** : ❌ Non
- **Impact stock** : ✅ **stock_real += quantity_received** (stock physique)

### Système Alertes Stock

**Couleur** : ✅ **DISPARAÎT** (besoin satisfait)

**Logique** :

```typescript
// Alerte disparaît dès que stock > seuil grâce à réception
if (product.stock_real > product.alert_threshold) {
  // Alerte ne s'affiche plus dans StockAlertCard
  return null;
}
```

### Réception Complète (received)

**Trigger** : Tous les items ont `quantity_received === quantity`

```typescript
// Mouvements stock créés automatiquement
FOR EACH item IN purchase_order_items LOOP
  // 1. Retrait prévisionnel (conversion prévisionnel → réel)
  INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity,
    affects_forecast
  ) VALUES (
    item.product_id,
    'OUT',
    item.quantity,
    TRUE  // Retire du prévisionnel
  );

  // 2. Ajout stock réel
  INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity,
    affects_forecast
  ) VALUES (
    item.product_id,
    'IN',
    item.quantity,
    FALSE  // Ajoute au stock réel
  );
END LOOP;

-- Mise à jour timestamps
UPDATE purchase_orders SET
  status = 'received',
  received_at = NOW(),
  received_by = current_user_id
WHERE id = purchase_order_id;
```

**Impact final** :

- ✅ `stock_forecasted_in -= total_quantity` (retrait prévisionnel)
- ✅ `stock_real += total_quantity` (ajout stock physique)

### Réception Partielle (partially_received)

**Trigger** : Au moins 1 item a `quantity_received > 0` ET `quantity_received < quantity`

**Système de calcul différentiel automatique** :

```typescript
// Exemple concret: Commande de 100 unités

// Réception 1: 40 unités
reception_1.quantity_received = 40;
// → stock_forecasted_in -= 40
// → stock_real += 40

// Réception 2: 75 unités TOTAL (pas +75, mais total cumulé)
reception_2.quantity_received = 75;
// Trigger calcule: 75 - 40 = 35 unités supplémentaires
// → stock_forecasted_in -= 35
// → stock_real += 35

// Réception 3: 100 unités TOTAL (complet)
reception_3.quantity_received = 100;
// Trigger calcule: 100 - 75 = 25 unités restantes
// → stock_forecasted_in -= 25
// → stock_real += 25
// → status passe à 'received' (complet)
```

**Source** : `docs/workflows/partial-shipments-receptions.md:32-88`

### Actions Disponibles

| Action           | Disponible    | Résultat                                 |
| ---------------- | ------------- | ---------------------------------------- |
| **Éditer**       | ❌ Non        | Commande fermée                          |
| **Réceptionner** | ⚠️ Si partiel | Réception supplémentaire jusqu'à complet |
| **Annuler**      | ❌ Non        | Impossible si reçue                      |
| **Supprimer**    | ❌ Non        | Archivage automatique après 90 jours     |

---

## 🚫 Phase ANNULATION (cancelled)

### Caractéristiques

- **Commande annulée** : Workflow interrompu
- **Modifiable** : ❌ Non
- **Supprimable** : ❌ Non
- **Impact stock** : ✅ Annulation stock_forecasted_in si depuis `validated`

### Système Alertes Stock

**Couleur** : 🔴 **ROUGE** (retour état initial - besoin approvisionnement)

**Logique** :

```typescript
// Annulation commande = Retour alerte ROUGE
if (
  product.stock_real <= product.alert_threshold &&
  purchase_order.status === 'cancelled'
) {
  alert.color = 'RED';
  alert.message = 'Stock critique - Commande annulée';
  alert.action = 'Commander'; // Bouton "Commander" réactivé
}
```

### Règles d'Annulation

#### 1. Annulation depuis BROUILLON (draft → cancelled)

✅ **Autorisée** - Pas d'impact stock

```typescript
// Annulation directe autorisée
if (purchase_order.status === 'draft') {
  await updateStatus(id, 'cancelled', userId);
  // Aucun rollback stock (pas encore de mouvement)
}
```

#### 2. Annulation depuis VALIDÉE (validated → cancelled)

✅ **Autorisée** - Rollback stock_forecasted_in

```typescript
// Trigger automatique d'annulation stock
ON UPDATE purchase_orders
WHEN NEW.status = 'cancelled' AND OLD.status = 'validated'
FOR EACH item IN purchase_order_items LOOP
  -- Annuler le prévisionnel
  INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity,
    affects_forecast,
    notes
  ) VALUES (
    item.product_id,
    'OUT',
    item.quantity,
    TRUE,
    'Annulation commande fournisseur'
  );
END LOOP;
```

**Impact** :

- ✅ `stock_forecasted_in -= total_quantity` (annulation réservation)
- ✅ Alerte stock repasse de 🟢 VERTE à 🔴 ROUGE

#### 3. Annulation depuis REÇUE (received → cancelled)

❌ **INTERDITE** - Commande déjà physiquement réceptionnée

```sql
-- Contrainte PostgreSQL (à ajouter)
CONSTRAINT no_cancellation_if_received CHECK (
  (status = 'cancelled' AND received_at IS NULL) OR
  status != 'cancelled'
)
```

**Erreur retournée** :

```typescript
{
  code: 'CANCELLATION_BLOCKED_RECEIVED',
  message: 'Impossible d\'annuler une commande déjà reçue',
  suggestion: 'Créer un avoir ou ajustement stock si nécessaire'
}
```

### Workflow Dévalidation (Best Practice)

**Recommandation** : Dévalider avant annuler (2-step process)

```
validated → draft → cancelled
```

**Avantages** :

- ✅ Permet modification/correction avant annulation définitive
- ✅ Traçabilité claire (2 mouvements distincts)
- ✅ Aligné avec best practices ERP (SAP, Dynamics 365)

**Code** :

```typescript
// Étape 1: Dévalidation
await updateStatus(id, 'draft', userId);
// → stock_forecasted_in annulé automatiquement

// Étape 2: Annulation (si confirmée)
await updateStatus(id, 'cancelled', userId);
// → Pas d'impact stock supplémentaire (déjà annulé)
```

---

## 🔔 Notifications Automatiques

### Triggers Notifications Purchase Orders

**Source** : `docs/business-rules/07-commandes/notifications-workflow.md:164-294`

| Événement           | Trigger                                    | Destinataires  | Type      |
| ------------------- | ------------------------------------------ | -------------- | --------- |
| Commande créée      | `trigger_po_created_notification`          | Owner créateur | `info`    |
| Commande validée    | `trigger_po_confirmed_notification`        | Owner créateur | `success` |
| Réception complète  | `trigger_po_received_notification`         | Owner créateur | `success` |
| Réception partielle | `trigger_po_partial_received_notification` | Owner créateur | `info`    |
| Livraison retardée  | `trigger_po_delayed_notification`          | Owner créateur | `warning` |

### Format Notification

```typescript
{
  id: uuid,
  user_id: uuid,
  type: 'success' | 'info' | 'warning',
  title: 'Commande fournisseur validée',
  message: 'La commande PO-1234567890 a été validée avec succès',
  action_url: '/commandes/fournisseurs?id={purchase_order_id}',
  read: false,
  created_at: timestamp
}
```

---

## 🎨 Interface Utilisateur (UI/UX)

### Page Principale : /commandes/fournisseurs

**Fichier** : `apps/back-office/src/app/commandes/fournisseurs/page.tsx`

#### Onglets Filtres (8 onglets)

| Onglet          | Filtre               | Compteur                  |
| --------------- | -------------------- | ------------------------- |
| **Toutes**      | `all`                | Total commandes           |
| **Brouillon**   | `draft`              | 🔴 Commandes non validées |
| **Validée**     | `validated`          | 🟢 Commandes en cours     |
| **Envoyée**     | `sent`               | Legacy (clients)          |
| **Confirmée**   | `confirmed`          | Legacy                    |
| **Part. reçue** | `partially_received` | Réceptions en cours       |
| **Reçue**       | `received`           | Commandes complètes       |
| **Annulée**     | `cancelled`          | Commandes annulées        |

#### Boutons Actions par Statut

**BROUILLON (draft)** :

```typescript
<IconButton icon={Edit} label="Éditer la commande" />
<IconButton icon={CheckCircle} label="Valider la commande" />  // → validated
<IconButton icon={Ban} label="Annuler la commande" />          // → cancelled
<IconButton icon={Trash2} label="Supprimer" />                 // DELETE
```

**VALIDÉE (validated)** :

```typescript
<IconButton icon={Truck} label="Réceptionner la commande" />   // → Modal réception
<IconButton icon={RotateCcw} label="Dévalider (retour brouillon)" />  // → draft
<IconButton icon={Ban} label="Annuler la commande" />          // → cancelled
```

**PARTIELLEMENT REÇUE (partially_received)** :

```typescript
<IconButton icon={Truck} label="Réceptionner (suite)" />       // Modal réception
```

**REÇUE (received)** :

```typescript
// Aucune action (commande fermée)
```

### Modals

#### PurchaseOrderFormModal (Création/Édition)

**Composant** : `packages/@verone/orders/src/components/modals/PurchaseOrderFormModal.tsx`

**Fonctionnalités** :

- ✅ Sélection fournisseur (autocomplete organisations type='supplier')
- ✅ Ajout items (recherche produits avec stock actuel)
- ✅ Calcul automatique HT/TTC/Éco-taxe
- ✅ Conditions paiement (READ-ONLY hérité fournisseur)
- ✅ Expected delivery date (date picker)

**Validation** :

```typescript
const validation = {
  supplier_id: required,
  items: min(1),
  'items[].quantity': min(1),
  'items[].unit_price_ht': min(0),
  expected_delivery_date: optional,
};
```

#### PurchaseOrderDetailModal (Consultation)

**Composant** : `packages/@verone/orders/src/components/modals/PurchaseOrderDetailModal.tsx`

**Affichage** :

- ✅ Informations fournisseur (nom, email, téléphone)
- ✅ Liste items avec éco-taxe
- ✅ Totaux HT/TTC/Éco-taxe
- ✅ Conditions paiement (formaté ENUM)
- ✅ Dates workflow (created_at, validated_at, received_at)

#### PurchaseReceptionModal (Réception)

**Composant** : `packages/@verone/orders/src/components/modals/PurchaseReceptionModal.tsx`

**Fonctionnalités** :

- ✅ Tableau items avec quantity_received éditable
- ✅ Calcul automatique quantité restante
- ✅ Support réception partielle (save → `partially_received`)
- ✅ Support réception complète (all quantities → `received`)
- ✅ Validation : `quantity_received <= quantity`

---

## 🧪 Tests Fonctionnels Attendus

### Scénario 1 : Workflow Complet Standard

```gherkin
GIVEN une commande en brouillon avec 2 items
WHEN je valide la commande
THEN statut passe à 'validated'
AND validated_at est rempli
AND stock_forecasted_in augmente de total_quantity
AND alerte stock passe de 🔴 ROUGE à 🟢 VERTE

WHEN je réceptionne complètement la commande
THEN statut passe à 'received'
AND received_at est rempli
AND stock_forecasted_in diminue de total_quantity
AND stock_real augmente de total_quantity
AND alerte stock disparaît (stock > seuil)
```

### Scénario 2 : Réception Partielle

```gherkin
GIVEN une commande validée de 100 unités
WHEN je réceptionne 40 unités
THEN statut passe à 'partially_received'
AND stock_forecasted_in diminue de 40
AND stock_real augmente de 40

WHEN je réceptionne 75 unités TOTAL (35 supplémentaires)
THEN statut reste 'partially_received'
AND stock_forecasted_in diminue de 35 (différentiel)
AND stock_real augmente de 35

WHEN je réceptionne 100 unités TOTAL (25 restantes)
THEN statut passe à 'received'
AND stock_forecasted_in diminue de 25
AND stock_real augmente de 25
```

### Scénario 3 : Annulation depuis Validée

```gherkin
GIVEN une commande validée (stock_forecasted_in = +50)
AND alerte stock 🟢 VERTE

WHEN j'annule la commande
THEN statut passe à 'cancelled'
AND stock_forecasted_in diminue de 50 (rollback)
AND alerte stock repasse à 🔴 ROUGE
AND bouton "Commander" est réactivé
```

### Scénario 4 : Dévalidation (2-step)

```gherkin
GIVEN une commande validée
WHEN je clique "Dévalider (retour brouillon)"
THEN statut passe à 'draft'
AND stock_forecasted_in est annulé
AND alerte stock repasse à 🔴 ROUGE

WHEN je modifie des items
AND je clique "Annuler la commande"
THEN statut passe à 'cancelled'
AND aucun impact stock supplémentaire
```

---

## 📚 Références & Documentation Complémentaire

### Documents Liés

- **Réceptions Partielles** : `docs/workflows/partial-shipments-receptions.md`
- **Notifications Workflow** : `docs/business-rules/07-commandes/notifications-workflow.md`
- **Enums Database** : `docs/database/enums.md:535-637`
- **Triggers Stock** : `docs/database/triggers.md:1245-1274`

### Migrations SQL

- **Fondateur** : `20250916_004_create_stock_and_orders_tables.sql` (création initiale)
- **Statut validated** : `20251119_004_add_validated_status_to_purchase_orders.sql` (2025-11-19)

### Comparaison Sales Orders

| Critère                  | Purchase Orders (Fournisseurs) | Sales Orders (Clients)         |
| ------------------------ | ------------------------------ | ------------------------------ |
| **Workflow**             | draft → validated → received   | draft → confirmed → shipped    |
| **Alerte stock**         | 🔴→🟢→✅ (IN)                  | 🔴→🟢 (OUT)                    |
| **Stock impact**         | stock_forecasted_in            | stock_forecasted_out           |
| **Annulation**           | Si pas received                | Si pas paid + pas shipped      |
| **Réception/Expédition** | Réception partielle supportée  | Expédition partielle supportée |

**Source** : `docs/business-rules/07-commandes/expeditions/COMMANDES-WORKFLOW-VALIDATION-EXPEDITION.md`

---

## ✅ Checklist Pré-déploiement

### Tests Obligatoires

- [ ] Workflow complet : draft → validated → received
- [ ] Réception partielle (3 réceptions progressives)
- [ ] Annulation depuis draft
- [ ] Annulation depuis validated (rollback stock)
- [ ] Dévalidation (validated → draft)
- [ ] Vérification alerte stock (🔴→🟢→✅)
- [ ] Contrainte `valid_workflow_timestamps` respectée
- [ ] Notifications envoyées correctement
- [ ] Permissions Owner vs Admin

### Validation Database

- [ ] Enum `purchase_order_status` contient 'validated'
- [ ] Types TypeScript régénérés
- [ ] Migration appliquée en production
- [ ] Aucune erreur console (tolerance zéro)

---

**Auteur** : Romeo Dos Santos
**Dernière révision** : 2025-11-19
**Version document** : 1.0.0
