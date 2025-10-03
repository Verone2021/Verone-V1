# PRD — MVP Catalogue partageable

## Contexte & Problème
Véron, société de décoration et mobilier d'intérieur, a besoin d'un système centralisé pour gérer son catalogue de produits et le partager efficacement avec ses clients. Actuellement, la gestion des produits, fournisseurs, et la création de catalogues personnalisés se fait de manière manuelle et dispersée, ce qui limite la productivité et la qualité du service client.

Le problème principal est l'absence d'un système unifié permettant de :
- Gérer efficacement un catalogue de produits avec variantes (couleurs, tailles, finitions)
- Créer et partager rapidement des sélections personnalisées avec les clients
- Exporter des catalogues au format PDF professionnel
- Alimenter automatiquement les plateformes publicitaires (Meta, Google)
- Suivre les interactions clients et les opportunités commerciales

## Utilisateurs & Cas d'usage

### Personas principales

**Admin/Back-office (Équipe Véron)**
- Gestion complète du catalogue (CRUD produits, fournisseurs, catégories)
- Création de collections thématiques
- Suivi des stocks et des commandes
- Génération de rapports et analytics

**Commercial/Sales (Équipe Véron)**
- Création rapide de sélections personnalisées pour clients
- Partage de liens sécurisés avec tracking
- Suivi des interactions clients
- Génération de devis

**Client Professionnel**
- Consultation de catalogues personnalisés
- Demande de devis en ligne
- Accès aux tarifs dégressifs
- Historique des commandes

**Client Particulier**
- Navigation dans le catalogue public
- Demande d'informations sur les produits
- Prise de rendez-vous

## Portée (In) & (Out)

### In-Scope (Phase 1)
- **CRUD Catalogue complet** : Produits, variantes, catégories hiérarchiques, fournisseurs
- **Gestion des images** : Upload, organisation, image principale par produit
- **Collections partageables** : Création de sélections avec lien sécurisé + token d'accès
- **Export PDF** : Génération automatique de catalogues PDF professionnels
- **Feeds e-commerce** : Endpoints `/feeds/*.csv` compatibles Meta/Google avec Scheduled Fetch
- **Webhook Brevo** : Réception et stockage des événements marketing (ouvertures, clics)
- **Interface responsive** : Consultation mobile/desktop des catalogues partagés
- **Gestion des stocks** : Statuts de disponibilité (en stock, sur commande, rupture)
- **Tarification flexible** : Prix particuliers, professionnels, quantités minimales

### Out-of-Scope (Phases ultérieures)
- Paiement en ligne intégré
- Facturation automatisée complète
- Application mobile native
- Système de commande complet (reste en mode devis)
- Intégration comptable avancée
- Gestion des retours/SAV

## Critères d'acceptation (Given/When/Then)

### AC-1 : Création et partage de catalogue
**Given** un commercial connecté au back-office
**When** il crée une sélection de 20+ produits et génère un lien partageable
**Then** le lien est accessible sans authentification, responsive, et affiche tous les produits avec images principales

### AC-2 : Export PDF professionnel
**Given** une collection de produits créée
**When** l'utilisateur demande l'export PDF
**Then** un PDF est généré en <10s avec mise en page professionnelle, images, prix, et références

### AC-3 : Feed Meta/Google conforme
**Given** un catalogue avec 50+ produits actifs
**When** l'endpoint `/feeds/facebook.csv` est appelé avec un token valide
**Then** le CSV retourné contient les champs requis : `id,title,description,link,image_link,price,availability,condition,brand,item_group_id`

### AC-4 : Gestion des statuts de stock
**Given** un produit avec statut "sur_commande"
**When** le feed e-commerce est généré
**Then** le champ `availability` contient "preorder" (mapping correct)

### AC-5 : Webhook Brevo fonctionnel
**Given** le webhook `/webhooks/brevo` configuré
**When** Brevo envoie un événement "opened" pour une campagne
**Then** l'événement est stocké en base avec tous les métadonnées (email, campaign_id, timestamp)

### AC-6 : Demande de devis
**Given** un client consultant un catalogue partagé
**When** il clique sur "Demander un devis" et remplit le formulaire
**Then** une opportunité est créée en CRM et un email de confirmation est envoyé

## Métriques de succès

### Métriques techniques
- **Disponibilité** : ≥99% uptime pour les catalogues partagés
- **Performance** : Génération de lien partageable <5s, feed CSV <10s
- **Qualité des feeds** : ≥95% des imports Meta/Google sans erreur
- **Fiabilité webhooks** : 100% des événements Brevo reçus et stockés

### Métriques business
- **Adoption** : 100% de l'équipe commerciale utilise le système dans les 30 jours
- **Productivité** : Réduction de 70% du temps de création de catalogues clients
- **Engagement** : Taux d'ouverture des catalogues partagés >40%
- **Conversion** : 15% des catalogues partagés génèrent une demande de devis

## Contraintes & Risques

### Contraintes techniques
- **Conformité specs externes** : Formats CSV Meta/Google évoluent régulièrement
- **Performance images** : Optimisation nécessaire pour catalogues avec nombreuses images
- **Sécurité** : Tokens d'accès doivent être sécurisés mais partageables facilement

### Risques identifiés
- **Dépendance Supabase** : Risque de limitation de performance ou de coût
- **Intégration Brevo** : Changements d'API pourraient casser les webhooks
- **Qualité des données** : Catalogue mal structuré impacte l'expérience client
- **Adoption utilisateur** : Résistance au changement de l'équipe commerciale

### Mitigations
- Tests automatisés sur les formats de feeds
- Monitoring des performances et alertes
- Documentation et formation utilisateur
- Plan de rollback en cas de problème majeur

## Ouvertures / Questions

### Questions techniques à trancher
- **Hébergement images** : Supabase Storage vs CDN externe (Cloudinary) ?
- **Génération PDF** : Côté serveur (Puppeteer) vs service externe ?
- **Cache** : Stratégie de mise en cache pour les catalogues fréquemment consultés ?

### Questions business
- **Tarification** : Affichage des prix dans les catalogues partagés ?
- **Branding** : Personnalisation visuelle par commercial/client ?
- **Analytics** : Niveau de détail souhaité sur le tracking des consultations ?

## Plan de test (unitaire/e2e)

### Tests unitaires
- Validation des formats de données (produits, prix, stocks)
- Logique de génération des feeds CSV
- Fonctions de calcul (prix TTC, remises, MOQ)
- Parsing des webhooks Brevo

### Tests d'intégration
- CRUD complet sur les entités principales
- Politiques RLS Supabase
- Génération et accès aux liens partagés
- Upload et traitement des images

### Tests E2E
- Parcours complet : création catalogue → partage → consultation client
- Génération PDF avec différents types de contenu
- Flux de demande de devis depuis catalogue partagé
- Réception et traitement des webhooks Brevo

### Tests de performance
- Temps de génération des feeds avec 1000+ produits
- Temps de chargement des catalogues partagés
- Génération PDF avec 50+ produits et images

Cette spécification servira de référence pour le développement du MVP et l'évaluation de sa réussite.

