# Base de Données - Documentation Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

---

## Vue d'Ensemble

Cette section documente l'architecture complète de la base de données Supabase du système Vérone. Elle couvre le schéma ERD, les triggers de mise à jour automatique, les hooks (webhooks database), les fonctions RPC Supabase, et les procédures de migration.

**Technologies** : PostgreSQL 15+ via Supabase, RLS Policies, Triggers, Functions, Migrations.

---

## Fichiers de cette Section

### Documents Principaux

- **[schema-overview.md](./schema-overview.md)**
  Schéma complet avec ERD, tables, colonnes, types, relations, indexes

- **[triggers-hooks.md](./triggers-hooks.md)**
  Documentation des 10 triggers automatiques (MAJ métriques, audit logs, etc.)

- **[functions-rpc.md](./functions-rpc.md)**
  Fonctions RPC Supabase appelables depuis client (calculs complexes, batch operations)

### Guides

- **[migrations/README.md](./migrations/README.md)**
  Guide complet migrations : création, application, rollback, best practices

- **[migrations/applying-changes.md](./migrations/applying-changes.md)**
  Procédures détaillées pour appliquer changements schéma en production

---

## Liens Connexes

### Autres Sections Documentation

- [Authentification/RLS Policies](/Users/romeodossantos/verone-back-office-V1/docs/auth/rls-policies.md) - RLS par table
- [Métriques/Database Triggers](/Users/romeodossantos/verone-back-office-V1/docs/metrics/database-triggers.md) - Triggers métriques

### Manifests & Business Rules

- [Business Rules - Database](/Users/romeodossantos/verone-back-office-V1/manifests/business-rules/DATABASE.md)

### MEMORY-BANK

- [Sessions - Migrations](/Users/romeodossantos/verone-back-office-V1/MEMORY-BANK/sessions/) - Historique migrations critiques

---

## Navigation Rapide

### Par Thématique

#### Schéma & Structure
- [Schema Overview](./schema-overview.md)

#### Automatisation Database
- [Triggers & Hooks](./triggers-hooks.md)
- [Fonctions RPC](./functions-rpc.md)

#### Gestion Migrations
- [Guide Migrations](./migrations/README.md)
- [Appliquer Changements](./migrations/applying-changes.md)

### Par Type de Document

- **Référence Technique** : [schema-overview.md](./schema-overview.md), [functions-rpc.md](./functions-rpc.md)
- **Guide Pratique** : [migrations/README.md](./migrations/README.md), [migrations/applying-changes.md](./migrations/applying-changes.md)
- **Architecture** : [triggers-hooks.md](./triggers-hooks.md)

---

## Recherche Rapide

### Questions Fréquentes

**Q : Comment créer une nouvelle migration ?**
A : Voir [migrations/README.md](./migrations/README.md#création-migration)

**Q : Quels triggers sont exécutés sur INSERT products ?**
A : Voir [triggers-hooks.md](./triggers-hooks.md#products-table)

**Q : Comment appeler une fonction RPC depuis Next.js ?**
A : Voir [functions-rpc.md](./functions-rpc.md#usage-client-side)

### Mots-Clés

- **ERD** → [schema-overview.md](./schema-overview.md)
- **Triggers** → [triggers-hooks.md](./triggers-hooks.md)
- **RPC** → [functions-rpc.md](./functions-rpc.md)
- **Migrations** → [migrations/README.md](./migrations/README.md)

---

**Retour** : [Index Principal Documentation](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
