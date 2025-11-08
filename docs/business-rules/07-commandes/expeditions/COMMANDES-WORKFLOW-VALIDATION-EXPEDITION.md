# 📋 Règles Métier: Workflow Validation & Expédition Commandes

**Version:** 1.0
**Date:** 2025-10-11
**Statut:** ✅ Implémenté Phase 1
**Module:** Commandes Client

---

## 🎯 Vue d'Ensemble

Ce document définit les règles métier pour le workflow de validation et d'expédition des commandes client, avec distinction B2B (professionnels) et B2C (particuliers).

---

## 📊 États Commande (Status)

### Valeurs Enum: `sales_order_status`

| Status              | Label FR               | Description                           | Modifiable      | Actions disponibles                   |
| ------------------- | ---------------------- | ------------------------------------- | --------------- | ------------------------------------- |
| `draft`             | Brouillon              | Commande en création                  | ✅ Oui          | Valider, Modifier, Supprimer          |
| `confirmed`         | Validée                | Commande validée, en attente paiement | ⚠️ Si non payée | Modifier (si non payée), Marquer payé |
| `partially_shipped` | Partiellement expédiée | Expédition partielle effectuée        | ❌ Non          | Expédier reste                        |
| `shipped`           | Expédiée               | Commande expédiée complète            | ❌ Non          | Confirmer livraison                   |
| `delivered`         | Livrée                 | Commande livrée client                | ❌ Non          | -                                     |
| `cancelled`         | Annulée                | Commande annulée                      | ❌ Non          | -                                     |

---

## 💳 États Paiement (Payment Status)

### Valeurs: `payment_status`

| Payment Status | Label FR   | Description           | Peut expédier?              |
| -------------- | ---------- | --------------------- | --------------------------- |
| `pending`      | En attente | Paiement non reçu     | ⚠️ Si crédit autorisé (B2B) |
| `partial`      | Partiel    | Paiement partiel reçu | ❌ Non                      |
| `paid`         | Payé       | Paiement complet reçu | ✅ Oui                      |
| `refunded`     | Remboursé  | Paiement remboursé    | ❌ Non                      |
| `overdue`      | En retard  | Paiement en retard    | ❌ Non                      |

---

## 🔄 Workflow Complet

### Schéma Workflow

```
┌─────────────────┐
│  DRAFT          │ ← Création commande
│  (Brouillon)    │
│                 │
│  Modifiable: ✅  │
│  Supprimable: ✅ │
└────────┬────────┘
         │
         │ [Valider la commande]
         │ Action: status → confirmed
         ↓
┌─────────────────┐
│  CONFIRMED      │ ← Commande validée
│  (Validée)      │
│                 │
│  Modifiable: ⚠️  │ ← Si payment_status ≠ paid
│  Supprimable: ❌ │
└────────┬────────┘
         │
         │ [Paiement reçu OU crédit autorisé]
         │ Action: payment_status → paid
         ↓
┌─────────────────┐
│  READY TO SHIP  │ ← Prête pour expédition
│  (À expédier)   │   (Visible page Expéditions)
│                 │
│  Modifiable: ❌  │ ← Verrouillée (payée)
│  Expédier: ✅    │
└────────┬────────┘
         │
         │ [Gérer l'expédition]
         │ Action: shipped_at → timestamp
         ↓
┌─────────────────┐
│  SHIPPED        │ ← Expédiée
│  (Expédiée)     │
│                 │
│  Tracking: ✅    │
└────────┬────────┘
         │
         │ [Confirmer livraison]
         │ Action: delivered_at → timestamp
         ↓
┌─────────────────┐
│  DELIVERED      │ ← Livrée
│  (Livrée)       │
└─────────────────┘
```

---

## 🏢 Cas d'Usage B2B (Professionnel)

### Workflow Crédit Autorisé

**Client:** Organisation avec crédit validé

**Flux:**

1. Création commande → `draft`
2. Validation commerciale → `confirmed` + `payment_status: pending`
3. **Autorisation expédition AVANT paiement** → Expédition possible
4. Facturation → `payment_status: paid` (à échéance)

**Règles:**

- ✅ Expédition possible si `confirmed` + `pending` + crédit autorisé
- ✅ Commande modifiable tant que `payment_status !== paid`
- ⚠️ Validation crédit manuel (Phase 2)

**Exemple:**

