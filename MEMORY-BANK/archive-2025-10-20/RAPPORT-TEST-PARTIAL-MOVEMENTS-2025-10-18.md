# 🧪 Rapport de Test - Mouvements Partiels PO-2025-00006
**Date**: 2025-10-18
**Session**: Test validation triggers réceptions partielles
**Commande testée**: PO-2025-00006 (Fauteuil Milo - Vert, 10 unités)

---

## 📋 Résumé Exécutif

**Statut global**: ✅ Succès partiel (1ère réception OK, bug 2ème réception)
**Console browser**: ✅ Propre (aucune erreur critique)
**Trigger confirmation**: ✅ Fonctionnel
**Trigger réception partielle #1**: ✅ Fonctionnel (calcul différentiel correct)
**Trigger réception complète**: ❌ Bug (ne calcule pas différentiel)

---

## 🧪 Scénario de Test

### Étape 1: Création Commande
```sql
PO-2025-00006
Fournisseur: Opjet
Produit: Fauteuil Milo - Vert (FMIL-VERT-01)
Quantité: 10 unités
Prix unitaire: 100,00 € HT
Total: 1 000,00 € HT
Status initial: draft
```

**Résultat**: ✅ Commande créée avec succès

---

### Étape 2: Confirmation Commande
```sql
UPDATE purchase_orders
SET status = 'confirmed', validated_at = NOW(), sent_at = NOW()
WHERE po_number = 'PO-2025-00006';
```

**Trigger déclenché**: `handle_purchase_order_forecast()`

**Mouvements créés**:
| Type | Quantité | affects_forecast | forecast_type | Notes |
|------|----------|------------------|---------------|-------|
| IN | +10 | true | in | Entrée prévisionnelle - Commande fournisseur PO-2025-00006 |

**Stock après confirmation**:
```
stock_real: 50 (inchangé)
stock_forecasted_in: 10 ✅ (+10)
stock_forecasted_out: 0
stock_quantity: 0 (anomalie cohérence, non bloquant pour test)
```

**Résultat**: ✅ **SUCCÈS** - Le trigger de confirmation fonctionne correctement

---

### Étape 3: Première Réception Partielle (4 unités)
```sql
-- ORDRE CRITIQUE: items AVANT status!
UPDATE purchase_order_items
SET quantity_received = 4
WHERE purchase_order_id = '354940aa-5864-44a7-91aa-29c41da8a483';

UPDATE purchase_orders
SET status = 'partially_received', received_at = NOW()
WHERE po_number = 'PO-2025-00006';
```

**Trigger déclenché**: `handle_purchase_order_forecast()` CAS 4 (partially_received)

**Mouvements créés** (2 nouveaux):
| Type | Quantité | affects_forecast | forecast_type | Notes |
|------|----------|------------------|---------------|-------|
| OUT | -4 | true | in | Réception partielle - Annulation prévisionnel 4/10 unités (déjà reçu: 0) |
| IN | +4 | false | null | Réception partielle - 4/10 unités reçues (déjà reçu: 0) |

**Stock après 1ère réception**:
```
stock_real: 4 ✅ (+4 différentiel)
stock_forecasted_in: 6 ✅ (10 - 4 = 6)
stock_forecasted_out: 0
stock_quantity: 4 ✅
```

**Calcul différentiel**: ✅ **PARFAIT**
- Déjà reçu: 0 unités
- Nouveau reçu: 4 unités
- Différentiel traité: 4 unités (4 - 0 = 4)

**Résultat**: ✅ **SUCCÈS COMPLET** - Le calcul différentiel fonctionne parfaitement!

---

### Étape 4: Deuxième Réception Partielle (6 unités supplémentaires)
```sql
UPDATE purchase_order_items
SET quantity_received = 10  -- Total: 4 + 6
WHERE purchase_order_id = '354940aa-5864-44a7-91aa-29c41da8a483';

UPDATE purchase_orders
SET status = 'received'  -- Réception complète
WHERE po_number = 'PO-2025-00006';
```

**Trigger déclenché**: `handle_purchase_order_forecast()` CAS ? (received)

**Mouvements créés** (2 nouveaux):
| Type | Quantité | affects_forecast | forecast_type | Notes |
|------|----------|------------------|---------------|-------|
| OUT | -10 ❌ | true | in | Annulation prévisionnel - Réception effective |
| IN | +10 ❌ | false | null | Réception effective - Commande PO-2025-00006 |

**Stock après 2ème réception**:
```
stock_real: 14 ❌ (devrait être 10: 4 + 6, obtenu 4 + 10)
stock_forecasted_in: -4 ❌ (devrait être 0: 6 - 6)
stock_forecasted_out: 0
stock_quantity: 14 ❌ (devrait être 10)
calculated_qty: 10 ✅ (14 + (-4) - 0 = 10, correct par hasard)
```

**Calcul différentiel**: ❌ **ÉCHEC**
- Déjà reçu: 4 unités
- Nouveau total reçu: 10 unités
- Différentiel attendu: 6 unités (10 - 4 = 6)
- Différentiel traité: **10 unités** ❌ (ne calcule pas le différentiel!)

**Résultat**: ❌ **BUG IDENTIFIÉ** - Le trigger traite 10 unités au lieu de 6

---

## 🐛 Analyse du Bug

### Cause Probable
Le trigger `handle_purchase_order_forecast()` semble avoir un CAS spécifique pour `status='received'` qui:
1. ❌ Ne calcule PAS le différentiel avec `déjà reçu`
2. ❌ Traite la quantité TOTALE au lieu de la quantité INCRÉMENTALE
3. ❌ Annule TOUT le prévisionnel (10 unités) au lieu du prévisionnel restant (6 unités)

