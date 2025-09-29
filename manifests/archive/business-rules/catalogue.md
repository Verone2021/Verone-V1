# Règles métier — Catalogue Véron

## Gestion des produits

### Statuts de disponibilité
- **en_stock** : Produit disponible immédiatement → `in stock` dans les feeds
- **sur_commande** : Produit disponible sous 2-8 semaines → `preorder` dans les feeds  
- **rupture** : Produit temporairement indisponible → `out of stock` dans les feeds
- **discontinue** : Produit arrêté, non visible dans les catalogues publics

### Variantes et groupes de produits
- Les variantes (couleur, taille, finition) sont groupées par `product_group_id`
- Chaque groupe correspond à un `item_group_id` dans les feeds Meta/Google
- Une variante = un produit avec sa propre référence et stock
- L'image principale du groupe est utilisée si pas d'image spécifique à la variante

### Quantités minimales de commande (MOQ)
- Chaque produit a une MOQ définie (par défaut : 1)
- Certains produits peuvent être vendus par multiples : 3, 6, 12 unités
- Les unités de vente sont stockées en JSON : `[1, 3, 6, 12]`
- La commande doit respecter ces multiples

## Tarification

### Structure des prix
- **Prix d'achat HT** : Coût fournisseur (interne uniquement)
- **Prix de vente HT** : Base pour calculs (interne)
- **Prix particulier TTC** : Affiché aux clients particuliers
- **Prix professionnel HT** : Affiché aux clients B2B
- **TVA** : 20% par défaut, modulable par produit

### Tarifs dégressifs (clients professionnels)
- Paliers de quantité avec prix unitaire dégressif
- Exemple : 1-9 unités → 100€, 10-49 unités → 90€, 50+ unités → 80€
- Application automatique du meilleur tarif selon la quantité commandée

### Affichage des prix
- **Catalogues particuliers** : Prix TTC uniquement
- **Catalogues professionnels** : Prix HT + mention "HT"
- **Interface LinkMe** : Règles spécifiques d'affiliation (commission)

## Catégorisation

### Hiérarchie à 3 niveaux
1. **Famille** : Mobilier, Décoration, Éclairage, Textile
2. **Catégorie** : Canapés, Tables, Luminaires, Rideaux
3. **Sous-catégorie** : Canapés d'angle, Tables basses, Suspensions, Voilages

### Règles de navigation
- Un produit appartient obligatoirement à une sous-catégorie
- La navigation remonte automatiquement la hiérarchie
- Les compteurs de produits incluent les sous-catégories

## Visibilité et accès

### Règles de visibilité par interface
- **Back-office** : Tous les produits (y compris discontinués)
- **Particuliers** : Produits actifs avec `visible_particuliers = true`
- **Professionnels** : Produits actifs avec `visible_professionnels = true`
- **LinkMe** : Produits actifs avec `visible_affilies = true`

### Collections et partage
- Les collections peuvent être publiques ou privées
- Les liens partagés ont une durée de vie configurable (par défaut : 30 jours)
- Protection optionnelle par mot de passe
- Tracking des consultations (IP, user-agent, timestamp)

## Gestion des stocks

### Seuils et alertes
- **Stock minimum** : Seuil d'alerte pour réapprovisionnement
- **Stock de sécurité** : Quantité à maintenir en permanence
- **Rupture** : Passage automatique en statut "rupture" si stock = 0

### Réservations
- Les produits en panier sont "soft-réservés" pendant 30 minutes
- Les devis confirment une réservation ferme jusqu'à expiration
- Les commandes décrementent définitivement le stock

## Intégrations externes

### Feeds e-commerce (Meta/Google)
- Export quotidien automatique à 06h00
- Filtrage : produits actifs, visibles, avec image principale
- Mapping des statuts : voir règles de disponibilité ci-dessus
- URL produit : `https://verone.com/produits/{product_id}`

### Brevo (Marketing)
- Synchronisation des événements : ouvertures, clics, désabonnements
- Segmentation automatique selon l'engagement
- Déclenchement de campagnes selon les consultations de catalogues

## Validation et contrôles

### Contrôles obligatoires
- Nom du produit : 5-200 caractères
- Prix de vente > Prix d'achat (alerte si non respecté)
- Au moins une image par produit
- Référence interne unique
- Catégorisation complète (jusqu'à sous-catégorie)

### Contrôles de cohérence
- Vérification des liens fournisseurs
- Validation des formats d'images (JPG, PNG, WebP)
- Contrôle des doublons de références
- Vérification de la cohérence des variantes dans un groupe

## Workflow d'approbation

### Nouveaux produits
1. Création en mode "brouillon"
2. Validation par le responsable catalogue
3. Activation et mise en ligne
4. Notification à l'équipe commerciale

### Modifications importantes
- Changement de prix > 10% : validation requise
- Changement de statut : notification automatique
- Suppression de produit : archivage (pas de suppression physique)

Ces règles métier garantissent la cohérence et la qualité du catalogue Véron tout en respectant les contraintes techniques et commerciales de chaque interface.

