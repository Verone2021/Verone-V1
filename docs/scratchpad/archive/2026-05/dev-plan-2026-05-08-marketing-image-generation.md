# Dev Plan — Studio Marketing IA (BO-MKT-002)

**Date** : 2026-05-08
**Branche** : `feat/marketing-image-generation`
**Périmètre** : Génération d'images marketing via Gemini API, intégrée à la page `/marketing/prompts` du back-office.

---

## Contexte

Aujourd'hui, la page `/marketing/prompts` affiche un **PromptBuilder** qui génère un prompt texte à copier-coller manuellement dans Gemini Nano Banana. L'utilisateur quitte le back-office, ouvre Gemini en navigateur, colle le prompt, télécharge l'image, et la remonte manuellement dans la bibliothèque.

L'objectif de ce sprint est de **fermer la boucle** : un parcours unique dans le back-office, depuis la sélection de produits/images sources jusqu'à la sauvegarde dans la bibliothèque média, avec appel automatique à Gemini API et upload Cloudflare.

---

## Architecture cible

### Flux utilisateur (page /marketing/prompts rénovée)

```
1. Sélection produit(s) → ProductOrVariantPicker (existant)
2. Sélection 1-5 images sources → MediaPickerModal (nouveau, réutilise filtres bibliothèque)
3. Sélection marque cible → BrandSelector (existant) — auto-suggérée si produit a un brand_id
4. Sélection mise en scène → PresetSelector (existant)
5. Sélection canal cible → ChannelSelector (nouveau, radios)
6. Prompt auto-généré modifiable → textarea avec composePrompt + injection brand context
7. Bouton "Générer" → POST /api/marketing/images/generate (mode preview, pas de DB write)
8. Affichage preview résultat → boutons "Régénérer" / "Sauvegarder"
9. Sauvegarder → POST avec saveImmediately=true → INSERT media_assets + Cloudflare custom ID
```

### Pipeline backend `/api/marketing/images/generate`

```
POST → Zod validate body → Auth check → Charge media_assets sources →
Télécharge base64 imagedelivery.net → Compose prompt (brand + preset + sources) →
GeminiClient.generateImage() avec fallback model →
Mode preview : retourne base64 sans DB write
Mode save : Upload Cloudflare custom ID structuré → INSERT media_assets →
  Si INSERT fail → DELETE Cloudflare (rollback, pas d'orphelin)
→ Retour { id, public_url, alt_text, ... }
```

### Custom ID Cloudflare

Format : `verone/marketing/{brandSlug}/{targetChannel}/{YYYYMMDD}-{presetId}-{shortHash}`

Exemple : `verone/marketing/verone/instagram/20260508-V2-a3f4e9`

---

## Fichiers à créer / modifier

### DB & Types

- ✅ `supabase/migrations/20260508180000_bo_mkt_002_marketing_image_generation.sql` — extension `media_assets` (5 colonnes + 1 CHECK + 1 index partiel)
- ✅ `packages/@verone/types/src/supabase.ts` — régénéré via MCP

### Module Gemini (nouveau)

- `packages/@verone/integrations/src/gemini/client.ts` — `GeminiClient.generateImage()`
- `packages/@verone/integrations/src/gemini/types.ts` — Zod schemas request/response
- `packages/@verone/integrations/src/gemini/errors.ts` — `GeminiError` typée
- `packages/@verone/integrations/src/gemini/index.ts` — exports
- `packages/@verone/integrations/package.json` — ajouter export `./gemini`

### Module Marketing — extensions

- `packages/@verone/marketing/src/types.ts` — ajouter `'linkme'` à `BrandSlug`, ajouter `TargetChannel` enum, ajouter `GenerationRequest`/`GenerationResponse` types
- `packages/@verone/marketing/src/data/brands.ts` — ajouter LinkMe (palette `#183559`/`#5DBEBB`, voice B2B SaaS, mood Stripe/Linear/Vercel)
- `packages/@verone/marketing/src/data/presets.ts` — ajouter L1 à L5 (Dashboard SaaS, Story IG B2B, Hero packshot tech, Lifestyle bureau, Statement typo)
- `packages/@verone/marketing/src/lib/compose-prompt.ts` — étendre avec `composePromptWithSources(inputs)` qui injecte la marque + canal + nombre de sources

### Composants (nouveau)

