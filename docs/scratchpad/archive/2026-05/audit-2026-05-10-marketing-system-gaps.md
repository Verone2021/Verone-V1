# Audit système marketing Verone — Manques et roadmap

> Date : 2026-05-10
> Périmètre : back-office, module marketing en cours de construction (chantier `[BO-MKT-ELIGIBILITY-001]`).
> Auteur : audit demandé par Roméo, conduit par l'agent coordinateur (cartographie interne + benchmark industrie sur 8 outils leaders).
> Sortie attendue : liste claire des manques + roadmap priorisée + validation/ajustement du plan 3 sprints proposé par Roméo.

---

## 1. Synthèse en 1 page

### 1.1 Ce qui est déjà solide

Le module marketing du back-office a déjà des bases sérieuses :

- **Bibliothèque images centrale** : `media_assets` (460 photos migrées) + `media_asset_publications` (trace par canal). Sync auto produit↔image via triggers DB. Soft delete propre.
- **Workflow review IA** : `review_status` (pending/approved/rejected) + `reviewed_at` + `reviewed_by`, badge sidebar « À valider », modal de validation.
- **Éligibilité produit** : fonction SQL `is_product_marketing_eligible(uuid)` + hook `useMarketingEligibility()` + voyants colorés sur fiche produit + blocage manuel avec raison.
- **Pont Gemini gratuit** : `MarketingStudio` + `ManualGenerationModal` (4 étapes : copier prompt, télécharger sources, ouvrir Gemini, ré-importer). Bien conçu.
- **Stats brutes Meta + Google** : tables `meta_commerce_syncs` / `google_merchant_syncs` avec `impressions`, `clicks`, `conversions`, `revenue_ht`. RPCs `get_meta_commerce_stats()` / `get_google_merchant_stats()` côté DB. Hooks React Query côté front.
- **Channel pricing** : `channel_pricing.is_published_on_channel` pour publication granulaire produit × canal.

### 1.2 Les 8 manques majeurs (croisement carto + industrie)

Classés par priorité (forte → faible). Chaque ligne croise « ce qui n'est pas en place côté Verone » avec « ce que tous les leaders du marché font ».

| #   | Manque                                                                      | Priorité | Effort estimé |
| --- | --------------------------------------------------------------------------- | -------- | ------------- |
| 1   | **Historique temporel des stats canal** (snapshot quotidien)                | HAUTE    | 4-6h          |
| 2   | **Tracking de performance par image** (impressions, clics, saves par asset) | HAUTE    | 8-12h         |
| 3   | **Stats Site Internet réelles** (RPC sur `sales_orders` filtrés site)       | HAUTE    | 2-3h          |
| 4   | **Pixel Meta + Conversions API** (CAPI) — pré-requis retargeting            | HAUTE    | 6-10h         |
| 5   | **Génération hashtags + copy par Gemini** (au-delà des images)              | MOYENNE  | 4-6h          |
| 6   | **Comparaison période vs période précédente** sur les dashboards            | MOYENNE  | 2h            |
| 7   | **Custom Audiences engagement video/image** côté Meta                       | MOYENNE  | 4-6h          |
| 8   | **Planification publications** (`scheduled_publications` + cron worker)     | BASSE    | 6-10h         |

### 1.3 Validation du plan 3 sprints de Roméo

Le plan proposé est **cohérent et bien dimensionné**. Les hooks et RPCs nécessaires existent déjà (`useMetaCommerceStats`, `useGoogleMerchantStats`, `get_*_stats`). 1 ajustement à anticiper :

- **Insérer un Sprint 0 court (~2h) avant le Sprint 3** : créer la table snapshot `*_syncs_history` (jour J / canal / produit / metrics). Sans ça, les filtres « 7j / 30j / 90j » du Sprint 3 afficheront des chiffres bruts identiques quel que soit le filtre, parce que chaque sync remplace les valeurs précédentes.
- **Sprint 4 « Top images »** : ce n'est PAS juste une page à créer. C'est un mini-pipeline complet (table dédiée + alimentation depuis Meta Insights API par creative_id + jointure image source). À planifier comme un chantier à part de 8-12h.

### 1.4 Plan synthétique recommandé (ordre)

