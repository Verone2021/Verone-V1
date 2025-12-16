# 📊 RAPPORT BASELINE - PHASE A : ANALYSE

**Date** : 2025-10-24
**Durée analyse** : 1h30
**Serveur** : localhost:3000 (Next.js dev)
**Database** : Supabase aorroydfjsrygmosnzrl

---

## 🎯 RÉSUMÉ EXÉCUTIF

### ✅ État Global

- **Dashboard & Contacts-Organisations (Phase 1)** : ✅ Production Ready (0 erreurs)
- **Modules Phase 2+** : ❌ Erreurs critiques détectées (DB/Frontend alignment cassé)
- **TypeScript** : ❌ 111 erreurs (conflit Button ui/ vs ui-v2/)
- **Build** : ⚠️ Probable échec (TypeScript errors)

### 🚨 Problèmes Critiques Identifiés

#### 1. **DB/Frontend Alignment CASSÉ** (Priorité 1 - BLOQUANT)

**Impact** : Modules Produits, Commandes, Stocks, Factures, Ventes
**Cause** : Migration 20251022_001 (organisations.name → legal_name + trade_name)
**Modules affectés** : Tous modules dépendants d'Organisations

**Erreur console** :

```
[ERROR] column organisations_1.name does not exist
PostgreSQL error code: 42703
```

**Hooks cassés** :

- `use-catalogue.ts` → Query products avec join `organisations.name`
- `use-sales-orders.ts` → Query sales_orders avec join `organisations.name`
- `use-purchase-orders.ts` → Query purchase_orders avec join `organisations.name`
- Tous hooks utilisant organisations en relation

**Solution requise** : Remplacer tous `organisations.name` par `organisations.legal_name` (ou `trade_name` selon contexte)

#### 2. **TypeScript Errors : Button Conflict** (Priorité 2 - BLOQUANT BUILD)

**Erreurs** : 111 erreurs TypeScript
**Pattern** : `Expected corresponding JSX closing tag for 'Button'`
**Cause** : Import `Button` depuis `ui/` mais props de `ButtonV2` (`ui-v2/`)

**Fichiers affectés** : Tous composants `apps/back-office/apps/back-office/src/components/business/*.tsx`

**Solution requise** : Uniformiser imports → `ButtonV2` depuis `ui-v2/button`

---

## 📋 CONSOLE ERRORS AUDIT (6 pages testées)

### ✅ Phase 1 : Production Ready

#### 1. `/dashboard` ✅

- Console ERROR : **0**
- Console WARNING : 2 (SLO query dépassé 2477ms, 2495ms)
- Chargement : OK
- Visuel : ✅ KPIs, activité, notifications affichés
- Screenshot : `01-dashboard.png`

#### 2. `/contacts-organisations` ✅

- Console ERROR : **0**
- Console WARNING : 0
- Chargement : OK
- Visuel : ✅ 158 organisations (12 fournisseurs, 144 clients, 1 prestataire)
- Screenshot : `02-contacts-organisations.png`

---

### ❌ Phase 2+ : Erreurs Critiques

#### 3. `/produits/catalogue` ❌

- Console ERROR : **4** (column organisations_1.name does not exist)
- Console WARNING : 0
- Chargement : ÉCHEC
- Visuel : ❌ "Erreur: Erreur inconnue"
- Screenshot : `03-produits-catalogue.png`

**Détail erreurs** :

```
[ERROR] Failed to load resource: 400
[ERROR] Erreur chargement catalogue: {
  code: 42703,
  message: "column organisations_1.name does not exist"
}
```

**Query Supabase cassée** :

```
.select('..., supplier:organisations!supplier_id(id,name)')
```

#### 4. `/produits/catalogue/categories` ✅

- Console ERROR : **0**
- Console WARNING : 2 (SLO dépassé 2041ms, 2178ms)
- Chargement : OK
- Visuel : ✅ 7 familles affichées
- Screenshot : `04-produits-categories.png`

