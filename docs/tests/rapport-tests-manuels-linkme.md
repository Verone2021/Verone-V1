# Rapport de Tests Manuels - LinkMe & Back-Office
Date: 2026-01-25
Testeur: Claude (MCP Chrome DevTools)

---

## Résumé Exécutif

**Tests effectués**: 5
**Bugs critiques**: 3
**Bugs mineurs**: 2
**Status global**: ⚠️ PROBLÈMES CRITIQUES DÉTECTÉS

---

## Bugs Trouvés

### BUG-001: Session corrompue bloque la page indéfiniment ✅ CORRIGÉ
**Sévérité**: CRITIQUE  
**App**: LinkMe  
**Status**: ✅ CORRIGÉ (commit 260bd19c)

**Description**:  
Quand une session contenait un user_id invalide (utilisateur supprimé, session corrompue), la page restait bloquée sur un spinner infini avec des erreurs répétées en console.

**Erreurs console**:
```
[AuthContext] v_linkme_users ERROR {code: 'PGRST116', ...}
```

**Correction appliquée**:  
Ajout de nettoyage automatique de session corrompée dans `AuthContext.tsx` quand PGRST116 est détecté.

**Fichier**: `apps/linkme/src/contexts/AuthContext.tsx`

---

### BUG-002: Warning Next.js Image aspect ratio ✅ CORRIGÉ
**Sévérité**: MINEUR  
**App**: LinkMe  
**Status**: ✅ CORRIGÉ (commit 9ad27a40)

**Description**:  
Warning console sur le logo LinkMe.

**Message**:
```
Image with src "/logo-linkme.png" has either width or height modified, 
but not the other. If you use CSS to change the size of your image, 
also include the styles 'width: "auto"' or 'height: "auto"'
```

**Correction appliquée**:  
Utilisation de `style={{ width: 'auto' }}` au lieu de `className` pour le logo.

**Fichier**: `apps/linkme/src/components/layout/MinimalHeader.tsx`

---

### BUG-003: Warnings Recharts dimensions
**Sévérité**: MINEUR (COSMÉTIQUE)  
**App**: Back-Office  
**Status**: ⚠️ NON BLOQUANT

**Description**:  
8 warnings sur les dimensions des graphiques Recharts au chargement initial du dashboard.

**Message**:
```
The width(-1) and height(-1) of chart should be greater than 0,
please check the style of container, or the props width(100%) and height(100%)
```

**Impact**: Aucun - les graphiques s'affichent correctement après le rendu initial.

**Recommandation**: Non prioritaire, comportement connu de Recharts.

---

### BUG-004: Timeout SQL sur get_linkme_orders
**Sévérité**: CRITIQUE  
**App**: Back-Office  
**Page**: `/canaux-vente/linkme/commandes`  
**Status**: ❌ NON CORRIGÉ

**Description**:  
La fonction PostgreSQL `get_linkme_orders` provoque des timeouts lors du chargement de la liste des commandes LinkMe.

**Erreurs console**:
```
❌ [FETCH] Erreur lors de la récupération des commandes: 
canceling statement due to statement timeout

Erreur fetch LinkMe enriched data: (multiple times)
```

**Requêtes réseau**:
- `POST /rest/v1/rpc/get_linkme_orders` - **500 (timeout)**
- `GET /rest/v1/sales_orders?...` - **500**

**Cause probable**:  
La RPC `get_linkme_orders` effectue de nombreux JOINs complexes sur:
- `linkme_orders_with_margins` (vue)
- `linkme_order_items_enriched` (vue avec JOINs)
- `sales_orders`, `linkme_selections`, `linkme_affiliates`
- `linkme_commissions` (LATERAL JOIN)

**Impact**:
- Liste des commandes LinkMe inaccessible dans le Back-Office
- Page affiche "0 commandes" alors qu'il y en a
- Chargement bloqué

**Fichiers concernés**:
- `supabase/migrations/20260106_include_items_in_linkme_orders_rpc.sql`
- `supabase/migrations/20260109_005_fix_linkme_order_items_enriched_tax_rate.sql`

**Recommandations**:
1. Ajouter des index sur les colonnes de JOIN
2. Matérialiser certaines vues
3. Simplifier les JOINs ou utiliser plusieurs requêtes
4. Augmenter le statement_timeout temporairement

---

### BUG-005: Page 404 sur détails de commande
**Sévérité**: CRITIQUE  
**App**: Back-Office  
**Page**: `/commandes/clients/429e1ce7-70d1-45a3-a3bb-c6318e043eed`  
**Status**: ❌ NON CORRIGÉ

**Description**:  
Accès aux détails d'une commande retourne une page 404 alors que la commande existe et est listée dans le dashboard.

**Comportement observé**:
- Dashboard affiche la commande "SO-2026-00002"
- Clic sur la commande → Page 404
- Aucune requête SQL n'est effectuée (échec au SSR)

**Cause probable**:  
Lié au BUG-004 - Si `get_linkme_orders` timeout pendant le Server-Side Rendering, Next.js retourne `notFound()`.

**Impact**:
- Impossible de consulter les détails des commandes LinkMe
- Workflow de gestion des commandes bloqué

---

## Tests Réussis ✅

### Test 1: Login LinkMe
**Status**: ✅ PASS (après correction BUG-001)
- Connexion avec `admin@pokawa-test.fr` réussie
- Redirection vers dashboard OK
- Données chargées correctement

### Test 2: Dashboard LinkMe
**Status**: ✅ PASS
- Total commissions: 34 121,47 €
- Payables: 33 300,01 €
- Interface fonctionnelle

### Test 3: Nouvelle Commande LinkMe
**Status**: ✅ PASS
- 143 restaurants affichés (37 Propres, 93 Franchises)
- Pagination fonctionnelle (page 1 sur 16)
- Recherche et filtres OK

### Test 4: Login Back-Office
**Status**: ✅ PASS
- Connexion avec `veronebyromeo@gmail.com` réussie
- Dashboard chargé avec toutes les KPIs
- Graphiques affichés correctement

---

## Résumé des Corrections Appliquées

| Bug | Sévérité | Status | Commit |
|-----|----------|--------|--------|
| BUG-001 | CRITIQUE | ✅ Corrigé | 260bd19c |
| BUG-002 | MINEUR | ✅ Corrigé | 9ad27a40 |
| BUG-003 | MINEUR | ⚠️ Non bloquant | - |
| BUG-004 | CRITIQUE | ❌ À corriger | - |
| BUG-005 | CRITIQUE | ❌ À corriger | - |

---

## Prochaines Étapes Recommandées

### Priorité 1 - CRITIQUE
1. **Optimiser get_linkme_orders** (BUG-004)
   - Analyser le query plan avec EXPLAIN ANALYZE
   - Ajouter index manquants
   - Considérer la matérialisation de vues

2. **Corriger page 404 commandes** (BUG-005)
   - Vérifier le composant serveur de la page
   - Ajouter gestion d'erreur SQL timeout
   - Implémenter fallback si RPC échoue

### Priorité 2 - MINEUR
3. **Warning Recharts** (BUG-003)
   - Optionnel, non bloquant

---

## Environnement de Test

- Date: 2026-01-25
- URLs testées:
  - LinkMe: http://localhost:3002
  - Back-Office: http://localhost:3000
- Navigateur: Chrome DevTools MCP
- Credentials:
  - LinkMe: admin@pokawa-test.fr
  - Back-Office: veronebyromeo@gmail.com

