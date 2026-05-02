# INFRA-IMG-006 — Router LinkMe + site-internet via `<CloudflareImage>`

**Date** : 2026-05-01
**Branche** : `refactor/INFRA-IMG-006-route-linkme-siteinternet-cloudflare`
**Worktree** : `/Users/romeodossantos/verone-infra-img-006`
**Source d'info** : `docs/scratchpad/HOTFIX-003-audit-images-config-2026-05-01.md`

---

## Objectif

Forcer LinkMe et site-internet à servir TOUTES leurs images produits via Cloudflare Images (`imagedelivery.net`) au lieu de Supabase Storage URL réoptimisée par Vercel.

**État actuel** :

- 460/460 `product_images` ont un `cloudflare_image_id` ✅
- LinkMe et site-internet ne sélectionnent PAS `cloudflare_image_id` → fallback sur `public_url` Supabase → réoptimisé par Vercel ❌
- Back-office utilise déjà `<CloudflareImage>` correctement ✅

**Cible** :

- Ajouter `cloudflare_image_id` au SELECT de tous les hooks qui lisent `product_images`
- Remplacer `<Image src={image_url} />` natif par `<CloudflareImage cloudflareId={...} fallbackSrc={image_url} />`
- Le composant `<CloudflareImage>` existe déjà dans `packages/@verone/ui/src/components/ui/cloudflare-image.tsx` — pas de modification nécessaire (sauf amélioration optionnelle).

---

## Périmètre LinkMe

### Hooks à toucher (11 fichiers)

