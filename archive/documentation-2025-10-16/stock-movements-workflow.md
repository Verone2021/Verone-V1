# 📦 Règles Métier - Mouvements de Stock
**Date** : 16 septembre 2025
**Version** : 1.0
**Status** : ✅ IMPLÉMENTÉ

## 🎯 Objectifs

Définir les règles métier strictes pour la gestion des mouvements de stock dans Vérone Back Office, garantissant :
- **Traçabilité complète** de tous les mouvements
- **Cohérence données** entre mouvements et stock produits
- **Prévention erreurs** via validations business automatiques
- **Audit trail** pour conformité et debugging

## 📋 Types de Mouvements

### **1. IN (Entrées)**
**Usage** : Réceptions marchandises, ajustements positifs
**Règles** :
- ✅ Quantité TOUJOURS positive
- ✅ Augmente automatiquement `products.stock_quantity`
- ✅ Référence obligatoire (purchase_order, adjustment, etc.)
- ✅ Unit_cost recommandé pour valorisation

**Exemples** :
```typescript
// Réception commande fournisseur
{
  movement_type: 'IN',
  quantity_change: 50,
  unit_cost: 129.99,
  reference_type: 'purchase_order',
  reference_id: 'uuid-po-123',
  notes: 'Réception PO-2025-0156 - Canapés Oslo'
}

// Ajustement inventaire positif
{
  movement_type: 'IN',
  quantity_change: 3,
  reference_type: 'adjustment',
  reference_id: 'uuid-adj-456',
  notes: 'Correction inventaire - produits retrouvés entrepôt'
}
```

### **2. OUT (Sorties)**
**Usage** : Ventes, casses, ajustements négatifs
**Règles** :
- ✅ Quantité TOUJOURS positive (représente la sortie)
- ✅ Diminue automatiquement `products.stock_quantity`
- ✅ **Validation stock suffisant** avant insertion
- ✅ Référence obligatoire pour traçabilité

**Validation Critique** :
```sql
-- Trigger avant insertion OUT
IF NEW.movement_type = 'OUT' THEN
  SELECT stock_quantity INTO current_stock FROM products WHERE id = NEW.product_id;
  IF current_stock < NEW.quantity_change THEN
    RAISE EXCEPTION 'Stock insuffisant: % disponible, % demandé', current_stock, NEW.quantity_change;
  END IF;
END IF;
```

**Exemples** :
```typescript
// Expédition commande client
{
  movement_type: 'OUT',
  quantity_change: 2,
  reference_type: 'sales_order',
  reference_id: 'uuid-so-789',
  notes: 'Expédition SO-2025-0089 - Hotel Le Luxe'
}

// Ajustement inventaire négatif (casse)
{
  movement_type: 'OUT',
  quantity_change: 1,
  reference_type: 'adjustment',
  reference_id: 'uuid-adj-999',
  notes: 'Casse transport - miroir fissuré'
}
```

### **3. ADJUST (Ajustements)**
**Usage** : Corrections inventaire (positives ET négatives)
**Règles** :
- ✅ Quantité peut être positive OU négative
- ✅ Positive = équivalent IN, Négative = équivalent OUT
- ✅ **Validation stock** si quantité négative
- ✅ Obligatoirement accompagné de notes explicatives

**Business Logic** :
```typescript
const adjustmentRules = {
  positiveAdjustment: (qty: number) => qty > 0, // Produits retrouvés
  negativeAdjustment: (qty: number) => qty < 0, // Produits perdus/cassés
  requiresNotes: true, // Obligatoire pour audit
  requiresApproval: (qty: number) => Math.abs(qty) > 10 // Seuil validation manager
}
```

### **4. TRANSFER (Transferts)**
**Usage** : Déplacements entre emplacements (futur)
**Règles** :
- ✅ Quantité TOUJOURS positive
- ✅ **N'affecte PAS** `products.stock_quantity` global
- ✅ Référence obligatoire (ordre transfert interne)
- ✅ Notes obligatoires (emplacement source → destination)

**Note** : Implémentation future avec gestion multi-emplacements

## 🔒 Règles de Sécurité

### **Validation Données**
```typescript
const movementValidation = {
  product_id: 'UUID valide + existe dans products',
  movement_type: 'IN | OUT | ADJUST | TRANSFER uniquement',
  quantity_change: 'Décimal positif obligatoire (sauf ADJUST)',
  reference_type: 'String non vide obligatoire',
  reference_id: 'UUID valide si référence externe',
  created_by: 'Utilisateur authentifié obligatoire'
}
```

### **RLS (Row Level Security)**
```sql
-- Isolation multi-tenant stricte
CREATE POLICY "stock_movements_org_isolation" ON stock_movements
FOR ALL USING (
  product_id IN (
    SELECT id FROM products
    WHERE organisation_id = auth.get_user_org_id()
  )
);
```

