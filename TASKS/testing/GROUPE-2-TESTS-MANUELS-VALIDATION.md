# 🧪 TESTS GROUPE 2 - VALIDATION CORRECTIONS CRITIQUES

**Date**: 2025-10-16
**Environnement**: http://localhost:3000
**Objectif**: Valider corrections Erreurs #6, #7, #8
**Exécuteur**: Test manuel guidé (Playwright MCP non disponible)

---

## ⚠️ PRÉ-REQUIS

- [x] Serveur dev tourne (PID 30902 vérifié)
- [ ] Browser ouvert sur http://localhost:3000
- [ ] DevTools Console ouvert (F12)
- [ ] Prêt à prendre screenshots

---

## 🎯 TEST 2.1 - CRÉER FAMILLE + VALIDATION ERREUR #6

### Actions
1. **Navigate**: http://localhost:3000/catalogue/categories
2. **Console Check**: Noter nombre erreurs initiales: `______`
3. **Cliquer**: Button "Nouvelle famille" (coin haut droite)
4. **Modal ouvert**: Vérifier titre "Créer une nouvelle famille"
5. **Remplir Nom**: `test-famille-validation-2025`
6. **Remplir Description**: `Validation Erreur #6 messages UX`
7. **Cliquer**: "Créer"
8. **Attendre**: Toast success + famille dans liste

### Validation Création
- [ ] Famille visible dans liste avec nom `test-famille-validation-2025`
- [ ] Toast success affiché
- [ ] Console: **0 nouvelles erreurs** (nombre final: `______`)
- [ ] Screenshot pris: `test-2-1-famille-creee.png`

### 🔴 TEST ERREUR #6 - MESSAGE UX FRIENDLY
**Objectif**: Vérifier que message doublon est clair (pas "Erreur inconnue")

9. **Cliquer**: "Nouvelle famille" à nouveau
10. **Remplir Nom**: `test` (famille existante)
11. **Cliquer**: "Créer"
12. **Observer message d'erreur**

**RÉSULTAT ATTENDU**:
```
❌ Une famille avec ce nom existe déjà
```

**RÉSULTAT OBTENU** (noter exactement):
```
______________________________________________________
```

- [ ] ✅ Message user-friendly (pas "Erreur inconnue")
- [ ] ✅ Toast rouge avec icône erreur
- [ ] Screenshot: `test-2-1-erreur-6-validee.png`

**VERDICT TEST 2.1**: ✅ PASS / ❌ FAIL
**Raison si FAIL**: _________________________________

---

## 🔴 TEST 2.2 - CRÉER CATÉGORIE + VALIDATION ERREUR #8 (CRITIQUE)

### Actions
1. **Depuis même page**: http://localhost:3000/catalogue/categories
2. **Console**: Clear console (Cmd+K) pour détecter nouvelles erreurs
3. **Cliquer**: Button "Nouvelle catégorie"
4. **Modal ouvert**: Vérifier titre "Créer une nouvelle catégorie"
5. **Remplir Nom**: `test-categorie-validation-2025`
6. **Sélectionner Famille**: Dropdown → `test-famille-validation-2025`
7. **Remplir Description**: `Validation Erreur #8 PGRST204`
8. **Cliquer**: "Créer"
9. **Attendre**: Toast + catégorie dans liste

### 🚨 VALIDATION CRITIQUE - ERREUR #8 PGRST204
**AVANT CORRECTION** (screenshot existant montre):
```
⚠️ columns "sort_order" and "display_order" do not exist (PGRST204)
```

**APRÈS CORRECTION** (vérifier maintenant):

- [ ] ✅ Catégorie créée visible dans liste
- [ ] ✅ Toast success affiché
- [ ] ✅ Console: **ZÉRO erreur PGRST204**
- [ ] ✅ Console: **ZÉRO warning "sort_order not found"**
- [ ] Screenshot: `test-2-2-categorie-creee-sans-erreur.png`

**ERREURS CONSOLE DÉTECTÉES** (noter TOUTES):
```
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
```

**SI ERREUR PGRST204 PRÉSENTE** → ❌ ÉCHEC CRITIQUE
**Cause probable**: Migration sort_order → display_order non appliquée

