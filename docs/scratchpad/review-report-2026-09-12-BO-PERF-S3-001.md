# Review Report — 2026-09-12 — BO-PERF-S3-001

Branche `fix/BO-PERF-S3-001-menu-polling`, 4 commits au-dessus de `origin/staging` (`3a39703a`) au moment de la revue.
Revue impartiale en lecture seule par `reviewer-agent`.

## Verdict : PASS WITH WARNINGS

### WARNING — use-auto-roadmap.ts:188 — error toujours null (régression silencieuse)

**Problème** : tous les hooks migrés retournaient `error: null` en dur (le queryFn attrapait l'erreur et renvoyait `0`).
`packages/@verone/roadmap/src/hooks/use-auto-roadmap.ts:188` agrège `stockError ?? consultationsError ?? linkmeError`,
donc toujours null. Avant S3 (`origin/staging`), les hooks exposaient l'erreur (`setError(new Error('RPC error: …'))`).

**Fix appliqué (commit de suivi)** : dans les 10 hooks à compteur unique, le queryFn lève
`new Error(countError.message)` (ou `rpcError.message`) après le `console.error`, et le hook renvoie
`error: error ?? null` depuis `useQuery`. Le compte reste `0` par défaut (`data = 0`). Coût : au plus 1 nouvel essai
en cas d'erreur (`retry: 1` du `QueryClient` back-office), aucun en fonctionnement normal.
`useSidebarCounts` (agrégat, pas de champ `error`) et `useUnreadMailsCount` (pas de champ `error`) inchangés.

### WARNING — use-debounce-invalidate.ts:35 — échec d'invalidation silencieux

**Problème** : `.catch(() => {})` avalait toute erreur sans trace.

**Fix appliqué (commit de suivi)** : `.catch((err: unknown) => { console.warn('[useDebouncedInvalidate] invalidation failed:', err); })`.

### INFO — use-debounce-invalidate.ts — stabilité implicite de queryKey

`useCallback([queryClient, queryKey])` : un appelant qui passerait un tableau inline recréerait le callback à chaque
rendu et réabonnerait le canal temps réel. Tous les appelants actuels passent une constante de module `as const`.
Non corrigé (pas de bug actuel).

### INFO — canaux temps réel en double si menu + listes déroulantes montés ensemble

Jusqu'à 5 canaux indépendants sur `sales_orders` (menu + 4 hooks individuels), donc jusqu'à 5 rechargements
(chacun regroupé à 2 s) pour un changement. Connu (dev-report, Risques). Piste future : un fournisseur central qui
invalide plusieurs clés depuis un seul canal.

## Axes vérifiés

- 11 requêtes strictement identiques à `origin/staging` (tables, filtres, colonnes) ✅
- Aucun `setInterval` restant dans `@verone/notifications` hormis `use-user-activity-tracker.ts` (envoi groupé d'écritures, hors périmètre) ✅
- Canaux temps réel uniquement sur `products` + `sales_orders` (tables publiées, vérifié `pg_publication_tables`) ✅
- Noms de canaux tous distincts ✅
- Minuterie de `useDebouncedInvalidate` nettoyée au démontage, dépendances stables ✅
- Types `refetch` / `count` / `loading` préservés pour tous les consommateurs ✅
- Zéro `@ts-ignore`, `as any`, `eslint-disable` ajoutés ✅
- Tous les fichiers < 400 lignes ✅
- `pnpm-lock.yaml` cohérent (dépendance pair enregistrée, contrôle strict OK) ✅
- `use-media-assets-pending-count.ts` : `refetchInterval` false, `staleTime` 5 min — acceptable ✅

## Contrôles après le commit de suivi (coordinateur)

- `pnpm --filter @verone/notifications type-check` : 0 erreur
- `pnpm --filter @verone/roadmap type-check` : 0 erreur
- `pnpm --filter @verone/back-office type-check` : 0 erreur
- ESLint `--max-warnings=0` sur les 11 fichiers modifiés : 0

---

## Revue A1 — invalidation des pastilles après mutation (2026-09-12, session 2)

Commit A1 : `@verone/utils/query` (`MENU_COUNT_QUERY_KEYS` + `invalidateMenuCounts`) et 17 fichiers de mutation.
Revue impartiale `reviewer-agent`, lecture seule.

### Verdict : PASS WITH WARNINGS (0 CRITICAL)

- WARNING `packages/@verone/consultations/src/hooks/use-consultations.ts` : 1 115 lignes (1 098 avant A1, dette
  préexistante aggravée de 17 lignes). À découper dans P2c/P2b (`BO-CONSULT-P2-001`), pas dans cette PR.
- WARNING `use-consultations.ts:174` : `useConsultations()` exige désormais un `QueryClientProvider` ancêtre. Tous les
  consommateurs actuels sont dans le back-office (fournisseur racine `app/layout.tsx:52`). Contrat à garder en tête si
  le hook sort du back-office.
- INFO `menu-count-keys.ts:45` : dédoublonnage par référence, sûr car les clés sont des constantes typées.
- INFO `use-sidebar-counts.ts:31` : `SIDEBAR_COUNTS_QUERY_KEY` reste exporté (alias), aucun import direct.

Vérifié : invalidations uniquement sur chemins de succès ; `useQueryClient()` au niveau haut ; clés = préfixes exacts des
`queryKey` des compteurs ; aucune autre requête sur ces préfixes ; zéro `any` / `@ts-ignore` / `eslint-disable` ajouté.

### Contrôles coordinateur

- `npx tsx packages/@verone/utils/src/query/__tests__/menu-count-keys.test.ts` : OK
- type-check `utils`, `notifications`, `products`, `consultations`, `finance`, `orders`, `back-office` : 0 erreur
- ESLint `--max-warnings=0` sur les 20 fichiers : 0
- Preuve écran : **bloquée** — le serveur local plante sur toutes les pages connectées (« Rendered more hooks than
  during the previous render » dans le routeur Next), y compris A1 retiré et compteurs S3 remis en version `staging`
  (essais du 12/09 05:03-05:05) → environnement local, pas le code de la branche. À refaire après redémarrage du serveur.
