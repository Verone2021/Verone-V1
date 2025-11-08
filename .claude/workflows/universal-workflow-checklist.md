# 📋 WORKFLOW UNIVERSEL 2025 - CHECKLIST RAPIDE

**Référence rapide** : Une page pour tous les types de features (formulaires, pages, composants, hooks, DB, API)

**Documentation complète** :

- 🧠 Workflow détaillé : Voir `CLAUDE.md` section "WORKFLOW UNIVERSEL 2025"
- 📚 Exemples concrets : Voir `.claude/workflows/universal-workflow-examples.md`

---

## 🎯 RÈGLES D'OR (À MÉMORISER)

1. **Documentation First** : TOUJOURS consulter docs AVANT modifier
2. **Console Zero Tolerance** : 1 erreur = ÉCHEC COMPLET, retour PHASE 3
3. **Serena Before Code** : TOUJOURS `get_symbols_overview` AVANT modifier fichier
4. **Test Before Code** : TOUJOURS valider existant fonctionne AVANT modifier
5. **Build Always** : TOUJOURS vérifier build passe AVANT et APRÈS modifications
6. **Authorization Always** : JAMAIS commit sans autorisation EXPLICITE utilisateur

---

## ✅ CHECKLIST COMPLÈTE (Cocher toutes les cases)

### AVANT DE COMMENCER

- [ ] Objectif clairement défini
- [ ] Complexité évaluée (simple/moyen/complexe)
- [ ] Durée estimée (<1h / 1-3h / >3h)
- [ ] Feature applicable à quel module ?
- [ ] Impact sur base de données ? (Oui/Non)
- [ ] Impact sur types TypeScript ? (Oui/Non)

---

### 🧠 PHASE 1: THINK (5-15 min)

**Objectif** : Comprendre COMPLÈTEMENT avant de coder

#### Analyse & Recherche

- [ ] **Sequential Thinking** : Si tâche >3 étapes → `mcp__sequential-thinking__sequentialthinking`
- [ ] **Serena Memory** : Lire contexte existant → `mcp__serena__read_memory("context-previous")`
- [ ] **Serena Overview** : Fichiers impactés → `mcp__serena__get_symbols_overview(targetFile)`
- [ ] **Serena Impact** : Références existantes → `mcp__serena__find_referencing_symbols(symbol)`
- [ ] **Context7 Docs** : Documentation officielle → `mcp__context7__get-library-docs`
- [ ] **Database Schema** : Si modification data → `Read("docs/database/SCHEMA-REFERENCE.md")`
- [ ] **Business Rules** : Si logique métier → `Read("docs/business-rules/[module]/")`

#### Planification

- [ ] Edge cases identifiés (minimum 3)
- [ ] Patterns existants analysés (utiliser patterns projet)
- [ ] Dépendances identifiées (autres composants/tables impactés)
- [ ] Plan technique rédigé (approche, fichiers à modifier, stratégie)

---

### 🧪 PHASE 2: TEST (5-10 min)

**Objectif** : Valider que l'existant fonctionne AVANT modifier

#### Console Error Checking (RÈGLE SACRÉE)

- [ ] **Navigate** : `mcp__playwright__browser_navigate("http://localhost:3000/page")`
- [ ] **Console Check** : `mcp__playwright__browser_console_messages()`
- [ ] **Si erreurs détectées** → STOP COMPLET (ne pas continuer si erreurs existantes)

#### Test Fonctionnel Existant

- [ ] **Interaction** : Tester page/composant actuel fonctionne
- [ ] **Screenshot Before** : `mcp__playwright__browser_take_screenshot("before-changes.png")`
- [ ] **Build Validation** : `npm run build` → Doit passer SANS erreurs

#### Database Validation (si applicable)

- [ ] **Query Test** : `mcp__supabase__execute_sql("SELECT * FROM table LIMIT 1")`
- [ ] **Advisors** : `mcp__supabase__get_advisors("security")` + `get_advisors("performance")`

---

### ⚙️ PHASE 3: CODE (20-40 min)

**Objectif** : Code MINIMAL, édition symbolique précise

#### Édition Symbolique (Serena - MANDATORY)

- [ ] **Replace Symbol** : `mcp__serena__replace_symbol_body` (jamais édition manuelle fichier entier)
- [ ] **Insert After/Before** : Si ajout nouveau symbole → `insert_after_symbol` / `insert_before_symbol`
- [ ] **Rename Symbol** : Si renommage nécessaire → `mcp__serena__rename_symbol`

#### Code Quality

- [ ] **TypeScript Types** : Types stricts (pas de `any`)
- [ ] **Validation** : Zod schemas si formulaire
- [ ] **Error Handling** : Try/catch + toast messages
- [ ] **Patterns Projet** : Réutiliser patterns existants (react-hook-form, SWR, etc.)

#### Database Migration (si applicable)

- [ ] **Idempotence** : `IF NOT EXISTS`, `IF NOT NULL`, `DROP IF EXISTS`
- [ ] **Constraints** : CHECK constraints pour validation
- [ ] **Indexes** : Partial indexes (WHERE clauses)
- [ ] **Comments** : COMMENT ON COLUMN explicatifs
- [ ] **Rollback Notes** : Instructions rollback en commentaire

#### Types Update (si DB modifiée)

- [ ] **Generate Types** : `mcp__supabase__generate_typescript_types()`

---

### 🔄 PHASE 4: RE-TEST (10-20 min)

**Objectif** : Validation COMPLÈTE sans régression

#### Type Check & Build

