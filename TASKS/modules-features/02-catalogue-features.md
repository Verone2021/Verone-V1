# 📚 Catalogue - Inventaire Exhaustif des Tests Manuels

**Module** : Catalogue (Gestion produits et collections)
**Priorité** : CRITIQUE - Cœur métier mobilier haut de gamme
**Estimation** : ~150 tests manuels détaillés

---

## 🎯 **Vue d'ensemble du Module**

Le module Catalogue est le cœur métier de l'application Vérone. Il gère l'intégralité des produits, variantes, collections, catégories, et leurs relations complexes pour le secteur du mobilier haut de gamme.

### **Composants Principaux Identifiés**
- Grille produits avec filtres avancés
- Formulaire création/édition produits
- Gestion variantes (couleurs, matériaux, dimensions)
- Système de collections et catégories
- Import/Export en masse
- Génération feeds Google Merchant
- Partage catalogue client (PDF/Web)

---

## 🧪 **Tests Interface Utilisateur (UI)**

### **01. Navigation et Structure**
- [ ] **T060** - Menu principal "Catalogue" accessible depuis sidebar
- [ ] **T061** - Sous-menus : Produits, Collections, Catégories, Variantes
- [ ] **T062** - Breadcrumb navigation fonctionnel
- [ ] **T063** - Titre de page dynamique selon contexte
- [ ] **T064** - Pagination en bas de grille (25, 50, 100 produits/page)

### **02. Grille Produits Principale**
- [ ] **T065** - Affichage grille : miniatures, nom, prix, stock
- [ ] **T066** - Vue liste alternative : données tabulaires détaillées
- [ ] **T067** - Changement vue grille/liste : état persiste
- [ ] **T068** - Tri par : nom, prix, stock, date, popularité
- [ ] **T069** - Tri ascendant/descendant avec indicateurs visuels
- [ ] **T070** - Hover effects sur cards produits
- [ ] **T071** - Quick preview modal au hover (image + infos clés)
- [ ] **T072** - Sélection multiple avec checkboxes
- [ ] **T073** - Actions en lot : archiver, dupliquer, exporter

### **03. Système de Filtrage Avancé**
- [ ] **T074** - Filtre par catégorie : arborescence hiérarchique
- [ ] **T075** - Filtre par collection : sélection multiple
- [ ] **T076** - Filtre prix : slider range min/max
- [ ] **T077** - Filtre stock : en stock, rupture, critique (<10)
- [ ] **T078** - Filtre statut : actif, brouillon, archivé
- [ ] **T079** - Filtre matériaux : checkboxes multiples
- [ ] **T080** - Filtre couleurs : palette visuelle cliquable
- [ ] **T081** - Filtre dimensions : largeur, hauteur, profondeur
- [ ] **T082** - Recherche textuelle : nom, description, référence
- [ ] **T083** - Recherche tags/mots-clés
- [ ] **T084** - Sauvegarde filtres comme "Vues personnalisées"
- [ ] **T085** - Reset tous filtres avec bouton dédié
- [ ] **T086** - Compteur résultats : "X produits trouvés sur Y total"

### **04. Formulaire Produit - Informations Générales**
- [ ] **T087** - Champ nom : validation unicité + longueur
- [ ] **T088** - Slug automatique générée depuis nom
- [ ] **T089** - Description courte : éditeur simple avec compteur caractères
- [ ] **T090** - Description longue : éditeur riche (Bold, Italic, Listes)
- [ ] **T091** - Référence interne : format contrôlé + auto-increment
- [ ] **T092** - Code-barres / EAN13 : validation format
- [ ] **T093** - Statut : brouillon, actif, archivé (radio buttons)
- [ ] **T094** - Visibilité : publique, privée, sur devis (checkboxes)

### **05. Formulaire Produit - Tarification**
- [ ] **T095** - Prix de base : validation format monétaire
- [ ] **T096** - Prix promotionnel : optionnel avec dates début/fin
- [ ] **T097** - Marge calculée automatiquement (%)
- [ ] **T098** - Prix de revient : coût fournisseur + frais
- [ ] **T099** - TVA : sélecteur taux (5.5%, 10%, 20%)
- [ ] **T100** - Prix TTC calculé et affiché en temps réel
- [ ] **T101** - Devise : EUR par défaut, autres devises optionnelles
- [ ] **T102** - Grille de prix par quantité (tarifs dégressifs)

