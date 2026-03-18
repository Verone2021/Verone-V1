# Site Internet Vérone — Features

## Catalogue & Navigation

| Feature                                                 | Statut | Fichiers                                                                         |
| ------------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| Catalogue produits (RPC)                                | Done   | `catalogue/page.tsx`, `use-catalogue-products.ts`                                |
| Filtres sidebar (catégorie, pièce, style, prix, marque) | Done   | `CatalogueSidebar.tsx`, `CatalogueMobileFilters.tsx`, `use-catalogue-filters.ts` |
| Recherche texte live                                    | Done   | `catalogue/page.tsx`                                                             |
| Tri (6 options)                                         | Done   | `catalogue/page.tsx`                                                             |
| Pagination client-side                                  | Done   | `catalogue/page.tsx`                                                             |
| Fiche produit                                           | Done   | `produit/[id]/page.tsx`, `use-product-detail.ts`                                 |
| Collections                                             | Done   | `collections/page.tsx`, `collections/[slug]/page.tsx`                            |
| Mega menu                                               | Done   | `MegaMenu.tsx`                                                                   |
| Recherche overlay (autocomplete)                        | Done   | `SearchOverlay.tsx`                                                              |

## Cartes Produit

| Feature                      | Statut | Fichiers                                  |
| ---------------------------- | ------ | ----------------------------------------- |
| Image hover scale            | Done   | `CardProductLuxury.tsx`                   |
| Badge "Nouveau" (< 30 jours) | Done   | `CardProductLuxury.tsx`                   |
| Badge "-X%" (discount)       | Done   | `CardProductLuxury.tsx`                   |
| Prix barré si discount       | Done   | `CardProductLuxury.tsx`                   |
| Label catégorie              | Done   | `CardProductLuxury.tsx`                   |
| Bouton "Ajouter" au hover    | Done   | `CardProductLuxury.tsx`                   |
| Coeur favoris                | Done   | `CardProductLuxury.tsx`                   |
| Star rating                  | Done   | `CardProductLuxury.tsx`, `StarRating.tsx` |

## Panier & Checkout

| Feature                 | Statut | Fichiers                                                |
| ----------------------- | ------ | ------------------------------------------------------- |
| Panier (localStorage)   | Done   | `panier/page.tsx`, `CartContext`                        |
| Checkout Stripe         | Done   | `checkout/page.tsx`, `api/checkout/route.ts`            |
| Webhook Stripe          | Done   | `api/webhooks/stripe/route.ts`                          |
| Pages success/cancel    | Done   | `checkout/success/page.tsx`, `checkout/cancel/page.tsx` |
| Promo codes             | Done   | `api/promo/validate/route.ts`                           |
| Abandoned cart tracking | Done   | `api/cron/abandoned-cart-check/route.ts`                |

## Compte & Auth

| Feature            | Statut | Fichiers                                     |
| ------------------ | ------ | -------------------------------------------- |
| Login              | Done   | `auth/login/page.tsx`                        |
| Register           | Done   | `auth/register/page.tsx`                     |
| Forgot password    | Done   | `auth/forgot-password/page.tsx`              |
| Mon compte         | Done   | `compte/page.tsx`                            |
| Favoris (wishlist) | Done   | `compte/favoris/page.tsx`, `use-wishlist.ts` |
| Customer addresses | Done   | `use-customer-addresses.ts`                  |
| Data export        | Done   | `api/account/export/route.ts`                |

## Avis & Reviews

| Feature                | Statut | Fichiers                                 |
| ---------------------- | ------ | ---------------------------------------- |
| Avis produit (lecture) | Done   | `ProductReviews.tsx`, `use-reviews.ts`   |
| Soumission avis        | Done   | `ProductReviews.tsx`                     |
| Review request cron    | Done   | `api/cron/review-request-check/route.ts` |

## CMS & Contenu

| Feature            | Statut | Fichiers                                                    |
| ------------------ | ------ | ----------------------------------------------------------- |
| Hero section (CMS) | Done   | `HeroSection.tsx`, `use-site-content.ts`                    |
| Reassurance (CMS)  | Done   | `page.tsx`, `use-site-content.ts`                           |
| Promo banner (CMS) | Done   | `PromoBanner.tsx`, `use-site-content.ts`                    |
| Pages légales      | Done   | `cgv/`, `mentions-legales/`, `confidentialite/`, `cookies/` |
| FAQ                | Done   | `faq/page.tsx`                                              |
| Livraison          | Done   | `livraison/page.tsx`                                        |
| Retours            | Done   | `retours/page.tsx`                                          |
| À propos           | Done   | `a-propos/page.tsx`                                         |

## Emails (Resend)

| Email                 | Trigger          | Fichier                                        |
| --------------------- | ---------------- | ---------------------------------------------- |
| Welcome               | Register         | `api/emails/welcome/route.ts`                  |
| Order confirmation    | Checkout success | `api/emails/order-confirmation/route.ts`       |
| Admin notification    | New order        | `api/emails/admin-order-notification/route.ts` |
| Shipping notification | Status update    | `api/emails/shipping-notification/route.ts`    |
| Delivery confirmation | Delivered        | `api/emails/delivery-confirmation/route.ts`    |
| Order status update   | Status change    | `api/emails/order-status-update/route.ts`      |
| Abandoned cart        | Cron (24h)       | `api/emails/abandoned-cart/route.ts`           |
| Review request        | Cron (7j)        | `api/emails/review-request/route.ts`           |
| Win-back              | Cron (30j)       | `api/emails/win-back/route.ts`                 |
| Contact confirmation  | Form submit      | `api/emails/contact-confirmation/route.ts`     |

## SEO & Performance

| Feature              | Statut | Fichiers                 |
| -------------------- | ------ | ------------------------ |
| JSON-LD Organization | Done   | `JsonLdOrganization.tsx` |
| JSON-LD Product      | Done   | `JsonLdProduct.tsx`      |
| Open Graph metadata  | Done   | `layout.tsx` + layouts   |
| Sitemap XML          | Done   | `sitemap.xml/`           |
| Robots.txt           | Done   | `robots.txt/`            |
| PWA manifest         | Done   | `manifest.ts`            |
| Google Analytics 4   | Done   | `GoogleAnalytics.tsx`    |
| Cookie consent       | Done   | `CookieConsent.tsx`      |
| Newsletter signup    | Done   | `NewsletterSignup.tsx`   |
