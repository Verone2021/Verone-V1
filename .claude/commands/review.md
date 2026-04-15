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

**REGLE ABSOLUE** : Ce skill est READ-ONLY. Aucune modification de fichier.

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

## Etape 1 — AUDIT

Applique les 3 axes definis dans `.claude/agents/reviewer-agent.md` :

- **Clean Code** : `any`, `@ts-ignore`, `eslint-disable`, taille fichiers, imports
- **Securite** : Zod, RLS, credentials, `select("*")`, `auth.uid()` wrapper
- **Performance** : promesses flottantes, `invalidateQueries`, N+1, re-renders

### Commandes de detection

```bash
# any TypeScript (hors .d.ts et auto-generes)
rg ": any|as any|any\[\]" --type ts --glob '!*.d.ts' --glob '!supabase.ts' $CHEMIN

# Promesses flottantes
rg "onClick=\{.*\(\) =>" --type tsx -A2 $CHEMIN

# invalidateQueries sans await
rg "invalidateQueries" --type ts -B2 -A2 $CHEMIN

# select('*') sans limit
rg "\.select\(['\"]?\*['\"]?\)" --type ts $CHEMIN

# Fichiers > 400 lignes
find $CHEMIN -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20
```

## Etape 2 — CLASSIFIER (severite)

| Severite   | Critere                                                           |
| ---------- | ----------------------------------------------------------------- |
| BLOCKING   | Securite, `any`, credentials, RLS manquant, promesses flottantes  |
| IMPORTANT  | Performance, fichiers > 500L, pas de Zod, `select('*')`           |
| SUGGESTION | Fichiers 300-500L, `"use client"` inutile, optimisations mineures |

## Etape 3 — RAPPORT

```
# Code Review Report
**Scope** : [app] | **Focus** : [focus] | **Date** : [YYYY-MM-DD]
**Files scanned** : [N] | **Findings** : [N]

| Severity | Count |
|----------|-------|
| BLOCKING | N |
| IMPORTANT | N |
| SUGGESTION | N |

## BLOCKING Findings
### [B-001] [Category] Description
- **File** : `path/file.tsx:42`
- **Detail** : description
- **Fix** : action corrective

## IMPORTANT Findings
[...]

## SUGGESTION Findings
[...]

## Recommendations
1. Priority 1 : [BLOCKING]
2. Priority 2 : [IMPORTANT]
3. Priority 3 : [SUGGESTION]
```

## Regles

- **READ-ONLY** : aucune modification de fichier
- **Exhaustif** : scanner TOUS les fichiers du scope
- **Factuel** : presenter ce qui EXISTE
- **Specifique** : chemin + ligne + code problematique
- **Pas de faux positifs** : `any` dans `.d.ts` auto-genere n'est PAS un finding

## Exclusions

`node_modules/`, `.next/`, `dist/`, `*.gen.ts`, `*.generated.ts`, `supabase.ts`, `supabase.d.ts`, config racine.

---

User: $ARGUMENTS