```
Sprint 1 (1-2h)  → Mini-widget perf fiche produit            [validé tel quel]
Sprint 2 (3h)    → Onglet « Top produits » 3 pages canaux    [validé tel quel]
Sprint 0 (4-6h)  → Snapshot quotidien stats (NOUVEAU)        [à insérer ICI]
Sprint 3 (4-6h)  → Page transverse /marketing/performance    [validé tel quel après Sprint 0]
Sprint 4 (8-12h) → Top images vues (pipeline complet)        [à étoffer vs placeholder initial]
Sprint 5 (6-10h) → Pixel + CAPI Meta                          [pré-requis retargeting]
Sprint 6 (4-6h)  → Hashtags + copy IA Gemini                  [industrialisation]
```

---

## 2. Cartographie détaillée — état actuel par axe

### 2.1 Axe A — Métriques par canal

**Tables et RPCs en place :**

| Table                   | Métriques stockées                                                                    | RPC associé                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `meta_commerce_syncs`   | impressions, clicks, conversions, revenue_ht, meta_status, meta_status_detail (jsonb) | `get_meta_commerce_stats()`, `get_meta_commerce_products()`, `update_meta_sync_status()` |
| `google_merchant_syncs` | impressions, clicks, conversions, revenue_ht, google_status, google_status_detail     | `get_google_merchant_stats()`, `get_google_merchant_products()`                          |
| `channel_pricing`       | is_published_on_channel (bool)                                                        | —                                                                                        |

**Hooks React Query :**

- `useMetaCommerceProducts()`, `useMetaCommerceStats()` (`packages/@verone/channels/src/hooks/use-meta-commerce-products.ts`)
- `useGoogleMerchantProducts()`, `useGoogleMerchantStats()`, `useRefreshGoogleMerchantStats()`

**Pages :**

- `/canaux-vente/page.tsx` (dashboard agrégé)
- `/canaux-vente/meta/page.tsx`
- `/canaux-vente/google-merchant/page.tsx`
- `/canaux-vente/site-internet/page.tsx` (stats hardcodées 0 actuellement)

**Manques côté Verone (croisés avec industrie) :**

| Manque                                          | Impact concret                                             | Pratique industrie                                             |
| ----------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| Pas d'historique temporel                       | Filtres « 7j / 30j / 90j » impossibles, juste l'instantané | Tous les leaders archivent quotidien (Buffer, Sprout, Klaviyo) |
| Pas de ROAS / CPC / CPM stockés                 | Pas de calcul rentabilité ad spend                         | Métriques de base chez Meta Ads Manager                        |
| Pas de breakdowns (device, placement, audience) | Ne peut pas voir « Instagram Stories vs Feed »             | Native Meta Insights API                                       |
| Pas de comparaison période vs précédent         | Pas de tendance affichée                                   | Standard universel (Buffer Analyze, Klaviyo)                   |
| Stats Site Internet à 0                         | Sprint 2 ligne « Site Internet » impossible                | À résoudre via RPC sur `sales_orders` filtrés                  |

### 2.2 Axe B — Bibliothèque images + tracking vues

**Schéma `media_assets` :**

Colonnes principales : `id`, `cloudflare_image_id`, `public_url`, `filename`, `alt_text`, `width`, `height`, `file_size`, `format`, `asset_type` (product|lifestyle|packshot|logo|ambiance|other), `brand_ids[]`, `tags[]`, `notes`, `source_product_image_id`, `product_id`, `variant_group_id`, `source` (manual_upload|supplier_provided|ai_generated|stock_photo), `ai_prompt_used`, `review_status`, `reviewed_at`, `reviewed_by`, `created_by`, `created_at`, `updated_at`, `archived_at`.

**Table `media_asset_publications` :**

`id`, `asset_id` (FK), `channel` (site_verone|site_bohemia|site_solar|site_flos|meta|pinterest|tiktok|linkedin|newsletter|ads|blog|other), `external_url`, `notes`, `published_at`, `unpublished_at` (soft delete), `created_by`.

**Triggers en place :**

- `mirror_product_image_to_media_asset()` (AFTER INSERT)
- `mirror_product_image_update_to_media_asset()` (AFTER UPDATE)
- ON DELETE CASCADE entre `product_images` et `media_assets`

**Pages :**

- `/marketing/bibliotheque/page.tsx` (`MediaLibraryView`)
- Composants : `MediaLibraryToolbar`, `MediaLibraryByProduct`, `MediaAssetDetailModal`, `UploadAssetModal`
- Filtres : reviewStatus, channelFilter, brand, asset_type, produit lié