### **Immutabilité**
- ❌ **AUCUNE modification** mouvements après création
- ❌ **AUCUNE suppression** mouvements (audit trail)
- ✅ **Correction via nouveau mouvement** ADJUST compensatoire

## ⚙️ Automatisations

### **Trigger Stock Automatique**
```sql
CREATE TRIGGER update_product_stock_trigger
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION update_product_stock();
```

**Comportement** :
- **IN/ADJUST positif** : `stock_quantity += quantity_change`
- **OUT/ADJUST négatif** : `stock_quantity -= quantity_change`
- **TRANSFER** : Aucun impact stock global
- **Timestamp** : Mise à jour automatique `products.updated_at`

### **Validation Concurrence**
```sql
-- Lock produit pendant mise à jour stock
SELECT stock_quantity FROM products
WHERE id = $1 FOR UPDATE;
```

Empêche les conditions de course sur mises à jour simultanées.

## 📊 Calculs Business

### **Stock Disponible Temps Réel**
```sql
CREATE OR REPLACE FUNCTION get_available_stock(p_product_id uuid)
RETURNS decimal AS $$
DECLARE
  stock_qty decimal;
  reserved_qty decimal;
BEGIN
  -- Stock physique
  SELECT stock_quantity INTO stock_qty
  FROM products WHERE id = p_product_id;

  -- Réservations actives
  SELECT COALESCE(SUM(quantity), 0) INTO reserved_qty
  FROM stock_reservations
  WHERE product_id = p_product_id
    AND status = 'active'
    AND expires_at > now();

  -- Stock disponible = Stock physique - Réservations
  RETURN GREATEST(stock_qty - reserved_qty, 0);
END;
$$ LANGUAGE plpgsql;
```

### **Valorisation Stock**
```typescript
interface StockValuation {
  quantity: number
  averageCost: number  // Coût moyen pondéré
  totalValue: number   // quantity * averageCost
  lastCost: number     // Dernier coût d'achat
}

const calculateValuation = (movements: StockMovement[]) => {
  return movements
    .filter(m => m.movement_type === 'IN' && m.unit_cost)
    .reduce((acc, mov) => {
      // Algorithme coût moyen pondéré (FIFO)
      const newQty = acc.quantity + mov.quantity_change
      const newCost = (acc.totalValue + (mov.quantity_change * mov.unit_cost!)) / newQty

      return {
        quantity: newQty,
        averageCost: newCost,
        totalValue: newQty * newCost,
        lastCost: mov.unit_cost!
      }
    }, { quantity: 0, averageCost: 0, totalValue: 0, lastCost: 0 })
}
```

## 🚨 Alertes & Notifications

### **Seuils Critiques**
```typescript
const stockAlerts = {
  lowStock: (currentStock: number, minLevel: number) => currentStock <= minLevel,
  outOfStock: (currentStock: number) => currentStock <= 0,
  negativeStock: (currentStock: number) => currentStock < 0, // ERREUR CRITIQUE
  highValue: (movementValue: number) => movementValue > 10000 // Validation manager
}
```

### **Notifications Automatiques**
- **Stock faible** : Email équipe achats quand stock ≤ seuil minimum
- **Rupture stock** : Alerte temps réel + blocage nouvelles commandes
- **Stock négatif** : Alerte critique + investigation immédiate
- **Mouvement important** : Validation manager si valeur > seuil

## 📈 Métriques & KPIs

### **Indicateurs Temps Réel**
```typescript
interface StockMetrics {
  totalProducts: number
  totalStockValue: number
  lowStockItems: number
  outOfStockItems: number
  dailyMovements: number
  weeklyTurnover: number
}
```

### **Rapports Périodiques**
- **Mouvements quotidiens** : Résumé par type (IN/OUT/ADJUST)
- **Évolution stock** : Tendances par produit/catégorie
- **Écarts inventaire** : Analyse des ajustements fréquents
- **Performance fournisseurs** : Délais livraison vs prévisions

## ✅ Tests de Validation

### **Scénarios Critiques**
1. **Mouvement IN** → Vérifier augmentation stock_quantity
2. **Mouvement OUT** → Vérifier diminution + validation stock suffisant
3. **Mouvement OUT insuffisant** → Vérifier rejet avec erreur explicite
4. **Concurrence** → Deux mouvements simultanés même produit
5. **RLS** → Utilisateur org A ne voit pas mouvements org B

### **Tests E2E Business**
```typescript
describe('Stock Movements Workflow', () => {
  test('Reception commande fournisseur augmente stock', async () => {
    // Créer commande fournisseur
    // Réceptionner items
    // Vérifier mouvements IN automatiques
    // Vérifier mise à jour stock_quantity
  })

  test('Expédition commande client diminue stock', async () => {
    // Créer commande client avec stock suffisant
    // Confirmer commande (réservation)
    // Expédier commande
    // Vérifier mouvement OUT + libération réservation
  })
})
```

---

**Règles métier strictes garantissant intégrité et traçabilité complète du stock Vérone.**