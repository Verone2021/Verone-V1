# 📋 DOCUMENTATION COMPLÈTE - TESTS MANUELS VÉRONE BACK OFFICE

**Version**: Janvier 2025
**Application**: Vérone Back Office - CRM/ERP Modulaire
**Objectif**: Tests manuels exhaustifs de toutes les fonctionnalités existantes

---

## 🚨 RÈGLES ABSOLUES DE TEST

### ⚠️ CONSOLE ERROR CHECKING - RÈGLE CRITIQUE

**JAMAIS déclarer le succès du système tant qu'il y a des erreurs console visibles**

#### Processus Obligatoire :
1. **□** À chaque test, regarder en bas à gauche de l'écran
2. **□** Si indicateur rouge présent (ex: "4 errors", "3 errors"), CLIQUER DESSUS
3. **□** Naviguer avec boutons "Next"/"Previous" pour voir TOUTES les erreurs
4. **□** Résoudre TOUTES les erreurs avant validation
5. **□** Re-tester jusqu'à ZÉRO erreur console
6. **□** SEULEMENT ALORS déclarer que la fonctionnalité marche

### Outils de Debug :
- **□** Console Browser : Vérifier erreurs JavaScript
- **□** Network : Vérifier échecs API (statut 4xx/5xx)
- **□** Supabase Logs : Vérifier erreurs base de données

---

## 🏠 1. DASHBOARD PRINCIPAL

**URL**: `/dashboard`

### Fonctionnalités à Tester :

#### Header et Navigation :
- **□** Logo "VÉRONE" cliquable (retour dashboard)
- **□** Titre "Dashboard" affiché
- **□** Description "Vue d'ensemble de votre activité Vérone"

#### Indicateurs de Performance :
- **□** Indicateur de performance (temps de chargement en ms)
- **□** Dernière mise à jour affichée avec timestamp
- **□** Bouton "Rafraîchir" avec icône RefreshCw
- **□** Animation de rotation pendant chargement

#### KPIs Cards (4 cartes principales) :
- **□** **Commandes en cours** : Valeur numérique + trend (+/-)
- **□** **Produits en stock** : Total formaté + trend
- **□** **Clients actifs** : Nombre + trend
- **□** **Activité du jour** : Nombre d'actions + trend

#### Sections d'Activité :
- **□** **Commandes récentes** : Liste des 4 dernières avec ID, client, montant, statut
- **□** **Alertes stock** : Produits en rupture/critique avec badges de statut
- **□** États vides gérés ("Aucune commande récente", "Aucune alerte de stock")

#### États de Chargement et Erreurs :
- **□** Skeletons animés pendant chargement
- **□** Message d'erreur avec icône AlertTriangle si échec
- **□** Gestion de l'état loading pour tous les composants

---

## 📚 2. CATALOGUE

### 2.1 Dashboard Catalogue
**URL**: `/catalogue/dashboard`

**Fonctionnalités à tester :**
- **□** Vue d'ensemble et KPIs catalogue
- **□** Statistiques produits par catégorie
- **□** Métriques de performance

### 2.2 Catalogue Principal - Produits
**URL**: `/catalogue`

#### Header et Actions :
- **□** Titre "Catalogue Produits" avec compteur dynamique
- **□** Bouton "Sourcing Rapide" (icône Zap) → `/catalogue/sourcing`
- **□** Bouton "Nouveau Produit" (icône Plus) → `/catalogue/create`
- **□** Indicateur SLO performance (Badge vert <2s / rouge >2s)

#### Recherche et Navigation :
- **□** Champ recherche avec placeholder "Rechercher par nom, SKU, marque..."
- **□** Icône Search dans le champ
- **□** Recherche debouncée (attendre 300ms)
- **□** Toggle vue Grid/List avec boutons visuels

#### Filtres Dynamiques :
- **□** **Filtres par Statut** (badges cliquables):
  - **□** ✓ En stock (in_stock)
  - **□** ✕ Rupture (out_of_stock)
  - **□** 📅 Précommande (preorder)
  - **□** ⏳ Bientôt (coming_soon)
  - **□** ⚠ Arrêté (discontinued)

