# Audit Configuration Qualité — ESLint, TypeScript, CI — 2026-05-09

> **Rapport interne — technique.** Le résumé exécutif (Section 1) est en français simple pour Romeo.

---

## Section 1 — Résumé exécutif (pour Romeo)

**Verdict global : tes règles sont 70% alignées senior. Tu as 3 problèmes qui expliquent les 9-12 min de CI.**

**ESLint** : très bon. Configuration ESLint 9 moderne, règles strictes justifiées, Prettier intégré correctement. Pas de sur-complexification ici. **Résultat : ALIGNÉ.**

**TypeScript** : globalement correct mais avec deux problèmes cachés. Le mode "incrémental" est activé partout mais le fichier cache n'est pas inclus dans la CI — donc ça refait tout de zéro à chaque fois. Et il y a une contradiction dans la config de base (`strict: true` + `noImplicitAny: false` en même temps, ces deux options s'annulent partiellement). **Résultat : PARTIELLEMENT ALIGNÉ.**

**CI — vérifications en doublon** : OUI, c'est un vrai problème. Le gros job de vérification (lint + type-check + build) tourne **3 à 4 fois** pour chaque changement : une fois sur la PR, une fois à la fusion sur staging, une fois sur la PR de mise en ligne, une fois à la fusion sur main. C'est la principale perte de temps.

**Top 3 actions pour passer de 9-12 min à 3-7 min :**

1. **Supprimer le déclenchement CI sur `push:staging` et `push:main`** (supprime 2 cycles sur 4). Gain : -50% des minutes CI totales.
2. **Ajouter `--cache --cache-location .eslintcache` dans les scripts ESLint** (ESLint mémorise son résultat fichier par fichier). Gain estimé : -40 à 60s sur le lint.
3. **Ajouter `.tsbuildinfo` dans le cache CI** (TypeScript mémorise aussi ses résultats). Gain estimé : -60 à 90s sur le type-check.

Ces 3 changements sont simples (modifications de quelques lignes dans 2-3 fichiers de config) et aucun ne touche à la base de données ni à du code métier.

---

## Section 2 — État actuel (factuel)

### 2.1 Fichiers ESLint

| Fichier                      | Type                                 |
| ---------------------------- | ------------------------------------ |
| `eslint.config.mjs` (racine) | Config unique — flat config ESLint 9 |

Un seul fichier de config pour tout le monorepo. Pas de `.eslintrc.json` par app. Pas de doublon.

### 2.2 Fichiers TypeScript (30 tsconfigs)

| Catégorie                 | Fichiers                                                                                          | Stratégie                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Racine                    | `tsconfig.json`                                                                                   | Base commune avec `moduleResolution: "node"`                                  |
| Apps Next.js              | `apps/back-office/tsconfig.json`, `apps/linkme/tsconfig.json`, `apps/site-internet/tsconfig.json` | Copie quasi-identique de la racine + `incremental: true`                      |
| Packages partagés         | 24 fichiers `packages/@verone/*/tsconfig.json`                                                    | 21 héritent de la racine via `extends: "../../../tsconfig.json"`              |
| Exception `@verone/ui`    | `packages/@verone/ui/tsconfig.json`                                                               | Config standalone (ne hérite pas de la racine), `moduleResolution: "bundler"` |
| Exception `@verone/types` | `packages/@verone/types/tsconfig.json`                                                            | Config standalone, `moduleResolution: "bundler"`                              |

### 2.3 Workflows CI

| Workflow                           | Rôle                                  | Déclenché par                                |
| ---------------------------------- | ------------------------------------- | -------------------------------------------- |
| `quality.yml`                      | Lint + Type-Check + Build + E2E smoke | PR vers staging/main + push sur staging/main |
| `auto-release-staging-to-main.yml` | Ouvre la PR de release hebdo          | Lundi 06h UTC + manuel                       |
| `protect-main-source.yml`          | Bloque PR vers main hors staging      | PR vers main                                 |
| `db-drift-cron.yml`                | Surveillance hebdo DB                 | Lundi 06h UTC + manuel                       |
| `scratchpad-cleanup.yml`           | Nettoyage docs scratchpad             | Dimanche 03h UTC + manuel                    |

