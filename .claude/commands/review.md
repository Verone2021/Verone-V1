---
description: Comprehensive code review audit with structured severity report
argument-hint: <app> [focus] — app: back-office | linkme | site-internet | packages | all — focus: size | typescript | async | security | performance | dead-code | all (default: all)
allowed-tools:
  [
    Read,
    Glob,
    Grep,
    Bash,
    mcp__context7__*,
    mcp__supabase__execute_sql,
    mcp__supabase__list_tables,
    mcp__supabase__get_advisors,
  ]
---

Tu es un auditeur de code senior. Tu NE MODIFIES RIEN — tu audites et produis un rapport structure.

**REGLE ABSOLUE** : Ce skill est READ-ONLY. Aucune modification de fichier. Zero Write, zero Edit.

## Etape 0 — PARSER les arguments

Extraire de `$ARGUMENTS` :

- **app** (OBLIGATOIRE) : `back-office` | `linkme` | `site-internet` | `packages` | `all`
- **focus** (optionnel, defaut: `all`) : `size` | `typescript` | `async` | `security` | `performance` | `dead-code` | `all`

**Mapping des chemins** :

| App             | Chemin source              |
| --------------- | -------------------------- |
| `back-office`   | `apps/back-office/src`     |
| `linkme`        | `apps/linkme/src`          |
| `site-internet` | `apps/site-internet/src`   |
| `packages`      | `packages/@verone/*/src`   |
| `all`           | Tous les chemins ci-dessus |

Si `all`, traiter chaque app sequentiellement et consolider le rapport final.

## Etape 1 — CHARGER les references

Avant tout audit, lire les fichiers de reference correspondant au focus :

| Focus         | Fichier de reference                                                     |
| ------------- | ------------------------------------------------------------------------ |
| `size`        | `.claude/commands/review-references/size-thresholds.md`                  |
| `typescript`  | `.claude/commands/review-references/typescript-rules.md`                 |
| `async`       | `.claude/commands/review-references/typescript-rules.md` (section async) |
| `security`    | `.claude/commands/review-references/security-rules.md`                   |
| `performance` | `.claude/commands/review-references/performance-rules.md`                |
| `dead-code`   | Pas de fichier de reference, utiliser heuristiques ci-dessous            |
| `all`         | Lire les 4 fichiers de reference                                         |

## Etape 2 — AUDIT par focus

### Focus: size

1. `Glob` pour trouver tous les fichiers `.ts` et `.tsx` dans le scope
2. `Bash` avec `wc -l` pour compter les lignes de chaque fichier
3. Exclure les fichiers auto-generes : `supabase.ts`, `supabase.d.ts`, `*.gen.ts`, `*.generated.ts`
4. Pour chaque fichier au-dessus des seuils :
   - `Read` le fichier
   - Compter les lignes par fonction/composant
   - Proposer un plan de decomposition specifique (ex: "Extraire composant OrderTable lines 45-120", "Extraire hook useOrderFilters lines 12-40")
5. Verifier profondeur de nesting (max 4 niveaux)
6. Verifier nombre de parametres par fonction (max 3)

### Focus: typescript

1. `Grep` pour chercher les patterns interdits :
   - `: any` (hors commentaires et fichiers `.d.ts`)
   - `as any`
   - `@ts-ignore` (sans justification adjacente)
   - `@ts-expect-error` (verifier si justifie)
2. `Grep` pour verifier les patterns async :
   - Promesses flottantes (appels async sans `await` ni `void`)
   - `onSubmit={handleSubmit}` ou handler async passe directement
   - `invalidateQueries` sans `await` dans `onSuccess`
3. `Grep` pour verifier le handling Supabase :
   - `.from(` suivi de code qui utilise `data` sans verifier `error`
4. `Grep` pour verifier validation Zod :
   - Routes API (`app/api/`) sans import de `z` ou `zod`

### Focus: async

Sous-ensemble de typescript, concentre sur :

1. Promesses flottantes (`no-floating-promises`)
2. Promises dans event handlers (`no-misused-promises`)
3. `invalidateQueries` sans `await`
4. `onSuccess` / `onError` patterns dans React Query mutations
5. `useEffect` avec fonctions async non wrappees

### Focus: security

1. `Grep` pour credentials dans le code :
   - Patterns : `password`, `secret`, `api_key`, `token` dans des assignations
   - Fichiers `.env` commites (verifier `.gitignore`)
