# Guide Complet LinkMe

**Version** : 2.0.0
**Date** : 2026-02-18
**Status** : SOURCE DE VERITE UNIQUE

> Ce document est la reference definitive de LinkMe. Toute contradiction avec d'autres docs = ce guide fait foi.

---

## Table des matieres

1. [Vision et Positionnement](#1-vision-et-positionnement)
2. [Types de Comptes](#2-types-de-comptes)
3. [Architecture Technique](#3-architecture-technique)
4. [Catalogue et Types de Produits](#4-catalogue-et-types-de-produits)
5. [Selections (Coeur de LinkMe)](#5-selections-coeur-de-linkme)
6. [Taux de Marque](#6-taux-de-marque)
7. [Feux Tricolores](#7-feux-tricolores)
8. [Page Publique](#8-page-publique)
9. [Commandes](#9-commandes)
10. [Commissions](#10-commissions)
11. [Produits Affilies](#11-produits-affilies)
12. [Stockage et Facturation M3](#12-stockage-et-facturation-m3)
13. [Paiements](#13-paiements)
14. [Price Locking](#14-price-locking)
15. [Roadmap Particuliers](#15-roadmap-particuliers)
16. [Glossaire](#16-glossaire)
17. [Routing Page Publique](#17-routing-page-publique)
18. [Schema DB Complet](#18-schema-db-complet)
19. [Formulaire Commande (4 Steps)](#19-formulaire-commande-4-steps)
20. [Workflow Verification Factures](#20-workflow-verification-factures)
21. [Traitement Factures F-25-XXX](#21-traitement-factures-f-25-xxx)

---

## 1. Vision et Positionnement

LinkMe est la **plateforme d'affiliation B2B2C** de Verone. Elle interconnecte 3 acteurs :

| Acteur       | Role                                                   | Interface                      |
| ------------ | ------------------------------------------------------ | ------------------------------ |
| **Verone**   | Fournisseur catalogue + operateur plateforme           | Back-office (`localhost:3000`) |
| **Affilies** | Creent des selections, vendent, percoivent commissions | App LinkMe (`localhost:3002`)  |
| **Clients**  | Entreprises qui commandent via pages publiques         | Pages `/s/{slug}`              |

**Modele economique** :

- Verone fournit le catalogue produits aux affilies
- Les affilies configurent leurs marges et creent des mini-boutiques (selections)
- Les clients commandent via les pages publiques des selections
- Verone preleve une commission plateforme (5% par defaut)
- Les affilies percoivent la marge qu'ils ont configuree

**Statut** : Operationnel avec Pokawa comme premier client enseigne.

---

## 2. Types de Comptes

### 2.1 Enseigne (`enseigne_admin`)

Une chaine avec **plusieurs points de vente** (ex: Pokawa).

| Aspect                | Detail                                                                      |
| --------------------- | --------------------------------------------------------------------------- |
| Role `user_app_roles` | `enseigne_admin`                                                            |
| Lien                  | `enseigne_id` dans `user_app_roles` + `linkme_affiliates`                   |
| Multi-utilisateurs    | **OUI** - Plusieurs users partagent le meme `enseigne_id`                   |
| Partage               | Selections et commissions partagees entre users de la meme enseigne         |
| Organisations         | Chaque point de vente = 1 organisation (ownership: `propre` ou `franchise`) |

### 2.2 Organisation independante (`org_independante`)

Un professionnel independant, sans enseigne parente.

| Aspect                | Detail                                                        |
| --------------------- | ------------------------------------------------------------- |
| Role `user_app_roles` | `org_independante`                                            |
| Lien                  | `organisation_id` dans `user_app_roles` + `linkme_affiliates` |
| Multi-utilisateurs    | **NON** - Un seul user par organisation independante          |
| Organisation          | 1 organisation = 1 user = 1 profil affilie                    |

### 2.3 Particulier (FUTUR - Roadmap)

Voir [section 15](#15-roadmap-particuliers) pour les implications techniques.

### 2.4 Visibilite par Role

**Verifie dans le code** : RLS policy `sales_orders` + hook `useUserAffiliate()` + RPC `get_customers_for_affiliate()`

| Role                  | Commandes visibles                                        | Clients visibles                                  |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `enseigne_admin`      | TOUTES les commandes de TOUS les affilies de son enseigne | Tous les franchises de l'enseigne + clients crees |
| `org_independante`    | UNIQUEMENT les commandes de son organisation              | UNIQUEMENT les clients qu'il a crees              |
| `particulier` (futur) | UNIQUEMENT ses propres commandes                          | UNIQUEMENT ses propres clients                    |

**Mecanisme** : RLS sur `sales_orders` joint `linkme_affiliates` via `created_by_affiliate_id` puis filtre par `enseigne_id` ou `organisation_id` selon le role de l'utilisateur.

### Contrainte XOR

```
linkme_affiliates:
  enseigne_id IS NOT NULL AND organisation_id IS NULL   -- Enseigne
  OR
  enseigne_id IS NULL AND organisation_id IS NOT NULL   -- Org independante
```

**Exactement un des deux** doit etre renseigne. Contrainte DB + validation applicative.

---

## 3. Architecture Technique

### 3.1 Modele a 2 Tables

```
AUTHENTIFICATION                        DONNEES BUSINESS
+-----------------------------+        +-------------------------------+
| user_app_roles              |        | linkme_affiliates             |
| - user_id -> auth.users     |  JOIN  | - enseigne_id XOR org_id      |
| - app = 'linkme'            | -----> | - default_margin_rate (15%)   |
| - role: enseigne_admin      |  via   | - linkme_commission_rate (5%) |
|       | org_independante     | ens/org| - display_name, slug, bio     |
| - enseigne_id OU org_id     |        | - status: active/inactive     |
+-----------------------------+        +-------------------------------+
                                                    |
                                                    v
                                       +-------------------------------+
                                       | linkme_selections             |
                                       | - affiliate_id                |
                                       | - name, slug, is_public       |
                                       | - price_display_mode (HT/TTC) |
                                       +-------------------------------+
                                                    |
                                                    v
                                       +-------------------------------+
                                       | linkme_selection_items         |
                                       | - selection_id, product_id     |
                                       | - base_price_ht (from channel) |
                                       | - margin_rate (taux de marque) |
                                       | - selling_price_ht (GENERATED) |
                                       +-------------------------------+
```

### 3.2 Logique de Liaison User -> Affiliate

```typescript
// Le lien user -> affiliate se fait via enseigne_id/organisation_id
if (linkMeRole.role === 'enseigne_admin' && linkMeRole.enseigne_id) {
  query = query.eq('enseigne_id', linkMeRole.enseigne_id);
} else if (
  linkMeRole.role === 'org_independante' &&
  linkMeRole.organisation_id
) {
  query = query.eq('organisation_id', linkMeRole.organisation_id);
}
```

**Important** : Il n'y a PAS de colonne `user_id` dans `linkme_affiliates`. La liaison passe toujours par `enseigne_id` ou `organisation_id`.

### 3.3 Triggers Automatiques

| Trigger                                    | Evenement                                         | Action                                                      |
| ------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------- |
| `trg_create_linkme_profile_enseigne`       | AFTER INSERT ON `enseignes`                       | Cree profil `linkme_affiliates` (margin 15%, commission 5%) |
| `sync_channel_pricing_to_selections`       | UPDATE `channel_pricing`                          | Propage prix vers `linkme_selection_items`                  |
| `create_linkme_commission_on_order_update` | UPDATE `sales_orders` status -> 'shipped'         | Cree commission dans `linkme_commissions`                   |
| `sync_commission_status_on_payment`        | UPDATE `sales_orders` payment_status -> 'paid'    | Commission `pending` -> `validated`                         |
| `lock_prices_on_order_validation`          | UPDATE `sales_orders` status -> shipped/delivered | Fige prix dans `_locked` columns                            |

### 3.4 Authentification

- **Cookie partage** : Meme cookie Supabase entre back-office, site-internet et linkme
- **Isolation RLS** : Permissions separees via `user_app_roles.app = 'linkme'`
- **Hook correct** : Utiliser `initializing` (PAS `loading`) dans `useAuth()` pour eviter boucle infinie de redirect

```typescript
// CORRECT
const { user, linkMeRole, initializing } = useAuth();
useEffect(() => {
  if (!initializing && !user) router.push('/login');
}, [user, initializing, router]);

// INCORRECT (cause boucle infinie)
const { user, loading } = useAuth(); // loading est toujours false au mount
```

### 3.5 Contacts Commande

Les contacts varient selon le type d'organisation (ownership_type) :

| Type                  | Responsable + Facturation     | Livraison                     |
| --------------------- | ----------------------------- | ----------------------------- |
| **Propre/Succursale** | Contact de l'**enseigne**     | Contact de l'**organisation** |
| **Franchise**         | Contact de l'**organisation** | Contact de l'**organisation** |

---

## 4. Catalogue et Types de Produits

LinkMe gere **2 types de produits** avec des modeles economiques fondamentalement differents :

### 4.1 Produits Catalogue (l'affilie GAGNE une marge)

| Aspect         | Detail                                              |
| -------------- | --------------------------------------------------- |
| Createur       | Verone (back-office)                                |
| Identification | `products.created_by_affiliate IS NULL`             |
| Prix de base   | `channel_pricing.public_price_ht` (canal LinkMe)    |
| Marge          | L'affilie definit `margin_rate` dans sa selection   |
| Nature         | L'affilie **GAGNE** une marge commerciale           |
| Modele         | L'affilie ajoute sa marge AU-DESSUS du prix de base |

### 4.2 Produits Affilies (LinkMe PRELEVE une taxe)

| Aspect         | Detail                                                     |
| -------------- | ---------------------------------------------------------- |
| Createur       | L'affilie lui-meme                                         |
| Identification | `products.created_by_affiliate IS NOT NULL`                |
| Prix           | Fixe par l'affilie (`products.price_ht`)                   |
| `margin_rate`  | **0% impose** (migration `20260109_003`)                   |
| Nature         | LinkMe **PRELEVE** une taxe/frais sur le prix de l'affilie |
| Modele         | LinkMe deduit sa commission SUR le prix de l'affilie       |

### Distinction MARGE vs TAXE (CRITIQUE)

|                             | Produit CATALOGUE                       | Produit AFFILIE                                                |
| --------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| **Nature**                  | L'affilie **GAGNE** une marge           | LinkMe **PRELEVE** une taxe/frais                              |
| **margin_rate**             | 1-15% (configure par affilie)           | **0% impose** (migration `20260109_003`)                       |
| **Calcul commission**       | `(selling - base) x qty`                | `selling x affiliate_commission_rate% x qty`                   |
| **Stocke dans**             | `sales_order_items.retrocession_amount` | Calcule on-the-fly depuis `products.affiliate_commission_rate` |
| **Dans linkme_commissions** | Colonne `affiliate_commission`          | Colonne `linkme_commission`                                    |
| **Beneficiaire**            | L'affilie                               | Verone                                                         |
| **Taux**                    | Configure par selection                 | Fixe par Verone a l'approbation (5/10/15%)                     |

### Workflow Produits Affilies (simple)

```
1. Affilie soumet un produit (nom, description, prix, photos)
   |
   v
2. Back-office approuve le produit
   + Fixe le taux de commission plateforme (5%, 10%, ou 15%)
   |
   v
3. Produit disponible dans le catalogue de l'affilie
```

L'approbation et la fixation du taux se font **en meme temps** (pas d'etapes separees).

---

## 5. Selections (Coeur de LinkMe)

> **La selection est l'element CENTRAL de LinkMe.** C'est depuis la selection que TOUT est calcule :
> prix de vente, commissions, retrocessions. Pas depuis la commande, pas depuis le produit.

### 5.1 Qu'est-ce qu'une Selection ?

Une selection est une **mini-boutique** creee par un affilie. Elle contient :

- Une liste de produits choisis dans le catalogue
- Des marges configurees individuellement **par produit**
- Des informations de presentation (nom, description)
- Un statut de publication (draft / active / archived)

### 5.2 Principe Fondamental : Marge par Selection

**Un meme produit peut avoir des prix differents dans differentes selections.**

```
Produit "Table basse design" (base: 100 EUR HT)

Selection A (Pokawa Restaurants):
  margin_rate = 15% -> selling_price = 117.65 EUR

Selection B (Pokawa Catering):
  margin_rate = 25% -> selling_price = 133.33 EUR

Selection C (Autre affilie):
  margin_rate = 10% -> selling_price = 111.11 EUR
```

C'est pourquoi les calculs de commission partent TOUJOURS de `linkme_selection_items`, jamais de `products` directement.

### 5.3 Creation d'une Selection

```
/ma-selection
  |
  v
Nouvelle selection (nom, description)
  |
  v
Ajout produits depuis catalogue
  |
  v
Configuration marge par produit (slider feux tricolores)
  |
  v
Publication (toggle is_public)
  |
  v
URL publique: /s/{slug}
```

### 5.4 Statuts Selection

```
draft ----------> active (publication)
  |                  |
  +---- archived <---+ (archivage)
```

### 5.5 Table `linkme_selection_items`

| Colonne            | Type    | Description                                           |
| ------------------ | ------- | ----------------------------------------------------- |
| `selection_id`     | FK      | Lien vers la selection                                |
| `product_id`       | FK      | Lien vers le produit                                  |
| `base_price_ht`    | decimal | Copie depuis `channel_pricing.public_price_ht`        |
| `margin_rate`      | decimal | Taux de marque (ex: 15.00 = 15%)                      |
| `selling_price_ht` | decimal | **GENERATED ALWAYS** = `base / (1 - margin_rate/100)` |

La colonne `selling_price_ht` est **calculee automatiquement par PostgreSQL** (GENERATED COLUMN). On ne la modifie JAMAIS directement.

### 5.6 Affichage des prix

Chaque selection a un champ `price_display_mode` :

- `'HT'` : Affiche les prix hors taxes au client
- `'TTC'` : Affiche les prix TTC au client (HT x 1.20)

Les calculs internes restent TOUJOURS en HT.

---

## 6. Taux de Marque

### Distinction Cruciale

|                 | Taux de Marque (utilise par LinkMe) | Taux de Marge                     |
| --------------- | ----------------------------------- | --------------------------------- |
| **Formule**     | `marge / prix_vente`                | `marge / prix_achat`              |
| **Calcul prix** | `selling = base / (1 - taux/100)`   | `selling = base * (1 + taux/100)` |
| **Exemple**     | base=100, taux=15% -> vente=117.65  | base=100, taux=15% -> vente=115   |

**LinkMe utilise le TAUX DE MARQUE**, pas le taux de marge. C'est une distinction fondamentale.

### Formules Officielles (SSOT)

```sql
-- Prix de vente (GENERATED COLUMN)
selling_price_ht = base_price_ht / (1 - margin_rate / 100)

-- Retrocession (gain affilie) par ligne
retrocession = selling_price_ht * (margin_rate / 100) * quantity

-- Verification
retrocession = (selling_price_ht - base_price_ht) * quantity  -- Equivalent
```

### Exemple Concret : Plateau bois 20x30

```
base_price_ht   = 20.19 EUR
margin_rate     = 15%

selling_price_ht = 20.19 / (1 - 0.15)
                 = 20.19 / 0.85
                 = 23.75 EUR

gain_affilie_ht  = 23.75 - 20.19 = 3.56 EUR
verification     = 23.75 * 15%  = 3.56 EUR (correct)

ERREUR COMMUNE : 20.19 * 15% = 3.03 EUR (FAUX - c'est un taux de marge, pas de marque)
```

### Source de Verite TypeScript

```
packages/@verone/utils/src/linkme/margin-calculation.ts     -- Fonctions
packages/@verone/utils/src/linkme/__tests__/margin-calculation.test.ts  -- Tests
packages/@verone/utils/src/linkme/constants.ts              -- Constantes
```

---

## 7. Feux Tricolores

Systeme de visualisation qui guide l'affilie dans le choix de sa marge. **Informatif, pas bloquant.**

### Calcul des Zones

```
maxMargin = (prix_plafond - prix_base_avec_commission) / prix_base_avec_commission
suggestedMargin = maxMargin / 3

VERT   : 0%              -> suggestedMargin        "Prix tres competitif"
ORANGE : suggestedMargin  -> suggestedMargin * 2    "Prix correct"
ROUGE  : suggestedMargin * 2 -> maxMargin           "Prix proche du public"
```

### Exemple

```
Prix base: 100 EUR HT
Prix public: 150 EUR HT
Commission LinkMe: 5%

Prix LinkMe = 100 * 1.05 = 105 EUR
Prix plafond = 150 * 0.95 = 142.50 EUR (buffer securite 5%)
Marge max = (142.50 - 105) / 105 = 35.7%
Marge suggeree = 35.7 / 3 = 11.9%

VERT   : 0% -> 11.9%
ORANGE : 11.9% -> 23.8%
ROUGE  : 23.8% -> 35.7%
```

### Limites Strictes (bloquantes)

| Limite            | Source            | Description          |
| ----------------- | ----------------- | -------------------- |
| `min_margin_rate` | `channel_pricing` | Minimum (defaut: 1%) |
| `max_margin_rate` | `channel_pricing` | Maximum              |

Les limites min/max **sont bloquantes** (validation Zod). Les zones couleur ne sont que des recommandations visuelles.

### Integration UI

```tsx
// Barre de progression tricolore (zones egales 33% chacune visuellement)
<div className="flex h-3 w-full overflow-hidden rounded-full">
  <div className="w-1/3 bg-green-400" />
  <div className="w-1/3 bg-orange-400" />
  <div className="w-1/3 bg-red-400" />
</div>
```

### Constantes

```typescript
// packages/@verone/utils/src/linkme/constants.ts
TRAFFIC_LIGHTS: {
  GREEN_END_MULTIPLIER: 1,
  ORANGE_END_MULTIPLIER: 2,
  RED_START_MULTIPLIER: 2,
}
```

---

## 8. Page Publique

Chaque selection publiee genere une page publique accessible sans authentification.

| Element | Detail                                          |
| ------- | ----------------------------------------------- |
| URL     | `/s/{slug}` ou `/s/{uuid}`                      |
| Acces   | Anonyme (pas de connexion requise)              |
| Contenu | Produits de la selection avec prix de l'affilie |
| Action  | Ajout au panier + checkout B2B                  |
| Panier  | `localStorage` (cote client)                    |

### Checkout

Le checkout est **B2B uniquement** :

- Formulaire entreprise (raison sociale, SIRET, etc.)
- 2 adresses : facturation + livraison
- Pas de paiement en ligne (virement bancaire)
- Creation commande en statut `draft`

---

## 9. Commandes

### 9.1 Workflow Commande

```
Page publique /s/{slug}
  |
  v
Ajout panier (localStorage)
  |
  v
Checkout (formulaire B2B + adresses)
  |
  v
Commande creee (status: draft)
  |
  v
Validation Back-Office (draft -> validated)
  |
  v
Virement bancaire recu
  |
  v
Expedition (validated -> shipped)
  = Creation commission automatique (trigger)
  = Prix figes (price locking)
  |
  v
Livraison (shipped -> delivered)
```

### 9.2 Statuts Commande

```
draft -> validated -> shipped -> delivered
           |                       |
           +------ cancelled <-----+
```

Note : `partially_shipped` existe aussi pour les livraisons partielles.

### 9.3 Numeration

Format : `LINK-NNNNNN` (ex: LINK-230019)

### 9.4 Tables

| Table               | Role                                                    |
| ------------------- | ------------------------------------------------------- |
| `sales_orders`      | Commande (header: client, statut, totaux)               |
| `sales_order_items` | Lignes commande (produit, quantite, prix, retrocession) |

---

## 10. Commissions

### 10.1 Principe

**1 commission = 1 commande**. La commission est la somme des retrocessions de chaque ligne.

**DISTINCTION FONDAMENTALE** : Il y a 2 colonnes dans `linkme_commissions` :

- `affiliate_commission` : montant HT **gagne** par l'affilie (marge sur produits catalogue)
- `linkme_commission` : montant HT **preleve** par Verone (taxe sur produits affilies)

### 10.2 Cycle de Vie Commission (DB reelle)

```sql
-- CHECK constraint: pending, validated, payable, paid, cancelled
```

```
pending (commande expediee, client n'a pas encore paye)
  |
  v
validated (client a paye -> trigger automatique)
  |
  v
payable (commission eligible au versement)
  |
  v
paid (affilie a recu son argent)

cancelled (commande annulee)
```

**Attention terminologie** :

- `validated` = le **client** a paye Verone (PAS l'affilie qui a ete paye)
- `paid` = l'**affilie** a recu son argent

### 10.3 Declenchement

La commission est creee automatiquement par le trigger `create_linkme_commission_on_order_update()` quand une commande passe au statut **`shipped`** (pas `delivered`).

### 10.4 Calcul : Formule Universelle (CASE margin_rate)

```sql
-- Pour chaque ligne de commande (sales_order_items)
CASE
  -- Produit affilie (margin_rate = 0%) : TAXE prelevee par Verone
  WHEN lsi.margin_rate = 0 THEN
    ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)

  -- Produit catalogue (margin_rate > 0%) : MARGE gagnee par l'affilie
  ELSE
    ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
END as commission
```

**Pourquoi ce CASE ?** Les produits affilies ont `margin_rate = 0%`, donc la formule standard `(selling - base) * qty` donnerait 0. Il faut utiliser `selling * 15% * qty` pour la taxe plateforme.

### 10.5 Deux Modeles de Commission (detail)

#### Produit CATALOGUE (l'affilie gagne)

```
L'affilie definit margin_rate dans sa selection.
selling_price = base_price / (1 - margin_rate / 100)   -- Taux de MARQUE
retrocession = selling_price * margin_rate / 100 * qty
-> Stocke dans linkme_commissions.affiliate_commission
```

#### Produit AFFILIE (Verone preleve)

```
L'affilie fixe son prix de vente.
margin_rate = 0% (impose par migration 20260109_003)
LinkMe preleve : commission = prix_vente * affiliate_commission_rate / 100
Payout affilie = prix_vente - commission
-> Stocke dans linkme_commissions.linkme_commission
```

### 10.6 Sources de Verite

| Donnee                     | Table                    | Colonne                                 |
| -------------------------- | ------------------------ | --------------------------------------- |
| Prix base produit          | `products`               | `price_ht`                              |
| Marge affilie (%)          | `linkme_selection_items` | `margin_rate`                           |
| Prix vente affilie         | `linkme_selection_items` | `selling_price_ht` (GENERATED)          |
| Commission par ligne       | `sales_order_items`      | `retrocession_amount`                   |
| Commission affilie (total) | `linkme_commissions`     | `affiliate_commission`                  |
| Commission Verone (total)  | `linkme_commissions`     | `linkme_commission`                     |
| Type produit               | `products`               | `created_by_affiliate` (NULL=catalogue) |

### 10.7 HT vs TTC

- **Tous les calculs** de commission sont en **HT**
- TVA = 20% pour conversion TTC
- L'affilie recoit sa commission en HT (il declare selon son regime fiscal)
- Le dashboard commissions affiche en **HT**
- Le checkout client affiche en **TTC**

### 10.8 Exemple Complet Multi-Produits

```
Panier:
1. Plateau bois x2 (catalogue, marge 15%)
   base=20.19, selling=23.75, gain=3.56 x 2 = 7.12 EUR
   -> affiliate_commission += 7.12

2. Chaise design x1 (catalogue, marge 20%)
   base=80, selling=100, gain=20 x 1 = 20 EUR
   -> affiliate_commission += 20

3. Meuble custom x1 (affilie, commission plateforme 10%)
   prix=500, commission LinkMe=50, payout=450 EUR
   -> linkme_commission += 50

Totaux:
- affiliate_commission (affilie gagne) : 7.12 + 20 = 27.12 EUR HT
- linkme_commission (Verone preleve) : 50 EUR HT
- Payout affilie produit affilie: 450 EUR HT
- Total recu affilie: 477.12 EUR HT
```

### 10.9 Constantes

```typescript
// packages/@verone/utils/src/linkme/constants.ts
PLATFORM_COMMISSION_RATE = 5; // Commission plateforme par defaut (%)
DEFAULT_TAX_RATE = 0.2; // TVA 20%
DEFAULT_AFFILIATE_PRODUCT_COMMISSION = 15; // Commission produits affilies (%)
```

---

## 11. Produits Affilies

### Workflow Detaille

```
1. Affilie soumet le produit
   - Nom, description, photos
   - Prix de vente HT
   - Dimensions (si stockage)
   |
   v
2. Back-office approuve
   + Fixe le taux commission plateforme (5%, 10%, ou 15%)
   + Le champ affiliate_payout_ht est calcule automatiquement
   (Approbation + taux = meme etape)
   |
   v
3. Produit disponible
   - L'affilie peut l'ajouter a ses selections
   - Le prix du client = prix fixe par l'affilie
   - Commission LinkMe = prix * taux commission
   - Payout affilie = prix - commission LinkMe
```

### Identification en Code

```typescript
const isAffiliateProduct = product.created_by_affiliate !== null;
```

### Colonnes Cles

| Colonne                     | Table      | Usage                                        |
| --------------------------- | ---------- | -------------------------------------------- |
| `created_by_affiliate`      | `products` | ID affilie createur (NULL = catalogue)       |
| `affiliate_commission_rate` | `products` | Taux commission plateforme (5-15%)           |
| `affiliate_payout_ht`       | `products` | Montant reverse a l'affilie apres commission |

### Contraintes DB (CRITIQUE)

```sql
-- Si produit cree par affilie, payout OBLIGATOIRE
CHECK (created_by_affiliate IS NULL) OR
      (created_by_affiliate IS NOT NULL AND affiliate_payout_ht > 0)

-- Commission rate entre 0 et 100
CHECK affiliate_commission_rate >= 0 AND affiliate_commission_rate <= 100
```

### Produits Affilies Existants (fev 2026)

| SKU      | Nom                     | Prix Vente | Commission 15% | Payout |
| -------- | ----------------------- | ---------- | -------------- | ------ |
| PRD-0132 | Poubelle a POKAWA       | 500.00     | 75.00          | 425.00 |
| PRD-0309 | Meuble TABESTO a POKAWA | 1006.14    | 150.92         | 855.22 |

---

## 12. Stockage et Facturation M3

Les affilies peuvent stocker leurs produits dans les entrepots Verone.

### Calcul Volume

```
volume_m3 = (longueur_cm / 100) * (largeur_cm / 100) * (hauteur_cm / 100)
```

Priorite : dimensions emballage > dimensions produit.

### Conditions

| Type                                            | Facturable |
| ----------------------------------------------- | ---------- |
| Produit affilie en stock (`is_in_stock = true`) | **OUI**    |
| Produit catalogue Verone                        | NON        |
| Produit sans flag stock                         | NON        |

### Tarification

- Paliers degressifs (50 EUR/m3/mois pour 0-10m3, degressif ensuite)
- Prorata temporis si debut en cours de mois
- Factures creees via API Qonto **TOUJOURS en brouillon** (jamais auto-validees)

### Workflow Facturation

```
Jour configurable (ex: le 8 du mois)
  -> Calcul volume total stocke
  -> Application paliers degressifs
  -> Prorata si necessaire
  -> Generation facture Qonto (BROUILLON)
  -> Notification dashboard + email
```

### Payeur

Le payeur est toujours l'**organisation proprietaire** du produit (pas l'user individuel).

---

## 13. Paiements

### Paiement Client -> Verone

- **Mode** : Virement bancaire (B2B, pas de paiement en ligne standard)
- **Revolut Webhooks** : Pour les paiements par carte (si actives)
  - Endpoint : `POST /api/webhook/revolut`
  - Fichier source : `apps/linkme/src/app/api/webhook/revolut/route.ts`
  - Evenement principal : `ORDER_COMPLETED`
  - Securite : HMAC-SHA256 signature verification

### Paiement Verone -> Affilie (Commissions)

```
1. Commission passe a 'payable'
2. Affilie demande versement (selection de commissions)
3. Upload facture PDF par l'affilie
4. Verone effectue virement
5. Commission passe a 'paid'
```

### Webhook Revolut : Workflow ORDER_COMPLETED

```
Reception webhook
  -> Verification signature (revolut-signature header)
  -> Recuperation details commande Revolut API
  -> Extraction metadata (affiliate_id, selection_id)
  -> Creation sales_order (status: confirmed, payment: paid)
  -> Creation commission (status: pending)
```

### Types d'Evenements Revolut

| Evenement                | Description                     | Action                         |
| ------------------------ | ------------------------------- | ------------------------------ |
| `ORDER_COMPLETED`        | Paiement confirme et capture    | Creation commande + commission |
| `ORDER_AUTHORISED`       | Paiement autorise (pre-capture) | Log uniquement                 |
| `ORDER_PAYMENT_DECLINED` | Paiement refuse                 | Log pour analyse               |
| `ORDER_PAYMENT_FAILED`   | Echec technique                 | Log + notification eventuelle  |
| `ORDER_CANCELLED`        | Commande annulee                | Annulation commande en attente |

### Retry Policy (cote Revolut)

Revolut retente automatiquement les webhooks en cas d'echec (5xx) :

- 1ere retry: 5 min
- 2eme retry: 30 min
- 3eme retry: 2h
- Max: 24h

---

## 14. Price Locking

### Probleme Resolu

Si on modifie `channel_pricing`, les GENERATED COLUMNS de `linkme_selection_items` se recalculent. Sans protection, cela affecterait les commandes deja expediees.

### Solution : Colonnes `_locked`

```sql
sales_order_items:
  base_price_ht_locked     -- Prix achat fige a l'expedition
  selling_price_ht_locked  -- Prix vente fige a l'expedition
```

### Trigger Automatique

Quand une commande passe a `shipped` ou `delivered`, le trigger `lock_prices_on_order_validation()` copie les prix actuels dans les colonnes `_locked`.

### Securite

```
channel_pricing (modifiable a tout moment)
  -> linkme_selection_items.selling_price_ht (recalcule automatiquement)
  -> sales_order_items._locked (FIGE, ne change JAMAIS apres shipping)
  -> retrocession_amount (STOCKE, pas recalcule automatiquement)
```

**Modifier `channel_pricing` est SANS RISQUE** pour les commandes passees car :

1. `retrocession_amount` est une valeur stockee (pas recalculee)
2. Les colonnes `_locked` conservent le snapshot au moment du shipping
3. Le trigger commission ne se declenche que sur changement de statut

### Workflow Correction de Prix

Si un prix est errone dans une commande specifique :

1. Corriger `channel_pricing.public_price_ht` (source de verite catalogue)
2. Le trigger propage vers `linkme_selection_items`
3. Recalculer `retrocession_amount` UNIQUEMENT pour la commande ciblee
4. Re-locker la commande corrigee
5. Ne JAMAIS recalculer en batch toutes les commandes

### Locking Retroactif (commandes historiques)

**Contexte** : 118/121 commandes shipped creees AVANT les migrations de price locking avaient `_locked = NULL`.

**Migration appliquee** :

```sql
-- Lock retroactif des commandes shipped non-lockees
UPDATE sales_order_items soi
SET
  base_price_ht_locked = COALESCE(lsi.base_price_ht, soi.unit_price_ht),
  selling_price_ht_locked = soi.unit_price_ht
FROM sales_orders so
LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
WHERE so.id = soi.sales_order_id
  AND so.status = 'shipped'
  AND soi.base_price_ht_locked IS NULL;
```

**Verification** :

```sql
SELECT COUNT(*) as commandes_non_lockees
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
WHERE so.status = 'shipped'
  AND soi.base_price_ht_locked IS NULL;
-- Doit retourner 0
```

---

## 15. Roadmap Particuliers

### Concept

Permettre a des **particuliers** (non professionnels) d'utiliser LinkMe. Pas lie a une enseigne ni a une organisation.

### Implications Techniques

| Aspect                  | Impact                                                                          |
| ----------------------- | ------------------------------------------------------------------------------- |
| **Nouveau role**        | `particulier` dans `user_app_roles`                                             |
| **Contrainte XOR**      | Modification : `enseigne_id` ET `organisation_id` deviennent TOUS DEUX nullable |
| **Nouveau pattern**     | Affilie sans enseigne et sans org = creation directe de selection               |
| **`linkme_affiliates`** | Ajout possible d'un `user_id` direct (ou autre mecanisme de liaison)            |
| **RLS**                 | Nouvelles policies pour isoler les donnees particuliers                         |
| **Facturation**         | Regime particulier different du B2B (TVA, factures)                             |
| **Commande**            | Potentiellement B2C (pas seulement B2B)                                         |

### Ce qui Change

```
AVANT (actuel):
  user_app_roles -> enseigne_id OU organisation_id (XOR obligatoire)
  linkme_affiliates -> enseigne_id OU organisation_id (XOR obligatoire)

APRES (avec particuliers):
  user_app_roles -> enseigne_id OU organisation_id OU aucun (pour particulier)
  linkme_affiliates -> enseigne_id OU organisation_id OU user_id direct
```

### Statut

**Non implemente**. Documenter maintenant pour anticiper les implications techniques lors du developpement.

---

## 16. Glossaire

| Terme                     | Definition                                                                    |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Affilie**               | Profil business d'une enseigne/organisation dans LinkMe (`linkme_affiliates`) |
| **affiliate_commission**  | Montant HT **gagne** par l'affilie (marge sur produits catalogue)             |
| **Base price**            | Prix d'achat HT du produit (depuis `channel_pricing`)                         |
| **Channel pricing**       | Table des prix par canal de vente (LinkMe = canal specifique)                 |
| **Commission plateforme** | Pourcentage preleve par Verone sur les ventes (5% par defaut)                 |
| **Enseigne**              | Chaine de magasins avec plusieurs points de vente (ex: Pokawa)                |
| **Feux tricolores**       | Indicateur visuel vert/orange/rouge pour guider le choix de marge             |
| **linkme_commission**     | Montant HT **preleve** par Verone (taxe sur produits affilies)                |
| **Margin rate**           | Taux de MARQUE (sur prix de vente), PAS taux de marge (sur cout)              |
| **Org independante**      | Organisation professionnelle sans enseigne parente                            |
| **Ownership type**        | Type de point de vente : `propre` (succursale) ou `franchise`                 |
| **Particulier**           | (FUTUR) Individu non professionnel utilisant LinkMe                           |
| **Price locking**         | Mecanisme qui fige les prix au moment de l'expedition                         |
| **Retrocession**          | Montant gagne par l'affilie sur une ligne de commande                         |
| **Selection**             | Mini-boutique creee par un affilie avec ses produits et marges                |
| **Selling price**         | Prix de vente HT configure par l'affilie (inclut sa marge)                    |
| **Slug**                  | Identifiant URL-friendly d'une selection (ex: `/s/pokawa-mobilier`)           |
| **Taux de marque**        | `marge / prix_vente` - Utilise par LinkMe (different de taux de marge)        |
| **Taux de marge**         | `marge / prix_achat` - PAS utilise par LinkMe                                 |
| **Utilisateur LinkMe**    | Personne avec `user_app_roles` (app='linkme')                                 |
| **XOR**                   | Contrainte : exactement un des deux champs doit etre renseigne                |

---

## 17. Routing Page Publique

### Contexte

Les selections LinkMe sont accessibles publiquement via 2 formats d'URL :

- `/s/{uuid}` - Format UUID (retrocompatibilite, rare)
- `/s/{slug}` - Format slug (SEO-friendly, cas principal)

### RPCs Disponibles

| RPC                                         | Parametre | Usage          |
| ------------------------------------------- | --------- | -------------- |
| `get_public_selection(p_selection_id uuid)` | UUID      | Acces par UUID |
| `get_public_selection_by_slug(p_slug text)` | Slug      | Acces par slug |

### Logique de Detection (CRITIQUE - Code OBLIGATOIRE)

```typescript
// OBLIGATOIRE : Detecter UUID vs slug AVANT d'appeler Supabase
const isUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const { data, error } = await supabase.rpc(
  isUuid ? 'get_public_selection' : 'get_public_selection_by_slug',
  isUuid ? { p_selection_id: id } : { p_slug: id }
);
```

### INTERDIT

```typescript
// NE FONCTIONNE QUE AVEC UUID, CASSE LES SLUGS
.from('linkme_selections')
.eq('id', id)  // id peut etre un slug, pas un UUID
```

### Historique Regressions

| Date       | Commit     | Regression                                      | Fix                                    |
| ---------- | ---------- | ----------------------------------------------- | -------------------------------------- |
| 2026-02-09 | `fa2cc973` | Suppression detection UUID/slug -> slugs casses | Restauration logique commit `3c8d51da` |

### Migrations DB

- `20251223_002_get_selection_by_slug.sql` - Creation RPC slug
- `20260109_008_add_branding_to_public_selection_rpc.sql` - Update RPC UUID

---

## 18. Schema DB Complet

### 18.1 `sales_orders` (commandes)

| Colonne                   | Type    | Description                                 |
| ------------------------- | ------- | ------------------------------------------- |
| `id`                      | uuid PK | Identifiant commande                        |
| `order_number`            | text    | Format LINK-NNNNNN                          |
| `status`                  | text    | draft/validated/shipped/delivered/cancelled |
| `payment_status_v2`       | text    | pending/paid/refunded                       |
| `linkme_selection_id`     | uuid FK | Selection d'origine                         |
| `created_by_affiliate_id` | uuid FK | Affilie qui a genere la commande            |
| `customer_id`             | uuid FK | Client (entreprise B2B)                     |
| `total_ht`                | decimal | Total HT commande                           |
| `total_ttc`               | decimal | Total TTC commande                          |

### 18.2 `sales_order_items` (lignes commande)

| Colonne                    | Type    | Description                           |
| -------------------------- | ------- | ------------------------------------- |
| `id`                       | uuid PK | Identifiant ligne                     |
| `sales_order_id`           | uuid FK | Commande parent                       |
| `product_id`               | uuid FK | Produit                               |
| `linkme_selection_item_id` | uuid FK | Item selection (pour retrouver marge) |
| `quantity`                 | integer | Quantite commandee                    |
| `unit_price_ht`            | decimal | Prix unitaire HT                      |
| `retrocession_amount`      | decimal | Commission affilie pour cette ligne   |
| `base_price_ht_locked`     | decimal | Prix achat fige (price locking)       |
| `selling_price_ht_locked`  | decimal | Prix vente fige (price locking)       |

### 18.3 `sales_order_linkme_details` (details LinkMe)

| Colonne          | Type    | Description                       |
| ---------------- | ------- | --------------------------------- |
| `id`             | uuid PK | Identifiant                       |
| `sales_order_id` | uuid FK | Commande                          |
| `requester_*`    | text    | Coordonnees du demandeur          |
| `owner_*`        | text    | Coordonnees du responsable/gerant |
| `billing_*`      | text    | Adresse de facturation            |
| `reception_*`    | text    | Adresse de livraison              |

### 18.4 `linkme_commissions` (commissions)

| Colonne                    | Type           | Description                                              |
| -------------------------- | -------------- | -------------------------------------------------------- |
| `id`                       | uuid PK        | Identifiant commission                                   |
| `order_id`                 | uuid FK UNIQUE | Commande (1 commission par commande)                     |
| `affiliate_id`             | uuid FK        | Affilie concerne                                         |
| `affiliate_commission`     | decimal        | Montant HT gagne par l'affilie (marge catalogue)         |
| `affiliate_commission_ttc` | decimal        | Idem en TTC                                              |
| `linkme_commission`        | decimal        | Montant HT preleve par Verone (taxe produits affilies)   |
| `margin_rate_applied`      | decimal        | Taux marge applique (decimal : 0.15 = 15%)               |
| `linkme_rate_applied`      | decimal        | Taux taxe applique (decimal)                             |
| `status`                   | text           | CHECK `pending / validated / payable / paid / cancelled` |

### 18.5 `linkme_selection_items` (items selection)

| Colonne            | Type    | Description                                           |
| ------------------ | ------- | ----------------------------------------------------- |
| `id`               | uuid PK | Identifiant                                           |
| `selection_id`     | uuid FK | Selection parente                                     |
| `product_id`       | uuid FK | Produit                                               |
| `base_price_ht`    | decimal | Prix achat (copie depuis `channel_pricing`)           |
| `margin_rate`      | decimal | Taux de marque (15.00 = 15%)                          |
| `selling_price_ht` | decimal | **GENERATED ALWAYS** : `base / (1 - margin_rate/100)` |

---

## 19. Formulaire Commande (4 Steps)

Le formulaire de commande LinkMe est en **4 etapes** :

### Step 1 : Requester (Demandeur)

Qui passe la commande :

- Nom, prenom
- Email, telephone
- Societe (optionnel pour particuliers futurs)

### Step 2 : Owner (Responsable/Gerant)

Le responsable de l'organisation qui recoit la commande :

- Auto-rempli depuis le contact de l'organisation (si franchise) ou de l'enseigne (si propre)
- Modifiable par le demandeur
- Nom, prenom, email, telephone

**Regle contacts** (rappel section 3.5) :

| Type organisation | Owner pre-rempli depuis       |
| ----------------- | ----------------------------- |
| Propre/Succursale | Contact de l'**enseigne**     |
| Franchise         | Contact de l'**organisation** |

### Step 3 : Billing (Facturation)

Adresse de facturation :

- Raison sociale
- Adresse complete (rue, CP, ville, pays)
- SIRET / TVA intracommunautaire

### Step 4 : Reception (Livraison)

Adresse de livraison :

- Possibilite "identique a facturation"
- Sinon adresse differente
- Instructions de livraison (optionnel)

### Stockage

Les 4 steps sont stockes dans `sales_order_linkme_details` (voir section 18.3).

---

## 20. Workflow Verification Factures

### Contexte

Verification des factures LinkMe pour aligner Bubble (source de verite historique) avec Supabase (base de donnees actuelle).

**Regle absolue** : On ne passe a la facture suivante QUE si commission DB = commission Bubble (au centime pres).

### Les 5 Etapes (NON NEGOCIABLES)

#### Etape 1 : Lire Facture Bubble

Ouvrir PDF Bubble via Playwright (MCP), noter LIGNE PAR LIGNE :

- Code produit, designation, quantite, prix unitaire HT, total ligne HT
- Total commande HT
- Commission attendue (fournie par Romeo)

#### Etape 2 : Comparer avec DB

**CRITIQUE** : Comparer avec `linkme_selection_items.selling_price_ht`, **PAS** `sales_order_items.unit_price_ht`.

```sql
SELECT
  p.sku, p.name as produit,
  soi.quantity as qty,
  lsi.selling_price_ht as prix_db,
  lsi.base_price_ht, lsi.margin_rate
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
JOIN products p ON p.id = soi.product_id
LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
WHERE so.order_number = 'LINK-XXXXXX'
ORDER BY p.sku;
```

#### Etape 3 : Corriger Prix SOURCE (channel_pricing)

Pour chaque produit divergent :

1. Calculer prix d'achat cible : `base_price_ht_cible = prix_bubble x (1 - margin_rate/100)`
2. Verifier prix actuel dans `channel_pricing`
3. Modifier prix SOURCE si ecart
4. Verifier propagation automatique vers `linkme_selection_items`

#### Etape 4 : Recalculer Commission

```sql
-- Verification : ecart DOIT = 0.00
WITH commission_calculee AS (
  SELECT so.order_number,
    SUM(
      CASE
        WHEN lsi.margin_rate = 0 THEN ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
        WHEN soi.linkme_selection_item_id IS NOT NULL
        THEN ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
        ELSE 0
      END
    ) as commission_db
  FROM sales_order_items soi
  JOIN sales_orders so ON so.id = soi.sales_order_id
  LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
  WHERE so.order_number = 'LINK-XXXXXX'
  GROUP BY so.order_number
)
SELECT order_number, commission_db, XXX.XX as commission_bubble,
  XXX.XX - commission_db as ecart
FROM commission_calculee;
```

#### Etape 5 : Recalculer `retrocession_amount`

**SEULEMENT apres Etape 4 validee** (ecart = 0.00) :

```sql
UPDATE sales_order_items soi
SET retrocession_amount = CASE
  WHEN lsi.margin_rate = 0 THEN ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
  ELSE ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
END
FROM linkme_selection_items lsi
WHERE lsi.id = soi.linkme_selection_item_id
  AND soi.sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'LINK-XXXXXX');
```

### Items Orphelins (linkme_selection_item_id = NULL)

Si un item n'a pas de lien vers `linkme_selection_items` :

1. Verifier si produit existe dans la selection
2. Si non, creer l'entree manquante dans `linkme_selection_items`
3. Lier l'item orphelin
4. Retour Etape 5 pour recalcul

---

## 21. Traitement Factures F-25-XXX

### Contexte

Les factures fournisseur arrivent avec des numeros au format `LINK-NNNNNN` (commandes) mais doivent etre enregistrees sous le format `F-25-XXX` (factures internes).

### Workflow

```
1. Reception facture PDF du fournisseur
   |
   v
2. Mapping : identifier commande LINK-NNNNNN correspondante
   |
   v
3. Verification items : SKU produit, quantite, prix unitaire
   |
   v
4. Saisie dans le systeme en tant que F-25-XXX
   |
   v
5. Reconciliation : lier facture a la commande
```

### Mapping SKU

Les produits dans les factures Bubble utilisent des codes internes (LINK2, LINK6, etc.) qui doivent etre mappes aux SKU Supabase (COU-0008, SUS-0003, etc.).

### Regles de Reconciliation

- Chaque facture F-25-XXX correspond a une commande LINK-NNNNNN
- Le total HT de la facture doit correspondre au total de la commande
- Les quantites et prix unitaires doivent etre identiques
- En cas d'ecart, suivre le workflow de verification (section 20)

---

## Donnees de Reference (fev 2026)

| Element             | Valeur                                               |
| ------------------- | ---------------------------------------------------- |
| Pokawa affiliate_id | `cdcb3238-0abd-4c43-b1fa-11bb633df163`               |
| Pokawa selection_id | `b97bbc0e-1a5e-4bce-b628-b3461bfadbd7` (41 produits) |
| LinkMe channel_id   | `93c68db1-5a30-4168-89ec-6383152be405`               |
| Nombre commissions  | ~99 (toutes Pokawa)                                  |
| Nombre commandes    | ~100                                                 |
| Nombre items        | ~355 (347 catalogue + 8 affilie)                     |

---

## Fichiers Cles

### App LinkMe

```
apps/linkme/src/
  contexts/AuthContext.tsx              -- Auth + linkMeRole + initializing
  lib/hooks/use-user-selection.ts      -- Liaison user -> affiliate
  lib/hooks/use-affiliate-*.ts         -- Hooks affilies
  lib/hooks/use-order-form.ts          -- Formulaire commande + contacts
  components/commissions/              -- Composants commissions
  app/(main)/layout.tsx                -- Layout authentifie
  app/api/webhook/revolut/route.ts     -- Webhook paiements
```

### CMS Back-Office

```
apps/back-office/src/app/canaux-vente/linkme/
  layout.tsx                           -- Layout sidebar
  components/LinkMeSidebar.tsx         -- Navigation
  hooks/use-linkme-*.ts                -- Hooks CMS
  utilisateurs/                        -- Gestion users LinkMe
  commandes/[id]/page.tsx              -- Detail commande
```

### Packages Partages

```
packages/@verone/utils/src/linkme/
  margin-calculation.ts                -- SSOT calculs marges
  constants.ts                         -- Constantes centralisees
  __tests__/margin-calculation.test.ts -- Tests unitaires
```

---

## Vues SQL Importantes

| Vue                           | Description                                     |
| ----------------------------- | ----------------------------------------------- |
| `linkme_order_items_enriched` | Items commande avec marge calculee correctement |
| `linkme_orders_with_margins`  | Commandes avec marge totale                     |
| `linkme_orders_enriched`      | Commandes avec infos client/affilie             |

---

## Regles Absolues

1. **JAMAIS** confondre taux de marque et taux de marge
2. **TOUJOURS** utiliser `selling_price_ht` pour calcul commission (pas `base_price`)
3. **JAMAIS** acceder aux affiliates sans passer par `user_app_roles`
4. **TOUJOURS** verifier la contrainte XOR (`enseigne_id` / `organisation_id`)
5. **JAMAIS** supposer qu'il existe `linkme_affiliates.user_id` (colonne supprimee)
6. **TOUJOURS** utiliser `initializing` (pas `loading`) dans `useAuth()`
7. **JAMAIS** recalculer en batch toutes les commissions apres changement catalogue
8. **TOUJOURS** verifier les prix avec les **factures PDF** (pas l'icone oeil Bubble)
9. **TOUJOURS** utiliser la formule CASE `margin_rate=0` pour produits affilies
10. **JAMAIS** confondre `affiliate_commission` (affilie gagne) et `linkme_commission` (Verone preleve)

---

_Source : Consolidation de toute la documentation LinkMe existante (fev 2026)_
_Prochaine revision : A chaque changement architectural majeur_
