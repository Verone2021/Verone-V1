# Documentation Vérone Back Office

**Dernière mise à jour** : 2025-11-19
**Version** : 3.0 - Réorganisation complète selon best practices 2025
**Mainteneur** : Romeo Dos Santos

---

## Bienvenue

Documentation complète du système **Vérone Back Office**, CRM/ERP modulaire pour la décoration et le mobilier d'intérieur haut de gamme.

**Stack Technique** : Next.js 15 + Supabase + shadcn/ui + React + Tailwind CSS + Turborepo

**Nouveautés v3.0** :

- ✅ Guides réorganisés en 8 catégories thématiques
- ✅ Structure ADR (Architecture Decision Records)
- ✅ Documentation gestion projet (sprints, roadmap)
- ✅ Audits organisés par mois
- ✅ Workflow classification documentation

---

## Sections Principales

### 🔐 [Authentification & Autorisations](./auth/README.md)

Système de rôles (Owner/Admin), permissions, RLS policies, profils utilisateurs.

**Fichiers clés** :

- [Matrice Rôles & Permissions](./auth/roles-permissions-matrix.md)
- [RLS Policies](./auth/rls-policies.md)
- [Profils Utilisateurs](./auth/user-profiles.md)
- [Flows Authentification](./auth/authentication-flows.md)

---

### 🗄️ [Base de Données](./database/README.md)

Architecture database, schéma ERD, triggers, hooks, fonctions RPC, migrations.

**Fichiers clés** :

- [Schéma Overview](./database/schema-overview.md)
- [Triggers & Hooks](./database/triggers-hooks.md)
- [Fonctions RPC](./database/functions-rpc.md)
- [Guide Migrations](./database/migrations/README.md)

---

### 📊 [Métriques & Analytics](./metrics/README.md)

16 hooks dashboard, 10 triggers database, 20+ formules calcul, composants Recharts.

**Fichiers clés** :

- [Dashboard KPIs](./metrics/dashboard-kpis.md)
- [Métriques Business](./metrics/business-metrics.md)
- [Métriques Techniques](./metrics/technical-metrics.md)
- [Triggers Database](./metrics/database-triggers.md)
- [Formules de Calcul](./metrics/calculations.md)
- [Composants Graphiques](./metrics/components.md)

---

### 🔌 [API Reference](./api/README.md)

Endpoints REST, fonctions RPC Supabase, webhooks, intégrations externes.

**Fichiers clés** :

- [REST Endpoints](./api/rest-endpoints.md)
- [RPC Functions](./api/rpc-functions.md)
- [Webhooks](./api/webhooks.md)

---

### 📚 [Guides Pratiques](./guides/README.md)

**32 guides organisés en 8 catégories thématiques** (restructuration 2025-11-19).

**Catégories** :

- **01-Onboarding** - Nouveaux développeurs
- **02-Development** - Setup, tests, workflows quotidiens
- **03-Integrations** - Google Merchant, Qonto, services externes
- **04-Deployment** - CI/CD, Vercel, GitHub
- **05-Database** - Migrations, RLS, fixes
- **06-UI-UX** - Design, mockups, refontes
- **07-Troubleshooting** - Debugging, fixes urgents
- **08-Best-Practices** - Bonnes pratiques, maintenance

**Guide démarrage rapide** : [guides/README.md](./guides/README.md)

---

### 🏗️ [Architecture Système](./architecture/README.md)

Tech stack, design system V2 2025, patterns architecture, sécurité, **ADR (Architecture Decision Records)**.

**Fichiers clés** :

- [Tech Stack](./architecture/tech-stack.md)
- [Design System V2](./architecture/design-system.md)
- [Security Architecture](./architecture/security.md)
- **[ADR (Architecture Decision Records)](./architecture/decisions/README.md)** ⭐ NOUVEAU
  - [ADR-0001: Turborepo Monorepo](./architecture/decisions/0001-turborepo-monorepo.md)
  - [Template ADR](./architecture/decisions/adr-template.md)

---

### 📋 [Gestion Projet](./project-management/README.md) ⭐ NOUVEAU

Roadmap, sprints planning, retrospectives, métriques vélocité.

**Fichiers clés** :