**Manques côté Verone :**

| Manque                             | Impact concret                                                     | Pratique industrie                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Pas de tracking vues par image     | Impossible de répondre à « quelle photo a fait le plus de vues ? » | Métrique de base Meta Insights (par creative_id) et Pinterest (par pin_id)                           |
| Pas de score performance par image | Tri impossible « top images »                                      | Score brut universel : `(likes + comments + saves + shares) / impressions`                           |
| Pas d'export vers Custom Audience  | Pas de retargeting visuel                                          | Meta Custom Audiences engagement video/image standard depuis 2018, +3,2x CTR vs visiteurs génériques |
| Pas de score saves Pinterest       | Pinterest pas encore branché — à anticiper                         | Saves = signal d'intent le plus fort 2026 (supérieur aux likes IG)                                   |

### 2.3 Axe C — Workflow publication

**Pipeline en place :**

1. Image générée IA → `review_status = 'pending_review'`
2. Validation manuelle (modal) → `approved` ou `rejected`
3. Publication → INSERT dans `media_asset_publications`

**Fonctions DB :**

- `is_product_marketing_eligible(uuid)` (combine archived_at, product_status, marketing_blocked, is_published_online OR meta_status='active')

**Hooks et UI :**

- `useMarketingEligibility(productId)` (calcul local + DB)
- `MarketingEligibilitySection` dans `product-publication-tab.tsx` (voyants colorés + boutons Bloquer / Débloquer)

**Manques côté Verone :**

| Manque                                  | Impact concret                         | Pratique industrie                                  |
| --------------------------------------- | -------------------------------------- | --------------------------------------------------- |
| Pas de planification (`scheduled_at`)   | Tout doit être publié immédiatement    | Buffer Queue, Later Visual Planner, Sprout Calendar |
| Pas de cross-posting 1-clic multi-canal | 1 publication = 1 canal                | Standard universel (tous les leaders)               |
| Pas d'approbation multi-step            | OK pour solo, limite si équipe grandit | Sprout (Advanced), Hootsuite                        |
| Raisons rejet en texte libre            | Pas d'analyse possible                 | Enums fermés chez Sprout                            |
| Pas de notifications validation         | Visible uniquement via badge sidebar   | Slack / email standard                              |

### 2.4 Axe D — Génération IA (Gemini)

**Client en place :**

- `GeminiClient` (`packages/@verone/integrations/src/gemini/client.ts`)
- Modèles : `gemini-2.5-flash-preview-04-17` (primary), `gemini-2.0-flash-exp` (fallback)
- Auth : `GOOGLE_GEMINI_API_KEY` via header
- Erreurs typées : AUTH_ERROR, RATE_LIMIT, VALIDATION_ERROR, SAFETY_BLOCK, TIMEOUT, NETWORK_ERROR, SERVER_ERROR

**Endpoint :**

- `POST /api/marketing/images/generate` (mode preview ou save)
- Validation Zod, composition prompt (brand + preset + sources + canal)
- Mode save : upload Cloudflare + INSERT `media_assets` avec `review_status='pending_review'`

**Pont gratuit :**

- `MarketingStudio` + `ManualGenerationModal` (4 étapes manuelles)
- localStorage : `lastPrompt`, `sourceImageIds`, `targetChannel` pour pré-remplir l'upload

**Manques côté Verone :**

| Manque                               | Impact concret                                            | Pratique industrie                                         |
| ------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------- |
| Pas de logs d'appels (latence, coût) | Impossible de mesurer combien Gemini coûte / délais réels | Standard chez Klaviyo (cost tracking par flow)             |
| Pas de génération hashtags           | Roméo doit les écrire à la main                           | Hootsuite Free, Inflact, Predis.ai, Canva — universel 2026 |
| Pas de génération copy/description   | Description produit à la main                             | Shopify Magic réduit le temps de 75 %                      |
| Pas d'A/B testing prompts            | Pas de moyen de comparer 2 prompts                        | Standard 2026 (Madgicx AI Chat, Vizit)                     |
| Pas de rate limiting client          | Risque pic d'appels coûteux                               | Throttling standard chez tous les SDK enterprise           |

---

## 3. Benchmark industrie — résumé exécutif

### 3.1 Patterns universels (ce que TOUS les leaders font)

