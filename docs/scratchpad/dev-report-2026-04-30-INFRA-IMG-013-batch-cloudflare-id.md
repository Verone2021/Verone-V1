# Dev Report — INFRA-IMG-013 Fix batch cloudflare_image_id

**Date** : 2026-04-30
**Branche** : `fix/INFRA-IMG-013-batch-cloudflare-id`
**Base** : `staging` @ `996eb975b` (post-merge PR #837 INFRA-IMG-004)
**Type** : Bug fix régression silencieuse PR #836

---

## Problème détecté

Lors de l'audit live de la page `/produits/catalogue` (back-office local sur `localhost:3000`), constaté :

| Indicateur                                        | Mesure        | Attendu post-INFRA-IMG-003 |
| ------------------------------------------------- | ------------- | -------------------------- |
| Images servies via `imagedelivery.net`            | **0 / 25**    | 25 / 25                    |
| Images servies via Supabase Storage               | 25 / 25       | 0                          |
| `product_images.cloudflare_image_id` rempli en DB | **460 / 460** | 460 / 460 ✓                |

Cloudflare est joignable et opérationnel (test `curl -I https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/<id>/public` → HTTP 200, 137 ms). Le custom domain `images.veronecollections.fr` est encore en attente DNS/SSL mais c'est un alias optionnel (env `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN` absent → `imagedelivery.net` utilisé par défaut, conforme au design).

## Cause racine

`packages/@verone/products/src/hooks/use-product-images-batch.ts` ligne 41-43 — le SELECT Supabase **n'incluait pas** `cloudflare_image_id` :

```ts
.select(
  'id, product_id, public_url, display_order, alt_text, is_primary, created_at, updated_at'
)
```

Comparaison avec le hook singulier (`use-product-images.ts:61`) qui lui inclut bien `cloudflare_image_id`. Régression introduite (oubli) lors de PR #836 (INFRA-IMG-003 — migration des 22 composants vers `<CloudflareImage>`).

### Conséquence

1. `useProductImagesBatch` retourne `primaryImage.cloudflare_image_id = undefined`
2. `ProductCardV2.tsx:132-134` (vue grille catalogue) et `CatalogueListView.tsx:72-79` (vue liste) passent `cloudflareId={undefined}` à `<CloudflareImage>`
3. `CloudflareImage` (`packages/@verone/ui/src/components/ui/cloudflare-image.tsx:56-67`) tombe sur `fallbackSrc = primaryImage.public_url` (Supabase Storage)
4. Toute la page catalogue charge ses images depuis Supabase Storage au lieu du CDN Cloudflare

Bug invisible dans les TODOs INFRA-IMG-006 → 012 documentés dans `audit-2026-04-29-INFRA-IMG-cleanup-restant.md`. Bug invisible aussi du reviewer-agent qui a validé #836.

## Fix

1 ligne. Ajout de `cloudflare_image_id` dans le SELECT du hook batch, alignant sur le hook singulier :

```diff
- 'id, product_id, public_url, display_order, alt_text, is_primary, created_at, updated_at'
+ 'id, product_id, public_url, cloudflare_image_id, display_order, alt_text, is_primary, created_at, updated_at'
```

**Fichier modifié** : `packages/@verone/products/src/hooks/use-product-images-batch.ts`

## Validation

| Étape                                                                                  | Statut                                                                                                                              |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @verone/products type-check`                                            | ✅ vert                                                                                                                             |
| `pnpm --filter @verone/back-office type-check`                                         | ✅ vert                                                                                                                             |
| Schema DB confirmé : `product_images.cloudflare_image_id` existe et est rempli à 100 % | ✅                                                                                                                                  |
| `<CloudflareImage>` consomme bien `cloudflareId` (vu lignes 47-67 du composant)        | ✅                                                                                                                                  |
| `ProductCardV2.tsx` lit `primaryImage.cloudflare_image_id` (ligne 133)                 | ✅                                                                                                                                  |
| Validation visuelle locale via Playwright                                              | ⚠️ Nécessite redémarrage dev server (hot-reload Webpack ne reprend pas le package workspace en cache) — sera fait en preview Vercel |

## Hors scope

Boucle de fetch détectée pendant l'audit (143 requêtes idle sur la page catalogue, dont `auth/v1/user × 20`, `product_images × 49`, `products × 20`) — pas lié aux images. Sera traité dans une PR séparée `[BO-PERF-CATALOG-001]` (anti-pattern `useEffect` similaire à incident 2026-04-27 documenté dans `data-fetching.md`).

Surcharge `useOrganisations` (~70 colonnes × 213 fournisseurs × 4 fois) — idem, traité ailleurs.

## Test plan PR

- [x] Type-check `@verone/products` ✅
- [x] Type-check `@verone/back-office` ✅
- [ ] CI verte (full check)
- [ ] Preview Vercel : page `/produits/catalogue` → DevTools Network → confirmer requêtes vers `imagedelivery.net` (au lieu de `supabase.co/storage`)
- [ ] Preview Vercel : pas de régression sur les vignettes affichées (toutes les images doivent rester visibles ; fallback Supabase reste en place pour les rares rows sans `cloudflare_image_id`)

## Compatibilité avec PR #838

PR #838 (INFRA-IMG-005) modifie d'autres fichiers (uploads sourcing, organisation logos). Aucun conflit attendu — branchée en parallèle sur `staging`.
