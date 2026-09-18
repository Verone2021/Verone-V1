# Dev Report — BO-PERF-S3-001 — Suppression du polling menu/header

**Date** : 2026-09-12  
**Branche** : `fix/BO-PERF-S3-001-menu-polling`  
**Commits** : 3 (+ pre-commit hook auto-fix prettierr)

---

## Changements fichier par fichier

### Nouveau fichier

| Fichier                                                               | Lignes | Description                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/@verone/notifications/src/hooks/use-debounce-invalidate.ts` | 38     | Utilitaire partagé : retourne une fonction `() => void` qui invalide une TanStack Query key avec anti-rebond 2 s. Nettoyage du timer à démontage. Utilisé par `useSidebarCounts` + 5 hooks sur tables publiées. |

### Fichiers modifiés

| Fichier                                       | Avant (lignes) | Après (lignes) | Canaux Realtime avant → après                                    | setInterval avant → après                                   |
| --------------------------------------------- | -------------- | -------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `use-sidebar-counts.ts`                       | 517            | 321            | 7 → 2 (sales_orders + products)                                  | `setInterval` CHANNEL_ERROR fallback → supprimé             |
| `use-unread-mails-count.ts`                   | 53             | 42             | 0 → 0                                                            | `setInterval 30 s` → supprimé                               |
| `use-media-assets-pending-count.ts`           | 40             | 41             | 0 → 0                                                            | `refetchInterval: 30_000` → `false`                         |
| `use-consultations-count.ts`                  | 262            | 114            | 1 (client_consultations — CHANNEL_ERROR) → 0                     | polling fallback → supprimé                                 |
| `use-transactions-unreconciled-count.ts`      | 207            | 82             | 1 (bank_transactions — CHANNEL_ERROR) → 0                        | polling fallback → supprimé                                 |
| `use-form-submissions-count.ts`               | 233            | 82             | 1 (form_submissions — CHANNEL_ERROR) → 0                         | `setInterval` CHANNEL_ERROR fallback → supprimé             |
| `use-linkme-missing-info-count.ts`            | 161            | 90             | 1 (linkme_info_requests — CHANNEL_ERROR) → 0                     | polling fallback → supprimé                                 |
| `use-stock-alerts-count.ts`                   | 191            | 81             | 1 (stock_alerts_unified_view — CHANNEL_ERROR) → 0                | polling fallback → supprimé                                 |
| `use-linkme-approvals-count.ts`               | 215            | 107            | 1 (sales_orders channel_id filter) → 1 (inchangé + debounce 2 s) | polling fallback → supprimé                                 |
| `use-linkme-pending-count.ts`                 | 278            | 112            | 1 (sales_orders channel_id filter) → 1 (inchangé + debounce 2 s) | polling fallback → supprimé                                 |
| `use-expeditions-pending-count.ts`            | 216            | 108            | 1 (sales_orders) → 1 (inchangé + debounce 2 s)                   | polling fallback → supprimé                                 |
| `use-orders-pending-count.ts`                 | 237            | 108            | 1 (sales_orders) → 1 (inchangé + debounce 2 s)                   | polling fallback → supprimé                                 |
| `use-products-incomplete-count.ts`            | 229            | 110            | 1 (products product_status filter) → 1 (inchangé + debounce 2 s) | polling fallback → supprimé                                 |
| `packages/@verone/notifications/package.json` | —              | —              | —                                                                | Ajout `@tanstack/react-query: "^5.0.0"` en peerDependencies |

### Impact requêtes réseau (estimation)

Avant : ~90 % du trafic Gateway mesuré = polling toutes les 30 s × 11 compteurs + CHANNEL_ERROR fallbacks.  
Après : 0 polling. Requêtes uniquement au chargement initial + retour sur l'onglet + invalidation Realtime (debounce 2 s).

---

## Canaux Realtime conservés (tables publiées)

| Hook                         | Table          | Filtre                     |
| ---------------------------- | -------------- | -------------------------- |
| `useSidebarCounts`           | `sales_orders` | aucun                      |
| `useSidebarCounts`           | `products`     | `product_status=eq.active` |
| `useOrdersPendingCount`      | `sales_orders` | aucun                      |
| `useExpeditionsPendingCount` | `sales_orders` | aucun                      |
| `useLinkmeApprovalsCount`    | `sales_orders` | `channel_id=eq.93c68db1…`  |
| `useLinkmePendingCount`      | `sales_orders` | `channel_id=eq.93c68db1…`  |
| `useProductsIncompleteCount` | `products`     | `product_status=eq.active` |

---

## Canaux Realtime supprimés (tables non publiées → CHANNEL_ERROR)

| Canal supprimé                      | Table                       | Raison                                               |
| ----------------------------------- | --------------------------- | ---------------------------------------------------- |
| `sidebar-consultations`             | `client_consultations`      | Non publiée → CHANNEL_ERROR → polling fallback       |
| `sidebar-bank-transactions`         | `bank_transactions`         | Non publiée → CHANNEL_ERROR → polling fallback       |
| `sidebar-form-submissions`          | `form_submissions`          | Non publiée → CHANNEL_ERROR → polling fallback       |
| `sidebar-linkme-info-requests`      | `linkme_info_requests`      | Non publiée → CHANNEL_ERROR → polling fallback       |
| `sidebar-stock-alerts`              | `stock_alerts_unified_view` | Vue non publiable → CHANNEL_ERROR → polling fallback |
| `consultations-changes`             | `client_consultations`      | Idem                                                 |
| `transactions-unreconciled-changes` | `bank_transactions`         | Idem                                                 |
| `form-submissions-changes`          | `form_submissions`          | Idem                                                 |
| `linkme-info-requests-changes`      | `linkme_info_requests`      | Idem                                                 |
| `stock-alerts-changes`              | `stock_alerts_unified_view` | Idem                                                 |

---

## onSuccess useMutations recensés

Recherche exhaustive dans `apps/back-office/src` et `packages/@verone/{orders,products,consultations,finance,organisations}`.

### useMutations trouvés qui touchent des tables pertinentes

| Fichier:ligne                                                                                     | Table                  | Traitement                        |
| ------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------- |
| `apps/back-office/src/hooks/use-archive-notifications.ts`                                         | `notifications`        | Hors périmètre                    |
| `apps/back-office/src/hooks/use-articles.ts:232,243,254`                                          | `articles`             | Hors périmètre                    |
| `apps/back-office/src/app/(protected)/produits/catalogue/variantes/use-variant-suggestions.ts:67` | `products` (variantes) | Couvert par Realtime products     |
| `apps/back-office/src/components/orders/InvoicesSection.tsx:79`                                   | `financial_documents`  | Hors périmètre                    |
| `packages/@verone/orders/src/hooks/linkme/use-linkme-orders.ts:52,81`                             | `sales_orders`         | Couvert par Realtime sales_orders |
| `packages/@verone/orders/src/hooks/linkme/use-approve-order.ts`                                   | `sales_orders`         | Couvert par Realtime sales_orders |
| `packages/@verone/orders/src/hooks/linkme/use-reject-order.ts`                                    | `sales_orders`         | Couvert par Realtime sales_orders |
| `packages/@verone/orders/src/hooks/linkme/use-request-info.ts`                                    | `linkme_info_requests` | Non publiée → pas de Realtime     |

### Verdict item 6 : aucun `invalidateQueries(SIDEBAR_COUNTS_QUERY_KEY)` ajouté

Les mutations sur `client_consultations`, `bank_transactions`, `form_submissions` et `linkme_info_requests` dans les zones concernées utilisent des **Server Actions** (appels directs via `await updateConsultation(...)`, `await createConsultationAction(...)`, etc.), **pas des `useMutation` TanStack Query**.

Les rares `useMutation` sur `linkme_info_requests` (`use-request-info.ts`) sont dans `packages/@verone/orders` qui n'importe pas `@verone/notifications` → ajouter `SIDEBAR_COUNTS_QUERY_KEY` créerait un cycle de dépendances. Listé comme suite.

**Suite recommandée** : si le rafraîchissement des compteurs de demandes info / consultations / formulaires après une mutation est jugé critique, soit (a) publier ces tables dans Supabase Realtime, soit (b) appeler `queryClient.invalidateQueries({ queryKey: SIDEBAR_COUNTS_QUERY_KEY })` directement depuis les composants qui font la mutation (ils sont dans `apps/back-office` qui peut importer `@verone/notifications`).

---

## use-dashboard-notifications.ts (item 5)

Fichier : `packages/@verone/dashboard/src/hooks/use-dashboard-notifications.ts`  
Intervalle : `5 * 60 * 1000` = **5 minutes exactement**.  
La consigne dit "si c'est une lecture plus fréquente **que** 5 min". 5 min = 5 min, pas plus fréquent.  
**Non modifié** — laissé tel quel et signalé ici.

---

## use-user-activity-tracker.ts (item 4)

Hors périmètre confirmé. Son `setInterval(BATCH_INTERVAL = 60 000 ms)` envoie des lots d'écriture `user_activity_logs`, ce n'est pas une interrogation de compteur.  
**Non modifié**.

---

## Grep setInterval final

```
packages/@verone/notifications/src/hooks/use-user-activity-tracker.ts:167: setInterval(...)
```

Seul ce fichier reste. Conforme à l'attendu.

---

## Type-check & Lint

| Scope                                                       | Résultat                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| `pnpm --filter @verone/notifications type-check`            | ✅ 0 erreur                                                   |
| `pnpm --filter @verone/notifications lint --max-warnings=0` | ✅ 0 warning (hors avertissement infra pages dir préexistant) |
| `pnpm --filter @verone/roadmap type-check`                  | ✅ 0 erreur                                                   |
| `pnpm --filter @verone/back-office type-check`              | ✅ 0 erreur                                                   |

---

## Commits

| Hash       | Description                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------- |
| `2046ae7c` | `[BO-PERF-S3-001] perf: convert useSidebarCounts to TanStack Query, drop 5 polling channels` |
| `2c1fbd04` | `[BO-PERF-S3-001] perf: convert useUnreadMailsCount to TanStack Query, drop setInterval`     |
| `45afcfc8` | `[BO-PERF-S3-001] perf: convert all individual count hooks to TanStack Query, drop polling`  |

---

## Risques

- **Réactivité réduite sur tables non publiées** : consultations, transactions, formulaires, demandes info ne se mettent à jour qu'au retour sur l'onglet ou toutes les 5 min. Acceptable pour un back-office admin (usage bureau). Si un cas métier exige une mise à jour immédiate, publier la table dans Supabase Realtime (décision Roméo).
- **Doublon de canal Realtime** : `useSidebarCounts` et les 5 hooks individuels (pour les dropdowns) ouvrent chacun leur propre canal sur `sales_orders`/`products`. En pratique, la sidebar et les dropdowns sont rarement montés en même temps. Si la duplication devient un problème, centraliser dans un seul provider qui invalide tous les query keys.
- **TanStack QueryClient requis** : tous les hooks utilisent `useQueryClient()`. Si un consommateur les monte hors d'un `QueryClientProvider`, l'app crashe. Déjà le cas pour `useMediaAssetsPendingCount` — pas de régression nouvelle.

## Ce qui n'a pas été fait

- Invalidation depuis `onSuccess` des Server Actions (consultations, transactions, formulaires) : ces actions n'utilisent pas `useMutation` TanStack Query et vivent dans `apps/back-office` ; appeler `invalidateQueries` depuis les composants qui les déclenchent est possible mais hors périmètre de ce sprint.
- Publication des 5 tables dans Supabase Realtime (décision métier/infra, hors périmètre sprint).
- Modification de `use-dashboard-notifications.ts` (intervalle = 5 min exactement, hors seuil).