- [Roadmap Développement](./project-management/roadmap-developpement.md)
- [Workflow Sprint](./project-management/README.md#-workflow-sprint)
- [Métriques Clés](./project-management/README.md#-métriques-clés)

**Sous-dossiers** :

- `sprint-planning/` - Plans de sprints
- `retrospectives/` - Rétrospectives équipe
- `metrics/` - Vélocité, burndown, KPI

---

### 🔍 [Audits](./audits/) ⭐ NOUVEAU

Rapports audits, tests, conformité organisés par mois.

**Organisation** :

- `2025-11/` - Novembre 2025 (68 fichiers)
- `2025-10/` - Octobre 2025
- ...

**Derniers audits** :

- [Audit Boutons CRUD Complet](./audits/2025-11/AUDIT-BOUTONS-CRUD-COMPLET.md)
- [Rapport Formulaires Packlink](./audits/2025-11/RAPPORT-COMPARAISON-FORMULAIRES-PACKLINK-2025-11-12.md)

---

### 🔄 [Workflows Business](./workflows/README.md)

Workflows quotidiens Owner/Admin, lifecycle commandes, mouvements stock, validation sourcing.

**Fichiers clés** :

- [Owner Daily Workflow](./workflows/owner-daily-workflow.md)
- [Admin Daily Workflow](./workflows/admin-daily-workflow.md)
- [Orders Lifecycle](./workflows/orders-lifecycle.md)
- [Stock Movements](./workflows/stock-movements.md)
- [Sourcing Validation](./workflows/sourcing-validation.md)

---

### 🔧 [Troubleshooting](./troubleshooting/README.md)

Erreurs courantes, debugging console, résolution problèmes.

**Fichiers clés** :

- [Common Errors](./troubleshooting/common-errors.md)
- [Console Debugging](./troubleshooting/console-debugging.md)

---

## Navigation Rapide

### Par Rôle Utilisateur

- **Développeur Backend** → [Database](./database/README.md), [API](./api/README.md), [Metrics](./metrics/README.md)
- **Développeur Frontend** → [Architecture](./architecture/README.md), [Guides](./guides/README.md), [Workflows](./workflows/README.md)
- **Product Owner** → [Workflows](./workflows/README.md), [Metrics](./metrics/README.md)
- **DevOps** → [Guides/Deployment](./guides/deployment.md), [Database/Migrations](./database/migrations/README.md)

### Par Cas d'Usage

- **Nouvelle Feature** → [Architecture](./architecture/README.md) + [Database Schema](./database/schema-overview.md)
- **Bug Résolution** → [Troubleshooting](./troubleshooting/README.md) + [RLS Policies](./auth/rls-policies.md)
- **Onboarding** → [Quickstart](./guides/quickstart.md) + [Tech Stack](./architecture/tech-stack.md)
- **Ajout Métrique** → [Metrics](./metrics/README.md) + [Database Triggers](./database/triggers-hooks.md)

---

## Ressources Complémentaires

### Manifests (Business Rules)

- [Business Rules](/Users/romeodossantos/verone-back-office-V1/manifests/business-rules/)
- [PRDs (Product Requirements)](/Users/romeodossantos/verone-back-office-V1/manifests/prd/)
- [Features Roadmap](/Users/romeodossantos/verone-back-office-V1/manifests/features/)

### MEMORY-BANK (Context)

- [Sessions](/Users/romeodossantos/verone-back-office-V1/MEMORY-BANK/sessions/)
- [Process Learnings](/Users/romeodossantos/verone-back-office-V1/MEMORY-BANK/process-learnings/)
- [Architecture Decisions](/Users/romeodossantos/verone-back-office-V1/MEMORY-BANK/architecture-decisions/)

### Templates Documentation

- [Matrice Rôles/Permissions](/Users/romeodossantos/verone-back-office-V1/docs/.templates/roles-permissions-matrix.md)
- [Documentation Métrique](/Users/romeodossantos/verone-back-office-V1/docs/.templates/metric-documentation.md)
- [README Section](/Users/romeodossantos/verone-back-office-V1/docs/.templates/section-readme.md)

---

## Conventions

- **Naming** : kebab-case pour fichiers et dossiers
- **Profondeur** : Maximum 3 niveaux (docs/section/category/fichier.md)
- **README** : Obligatoire pour chaque section et catégorie
- **Headers** : Standard avec date MAJ, version, mainteneur
- **Liens** : Chemins relatifs pour navigation intra-section, absolus pour inter-sections
- **Classification** : ⭐ **OBLIGATOIRE** - Consulter workflow dans [CLAUDE.md](/CLAUDE.md#-classification-documentation-workflow-obligatoire)

Voir [CONVENTIONS.md](./CONVENTIONS.md) pour détails complets.

---

## Contribuer

### Workflow Classification Documentation

**RÈGLE ABSOLUE** : Avant créer rapport/audit/documentation, **TOUJOURS consulter** :

```
CLAUDE.md → Section "📁 CLASSIFICATION DOCUMENTATION (WORKFLOW OBLIGATOIRE)"
```

**Matrice de classification** :

1. Identifier type document (Audit, Guide, ADR, Rapport)
2. Déterminer destination selon matrice TypeScript
3. Vérifier sous-dossier existe (créer + README.md si besoin)
4. Nommer fichier : `TYPE-sujet-date.md`

**Exemples** :

- Audit → `docs/audits/2025-11/AUDIT-FEATURE.md`
- Guide intégration → `docs/guides/03-integrations/service/guide.md`
- ADR → `docs/architecture/decisions/XXXX-titre.md`

Voir [CLAUDE.md](/CLAUDE.md) pour workflow complet avec 6-point checklist.

---

## Contribuer (Général)

1. ✅ **Consulter workflow classification** dans [CLAUDE.md](/CLAUDE.md)
2. ✅ Consulter [Conventions](./CONVENTIONS.md)
3. ✅ Utiliser templates dans `.templates/`
4. ✅ Respecter structure à 3 niveaux max
5. ✅ Mettre à jour README catégorie si ajout fichier
6. ✅ Mettre à jour ce README si ajout section

---

## Historique des Versions

| Date       | Version | Changements Majeurs                                                |
| ---------- | ------- | ------------------------------------------------------------------ |
| 2025-11-19 | 3.0     | ⭐ Réorganisation complète : 8 catégories guides, ADR, projet mgmt |
| 2025-10-16 | 2.0     | Refonte complète structure - 8 sections principales                |
| 2024-09-26 | 1.0     | Création initiale documentation                                    |

**Changelog 3.0** :

- ✅ Guides réorganisés : 32 fichiers → 8 catégories thématiques
- ✅ Structure ADR créée : README, template, ADR-0001 (Turborepo)
- ✅ Nouveau dossier `project-management/` (roadmap, sprints)
- ✅ Audits organisés par mois : `audits/YYYY-MM/`
- ✅ Workflow classification documentation dans CLAUDE.md
- ✅ 11 README.md créés (guides categories + ADR + project mgmt)

---

**Vérone Back Office 2025** - Professional AI-Assisted CRM/ERP Development
**Phase 4 Turborepo** - Multi-frontends Architecture (3 apps + 25 packages)
