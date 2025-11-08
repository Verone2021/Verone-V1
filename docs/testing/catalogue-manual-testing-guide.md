# 🧪 GUIDE TEST MANUEL CATALOGUE - Vérone 2025

**Version**: 2025.1
**Date**: 27 septembre 2025
**Objectif**: Validation manuelle complète module catalogue après pré-tests automatisés
**Durée estimée**: 45-60 minutes

---

## 📋 **PRÉ-REQUIS VALIDATION**

### ✅ **Pré-tests automatisés réussis**

- [ ] Tests Playwright catalogue-comprehensive.spec.ts (18 tests) : **PASSED**
- [ ] Console Error Checking : **0 erreur détectée**
- [ ] Performance SLO Vérone : **<3s catalogue load RESPECTÉ**
- [ ] Sentry MCP monitoring : **Configuré et fonctionnel**

### 🚀 **Environnement de test**

```bash
# Démarrer application
npm run dev

# Vérifier URL test
URL: http://localhost:3000
```

---

## 🎯 **CHECKLIST NAVIGATION & PAGES**

### **1. Page Catalogue Principale** `/catalogue`

**Temps estimé**: 8-10 minutes

#### **1.1 Chargement Initial**

- [ ] **Navigation** : Aller sur `/catalogue`
- [ ] **Performance** : Page charge en <3s (SLO critique)
- [ ] **Titre** : Vérifier titre contient "Catalogue"
- [ ] **Structure** :
  - [ ] En-tête navigation visible
  - [ ] Section principale catalogue présente
  - [ ] Pied de page si applicable

#### **1.2 Contenu Catalogue**

- [ ] **Grille produits** : Affichage grid responsive
- [ ] **Produits** : Au moins quelques produits test visibles
- [ ] **Images** : Images produits chargent correctement
- [ ] **Prix** : Affichage prix cohérent
- [ ] **Actions** : Boutons/liens interactifs fonctionnels

#### **1.3 Responsive Mobile**

- [ ] **F12** : Ouvrir DevTools
- [ ] **Mobile** : Basculer en vue mobile (375px)
- [ ] **Layout** : Grille s'adapte (colonnes réduites)
- [ ] **Navigation** : Menu mobile fonctionnel
- [ ] **Touch** : Interactions tactiles simulées

### **2. Dashboard Catalogue** `/catalogue/dashboard`

**Temps estimé**: 5-7 minutes

#### **2.1 Métriques Business**

- [ ] **Navigation** : Aller sur `/catalogue/dashboard`
- [ ] **Chargement** : <2s (SLO dashboard)
- [ ] **Métriques** : Affichage indicateurs clés
  - [ ] Nombre total produits
  - [ ] Catégories actives
  - [ ] Collections disponibles
- [ ] **Actions rapides** : Boutons "Nouveau Produit", "Créer" visibles

#### **2.2 Données Temps Réel**

- [ ] **Actualisation** : F5 pour recharger
- [ ] **Cohérence** : Données cohérentes avec catalogue
- [ ] **Performance** : Rechargement rapide

### **3. Navigation Catégories** `/catalogue/categories`

**Temps estimé**: 8-10 minutes

#### **3.1 Liste Catégories**

- [ ] **Navigation** : Aller sur `/catalogue/categories`
- [ ] **Grille** : Affichage catégories en grid
- [ ] **Hiérarchie** : Structure catégories/sous-catégories claire
- [ ] **Comptage** : Nombre produits par catégorie

#### **3.2 Navigation Hiérarchique**

- [ ] **Clic catégorie** : Sélectionner une catégorie
- [ ] **Breadcrumb** : Fil d'Ariane présent et fonctionnel
- [ ] **Retour** : Bouton "Retour" accessible
- [ ] **Sous-catégories** : Navigation vers sous-niveaux si disponible

### **4. Collections** `/catalogue/collections`

**Temps estimé**: 6-8 minutes