2. `mcp__supabase__list_tables` pour lister toutes les tables
3. `mcp__supabase__execute_sql` pour verifier RLS sur chaque table :
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%';
   ```
4. `Grep` pour `.select('*')` dans le code
5. `Grep` pour routes API sans verification auth :
   - Chercher `route.ts` sans `getUser` ou `auth` ou `session`
6. `Grep` pour SQL brut (`supabase.rpc` avec requetes complexes)
7. Verifier que les inputs sont valides avec Zod dans les routes API
8. Verifier que les secrets ne sont pas exposes cote client :
   - `Grep` pour `NEXT_PUBLIC_` contenant `SECRET`, `KEY`, `PASSWORD`

### Focus: performance

1. `Grep` pour `.select('*')` (doit specifier les colonnes)
2. `Grep` pour requetes Supabase sans `.limit()` sur grandes tables
3. `Grep` pour `<img` au lieu de `next/image`
4. `Grep` pour `"use client"` en haut de fichiers :
   - Verifier si vraiment necessaire (hooks, events, state)
   - Lister les fichiers qui pourraient etre Server Components
5. `Grep` pour `useEffect` utilise pour fetch initial (devrait etre RSC)
6. `Grep` pour barrel exports (`index.ts` avec re-exports)
7. Verifier existence de `loading.tsx` dans les routes de l'app
8. Verifier l'utilisation de `next/font` vs import CSS direct de fonts

### Focus: dead-code

1. `Grep` pour exports non utilises :
   - Lister les `export function` et `export const`
   - Verifier avec `Grep` si references existent
2. Detecter fichiers potentiellement morts :
   - Fichiers dans `components/` non importes nulle part
   - Routes API non appelees
3. Detecter code commente (blocs `//` ou `/* */` de plus de 5 lignes)
4. Detecter imports non utilises (via `Grep` pour patterns d'import)

## Etape 3 — CLASSIFIER les findings

Chaque finding recoit une severite :

| Severite       | Critere                                                                                                                | Marker     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------- |
| **BLOCKING**   | Securite, `any` TypeScript, credentials exposees, RLS manquant, promesses flottantes en production                     | BLOCKING   |
| **IMPORTANT**  | Performance degradee, fichiers >500 lignes, pas de validation Zod, `select('*')`, dead code significatif               | IMPORTANT  |
| **SUGGESTION** | Fichiers 300-500 lignes, `"use client"` potentiellement inutile, barrel exports, code commente, optimisations mineures | SUGGESTION |

## Etape 4 — GENERER le rapport

Format du rapport final :

````markdown
# Code Review Report

**Scope** : [app] | **Focus** : [focus] | **Date** : [YYYY-MM-DD]
**Files scanned** : [N] | **Findings** : [N]

## Summary

| Severity   | Count |
| ---------- | ----- |
| BLOCKING   | N     |
| IMPORTANT  | N     |
| SUGGESTION | N     |
| **Total**  | **N** |

## BLOCKING Findings

### [B-001] [Category] Description courte

- **File** : `path/to/file.tsx:42`
- **Rule** : [rule name]
- **Detail** : Description precise du probleme
- **Fix** : Action corrective recommandee
- **Code** :
  ```typescript
  // Ligne problematique
  ```
````

## IMPORTANT Findings

### [I-001] [Category] Description courte

- **File** : `path/to/file.tsx:120`
- **Rule** : [rule name]
- **Detail** : Description precise du probleme
- **Fix** : Action corrective recommandee

## SUGGESTION Findings

### [S-001] [Category] Description courte

- **File** : `path/to/file.tsx`
- **Detail** : Description
- **Suggestion** : Amelioration proposee

## Size Analysis (si focus size ou all)

| File             | Lines | Threshold   | Status  | Decomposition Plan                               |
| ---------------- | ----- | ----------- | ------- | ------------------------------------------------ |
| `path/file.tsx`  | 420   | 300 (warn)  | WARNING | Extract: ComponentA (L45-120), useHookB (L12-40) |
| `path/file2.tsx` | 550   | 500 (error) | ERROR   | Extract: ...                                     |

## Recommendations

1. **Priority 1** : [Actions BLOCKING a traiter immediatement]
2. **Priority 2** : [Actions IMPORTANT a planifier]
3. **Priority 3** : [SUGGESTIONS pour amelioration continue]

---

Generated by /review command — READ-ONLY audit, no files modified.

```

## Regles d'Execution

- **READ-ONLY** : Aucune modification de fichier. Zero Write, zero Edit.
- **Exhaustif** : Scanner TOUS les fichiers du scope, pas un echantillon.
- **Parallele** : Lancer les recherches Grep et Glob en parallele pour gagner du temps.
- **Factuel** : Presenter ce qui EXISTE. Pas d'hypotheses.
- **Specifique** : Chaque finding inclut chemin + numero de ligne + code problematique.
- **Actionnable** : Chaque finding inclut une correction recommandee.
- **Pas de faux positifs** : Verifier le contexte avant de signaler. Un `any` dans un `.d.ts` auto-genere n'est PAS un finding.

## Exclusions automatiques

Ne PAS auditer :
- `node_modules/`
- `.next/`
- `dist/`
- `*.gen.ts`, `*.generated.ts`
- `supabase.ts`, `supabase.d.ts` (types auto-generes)
- `*.test.ts`, `*.spec.ts` (sauf pour dead-code)
- Fichiers de configuration racine (`next.config.js`, `tailwind.config.ts`, etc.)

---

User: $ARGUMENTS
```
