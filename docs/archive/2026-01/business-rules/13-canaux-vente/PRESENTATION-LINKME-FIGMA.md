# PRÉSENTATION LINKME - Documentation Exhaustive pour Figma

**Date** : 2025-12-17
**Objectif** : Présentation complète de la plateforme LinkMe pour génération design Figma
**Source** : Code réel + Base de données + Documentation projet Vérone

---

## 🎯 QU'EST-CE QUE LINKME ?

**LinkMe** est une plateforme B2B d'affiliation intégrée à Vérone permettant à des **enseignes** (chaînes de magasins) et des **organisations indépendantes** (boutiques autonomes) de créer des **sélections de produits personnalisées** qu'ils peuvent partager avec leurs clients. Chaque vente génère une **commission** pour l'affilié.

### Proposition de valeur

- **Pour les affiliés** : Monétiser leur réseau en recommandant des produits Vérone
- **Pour Vérone** : Canal de vente B2B avec réseau de prescripteurs
- **Pour les clients finaux** : Accès à une sélection curatée par un expert de confiance

---

## 👥 TYPES D'UTILISATEURS

### 1. ENSEIGNE (Chaîne de magasins)

| Caractéristique  | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| **Rôle**         | `enseigne_admin`                                                        |
| **Exemple réel** | POKAWA (149 shops, 9 utilisateurs)                                      |
| **Capacités**    | Gérer sélections, voir commandes de tous les shops, piloter commissions |
| **Hiérarchie**   | Peut avoir plusieurs "shops" (points de vente) rattachés                |

### 2. ORGANISATION INDÉPENDANTE

| Caractéristique | Description                                        |
| --------------- | -------------------------------------------------- |
| **Rôle**        | `org_independante`                                 |
| **Exemple**     | Boutique de décoration indépendante                |
| **Capacités**   | Créer sélections, commander, percevoir commissions |
| **Hiérarchie**  | Entité autonome sans shops rattachés               |

### 3. CLIENT (Employé Enseigne)

| Caractéristique | Description                                         |
| --------------- | --------------------------------------------------- |
| **Rôle**        | `client`                                            |
| **Contexte**    | Employé d'une enseigne gérant les commandes         |
| **Capacités**   | Passer commandes pour son shop, voir son historique |

### 4. SHOP (Point de Vente Franchisé/Propre)

| Caractéristique | Description                                  |
| --------------- | -------------------------------------------- |
| **Rôle**        | `client` + lien shop                         |
| **Exemple**     | Pokawa Boulogne, Pokawa Commerce Paris       |
| **Capacités**   | Commander depuis sélections enseigne parente |

---

## 🏗️ ARCHITECTURE FONCTIONNELLE

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACK-OFFICE VÉRONE                       │
│                    (Administrateurs Vérone)                     │
├─────────────────────────────────────────────────────────────────┤
│  • Gérer catalogue produits LinkMe                              │
│  • Configurer marges min/max/suggérées                          │
│  • Valider commissions                                          │
│  • Traiter demandes de paiement                                 │
│  • Analytics globales                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ESPACE AFFILIÉ LINKME                       │
│              (Enseignes & Organisations Indépendantes)           │
├─────────────────────────────────────────────────────────────────┤
│  • Créer/gérer sélections produits                              │
│  • Définir marges personnalisées                                │
│  • Suivre commandes clients                                     │
│  • Consulter commissions                                        │
│  • Demander versements                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VITRINE PUBLIQUE LINKME                      │
│                      (Clients Finaux)                            │
├─────────────────────────────────────────────────────────────────┤
│  • Consulter sélections publiques                               │
│  • Commander produits                                           │
│  • Accès via lien partagé (token)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 MODULE 1 : CATALOGUE PRODUITS

### Fonctionnalités Back-Office

**1.1 Gestion Catalogue Général**

- Ajouter/retirer produits du catalogue LinkMe
- Activer/désactiver produits (visibilité affiliés)
- Marquer produits "Vedette" (mise en avant)

