# Site Internet Vérone — Architecture

## Vue d'ensemble

Concept store e-commerce public. Affiche les produits publiés via la RPC `get_site_internet_products()`.

- **Framework** : Next.js 15 App Router (RSC + Client components)
- **UI** : Tailwind CSS, design system Vérone (Playfair Display + Inter)
- **State** : React Query (cache 5min) + CartContext (localStorage) + useWishlist
- **Auth** : Supabase Auth (cookie-based SSR)
- **Paiement** : Stripe Checkout (webhook)
- **Emails** : Resend (template HTML branded)
- **Analytics** : Google Analytics 4

## Structure App

```
apps/site-internet/src/
├── app/                    # 23 pages
│   ├── page.tsx            # Homepage
│   ├── catalogue/          # Catalogue + filtres sidebar
│   ├── collections/        # Collections + [slug]
│   ├── produit/[id]/       # Fiche produit
│   ├── panier/             # Panier
│   ├── checkout/           # Checkout Stripe (+ success/cancel)
│   ├── compte/             # Compte + favoris
│   ├── auth/               # Login, register, forgot-password
│   ├── a-propos/           # À propos
│   ├── contact/            # Formulaire contact
│   ├── api/                # 18 API routes
│   │   ├── checkout/       # Stripe session creation
│   │   ├── contact/        # Contact form
│   │   ├── promo/validate/ # Promo code validation
│   │   ├── emails/         # 11 transactional emails
│   │   ├── cron/           # 3 cron jobs (abandoned cart, review request, win-back)
│   │   └── webhooks/stripe/# Stripe webhook handler
│   └── (legal pages)       # CGV, mentions-légales, confidentialité, cookies, FAQ, livraison, retours
├── components/             # 21 composants
│   ├── ui/                 # CardProductLuxury, ButtonLuxury, BadgeLuxury, StarRating
│   ├── layout/             # Header, Footer, MobileNav, MegaMenu, PromoBanner
│   ├── catalogue/          # CatalogueSidebar, CatalogueMobileFilters
│   ├── product/            # StickyAddToCart, ShareButtons, ProductReviews
│   ├── home/               # HeroSection
│   ├── seo/                # JsonLdOrganization, JsonLdProduct
│   └── analytics/          # GoogleAnalytics
├── hooks/                  # 11 hooks
│   ├── use-catalogue-products.ts   # RPC get_site_internet_products
│   ├── use-catalogue-filters.ts    # Sidebar filter state
│   ├── use-product-detail.ts       # Single product
│   ├── use-collections.ts          # Collections list + bySlug
│   ├── use-collection-products.ts  # Products in collection
│   ├── use-categories.ts           # Categories list
│   ├── use-wishlist.ts             # Wishlist CRUD
│   ├── use-reviews.ts              # Product reviews
│   ├── use-site-content.ts         # CMS content (hero, reassurance, banner)
│   ├── use-auth-user.ts            # Auth state
│   └── use-customer-addresses.ts   # Customer addresses
├── emails/                 # Email template builder
├── lib/                    # Supabase clients, filter labels, utils
└── contexts/               # CartContext (localStorage)
```

## Patterns Clés

### Data Fetching

- **Produits** : RPC `get_site_internet_products()` via React Query (staleTime 5min)
- **CMS** : Table `site_content` (hero, reassurance, banner)
- **Collections** : Table `linkme_selections` (is_public=true, status='active')

### Filtrage Catalogue

- Client-side filtering (18 produits max = OK)
- Sidebar gauche desktop (280px) + drawer mobile
- Filtres : catégorie, pièce, style, prix (min/max), marque
- Hook `useCatalogueFilters` gère l'état

### Panier

- `CartContext` avec localStorage persistence
- Pas de panier DB (anonymous shopping)
- Stripe Checkout pour paiement

### Auth

- Supabase Auth SSR (cookies)
- Middleware refresh session
- Pages : login, register, forgot-password
- Compte : profil + favoris

## Accès DB

- **Anonymous** (anon key) : lecture seule via RLS sur sélections publiques
- **Authenticated** : wishlist, reviews, customer addresses, orders
- **RPC** : `get_site_internet_products()` (SECURITY DEFINER)

## Ports

| Env | Port |
| --- | ---- |
| Dev | 3001 |

## Build

```bash
pnpm --filter @verone/site-internet build
pnpm --filter @verone/site-internet type-check
```
