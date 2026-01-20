# Documentation Verone - Source de Verite

**Derniere mise a jour:** 2026-01-20

Cette documentation est la **source unique de verite** pour le projet Verone.
Architecture basee sur le code reel, non sur des plans ou audits temporels.

---

## Table des Matieres

### Core Documentation

| Doc                                        | Description                      |
| ------------------------------------------ | -------------------------------- |
| [stack.md](./stack.md)                     | Technologies et versions         |
| [architecture.md](./architecture.md)       | Turborepo, apps, packages        |
| [database.md](./database.md)               | Supabase, migrations, RLS, stats |
| [security-auth.md](./security-auth.md)     | Auth, roles, permissions         |

### Applications

| Doc                                        | Description                   |
| ------------------------------------------ | ----------------------------- |
| [apps/back-office.md](./apps/back-office.md) | CRM/ERP - Structure & modules |
| [apps/linkme.md](./apps/linkme.md)         | Plateforme affiliation B2B - Hub central |

#### Documentation Complète LinkMe

**Consolidation 2026-01-20** : Documentation rationalisée, source de vérité unique par sujet (5 fichiers).

| Doc                                                                  | Description                                                     |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| **[apps/linkme/linkme.md](./apps/linkme/linkme.md)**                 | 📘 Hub central - Vue d'ensemble, navigation, statut (400 lignes)|
| [apps/linkme/architecture.md](./apps/linkme/architecture.md)         | 📐 Architecture technique (2 tables, RLS, triggers)             |
| [apps/linkme/commissions.md](./apps/linkme/commissions.md)           | 💰 Modèle commission consolidé (formules, sources de vérité)   |
| [apps/linkme/workflows.md](./apps/linkme/workflows.md)               | 🔄 Workflows détaillés (5 workflows complets, hooks)           |
| [apps/linkme/presentation-figma.md](./apps/linkme/presentation-figma.md) | 🎨 Designs Figma, maquettes UI                                |

### Product Requirements & Features

| Doc                                        | Description                          |
| ------------------------------------------ | ------------------------------------ |
| [prd/current/](./prd/current/)             | Product Requirements Documents (PRD) |
| [features/](./features/)                   | Feature specifications               |

### Engineering Standards & Business Rules

| Doc                                                      | Description                          |
| -------------------------------------------------------- | ------------------------------------ |
| [engineering/standards/](./engineering/standards/)       | Database, UI, code standards         |
| [engineering/business-rules/](./engineering/business-rules/) | Business logic documentation (WIP)   |
| [engineering/performance/](./engineering/performance/)   | Performance targets                  |

### Integrations

| Doc                                             | Description            |
| ----------------------------------------------- | ---------------------- |
| [integrations/qonto.md](./integrations/qonto.md) | Facturation, PDF       |
| [integrations/sentry.md](./integrations/sentry.md) | Monitoring erreurs     |
| [integrations/resend.md](./integrations/resend.md) | Emails LinkMe          |
| [integrations/google-merchant/](./integrations/google-merchant/) | Google Merchant setup  |

### Runbooks

| Doc                                                   | Description                |
| ----------------------------------------------------- | -------------------------- |
| [runbooks/deploy.md](./runbooks/deploy.md)            | Vercel, GitHub CI/CD       |
| [runbooks/development.md](./runbooks/development.md)  | Workflow dev quotidien     |

---

## Principes

### Source de Verite

- **Code reel > Docs** : En cas de conflit, le code gagne
- **Migrations DB > Docs** : Supabase migrations = source verite schema
- **Git history > Archives** : Pour retrouver anciennes versions

### Organisation

- **Pas de duplication** : 1 sujet = 1 fichier
- **Basee sur code** : Docs generees depuis codebase reelle
- **Concision** : Max 200 lignes par doc, liens vers code source

### Maintenance

1. Modifier le fichier concerne
2. Mettre a jour date en haut du fichier
3. Commit: `docs: update [fichier] - [description]`

---

## Ancienne Documentation

Les anciennes versions sont disponibles dans l'historique Git:

```bash
# Retrouver doc obsolete
git log -- docs/
git show <commit>:docs/fichier.md
```

---

## Liens Rapides

- **CLAUDE.md** - Instructions Claude Code (racine)
- **README.md** - Presentation projet (racine)
- **packages/README.md** - 25 packages @verone/*
- **supabase/migrations/** - Schema DB source verite

---

_Version 2.1.0 - 2026-01-20 - Consolidation LinkMe (source verite unique)_
