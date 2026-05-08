# Dev Report — Studio Marketing IA (BO-MKT-002)

**Date** : 2026-05-08
**Branche** : `feat/marketing-image-generation`
**PR** : #958 (draft → ready après validation reviewer)
**Statut** : Code livré, CI en cours de validation

---

## Résumé exécutif

La page `/marketing/prompts` est passée d'un simple générateur de prompt textuel
(à copier-coller manuellement dans Gemini Nano Banana) à un Studio Marketing IA
complet en 7 étapes :

1. Sélection produit(s) (auto-détection marque)
2. Sélection 1 à 5 images sources via picker bibliothèque
3. Choix marque cible (Vérone, LinkMe, Bohemia, Solar, Flos)
4. Choix mise en scène (preset par marque)
5. Choix canal cible (Instagram, Facebook, Pinterest, ...)
6. Prompt auto-composé modifiable
7. Génération Gemini → preview → sauvegarde dans bibliothèque

L'utilisateur n'a plus besoin de quitter le back-office.

---

## Fichiers créés / modifiés

### Foundation (commit `baa46af`)

- `supabase/migrations/20260508180000_bo_mkt_002_marketing_image_generation.sql`
  — Extension `media_assets` (5 colonnes + CHECK + index partiel)
- `packages/@verone/types/src/supabase.ts` — types regénérés via MCP
- `apps/back-office/.env.example` — variables `GOOGLE_GEMINI_*`
- `docs/scratchpad/dev-plan-2026-05-08-marketing-image-generation.md`

### Module Gemini (commit `165c205`)

- `packages/@verone/integrations/src/gemini/types.ts` — schémas Zod request/response
- `packages/@verone/integrations/src/gemini/errors.ts` — `GeminiError` typée + retry logic
- `packages/@verone/integrations/src/gemini/client.ts` — `GeminiClient` avec retry + fallback model
- `packages/@verone/integrations/src/gemini/index.ts`
- `packages/@verone/integrations/src/gemini/__tests__/client.test.ts` — mock fetch
- `packages/@verone/integrations/package.json` — export `./gemini` + dep zod
- `packages/@verone/integrations/tsconfig.json` — ajustement chemins

### Marque LinkMe + presets (commit `f5d19be`)

- `packages/@verone/marketing/src/types.ts` — `BrandSlug` étendu, `TargetChannel`, types Zod request/response
- `packages/@verone/marketing/src/data/brands.ts` — LinkMe ajouté (palette marine + turquoise)
- `packages/@verone/marketing/src/data/presets.ts` — 5 presets L1 à L5
- `packages/@verone/marketing/src/lib/compose-prompt.ts` — nouvelle fonction `composePromptWithSources`
- `packages/@verone/marketing/src/lib/__tests__/compose-prompt.test.ts`

### Route API + Hook (commit `e0801b2`)

- `apps/back-office/src/app/api/marketing/images/generate/route.ts` — POST orchestrateur
- `packages/@verone/marketing/src/hooks/use-generate-marketing-image.ts` — TanStack Query
- `packages/@verone/marketing/src/hooks/index.ts`
- `packages/@verone/marketing/src/index.ts` — export hooks
- `packages/@verone/marketing/package.json` — export `./hooks`, `./lib`, `./types` + deps
- `packages/@verone/marketing/tsconfig.json`

### UI Studio + page rénovée + tests (commit `eaeb790`)

- `packages/@verone/marketing/src/components/MarketingStudio/MarketingStudio.tsx`
- `packages/@verone/marketing/src/components/MarketingStudio/SourceImagesSection.tsx`
- `packages/@verone/marketing/src/components/MarketingStudio/MediaPickerModal.tsx`
- `packages/@verone/marketing/src/components/MarketingStudio/ChannelSelector.tsx`
- `packages/@verone/marketing/src/components/MarketingStudio/GenerationResultCard.tsx`
- `packages/@verone/marketing/src/components/MarketingStudio/index.ts`
- `packages/@verone/marketing/src/components/index.ts` — export ajouté
- `apps/back-office/src/app/(protected)/marketing/prompts/page.tsx` — remplace PromptBuilder par MarketingStudio
- `tests/e2e/marketing-studio-generate.spec.ts` — happy path Playwright (mock API)

### Sync lockfile (commit `80872b2`)

- `pnpm-lock.yaml` — sync après ajout deps zod / @tanstack/react-query / sonner

---

## Choix techniques notables

### 1. Mode preview avant sauvegarde (route API)