**1.2 Configuration Marges par Produit**
| Champ | Description | Exemple |
|-------|-------------|---------|
| `min_margin_rate` | Marge minimum autorisée | 0% |
| `max_margin_rate` | Marge maximum autorisée | 20% |
| `suggested_margin_rate` | Marge suggérée (zone verte) | 10% |

**1.3 Vitrine Publique (Showcase)**

- Produits visibles sans connexion (`is_public_showcase`)
- Collections thématiques (grille, carousel, featured)
- Personnalisation : titre, description, points forts

**1.4 Statistiques Produit**

- Nombre de vues
- Nombre de sélections incluant ce produit
- CA généré

### Interface Catalogue (KPIs)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Total      │  │   Actifs     │  │  Vedettes    │
│   245        │  │   198        │  │   12         │
│   produits   │  │   produits   │  │   produits   │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## ⭐ MODULE 2 : SÉLECTIONS (Mini-Boutiques)

### Concept

Une **sélection** est une collection personnalisée de produits créée par un affilié. C'est sa "mini-boutique" qu'il partage avec ses clients.

### Cycle de Vie Sélection

```
BROUILLON (draft) → ACTIVE (published) → ARCHIVÉE (archived)
     │                    │                    │
     │                    │                    │
   Privée            Publique ou           Plus visible
   Éditable          Réseau enseigne       Historique
```

### Création Sélection (Workflow Affilié)

**Étape 1 : Informations Générales**

- Nom de la sélection (ex: "Salon Moderne 2025")
- Description
- Image de couverture
- Visibilité : Publique ou Réseau enseigne uniquement

**Étape 2 : Ajout Produits**

- Parcourir catalogue LinkMe
- Recherche par nom/référence
- Filtrage par catégorie
- Bouton "Ajouter à ma sélection"

**Étape 3 : Configuration Marges**

Pour chaque produit ajouté, l'affilié configure sa marge :

```
┌─────────────────────────────────────────────────────────────┐
│  Canapé Oslo 3 places                                       │
│  SKU: VER-CAN-368                                          │
├─────────────────────────────────────────────────────────────┤
│  Prix Base HT : 1 200 €                                     │
│                                                             │
│  MARGE AFFILIÉ                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 0%  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  20%  │   │
│  │     ↑ VERT      ↑ ORANGE        ↑ ROUGE            │   │
│  │     Compétitif   Équilibré       Proche public      │   │
│  └─────────────────────────────────────────────────────┘   │
│  Marge choisie : 15% ─────────────────────────────── [━━]  │
│                                                             │
│  RÉSULTAT :                                                 │
│  • Votre gain : 180 €                                      │
│  • Prix final HT : 1 380 €                                 │
│  • Prix client TTC : 1 656 €                               │
└─────────────────────────────────────────────────────────────┘
```

### Système de Marges "Feux Tricolores"

| Zone          | Couleur   | Signification         | Calcul                 |
| ------------- | --------- | --------------------- | ---------------------- |
| Compétitive   | 🟢 Vert   | Prix attractif        | 0% → marge suggérée    |
| Équilibrée    | 🟠 Orange | Prix correct          | suggérée → 2× suggérée |
| Proche public | 🔴 Rouge  | Proche prix catalogue | 2× suggérée → max      |

### Partage Sélection

- **URL publique** : `linkme.verone.fr/s/{slug}`
- **Token de partage** : Lien unique pour tracking
- **QR Code** : Génération automatique

---

## 🛒 MODULE 3 : COMMANDES

### Flux Commande LinkMe

```
Client visite sélection
        │
        ▼
Ajoute produits au panier
        │
        ▼
Passe commande (avec infos livraison)
        │
        ▼
Commande créée (status: draft)
        │
        ▼
Validation Vérone (status: validated)
        │
        ▼
Expédition (status: shipped)
        │
        ▼
Livraison (status: delivered)
        │
        ▼
Paiement reçu → Commission créée automatiquement
```

### Statuts Commande

