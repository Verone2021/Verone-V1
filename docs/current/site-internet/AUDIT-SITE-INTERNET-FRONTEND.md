# Audit Site Internet Frontend

_Date : 12 avril 2026 | Branche : feat/BO-SI-001-site-internet-sprint1-3_

App : `apps/site-internet/` | Package : `@verone/site-internet` | Port : 3001

---

## Architecture

- Next.js 15 App Router, TypeScript strict
- Supabase Auth (email/password + Google OAuth SSR)
- Stripe Checkout (mode payment)
- Resend (emails transactionnels)
- Google Analytics 4
- Panier localStorage + sync Supabase (`shopping_carts`)
- React Query (staleTime 30s global, 5min par hook)

---

## Pages (27 routes)

### Publiques

| Route                           | Fichier                                 | Lignes  | Type   | Donnees                                        | Etat              |
| ------------------------------- | --------------------------------------- | ------- | ------ | ---------------------------------------------- | ----------------- |
| `/`                             | `page.tsx`                              | 221     | Client | RPC produits, collections, site_content        | OK                |
| `/catalogue`                    | `catalogue/page.tsx`                    | 381     | Client | RPC produits, filtres client-side              | OK                |
| `/produit/[id]`                 | `produit/[id]/page.tsx`                 | 331     | Client | RPC produits (2 appels — doublon)              | OK (perf)         |
| `/collections`                  | `collections/page.tsx`                  | 106     | Client | collections (is_active + published)            | OK                |
| `/collections/[slug]`           | `collections/[slug]/page.tsx`           | 174     | Client | collection + collection_products + RPC         | OK                |
| `/panier`                       | `panier/page.tsx`                       | 224     | Client | CartContext (localStorage)                     | OK                |
| `/checkout`                     | `checkout/page.tsx`                     | **682** | Client | shipping-config, promo/validate, /api/checkout | OK (> 400 lignes) |
| `/checkout/success`             | `checkout/success/page.tsx`             | 83      | Client | Query params, GA4 purchase                     | OK                |
| `/checkout/cancel`              | `checkout/cancel/page.tsx`              | 35      | Server | Statique                                       | OK                |
| `/contact`                      | `contact/page.tsx`                      | 227     | Client | /api/contact                                   | OK                |
| `/a-propos`                     | `a-propos/page.tsx`                     | 112     | Server | Statique                                       | OK                |
| `/faq`                          | `faq/page.tsx`                          | 16      | Server | cms_pages (slug: faq)                          | OK                |
| `/cgv`                          | `cgv/page.tsx`                          | 19      | Server | cms_pages (slug: cgv)                          | OK                |
| `/mentions-legales`             | `mentions-legales/page.tsx`             | 16      | Server | cms_pages (slug: mentions-legales)             | OK                |
| `/livraison`                    | `livraison/page.tsx`                    | 16      | Server | cms_pages (slug: livraison)                    | OK                |
| `/retours`                      | `retours/page.tsx`                      | 16      | Server | cms_pages (slug: retours)                      | OK                |
| `/cookies`                      | `cookies/page.tsx`                      | 151     | Server | cms_pages (slug: cookies)                      | OK                |
| `/confidentialite`              | `confidentialite/page.tsx`              | 167     | Server | Statique (code en dur)                         | DOUBLON           |
| `/politique-de-confidentialite` | `politique-de-confidentialite/page.tsx` | 305     | Server | Statique (code en dur)                         | DOUBLON           |

### Auth

| Route                   | Fichier                         | Lignes | Type          | Etat                      |
| ----------------------- | ------------------------------- | ------ | ------------- | ------------------------- |
| `/auth/login`           | `auth/login/page.tsx`           | 116    | Server        | OK                        |
| `/auth/register`        | `auth/register/page.tsx`        | 163    | Server        | OK                        |
| `/auth/forgot-password` | `auth/forgot-password/page.tsx` | 89     | Server        | OK                        |
| `/auth/callback`        | `auth/callback/route.ts`        | 35     | Route Handler | OK (race condition OAuth) |

### Authentifiees

