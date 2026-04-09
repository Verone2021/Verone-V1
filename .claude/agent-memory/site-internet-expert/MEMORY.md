# Site-Internet Expert — Memoire Persistante

## Sources de verite

- **Schema DB** : `docs/current/database/schema/` (tables produits, commandes site)
- **Composants** : `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md`

## Architecture

- Next.js 15 App Router avec SSR, React 18
- Catalogue public via RPC get_site_internet_products() (SECURITY DEFINER)
- Panier = CartContext (localStorage), pas de panier DB
- Checkout Stripe via API routes + webhook
- Emails transactionnels via Resend (notifications.veronecollections.fr)
- Commandes dans sales_orders avec channel = 'site-internet'
- App publique — pas d'auth obligatoire (middleware = session refresh seulement)

## Pages (25+ pages)

- Catalogue : /catalogue, /catalogue/[slug]
- Collections : /collections, /collections/[slug]
- Panier : /panier
- Checkout : /checkout, /checkout/success
- Compte : /compte (profil, favoris, commandes, mot de passe, suppression RGPD)
- CMS : /a-propos, /contact, /faq
- Legal : /mentions-legales, /cgv, /confidentialite, /cookies

## API Routes (20 routes)

- Checkout Stripe, contact, promo, auth, cron jobs, emails
- Webhooks Stripe pour confirmation paiement → creation sales_order

## RLS

- Acces anonyme en lecture pour produits publies (is_public = true AND status = 'active')
- Pas d'ecriture directe — tout passe par API routes
- Selections publiques = vitrine e-commerce

## Integrations

- Stripe : checkout + webhooks (test/prod)
- Resend : emails transactionnels (confirmation commande, contact)
- Google Merchant Center : feed XML produits (Meta Commerce aussi)
- Supabase Auth : inscription/connexion client optionnelle

## Positionnement

- "Concept store" sourcing creatif — JAMAIS "luxe" ou "haut de gamme"
- "Trouvailles au juste prix"
- Bandeau promo : "Livraison offerte des 200€ — Code NEWCLIENT"

## Bugs connus

- SI-FIX-001 : useWishlist PGRST205 — CORRIGE (migration 20260318, table wishlist_items)
- SI-FIX-002 : GoTrueClient warnings — CORRIGE (commit 62bc88c3, singleton SupabaseProvider)
- SI-FIX-003 : Favicon 404 — PARTIEL (logo-verone.png + manifest.ts OK, favicon.ico manquant)
- SI-CONTENT-001 : Images homepage hero manquantes (contenu editorial)
- SI-CONTENT-002 : Images collections manquantes (contenu editorial)

## Ce qui fonctionne bien

- Navigation header (Catalogue, Collections, A propos, Contact, Recherche, Favoris, Compte, Panier)
- Cookie banner RGPD (Refuser/Accepter)
- Footer 4 colonnes (Navigation, Aide, Legal, Newsletter)
- Pages legales toutes presentes
- Catalogue avec filtres categorie/piece, tri, recherche
- Page compte complete

## DMARC Hardening

- Plan schedule 7 avril 2026 (docs/current/site-internet/DMARC-HARDENING-PLAN.md)
- DNS records en attente

## Documentation de reference

- `docs/current/INDEX-SITE-INTERNET-COMPLET.md` — index master
- `docs/current/site-internet/ARCHITECTURE.md` — architecture Next.js 15
- `docs/current/site-internet/API-ROUTES.md` — 20 routes API
- `docs/current/site-internet/FEATURES.md` — fonctionnalites
- `docs/current/site-internet/DMARC-HARDENING-PLAN.md` — securite DNS
- `docs/current/project-overview.md` — vue projet (restaure)