- **□** **Filtres par Catégories** : Badges dynamiques selon catégories existantes
- **□** Filtres actifs visible par changement de couleur (default vs outline)

#### Affichage Résultats :
- **□** Compteur résultats dynamique "X produit(s) trouvé(s)"
- **□** Affichage recherche active "Recherche: 'terme'"
- **□** **Vue Grid** : Cartes produits 4 colonnes sur desktop
- **□** **Vue List** : Lignes avec image miniature + infos détaillées

#### ProductCard (Vue Grid) - Fonctionnalités :
- **□** Image produit ou placeholder avec icône Package
- **□** Nom du produit cliquable
- **□** SKU affiché
- **□** Prix HT avec formatage "X.XX € HT"
- **□** Badge statut avec couleurs appropriées
- **□** Badge "nouveau" pour produits <30 jours
- **□** Actions disponibles : Voir/Éditer/Archiver/Supprimer

#### Actions Produits :
- **□** **Voir Produit** → `/catalogue/[productId]`
- **□** **Archiver Produit** : Confirmation et feedback utilisateur
- **□** **Désarchiver Produit** : Si produit archivé
- **□** **Supprimer Produit** : Confirmation critique "irréversible"

#### États Particuliers :
- **□** Chargement : Message "Chargement du catalogue..."
- **□** Erreur : Affichage erreur en rouge
- **□** État vide : "Aucun produit trouvé" + suggestions

### 2.3 Détail Produit
**URL**: `/catalogue/[productId]`

**Fonctionnalités à tester :**
- **□** Affichage complet des informations produit
- **□** Galerie d'images avec navigation
- **□** Informations techniques et commerciales
- **□** Section variantes produit
- **□** Historique des modifications
- **□** Actions d'édition et gestion

### 2.4 Catégories
**URL**: `/catalogue/categories`

**Fonctionnalités à tester :**
- **□** Liste des catégories avec arborescence
- **□** Création nouvelle catégorie
- **□** Modification catégories existantes
- **□** Organisation hiérarchique

### 2.5 Collections
**URL**: `/catalogue/collections`

**Fonctionnalités à tester :**
- **□** Gestion des collections thématiques
- **□** Association produits aux collections
- **□** Création/édition/suppression collections

### 2.6 Variantes
**URL**: `/catalogue/variantes`

**Fonctionnalités à tester :**
- **□** Gestion des variantes (couleurs, tailles, matériaux)
- **□** Groupes de variantes
- **□** Association produits-variantes

### 2.7 Création Produit
**URL**: `/catalogue/create`

**Fonctionnalités à tester :**
- **□** Wizard de création unifiée
- **□** Formulaire multi-étapes
- **□** Upload d'images
- **□** Validation des données
- **□** Sauvegarde brouillon
- **□** Publication finale

---

## 📦 3. STOCKS

### 3.1 Dashboard Stocks
**URL**: `/stocks`

#### Header et Navigation :
- **□** Titre "Dashboard Stocks"
- **□** Description "Vue d'ensemble de l'inventaire et des mouvements Vérone"
- **□** Bouton "Voir Mouvements" → `/stocks/mouvements`
- **□** Bouton "Nouvelle Entrée" → `/stocks/entrees`

#### KPIs Cards (4 cartes) :
- **□** **Total Produits** : Nombre + "unités en stock"
- **□** **Stock Moyen** : Calcul unités par produit
- **□** **Alertes Stock** : Nombre produits en rupture/seuil
- **□** **Mouvements Récents** : Activité "cette semaine"

#### Actions Rapides (4 boutons) :
- **□** **Inventaire** → `/stocks/inventaire`
- **□** **Entrées** → `/stocks/entrees`
- **□** **Sorties** → `/stocks/sorties`
- **□** **Alertes** → `/stocks/alertes`

#### Graphiques et Activité :
- **□** **Mouvements Cette Semaine** : Entrées vs Sorties avec badges trend
- **□** **Alertes & Notifications** : Stock bas, mouvements à valider, inventaires
- **□** Bouton "Voir les alertes" si alertes > 0

#### Navigation Inter-Modules :
- **□** **Catalogue Produits** → `/catalogue`
- **□** **Commandes Fournisseurs** → `/commandes/fournisseurs`
- **□** **Commandes Clients** → `/commandes/clients`

