# Analyse Complète LinkMe MVP Bubble (applinkme.bubbleapps.io)

**Date d'analyse** : 2025-12-01
**URL** : https://applinkme.bubbleapps.io
**Compte test** : contact@link-me.fr (Enseigne POKAWA)

---

## 1. CONCEPT LINKME MVP

### 1.1 Vision Globale

LinkMe est une **plateforme B2B2C d'affiliation** permettant aux **enseignes** (franchises, chaînes de restaurants, etc.) de proposer un catalogue de produits déco/mobilier à leurs **shops** (points de vente franchisés ou propres).

### 1.2 Modèle Économique

```
FOURNISSEUR (Vérone)
    ↓ Catalogue produits avec PAHT (Prix Achat HT)
ENSEIGNE (ex: POKAWA)
    ↓ Sélectionne produits + applique Tx de Marque (marge)
    ↓ = PVHT (Prix Vente HT)
SHOPS (149 points de vente)
    ↓ Commandent depuis la sélection de l'enseigne
CLIENTS FINAUX
    ↓ Réception commande
ENSEIGNE
    ↓ Perçoit commission sur chaque vente
```

### 1.3 Acteurs et Rôles

| Acteur             | Rôle                                        | Exemple                         |
| ------------------ | ------------------------------------------- | ------------------------------- |
| **Vérone**         | Admin plateforme, catalogue produits        | -                               |
| **Enseigne**       | Gestionnaire marque, définit marges         | POKAWA (149 shops)              |
| **User Enseigne**  | Employés enseigne (commandes, rémunération) | 9 users type "Enseigne"         |
| **Shop Franchise** | Point de vente franchisé, passe commandes   | 3 users type "Shop - Franchise" |
| **Shop Propre**    | Point de vente propriétaire                 | 0 users actuellement            |
| **Architecte**     | Rôle spécial (décorateur ?)                 | 1 user                          |

---

## 2. STRUCTURE NAVIGATION MVP

### 2.1 Menu Principal (Sidebar)

```
Enseigne (POKAWA logo)
├── Mes informations
│   ├── Mon enseigne      → Dashboard KPIs
│   ├── Mes shops         → Gestion points de vente
│   └── Ma sélection      → Produits sélectionnés + marges
├── Catalogue             → Catalogue produits fournisseur
├── Commandes             → Liste commandes shops
├── Users                 → Gestion utilisateurs
└── Rémunération          → Commissions et paiements
```

---

## 3. FONCTIONNALITÉS DÉTAILLÉES

### 3.1 CATALOGUE (Produits Fournisseur)

**Localisation** : Menu → Catalogue

**Fonctionnalités** :

- Grille catégories (Coussins, Mobilier, Décorations, Tapis, Vases, Bougies, etc.)
- Liste produits avec :
  - Image produit
  - Nom produit
  - Stock disponible
  - Prix HT
  - Fournisseur
- Recherche par nom
- Filtre par fournisseur
- Modal détail produit :
  - Grande image
  - Description complète
  - Prix HT
  - **Bouton "Ajouter à ma sélection"**

**Screenshot** : `linkme-mvp-02-produits-liste.png`, `linkme-mvp-03-produit-detail.png`

---

### 3.2 MA SÉLECTION (Produits Enseigne)

**Localisation** : Mes informations → Ma sélection

**Concept** : L'enseigne sélectionne des produits du catalogue et définit ses marges.

**Colonnes** :
| Colonne | Description |
|---------|-------------|
| Image | Miniature produit |
| Nom | Nom du produit |
| PAHT | Prix Achat HT (prix fournisseur) |
| **Tx de Marque** | Taux de marge (%, éditable) - Défaut: 15% |
| PVHT | Prix Vente HT (calculé: PAHT + marge) |
| Supprimer | Retirer de la sélection |

**Calcul Marge** :

```
PVHT = PAHT × (1 + Tx de Marque / 100)
Exemple: PAHT 245€ × 1.15 = PVHT 281.75€
```

**Fonctionnalités** :

- Recherche produits
- Modification Tx de Marque par produit
- Suppression de la sélection
- Pagination ("Voir plus")

**Screenshot** : `linkme-mvp-10-ma-selection.png`

---

### 3.3 MON ENSEIGNE (Dashboard KPIs)

**Localisation** : Mes informations → Mon enseigne

**KPIs Affichés** :
| KPI | Description | Exemple |
|-----|-------------|---------|
| Nombre de commandes | Total commandes période | 122 |
| Total CA HT | Chiffre d'affaires | 32 949€ |
| Total Commissions | Commissions générées | 4 942€ |
| Commissions payables | À percevoir | 1 648€ |