| Route             | Fichier                   | Lignes | Type   | Etat              |
| ----------------- | ------------------------- | ------ | ------ | ----------------- |
| `/compte`         | `compte/page.tsx`         | 417    | Server | OK (> 400 lignes) |
| `/compte/favoris` | `compte/favoris/page.tsx` | 139    | Client | OK                |

### SEO/Technique

| Route            | Fichier       | Ce qu'il fait            |
| ---------------- | ------------- | ------------------------ |
| `/sitemap.xml`   | `sitemap.ts`  | Genere sitemap dynamique |
| `/robots.txt`    | `robots.ts`   | Fichier robots           |
| `/manifest.json` | `manifest.ts` | PWA manifest             |

---

## Server Actions (`auth/actions.ts` — 227 lignes)

| Action           | Ce qu'elle fait                                        | Validation         | Etat                                                                 |
| ---------------- | ------------------------------------------------------ | ------------------ | -------------------------------------------------------------------- |
| `login`          | signInWithPassword → /compte                           | FormData (pas Zod) | WARNING                                                              |
| `signup`         | signUp + email welcome                                 | FormData (pas Zod) | WARNING                                                              |
| `forgotPassword` | resetPasswordForEmail                                  | FormData (pas Zod) | OK                                                                   |
| `logout`         | signOut → /                                            | —                  | OK                                                                   |
| `updateProfile`  | Update auth.users metadata + sync individual_customers | FormData (pas Zod) | WARNING                                                              |
| `changePassword` | updateUser password                                    | FormData (pas Zod) | OK                                                                   |
| `deleteAccount`  | Anonymise metadata + signOut                           | —                  | WARNING (pas de confirmation, PII restent dans individual_customers) |

---

## API Routes (20 routes)

### Checkout & Paiement

| Methode | Route                  | Lignes | Auth           | Validation | Etat                                                                  |
| ------- | ---------------------- | ------ | -------------- | ---------- | --------------------------------------------------------------------- |
| POST    | `/api/checkout`        | 483    | Non            | Zod        | CRITICAL (discount non revalide serveur, race condition order_number) |
| POST    | `/api/promo/validate`  | 202    | Non            | Zod        | WARNING (customer_email contournable)                                 |
| POST    | `/api/webhooks/stripe` | 320    | Signature HMAC | —          | CRITICAL (race condition current_uses, casts `as unknown as`)         |

### Configuration

| Methode | Route                  | Lignes | Auth | Cache | Etat |
| ------- | ---------------------- | ------ | ---- | ----- | ---- |
| GET     | `/api/shipping-config` | 62     | Non  | 60s   | OK   |

### Compte

| Methode | Route                 | Lignes | Auth                        | Etat                                                             |
| ------- | --------------------- | ------ | --------------------------- | ---------------------------------------------------------------- |
| GET     | `/api/account/export` | 86     | userId param (non verifie!) | BUG (requete site_orders inexistante + pas de verification auth) |

### Contact

| Methode | Route          | Lignes | Auth | Etat |
| ------- | -------------- | ------ | ---- | ---- |
| POST    | `/api/contact` | 80     | Non  | OK   |

### Feeds

| Methode | Route                     | Lignes | Cache | Etat |
| ------- | ------------------------- | ------ | ----- | ---- |
| GET     | `/api/feeds/products.xml` | 203    | 1h    | OK   |

### Emails (10 routes)

| Route                                  | Lignes | Declencheur          | Etat |
| -------------------------------------- | ------ | -------------------- | ---- |
| `/api/emails/order-confirmation`       | 150    | Webhook Stripe       | OK   |
| `/api/emails/admin-order-notification` | 116    | Webhook Stripe       | OK   |
| `/api/emails/welcome`                  | 95     | Server Action signup | OK   |
| `/api/emails/contact-confirmation`     | 86     | API /api/contact     | OK   |
| `/api/emails/abandoned-cart`           | 94     | Cron                 | OK   |
| `/api/emails/shipping-notification`    | 89     | (Manuel)             | OK   |
| `/api/emails/delivery-confirmation`    | 80     | (Manuel)             | OK   |
| `/api/emails/order-status-update`      | 95     | (Manuel)             | OK   |
| `/api/emails/review-request`           | 82     | Cron                 | OK   |
| `/api/emails/win-back`                 | 78     | Cron                 | OK   |