| Fichier                                                                            | Action                                                            |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/linkme/src/lib/hooks/use-linkme-catalog.ts`                                  | Ajouter `cloudflare_image_id` au SELECT, propager dans le mapping |
| `apps/linkme/src/lib/hooks/use-linkme-public.ts`                                   | Idem                                                              |
| `apps/linkme/src/lib/hooks/use-affiliate-products.ts`                              | Idem                                                              |
| `apps/linkme/src/lib/hooks/use-affiliate-orders.ts`                                | Idem (champs items)                                               |
| `apps/linkme/src/lib/hooks/use-affiliate-analytics.ts`                             | Idem                                                              |
| `apps/linkme/src/lib/hooks/use-storage-requests.ts`                                | Idem                                                              |
| `apps/linkme/src/lib/hooks/use-product-images.ts`                                  | Ajouter `cloudflare_image_id`                                     |
| `apps/linkme/src/lib/hooks/use-selection-items.ts`                                 | Idem                                                              |
| `apps/linkme/src/lib/hooks/use-product-sales-detail.ts`                            | Idem                                                              |
| `apps/linkme/src/lib/hooks/use-selection-top-products.ts`                          | Idem                                                              |
| `apps/linkme/src/lib/hooks/use-all-products-stats.ts`                              | Idem                                                              |
| `apps/linkme/src/app/(main)/commandes/[id]/modifier/hooks/use-edit-order-items.ts` | Idem                                                              |

### Composants à toucher (~27 fichiers)

Tous utilisent `<Image src={..}>` natif sans `unoptimized`. À remplacer par `<CloudflareImage cloudflareId={item.cloudflare_image_id} fallbackSrc={item.image_url} />`.

Liste exhaustive :

```
apps/linkme/src/app/(auth)/login/page.tsx                          → image statique (logo Verone) — N/A, à laisser
apps/linkme/src/app/(main)/[affiliateSlug]/page.tsx               → selection.image_url
apps/linkme/src/app/(main)/[affiliateSlug]/[selectionSlug]/page.tsx → selection.image_url + product.primary_image_url
apps/linkme/src/app/(main)/cart/page.tsx                          → item.image_url
apps/linkme/src/app/(main)/catalogue/[id]/page.tsx                → product image
apps/linkme/src/app/(main)/catalogue/components/ProductCard.tsx   → product.image_url
apps/linkme/src/app/(main)/checkout/components/OrderSummary.tsx   → product image
apps/linkme/src/app/(main)/commandes/CommandeOrderRow.tsx         → item.product_image_url
apps/linkme/src/app/(main)/commandes/components/OrderItemsTable.tsx → item.product_image_url
apps/linkme/src/app/(main)/commandes/[id]/modifier/AddProductDialog.tsx → item.product_image_url
apps/linkme/src/app/(main)/commandes/[id]/modifier/components/ProductsSection.tsx → item.product_image_url
apps/linkme/src/app/(main)/dashboard/DashboardSelectionShareCard.tsx → selection.image_url
apps/linkme/src/app/(main)/ma-selection/page.tsx                  → selection.image_url
apps/linkme/src/app/(main)/mes-produits/page.tsx                  → product.product_image_url
apps/linkme/src/app/(main)/mes-produits/components/ProductDetailSheet.tsx → product.product_image_url
apps/linkme/src/app/(main)/stockage/components/StorageProductsTab.tsx → product.product_image_url
apps/linkme/src/app/(main)/stockage/components/StorageRequestsTab.tsx → request.product_image_url
apps/linkme/src/components/cart/CartDrawer.tsx                    → item.image_url
apps/linkme/src/components/catalogue/AddToSelectionModal.tsx      → product image
apps/linkme/src/components/orders/steps/products/ProductCard.tsx  → product image
apps/linkme/src/components/selection/EditMarginModal.tsx          → product image
apps/linkme/src/components/selection/ProductDetailSheet.tsx       → product image
apps/linkme/src/components/selection/SelectionConfigSheet.tsx     → product image (déjà unoptimized peut-être)
apps/linkme/src/components/selection/SelectionProductGrid.tsx     → item.product_image_url
apps/linkme/src/components/selection/selection-catalog/SelectionProductRow.tsx → product image
apps/linkme/src/components/storage/StorageProductCard.tsx         → product.product_image_url
```

**Note importante sur les `selection.image_url`** : ces images sont uploadées via Supabase Storage (pas via Cloudflare). Elles ne sont **PAS** dans `product_images`. Elles vivent dans la colonne `selections.image_url` (URL Supabase Storage directe). Pour ces cas, deux options :

- A. Laisser tel quel (continuer Supabase + Vercel optim) — acceptable, peu d'images
- B. Migrer ces images vers Cloudflare aussi — hors scope de ce sprint (créer `INFRA-IMG-009`)

→ **Décision** : option A pour ce sprint. On ne touche pas aux `selection.image_url`. On ne touche que les images de produits.

---

## Périmètre site-internet

### Hooks à toucher

| Fichier                                                   | Action                        |
| --------------------------------------------------------- | ----------------------------- |
| `apps/site-internet/src/hooks/use-product-detail.ts`      | Ajouter `cloudflare_image_id` |
| `apps/site-internet/src/hooks/use-catalogue-products.ts`  | Idem                          |
| `apps/site-internet/src/hooks/use-collection-products.ts` | Idem                          |

### Composants à toucher (~9 fichiers)

```
apps/site-internet/src/app/checkout/components/CheckoutOrderSummary.tsx
apps/site-internet/src/app/checkout/page.tsx
apps/site-internet/src/app/collections/[slug]/page.tsx
apps/site-internet/src/app/collections/page.tsx
apps/site-internet/src/app/panier/page.tsx
apps/site-internet/src/app/produit/[id]/components/ProductCrossSell.tsx
apps/site-internet/src/app/produit/[id]/components/ProductSidebar.tsx
apps/site-internet/src/app/produit/[id]/components/VariantsSection.tsx
apps/site-internet/src/components/SearchOverlay.tsx
apps/site-internet/src/components/home/CategoryTiles.tsx       → category image (Supabase) — N/A
apps/site-internet/src/components/home/HeroSection.tsx         → image statique site — N/A
```

### Types

`apps/site-internet/src/contexts/CartContext.tsx` étend l'interface CartItem avec `primary_image_url` — ajouter `cloudflare_image_id` aussi.

---

## Stratégie de refactor

### Pattern unique à appliquer

**Avant** :

```tsx
<Image
  src={product.image_url}
  alt={product.name}
  fill
  className="object-cover"
/>
```

**Après** :

```tsx
import { CloudflareImage } from '@verone/ui';

<CloudflareImage
  cloudflareId={product.cloudflare_image_id}
  fallbackSrc={product.image_url}
  alt={product.name}
  fill
  className="object-cover"