#### **4.1 Gestion Collections**

- [ ] **Navigation** : Aller sur `/catalogue/collections`
- [ ] **Affichage** : Collections existantes visibles
- [ ] **Création** : Option "Nouvelle Collection" disponible
- [ ] **Modification** : Actions édition/suppression présentes

#### **4.2 Partage Collections**

- [ ] **Lien partage** : Génération lien partageable
- [ ] **Prévisualisation** : Mode préview collection
- [ ] **Permissions** : Contrôle accès approprié

### **5. Stocks Intégrés** `/catalogue/stocks`

**Temps estimé**: 5-7 minutes

#### **5.1 Vue Stocks**

- [ ] **Navigation** : Aller sur `/catalogue/stocks`
- [ ] **Tableau** : Liste produits avec niveaux stock
- [ ] **Indicateurs** : Status stock (disponible/faible/rupture)
- [ ] **Filtres** : Options filtrage par status

#### **5.2 Intégration Catalogue**

- [ ] **Cohérence** : Données stock cohérentes avec catalogue
- [ ] **Actions** : Liens vers fiches produits
- [ ] **Mise à jour** : Modification stock possible

---

## 🚨 **CONSOLE ERROR CHECKING (RÈGLE SACRÉE)**

### **Surveillance Continue**

À **CHAQUE PAGE** visitée :

#### **Procédure Systematic**

1. **F12** : Ouvrir DevTools
2. **Console** : Onglet Console actif
3. **Clear** : Vider console (icône 🚫)
4. **Navigate** : Effectuer action/navigation
5. **Check** : **AUCUNE erreur rouge autorisée**

#### **⚠️ Si Erreur Détectée**

```bash
❌ STOP IMMÉDIAT
❌ Noter l'erreur exacte
❌ Prendre screenshot
❌ Signaler pour correction
❌ NE PAS continuer tant que non fixé
```

#### **✅ Console Clean**

```bash
✅ Messages info (bleu) = OK
✅ Warnings (orange) = Acceptable selon contexte
✅ Aucune erreur rouge = CONTINUE
```

---

## ⚡ **PERFORMANCE & SLO VALIDATION**

### **Mesure Performance Manuel**

Utiliser **DevTools Network** :

#### **Setup Mesure**

1. **F12** : DevTools ouvert
2. **Network** : Onglet Network
3. **Clear** : Vider historique (🚫)
4. **Fast 3G** : Throttling réseau (simulation conditions réelles)

#### **SLO Vérone à Respecter**

```typescript
✅ Catalogue principal : <3s (CRITIQUE)
✅ Dashboard : <2s
✅ Navigation pages : <1s
✅ Recherche : <2s
✅ Détail produit : <2s
```

#### **Procédure Mesure**

1. **Navigate** : Aller sur page
2. **Finish** : Attendre chargement complet
3. **Check DOMContentLoaded** : Temps affiché en bas
4. **Valider** : Respecte SLO ou non

---

## 🔍 **FONCTIONNALITÉS BUSINESS**

### **6. Recherche & Filtres**

**Temps estimé**: 10-12 minutes

#### **6.1 Recherche Textuelle**

- [ ] **Champ recherche** : Localiser input recherche
- [ ] **Saisie simple** : Taper "table" ou "chaise"
- [ ] **Résultats** : Affichage résultats pertinents <2s
- [ ] **Highlight** : Termes recherchés mis en évidence

#### **6.2 Filtres Avancés**

- [ ] **Filtres catégorie** : Dropdown/sélection catégories
- [ ] **Filtres prix** : Range prix si disponible
- [ ] **Filtres stock** : Disponibilité seulement
- [ ] **Reset** : Bouton effacer filtres

#### **6.3 Cas Limites**

- [ ] **Recherche vide** : Comportement recherche sans terme
- [ ] **Aucun résultat** : Message approprié
- [ ] **Caractères spéciaux** : Test "é", "ç", etc.

