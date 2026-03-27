# Site-Internet Expert — Memoire Persistante

## Patterns decouverts

- Catalogue public via RPC get_site_internet_products() (SECURITY DEFINER)
- Panier = CartContext (localStorage), pas de panier DB
- Checkout Stripe via API routes + webhook
- Emails transactionnels via Resend

## Bugs recurrents

- Aucun bug recurrent identifie a ce jour

## Decisions architecturales

- App publique — pas d'auth obligatoire (middleware = session refresh seulement)
- Commandes dans sales_orders avec channel = 'site-internet'
- Selections publiques (is_public=true AND status='active')
- Positionnement "concept store" — JAMAIS "luxe" ou "haut de gamme"