/>;
```

### Pattern hook SELECT

**Avant** :

```ts
.select(`
  id, name, price,
  product_images!inner (public_url, image_type)
`)
```

**Après** :

```ts
.select(`
  id, name, price,
  product_images!inner (public_url, image_type, cloudflare_image_id)
`)
```

Et dans le mapping retourné :

```ts
return {
  ...
  image_url: imgData.public_url,
  cloudflare_image_id: imgData.cloudflare_image_id,
};
```

### Vérifications RPC

Si une RPC PostgreSQL renvoie déjà des données produit avec image_url, vérifier qu'elle retourne aussi `cloudflare_image_id`. Si non, créer une nouvelle migration.

À vérifier dans la migration :

- `get_site_internet_products` — RPC site-internet
- `get_linkme_catalogue` — RPC LinkMe (si existe)

---

## Découpage en commits

| #   | Commit                                                                               | Fichiers                                                           | Tests                            |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------- |
| 1   | `[INFRA-IMG-006] chore: scaffold dev-plan + types`                                   | dev-plan + ajout `cloudflare_image_id` aux interfaces TS partagées | type-check                       |
| 2   | `[INFRA-IMG-006] feat(linkme): add cloudflare_image_id to hooks`                     | 12 hooks LinkMe                                                    | type-check + build linkme        |
| 3   | `[INFRA-IMG-006] feat(linkme): route components via CloudflareImage`                 | 25 composants LinkMe                                               | type-check + build linkme        |
| 4   | `[INFRA-IMG-006] feat(site-internet): add cloudflare_image_id to hooks + components` | 3 hooks + 9 composants site-internet                               | type-check + build site-internet |
| 5   | `[INFRA-IMG-006] chore: regen RPC if needed`                                         | migrations SQL si RPC modifiée                                     | regen types Supabase             |

Chaque commit poussé avec `--force-with-lease` après rebase précoce sur `origin/staging`.

---

## Acceptance criteria

- [ ] `pnpm --filter @verone/back-office type-check` vert (zéro régression)
- [ ] `pnpm --filter @verone/linkme type-check` vert
- [ ] `pnpm --filter @verone/site-internet type-check` vert
- [ ] `pnpm --filter @verone/linkme build` vert
- [ ] `pnpm --filter @verone/site-internet build` vert
- [ ] Test runtime Playwright (1 page produit LinkMe + 1 page produit site-internet) :
  - Image visible
  - URL réseau pointe vers `imagedelivery.net/...` (vérifier via `browser_network_requests`)
  - Pas de requête vers `aorroydfjsrygmosnzrl.supabase.co/storage/...` pour les produits ayant `cloudflare_image_id`
  - Pas d'erreur console
- [ ] Reviewer-agent PASS
- [ ] CI verte

---

## Hors scope

- ❌ Custom domain `images.veronecollections.fr` → sprint séparé `CUSTOM-DOMAIN`
- ❌ Migration des 4 rows résiduelles (consultation_images, collection_images) → `INFRA-IMG-008`
- ❌ Migration des `selections.image_url` vers Cloudflare → `INFRA-IMG-009` (à créer)
- ❌ Audit fichiers orphelins Supabase Storage → `INFRA-IMG-007`

---

## Risques connus

1. **RPC PostgreSQL** : si une RPC renvoie des produits sans `cloudflare_image_id`, le hook qui l'appelle peut casser → ajouter à la migration.
2. **Types LinkMe centraux** (`apps/linkme/src/types/index.ts`) : ajouter `cloudflare_image_id?: string | null` aux interfaces produit.
3. **CartContext** site-internet : étendre le type CartItem.
4. **Compat avec produits sans cloudflare_image_id** : le fallback `<CloudflareImage fallbackSrc={...}>` fait déjà le job. Aucune image ne disparaît.

---

## Délégation

Le refactor mécanique sera délégué au `dev-agent` via le tool Agent.
Le brief précise :

- scope = uniquement les fichiers listés ci-dessus
- pattern unique à appliquer
- découpage en 4 commits + tests + push avec `--force-with-lease`
- pas d'élargissement de scope
- worktree fixe `/Users/romeodossantos/verone-infra-img-006` (pas de nouveau worktree)

À l'issue, l'agent principal vérifie :

- builds des 3 apps verts
- runtime Playwright OK
- reviewer-agent PASS
- promote ready