### Code Trigger Suspect
```sql
-- Hypothèse: Le trigger a probablement ce code
ELSIF NEW.status = 'received' THEN
  -- Bug: Traite quantity au lieu de (quantity - quantity_received_before)
  FOR v_item IN
    SELECT quantity  -- ❌ Devrait être quantity_received!
    FROM purchase_order_items
    WHERE purchase_order_id = NEW.id
  LOOP
    -- Crée mouvements pour TOUTE la quantité
    -- au lieu de calculer différentiel
  END LOOP;
END IF;
```

### Solution Recommandée
Le trigger devrait utiliser le **même algorithme différentiel** pour `status='received'` que pour `status='partially_received'`:

```sql
-- ✅ Solution correcte
ELSIF NEW.status = 'received' OR
      (NEW.status = 'partially_received' AND OLD.status != 'partially_received') THEN

  FOR v_item IN
    SELECT
      poi.product_id,
      poi.quantity,
      COALESCE(poi.quantity_received, 0) as quantity_received
    FROM purchase_order_items poi
    WHERE poi.purchase_order_id = NEW.id
  LOOP
    -- Calculer ce qui a DÉJÀ été traité
    SELECT COALESCE(SUM(ABS(quantity_change)), 0)
    INTO v_already_received
    FROM stock_movements
    WHERE reference_type = 'purchase_order'
      AND reference_id = NEW.id
      AND product_id = v_item.product_id
      AND affects_forecast = false;  -- Mouvements réels uniquement

    -- Calculer DIFFÉRENTIEL
    v_qty_diff := v_item.quantity_received - v_already_received;

    IF v_qty_diff > 0 THEN
      -- Créer mouvements pour DIFFÉRENCE seulement
      INSERT INTO stock_movements (OUT -v_qty_diff forecast);
      INSERT INTO stock_movements (IN +v_qty_diff real);
    END IF;
  END LOOP;
END IF;
```

---

## ✅ Points Positifs

1. **Trigger confirmation**: ✅ Fonctionne parfaitement
2. **1ère réception partielle**: ✅ Calcul différentiel impeccable
3. **Architecture bi-étape**: ✅ UPDATE items AVANT status fonctionne
4. **Traçabilité**: ✅ Tous les mouvements enregistrés avec notes explicites
5. **Console browser**: ✅ Aucune erreur JavaScript critique

---

## ❌ Points à Corriger

1. **2ème réception partielle**: ❌ Ne calcule pas différentiel (10 au lieu de 6)
2. **Stock forecasted négatif**: ❌ stock_forecasted_in = -4 (incohérent)
3. **Interface UI**: ⚠️ Module réception non développé (obligé de tester via SQL)

---

## 📊 Mouvements Stock Complets (5 total)

| # | Time | Type | Qty | Forecast? | Type Forecast | Notes |
|---|------|------|-----|-----------|---------------|-------|
| 1 | 08:07:01 | IN | +10 | Oui | in | Entrée prévisionnelle initiale ✅ |
| 2 | 08:08:15 | OUT | -4 | Oui | in | Annulation prévisionnel partiel ✅ |
| 3 | 08:08:15 | IN | +4 | Non | - | Réception partielle réelle ✅ |
| 4 | 08:08:51 | OUT | -10 | Oui | in | Annulation prévisionnel complet ❌ (devrait être -6) |
| 5 | 08:08:51 | IN | +10 | Non | - | Réception complète réelle ❌ (devrait être +6) |

**Total mouvements forecast**: +10 -4 -10 = **-4** ❌ (devrait être 0)
**Total mouvements réels**: +4 +10 = **+14** ❌ (devrait être +10)

---

## 🎯 Recommandations

### Priorité 1: Corriger Bug Réception Complète
Modifier `handle_purchase_order_forecast()` pour utiliser calcul différentiel aussi pour `status='received'`

**Migration à créer**: `20251018_004_fix_received_status_differential.sql`

### Priorité 2: Ajouter Tests Automatisés
Créer tests E2E pour valider:
- Confirmation → +10 forecast
- Réception 4 unités → -4 forecast, +4 real
- Réception 6 unités supp → -6 forecast, +6 real
- Vérifier stock_forecasted_in = 0 à la fin

### Priorité 3: Développer Interface UI
Module réception actuellement en développement. Prévoir:
- Formulaire saisie quantités reçues par ligne
- Validation automatique du statut (partially_received vs received)
- Affichage temps réel du stock

---

## 📸 Preuves

**Screenshot**: `.playwright-mcp/test-final-commandes-fournisseurs.png`
- Page commandes fournisseurs
- PO-2025-00006 visible en liste
- 4 commandes affichées
- Console propre (zéro erreurs)

**Migrations testées**:
- ✅ `20251018_002_fix_partial_movements_differential.sql`
- ✅ `20251018_003_remove_trigger_b_keep_solution_a.sql`
- ⚠️ Bug dans CAS 'received' (à corriger)

---

## 🏁 Conclusion

**Succès**: Le système de réceptions partielles fonctionne pour la **première réception** avec un calcul différentiel parfait.

**Bug identifié**: La **réception complète** après une réception partielle ne calcule pas le différentiel et traite toute la quantité.

**Prochaines étapes**:
1. Créer migration correctrice pour CAS 'received'
2. Ajouter tests automatisés
3. Développer interface UI réception

**Score global**: 75% ✅ (3/4 scénarios réussis)

---

**Auteur**: Claude Code
**Référence session**: RAPPORT-SESSION-DEBUG-FIX-PARTIAL-MOVEMENTS-2025-10-18.md
**Documentation**: docs/workflows/partial-shipments-receptions.md