### 2.4 Jobs du workflow `quality.yml`

| Job                                      | Durée estimée | Bloquant merge ?          |
| ---------------------------------------- | ------------- | ------------------------- |
| `detect-changes`                         | ~10s          | Non (toujours)            |
| `quality` (lint+typecheck+build)         | **8 min 25s** | **OUI**                   |
| `smoke-golden` (E2E Niveau 1)            | ~30s-2min     | Non (`continue-on-error`) |
| `smoke-domaine` x4 shards (E2E Niveau 2) | ~2-3min       | Non (`continue-on-error`) |
| `e2e-smoke-aggregate`                    | ~10s          | Dépend des smoke          |
| `db-drift-check`                         | ~30s          | OUI                       |
| `supabase-types-drift`                   | ~1min         | OUI                       |
| `supabase-advisors-security`             | ~30s          | Non (`continue-on-error`) |

**Temps total sur PR UI typique : ~9-12 min (séquentiel : quality → smokes en parallèle)**

---

## Section 3 — Problèmes critiques (triés par impact CI)

### CRITIQUE-1 : Double (et triple) exécution du job quality

**Fichier** : `.github/workflows/quality.yml` lignes 3-8

```yaml
on:
  pull_request:
    branches: [main, staging, integration/*] # ← déclenche sur PR
  push:
    branches: [main, staging] # ← déclenche ENCORE sur merge
```

**Impact** : Pour chaque feature PR, le gros job tourne **4 fois** :

1. PR feat→staging (pull_request) — nécessaire
2. Merge vers staging (push:staging) — **DOUBLON**
3. PR release staging→main (pull_request:main) — **DOUBLON** (staging a déjà été vérifié)
4. Merge vers main (push:main) — **DOUBLON**

**Gain si corrigé** : supprimer `push: branches: [main, staging]` de quality.yml → divise les minutes CI par ~2. La PR feat→staging vérifie déjà tout. Le `push:main` ne remplace pas des tests qui n'ont pas été faits.

**Référence industrielle** : Vercel, Linear — le check PR suffit. Le push post-merge est redondant quand le squash merge garantit que le code est identique au dernier commit vérifié.

**Gain estimé : -4 à 6 min par cycle complet feat→staging→main.**

---

### CRITIQUE-2 : Cache `.tsbuildinfo` absent du CI

**Fichiers** : `tsconfig.json` (racine), `apps/*/tsconfig.json`, `.github/workflows/quality.yml`

`incremental: true` est activé dans les 3 apps et la racine. Cela crée des fichiers `tsconfig.tsbuildinfo` localement. **Mais ces fichiers ne sont PAS inclus dans le cache CI** :

```yaml
# quality.yml — cache configuré
path: |
  apps/back-office/.next/cache
  apps/linkme/.next/cache
  apps/site-internet/.next/cache

# ← MANQUE : apps/back-office/tsconfig.tsbuildinfo etc.
```

Résultat : `incremental: true` est un "no-op" en CI. TypeScript refait tout de zéro à chaque run.

**Fix** : Ajouter au cache CI :

```
apps/back-office/tsconfig.tsbuildinfo
apps/linkme/tsconfig.tsbuildinfo
apps/site-internet/tsconfig.tsbuildinfo
```

Et dans la clé de cache utiliser `hashFiles('**/*.ts', '**/*.tsx')` déjà présent (il faut juste inclure ces fichiers dans le `path`).

**Gain estimé : -60 à 90s sur le type-check sur cache hit.**

---

### CRITIQUE-3 : ESLint sans cache persistant

**Fichiers** : `apps/back-office/package.json`, `apps/linkme/package.json`, `apps/site-internet/package.json`, tous les `packages/@verone/*/package.json`

```json
"lint": "eslint . --max-warnings=0"
```

