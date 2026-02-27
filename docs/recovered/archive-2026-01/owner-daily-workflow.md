# Workflow Quotidien Owner - Vérone Back Office

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team
**Rôle** : Owner (Propriétaire)

## Table des matières

- [Introduction](#introduction)
- [Matin - Dashboard Propriétaire](#matin---dashboard-propriétaire)
- [Gestion Équipe](#gestion-équipe)
- [Validation Workflows](#validation-workflows)
- [Opérations Business](#opérations-business)
- [Exports & Rapports](#exports--rapports)
- [Fin Journée](#fin-journée)
- [Accès Exclusifs Owner](#accès-exclusifs-owner)
- [Liens Connexes](#liens-connexes)

---

## Introduction

### Rôle Owner

Le **Owner** est le propriétaire du tenant Vérone avec :

- Accès complet toutes fonctionnalités
- Supervision de l'équipe (métriques, activité, utilisateurs)
- Validation workflows (Phase 2 à venir)
- Gestion utilisateurs exclusive

### Différences Owner vs Admin

**Owner possède 3 avantages exclusifs** :

1. Gestion utilisateurs complète (créer/modifier/supprimer profils)
2. Visibilité métriques équipe (activité, performances)
3. Accès pages admin (/admin/users, /admin/activite-utilisateurs)

**Tout le reste est identique à Admin** : organisations, pricing, commandes, stocks, exports, etc.

### Objectifs Workflow

- Supervision équipe et métriques performances
- Validation éléments critiques (workflows Phase 2)
- Gestion stratégique business (pricing, fournisseurs)
- Opérations quotidiennes (identiques Admin)

---

## Matin - Dashboard Propriétaire

### 9h00 - Connexion & Dashboard

**Action** : Login → /dashboard

**Écran Owner** :

```
Dashboard Propriétaire Vérone
─────────────────────────────────────────

📊 KPIs Business Globaux
├─ Chiffre Affaires Mensuel : 45 320 EUR
├─ Commandes Ventes (mois) : 23
├─ Commandes Achats (mois) : 8
├─ Produits Catalogue : 1 245
└─ Stock Total Valeur : 78 900 EUR

👥 Métriques Équipe (Owner-only)
├─ Utilisateurs Actifs : 5
├─ Commandes Créées (équipe) : 23
├─ Consultations Créées : 12
├─ Exports Réalisés : 8
└─ Dernière Activité : Il y a 2h (Alice - Admin)

⚠️ Alertes
├─ Stock bas : 3 produits
├─ Commandes en attente validation : 2
└─ Nouveaux produits à valider : 5
```

**Différence avec Admin** :

- Admin NE VOIT PAS section "Métriques Équipe"
- Admin voit uniquement KPIs Business Globaux + Alertes

**Actions Owner** :

1. Consulter métriques équipe → Identifier performances utilisateurs
2. Vérifier alertes critiques
3. Planifier actions journée

---

### 9h15 - Consultation Activité Équipe

**Action** : /admin/activite-utilisateurs (Owner-only)

**Écran Owner** :

```
Activité Utilisateurs - Tableau de Bord
─────────────────────────────────────────

Filtres : [Période : 7 derniers jours] [Utilisateur : Tous]

Utilisateur    | Rôle  | Commandes | Consultations | Exports | Dernière Activité
---------------|-------|-----------|---------------|---------|------------------
Alice Dupont   | Admin | 12        | 5             | 3       | Il y a 2h
Bob Martin     | Admin | 8         | 4             | 2       | Il y a 5h
Claire Lefèvre | Sales | 3         | 3             | 3       | Hier 17h
```

**Actions détaillées** :

```sql
-- Query Owner peut exécuter (RLS autorise)
SELECT
  u.full_name,
  u.role_name,
  COUNT(DISTINCT CASE WHEN l.action = 'create_sales_order' THEN l.id END) AS commandes_creees,
  COUNT(DISTINCT CASE WHEN l.action = 'create_consultation' THEN l.id END) AS consultations_creees,
  COUNT(DISTINCT CASE WHEN l.action = 'export_csv' THEN l.id END) AS exports,
  MAX(l.created_at) AS derniere_activite
FROM user_activity_logs l
JOIN user_profiles u ON l.user_id = u.id
WHERE l.organisation_id = 'tenant_abc'
  AND l.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.full_name, u.role_name;

-- RLS Policy autorise : role_name = 'owner'
```

**Différence avec Admin** :

- Admin essaie /admin/activite-utilisateurs → Redirect /dashboard (403 Forbidden)
- Admin NE PEUT PAS voir user_activity_logs (RLS bloque)

**Actions Owner** :

1. Identifier utilisateurs les plus actifs
2. Détecter baisse activité (utilisateur inactif)
3. Exporter rapport CSV activité équipe
4. Prendre décisions RH si besoin

---

## Gestion Équipe

### 10h00 - Gestion Utilisateurs

**Action** : /admin/users (Owner-only)

**Écran Owner** :

```
Gestion Utilisateurs
─────────────────────────────────────────

[+ Créer Utilisateur] [Exporter CSV]

ID   | Nom Complet    | Email                  | Rôle  | Statut  | Dernière Connexion | Actions
-----|----------------|------------------------|-------|---------|--------------------|-----------
001  | Jean Dupont    | jean@verone.com        | Owner | Actif   | Aujourd'hui 9h     | [Éditer] [—]
002  | Alice Dupont   | alice@verone.com       | Admin | Actif   | Aujourd'hui 7h     | [Éditer] [Supprimer]
003  | Bob Martin     | bob@verone.com         | Admin | Actif   | Aujourd'hui 8h     | [Éditer] [Supprimer]
004  | Claire Lefèvre | claire@verone.com      | Sales | Inactif | Hier 17h           | [Éditer] [Supprimer]
```

**Cas d'usage 1 : Créer Nouveau Salarié**

**Workflow** :

```
Owner → [+ Créer Utilisateur]

Formulaire Nouveau Utilisateur
─────────────────────────────────────────
Nom Complet     : [David Moreau]
Email           : [david@verone.com]
Rôle            : [Admin ▼]
Mot de passe    : [Générer automatique ✓]
Organisation    : [Vérone Design SARL] (auto)
Envoyer email   : [✓] Email invitation avec lien activation

[Annuler] [Créer Utilisateur]
```

**Backend** :

```sql
-- INSERT user_profiles (Owner-only RLS)
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  organisation_id
) VALUES (
  gen_random_uuid(),
  'david@verone.com',
  'David Moreau',
  'tenant_abc'
);

-- INSERT user_organisation_assignments (Owner-only RLS)
INSERT INTO user_organisation_assignments (
  user_id,
  organisation_id,
  role_name
) VALUES (
  <new_user_id>,
  'tenant_abc',
  'admin'
);

-- Si Admin essaie → RLS bloque avec erreur :
-- Policy violation on table "user_profiles" (INSERT)
```

**Résultat** :

- Email invitation envoyé à david@verone.com
- David clique lien → Définit son mot de passe
- David login → Dashboard Admin (sans métriques équipe)

---

**Cas d'usage 2 : Modifier Rôle Utilisateur**

**Workflow** :

```
Owner → Clic [Éditer] ligne "Bob Martin"

Éditer Utilisateur : Bob Martin
─────────────────────────────────────────
Nom Complet     : [Bob Martin]
Email           : [bob@verone.com]
Rôle            : [Admin ▼] → Changer en [Sales ▼]
Statut          : [Actif ▼]
Réinitialiser MDP : [Envoyer email réinitialisation]

[Annuler] [Sauvegarder]
```

**Backend** :

```sql
-- UPDATE user_organisation_assignments (Owner-only RLS)
UPDATE user_organisation_assignments
SET role_name = 'sales'
WHERE user_id = <bob_user_id>
  AND organisation_id = 'tenant_abc';

-- RLS Policy autorise : role_name = 'owner'
```

**Impact** :

- Bob perd accès admin (plus de CRUD organisations, price_lists, etc.)
- Bob garde accès sales (lecture + création sales_orders)

---

**Cas d'usage 3 : Supprimer Utilisateur**

**Workflow** :

```
Owner → Clic [Supprimer] ligne "Claire Lefèvre"

Confirmation Suppression
─────────────────────────────────────────
⚠️ Vous êtes sur le point de supprimer l'utilisateur :

Nom : Claire Lefèvre
Email : claire@verone.com
Rôle : Sales
Dernière Activité : Hier 17h

Cette action est irréversible. Toutes les données
créées par cet utilisateur resteront (audit trail),
mais le compte sera désactivé.

[Annuler] [Confirmer Suppression]
```

**Backend** :

```sql
-- DELETE user_organisation_assignments (Owner-only RLS)
DELETE FROM user_organisation_assignments
WHERE user_id = <claire_user_id>
  AND organisation_id = 'tenant_abc';

-- Soft delete user_profiles (Owner-only RLS)
UPDATE user_profiles
SET status = 'deleted', deleted_at = NOW()
WHERE id = <claire_user_id>;

-- RLS Policy autorise : role_name = 'owner'

-- Si dernier Owner → Trigger prevent_last_owner_deletion bloque
```

**Protection Trigger** :

```sql
-- Tentative suppression dernier Owner
Owner → Clic [Supprimer] sur Jean Dupont (dernier Owner)

Erreur Système
─────────────────────────────────────────
❌ Impossible de supprimer le dernier Owner

L'organisation doit avoir au moins un Owner actif.
Veuillez promouvoir un autre utilisateur au rôle Owner
avant de supprimer cet utilisateur.

[OK]
```

---

**Différence avec Admin** :

- Admin essaie /admin/users → Redirect /dashboard (403 Forbidden)
- Admin NE PEUT PAS créer/supprimer utilisateurs (RLS bloque)
- Admin PEUT modifier SON profil uniquement (/settings/profile)

---

## Validation Workflows

### 11h00 - Validation Commandes (Phase 2)

**Action** : /ventes/commandes → Filtrer "En attente validation"

**Note** : Workflow validation Owner = fonctionnalité Phase 2 (à venir)

**Écran Owner (Futur)** :

```
Commandes Ventes en Attente Validation
─────────────────────────────────────────

Commande | Client           | Montant  | Créée par | Date Création | Actions
---------|------------------|----------|-----------|---------------|----------
SO-001   | Hotel Paris SAS  | 12 450 € | Alice     | 15 Oct 10h    | [Valider] [Refuser]
SO-002   | Dupont & Fils    | 8 900 €  | Bob       | 15 Oct 14h    | [Valider] [Refuser]
```

**Workflow Validation** :

```
Owner → Clic [Valider] commande SO-001

Validation Commande SO-001
─────────────────────────────────────────
Client : Hotel Paris SAS
Montant : 12 450 EUR
Items : 25 produits

Vérifications :
✅ Stock suffisant
✅ Prix validés
✅ Client solvable (vérification CRM)

Commentaire validation (optionnel) :
[Client premium, livraison prioritaire]

[Annuler] [Valider Commande]
```

**Backend (Phase 2)** :

```sql
-- UPDATE sales_orders status (Owner validation)
UPDATE sales_orders
SET
  status = 'validated',
  validated_by = auth.uid(),
  validated_at = NOW(),
  validation_comment = 'Client premium, livraison prioritaire'
WHERE id = 'SO-001';

-- INSERT user_activity_logs (automatique)
INSERT INTO user_activity_logs (
  user_id,
  organisation_id,
  action,
  resource_type,
  resource_id
) VALUES (
  auth.uid(),
  'tenant_abc',
  'validate_sales_order',
  'sales_orders',
  'SO-001'
);
```

**Différence avec Admin** :

- Phase 2 : Admin PEUT valider commandes (rôle identique Owner pour validation)
- Owner garde visibilité user_activity_logs pour tracer qui valide quoi

---

## Opérations Business

### 14h00 - Gestion Catalogue (Identique Admin)

**Action** : /catalogue/produits → Créer/Modifier Produits

**Droits Owner** : Identiques Admin (CRUD complet)

**Workflow Création Produit** :

```
Owner → /catalogue/produits → [+ Nouveau Produit]

Création Produit
─────────────────────────────────────────
SKU             : [VRN-CHAIR-001]
Nom             : [Chaise Scandinave Blanche]
Catégorie       : [Mobilier ▼]
Fournisseur     : [Nordic Design AB ▼]
Prix Achat HT   : [89.00 EUR]
Prix Vente B2C  : [179.00 EUR]
Prix Vente B2B  : [149.00 EUR]
Stock Initial   : [50]

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
  organisation_id
) VALUES (
  'VRN-CHAIR-001',
  'Chaise Scandinave Blanche',
  <category_id>,
  <supplier_id>,
  89.00,
  'tenant_abc'
);

-- RLS Policy autorise : role_name IN ('owner', 'admin')
```

**Note** : Owner et Admin ont exactement les mêmes droits sur products

---

### 15h00 - Gestion Commandes Achats (Identique Admin)

**Action** : /achats/commandes → Créer Commande Fournisseur

**Droits Owner** : Identiques Admin (CRUD complet)

**Workflow Commande Fournisseur** :

```
Owner → /achats/commandes → [+ Nouvelle Commande]

Commande Achat Fournisseur
─────────────────────────────────────────
Fournisseur     : [Nordic Design AB ▼]
Date Livraison  : [2025-10-25]
Référence       : [PO-2025-10-001]

Items :
- Chaise Scandinave Blanche (VRN-CHAIR-001) x 100 @ 89 EUR = 8 900 EUR
- Table Basse Moderne (VRN-TABLE-002) x 20 @ 150 EUR = 3 000 EUR

Total HT : 11 900 EUR
TVA 20% : 2 380 EUR
Total TTC : 14 280 EUR

[Annuler] [Créer & Envoyer PDF]
```

**Backend** :

```sql
-- INSERT purchase_orders (Owner + Admin RLS)
INSERT INTO purchase_orders (
  reference,
  supplier_id,
  delivery_date,
  total_ht,
  organisation_id
) VALUES (
  'PO-2025-10-001',
  <supplier_id>,
  '2025-10-25',
  11900.00,
  'tenant_abc'
);

-- RLS Policy autorise : role_name IN ('owner', 'admin')
```

**Note** : Owner et Admin ont exactement les mêmes droits sur purchase_orders

---

### 16h00 - Gestion Stock (Identique Admin)

**Action** : /stock/mouvements → Créer Mouvement Stock

**Droits Owner** : Identiques Admin (CRUD complet, y compris DELETE)

**Workflow Entrée Stock** :

```
Owner → /stock/mouvements → [+ Nouveau Mouvement]

Mouvement Stock - Entrée
─────────────────────────────────────────
Type            : [Entrée ▼]
Produit         : [Chaise Scandinave Blanche ▼]
Quantité        : [100]
Référence       : [PO-2025-10-001]
Commentaire     : [Réception commande fournisseur Nordic Design]

Stock Actuel    : 50
Nouveau Stock   : 150

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
  organisation_id
) VALUES (
  <product_id>,
  'entry',
  100,
  'PO-2025-10-001',
  'tenant_abc'
);

-- UPDATE products stock (Owner + Admin RLS)
UPDATE products
SET current_stock = current_stock + 100
WHERE id = <product_id>;

-- RLS Policy autorise : role_name IN ('owner', 'admin')
```

**Note Migration 2025-10-16** :

- Avant : DELETE stock_movements = Owner-only
- Après : DELETE stock_movements = Owner + Admin (policy corrigée)

---

## Exports & Rapports

### 17h00 - Exports Business (Identique Admin)

**Action** : /catalogue/produits → [Exporter CSV]

**Droits Owner** : Identiques Admin (exports complets)

**Types Exports Disponibles** :

1. Catalogue Produits (CSV/PDF)
2. Listes Prix (CSV/PDF)
3. Commandes Ventes (CSV/PDF)
4. Commandes Achats (CSV/PDF)
5. Mouvements Stock (CSV)
6. **Rapport Activité Équipe (Owner-only)**

**Export Catalogue** :

```
Owner → /catalogue/produits → [Exporter CSV]

Export Catalogue Produits
─────────────────────────────────────────
Format          : [CSV ▼] ou [PDF ▼]
Colonnes        : [✓] SKU, [✓] Nom, [✓] Prix, [✓] Stock
Filtres         : [Catégorie : Toutes ▼]
                  [Fournisseur : Tous ▼]

[Annuler] [Télécharger Export]
```

**Résultat CSV** :

```csv
SKU,Nom,Catégorie,Fournisseur,Prix Achat,Prix B2C,Prix B2B,Stock
VRN-CHAIR-001,Chaise Scandinave Blanche,Mobilier,Nordic Design AB,89.00,179.00,149.00,150
VRN-TABLE-002,Table Basse Moderne,Mobilier,Nordic Design AB,150.00,299.00,249.00,20
...
```

**Note** : Owner et Admin peuvent tous deux exporter catalogues, listes prix, commandes, stocks

---

### 17h30 - Rapport Activité Équipe (Owner-only)

**Action** : /admin/activite-utilisateurs → [Exporter Rapport CSV]

**Droits Owner** : Exclusif Owner (Admin n'a pas accès)

**Workflow** :

```
Owner → /admin/activite-utilisateurs → [Exporter Rapport CSV]

Export Activité Utilisateurs
─────────────────────────────────────────
Période         : [7 derniers jours ▼]
Utilisateurs    : [Tous ▼] ou [Alice Dupont ▼]
Colonnes        : [✓] Utilisateur, [✓] Rôle, [✓] Commandes,
                  [✓] Consultations, [✓] Exports, [✓] Dernière Activité

[Annuler] [Télécharger Rapport]
```

**Résultat CSV** :

```csv
Utilisateur,Rôle,Commandes Créées,Consultations Créées,Exports Réalisés,Dernière Activité
Alice Dupont,Admin,12,5,3,2025-10-16 15:30
Bob Martin,Admin,8,4,2,2025-10-16 10:45
Claire Lefèvre,Sales,3,3,3,2025-10-15 17:00
```

**Différence avec Admin** :

- Admin NE PEUT PAS exporter rapport activité équipe
- Admin NE PEUT PAS voir user_activity_logs (RLS)

---

## Fin Journée

### 18h00 - Revue KPIs & Alertes

**Action** : /dashboard → Consulter métriques fin journée

**Écran Owner** :

```
Dashboard Propriétaire Vérone - 18h00
─────────────────────────────────────────

📊 KPIs Business Aujourd'hui
├─ Commandes Ventes Créées : 5 (+2 vs hier)
├─ Commandes Achats Créées : 1
├─ Nouveaux Produits : 8
└─ Valeur Commandes : 34 500 EUR

👥 Activité Équipe Aujourd'hui
├─ Alice Dupont : 3 commandes, 2 consultations
├─ Bob Martin : 2 commandes, 1 export
└─ Claire Lefèvre : Inactif

📋 Tâches Demain
├─ Valider 2 commandes en attente
├─ Réunion fournisseur Nordic Design (10h)
└─ Former nouveau salarié David (14h)
```

**Actions Owner** :

1. Vérifier objectifs journée atteints
2. Identifier tâches prioritaires demain
3. Préparer réunions/formations équipe

---

### 18h15 - Logout & Sécurité

**Action** : Déconnexion sécurisée

**Workflow** :

```
Owner → Clic avatar → [Déconnexion]

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
-- DELETE user_sessions (Owner peut supprimer toutes ses sessions)
DELETE FROM user_sessions
WHERE user_id = auth.uid();

-- RLS Policy autorise :
-- Owner : supprimer toutes sessions (all users ou self)
-- Admin : supprimer ses sessions uniquement (self)
```

---

## Accès Exclusifs Owner

### Résumé Pages Owner-Only

**Pages accessibles uniquement par Owner** :

1. `/admin/users` - Gestion utilisateurs (CRUD profils)
2. `/admin/activite-utilisateurs` - Logs activité équipe

**Si Admin essaie d'accéder** :

```typescript
// middleware.ts
if (
  pathname.startsWith('/admin/users') ||
  pathname.startsWith('/admin/activite-utilisateurs')
) {
  if (userRole !== 'owner') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}

// Résultat : Admin redirigé vers /dashboard avec message
// "Accès refusé : Cette page est réservée aux Owners"
```

---

### Résumé Tables Owner-Only

**Tables accessibles uniquement par Owner (RLS)** :

1. **user_activity_logs** (SELECT)
   - Owner : Voir tous logs tenant
   - Admin : Aucun accès (RLS bloque)

2. **user_profiles** (INSERT, DELETE)
   - Owner : Créer/Supprimer profils
   - Admin : Modifier son profil uniquement

3. **user_profiles** (UPDATE)
   - Owner : Modifier tous profils
   - Admin : Modifier son profil uniquement (id = auth.uid())

4. **user_organisation_assignments** (INSERT, UPDATE, DELETE)
   - Owner : CRUD complet assignations rôles
   - Admin : Aucune modification possible

---

### Résumé Tables Owner + Admin (Identiques)

**Tables avec droits identiques Owner/Admin** :

- organisations
- price_lists (y compris DELETE)
- products
- sales_orders
- purchase_orders
- stock_movements (y compris DELETE depuis 2025-10-16)
- contacts
- customers
- sales_channels
- customer_pricing
- variant_groups
- sample_orders

**Note** : 95% des opérations quotidiennes sont identiques Owner/Admin

---

## Liens Connexes

### Documentation Technique

- [Matrice Rôles et Permissions](/Users/romeodossantos/verone-back-office-V1/docs/auth/roles-permissions-matrix.md)
- [RLS Policies Détaillées](/Users/romeodossantos/verone-back-office-V1/docs/auth/rls-policies.md)

### Documentation Workflows

- [Workflow Quotidien Admin](/Users/romeodossantos/verone-back-office-V1/docs/workflows/admin-daily-workflow.md)
- [Index Workflows](/Users/romeodossantos/verone-back-office-V1/docs/workflows/README.md)

### Guides Opérationnels

- [Gestion Commandes](/Users/romeodossantos/verone-back-office-V1/docs/workflows/orders-lifecycle.md)
- [Gestion Stock](/Users/romeodossantos/verone-back-office-V1/docs/workflows/stock-movements.md)
- [Sourcing Produits](/Users/romeodossantos/verone-back-office-V1/docs/workflows/sourcing-validation.md)

---

## Résumé Exécutif

### Journée Type Owner

**Matin (9h-12h)** :

- Dashboard propriétaire (KPIs business + métriques équipe)
- Consultation activité utilisateurs (user_activity_logs)
- Gestion utilisateurs (créer/modifier/supprimer profils)

**Après-midi (14h-18h)** :

- Validation workflows Phase 2 (commandes, consultations)
- Opérations business (identiques Admin : catalogue, commandes, stocks)
- Exports & rapports (business + activité équipe)

**Différences Owner vs Admin** :

1. **Gestion équipe** : Owner PEUT créer/modifier/supprimer users, Admin NON
2. **Visibilité équipe** : Owner PEUT voir métriques/logs, Admin NON
3. **Pages exclusives** : Owner accède /admin/users + /admin/activite-utilisateurs
4. **Tout le reste** : IDENTIQUE Admin (organisations, pricing, commandes, stocks, exports)

**Temps Répartition** :

- 30% supervision équipe (Owner-only)
- 70% opérations business (identique Admin)

---

**Retour** : [Documentation Workflows](/Users/romeodossantos/verone-back-office-V1/docs/workflows/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