### **06. Gestion des Images**
- [ ] **T103** - Upload image principale : drag & drop + file picker
- [ ] **T104** - Galerie images secondaires : jusqu'à 10 images
- [ ] **T105** - Réorganisation images : drag & drop pour ordre
- [ ] **T106** - Crop/resize automatique : formats standards
- [ ] **T107** - Prévisualisation thumbnails en temps réel
- [ ] **T108** - Suppression image avec confirmation
- [ ] **T109** - Alt text pour accessibilité
- [ ] **T110** - Formats acceptés : JPG, PNG, WebP (max 5MB/image)
- [ ] **T111** - Compression automatique : optimisation web

### **07. Variantes et Déclinaisons**
- [ ] **T112** - Activation système variantes (toggle)
- [ ] **T113** - Attributs variables : couleur, matériau, dimension
- [ ] **T114** - Création variantes : matrice combinatoire
- [ ] **T115** - Prix spécifique par variante
- [ ] **T116** - Stock indépendant par variante
- [ ] **T117** - Images spécifiques par variante
- [ ] **T118** - SKU auto-générés par variante
- [ ] **T119** - Import variantes en masse (CSV/Excel)
- [ ] **T120** - Suppression variante avec vérification dépendances

### **08. Catégorisation et Organisation**
- [ ] **T121** - Arbre catégories : création hiérarchique illimitée
- [ ] **T122** - Drag & drop produits entre catégories
- [ ] **T123** - Assignment multiple catégories par produit
- [ ] **T124** - Catégorie principale + secondaires
- [ ] **T125** - Gestion collections : saisonnières, thématiques
- [ ] **T126** - Tags libres : autocomplete existants
- [ ] **T127** - Attributs métiers : style, époque, usage

### **09. Gestion Stock Intégrée**
- [ ] **T128** - Stock physique : saisie manuelle + mouvements
- [ ] **T129** - Stock réservé : commandes en cours
- [ ] **T130** - Stock disponible : calcul automatique
- [ ] **T131** - Seuil d'alerte : notification automatique
- [ ] **T132** - Historique mouvements : entrées/sorties avec dates
- [ ] **T133** - Inventaire tournant : planification et suivi
- [ ] **T134** - Ajustements stock : justification obligatoire

---

## ⚙️ **Tests Fonctionnels Avancés**

### **10. Import/Export en Masse**
- [ ] **T135** - Import CSV : mapping colonnes intelligent
- [ ] **T136** - Import Excel : gestion feuilles multiples
- [ ] **T137** - Validation données import : erreurs détaillées
- [ ] **T138** - Preview import : vérification avant commit
- [ ] **T139** - Export sélection : filtres appliqués
- [ ] **T140** - Export complet catalogue : pagination massive
- [ ] **T141** - Templates import : formats pré-définis
- [ ] **T142** - Import images : ZIP + mapping par nom fichier

### **11. Feeds et Intégrations**
- [ ] **T143** - Génération feed Google Merchant : XML conforme
- [ ] **T144** - Feed Facebook Catalog : format spécifique
- [ ] **T145** - Export Amazon : format Seller Central
- [ ] **T146** - API REST : endpoints CRUD complets
- [ ] **T147** - Webhooks : notifications changements
- [ ] **T148** - Synchronisation ERP externe : bidirectionnelle

### **12. Partage Catalogue Client**
- [ ] **T149** - Génération PDF catalogue : mise en page professionelle
- [ ] **T150** - Catalogue web publique : URL partageable
- [ ] **T151** - Sélection produits pour partage : panier temporaire
- [ ] **T152** - Personnalisation PDF : logo, couleurs, textes
- [ ] **T153** - Envoi email automatique : catalogue PDF joint
- [ ] **T154** - Statistiques consultation : tracking ouvertures

---

## 🔄 **Tests Performance Critiques**

### **13. Optimisation Chargement**
- [ ] **T155** - Grille 100 produits : chargement < 3 secondes
- [ ] **T156** - Scroll infini : pagination transparente
- [ ] **T157** - Images lazy loading : optimisation bande passante
- [ ] **T158** - Cache intelligent : mise à jour incrémentale
- [ ] **T159** - Recherche temps réel : debounce optimisé (300ms)

