# Dev Report — [BO-STOCK-009] StockAlertsBanner select explicite + limit (W4)

**Date** : 2026-04-18
**Statut** : DONE
**Branche** : `feat/BO-STOCK-009-stock-banner-select-limit`

## Fichiers modifiés

- `packages/@verone/stock/src/components/cards/StockAlertsBanner.tsx`

## Actions réalisées

1. Import `Database` depuis `@verone/types` ajouté (alias `StockAlertBannerRow` créé puis supprimé automatiquement par lint-staged — non utilisé comme annotation de paramètre car Supabase génère un sous-type partiel lors du select explicite, incompatible avec la Row complète).
2. `select('*')` remplacé par la liste des 17 colonnes en string littéral unique (pas de concaténation — requis pour l'inférence Supabase).
3. `.limit(10)` ajouté ligne 58.
4. Mapping `(a: Record<string, unknown>)` remplacé par `(a): StockAlert` avec inférence native du type partiel + fallbacks `??` (suppression des `String()`, `Number()`, `Boolean()` wrappers).

## Décision technique

L'annotation `(a: StockAlertBannerRow)` aurait causé une erreur TS2345 car Supabase infère un type partiel (sous-ensemble de colonnes) qui ne correspond pas à la Row complète. La solution propre est de laisser l'inférence TS via `(a): StockAlert` (le type de retour seul est annoté), ce qui est cohérent avec les standards Supabase.

## Vérifications

| Check                                          | Résultat       |
| ---------------------------------------------- | -------------- |
| `pnpm --filter @verone/stock type-check`       | 0 erreur       |
| `pnpm --filter @verone/back-office type-check` | 0 erreur       |
| `select('*')` restants                         | 0              |
| `.limit(10)` présent                           | Oui (ligne 58) |

## Commit

`1ae577234` — `[BO-STOCK-009] perf: explicit select + limit(10) on StockAlertsBanner (W4)`

## Notes pour le reviewer

- Aucune modification logique métier, aucune modification UI, aucun trigger DB.
- Le hook pre-commit a supprimé l'alias `StockAlertBannerRow` (unused vars ESLint strict). Comportement attendu et correct.
- L'import `Database` a également été supprimé par lint-staged car non utilisé après la suppression de l'alias. Le fichier final est minimal et conforme.
- Portée : fichier unique, 111 → 118 lignes (select multicolonne + mapping reformaté).