### Cron Jobs (3 routes)

| Route                            | Schedule      | Etat                                    |
| -------------------------------- | ------------- | --------------------------------------- |
| `/api/cron/abandoned-cart-check` | Quotidien 9h  | OK                                      |
| `/api/cron/review-request-check` | Quotidien 10h | BUG (requete `site_orders` inexistante) |
| `/api/cron/win-back-check`       | Lundi 10h     | BUG (requete `site_orders` inexistante) |

---

## Composants (29 composants)

### Layout

| Composant     | Fichier                             | Lignes | Role                               |
| ------------- | ----------------------------------- | ------ | ---------------------------------- |
| `Header`      | `components/layout/Header.tsx`      | 156    | Header sticky, nav, icones, badges |
| `Footer`      | `components/layout/Footer.tsx`      | 144    | Footer 4 colonnes                  |
| `MegaMenu`    | `components/layout/MegaMenu.tsx`    | 166    | Dropdown catalogue                 |
| `MobileNav`   | `components/layout/MobileNav.tsx`   | 60     | Drawer mobile                      |
| `PromoBanner` | `components/layout/PromoBanner.tsx` | 45     | Banniere promo CMS                 |

### Homepage

| Composant           | Fichier                                 | Lignes | Role                   |
| ------------------- | --------------------------------------- | ------ | ---------------------- |
| `HeroSection`       | `components/home/HeroSection.tsx`       | 117    | Hero CMS avec fallback |
| `CategoryTiles`     | `components/home/CategoryTiles.tsx`     | 153    | Tuiles categories      |
| `InspirationBanner` | `components/home/InspirationBanner.tsx` | 36     | Banner inspiration     |
| `HomepageReviews`   | `components/home/HomepageReviews.tsx`   | 139    | Avis clients           |
| `NewsletterSection` | `components/home/NewsletterSection.tsx` | 111    | Inscription newsletter |

### Catalogue

| Composant                | Fichier                                           | Lignes | Role                    |
| ------------------------ | ------------------------------------------------- | ------ | ----------------------- |
| `CatalogueSidebar`       | `components/catalogue/CatalogueSidebar.tsx`       | 304    | Filtres desktop         |
| `CatalogueMobileFilters` | `components/catalogue/CatalogueMobileFilters.tsx` | 99     | Filtres mobile (drawer) |

### Produit

| Composant           | Fichier                                         | Lignes | Role                 |
| ------------------- | ----------------------------------------------- | ------ | -------------------- |
| `ProductGallery`    | `produit/[id]/components/ProductGallery.tsx`    | —      | Galerie images       |
| `ProductSidebar`    | `produit/[id]/components/ProductSidebar.tsx`    | 352    | Prix, variantes, CTA |
| `ProductAccordions` | `produit/[id]/components/ProductAccordions.tsx` | 187    | Description, specs   |
| `ProductCrossSell`  | `produit/[id]/components/ProductCrossSell.tsx`  | —      | Produits similaires  |
| `VariantsSection`   | `produit/[id]/components/VariantsSection.tsx`   | 172    | Selecteur variantes  |
| `ProductReviews`    | `components/product/ProductReviews.tsx`         | 307    | Avis + formulaire    |
| `ShareButtons`      | `components/product/ShareButtons.tsx`           | 71     | Partage social       |
| `StickyAddToCart`   | `components/product/StickyAddToCart.tsx`        | 45     | CTA mobile sticky    |

### UI Atomiques

| Composant           | Fichier                               | Lignes | Role                                   |
| ------------------- | ------------------------------------- | ------ | -------------------------------------- |
| `CardProductLuxury` | `components/ui/CardProductLuxury.tsx` | 226    | Carte produit (badges, wishlist, prix) |
| `BadgeLuxury`       | `components/ui/BadgeLuxury.tsx`       | 64     | Badge stylise                          |
| `ButtonLuxury`      | `components/ui/ButtonLuxury.tsx`      | 95     | Bouton stylise                         |
| `StarRating`        | `components/ui/StarRating.tsx`        | 71     | Etoiles notation                       |

### CMS & SEO

