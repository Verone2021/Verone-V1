# 🧪 TEMPLATE : Plan de Tests Module [MODULE]

**Date** : [DATE]
**Module** : **[MODULE]** (ex: Catalogue, Organisation, Finance, Interactions Clients)
**Pages concernées** : [LISTE_PAGES]
**Testeur** : Claude Code + MCP Playwright Browser

---

## 🎯 OBJECTIF

Tester et valider la section **[MODULE]** de Vérone Back Office en utilisant **MCP Playwright Browser** pour garantir :
1. ✅ Fonctionnalités conformes aux spécifications métier
2. ✅ Console 100% clean (0 erreur - **règle sacrée**)
3. ✅ Opérations CRUD complètes et sécurisées (si applicable)
4. ✅ Performance conforme aux SLOs Vérone

---

## 📋 SCOPE DE TESTS

### Pages à Tester

Remplacer par vos pages spécifiques :

- [ ] `/[module]` - Page principale liste
- [ ] `/[module]/[id]` - Page détail
- [ ] `/[module]/create` - Création (si applicable)
- [ ] `/[module]/[id]/edit` - Édition (si applicable)
- [ ] `/[module]/settings` - Configuration (si applicable)

### Fonctionnalités Clés à Valider

Remplacer par vos fonctionnalités :

1. **Navigation & Affichage**
   - [ ] Chargement page sans erreur console
   - [ ] Données affichées correctement
   - [ ] Filtres et recherche fonctionnels

2. **CRUD Operations** (si applicable)
   - [ ] CREATE : Création nouvel élément
   - [ ] READ : Consultation détails
   - [ ] UPDATE : Modification informations
   - [ ] DELETE : Suppression + cleanup BDD

3. **Business Logic**
   - [ ] Validation formulaires
   - [ ] Calculs automatiques
   - [ ] Règles métier spécifiques

4. **Performance & UX**
   - [ ] Temps chargement < SLO
   - [ ] Feedback utilisateur approprié
   - [ ] Gestion erreurs gracieuse

---

## 🔄 PLAN DE TESTS EN 4 PHASES

### **Phase 1 : Navigation & Console Check** ✅

**Objectif** : Vérifier que toutes les pages du module se chargent sans erreur console.

**Actions MCP Browser** :
```typescript
1. mcp__playwright__browser_navigate(url: "http://localhost:3000/[module]")
2. mcp__playwright__browser_console_messages()
3. mcp__playwright__browser_snapshot()
4. mcp__playwright__browser_take_screenshot(filename: "[module]-page-principale.png")
```

**Critères de Succès** :
- ✅ Page charge correctement
- ✅ Console : **0 erreur** (tolérance absolue)
- ✅ Données affichées cohérentes
- ✅ Navigation fluide entre pages

**Livrables Phase 1** :
- Screenshot : `.playwright-mcp/[module]-page-principale.png`
- Log console : 0 erreur confirmé

---

### **Phase 2 : CRUD Operations** ✅

**Objectif** : Valider que toutes les opérations CRUD fonctionnent correctement avec cleanup BDD.

#### Test CREATE (Création)

**Script Setup** (si nécessaire) :
```typescript
// Créer script: scripts/setup-test-[module].ts
// Générer données test avec cleanup automatique
```

**Actions MCP Browser** :
```typescript
1. mcp__playwright__browser_navigate("http://localhost:3000/[module]")
2. mcp__playwright__browser_click(element: "Bouton Nouveau [Element]", ref: "eXXX")
3. mcp__playwright__browser_fill_form(fields: [...])
4. mcp__playwright__browser_click(element: "Bouton Enregistrer", ref: "eXXX")
5. mcp__playwright__browser_console_messages() // Vérifier 0 erreur
6. mcp__playwright__browser_snapshot() // Confirmer élément créé dans liste
```

**Critères de Succès** :
- ✅ Élément créé apparaît dans liste
- ✅ Console : 0 erreur
- ✅ BDD : Vérification psql (élément existe)
- ✅ Stats/compteurs mis à jour

#### Test READ (Lecture)

