# /test-critical - Tests Essentiels Ciblés

## Description
**RÉVOLUTION 2025** : Tests ciblés intelligents remplaçant le système 677 tests "usine à gaz". Focus sur les tests critiques uniquement.

## Usage
```bash
/test-critical [module]
```

## Stratégie Tests Révolutionnaire

### **❌ TERMINÉ : Système 677 Tests Complexe**
- Parser 677 tests supprimé
- Hooks sur-engineered supprimés
- Sync Supabase exhaustive supprimée
- **GAIN TEMPS : -80% (50 tests vs 677)**

### **✅ NOUVEAU : Tests Ciblés par Priorité**

#### **Dashboard (5 tests critiques vs 59)**
1. **KPIs Loading Performance** :
   - `mcp__playwright__browser_navigate` vers Dashboard
   - `mcp__playwright__browser_console_messages` (zero errors)
   - Vérifier chargement métriques <2s

2. **Navigation Principal** :
   - Clic sur menu items principaux
   - Vérifier redirections fonctionnelles
   - Console clean après navigation

3. **Real-time Updates** :
   - Supabase real-time data display
   - `mcp__supabase__get_logs` pour vérifier API calls

4. **Responsive Design** :
   - `mcp__playwright__browser_resize` mobile/desktop
   - Vérifier layout adaptatif

5. **Error Handling** :
   - Simuler erreur réseau
   - Vérifier UI error states

#### **Catalogue (7 tests essentiels vs 134)**
1. **Products List Loading** :
   - Navigation catalogue
   - Performance <3s pour affichage
   - Console error check

2. **Search Functionality** :
   - Test recherche produits
   - Filtres prix/catégorie
   - Résultats cohérents

3. **Product Details** :
   - Clic produit → détails
   - Images, prix, description
   - Actions ajout panier

4. **Pagination** :
   - Navigation pages produits
   - URLs propres
   - Performance maintained

5. **Add to Cart** :
   - Fonctionnalité ajout panier
   - Mise à jour quantités
   - Persistence session

6. **Filters & Sort** :
   - Filtres catégorie fonctionnels
   - Tri prix/nom/date
   - URL state management

7. **Mobile Experience** :
   - Responsive catalogue mobile
   - Touch interactions
   - Performance maintenue

#### **Stocks (4 tests bloquants vs 87)**
1. **Inventory Display** :
   - Affichage stocks actuels
   - Données temps réel Supabase

2. **Stock Updates** :
   - Modifications quantités
   - Persistence database

3. **Low Stock Alerts** :
   - Notifications stock bas
   - UI indicators

4. **Movement History** :
   - Historique mouvements
   - Export/import data

### Phase 1: PRE-TEST SETUP
1. **Environment Check** :
   - `mcp__supabase__get_logs` pour vérifier services up
   - Database connectivity test
   - API endpoints disponibles

2. **Browser Preparation** :
   - `mcp__playwright__browser_navigate` vers home
   - Clear cache/cookies si nécessaire
   - Viewport standard (1920x1080)

### Phase 2: CRITICAL TESTS EXECUTION
1. **Module Selection** :
   - Si `$ARGUMENTS` fourni : tester module spécifique
   - Si vide : tester tous modules critiques (Dashboard + Catalogue)

2. **Test Execution** :
   - Pour chaque test : `mcp__playwright__browser_console_messages`
   - Capture screenshot si erreur : `mcp__playwright__browser_take_screenshot`
   - Log résultat : success/failure avec détails

3. **Performance Monitoring** :
   - Dashboard <2s, Catalogue <3s mandatory
   - `mcp__supabase__execute_sql` pour query performance
   - Memory usage reasonable (pas de fuites)

### Phase 3: VALIDATION & REPORTING
1. **Results Compilation** :
   - Taux succès par module
   - Liste erreurs critiques trouvées
   - Performance metrics

2. **Error Escalation** :
   - Si erreurs critiques : /error-check automatique
   - Sentry escalation si récurrent
   - Block deployment jusqu'à résolution

### Phase 4: ACCESSIBILITY & FINAL CHECK
1. **Accessibility Validation** :
   - `mcp__playwright__browser_snapshot` pour accessibility tree
   - Vérifier navigation clavier
   - Contraste couleurs (Design System Vérone)

2. **Cross-Browser Basic Check** :
   - Test sur viewport mobile simulé
   - Navigation touch events
   - Performance maintenue

## Arguments Possibles
```bash
/test-critical              # Tous modules critiques (Dashboard + Catalogue)
/test-critical dashboard     # Dashboard uniquement (5 tests)
/test-critical catalogue     # Catalogue uniquement (7 tests)
/test-critical stocks        # Stocks uniquement (4 tests)
```

## Success Metrics
- ✅ **100% tests critical passed**
- ✅ **Performance SLOs respectés**
- ✅ **Zero console errors**
- ✅ **Accessibility compliant**

## Integration Workflow
```bash
# Workflow standard
/feature-start → development → /error-check → /test-critical → /deploy-check
```

**AVANTAGE RÉVOLUTIONNAIRE : Tests terminés en 5 minutes au lieu de 2 heures !**