| Statut              | Badge      | Description          |
| ------------------- | ---------- | -------------------- |
| `draft`             | Gris       | Brouillon            |
| `validated`         | Bleu       | Validée              |
| `partially_shipped` | Orange     | Expédition partielle |
| `shipped`           | Vert       | Expédiée             |
| `delivered`         | Vert foncé | Livrée               |
| `cancelled`         | Rouge      | Annulée              |

### Interface Commandes Affilié

**KPIs**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Commandes   │  │   CA HT      │  │ Marge Affilié│
│     26       │  │  33 024 €    │  │   4 954 €    │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Table Commandes**
| Date | N° Commande | Client | Sélection | Total TTC | Marge | Statut |
|------|-------------|--------|-----------|-----------|-------|--------|
| 15/12 | CMD-2024-0042 | M. Dupont | Salon Moderne | 2 580 € | 387 € | Validée |

**Détail Commande (Accordéon)**
| Photo | Produit | Qté | Prix unit. HT | Total HT | Marge |
|-------|---------|-----|---------------|----------|-------|
| 🖼️ | Canapé Oslo | 1 | 1 200 € | 1 200 € | 180 € |

---

## 💰 MODULE 4 : COMMISSIONS & RÉMUNÉRATION

### Calcul Commission Affilié

```
FORMULE :
Commission HT = Σ (prix_vente_ht - prix_base_ht) par article

EXEMPLE :
- Canapé vendu 1 380 € HT (base: 1 200 €) → Marge: 180 €
- Table vendue 575 € HT (base: 500 €) → Marge: 75 €
- Total commande: 1 955 € HT
- Commission affilié HT: 255 €
- Commission affilié TTC (20% TVA): 306 €
```

### Commission Plateforme LinkMe

```
Commission LinkMe = Total commande HT × 3%
(ou taux personnalisé par affilié)
```

### Cycle de Vie Commission

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  EN ATTENTE │───▶│  VALIDÉE    │───▶│  EN COURS   │───▶│   PAYÉE     │
│   pending   │    │  validated  │    │  de règlem. │    │    paid     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
  Commande         Commande           Demande            Virement
  passée           payée par          paiement           effectué
                   client             créée
```

### Interface Rémunération

**4 KPI Cards (cliquables)**

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  ⏱️ EN ATTENTE   │  │  💵 PAYABLES     │  │  ⌛ EN COURS     │  │  ✓ PAYÉES        │
│     684,55 €     │  │    1 250,00 €    │  │      500 €       │  │   27 853 €       │
│   3 commandes    │  │   5 commandes    │  │   1 demande      │  │  42 versements   │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Demande de Paiement (Workflow)

**Étape 1 : Affilié sélectionne commissions payables**

- Checkboxes sur commissions validées
- Bouton "Percevoir (X €)"

**Étape 2 : Création demande**

- Numéro auto-généré : PR-2025-000001
- Montant HT + TTC calculé
- Statut : `pending`

**Étape 3 : Upload facture affilié**

- L'affilié upload sa facture (PDF)
- Statut : `invoice_received`

**Étape 4 : Vérone traite le paiement**

- Virement bancaire
- Upload preuve de paiement
- Statut : `paid`

### TVA sur Commissions

| Pays                | Taux TVA | Exemple              |
| ------------------- | -------- | -------------------- |
| France              | 20%      | 100 € HT → 120 € TTC |
| Belgique (intra-UE) | 0%       | 100 € HT → 100 € TTC |

---

## 📊 MODULE 5 : ANALYTICS

### Vue d'Ensemble (Dashboard Analytics)

**Filtres Disponibles**

- Année : 2024, 2025, ...
- Période : Semaine / Mois / Trimestre / Année

**KPIs Principaux**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Affiliés    │  │  Commandes   │  │   CA HT      │  │ Panier moyen │
│  actifs      │  │              │  │              │  │              │
│     2        │  │     37       │  │  45 633 €    │  │   1 234 €    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**Graphiques**

1. **Évolution CA** : Courbe temporelle du chiffre d'affaires
2. **Top Affiliés** : Classement par CA généré (barres horizontales)

**Statut Commissions**

```
┌─────────────────────────────────────────────────────────────┐
│  COMMISSIONS                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ En attente │  │  Validées  │  │   Payées   │            │
│  │   684 €    │  │     0 €    │  │  27 853 €  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Performance Détaillée