**Actions MCP Browser** :
```typescript
1. mcp__playwright__browser_click(element: "Voir détails [Element]", ref: "eXXX")
2. mcp__playwright__browser_navigate("http://localhost:3000/[module]/[id]")
3. mcp__playwright__browser_snapshot()
4. mcp__playwright__browser_console_messages() // 0 erreur
```

**Critères de Succès** :
- ✅ Toutes informations affichées
- ✅ Données cohérentes avec BDD
- ✅ Console : 0 erreur
- ✅ Onglets/sections fonctionnels

#### Test UPDATE (Modification)

**Actions MCP Browser** :
```typescript
1. mcp__playwright__browser_click(element: "Éditer [Element]", ref: "eXXX")
2. mcp__playwright__browser_fill_form(fields: [{name: "champ", value: "nouvelle valeur"}])
3. mcp__playwright__browser_click(element: "Enregistrer", ref: "eXXX")
4. mcp__playwright__browser_console_messages() // Log succès attendu
5. mcp__playwright__browser_snapshot() // Vérifier modification visible
```

**Critères de Succès** :
- ✅ Modification enregistrée en BDD
- ✅ Affichage mis à jour
- ✅ Console : Log succès + 0 erreur
- ✅ Stats/états cohérents

#### Test DELETE (Suppression + Cleanup)

**Actions MCP Browser** :
```typescript
1. mcp__playwright__browser_click(element: "Supprimer [Element]", ref: "eXXX")
2. mcp__playwright__browser_click(element: "Confirmer suppression", ref: "eXXX")
3. mcp__playwright__browser_console_messages() // Log succès
4. mcp__playwright__browser_snapshot() // Élément disparu
```

**Vérification BDD Cleanup** :
```bash
PGPASSWORD="..." psql -h ... -c "SELECT * FROM [table] WHERE id = '[test-id]';"
# Résultat attendu: (0 rows) ✅
```

**Critères de Succès** :
- ✅ Élément supprimé de la liste
- ✅ BDD : 0 rows (cleanup confirmé)
- ✅ Console : Log succès + 0 erreur
- ✅ Stats/compteurs décrémentés

**Livrables Phase 2** :
- Screenshot : `.playwright-mcp/[module]-crud-delete-success.png`
- Vérification psql : Cleanup confirmé
- Log console : 0 erreur sur toutes opérations

---

### **Phase 3 : Business Logic Validation** ✅

**Objectif** : Valider les règles métier spécifiques du module.

**À adapter selon votre module** :

#### Exemple 1 : Validation Formulaire
```typescript
// Tester champs obligatoires
1. mcp__playwright__browser_click(element: "Enregistrer (sans remplir)")
2. mcp__playwright__browser_snapshot() // Messages erreur affichés
3. Vérifier que formulaire n'est PAS soumis si invalide
```

#### Exemple 2 : Calculs Automatiques
```typescript
// Tester calculs (prix total, taxes, etc.)
1. mcp__playwright__browser_fill_form(fields: [{name: "quantite", value: "10"}])
2. mcp__playwright__browser_snapshot() // Vérifier calcul auto
3. Comparer valeur affichée avec calcul attendu
```

#### Exemple 3 : Permissions & Rôles
```typescript
// Tester restrictions selon rôle utilisateur
1. Se connecter avec role "catalog_manager"
2. Vérifier boutons "Supprimer" absents (si permission refusée)
3. Console : 0 erreur (pas d'erreurs auth)
```

**Critères de Succès** :
- ✅ Règles métier respectées
- ✅ Validations front + back cohérentes
- ✅ Messages erreur appropriés
- ✅ Console : 0 erreur

**Livrables Phase 3** :
- Documentation règles validées
- Screenshots cas limites testés

---

### **Phase 4 : Performance & Edge Cases** ✅

**Objectif** : Vérifier performance conforme aux SLOs et gestion edge cases.

#### Test Performance

**SLOs Vérone** :
- Dashboard : <2s
- Catalogue : <3s
- Feeds : <10s
- PDF : <5s

**Actions** :
```typescript
1. mcp__playwright__browser_navigate("[URL]")
2. Mesurer temps chargement (via console network timing)
3. Comparer avec SLO cible
```

