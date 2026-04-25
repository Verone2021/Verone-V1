# Site-Internet — Documentation App

_Generated: 2026-04-25 16:33_

## Pages (25)

| Route | Fichier |
|-------|---------|
| `/a-propos` | page.tsx |
| `/ambassadeur` | page.tsx |
| `/auth/forgot-password` | page.tsx |
| `/auth/login` | page.tsx |
| `/auth/register` | page.tsx |
| `/catalogue` | page.tsx |
| `/cgv` | page.tsx |
| `/checkout/cancel` | page.tsx |
| `/checkout` | page.tsx |
| `/checkout/success` | page.tsx |
| `/collections/[slug]` | page.tsx |
| `/collections` | page.tsx |
| `/compte/favoris` | page.tsx |
| `/compte` | page.tsx |
| `/confidentialite` | page.tsx |
| `/contact` | page.tsx |
| `/cookies` | page.tsx |
| `/faq` | page.tsx |
| `/livraison` | page.tsx |
| `/mentions-legales` | page.tsx |
| `/` | page.tsx |
| `/panier` | page.tsx |
| `/politique-de-confidentialite` | page.tsx |
| `/produit/[id]` | page.tsx |
| `/retours` | page.tsx |

## API Routes (21)

| Endpoint | Methods |
|----------|---------|
| `/api/account/export` | GET |
| `/api/checkout` | POST |
| `/api/contact` | POST |
| `/api/cron/abandoned-cart-check` | GET |
| `/api/cron/review-request-check` | GET |
| `/api/cron/validate-ambassador-primes` | GET |
| `/api/cron/win-back-check` | GET |
| `/api/emails/abandoned-cart` | POST |
| `/api/emails/admin-order-notification` | POST |
| `/api/emails/contact-confirmation` | POST |
| `/api/emails/delivery-confirmation` | POST |
| `/api/emails/order-confirmation` | POST |
| `/api/emails/order-status-update` | POST |
| `/api/emails/review-request` | POST |
| `/api/emails/shipping-notification` | POST |
| `/api/emails/welcome` | POST |
| `/api/emails/win-back` | POST |
| `/api/feeds/products.xml` | GET |
| `/api/promo/validate` | POST |
| `/api/shipping-config` | GET |
| `/api/webhooks/stripe` | POST |

## Components in app (35)

| Fichier |
|---------|
| `src/app/checkout/components/CheckoutOrderSummary.tsx` |
| `src/app/checkout/components/CheckoutShippingForm.tsx` |
| `src/app/checkout/components/CheckoutStepper.tsx` |
| `src/app/produit/[id]/components/ProductAccordions.tsx` |
| `src/app/produit/[id]/components/ProductCrossSell.tsx` |
| `src/app/produit/[id]/components/ProductGallery.tsx` |
| `src/app/produit/[id]/components/ProductSidebar.tsx` |
| `src/app/produit/[id]/components/VariantsSection.tsx` |
| `src/components/CookieConsent.tsx` |
| `src/components/NewsletterSignup.tsx` |
| `src/components/SearchOverlay.tsx` |
| `src/components/analytics/GoogleAnalytics.tsx` |
| `src/components/analytics/MetaPixel.tsx` |
| `src/components/catalogue/CatalogueMobileFilters.tsx` |
| `src/components/catalogue/CatalogueSidebar.tsx` |
| `src/components/cms/CmsPageContent.tsx` |
| `src/components/home/CategoryTiles.tsx` |
| `src/components/home/HeroSection.tsx` |
| `src/components/home/HomepageReviews.tsx` |
| `src/components/home/InspirationBanner.tsx` |
| `src/components/home/NewsletterSection.tsx` |
| `src/components/layout/Footer.tsx` |
| `src/components/layout/Header.tsx` |
| `src/components/layout/MegaMenu.tsx` |
| `src/components/layout/MobileNav.tsx` |
| `src/components/layout/PromoBanner.tsx` |
| `src/components/product/ProductReviews.tsx` |
| `src/components/product/ShareButtons.tsx` |
| `src/components/product/StickyAddToCart.tsx` |
| `src/components/seo/JsonLdOrganization.tsx` |
| `src/components/seo/JsonLdProduct.tsx` |
| `src/components/ui/BadgeLuxury.tsx` |
| `src/components/ui/ButtonLuxury.tsx` |
| `src/components/ui/CardProductLuxury.tsx` |
| `src/components/ui/StarRating.tsx` |