1. **Cross-posting 1-clic multi-canal** avec adaptations par canal (Buffer, Later, Sprout, Hootsuite).
2. **Top N triable par engagement / impressions / conversions** avec drill-down.
3. **Comparaison période vs précédente** par défaut sur tous les dashboards.
4. **Custom Audiences à partir de l'engagement** comme seed Lookalike (Meta).
5. **CAPI activé en 2025-2026** côté Meta + Pinterest (+24 % conversions attribuées en moyenne avec CAPI vs Pixel seul).
6. **Asset library taggable** avec hiérarchies + dossiers.
7. **AI generation copy + image** intégrée nativement (Shopify Magic, Canva Magic, Adobe Firefly, Meta Advantage+, Klaviyo AI).
8. **Brand kit auto-appliqué** (couleurs + fonts + logos).
9. **Best Time to Post** calculé sur historique compte.
10. **Reports presentation-ready exportables PDF** sur paid plans.

### 3.2 Idées différenciantes pour Verone (top 5)

| Idée                                                          | Outil           | Pourquoi pertinent pour Verone                                                                                                                                                                    |
| ------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visual Planner Instagram drag-drop** (preview grid 3:4)     | Later           | Marque déco/mobilier = forte exigence visuelle. Le grid Instagram doit être cohérent. Pas de concurrent sérieux sur ce sujet.                                                                     |
| **Pinterest Trends API** (saisonnalité + keywords prédictifs) | Pinterest natif | Données 2 ans + filtrage saisonnalité. Tendances 2026 : « afrobohemian decor » +220 %, « rattan furniture », « micro-makeover ». Très pertinent pour planifier des campagnes 3-6 mois à l'avance. |
| **Predictive CLV + Churn Risk + Next Order Date**             | Klaviyo         | Modèles re-trained weekly, déclenchent flows email basés sur la date prédite du prochain achat. +14 à +45 % revenue per recipient.                                                                |
| **Built-in Creative Testing** (5 creatives même ad set)       | Meta Advantage+ | Test sans fragmenter le budget. Disparition progressive de l'A/B test fragmenté.                                                                                                                  |
| **Bulk Create depuis spreadsheet**                            | Canva           | Upload CSV → batch designs personnalisés en seconds. Idéal pour déclinaisons catalogue (Vérone, Bohemia, Solar, Flos).                                                                            |

### 3.3 Dépréciations critiques 2025-2026 à connaître

- **12 janvier 2026** : Meta a supprimé `7d_view` et `28d_view` attribution windows sur Ads Insights API. Impact sur reporting historique.
- **15 novembre 2025** : Meta a déprécié `impressions` et `page_fans` sur Page Insights API.
- **Janvier 2025** : Meta a déprécié `video_views` (non-Reels), `email_contacts`, `profile_views`, `website_clicks`, `phone_call_clicks`, `text_message_clicks` sur Instagram Insights API.
- **Pinterest API ToS** : interdit le stockage long-terme des données analytics extraites via API. Implique export manuel pour historique > la durée native (~90 j).

### 3.4 Stack technique observée

**APIs externes à brancher (par priorité Verone) :**

| API                            | Endpoints clés                                                          | Auth                          | Priorité                    |
| ------------------------------ | ----------------------------------------------------------------------- | ----------------------------- | --------------------------- |
| Meta Graph API + Marketing API | `/{ad-id}/insights`, `/{pixel-id}/events` (CAPI), `/customaudiences`    | OAuth 2.0 + System User token | 1 (canal en prod)           |
| Pinterest API v5 + Trends      | `/v5/pins/{id}/analytics`, `/v5/ad_accounts/{id}/events` (CAPI), Trends | OAuth 2.0                     | 2 (annoncé prochain)        |
| Klaviyo API                    | `/profiles`, `/segments`, `/flows`, `/campaigns`, `/events`             | API Key                       | 3 (si email engine)         |
| GA4 Measurement Protocol       | gtag.js + server endpoint                                               | API secret                    | 3 (attribution multi-touch) |

---

## 4. Roadmap priorisée pour Verone

### 4.1 Bloc 1 — Fondations stats (priorité HAUTE, ~12-18h)

**Sprint 0** — Snapshot historique des stats (4-6h)

- Migration : table `meta_commerce_syncs_snapshots` (date, product_id, impressions, clicks, conversions, revenue_ht). Idem `google_merchant_syncs_snapshots`.
- Cron Edge Function quotidien à 03:00 UTC qui copie l'état des `*_syncs` dans la table snapshot.
- RPC `get_*_stats_history(start_date, end_date)` pour requêter par période.
- Régénération types Supabase + commit dans la même PR (règle workflow).

