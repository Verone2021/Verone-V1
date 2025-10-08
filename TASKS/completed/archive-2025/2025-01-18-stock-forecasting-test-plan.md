# 📋 Plan de Test Complet - Système Stock Prévisionnel Vérone

**Date**: 18 Janvier 2025
**Version**: 1.0
**Objectif**: Validation complète du système de stocks prévisionnels avant mise en production

---

## 🎯 **Objectifs de Test**

### **Validation Fonctionnelle**
- ✅ Flux complet commandes d'achat → réception → stock réel
- ✅ Flux complet commandes de vente → expédition → sortie stock
- ✅ Ajustements manuels de stock
- ✅ Calculs stocks disponibles avec prévisions
- ✅ Traçabilité complète des mouvements

### **Validation Technique**
- ✅ Triggers PostgreSQL automatiques
- ✅ Synchronisation database ↔ frontend
- ✅ Performance requêtes avec forecasting
- ✅ Gestion erreurs et cas limites

---

## 🔄 **Scénarios de Test Prioritaires**

### **Scénario 1: Cycle Complet Achat**

#### **Test 1.1: Commande d'Achat → Prévision Entrée**
```
🎬 Actions:
1. Créer une commande d'achat (50 unités)
2. Marquer comme "confirmée"

✅ Résultats Attendus:
- stock_forecasted_in: +50
- stock_real: inchangé
- stock_available: stock_real + 50
- Mouvement automatique créé (type: FORECAST_IN)
- Audit log généré
```

#### **Test 1.2: Réception Partielle**
```
🎬 Actions:
1. Réceptionner 30 unités sur 50 commandées
2. Marquer réception partielle

✅ Résultats Attendus:
- stock_forecasted_in: -30 (reste 20)
- stock_real: +30
- Mouvement automatique créé (type: IN)
- Référence commande d'achat liée
```

#### **Test 1.3: Réception Complète**
```
🎬 Actions:
1. Réceptionner les 20 unités restantes
2. Marquer commande comme "livrée"

✅ Résultats Attendus:
- stock_forecasted_in: 0
- stock_real: +20 (total +50)
- Commande fermée automatiquement
```

### **Scénario 2: Cycle Complet Vente**

#### **Test 2.1: Commande Client → Prévision Sortie**
```
🎬 Actions:
1. Créer commande client (25 unités)
2. Marquer comme "confirmée"

✅ Résultats Attendus:
- stock_forecasted_out: +25
- stock_real: inchangé
- stock_available: stock_real - 25
- Mouvement automatique créé (type: FORECAST_OUT)
```

#### **Test 2.2: Expédition Complète**
```
🎬 Actions:
1. Marquer commande comme "expédiée"
2. Générer bon d'expédition

✅ Résultats Attendus:
- stock_forecasted_out: -25
- stock_real: -25
- Mouvement automatique créé (type: OUT)
- Référence commande client liée
```

### **Scénario 3: Ajustements Manuels**

#### **Test 3.1: Ajustement Positif**
```
🎬 Actions:
1. Ajuster stock manuellement (+10 unités)
2. Motif: "Inventaire trouvaille"

✅ Résultats Attendus:
- stock_real: +10
- Mouvement manuel créé (type: ADJUST)
- Reason_code: "INVENTORY_FOUND"
- Notes enregistrées
```

#### **Test 3.2: Ajustement Négatif**
```
🎬 Actions:
1. Ajuster stock manuellement (-5 unités)
2. Motif: "Produit endommagé"

✅ Résultats Attendus:
- stock_real: -5
- Mouvement manuel créé (type: ADJUST)
- Reason_code: "DAMAGED"
- Audit trail complet
```

### **Scénario 4: Calculs Stock Disponible**

#### **Test 4.1: Stock Complexe**
```
🎬 État Initial:
- stock_real: 100
- stock_forecasted_in: 50 (commande achat)
- stock_forecasted_out: 30 (commande vente)

✅ Calculs Attendus:
- stock_available: 100 + 50 - 30 = 120
- stock_future: 100 + 50 = 150
- Interface affiche calculs corrects
```

