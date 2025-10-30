# Règles métier — Tarification Vérone

## Structure des Prix

### Hiérarchie tarifaire
1. **Prix d'achat HT** : Coût fournisseur (interne uniquement)
2. **Prix de vente HT** : Base de calcul pour tous les autres prix
3. **Prix particulier TTC** : Prix public affiché aux clients particuliers
4. **Prix professionnel HT** : Prix affiché aux clients B2B (avec remises)

### Calculs automatiques
```
Prix particulier TTC = Prix de vente HT × (1 + TVA)
Prix professionnel HT = Prix de vente HT × (1 - Remise commerciale)
Marge brute = ((Prix de vente HT - Prix d'achat HT) / Prix de vente HT) × 100
```

## TVA et Fiscalité

### Taux de TVA par catégorie
- **Mobilier** : 20% (taux normal)
- **Livres d'art, antiquités >100 ans** : 5.5% (taux réduit)
- **Œuvres d'art originales** : 10% (taux intermédiaire)
- **Services d'installation** : 20% (taux normal)

### Règles de facturation
- **Particuliers** : Prix TTC obligatoire + mention "dont TVA"
- **Professionnels français** : Prix HT + TVA déductible
- **Professionnels UE** : Autoliquidation TVA si n° TVA intracommunautaire valide
- **Export hors UE** : HT sans TVA (justificatifs douaniers requis)

## Tarifs Dégressifs (B2B)

### Paliers de quantité standard
```
1-9 unités     → Prix unitaire normal
10-24 unités   → Remise 5%
25-49 unités   → Remise 10%
50-99 unités   → Remise 15%
100+ unités    → Remise 20% + négociation possible
```

### Règles d'application
- **Calcul par ligne** : Remise appliquée par produit selon quantité
- **Cumul impossible** : Pas de cumul avec autres remises commerciales
- **Seuils modulables** : Admin peut personnaliser par client ou catégorie
- **Validation** : Remises >25% nécessitent validation manager

## Quantités Minimales de Commande (MOQ)

### Définition par produit
- **MOQ standard** : 1 unité (par défaut)
- **Produits spéciaux** : MOQ définie par le fournisseur
- **Multiples de vente** : `[1, 3, 6, 12]` stockés en JSON
- **Validation commande** : Quantité doit respecter les multiples

### Gestion des exceptions
- **Échantillons** : MOQ = 1 même si produit normalement vendu par 6
- **Commandes mixtes** : MOQ calculée par ligne de commande
- **Clients VIP** : Possibilité de bypass avec validation manuelle

## Remises et Promotions

### Types de remises autorisées
- **Remise commerciale** : Négociée avec client, appliquée sur prix HT
- **Remise quantité** : Automatique selon paliers définis
- **Remise fidélité** : Basée sur CA cumulé client (3%, 5%, 7%)  
- **Remise saisonnière** : Promotions temporaires par catégorie

### Cumul des remises
```
Prix final = Prix de vente HT × (1 - Remise commerciale) × (1 - Remise quantité) × (1 - Remise promo) × (1 + TVA)
```
**Limite** : Cumul total des remises ≤ 40% du prix de vente HT

## Tarification Spéciale LinkMe (Affiliation)

### Structure commission
- **Commission affilié** : 5-15% du CA HT selon performance
- **Prix public** : Identique au site particuliers (transparence)
- **Commission payée par Véron** : Pas d'impact prix client
- **Seuil minimum** : Commande ≥100€ HT pour déclencher commission

### Calcul et paiement
- **Periode** : Commission calculée mensuellement
- **Seuil de paiement** : 50€ minimum pour déclencher virement
- **Délai** : Paiement à M+30 après confirmation livraison
- **Tracking** : URL avec code affilié obligatoire pour attribution

## Gestion des Prix Spéciaux

### Prix catalogue vs Prix négociés
- **Prix catalogue** : Tarifs standard affichés dans les interfaces
- **Prix négociés** : Stockés par client dans table dédiée
- **Priorité** : Prix négocié > Prix dégressif > Prix catalogue
- **Validation** : Prix négocié <80% prix catalogue nécessite approval

### Devise et International (Phase 2)
- **Devise de référence** : EUR
- **Autres devises** : Taux de change quotidien (API externe)
- **Facturation export** : EUR uniquement (simplicité comptable)
- **Affichage client** : Conversion indicative dans devise locale

## Contrôles et Validations

### Contrôles obligatoires à la saisie
- **Prix de vente ≥ Prix d'achat** : Alerte si marge négative
- **Cohérence TVA** : Taux correspond à la catégorie produit
- **Prix professionnel ≤ Prix particulier** : Logique commerciale
- **Remises ≤ 40%** : Limite maximale configée système

### Workflow d'approbation prix
1. **Saisie** : Utilisateur saisit nouveaux prix
2. **Validation automatique** : Contrôles business rules
3. **Approval si nécessaire** : Marge <15% ou remise >25%
4. **Publication** : Activation dans catalogues et feeds
5. **Notification** : Équipe commerciale informée des changements

### Historique et audit
- **Versioning prix** : Horodatage de tous les changements
- **Justification** : Commentaire obligatoire si changement >10%
- **Traçabilité** : Qui, quand, pourquoi pour chaque modification
- **Impact analysis** : Rapport des commandes/devis affectés

## Règles d'Affichage

### Interface Particuliers
- **Prix TTC** : Seul prix affiché
- **Economies** : Mise en avant des promotions (-X%)
- **Stock** : Indication "En stock" / "Sur commande" / "Rupture"
- **Livraison** : Frais de port calculés selon zone

### Interface Professionnels  
- **Prix HT** : Prix principal avec mention "HT"
- **Prix TTC** : Affiché en plus petit
- **Remises** : Remises applicables selon quantité
- **Conditions** : MOQ et délais de livraison visibles

### Back-office (Interne)
- **Tous les prix** : Achat, vente, marge, remises
- **Indicateurs** : Rotation, marge moyenne, évolution prix
- **Comparaison** : Evolution prix dans le temps
- **Export** : Grilles tarifaires complètes pour commerciaux

Ces règles de tarification garantissent la cohérence commerciale tout en offrant la flexibilité nécessaire aux différents segments clients de Vérone.