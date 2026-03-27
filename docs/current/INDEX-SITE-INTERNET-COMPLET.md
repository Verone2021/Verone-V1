# Index Site-Internet Verone — Reference Metier

E-commerce luxe decoration et mobilier. 25 pages, 20 API routes. Port 3001.

## Parcours Client

```
Homepage → Catalogue/Collections → Fiche Produit → Panier → Checkout (Stripe) → Confirmation
                                                                      ↓
                                                               Compte Client (commandes, favoris, adresses)
```

## Pages

### Publiques (23 pages)

| Route                                                       | Type   | But                                                                                     | Donnees                                            |
| ----------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `/`                                                         | Client | Homepage : hero CMS, categories, produits vedettes, collections, avis                   | RPC `get_site_internet_products()`, `site_content` |
| `/catalogue`                                                | Client | Catalogue filtrable : categorie, piece, style, prix, marque, couleur + tri + pagination | RPC produits, filtres client-side                  |
| `/collections`                                              | Client | Liste collections publiques                                                             | `collections`                                      |
| `/collections/[slug]`                                       | Client | Detail collection + produits                                                            | `collections` + RPC produits                       |
| `/produit/[id]`                                             | Client | Fiche produit : gallery, variantes, avis, cross-sell, accordeons specs                  | RPC produit + `product_reviews`                    |
| `/panier`                                                   | Client | Panier (localStorage + Supabase sync)                                                   | CartContext                                        |
| `/checkout`                                                 | Client | Formulaire livraison + paiement Stripe                                                  | Cart, shipping config                              |
| `/checkout/success`                                         | Client | Confirmation commande                                                                   | Query params                                       |
| `/checkout/cancel`                                          | Client | Annulation                                                                              | -                                                  |
| `/contact`                                                  | Client | Formulaire contact                                                                      | -                                                  |
| `/a-propos`                                                 | Server | A propos Verone                                                                         | -                                                  |
| `/faq`                                                      | Server | FAQ                                                                                     | `site_content`                                     |
| `/livraison`                                                | Server | Infos livraison                                                                         | -                                                  |
| `/retours`                                                  | Server | Politique retours                                                                       | -                                                  |
| `/cgv`, `/mentions-legales`, `/confidentialite`, `/cookies` | Server | Pages legales                                                                           | -                                                  |
| `/auth/login`                                               | Server | Connexion                                                                               | -                                                  |
| `/auth/register`                                            | Server | Inscription                                                                             | -                                                  |
| `/auth/forgot-password`                                     | Server | Mot de passe oublie                                                                     | -                                                  |

### Authentifiees (2 pages)

| Route             | But                                                         |
| ----------------- | ----------------------------------------------------------- |
| `/compte`         | Dashboard client : profil, commandes, adresses, deconnexion |
| `/compte/favoris` | Produits favoris (wishlist)                                 |

## Integrations

### Stripe (Paiement)

```
Client checkout → POST /api/checkout → Stripe.checkout.sessions.create()
  → Redirect Stripe Hosted Checkout
    → Webhook POST /api/webhooks/stripe (checkout.session.completed)
      → UPDATE sales_orders status=validated, payment_status_v2=paid
      → Email confirmation
```

### Supabase (Auth + Data)

- Auth : email + password, SSR cookies, middleware refresh
- RPC `get_site_internet_products()` : SECURITY DEFINER, retourne produits publies eligibles
- Tables publiques (RLS anon) : products, collections, site_content, order_discounts, product_reviews
- Tables auth (RLS user) : wishlist_items, customer_addresses, sales_orders (propres)

### Resend (11 emails transactionnels)

| Email                 | Declencheur               |
| --------------------- | ------------------------- |
| Welcome               | Inscription               |
| Order confirmation    | Paiement Stripe OK        |
| Admin notification    | Nouvelle commande         |
| Shipping notification | Expedition                |
| Delivery confirmation | Livraison                 |
| Order status update   | Changement status         |
| Abandoned cart        | Cron (panier > 2h)        |
| Review request        | Cron (7j apres livraison) |
| Win-back              | Cron (60+ jours inactif)  |
| Contact confirmation  | Formulaire contact        |