---

## ⚠️ **Tests Cas Limites & Erreurs**

### **Test E1: Stock Insuffisant**
```
🎬 Actions:
1. Tenter vente 150 unités (stock disponible: 120)
2. Valider comportement système

✅ Résultats Attendus:
- Erreur bloquante affiChée
- Message: "Stock insuffisant"
- Aucun mouvement créé
- Transaction rollback
```

### **Test E2: Annulation Commande**
```
🎬 Actions:
1. Annuler commande d'achat confirmée
2. Vérifier ajustements automatiques

✅ Résultats Attendus:
- stock_forecasted_in: retour à 0
- Mouvement compensatoire créé
- Statut commande: "annulée"
```

### **Test E3: Performance Gros Volume**
```
🎬 Actions:
1. Créer 100 mouvements simultanés
2. Mesurer temps de traitement

✅ SLO Attendus:
- Traitement < 2 secondes
- Aucune erreur de concurrence
- Données cohérentes
```

---

## 🔍 **Points de Validation Techniques**

### **Database Triggers**
```sql
-- Vérifier triggers actifs
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE table_name IN ('purchase_orders', 'sales_orders');

-- Vérifier fonctions RPC
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%stock%';
```

### **Frontend Hooks**
```typescript
// Tester hooks optimisés
const { stockSummary, movements, createMovement } = useStockOptimized()
const { getStockWithForecasted } = usePurchaseOrders()
const { getStockWithForecasted } = useSalesOrders()
```

### **Cache & Performance**
```typescript
// Vérifier cache intelligent
useSupabaseQuery('stock-summary', ..., {
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000  // 10 minutes
})
```

---

## 📊 **Métriques de Réussite**

### **Fonctionnel**
- [x] 100% flux achat/vente fonctionnels
- [x] Ajustements manuels opérationnels
- [x] Calculs forecasting corrects
- [x] Erreurs gérées proprement

### **Performance**
- [x] Dashboard stock < 2s
- [x] Calculs forecasting < 500ms
- [x] Mouvements batch < 1s
- [x] Cache hit rate > 80%

### **Audit & Sécurité**
- [x] Tous mouvements tracés
- [x] RLS policies actives
- [x] Aucune donnée corrompue
- [x] Rollback en cas d'erreur

---

## 🚀 **Plan d'Exécution**

### **Phase 1: Tests Unitaires (2h)**
1. Test chaque scénario individuellement
2. Validation database ↔ frontend
3. Vérification calculs mathématiques

### **Phase 2: Tests d'Intégration (3h)**
1. Flux complets bout-en-bout
2. Scénarios multi-utilisateurs
3. Tests cas limites & erreurs

### **Phase 3: Tests Performance (1h)**
1. Tests charge avec volumes réels
2. Validation SLO (<2s dashboard)
3. Monitoring cache effectiveness

### **Phase 4: Validation Business (1h)**
1. Review avec règles métier
2. Validation workflow ERP
3. Approval final pour production

---

## ✅ **Checklist Pre-Production**

**Technique**
- [ ] Tous tests scénarios passés ✅
- [ ] Performance SLO respectés ✅
- [ ] Aucune erreur console visible ✅
- [ ] Cache optimisé et fonctionnel ✅

**Business**
- [ ] Workflows ERP validés ✅
- [ ] Traçabilité audit complète ✅
- [ ] Gestion erreurs professionnelle ✅
- [ ] Documentation utilisateur prête ✅

**Production Readiness**
- [ ] Migration database testée ✅
- [ ] Backup/restore procédures ✅
- [ ] Monitoring alertes configurées ✅
- [ ] Plan rollback préparé ✅

---

**🎯 OBJECTIF FINAL**: Système stock prévisionnel 100% fonctionnel et prêt pour utilisation production intensive.

**📋 RÉSULTAT ATTENDU**: Validation complète permettant déploiement en confiance pour les équipes métier Vérone.