# Matrice Rôles et Permissions - [Nom Ressource]

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

## Table des matières

- [Introduction](#introduction)
- [Matrice de Permissions](#matrice-de-permissions)
- [Légende](#légende)
- [Permissions Spéciales](#permissions-spéciales)
- [Exemples Cas d'Usage](#exemples-cas-dusage)
- [Liens Connexes](#liens-connexes)

---

## Introduction

Cette matrice définit les permissions d'accès pour la ressource **[Nom Ressource]** selon les deux rôles principaux du système Vérone :

- **Owner** : Propriétaire du tenant avec accès complet et droits administratifs
- **Admin** : Administrateur avec accès restreint selon les règles métier

### Contexte Système

Le système Vérone utilise Row Level Security (RLS) de Supabase pour garantir l'isolation des données par tenant et le respect des permissions par rôle.

---

## Matrice de Permissions

| Ressource / Action    | Owner      | Admin        | Notes                                   |
| --------------------- | ---------- | ------------ | --------------------------------------- |
| **[Table/Module 1]**  |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet   | Accès à toutes les entrées du tenant    |
| Création (INSERT)     | ✅ Complet | ⚠️ Restreint | Admin : selon règles métier spécifiques |
| Modification (UPDATE) | ✅ Complet | ⚠️ Restreint | Admin : champs limités (voir détails)   |
| Suppression (DELETE)  | ✅ Complet | ❌ Interdit  | Soft delete uniquement pour Owner       |
| **[Table/Module 2]**  |
| Lecture (SELECT)      | ✅ Complet | ✅ Complet   |                                         |
| Création (INSERT)     | ✅ Complet | ✅ Complet   |                                         |
| Modification (UPDATE) | ✅ Complet | ⚠️ Restreint |                                         |
| Suppression (DELETE)  | ✅ Complet | ❌ Interdit  |                                         |

---

## Légende

### Symboles d'Accès

- ✅ **Complet** : Accès total sans restriction
- ⚠️ **Restreint** : Accès partiel avec conditions (voir détails)
- ❌ **Interdit** : Aucun accès, action bloquée par RLS

### Acronymes CRUD

- **C** (Create) : INSERT - Création de nouvelles entrées
- **R** (Read) : SELECT - Lecture des données existantes
- **U** (Update) : UPDATE - Modification des données existantes
- **D** (Delete) : DELETE - Suppression (soft ou hard)

---

## Permissions Spéciales

### Owner Uniquement

| Action Spéciale       | Description                          | Justification           |
| --------------------- | ------------------------------------ | ----------------------- |
| Export complet        | Export CSV/PDF toutes données tenant | Propriété données       |
| Archivage massif      | Archivage de multiples entrées       | Gestion administrative  |
| Configuration système | Modification paramètres tenant       | Contrôle infrastructure |
| Gestion utilisateurs  | CRUD complet sur profils Admin       | Sécurité hiérarchique   |

### Admin Restrictions

| Action Restreinte      | Limitation               | Raison Métier           |
| ---------------------- | ------------------------ | ----------------------- |
| Suppression définitive | Soft delete uniquement   | Audit trail obligatoire |
| Modification prix      | Validation Owner requise | Contrôle commercial     |
| Export client sensible | Données anonymisées      | Conformité RGPD         |

---

## Exemples Cas d'Usage

### Scénario 1 : [Titre Cas d'Usage]

**Contexte** : [Description situation]

**Acteur** : Owner / Admin

**Actions autorisées** :

1. [Action 1 avec permission]
2. [Action 2 avec permission]

**Actions bloquées** :

- [Action bloquée avec raison]

---

### Scénario 2 : [Titre Cas d'Usage]

**Contexte** : [Description situation]

**Acteur** : Owner / Admin

**Actions autorisées** :

1. [Action 1 avec permission]

**Actions bloquées** :

- [Action bloquée avec raison]

---

## Liens Connexes

- [RLS Policies](/Users/romeodossantos/verone-back-office-V1/docs/auth/rls-policies.md)
- [Profils Utilisateurs](/Users/romeodossantos/verone-back-office-V1/docs/auth/user-profiles.md)
- [Schéma Base de Données](/Users/romeodossantos/verone-back-office-V1/docs/database/schema-overview.md)

---

**Retour** : [Documentation Authentification](/Users/romeodossantos/verone-back-office-V1/docs/auth/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