**Filtres** :

- Année (dropdown)
- Mois (dropdown)

**Sections** :

1. **KPIs Cards** (4 métriques)
2. **Meilleures ventes** - Top produits vendus
3. **Liste commandes récentes** - Preview avec colonnes :
   - Date
   - N° commande
   - Montant HT
   - Marge Enseigne
   - Status (badge)
   - Actions

**Screenshot** : `linkme-mvp-05-enseigne-dashboard.png`

---

### 3.4 MES SHOPS (Gestion Points de Vente)

**Localisation** : Mes informations → Mes shops

**Fonctionnalités** :

- **Ajouter un shop** (bouton création)
- Recherche par nom de shop
- Filtre par statut shop (combobox)
- Liste shops avec :
  - Logo shop
  - Nom shop
  - Type : **Propre** ou **Franchise** (badges)
  - Bouton "Modifier"
  - Bouton "Supprimer"
- Pagination ("Voir plus")

**Types de Shops** :
| Type | Description |
|------|-------------|
| **Propre** | Shop détenu par l'enseigne |
| **Franchise** | Shop indépendant sous licence |

**Exemple** :

- Pokawa Commerce - Paris 15 (Propre)
- Pokawa Boulogne (Franchise)

**Screenshot** : `linkme-mvp-11-mes-shops.png`

---

### 3.5 COMMANDES

**Localisation** : Menu → Commandes

**Workflow Commandes** :

```
A valider → A traiter → Attente de paiement → A expédier → Archivée
                                                      └→ Refusée
```

**Statuts** (Onglets) :
| Statut | Description |
|--------|-------------|
| **A valider** | Commande reçue, en attente validation |
| **A traiter** | Validée, en préparation |
| **Attente de paiement** | En attente paiement client |
| **A expédier** | Payée, prête à expédier |
| **Archivée** | Commande terminée/livrée |
| **Refusée** | Commande refusée |

**Colonnes Liste** :
| Colonne | Description |
|---------|-------------|
| Date | Date commande |
| N° commande | Référence unique |
| Montant HT | Montant total |
| Marge Enseigne | Commission enseigne |
| Status | Badge statut |
| Actions | Voir détail |

**Vue Admin** (détail) :

- Informations commande complètes
- Client / Shop
- Adresse livraison
- Liste produits avec quantités
- Actions (valider, refuser, etc.)

**Screenshot** : `linkme-mvp-06-commandes-liste.png`, `linkme-mvp-07-commandes-admin.png`

---

### 3.6 USERS (Gestion Utilisateurs)

**Localisation** : Menu → Users

**Types d'Utilisateurs** :
| Type | Compte | Description |
|------|--------|-------------|
| **Enseigne** | 9 | Accès complet enseigne (dashboard, sélection, commandes) |
| **Shop - Franchise** | 3 | Accès shops franchisés uniquement |
| **Shop - Propre** | 0 | Accès shops propres |
| **Architecte** | 1 | Rôle spécial (décorateur ?) |

**Colonnes** :
| Colonne | Description |
|---------|-------------|
| Nom / Prénom | Identité utilisateur |
| Type de user | Rôle (Enseigne, Shop, Architecte) |
| Email | Adresse email |
| Liste de shops | Shops associés (pour type Shop) |
| Actions | Modifier |

**Fonctionnalités** :

- **Ajouter un utilisateur** (bouton)
- Pagination (10/20 éléments)
- Modification user
- Association user ↔ shops (pour Shop - Franchise)

**Screenshot** : `linkme-mvp-12-users-list.png`

---

### 3.7 RÉMUNÉRATION (Commissions)

**Localisation** : Menu → Rémunération

**Workflow Commissions** :

```
En attente → Payables → En cours de règlement → Payées
```

**Onglets** :
| Onglet | Description |
|--------|-------------|
| **En attente** | Commissions non encore payables |
| **Payables** | Commissions éligibles au paiement |
| **En cours de règlement** | Demande de paiement soumise |
| **Payées** | Commissions versées |

**Colonnes** :
| Colonne | Description |
|---------|-------------|
| N° Commande | Référence commande |
| Montant HT | Montant commande |
| Marge Enseigne | Commission à percevoir |
| Date | Date commande |
| Statut | Badge (En attente, Payables, etc.) |

**Actions** :

- Bouton **"Percevoir"** (onglet Payables) → Soumettre demande paiement

**Screenshot** : `linkme-mvp-08-remuneration.png`, `linkme-mvp-09-remuneration-payables.png`

---

