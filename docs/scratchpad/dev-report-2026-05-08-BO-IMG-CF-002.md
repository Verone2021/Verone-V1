# BO-IMG-CF-002 — Bascule complète Supabase Storage → Cloudflare Images

**Date** : 2026-05-08
**Branche** : `fix/BO-IMG-CF-002-bascule-supabase-vers-cloudflare`

## Objectif

Roméo voulait que **plus aucune image** ne soit servie depuis Supabase Storage. Toutes les images sur Cloudflare Images.

## Diagnostic Phase 0

- 629 images sur Cloudflare (compteur `/v1/stats`).
- 629 cloudflare_image_id en base (460 product_images + 460 media_assets en mirror + 169 organisations).
- Hash Cloudflare correct récupéré via API : `a-LEt3vfWH1BG-ME-lftDA` (le prompt initial avait noté un `1` au lieu d'un `l` → a fait échouer une URL test).
- 3 cloudflare_image_id testés répondent HTTP 200 → scénario A confirmé : bascule URL en BDD, pas de re-upload.

## Migration BDD

13 tables auditées, 1090 URLs basculées vers Cloudflare en 2 vagues :

**Vague 1** (3 tables principales, audit initial) :

- `product_images` : 460 → Cloudflare
- `media_assets` : 460 → Cloudflare (mirror automatique)
- `organisations` : 169 → Cloudflare + 1 logo orphelin (Pokawa Montélimar 2) ré-uploadé sur Cloudflare avec custom_id `verone/organisations/pokawa-montelimar-2/{org_id}`

**Vague 2** (4 tables découvertes pendant les tests Playwright) :

- `enseignes` : 2 logos (Black & White Burger + Pokawa) ré-uploadés et basculés
- `client_consultations` : 1 image (source Supabase déjà 404) → set NULL
- `linkme_selections` : 1 image (source Supabase déjà 404) → set NULL

### Trigger DB corrigé

`generate_product_image_url()` réécrivait `public_url` avec une URL Supabase à chaque UPDATE — bloquait la bascule. Modifié pour générer une URL `imagedelivery.net` quand `cloudflare_image_id` est présent.

### Backup

Toutes les URLs Supabase d'origine sauvegardées dans `legacy_supabase_url` / `legacy_logo_url` / `legacy_image_url`. Rollback en 1 requête possible pendant 30 jours (bloc commenté en fin de migration).

## Vérification finale BDD

```
13 tables × COUNT WHERE *_url LIKE '%supabase.co%' = 0 partout.
```

## Tests Playwright (lane-1, vercel prod)

| Page                                          | Total | Cloudflare | Supabase | Cassée |
| --------------------------------------------- | ----- | ---------- | -------- | ------ |
| `/produits/catalogue`                         | 25    | 24         | 0        | 0      |
| `/commandes/clients` (liste)                  | 1     | 0          | 0        | 0      |
| `/canaux-vente/linkme/commandes/{id}/details` | 2     | 1          | 0        | 0      |
| `/stocks`                                     | 6     | 5          | 0        | 0      |
| `/stocks/inventaire`                          | 337   | 336        | 0        | 0      |
| `/commandes/fournisseurs` (liste)             | 1     | 0          | 0        | 0      |
| Modal détail PO                               | 3     | 2          | 0        | 0      |
| `/contacts-organisations/enseignes`           | 3     | 2          | 0        | 0      |

102 erreurs 404 console sur `/stocks/inventaire` : prefetch RSC vers une route détail produit qui n'existe pas. **Pré-existant, indépendant de la migration**.

## Code applicatif

`packages/@verone/utils/src/upload/smart-upload.ts` : suppression du fallback Supabase Storage. Tous les futurs uploads vont vers Cloudflare. Les champs `supabasePublicUrl` et `storagePath` du type `SmartUploadResult` deviennent toujours `undefined` (conservés en `@deprecated` pour compat ascendante des consommateurs).

## Suivi à J+30 (2026-06-08)

Suppression du bucket Supabase Storage `product-images` et `organisation-logos` (tâche séparée — filet de sécurité 30 jours).

## Fichiers modifiés

- `supabase/migrations/20260508120000_bo_img_cf_002_bascule_urls_supabase_vers_cloudflare.sql` (nouveau)
- `packages/@verone/utils/src/upload/smart-upload.ts`
- `packages/@verone/products/src/hooks/use-product-images.ts` (SELECT étendu pour matcher le type Database)
- `packages/@verone/types/src/supabase.ts` (régénéré)

## Screenshots

`.playwright-mcp/screenshots/20260508/` (13 captures avant/après).
