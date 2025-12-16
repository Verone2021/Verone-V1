# 📦 Guide Insertion Données Produits - MCP Playwright Browser

**Process étape par étape pour insertion catalogue complet**
Vérone Back Office - Phase 1

---

## 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stratégie d'insertion progressive](#stratégie-dinsertion-progressive)
3. [Phase Pilote : 5 produits test](#phase-pilote--5-produits-test)
4. [Phase Complète : Catalogue complet](#phase-complète--catalogue-complet)
5. [Validation et troubleshooting](#validation-et-troubleshooting)

---

## 🎯 Vue d'Ensemble

### Pourquoi MCP Playwright Browser ?

**Avantages MCP Browser** vs scripts automatisés :

- ✅ **Visualisation temps réel** : Tu vois le browser s'ouvrir et naviguer
- ✅ **Validation immédiate** : Détection erreurs instantanée
- ✅ **Pas de scripts** : Pas de code à maintenir (_.js, _.mjs, \*.ts)
- ✅ **Console checking** : Vérification erreurs automatique
- ✅ **Screenshots proof** : Capture visuelle validation
- ✅ **Confiance maximale** : Transparence totale du process

**Process MCP Browser = Règle Sacrée Vérone 2025**

### Architecture Insertion

```
1. Préparation Données
   ↓
2. MCP Browser Navigation → http://localhost:3000/catalogue/create
   ↓
3. Remplissage Formulaire (champs par champs)
   ↓
4. Validation Console Errors (0 tolérance)
   ↓
5. Screenshot Proof
   ↓
6. Commit Git avec détails
```

---

## 📋 Stratégie d'Insertion Progressive

### Phase 1 : Test Pilote (5 Produits Spécifiques)

**Objectif** : Valider process complet avant catalogue

**Produits sélectionnés** :

1. **Canapé Modèle A** (avec 3 variantes couleurs)
2. **Table Bois Massif** (avec 2 dimensions)
3. **Chaise Design Simple** (produit simple sans variantes)
4. **Luminaire LED Premium** (avec caractéristiques techniques)
5. **Tapis Berbère 200x300** (avec collection associée)

**Durée estimée** : 1h
**Branche Git** : `feature/phase1-data-test`

### Phase 2 : Insertion Batch (Catalogue Complet)

**Objectif** : Insérer 50+ produits par catégories

**Organisation par batchs** :

- **Batch 1** : Canapés et fauteuils (10-15 produits) → ~2h
- **Batch 2** : Tables et chaises (10-15 produits) → ~2h
- **Batch 3** : Luminaires (10-15 produits) → ~1.5h
- **Batch 4** : Décoration et accessoires (10-15 produits) → ~1.5h

**Durée totale estimée** : 4-6h (répartie sur plusieurs sessions)
**Branche Git** : `feature/phase1-complete-catalog`

---

## 🧪 Phase Pilote : 5 Produits Test

### Étape 1 : Préparation Git

```bash
# 1. S'assurer main est à jour
git checkout main
git pull origin main

# 2. Créer branche feature test
git checkout -b feature/phase1-data-test

# 3. Vérifier serveur local tourne
# (doit afficher: Local: http://localhost:3000)
```

### Étape 2 : Template Données Test

**Créer fichier de référence** : `docs/data/produits-test-pilote.md`

```markdown
# Produits Test Pilote - Phase 1

## 1. Canapé Modèle A

**Informations générales :**

- Nom : Canapé Modèle A
- SKU : CAN-MOD-A-001
- Catégorie : Mobilier > Canapés
- Subcatégorie : Canapés 3 places
- Prix : 1890€
- Status : Actif
- Publié : Oui

**Description :**
Canapé 3 places en tissu premium, design contemporain. Assise profonde et confortable avec coussins déhoussables. Structure bois massif garantie 10 ans.

**Caractéristiques :**

- Dimensions : L220 x P95 x H85 cm
- Matière assise : Tissu premium anti-taches
- Structure : Bois massif + ressorts ensachés
- Couleurs disponibles : Gris clair, Bleu marine, Beige
- Poids : 65 kg
- Nombre de places : 3

**Variantes :**

1. Gris clair (SKU: CAN-MOD-A-001-GC, +0€)
2. Bleu marine (SKU: CAN-MOD-A-001-BM, +150€)
3. Beige (SKU: CAN-MOD-A-001-BG, +0€)

**Images :**

- Image principale : [URL ou chemin]
- Galerie : [URLs supplémentaires]

**SEO :**

- Meta title : Canapé Modèle A - 3 Places Design Contemporain | Vérone
- Meta description : Découvrez notre canapé 3 places au design contemporain. Tissu premium, structure bois massif. Livraison gratuite. Garantie 10 ans.

---

## 2. Table Bois Massif

**Informations générales :**

- Nom : Table Bois Massif Rectangulaire
- SKU : TAB-BM-RECT-001
- Catégorie : Mobilier > Tables
- Subcatégorie : Tables à manger
- Prix : 890€
- Status : Actif
- Publié : Oui

**Description :**
Table à manger rectangulaire en chêne massif. Finition huilée naturelle. Design intemporel alliant robustesse et élégance.

**Caractéristiques :**

- Matière : Chêne massif européen
- Finition : Huilée naturelle
- Épaisseur plateau : 4 cm
- Pieds : Acier noir mat
- Poids : 45 kg (160 cm) / 55 kg (180 cm)

**Variantes :**

1. 160x90 cm (SKU: TAB-BM-RECT-001-160, Prix: 890€)
2. 180x90 cm (SKU: TAB-BM-RECT-001-180, Prix: 1090€)

---

## 3. Chaise Design Simple

**Informations générales :**

- Nom : Chaise Design Minimaliste
- SKU : CHA-DES-MIN-001
- Catégorie : Mobilier > Chaises
- Prix : 189€
- Status : Actif
- Publié : Oui

**Description :**
Chaise au design épuré et minimaliste. Structure métal noir mat, assise bois naturel. Empilable pour gain de place.

**Caractéristiques :**

- Dimensions : L45 x P50 x H80 cm (assise H45 cm)
- Matière assise : Bois hêtre massif
- Structure : Métal noir mat
- Poids : 4,5 kg
- Empilable : Oui (jusqu'à 6 chaises)

**Pas de variantes**

---

## 4. Luminaire LED Premium

**Informations générales :**

- Nom : Suspension LED Premium Ø50
- SKU : LUM-SUS-LED-050
- Catégorie : Éclairage > Suspensions
- Prix : 390€
- Status : Actif
- Publié : Oui

**Description :**
Suspension LED design avec diffuseur en verre opalin. Intensité variable via télécommande. Idéale pour salle à manger ou salon.

**Caractéristiques techniques :**

- Diamètre : 50 cm
- Hauteur : 30 cm
- Puissance : 40W LED intégrée
- Flux lumineux : 3200 lumens
- Température couleur : 2700K-5000K (réglable)
- Durée de vie LED : 25 000h
- Variateur inclus : Oui (télécommande)
- Câble : 150 cm ajustable
- Poids : 2,8 kg

---

## 5. Tapis Berbère 200x300

**Informations générales :**

- Nom : Tapis Berbère Fait Main 200x300
- SKU : TAP-BER-FM-200300
- Catégorie : Décoration > Tapis
- Collection : Heritage Berbère
- Prix : 690€
- Status : Actif
- Publié : Oui

**Description :**
Tapis berbère traditionnel tissé à la main au Maroc. Laine 100% naturelle, motifs géométriques authentiques. Chaque pièce est unique.

**Caractéristiques :**

- Dimensions : 200 x 300 cm
- Matière : Laine 100% naturelle
- Fabrication : Tissage main artisanal
- Origine : Maroc (région du Moyen Atlas)
- Épaisseur : 12 mm
- Poids : 10 kg
- Entretien : Nettoyage à sec recommandé

**Collection :**

- Nom : Heritage Berbère
- Description : Collection de tapis berbères authentiques tissés à la main
```

### Étape 3 : Insertion Produit 1 - Canapé (Avec Claude)

**Commande initiale à Claude** :

```
Je vais t'insérer le premier produit test pilote via MCP Playwright Browser.
Voici les données du Canapé Modèle A :

[Copier-coller données depuis template ci-dessus]

Process à suivre :
1. Naviguer vers http://localhost:3000/catalogue/create
2. Remplir le formulaire champ par champ
3. Ajouter les 3 variantes couleurs
4. Vérifier console errors (0 tolérance)
5. Prendre screenshot validation
6. Sauvegarder produit

Commence !
```

**Claude utilisera automatiquement** :

```typescript
// Navigation
mcp__playwright__browser_navigate(url: "http://localhost:3000/catalogue/create")

// Remplissage formulaire
mcp__playwright__browser_type(element: "Nom produit", ref: "...", text: "Canapé Modèle A")
mcp__playwright__browser_type(element: "SKU", ref: "...", text: "CAN-MOD-A-001")
mcp__playwright__browser_type(element: "Prix", ref: "...", text: "1890")
// ... etc.

// Validation console
mcp__playwright__browser_console_messages()

// Screenshot proof
mcp__playwright__browser_take_screenshot(filename: "produit-1-canape-validation.png")
```

### Étape 4 : Validation & Commit

**Après insertion réussie de chaque produit** :

```bash
# 1. Vérifier aucune erreur console
# (Claude le fait automatiquement)

# 2. Commit immédiatement
git add -A
git commit -m "📦 DATA TEST 1/5: Canapé Modèle A + 3 variantes

Produit :
- Nom : Canapé Modèle A
- SKU : CAN-MOD-A-001
- Prix : 1890€
- Variantes : Gris clair, Bleu marine (+150€), Beige
- Catégorie : Mobilier > Canapés

Validation :
- Console errors : 0 ✅
- Screenshot : .playwright-mcp/produit-1-canape-validation.png
- Supabase insert OK ✅"

# 3. Push régulier (pas obligé d'attendre 5 produits)
git push origin feature/phase1-data-test
```

### Étape 5 : Répéter pour Produits 2-5

**Commandes similaires à Claude** pour chaque produit :

```
Produit 2/5 : Table Bois Massif

[Données table...]

Même process : navigate → fill → validate → screenshot
```

**Commits intermédiaires** après chaque produit :

- `📦 DATA TEST 2/5: Table Bois Massif + 2 dimensions`
- `📦 DATA TEST 3/5: Chaise Design Minimaliste`
- `📦 DATA TEST 4/5: Suspension LED Premium`
- `📦 DATA TEST 5/5: Tapis Berbère + Collection Heritage`

### Étape 6 : Validation Pilote Complète

```bash
# 1. Tester recherche
# Claude : navigate http://localhost:3000/catalogue + search "canapé"

# 2. Tester filtres
# Claude : test filters categories

# 3. Tester page détail
# Claude : click produit → verify details display

# 4. Console check global
# Claude : browser_console_messages → 0 errors

# 5. Screenshots validation finale
# Claude : screenshots dashboard + catalogue list

# 6. Commit final
git add -A
git commit -m "✅ VALIDATION TEST PILOTE: 5 produits insérés et validés

Produits test :
1. Canapé Modèle A (3 variantes) ✅
2. Table Bois Massif (2 dimensions) ✅
3. Chaise Design Minimaliste ✅
4. Suspension LED Premium ✅
5. Tapis Berbère + Collection ✅

Tests validation :
- [x] Console errors : 0
- [x] Recherche fonctionnelle
- [x] Filtres catégories OK
- [x] Pages détail affichage complet
- [x] Dashboard métriques à jour (5 produits)
- [x] Screenshots validation : 8 captures

Prêt pour déploiement Preview Vercel"

git push origin feature/phase1-data-test
```

### Étape 7 : Déploiement Preview & Validation

```bash
# 1. Vercel crée automatiquement Preview deployment
# URL : verone-backoffice-git-feature-phase1-data-test.vercel.app

# 2. Tester sur URL Preview (pas local!)
# - Vérifier 5 produits affichés
# - Tester recherche
# - Vérifier connexion Supabase prod

# 3. Si OK → Merger vers main
# GitHub PR ou :
git checkout main
git merge feature/phase1-data-test
git push origin main

# 4. Production déployée automatiquement sous 2-3 minutes
```

---

## 📦 Phase Complète : Catalogue Complet

### Étape 1 : Organisation Données par Batch

**Créer fichiers structurés** :

```
docs/data/
├── batch-1-canapes-fauteuils.md      (12 produits)
├── batch-2-tables-chaises.md         (15 produits)
├── batch-3-luminaires.md             (13 produits)
└── batch-4-decoration-accessoires.md (10 produits)
```

**Format standardisé par produit** :

```markdown
## [Numéro]. [Nom Produit]

### Informations générales

- Nom :
- SKU :
- Catégorie :
- Prix :
- Status :
- Publié :

### Description

[Texte descriptif 2-3 paragraphes]

### Caractéristiques

- Dimensions :
- Matière :
- Couleur :
- Poids :

### Variantes (si applicable)

1. [Nom variante] (SKU: XXX, Prix: XXX)
2. [Nom variante] (SKU: XXX, Prix: XXX)

### Images

- Principale : [URL]
- Galerie : [URLs]

### SEO

- Meta title :
- Meta description :

---
```

### Étape 2 : Process Batch 1 - Canapés & Fauteuils

```bash
# 1. Nouvelle branche feature
git checkout main
git pull origin main
git checkout -b feature/phase1-complete-catalog

# 2. Insertion progressive avec Claude
# Commande :
```

**À Claude** :

```
BATCH 1/4 : Canapés et Fauteuils (12 produits)

Je vais te donner les 12 produits un par un.
Pour chaque produit :
1. MCP Browser navigation + insertion
2. Console check
3. Screenshot
4. Confirmation OK avant produit suivant

Produit 1/12 : Canapé d'Angle Panoramique
[Données...]

Commence avec celui-ci, puis attends ma confirmation pour le suivant.
```

**Commits intermédiaires** (tous les 3-4 produits) :

```bash
git add -A
git commit -m "📦 BATCH 1 Progress: 4/12 Canapés et fauteuils

Produits ajoutés :
- Canapé d'Angle Panoramique (4 variantes)
- Fauteuil Club Vintage (2 couleurs)
- Canapé 2 Places Compact (3 tissus)
- Méridienne Design (gauche/droite)

Stats : 12 variantes total
Console : 0 errors ✅"

git push origin feature/phase1-complete-catalog
```

**Commit final Batch 1** :

```bash
git commit -m "✅ BATCH 1/4 COMPLET: 12 Canapés et fauteuils

Collection Mobilier Salon :
- 8 Canapés (variantes tissus/cuirs/configurations)
- 4 Fauteuils (styles différents)

Stats : 42 variantes total, 2 collections créées
Validation : Console propre, screenshots OK"
```

### Étape 3 : Répéter Batchs 2-4

**Même process pour** :

- **Batch 2** : Tables et chaises (15 produits, ~2h)

  ```
  ✅ BATCH 2/4 COMPLET: 15 Tables et chaises
  ```

- **Batch 3** : Luminaires (13 produits, ~1.5h)

  ```
  ✅ BATCH 3/4 COMPLET: 13 Luminaires
  ```

- **Batch 4** : Décoration (10 produits, ~1.5h)
  ```
  ✅ BATCH 4/4 COMPLET: 10 Décoration et accessoires
  ```

### Étape 4 : Validation Finale Catalogue Complet

```bash
# 1. Commit récapitulatif final
git commit -m "🎉 CATALOGUE PHASE 1 COMPLET: 50 produits insérés

Récapitulatif par catégories :
- Canapés & Fauteuils : 12 produits (42 variantes)
- Tables & Chaises : 15 produits (28 variantes)
- Luminaires : 13 produits (15 variantes)
- Décoration : 10 produits (12 variantes)

Total : 50 produits, 97 variantes, 6 collections

Validation globale :
- [x] Console errors : 0
- [x] Dashboard KPIs : 50 produits actifs
- [x] Recherche testée : OK
- [x] Filtres catégories : OK
- [x] Collections affichées : 6/6
- [x] Screenshots validation : 15 captures
- [x] Performance < 3s chargement catalogue

Prêt pour merge production"

git push origin feature/phase1-complete-catalog
```

### Étape 5 : Merge Production

```bash
# Option 1 : GitHub PR (RECOMMANDÉ)
# 1. Créer PR sur GitHub
# 2. Review changements
# 3. Merge → Production déployée auto

# Option 2 : Ligne de commande
git checkout main
git merge feature/phase1-complete-catalog
git push origin main

# 3. Tag version
git tag v1.0.0-catalogue-complet
git push origin v1.0.0-catalogue-complet
```

---

## ✅ Validation et Troubleshooting

### Checklist Validation par Produit

**Avant passage au produit suivant** :

- [ ] Formulaire rempli complètement (tous champs requis)
- [ ] Variantes ajoutées si applicable
- [ ] Images uploadées (principale minimum)
- [ ] Console errors : 0 (vérification MCP Browser)
- [ ] Produit sauvegardé (message succès affiché)
- [ ] Screenshot pris comme preuve
- [ ] Produit visible dans liste `/catalogue`

### Problèmes Courants

#### Problème 1 : Erreur "SKU already exists"

**Solution** :

```
1. Vérifier SKU unique dans Supabase
2. Modifier SKU si doublon détecté
3. Convention : [CATÉGORIE]-[MODÈLE]-[VARIANT]-[NUMÉRO]
   Exemple : CAN-MOD-A-001-GC (Canapé Modèle A, variante Gris Clair)
```

#### Problème 2 : Upload Image Failed

**Solution** :

```
1. Vérifier taille image < 5MB
2. Format accepté : JPG, PNG, WEBP
3. Redimensionner si nécessaire
4. Retry upload
```

#### Problème 3 : Console Error "Failed to fetch"

**Solution** :

```
1. Vérifier serveur local tourne (npm run dev)
2. Vérifier Supabase connection (.env.local)
3. Check network tab browser
4. Retry après fix
```

#### Problème 4 : Variantes non enregistrées

**Solution** :

```
1. Vérifier bouton "Ajouter variante" cliqué
2. Remplir TOUS champs variante (SKU, prix, attributs)
3. Cliquer "Sauvegarder" variante avant "Sauvegarder produit"
4. Vérifier dans Supabase table `product_variants`
```

### Console Errors Acceptables

**Uniquement ces messages sont OK** :

```
[INFO] Download the React DevTools...
[LOG] [Fast Refresh] rebuilding
```

**Tous autres messages = STOP et fix** :

```
❌ [ERROR] Failed to...
❌ [WARN] Missing required...
❌ Uncaught TypeError...
```

### Performance Monitoring

**Objectifs temps par produit** :

- Produit simple (sans variantes) : **5-7 minutes**
- Produit avec 2-3 variantes : **8-12 minutes**
- Produit complexe (5+ variantes + collection) : **15-20 minutes**

**Si plus lent** :

1. Vérifier connexion internet
2. Vérifier performance Supabase (dashboard)
3. Redémarrer serveur local si nécessaire

---

## 📊 Suivi Progression

### Template Tracking Batch

**Créer fichier** : `docs/data/progress-tracking.md`

```markdown
# Tracking Insertion Catalogue - Phase 1

## Test Pilote

- [x] Canapé Modèle A (3 variantes)
- [x] Table Bois Massif (2 dimensions)
- [x] Chaise Design Minimaliste
- [x] Luminaire LED Premium
- [x] Tapis Berbère + Collection
      **Status** : ✅ COMPLET (2025-10-01)

## Batch 1 : Canapés & Fauteuils (12 produits)

- [x] Canapé d'Angle Panoramique
- [x] Fauteuil Club Vintage
- [ ] Canapé 2 Places Compact
- [ ] Méridienne Design
- [ ] ...
      **Progress** : 2/12 (17%)

## Batch 2 : Tables & Chaises (15 produits)

- [ ] Table Ronde Extensible
- [ ] ...
      **Progress** : 0/15 (0%)

## Stats Globales

- **Total produits** : 5/50 (10%)
- **Total variantes** : 12/97 (12%)
- **Temps passé** : 1h
- **Temps estimé restant** : 9h
- **Console errors** : 0 ✅
```

---

## 🎯 Tips & Best Practices

### Préparation Efficace

1. **Préparer données en amont** : Template complet avant insertion
2. **Images prêtes** : Redimensionnées, nommées clairement
3. **SKU cohérents** : Suivre convention stricte
4. **Sessions courtes** : Max 2h d'insertion continue → pause

### Workflow Optimal

```
Préparer 5 produits
  ↓
Insérer 5 produits (MCP Browser)
  ↓
Valider (console + screenshots)
  ↓
Commit Git
  ↓
Pause 15 min
  ↓
Répéter
```

### Commits Réguliers

**Commiter après** :

- ✅ Chaque produit si complexe (5+ variantes)
- ✅ Tous les 3-4 produits simples
- ✅ Fin de chaque batch
- ✅ Avant pause longue

**Ne jamais** :

- ❌ Insérer 20 produits sans commit
- ❌ Travailler plusieurs heures sans push
- ❌ Merger vers main sans validation complète

---

## 📚 Ressources

- **Guide Git/GitHub/Vercel** : [./git-github-vercel-guide.md](./git-github-vercel-guide.md)
- **CLAUDE.md** : Configuration MCP Browser révolutionnaire
- **Supabase Dashboard** : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl

---

**🎯 Prochaine étape** : [Checklist Déploiement Production](./production-deployment-checklist.md)

_Guide créé le 2025-10-01 - Vérone Back Office Phase 1_
