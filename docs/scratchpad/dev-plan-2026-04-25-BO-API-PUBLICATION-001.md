# Dev plan — BO-API-PUBLICATION-001

**Date** : 2026-04-25
**Branche** : `feat/BO-API-PUBLICATION-001-publication-routes`
**Bloc Romeo** : Bloc 1 du plan refonte Publication
**Type** : Backend pur — 0 UI

---

## Objectif

Créer/modifier les routes API HTTP pour piloter la publication d'un produit sur les 4 canaux de vente, en respectant la règle de cascade documentée dans `docs/current/canaux-vente-publication-rules.md` :

- Site Internet et LinkMe = canaux racines indépendants
- Google Merchant et Meta Commerce dépendent du Site Internet
- Cascade : dépublier Site → dépublier Google + Meta
- Guard : publier Google ou Meta sans Site = 422

## État existant (audit)

### RPCs déjà présentes côté DB

- `toggle_google_merchant_visibility(p_product_id, p_visible)` ✅
- `remove_from_google_merchant(p_product_id)` ✅
- `toggle_meta_commerce_visibility(p_product_id, p_visible)` ✅
- `remove_from_meta_commerce(p_product_id)` ✅
- `update_meta_commerce_price`, `update_meta_commerce_metadata` ✅

### Routes API existantes

- `PATCH /api/google-merchant/products/[id]/visibility` ✅ (mais sans guard cascade)
- `DELETE /api/google-merchant/products/[id]` ✅
- `POST /api/meta-commerce/sync-statuses` ✅
- ❌ Pas de route Meta visibility/delete (les hooks `useToggleMetaVisibility` / `useRemoveFromMeta` appellent la RPC en direct)
- ❌ Pas de route Site Internet publish/unpublish

### Channel IDs (hardcode constant, stable)

```
site_internet:    0c2639e9-df80-41fa-84d0-9da96a128f7f
google_merchant:  d3d2b018-dfee-41c1-a955-f0690320afec
linkme:           93c68db1-5a30-4168-89ec-6383152be405
manuel:           1c5a0b39-b8b7-4c8b-bffd-fc0482d329c6
meta_commerce:    09d93a0c-a71b-42e2-81df-303752bde932
```

## Périmètre du sprint

### À créer (4 fichiers route + 1 constante)

1. `packages/@verone/channels/src/constants/channel-ids.ts` — Constantes UUID des 5 canaux (single source of truth pour le code)

2. `apps/back-office/src/app/api/products/[id]/publish/route.ts` — POST
   - Set `products.is_published_online = true`
   - Upsert `channel_pricing` (product_id, site_internet channel_id) avec `is_active = true`
   - Pas de cascade vers Google/Meta : décision explicite de l'utilisateur après

3. `apps/back-office/src/app/api/products/[id]/unpublish/route.ts` — POST
   - Set `products.is_published_online = false`
   - Update `channel_pricing.is_active = false` pour `site_internet`, `google_merchant`, `meta_commerce`
   - Cascade obligatoire (sécurité : si SI déjà publié sur Google/Meta, retirer)

4. `apps/back-office/src/app/api/meta-commerce/products/[id]/visibility/route.ts` — PATCH
   - Lit `products.is_published_online`. Si `false` et `visible: true` → 422 "Site Internet doit être publié d'abord"
   - Sinon appelle RPC `toggle_meta_commerce_visibility(productId, visible)`

5. `apps/back-office/src/app/api/meta-commerce/products/[id]/route.ts` — DELETE
   - Appelle RPC `remove_from_meta_commerce(productId)`

### À modifier (1 fichier)

6. `apps/back-office/src/app/api/google-merchant/products/[id]/visibility/route.ts` — PATCH
   - Ajouter guard 422 identique au Meta : refuse `visible: true` si `is_published_online = false`

## Pattern technique

Toutes les routes suivent le pattern existant de `google-merchant/products/[id]/visibility/route.ts` :

- Validation UUID via regex
- Validation body via Zod
- `createServerClient()` from `@verone/utils/supabase/server`
- Type d'erreur `unknown` + try/catch + log via `console.warn` / `console.error`
- Réponse JSON `{ success, data?, error? }`

Aucune migration SQL — tout se branche sur les RPCs existantes et les UPDATE Supabase.

## Tests prévus

Le bloc étant backend pur, validation par :

- `pnpm --filter @verone/back-office type-check` → 0 erreur
- Tests Playwright des routes via `curl` après démarrage local (smoke)
- Le vrai test fonctionnel viendra avec le Bloc 3 (UI Publication) qui consommera ces routes

## Hors périmètre

- Hooks consommateurs (Bloc 3 les utilisera)
- UI Publication (Bloc 3)
- Toggles dans catalogues canaux BO (Bloc 4)
- Migrations SQL — aucune nécessaire (RPCs déjà là)

## Rapport attendu post-implem

`docs/scratchpad/dev-report-2026-04-25-BO-API-PUBLICATION-001.md` avec :

- Liste des fichiers touchés
- Verdict type-check
- Smoke test routes via curl (codes HTTP)
- Lien PR
