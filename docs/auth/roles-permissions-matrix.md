# Matrice Rôles et Permissions - Vérone Back Office

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

## Table des matières

- [Introduction](#introduction)
- [Définition des Rôles](#définition-des-rôles)
- [Matrice Complète de Permissions](#matrice-complète-de-permissions)
- [Légende](#légende)
- [Permissions Spéciales](#permissions-spéciales)
- [Exemples Cas d'Usage](#exemples-cas-dusage)
- [Liens Connexes](#liens-connexes)

---

## Introduction

Cette matrice définit les permissions d'accès pour **tous les modules Vérone** selon les deux rôles principaux du système :

- **Owner** : Propriétaire du tenant avec accès complet et droits administratifs
- **Admin** : Administrateur avec accès quasi-complet (différences minimes avec Owner)

### Contexte Système

Le système Vérone utilise Row Level Security (RLS) de Supabase pour garantir :

- **Isolation des données** par tenant (organisation_id)
- **Respect des permissions** par rôle (owner, admin, sales)
- **Audit trail complet** via user_activity_logs (Owner-only)

### Principe Clé : Owner et Admin Presque Identiques

**Owner et Admin ont 95% de droits identiques**. Les seules différences concernent :

1. **Gestion utilisateurs** : Owner peut créer/modifier/supprimer les profils utilisateurs, Admin ne peut modifier que SON profil
2. **Visibilité équipe** : Owner peut voir métriques équipe et activité utilisateurs, Admin non
3. **Toutes les autres opérations** : Identiques (organisations, pricing, commandes, stocks, exports, DELETE price_lists, etc.)

---

## Définition des Rôles

### Owner (Propriétaire)

**Description complète** :

Le rôle **Owner** représente le propriétaire du tenant Vérone. C'est le rôle le plus élevé dans la hiérarchie avec :

**Responsabilités** :

- Gestion complète de l'organisation (création, paramétrage, configuration)
- Supervision de l'équipe (utilisateurs, activité, performances)
- Contrôle total des données business (catalogue, commandes, stocks, facturation)
- Décisions stratégiques (pricing, fournisseurs, clients)

**Droits exclusifs** :

- Créer, modifier, supprimer des utilisateurs (profils user_profiles)
- Voir les métriques d'équipe (dashboard propriétaire)
- Consulter l'activité détaillée des utilisateurs (user_activity_logs)
- Modifier les mots de passe des autres utilisateurs
- Accès pages /admin/users et /admin/activite-utilisateurs

**Droits partagés avec Admin** :

- CRUD complet sur organisations, price_lists, products, sales_orders, purchase_orders, stock_movements
- DELETE sur price_lists (contrairement à la croyance initiale)
- Exports CSV/PDF complets
- Validation workflows commandes
- Gestion contacts, clients, fournisseurs
- Configuration système tenant

**Limitations** :

- Impossible de supprimer le dernier Owner (trigger prevent_last_owner_deletion)
- Soumis aux mêmes règles métier que Admin pour les opérations business

---

### Admin (Administrateur)

**Description complète** :

Le rôle **Admin** représente un administrateur du tenant Vérone. C'est un rôle de confiance avec quasi-pleins pouvoirs, sauf supervision équipe :

**Responsabilités** :

- Gestion complète des données business (catalogue, commandes, stocks, facturation)
- Autonomie totale sur les opérations quotidiennes
- Création et gestion organisations, clients, fournisseurs
- Décisions opérationnelles (pricing, sourcing, validation commandes)

**Droits identiques au Owner** :

- CRUD complet sur organisations, price_lists, products, sales_orders, purchase_orders, stock_movements
- DELETE sur price_lists
- Exports CSV/PDF complets
- Validation workflows commandes
- Gestion contacts, clients, fournisseurs
- Configuration système tenant (sauf utilisateurs)

**Restrictions vs Owner** :

- **Gestion utilisateurs** : Peut modifier uniquement SON profil (not others)
- **Visibilité équipe** : Pas accès métriques équipe, pas accès user_activity_logs
- **Pas accès** : Pages /admin/users et /admin/activite-utilisateurs

**Droits autonomie** :

- Modifier son propre profil (nom, email, préférences)
- Modifier son propre mot de passe
- Créer consultations clients
- Gérer commandes fournisseurs/ventes
- Sourcing produits et création catalogue

---

## Matrice Complète de Permissions

### Module : Organisations

| Ressource / Action    | Owner      | Admin      | Différence |
| --------------------- | ---------- | ---------- | ---------- |
| **Organisations**     |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet | Aucune     |
| Création (INSERT)     | ✅ Complet | ✅ Complet | Aucune     |
| Modification (UPDATE) | ✅ Complet | ✅ Complet | Aucune     |
| Suppression (DELETE)  | ✅ Complet | ✅ Complet | Aucune     |

---

### Module : Catalogue & Pricing

| Ressource / Action    | Owner      | Admin      | Différence                 |
| --------------------- | ---------- | ---------- | -------------------------- |
| **Products**          |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet | Aucune                     |
| Création (INSERT)     | ✅ Complet | ✅ Complet | Aucune                     |
| Modification (UPDATE) | ✅ Complet | ✅ Complet | Aucune                     |
| Suppression (DELETE)  | ✅ Complet | ✅ Complet | Aucune                     |
| **Price Lists**       |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet | Aucune                     |
| Création (INSERT)     | ✅ Complet | ✅ Complet | Aucune                     |
| Modification (UPDATE) | ✅ Complet | ✅ Complet | Aucune                     |
| Suppression (DELETE)  | ✅ Complet | ✅ Complet | Aucune (Admin PEUT delete) |
| **Sales Channels**    |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet | Aucune                     |
| Création (INSERT)     | ✅ Complet | ✅ Complet | Aucune                     |
| Modification (UPDATE) | ✅ Complet | ✅ Complet | Aucune                     |
| Suppression (DELETE)  | ✅ Complet | ✅ Complet | Aucune                     |
| **Customer Pricing**  |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet | Aucune                     |
| Création (INSERT)     | ✅ Complet | ✅ Complet | Aucune                     |
| Modification (UPDATE) | ✅ Complet | ✅ Complet | Aucune                     |
| Suppression (DELETE)  | ✅ Complet | ✅ Complet | Aucune                     |

---

### Module : Commandes

| Ressource / Action    | Owner      | Admin      | Différence |
| --------------------- | ---------- | ---------- | ---------- |
| **Sales Orders**      |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet | Aucune     |
| Création (INSERT)     | ✅ Complet | ✅ Complet | Aucune     |
| Modification (UPDATE) | ✅ Complet | ✅ Complet | Aucune     |
| Suppression (DELETE)  | ✅ Complet | ✅ Complet | Aucune     |
| **Purchase Orders**   |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet | Aucune     |
| Création (INSERT)     | ✅ Complet | ✅ Complet | Aucune     |
| Modification (UPDATE) | ✅ Complet | ✅ Complet | Aucune     |
| Suppression (DELETE)  | ✅ Complet | ✅ Complet | Aucune     |
| **Sample Orders**     |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet | Aucune     |
| Création (INSERT)     | ✅ Complet | ✅ Complet | Aucune     |
| Modification (UPDATE) | ✅ Complet | ✅ Complet | Aucune     |
| Suppression (DELETE)  | ✅ Complet | ✅ Complet | Aucune     |

---

### Module : Stock

| Ressource / Action    | Owner      | Admin      | Différence                          |
| --------------------- | ---------- | ---------- | ----------------------------------- |
| **Stock Movements**   |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet | Aucune                              |
| Création (INSERT)     | ✅ Complet | ✅ Complet | Aucune                              |
| Modification (UPDATE) | ✅ Complet | ✅ Complet | Aucune                              |
| Suppression (DELETE)  | ✅ Complet | ✅ Complet | Aucune (Policy modifiée 2025-10-16) |
| **Variant Groups**    |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet | Aucune                              |
| Création (INSERT)     | ✅ Complet | ✅ Complet | Aucune                              |
| Modification (UPDATE) | ✅ Complet | ✅ Complet | Aucune                              |
| Suppression (DELETE)  | ✅ Complet | ✅ Complet | Aucune                              |

---

### Module : CRM

| Ressource / Action           | Owner      | Admin      | Différence |
| ---------------------------- | ---------- | ---------- | ---------- |
| **Contacts**                 |
| Lecture (SELECT)             | ✅ Complet | ✅ Complet | Aucune     |
| Création (INSERT)            | ✅ Complet | ✅ Complet | Aucune     |
| Modification (UPDATE)        | ✅ Complet | ✅ Complet | Aucune     |
| Suppression (DELETE)         | ✅ Complet | ✅ Complet | Aucune     |
| **Customers (Particuliers)** |
| Lecture (SELECT)             | ✅ Complet | ✅ Complet | Aucune     |
| Création (INSERT)            | ✅ Complet | ✅ Complet | Aucune     |
| Modification (UPDATE)        | ✅ Complet | ✅ Complet | Aucune     |
| Suppression (DELETE)         | ✅ Complet | ✅ Complet | Aucune     |

---

### Module : Utilisateurs (DIFFÉRENCES CRITIQUES)

| Ressource / Action                | Owner                | Admin                     | Différence               |
| --------------------------------- | -------------------- | ------------------------- | ------------------------ |
| **User Profiles**                 |
| Lecture (SELECT)                  | ✅ Complet           | ✅ Complet                | Aucune                   |
| Création (INSERT)                 | ✅ Complet           | ❌ Interdit               | **Owner-only**           |
| Modification (UPDATE)             | ✅ Tous utilisateurs | ⚠️ Son profil uniquement  | **Différence majeure**   |
| Suppression (DELETE)              | ✅ Complet           | ❌ Interdit               | **Owner-only**           |
| **User Organisation Assignments** |
| Lecture (SELECT)                  | ✅ Complet           | ✅ Complet                | Aucune                   |
| Création (INSERT)                 | ✅ Complet           | ❌ Interdit               | **Owner-only**           |
| Modification (UPDATE)             | ✅ Complet           | ❌ Interdit               | **Owner-only**           |
| Suppression (DELETE)              | ✅ Complet           | ❌ Interdit               | **Owner-only**           |
| **User Activity Logs**            |
| Lecture (SELECT)                  | ✅ Complet           | ❌ Interdit               | **Owner-only**           |
| Création (INSERT)                 | ✅ Automatique       | ✅ Automatique            | Aucune (trigger système) |
| Modification (UPDATE)             | ❌ Interdit          | ❌ Interdit               | Immuable                 |
| Suppression (DELETE)              | ❌ Interdit          | ❌ Interdit               | Audit trail préservé     |
| **User Sessions**                 |
| Lecture (SELECT)                  | ✅ Complet           | ✅ Son session uniquement | **Différence majeure**   |
| Création (INSERT)                 | ✅ Automatique       | ✅ Automatique            | Aucune (Supabase Auth)   |
| Modification (UPDATE)             | ✅ Complet           | ⚠️ Sa session uniquement  | **Différence majeure**   |
| Suppression (DELETE)              | ✅ Complet           | ⚠️ Sa session uniquement  | **Différence majeure**   |

---

### Module : Exports & Rapports

| Ressource / Action    | Owner      | Admin       | Différence     |
| --------------------- | ---------- | ----------- | -------------- |
| **Exports CSV/PDF**   |
| Catalogue produits    | ✅ Complet | ✅ Complet  | Aucune         |
| Listes prix           | ✅ Complet | ✅ Complet  | Aucune         |
| Commandes ventes      | ✅ Complet | ✅ Complet  | Aucune         |
| Commandes achats      | ✅ Complet | ✅ Complet  | Aucune         |
| Mouvements stock      | ✅ Complet | ✅ Complet  | Aucune         |
| Rapports utilisateurs | ✅ Complet | ❌ Interdit | **Owner-only** |

---

### Module : Dashboard & Métriques

| Ressource / Action                    | Owner      | Admin       | Différence     |
| ------------------------------------- | ---------- | ----------- | -------------- |
| **Métriques Business**                |
| KPIs généraux (CA, commandes, stocks) | ✅ Complet | ✅ Complet  | Aucune         |
| Métriques équipe (activité users)     | ✅ Complet | ❌ Interdit | **Owner-only** |
| Performances individuelles            | ✅ Complet | ❌ Interdit | **Owner-only** |
| **Pages Dashboard**                   |
| /dashboard                            | ✅ Accès   | ✅ Accès    | Aucune         |
| /admin/users                          | ✅ Accès   | ❌ Interdit | **Owner-only** |
| /admin/activite-utilisateurs          | ✅ Accès   | ❌ Interdit | **Owner-only** |

---

## Légende

### Symboles d'Accès

- ✅ **Complet** : Accès total sans restriction (même logique Owner et Admin)
- ⚠️ **Restreint** : Accès partiel avec conditions (voir colonne Différence)
- ❌ **Interdit** : Aucun accès, action bloquée par RLS ou middleware

### Acronymes CRUD

- **C** (Create) : INSERT - Création de nouvelles entrées
- **R** (Read) : SELECT - Lecture des données existantes
- **U** (Update) : UPDATE - Modification des données existantes
- **D** (Delete) : DELETE - Suppression (soft ou hard selon table)

### Codes Couleur (si support visuel)

- 🟢 **Vert** : Droits identiques Owner/Admin
- 🔴 **Rouge** : Droits exclusifs Owner
- 🟡 **Jaune** : Droits restreints Admin (ex: son profil uniquement)

---

## Permissions Spéciales

### Owner Uniquement

| Action Spéciale                     | Description                                   | Justification Business                               |
| ----------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| **Gestion utilisateurs complète**   | Créer, modifier, supprimer profils users      | Contrôle hiérarchique équipe                         |
| **Voir métriques équipe**           | Dashboard propriétaire avec KPIs utilisateurs | Supervision performances                             |
| **Consulter activité utilisateurs** | Logs détaillés actions (user_activity_logs)   | Audit trail et traçabilité                           |
| **Modifier mots de passe users**    | Réinitialiser credentials autres utilisateurs | Support technique interne                            |
| **Accès pages admin**               | /admin/users, /admin/activite-utilisateurs    | Interface gestion équipe                             |
| **Validation dernière Owner**       | Trigger prevent_last_owner_deletion           | Sécurité tenant (impossible supprimer dernier Owner) |

---

### Admin : Restrictions Spécifiques

| Action Restreinte                 | Limitation                               | Raison Métier                 |
| --------------------------------- | ---------------------------------------- | ----------------------------- |
| **Modification profils users**    | Son profil uniquement (pas autres users) | Confidentialité et hiérarchie |
| **Visibilité métriques équipe**   | Dashboard sans KPIs utilisateurs         | Éviter comparaisons internes  |
| **Accès user_activity_logs**      | Aucun accès (Owner-only)                 | Audit trail hiérarchique      |
| **Gestion sessions utilisateurs** | Sa session uniquement                    | Sécurité et isolation         |
| **Création utilisateurs**         | Impossible                               | Validation Owner requise      |
| **Suppression utilisateurs**      | Impossible                               | Contrôle hiérarchique strict  |

---

### Permissions Communes (Owner + Admin)

| Action Partagée            | Description                           | Justification                 |
| -------------------------- | ------------------------------------- | ----------------------------- |
| **DELETE price_lists**     | Supprimer listes de prix complètes    | Flexibilité commerciale       |
| **Export complet données** | CSV/PDF toutes données business       | Autonomie opérationnelle      |
| **Validation workflows**   | Approuver commandes, consultations    | Processus métier décentralisé |
| **Configuration tenant**   | Paramètres organisation (hors users)  | Autonomie administration      |
| **Gestion CRM complète**   | CRUD organisations, contacts, clients | Opérations quotidiennes       |

---

## Exemples Cas d'Usage

### Scénario 1 : Nouveau Salarié Arrive

**Contexte** : L'équipe s'agrandit, un nouveau Admin doit être créé

**Acteur** : **Owner uniquement**

**Actions autorisées** :

1. ✅ Créer nouveau profil user_profiles (INSERT)
2. ✅ Assigner rôle 'admin' dans user_organisation_assignments
3. ✅ Définir email, mot de passe initial
4. ✅ Configurer permissions tenant spécifiques

**Actions bloquées** :

- ❌ **Admin ne peut PAS** créer ce nouveau profil (Owner-only)
- ❌ **Admin ne peut PAS** voir logs activité du nouveau salarié (Owner-only)

**Workflow** :

```
Owner → /admin/users → Créer utilisateur → Email invitation → Nouveau Admin login → Admin modifie son profil initial
```

---

### Scénario 2 : Admin Veut Modifier Son Mot de Passe

**Contexte** : Admin souhaite changer son mot de passe pour raisons sécurité

**Acteur** : **Admin (autonomie)**

**Actions autorisées** :

1. ✅ Accéder à son profil /settings/profile
2. ✅ Modifier son mot de passe (UPDATE user_profiles WHERE id = auth.uid())
3. ✅ Modifier nom, email, préférences personnelles
4. ✅ Déconnecter autres sessions (sa session uniquement)

**Actions bloquées** :

- ❌ **Admin ne peut PAS** modifier mot de passe d'un autre utilisateur
- ❌ **Admin ne peut PAS** voir sessions d'autres utilisateurs
- ❌ **Admin ne peut PAS** modifier rôle d'un autre utilisateur

**Workflow** :

```
Admin → /settings/profile → Modifier mot de passe → Sauvegarder → Logout automatique autres sessions
```

---

### Scénario 3 : Suppression Liste de Prix Obsolète

**Contexte** : Une price_list ancienne doit être supprimée (fournisseur arrêté)

**Acteur** : **Owner OU Admin** (droits identiques)

**Actions autorisées** :

1. ✅ Owner : DELETE FROM price_lists WHERE id = X
2. ✅ Admin : DELETE FROM price_lists WHERE id = X (identique)
3. ✅ Validation soft delete si customer_pricing référencés
4. ✅ Export CSV avant suppression (audit)

**Actions bloquées** :

- Aucune restriction (Owner et Admin peuvent tous deux DELETE price_lists)

**Workflow** :

```
Owner/Admin → /catalogue/listes-prix → Sélectionner liste obsolète → Supprimer → Confirmer → Soft delete appliqué
```

**Note** : Ancienne croyance corrigée - Admin PEUT DELETE price_lists (policy RLS validée 2025-10-16)

---

### Scénario 4 : Consultation Métriques Équipe

**Contexte** : Le propriétaire veut analyser performances équipe mensuelle

**Acteur** : **Owner uniquement**

**Actions autorisées** :

1. ✅ Accéder /admin/activite-utilisateurs
2. ✅ Voir métriques par utilisateur (commandes créées, consultations, exports)
3. ✅ Filtrer user_activity_logs par période
4. ✅ Exporter rapport CSV activité équipe

**Actions bloquées** :

- ❌ **Admin ne peut PAS** accéder à cette page (middleware redirect)
- ❌ **Admin ne peut PAS** voir user_activity_logs (RLS)
- ❌ **Admin ne peut PAS** exporter rapport équipe

**Workflow** :

```
Owner → /admin/activite-utilisateurs → Filtrer date → Voir tableau KPIs → Export CSV
Admin → Tente /admin/activite-utilisateurs → Redirect /dashboard (403 Forbidden)
```

---

### Scénario 5 : Création Commande Fournisseur

**Contexte** : Besoin sourcing produits pour projet client

**Acteur** : **Owner OU Admin** (droits identiques)

**Actions autorisées** :

1. ✅ Owner : Créer purchase_order (INSERT)
2. ✅ Admin : Créer purchase_order (INSERT, identique)
3. ✅ Relier items produits catalogue
4. ✅ Valider workflow approbation
5. ✅ Générer PDF bon de commande

**Actions bloquées** :

- Aucune restriction (Owner et Admin ont même politique RLS)

**Workflow** :

```
Owner/Admin → /achats/commandes → Nouvelle commande → Sélectionner fournisseur → Ajouter items → Valider → PDF généré
```

---

### Scénario 6 : Admin Essaie de Créer un Utilisateur

**Contexte** : Admin pense pouvoir aider en créant compte pour nouveau stagiaire

**Acteur** : **Admin (tentative échouée)**

**Actions autorisées** :

- ✅ Admin peut informer Owner de la demande
- ✅ Admin peut préparer informations (nom, email, rôle souhaité)

**Actions bloquées** :

- ❌ **Admin ne peut PAS** INSERT dans user_profiles (RLS)
- ❌ **Admin ne peut PAS** accéder /admin/users (middleware)
- ❌ **Admin ne peut PAS** créer user_organisation_assignments

**Workflow** :

```
Admin → Tente /admin/users → Redirect /dashboard (403)
Admin → Envoie demande Owner via email/chat
Owner → /admin/users → Créer utilisateur → Succès
```

**Erreur attendue** (si bypass middleware) :

```
Supabase RLS Error: Policy violation on table user_profiles
Required role: owner (current: admin)
```

---

## Liens Connexes

### Documentation Technique

- [RLS Policies Détaillées](/Users/romeodossantos/verone-back-office-V1/docs/auth/rls-policies.md)
- [Migration RLS Owner/Admin](/Users/romeodossantos/verone-back-office-V1/supabase/migrations/20251016_003_align_owner_admin_policies.sql)
- [Schéma Base de Données](/Users/romeodossantos/verone-back-office-V1/docs/database/schema-overview.md)

### Documentation Workflows

- [Workflow Quotidien Owner](/Users/romeodossantos/verone-back-office-V1/docs/workflows/owner-daily-workflow.md)
- [Workflow Quotidien Admin](/Users/romeodossantos/verone-back-office-V1/docs/workflows/admin-daily-workflow.md)

### Rapports Sécurité

- [Audit Sécurité Phase 3](/Users/romeodossantos/verone-back-office-V1/docs/reports/SECURITY-AUDIT-EXECUTIVE-SUMMARY.md)

---

## Résumé Exécutif

### Similitudes Owner/Admin (95%)

**Owner et Admin partagent TOUS les droits suivants** :

- ✅ CRUD complet : organisations, price_lists, products, sales_orders, purchase_orders, stock_movements
- ✅ DELETE : price_lists (contrairement à croyance initiale)
- ✅ Exports : CSV/PDF toutes données business
- ✅ Validation : workflows commandes, consultations
- ✅ CRM : CRUD organisations, contacts, clients particuliers
- ✅ Dashboard : KPIs business généraux

### Différences Owner/Admin (5%)

**Seules 3 différences critiques** :

1. **Gestion utilisateurs**
   - Owner : CRUD complet tous profils
   - Admin : Modifier son profil uniquement

2. **Visibilité équipe**
   - Owner : Métriques équipe + user_activity_logs
   - Admin : Aucun accès métriques équipe

3. **Pages admin**
   - Owner : /admin/users + /admin/activite-utilisateurs
   - Admin : Redirect 403 Forbidden

---

**Retour** : [Documentation Authentification](/Users/romeodossantos/verone-back-office-V1/docs/auth/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
