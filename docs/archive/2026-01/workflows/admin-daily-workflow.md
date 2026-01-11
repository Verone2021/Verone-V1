# Workflow Quotidien Admin - Vérone Back Office

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team
**Rôle** : Admin (Administrateur)

## Table des matières

- [Introduction](#introduction)
- [Matin - Dashboard Business](#matin---dashboard-business)
- [Gestion Catalogue](#gestion-catalogue)
- [Gestion Commandes](#gestion-commandes)
- [Gestion Stock](#gestion-stock)
- [CRM & Clients](#crm--clients)
- [Exports & Rapports](#exports--rapports)
- [Fin Journée](#fin-journée)
- [Restrictions Admin](#restrictions-admin)
- [Liens Connexes](#liens-connexes)

---

## Introduction

### Rôle Admin

Le **Admin** est un administrateur du tenant Vérone avec :

- Accès complet opérations business (catalogue, commandes, stocks, facturation)
- Autonomie totale gestion quotidienne
- Création organisations, clients, fournisseurs
- Modification de SON profil uniquement

### Différences Admin vs Owner

**Admin a les mêmes droits que Owner sur 95% des opérations** :

- CRUD complet : organisations, price_lists, products, sales_orders, purchase_orders, stock_movements
- DELETE : price_lists (contrairement à croyance initiale)
- Exports : CSV/PDF toutes données business
- CRM : CRUD organisations, contacts, clients

**Admin a 3 restrictions vs Owner** :

1. Gestion utilisateurs : Admin modifie SON profil uniquement (pas créer/supprimer users)
2. Visibilité équipe : Admin NE VOIT PAS métriques équipe ni user_activity_logs
3. Pages interdites : /admin/users et /admin/activite-utilisateurs (redirect 403)

### Objectifs Workflow

- Autonomie complète opérations business quotidiennes
- Sourcing produits et création catalogue
- Gestion commandes ventes/achats
- Suivi stock et mouvements
- Support client et consultations
- Exports données business

---

## Matin - Dashboard Business

### 9h00 - Connexion & Dashboard

**Action** : Login → /dashboard

**Écran Admin** :

```
Dashboard Vérone
─────────────────────────────────────────

📊 KPIs Business Globaux
├─ Chiffre Affaires Mensuel : 45 320 EUR
├─ Commandes Ventes (mois) : 23
├─ Commandes Achats (mois) : 8
├─ Produits Catalogue : 1 245
└─ Stock Total Valeur : 78 900 EUR

⚠️ Alertes
├─ Stock bas : 3 produits
├─ Commandes en attente validation : 2
└─ Nouveaux produits à valider : 5
```

**Différence avec Owner** :

- Admin NE VOIT PAS section "Métriques Équipe" (Owner-only)
- Admin voit uniquement KPIs Business Globaux + Alertes

**Actions Admin** :

1. Consulter KPIs business (chiffre affaires, commandes, stocks)
2. Vérifier alertes critiques (stock bas, commandes attente)
3. Planifier actions journée

**Comparaison avec Owner** :

```
Dashboard Owner (complet)       Dashboard Admin (business only)
─────────────────────────────  ─────────────────────────────
✅ KPIs Business Globaux        ✅ KPIs Business Globaux
✅ Métriques Équipe             ❌ Pas accès
✅ Alertes                      ✅ Alertes
```

---

### 9h15 - Modification Profil Personnel

**Action** : /settings/profile (Admin peut modifier SON profil uniquement)

**Écran Admin** :

```
Mon Profil Utilisateur
─────────────────────────────────────────

Informations Personnelles
Nom Complet     : [Alice Dupont]
Email           : [alice@verone.com]
Téléphone       : [+33 6 12 34 56 78]
Poste           : [Responsable Catalogue]

Sécurité
Mot de passe    : [••••••••] [Modifier]
Dernière MDP    : Modifié il y a 45 jours

Sessions Actives : 2
- Web (Actuelle) - Paris, France
- Mobile - Lyon, France (Il y a 2h)
[Déconnecter toutes les autres sessions]

[Annuler] [Sauvegarder]
```

**Workflow Modification Mot de Passe** :

```
Admin → [Modifier] Mot de passe

Modifier Mot de Passe
─────────────────────────────────────────
Mot de passe actuel    : [••••••••]
Nouveau mot de passe   : [••••••••]
Confirmer mot de passe : [••••••••]

[✓] Déconnecter toutes sessions après modification (recommandé)

[Annuler] [Sauvegarder]
```

**Backend** :

```sql
-- UPDATE user_profiles (Admin son profil uniquement)
UPDATE user_profiles
SET
  full_name = 'Alice Dupont',
  phone = '+33 6 12 34 56 78',
  updated_at = NOW()
WHERE id = auth.uid();

-- RLS Policy autorise :
-- id = auth.uid() (Admin peut modifier son propre profil)

-- Si Admin essaie de modifier autre profil → RLS bloque
UPDATE user_profiles
SET full_name = 'Bob Martin'
WHERE id = <bob_user_id>;
-- Erreur : Policy violation (Admin peut uniquement id = auth.uid())
```

**Différence avec Owner** :

- Owner PEUT modifier TOUS les profils du tenant
- Admin PEUT modifier SON profil uniquement
- Admin NE PEUT PAS accéder /admin/users (redirect 403)

---

## Gestion Catalogue

### 10h00 - Sourcing Nouveaux Produits

**Action** : /catalogue/produits → [+ Nouveau Produit]

**Droits Admin** : Identiques Owner (CRUD complet products)

**Workflow Création Produit** :

```
Admin → /catalogue/produits → [+ Nouveau Produit]

Création Produit
─────────────────────────────────────────
SKU             : [VRN-LAMP-001]
Nom             : [Lampe Design Scandinave]
Catégorie       : [Éclairage ▼]
Fournisseur     : [Nordic Design AB ▼]

Tarifs
Prix Achat HT   : [45.00 EUR]
Prix Vente B2C  : [99.00 EUR]
Prix Vente B2B  : [79.00 EUR]
Marge B2C       : 120% (calculé auto)
Marge B2B       : 75% (calculé auto)

Stock
Stock Initial   : [100]
Seuil Alerte    : [20]
Localisation    : [Entrepôt Paris ▼]

Images & Docs
[+ Ajouter Images] [+ Ajouter PDF Fiche]

[Annuler] [Créer Produit]
```

**Backend** :

```sql
-- INSERT products (Owner + Admin RLS)
INSERT INTO products (
  sku,
  name,
  category_id,
  supplier_id,
  cost_price,
  b2c_price,
  b2b_price,
  current_stock,
  min_stock_threshold,
  organisation_id
) VALUES (
  'VRN-LAMP-001',
  'Lampe Design Scandinave',
  <category_id>,
  <supplier_id>,
  45.00,
  99.00,
  79.00,
  100,
  20,
  'tenant_abc'
);

-- RLS Policy autorise : role_name IN ('owner', 'admin')
```

**Note** : Admin et Owner ont exactement les mêmes droits sur products (CRUD complet)

---

### 11h00 - Gestion Listes de Prix

**Action** : /catalogue/listes-prix

**Droits Admin** : Identiques Owner (y compris DELETE price_lists)

**Écran Admin** :

```
Listes de Prix
─────────────────────────────────────────

[+ Nouvelle Liste de Prix] [Exporter CSV]

Nom Liste           | Type  | Produits | Actif | Dernière MàJ | Actions
--------------------|-------|----------|-------|--------------|----------
Tarif Public B2C    | B2C   | 1 245    | ✓     | 10 Oct 2025  | [Éditer] [Dupliquer]
Tarif Revendeur B2B | B2B   | 1 245    | ✓     | 10 Oct 2025  | [Éditer] [Dupliquer]
Tarif Fournisseur X | B2B   | 450      | ✓     | 05 Oct 2025  | [Éditer] [Supprimer]
Tarif 2024 OLD      | B2C   | 890      | ✗     | 01 Jan 2025  | [Éditer] [Supprimer]
```

**Workflow Suppression Price List (Admin autorisé)** :

```
Admin → Clic [Supprimer] ligne "Tarif 2024 OLD"

Confirmation Suppression Liste de Prix
─────────────────────────────────────────
⚠️ Vous êtes sur le point de supprimer la liste :

Nom : Tarif 2024 OLD
Type : B2C
Produits : 890
Statut : Inactive

Vérifications :
✅ Aucun customer_pricing référencé (soft delete si nécessaire)
✅ Liste inactive depuis 10 mois

[Annuler] [Confirmer Suppression]
```

**Backend** :

```sql
-- DELETE price_lists (Owner + Admin RLS)
DELETE FROM price_lists
WHERE id = <price_list_id>
  AND organisation_id = 'tenant_abc';

-- RLS Policy autorise : role_name IN ('owner', 'admin')
-- Admin PEUT DELETE price_lists (policy corrigée)
```

**Note Importante** :

- Ancienne croyance : "Admin ne peut pas supprimer price_lists"
- Réalité RLS : Admin PEUT DELETE price_lists (policy Owner+Admin)
- Admin et Owner ont droits identiques sur price_lists

---

## Gestion Commandes

### 14h00 - Création Commande Vente

**Action** : /ventes/commandes → [+ Nouvelle Commande]

**Droits Admin** : Identiques Owner (CRUD complet sales_orders)

**Workflow Commande Client** :

```
Admin → /ventes/commandes → [+ Nouvelle Commande]

Nouvelle Commande Vente
─────────────────────────────────────────
Client          : [Hotel Paris SAS ▼]
Canal Vente     : [Site Web B2B ▼]
Référence       : [SO-2025-10-025] (auto)
Date Livraison  : [2025-10-30]

Items Commande :
┌────────────────────────────────────────────────────┐
│ SKU              │ Produit         │ Qté │ PU    │ Total    │
├──────────────────┼─────────────────┼─────┼───────┼──────────┤
│ VRN-CHAIR-001    │ Chaise Scand.   │ 50  │ 149€  │ 7 450€   │
│ VRN-TABLE-002    │ Table Basse     │ 10  │ 249€  │ 2 490€   │
│ VRN-LAMP-001     │ Lampe Design    │ 30  │ 79€   │ 2 370€   │
└────────────────────────────────────────────────────┘

[+ Ajouter Produit]

Résumé
Sous-total HT : 12 310 EUR
Remise -5%    :   -615 EUR
Total HT      : 11 695 EUR
TVA 20%       :  2 339 EUR
Total TTC     : 14 034 EUR

[Annuler] [Créer Commande]
```

**Backend** :

```sql
-- INSERT sales_orders (Owner + Admin + Sales RLS)
INSERT INTO sales_orders (
  reference,
  customer_id,
  sales_channel_id,
  delivery_date,
  subtotal_ht,
  discount_amount,
  total_ht,
  vat_amount,
  total_ttc,
  organisation_id
) VALUES (
  'SO-2025-10-025',
  <customer_id>,
  <sales_channel_id>,
  '2025-10-30',
  12310.00,
  615.00,
  11695.00,
  2339.00,
  14034.00,
  'tenant_abc'
);

-- RLS Policy autorise : role_name IN ('owner', 'admin', 'sales')
```

**Note** : Admin et Owner ont exactement les mêmes droits sur sales_orders

---

### 15h00 - Gestion Commandes Fournisseurs

**Action** : /achats/commandes → [+ Nouvelle Commande]

**Droits Admin** : Identiques Owner (CRUD complet purchase_orders)

**Workflow Commande Fournisseur** :

```
Admin → /achats/commandes → [+ Nouvelle Commande]

Nouvelle Commande Achat
─────────────────────────────────────────
Fournisseur     : [Nordic Design AB ▼]
Référence       : [PO-2025-10-015] (auto)
Date Livraison  : [2025-11-05]
Conditions      : [30 jours fin mois ▼]

Items Commande :
┌────────────────────────────────────────────────────┐
│ SKU              │ Produit         │ Qté │ PA    │ Total    │
├──────────────────┼─────────────────┼─────┼───────┼──────────┤
│ VRN-LAMP-001     │ Lampe Design    │ 200 │ 45€   │ 9 000€   │
│ VRN-CHAIR-001    │ Chaise Scand.   │ 100 │ 89€   │ 8 900€   │
└────────────────────────────────────────────────────┘

[+ Ajouter Produit]

Résumé
Total HT      : 17 900 EUR
TVA 20%       :  3 580 EUR
Total TTC     : 21 480 EUR

[Annuler] [Créer & Envoyer PDF Fournisseur]
```

**Backend** :

```sql
-- INSERT purchase_orders (Owner + Admin RLS)
INSERT INTO purchase_orders (
  reference,
  supplier_id,
  delivery_date,
  payment_terms,
  total_ht,
  vat_amount,
  total_ttc,
  organisation_id
) VALUES (
  'PO-2025-10-015',
  <supplier_id>,
  '2025-11-05',
  '30 jours fin mois',
  17900.00,
  3580.00,
  21480.00,
  'tenant_abc'
);

-- RLS Policy autorise : role_name IN ('owner', 'admin')
```

**Note** : Admin et Owner ont exactement les mêmes droits sur purchase_orders

---

## Gestion Stock

### 16h00 - Mouvements Stock

**Action** : /stock/mouvements → [+ Nouveau Mouvement]

**Droits Admin** : Identiques Owner (CRUD complet, y compris DELETE)

**Workflow Entrée Stock** :

```
Admin → /stock/mouvements → [+ Nouveau Mouvement]

Nouveau Mouvement Stock
─────────────────────────────────────────
Type Mouvement  : [Entrée ▼] ou [Sortie ▼]
Date            : [2025-10-16]

Produit         : [Lampe Design Scandinave ▼]
SKU             : VRN-LAMP-001 (auto-rempli)
Quantité        : [200]

Référence       : [PO-2025-10-015]
Commentaire     : [Réception commande fournisseur Nordic Design]

Stock Actuel    : 100
Nouveau Stock   : 300 (calculé auto)

[Annuler] [Enregistrer Mouvement]
```

**Backend** :

```sql
-- INSERT stock_movements (Owner + Admin RLS)
INSERT INTO stock_movements (
  product_id,
  movement_type,
  quantity,
  reference,
  comment,
  organisation_id
) VALUES (
  <product_id>,
  'entry',
  200,
  'PO-2025-10-015',
  'Réception commande fournisseur Nordic Design',
  'tenant_abc'
);

-- UPDATE products stock (Owner + Admin RLS)
UPDATE products
SET current_stock = current_stock + 200
WHERE id = <product_id>;

-- RLS Policy autorise : role_name IN ('owner', 'admin')
```

**Workflow Suppression Mouvement Stock (Admin autorisé)** :

```
Admin → /stock/mouvements → Historique → Clic [Supprimer] ligne "MOV-001"

Confirmation Suppression Mouvement
─────────────────────────────────────────
⚠️ Vous êtes sur le point de supprimer le mouvement :

Référence : MOV-001
Type : Entrée
Produit : Lampe Design Scandinave
Quantité : 200
Date : 16 Oct 2025

Cette action annulera le mouvement et ajustera le stock.

Stock Actuel    : 300
Nouveau Stock   : 100 (après suppression)

[Annuler] [Confirmer Suppression]
```

**Backend** :

```sql
-- DELETE stock_movements (Owner + Admin RLS - CORRIGÉ 2025-10-16)
DELETE FROM stock_movements
WHERE id = <movement_id>
  AND organisation_id = 'tenant_abc';

-- UPDATE products stock (ajustement)
UPDATE products
SET current_stock = current_stock - 200
WHERE id = <product_id>;

-- RLS Policy autorise : role_name IN ('owner', 'admin')
-- Migration 2025-10-16 : Ajout 'admin' (était Owner-only avant)
```

**Note Migration 2025-10-16** :

- Avant : DELETE stock_movements = Owner-only
- Après : DELETE stock_movements = Owner + Admin (policy corrigée)

---

## CRM & Clients

### 17h00 - Création Client Particulier

**Action** : /clients/particuliers → [+ Nouveau Client]

**Droits Admin** : Identiques Owner (CRUD complet customers)

**Workflow Création Client** :

```
Admin → /clients/particuliers → [+ Nouveau Client]

Nouveau Client Particulier
─────────────────────────────────────────
Civilité        : [M. ▼]
Prénom          : [Pierre]
Nom             : [Dubois]
Email           : [pierre.dubois@gmail.com]
Téléphone       : [+33 6 98 76 54 32]

Adresse
Rue             : [12 Rue de la Paix]
Ville           : [Paris]
Code Postal     : [75002]
Pays            : [France ▼]

Préférences
Canal Contact   : [Email ▼]
Newsletter      : [✓]

[Annuler] [Créer Client]
```

**Backend** :

```sql
-- INSERT customers (Owner + Admin RLS)
INSERT INTO customers (
  civility,
  first_name,
  last_name,
  email,
  phone,
  address_line1,
  city,
  postal_code,
  country,
  organisation_id
) VALUES (
  'M.',
  'Pierre',
  'Dubois',
  'pierre.dubois@gmail.com',
  '+33 6 98 76 54 32',
  '12 Rue de la Paix',
  'Paris',
  '75002',
  'France',
  'tenant_abc'
);

-- RLS Policy autorise : role_name IN ('owner', 'admin')
```

**Note** : Admin et Owner ont exactement les mêmes droits sur customers

---

### 17h30 - Création Consultation Client

**Action** : /consultations → [+ Nouvelle Consultation]

**Droits Admin** : Identiques Owner (CRUD complet consultations)

**Workflow Consultation** :

```
Admin → /consultations → [+ Nouvelle Consultation]

Nouvelle Consultation Client
─────────────────────────────────────────
Client          : [Pierre Dubois ▼]
Type Projet     : [Aménagement Appartement ▼]
Budget Estimé   : [15 000 EUR]

Produits Intéressés :
[✓] Chaise Scandinave Blanche (VRN-CHAIR-001) x 6
[✓] Table Basse Moderne (VRN-TABLE-002) x 1
[✓] Lampe Design Scandinave (VRN-LAMP-001) x 4

Commentaires :
[Client recherche style scandinave pour salon 40m². Budget flexible, livraison souhaitée avant Noël.]

Prochaine Action :
Date RDV        : [2025-10-20 14h00]
Lieu            : [Showroom Paris]

[Annuler] [Créer Consultation]
```

**Backend** :

```sql
-- INSERT consultations (Owner + Admin RLS)
INSERT INTO consultations (
  customer_id,
  project_type,
  estimated_budget,
  notes,
  next_meeting_date,
  organisation_id
) VALUES (
  <customer_id>,
  'Aménagement Appartement',
  15000.00,
  'Client recherche style scandinave pour salon 40m²...',
  '2025-10-20 14:00:00',
  'tenant_abc'
);

-- RLS Policy autorise : role_name IN ('owner', 'admin')
```

**Note** : Admin et Owner ont exactement les mêmes droits sur consultations

---

## Exports & Rapports

### 18h00 - Export Catalogue Produits

**Action** : /catalogue/produits → [Exporter CSV]

**Droits Admin** : Identiques Owner (exports complets données business)

**Workflow Export CSV** :

```
Admin → /catalogue/produits → [Exporter CSV]

Export Catalogue Produits
─────────────────────────────────────────
Format          : [CSV ▼] ou [PDF ▼]

Colonnes :
[✓] SKU
[✓] Nom
[✓] Catégorie
[✓] Fournisseur
[✓] Prix Achat
[✓] Prix B2C
[✓] Prix B2B
[✓] Stock Actuel
[✓] Stock Seuil

Filtres :
Catégorie       : [Toutes ▼]
Fournisseur     : [Tous ▼]
Stock < Seuil   : [ ] Uniquement produits alerte

[Annuler] [Télécharger Export]
```

**Résultat CSV** :

```csv
SKU,Nom,Catégorie,Fournisseur,Prix Achat,Prix B2C,Prix B2B,Stock Actuel,Stock Seuil
VRN-CHAIR-001,Chaise Scandinave Blanche,Mobilier,Nordic Design AB,89.00,179.00,149.00,150,20
VRN-TABLE-002,Table Basse Moderne,Mobilier,Nordic Design AB,150.00,299.00,249.00,20,10
VRN-LAMP-001,Lampe Design Scandinave,Éclairage,Nordic Design AB,45.00,99.00,79.00,300,20
...
```

**Types Exports Admin Autorisés** :

1. ✅ Catalogue Produits (CSV/PDF)
2. ✅ Listes Prix (CSV/PDF)
3. ✅ Commandes Ventes (CSV/PDF)
4. ✅ Commandes Achats (CSV/PDF)
5. ✅ Mouvements Stock (CSV)
6. ❌ Rapport Activité Équipe (Owner-only)

**Différence avec Owner** :

- Admin PEUT exporter toutes données business (catalogues, commandes, stocks)
- Admin NE PEUT PAS exporter rapport activité équipe (Owner-only)

---

## Fin Journée

### 18h30 - Revue KPIs Personnel

**Action** : /dashboard → Consulter métriques fin journée

**Écran Admin** :

```
Dashboard Vérone - 18h30
─────────────────────────────────────────

📊 KPIs Business Aujourd'hui
├─ Commandes Ventes Créées : 5 (+2 vs hier)
├─ Commandes Achats Créées : 1
├─ Nouveaux Produits : 8
├─ Consultations Clients : 2
└─ Valeur Commandes : 34 500 EUR

⚠️ Alertes à Traiter Demain
├─ Stock bas : 3 produits (réappro urgent)
├─ Commandes en attente validation : 2 (Owner)
└─ Consultations RDV demain : 1 (Pierre Dubois 14h)

📋 Tâches Demain
├─ RDV Consultation Pierre Dubois (14h)
├─ Commander stock produits alerte
└─ Préparer devis Hotel Paris SAS
```

**Actions Admin** :

1. Vérifier objectifs journée atteints
2. Préparer tâches prioritaires demain
3. Identifier blocages éventuels (validation Owner nécessaire)

**Différence avec Owner** :

- Admin NE VOIT PAS métriques équipe (pas de section "Activité Équipe")
- Admin voit uniquement ses propres KPIs business

---

### 18h45 - Logout Sécurisé

**Action** : Déconnexion

**Workflow** :

```
Admin → Clic avatar → [Déconnexion]

Confirmation Déconnexion
─────────────────────────────────────────
Vous allez être déconnecté.

Options :
[✓] Déconnecter toutes mes sessions (recommandé)
[ ] Déconnecter session actuelle uniquement

[Annuler] [Déconnexion]
```

**Backend** :

```sql
-- DELETE user_sessions (Admin ses sessions uniquement)
DELETE FROM user_sessions
WHERE user_id = auth.uid();

-- RLS Policy autorise :
-- Admin : supprimer ses sessions uniquement (self)
-- Owner : supprimer toutes sessions (all users ou self)
```

---

## Restrictions Admin

### Pages Interdites (Owner-only)

**Pages Admin NE PEUT PAS accéder** :

1. `/admin/users` - Gestion utilisateurs (redirect 403)
2. `/admin/activite-utilisateurs` - Logs activité équipe (redirect 403)

**Workflow Tentative Accès Interdit** :

```
Admin → Tape URL manuellement /admin/users

Middleware Next.js
─────────────────────────────────────────
if (pathname.startsWith('/admin/users')) {
  if (userRole !== 'owner') {
    return NextResponse.redirect('/dashboard');
  }
}

Résultat : Admin redirigé vers /dashboard avec message :
"Accès refusé : Cette page est réservée aux propriétaires (Owner)"
```

---

### Tables Restreintes (RLS)

**Tables Admin NE PEUT PAS modifier** :

1. **user_activity_logs** (SELECT)
   - Owner : Voir tous logs tenant
   - Admin : ❌ Aucun accès (RLS bloque SELECT)

2. **user_profiles** (INSERT, DELETE)
   - Owner : Créer/Supprimer profils
   - Admin : ❌ Impossible (RLS bloque)

3. **user_profiles** (UPDATE)
   - Owner : Modifier tous profils
   - Admin : ✅ Modifier SON profil uniquement (id = auth.uid())

4. **user_organisation_assignments** (INSERT, UPDATE, DELETE)
   - Owner : CRUD complet assignations rôles
   - Admin : ❌ Aucune modification possible (RLS bloque)

**Workflow Erreur RLS** :

```
-- Admin essaie de créer utilisateur
const { error } = await supabase
  .from('user_profiles')
  .insert({
    email: 'david@verone.com',
    full_name: 'David Moreau',
    organisation_id: 'tenant_abc'
  });

// Résultat :
error: {
  code: '42501',
  message: 'new row violates row-level security policy for table "user_profiles"',
  details: 'Policy "Uniquement owners peuvent créer profils" failed'
}

// Solution : Demander à Owner de créer utilisateur
```

---

### Opérations Autorisées (95%)

**Tables Admin a MÊMES droits que Owner** :

- ✅ organisations (CRUD complet)
- ✅ price_lists (CRUD complet, y compris DELETE)
- ✅ products (CRUD complet)
- ✅ sales_orders (CRUD complet)
- ✅ purchase_orders (CRUD complet)
- ✅ stock_movements (CRUD complet, y compris DELETE depuis 2025-10-16)
- ✅ contacts (CRUD complet)
- ✅ customers (CRUD complet)
- ✅ sales_channels (CRUD complet)
- ✅ customer_pricing (CRUD complet)
- ✅ variant_groups (CRUD complet)
- ✅ sample_orders (CRUD complet)

**Note** : Admin a autonomie complète sur 95% des opérations quotidiennes

---

## Liens Connexes

### Documentation Technique

- [Matrice Rôles et Permissions](/Users/romeodossantos/verone-back-office-V1/docs/auth/roles-permissions-matrix.md)
- [RLS Policies Détaillées](/Users/romeodossantos/verone-back-office-V1/docs/auth/rls-policies.md)

### Documentation Workflows

- [Workflow Quotidien Owner](/Users/romeodossantos/verone-back-office-V1/docs/workflows/owner-daily-workflow.md)
- [Index Workflows](/Users/romeodossantos/verone-back-office-V1/docs/workflows/README.md)

### Guides Opérationnels

- [Gestion Commandes](/Users/romeodossantos/verone-back-office-V1/docs/workflows/orders-lifecycle.md)
- [Gestion Stock](/Users/romeodossantos/verone-back-office-V1/docs/workflows/stock-movements.md)
- [Sourcing Produits](/Users/romeodossantos/verone-back-office-V1/docs/workflows/sourcing-validation.md)

---

## Résumé Exécutif

### Journée Type Admin

**Matin (9h-12h)** :

- Dashboard business (KPIs globaux, alertes)
- Modification profil personnel (son profil uniquement)
- Sourcing produits et création catalogue

**Après-midi (14h-18h)** :

- Création commandes ventes/achats
- Gestion stock et mouvements
- CRM : clients, consultations
- Exports données business

**Différences Admin vs Owner** :

1. **Gestion équipe** : Admin PEUT modifier SON profil uniquement, Owner PEUT créer/modifier/supprimer tous users
2. **Visibilité équipe** : Admin NE VOIT PAS métriques équipe ni user_activity_logs, Owner OUI
3. **Pages interdites** : Admin redirect 403 sur /admin/users et /admin/activite-utilisateurs
4. **Tout le reste** : IDENTIQUE Owner (organisations, pricing, commandes, stocks, exports, DELETE price_lists)

**Autonomie Admin** :

- 95% opérations identiques Owner
- 5% restrictions (gestion équipe uniquement)

**Temps Répartition** :

- 0% supervision équipe (interdit)
- 100% opérations business (autonomie complète)

**Collaboration Owner** :

- Admin demande Owner pour créer nouveaux utilisateurs
- Admin informe Owner pour validation workflows Phase 2 (à venir)
- Admin autonome sur toutes autres opérations

---

**Retour** : [Documentation Workflows](/Users/romeodossantos/verone-back-office-V1/docs/workflows/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
