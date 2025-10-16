# 🧪 GUIDE MANUEL - TESTS GROUPE 2 (Validation Erreur #8)

## ⏱️ Durée Estimée: 10-15 minutes

## 🎯 OBJECTIF

Valider que l'Erreur #8 (PGRST204 - display_order) est **100% résolue** après:
- Commit db9f8c1: 18 fichiers code
- Commit 5211525: Migration SQL DB (3 tables)

---

## 📋 PRÉPARATION (2 minutes)

### Étape 1: Vérifier serveur dev
```bash
curl -s http://localhost:3000 | head -n 1
# Attendu: HTML response
```

### Étape 2: Ouvrir browser + DevTools
```bash
open http://localhost:3000/catalogue/categories
```
- Appuyer **F12** ou **Cmd+Option+I** (DevTools)
- Onglet **Console**
- Activer **"Preserve log"** (checkbox)

### Étape 3: Console vide
- Vérifier console: **0 erreur** au chargement page
- Si erreurs présentes → STOP, documenter, rapporter

---

## 🧪 TEST 2.1 - CRÉER FAMILLE (⚠️ CRITIQUE)

**Durée**: 3 minutes
**Objectif**: Valider Erreur #8 (PGRST204) + Erreur #6 (messages UX)

### Actions

1. **Cliquer** bouton "Nouvelle famille"
2. **Remplir** "Nom de la famille*": **`test-famille-final-2025`**
3. **Remplir** "Description": `Validation Erreur #8 - Migration display_order`
4. **Cliquer** bouton "Créer"

### Validations

**✅ Famille créée**:
- Famille "test-famille-final-2025" visible dans liste
- Toast success "Famille créée avec succès"

**✅ Console CLEAN** (CRITIQUE):
- **ZERO erreur** ❌
- **AUCUNE mention** "PGRST204"
- **AUCUNE mention** "sort_order"
- **AUCUNE mention** "display_order" (sauf si query log success)
- Warnings activity_tracking autorisés (⚠️ jaune OK)

**❌ SI ERREUR PGRST204**:
- Screenshot console complète
- **ARRÊT IMMÉDIAT** tests
- Rapport: Erreur #8 NON résolue

### Test Bonus: Erreur #6 (Messages UX)

1. **Tenter** créer famille "test" (nom existant en DB)
2. **Vérifier** message erreur affiché
3. **Attendu**: "Une famille avec ce nom existe déjà. Veuillez choisir un nom différent."
4. **NON attendu**: "Erreur inconnue"

---

## 🧪 TEST 2.2 - CRÉER CATÉGORIE

**Durée**: 2 minutes

### Actions

1. **Rester** sur page /catalogue/categories
2. **Cliquer** bouton "Nouvelle catégorie"
3. **Remplir** "Nom de la catégorie*": **`test-categorie-final-2025`**
4. **Sélectionner** famille parente (ex: "test-famille-final-2025")
5. **Remplir** "Description": `Test catégorie`
6. **Cliquer** "Créer"

### Validations

- ✅ Catégorie créée visible
- ✅ Console: **0 erreur**
- ✅ Toast success

---

## 🧪 TEST 2.3 - CRÉER SOUS-CATÉGORIE (⚠️ CRITIQUE)

**Durée**: 2 minutes
**Objectif**: Valider migration display_order sur table subcategories

### Actions

1. **Cliquer** bouton "Nouvelle sous-catégorie"
2. **Remplir** "Nom*": **`test-sous-categorie-final-2025`**
3. **Sélectionner** catégorie parente (ex: "test-categorie-final-2025")
4. **Remplir** "Description": `Validation Erreur #8 subcategories`
5. **Cliquer** "Créer"

### Validations

- ✅ Sous-catégorie créée visible
- ✅ Console: **0 erreur PGRST204** (CRITIQUE)
- ✅ Toast success

---

## 🧪 TEST 2.4 - CRÉER COLLECTION (⚠️ CRITIQUE)

**Durée**: 3 minutes
**Objectif**: Valider migration display_order sur table collections

### Actions

1. **Naviguer** vers http://localhost:3000/catalogue/collections
2. **Vérifier** console: 0 erreur chargement
3. **Cliquer** bouton "Nouvelle collection"
4. **Remplir** formulaire:
   - Nom*: **`test-collection-final-2025`**
   - Slug*: `test-collection-2025`
   - Description: `Validation Erreur #8 collections`
5. **Cliquer** "Créer"

### Validations

- ✅ Collection créée visible
- ✅ Console: **0 erreur PGRST204** (CRITIQUE)
- ✅ Toast success

---

## 📊 RAPPORT FINAL

### Format Rapport

