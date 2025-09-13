# Règles métier - Gestion des variantes et conditionnements

## Vue d'ensemble

Ce document définit les règles métier spécifiques à la gestion des variantes et conditionnements pour le catalogue Véron, basées sur l'analyse du fichier CSV fourni et les meilleures pratiques identifiées.

## Règles de création des variantes

### R001 - Critères de variation autorisés

**Règle :** Seuls les attributs suivants peuvent justifier la création d'une variante :
- Couleur (obligatoire pour tous les produits)
- Matière (obligatoire pour tous les produits)
- Taille/Dimensions (optionnel selon la famille)
- Finition (optionnel selon la famille)

**Justification :** Limitation des variantes aux attributs visuellement ou fonctionnellement distincts pour éviter la prolifération excessive.

**Implémentation :** Validation au niveau de l'interface de création de variantes.

### R002 - Nomenclature des variantes

**Règle :** Le nom d'une variante suit le format :
`[Nom Base] - [Couleur] - [Matière] - [Taille si applicable]`

**Exemples :**
- "Vase Côme - Blanc - Céramique"
- "Coussin Magique - Rectangle - Velours Noir"
- "Chaise Lykke - Café - Plastique Recyclé"

**Justification :** Cohérence de nommage pour faciliter la recherche et la gestion.

### R003 - SKU automatique

**Règle :** Le SKU est généré automatiquement selon le format :
`[CODE_FAMILLE]-[CODE_PRODUIT]-[CODE_COULEUR]-[CODE_MATIERE]-[CODE_TAILLE]`

**Exemple :** `VAS-COM-BLA-CER-M` pour "Vase Côme Blanc Céramique Medium"

**Justification :** Unicité garantie et lisibilité pour les équipes.

## Règles de conditionnement

### R004 - Conditionnements flexibles par famille

**Règle :** Les conditionnements sont entièrement flexibles et peuvent être définis selon les besoins spécifiques de chaque famille de produits :

**Produits fragiles (Vases, Coupes) :**
- Unité : Toujours disponible (pack_units = 1)
- Pack sécurisé : 2 ou 4 unités selon la taille
- Pack professionnel : 6 à 12 unités maximum

**Produits textiles (Coussins, Rideaux) :**
- Unité : Toujours disponible (pack_units = 1)
- Pack déco : 2 à 4 unités assortis
- Pack famille : 6 à 8 unités
- Pack professionnel : 12, 24 ou 48 unités

**Mobilier (Chaises, Tables) :**
- Unité : Toujours disponible (pack_units = 1)
- Pack duo : 2 unités
- Pack famille : 4 ou 6 unités
- Pack collectivité : 12, 20 ou 50 unités

**Justification :** Flexibilité maximale pour s'adapter aux contraintes logistiques spécifiques et aux habitudes d'achat des différents segments de clientèle.

### R005 - Calcul des prix dégressifs

**Règle :** Les prix dégressifs suivent les barèmes suivants :

**Pack 3 unités :**
- Produits fragiles : -5% + coût emballage 1,50€
- Produits textiles : -8% + coût emballage 0,60€
- Mobilier : -3% + coût emballage 3,00€

**Pack 6 unités :**
- Produits fragiles : -10% + coût emballage 3,00€
- Produits textiles : -15% + coût emballage 1,20€
- Mobilier : -6% + coût emballage 6,00€

**Pack 12 unités :**
- Produits textiles uniquement : -25% + coût emballage 2,40€

**Justification :** Équilibre entre attractivité commerciale et rentabilité.

### R006 - GTIN par conditionnement

**Règle :** Chaque conditionnement reçoit un GTIN distinct :
- Unité : GTIN-13 standard
- Pack 3 : GTIN-14 avec indicateur 1
- Pack 6 : GTIN-14 avec indicateur 2
- Pack 12 : GTIN-14 avec indicateur 3

**Justification :** Conformité aux standards GS1 pour la traçabilité.

## Règles de gestion des stocks

### R007 - Stock unifié au niveau unité

**Règle :** Le stock est géré uniquement au niveau de l'unité de base. Les conditionnements supérieurs sont calculés dynamiquement.

**Calcul de disponibilité :**
- Pack 3 disponible si stock ≥ 3 unités
- Pack 6 disponible si stock ≥ 6 unités
- Pack 12 disponible si stock ≥ 12 unités

**Justification :** Simplification de la gestion tout en maximisant la flexibilité.

### R008 - Seuils d'alerte par famille

**Règle :** Les seuils d'alerte varient selon la famille :
- Produits fragiles : Alerte si stock < 10 unités
- Produits textiles : Alerte si stock < 20 unités
- Mobilier : Alerte si stock < 5 unités

**Justification :** Adaptation aux délais de réapprovisionnement et à la rotation.

## Règles de filtrage et recherche

### R009 - Filtres obligatoires

**Règle :** Les filtres suivants doivent être disponibles sur toutes les interfaces :
- Couleur (avec swatches visuels)
- Matière (avec descriptions)
- Prix (avec slider)
- Disponibilité (en stock / sur commande)
- Famille de produits