**Diagnostic si dépassement** :
```sql
-- EXPLAIN ANALYZE pour queries lentes
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM [table] WHERE ...;
```

**Optimisations possibles** :
- Ajout cache Next.js : `export const revalidate = 300`
- Index BDD manquants
- Queries N+1 à optimiser

#### Test Edge Cases

**Cas limites à tester** :
- [ ] Liste vide (aucune donnée)
- [ ] Pagination limites (première/dernière page)
- [ ] Recherche sans résultat
- [ ] Données invalides (caractères spéciaux, HTML, SQL injection)
- [ ] Fichiers volumineux (si upload)
- [ ] Timeout network (si API externe)

**Critères de Succès** :
- ✅ Performance < SLO
- ✅ Edge cases gérés gracieusement
- ✅ Messages utilisateur appropriés
- ✅ Console : 0 erreur même en cas d'erreur métier

**Livrables Phase 4** :
- Métriques performance documentées
- Edge cases testés avec résultats

---

## ✅ CRITÈRES DE SUCCÈS GLOBAUX

### Console Error Checking (Règle Sacrée)

| Page Testée | Erreurs | Warnings | Status |
|-------------|---------|----------|--------|
| /[module] | 0 | 0 | ✅ |
| /[module]/[id] | 0 | 0 | ✅ |
| CREATE | 0 | 0 | ✅ |
| UPDATE | 0 | 0 | ✅ |
| DELETE | 0 | 0 | ✅ |

**Résultat** : ✅ **100% CONSOLE CLEAN POLICY RESPECTÉE**

### CRUD Validation (si applicable)

| Opération | Fonctionnel | BDD Persiste | Cleanup | Console | Status |
|-----------|-------------|--------------|---------|---------|--------|
| CREATE | ✅ | ✅ | N/A | 0 err | ✅ |
| READ | ✅ | ✅ | N/A | 0 err | ✅ |
| UPDATE | ✅ | ✅ | N/A | 0 err | ✅ |
| DELETE | ✅ | ✅ | ✅ | 0 err | ✅ |

**Résultat** : ✅ **100% CRUD OPERATIONS VALIDÉES**

### Performance

| Métrique | Valeur Mesurée | SLO | Status |
|----------|----------------|-----|--------|
| Chargement page | [XXX]ms | <[SLO]ms | ✅/⚠️ |
| Query principale | [XXX]ms | <2000ms | ✅/⚠️ |

**Résultat** : ✅ **PERFORMANCE CONFORME**

---

## 📦 LIVRABLES ATTENDUS

### 1. Rapport Session Détaillé

**Fichier** : `MEMORY-BANK/sessions/[DATE]-TESTS-[MODULE]-COMPLET.md`

**Contenu** :
- Synthèse tests effectués
- Problèmes identifiés et résolus
- Métriques finales (console, CRUD, performance)
- Screenshots preuves
- Recommandations améliorations

### 2. Screenshots Preuves

**Dossier** : `.playwright-mcp/`

**Fichiers** :
- `[module]-page-principale.png`
- `[module]-crud-create-success.png`
- `[module]-crud-delete-success.png`
- `[module]-edge-case-[scenario].png`

### 3. Scripts Tests (si CRUD)

**Dossier** : `scripts/`

**Fichiers** :
- `setup-test-[module].ts` (création données test)
- `cleanup-test-[module].ts` (nettoyage BDD)

### 4. Documentation Mise à Jour

**Fichiers** :
- `manifests/business-rules/[MODULE]-VALIDATION.md` (règles validées)
- `docs/architecture/[MODULE]-PERFORMANCE.md` (optimisations appliquées)

---

## 🚀 WORKFLOW MCP BROWSER RÉVOLUTIONNAIRE

### Règles Absolues

1. **❌ JAMAIS créer scripts de test .js/.mjs/.ts**
   - ✅ Utiliser MCP Playwright Browser directement
   - Browser visible en temps réel = confiance maximale

2. **✅ Console Error Checking Systématique**
   - Après CHAQUE navigation : `browser_console_messages()`
   - Zero tolerance : 1 erreur = échec complet
   - Re-test jusqu'à console 100% clean