| Composant            | Fichier                                 | Lignes | Role                                   |
| -------------------- | --------------------------------------- | ------ | -------------------------------------- |
| `CmsPageContent`     | `components/cms/CmsPageContent.tsx`     | 105    | Rendu Markdown → HTML depuis cms_pages |
| `JsonLdOrganization` | `components/seo/JsonLdOrganization.tsx` | 29     | Schema.org Organization                |
| `JsonLdProduct`      | `components/seo/JsonLdProduct.tsx`      | 113    | Schema.org Product                     |

### Divers

| Composant          | Fichier                                    | Lignes | Role                         |
| ------------------ | ------------------------------------------ | ------ | ---------------------------- |
| `CookieConsent`    | `components/CookieConsent.tsx`             | 72     | Banniere RGPD                |
| `SearchOverlay`    | `components/SearchOverlay.tsx`             | 171    | Recherche produits overlay   |
| `GoogleAnalytics`  | `components/analytics/GoogleAnalytics.tsx` | 108    | Script GA4 + tracking events |
| `NewsletterSignup` | `components/NewsletterSignup.tsx`          | 92     | Formulaire newsletter        |

---

## Hooks (11 hooks — 1308 lignes)

| Hook                    | Fichier                      | Lignes | Table/RPC                          | React Query                  | Role                            |
| ----------------------- | ---------------------------- | ------ | ---------------------------------- | ---------------------------- | ------------------------------- |
| `useCatalogueProducts`  | `use-catalogue-products.ts`  | 179    | RPC `get_site_internet_products()` | staleTime 5min               | Catalogue complet               |
| `useCatalogueFilters`   | `use-catalogue-filters.ts`   | 175    | — (etat local)                     | Non                          | Filtres catalogue               |
| `useCustomerAddresses`  | `use-customer-addresses.ts`  | 116    | `customer_addresses`               | Oui                          | CRUD adresses                   |
| `useWishlist`           | `use-wishlist.ts`            | 103    | `wishlist_items`                   | Oui                          | Favoris                         |
| `useReviews`            | `use-reviews.ts`             | 92     | `product_reviews`                  | Oui                          | Avis + soumission               |
| `useCollections`        | `use-collections.ts`         | 75     | `collections`                      | staleTime 5min               | Collections                     |
| `useSiteContent`        | `use-site-content.ts`        | 66     | `site_content`                     | staleTime 5min               | CMS (hero, banner, reassurance) |
| `useCollectionProducts` | `use-collection-products.ts` | 64     | `collection_products` + RPC        | Oui                          | Produits d'une collection       |
| `useCategories`         | `use-categories.ts`          | 51     | `categories`                       | Oui                          | Categories filtres              |
| `useProductDetail`      | `use-product-detail.ts`      | 44     | Supabase client                    | Oui                          | Detail produit                  |
| `useAuthUser`           | `use-auth-user.ts`           | 33     | Supabase Auth                      | retry: false, staleTime 5min | User courant                    |

---

## CartContext (`contexts/CartContext.tsx` — 310 lignes)

- **Stockage** : localStorage (`verone_cart_items`) — source de verite
- **Sync DB** : `shopping_carts` (async, non-bloquant, via `session_id` UUID)
- **API** : `addItem`, `removeItem`, `updateQuantity`, `clearCart`
- **Calcul** : `subtotal` = SUM((prix_ttc + eco + montage) \* quantite)
- **Enrichissement** : nom, slug, prix, image, eco-participation, montage

---

## Integrations

### Stripe

| Element   | Detail                                                                      |
| --------- | --------------------------------------------------------------------------- |
| Mode      | `payment` (pas subscription)                                                |
| Methodes  | `card`, `link`                                                              |
| Factures  | `invoice_creation: { enabled: true }`                                       |
| Livraison | `shipping_options` dynamiques                                               |
| Coupons   | Crees a la volee pour codes promo                                           |
| Webhook   | Signature HMAC (`STRIPE_WEBHOOK_SECRET`)                                    |
| Events    | `checkout.session.completed`, `checkout.session.expired`, `charge.refunded` |

### Supabase

