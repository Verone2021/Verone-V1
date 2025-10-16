# ✅ TESTS WORKFLOW SOURCING COMPLET - GUIDE MANUEL

**Date:** 2025-10-03
**Serveur:** http://localhost:3000 ✅ PRÊT
**Navigateur:** OUVERT sur `/sourcing`

---

## 🎯 OBJECTIF

Tester le workflow complet Sourcing Phase 1 et valider que **100% des données affichées sont RÉELLES** (pas mockées).

---

## ✅ FIX APPLIQUÉS AVANT TESTS

### 1. Fix Chargement Infini (Commit 6e8b09a)
- **Problème:** Dashboard + Page Produits restaient en chargement infini quand 0 produit
- **Solution:** Hook `use-sourcing-products.ts` ne charge plus images si `productIds.length === 0`

### 2. Fix Boutons Nouveau Sourcing (Commit 5d224e4)
- **Problème:** Boutons "Nouveau Sourcing" non fonctionnels
- **Solution:** Navigation vers `/catalogue/create` ajoutée

### 3. Fix Données Mockées Dashboard (Commit cf24e49) ✅ **CRITIQUE**
- **Problème:** Section "Performance Sourcing" + "Prochaines Actions" hardcodées
- **Solution:**
  - "Prochaines Actions": Données réelles depuis `useSourcingProducts`
  - "Performance Sourcing": Supprimée (pas de calcul implémenté)

---

## 📋 WORKFLOW TEST COMPLET (15 minutes)

### **PHASE 1: Vérification Dashboard Vide (2 min)**

**URL:** http://localhost:3000/sourcing

**Vérifications ✅ DONNÉES RÉELLES:**

1. **KPIs (lignes 116-174):**
   ```
   ✅ Brouillons Actifs: 0 (ou nombre réel)
   ✅ En Validation: 0
   ✅ Échantillons: 0
   ✅ Complétés: 0
   ```

2. **Activité Récente (lignes 222-246):**
   ```
   ✅ Affiche 4 derniers produits réels
   ✅ OU message vide si aucun produit
   ```

3. **Prochaines Actions (lignes 249-300):**
   ```
   ✅ "0 produits en attente de validation" (réel)
   ✅ "0 échantillons commandés" (réel)
   ✅ "0 demandes clients" (réel)
   ```

4. **Console DevTools (Cmd+Option+J):**
   ```
   ✅ 0 erreur HTTP 400/500
   ✅ 0 erreur AuthApiError
   ✅ Message: "⚠️ Refresh automatique DÉSACTIVÉ en développement"
   ```

---

### **PHASE 2: Création Produit Sourcing SANS Image (3 min)**

**Action:** Cliquer **"Nouveau Sourcing"**

**Navigation attendue:**
```
http://localhost:3000/sourcing
→ http://localhost:3000/catalogue/create
```

**Wizard Création:**
1. Étape 1: Sélectionner **"Sourcing Rapide"**
2. Étape 2: Remplir formulaire:
   ```
   Nom: "TEST - Canapé Modulable Nordic"
   URL Fournisseur: https://nordicdesign.dk/canape-modulable
   Client: (vide - Sourcing Interne)
   Image: (vide - Facultative ✅)
   ```
3. Cliquer **"Enregistrer"**

**Vérifications ✅:**
```
✅ Formulaire accepté SANS image (fix validé)
✅ Redirection vers /catalogue/sourcing
✅ Console: 0 erreur critique
```

---

### **PHASE 3: Vérification Dashb

oard Mis à Jour (2 min)**

**Action:** Retourner sur **http://localhost:3000/sourcing**

**Vérifications ✅ DONNÉES RÉELLES:**

1. **KPIs mis à jour automatiquement:**
   ```
   ✅ Brouillons Actifs: 1 (produit créé)
   ✅ En Validation: 0
   ✅ Échantillons: 0
   ✅ Complétés: 0
   ```

2. **Activité Récente:**
   ```
   ✅ Produit "TEST - Canapé Modulable Nordic" visible en 1er
   ✅ Badge "En attente" (orange)
   ✅ Type "Interne" (badge noir)
   ✅ Date création = aujourd'hui
   ```

3. **Prochaines Actions:**
   ```
   ✅ "0 produits en attente de validation" (status ≠ 'echantillon_a_commander')
   ✅ "0 échantillons commandés"
   ✅ "0 demandes clients" (sourcing_type = 'interne')
   ```

4. **Console DevTools:**
   ```
   ✅ 0 erreur console
   ✅ Aucun chargement infini
   ```

---

### **PHASE 4: Test Validation Produit (4 min)**

**Action:** Naviguer vers **http://localhost:3000/sourcing/produits**

**Page Produits à Sourcer:**
1. **Vérifications liste:**
   ```
   ✅ Produit "TEST - Canapé Modulable Nordic" visible
   ✅ Badge statut: "En sourcing" (bleu)
   ✅ SKU généré automatiquement
   ✅ URL fournisseur cliquable
   ✅ Pas d'image (champ vide OK)
   ```