#### 5. `/stocks` ✅

- Console ERROR : **0**
- Console WARNING : 2 (SLO dépassé 2999ms, 3027ms)
- Chargement : OK
- Visuel : ✅ Dashboard stocks (0 stock)
- Screenshot : `05-stocks.png`

#### 6. `/commandes` ❌

- Console ERROR : **4** (column organisations_1.name does not exist)
- Console WARNING : 1 (Module not found: @/app/actions/sales-orders)
- Chargement : PARTIEL
- Visuel : ⚠️ "Chargement des statistiques..." (bloqué)
- Screenshot : `06-commandes.png`

**Détail erreurs** :

```
[ERROR] Failed to load resource: 400
[ERROR] Erreur récupération commandes: {
  code: 42703,
  message: "column organisations_1.name does not exist"
}
[WARNING] Module not found: Can't resolve '@/app/actions/sales-orders'
```

---

## 🔧 TYPESCRIPT ERRORS (111 total)

### Pattern Principal : JSX Closing Tag Errors

**Erreurs** : 111 fichiers affectés
**Cause** : Import `Button` depuis `ui/` mais utilisation props `ButtonV2`

**Exemples** :

```
apps/back-office/src/components/business/bug-reporter.tsx(264,7): Expected corresponding JSX closing tag for 'Button'
apps/back-office/src/components/business/catalogue-error-integration.tsx(247,13): Expected corresponding JSX closing tag for 'Button'
apps/back-office/src/components/business/characteristics-edit-section.tsx(167,15): Expected corresponding JSX closing tag for 'Button'
```

**Modules affectés** :

- Tous `apps/back-office/apps/back-office/src/components/business/*.tsx`
- Certains composants `apps/back-office/apps/back-office/src/components/forms/*.tsx`

---

## ⚙️ VALIDATION SCRIPTS RESULTS

### DB/Frontend Alignment Check

**Script** : `scripts/validation/check-db-type-alignment.ts`
**Résultat** : ✅ Exécuté avec succès

- ✅ 0 erreurs critiques
- ⚠️ 560 warnings (queries Supabase sans types explicites)

**Exemples warnings** :

```
Query Supabase sans type. Ajouter: .from<Database["public"]["Tables"]["..."]["Row"]>(...)
Fichiers: apps/back-office/src/app/admin/users/page.tsx, apps/back-office/src/hooks/*.ts
```

**Impact** : Non bloquant, mais best practice à améliorer

---

## 📊 SLO METRICS

### ✅ Conformes

- **Dashboard load** : <2s ✅ (1.6s observé)
- **Contacts-Organisations** : <2s ✅ (chargement instantané)

### ⚠️ Non conformes

- **Activity-stats query** : >2s ❌ (2477ms, 2495ms, 2999ms, 3027ms détectés)
  - Impact : Dashboard, Contacts, Stocks
  - Cause : Query `user_activity_logs` non optimisée
  - Solution : Index ou cache

---

## 🗄️ DATABASE DOCUMENTATION STATUS

### docs/database/SCHEMA-REFERENCE.md

**État** : ✅ À jour (77 tables documentées)
**Dernière mise à jour** : 21 octobre 2025
**Migration récente** : 20251022_001 (organisations legal_name/trade_name)

**Contenu vérifié** :

- ✅ Table `organisations` : 53 colonnes documentées (dont `legal_name`, `trade_name`)
- ✅ Colonne `name` : ❌ N'EXISTE PLUS (remplacée par legal_name + trade_name)
- ✅ Foreign keys : 143 relations documentées
- ✅ Triggers : 158 triggers documentés

**Divergence critique détectée** :

