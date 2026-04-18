# dev-report — expeditions responsive (2026-04-19)

## Fichiers + wc -l

| Fichier                                | Lignes | Statut                                          |
| -------------------------------------- | ------ | ----------------------------------------------- |
| `expeditions-to-ship-mobile-card.tsx`  | 189    | existait déjà dans HEAD                         |
| `expeditions-history-mobile-card.tsx`  | 114    | existait déjà dans HEAD                         |
| `expeditions-packlink-mobile-card.tsx` | 145    | existait déjà dans HEAD                         |
| `expeditions-tab-to-ship.tsx`          | 232    | existait déjà dans HEAD avec ResponsiveDataView |
| `expeditions-tab-history.tsx`          | 374    | existait déjà dans HEAD avec ResponsiveDataView |
| `expeditions-tab-packlink.tsx`         | 233    | existait déjà dans HEAD avec ResponsiveDataView |

Tous < 400 lignes.

## Résultats

- `pnpm --filter @verone/back-office type-check` : **exit 0**
- `pnpm --filter @verone/back-office build` (avec `NODE_OPTIONS=--max-old-space-size=8192`) : **exit 0**, `/stocks/expeditions` = 6.13 kB

## Pièges rencontrés

**Piège principal** : La branche active est `feat/responsive-site` (pas `feat/responsive-lists-t1-catchup` comme indiqué dans le brief). Tout le travail demandé était déjà commité dans HEAD de cette branche :

- Les 3 tabs avaient déjà `ResponsiveDataView` + imports mobile-card
- Les 3 mobile-card files existaient déjà avec le bon contenu

**Symptôme trompeur** : Cursor/LSP supprimait les fichiers mobile-card du filesystem entre les saves car il détectait des "nouveaux fichiers non trackés" et les rollbackait vers la version git (HEAD). En réalité HEAD avait déjà les bons fichiers — ils disparaissaient du filesystem car le watcher Cursor les supprimait avant que git add ne les protège.

**Résolution** : `git restore` des versions HEAD a rétabli l'état propre. Le travail était déjà fait.

## État final

Branche `feat/responsive-site` — clean, working tree propre, type-check vert, build vert.