## Comment le Back-Office Pilote le Site

| Action Back-Office                           | Effet Site                            |
| -------------------------------------------- | ------------------------------------- |
| Publier produit (`is_published=true`)        | Apparait dans catalogue + homepage    |
| Modifier prix (`price_ttc`, `discount_rate`) | Mis a jour via RPC                    |
| Gerer variantes                              | Selecteur variantes sur fiche produit |
| Curate collections                           | Apparaissent dans `/collections`      |
| Editer `site_content` (CMS)                  | Hero, reassurance, banner mis a jour  |
| Configurer shipping (`sales_channels`)       | Options livraison au checkout         |
| Traiter commandes                            | Statuts visibles dans `/compte`       |
| Creer codes promo (`order_discounts`)        | Validables au checkout                |

## API Routes (20)

### Checkout & Paiement

- `POST /api/checkout` — Creer session Stripe
- `POST /api/promo/validate` — Valider code promo
- `POST /api/webhooks/stripe` — Webhook Stripe (paiement confirme)

### Configuration

- `GET /api/shipping-config` — Options livraison (cache 1min)

### Compte

- `POST /api/account/export` — Export RGPD (JSON)

### Contact

- `POST /api/contact` — Sauvegarde message + email confirmation

### Auth

- `POST /api/auth/callback` — Callback OAuth Supabase

### Emails (10 routes)

- `POST /api/emails/[type]` — Envoi email transactionnel via Resend

### Cron Jobs (3 routes)

- `GET /api/cron/abandoned-cart-check` — Paniers abandonnes > 2h
- `GET /api/cron/review-request-check` — Demande avis 7j apres livraison
- `GET /api/cron/win-back-check` — Win-back clients inactifs > 60j

## Hooks Custom (11)

| Hook                           | Usage                                                                   |
| ------------------------------ | ----------------------------------------------------------------------- |
| `useCatalogueProducts()`       | Homepage, catalogue, recherche (RPC + React Query staleTime=5min)       |
| `useCatalogueFilters()`        | Filtres catalogue (categories, pieces, styles, prix, marques, couleurs) |
| `useAuthUser()`                | Utilisateur connecte                                                    |
| `useWishlist(userId)`          | Favoris (CRUD optimiste)                                                |
| `useCollections()`             | Collections publiques                                                   |
| `useCollectionProducts(slug)`  | Produits d'une collection                                               |
| `useProductDetail(slug)`       | Fiche produit                                                           |
| `useReviews(productId)`        | Avis produit + soumission                                               |
| `useSiteContent(key)`          | Contenu CMS (hero, reassurance, banner)                                 |
| `useCustomerAddresses(userId)` | Adresses client (CRUD)                                                  |
| `useCategories()`              | Categories pour filtres                                                 |

## CartContext

- **Stockage** : localStorage (`verone_cart_items`) + sync Supabase (`shopping_carts`)
- **Session** : UUID genere par navigateur, persiste entre visites
- **API** : `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`
- **Enrichi** : nom, slug, prix, image, eco-participation, montage

## SEO

### Implemente

- JSON-LD Organisation (homepage)
- JSON-LD Product (fiche produit : prix, avis, livraison, retours)
- Metadata dynamique (produits, collections)
- sitemap.xml + robots.txt
- manifest.json (PWA)

### Manquant

- BreadcrumbList schema
- LocalBusiness schema
- FAQPage schema
- Hreflang (multi-langue)
- Canonical dynamiques sur pages filtrees

## Middleware

- Refresh session Supabase (cookie SSR)
- Protection `/compte` → redirect `/auth/login` si non connecte
- Pas d'app-isolation (supprime, site autonome)
