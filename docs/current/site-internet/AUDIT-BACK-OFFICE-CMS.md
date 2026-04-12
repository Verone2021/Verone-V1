# Audit Back-Office CMS Site Internet

_Date : 12 avril 2026 | Branche : feat/BO-SI-001-site-internet-sprint1-3_

Route principale : `/canaux-vente/site-internet`
Fichier : `apps/back-office/src/app/(protected)/canaux-vente/site-internet/page.tsx` (460 lignes)

---

## Architecture de la Page

Page unique avec **10 onglets** (Tabs shadcn/ui). Header sticky avec badge "Actif" et bouton "Voir le site" (https://verone.fr).

| #   | Onglet        | Valeur tab    | Composant                                              | Lignes      | Etat                         |
| --- | ------------- | ------------- | ------------------------------------------------------ | ----------- | ---------------------------- |
| 1   | Dashboard     | `dashboard`   | Inline dans page.tsx                                   | ~130        | PARTIEL                      |
| 2   | Produits      | `produits`    | `ProductsSection`                                      | 488         | COMPLET                      |
| 3   | Collections   | `collections` | `CollectionsSection`                                   | 406         | PARTIEL                      |
| 4   | Categories    | `categories`  | `CategoriesSection`                                    | 410         | PARTIEL                      |
| 5   | Configuration | `config`      | `ConfigurationSection`                                 | 738         | COMPLET (refactoring requis) |
| 6   | Commandes     | `commandes`   | `OrdersSection`                                        | 46          | COMPLET                      |
| 7   | Clients       | `clients`     | `ClientsSection`                                       | 205         | BUGGE                        |
| 8   | Avis          | `avis`        | `ReviewsSection`                                       | 491         | COMPLET                      |
| 9   | Contenu       | `contenu`     | `CMSSection` + `CmsPagesSection` + `NewsletterSection` | 454+232+121 | PARTIEL                      |
| 10  | Promotions    | `promos`      | `PromoCodesSection`                                    | 395         | COMPLET                      |

---

## Sous-page Detail Produit

Route : `/canaux-vente/site-internet/produits/[id]`

| Composant                    | Lignes | Role                                      |
| ---------------------------- | ------ | ----------------------------------------- |
| `page.tsx`                   | 110    | Layout page detail                        |
| `ProductHeaderSection.tsx`   | 131    | En-tete : nom, SKU, statut, retour        |
| `ProductInfoSection.tsx`     | 190    | Description, dimensions, pieces           |
| `ProductPricingSection.tsx`  | 253    | Prix HT/TTC, reduction, eco-participation |
| `ProductPhotosSection.tsx`   | 72     | Galerie photos                            |
| `ProductStockSection.tsx`    | 93     | Stock disponible, alertes                 |
| `ProductMetadataSection.tsx` | 68     | SEO : titre, description, slug            |

---

## Detail par Onglet

### 1. Dashboard (inline page.tsx)

**KPIs :**

- Produits publies / total (dynamique via `useSiteInternetProducts`)
- Collections actives (dynamique via `useSiteInternetCollections`)
- Commandes ce mois : **hardcode a 0** (non branche)
- CA ce mois : **hardcode a 0 EUR** (non branche)

**Section "A traiter" :** Liens vers produits non publies, avis en attente (hardcode 0), config SEO.

**Grille 2x2 :** Raccourcis vers Catalogue, Commerce, Contenu & SEO, Promotions.

**Manque :** KPIs commandes et CA dynamiques, graphiques tendances, alertes reelles.

---

### 2. Produits (`ProductsSection.tsx` — 488 lignes)

**Tables :** `products`, `channel_product_metadata`, `channel_pricing`
**RPC :** `get_site_internet_products()`

| Fonctionnalite                                                   | Etat |
| ---------------------------------------------------------------- | ---- |
| Lister produits du canal                                         | OK   |
| Recherche nom/SKU (debounce 300ms)                               | OK   |
| Filtre : Tous / Publies / Brouillons                             | OK   |
| Toggle publication (optimistic)                                  | OK   |
| Ajouter produits depuis catalogue (`UniversalProductSelectorV2`) | OK   |
| Retirer produit (avec confirmation)                              | OK   |
| Editer produit (modal 6 onglets)                                 | OK   |
| Previsualiser (`ProductPreviewModal`)                            | OK   |
| Lien vers page detail `/produits/[id]`                           | OK   |

**Colonnes :** Image, Nom, SKU, Variantes (badge), Prix TTC + source, Statut, Eligibilite, Toggle, Actions.

---

### 3. Modal Edition Produit (`EditSiteInternetProductModal/` — 1734 lignes total)

| Onglet       | Fichier               | Lignes | Champs                                                                     |
| ------------ | --------------------- | ------ | -------------------------------------------------------------------------- |
| General      | `TabGeneral.tsx`      | 118    | Toggle publication, date planifiee, slug, eligibilite                      |
| SEO          | `TabSEO.tsx`          | 108    | Titre custom (60 car.), description (160 car.), waterfall canal -> produit |
| Tarification | `TabPricing.tsx`      | 187    | Prix HT custom, taux reduction (%), apercu TTC, toggle actif               |
| Images       | `TabImages.tsx`       | 252    | Galerie, image primaire, supprimer, ajouter                                |
| Variantes    | `TabVariantes.tsx`    | 38     | Affichage variantes (lecture seule)                                        |
| Informations | `TabInformations.tsx` | 314    | Description marketing, points vente, dimensions, marque                    |

**Hook :** `useEditSiteInternetProduct.ts` (301 lignes) — state, validation Zod, mutations.
**Schema :** `schema.ts` (75 lignes) — validation Zod des champs editables.
**Types :** `types.ts` (63 lignes) — types locaux.

---

### 4. Collections (`CollectionsSection.tsx` — 406 lignes)

**Tables :** `collections`, `sales_channels`

**KPIs :** Total / Actives / Visibles site / A la une

| Fonctionnalite                        | Etat                                  |
| ------------------------------------- | ------------------------------------- |
| Lister collections                    | OK                                    |
| Recherche par nom                     | OK                                    |
| Toggle visibilite site (optimistic)   | OK                                    |
| Modifier image URL                    | OK (via `window.prompt` — UX basique) |
| Voir slug, nb produits, ordre, statut | OK (lecture seule)                    |

**Logique visibilite :** `visible_channels` array. `null` = visible partout, `[]` = invisible.

**Manque :**

- Creer/editer/supprimer une collection
- Reordonnancement drag-and-drop (hook `useUpdateCollectionOrder` existe mais non expose)
- Upload image via fichier (actuellement URL manuelle)

---

### 5. Categories (`CategoriesSection.tsx` — 410 lignes)

**Tables :** `categories`

**KPIs :** Total / Actives / Visibles menu / Racines

| Fonctionnalite                          | Etat               |
| --------------------------------------- | ------------------ |
| Afficher arborescence (expand/collapse) | PARTIEL            |
| Toggle visibilite menu                  | OK                 |
| Voir slug, niveau, statut, ordre        | OK (lecture seule) |
| Recherche par nom                       | OK                 |

**Bug connu :** `buildCategoryTree` retourne une structure plate — les sous-categories n'apparaissent pas comme enfants visuels.

**Manque :** Creer/editer/supprimer une categorie, vrais niveaux parent/enfant.

---

### 6. Configuration (`ConfigurationSection.tsx` — 738 lignes)

**Tables :** `sales_channels`, `products` | **Storage :** `public/logos/`

> **ATTENTION : 738 lignes — refactoring obligatoire (limite 400)**

#### 6a. Identite du Site

- Nom du site, URL domaine
- Upload logo (PNG/JPG/SVG, max 2 MB) vers Supabase Storage

#### 6b. SEO Global

- Meta title par defaut (60 car. max)
- Meta description (160 car. max)
- Meta keywords (comma-separated)

#### 6c. Contact

- Email, telephone

#### 6d. Analytics & Tracking

- Google Analytics 4 ID (G-XXXXXXXXXX)
- Facebook Pixel ID (**non sauvegarde** — placeholder)
- Google Tag Manager ID (GTM-XXXXXXX)

#### 6e. Livraison — `ShippingConfigCard.tsx` (492 lignes)

- Standard : label, prix, delai min/max, toggle
- Express : label, prix, delai min/max, toggle
- Gratuite : seuil, s'applique a (standard / toutes)
- Zones : FR, BE, CH, LU, MC (checkboxes)
- Supplement par produit
- Message informatif

#### 6f. Cout Expedition par Produit — `ProductShippingCard.tsx` (483 lignes)

- Table produits : prix TTC, poids, classe expedition, cout estime
- Edition inline avec sauvegarde individuelle
- Badge alerte si produits sans estimation

**Manque :**

- Facebook Pixel non sauvegarde (placeholder)
- Reseaux sociaux non exposes (type `social_links` prevu mais pas dans l'UI)
- Features toggles non exposes (`enable_wishlist`, `enable_reviews`, `enable_live_chat`)

---

### 7. Commandes (`OrdersSection.tsx` — 46 lignes)

Reutilise `SalesOrdersTable` de `@verone/orders` filtre par `channelId = '0c2639e9-...'`.

**Fonctionnalites heritees :** Affichage KPIs, validation, expedition, annulation, pagination (20/page), redirection vers `/commandes/clients/[id]/details`.

#### Modal Detail — `OrderDetailModal.tsx` (495 lignes) + `OrderStatusActions.tsx` (205 lignes)

- Statut avec transitions valides (dropdown)
- Info client (nom, email, tel, moyen paiement)
- Adresses livraison/facturation
- Code promo applique + montant remise
- Articles (nom, prix, quantite, eco-participation, montage)
- Totaux (sous-total, reduction, livraison, TTC, detail HT+TVA)
- Expedition Packlink : transporteur, suivi, statut, etiquette

**Workflow statuts :**

```
pending -> cancelled (admin) ou paid (webhook Stripe)
paid -> shipped ou cancelled
shipped -> delivered
delivered / cancelled = etats finaux
```

---

### 8. Clients (`ClientsSection.tsx` — 205 lignes)

**Tables :** `individual_customers`

**Requete :** `is_active = true` ET `auth_user_id IS NOT NULL` (limite 200)

> **BUG CRITIQUE : Filtre incorrect.** Devrait etre `source_type = 'site-internet'`. Le filtre actuel montre des clients internes/LinkMe ayant un `auth_user_id` et rate les vrais clients site-internet sans `auth_user_id`.

| Fonctionnalite                                   | Etat                   |
| ------------------------------------------------ | ---------------------- |
| Lister clients                                   | BUGGE (mauvais filtre) |
| Recherche nom, email, ville, tel                 | OK                     |
| Voir nom, email, tel, ville/CP, date inscription | OK                     |

**Manque :** Fiche client, historique commandes, segmentation, export, contact direct.

---

### 9. Avis (`ReviewsSection.tsx` — 491 lignes)

**Tables :** `product_reviews`

**KPIs :** Total / En attente / Approuves / Rejetes / Note moyenne

| Fonctionnalite                       | Etat |
| ------------------------------------ | ---- |
| Lister avis (limite 500)             | OK   |
| Recherche auteur, titre, commentaire | OK   |
| Filtre statut                        | OK   |
| Approuver / Rejeter                  | OK   |
| Basculer approved <-> rejected       | OK   |

**Manque :** Repondre a un avis, lien vers produit, lien vers client.

---

### 10. Contenu (3 composants)

#### 10a. CMS Sections — `CMSSection.tsx` (454 lignes)

**Tables :** `site_content`

| Bloc          | Cle DB        | Champs                                                                    |
| ------------- | ------------- | ------------------------------------------------------------------------- |
| Hero          | `hero`        | Titre, sous-titre, CTA texte, CTA lien, image URL                         |
| Reassurance   | `reassurance` | Items (titre + description) x N                                           |
| Bandeau promo | `banner`      | Toggle, texte, lien, couleur fond, couleur texte (color picker + preview) |

#### 10b. Pages CMS — `CmsPagesSection.tsx` (232 lignes)

**Tables :** `cms_pages`

- Liste pages avec titre et slug
- Edition : titre, contenu Markdown (textarea mono), meta title SEO, meta description SEO
- Sauvegarde en base

**Manque :** Toggle publication (`is_published` non expose), creation nouvelle page, suppression, preview live.

#### 10c. Newsletter — `NewsletterSection.tsx` (121 lignes)

**Tables :** `newsletter_subscribers`

- Liste abonnes actifs (limite 500) : email, source, date inscription
- **Lecture seule**

**Manque :** Export, desabonnement, envoi campagne.

---

### 11. Promotions (`PromoCodesSection.tsx` — 395 lignes)

**Tables :** `order_discounts`, `order_discount_targets`

**KPIs :** Total / Actives / Expirees / Total utilisations

| Fonctionnalite                            | Etat |
| ----------------------------------------- | ---- |
| Lister promotions                         | OK   |
| Recherche code/nom                        | OK   |
| Creer promotion                           | OK   |
| Editer promotion                          | OK   |
| Supprimer (confirmation `window.confirm`) | OK   |

**Formulaire (`promo-codes-form.tsx` — 396 lignes) :**

- Mode : code manuel ou promo automatique
- Nom, description
- Type : pourcentage, montant fixe (EUR), livraison gratuite
- Ciblage : tous produits, produits specifiques, collections specifiques
- Exclure articles deja en promo
- Montant minimum commande, reduction max (plafond)
- Dates validite, utilisations max total/par client
- Toggle actif/inactif
- Canal : `applicable_channels: ['site-internet']`

---

## Hooks Locaux (9 hooks — 1360 lignes total)

| Hook                         | Fichier                            | Lignes | Tables/RPCs                                                                           | Exports                                                                     |
| ---------------------------- | ---------------------------------- | ------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `useSiteInternetProducts`    | `use-site-internet-products.ts`    | 309    | RPC `get_site_internet_products`, products, channel_product_metadata, channel_pricing | query, togglePublication, addProducts, removeProduct, updateMetadata, stats |
| `useSiteInternetCollections` | `use-site-internet-collections.ts` | 273    | collections, sales_channels                                                           | query, toggleVisibility, updateOrder, stats, isVisibleOnChannel             |
| `useSiteInternetConfig`      | `use-site-internet-config.ts`      | 158    | RPC `get_site_internet_config`, sales_channels, Storage                               | query, updateConfig, uploadLogo, updateConfigJSON                           |
| `useSiteInternetCategories`  | `use-site-internet-categories.ts`  | 191    | categories                                                                            | query, toggleVisibility, updateOrder, stats, buildTree                      |
| `useProductVariants`         | `use-product-variants.ts`          | 169    | —                                                                                     | Variantes produit                                                           |
| `useUpdatePricing`           | `use-update-pricing.ts`            | 87     | channel_pricing                                                                       | Mise a jour tarification                                                    |
| `useUpdateMetadata`          | `use-update-metadata.ts`           | 75     | channel_product_metadata                                                              | Mise a jour SEO                                                             |
| `useTogglePublish`           | `use-toggle-publish.ts`            | 64     | products                                                                              | Toggle publication (page detail)                                            |
| `useProductDetail`           | `use-product-detail.ts`            | 34     | —                                                                                     | Detail produit                                                              |

---

## Tables DB Touchees par le Back-Office

| Table                      | Operations   | Usage                            |
| -------------------------- | ------------ | -------------------------------- |
| `products`                 | R, U         | Publication, prix, expedition    |
| `channel_product_metadata` | R, U, INSERT | SEO custom par canal             |
| `channel_pricing`          | R, U, INSERT | Prix HT custom par canal         |
| `sales_channels`           | R, U         | Config globale site              |
| `collections`              | R, U         | Visibilite, image, ordre         |
| `categories`               | R, U         | Visibilite menu                  |
| `order_discounts`          | R, C, U, D   | Codes promo                      |
| `order_discount_targets`   | R, C, D      | Ciblage promos                   |
| `product_reviews`          | R, U         | Moderation avis                  |
| `individual_customers`     | R            | Liste clients                    |
| `newsletter_subscribers`   | R            | Liste abonnes                    |
| `site_content`             | R, U         | CMS hero, reassurance, banner    |
| `cms_pages`                | R, U         | Pages editables                  |
| `sales_orders`             | R            | Commandes (via SalesOrdersTable) |
| `sales_order_shipments`    | R            | Suivi expedition                 |
| Storage `public/logos/`    | INSERT       | Logo site                        |

---

## Fichiers Depassant 400 Lignes (Refactoring Obligatoire)

| Fichier                    | Lignes | Priorite |
| -------------------------- | ------ | -------- |
| `ConfigurationSection.tsx` | 738    | HAUTE    |
| `OrderDetailModal.tsx`     | 495    | MOYENNE  |
| `ShippingConfigCard.tsx`   | 492    | MOYENNE  |
| `ReviewsSection.tsx`       | 491    | MOYENNE  |
| `ProductsSection.tsx`      | 488    | MOYENNE  |
| `ProductShippingCard.tsx`  | 483    | MOYENNE  |
| `page.tsx`                 | 460    | BASSE    |
| `CMSSection.tsx`           | 454    | BASSE    |
| `CategoriesSection.tsx`    | 410    | BASSE    |
| `CollectionsSection.tsx`   | 406    | BASSE    |

---

## Comparaison avec un Admin E-Commerce Standard

### Ce qui EST fait

- Publier/depublier produits (toggle + date planifiee)
- Editer meta-donnees produit par canal (SEO, prix, description marketing)
- Gerer visibilite collections et categories
- Creer/editer/supprimer codes promo (avec ciblage, dates, limites)
- Suivre et traiter commandes (workflow statuts)
- Voir clients inscrits
- Moderer avis (approuver/rejeter)
- Editer pages CMS legales (Markdown + SEO)
- Editer contenu homepage (hero, reassurance, bandeau promo)
- Configurer livraison (standard, express, gratuite, zones, couts)
- Configurer SEO global
- Configurer trackers analytics
- Uploader logo
- Voir abonnes newsletter

### Ce qui MANQUE

| Domaine     | Fonctionnalite manquante                                 | Priorite |
| ----------- | -------------------------------------------------------- | -------- |
| Dashboard   | KPIs commandes et CA dynamiques (hardcode 0)             | HAUTE    |
| Dashboard   | Graphiques tendances, alertes reelles                    | MOYENNE  |
| Clients     | Fiche client complete (historique, total depense)        | HAUTE    |
| Clients     | Filtre correct (`source_type` au lieu de `auth_user_id`) | CRITIQUE |
| Clients     | Export, segmentation, contact direct                     | MOYENNE  |
| Collections | Creer/editer/supprimer collection                        | MOYENNE  |
| Collections | Reordonnancement drag-and-drop                           | BASSE    |
| Collections | Upload image fichier (actuellement URL)                  | MOYENNE  |
| Categories  | Arborescence parent/enfant fonctionnelle                 | MOYENNE  |
| Categories  | Creer/editer/supprimer categorie                         | MOYENNE  |
| Pages CMS   | Toggle publication dans l'UI                             | HAUTE    |
| Pages CMS   | Creer nouvelle page, supprimer                           | MOYENNE  |
| Pages CMS   | Preview live du rendu                                    | BASSE    |
| Newsletter  | Export CSV, desabonnement, envoi campagne                | MOYENNE  |
| Avis        | Repondre a un avis, lien produit/client                  | BASSE    |
| Config      | Facebook Pixel sauvegarde (actuellement placeholder)     | BASSE    |
| Config      | Reseaux sociaux (Instagram, Facebook, TikTok)            | BASSE    |
| Config      | Feature toggles (wishlist, reviews, live chat)           | BASSE    |
| Commandes   | Remboursement depuis l'interface                         | MOYENNE  |
| Commandes   | Export commandes                                         | BASSE    |
| Analytics   | Tableau de bord integre (visites, conversions, CA reel)  | HAUTE    |
