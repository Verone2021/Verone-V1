# Authentification & Autorisations - Documentation Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

---

## Vue d'Ensemble

Cette section documente le système complet d'authentification et d'autorisation du système Vérone. Elle couvre les deux rôles principaux (Owner et Admin), les permissions par ressource, les RLS policies Supabase, les profils utilisateurs, et les flows d'authentification.

**Composants clés** : Row Level Security (RLS), JWT tokens, Supabase Auth, Profils multi-tenants.

---

## Fichiers de cette Section

### Documents Principaux

- **[roles-permissions-matrix.md](./roles-permissions-matrix.md)**
  Matrice complète des permissions Owner vs Admin par ressource (tables, modules, actions CRUD)

- **[rls-policies.md](./rls-policies.md)**
  Documentation détaillée des RLS policies Supabase par table avec code SQL

- **[user-profiles.md](./user-profiles.md)**
  Structure profils utilisateurs, champs metadata, relations tenant

- **[authentication-flows.md](./authentication-flows.md)**
  Workflows login/signup, récupération mot de passe, gestion sessions

---

## Liens Connexes

### Autres Sections Documentation

- [Database/Schema Overview](/Users/romeodossantos/verone-back-office-V1/docs/database/schema-overview.md) - Tables auth et users
- [Troubleshooting](/Users/romeodossantos/verone-back-office-V1/docs/troubleshooting/README.md) - Erreurs authentification courantes

### Manifests & Business Rules

- [Business Rules - Security](/Users/romeodossantos/verone-back-office-V1/manifests/business-rules/SECURITY.md)
- [Business Rules - Roles](/Users/romeodossantos/verone-back-office-V1/manifests/business-rules/ROLES-PERMISSIONS.md)

---

## Navigation Rapide

### Par Thématique

#### Permissions & Rôles
- [Matrice Rôles/Permissions](./roles-permissions-matrix.md)
- [Profils Utilisateurs](./user-profiles.md)

#### Sécurité Database
- [RLS Policies](./rls-policies.md)

#### Workflows Utilisateur
- [Flows Authentification](./authentication-flows.md)

---

## Recherche Rapide

### Questions Fréquentes

**Q : Comment ajouter une nouvelle permission à un rôle Admin ?**
A : Voir [roles-permissions-matrix.md](./roles-permissions-matrix.md#permissions-spéciales) et [rls-policies.md](./rls-policies.md)

**Q : Quel est le flow de signup pour un nouveau tenant ?**
A : Voir [authentication-flows.md](./authentication-flows.md#signup-flow)

### Mots-Clés

- **RLS** → [rls-policies.md](./rls-policies.md)
- **Owner vs Admin** → [roles-permissions-matrix.md](./roles-permissions-matrix.md)
- **JWT** → [authentication-flows.md](./authentication-flows.md)
- **Supabase Auth** → [authentication-flows.md](./authentication-flows.md)

---

**Retour** : [Index Principal Documentation](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
