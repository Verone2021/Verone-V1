# 📋 Workflow Commandes-Stock Vérone

## 🎯 Vue d'ensemble

Le système de gestion des commandes et du stock Vérone suit les meilleures pratiques ERP avec une gestion séparée du **stock réel** (physique en entrepôt) et du **stock prévisionnel** (attendu/réservé).

---

## 🛒 Workflow Commandes Clients (Sales Orders)

### États et transitions

```
DRAFT → CONFIRMED → PARTIALLY_SHIPPED → SHIPPED → DELIVERED
         ↓
      CANCELLED
```

### Statuts de paiement

- **pending** : En attente de paiement
- **partial** : Partiellement payé
- **paid** : Totalement payé
- **refunded** : Remboursé
- **overdue** : En retard

### Workflow détaillé

#### 1. Création de commande (DRAFT)
```typescript
// Hook: useSalesOrders
const { createOrder } = useSalesOrders()
await createOrder({
  customer_id: "...",
  items: [{ product_id: "...", quantity: 10, unit_price_ht: 100 }]
})
```
- ✅ Vérification disponibilité stock
- ❌ Pas d'impact sur le stock

#### 2. Confirmation commande (CONFIRMED)
```typescript
await updateStatus(orderId, 'confirmed')
```
- Si **non payée** → Stock prévisionnel OUT (+10)
- Si **payée** → Stock disponible pour sortie

#### 3. Enregistrement paiement
```typescript
await markAsPaid(orderId, amount)
```
- Stock prévisionnel OUT annulé (-10)
- Stock redevient disponible pour sortie entrepôt

#### 4. Sortie entrepôt (uniquement si payée)
```typescript
await markWarehouseExit(orderId)
```
- ✅ Vérification paiement complet
- Stock réel OUT (-10)
- Statut → SHIPPED

#### 5. Annulation commande
```typescript
await updateStatus(orderId, 'cancelled')
```
- Si non payée : Annulation stock prévisionnel OUT
- Si payée : Pas d'impact (sortie déjà faite ou à faire)

---

## 📦 Workflow Commandes Fournisseurs (Purchase Orders)

### États et transitions

```
DRAFT → SENT → CONFIRMED → PARTIALLY_RECEIVED → RECEIVED
                    ↓
                CANCELLED
```

### Workflow détaillé

#### 1. Création commande (DRAFT)
```typescript
// Hook: usePurchaseOrders
const { createOrder } = usePurchaseOrders()
await createOrder({
  supplier_id: "...",
  items: [{ product_id: "...", quantity: 100, unit_price_ht: 50 }]
})
```
- ❌ Pas d'impact sur le stock

#### 2. Confirmation commande (CONFIRMED)
```typescript
await confirmOrder(orderId)
```
- Stock prévisionnel IN (+100)
- Marchandise attendue mais non reçue

#### 3. Réception partielle
```typescript
await receiveItems(orderId, [
  { item_id: "...", quantity_received: 30 }
])
```
- Stock prévisionnel IN réduit (-30)
- Stock réel IN augmenté (+30)
- Statut → PARTIALLY_RECEIVED

#### 4. Réception complète
```typescript
await markAsReceived(orderId)
```
- Tout le prévisionnel restant → Stock réel
- Stock prévisionnel IN = 0
- Stock réel IN = quantité totale commandée

#### 5. Annulation commande
```typescript
await updateStatus(orderId, 'cancelled')
```
- Annulation du stock prévisionnel restant
- Stock déjà reçu reste en stock réel

---

## 📊 Impact sur les tables de stock

### Table `products`
- **stock_real** : Stock physique en entrepôt
- **stock_forecasted_in** : Stock attendu (commandes fournisseurs)
- **stock_forecasted_out** : Stock réservé (commandes clients non payées)

### Table `stock_movements`
Chaque action crée un mouvement traçable :
- **movement_type** : IN, OUT, ADJUST
- **affects_forecast** : true/false
- **forecast_type** : 'in' ou 'out'
- **reference_type** : 'sales_order', 'purchase_order', etc.

### Calcul stock disponible
```sql
stock_available = stock_real + stock_forecasted_in - stock_forecasted_out
```

---

## 🧪 Scénarios de test

### Test 1 : Commande client non payée
1. Créer commande client 10 unités
2. Confirmer la commande
3. Vérifier : stock_forecasted_out = 10
4. Stock disponible diminué de 10

### Test 2 : Paiement et sortie
1. Enregistrer paiement complet
2. Vérifier : stock_forecasted_out = 0
3. Marquer sortie entrepôt
4. Vérifier : stock_real diminué de 10

### Test 3 : Commande fournisseur
1. Créer et confirmer commande 100 unités
2. Vérifier : stock_forecasted_in = 100
3. Recevoir 40 unités
4. Vérifier : stock_real +40, stock_forecasted_in = 60
5. Recevoir le reste
6. Vérifier : stock_real +60, stock_forecasted_in = 0

### Test 4 : Annulation
1. Créer commande client non payée
2. Confirmer (prévisionnel créé)
3. Annuler commande
4. Vérifier : stock prévisionnel annulé

---

## 🔄 Triggers automatiques

### `trigger_sales_order_stock`
Déclenché sur INSERT/UPDATE de `sales_orders`
- Gère automatiquement les mouvements prévisionnels
- Synchronise avec les changements de statut de paiement

### `trigger_purchase_order_stock`
Déclenché sur INSERT/UPDATE de `purchase_orders`
- Crée stock prévisionnel IN à la confirmation
- Convertit en stock réel à la réception

### `update_product_stock_after_movement`
Déclenché après chaque `stock_movement`
- Met à jour automatiquement `products.stock_real`
- Maintient la cohérence des données

---

## 🛠️ Fonctions Helper Database

### `mark_payment_received(order_id, amount)`
Enregistre un paiement et met à jour le statut

### `mark_warehouse_exit(order_id)`
Marque la sortie entrepôt (stock réel OUT)

### `recalculate_product_stock(product_id)`
Recalcule le stock à partir de tous les mouvements

---

## 📝 Notes importantes

1. **Stock prévisionnel** : Ne bloque pas physiquement le stock, c'est une projection
2. **Paiement obligatoire** : Sortie entrepôt uniquement si commande payée
3. **Traçabilité complète** : Chaque mouvement est enregistré avec référence
4. **Cohérence garantie** : Les triggers maintiennent la synchronisation
5. **Performance** : Index sur les champs critiques pour requêtes rapides

---

## 🚀 Utilisation dans l'interface

### Page Stocks (`/stocks` ou `/catalogue/stocks`)
- Vue temps réel : stock physique, prévisionnel, disponible
- Mouvements manuels via modal
- Alertes stock faible automatiques

### Pages Commandes
- Boutons contextuels selon statut
- Validation stock avant confirmation
- Workflow guidé étape par étape

---

**Date création** : 18 janvier 2025
**Statut** : ✅ Implémenté et fonctionnel