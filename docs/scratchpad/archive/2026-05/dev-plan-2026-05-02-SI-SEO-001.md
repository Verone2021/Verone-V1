# [SI-SEO-001] Quick wins SEO — Dev Plan (2026-05-02)

## Contexte

SI-AI-001 (PR #874) a déjà généré meta_title + meta_description + slug + alt_text pour 60/200 produits. Les champs SEO de base sont couverts. Ce sprint cible les **quick wins infrastructure SEO** non-couverts.

Branche : `feat/SI-SEO-001-quick-wins-seo` (worktree `/Users/romeodossantos/verone-si-seo-001`)
Base : `staging` (711aff83)

---

## Audit existant — ce qui est DÉJÀ fait

| Item                                                     | Statut       | Emplacement                                                                  |
| -------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| JSON-LD `Product` (offers, brand, etc.)                  | ✅ EXISTE    | `apps/site-internet/src/components/seo/JsonLdProduct.tsx`                    |
| JSON-LD `Organization`                                   | ✅ EXISTE    | `apps/site-internet/src/components/seo/JsonLdOrganization.tsx` (layout root) |
| SerpPreview riche (preview Google)                       | ✅ EXISTE    | `packages/@verone/products/src/components/sections/SerpPreview.tsx`          |
| SerpPreview dans `/produits/catalogue/[id]/descriptions` | ✅ EXISTE    | `_descriptions-blocks/SeoCard.tsx`                                           |
| Meta Title/Description sur produits                      | ✅ généré IA | colonnes `products.meta_title`, `meta_description`                           |
| Meta Title/Description sur collections                   | ✅ EXISTE    | colonnes `collections.meta_title`, `meta_description` + `generateMetadata`   |
| Alt text images produits                                 | ✅ généré IA | colonne `product_images.alt_text` (60 produits couverts)                     |

---

## Scope final proposé (à valider)

### ✅ Commit 1 — JSON-LD BreadcrumbList (page produit + collection)

**Manque réel**. Schema.org BreadcrumbList aide Google à afficher le chemin de navigation dans les SERP.

- Nouveau composant `apps/site-internet/src/components/seo/JsonLdBreadcrumbList.tsx`
- Intégration `apps/site-internet/src/app/produit/[id]/page.tsx` :
  Accueil → Catalogue → {Nom produit}
- Intégration `apps/site-internet/src/app/collections/[slug]/page.tsx` :
  Accueil → Collections → {Nom collection}
- Aucune migration DB
- Test Playwright : vérifie présence `<script type="application/ld+json">` avec `@type: BreadcrumbList` sur 2 pages

**Fichiers** :

- nouveau : `apps/site-internet/src/components/seo/JsonLdBreadcrumbList.tsx`
- édit : `apps/site-internet/src/app/produit/[id]/page.tsx`
- édit : `apps/site-internet/src/app/collections/[slug]/page.tsx`

### ✅ Commit 2 — Bouton "Dupliquer" produit (back-office catalogue)

**Manque réel**. Aucun bouton/action de duplication n'existe (vérifié via grep).

- Action "Dupliquer" dans le menu d'actions de la page liste `/produits/catalogue/page.tsx`
- Server Action `duplicateProduct(productId)` :
  - Crée un nouveau row `products` avec champs copiés (description, meta, dimensions, marques, etc.)
  - SKU suffixé `-COPIE` (ou `-COPIE-2`, `-COPIE-3` si déjà existant)
  - Slug suffixé `-copie`
  - `is_published_online: false`, `archived_at: null`, `meta_title/description: NULL` (pour relance IA)
  - Ne duplique PAS les images, variantes, prix-locked, mouvements de stock
  - Retourne le nouveau `productId`
- Toast confirmation + bouton "Voir le nouveau produit"
- Aucune migration DB
- Test Playwright : duplique un produit, vérifie redirect + suffixe SKU

**Fichiers** :

- nouveau : `apps/back-office/src/app/(protected)/produits/actions/duplicate-product.ts`
- édit : page liste catalogue (ajout entrée `Dupliquer` dans `ResponsiveActionMenu`) — fichier à confirmer dans audit fin
- responsive : conforme aux 5 techniques (action dans le dropdown standard)

### ✅ Commit 3 — Régen types Supabase (si Commit 2 ajoute migration)

Aucune migration SQL prévue → **commit non nécessaire**.

---

## Hors scope (proposition de skip)

| Item du brief                             | Décision                         | Raison                                                                                                                                                       |
| ----------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schema.org Product avec offers/brand/etc. | **SKIP**                         | Déjà fait (JsonLdProduct.tsx complet, inclut even hasMerchantReturnPolicy)                                                                                   |
| Preview SERP Google snippet               | **SKIP**                         | Déjà existant (SerpPreview.tsx) sur la page produit BO `/produits/catalogue/[id]/descriptions`                                                               |
| Noindex/nofollow toggle par page CMS      | **SKIP par défaut, à confirmer** | Nécessite migration SQL (`ALTER TABLE cms_pages ADD noindex boolean`) + regen types. Hors scope "quick wins". À sortir en sprint dédié SI-SEO-002 si besoin. |

**Question Roméo** : valides-tu :

1. de skipper la migration `cms_pages.noindex` (sortable en sprint dédié SI-SEO-002 plus tard) ?
2. de ne PAS rajouter SerpPreview dans `EditSiteInternetProductModal/TabSEO` (parce que le SerpPreview vit déjà sur la page détail produit BO `/produits/catalogue/[id]`) ?

Si oui → 2 commits seulement (Breadcrumb + Dupliquer).
Si non → on ajoute selon ta préférence.

---

## Tests Playwright (5 tailles obligatoires)

- 375 / 768 / 1024 / 1440 / 1920 px
- Page produit site-internet : présence JSON-LD BreadcrumbList
- Page collection site-internet : présence JSON-LD BreadcrumbList
- Catalogue back-office : action "Dupliquer" visible (responsive ActionMenu)
- Modal back-office : flow duplication → toast → nouveau produit listé

Sortie : `.playwright-mcp/screenshots/20260502/`

---

## Workflow

1. ✅ Worktree créé `/Users/romeodossantos/verone-si-seo-001`
2. ✅ `.env.local` copiés (back-office, linkme, site-internet)
3. ✅ Audit existant réalisé
4. ⏳ Push draft PR avec ce dev-plan
5. ⏸️ ATTENTE validation Roméo sur scope final (questions ci-dessus)
6. Implémentation Commit 1 (Breadcrumb)
7. Implémentation Commit 2 (Dupliquer)
8. Tests Playwright + commit screenshots
9. Rebase précoce avant push final
10. Promote draft → ready quand CI verte

---

## Risques / pièges

- Aucune migration DB → pas de drift types Supabase à gérer
- Aucun trigger touché → pas de risque RLS
- Sur duplication produit : bien soft-skip les FK obligatoires (variant_groups si présents).
- Bonne vérification que `unique(sku)` n'est pas violé → suffixe incrémental

---

## Estimation

- 2 commits (~3-4 fichiers chacun)
- 1 PR vers staging
- Durée estimée : 1h30 implémentation + 30 min tests Playwright

---

## Next steps post-merge

Si Roméo valide les scopes additionnels, créer SI-SEO-002 séparé :

- Toggle `noindex` pages CMS (migration SQL + UI + meta robots côté site-internet)
- SerpPreview dans `EditSiteInternetProductModal/TabSEO` (réutilisation cross-package)