La route accepte un flag `saveImmediately`. En mode preview, elle retourne le base64
sans rien écrire en DB ni sur Cloudflare. Permet de régénérer plusieurs fois avant
de polluer la bibliothèque. Le base64 est stocké côté client en mémoire (pas en
sessionStorage, taille variable).

### 2. Custom ID Cloudflare structuré

Format : `verone/marketing/{brandSlug}/{targetChannel}/{YYYYMMDD}-{presetId}-{shortHash}`

`shortHash` = 6 premiers caractères de sha256(prompt + timestamp). Garantit unicité +
permet recherches API par préfixe.

### 3. Rollback Cloudflare en cas d'INSERT fail

Si l'INSERT `media_assets` échoue après l'upload Cloudflare, on supprime l'image
Cloudflare via DELETE API. Évite les orphelins (image stockée payante non référencée).

### 4. Pattern client Gemini

Singleton via `getGeminiClient()`, retry 1 fois sur primary model (timeout/network/5xx),
fallback automatique sur fallbackModel si toujours échoué. Timeout 60s par requête
via `AbortController`. JAMAIS de log de l'API key.

### 5. Modèle Gemini 2.5 Flash Image en primary, 3 Pro Image Preview en fallback

Free tier 2.5 Flash : 1500 req/jour. Couvre largement l'usage prévu (1-5 générations/jour).
Le fallback 3 Pro est payant mais déclenché seulement en cas d'échec persistent.

### 6. Liaison `media_assets` vs `product_images`

Choix de stocker dans `media_assets` :

- Permet `product_id NULL` (image marketing pure sans produit)
- Permet plusieurs marques via `brand_ids[]`
- Cohérent avec le filtre "IA générée" déjà en place dans la bibliothèque

### 7. `composePromptWithSources` étend `composePrompt` sans casser

Préambule ajouté avant le template du preset :

- "Use the {N} reference images as primary visual reference for product, materials, finishes, and proportions."
- "Output optimized for {channel} placement."

---

## Points d'attention pour le reviewer

1. **Vérifier la sécurité de la route API** :
   - Auth check via session Supabase
   - Validation Zod stricte du body
   - Pas de log de l'API key Gemini
   - Pas de stack trace côté response client
   - Rollback Cloudflare en cas d'INSERT fail

2. **Vérifier que la route ne casse pas la bibliothèque existante** :
   - L'INSERT respecte les triggers existants sur `media_assets` (notamment ceux qui sync depuis `product_images`)
   - Le `source = 'ai_generated'` est déjà supporté par les filtres existants

3. **Vérifier les touch targets ≥ 44px sur mobile** dans tous les composants
   `MarketingStudio/*` (boutons croix images sources, radios canal, etc.)

4. **Vérifier que les composants `MarketingStudio` font < 400 lignes chacun**

5. **Vérifier que les tests E2E mockent bien Gemini** et ne consomment pas le free tier

6. **Vérifier la map slug → UUID** des brands : la route doit faire 1 SELECT sur
   `brands` au démarrage (cachable) plutôt qu'à chaque requête

7. **Quotas Cloudflare Images** : 5$/mois pour 100k images. À surveiller mais
   pas un blocker.

---

## Tests

- ✅ Tests unitaires `composePromptWithSources` (3 cas)
- ✅ Tests unitaires `GeminiClient` (mock fetch, retry, fallback, error mapping)
- ✅ E2E Playwright happy path (Gemini mocké via `route.fulfill()`)

À tester manuellement après merge :

- Vrai appel Gemini (1 image source Vérone, preset V2, canal Instagram)
- Sauvegarde dans bibliothèque
- Vérification que l'image apparaît dans `/marketing/bibliotheque` filtre "IA générée"

---

## Statut CI (au moment du rapport)

- `Detect changes` : ✅ pass
- `DB FK drift check` : ✅ pass
- `E2E Smoke (Playwright — back-office)` : ✅ pass
- `ESLint + Type-Check + Build` : 🔧 fix en cours (lockfile sync)
- `Supabase TS types drift (blocking)` : 🔧 fix en cours (lockfile sync)
- `Supabase security advisors` : ⚠️ informational, non bloquant
- `Vercel deploy` : 🔧 dépend du build

Le commit `80872b2` (sync `pnpm-lock.yaml` après ajout deps) devrait débloquer
les checks Install dependencies.

---

## Hors scope (Phase 2+)

- Édition templates de prompts depuis l'UI (admin)
- Push réseaux sociaux automatique (Meta/Instagram)
- Génération en lot (5 variantes d'un coup)
- Marque Affect Building Consulting
- Versions multiples par marque (LinkMe V1/V2)
- Templates avec overlay (logo, prix, watermark)