**Sprint 1** — Mini-widget perf fiche produit (1-2h, plan Roméo validé)

- Hook `useProductPerformance(productId)` qui agrège `meta_commerce_syncs` + `google_merchant_syncs`.
- Composant `ProductPerformanceWidget` (4 KPIs).
- Intégration dans `product-publication-tab.tsx`.

**Sprint 2** — Onglet « Top produits » 3 pages canaux (3h, plan Roméo validé)

- Tables top 20 sur `/canaux-vente/meta`, `/canaux-vente/google-merchant`, `/canaux-vente/site-internet`.
- Réutilisation hooks existants.
- Pour Site Internet : créer RPC `get_site_internet_top_products(limit, period)` qui filtre `sales_orders` par canal site (à confirmer la colonne distinguant le canal).

**Sprint 3** — Page transverse `/marketing/performance` (4-6h, plan Roméo validé après Sprint 0)

- Tableau pivot canal × produit, filtres période, marque, statut éligibilité, top N.
- Tri par revenue / conversions / ROAS / impressions.
- Export CSV.
- Onglet placeholder « Top images » (vide tant que Sprint 4 pas fait).

### 4.2 Bloc 2 — Performance images + retargeting (priorité HAUTE, ~16-22h)

**Sprint 4** — Pipeline « Top images vues » (8-12h)

- Migration : table `media_asset_analytics` (asset_id, channel, period_date, impressions, clicks, saves, conversions). Index sur (asset_id, channel, period_date).
- Edge Function pull Meta Insights API par `creative_id` ou `media_id` puis matche vers `media_assets` via `external_url` ou métadonnée stockée à la publication.
- Hook `useMediaAssetAnalytics(assetId, period)`.
- UI bibliothèque : tri « Top vues » / « Top saves » / « Top conversions ».
- Affichage compteur sur fiche produit (« cette image a fait 12 400 vues sur Meta »).

**Sprint 5** — Pixel Meta + Conversions API (6-10h)

- Pixel JS sur site-internet (déjà à confirmer si déjà en place — sinon ajouter).
- Edge Function `/api/marketing/meta-capi/event` qui forward server-side les events critiques (PageView, ViewContent, AddToCart, Purchase) avec match keys hashés SHA-256.
- Variables : `META_PIXEL_ID`, `META_CAPI_TOKEN`.
- Documentation interne pour brancher Custom Audiences engagement video/image après coup côté Meta Ads Manager.

### 4.3 Bloc 3 — Industrialisation IA (priorité MOYENNE, ~10-14h)

**Sprint 6** — Génération hashtags + copy par Gemini (4-6h)

- Route `POST /api/marketing/hashtags/generate` (input : productId ou assetId + targetChannel + brand → output : 5 hashtags pertinents, 1-2 niche, 1-2 industry, 1 broad).
- Route `POST /api/marketing/copy/generate` (input : productId + targetChannel + tone → output : description courte + longue + caption Instagram).
- UI dans MarketingStudio : bouton « Générer hashtags » / « Générer description ».
- Stockage dans `media_asset_publications.notes` ou nouvelle colonne `caption` / `hashtags[]`.

**Sprint 7** — Logs IA + cost tracking (4-6h)

- Migration : table `ai_generation_logs` (timestamp, endpoint, model, latency_ms, tokens_input, tokens_output, cost_cents_estimated, error_code, user_id).
- Hook côté `GeminiClient` pour logger chaque appel.
- Page admin `/parametres/ia-usage` (stats mensuelles, top users, top prompts).

### 4.4 Bloc 4 — Workflow publication avancé (priorité BASSE, ~12-18h)

**Sprint 8** — Planification (`scheduled_publications`) (6-10h)

- Migration : table `scheduled_publications` (asset_id, channel, scheduled_at, status, published_at, error_message, retry_count).
- Cron Edge Function toutes les 5 min qui pousse les publications dont `scheduled_at <= now()` et `status = 'pending'`.
- UI calendrier dans `/marketing/calendrier` (drag-drop sur calendrier mensuel).

**Sprint 9** — Cross-posting 1-clic multi-canal (4-6h)