3. **✅ Screenshots Comme Preuves**
   - `browser_take_screenshot()` après chaque validation
   - Fichiers nommés clairement : `[module]-[action]-[status].png`

4. **✅ Validation Visuelle REQUIRED**
   - `browser_snapshot()` pour vérifier état DOM
   - Browser s'ouvre devant vous = transparence totale

### Workflow Type Phase de Test

```typescript
// 1. Navigation
await mcp__playwright__browser_navigate("http://localhost:3000/[module]")

// 2. Console Check IMMÉDIAT
const console = await mcp__playwright__browser_console_messages()
// Si erreurs → STOP → Fix ALL → Re-test

// 3. Snapshot DOM
const snapshot = await mcp__playwright__browser_snapshot()

// 4. Action utilisateur (click, fill, etc.)
await mcp__playwright__browser_click(element: "...", ref: "eXXX")

// 5. Vérification résultat
const newSnapshot = await mcp__playwright__browser_snapshot()

// 6. Screenshot preuve
await mcp__playwright__browser_take_screenshot(filename: "[module]-[action].png")

// 7. Console Check final
const finalConsole = await mcp__playwright__browser_console_messages()
// Si erreurs → DOCUMENTER → Fix → Re-test

// 8. Cleanup si test CRUD
// Vérification BDD psql + suppression données test
```

---

## 📋 CHECKLIST PRÉ-TESTS

Avant de lancer les tests, vérifier :

- [ ] Serveur développement actif : `npm run dev` (http://localhost:3000)
- [ ] Base de données accessible (psql fonctionne)
- [ ] Connexion utilisateur admin/owner (permissions complètes)
- [ ] MCP Playwright Browser installé : `mcp__playwright__browser_install` si nécessaire
- [ ] Dossiers créés : `MEMORY-BANK/sessions/`, `.playwright-mcp/`, `scripts/`
- [ ] Git status clean (pas de modifications non commitées sur code critique)

---

## 🎯 UTILISATION DE CE TEMPLATE

### Étape 1 : Copier Template

Copiez l'intégralité de ce fichier dans une nouvelle conversation Claude.

### Étape 2 : Remplacer Placeholders

Remplacez tous les placeholders :
- `[MODULE]` → ex: "Catalogue Produits"
- `[DATE]` → ex: "2025-10-11"
- `[LISTE_PAGES]` → ex: "/catalogue, /catalogue/[id], /catalogue/categories"
- `[SLO]` → ex: "3000" (pour 3 secondes)

### Étape 3 : Adapter Sections Spécifiques

- **Phase 3 Business Logic** : Ajouter règles métier propres à votre module
- **Edge Cases** : Lister cas limites spécifiques
- **Scripts** : Préciser données test nécessaires

### Étape 4 : Lancer Tests avec Claude

Demander à Claude :
```
Exécute le plan de tests complet pour le module [MODULE] en suivant
exactement le template fourni. Utilise MCP Playwright Browser pour
tous les tests, respecte la règle sacrée Console 0 erreur, et génère
tous les livrables documentés.
```

### Étape 5 : Révision Finale

Après exécution tests :
- Vérifier rapport session généré
- Consulter screenshots preuves
- Valider métriques conformes
- Archiver documentation

---

## 📚 RÉFÉRENCES

### Documentation Vérone

- `CLAUDE.md` : Règles workflow 2025
- `manifests/business-rules/` : Règles métier validées
- `MEMORY-BANK/sessions/` : Sessions tests précédentes

### Best Practices

- Console Error Checking : Zero tolerance policy
- MCP Playwright Browser : Jamais de scripts .js/.mjs/.ts
- CRUD Testing : Setup/Teardown + cleanup BDD obligatoire
- Performance : EXPLAIN ANALYZE pour diagnostic

### Exemples Complets

- `MEMORY-BANK/sessions/2025-10-10-RAPPORT-FINAL-SESSION-COMPLETE.md` : Session Admin Users (référence complète)

---

**Template créé** : 2025-10-10
**Version** : 1.0
**Auteur** : Claude Code + Workflow 2025

*Vérone Back Office - Professional AI-Assisted Testing Excellence*
