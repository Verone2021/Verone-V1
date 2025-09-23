# 🧪 Guide Pratique de Test - Système Stock Prévisionnel

**Date**: 18 Janvier 2025
**Objectif**: Guide step-by-step pour tester manuellement tous les workflows stock avec Playwright

---

## 🚀 **Setup Initial**

### **1. Vérifier Environment**
```bash
# Serveur development
npm run dev

# Vérifier logs console
tail -f .next/build.log
```

### **2. Navigation Initiale**
```typescript
// Démarrer browser et naviguer au dashboard
browser_navigate('http://localhost:3000/dashboard')
browser_snapshot() // Capturer état initial
```

---

## 🛒 **TEST 1: Cycle Commande Client Complet**

### **1.1 Créer Commande Client**
```typescript
// Navigation vers commandes clients
browser_navigate('http://localhost:3000/contacts-organisations/customers')
browser_snapshot() // Vérifier page clients

// Créer nouvelle commande
browser_click('button', { name: 'Nouvelle Commande' })
browser_snapshot() // Modal commande

// Remplir formulaire
browser_fill_form([
  { name: 'Client', type: 'combobox', value: 'MARTIN DUBOIS' },
  { name: 'Produit', type: 'combobox', value: 'Canapé Moderne Vérone' },
  { name: 'Quantité', type: 'textbox', value: '25' },
  { name: 'Prix unitaire', type: 'textbox', value: '299.99' }
])

// Sauvegarder
browser_click('Créer Commande')
browser_wait_for('Commande créée avec succès')
browser_snapshot() // Confirmation création
```

### **1.2 Confirmer Commande (non payée)**
```typescript
// Marquer comme confirmée
browser_click('Confirmer Commande')
browser_wait_for('Commande confirmée')

// VÉRIFICATION CRITIQUE: Stock prévisionnel OUT
browser_navigate('http://localhost:3000/stocks')
browser_snapshot() // Vérifier stock_forecasted_out = 25

// Vérifier console pour erreurs
browser_console_messages()
```

### **1.3 Marquer Comme Payée**
```typescript
// Retour commandes clients
browser_navigate('http://localhost:3000/contacts-organisations/customers')

// Enregistrer paiement
browser_click('Enregistrer Paiement')
browser_fill_form([
  { name: 'Montant', type: 'textbox', value: '7499.75' }
])
browser_click('Confirmer Paiement')

// VÉRIFICATION: Stock prévisionnel annulé
browser_navigate('http://localhost:3000/stocks')
browser_snapshot() // stock_forecasted_out = 0
```

### **1.4 Sortie Entrepôt**
```typescript
// Marquer sortie entrepôt
browser_click('Marquer Expédiée')
browser_wait_for('Commande expédiée')

// VÉRIFICATION FINALE: Stock réel diminué
browser_navigate('http://localhost:3000/stocks')
browser_snapshot() // stock_real -25
```

---

## 📦 **TEST 2: Cycle Commande Fournisseur**

### **2.1 Créer Commande Achat**
```typescript
// Navigation commandes fournisseurs
browser_navigate('http://localhost:3000/commandes/fournisseurs')
browser_snapshot()

// Nouvelle commande
browser_click('Nouvelle Commande')

// Formulaire commande
browser_fill_form([
  { name: 'Fournisseur', type: 'combobox', value: 'IKEA FRANCE' },
  { name: 'Produit', type: 'combobox', value: 'Canapé Moderne Vérone' },
  { name: 'Quantité', type: 'textbox', value: '100' },
  { name: 'Prix unitaire', type: 'textbox', value: '150.00' }
])

browser_click('Créer Commande')
browser_snapshot()
```

### **2.2 Confirmer Commande Achat**
```typescript
// Confirmer commande
browser_click('Confirmer Commande')
browser_wait_for('Commande confirmée')

// VÉRIFICATION: Stock prévisionnel IN
browser_navigate('http://localhost:3000/stocks')
browser_snapshot() // stock_forecasted_in = 100
```

### **2.3 Réception Partielle**
```typescript
// Retour commandes fournisseurs
browser_navigate('http://localhost:3000/commandes/fournisseurs')

// Recevoir partiellement
browser_click('Recevoir Marchandise')
browser_fill_form([
  { name: 'Quantité reçue', type: 'textbox', value: '60' }
])
browser_click('Confirmer Réception')

// VÉRIFICATION: Stocks mis à jour
browser_navigate('http://localhost:3000/stocks')
browser_snapshot() // stock_real +60, stock_forecasted_in = 40
```

### **2.4 Réception Complète**
```typescript
// Recevoir le reste
browser_click('Recevoir Marchandise')
browser_fill_form([
  { name: 'Quantité reçue', type: 'textbox', value: '40' }
])
browser_click('Confirmer Réception')

// VÉRIFICATION FINALE
browser_navigate('http://localhost:3000/stocks')
browser_snapshot() // stock_real +40, stock_forecasted_in = 0
```

