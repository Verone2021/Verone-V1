# Option C — Migration images vers Cloudflare Images

**Date plan** : 2026-04-21
**Task ID proposé** : `[INFRA-IMG-001]`
**Contexte** : bug HTTP 402 Vercel Image Optimization atteint en production → fix immédiat via `unoptimized: true` ([BO-IMG-001]). Ce plan C vise la solution pérenne.

---

## 1. Pourquoi Cloudflare Images plutôt qu'une autre stack

Trois concurrents gratuits/low-cost évalués :

| Stack                                 | Stockage                                 | Transformations                                      | Coût mensuel                  | CDN             | Effort migration |
| ------------------------------------- | ---------------------------------------- | ---------------------------------------------------- | ----------------------------- | --------------- | ---------------- |
| **Cloudflare Images**                 | 100 k images incluses                    | ✅ Illimité inclus (resize, format, variants)        | **$5/mois**                   | ✅ Global       | ~2 jours         |
| **Cloudinary**                        | 25 GB / 25 k transformations / mois free | ✅ Inclus mais quota serré                           | Gratuit puis $99/mois au saut | ✅ Global       | ~2 jours         |
| **Cloudflare R2 + Worker maison**     | 10 GB gratuit                            | ❌ À coder via `cf-image-resizing` (gratuit sur Pro) | Gratuit si < 10 GB            | ✅ Global       | ~4-5 jours       |
| **Supabase Storage Image Transforms** | Actuel                                   | ✅ Si plan Pro                                       | **$29/mois (Pro)**            | ❌ Hop Supabase | 0 jour           |

**Choix retenu** : **Cloudflare Images** ($5/mois fixe). Transformations illimitées couvrent tous les besoins, pas de free-tier piégeux, CDN global intégré, API simple. Ratio coût/bénéfice imbattable pour un e-commerce de 400-1000 images.

**Économies** :