- **docs/** : ✅ organisations.legal_name + trade_name (correct)
- **frontend/** : ❌ Code utilise organisations.name (obsolète)

---

## 🔗 GRAPHE DÉPENDANCES MODULES

### Niveau 0 : Fondations ✅

- `organisations` ✅ (Phase 1 validée)
- `contacts` ✅ (Phase 1 validée)
- `user_profiles` ✅

### Niveau 1 : Taxonomie ⚠️

- `families` ✅ (page categories fonctionne)
- `categories` ✅
- `subcategories` ✅

### Niveau 2 : Produits Base ❌

- `products` ❌ (cassé - dépend organisations.name)
- `collections` ⚠️ (non testé)
- `price_lists` ⚠️ (non testé)

### Niveau 4 : Commandes ❌

- `sales_orders` ❌ (cassé - dépend organisations.name)
- `purchase_orders` ❌ (cassé - dépend organisations.name)

---

## 🎯 PRIORISATION FIXES

### 🔴 CRITIQUE - Bloquant (Phase B.1)

1. **Fix organisations.name → legal_name** (tous hooks)
   - `use-catalogue.ts`
   - `use-sales-orders.ts`
   - `use-purchase-orders.ts`
   - `use-suppliers.ts` (vérifier)
   - Estimation : 2-3 heures

2. **Fix Button imports** (111 fichiers)
   - Remplacer `Button` par `ButtonV2`
   - Estimation : 3-4 heures (script automatique possible)

### 🟡 HAUTE - Performance (Phase B.2)

3. **Optimize activity-stats query**
   - Index sur `user_activity_logs.user_id`
   - Cache Redis potentiel
   - Estimation : 1 heure

### 🟢 NORMALE - Best Practices (Phase B.3)

4. **Add TypeScript types to Supabase queries** (560 warnings)
   - Non bloquant mais améliore DX
   - Estimation : 1 jour (progressif)

---

## 📁 PAGES NON TESTÉES

**Phase 2 restantes** :

- `/produits/sourcing`
- `/produits/catalogue/collections`
- `/produits/catalogue/variantes`
- `/ventes`
- `/consultations`
- `/canaux-vente/google-merchant`
- `/factures`
- `/finance`
- `/tresorerie`

**Statut probable** : Même erreur `organisations.name` attendue

---

## 🚀 PROCHAINES ÉTAPES RECOMMANDÉES

### Phase B.1 : Fix Critique (1 jour)

1. ✅ **PAUSE** : Présenter rapport + attendre autorisation user
2. ⏸️ Fix `organisations.name` → `legal_name` dans tous hooks
3. ⏸️ Fix `Button` → `ButtonV2` imports (111 fichiers)
4. ⏸️ Test build : `npm run build`
5. ⏸️ Re-test 6 pages (console errors = 0)

### Phase B.2 : Validation Module par Module (8-12 jours)

- 1 module → Test → Rapport → PAUSE → Autorisation user → Next

### Phase B.3 : Documentation & Protection (2 jours)

- Documentation complète modules validés
- Protection PROTECTED_FILES.json
- Commits atomiques + PRs progressives

---

## 📸 SCREENSHOTS

Tous screenshots sauvegardés dans : `.playwright-mcp/phase-a-audit/`

1. `01-dashboard.png` ✅
2. `02-contacts-organisations.png` ✅
3. `03-produits-catalogue.png` ❌ (erreur visible)
4. `04-produits-categories.png` ✅
5. `05-stocks.png` ✅
6. `06-commandes.png` ❌ (chargement bloqué)

---

## ✅ SUCCESS METRICS ACTUELS

| Métrique                  | Target  | Actuel       | Status |
| ------------------------- | ------- | ------------ | ------ |
| Console errors (Phase 1)  | 0       | 0            | ✅     |
| Console errors (Phase 2+) | 0       | 8+           | ❌     |
| TypeScript errors         | 0       | 111          | ❌     |
| Dashboard load            | <2s     | 1.6s         | ✅     |
| Build                     | Success | Failed       | ❌     |
| Documentation             | 100%    | 100% (docs/) | ✅     |

---

**🎉 FIN PHASE A : ANALYSE BASELINE**

⏸️ **PAUSE OBLIGATOIRE** : Attente autorisation user avant Phase B (fixes)