**Navigation Drill-Down**

```
Performance Globale
      │
      └──▶ Par Affilié (ex: POKAWA)
               │
               └──▶ Par Sélection (ex: "Mobilier Restaurants")
                        │
                        └──▶ Par Produit
```

**Métriques par Affilié**

- CA HT généré
- Commissions TTC
- Nombre commandes
- Panier moyen
- Top 10 produits vendus
- Liste sélections avec performance

**Métriques par Sélection**

- Nombre de vues
- Nombre de commandes
- Taux de conversion (vues → commandes)
- CA généré
- Produits les plus performants

---

## 👤 MODULE 6 : GESTION UTILISATEURS

### Types de Comptes

| Type               | Description           | Permissions                            |
| ------------------ | --------------------- | -------------------------------------- |
| `enseigne_admin`   | Admin d'une enseigne  | Tout gérer pour son enseigne           |
| `org_independante` | Organisation autonome | Gérer ses propres sélections/commandes |
| `client`           | Employé/Shop          | Passer commandes                       |

### Interface Gestion Comptes

**KPIs**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Total     │  │    Actifs    │  │   Suspendus  │  │    Rôles     │
│   Comptes    │  │              │  │              │  │   uniques    │
│     15       │  │     12       │  │      3       │  │      4       │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**Actions Disponibles**

- ➕ Créer nouveau compte
- ✏️ Modifier profil
- 🔑 Réinitialiser mot de passe
- 🗑️ Supprimer compte
- 🔒 Suspendre/Réactiver

**Filtres**

- Recherche (email, nom)
- Rôle (tous, enseigne_admin, org_independante, client)
- Statut (tous, actif, suspendu)

---

## 🏢 MODULE 7 : ENSEIGNES & ORGANISATIONS

### Enseigne

- Nom, logo, description
- Marge par défaut (%)
- Taux TVA applicable
- Liste des shops rattachés
- Liste des utilisateurs

### Organisation Indépendante

- Nom, logo, description
- Marge par défaut (%)
- Taux TVA applicable
- Utilisateur principal

### Profil Affilié (linkme_affiliates)

| Champ                    | Description              |
| ------------------------ | ------------------------ |
| `display_name`           | Nom affiché publiquement |
| `slug`                   | URL personnalisée        |
| `logo_url`               | Logo/Avatar              |
| `bio`                    | Description              |
| `default_margin_rate`    | Marge par défaut (15%)   |
| `linkme_commission_rate` | Commission LinkMe (3-5%) |
| `tva_rate`               | Taux TVA (20% France)    |

---

## ⚙️ MODULE 8 : CONFIGURATION

### Paramètres Globaux

- Commission plateforme par défaut (%)
- Marges min/max catalogue
- Seuil minimum demande paiement

### Paramètres par Affilié

- Taux commission personnalisé
- Marge par défaut
- TVA applicable

---

## 🔔 MODULE 9 : TABLEAU DE BORD

### KPIs Temps Réel

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   CA Généré      │  │  Commissions     │  │ Affiliés actifs  │  │  Commandes       │
│   ce mois        │  │  à payer         │  │                  │  │  ce mois         │
│   12 450 €       │  │   1 934 €        │  │      2           │  │     8            │
│   +23% ↑         │  │  3 demandes      │  │  +1 ce mois      │  │   +15% ↑         │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Actions Rapides

- 📋 Demandes de paiement (badge count)
- 👥 Gérer les affiliés
- 📦 Voir les commandes

### Activité Récente

| Type          | Description           | Montant | Temps        |
| ------------- | --------------------- | ------- | ------------ |
| 🛒 Commande   | Nouvelle commande #42 | 1 580 € | Il y a 5 min |
| 💰 Commission | Commission validée    | 237 €   | Il y a 1h    |
| 👤 Affilié    | Nouveau shop créé     | -       | Il y a 2h    |

