# 🧪 GROUPE 2 - GUIDE RE-TEST POST-CORRECTIONS

**Date**: 2025-10-16
**Serveur**: http://localhost:3000
**Corrections appliquées**:
- ✅ Erreur #6 (Messages UX) - Commit 6bb0edf
- ✅ Erreur #7 (Activity Tracking) - Commit db9f8c1
- ✅ Erreur #8 (sort_order → display_order) - Commit db9f8c1

---

## ⚠️ LIMITATION TECHNIQUE

**Playwright MCP**: Non disponible (Not connected)

**Solution alternative**: Tests manuels guidés avec checkpoints stricts

---

## 📋 CHECKLIST RE-TEST GROUPE 2

### 🔧 PRÉPARATION

**Étapes préliminaires**:

```bash
# 1. Vérifier serveur dev actif
curl http://localhost:3000/api/health

# 2. Ouvrir DevTools Chrome/Firefox
# Raccourci: Cmd+Option+I (Mac) / F12 (Windows)

# 3. Activer onglet "Console" et cocher "Preserve log"

# 4. Activer onglet "Network" pour monitoring requêtes
```

---

## TEST 2.1 - CRÉER FAMILLE (RE-TEST ERREUR #6)

### URL
```
http://localhost:3000/catalogue/categories
```

### Actions

**Checkpoint 1: Chargement page**
- [ ] Page chargée sans erreurs console
- [ ] Bouton "Nouvelle famille" visible
- [ ] Screenshot: `test-2.1-checkpoint-1.png`

**Checkpoint 2: Ouverture formulaire**
- [ ] Cliquer "Nouvelle famille"
- [ ] Modal/Dialog ouvert
- [ ] Champs "Nom de la famille*" et "Description" visibles
- [ ] Console: ZERO erreurs
- [ ] Screenshot: `test-2.1-checkpoint-2.png`

**Checkpoint 3: Création famille**
- [ ] Remplir "Nom de la famille*": **test-famille-validation-2025**
- [ ] Remplir "Description": "Test validation Erreur #8 corrigée"
- [ ] Cliquer bouton "Créer"
- [ ] Attendre 2-3 secondes

**Checkpoint 4: Validation création**
- [ ] Famille "test-famille-validation-2025" apparaît dans liste
- [ ] Message succès visible (toast/notification)
- [ ] Console: ZERO erreurs ❌ (CRITICAL)
- [ ] Screenshot: `test-2.1-checkpoint-4.png`