- [ ] **Type Check** : `npm run type-check` → = 0 erreurs (ABSOLU)
- [ ] **Build** : `npm run build` → Doit passer

#### Console Error Checking (RÈGLE SACRÉE)

- [ ] **Navigate Feature** : `mcp__playwright__browser_navigate("/feature-modifiée")`
- [ ] **Console Check** : `mcp__playwright__browser_console_messages()` → = 0 erreurs
- [ ] **Si 1 seule erreur détectée** → STOP IMMÉDIAT → Retour PHASE 3 → Fix ALL → Re-test

#### Test Workflow Complet

- [ ] **Interaction Complète** : Tester TOUT le workflow user end-to-end
- [ ] **Form Submission** : Si formulaire → tester SUBMIT (pas juste affichage)
- [ ] **Button Click** : Si bouton → tester action complète (pas juste UI)
- [ ] **Modal Open/Close** : Si modal → tester ouverture + fermeture + actions
- [ ] **Search/Filter** : Si recherche → tester filtrage fonctionne
- [ ] **Screenshot After** : `mcp__playwright__browser_take_screenshot("after-changes.png")`

#### Database Validation (si applicable)

- [ ] **Data Verification** : Vérifier données insérées/modifiées correctement
- [ ] **Constraints** : Tester contraintes fonctionnent (rejettent données invalides)
- [ ] **Advisors** : `mcp__supabase__get_advisors("performance")` → Vérifier pas de warning

#### Régression Testing

- [ ] **Pages Adjacentes** : Tester pages liées (pas juste page modifiée)
- [ ] **Console ALL Pages** : Vérifier console = 0 erreurs sur TOUTES pages impactées
- [ ] **Aucune régression détectée** : Fonctionnalités existantes fonctionnent toujours

---

### 📝 PHASE 5: DOCUMENT (5 min)

**Objectif** : Préserver contexte pour futures sessions

#### Serena Memory

- [ ] **Write Memory** : `mcp__serena__write_memory({ key: "feature-[nom]", content: "..." })`
- [ ] **Content Required** :
  - Décisions architecturales prises
  - Edge cases résolus
  - Learnings & gotchas
  - Patterns utilisés

#### Documentation (si applicable)

- [ ] **Business Rules** : Si nouvelle règle → `docs/business-rules/[module]/[feature].md`
- [ ] **Database Docs** : Si nouvelle table/colonne → Mettre à jour `docs/database/`
- [ ] **Comments Code** : Ajouter commentaires explicatifs pour logique complexe

---

### 🚀 PHASE 6: COMMIT & DEPLOY (2 min)

**Objectif** : Commit propre avec autorisation EXPLICITE

#### Préparation

- [ ] **Git Status** : `git status` → Vérifier fichiers modifiés corrects
- [ ] **Git Diff** : `git diff` → Review changements une dernière fois

#### Autorisation (RÈGLE ABSOLUE)

- [ ] **⏸️ STOP - DEMANDER AUTORISATION** : "Voulez-vous que je commit et push maintenant ?"
- [ ] **ATTENDRE réponse EXPLICITE** : Ne PAS procéder sans "OUI" clair
- [ ] **Si réponse ambiguë** : Re-demander clarification

#### Commit Structuré

- [ ] **Add Files** : `git add [fichiers-modifiés]`
- [ ] **Commit Message** : Format conventionnel

  ```
  feat(module): Description courte (max 72 chars)

  - Changement 1
  - Changement 2
  - Edge case résolu

  Tests: ✅ Console = 0 errors
  Build: ✅ Success (Xs)
  ```

- [ ] **Push** : `git push origin [branch]`

---

## 🚨 SI ERREUR DÉTECTÉE À N'IMPORTE QUELLE PHASE

1. **STOP IMMÉDIAT** : Ne pas continuer
2. **Identifier Phase** : Quelle phase a révélé l'erreur ?
3. **Retour Arrière** : Revenir à PHASE appropriée
4. **Fix ALL** : Corriger TOUTES les erreurs (pas juste une)
5. **Re-test** : Refaire TOUTES les validations depuis début
6. **Zero Tolerance** : 1 erreur = échec complet

---

## 📊 TEMPS ESTIMÉS PAR COMPLEXITÉ

| Complexité | THINK | TEST  | CODE  | RE-TEST | DOC  | COMMIT | TOTAL  |
| ---------- | ----- | ----- | ----- | ------- | ---- | ------ | ------ |
| Simple     | 5min  | 5min  | 20min | 10min   | 3min | 2min   | ~45min |
| Moyen      | 10min | 8min  | 30min | 15min   | 5min | 2min   | ~70min |
| Complexe   | 15min | 10min | 40min | 20min   | 7min | 2min   | ~95min |

**Exemples Complexité** :

- **Simple** : Ajout bouton, modification texte, nouveau badge
- **Moyen** : Nouveau composant UI, hook custom, query complexe
- **Complexe** : Nouveau formulaire complet, migration DB, page avec Server Actions

---

## 🔗 RESSOURCES

- **Workflow Détaillé** : `CLAUDE.md` (lignes 46-323)
- **Exemples Complets** : `.claude/workflows/universal-workflow-examples.md` (5 exemples)
- **Agent Orchestration** : `.claude/workflows/agent-orchestration-matrix.md`
- **Database Best Practices** : `docs/database/best-practices.md`
- **Testing Guide** : `docs/testing/catalogue-manual-testing-guide.md`

---

**Version** : 1.0.0
**Date** : 2025-10-30
**Applicable à** : Formulaires, Pages, Composants, Buttons, Hooks, Database, API, Business Logic
