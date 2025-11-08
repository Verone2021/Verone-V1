# 🏗️ Plan de Migration Monorepo

**Status** : Préparation (à exécuter après Phase 1)
**Date création** : 2025-10-21
**Responsable** : Romeo Dos Santos

---

## 📋 Vue d'ensemble

Ce document décrit le plan détaillé de migration du projet Vérone Back Office vers une architecture monorepo.

**Pourquoi monorepo ?**

- Partage code facilité (UI, types, KPI, utils)
- Build optimisé (Turborepo/Nx : build uniquement code modifié)
- Versioning cohérent
- DX améliorée (générateurs, scripts communs)
- Scalabilité (ajout apps/services facile)

**Quand migrer ?**

- ✅ Phase 1 déployée en production stable
- ✅ Tous modules core validés (auth, catalogue, commandes, stock)
- ✅ Storybook complet avec tous composants documentés
- ✅ KPI centralisés en YAML
- ✅ Zero erreur console sur tous workflows

---

## 🎯 Architecture cible

```
verone-monorepo/
├── apps/
│   ├── api/          # Backend NestJS (REST + GraphQL)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── catalogue/
│   │   │   │   ├── orders/
│   │   │   │   ├── stock/
│   │   │   │   └── ...
│   │   │   ├── database/
│   │   │   │   ├── migrations/
│   │   │   │   └── seeds/
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/          # Frontend Next.js 15
│       ├── app/      # App Router pages
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── lib/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── ui/           # Design system Storybook
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── tokens/
│   │   │   ├── themes/
│   │   │   └── index.ts
│   │   ├── .storybook/
│   │   ├── stories/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── kpi/          # KPI YAML + hooks
│   │   ├── stock/
│   │   ├── sales/
│   │   ├── finance/
│   │   ├── hooks/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/        # DTO communs API ↔ Web
│   │   ├── src/
│   │   │   ├── catalogue/
│   │   │   ├── orders/
│   │   │   ├── stock/
│   │   │   ├── auth/
│   │   │   └── common/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config/       # Configs partagées
│   │   ├── eslint/
│   │   ├── typescript/
│   │   ├── prettier/
│   │   └── package.json
│   └── utils/        # Helpers communs
│       ├── src/
│       │   ├── formatters/
│       │   ├── validators/
│       │   ├── calculators/
│       │   └── helpers/
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
│
├── tools/
│   ├── scripts/
│   │   ├── audit/
│   │   ├── migration/
│   │   └── seeds/
│   └── generators/
│       └── plop/     # Templates générateurs code
│
├── docs/             # Documentation (inchangée)
├── supabase/         # Migrations DB (inchangée)
├── .github/          # GitHub Actions (mise à jour)
├── turbo.json        # Configuration Turborepo
├── package.json      # Root package.json
└── README.md         # Documentation principale
```

---

## 📝 Plan de migration (7 étapes)

### Étape 1 : Préparation infrastructure

**Durée estimée** : 2 jours
**Risque** : Faible

**Actions** :

1. Initialiser Turborepo
   ```bash
   npx create-turbo@latest verone-monorepo
   ```
2. Créer structure dossiers apps/ et packages/
3. Configurer turbo.json (pipelines build, test, lint)
4. Configurer root package.json (workspaces)
5. Migrer .github/workflows pour build sélectif

**Validation** :

- [ ] `npm install` fonctionne à la racine
- [ ] `turbo run build` exécute sans erreur
- [ ] Git history préservé

---

### Étape 2 : Migration packages/ui (Storybook)

**Durée estimée** : 3-5 jours
**Risque** : Moyen

**Actions** :

1. Créer packages/ui/ avec package.json
2. Migrer src/components/ui-v2/ → packages/ui/src/components/
3. Migrer src/lib/design-system/ → packages/ui/src/tokens/
4. Migrer src/lib/theme-v2.ts → packages/ui/src/themes/
5. Migrer .storybook/ → packages/ui/.storybook/
6. Migrer stories/ → packages/ui/stories/
7. Configurer build (tsup ou Vite)
8. Publier package local (@verone/ui)

**Validation** :

- [ ] Storybook fonctionne : `npm run storybook` dans packages/ui/
- [ ] Build réussi : `npm run build` dans packages/ui/
- [ ] Import fonctionne : `import { Button } from '@verone/ui'`
- [ ] Types TypeScript corrects

---

### Étape 3 : Migration packages/types

**Durée estimée** : 2 jours
**Risque** : Faible

**Actions** :

1. Créer packages/types/ avec package.json
2. Migrer src/types/ → packages/types/src/
3. Séparer en modules (catalogue/, orders/, stock/, auth/, common/)
4. Configurer build TypeScript
5. Publier package local (@verone/types)

**Validation** :

- [ ] Build réussi : `npm run build` dans packages/types/
- [ ] Import fonctionne : `import { Product } from '@verone/types'`
- [ ] Types disponibles dans apps/web et apps/api

---

### Étape 4 : Migration apps/web (Next.js actuel)

**Durée estimée** : 5-7 jours
**Risque** : Moyen

**Actions** :

1. Créer apps/web/ avec Next.js setup
2. Migrer src/app/ → apps/web/app/
3. Migrer src/components/ → apps/web/components/ (sauf ui-v2)
4. Migrer src/hooks/ → apps/web/hooks/ (sauf KPI)
5. Migrer src/lib/ → apps/web/lib/
6. Remplacer imports locaux par packages monorepo
   - `@/components/ui-v2` → `@verone/ui`
   - `@/types` → `@verone/types`
7. Configurer next.config.js pour monorepo
8. Tester toutes pages et features

**Validation** :

- [ ] `npm run dev` fonctionne dans apps/web/
- [ ] Toutes pages accessibles
- [ ] Zero console errors
- [ ] Tests E2E passent
- [ ] Build production réussi