### 3.2 Inventaire
**URL**: `/stocks/inventaire`

**Fonctionnalités à tester :**
- **□** Vue liste complète des stocks
- **□** Filtres par produit, catégorie, statut
- **□** Modification quantités en stock
- **□** Historique des ajustements
- **□** Export des données inventaire

### 3.3 Mouvements
**URL**: `/stocks/mouvements`

**Fonctionnalités à tester :**
- **□** Historique unifié des mouvements
- **□** Filtres par date, type, produit
- **□** Détail de chaque mouvement
- **□** Export historique

### 3.4 Entrées
**URL**: `/stocks/entrees`

**Fonctionnalités à tester :**
- **□** Enregistrement nouvelles réceptions
- **□** Association commandes fournisseurs
- **□** Validation quantités reçues
- **□** Historique entrées

### 3.5 Sorties
**URL**: `/stocks/sorties`

**Fonctionnalités à tester :**
- **□** Enregistrement expéditions
- **□** Association commandes clients
- **□** Validation quantités expédiées
- **□** Historique sorties

### 3.6 Alertes
**URL**: `/stocks/alertes`

**Fonctionnalités à tester :**
- **□** Produits en rupture de stock
- **□** Produits sous seuil critique
- **□** Configuration seuils d'alerte
- **□** Actions de réapprovisionnement

---

## 🎯 4. SOURCING

### 4.1 Dashboard Sourcing
**URL**: `/sourcing`

**Fonctionnalités à tester :**
- **□** Vue d'ensemble sourcing
- **□** KPIs produits à sourcer
- **□** Statut échantillons en cours
- **□** Pipeline validation

### 4.2 Produits à Sourcer
**URL**: `/sourcing/produits`

**Fonctionnalités à tester :**
- **□** Liste produits internes et clients à sourcer
- **□** Recherche et filtres
- **□** Priorisation des demandes
- **□** Association fournisseurs

### 4.3 Échantillons
**URL**: `/sourcing/echantillons`

**Fonctionnalités à tester :**
- **□** Commandes d'échantillons
- **□** Suivi livraisons
- **□** Validation qualité
- **□** Photos et notes

### 4.4 Validation
**URL**: `/sourcing/validation`

**Fonctionnalités à tester :**
- **□** Validation échantillons
- **□** Passage au catalogue
- **□** Workflow d'approbation
- **□** Historique validations

---

## 💬 5. INTERACTIONS CLIENTS

### 5.1 Dashboard Interactions
**URL**: `/interactions/dashboard`

**Fonctionnalités à tester :**
- **□** Vue d'ensemble interactions clients
- **□** KPIs consultations et commandes
- **□** Activité récente

### 5.2 Consultations
**URL**: `/consultations`

#### Header et Actions :
- **□** Titre "Consultations Clients"
- **□** Bouton "Retour" avec navigation arrière
- **□** Bouton "Nouvelle consultation" → `/consultations/create`

#### Statistiques Rapides (4 cards) :
- **□** **Total consultations** avec icône Users
- **□** **En attente** avec icône Clock
- **□** **En cours** avec icône AlertCircle
- **□** **Terminées** avec icône CheckCircle

#### Filtres et Recherche :
- **□** **Recherche** : Organisation, email, description
- **□** **Filtre Statut** : Tous, En attente, En cours, Terminée, Annulée
- **□** **Filtre Priorité** : Toutes, 1-5 (Très urgent à Très faible)
- **□** Bouton "Réinitialiser" filtres

#### Liste Consultations :
- **□** Nom organisation avec badges statut et priorité
- **□** Description tronquée (line-clamp-2)
- **□** Email client avec icône Mail
- **□** Date création avec icône Calendar
- **□** Budget maximum si renseigné
- **□** Bouton "Voir détails" → `/consultations/[consultationId]`

#### États et Badges :
- **□** Badges colorés selon statut (jaune/bleu/vert/gris)
- **□** Badges priorité (rouge urgent, bleu normal, gris faible)
- **□** Icônes appropriées pour chaque statut

### 5.3 Détail Consultation
**URL**: `/consultations/[consultationId]`