```typescript
// Commande B2B prête pour expédition
order.status === 'confirmed' &&
  order.payment_status === 'pending' &&
  order.customer_type === 'organization' &&
  // TODO Phase 2: order.credit_authorized === true
  !order.shipped_at;
```

---

## 🛍️ Cas d'Usage B2C (Particulier)

### Workflow Paiement Immédiat

**Client:** Individu (site e-commerce)

**Flux:**

1. Ajout panier → Paiement → `confirmed` + `payment_status: paid`
2. Commande automatiquement prête → Visible page Expéditions
3. Expédition → `shipped`

**Règles:**

- ✅ Paiement OBLIGATOIRE avant expédition
- ❌ Pas de modification après paiement (verrouillée)
- ✅ Workflow simplifié (moins d'étapes manuelles)

**Exemple:**

```typescript
// Commande B2C prête pour expédition
order.status === 'confirmed' &&
  order.payment_status === 'paid' &&
  order.customer_type === 'individual' &&
  !order.shipped_at;
```

---

## ✏️ Règles Modification Commande

### Conditions Modification

**Modifiable SI:**

```typescript
order.status === 'draft' ||
  (order.status === 'confirmed' && order.payment_status !== 'paid');
```

**NON modifiable SI:**

```typescript
order.payment_status === 'paid' ||
  order.status === 'shipped' ||
  order.status === 'delivered';
```

### Champs Modifiables

| Statut                  | Produits | Quantités | Prix | Adresses | Notes |
| ----------------------- | -------- | --------- | ---- | -------- | ----- |
| `draft`                 | ✅       | ✅        | ✅   | ✅       | ✅    |
| `confirmed` (non payée) | ⚠️       | ⚠️        | ❌   | ✅       | ✅    |
| `confirmed` (payée)     | ❌       | ❌        | ❌   | ❌       | ⚠️    |

**Légende:**

- ✅ Modifiable librement
- ⚠️ Modifiable avec restrictions
- ❌ Non modifiable

---

## 📦 Page Expéditions: Règles Affichage

### Critères Affichage

**Visible dans page Expéditions SI:**

```typescript
order.status === 'confirmed' &&
  order.payment_status === 'paid' &&
  order.shipped_at === null;
```

**OU (Phase 2 - B2B crédit):**

```typescript
order.status === 'confirmed' &&
  order.payment_status === 'pending' &&
  order.credit_authorized === true &&
  order.shipped_at === null;
```

### Statistiques Affichées

#### 1. En Attente d'Expédition

```typescript
COUNT(orders WHERE
  status = 'confirmed' AND
  payment_status = 'paid' AND
  shipped_at IS NULL
)
```

#### 2. Urgentes (≤ 3 jours)

```typescript
COUNT(orders WHERE
  status = 'confirmed' AND
  payment_status = 'paid' AND
  shipped_at IS NULL AND
  expected_delivery_date <= (TODAY + 3 days)
)
```

#### 3. En Retard (date dépassée)

```typescript
COUNT(orders WHERE
  status = 'confirmed' AND
  payment_status = 'paid' AND
  shipped_at IS NULL AND
  expected_delivery_date < TODAY
)
```

#### 4. Valeur Totale

```typescript
SUM(total_ttc WHERE
  status = 'confirmed' AND
  payment_status = 'paid' AND
  shipped_at IS NULL
)
```

### Badges Urgence

| Condition                                  | Badge     | Couleur   | Priorité |
| ------------------------------------------ | --------- | --------- | -------- |
| `expected_delivery_date < TODAY`           | En retard | 🔴 Rouge  | Critique |
| `expected_delivery_date <= TODAY + 3 days` | Urgent    | 🟠 Orange | Haute    |
| Aucune date définie                        | -         | -         | Normale  |

---

## 🔒 Règles Sécurité & Permissions

### Modification Commande

**Qui peut modifier:**

- ✅ Créateur commande (created_by)
- ✅ Administrateur (role: admin)
- ✅ Responsable commercial (role: sales_manager)

**Conditions supplémentaires:**

- ✅ Statut `draft` ou `confirmed` non payée
- ❌ Interdiction si `payment_status === 'paid'`

### Validation Commande

**Qui peut valider:**

- ✅ Créateur commande
- ✅ Administrateur
- ✅ Responsable commercial

**Actions possibles:**

- `draft` → `confirmed`: Validation
- `draft` → `cancelled`: Annulation

### Expédition

**Qui peut expédier:**

- ✅ Responsable logistique (role: logistics_manager)
- ✅ Administrateur

**Conditions:**

- ✅ `status === 'confirmed'`
- ✅ `payment_status === 'paid'` (ou crédit autorisé)
- ❌ Interdiction si déjà expédiée (`shipped_at !== null`)

---

## 🚧 Limitations Phase 1

### Fonctionnalités Désactivées

**Facturation:**

- ❌ Télécharger bon de commande
- ❌ Générer facture
- **Statut:** Boutons grisés avec tooltip "Phase 2"

**Crédit B2B:**

- ❌ Validation crédit automatique
- ❌ Conditions paiement à échéance
- ❌ Suivi paiements partiels

**Mode Édition:**

- ⚠️ Bouton "Modifier" présent mais TODO
- ❌ Modal édition non implémentée
- **Action actuelle:** `console.log('Modifier commande:', order.id)`

---

## 📋 TODO Phase 2

### Priorité Haute

1. **Implémenter Mode Édition**

   ```typescript
   // SalesOrderFormModal
   interface Props {
     mode: 'create' | 'edit';
     orderId?: string;
     onSuccess?: () => void;
   }
   ```

2. **Activer Facturation**
   - Génération PDF bon de commande
   - Création facture automatique
   - Intégration module Finance

3. **Workflow Crédit B2B**
   - Table `customer_credit_limits`
   - Validation crédit automatique
   - Alertes dépassement limite

### Priorité Moyenne

4. **Amélioration Expéditions**
   - Export liste (.csv, .xlsx)
   - Impression étiquettes transporteur
   - Tracking numéro suivi

5. **Notifications**
   - Email commande validée
   - SMS expédition
   - Push livraison

---

## 🧪 Tests & Validation

### Tests Fonctionnels

**Scénarios à tester:**

1. **Création & Validation**
   - [ ] Créer commande draft
   - [ ] Valider commande (draft → confirmed)
   - [ ] Vérifier statut "Validée" affiché

2. **Modification**
   - [ ] Modifier commande draft
   - [ ] Modifier commande validated non payée
   - [ ] Vérifier interdiction si payée

3. **Expédition**
   - [ ] Commande apparaît page Expéditions après paiement
   - [ ] Badge urgence si date proche
   - [ ] Badge "En retard" si date dépassée
   - [ ] Bouton "Expédier" fonctionnel

4. **Workflow B2B**
   - [ ] Validation commande pro
   - [ ] Expédition sans paiement (crédit)
   - [ ] Facturation à échéance

5. **Workflow B2C**
   - [ ] Paiement obligatoire
   - [ ] Verrouillage après paiement
   - [ ] Expédition automatique

### Tests Non-Régression

**À vérifier:**

- [ ] Commandes existantes non impactées
- [ ] Statistiques dashboard correctes
- [ ] Filtres page commandes fonctionnels
- [ ] Modal détail commande OK

---

## 📚 Références Techniques

### Base de Données

**Table:** `sales_orders`
**Schema:** [/supabase/migrations/](../../supabase/migrations/)

**Champs clés:**

- `status`: sales_order_status (enum)
- `payment_status`: varchar
- `confirmed_at`: timestamptz
- `shipped_at`: timestamptz
- `delivered_at`: timestamptz
- `customer_type`: text ('organization' | 'individual')

### Code Source

**Pages:**

- [/src/app/commandes/clients/page.tsx](../../src/app/commandes/clients/page.tsx)
- [/src/app/commandes/expeditions/page.tsx](../../src/app/commandes/expeditions/page.tsx)

**Composants:**

- [/src/components/business/order-detail-modal.tsx](../../src/components/business/order-detail-modal.tsx)
- [/src/components/business/sales-order-form-modal.tsx](../../src/components/business/sales-order-form-modal.tsx)

**Hooks:**

- [/src/hooks/use-sales-orders.ts](../../src/hooks/use-sales-orders.ts)

---

## 📝 Historique Modifications

| Date       | Version | Auteur      | Changements                                             |
| ---------- | ------- | ----------- | ------------------------------------------------------- |
| 2025-10-11 | 1.0     | Claude Code | Création initiale règles workflow validation/expédition |

---

**Document vivant:** Ce document sera mis à jour au fur et à mesure de l'implémentation Phase 2.