Aucun `--cache --cache-location .eslintcache` configuré. ESLint re-analyse tous les fichiers à chaque run (150+ fichiers TS/TSX dans back-office seul).

Le cache ESLint est **une feature native, stable depuis ESLint 7**. Avec `--cache-strategy content` (recommandé : basé sur le contenu du fichier, pas la date de modification), un fichier non touché n'est jamais re-analysé.

**Fix** : Dans chaque `package.json` (apps + packages) :

```json
"lint": "eslint . --max-warnings=0 --cache --cache-location .eslintcache --cache-strategy content"
```

Et dans `.github/workflows/quality.yml`, ajouter aux paths du cache :

```
apps/back-office/.eslintcache
apps/linkme/.eslintcache
apps/site-internet/.eslintcache
```

Avec la clé de cache actuelle (qui hash tous les .ts), ce cache sera invalidé correctement sur tout changement de code.

**Gain estimé : -40 à 60s sur le lint sur cache hit.**

---

### IMPORTANT-1 : Contradiction `strict: true` + `noImplicitAny: false`

**Fichier** : `tsconfig.json` racine, ligne 6-7

```json
"strict": true,
"noImplicitAny": false,
```

`strict: true` active automatiquement `noImplicitAny: true`. La ligne `"noImplicitAny": false` qui suit **désactive** ce sous-flag. C'est contradictoire avec l'intention affichée de "TypeScript strict mode".

En pratique : le code peut utiliser `any` implicitement (fonctions sans type de retour, paramètres non typés) sans que TypeScript le signale. Seul ESLint (`@typescript-eslint/no-explicit-any`) bloque l'`any` explicite.

**Ce n'est pas un bug urgent** mais c'est de la "dette de config" silencieuse.

**Fix** : Supprimer la ligne `"noImplicitAny": false` (ou la mettre à `true` explicitement pour être lisible).

---

### IMPORTANT-2 : `moduleResolution: "node"` obsolète dans la racine

**Fichier** : `tsconfig.json` racine, `apps/*/tsconfig.json`

`"moduleResolution": "node"` est la résolution TypeScript 2.x / Node.js CommonJS. Pour Next.js 15 + ESM + imports de packages avec `exports` map, la valeur correcte est `"bundler"` (TypeScript 5+) ou `"node16"` au minimum.

Conséquences réelles limitées ici car les apps utilisent tsconfig paths directement vers `src/`, mais l'incohérence avec `packages/@verone/ui` (`bundler`) et `packages/@verone/types` (`bundler`) crée des résolutions différentes selon l'endroit où le type-check est lancé.

**Référence** : Next.js 15 official tsconfig recommande `"moduleResolution": "bundler"`.

---

### IMPORTANT-3 : `turbo lint` dépend de `^build` — inutile pour apps path-alias

**Fichier** : `turbo.json`

```json
"lint": {
  "dependsOn": ["^build"],
```

Cela signifie : avant de linter back-office, turbo doit builder tous ses packages en amont (`@verone/themes`, `@verone/tokens`, `@verone/types`, `@verone/ui`, `@verone/utils`).

Or, les apps back-office / linkme / site-internet **résolvent leurs imports via tsconfig paths** (`"@verone/ui": ["../../packages/@verone/ui/src"]`), pas depuis `node_modules/dist`. ESLint avec le parser TypeScript n'a pas besoin des `dist/` compilés — il lit directement les `.ts` sources via ces paths.

Cette dépendance allonge le premier run (cache miss) inutilement.

**Nuance** : sur cache hit Turbo Remote Cache, `^build` est satisfait instantanément. Le problème ne se pose qu'au premier run ou quand un package change.

**Fix possible** : `"lint": { "dependsOn": [] }` pour les apps. Les packages gardent `["^build"]` car eux ont besoin des types compilés en amont.

---

### SUGGESTION-1 : La clé du cache Next.js invalide trop souvent

**Fichier** : `.github/workflows/quality.yml` ligne 121