- Modal « Publier sur N canaux » dans bibliothèque.
- Adaptation caption / hashtags par canal selon templates.
- Création N entrées `scheduled_publications` ou `media_asset_publications` selon mode.

**Sprint 10** — Pinterest brancher (4-6h, à faire APRÈS validation Meta)

- Auth OAuth 2.0 Pinterest.
- Edge Function pull `/v5/pins/{id}/analytics`.
- Table `pinterest_pin_syncs` similaire à `meta_commerce_syncs`.
- Intégration `/canaux-vente/pinterest`.

---

## 5. Recommandations stratégiques

### 5.1 Garde-fous

- **Ne pas attaquer Pinterest tant que Meta n'est pas pleinement instrumenté** (stats + CAPI + retargeting). Sinon double effort sur deux pipelines à moitié finis.
- **Insérer Sprint 0 (snapshot historique) AVANT Sprint 3** sinon le résultat sera décevant (pas de tendance affichée).
- **Pixel + CAPI = pré-requis fondamental retargeting**. Sans CAPI, pas de Custom Audience fiable post-iOS14.5. C'est non-négociable si l'objectif est de faire des publicités ciblées sur les visiteurs ayant vu certaines images.
- **Tracking par image (Sprint 4) sera un chantier conséquent** (Meta Insights API par creative_id n'est pas trivial). Prévoir un développement isolé, pas en bundle avec d'autres sprints.

### 5.2 Idées différenciantes à creuser à terme

- **Visual Planner Instagram** style Later : pertinent pour Verone (marque visuelle déco). Aspect différenciant fort sur le marché.
- **Pinterest Trends API** : à brancher dès que Pinterest est en prod. Valeur stratégique pour planning campagnes saisonnières (Noël, été, rentrée).
- **A/B testing prompts Gemini** : tester 2 styles visuels et mesurer lequel génère le meilleur taux d'approbation review. Déjà partiellement faisable avec `review_status` actuel.
- **Bulk generation depuis spreadsheet** (à la Canva Bulk Create) : si Verone scale à 1000+ produits / 4 marques, déclinaisons batch indispensables.

### 5.3 Ce qu'il NE faut PAS faire

- Brancher Klaviyo / Hootsuite / Sprout en SaaS additionnel : Verone construit déjà son back-office, dupliquer dans un outil tiers fragmente le signal.
- Implémenter une attribution multi-touch « data-driven » avant 3000 conversions/mois (Markov / Shapley). Démarrer linear ou time-decay simple.
- Stocker des données Pinterest analytics > 90 jours (interdit par Pinterest API ToS).
- Multiplier les modèles IA : rester sur Gemini tant que ça suffit, ajouter Imagen/Veo seulement si besoin spécifique.

---

## 6. Annexes

### 6.1 Chemins de fichiers clés

```
Migrations marketing existantes :
  supabase/migrations/20260331150000_meta_commerce_channel.sql
  supabase/migrations/20260330140000_fix_google_merchant_rpc_security_definer.sql
  supabase/migrations/20260331200000_meta_sync_status_rpcs.sql
  supabase/migrations/20260413030000_fix_meta_commerce_rpcs.sql
  supabase/migrations/20260501020000_si_published_on_channel.sql
  supabase/migrations/20260501120000_si_ai_001_marketing_fields.sql
  supabase/migrations/20260502125504_bo_mkt_001_dam_media_assets.sql
  supabase/migrations/20260502214522_bo_mkt_dam_002_media_assets_product_link.sql
  supabase/migrations/20260503121155_bo_mkt_dam_003_publications_tracking.sql
  supabase/migrations/20260510011342_bo_mkt_eligibility_001_marketing_blocked.sql
  supabase/migrations/20260510011344_bo_mkt_eligibility_001_media_review_status.sql

Hooks React Query :
  packages/@verone/channels/src/hooks/use-meta-commerce-products.ts
  packages/@verone/channels/src/hooks/use-google-merchant-products.ts
  packages/@verone/products/src/hooks/use-marketing-eligibility.ts
  packages/@verone/products/src/hooks/use-media-assets.shared.ts

Pages back-office :
  apps/back-office/src/app/(protected)/canaux-vente/page.tsx
  apps/back-office/src/app/(protected)/canaux-vente/google-merchant/page.tsx
  apps/back-office/src/app/(protected)/canaux-vente/meta/page.tsx
  apps/back-office/src/app/(protected)/canaux-vente/site-internet/page.tsx
  apps/back-office/src/app/(protected)/marketing/bibliotheque/page.tsx
  apps/back-office/src/app/(protected)/marketing/prompts/page.tsx

API & Gemini :
  apps/back-office/src/app/api/marketing/images/generate/route.ts
  packages/@verone/integrations/src/gemini/client.ts
  packages/@verone/integrations/src/gemini/types.ts
  packages/@verone/integrations/src/gemini/errors.ts
  packages/@verone/marketing/src/components/MarketingStudio/MarketingStudio.tsx
```

### 6.2 Sources benchmark industrie

Détaillées dans le rapport sous-agent (transcript). Sources principales : Meta Developers, Pinterest Developers, Buffer / Later / Sprout / Hootsuite docs officielles, Klaviyo docs, Shopify, Canva, Adobe Firefly, Madgicx, Vizit, Brandwatch, GrowthJockey, Layerfive.

---

## 7. Plan définitif — ordre d'exécution

11 sprints, dans cet ordre strict, sans dévier. Total estimé : 50-80h de dev.

| #   | Sprint                                                | Durée | Apport business                                         |
| --- | ----------------------------------------------------- | ----- | ------------------------------------------------------- |
| 0   | Snapshot historique stats canal                       | 4-6h  | Filtres période réels (7j/30j/90j), courbes de tendance |
| 1   | Widget perf fiche produit                             | 1-2h  | 4 KPIs sur chaque fiche produit + lien détail           |
| 2   | Top produits par canal                                | 3h    | Top 20 produits par canal (Meta, Google, Site)          |
| 3   | Page transverse `/marketing/performance`              | 4-6h  | Tableau pivot canal × produit, filtres, export CSV      |
| 4   | Pixel Meta + Conversions API                          | 6-10h | Pré-requis retargeting post-iOS14.5                     |
| 5   | Top images vues (pipeline complet)                    | 8-12h | Score performance par image, retargeting visuel         |
| 6   | Génération hashtags + copy par Gemini                 | 4-6h  | Industrialisation création contenu                      |
| 7   | Logs IA + cost tracking                               | 4-6h  | Visibilité coûts Gemini, optimisation prompts           |
| 8   | Planification publications (`scheduled_publications`) | 6-10h | Programmation à l'avance, calendrier mensuel            |
| 9   | Cross-posting 1-clic multi-canal                      | 4-6h  | 1 image → N canaux, captions adaptées                   |
| 10  | Pinterest brancher                                    | 4-6h  | Stats Pinterest uniformes avec Meta                     |

### 7.1 Logique de l'ordre

- **Sprint 0 en premier** parce que sans historique des stats, tout dashboard ultérieur affiche un instantané sans tendance. Coût : 4-6h en amont, mais évite de devoir attendre 30 jours pour voir un mois d'historique après mise en service.
- **Sprints 1 → 2 → 3** réutilisent directement le snapshot du Sprint 0. Livraisons rapides successives = visibilité immédiate pour Roméo.
- **Sprint 4 (Pixel + CAPI) AVANT Sprint 5 (Top images)** parce que le retargeting visuel n'est utile que si CAPI est en place pour suivre les conversions post-iOS14.5. Faire « Top images vues » sans CAPI = chiffres jolis mais inexploitables pour pub.
- **Sprint 5 = chantier le plus gros et l'objectif central** énoncé par Roméo (retargeting basé sur les images les plus vues). Vient en position 6 parce qu'il a besoin des 5 sprints précédents.
- **Sprints 6 → 7** industrialisation IA (hashtags, copy, suivi coût).
- **Sprints 8 → 9** passage du manuel au semi-auto (planning, cross-posting).
- **Sprint 10 en dernier** : Pinterest branché uniquement quand Meta tourne propre. Pas de chantier parallèle sur deux canaux à moitié finis.

### 7.2 Garde-fous

- **Pas de bypass de l'ordre.** Chaque sprint dépend de ce qui précède.
- **Sprint 4 (Pixel + CAPI) non-négociable** si l'objectif est le retargeting visuel.
- **Sprint 10 (Pinterest) après validation complète Meta**, pas en parallèle.
- **Limite Pinterest API ToS** : pas de stockage analytics > 90 jours côté Verone.
- **Dépréciations Meta 2025-2026** à intégrer dès Sprint 0 (cf. section 3.3).

---

> Fin du rapport.