**Checkpoint 5: Test duplication (validation Erreur #6)**
- [ ] Répéter création avec MÊME nom "test-famille-validation-2025"
- [ ] Message d'erreur doit être:
  - ✅ "Une famille avec ce nom existe déjà" (CORRECT)
  - ❌ "Erreur inconnue" ou erreur PostgreSQL (ÉCHEC)
- [ ] Screenshot: `test-2.1-checkpoint-5-message-ux.png`

### Résultat Test 2.1

**Statut**: ⬜ À compléter

**Console Errors**: ___/0 (objectif: 0)

**Notes**:
```
[À remplir après test]
- Erreurs détectées:
- Comportement observé:
- Validation Erreur #6:
```

---

## TEST 2.2 - CRÉER CATÉGORIE (CRITIQUE - ERREUR #8)

### URL
```
http://localhost:3000/catalogue/categories
```

### Actions

**Checkpoint 1: Ouverture formulaire catégorie**
- [ ] Cliquer "Nouvelle catégorie"
- [ ] Modal/Dialog ouvert
- [ ] Champs "Nom de la catégorie*", "Famille parente", "Description" visibles
- [ ] Console: ZERO erreurs
- [ ] Screenshot: `test-2.2-checkpoint-1.png`

**Checkpoint 2: Sélection famille parente**
- [ ] Ouvrir dropdown "Famille parente"
- [ ] Famille "test-famille-validation-2025" (créée en 2.1) visible
- [ ] Sélectionner cette famille
- [ ] Console: ZERO erreurs

**Checkpoint 3: Création catégorie**
- [ ] Remplir "Nom de la catégorie*": **test-categorie-validation-2025**
- [ ] Remplir "Description": "Test validation Erreur #8 PGRST204 corrigée"
- [ ] Cliquer bouton "Créer"
- [ ] Attendre 2-3 secondes

**Checkpoint 4: Validation CRITIQUE (Erreur #8)**
- [ ] Catégorie "test-categorie-validation-2025" apparaît dans liste
- [ ] Message succès visible
- [ ] Console: **VÉRIFIER SPÉCIFIQUEMENT** absence de:
  - ❌ "PGRST204"
  - ❌ "Column 'sort_order' of relation 'product_categories' does not exist"
  - ❌ Toute erreur liée à "sort_order"
- [ ] Screenshot: `test-2.2-checkpoint-4-CRITICAL.png`

**⚠️ TEST CRITIQUE**: Ce test échouait AVANT avec PGRST204. Si réussi = Erreur #8 VALIDÉE ✅

### Résultat Test 2.2

**Statut**: ⬜ À compléter

**Console Errors**: ___/0 (objectif: 0)

**Erreur #8 (PGRST204)**: ⬜ Absente (✅) / ⬜ Présente (❌)

**Notes**:
```
[À remplir après test]
- Erreurs détectées:
- Validation Erreur #8 corrigée:
- Comportement observé:
```

---

## TEST 2.3 - CRÉER SOUS-CATÉGORIE

### URL
```
http://localhost:3000/catalogue/categories
```

### Actions

**Checkpoint 1: Ouverture formulaire sous-catégorie**
- [ ] Cliquer "Nouvelle sous-catégorie"
- [ ] Modal/Dialog ouvert
- [ ] Champs "Nom de la sous-catégorie*", "Catégorie parente", "Description" visibles
- [ ] Console: ZERO erreurs
- [ ] Screenshot: `test-2.3-checkpoint-1.png`

**Checkpoint 2: Sélection catégorie parente**
- [ ] Ouvrir dropdown "Catégorie parente"
- [ ] Catégorie "test-categorie-validation-2025" (créée en 2.2) visible
- [ ] Sélectionner cette catégorie
- [ ] Console: ZERO erreurs

**Checkpoint 3: Création sous-catégorie**
- [ ] Remplir "Nom de la sous-catégorie*": **test-sous-categorie-validation-2025**
- [ ] Remplir "Description": "Test validation hiérarchie complète"
- [ ] Cliquer bouton "Créer"
- [ ] Attendre 2-3 secondes

**Checkpoint 4: Validation création**
- [ ] Sous-catégorie "test-sous-categorie-validation-2025" apparaît dans liste
- [ ] Message succès visible
- [ ] Console: ZERO erreurs
- [ ] Screenshot: `test-2.3-checkpoint-4.png`

**Checkpoint 5: Vérification hiérarchie**
- [ ] Hiérarchie visible: Famille → Catégorie → Sous-catégorie
- [ ] Ordre d'affichage cohérent (display_order fonctionnel)
- [ ] Screenshot: `test-2.3-checkpoint-5-hierarchie.png`

### Résultat Test 2.3

**Statut**: ⬜ À compléter

**Console Errors**: ___/0 (objectif: 0)

**Notes**:
```
[À remplir après test]
- Erreurs détectées:
- Hiérarchie affichée correctement:
- Comportement observé:
```

---

## TEST 2.4 - CRÉER COLLECTION

### URL
```
http://localhost:3000/catalogue/collections
```

### Actions

**Checkpoint 1: Chargement page collections**
- [ ] Navigate to http://localhost:3000/catalogue/collections
- [ ] Page chargée sans erreurs console
- [ ] Bouton "Nouvelle collection" visible
- [ ] Screenshot: `test-2.4-checkpoint-1.png`

**Checkpoint 2: Ouverture formulaire collection**
- [ ] Cliquer "Nouvelle collection"
- [ ] Modal/Dialog ouvert
- [ ] Champs requis visibles (Nom*, Slug*, Description, etc.)
- [ ] Console: ZERO erreurs
- [ ] Screenshot: `test-2.4-checkpoint-2.png`

**Checkpoint 3: Remplissage formulaire**
- [ ] Remplir "Nom de la collection*": **test-collection-validation-2025**
- [ ] Remplir "Slug*": **test-collection-validation-2025** (auto-généré si existant)
- [ ] Remplir "Description": "Test validation collections post-corrections"
- [ ] Remplir autres champs obligatoires si présents

**Checkpoint 4: Création collection**
- [ ] Cliquer bouton "Créer"
- [ ] Attendre 2-3 secondes
- [ ] Collection "test-collection-validation-2025" apparaît dans liste
- [ ] Message succès visible
- [ ] Console: ZERO erreurs
- [ ] Screenshot: `test-2.4-checkpoint-4.png`

### Résultat Test 2.4

**Statut**: ⬜ À compléter

**Console Errors**: ___/0 (objectif: 0)

**Notes**:
```
[À remplir après test]
- Erreurs détectées:
- Comportement observé:
```

---

## 📊 RAPPORT FINAL

### Résumé Tests

| Test | Statut | Console Errors | Validation Corrections |
|------|--------|----------------|------------------------|
| 2.1 Famille | ⬜ | ___/0 | Erreur #6 Messages UX |
| 2.2 Catégorie | ⬜ | ___/0 | **Erreur #8 PGRST204** |
| 2.3 Sous-catégorie | ⬜ | ___/0 | Hiérarchie display_order |
| 2.4 Collection | ⬜ | ___/0 | - |

### Nouvelles Erreurs Détectées

```
[À remplir si erreurs détectées]

Erreur #X: [Description]
- Contexte:
- Console output:
- Screenshot:
- Recommandation:
```

### Validation Corrections Appliquées

**Erreur #6 (Messages UX)**:
- ⬜ Validée ✅ (message "Une famille avec ce nom existe déjà" affiché)
- ⬜ Non validée ❌ (message "Erreur inconnue" ou PostgreSQL brut)
- Notes:

**Erreur #7 (Activity Tracking)**:
- ⬜ Validée ✅ (console.warn uniquement, non-bloquant)
- ⬜ Non validée ❌ (console.error présents)
- Notes:

**Erreur #8 (PGRST204 sort_order)**:
- ⬜ Validée ✅ (création catégories OK, pas d'erreur PGRST204)
- ⬜ Non validée ❌ (erreur PGRST204 toujours présente)
- Notes:

### Recommandation Finale

**Option A - SUCCÈS**: 4/4 tests ✅ + ZERO erreur console
→ **Continuer GROUPE 3** (Tests Produits)

**Option B - ÉCHEC PARTIEL**: ≥1 test échoué OU erreurs console détectées
→ **STOP - Documenter nouvelles corrections nécessaires**

**Option C - ÉCHEC CRITIQUE**: Erreur #8 toujours présente
→ **STOP - Analyse approfondie migration display_order**

### Décision

⬜ Continuer GROUPE 3
⬜ Stop pour corrections
⬜ Analyse approfondie requise

---

## 🛠️ OUTILS DEBUGGING

### Console Errors Filtering

```javascript
// Dans DevTools Console, filtrer uniquement les erreurs
// Désactiver filtres: Warnings, Logs, Info
// Activer: Errors uniquement

// Pour capturer toutes les erreurs:
window.addEventListener('error', (e) => {
  console.error('❌ ERREUR DÉTECTÉE:', e.message, e.filename, e.lineno);
});

// Pour monitorer les requêtes API échouées:
// Onglet Network → Filter: "Fetch/XHR" → Status codes 4xx/5xx
```

### Screenshots Organisés

```bash
# Créer dossier screenshots
mkdir -p /Users/romeodossantos/verone-back-office-V1/TASKS/testing/screenshots/groupe-2

# Nommage screenshots:
# test-2.1-checkpoint-X.png
# test-2.2-checkpoint-X-CRITICAL.png
# test-2.3-checkpoint-X.png
# test-2.4-checkpoint-X.png
```

### Validation display_order

```sql
-- Si besoin vérifier schéma DB après tests
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_categories';

-- Doit contenir "display_order", PAS "sort_order"
```

---

## 📝 NOTES IMPORTANTES

1. **Zero Tolerance**: 1 erreur console = ÉCHEC du test
2. **Erreur #7**: Warnings "Activity Tracking" autorisés (non-bloquants)
3. **Erreur #8**: Test 2.2 CRITIQUE pour validation correction
4. **Screenshots**: Obligatoires pour chaque checkpoint validé
5. **Rapport**: À compléter intégralement avant décision finale

---

**Créé par**: Vérone Test Expert (Claude Code)
**Dernière mise à jour**: 2025-10-16
