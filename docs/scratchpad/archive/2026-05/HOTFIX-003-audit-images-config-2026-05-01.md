# HOTFIX-003 — Audit configuration images Vercel + Supabase + Cloudflare

**Date** : 2026-05-01
**Auteur** : Claude (HOTFIX-003)
**Worktree** : `/Users/romeodossantos/verone-hotfix-003` (branche `chore/HOTFIX-003-audit-images-config`)
**Mission** : Vérifier que TOUTES les images servies par les 3 apps Vérone passent EXCLUSIVEMENT par Cloudflare Images (`imagedelivery.net` ou `images.veronecollections.fr`), sans intermédiaire Vercel Image Optimization ni Supabase Storage public direct.

---

## TL;DR — Verdict

| Couche                                      | État                                                                            | Score |
| ------------------------------------------- | ------------------------------------------------------------------------------- | ----- |
| Back-office (catalogue produits)            | ✅ Tout passe par Cloudflare via `<CloudflareImage>`                            | 9/10  |
| LinkMe (app affiliés)                       | ❌ N'utilise PAS Cloudflare — sert Supabase Storage URLs via Vercel Image Optim | 2/10  |
| Site-Internet (boutique publique)           | ❌ Même problème que LinkMe                                                     | 2/10  |
| Cloudflare Account / variants / WebP-AVIF   | ✅ Bien configuré (cf. cloudflare-config-applied-2026-05-01.md)                 | 10/10 |
| Custom domain `images.veronecollections.fr` | ❌ DNS résout (CNAME OK) mais cert SSL **non émis** → handshake fail            | 0/10  |
| Migration DB Cloudflare                     | ✅ 100 % `product_images` migrées (460/460), 79 % `organisations` (169/213)     | 8/10  |

**Anomalie majeure** : seul le back-office utilise `<CloudflareImage>`. LinkMe et site-internet font des `<Image src={imageUrl}>` directs où `imageUrl` est récupéré depuis `product_images.public_url` (= URL Supabase Storage). Ces URLs sont **réoptimisées par Vercel Image Optimization** au lieu de passer par Cloudflare. Conséquence : double facturation (Vercel + Supabase bandwidth) et perte des optimisations AVIF/WebP automatiques de Cloudflare Images.

---

## 1. État de la configuration Cloudflare (référence)

D'après `docs/scratchpad/cloudflare-config-applied-2026-05-01.md` (HOTFIX-002, hier) :

