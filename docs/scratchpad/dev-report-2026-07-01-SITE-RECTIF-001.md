# Dev-report — [SITE-RECTIF-001] Corrections pré-promotion veronecollections.fr

**Date** : 2026-07-01
**Branche** : `fix/site-rectif-001-corrections-site-internet`
**App** : `@verone/site-internet`
**Type** : corrections contenu + code, 1 PR cohérente, auto-merge OFF (contient
suppression de donnée métier + modif contenu DB → GO Roméo au merge).

---

## Contexte

Audit pré-promotion du site public (note 5,5/10). 13 points. Chaque point tracé
jusqu'au fichier code ou à la table/colonne. L'éditeur CMS n'altère pas les
accents → accents manquants = donnée saisie sans accents (corrigée en base).

## A. Corrections CODE

| #   | Fichier                                                                                                                       | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `components/home/HeroSection.tsx`                                                                                             | `image_url` (site_content.hero) était déclaré mais jamais rendu → ajout d'un `<Image>` next/image (priority, object-cover, aspect 16/10 → 21/9) sous les CTA. `imagedelivery.net` déjà whitelisté dans `next.config.js`.                                                                                                                                                                                                                    |
| A2  | `supabase/migrations/…_product_description.sql`                                                                               | RPC `get_site_internet_products` : le champ `description` renvoyait `p.description` (6/178 rempli). Corps modifié → `COALESCE(NULLIF(TRIM(p.description),''), p.description_long, p.description_short)` (157/160 remplis). **Signature identique → aucun drift de types.** Le `LEFT(p.description,160)` du seo_meta_description reste sur la colonne d'origine. Fonction reproduite via `pg_get_functiondef` + `replace()` (byte-accurate). |
| A2  | `produit/[id]/components/ProductAccordions.tsx`                                                                               | Accordéon « Détails du produit » retiré (la description est déjà affichée en clair au-dessus des accordéons via `page.tsx` — sinon doublon sur 157 fiches).                                                                                                                                                                                                                                                                                 |
| A3  | `ProductAccordions.tsx`                                                                                                       | **Bug racine** : `formatDimensions` cherchait `length/longueur/…` alors que le jsonb réel contient `length_cm/width_cm/height_cm/depth_cm/diameter_cm` → dimensions jamais affichées (poids seul). Réécrit : lit les clés `_cm`, gère Ø diamètre (+ hauteur), affiche tout sous-ensemble disponible (plus de tout-ou-rien). Interface `ProductDimensions` complétée avec les clés réelles.                                                  |
| A4  | `produit/[id]/components/ProductCrossSell.tsx` + `page.tsx`                                                                   | Recommandations : avant = 6 produits « newest ». Maintenant scoring : même `subcategory_id` (+2), même `style` (+1), exclusion produit courant + variantes du même `variant_group_id`, tri stable, 4 max. Props `subcategoryId/variantGroupId/style` passées depuis `page.tsx`. Titre « Les clients ont également consulté » → « Vous aimerez aussi » (honnête).                                                                            |
| A5  | ProductSidebar, ProductAccordions, checkout/page, CheckoutShippingForm, api/emails/delivery-confirmation, api/emails/win-back | « 30 jours » retours → « 14 jours ». **Non touché** (pas des retours) : délai RGPD confidentialité (1 mois légal), primes ambassadeur 30j, durée cookie 30j.                                                                                                                                                                                                                                                                                |
| A6  | ProductSidebar                                                                                                                | Faute « 10-14 jours ouvres » → « 10 à 14 jours ouvrés ».                                                                                                                                                                                                                                                                                                                                                                                    |
| A7  | confidentialite, cookies, JsonLdOrganization + 11 fichiers SEO                                                                | Texte visible `verone.fr` → `veronecollections.fr` ; URL de repli `?? 'https://verone.fr'` → `veronecollections.fr` sur robots/sitemap/layout/journal/produit/collections layouts + JsonLd\* + ArticleShareBar. **NON touché** (interdictions) : `from:` des routes emails (`noreply@verone.fr`, délivrabilité), `api/webhooks/stripe` (immuable), `bo.verone.fr` (URL back-office).                                                        |
| A8  | — (aucun)                                                                                                                     | Vérifié en direct sur prod : ajout panier → vignette Cloudflare OK (naturalWidth>0). Catalogue 13/13 images OK. Images grises = anciens paniers localStorage d'avant la migration Cloudflare (fallback Supabase mort). **Pas de défaut code.** `addItem` (2 seuls call sites : fiche + sidebar) porte bien `primary_cloudflare_image_id`.                                                                                                   |

## B. Corrections CONTENU EN BASE

`supabase/migrations/…_content.sql` (dollar-quoting `$md$/$json$`, pas d'échappement) :

- **cms_pages** (5 slugs) : réécriture markdown avec accents + titres accentués ;
  cgv `verone.fr`→`veronecollections.fr` (×2) ; livraison standard→10-14j + suppression
  ligne « express 2-3 jours » ; faq 5-7j→10-14j. Mentions légales : accents seulement,
  champs légaux (SIRET/capital/adresse/TVA/RCS) laissés en attente Roméo (**pas de donnée
  fantôme**).
- **site_content** : `hero` (cta_text accentué, image_url préservé), `reassurance`
  (titres + descriptions ré-accentués).
- **Suppression** collection test `c4ed5ee4-315f-452a-a847-809c5c7bb790` : DELETE cascade
  manuelle `collection_products` (3) / `collection_images` (1) / `collection_shares` (0)
  puis `collections`. Produits liés préservés. **Donnée métier irréversible → GO Roméo au merge.**

Validation sans écriture prod : cast jsonb des 2 contenus vérifié via SELECT ; colonnes/FK
confirmées avant rédaction. Migrations appliquées au déploiement (pas de `apply_migration`
MCP — deny + prod).

## C. En attente Roméo (documenté dans `RECTIV.MD`)

C1 mentions légales (SIRET…), C2 images blog (5 articles `cover_image_url` NULL), C3 image
collection, C4 ~21 produits sans description / ~58 sans dimensions.

## Vérifications

- `type-check` @verone/site-internet : **vert**.
- `lint` @verone/site-internet : **vert** (0 warning après `--fix` prettier sur lignes URL).
- Playwright live : catalogue 13/13 images OK, panier vignette OK, 0 erreur console.
- Migrations : signature RPC inchangée (pas de drift) ; contenu validé par cast jsonb + EXPLAIN-safe.
- Build : couvert par la CI.

## Non couvert / hors périmètre

Triggers stock, routes Qonto, RLS : non concernés. Routes emails (`from:`) et webhook Stripe :
volontairement non modifiés (interdictions). Saisie produit de masse (C4) + upload images
blog (C2) : lots séparés côté Roméo.