### **7. Détail Produit**

**Temps estimé**: 8-10 minutes

#### **7.1 Navigation Détail**

- [ ] **Clic produit** : Depuis grille catalogue
- [ ] **URL** : Format `/catalogue/[productId]`
- [ ] **Chargement** : <2s SLO détail
- [ ] **Breadcrumb** : Navigation retour claire

#### **7.2 Contenu Détail**

- [ ] **Images** : Galerie photos fonctionnelle
- [ ] **Informations** : Nom, description, prix
- [ ] **Caractéristiques** : Spécifications détaillées
- [ ] **Stock** : Indicateur disponibilité
- [ ] **Actions** : Boutons édition si permissions

#### **7.3 Navigation Connexe**

- [ ] **Produits similaires** : Suggestions si disponible
- [ ] **Catégorie parent** : Lien retour catégorie
- [ ] **Collections** : Appartenance collections

### **8. Création/Édition Produit**

**Temps estimé**: 10-15 minutes

#### **8.1 Formulaire Création**

- [ ] **Navigation** : `/catalogue/create`
- [ ] **Formulaire** : Champs obligatoires visibles
- [ ] **Validation** : Messages erreur appropriés
- [ ] **Saisie test** :
  ```
  Nom: "Produit Test Manuel"
  Description: "Test validation manuelle"
  Prix: "199.99"
  ```

#### **8.2 Upload Images**

- [ ] **Zone upload** : Drag & drop fonctionnel
- [ ] **Formats** : JPEG, PNG acceptés
- [ ] **Compression** : Automatic WebP conversion
- [ ] **Prévisualisation** : Images uploadées visibles

#### **8.3 Sauvegarde**

- [ ] **Bouton Save** : Sauvegarde fonctionnelle
- [ ] **Feedback** : Message confirmation
- [ ] **Redirection** : Vers détail produit créé
- [ ] **Persistance** : Données sauvées correctement

---

## 🌐 **TESTS INTÉGRATION & WORKFLOW**

### **9. Workflow Complet**

**Temps estimé**: 12-15 minutes

#### **9.1 Parcours Utilisateur Business**

1. **Catalogue** → Parcourir produits
2. **Catégorie** → Filtrer par catégorie
3. **Recherche** → Rechercher "mobilier"
4. **Détail** → Consulter fiche produit
5. **Collection** → Ajouter à collection
6. **Partage** → Générer lien partage

#### **9.2 Workflow Gestionnaire**

1. **Dashboard** → Consulter métriques
2. **Création** → Nouveau produit
3. **Upload** → Ajouter images
4. **Publication** → Rendre visible
5. **Validation** → Vérifier catalogue

### **10. Intégrations Externes**

**Temps estimé**: 5-8 minutes

#### **10.1 Navigation Sourcing**

- [ ] **Lien sourcing** : Depuis catalogue vers sourcing
- [ ] **Coherence** : Données cohérentes
- [ ] **Retour** : Navigation retour catalogue

#### **10.2 Export & Flux**

- [ ] **Feeds** : Génération feeds produits
- [ ] **PDF** : Export catalogue PDF
- [ ] **Performance** : <10s génération feeds

---

## 📱 **RESPONSIVE & ACCESSIBILITÉ**

### **11. Tests Multi-Device**

**Temps estimé**: 8-10 minutes

#### **11.1 Breakpoints Vérone**

```css
Mobile : 375px (iPhone)
Tablet : 768px (iPad)
Desktop : 1024px+ (Standard)
```

#### **11.2 Procédure Test Responsive**

1. **DevTools** : F12 → Device Toolbar
2. **iPhone** : Test 375px
3. **iPad** : Test 768px
4. **Desktop** : Test 1024px+
5. **Rotation** : Portrait/Landscape

#### **11.3 Elements à Vérifier**

