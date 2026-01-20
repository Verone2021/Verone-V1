# Documentation Verone - Source de Verite

**Derniere mise a jour:** 2026-01-19

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
| [apps/linkme.md](./apps/linkme.md)         | Plateforme affiliation B2B    |

#### Documentation Complète LinkMe

| Doc                                                                  | Description                                                     |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| **[apps/linkme.md](./apps/linkme.md)**                               | 📘 Documentation principale (213 lignes)                        |
| **[apps/linkme/AUDIT-COMPLET-2025-12.md](./apps/linkme/AUDIT-COMPLET-2025-12.md)** | 🏆 Audit exhaustif (640 lignes) - CMS + App Affiliés          |
| [apps/linkme/architecture.md](./apps/linkme/architecture.md)         | 📐 Architecture technique (2 tables, RLS, triggers)             |
| [apps/linkme/commissions.md](./apps/linkme/commissions.md)           | 💰 Modèle de commission définitif (formules, sources de vérité) |
| [apps/linkme/commission-model.md](./apps/linkme/commission-model.md) | 💰 Complément modèle commission (2 types produits)             |
| [apps/linkme/workflows.md](./apps/linkme/workflows.md)               | 🔄 Workflows décembre 2025 (17 routes, 12 hooks)               |

#### Audits Historiques LinkMe

| Doc                                                                      | Description                        |
| ------------------------------------------------------------------------ | ---------------------------------- |
| [apps/linkme/audits/globe-3d-2026-01-16.md](./apps/linkme/audits/globe-3d-2026-01-16.md) | Audit sphère 3D (RLS, résolu)      |
| [apps/linkme/audits/presentation-figma.md](./apps/linkme/audits/presentation-figma.md)   | Designs Figma, maquettes UI        |

### Integrations

| Doc                                             | Description            |
| ----------------------------------------------- | ---------------------- |
| [integrations/qonto.md](./integrations/qonto.md) | Facturation, PDF       |
| [integrations/sentry.md](./integrations/sentry.md) | Monitoring erreurs     |
| [integrations/resend.md](./integrations/resend.md) | Emails LinkMe          |

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

_Version 2.0.0 - 2026-01-19 - Cleanroom from code (tolerance zero)_
