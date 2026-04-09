# Site Internet Verone

Concept store e-commerce public. Affiche les produits publies via la RPC `get_site_internet_products()`.

## CRITICAL : Index a consulter AVANT toute modification

- Pages, routes, composants site : @docs/current/INDEX-SITE-INTERNET-COMPLET.md
- Composants et hooks partages : @docs/current/INDEX-COMPOSANTS-FORMULAIRES.md

## Documentation

| Tache                | Lire AVANT                                    |
| -------------------- | --------------------------------------------- |
| Architecture app     | `docs/current/site-internet/ARCHITECTURE.md`  |
| Inventaire features  | `docs/current/site-internet/FEATURES.md`      |
| API routes           | `docs/current/site-internet/API-ROUTES.md`    |
| Selections publiques | `docs/current/linkme/GUIDE-COMPLET-LINKME.md` |
| Architecture globale | `docs/current/architecture.md`                |

## Build Filtre

```bash
pnpm --filter @verone/site-internet build
pnpm --filter @verone/site-internet type-check
```

## Port

`localhost:3001`

## Positionnement

**Concept store** — sourcing creatif, produits originaux, qualite-prix, selection curatee.
Aucune reference a "haut de gamme", "luxe", ou "artisans d'excellence".

## Acces DB

- Lecture seule via RLS `anon` sur selections publiques (`is_public = true AND status = 'active'`)
- RPC `get_site_internet_products()` (SECURITY DEFINER, retourne produits eligibles)
- Pattern RLS : `.claude/rules/database/rls-patterns.md` (section Site-Internet)

## Patterns Cles

- **Filtres catalogue** : sidebar gauche desktop + drawer mobile, hook `useCatalogueFilters`
- **Cartes produit** : `CardProductLuxury` avec badges (nouveau, discount), coeur favoris, bouton ajouter
- **CMS** : table `site_content` (hero, reassurance, banner) via `useSiteContent`
- **Panier** : `CartContext` (localStorage), pas de panier DB
- **Checkout** : Stripe Checkout (API route + webhook)
- **Emails** : Resend via API routes, template `buildVeroneEmailHtml()`
