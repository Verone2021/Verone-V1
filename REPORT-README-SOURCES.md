# Rapport de Sources - README.md

Ce document liste les fichiers du repo utilises comme preuves pour chaque section du README.md.

**Date de generation** : 2025-12-17
**Commit de reference** : 0f65bef1

---

## Sources par Section

| Section README | Fichiers Sources |
|----------------|------------------|
| **Architecture Overview** | `turbo.json`, `pnpm-workspace.yaml`, `package.json` |
| **Repo Map** | `ls apps/`, `ls packages/@verone/`, `ls supabase/`, `ls docs/`, `ls .github/workflows/` |
| **Applications (table)** | `apps/back-office/package.json`, `apps/linkme/package.json`, `apps/site-internet/package.json` |
| **Applications (details)** | `apps/*/src/app/` (structure routes Next.js) |
| **Data Layer - Tables** | `supabase/migrations/*.sql`, `packages/@verone/types/src/supabase.ts` |
| **Auth & RLS** | `supabase/migrations/20251201_001_create_user_app_roles.sql`, `supabase/migrations/20251205_002_rls_linkme_selections.sql` |
| **Getting Started** | `package.json` (scripts), `.env.example` (si existe) |
| **Scripts & Commands** | `package.json` (section scripts) |
| **Documentation** | `docs/README.md`, `docs/current/*.md` (12 fichiers) |
| **Security** | `.gitignore`, `docs/legal/` (si existe) |
| **CI/CD** | `.github/workflows/*.yml` (8 fichiers) |
| **Contributing** | `CLAUDE.md` (Git Workflow section) |
| **Tech Stack** | `package.json` (dependencies + devDependencies) |

---

## Chiffres Verifies

| Metrique | Valeur | Source |
|----------|--------|--------|
| Applications | 3 | `ls apps/` |
| Packages @verone | 26 | `ls packages/@verone/` |
| Tables DB | 74 | `packages/@verone/types/src/supabase.ts` |
| Migrations | 74 | `ls supabase/migrations/*.sql | wc -l` |
| Workflows CI/CD | 8 | `ls .github/workflows/*.yml` |
| Docs canoniques | 12 | `ls docs/current/` |
| Composants UI | 54 | `packages/@verone/ui/` (selon CLAUDE.md) |

---

## Fichiers Non Verifies (TBD)

Ces elements sont mentionnes dans le README ancien mais non reverifies :

| Element | Raison |
|---------|--------|
| 93 dossiers business-rules | Mentionne dans docs/README.md, non compte |
| 28 modules metier | Compte approximatif des routes back-office |

---

## Methodologie

1. **Exploration** : 3 agents paralleles ont scanne le repo
2. **Verification** : Chaque chiffre est tire d'un fichier source identifie
3. **Comparaison** : README ancien (v3.1.0) compare aux preuves actuelles
4. **Mise a jour** : Corrections des chiffres obsoletes (157 migrations → 74)

---

*Genere automatiquement lors de la creation du README.md v5.0.0*