## 4. COMPARAISON MVP BUBBLE vs NOUVELLE IMPLÉMENTATION

### 4.1 Structure App LinkMe (apps/linkme)

**Pages Actuelles** :

```
apps/linkme/src/app/
├── page.tsx                        → Homepage
├── login/page.tsx                  → Connexion
├── [affiliateSlug]/
│   ├── page.tsx                    → Page affilié
│   └── [selectionSlug]/page.tsx    → Sélection produits
├── cart/page.tsx                   → Panier
├── checkout/page.tsx               → Validation commande
├── confirmation/page.tsx           → Confirmation commande
├── ventes/page.tsx                 → Liste ventes
├── commissions/page.tsx            → Commissions
├── statistiques/page.tsx           → Statistiques
└── api/
    ├── create-order/route.ts       → API création commande
    └── webhook/revolut/route.ts    → Webhook paiement
```

### 4.2 Tableau Comparatif Fonctionnalités

| Fonctionnalité MVP        | Status Nouvelle App  | Notes                      |
| ------------------------- | -------------------- | -------------------------- |
| **CATALOGUE**             |                      |                            |
| Grille catégories         | ❌ À implémenter     | Via CMS back-office        |
| Liste produits            | ✅ Partiellement     | `[affiliateSlug]/page.tsx` |
| Recherche produits        | ❌ À vérifier        |                            |
| Filtre fournisseur        | ❌ Non pertinent     | Vérone = seul fournisseur  |
| Modal détail produit      | ❌ À implémenter     |                            |
| Ajouter à sélection       | ❌ À implémenter     |                            |
| **MA SÉLECTION**          |                      |                            |
| Liste sélection           | ✅ `[selectionSlug]` | Page sélection             |
| Édition Tx de Marque      | ❌ À implémenter     | Critique pour modèle éco   |
| Calcul PVHT automatique   | ❌ À implémenter     |                            |
| Suppression sélection     | ❌ À implémenter     |                            |
| **MON ENSEIGNE**          |                      |                            |
| Dashboard KPIs            | ✅ `statistiques/`   | Page statistiques          |
| Filtres année/mois        | ❌ À vérifier        |                            |
| Meilleures ventes         | ❌ À implémenter     |                            |
| Liste commandes récentes  | ✅ `ventes/`         | Page ventes                |
| **MES SHOPS**             |                      |                            |
| Liste shops               | ❌ À implémenter     | Non présent                |
| Création shop             | ❌ À implémenter     |                            |
| Types Propre/Franchise    | ❌ À implémenter     |                            |
| **COMMANDES**             |                      |                            |
| Liste commandes           | ✅ `ventes/`         | Partiellement              |
| Workflow statuts          | ❌ À vérifier        | 6 statuts MVP              |
| Détail commande           | ❌ À vérifier        |                            |
| Actions (valider/refuser) | ❌ À implémenter     |                            |
| **USERS**                 |                      |                            |
| Liste utilisateurs        | ❌ À implémenter     | Non présent                |
| Types users               | ❌ À implémenter     | Enseigne/Shop/Architecte   |
| Association user-shops    | ❌ À implémenter     |                            |
| Création user             | ❌ À implémenter     |                            |
| **RÉMUNÉRATION**          |                      |                            |
| Liste commissions         | ✅ `commissions/`    | Page commissions           |
| Workflow paiement         | ❌ À vérifier        | 4 statuts MVP              |
| Bouton "Percevoir"        | ❌ À implémenter     |                            |
| **PANIER/CHECKOUT**       |                      |                            |
| Panier                    | ✅ `cart/`           | Page panier                |
| Checkout                  | ✅ `checkout/`       | Page checkout              |
| Confirmation              | ✅ `confirmation/`   | Page confirmation          |
| Webhook Revolut           | ✅ API               | Paiement intégré           |

### 4.3 Fonctionnalités Manquantes Critiques

#### P0 - Bloquantes

1. **Gestion Sélection + Marges** - Core business model
2. **Gestion Shops** (Propre/Franchise) - Multi-tenant
3. **Workflow Commandes Complet** (6 statuts)
4. **Gestion Users + Rôles**

#### P1 - Importantes

5. **Dashboard KPIs Enseigne** avec filtres
6. **Meilleures ventes**
7. **Workflow Rémunération** (4 statuts + "Percevoir")

#### P2 - Nice-to-have

8. **Recherche/Filtres catalogue**
9. **Association User ↔ Shops**

---

## 5. ARCHITECTURE DATABASE REQUISE

### 5.1 Tables Existantes Utilisables

