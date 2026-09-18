# Audit complet — Finalisation site-internet (BO + Front)

**Date** : 2026-04-26
**Demandeur** : Romeo
**Auteur** : Claude (mode audit, zéro modification de code)
**Branche** : `feat/multi-shipments-tracking-email` (audit hors scope, à dérouler dans branche dédiée plus tard)
**Cible** : `apps/site-internet/` (front B2C — veronecollections.fr) + `apps/back-office/` (pilote)

---

## 0. Résumé exécutif

| Volet                                           | Statut                  | Note                                                                                                                              |
| ----------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Front public site-internet**                  | ✅ Largement complet    | 27 routes, panier/checkout/Stripe/wishlist/avis/promo/ambassadeurs/RGPD opérationnels                                             |
| **Pilotage produits depuis BO**                 | ⚠️ Partiel              | API `publish/unpublish` existe mais l'UI affiche un texte trompeur ("automatique") sans boutons d'action ni guardrails cascade    |
| **Dashboard site dans BO**                      | ❌ Cassé                | KPIs hardcodés à 0 (commandes, CA, avis en attente)                                                                               |
| **Liste clients site dans BO**                  | ❌ Cassé                | Filtre `.not('auth_user_id','is',null)` au lieu de `source_type='site-internet'` → 0 client visible                               |
| **CMS pages (CGV/FAQ/Livraison/Retours)**       | ⚠️ Partiel              | Routes site OK, contenu CMS-driven en DB, toggle `is_published` non exposé en BO                                                  |
| **Configuration site (Identité/SEO/Analytics)** | ⚠️ Partiel              | Section unique 738 lignes (viole règle 400L), Facebook Pixel placeholder non sauvegardé, réseaux sociaux non éditables            |
| **Ambassadeurs B2C**                            | ✅ Système opérationnel | PR #583 en attente de merge (`[SI-AMB-001]` dans ACTIVE.md) — paiement primes manquant                                            |
| **Canaux Google + Meta**                        | ✅ Opérationnel         | Phases 1-3 du plan canaux-de-vente terminées (PR #405 mergée 2026-03-31) ; guardrails cascade `Site → Google/Meta` à câbler en UI |
| **Tests Playwright live**                       | ⛔ Bloqué               | Les deux profils MCP (lane-1 et lane-2) sont verrouillés par d'autres sessions. Audit textuel uniquement                          |

**Verdict** : le site est e-commerce-complet côté public. Le travail restant est en majorité **côté back-office** — combler les trous de pilotage (publication, KPIs, clients, CMS toggle), pas réimplémenter le site. La liste exacte est déjà dans `.claude/work/ACTIVE.md` lignes 103-177 sous forme de **8 sprints `SI-*`**, à grouper en blocs selon `.claude/rules/workflow.md`.

---

## 1. Inventaire complet — `apps/site-internet`

### 1.1 Routes (27)

| Path                                                        | Statut     | Données                               | Remarques                                                                                                                       |
| ----------------------------------------------------------- | ---------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                         | ✅ Complet | DB                                    | Hero, catégories, collections, reassurance, newsletter, JSON-LD                                                                 |
| `/catalogue`                                                | ✅ Complet | DB (RPC `get_site_internet_products`) | Filtres catégorie/couleur/prix/marque/pièce/style + recherche                                                                   |
| `/produit/[id]`                                             | ⚠️ Partiel | DB                                    | Cross-sell mock, accordéon "Entretien" placeholder, accordéon "Avis" placeholder (alors que ProductReviews existe!)             |
| `/collections`                                              | ✅ Complet | DB                                    |                                                                                                                                 |
| `/collections/[slug]`                                       | ⚠️ Bug DB  | DB                                    | RPC `get_site_internet_collection_detail()` expose `cost_price` (prix fournisseur) au lieu de `channel_pricing.custom_price_ht` |
| `/panier`                                                   | ✅ Complet | localStorage + CartContext            | Layout 2-cols simple, polish UX possible                                                                                        |
| `/checkout`                                                 | ✅ Complet | Stripe + DB                           | Adresses + promo + livraison ; UX mono-page                                                                                     |
| `/checkout/success`                                         | ✅ Complet | Stripe webhook                        |                                                                                                                                 |
| `/checkout/cancel`                                          | ✅ Complet |                                       |                                                                                                                                 |
| `/compte`                                                   | ✅ Complet | DB + Auth                             | Commandes + adresses + profil + password                                                                                        |
| `/compte/favoris`                                           | ✅ Complet | DB                                    | wishlist                                                                                                                        |
| `/ambassadeur`                                              | ✅ Complet | DB                                    | Profil, code promo, QR, commissions, CGU                                                                                        |
| `/auth/login` + `register` + `forgot-password` + `callback` | ✅ Complet | Supabase Auth                         | + Google OAuth                                                                                                                  |
| `/contact`                                                  | ✅ Complet | API + email Resend                    |                                                                                                                                 |
| `/a-propos`                                                 | ✅ Complet | Statique                              |                                                                                                                                 |
| `/faq`                                                      | ⚠️ CMS     | DB `cms_pages` slug `faq`             | Vide si slug absent                                                                                                             |
| `/cgv`                                                      | ⚠️ CMS     | DB `cms_pages` slug `cgv`             | **Critique légalement** — vérifier contenu                                                                                      |
| `/mentions-legales`                                         | ⚠️ CMS     | DB `cms_pages`                        | **Critique légalement**                                                                                                         |
| `/livraison`                                                | ⚠️ CMS     | DB                                    |                                                                                                                                 |
| `/retours`                                                  | ⚠️ CMS     | DB                                    |                                                                                                                                 |
| `/politique-de-confidentialite`                             | ✅ Complet | Statique                              | RGPD                                                                                                                            |
| `/confidentialite`                                          | ⚠️ Doublon | Statique/alias                        | Suspect duplicate avec `/politique-de-confidentialite`                                                                          |
| `/cookies`                                                  | ✅ Complet | Statique                              |                                                                                                                                 |

### 1.2 Routes API (24)

| Domaine     | Routes                                                                                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout    | `POST /api/checkout` (Stripe session)                                                                                                                                                           |
| Webhooks    | `POST /api/webhooks/stripe`                                                                                                                                                                     |
| Promo       | `POST /api/promo/validate`                                                                                                                                                                      |
| Shipping    | `GET /api/shipping-config`                                                                                                                                                                      |
| Account     | `GET /api/account/export` (RGPD portabilité)                                                                                                                                                    |
| Contact     | `POST /api/contact`                                                                                                                                                                             |
| Feeds       | `GET /api/feeds/products.xml` (Google Shopping + Meta)                                                                                                                                          |
| Emails (10) | `welcome`, `order-confirmation`, `order-status-update`, `shipping-notification`, `delivery-confirmation`, `review-request`, `abandoned-cart`, `win-back`, `admin-order-notification`, `_shared` |
| Cron        | abandoned-cart, review-request, ambassador-primes, win-back                                                                                                                                     |

### 1.3 Composants locaux notables

- **Layout** : `Header` (sticky + cart/wishlist badges + search), `Footer`, `MegaMenu`, `MobileNav`, `PromoBanner`
- **Home** : `HeroSection`, `CategoryTiles`, `InspirationBanner`, `HomepageReviews`, `NewsletterSection`
- **Catalogue** : `CatalogueSidebar`, `CatalogueMobileFilters`
- **Cards & UI** : `CardProductLuxury`, `BadgeLuxury`, `StarRating`
- **Produit** : `ProductGallery`, `ProductSidebar`, `ProductAccordions`, `ProductCrossSell`, `VariantsSection`, `ProductReviews`, `ShareButtons`, `StickyAddToCart`
- **CMS** : `CmsPageContent`
- **Search** : `SearchOverlay` (cmd+k)
- **Analytics** : `GoogleAnalytics` (GA4), `MetaPixel`
- **SEO** : `JsonLdProduct`, `JsonLdOrganization`
- **Cookies** : `CookieConsent` (GDPR)

### 1.4 Hooks Supabase

`use-auth-user`, `use-catalogue-products`, `use-catalogue-filters`, `use-categories`, `use-collections`, `use-collection-by-slug`, `use-collection-products`, `use-product-detail`, `use-reviews`, `use-customer-addresses`, `use-wishlist`, `use-site-content`.

### 1.5 Stack (extrait `package.json`)

Next 15.5.7 + React 18.3.1 + TS 5.3.3 + Tailwind 3.4.1 + Supabase SSR + Stripe 20.4.1 + React Query 5.90.7 + Framer Motion 12.23.24 + Resend 6.6.0 + Radix Dialog + Vaul + Lucide.

---

## 2. Inventaire complet — Pilotage BO du site-internet

### 2.1 Hub central `/canaux-vente/site-internet` (10 onglets)

| Onglet        | Fichier                                                                        | Statut       | Gros points                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard     | `page.tsx` (inline)                                                            | ❌ **Cassé** | Commandes/CA hardcodés à 0 ; pas de graphiques ; "Avis en attente" hardcode 0                                                                           |
| Produits      | `ProductsSection.tsx`                                                          | ✅ Complet   | RPC produits site + toggle publication inline + modal édition 6 onglets                                                                                 |
| Collections   | `CollectionsSection.tsx`                                                       | ⚠️ Partiel   | Toggle visibilité OK ; upload image via `window.prompt()` ; **CRUD création/suppression manquant**                                                      |
| Catégories    | `CategoriesSection.tsx`                                                        | ⚠️ Partiel   | Toggle menu OK ; recherche OK ; `buildCategoryTree()` retourne plat (pas de hiérarchie visuelle) ; CRUD manquant                                        |
| Configuration | `ConfigurationSection.tsx`                                                     | ⚠️ Partiel   | **738 lignes (viole règle 400L)**, FB Pixel placeholder non persisté, réseaux sociaux non exposés                                                       |
| Commandes     | `OrdersSection.tsx` (46 L)                                                     | ✅ Complet   | Délègue à `SalesOrdersTable` filtrée par `channelId` site-internet                                                                                      |
| Clients       | `ClientsSection.tsx`                                                           | ❌ **Cassé** | Filtre `.not('auth_user_id','is',null)` au lieu de `.eq('source_type','site-internet')` → 0 client visible                                              |
| Avis          | `ReviewsSection.tsx` (491 L)                                                   | ✅ Complet   | Lister/recherche/approve/reject ; manque : répondre à un avis                                                                                           |
| Contenu       | `CMSSection` (454 L) + `CmsPagesSection` (232 L) + `NewsletterSection` (121 L) | ⚠️ Partiel   | Hero/Reassurance/Bandeau OK ; Pages CMS CRUD OK mais **toggle `is_published` non exposé UI** ; Newsletter lecture seule (pas d'export, pas de campagne) |
| Promotions    | `PromoCodesSection.tsx`                                                        | ✅ Complet   | CRUD codes promo ; ciblage produits/collections ; min/max ; canaux                                                                                      |

### 2.2 Sous-pages produit BO

| Onglet sur `/produits/catalogue/[id]` | Statut            | Remarque                                                                                                                                                          |
| ------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Général (slug, name, status, dates)   | ✅ Complet        |                                                                                                                                                                   |
| Photos                                | ✅ Complet        |                                                                                                                                                                   |
| Tarification (channel_pricing)        | ✅ Complet        |                                                                                                                                                                   |
| SEO (channel_product_metadata)        | ✅ Complet        |                                                                                                                                                                   |
| Stock                                 | ✅ Complet        |                                                                                                                                                                   |
| **Publication**                       | ❌ Texte trompeur | Affiche les 4 canaux (Site/LinkMe/Google/Meta) **mais texte dit "publication automatique" et aucun bouton n'appelle `/api/products/[id]/publish` ni `unpublish`** |

### 2.3 Routes API BO de pilotage site

| Route                                                 | Existe ? | UI câblée ?      |
| ----------------------------------------------------- | -------- | ---------------- |
| `POST /api/products/[id]/publish`                     | ✅       | ❌ aucun bouton  |
| `POST /api/products/[id]/unpublish`                   | ✅       | ❌ aucun bouton  |
| `POST /api/channel-pricing/upsert`                    | ✅       | ✅               |
| `PATCH /api/google-merchant/products/[id]/visibility` | ✅       | ✅ (page Google) |
| `POST /api/meta-commerce/sync-statuses`               | ✅       | ✅ (page Meta)   |
| `PATCH /api/meta-commerce/products/[id]/visibility`   | ✅       | ✅               |
| `DELETE /api/meta-commerce/products/[id]/delete`      | ✅       | ✅               |
| `POST /api/ambassadors/create-auth`                   | ✅       | ✅               |

### 2.4 Pages BO de pilotage Google + Meta

- `/canaux-vente/google-merchant` : page complète, batch sync, badges statut → ✅ (Phases 1-2 du `plan-canaux-de-vente.md`)
- `/canaux-vente/meta-commerce` : page complète, ajouter/retirer/masquer → ✅ (Phase 3)
- **Guardrail cascade `Site → Google/Meta` (règle C1-C8 de `canaux-vente-publication-rules.md`)** : ❌ aucun guard UI ni API. Tu peux dépublier Site sans dépublier Google/Meta ; rien ne bloque l'incohérence.

---

## 3. Bugs critiques identifiés (P0)

| Réf    | Fichier                                                                                                  | Ligne   | Symptôme                                                                            | Effort fix                                                 |
| ------ | -------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **C1** | `apps/back-office/src/app/(authenticated)/canaux-vente/site-internet/components/ClientsSection.tsx`      | ~64     | 0 client visible (mauvais filtre)                                                   | 5 min — remplacer par `.eq('source_type','site-internet')` |
| **C2** | `apps/back-office/src/app/(authenticated)/canaux-vente/site-internet/page.tsx` (DashboardSection inline) | —       | KPIs hardcodés à 0                                                                  | 1-2 h — câbler requêtes `sales_orders` du mois + somme     |
| **C3** | RPC Supabase `get_site_internet_collection_detail()`                                                     | —       | Expose `cost_price` (prix fournisseur) au lieu de `channel_pricing.custom_price_ht` | Migration SQL — fuite du prix d'achat côté front           |
| **C4** | `apps/back-office/src/.../components/product-publication-tab.tsx`                                        | 263-267 | Texte "publication automatique" + aucun bouton                                      | 2-4 h — boutons Publier/Dépublier + cascade visuelle       |
| **C5** | Routes `/api/google-merchant/publish` + `/api/meta-commerce/publish`                                     | —       | Aucune validation `is_published_online=true` avant publication                      | 30 min — guard 422 + tooltip côté UI                       |

> ⚠️ **C3 est le plus dangereux** : prix fournisseur affiché publiquement sur les pages collections. À vérifier de toute urgence.

---

## 4. Désalignements BO ↔ site-internet

| Champ DB                                                               | Créé/édité dans BO              | Lu côté site                       | État                                |
| ---------------------------------------------------------------------- | ------------------------------- | ---------------------------------- | ----------------------------------- |
| `sales_channels.enable_reviews`                                        | ❌ non exposé en BO             | site **hardcode `true`**           | Désynchro silencieuse               |
| `sales_channels.enable_wishlist`                                       | ❌ non exposé en BO             | site **hardcode `true`**           | Désynchro silencieuse               |
| `sales_channels.social_links` (FB/IG/Pinterest)                        | ❌ non exposé en BO             | site n'utilise pas                 | Aucun usage actuel                  |
| `sales_channels.analytics_facebook_pixel_id`                           | ⚠️ placeholder UI non persisté  | site charge MetaPixel avec env var | FB Pixel inactif tant que non câblé |
| `cms_pages.is_published`                                               | ❌ toggle non exposé en BO      | site filtre dessus pour afficher   | Tout est publié par défaut          |
| `product_reviews.response` (réponse vendeur)                           | ❌ non exposé en BO             | non affiché côté site              | Champ mort                          |
| `channel_product_metadata.seo_title_custom` / `seo_description_custom` | ✅                              | ✅                                 | OK                                  |
| `channel_pricing.custom_price_ht`                                      | ✅                              | ✅ (sauf RPC collections C3)       | OK sauf C3                          |
| `products.is_published_online`                                         | ✅ via routes API               | ✅ via RPC                         | OK                                  |
| `order_discounts.applicable_channels`                                  | ✅ hardcode `['site-internet']` | ✅                                 | OK                                  |
| `site_ambassadors.commission_rate`                                     | ✅                              | ✅                                 | OK                                  |

---

## 5. Pages site à redesigner (UX/UI)

| Page                                | Diagnostic                                                                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/produit/[id]` (ProductAccordions) | Accordéons gris bruts shadcn, pas de theming "luxe", placeholders "Avis bientôt disponibles" alors que `ProductReviews.tsx` existe — il faut juste le brancher |
| `/produit/[id]` (ProductCrossSell)  | "Mock carrousel" en commentaire dans le code → à brancher sur RPC ou règles métier                                                                             |
| `/panier`                           | Layout 2-cols basique. Cards simples, récap sticky sans polish, micro-interactions absentes                                                                    |
| `/checkout`                         | Mono-page long. Pas d'étapes visuelles (stepper), pas d'animations transitions, promo input sommaire                                                           |
| `/compte/favoris`                   | Réutilise CardProductLuxury → OK mais layout peu distinct de catalogue                                                                                         |
| Header (MegaMenu)                   | OK fonctionnel, hover states améliorables                                                                                                                      |

> Le travail responsive Tier 2 a été fait le 2026-04-19 (rapports `coverage-site-all` et `finition-site-tier2`). Les pages CMS, collections, compte, favoris, contact, ambassadeur sont déjà responsive-clean.

---

## 6. Roadmap déjà planifiée par Romeo (rappel `.claude/work/ACTIVE.md` lignes 103-177)

8 sprints `SI-*` documentés, à exécuter (ordre par priorité décroissante) :

1. **SI-SEO-001** — Quick wins SEO + contenu (BreadcrumbList, alt text, noindex toggle, preview SERP, dupliquer produit) — 1 session
2. **SI-AI-001** — Génération IA fiches produit (Sonnet, bulk 30 produits) — 1-2 sessions, **bloqué par finalisation produits BO**
3. **SI-CMS-001** — CMS + Branding (upload images Storage, réseaux sociaux éditables, feature flags wishlist/reviews, **refactoring ConfigurationSection 738L**) — 1 session
4. **SI-ANALYTICS-001** — Analytics + Export (graphique CA 12 mois, top 5 produits, panier moyen, conversion, exports CSV, abandoned carts) — 1 session
5. **SI-PROD-001** — Améliorations produit BO (bulk edit, import CSV, cross-sell configurables, duplication, actions masse, pagination/tri) — 1 session
6. **SI-ORDER-001** — Améliorations commandes (refund Stripe BO, filtres avancés, notes internes, export CSV, facture PDF) — 1 session
7. **SI-CLIENT-001** — Améliorations clients (KPIs, segmentation, notes internes, export RGPD, pagination) — 1 session
8. **SI-AMB-002** — Améliorations ambassadeurs (page détail `/ambassadeurs/[id]`, workflow paiement primes, attribution validation, fix popover QR) — 1 session

**+ Backlog (basse priorité)** : redirections 301/302, SEO par catégorie, WYSIWYG pages CMS, programme fidélité, carte cadeau, bundle pricing, pop-ups, templates emails BO, médiathèque centralisée.

**+ Dette technique** : ConfigurationSection 738L, ReviewsSection inline hooks, ClientsSection inline hook, `select("*")`, NewsletterSection limit(500) hardcode.

**+ En attente de merge** : `[SI-AMB-001]` PR #583 (système ambassadeurs livré, en attente de merge).

---

## 7. Plan canaux de vente (rappel `.claude/work/plan-canaux-de-vente.md`)

| Phase                                       | Statut                                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Phase 1 — Google Merchant                   | ✅ FAIT (PR #405, 2026-03-31) — 18 produits, feed quotidien                                             |
| Phase 2 — Feed XML automatique              | ✅ FAIT — `/api/feeds/products.xml` avec variantes/couleur/matériau                                     |
| Phase 3 — Meta / FB / IG                    | ✅ FAIT — boutique Verone publiée, catalogue 18 produits, BO `/canaux-vente/meta-commerce` opérationnel |
| Phase 4 — WhatsApp Business                 | 🟡 EN COURS — catalogue lié, vérifier produits dans WA Catalog, ajouter moyen de paiement               |
| Phase 5 — Multi-Marques (`internal_brands`) | 🔵 FUTUR                                                                                                |
| Phase 6 — Pixels & Tracking                 | 🔵 FUTUR                                                                                                |

**Reste à finir Phase 3** : statuts réels Meta via API Graph (au lieu de "en attente"), collections/ensembles Meta éditables depuis BO.

---

## 8. Recommandation — Plan d'action en blocs cohérents

Selon `.claude/rules/workflow.md` (1 PR = 1 bloc) et `.claude/rules/branch-strategy.md`, je recommande de regrouper les corrections en **3 PRs** plutôt que 8 :

### Bloc 1 — `[SI-FIX-001]` Bugs critiques pilotage site (P0, 1 PR)

- C1 : fix filtre ClientsSection
- C2 : KPIs Dashboard dynamiques
- C3 : fix RPC `get_site_internet_collection_detail` (cost_price → custom_price_ht) — **migration SQL**
- C4 : ProductPublicationTab — boutons Publish/Unpublish + cascade visuelle + texte correct
- C5 : guards `/api/google-merchant/publish` + `/api/meta-commerce/publish` (422 si Site inactif)
- Toggle `cms_pages.is_published` exposé en UI
- Branche : `fix/site-internet-pilotage-bugs`

### Bloc 2 — `[SI-CONFIG-001]` Refactor Configuration + branding (1 PR)

Réunit **SI-CMS-001** + débuts **SI-SEO-001** :

- Refactor ConfigurationSection 738L → 5 sous-composants
- Persistance Facebook Pixel ID
- Réseaux sociaux éditables (FB/IG/Pinterest)
- Upload images Supabase Storage (hero, collections, bannières)
- Feature flags wishlist/reviews câblés depuis `sales_channels`
- BreadcrumbList JSON-LD côté site
- Noindex toggle par page CMS
- Branche : `feat/site-config-branding`

### Bloc 3 — `[SI-ANALYTICS-PROD-001]` Analytics + Améliorations BO (1 PR)

Réunit **SI-ANALYTICS-001** + **SI-PROD-001** + **SI-ORDER-001** + **SI-CLIENT-001** :

- Graphique CA 12 mois Dashboard
- Top 5 produits / panier moyen / conversion
- Exports CSV (commandes / produits / clients RGPD)
- Bulk edit produits + import CSV + duplication + actions en masse + pagination/tri
- Refund Stripe BO + filtres commandes + notes internes + facture PDF
- KPIs clients + segmentation + notes
- Branche : `feat/site-analytics-bulk-tools`

### Bloc 4 — `[SI-AMB-002]` Améliorations ambassadeurs (1 PR, après merge PR #583)

- Page détail `/ambassadeurs/[id]`
- Workflow paiement primes
- Vue attributions en attente
- Fix popover QR

### Hors scope (futur)

- SI-AI-001 IA fiches produit (attendre finalisation produits BO)
- Phase 4 WhatsApp + Phases 5-6 plan canaux de vente
- Backlog basse priorité

---

## 9. Bloqueurs identifiés

### 9.1 Tests Playwright live impossibles cette session

Les deux profils MCP Playwright sont verrouillés par d'autres processus :

```
Browser is already in use for /Users/romeodossantos/.claude/playwright-profiles/lane-1
Browser is already in use for /Users/romeodossantos/.claude/playwright-profiles/lane-2
```

10 processus `playwright-mcp` actifs (PIDs 53535, 96219, 97026, 97066, 97088, 97342, 97446, 97449, 97613, 54960). Probablement d'autres sessions Claude Code en parallèle. Je n'ai pas tué les processus pour ne pas casser ces sessions.

**Action attendue de Romeo** : fermer les autres sessions Claude Code puis relancer cette discussion → je referai des tests visuels live + screenshots 5 tailles sur les pages clés (`/`, `/catalogue`, `/produit/[id]`, `/panier`, `/checkout`, `/compte`, `/canaux-vente/site-internet`).

### 9.2 Interrogations à valider par Romeo avant exécution

1. **Bloc 1 contient une migration SQL (fix RPC C3)** → FEU ROUGE (`.claude/rules/autonomy-boundaries.md`). Validation explicite requise.
2. **Toggle `enable_reviews`/`enable_wishlist` désynchro** : on suit la DB (les déactiver doit cacher la fonction côté site) ou on supprime la colonne (toujours actif) ? Décision produit.
3. **`/confidentialite` vs `/politique-de-confidentialite`** : doublon URL — supprimer l'un (lequel ?) ou garder un redirect 301 ?
4. **PR #583 `[SI-AMB-001]` en attente** : merger d'abord avant de lancer `SI-AMB-002` ? Sinon rebase en cascade.
5. **Cron Vercel Hobby** : limite 1 cron/jour. Le site a déjà 4 crons (`abandoned-cart`, `review-request`, `ambassador-primes`, `win-back`) → vérifier qu'ils ne tournent pas tous quotidiennement (référence mémoire `reference_vercel_constraints.md`).

---

## 10. Sources et fichiers consultés

- `README.md` (racine) — section Applications, Data Layer
- `apps/site-internet/src/app/**` (cartographie 27 routes)
- `apps/site-internet/src/components/**` (composants locaux)
- `apps/back-office/src/app/(authenticated)/canaux-vente/site-internet/**`
- `apps/back-office/src/app/api/products/[id]/publish|unpublish/route.ts`
- `apps/back-office/src/app/api/google-merchant/**`, `apps/back-office/src/app/api/meta-commerce/**`
- `.claude/work/ACTIVE.md` (roadmap site-internet déjà documentée)
- `.claude/work/plan-canaux-de-vente.md`
- `.claude/work/NEXT-SPRINTS.md`, `AGENT-ENTRY-POINT.md`, `PROMPTS-TO-COPY.md`
- `.claude/rules/{workflow,branch-strategy,autonomy-boundaries,responsive,code-standards,database,no-phantom-data,agent-autonomy-external}.md`
- `.claude/guides/{cross-app-protection,typescript-errors-debugging}.md`
- `.claude/playbooks/migrate-page-responsive.md`
- `.claude/templates/{component.tsx,sprint-responsive-template.md}`
- `docs/scratchpad/dev-report-2026-04-19-coverage-site-all.md`
- `docs/scratchpad/dev-report-2026-04-19-finition-site-tier2.md`
- `gh pr list --state open` : PR #785 deps, PR #784/#783 CI deps, PR #700 Cloudflare Images draft (rien sur site-internet)

---

## 11. Prochaines étapes (proposition à valider)

1. **Tu fermes les autres sessions Claude Code** pour libérer Playwright lane-1/lane-2
2. **Je relance** des tests visuels live `veronecollections.fr` (5 tailles) + smoke test BO `/canaux-vente/site-internet` pour produire screenshots de référence
3. **Tu valides l'ordre des blocs** (1 → 2 → 3 → 4 ou autre priorité)
4. **Tu confirmes la migration SQL du bug C3** (RPC collections — fuite cost_price)
5. **On démarre Bloc 1** (`fix/site-internet-pilotage-bugs`) — branche dédiée, commits séquentiels, 1 PR finale