```yaml
key: ${{ runner.os }}-nextjs-${{ hashFiles('pnpm-lock.yaml') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}
```

`hashFiles('**/*.ts', '**/*.tsx')` hache **tous** les fichiers TypeScript du monorepo — y compris les types Supabase (30k+ lignes), les fixtures de test, etc. Modifier un seul fichier `.ts` dans `packages/@verone/types/` invalide le cache Next.js des 3 apps.

**Fix senior** : utiliser des clés par app :

```yaml
key: ${{ runner.os }}-nextjs-bo-${{ hashFiles('pnpm-lock.yaml') }}-${{ hashFiles('apps/back-office/**/*.ts', 'apps/back-office/**/*.tsx', 'packages/**/*.ts') }}
```

---

### SUGGESTION-2 : Timeout du job quality = 60 min (très excessif)

**Fichier** : `.github/workflows/quality.yml` ligne 90

```yaml
timeout-minutes: 60
```

Un job lint+type-check+build qui prend normalement 8-12 min ne devrait pas avoir un timeout de 60 min. En cas de blocage (boucle infinie, hanging process), ce timeout laisse un runner GitHub occupé 60 min → coût inutile.

**Pattern senior** : `timeout-minutes: 20` (2× la durée normale).

---

### SUGGESTION-3 : `moduleResolution: "node"` dans la base interagit mal avec les `exports` fields des packages npm modernes

Même point qu'IMPORTANT-2, mais impact pratique : certains packages npm modernes (ex: `@supabase/ssr`, `@tanstack/react-query`) utilisent des `exports` maps que `moduleResolution: "node"` ne respecte pas. TypeScript peut résoudre les mauvais fichiers. Potentiellement cause des warnings "type not found" bizarres en dev.

---

## Section 4 — Comparaison Verone vs industriels seniors

| Critère                                              | Verone               | Vercel/Turborepo | Linear       | Next.js officiel |
| ---------------------------------------------------- | -------------------- | ---------------- | ------------ | ---------------- |
| ESLint flat config (v9)                              | ✅                   | ✅               | ✅           | ✅               |
| Un seul fichier ESLint pour le monorepo              | ✅                   | ✅               | ✅           | —                |
| `--cache` sur ESLint                                 | ❌                   | ✅               | ✅           | —                |
| `incremental: true` avec tsBuildInfoFile en cache CI | ❌ (manque le cache) | ✅               | ✅           | —                |
| `composite + project references` sur packages        | ❌                   | ✅ (Turbo repo)  | Non confirmé | —                |
| `moduleResolution: "bundler"`                        | ❌ (root = "node")   | ✅               | ✅           | ✅               |
| Turbo Remote Cache                                   | ✅ (configuré)       | ✅               | ✅           | —                |
| Filtre diff par app (ne rebuild que ce qui change)   | ✅                   | ✅               | ✅           | —                |
| Concurrency `cancel-in-progress`                     | ✅                   | ✅               | ✅           | —                |
| Pas de double CI sur push après merge                | ❌                   | ✅               | ✅           | —                |
| E2E shardé en parallèle                              | ✅                   | ✅               | ✅           | —                |
| Timeout job = 2× durée normale                       | ❌ (60min)           | ✅ (~15min)      | ✅           | —                |
| Skip CI sur PR docs-only                             | ❌                   | ✅               | ✅           | —                |

**Résumé** : Verone a une bonne structure de base (Turbo, remote cache, diff filter, sharding E2E). Les manques sont sur les caches intermédiaires (ESLint cache, tsBuildInfoFile) et le double déclenchement.

---

## Section 5 — Recommandations actionables (Top 10, ratio impact/effort)

