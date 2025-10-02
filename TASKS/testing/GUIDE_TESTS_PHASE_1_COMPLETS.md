# 🧪 GUIDE TESTS PHASE 1 - COMPLETS (7 Modules)

**Date:** 2025-10-03
**Serveur:** http://localhost:3000
**Durée estimée:** 45-60 minutes

---

## ✅ MODULES DÉJÀ VALIDÉS (46%)

### 1. Module Organisations ✅
- ✅ Création fournisseur (slug auto-généré)
- ✅ Création client
- ✅ Liste organisations
- **Fix validé:** Erreur 400 corrigée (3ae7e8e)

### 2. Module Sourcing Rapide ✅
- ✅ Formulaire création (image facultative)
- ✅ Upload image fonctionnel
- **Fix validé:** Image facultative (79c2624)

### 3. Système Session ✅
- ✅ Authentification
- ✅ Refresh token (désactivé en dev)
- **Fix validé:** Boucle infinie (1b12b6e)

---

## 🎯 MODULES À TESTER (54% - 7 modules)

### **PRIORITÉ 1: Workflow Sourcing Complet (20 min)**

#### Test 1.1: Création Produit Sourcing Rapide avec Image
**Page:** http://localhost:3000/catalogue/create → Sourcing Rapide

```bash
# Formulaire:
Nom: "TEST Phase1 - Table Nordic Design"
URL Fournisseur: https://nordicdesign.dk/table-oak
Fournisseur: [Créer nouveau si besoin] "Nordic Design Suppliers"
Image: [Utiliser Image test.png fournie par utilisateur]

# Vérifications:
✅ Formulaire accepte image upload
✅ Formulaire accepte SANS image (facultatif)
✅ Création réussie
✅ Redirection vers /catalogue/sourcing
✅ Console: 0 erreur critique
```

#### Test 1.2: Validation Sourcing → Produits
**Page:** http://localhost:3000/catalogue/sourcing

```bash
# Actions:
1. Localiser produit "TEST Phase1 - Table Nordic Design"
2. Cliquer "Valider" ou bouton action validation
3. Confirmer validation

# Vérifications:
✅ Produit disparaît de liste Sourcing
✅ Produit apparaît dans /catalogue/products
✅ Statut changé en "validated" ou "active"
✅ Console: 0 erreur critique
```

---

### **PRIORITÉ 2: Module Catalogue - Produits (15 min)**

#### Test 2.1: Liste Produits
**Page:** http://localhost:3000/catalogue/products

```bash
# Vérifications:
✅ Liste affiche produits (dont "TEST Phase1 - Table Nordic Design")
✅ Pagination fonctionne (si >10 produits)
✅ Filtres disponibles (recherche, statut, etc.)
✅ Actions visibles (éditer, supprimer, etc.)
✅ Console: 0 erreur critique
```

#### Test 2.2: Détails Produit
**Page:** Cliquer sur produit "TEST Phase1 - Table Nordic Design"

```bash
# Vérifications:
✅ Page détails s'ouvre
✅ Image affichée (si uploadée)
✅ Informations correctes (nom, URL, fournisseur)
✅ Actions disponibles (éditer, supprimer)
✅ Console: 0 erreur critique
```

#### Test 2.3: Édition Produit
**Page:** Cliquer "Éditer" sur produit test

```bash
# Modifications:
Nom: "TEST Phase1 - Table Nordic Design (MODIFIÉ)"
Ajouter description: "Table en chêne massif, design scandinave"

# Vérifications:
✅ Formulaire pré-rempli avec données existantes
✅ Modifications sauvegardées
✅ Retour liste avec changements visibles
✅ Console: 0 erreur critique
```

---

### **PRIORITÉ 3: Module Catalogue - Catégories (10 min)**

#### Test 3.1: Liste Catégories
**Page:** http://localhost:3000/catalogue/categories

```bash
# Vérifications:
✅ Liste catégories existantes
✅ Actions disponibles (créer, éditer, supprimer)
✅ Console: 0 erreur critique
```

#### Test 3.2: Création Catégorie
**Page:** Cliquer "Nouvelle catégorie"

