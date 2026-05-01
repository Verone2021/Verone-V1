# Dev Report — INFRA-IMG-006

**Date** : 2026-05-01  
**Tâche** : Route LinkMe + site-internet via CloudflareImage  
**Branche** : `refactor/INFRA-IMG-006-route-linkme-siteinternet-cloudflare`  
**PR** : #873 (draft)  
**Type-check** : vert sur @verone/linkme et @verone/site-internet

---

## Résumé

Migration complète de `next/image <Image>` → `<CloudflareImage>` sur les apps LinkMe et site-internet pour les images produits. 3 commits, ~38 fichiers modifiés.

---

## Commits

### Commit 1 — Types et hooks

- 12 hooks LinkMe mis à jour pour sélectionner `cloudflare_image_id` via Supabase (colonnes explicites)
- Types `TopProductData` et `CartItem` enrichis avec `cloudflare_image_id`

### Commit 2 — Composants LinkMe (11 fichiers)

- `TopProductsTable.tsx`, `ProductStatsTable.tsx`, `ProductSalesDetailModal.tsx`, `StorageProductsTab.tsx`, `OrderSummary.tsx`, `DashboardTopProducts.tsx`, `ProductsSection.tsx`, `AddToSelectionModal.tsx`, `ProductCard.tsx`, `StorageProductCard.tsx`, `catalogue/[id]/page.tsx`
- `next/image` supprimé de chaque fichier, `<CloudflareImage>` importé depuis `@verone/ui`
- Pattern : `cloudflareId={item.cloudflare_image_id ?? null} fallbackSrc={item.image_url} alt={...} fill`
- Types sans cloudflare_image_id (RPC sans le champ) → `cloudflareId={null}` pour dégradation gracieuse

### Commit 3 — site-internet (14 fichiers)

- `tsconfig.json` — ajout des paths `@verone/ui` et `@verone/hooks` (manquants, bloquait le type-check)
- `use-catalogue-products.ts` — `primary_cloudflare_image_id?: string | null` (optionnel car RPC ne le retourne pas)
- `CartContext.tsx` — `primary_cloudflare_image_id` dans `CartItem` et `AddToCartInput`, propagé dans `addItem`
- `CardProductLuxury.tsx` — nouveau prop `cloudflareImageId?`, remplace `<Image>` par `<CloudflareImage>`
- `ProductSidebar.tsx`, `VariantsSection.tsx`, `ProductCrossSell.tsx`, `produit/[id]/page.tsx`, `CheckoutOrderSummary.tsx`, `checkout/page.tsx`, `panier/page.tsx`, `SearchOverlay.tsx`, `catalogue/page.tsx`, `collections/[slug]/page.tsx`

---

## Décisions techniques

1. **RPC `get_site_internet_products()` ne retourne pas `cloudflare_image_id`** — champ marqué `optional` dans `CatalogueProduct`, `?? null` partout. Forward-compatible : quand la migration DB arrivera, le champ sera utilisé automatiquement.

2. **StorageAllocation, DashboardTopProducts, VariantCard** — types sans `cloudflare_image_id`. Utilisé `cloudflareId={null}` pour dégradation gracieuse via Vercel Optimizer.

3. **`collections/page.tsx` et bannières collection** — `collection.image_url` = image éditoriale, out of scope. Conservé `<Image>` pour ces deux cas (INFRA-IMG-009).

4. **`ProductGallery.tsx`** — galerie haute résolution, déjà correcte ou hors scope INFRA-IMG-006.

---

## Out of scope (à traiter dans INFRA-IMG-009)

- `selection.image_url` sur `SelectionConfigSheet.tsx` (LinkMe)
- Bannières collections `collection.image_url`

---

## Type-check final

```
pnpm --filter @verone/linkme type-check      → OK
pnpm --filter @verone/site-internet type-check → OK
```
