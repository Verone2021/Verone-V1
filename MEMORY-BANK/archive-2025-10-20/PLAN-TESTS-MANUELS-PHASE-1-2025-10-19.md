# 🧪 PLAN TESTS MANUELS - Phase 1 Complete

**Date** : 2025-10-19
**Objectif** : Validation exhaustive 8 pages après optimisations performance
**Durée Estimée** : 1h20 (8 pages × 10 min)
**Status** : ⏳ EN ATTENTE UTILISATEUR

---

## 📋 CHECKLIST GLOBALE

### Pré-requis
- [x] Migrations appliquées (7/7 migrations Oct 18-19)
- [x] Optimisations performance appliquées (+1.1s gain)
- [x] Build Next.js clean (0 erreur TypeScript)
- [x] Dev server running (http://localhost:3000)
- [ ] Browser DevTools Console ouvert (F12)

### Objectifs Validation
- [ ] **0 erreur console** sur TOUTES les pages (Zero Tolerance Policy)
- [ ] **Workflows fonctionnels** (réceptions/expéditions partielles)
- [ ] **Performance respectée** (Dashboard <2s, autres <3s)
- [ ] **Screenshots capturés** (1 par page = 8 total)

---

## 🎯 TESTS PAR PAGE

### **Page 1/8 : Dashboard Principal** `/`

**Objectif** : Métriques agrégées multi-modules
**Durée** : 10 min

#### Checklist
- [ ] Navigation : `http://localhost:3000/`
- [ ] Console : **0 erreur** (F12 → Console tab → filter errors)
- [ ] Screenshot : Capture avec DevTools console visible

#### Métriques à Vérifier
- [ ] **KPI Stock** : Valeur stock (€), Stock réel (unités), Alertes (count)
- [ ] **KPI Commandes** : CA mois (€), Commandes ventes (count), Achats (count)
- [ ] **Widget Stock Prévisionnel** : Entrées prévisionnelles, Sorties prévisionnelles
- [ ] **Widget Alertes Stock** : Liste produits en rupture/stock faible

#### Tests Interactions
- [ ] Hover sur KPI cards → Shadow élégante
- [ ] Click sur "Voir plus" → Navigation correcte
- [ ] Refresh page (Cmd+R) → Rechargement propre

#### Performance
- [ ] Temps chargement : **< 2s** (Network tab → DOMContentLoaded)
- [ ] API calls : RPC `get_dashboard_stock_orders_metrics()` → 200 OK

---

### **Page 2/8 : Dashboard Stocks** `/stocks`

**Objectif** : Validation optimisations useStockDashboard (+900ms gain)
**Durée** : 15 min

#### Checklist
- [ ] Navigation : `http://localhost:3000/stocks`
- [ ] Console : **0 erreur** (CRITIQUE : vérifier Fix N+1 query)
- [ ] Screenshot : Capture console + page entière

#### Métriques à Vérifier
- [ ] **Stock Réel** : Valeur correcte (ex: 115 unités)
- [ ] **Stock Disponible** : = Réel - Prévisionnel Sortant
- [ ] **Alertes Stock** : Count cohérent avec table produits
- [ ] **Valeur Stock** : = Σ (stock_real × cost_price)
- [ ] **Widget Prévisionnel** : +XX entrées, -YY sorties
- [ ] **Top 5 Alertes** : Produits en rupture/stock faible (avec noms!)

#### Tests Interactions
- [ ] Hover sur graphique mouvements → Tooltip visible
- [ ] Click sur alerte produit → Navigation vers fiche produit
- [ ] Refresh page → Rechargement < 2s

#### Validation Performance (CRITIQUE)
- [ ] Network tab → Filtrer "products"
  - [ ] **1 seule query** products (not 5+) ✅ Fix N+1
  - [ ] **Promise.all** queries parallèles ✅ Fix #2
- [ ] Console → Aucun warning "N+1 query detected"
- [ ] Temps total : **< 2s** (était 2.5s avant fix)

#### Tests Données
- [ ] Vérifier cohérence KPI avec database :
```sql
-- SQL à exécuter dans Supabase SQL Editor
SELECT
  SUM(stock_real) as total_real,
  SUM(stock_forecasted_in) as total_in,
  SUM(stock_forecasted_out) as total_out,
  COUNT(*) FILTER (WHERE stock_real > 0) as products_in_stock
FROM products
WHERE archived_at IS NULL;
```
- [ ] Comparer résultats SQL avec KPIs affichés → **Doivent matcher**

---

### **Page 3/8 : Mouvements Stock** `/stocks/mouvements`

**Objectif** : Timeline complète mouvements + filtres
**Durée** : 10 min

#### Checklist
- [ ] Navigation : `http://localhost:3000/stocks/mouvements`
- [ ] Console : **0 erreur**
- [ ] Screenshot : Table mouvements avec filtres

#### Métriques à Vérifier
- [ ] **Tableau Mouvements** :
  - [ ] Colonne Date (performed_at)
  - [ ] Colonne Produit (nom + SKU)
  - [ ] Colonne Type (IN/OUT/ADJUST avec badges couleur)
  - [ ] Colonne Quantité (avec +/- selon type)
  - [ ] Colonne Stock Avant/Après
  - [ ] Colonne Raison (reason_code)

#### Tests Interactions
- [ ] **Filtre Type** : IN → Affiche seulement mouvements IN
- [ ] **Filtre Date** : Derniers 7 jours → Filtre correct
- [ ] **Pagination** : Click page 2 → Navigation correcte
- [ ] **Tri** : Click colonne Date → Tri DESC/ASC

#### Tests Données
- [ ] Vérifier mouvement récent visible
- [ ] Click sur nom produit → Modal détail produit
- [ ] Vérifier affects_forecast = false (mouvements réels seulement)

---

### **Page 4/8 : Réceptions Partielles** `/stocks/receptions`

**Objectif** : Workflow réceptions + triggers partiels
**Durée** : 15 min

#### Checklist
- [ ] Navigation : `http://localhost:3000/stocks/receptions`
- [ ] Console : **0 erreur** (CRITIQUE : vérifier triggers)
- [ ] Screenshot : Formulaire réception + confirmation

#### Tests Workflow Complet

**Test 1 : Réception Partielle 50%**
1. [ ] Click "Nouvelle Réception"
2. [ ] Sélectionner PO avec status="confirmed"
3. [ ] Item 1 : Commandé=10, Recevoir=5 (50%)
4. [ ] Click "Valider Réception"
5. [ ] Vérifier modal confirmation
6. [ ] Click "Confirmer"

**Validations Post-Réception** :
- [ ] PO status → `partially_received` ✅
- [ ] Item quantity_received → 5 ✅
- [ ] Stock movement créé :
  - [ ] Type = IN
  - [ ] quantity_change = +5
  - [ ] affects_forecast = false
  - [ ] reference_type = purchase_order
- [ ] Trigger `handle_purchase_order_forecast` exécuté :
  - [ ] stock_forecasted_in réduit de 5
  - [ ] stock_real augmenté de 5

**Test 2 : Réception Complète (50% restant)**
1. [ ] Rouvrir même PO
2. [ ] Item 1 : Commandé=10, Déjà reçu=5, Recevoir=5
3. [ ] Valider réception
4. [ ] Vérifier PO status → `received` ✅ (100% reçu)

#### Tests Console SQL
```sql
-- Vérifier PO status après réception partielle
SELECT po_number, status,
  (SELECT SUM(quantity) FROM purchase_order_items WHERE purchase_order_id = po.id) as ordered,
  (SELECT SUM(quantity_received) FROM purchase_order_items WHERE purchase_order_id = po.id) as received
FROM purchase_orders po
WHERE po_number = 'PO-2025-XXXXX'; -- Remplacer par PO testée

-- Vérifier stock movements créés
SELECT * FROM stock_movements
WHERE reference_type = 'purchase_order'
AND reference_id = 'UUID-PO'
ORDER BY performed_at DESC;
```

---

### **Page 5/8 : Expéditions Partielles** `/stocks/expeditions`

**Objectif** : Workflow expéditions + triggers partiels
**Durée** : 15 min

#### Checklist
- [ ] Navigation : `http://localhost:3000/stocks/expeditions`
- [ ] Console : **0 erreur**
- [ ] Screenshot : Formulaire expédition

#### Tests Workflow Complet

**Test 1 : Expédition Partielle 30%**
1. [ ] Click "Nouvelle Expédition"
2. [ ] Sélectionner SO avec status="confirmed"
3. [ ] Item 1 : Commandé=10, Expédier=3 (30%)
4. [ ] Click "Valider Expédition"
5. [ ] Confirmer modal

**Validations Post-Expédition** :
- [ ] SO status → `partially_shipped` ✅
- [ ] Item quantity_shipped → 3 ✅
- [ ] Stock movement créé :
  - [ ] Type = OUT
  - [ ] quantity_change = -3
  - [ ] affects_forecast = false
  - [ ] reference_type = sales_order
- [ ] Trigger `handle_sales_order_stock` exécuté :
  - [ ] stock_forecasted_out réduit de 3
  - [ ] stock_real réduit de 3

**Test 2 : Vérifier Contrainte Stock Insuffisant**
1. [ ] Tenter expédier quantité > stock_real
2. [ ] Vérifier erreur bloquante
3. [ ] Message : "Stock insuffisant"

---

### **Page 6/8 : Dashboard Produits** `/produits/catalogue/dashboard`

**Objectif** : Métriques catalogue + performance
**Durée** : 10 min

#### Checklist
- [ ] Navigation : `http://localhost:3000/produits/catalogue/dashboard`
- [ ] Console : **0 erreur**
- [ ] Screenshot : KPIs catalogue

#### Métriques à Vérifier
- [ ] **Total Catalogue** : Count produits non archivés
- [ ] **Produits Sourcing** : Count produits creation_mode='sourcing'
- [ ] **Taux Complétion** : % moyen champs remplis
- [ ] **Images** : Count produits avec product_images

#### Tests Interactions
- [ ] Click "Voir Catalogue" → Navigation `/produits/catalogue`
- [ ] Graphique répartition catégories → Tooltip visible
- [ ] Refresh page → < 3s

---

### **Page 7/8 : Commandes Fournisseurs** `/commandes/fournisseurs`

**Objectif** : Validation Fix #3 payload optimization
**Durée** : 15 min

#### Checklist
- [ ] Navigation : `http://localhost:3000/commandes/fournisseurs`
- [ ] Console : **0 erreur** (CRITIQUE : vérifier payload)
- [ ] Screenshot : Table commandes

#### Métriques à Vérifier
- [ ] **KPIs** :
  - [ ] Total Commandes (count)
  - [ ] Valeur Total (€)
  - [ ] En Cours (confirmed + partially_received)
  - [ ] Reçues (received)
- [ ] **Tableau** :
  - [ ] Colonne PO Number
  - [ ] Colonne Fournisseur (organisations.name)
  - [ ] Colonne Status (badge couleur)
  - [ ] Colonne Montant HT
  - [ ] Colonne Date livraison attendue

#### Validation Performance (CRITIQUE Fix #3)
- [ ] Network tab → Filtrer "purchase_orders"
  - [ ] Payload response : Vérifier colonnes explicites (pas *)
  - [ ] Transfer size : **< 50KB** (était ~65KB avant)
- [ ] Temps chargement : **< 2s** (était 1.8s)

#### Tests Interactions
- [ ] Click ligne PO → Modal détail
- [ ] Modal : Vérifier items avec produits (nom, SKU, image)
- [ ] Click "Réceptionner" → Navigation `/stocks/receptions`

#### Tests Données
```sql
-- Vérifier incohérences statuts (doit être 0)
SELECT po_number, status, total_qty, total_received
FROM (
  SELECT po.po_number, po.status,
    SUM(poi.quantity) as total_qty,
    SUM(COALESCE(poi.quantity_received, 0)) as total_received
  FROM purchase_orders po
  LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
  WHERE po.status IN ('confirmed', 'partially_received')
  GROUP BY po.id, po.po_number, po.status
) sub
WHERE total_received >= total_qty AND status != 'received';
-- Résultat attendu : 0 lignes ✅
```

---

### **Page 8/8 : Commandes Clients** `/commandes/clients`

**Objectif** : Sales orders workflow
**Durée** : 10 min

#### Checklist
- [ ] Navigation : `http://localhost:3000/commandes/clients`
- [ ] Console : **0 erreur**
- [ ] Screenshot : Table sales orders

#### Métriques à Vérifier
- [ ] **KPIs** :
  - [ ] Total Commandes (count)
  - [ ] CA Total (€)
  - [ ] À Expédier (confirmed)
  - [ ] Expédiées (shipped)
- [ ] **Tableau** :
  - [ ] Colonne Order Number
  - [ ] Colonne Client (customer_name)
  - [ ] Colonne Status
  - [ ] Colonne Montant TTC

#### Tests Interactions
- [ ] Click ligne SO → Modal détail
- [ ] Modal : Items avec produits + images
- [ ] Click "Expédier" → Navigation `/stocks/expeditions`

---

## 📸 SCREENSHOTS REQUIS

Pour chaque page, capturer :
1. **Page entière** : Scroll complet visible
2. **Console DevTools** : Visible dans capture (F12 ouvert)
3. **Network tab** : Timing visible (DOMContentLoaded)

**Naming Convention** :
```
validation-page-{numero}-{nom-page}-{date}.png

Exemples :
- validation-page-1-dashboard-principal-2025-10-19.png
- validation-page-2-stocks-dashboard-2025-10-19.png
- validation-page-4-receptions-partielles-2025-10-19.png
```

---

## ✅ CRITÈRES SUCCÈS

### MANDATORY (Bloquants)
- [ ] **0 erreur console** sur TOUTES les 8 pages
- [ ] **0 warning React** (asChild, key props, etc.)
- [ ] **Workflows partiels fonctionnels** (réceptions + expéditions)
- [ ] **Triggers database exécutés** (stock_forecasted_in/out mis à jour)
- [ ] **PO/SO statuts cohérents** (0 incohérence query SQL)

### IMPORTANT (Non-bloquants mais signalés)
- [ ] Performance < SLO (Dashboard <2s, autres <3s)
- [ ] Payload optimisé (transfer size réduit)
- [ ] Images produits chargées (BR-TECH-002)
- [ ] Accessibility score >90 (Lighthouse)

### NICE TO HAVE
- [ ] Animations smooth (transitions 200ms)
- [ ] Hover effects élégants (scale 1.02)
- [ ] Tooltips utiles
- [ ] Messages erreur clairs

---

## 🚨 PROCÉDURE SI ERREUR DÉTECTÉE

### Si Erreur Console
1. [ ] Screenshot erreur complète (stack trace)
2. [ ] Noter page exacte + étape reproduction
3. [ ] Copier message erreur dans rapport
4. [ ] **STOPPER tests** → Signaler immédiatement

### Si Workflow Échoue
1. [ ] Screenshot état avant échec
2. [ ] Copier payload request/response (Network tab)
3. [ ] Vérifier database : état PO/SO/stock_movements
4. [ ] SQL query pour rollback si nécessaire

### Si Performance Dégradée
1. [ ] Network tab : Identifier query lente
2. [ ] Performance tab : Flame graph
3. [ ] Noter temps chargement réel
4. [ ] Comparer avec baseline (avant optimisations)

---

## 📊 RAPPORT FINAL ATTENDU

Créer fichier : `RAPPORT-TESTS-MANUELS-PHASE-1-2025-10-19.md`

**Structure** :
```markdown
# Résultats Tests Manuels - Phase 1

## Résumé Exécutif
- Pages testées : X/8
- Erreurs détectées : X
- Statut : ✅ PASS / ❌ FAIL

## Résultats Détaillés

### Page 1/8 : Dashboard Principal
- Console : ✅ 0 erreur
- Performance : 1.8s (SLO: <2s) ✅
- Screenshot : validation-page-1-dashboard-principal-2025-10-19.png
- Notes : RAS

[Répéter pour chaque page]

## Erreurs Détectées
[Si aucune : "Aucune erreur détectée ✅"]

## Recommandations
[Actions suggérées si erreurs]

## Validation Finale
- [ ] Production Ready : OUI / NON
- [ ] Date validation : YYYY-MM-DD
- [ ] Validé par : [Nom]
```

---

## 🎯 VALIDATION FINALE

**Statut attendu** : ✅ **100% PRODUCTION READY**

Si TOUTES les conditions remplies :
- 0 erreur console (8/8 pages)
- Workflows fonctionnels (réceptions + expéditions)
- Performance < SLO (Dashboard <2s)
- Database cohérente (0 incohérence)

→ **GO PRODUCTION** ✅

---

**Durée totale estimée** : 1h20
**Préparée par** : Claude Code Agent (verone-orchestrator)
**Date** : 2025-10-19
**Version** : Phase 1 Complete - Post Performance Fixes

*Vérone Back Office - Professional Quality Assurance Protocol*