| Table               | Usage LinkMe                  |
| ------------------- | ----------------------------- |
| `organisations`     | Enseignes                     |
| `products`          | Catalogue produits            |
| `sales_orders`      | Commandes                     |
| `sales_order_items` | Lignes commandes              |
| `affiliate_sales`   | Ventes affiliés (commissions) |
| `sales_channels`    | Canal "linkme"                |

### 5.2 Tables À Créer/Enrichir

```sql
-- Table Shops (points de vente)
CREATE TABLE linkme_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enseigne_id UUID REFERENCES organisations(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('propre', 'franchise')),
  logo_url TEXT,
  address JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table Sélection Enseigne (produits + marges)
CREATE TABLE linkme_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enseigne_id UUID REFERENCES organisations(id),
  product_id UUID REFERENCES products(id),
  margin_rate DECIMAL(5,2) DEFAULT 15.00, -- Tx de Marque %
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enseigne_id, product_id)
);

-- Table Users LinkMe (extension users existants)
CREATE TABLE linkme_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  enseigne_id UUID REFERENCES organisations(id),
  user_type VARCHAR(20) CHECK (user_type IN ('enseigne', 'shop_franchise', 'shop_propre', 'architecte')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table Association Users ↔ Shops
CREATE TABLE linkme_user_shops (
  user_id UUID REFERENCES linkme_users(id),
  shop_id UUID REFERENCES linkme_shops(id),
  PRIMARY KEY (user_id, shop_id)
);

-- Table Commissions/Rémunérations
CREATE TABLE linkme_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES sales_orders(id),
  enseigne_id UUID REFERENCES organisations(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) CHECK (status IN ('en_attente', 'payable', 'en_cours_reglement', 'payee')),
  payment_requested_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. SCREENSHOTS CAPTURÉS

| Fichier                                   | Description                          |
| ----------------------------------------- | ------------------------------------ |
| `linkme-mvp-01-catalogue.png`             | Grille catégories                    |
| `linkme-mvp-02-produits-liste.png`        | Liste produits avec recherche        |
| `linkme-mvp-03-produit-detail.png`        | Modal détail produit                 |
| `linkme-mvp-04-menu-navigation.png`       | Menu sidebar complet                 |
| `linkme-mvp-05-enseigne-dashboard.png`    | Dashboard KPIs POKAWA                |
| `linkme-mvp-06-commandes-liste.png`       | Liste commandes                      |
| `linkme-mvp-07-commandes-admin.png`       | Vue admin commandes                  |
| `linkme-mvp-08-remuneration.png`          | Tab "En attente"                     |
| `linkme-mvp-09-remuneration-payables.png` | Tab "Payables" avec bouton Percevoir |
| `linkme-mvp-10-ma-selection.png`          | Sélection avec Tx de Marque          |
| `linkme-mvp-11-mes-shops.png`             | Liste shops Propre/Franchise         |
| `linkme-mvp-12-users-list.png`            | Liste utilisateurs par type          |

**Localisation** : `.playwright-mcp/`

---

## 7. RECOMMANDATIONS

### 7.1 Priorité Immédiate

1. **Implémenter Gestion Sélection** (Ma sélection)
   - CRUD produits sélectionnés
   - Édition Tx de Marque par produit
   - Calcul automatique PVHT

2. **Créer Gestion Shops**
   - CRUD shops
   - Types Propre/Franchise
   - Association enseigne

3. **Enrichir Dashboard Enseigne**
   - 4 KPIs (commandes, CA, commissions, payables)
   - Filtres année/mois
   - Top ventes

### 7.2 Phase 2

4. **Workflow Commandes Complet**
   - 6 statuts avec transitions
   - Actions admin (valider, refuser, expédier)

5. **Gestion Users Multi-Rôles**
   - 4 types (Enseigne, Shop Franchise, Shop Propre, Architecte)
   - Association user ↔ shops

6. **Workflow Rémunération**
   - 4 statuts commissions
   - Bouton "Percevoir" pour demande paiement

---

## 8. CONCLUSION

Le MVP Bubble LinkMe est une **plateforme B2B2C complète** avec un modèle économique basé sur les **marges par enseigne** (Tx de Marque).

Les fonctionnalités **clés manquantes** dans la nouvelle implémentation sont :

1. **Gestion Sélection + Marges** (core business)
2. **Gestion Shops multi-tenant** (Propre/Franchise)
3. **Système Users multi-rôles**
4. **Dashboard KPIs Enseigne**

L'architecture database doit être enrichie avec 5 nouvelles tables pour supporter le modèle complet.

---

**Analysé par** : Claude Code
**Date** : 2025-12-01