**VERDICT TEST 2.2**: ✅ PASS / ❌ FAIL
**Raison si FAIL**: _________________________________

---

## 🎯 TEST 2.3 - CRÉER SOUS-CATÉGORIE

### Actions
1. **Depuis même page**: categories
2. **Console**: Clear console
3. **Cliquer**: "Nouvelle sous-catégorie"
4. **Remplir Nom**: `test-sous-categorie-validation-2025`
5. **Sélectionner Catégorie**: `test-categorie-validation-2025`
6. **Remplir Description**: `Validation structure hiérarchique`
7. **Cliquer**: "Créer"

### Validation
- [ ] Sous-catégorie visible (avec indent visuel sous catégorie parent)
- [ ] Toast success
- [ ] Console: **0 erreur**
- [ ] Screenshot: `test-2-3-sous-categorie-creee.png`

**VERDICT TEST 2.3**: ✅ PASS / ❌ FAIL

---

## 🎯 TEST 2.4 - CRÉER COLLECTION

### Actions
1. **Navigate**: http://localhost:3000/catalogue/collections
2. **Console**: Clear + vérifier 0 erreur au chargement
3. **Cliquer**: "Nouvelle collection"
4. **Remplir Nom**: `test-collection-validation-2025`
5. **Remplir Slug**: `test-collection-2025` (auto-généré normalement)
6. **Remplir Description**: `Validation module collections`
7. **Cliquer**: "Créer"

### Validation
- [ ] Collection visible dans liste
- [ ] Slug formaté correctement
- [ ] Toast success
- [ ] Console: **0 erreur**
- [ ] Screenshot: `test-2-4-collection-creee.png`

**VERDICT TEST 2.4**: ✅ PASS / ❌ FAIL

---

## 📊 SYNTHÈSE GROUPE 2

### Résultats par Test
| Test | Statut | Console Errors | Erreurs Critiques |
|------|--------|----------------|-------------------|
| 2.1 Famille | ✅/❌ | `____` | Erreur #6: ✅/❌ |
| 2.2 Catégorie | ✅/❌ | `____` | Erreur #8: ✅/❌ |
| 2.3 Sous-cat | ✅/❌ | `____` | N/A |
| 2.4 Collection | ✅/❌ | `____` | N/A |

### Validation Corrections Appliquées
- **Erreur #6 (Messages UX)**: ✅ Corrigée / ❌ Non corrigée / ⚠️ Partielle
- **Erreur #7 (Activity Warnings)**: ✅ Warnings non-bloquants / ❌ Toujours bloquants
- **Erreur #8 (PGRST204 display_order)**: ✅ Corrigée / ❌ Non corrigée

### Nouvelles Erreurs Détectées
```
1. ________________________________________
2. ________________________________________
3. ________________________________________
```

### 🎯 RECOMMANDATION FINALE

**Si 4/4 tests PASS**:
```
✅ GROUPE 2 VALIDÉ
→ Continuer GROUPE 3 (Products & Images)
```

**Si ≥1 test FAIL**:
```
❌ GROUPE 2 ÉCHOUÉ
→ STOP pour corrections debugger
→ Re-tester après fixes
```

**DÉCISION**: ✅ CONTINUER / ❌ STOP / ⚠️ CORRECTIONS MINEURES

---

## 📸 SCREENSHOTS REQUIS

Sauvegarder dans `/Users/romeodossantos/verone-back-office-V1/`:

1. `test-2-1-famille-creee.png`
2. `test-2-1-erreur-6-validee.png`
3. `test-2-2-categorie-creee-sans-erreur.png` (CRITIQUE)
4. `test-2-3-sous-categorie-creee.png`
5. `test-2-4-collection-creee.png`

---

## 🔄 CLEANUP POST-TESTS

**Après validation complète**, supprimer données test:

```sql
-- Supabase SQL Editor
DELETE FROM subcategories WHERE name LIKE 'test-%validation-2025';
DELETE FROM categories WHERE name LIKE 'test-%validation-2025';
DELETE FROM families WHERE name LIKE 'test-%validation-2025';
DELETE FROM collections WHERE name LIKE 'test-%validation-2025';
```

---

**Créé par**: verone-tester
**Agent parent**: verone-debugger (déblocage env)
**Next**: GROUPE 3 si succès