---

### Étape 5 : Création apps/api (NestJS nouveau)

**Durée estimée** : 10-15 jours
**Risque** : Élevé

**Actions** :

1. Initialiser NestJS : `nest new api`
2. Créer modules (auth, catalogue, orders, stock)
3. Migrer logique métier depuis Next.js API Routes
4. Configurer connexion Supabase (Prisma ou TypeORM)
5. Implémenter REST endpoints
6. Implémenter GraphQL (optionnel, Phase 2+)
7. Tests unitaires + intégration
8. Documentation API (Swagger)

**Migration progressive des endpoints** :

```
Phase 1 : Module Auth
Phase 2 : Module Catalogue
Phase 3 : Module Orders
Phase 4 : Module Stock
Phase 5 : Modules avancés (feeds, analytics)
```

**Validation par module** :

- [ ] Tests unitaires passent (coverage > 80%)
- [ ] Tests E2E API passent (Postman/Insomnia)
- [ ] Documentation Swagger à jour
- [ ] Frontend compatible (proxy Next.js vers NestJS)

---

### Étape 6 : Migration progressive API Routes → NestJS

**Durée estimée** : 15-20 jours
**Risque** : Élevé

**Stratégie** : Feature flags + Proxy

**Actions** :

1. Configurer proxy Next.js → NestJS (next.config.js rewrites)
2. Activer feature flag par module
   ```typescript
   // .env
   USE_NESTJS_AUTH = true;
   USE_NESTJS_CATALOGUE = false;
   ```
3. Migrer module par module :
   - a. Tests complets en staging
   - b. Activation 10% traffic production
   - c. Monitoring metrics (latence, erreurs)
   - d. Rollout 100% si OK
   - e. Suppression ancien code Next.js API
4. Désactiver proxy quand 100% endpoints migrés

**Validation par module** :

- [ ] Metrics identiques (latence, erreur rate)
- [ ] Zero console errors frontend
- [ ] Tests E2E passent
- [ ] Rollback testé et documenté

---

### Étape 7 : Cleanup et optimisations finales

**Durée estimée** : 3-5 jours
**Risque** : Faible

**Actions** :

1. Supprimer code obsolète (ancien src/, API Routes migrées)
2. Optimiser builds Turborepo
3. Configurer caching Turborepo (local + remote)
4. Mettre à jour documentation (README, CLAUDE.md)
5. Mettre à jour CI/CD (GitHub Actions)
6. Former équipe sur nouvelle structure

**Validation finale** :

- [ ] Build monorepo complet < 5 min
- [ ] Zero dead code (audit knip)
- [ ] Zero cycles dépendances (audit madge)
- [ ] Documentation à jour
- [ ] Formation équipe complétée

---

## ⏱️ Timeline estimée

| Étape             | Durée  | Dépendances | Risque |
| ----------------- | ------ | ----------- | ------ |
| 1. Infrastructure | 2j     | -           | Faible |
| 2. packages/ui    | 3-5j   | Étape 1     | Moyen  |
| 3. packages/types | 2j     | Étape 1     | Faible |
| 4. apps/web       | 5-7j   | Étapes 2, 3 | Moyen  |
| 5. apps/api       | 10-15j | Étape 3     | Élevé  |
| 6. Migration API  | 15-20j | Étapes 4, 5 | Élevé  |
| 7. Cleanup        | 3-5j   | Toutes      | Faible |

**Total** : 40-56 jours ouvrés (8-12 semaines)

---

## ⚠️ Risques identifiés

### Risque 1 : Breaking changes API

**Probabilité** : Moyenne
**Impact** : Élevé
**Mitigation** :

- Feature flags obligatoires
- Tests E2E complets
- Monitoring metrics temps réel
- Rollback instantané préparé

### Risque 2 : Performance dégradée

**Probabilité** : Faible
**Impact** : Moyen
**Mitigation** :

- Benchmarks avant/après
- Optimisation queries DB
- Caching agressif (Redis future)
- Load testing (k6 ou Artillery)

### Risque 3 : TypeScript errors cascade

**Probabilité** : Moyenne
**Impact** : Moyen
**Mitigation** :

- Migration incrémentale
- Types stricts dès packages/
- CI/CD bloque si erreurs types

### Risque 4 : Dead code non détecté

**Probabilité** : Faible
**Impact** : Faible
**Mitigation** :

- Audits knip réguliers
- Code review strict
- Bundle size monitoring

---

## ✅ Checklist de démarrage migration

Avant de commencer Étape 1, vérifier :

- [ ] Phase 1 déployée en production stable (> 1 mois)
- [ ] Zero bug critique en production
- [ ] Storybook complet (tous composants documentés)
- [ ] KPI documentés en YAML (au moins 10 KPI)
- [ ] Tests E2E critiques passent 100%
- [ ] Performance SLOs respectés (Dashboard <2s, etc.)
- [ ] Équipe formée sur monorepo concept
- [ ] Backup complet base données effectué
- [ ] Plan rollback validé
- [ ] Environnement staging prêt

---

## 📚 Ressources

**Documentation officielle** :

- [Turborepo Docs](https://turbo.build/repo/docs)
- [NestJS Docs](https://docs.nestjs.com/)
- [Monorepo Best Practices](https://monorepo.tools/)

**Templates** :

- packages/ui/package.json.template
- apps/api/tsconfig.json.template
- turbo.json.template

**Scripts** :

- tools/scripts/migration/migrate-component-to-ui.sh
- tools/scripts/migration/migrate-api-route-to-nestjs.sh

---

**Créé** : 2025-10-21
**À exécuter** : Après Phase 1
**Responsable** : Romeo Dos Santos