- Reste sur Supabase Free (pas d'upgrade $25/mois)
- Reste sur Vercel Hobby (pas d'upgrade $20/mois)
- **Total payé : $5/mois** vs $20-35/mois pour les alternatives

---

## 2. Plan d'exécution en 6 phases

### Phase 1 — Setup Cloudflare (30 min) — FEU ROUGE, manuel

1. Créer compte Cloudflare (si inexistant)
2. Activer **Cloudflare Images** dans le dashboard (activation commerciale, $5/mois)
3. Générer un **API Token** (droit `Cloudflare Images: Edit`)
4. Configurer un **custom domain** : `images.veronecollections.fr` → CNAME vers `imagedelivery.net`
5. Noter :
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_IMAGES_API_TOKEN`
   - `CLOUDFLARE_IMAGES_HASH` (pour URL delivery)

**Livrables** : 3 env vars ajoutées sur Vercel (scope Production + Preview) pour chaque app.

### Phase 2 — Helper API Cloudflare Images (~2h) — FEU VERT, code

Créer `packages/@verone/utils/src/cloudflare/images.ts` :

- `uploadImageToCloudflare(buffer, metadata)` → retourne `cloudflareImageId`
- `deleteImageFromCloudflare(imageId)` → suppression
- `buildCloudflareImageUrl(imageId, variant)` → URL delivery (variants : `thumbnail`, `medium`, `large`, `public`)
- Types TS stricts, Zod pour validation réponse API

Tests unitaires avec mock fetch.

### Phase 3 — Migration DATA : scripts/migrate-images-to-cloudflare.ts (~3h) — FEU ROUGE

1. Script Node TS qui :
   - Lit `product_images`, `categories`, `collections`, `organisation_logos`, `families` (tables avec image URLs Supabase)
   - Pour chaque ligne :
     - `fetch()` l'URL Supabase (déjà publique) → buffer
     - `uploadImageToCloudflare()` → reçoit `cloudflareImageId`
     - Stocke `cloudflare_image_id` en DB (nouvelle colonne à ajouter)
     - Log CSV : `supabase_path, cloudflare_id, status, error`
   - Gestion reprise sur erreur (si interrompu, skip les déjà migrées)
   - Mode `--dry-run` qui compte + affiche sans uploader
2. Migration SQL préalable `supabase/migrations/YYYYMMDD_add_cloudflare_image_id.sql` :
   - `ALTER TABLE product_images ADD COLUMN cloudflare_image_id text;`
   - Idem `categories`, `collections`, `organisations`, `families`

**Volumes à migrer** (SQL live 2026-04-20) :

- `product-images` : 462 objets, 284 MB
- `family-images` : 31, 11 MB
- `organisation-logos` : 148, 9.6 MB
- `category-images` : 6, 3.5 MB
- `collection-images` : 2, 693 KB
- `affiliate-products` : à compter
- **Total : ~650-700 fichiers**, ~310 MB

### Phase 4 — Refactor hooks d'upload (~3h) — FEU VERT

Fichiers à modifier (identifiés par `grep` sur les buckets) :

- `packages/@verone/products/src/hooks/use-product-images.ts`
- `packages/@verone/collections/src/hooks/use-collection-images.ts`
- `packages/@verone/consultations/src/hooks/use-consultation-images.ts`
- `packages/@verone/common/src/hooks/use-simple-image-upload.ts`
- `packages/@verone/common/src/hooks/use-logo-upload.ts`
- `apps/linkme/src/components/forms/ProductImageUpload.tsx`
- `apps/linkme/src/lib/hooks/use-product-images.ts`
- `apps/back-office/src/components/forms/subcategory-image-upload.tsx`

**Pattern cible** : chaque hook d'upload appelle désormais `uploadImageToCloudflare()` au lieu de `supabase.storage.from('...').upload()`. Le schéma DB stocke `cloudflare_image_id` + URL dérivée côté runtime via `buildCloudflareImageUrl()`.

### Phase 5 — Refactor composants display (~2h) — FEU VERT

Pattern : les champs `public_url` en DB sont remplacés (ou dérivés) d'URLs Cloudflare type :

```
https://images.veronecollections.fr/{hash}/{cloudflare_image_id}/{variant}
```

- Créer `<CloudflareImage>` dans `@verone/ui` : wrapper Next.js `<Image>` qui construit l'URL correcte selon le variant demandé
- Remplacer les `<Image src={public_url}>` par `<CloudflareImage id={cloudflare_image_id} variant="medium">`
- Préserver compatibilité : pendant la migration, si `cloudflare_image_id` null → fallback `public_url` Supabase

### Phase 6 — Cleanup + monitoring (~1-2h) — FEU ORANGE

1. Après 2 semaines de production OK :
   - Supprimer les objets `storage.objects` Supabase (ou les garder en backup, $0 en Free)
   - Supprimer la colonne `public_url` des tables images (tout via `cloudflare_image_id`)
2. Retirer `images.unoptimized = true` des `next.config.js` (les transformations sont faites côté Cloudflare, plus besoin de bypass)
3. Documenter le flux dans `docs/current/integrations.md`
4. Ajouter monitoring : Cloudflare Images dashboard = check usage mensuel

---

## 3. Estimation globale

| Phase                      | Durée                                 |
| -------------------------- | ------------------------------------- |
| Phase 1 — Setup Cloudflare | 30 min                                |
| Phase 2 — Helper API       | 2 h                                   |
| Phase 3 — Migration data   | 3 h                                   |
| Phase 4 — Refactor upload  | 3 h                                   |
| Phase 5 — Refactor display | 2 h                                   |
| Phase 6 — Cleanup          | 1-2 h                                 |
| **Total**                  | **11-13 h** (~1.5-2 jours concentrés) |

---

## 4. Risques + mitigations

| Risque                                           | Mitigation                                                                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| URL break pendant la migration                   | Phase 3 ajoute `cloudflare_image_id` sans retirer `public_url`. Le code Phase 4/5 fait fallback Supabase si champ vide. Zéro downtime. |
| Quota Cloudflare dépassé (100 k images stockées) | 700 images actuelles = 0.7 % du quota. Runway 100+ ans au rythme actuel.                                                               |
| Quota delivery (100 k/mois inclus)               | 1 delivery = 1 chargement client. 1000 visiteurs/mois × 30 images = 30k/mois. Large marge.                                             |
| Compte Cloudflare suspendu (impayé carte)        | Supabase reste en backup tant que Phase 6 non faite. Restauration rapide.                                                              |
| Perte métadonnées EXIF                           | Cloudflare préserve ou strip selon config. Documenter choix.                                                                           |

---

## 5. Décision ouverte

Avant de démarrer :

- **Décision 1** : on active Cloudflare Images ($5/mois) ou on reste sur `unoptimized` indéfiniment ? Si oui, Romeo fournit carte de paiement Cloudflare.
- **Décision 2** : on garde Supabase Storage en backup indéfiniment (Free plan tient) ou on nettoie après migration ?
- **Décision 3** : variant naming convention (`thumbnail=160px`, `medium=500px`, `large=1200px`, `public=original`) ? À figer Phase 2.

---

## 6. Références

- [Cloudflare Images docs](https://developers.cloudflare.com/images/)
- [Cloudflare Images pricing](https://developers.cloudflare.com/images/pricing/)
- [Next.js custom image loader](https://nextjs.org/docs/app/api-reference/next-config-js/images#loader-configuration)
- [Supabase Storage delete API](https://supabase.com/docs/reference/javascript/storage-from-remove)