| Element                 | Detail                                                            |
| ----------------------- | ----------------------------------------------------------------- |
| Auth                    | Email/password + Google OAuth                                     |
| Clients                 | browser (anon), server (cookies SSR), middleware, untyped         |
| RPC cle                 | `get_site_internet_products()` (SECURITY DEFINER)                 |
| Tables publiques (anon) | collections, site_content, cms_pages, product_reviews (approuves) |
| Tables auth (user)      | wishlist_items, customer_addresses, shopping_carts                |
| Tables service role     | sales_orders, individual_customers, order_discounts               |

### Resend

| Element   | Detail                                                   |
| --------- | -------------------------------------------------------- |
| Routes    | 10 routes `/api/emails/*`                                |
| Template  | `buildVeroneEmailHtml()` (branding Verone)               |
| Variables | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO` |

### Google Analytics 4

| Element  | Detail                                                   |
| -------- | -------------------------------------------------------- |
| Events   | `view_item`, `add_to_cart`, `begin_checkout`, `purchase` |
| Variable | `NEXT_PUBLIC_GA_MEASUREMENT_ID`                          |

---

## Variables d'Environnement

| Variable                        | Usage              | Requis    |
| ------------------------------- | ------------------ | --------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Client Supabase    | Oui       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client public      | Oui       |
| `SUPABASE_SERVICE_ROLE_KEY`     | API routes         | Oui       |
| `STRIPE_SECRET_KEY`             | Checkout + Webhook | Oui       |
| `STRIPE_WEBHOOK_SECRET`         | Validation webhook | Oui       |
| `RESEND_API_KEY`                | Emails             | Optionnel |
| `NEXT_PUBLIC_SITE_URL`          | URLs absolues      | Optionnel |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Analytics          | Optionnel |
| `CRON_SECRET`                   | Protection crons   | Optionnel |

---

## Bugs Connus

| #   | Severite | Bug                                                       | Fichier                                                                          |
| --- | -------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | CRITICAL | Discount non revalide cote serveur dans checkout          | `api/checkout/route.ts`                                                          |
| 2   | CRITICAL | Race condition generation order_number                    | `api/checkout/route.ts`                                                          |
| 3   | CRITICAL | Race condition current_uses dans webhook                  | `api/webhooks/stripe/route.ts`                                                   |
| 4   | CRITICAL | Casts `as unknown as` (equivalent any)                    | `api/webhooks/stripe/route.ts`                                                   |
| 5   | HIGH     | Table `site_orders` inexistante dans 3 routes             | `api/account/export`, `api/cron/review-request-check`, `api/cron/win-back-check` |
| 6   | HIGH     | Export RGPD sans verification auth                        | `api/account/export/route.ts`                                                    |
| 7   | HIGH     | Race condition OAuth (trigger avant source metadata)      | `auth/callback/route.ts`                                                         |
| 8   | MEDIUM   | Pas de validation Zod sur Server Actions auth             | `auth/actions.ts`                                                                |
| 9   | MEDIUM   | deleteAccount ne supprime pas individual_customers        | `auth/actions.ts`                                                                |
| 10  | MEDIUM   | deleteAccount sans confirmation                           | `auth/actions.ts`                                                                |
| 11  | MEDIUM   | XSS potentiel via dangerouslySetInnerHTML                 | `components/cms/CmsPageContent.tsx`                                              |
| 12  | MEDIUM   | Pages legales 404 si depubliees (pas de fallback)         | Pages CMS                                                                        |
| 13  | MEDIUM   | Adresses sauvegardees non pre-remplies au checkout        | `checkout/page.tsx`                                                              |
| 14  | LOW      | Doublon /confidentialite et /politique-de-confidentialite | 2 pages                                                                          |
| 15  | LOW      | RPC produits appelee 2 fois sur page produit              | `produit/[id]/page.tsx`                                                          |
| 16  | LOW      | getCmsPage sans cache Next.js                             | `components/cms/CmsPageContent.tsx`                                              |

---

## Fichiers Depassant 400 Lignes

| Fichier             | Lignes | Action                  |
| ------------------- | ------ | ----------------------- |
| `checkout/page.tsx` | 682    | Refactoring obligatoire |
| `compte/page.tsx`   | 417    | Refactoring recommande  |