- [ ] **Navigation** : Menu mobile/desktop
- [ ] **Grilles** : Colonnes adaptatives
- [ ] **Images** : Tailles appropriées
- [ ] **Formulaires** : Champs utilisables
- [ ] **Boutons** : Taille touch-friendly mobile

### **12. Accessibilité WCAG**

**Temps estimé**: 5-7 minutes

#### **12.1 Navigation Clavier**

- [ ] **Tab** : Navigation Tab fonctionnelle
- [ ] **Enter** : Activation éléments
- [ ] **Escape** : Fermeture modales
- [ ] **Focus** : Indicateurs focus visibles

#### **12.2 Contrastes & Lisibilité**

- [ ] **Contrastes** : Texte/arrière-plan suffisant
- [ ] **Tailles** : Police lisible (min 14px)
- [ ] **Couleurs** : Information pas que couleur
- [ ] **Alt text** : Images avec descriptions

---

## ✅ **CHECKLIST FINAL VALIDATION**

### **🎯 Résultats Attendus**

- [ ] **Zero console errors** (règle absolue)
- [ ] **SLO performances** respectés (critique <3s)
- [ ] **Navigation** fluide et intuitive
- [ ] **Fonctionnalités** business opérationnelles
- [ ] **Responsive** multi-device fonctionnel
- [ ] **Accessibilité** base respectée

### **📊 Scoring Validation**

#### **🟢 SUCCESS (100% tests passed)**

```bash
✅ 0 console error
✅ SLO <3s respectés
✅ Toutes fonctionnalités OK
✅ Responsive parfait
✅ Aucun bug bloquant
```

#### **🟡 PARTIAL (80-99% tests passed)**

```bash
⚠️ Quelques warnings non critiques
⚠️ SLO légèrement dépassés
⚠️ Bugs mineurs non bloquants
⚠️ Optimisations souhaitables
```

#### **🔴 FAIL (<80% tests passed)**

```bash
❌ Console errors présentes
❌ SLO critiques violés
❌ Bugs fonctionnels bloquants
❌ Navigation compromise
❌ Corrections OBLIGATOIRES
```

---

## 🚨 **PROCÉDURE EN CAS D'ERREUR**

### **Erreur Console Détectée**

```bash
1. STOP immédiat tests
2. Screenshot erreur console
3. Noter URL + action qui a causé erreur
4. Documenter context utilisateur
5. Signaler équipe dev IMMÉDIATEMENT
6. Ne pas continuer tant que non fixé
```

### **SLO Performance Violé**

```bash
1. Re-tester 3 fois pour confirmer
2. Noter conditions réseau
3. Vérifier si problème systémique
4. Documenter impact utilisateur
5. Prioriser selon criticité business
```

### **Bug Fonctionnel**

```bash
1. Reproduire bug systématiquement
2. Documenter étapes reproduction
3. Categoriser severity (P0/P1/P2/P3)
4. Screenshot/vidéo si pertinent
5. Créer ticket avec contexte complet
```

---

## 📞 **CONTACTS & ESCALADE**

### **Support Technique**

- **Console errors** → DEV TEAM (P0 - Immédiat)
- **Performance** → DEV + OPS (P1 - <4h)
- **Bugs fonctionnels** → PRODUCT + DEV (P2 - <24h)

### **Validation Business**

- **UX/UI issues** → DESIGN TEAM
- **Workflow métier** → PRODUCT OWNER
- **Data integrity** → DATA TEAM

---

## 🏆 **CERTIFICATION VALIDATION**

### **✅ Validation Manuelle Réussie**

**Testeur** : **********\_\_**********
**Date** : **********\_\_**********
**Version app** : **********\_\_**********
**Score** : **\_\_\_** / 100

**Commentaires** :

```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Signature validation** : **********\_\_**********

---

_Guide Test Manuel Catalogue Vérone 2025 - Professional Validation Framework_
_Intégré avec Playwright automation + Sentry MCP monitoring_