---

## ⚙️ **TEST 3: Ajustements Manuels**

### **3.1 Ajustement Positif**
```typescript
// Navigation stocks
browser_navigate('http://localhost:3000/stocks')

// Sélectionner produit
browser_click('Canapé Moderne Vérone')

// Ajuster stock
browser_click('Ajuster Stock')
browser_fill_form([
  { name: 'Nouvelle quantité', type: 'textbox', value: '150' },
  { name: 'Motif', type: 'combobox', value: 'Inventaire trouvaille' },
  { name: 'Notes', type: 'textbox', value: 'Correction inventaire 2025' }
])
browser_click('Confirmer Ajustement')
browser_snapshot()
```

### **3.2 Ajustement Négatif**
```typescript
// Ajustement négatif
browser_click('Ajuster Stock')
browser_fill_form([
  { name: 'Nouvelle quantité', type: 'textbox', value: '145' },
  { name: 'Motif', type: 'combobox', value: 'Produit endommagé' },
  { name: 'Notes', type: 'textbox', value: 'Dégât transport' }
])
browser_click('Confirmer Ajustement')
browser_snapshot()
```

---

## 📊 **TEST 4: Historique et Traçabilité**

### **4.1 Vérifier Historique Complet**
```typescript
// Navigation historique
browser_navigate('http://localhost:3000/historique-mouvements')
browser_snapshot()

// Filtrer par produit
browser_fill_form([
  { name: 'Produit', type: 'combobox', value: 'Canapé Moderne Vérone' }
])
browser_click('Filtrer')
browser_snapshot() // Tous mouvements visibles

// Vérifier détails mouvement
browser_click('[data-testid="movement-details-1"]')
browser_snapshot() // Modal détails
```

### **4.2 Vérifier Référencements**
```typescript
// Chaque mouvement doit avoir:
// - reference_type (sales_order, purchase_order, manual)
// - reference_id
// - quantity_before/quantity_after
// - reason_code
// - performed_by
```

---

## 🚨 **TEST 5: Cas d'Erreur**

### **5.1 Stock Insuffisant**
```typescript
// Tenter vente > stock disponible
browser_navigate('http://localhost:3000/contacts-organisations/customers')
browser_click('Nouvelle Commande')

// Quantité excessive
browser_fill_form([
  { name: 'Produit', type: 'combobox', value: 'Canapé Moderne Vérone' },
  { name: 'Quantité', type: 'textbox', value: '999' }
])
browser_click('Créer Commande')

// VÉRIFICATION: Message d'erreur
browser_wait_for('Stock insuffisant')
browser_snapshot()
```

### **5.2 Validation Console**
```typescript
// À CHAQUE ÉTAPE CRITIQUE
browser_console_messages()

// Si erreurs détectées (indicateur rouge bottom-left):
// 1. Cliquer sur l'indicateur
// 2. Naviguer entre erreurs (Next/Previous)
// 3. Résoudre TOUTES avant continuer
// 4. Re-tester jusqu'à 0 erreur
```

---

## 📋 **CHECKLIST VALIDATION**

### **Après Chaque Test**
- [ ] Interface charge sans erreur
- [ ] Actions complètent avec succès
- [ ] Stocks calculés correctement
- [ ] Messages utilisateur appropriés
- [ ] Console sans erreurs rouges
- [ ] Performance < 2s par action
- [ ] Données cohérentes DB ↔ Frontend

### **Validation Globale**
- [ ] Workflow achat complet ✅
- [ ] Workflow vente complet ✅
- [ ] Ajustements manuels ✅
- [ ] Traçabilité audit ✅
- [ ] Gestion erreurs ✅
- [ ] Performance SLO ✅

---

## 🎯 **Database Queries de Contrôle**

### **Vérifier État Final**
```sql
-- Stock état final
SELECT
  p.name,
  p.stock_real,
  p.stock_forecasted_in,
  p.stock_forecasted_out,
  (p.stock_real + p.stock_forecasted_in - p.stock_forecasted_out) as stock_available
FROM products p
WHERE p.name LIKE '%Canapé Moderne%';

-- Mouvements audit
SELECT
  sm.movement_type,
  sm.quantity_change,
  sm.reason_code,
  sm.reference_type,
  sm.reference_id,
  sm.performed_at,
  up.first_name || ' ' || up.last_name as performed_by
FROM stock_movements sm
LEFT JOIN user_profiles up ON sm.performed_by = up.id
WHERE sm.product_id = (SELECT id FROM products WHERE name LIKE '%Canapé Moderne%')
ORDER BY sm.performed_at DESC;
```

---

**🎯 OBJECTIF FINAL**: 100% des workflows testés et validés avec 0 erreur console et cohérence parfaite database ↔ frontend.

**✅ CRITÈRE SUCCÈS**: Tous les tests passent, système prêt pour production intensive.