**Justification :** Critères de choix principaux identifiés dans l'analyse utilisateur.

### R010 - Ordre d'affichage des variantes

**Règle :** Dans un groupe de variantes, l'ordre d'affichage suit cette priorité :
1. Variante marquée comme "défaut"
2. Variantes en stock par ordre de popularité
3. Variantes en rupture par ordre alphabétique

**Justification :** Optimisation de l'expérience d'achat.

## Règles de collections

### R011 - Collections automatiques

**Règle :** Les collections suivantes sont générées automatiquement :
- "Nouveautés" : Produits créés dans les 30 derniers jours
- "Meilleures ventes" : Top 20% des ventes sur 3 mois
- "Promotions" : Produits avec remise active
- Par couleur : "Blanc", "Noir", "Naturel", etc.
- Par matière : "Céramique", "Tissu", "Bois", etc.

**Justification :** Facilitation de la découverte produits.

### R012 - Collections manuelles

**Règle :** Les collections manuelles peuvent contenir :
- Des groupes de produits complets
- Des variantes spécifiques
- Des conditionnements particuliers
- Un mélange des trois types

**Justification :** Flexibilité maximale pour les stratégies marketing.

## Règles de synchronisation marketplace

### R013 - Mapping Google Shopping

**Règle :** Pour Google Merchant Center :
- item_group_id = UUID du groupe produit
- color = valeur normalisée de la couleur
- material = valeur normalisée de la matière
- multipack = nombre d'unités pour les packs

**Justification :** Conformité aux spécifications Google.

### R014 - Gestion des images par variante

**Règle :** Chaque variante doit avoir :
- Une image principale obligatoire (ratio 1:1, min 800x800px)
- 2-5 images secondaires recommandées
- Fallback vers les images du groupe si manquantes

**Justification :** Optimisation de l'expérience visuelle.

## Règles de validation

### R015 - Contrôles de cohérence

**Règle :** Avant publication, vérifier :
- Unicité du SKU
- Cohérence des prix (pack < somme des unités)
- Présence d'au moins une image
- Complétude des attributs obligatoires
- Validité des combinaisons d'options

**Justification :** Qualité des données et expérience client.

### R016 - Workflow d'approbation

**Règle :** Les nouvelles variantes nécessitent :
1. Validation technique (faisabilité, cohérence)
2. Validation commerciale (prix, positionnement)
3. Validation marketing (visuels, descriptions)
4. Publication automatique après 3 validations

**Justification :** Contrôle qualité et cohérence de la gamme.

## Règles d'évolution

### R017 - Archivage des variantes

**Règle :** Une variante peut être archivée si :
- Aucune vente dans les 12 derniers mois
- Stock épuisé depuis plus de 6 mois
- Décision commerciale d'arrêt

**Processus :** Passage en statut "discontinued" puis archivage après 3 mois.

**Justification :** Maintien d'un catalogue actuel et pertinent.

### R018 - Évolution des conditionnements

**Règle :** De nouveaux conditionnements peuvent être ajoutés si :
- Demande client identifiée (>10 demandes/mois)
- Faisabilité logistique validée
- Rentabilité démontrée

**Justification :** Adaptation continue aux besoins du marché.

---

**Ces règles métier constituent le cadre de référence pour toutes les décisions liées à la gestion des variantes et conditionnements. Elles doivent être respectées par tous les intervenants et intégrées dans les outils de gestion.**



## Règles de visibilité des variantes sœurs

### R019 - Affichage automatique des variantes sœurs

**Règle :** Sur chaque fiche produit d'une variante, les autres variantes du même groupe produit doivent être automatiquement affichées avec :
- Image principale de chaque variante sœur
- Nom de la variante sœur
- Attributs différentiants (couleur, matière, taille)
- Statut de disponibilité
- Prix de base (conditionnement unitaire)

**Exclusions :** La variante courante est exclue de la liste des variantes sœurs affichées.

**Justification :** Faciliter la navigation entre variantes et améliorer l'expérience d'achat en permettant la comparaison visuelle immédiate.

**Implémentation :** Utilisation de la fonction SQL `get_variant_siblings(variant_id)` et de l'endpoint API `/variants/{variant_id}/siblings`.

### R020 - Ordre d'affichage des variantes sœurs

**Règle :** Les variantes sœurs sont affichées selon la priorité suivante :
1. Variantes en stock par ordre de `sort_order` croissant
2. Variantes en stock par nom alphabétique
3. Variantes en rupture/sur commande (grisées) par ordre alphabétique

**Justification :** Prioriser les options immédiatement disponibles tout en conservant la visibilité des autres options.

### R021 - Cohérence visuelle des variantes sœurs

**Règle :** L'affichage des variantes sœurs doit maintenir une cohérence visuelle :
- Images au même ratio (recommandé : 1:1)
- Taille d'affichage identique
- Informations présentées de manière uniforme
- Indication claire de la variante sélectionnée