---

## 📱 PARCOURS UTILISATEUR TYPE

### Parcours Affilié (Enseigne)

```
1. CONNEXION
   └─▶ Dashboard enseigne

2. CRÉER SÉLECTION
   └─▶ Nommer + décrire
   └─▶ Ajouter produits du catalogue
   └─▶ Configurer marges (slider tricolore)
   └─▶ Publier

3. PARTAGER
   └─▶ Copier lien sélection
   └─▶ Envoyer aux clients/shops

4. SUIVRE VENTES
   └─▶ Voir commandes entrantes
   └─▶ Consulter commissions accumulées

5. PERCEVOIR GAINS
   └─▶ Sélectionner commissions payables
   └─▶ Créer demande de paiement
   └─▶ Uploader facture
   └─▶ Recevoir virement
```

### Parcours Client Final

```
1. RÉCEPTION LIEN
   └─▶ Clic sur lien sélection partagé

2. CONSULTATION
   └─▶ Voir produits de la sélection
   └─▶ Consulter prix et détails

3. COMMANDE
   └─▶ Ajouter au panier
   └─▶ Renseigner infos livraison
   └─▶ Valider commande

4. LIVRAISON
   └─▶ Suivi commande
   └─▶ Réception produits
```

---

## 📐 WIREFRAMES SUGGÉRÉS POUR FIGMA

### Page 1 : Dashboard

- Header avec logo + titre
- 4 KPI cards en ligne
- 2 colonnes : Actions rapides | Activité récente

### Page 2 : Catalogue

- Header + bouton "Ajouter produits"
- 3 KPI cards
- Filtres (recherche, catégorie, statut)
- Toggle vue Grille/Liste
- Cards produits avec badges

### Page 3 : Créer Sélection

- Stepper 3 étapes
- Formulaire infos générales
- 2 colonnes : Catalogue | Produits sélectionnés
- Slider marge tricolore par produit

### Page 4 : Commandes

- 3 KPI cards
- Filtres (recherche, statut)
- Table avec accordéon détail

### Page 5 : Rémunération

- 4 KPI cards cliquables (tabs)
- Table commissions avec checkboxes
- Bouton "Percevoir" conditionnel

### Page 6 : Analytics

- Filtres année/période
- 4 KPI cards
- 2 graphiques (ligne + barres)
- Card statut commissions

### Page 7 : Demandes Paiement

- 4 KPI cards par statut
- Table avec actions conditionnelles
- Modal upload facture

---

## ✅ CHECKLIST FONCTIONNALITÉS LINKME

### Catalogue

- [x] Ajouter/retirer produits
- [x] Activer/désactiver
- [x] Marquer vedette
- [x] Configurer marges min/max/suggérée
- [x] Vitrine publique
- [x] Collections thématiques

### Sélections

- [x] Créer sélection
- [x] Ajouter produits
- [x] Configurer marge par produit
- [x] Slider feux tricolores
- [x] Publier/Archiver
- [x] Partage URL + token

### Commandes

- [x] Liste commandes
- [x] Détail avec produits
- [x] Statuts visuels
- [x] Filtres multi-critères
- [x] Création manuelle

### Commissions

- [x] Calcul automatique
- [x] Statuts (pending → paid)
- [x] TVA par pays
- [x] Demande paiement
- [x] Upload facture
- [x] Export CSV

### Analytics

- [x] KPIs globaux
- [x] Filtres année/période
- [x] Graphique évolution CA
- [x] Top affiliés
- [x] Drill-down affilié → sélection
- [x] Performance par produit

### Utilisateurs

- [x] CRUD comptes
- [x] Rôles (enseigne, org, client)
- [x] Suspension/Réactivation
- [x] Reset mot de passe

---

**FIN DE LA PRÉSENTATION**

Cette documentation est basée à 100% sur le code réel et la base de données du projet Vérone.
Aucune fonctionnalité n'a été inventée.
