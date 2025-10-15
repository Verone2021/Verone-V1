# ⚡ QUICK START GROUPE 2 - VERSION EXPRESS

**Temps total**: 30 minutes
**Objectif**: Valider 3 corrections critiques

---

## 🎯 EN 30 SECONDES

**Quoi?** Re-tester 4 workflows catalogue après corrections
**Pourquoi?** Débloquer création catégories (Erreur #8 CRITIQUE)
**Comment?** Tests manuels browser (Playwright indisponible)
**Résultat attendu?** 4/4 tests ✅ → Continuer GROUPE 3

---

## 🚀 DÉMARRAGE EN 3 ÉTAPES

### Étape 1: Préparation (2 min)

```bash
# Terminal 1: Serveur dev
npm run dev

# Browser: DevTools ouverts
open http://localhost:3000/catalogue/categories
# Raccourci: Cmd+Option+I (Mac) / F12 (Windows)

# DevTools: Activer Console + Network
# Cocher "Preserve log"
```

---

### Étape 2: Tests (20 min)

**Test 2.1 - Famille** (5 min)
```
1. Cliquer "Nouvelle famille"
2. Nom: "test-famille-validation-2025"
3. Description: "Test validation"
4. Créer
5. ✅ Vérifier: Famille créée + ZERO erreur console
```

**Test 2.2 - Catégorie CRITIQUE** (5 min)
```
1. Cliquer "Nouvelle catégorie"
2. Nom: "test-categorie-validation-2025"
3. Famille: Sélectionner "test-famille-validation-2025"
4. Créer
5. ✅ Vérifier: Catégorie créée + AUCUNE erreur PGRST204
```

**Test 2.3 - Sous-catégorie** (5 min)
```
1. Cliquer "Nouvelle sous-catégorie"
2. Nom: "test-sous-categorie-validation-2025"
3. Catégorie: Sélectionner "test-categorie-validation-2025"
4. Créer
5. ✅ Vérifier: Sous-catégorie créée + ZERO erreur
```

**Test 2.4 - Collection** (5 min)
```
1. Navigate to /catalogue/collections
2. Cliquer "Nouvelle collection"
3. Nom: "test-collection-validation-2025"
4. Slug: auto-généré ou manuel
5. Créer
6. ✅ Vérifier: Collection créée + ZERO erreur
```

---

### Étape 3: Décision (5 min)

**Si 4/4 tests ✅**:
→ **Continuer GROUPE 3** (Tests Produits)

**Si ≥1 test ❌**:
→ **STOP** - Documenter erreurs, nouvelles corrections requises

---

## 🚨 RÈGLES CRITIQUES

### ✅ Succès = TOUT CECI

- Entité créée visible
- Console: **ZERO erreurs** rouges
- ⚠️ Warnings "Activity tracking" autorisés (jaune)
- Screenshot preuve

### ❌ Échec = AU MOINS CECI

- Erreur PGRST204 "sort_order not found"
- Erreur "Erreur inconnue"
- Toute erreur console.error rouge
- Crash formulaire

---

## 📊 RAPPORT EXPRESS

**Compléter après tests**:

```markdown
## RÉSULTATS GROUPE 2

| Test | ✅/❌ | Console Errors |
|------|------|----------------|
| 2.1 Famille | ___ | ___/0 |
| 2.2 Catégorie | ___ | ___/0 |
| 2.3 Sous-catégorie | ___ | ___/0 |
| 2.4 Collection | ___ | ___/0 |

**Décision**: Continuer GROUPE 3 ☐ / Stop corrections ☐

**Nouvelles erreurs**: [Si détectées]
```

---

## 🔧 DÉPANNAGE EXPRESS

**Test 2.2 échoue (PGRST204)**:
```bash
# Vérifier schéma DB
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name='product_categories' AND column_name='display_order';"

# Attendu: 1 row (display_order existe)
# Si 0 row: Migration DB manquante
```

**Message "Erreur inconnue"**:
```bash
# Vérifier correction Erreur #6
grep -n "Une famille avec ce nom existe déjà" src/components/forms/FamilyForm.tsx

# Ligne 193 doit contenir ce message
```

---

## 📁 DOCUMENTATION COMPLÈTE

**Pour plus de détails**, consulter:

- **Guide complet**: `GROUPE-2-RE-TEST-GUIDE.md`
- **Mode d'emploi**: `README-GROUPE-2.md`
- **Vue exécutive**: `SYNTHESE-RE-TEST-GROUPE-2.md`
- **Index navigation**: `INDEX-GROUPE-2.md`

---

## 🎯 OBJECTIF FINAL

**Débloquer workflow catalogue complet**:
- ✅ Familles créables
- ✅ Catégories créables (Erreur #8 corrigée)
- ✅ Sous-catégories créables
- ✅ Collections créables
- ✅ Messages UX clairs (Erreur #6)
- ✅ Console propre (Erreur #7)

**Résultat**: 4/4 tests ✅ = **SUCCÈS** → GROUPE 3

---

**Créé par**: Vérone Test Expert
**Durée lecture**: 2 minutes
**Durée exécution**: 30 minutes
**Prochaine action**: Lancer `npm run dev` et démarrer tests