**Justification :** Expérience utilisateur optimale et facilitation de la comparaison entre variantes.

## Règles de nommage automatique dans les collections

### R022 - Génération automatique des noms dans les collections

**Règle :** Lorsqu'une variante est ajoutée à une collection, son nom dans la collection est généré automatiquement selon l'algorithme suivant :
1. Si le nom de la collection est contenu dans le nom de la variante → utiliser le nom de la collection
2. Sinon, retirer les attributs de variation du nom de la variante
3. Si le résultat est similaire au nom de la collection → utiliser le nom de la collection
4. Sinon, utiliser le nom nettoyé ou le nom de la collection par défaut

**Exemples :**
- Collection "Fauteuil Romeo" + Variante "Fauteuil Romeo Blanc Cuir" → "Romeo - Blanc - Cuir"
- Collection "Vase Côme" + Variante "Vase Côme Noir Céramique" → "Côme - Noir - Céramique"

**Justification :** Éviter les redondances dans les noms tout en conservant les informations différentiantes essentielles.

### R023 - Préservation des noms personnalisés

**Règle :** Si un nom personnalisé (`custom_name`) est explicitement défini lors de l'ajout d'un élément à une collection, il remplace le nom généré automatiquement et n'est pas modifié par les mises à jour ultérieures du système de nommage automatique.

**Justification :** Permettre la personnalisation manuelle pour les cas particuliers tout en conservant l'efficacité du nommage automatique.

### R024 - Nommage des éléments non-variantes dans les collections

**Règle :** Pour les éléments de collection autres que les variantes :
- **Groupes de produits** : Utiliser le nom de la collection
- **Packs** : Format "Nom de la collection - Pack X unités"
- **Éléments personnalisés** : Respecter le nom défini manuellement

**Justification :** Cohérence de nommage pour tous les types d'éléments dans les collections.

## Règles de structure de catégories

### R025 - Hiérarchie à trois niveaux

**Règle :** La classification des produits suit obligatoirement une hiérarchie à trois niveaux :
- **Famille** : Grande division du catalogue (ex: Mobilier, Décoration, Textile)
- **Catégorie** : Section principale au sein d'une famille (ex: Assises, Vases, Coussins)
- **Sous-catégorie** : Classification fine liée aux produits (ex: Chaises, Vases céramique)

**Justification :** Structure logique et évolutive permettant une navigation intuitive et un SEO optimisé.

### R026 - Liaison unique aux sous-catégories

**Règle :** Chaque groupe de produits (`product_groups`) est lié uniquement à une sous-catégorie via `subcategory_id`. La hiérarchie complète est accessible via les relations :
- Produit → Sous-catégorie → Catégorie → Famille

**Justification :** Simplification de la gestion (un seul point de classification par produit) tout en conservant la richesse de la hiérarchie.

### R027 - Gestion des suppressions en cascade

**Règle :** La suppression d'éléments de la hiérarchie suit les règles suivantes :
- Suppression d'une famille → suppression de ses catégories et sous-catégories
- Suppression d'une catégorie → suppression de ses sous-catégories
- Suppression d'une sous-catégorie → `subcategory_id` des produits liés défini à NULL

**Justification :** Préservation des données produit même en cas de réorganisation de la hiérarchie de catégories.

## Règles de migration et évolution

### R028 - Migration automatisée des données existantes

**Règle :** La migration des données CSV existantes vers le nouveau système doit suivre les étapes suivantes :
1. Analyse et nettoyage des données source
2. Identification automatique des groupes de variantes par similarité de noms
3. Extraction des attributs de variation (couleur, matière) depuis les noms
4. Création automatique de la hiérarchie de catégories manquante
5. Génération des SKU et codes produit uniques
6. Création des conditionnements unitaires par défaut

**Justification :** Automatisation maximale pour réduire les erreurs et accélérer la transition.

### R029 - Validation post-migration

**Règle :** Après migration, les contrôles suivants doivent être effectués :
- Unicité des SKU et codes produit
- Cohérence des groupes de variantes créés
- Complétude des attributs obligatoires
- Validité des liens hiérarchiques (sous-catégorie → catégorie → famille)
- Présence d'au moins un conditionnement par variante

**Justification :** Garantir l'intégrité des données migrées avant mise en production.

### R030 - Évolution continue du système

**Règle :** Le système doit supporter l'évolution continue sans rupture :
- Ajout de nouvelles options de variation sans impact sur les variantes existantes
- Modification des conditionnements sans affecter les commandes en cours
- Réorganisation de la hiérarchie de catégories sans perte de données produit
- Extension des règles de nommage automatique selon les nouveaux besoins

**Justification :** Pérennité de l'investissement et adaptation aux évolutions métier futures.

---

**Ces règles métier constituent le cadre de référence complet pour la version 2.0 du système de gestion de catalogue. Elles intègrent toutes les nouvelles fonctionnalités tout en préservant la cohérence et la qualité des données.**