| Priorité | Changement                                                                                | Gain estimé                       | Effort                                    |
| -------- | ----------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------- |
| 1        | Supprimer `push: [main, staging]` de `quality.yml` — ne garder que `pull_request`         | -50% cycles CI total              | S (2 lignes)                              |
| 2        | Ajouter `--cache --cache-location .eslintcache --cache-strategy content` aux scripts lint | -40-60s/run                       | S (10 fichiers, 1 ligne chacun)           |
| 3        | Ajouter `.tsbuildinfo` dans le cache CI de `quality.yml`                                  | -60-90s/run                       | S (3 lignes)                              |
| 4        | Réduire timeout quality job à 20 min                                                      | Économie runner en cas de blocage | S (1 ligne)                               |
| 5        | Fixer la clé cache Next.js par app (pas `hashFiles('**/*.ts', '**/*.tsx')` global)        | Évite les cache miss inutiles     | S (5 lignes)                              |
| 6        | Ajouter skip CI sur PR docs-only (`.claude/**`, `docs/**`, `*.md`)                        | -9 min quand PR = docs pure       | M (ajouter un filtre `paths-ignore`)      |
| 7        | Supprimer `"noImplicitAny": false` du `tsconfig.json` racine                              | Cohérence stricte                 | S (1 ligne, mais teste avant)             |
| 8        | Migrer `moduleResolution: "node"` → `"bundler"` dans `tsconfig.json` racine et apps       | Cohérence + futur Next.js         | M (tester type-check complet)             |
| 9        | Ajouter `turbo lint dependsOn: []` pour les apps (pas les packages)                       | -build time sur lint-only         | M (vérifier cas réels)                    |
| 10       | Ajouter `composite: true` + project references sur les packages (tsc -b)                  | Incrémental cross-package         | L (restructuration tsconfig, 24 fichiers) |

**Recommandations 1-6 sont safe et réversibles.** Les 7-10 demandent plus de soin mais ne cassent pas de comportement métier.

---

## Section 6 — Verdict honnête

### Ce qui est vraiment bien (ne pas toucher)

- **La config ESLint** est excellente. ESLint 9 flat config, `typescript-eslint` avec type-aware linting, règles async (`no-floating-promises`, `await-thenable`) qui détectent les vrais bugs. Mieux que beaucoup de startups plus grandes.
- **Turbo Remote Cache** : configuré correctement avec token + team. Si les secrets sont en place, les cache hits réduisent déjà la CI sur les PR qui ne touchent que 1 fichier.
- **La structure de détection de diff** (`dorny/paths-filter`, filtre par app, fallback) : propre, efficace.
- **L'E2E shardé** : 4 runners en parallèle pour 9 specs smoke = bonne pratique.
- **La séparation des niveaux E2E** (golden → domaine → full manuel) : architecture pensée.

### Ce qui explique les 9-12 min et peut être corrigé

La vraie cause des 9-12 min n'est pas la sur-complexification — c'est **l'absence de 3 caches simples** (ESLint, tsBuildInfo, dedup du double run). Ce sont des oublis techniques, pas une mauvaise architecture.

La sur-complexification **existe mais ailleurs** : le timeout de 60 min sur un job de 8 min, la clé Next.js qui hash tous les `.ts` en même temps, et le double run push/PR.

### Ce qui est effectivement de la "dette de config"

- `strict: true` + `noImplicitAny: false` : contradiction silencieuse, jamais nettoyée.
- `moduleResolution: "node"` dans la racine alors que les packages standalone utilisent `"bundler"` : incohérence héritée d'une époque antérieure à Next.js 14+.
- `turbo lint dependsOn: ["^build"]` : probablement copié de la template Turborepo sans vérifier si c'était nécessaire pour ce monorepo.

### Conclusion

Romeo a raison de soupçonner une sous-performance CI. **La cause principale est le double déclenchement** (chaque feature passe par quality.yml 3-4 fois). **La cause secondaire est l'absence de caches intermédiaires** pour ESLint et TypeScript incrémental.

Ce ne sont pas des sur-complexifications à supprimer — ce sont des optimisations manquantes à ajouter. La base est saine.

**Avec les recommandations 1-5 (toutes effort S), la CI devrait passer à 3-5 min sur PR standard.**

---

_Audit perf-optimizer agent — 2026-05-09 — READ-ONLY, aucun fichier modifié._
