# /test-critical - Tests Essentiels Ciblés

**RÉVOLUTION 2025** : ~50 tests ciblés au lieu de 677. Focus sur ce qui compte vraiment.

## Usage
```bash
/test-critical [module]
```

## Tests par Module

### Dashboard (5 tests vs 59)
1. **KPIs Loading** : Métriques chargées <2s, données correctes
2. **Navigation** : Menu principal fonctionnel, redirections OK
3. **Real-time** : Mises à jour Supabase temps réel
4. **Responsive** : Mobile/Desktop adaptatif
5. **Error States** : Gestion erreurs réseau/API

### Catalogue (7 tests vs 134)
1. **Products List** : Affichage <3s, images + données
2. **Search** : Recherche + filtres fonctionnels
3. **Product Details** : Page détail complète
4. **Pagination** : Navigation pages performante
5. **Add to Cart** : Ajout panier + quantités
6. **Filters & Sort** : Tri et filtrage précis
7. **Mobile** : Expérience mobile fluide

### Stocks (4 tests vs 87)
1. **Inventory Display** : Stock temps réel affiché
2. **Stock Updates** : Modifications persistées DB
3. **Low Stock Alerts** : Notifications stock bas
4. **Movement History** : Historique mouvements OK

### Commandes (4 tests)
1. **Order Creation** : Nouvelle commande fonctionnelle
2. **Order Lifecycle** : Workflow complet B2B/B2C
3. **Payment Flow** : Validation paiement OK
4. **Invoice Generation** : PDF généré <5s

## Workflow Automatisé

### 1. Environment Check
- Credentials `.env.local` valides (automatique)
- Database connectivity OK
- API endpoints disponibles

### 2. Browser Setup (Playwright)
- `mcp__playwright__browser_navigate` vers page module
- Clear cache si nécessaire
- Viewport standard : 1920x1080

### 3. Test Execution
**Pour chaque test :**
- Navigation vers page concernée
- `mcp__playwright__browser_console_messages` - Zero errors
- Interaction UI avec `mcp__playwright__browser_click`
- Validation résultat attendu
- `mcp__playwright__browser_take_screenshot` si erreur
- Log : ✅ SUCCESS ou ❌ FAILURE avec détails

### 4. Performance Monitoring
**SLOs Mandatory:**
- Dashboard <2s
- Catalogue <3s
- Commandes <4s
- PDF Generation <5s

Mesure avec Playwright + `mcp__supabase__execute_sql` pour query perf

### 5. Accessibility Check
- `mcp__playwright__browser_snapshot` - Accessibility tree
- Navigation clavier fonctionnelle
- Contraste couleurs Design System Vérone V2

### 6. Results Report
**Format :**
```
Module: [nom]
Tests: [passed]/[total]
Performance: [temps moyen]
Console Errors: [count] (Target: 0)
Status: ✅ SUCCESS | ❌ FAILURE
```

Si erreurs détectées → Escalation automatique vers `/error-check`

## Arguments
```bash
/test-critical              # Tous modules critiques (Dashboard + Catalogue)
/test-critical dashboard    # Dashboard uniquement (5 tests)
/test-critical catalogue    # Catalogue uniquement (7 tests)
/test-critical stocks       # Stocks uniquement (4 tests)
/test-critical commandes    # Commandes uniquement (4 tests)
```

## Success Metrics
✅ 100% tests critiques passed
✅ Performance SLOs respectés (<2s, <3s, <4s, <5s)
✅ Zero console errors
✅ Accessibility compliant

**GAIN : Tests en 5 minutes au lieu de 2 heures !**