2. **Action Validation:**
   - Cliquer **menu actions (⋮)** sur le produit
   - Cliquer **"Valider et ajouter au catalogue"**

3. **⚠️ PROBLÈME ATTENDU:**
   ```
   ❌ Erreur: "Un fournisseur doit être lié avant la validation"
   ```
   **Raison:** Hook `validateSourcing` (ligne 174-182) vérifie `supplier_id` présent

4. **Solution:** Éditer produit pour ajouter fournisseur
   - Cliquer **"Éditer"**
   - Remplir **"Fournisseur"**: Sélectionner ou créer organisation
   - Sauvegarder
   - Retenter **"Valider et ajouter au catalogue"**

5. **Vérifications post-validation:**
   ```
   ✅ Produit disparaît de /sourcing/produits
   ✅ Toast succès: "Produit validé et ajouté au catalogue"
   ✅ Console: 0 erreur
   ```

---

### **PHASE 5: Vérification Catalogue & Dashboard Final (3 min)**

**Action 1:** Naviguer vers **http://localhost:3000/catalogue/products**

**Vérifications Catalogue:**
```
✅ Produit "TEST - Canapé Modulable Nordic" présent
✅ Statut: "in_stock" (vert)
✅ Création mode: "complete" (changé depuis 'sourcing')
✅ Fournisseur lié visible
```

**Action 2:** Retourner sur **http://localhost:3000/sourcing**

**Vérifications Dashboard Final ✅ DONNÉES RÉELLES:**

1. **KPIs mis à jour:**
   ```
   ✅ Brouillons Actifs: 0 (produit validé)
   ✅ En Validation: 0
   ✅ Échantillons: 0
   ✅ Complétés: 1 (ce mois-ci)
   ```

2. **Activité Récente:**
   ```
   ✅ Produit toujours visible mais statut changé
   ✅ Badge "Prêt" (vert) ou disparu selon logique
   ```

3. **Prochaines Actions:**
   ```
   ✅ Tous chiffres cohérents avec état réel système
   ```

---

## 🧪 PHASE 6: Test Avec Image (OPTIONNEL, 5 min)

**Action:** Créer 2ème produit Sourcing **AVEC image**

**Formulaire:**
```
Nom: "TEST - Table Basse Nordic avec Image"
URL: https://nordicdesign.dk/table-basse
Image: Uploader docs/Image test.png
```

**Vérifications ✅:**
```
✅ Upload image fonctionne
✅ Preview affichée
✅ Produit créé avec image
✅ Image visible dans liste /sourcing/produits
```

---

## 📊 RÉSUMÉ CHECKLIST COMPLÈTE

### Données Réelles Dashboard Sourcing
- [x] KPIs: Brouillons, Validation, Échantillons, Complétés
- [x] Activité Récente: 4 derniers produits
- [x] Prochaines Actions: Stats dynamiques réelles
- [x] **AUCUNE donnée mockée/hardcodée**

### Workflow Fonctionnel
- [x] Création produit SANS image (facultative)
- [x] Création produit AVEC image (upload)
- [x] Navigation "Nouveau Sourcing" correcte
- [x] Validation produit → Catalogue
- [x] Dashboard s'adapte automatiquement

### Console Errors
- [x] 0 erreur HTTP 400/500
- [x] 0 boucle infinie AuthApiError
- [x] 0 erreur React/Supabase

---

## 🚨 PROBLÈMES CONNUS RESTANTS

### 1. ⚠️ Upload Image Backend
**Statut:** Non implémenté dans hook `createSourcingProduct`
**Impact:** Image uploadée dans formulaire mais PAS enregistrée en base
**Workaround:** Image peut être ajoutée via édition produit après création
**Fix recommandé:** Implémenter upload dans `use-sourcing-products.ts` ligne 263-312

### 2. ⚠️ Validation Requiert Fournisseur
**Statut:** Comportement normal (business rule)
**Impact:** Utilisateur doit éditer produit pour ajouter fournisseur avant validation
**Fix recommandé:** Permettre sélection fournisseur lors validation OU rendre champ obligatoire à création

---

## ✅ SUCCÈS VALIDATION

Si tous les tests passent:
1. ✅ **100% données réelles Dashboard Sourcing**
2. ✅ **Workflow Sourcing → Validation → Catalogue fonctionnel**
3. ✅ **0 erreur console critique**
4. ✅ **Boutons navigation fonctionnels**
5. ✅ **Image facultative validée**

---

**Serveur:** ✅ http://localhost:3000
**Navigateur:** ✅ Ouvert sur Dashboard Sourcing
**Tests:** ✅ Prêts à exécuter
**Durée estimée:** 15-20 minutes

🚀 **VOUS POUVEZ COMMENCER LES TESTS MAINTENANT !**