```bash
# Formulaire:
Nom: "TEST - Mobilier Scandinave"
Description: "Meubles design nordique"
Slug: Auto-généré ou manuel "mobilier-scandinave"

# Vérifications:
✅ Formulaire soumis avec succès
✅ Catégorie visible dans liste
✅ Console: 0 erreur critique
```

#### Test 3.3: Association Produit → Catégorie
**Page:** Éditer produit "TEST Phase1 - Table Nordic Design"

```bash
# Action:
Assigner catégorie: "TEST - Mobilier Scandinave"

# Vérifications:
✅ Association sauvegardée
✅ Produit affiche catégorie dans détails
✅ Console: 0 erreur critique
```

---

### **PRIORITÉ 4: Module Catalogue - Collections (10 min)**

#### Test 4.1: Liste Collections
**Page:** http://localhost:3000/catalogue/collections

```bash
# Vérifications:
✅ Liste collections existantes
✅ Actions disponibles (créer, éditer, supprimer)
✅ Console: 0 erreur critique
```

#### Test 4.2: Création Collection
**Page:** Cliquer "Nouvelle collection"

```bash
# Formulaire:
Nom: "TEST - Collection Nordic 2025"
Description: "Nouveautés design scandinave printemps 2025"
Slug: "nordic-2025"

# Vérifications:
✅ Formulaire soumis avec succès
✅ Collection visible dans liste
✅ Console: 0 erreur critique
```

#### Test 4.3: Association Produit → Collection
**Page:** Éditer produit "TEST Phase1 - Table Nordic Design"

```bash
# Action:
Assigner collection: "TEST - Collection Nordic 2025"

# Vérifications:
✅ Association sauvegardée
✅ Produit affiche collection dans détails
✅ Console: 0 erreur critique
```

---

### **PRIORITÉ 5: Module Catalogue - Variantes (10 min)**

#### Test 5.1: Liste Variantes Produit
**Page:** Détails produit "TEST Phase1 - Table Nordic Design" → Onglet Variantes

```bash
# Vérifications:
✅ Section variantes visible
✅ Action "Ajouter variante" disponible
✅ Console: 0 erreur critique
```

#### Test 5.2: Création Variante
**Page:** Cliquer "Ajouter variante"

```bash
# Formulaire:
Type: Taille
Valeur: "120x80 cm"
SKU: "TABLE-NORDIC-120"
Stock: 15
Prix: 899.00

# Vérifications:
✅ Variante créée avec succès
✅ Variante visible dans liste produit
✅ Console: 0 erreur critique
```

#### Test 5.3: Création Variante Couleur
**Page:** Ajouter 2ème variante

```bash
# Formulaire:
Type: Couleur
Valeur: "Chêne naturel"
SKU: "TABLE-NORDIC-120-NAT"
Stock: 10
Prix: 899.00

# Vérifications:
✅ Variante créée avec succès
✅ 2 variantes visibles pour le produit
✅ Console: 0 erreur critique
```

---

### **PRIORITÉ 6: Module Dashboard (5 min)**

#### Test 6.1: Affichage KPIs Réels
**Page:** http://localhost:3000/dashboard

```bash
# Vérifications:
✅ KPIs affichent données réelles (pas mock)
✅ Total produits > 0 (dont produit test créé)
✅ Graphiques chargent (si données suffisantes)
✅ Aucune donnée "mockée" visible
✅ Console: 0 erreur critique
```

**Données attendues:**
- Total produits: Inclut "TEST Phase1 - Table Nordic Design"
- Organisations: Inclut fournisseur créé
- Sourcing: Doit être vide si tout validé

---

### **PRIORITÉ 7: Navigation & Sidebar (5 min)**

#### Test 7.1: Navigation Complète
**Page:** Démarrer http://localhost:3000/dashboard

```bash
# Parcours complet sidebar:
1. Dashboard
2. Catalogue → Produits
3. Catalogue → Catégories
4. Catalogue → Collections
5. Catalogue → Sourcing
6. Catalogue → Créer produit
7. Organisation
8. Vérifier Échantillons DÉSACTIVÉ ✅

# Vérifications:
✅ Toutes pages chargent sans erreur
✅ Échantillons non visible (Phase 1)
✅ Aucune erreur 404
✅ Console: 0 erreur critique sur navigation
```