- ✅ Account ID configuré : `f0087e285a908a15ea5bdb51985c43ee`
- ✅ Hash images : `a-LEt3vfWH1BG-ME-lftDA`
- ✅ 5 variants actifs : `public` + `social1x1` + `story9x16` + `banner16x9` + `pin2x3`
- ✅ WebP/AVIF auto actif sur `imagedelivery.net` (testé : `content-type: image/avif` retourné)
- ✅ Subscription Cloudflare Images Basic Base 5 $/mo, payée jusqu'au 29 mai 2026
- ❌ Polish skip volontaire (requiert plan Pro 25 $/mo, n'apporte rien sur Cloudflare Images)
- ⚠️ Custom domain `images.veronecollections.fr` non opérationnel

---

## 2. Vercel — Configuration Image Optimization

### 2.1 `next.config.js` — `images.remotePatterns`

| App                                 | Domaines whitelistés                                                                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/back-office/next.config.js`   | `images.unsplash.com`, `aorroydfjsrygmosnzrl.supabase.co/storage/v1/object/public/**`, `placehold.co`, `images.veronecollections.fr`, `imagedelivery.net` |
| `apps/linkme/next.config.js`        | `aorroydfjsrygmosnzrl.supabase.co/...`, `images.veronecollections.fr`, `imagedelivery.net`                                                                |
| `apps/site-internet/next.config.js` | `aorroydfjsrygmosnzrl.supabase.co/...`, `images.veronecollections.fr`, `imagedelivery.net`                                                                |

**Constat** : les 3 apps autorisent à la fois Supabase Storage ET Cloudflare. L'autorisation seule ne dit RIEN sur ce qui est servi en pratique — elle dit juste « next/image accepte ces domaines ». Le quota Vercel est consommé dès qu'une `<Image>` sans `unoptimized` pointe vers un de ces domaines.

### 2.2 Composant `<CloudflareImage>` — `packages/@verone/ui/src/components/ui/cloudflare-image.tsx`

```tsx
const isCloudflareSrc =
  src.includes('imagedelivery.net') ||
  src.includes('images.veronecollections.fr');

return (
  <Image src={src} unoptimized={isCloudflareSrc || isPlaceholder} {...rest} />
);
```

✅ Bonne logique : `unoptimized=true` quand l'URL est Cloudflare → bypass Vercel Image Optimization. Pas de quota Vercel consommé pour les images Cloudflare.

⚠️ Mais **le fallback Supabase** (utilisé quand `cloudflareId` est null) ne reçoit pas `unoptimized=true` — donc les fallbacks Supabase Storage passent par Vercel Image Optimization. C'est acceptable car il s'agit d'un cas marginal (44 organisations sans logo Cloudflare, 1 collection_image, 3 consultation_images = ~48 images au total).

### 2.3 Inventaire usages `next/image`

- **146 imports** `import Image from 'next/image'` directs dans les apps + packages.
- **27 utilisations** de `<CloudflareImage>` (= 27 endroits qui font passer par Cloudflare proprement).
- **Diff = 119 fichiers** qui utilisent `<Image>` natif sans wrapper.

Sur ces 119 fichiers, beaucoup sont légitimes (logos statiques `apps/*/public/`, icônes, placeholders). Mais une vaste majorité côté **LinkMe et site-internet** servent des URLs Supabase Storage dynamiques sans `unoptimized` :

```tsx
// apps/linkme/src/app/(main)/catalogue/components/ProductCard.tsx
<Image src={product.image_url} alt={displayTitle} ... />

// apps/site-internet/src/app/produit/[id]/components/ProductCrossSell.tsx
<Image src={product.primary_image_url} alt={product.name} ... />

// apps/linkme/src/app/(main)/cart/page.tsx
<Image src={item.image_url} alt={item.name} ... />
```

Et `image_url` côté hooks linkme vient de `product_images.public_url` qui est :

```
https://aorroydfjsrygmosnzrl.supabase.co/storage/v1/object/public/product-images/products/{uuid}/{filename}
```

→ **Conséquence** : ces images partent vers Supabase, sont récupérées par Vercel, retransformées par Vercel Image Optimization, puis servies au navigateur. Trois sauts au lieu d'un seul vers Cloudflare. Aucune image ne passe par Cloudflare dans LinkMe et site-internet.

---

## 3. Supabase Storage — Inventaire actuel

### 3.1 Buckets

| Bucket                  | Public    | Objets | Taille |
| ----------------------- | --------- | ------ | ------ |
| `product-images`        | ❌ Privé  | 539    | 331 MB |
| `justificatifs`         | ❌ Privé  | 157    | 11 MB  |
| `organisation-logos`    | ✅ Public | 148    | 9.6 MB |
| `family-images`         | ✅ Public | 31     | 11 MB  |
| `category-images`       | ✅ Public | 6      | 3.5 MB |
| `linkme-delivery-forms` | ❌ Privé  | 4      | 504 kB |
| `collection-images`     | ❌ Privé  | 2      | 693 kB |
| `affiliate-products`    | ❌ Privé  | 0      | 0      |

**Note** : `product-images` est marqué privé en bucket mais les rows `product_images` ont `public_url` qui pointe vers `/storage/v1/object/public/product-images/...` ce qui suggère que le path est public via signed/bypass. À investiguer (peut-être qu'il utilise un mode lecture publique côté policy).

### 3.2 État de la migration Cloudflare par table

| Table                  | Total rows | Avec `cloudflare_image_id` | Sans CF mais avec URL Supabase | Note                                                                  |
| ---------------------- | ---------- | -------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `product_images`       | 460        | 460 (100 %)                | 0                              | ✅ Migration complète                                                 |
| `organisations` (logo) | 213        | 169 (79 %)                 | 0 (44 sans logo du tout)       | ✅ Aucun orphelin                                                     |
| `categories`           | 12         | 0                          | 0                              | Aucune image rattachée (mais 6 fichiers dans le bucket — orphelins ?) |
| `families`             | 7          | 0                          | 0                              | Idem (31 fichiers dans bucket)                                        |
| `collections`          | 3          | 0                          | 0                              | Idem                                                                  |
| `collection_images`    | 1          | 0                          | 1                              | ⚠️ Non migré (1 image utilisée dans collection ?)                     |
| `consultation_images`  | 3          | 0                          | 3                              | ⚠️ Non migré                                                          |
| `sourcing_photos`      | 0          | 0                          | 0                              | Vide                                                                  |

**Anomalies à investiguer** :

1. Les buckets `family-images` (31 objets), `category-images` (6 objets), `collection-images` (2 objets) contiennent des fichiers mais aucune row dans les tables correspondantes ne les référence. → Soit les fichiers sont orphelins (à purger), soit la donnée est référencée ailleurs (autre colonne ?).
2. `collection_images` (1 row) et `consultation_images` (3 rows) ne sont **pas migrées vers Cloudflare**. À traiter avec un script batch comme `migration-log-2026-04-29-cloudflare-images.csv` mais à plus petite échelle (4 images au total).

---

## 4. Cloudflare custom domain `images.veronecollections.fr` — État DNS / SSL

### 4.1 DNS

```bash
dig images.veronecollections.fr +short
# imagedelivery.net.
# 104.18.2.36
# 104.18.3.36
```

✅ Le CNAME est bien en place et pointe vers `imagedelivery.net`. Cloudflare répond aux requêtes (104.18.x.x = Cloudflare edge).

### 4.2 SSL handshake

```bash
curl -v https://images.veronecollections.fr/{hash}/{img}/public
# error:1404B410:SSL routines:ST_CONNECT:sslv3 alert handshake failure
```

❌ Cloudflare refuse le handshake SSL. Cause : **le hostname `images.veronecollections.fr` n'est pas enregistré comme Custom Hostname côté Cloudflare Images**, donc Cloudflare ne sait pas quel cert présenter pour ce domaine. Le DNS pointe vers Cloudflare mais Cloudflare ne reconnaît pas le hostname → rejet TLS.

### 4.3 Action recommandée

1. Aller dans Cloudflare Dashboard → **Images** → **Custom Hostnames** → **Add**
2. Saisir `images.veronecollections.fr`
3. Si Cloudflare demande un challenge DNS supplémentaire (TXT), l'ajouter chez le registrar (Cloudflare DNS dans le cas Vérone, donc auto-applicable via dashboard)
4. Attendre l'émission du cert SSL Universal (1-24h)
5. Re-tester `curl -I https://images.veronecollections.fr/...` → doit retourner `HTTP/2 200` ou `404` côté Cloudflare (pas `SSL handshake failure`)
6. Une fois opérationnel, **NE PAS** activer `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true` côté Vercel tant que le test curl ne passe pas — sinon toutes les images cassent en prod

### 4.4 Variables d'environnement Cloudflare

| Variable                                   | back-office `.env.local`                 | linkme `.env.local` | site-internet `.env.local` |
| ------------------------------------------ | ---------------------------------------- | ------------------- | -------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`                    | ✅                                       | ✅                  | ✅                         |
| `CLOUDFLARE_IMAGES_API_TOKEN`              | ✅                                       | ✅                  | ✅                         |
| `CLOUDFLARE_IMAGES_HASH`                   | ✅                                       | ✅                  | ✅                         |
| `NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH`       | ✅                                       | ✅                  | ✅                         |
| `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN` | ❌ Absent (fallback `imagedelivery.net`) | ❌ Absent           | ❌ Absent                  |

✅ Hash bien partagé entre les 3 apps (même valeur `a-LEt3vfWH1BG-ME-lftDA`).
⚠️ Vercel : non vérifiable depuis ici (`vercel` CLI non auth dans le worktree). À confirmer dans le dashboard Vercel pour les 3 projets.

---

## 5. Anomalies détectées (ordre de gravité)

### 🔴 SEV1 — LinkMe et Site-Internet ne servent AUCUNE image via Cloudflare

**Cause** : les hooks `apps/linkme/src/lib/hooks/*.ts` et `apps/site-internet/.../hooks` ne `select` jamais la colonne `cloudflare_image_id` depuis `product_images`. Ils ne récupèrent que `public_url` (URL Supabase Storage). Les composants utilisent ensuite `<Image src={image_url}>` natif sans `unoptimized`.

**Impact** :

- Quota Vercel Image Optimization consommé inutilement (~1000 produits × ~10 vues/jour = 10k image-optim/jour, plafond Vercel Hobby = 5000/mois)
- Bandwidth Supabase Storage consommé (Hobby plan 5 GB/mo)
- Aucun bénéfice WebP/AVIF auto de Cloudflare
- Custom domain `images.veronecollections.fr` même opérationnel ne servirait à rien tant que ces apps n'utilisent pas Cloudflare

**Fix proposé** (PR séparée `[INFRA-IMG-006]` ou similaire) :

1. Étendre les hooks `useLinkmeCatalog`, `useUserSelection`, `useStorageRequests`, `useSelectionItems`, etc. pour `select` aussi `product_images.cloudflare_image_id`
2. Remplacer les `<Image src={image_url}>` directs par `<CloudflareImage cloudflareId={...} fallbackSrc={image_url}>` dans ~30 fichiers LinkMe et ~10 fichiers site-internet
3. Sprint estimé : 3-4h (refactor mécanique + tests Playwright golden path)

### 🔴 SEV1 — Custom domain `images.veronecollections.fr` non opérationnel (cert SSL absent)

Voir section 4.3 pour la procédure de remédiation.

### 🟠 SEV2 — Tables `consultation_images` (3) et `collection_images` (1) non migrées

4 images au total. Lancer un mini-script batch identique à `INFRA-IMG-013` (cf. `dev-report-2026-04-30-INFRA-IMG-013-batch-cloudflare-id.md`) pour les uploader sur Cloudflare et populer `cloudflare_image_id`.

### 🟠 SEV2 — Fichiers Supabase Storage potentiellement orphelins

- `family-images` bucket : 31 fichiers / 7 rows `families` (toutes sans image_url) → 31 fichiers orphelins ?
- `category-images` bucket : 6 fichiers / 12 rows `categories` (toutes sans image_url) → 6 fichiers orphelins ?
- `collection-images` bucket : 2 fichiers / 3 rows `collections` (toutes sans image_url) → 2 fichiers orphelins ?

À confirmer par requête `SELECT name FROM storage.objects WHERE bucket_id = '...'` et cross-check avec les colonnes `image_url` de chaque table avant purge. Possible que des colonnes secondaires (image_url ancien, banner_url, etc.) référencent encore ces fichiers — vérifier avant de supprimer quoi que ce soit. **Action** : audit dédié `[INFRA-IMG-007]` avant toute suppression.

### 🟡 SEV3 — Composant `<CloudflareImage>` ne passe pas `unoptimized` sur fallback Supabase

Marginal (~48 images concernées, surtout des logos d'organisations sans Cloudflare). Acceptable en l'état. Si on veut être strict, modifier la condition :

```tsx
const isCloudflareSrc = src.includes('imagedelivery.net') || src.includes('images.veronecollections.fr');
const isSupabaseSrc = src.includes('aorroydfjsrygmosnzrl.supabase.co/storage');
return <Image ... unoptimized={isCloudflareSrc || isSupabaseSrc || isPlaceholder} ... />;
```

→ tout passe en bypass Vercel, Vercel ne consomme jamais de quota image-optim.

### 🟡 SEV3 — `next.config.js` autorise toujours Supabase et `images.unsplash.com`

Tant que `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN` n'est pas activé partout et que les fallbacks Supabase existent, ces patterns restent nécessaires. À nettoyer dans une passe finale post-fix SEV1.

---

## 6. Plan de fix priorisé

| #   | Action                                                                                                     | Sévérité | Effort                            | PR proposée                                                              |
| --- | ---------------------------------------------------------------------------------------------------------- | -------- | --------------------------------- | ------------------------------------------------------------------------ |
| 1   | Migrer LinkMe + site-internet vers `<CloudflareImage>` (hooks + composants)                                | 🔴 SEV1  | 3-4 h                             | `[INFRA-IMG-006] feat: route LinkMe + site-internet via CloudflareImage` |
| 2   | Activer custom hostname `images.veronecollections.fr` (Cloudflare dashboard, pas de code)                  | 🔴 SEV1  | 5 min config + 1-24h attente cert | aucune PR (config externe)                                               |
| 3   | Une fois cert OK : `NEXT_PUBLIC_CLOUDFLARE_USE_CUSTOM_DOMAIN=true` côté Vercel pour les 3 apps             | 🟠 SEV2  | 5 min                             | aucune PR (env var Vercel)                                               |
| 4   | Migrer `consultation_images` + `collection_images` (4 rows) vers Cloudflare                                | 🟠 SEV2  | 30 min script batch               | `[INFRA-IMG-008] chore: migrate residual images to Cloudflare`           |
| 5   | Audit fichiers orphelins Supabase Storage `family-images` / `category-images` / `collection-images`        | 🟠 SEV2  | 1 h audit                         | `[INFRA-IMG-007] chore: audit & cleanup orphan storage objects`          |
| 6   | Étendre `<CloudflareImage>` pour passer `unoptimized` sur fallback Supabase                                | 🟡 SEV3  | 5 min                             | inclus dans #1 ou indep.                                                 |
| 7   | Une fois tout migré : retirer `aorroydfjsrygmosnzrl.supabase.co` des `remotePatterns` des 3 next.config.js | 🟡 SEV3  | 5 min                             | inclus dans cleanup final                                                |

**Bundling recommandé** :

- PR 1 (`INFRA-IMG-006`) : items #1 + #6 (refactor LinkMe + site-internet + amélioration `<CloudflareImage>`)
- PR 2 (`INFRA-IMG-008`) : item #4 (migration images résiduelles)
- PR 3 (`INFRA-IMG-007`) : item #5 (audit orphelins) — peut rester en draft tant que pas tout vérifié
- Items #2, #3, #7 : config-only, aucune PR

---

## 7. Validation finale du périmètre HOTFIX-003

| Critère                                 | Résultat                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| Worktree créé en isolation              | ✅ `/Users/romeodossantos/verone-hotfix-003` sur `chore/HOTFIX-003-audit-images-config` |
| Audit 3 apps `next.config.js`           | ✅ Section 2.1                                                                          |
| Audit composant `<CloudflareImage>`     | ✅ Section 2.2                                                                          |
| Audit utils Cloudflare                  | ✅ Section 4.4                                                                          |
| Audit Supabase Storage buckets + tables | ✅ Section 3                                                                            |
| Audit custom domain DNS + SSL           | ✅ Section 4                                                                            |
| Inventaire next/image direct            | ✅ Section 2.3                                                                          |
| Plan de fix priorisé                    | ✅ Section 6                                                                            |
| Aucun commit code (pure audit)          | ✅ Read-only depuis le worktree                                                         |

**Verdict global** : la couche back-office + Cloudflare account est propre. La couche LinkMe + site-internet est totalement à côté de la cible (aucune image via Cloudflare). Le custom domain attend une activation côté dashboard Cloudflare (5 min de clic + attente cert).

**Prochaine action recommandée** : Roméo confirme la priorité. Si OK je peux ouvrir la PR `INFRA-IMG-006` immédiatement (3-4h de refactor mécanique sur LinkMe + site-internet).