Copier-coller ce template et remplir:

```
## RÉSULTATS TESTS GROUPE 2

**Date**: 2025-10-16
**Testeur**: [Votre nom]
**Durée totale**: XX minutes

### Tests Exécutés

| Test | Statut | Console Errors | Notes |
|------|--------|----------------|-------|
| 2.1 Famille | ✅/❌ | 0 / X | [notes] |
| 2.2 Catégorie | ✅/❌ | 0 / X | [notes] |
| 2.3 Sous-catégorie | ✅/❌ | 0 / X | [notes] |
| 2.4 Collection | ✅/❌ | 0 / X | [notes] |

**Score**: X/4 tests réussis

### Validation Erreur #8

- PGRST204 détecté: Oui / Non
- Erreur display_order: Oui / Non
- Migration réussie: ✅ / ❌

### Validation Erreur #6

- Message UX famille duplicate: ✅ / ❌
- Message clair et contextuel: Oui / Non

### Nouvelles Erreurs

[Liste si détectées]

### Recommandation

- Si 4/4 ✅: **CONTINUER GROUPE 3**
- Si <4 ✅: **STOP - Corrections requises**

### Screenshots

[Liens si disponibles]
```

---

## 🚀 APRÈS LES TESTS

### Si 4/4 Tests ✅

**Action**: Informer Claude Code

> "Tests GROUPE 2: 4/4 réussis, console clean, Erreur #8 validée. Prêt pour GROUPE 3."

### Si ≥1 Test ❌

**Action**: Rapporter erreurs précises

> "Test 2.X échoué: [copier message console exact]. Screenshot: [lien]."

---

## 📞 SUPPORT

**Durée prévue**: 10-15 minutes
**Difficulté**: Facile (checklist guidée)

**Bloqué?** Rapporter étape exacte + screenshot console

---

## 🔍 DÉTAILS TECHNIQUES

### Erreur #8 - Contexte

**Symptôme original**:
```
PGRST204: Column 'display_order' of relation 'product_families' does not exist
```

**Causes**:
- Migration incomplète base de données
- Colonne `display_order` non créée sur tables product_families, categories, subcategories, collections
- Code application référence colonne inexistante

**Corrections appliquées**:
1. Migration SQL `20250116000000_fix_display_order_columns.sql`:
   - Ajout colonne `display_order` sur 3 tables
   - Initialisation valeurs existantes
   - Ajout contraintes CHECK

2. Code (18 fichiers):
   - Remplacement `sort_order` par `display_order`
   - Mise à jour queries Supabase
   - Corrections composants React

**Ce que ce guide valide**:
- Les créations d'entités (familles, catégories, sous-catégories, collections) n'entraînent PLUS d'erreur PGRST204
- La colonne `display_order` existe et fonctionne correctement
- Les messages d'erreur UX sont clairs (Erreur #6)

---

## 📝 NOTES IMPORTANTES

### Console Warnings Autorisés

**Warnings activity_tracking** (jaune ⚠️):
```
Activity tracking failed: [...]
```
**Statut**: Non bloquant, système optionnel

**Autres warnings acceptables**:
- Source map warnings (dev mode)
- React DevTools suggestions

### Console Errors INTERDITS

**Erreurs bloquantes** (rouge ❌):
- PGRST204 (display_order)
- 500 Internal Server Error
- Uncaught exceptions JavaScript
- Network errors sur endpoints API

### Cas Limites

**Si famille "test-famille-final-2025" existe déjà**:
- Utiliser nom unique: `test-famille-final-2025-v2`
- Même logique pour catégories/sous-catégories/collections

**Si serveur dev crash pendant test**:
- Redémarrer: `npm run dev`
- Attendre "Ready in Xs"
- Reprendre test échoué

**Si console submergée de logs**:
- Cliquer "Clear console" (icône 🚫)
- Recharger page (Cmd+R)
- Reprendre test

---

## ✅ CHECKLIST RAPIDE

Avant de commencer:
- [ ] Serveur dev actif (localhost:3000)
- [ ] DevTools ouvert (F12)
- [ ] Console visible
- [ ] "Preserve log" activé
- [ ] Console vierge au chargement

Pendant les tests:
- [ ] Vérifier console après CHAQUE action
- [ ] Noter immédiatement toute erreur
- [ ] Screenshot si erreur PGRST204
- [ ] Compléter template rapport

Après les tests:
- [ ] Rapport complété
- [ ] Score calculé (X/4)
- [ ] Recommandation claire
- [ ] Communication résultats à Claude Code

---

**Dernière mise à jour**: 2025-10-16
**Version guide**: 1.0.0
**Auteur**: Claude Code - Expert Test Vérone