---

## 🧹 CLEANUP DONNÉES TEST (5 min)

### Après Tests Complets

```bash
# Supprimer dans l'ordre:
1. Variantes test (2 variantes table Nordic)
2. Produit test "TEST Phase1 - Table Nordic Design (MODIFIÉ)"
3. Collection test "TEST - Collection Nordic 2025"
4. Catégorie test "TEST - Mobilier Scandinave"
5. Organisation test "Nordic Design Suppliers" (si créée)
6. Produits sourcing restants (si non validés)

# Vérifications finales:
✅ Aucune donnée "TEST" visible dans interface
✅ Base de données propre (sauf données production)
✅ Console: 0 erreur critique
```

---

## 📊 CHECKLIST RÉCAPITULATIVE

### Workflow Principal
- [ ] Création produit Sourcing avec image
- [ ] Création produit Sourcing SANS image
- [ ] Validation Sourcing → Produits

### Catalogue - Produits
- [ ] Liste produits
- [ ] Détails produit
- [ ] Édition produit

### Catalogue - Catégories
- [ ] Liste catégories
- [ ] Création catégorie
- [ ] Association produit → catégorie

### Catalogue - Collections
- [ ] Liste collections
- [ ] Création collection
- [ ] Association produit → collection

### Catalogue - Variantes
- [ ] Liste variantes produit
- [ ] Création variante taille
- [ ] Création variante couleur

### Dashboard
- [ ] KPIs données réelles (pas mock)

### Navigation
- [ ] Navigation complète sidebar
- [ ] Échantillons désactivé

### Cleanup
- [ ] Suppression données test
- [ ] Base de données propre

---

## 🚨 ERREURS À SURVEILLER

### Console DevTools (Cmd+Option+J)

**Tolérance:**
- ✅ Warnings Next.js (normaux)
- ✅ Infos développement (normaux)
- ❌ **0 erreur HTTP 400/500** (CRITIQUE)
- ❌ **0 erreur React** (render, hooks, etc.)
- ❌ **0 erreur Supabase** (auth, query, etc.)

**Actions si erreur critique:**
1. ✅ Copier erreur complète
2. ✅ Noter page/action déclenchant erreur
3. ✅ Vérifier si erreur bloque fonctionnalité
4. ✅ Documenter dans rapport final

---

## 📝 RAPPORT FINAL À CRÉER

### Template Rapport Tests Phase 1

```markdown
# Rapport Tests Phase 1 - [Date]

## Résumé Exécutif
- Tests effectués: X/35
- Tests réussis: X
- Erreurs critiques: X
- Durée totale: X minutes

## Détails par Module
### Workflow Sourcing
- [✅/❌] Test 1.1: Création avec image
- [✅/❌] Test 1.2: Création sans image
- [✅/❌] Test 1.3: Validation → Produits
- Erreurs: [Description si applicable]

### Module Produits
- [✅/❌] Test 2.1: Liste
- [✅/❌] Test 2.2: Détails
- [✅/❌] Test 2.3: Édition
- Erreurs: [Description si applicable]

[...etc pour tous modules...]

## Console Errors
- Total erreurs critiques: X
- Détails: [Copie erreurs]

## Recommandations
- [Liste actions correctives si nécessaire]

## Conclusion
- Système prêt production: [OUI/NON]
- Correctifs nécessaires: [Liste]
```

---

## ✅ CONCLUSION

**Durée totale estimée:** 60 minutes
**Tests couverts:** 35 vérifications
**Modules:** 7 modules Phase 1

**Après tests complets:**
1. ✅ Cleanup données test
2. ✅ Créer rapport final
3. ✅ Commit si corrections nécessaires
4. ✅ Validation finale Phase 1

---

**Serveur démarré:** ✅ http://localhost:3000
**Prêt pour tests:** ✅ OUI
**Image test fournie:** ✅ Image test.png

🚀 **VOUS POUVEZ COMMENCER LES TESTS !**