**Fonctionnalités à tester :**
- **□** Informations complètes consultation
- **□** Galerie d'images associées
- **□** Association produits catalogue
- **□** Historique interactions
- **□** Génération devis/proposition

### 5.4 Commandes Clients
**URL**: `/commandes/clients`

**Fonctionnalités à tester :**
- **□** Liste commandes clients
- **□** Statuts et suivi
- **□** Détail commandes
- **□** Facturation et livraison

---

## 🚛 6. COMMANDES FOURNISSEURS

**URL**: `/commandes/fournisseurs`

**Fonctionnalités à tester :**
- **□** Liste commandes fournisseurs
- **□** Création nouvelle commande
- **□** Suivi livraisons
- **□** Réception marchandises
- **□** Gestion des litiges

---

## 🛍️ 7. CANAUX DE VENTE

**URL**: `/canaux-vente`

#### Header et Vue d'ensemble :
- **□** Titre "Canaux de Vente"
- **□** Description "Gérez vos différents canaux de distribution et marketplaces"

#### Statistiques Globales (5 KPIs) :
- **□** **Canaux Total** : Nombre total configured
- **□** **Canaux Actifs** : Nombre avec statut 'active'
- **□** **Produits Synchronisés** : Total across all channels
- **□** **Revenus ce Mois** : Somme formatée en euros
- **□** **Commandes ce Mois** : Total commandes

#### Configuration Canaux (4 canaux) :
- **□** **Google Merchant Center** :
  - **□** Statut : Actif/Inactif/Configuration requise
  - **□** Produits synchronisés avec nombre
  - **□** Dernière synchro avec timestamp relatif
  - **□** Statut synchro avec icônes (success/error/pending)
  - **□** Revenus et commandes du mois
  - **□** Bouton configuration/gestion

- **□** **Instagram Shopping** :
  - **□** Badge "Configuration requise"
  - **□** Statut setup_required
  - **□** Accès configuration

- **□** **Facebook Marketplace** :
  - **□** Statut inactif
  - **□** Options d'activation

- **□** **Boutique en ligne** :
  - **□** Statut actif avec métriques complètes
  - **□** Sync status et performance

#### Actions par Canal :
- **□** Badges de statut colorés (vert/orange/gris)
- **□** Icônes de sync status (CheckCircle/AlertCircle/Clock)
- **□** Formatage dates relatives ("Il y a X heures")
- **□** Formatage monétaire français (€)
- **□** Navigation vers détail de chaque canal

### 7.1 Google Merchant Center
**URL**: `/canaux-vente/google-merchant`

**Fonctionnalités à tester :**
- **□** Configuration API Google
- **□** Synchronisation catalogue
- **□** Export produits format Google
- **□** Gestion des erreurs sync
- **□** Métriques performance

---

## 🏢 8. CONTACTS & ORGANISATIONS

### 8.1 Dashboard Organisations
**URL**: `/contacts-organisations`

**Fonctionnalités à tester :**
- **□** Vue d'ensemble fournisseurs et structures
- **□** KPIs contacts et organisations
- **□** Recherche unifiée

### 8.2 Clients Particuliers
**URL**: `/contacts-organisations/customers?type=individual`

**Fonctionnalités à tester :**
- **□** Liste clients B2C
- **□** Fiches client détaillées
- **□** Historique commandes
- **□** Informations de contact

---

## ⚙️ 9. PARAMÈTRES

**URL**: `/parametres`

**Fonctionnalités à tester :**
- **□** Configuration générale système
- **□** Paramètres utilisateurs
- **□** Intégrations externes
- **□** Sauvegardes et maintenance

---

## 👤 10. PAGES SUPPLÉMENTAIRES (NON SIDEBAR)

### 10.1 Profile Utilisateur
**URL**: `/profile`

#### Interface Utilisateur :
- **□** Informations utilisateur actuelles
- **□** Mode édition avec bouton Edit
- **□** Champs éditables : email, nom, prénom, téléphone, poste
- **□** Badge de rôle (RoleBadge) avec permissions
- **□** Bouton "Changer mot de passe"