- `packages/@verone/marketing/src/components/MarketingStudio/MarketingStudio.tsx` — orchestrateur 7 étapes
- `packages/@verone/marketing/src/components/MarketingStudio/SourceImagesSection.tsx` — preview thumbnails sélectionnés + bouton ouvrir picker
- `packages/@verone/marketing/src/components/MarketingStudio/MediaPickerModal.tsx` — modal sélection multi-image depuis bibliothèque
- `packages/@verone/marketing/src/components/MarketingStudio/ChannelSelector.tsx` — radios canaux
- `packages/@verone/marketing/src/components/MarketingStudio/GenerationResultCard.tsx` — preview résultat + boutons régénérer/sauvegarder
- `packages/@verone/marketing/src/components/MarketingStudio/index.ts`
- `packages/@verone/marketing/src/components/index.ts` — ajouter export

### Hook

- `packages/@verone/marketing/src/hooks/use-generate-marketing-image.ts` — TanStack Query wrapper (2 mutations : preview + save)
- `packages/@verone/marketing/src/hooks/index.ts`
- `packages/@verone/marketing/src/index.ts` — ajouter export `./hooks`
- `packages/@verone/marketing/package.json` — ajouter export `./hooks`

### Route API

- `apps/back-office/src/app/api/marketing/images/generate/route.ts` — POST orchestrateur

### Page Studio Prompt

- `apps/back-office/src/app/(protected)/marketing/prompts/page.tsx` — remplacer PromptBuilder par MarketingStudio

### Variables env

- ✅ `apps/back-office/.env.example` — variables `GOOGLE_GEMINI_*` ajoutées

### Tests

- `packages/@verone/marketing/src/lib/__tests__/compose-prompt.test.ts` — test `composePromptWithSources`
- `packages/@verone/integrations/src/gemini/__tests__/client.test.ts` — mock fetch + retry/fallback
- `apps/back-office/tests/e2e/marketing-studio-generate.spec.ts` — happy path (Gemini mocké)

### Documentation

- `docs/current/MODULE-MARKETING-IMAGES.md` — guide opérateur + extensibilité
- `docs/scratchpad/dev-report-2026-05-08-marketing-image-generation.md` — rapport final post-merge

---

## Décisions techniques

### Pourquoi pas une nouvelle valeur ENUM `image_type` ?

`image_type` est uniquement sur `product_images`, pas sur `media_assets`. Les images marketing IA vont dans `media_assets` qui n'a pas cet enum. Le champ `source = 'ai_generated'` (déjà présent) suffit pour distinguer.

### Pourquoi `media_assets` et pas `product_images` ?

Une image marketing IA peut être :

- Liée à un produit unique (auto-attribution `product_id`)
- Liée à plusieurs produits (`media_assets` n'impose pas de FK 1:1)
- Sans produit du tout (pure ambiance/marketing) — `product_id` = NULL
- Liée à plusieurs marques (`brand_ids[]`)

`product_images` impose `product_id NOT NULL` → trop contraignant. `media_assets` est le bon choix.

### Pourquoi mode preview avant save ?

Permet à l'utilisateur de régénérer avant de polluer la bibliothèque avec un essai raté. Sinon chaque "Générer" crée un asset DB qu'il faut archiver après. Le mode preview retourne juste le base64 (taille raisonnable, JSON over the wire) sans créer de cloudflare image ni de row DB.

### Custom ID Cloudflare structuré

Permet :

- Recherches API par préfixe (ex: tous les visuels Vérone Instagram du jour)
- Lecture humaine du dashboard Cloudflare
- Suppression en lot par préfixe en cas de besoin

### Coûts Gemini

Free tier Gemini 2.5 Flash Image : 1500 req/jour. À 1-5 générations/jour observées, on reste largement gratuit. Le fallback `gemini-3-pro-image-preview` est payant mais déclenché seulement si 2.5 échoue (rare).

---

## Workflow git

- Branche : `feat/marketing-image-generation` (depuis `staging` à jour)
- 1 PR vers `staging` (jamais `main`)
- Bloc cohérent unique : DB + intégration + UI + tests + doc en une seule PR
- Régénération types Supabase dans le même commit que la migration

---

## Vérification end-to-end

1. Migration appliquée : ✅ vérifié via `information_schema.columns`
2. Types regénérés : ✅ 12 occurrences des nouvelles colonnes dans `supabase.ts`
3. Type-check vert : à valider via CI
4. Build vert : à valider via CI
5. Drift Supabase Types : à valider via CI (le MCP omet `graphql_public`, peut nécessiter un fix post-CI)
6. Test E2E Playwright : login → /marketing/prompts → choix produit → picker → 1 image → marque V → V2 → IG → Générer (mock) → preview → Sauvegarder → vérifier dans /marketing/bibliotheque

---

## Hors scope (Phase 2+)

- Édition templates de prompts depuis l'UI (admin)
- Push réseaux sociaux automatique (Meta/Instagram)
- Génération en lot (5 variantes d'un coup)
- Marque Affect Building Consulting
- Versions multiples par marque (LinkMe V1/V2)
- Templates avec overlay (logo, prix, watermark)
