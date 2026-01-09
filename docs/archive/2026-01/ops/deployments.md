# Deployment Map - Verone Monorepo

## Apps et Projets Vercel

| App         | Projet Vercel        | URL Production                | Root Directory |
| ----------- | -------------------- | ----------------------------- | -------------- |
| Back-Office | `verone-back-office` | verone-back-office.vercel.app | `/`            |
| LinkMe      | `linkme`             | linkme.vercel.app             | `apps/linkme`  |

## Branches et Deploiement

| Branche        | Back-Office | LinkMe     |
| -------------- | ----------- | ---------- |
| `main`         | Production  | Production |
| PR vers `main` | Preview     | Preview    |

## Mecanisme de Deploiement

### Source de verite : Vercel Git Integration

Les deux projets sont connectes au repo `Verone2021/Verone-V1` via Vercel Git Integration.

**Declencheurs automatiques:**

- Push sur `main` → Deploy Production (les 2 apps)
- PR vers `main` → Deploy Preview (les 2 apps)
- Merge PR → Deploy Production (les 2 apps)

### GitHub Actions (complementaire)

Le workflow `.github/workflows/deploy-production.yml` execute des quality gates mais le deploy effectif est gere par Vercel Git Integration.

## Fichiers de Configuration

| Fichier                             | Role                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `/vercel.json`                      | Config Back-Office: build `@verone/back-office`, output `apps/back-office/.next` |
| `/apps/linkme/vercel.json`          | Config LinkMe: build `@verone/linkme`, output `.next`                            |
| `/.vercel/project.json`             | Project ID Vercel (linkme - ATTENTION: a corriger)                               |
| `/apps/linkme/.vercel/project.json` | Project ID Vercel (linkme)                                                       |

## Guard-Rails: Separation des Workflows

### Paths Filters (GitHub Actions)

Les workflows utilisent des filtres `paths:` pour ne se declencher que sur les fichiers pertinents:

**Back-Office (`pr-validation.yml`, `deploy-production.yml`):**

```yaml
paths:
  - 'apps/back-office/**'
  - 'packages/**'
  - 'package.json'
  - 'pnpm-lock.yaml'
  - 'turbo.json'
  - 'supabase/**'
```

**LinkMe (`linkme-validation.yml`):**

```yaml
paths:
  - 'apps/linkme/**'
  - 'packages/**'
  - 'package.json'
  - 'pnpm-lock.yaml'
  - 'turbo.json'
```

### Comportement par Scenario

| Fichiers modifies     | Back-Office CI | LinkMe CI  |
| --------------------- | -------------- | ---------- |
| `apps/back-office/**` | ✅ Execute     | ❌ Skip    |
| `apps/linkme/**`      | ❌ Skip        | ✅ Execute |
| `packages/**`         | ✅ Execute     | ✅ Execute |
| `supabase/**`         | ✅ Execute     | ❌ Skip    |
| `docs/**` seulement   | ❌ Skip        | ❌ Skip    |

### Vercel Ignored Build Step (Active)

Chaque app a un `ignoreCommand` dans son `vercel.json` qui skip le build si aucun fichier pertinent n'a change:

**Back-Office (`/vercel.json`):**

```json
"ignoreCommand": "git diff --quiet HEAD^ HEAD -- apps/back-office packages supabase ... && exit 1 || exit 0"
```

**LinkMe (`/apps/linkme/vercel.json`):**

```json
"ignoreCommand": "git diff --quiet HEAD^ HEAD -- apps/linkme packages ... && exit 1 || exit 0"
```

**Logique:**

- `exit 1` = Skip le build (pas de changements pertinents)
- `exit 0` = Proceed avec le build (changements detectes)

## Regles de Deploiement

### 1. Separation des apps

**REGLE**: 1 PR = 1 app OU 1 theme

- PR Back-Office: modifie uniquement `apps/back-office/**` + packages dependants
- PR LinkMe: modifie uniquement `apps/linkme/**` + packages dependants
- PR packages: modifie uniquement `packages/**` (impacte potentiellement les 2 apps)

### 2. Nomenclature branches

```
feat/back-office-<feature>   # Feature Back-Office
feat/linkme-<feature>        # Feature LinkMe
fix/back-office-<bug>        # Fix Back-Office
fix/linkme-<bug>             # Fix LinkMe
fix/packages-<scope>         # Fix packages partages
```

### 3. PR Integration (exceptionnelle)

Une PR "integration" (> 10 commits, plusieurs apps) est EXCEPTIONNELLE et requiert:

- Template strict: Summary par theme, Risks, Rollback, Test plan
- Nom: `integration/<date>-<description>`
- Review obligatoire

### 4. Rollback

En cas de probleme post-deploy:

1. Vercel Dashboard → Deployments → Redeploy previous version
2. Ou: `git revert <commit>` + push sur main

## Branch Protection (main)

Required checks:

- typescript-check
- Audit Database Schema
- Vitest Unit Tests
- Playwright E2E + Console Check
- Next.js Build Check

## Secrets Requis (GitHub Actions)

| Secret                  | Usage                 |
| ----------------------- | --------------------- |
| `VERCEL_TOKEN`          | Deploy via Vercel CLI |
| `VERCEL_ORG_ID`         | Organisation Vercel   |
| `VERCEL_PROJECT_ID`     | Projet Back-Office    |
| `SUPABASE_ACCESS_TOKEN` | DB Audit              |
| `DATABASE_URL`          | DB Audit              |

---

_Cree: 2025-12-29_
_Derniere mise a jour: 2025-12-29_