#### Fonctionnalités Édition :
- **□** Basculement mode édition/lecture
- **□** Validation des champs en temps réel
- **□** Sauvegarde avec feedback utilisateur
- **□** Annulation modifications
- **□** Messages d'erreur de validation

#### Dialog Changement Mot de Passe :
- **□** Modal de changement sécurisé
- **□** Validation force du mot de passe
- **□** Confirmation avant changement

### 10.2 Page de Connexion
**URL**: `/login`

**Fonctionnalités à tester :**
- **□** Formulaire d'authentification
- **□** Validation des credentials
- **□** Redirection après connexion
- **□** Gestion erreurs auth

### 10.3 Admin - Gestion Utilisateurs
**URL**: `/admin/users`

**Fonctionnalités à tester :**
- **□** Liste tous les utilisateurs
- **□** Gestion des rôles et permissions
- **□** Activation/désactivation comptes
- **□** Statistiques utilisateurs

---

## 🔄 WORKFLOWS TRANSVERSAUX

### Workflow 1 : Création Produit Complet
1. **□** `/catalogue/create` → Créer nouveau produit
2. **□** Upload images et informations complètes
3. **□** `/stocks/entrees` → Enregistrer stock initial
4. **□** `/canaux-vente/google-merchant` → Synchroniser
5. **□** `/catalogue` → Vérifier publication

### Workflow 2 : Gestion Consultation → Commande
1. **□** `/consultations` → Nouvelle consultation
2. **□** `/consultations/[id]` → Associer produits catalogue
3. **□** Génération devis/proposition
4. **□** `/commandes/clients` → Conversion en commande
5. **□** `/stocks/sorties` → Expédition

### Workflow 3 : Réapprovisionnement
1. **□** `/stocks/alertes` → Identifier produits en rupture
2. **□** `/commandes/fournisseurs` → Passer commande
3. **□** `/stocks/entrees` → Réception marchandises
4. **□** `/stocks` → Vérifier niveaux restaurés

### Workflow 4 : Sourcing → Catalogue
1. **□** `/sourcing/produits` → Identifier besoins
2. **□** `/sourcing/echantillons` → Commander échantillons
3. **□** `/sourcing/validation` → Valider qualité
4. **□** `/catalogue/create` → Créer produit final

---

## 🎯 CAS D'USAGE QUOTIDIENS

### Démarrage Journée :
- **□** `/dashboard` → Vue d'ensemble activité
- **□** Vérifier alertes stock et commandes urgentes
- **□** `/consultations` → Traiter demandes en attente
- **□** `/stocks/mouvements` → Valider activité stock

### Gestion Catalogue :
- **□** `/catalogue` → Mise à jour informations produits
- **□** Traitement nouvelles images
- **□** Synchronisation canaux de vente
- **□** Gestion variantes et collections

### Traitement Commandes :
- **□** `/commandes/clients` → Suivi expéditions
- **□** `/consultations` → Réponses devis
- **□** `/stocks/sorties` → Préparation commandes
- **□** Mise à jour statuts clients

### Approvisionnement :
- **□** `/stocks/alertes` → Monitoring ruptures
- **□** `/commandes/fournisseurs` → Suivi livraisons
- **□** `/sourcing` → Développement gamme
- **□** Réception et contrôle qualité

---

## ✅ VALIDATION FINALE

### Checklist Performance :
- **□** Dashboard <2s (indicateur SLO vert)
- **□** Recherche catalogue <1s
- **□** Navigation fluide sans blocage
- **□** Synchronisation canaux <10s

### Checklist Fonctionnelle :
- **□** Toutes les fonctionnalités testées et validées
- **□** Workflows complets opérationnels
- **□** Gestion d'erreurs appropriée
- **□** États de chargement corrects

### Checklist Console :
- **□** ZÉRO erreur JavaScript console
- **□** ZÉRO erreur réseau critique
- **□** Tous les warnings résolus
- **□** Performance optimale confirmée

---

**RÈGLE D'OR** : Ne jamais valider une fonctionnalité tant que des erreurs sont visibles dans la console. Toujours cliquer sur l'indicateur rouge d'erreur et résoudre TOUTES les erreurs avant de déclarer le succès.

---

*Vérone Back Office - Tests Manuels Exhaustifs - Version Janvier 2025*