### **14. Gestion Mémoire**
- [ ] **T160** - Navigation 1000+ produits : pas de memory leaks
- [ ] **T161** - Upload images multiples : progression et abort
- [ ] **T162** - Export gros catalogue : streaming sans timeout

---

## 📱 **Tests Multi-Device et Responsive**

### **15. Adaptabilité Interface**
- [ ] **T163** - Mobile < 768px : grille 1 colonne, filtres en modal
- [ ] **T164** - Tablet 768-1024px : grille 2-3 colonnes adaptée
- [ ] **T165** - Desktop > 1024px : grille optimale + sidebar filtres
- [ ] **T166** - Formulaire produit mobile : étapes/accordéons
- [ ] **T167** - Upload images mobile : camera + galerie
- [ ] **T168** - Gestes tactiles : swipe, pinch-zoom sur images

---

## 🚨 **Tests Edge Cases et Robustesse**

### **16. Scénarios Limites**
- [ ] **T169** - Produit sans image : placeholder approprié
- [ ] **T170** - Prix zéro ou négatif : validation et messages
- [ ] **T171** - Description très longue : troncature et "lire plus"
- [ ] **T172** - Nom produit doublons : gestion suggestions
- [ ] **T173** - Suppression catégorie avec produits : migration
- [ ] **T174** - Upload image corrompue : gestion erreur
- [ ] **T175** - Import CSV lignes malformées : skip et rapport
- [ ] **T176** - Connexion perdue : sauvegarde brouillon local

### **17. Sécurité et Permissions**
- [ ] **T177** - Rôle "Visualiseur" : lecture seule stricte
- [ ] **T178** - Rôle "Éditeur" : CRUD sans suppression
- [ ] **T179** - Rôle "Admin" : tous droits y compris suppression
- [ ] **T180** - Validation côté serveur : bypass sécurité impossible
- [ ] **T181** - Upload files : types MIME validation stricte
- [ ] **T182** - SQL injection : protection paramètres recherche

---

## 🔍 **Tests Intégration Business**

### **18. Workflows Métier**
- [ ] **T183** - Création produit → notification équipe
- [ ] **T184** - Modification prix → validation manager
- [ ] **T185** - Rupture stock → alerte automatique
- [ ] **T186** - Nouveau produit → ajout automatique catalogue web
- [ ] **T187** - Archivage produit → retrait feeds externes
- [ ] **T188** - Import produits → mise à jour cross-références

### **19. Cohérence Données**
- [ ] **T189** - Modification catégorie → propagation sous-produits
- [ ] **T190** - Changement devise → recalcul tous les prix
- [ ] **T191** - Fusion variantes → consolidation stocks
- [ ] **T192** - Suppression fournisseur → update liens produits
- [ ] **T193** - Changement TVA → impact prix affichés

---

## 📋 **Checklist Validation Finale**

### **Critères de Succès Business**
✅ **Exhaustivité** : Tous cas d'usage métier couverts
✅ **Performance** : Catalogue 1000+ produits fluide
✅ **UX Professionnelle** : Interface digne secteur haut de gamme
✅ **Intégrité Données** : Aucune incohérence possible
✅ **Sécurité** : Permissions granulaires respectées
✅ **Robustesse** : Gestion erreur gracieuse toutes situations

### **KPIs de Performance**
- **Temps chargement grille** : < 3s (100 produits)
- **Recherche temps réel** : < 500ms (1000+ produits)
- **Upload image** : < 10s (5MB)
- **Export catalogue** : < 30s (500 produits)
- **Import CSV** : < 2min (1000 lignes)

---

## 🔗 **Intégrations Critiques Vérifiées**

### **Modules Dépendants**
- **Stocks** : Synchronisation temps réel quantités
- **Commandes** : Disponibilité et réservation
- **Sourcing** : Liens fournisseurs et coûts
- **Canaux** : Exports marketplaces
- **Interactions** : Historique consultations clients

### **APIs Externes**
- **Google Merchant Center** : Feed XML valide
- **Facebook Business** : Catalog API
- **Supabase Storage** : Images et documents
- **Stripe** : Synchronisation produits/prix

---

**Status** : ⏳ En attente de validation
**Complexité** : 🔴 TRÈS ÉLEVÉE - Module le plus critique
**Effort** : ~40 heures de tests exhaustifs
**Prochaine étape** : Tests manuels secteur par secteur