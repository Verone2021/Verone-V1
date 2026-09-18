# Best practices descriptions multi-canal — Recherche externe

**Date** : 2026-04-20
**Complément à** : `audit-descriptions-multicanal-2026-04-20.md` (audit interne code + DB)
**Question Romeo** : comment font les pros (Pimcore, Akeneo, Shopify, Etsy, Google Merchant, Meta, Le Bon Coin) ? Son modèle "description unique + override Etsy/LeBonCoin" est-il juste ?

---

## 1. Ce que disent les plateformes (sources officielles)

### Google Merchant Center (doc Google)

- Description **obligatoire**, 1 à 5000 caractères.
- La doc ne demande **PAS** un match mot-à-mot avec la landing page.
- Exigence : la description **doit décrire le même produit** que la landing page (titre, caractéristiques, matériau, taille, prix cohérents).
- Si un flag "Different product landing page" est levé, c'est parce que le produit affiché sur la landing page diffère du produit envoyé dans le feed, pas parce que la description est différente.

**Conséquence Vérone** : le feed `/api/feeds/products.xml` peut tout à fait envoyer `products.description` tel quel — aucune raison d'avoir un override.

### Meta Commerce Catalog (Facebook + Instagram + WhatsApp)

- Description 30-5000 caractères (9999 en feed).
- Plain text par défaut, ou champ optionnel `rich_text_description` pour le HTML.
- Doit correspondre au produit (titre + image + description cohérents).
- Aucune exigence d'override par rapport au site-internet — Meta pointe vers le site pour la conversion.

**Conséquence Vérone** : même conclusion que Google. Aucun override.

### Etsy API v3

- La description est stockée dans `listings.description`.
- **Etsy a des champs SPÉCIFIQUES** qu'aucun autre canal n'a : `who_made` (I_did / someone_else / collective), `when_made`, `what_is_it`, `materials`, `recipient`, `occasion`, `production_partners`.
- Les outils tiers (CedCommerce, LitCommerce, Salestio) permettent d'écrire une description Etsy **différente** du site → utile pour le SEO Etsy (ton plus artisanal, mots-clés marketplace).

**Conséquence Vérone** : le jour où on intègre Etsy, il faudra **plus qu'un champ description custom** — il faudra une table pour stocker les champs spécifiques Etsy. C'est ce que la table `channel_product_metadata` pourrait faire **quand le moment viendra**. Pas besoin de prévoir aujourd'hui.

### Le Bon Coin Pro

- **Aucune API publique officielle en 2026**. Le Bon Coin ne publie pas d'API pour les comptes pro.
- Seuls des scrapers tiers / agrégateurs existent, tous **non officiels** et avec risque juridique (CNIL a sanctionné Nestor 20 k€ et KASPR 200 k€ pour scraping).

**Conséquence Vérone** : si un jour tu veux vendre sur Le Bon Coin, tu devras saisir **manuellement** dans leur back-office Pro. Aucune colonne DB à prévoir côté nous.

## 2. Ce que disent les pros du PIM

Sources : Pimcore, Akeneo (implicite), Stibo Systems, inRiver, WisePim, Multishoring.

**Les 4 règles qui reviennent dans toutes les docs** :

1. **Single Source of Truth** : une seule table produit mère, pas de duplication.
2. **Channel-specific enrichment** possible **mais jamais par défaut** : un override se justifie par une exigence du canal (SEO Etsy, longueur limite TikTok, ton B2B vs B2C), pas par facilité.
3. **Fallback systématique** : quand le canal n'a pas d'override, il lit le master.
4. **Pas d'override préventif** : on ajoute une colonne custom le jour où on en a besoin, pas "au cas où".

Stibo Systems : _« Centralize data in a PIM to ensure all distribution channels use the same, always up-to-date information, eliminating inconsistencies that can harm customer experience and brand image »_.

Pimcore : _« Publication channel-specifically, up to near-real-time updates »_ — mais sur la base d'un master unique.

## 3. Critique honnête du modèle Romeo

Romeo a proposé :

> « Par défaut description produit mère partout, override possible sur Etsy / Le Bon Coin, pas sur Meta/Google qui sont miroirs. »

### Ce qui est juste ✅

- **Source unique par défaut** = conforme best practice PIM.
- **Google Merchant + Meta = miroirs du site-internet** = confirmé par leurs policies officielles (ils pointent vers la landing page).
- **Etsy mérite des overrides** = confirmé (SEO spécifique + champs obligatoires uniques).

### Ce qui est à nuancer ⚠️

- **Etsy n'est pas juste un override de description** : c'est un ensemble de champs spécifiques (`who_made`, `materials`, `recipient`, etc.). Si on intègre Etsy un jour, on aura besoin d'une **table d'extension** (`channel_product_metadata` peut servir), pas juste `custom_description_etsy`.
- **Le Bon Coin n'a pas d'API** → saisie manuelle. **Aucune colonne DB à prévoir** pour ce canal. Si tu veux vendre là-bas, c'est copier-coller à la main dans leur admin pro.
- **LinkMe est différent des marketplaces externes** : c'est un canal B2B interne Vérone. L'affilié vend au même client final que le site. Donc la description vue doit être la même que le site. Sauf les `selling_points` (100 % utilisés en prod) → garder.

### Ce qui est faux 🟥 (à corriger)

- **Ne PAS prévoir aujourd'hui des colonnes `custom_description_etsy` / `custom_description_leboncoin`** au prétexte qu'on les aura peut-être un jour. Les pros PIM disent l'inverse : on ajoute le jour où on a besoin (principe YAGNI "You Aren't Gonna Need It"). Sinon on recrée exactement le code mort qu'on est en train de supprimer.

## 4. Recommandation affinée (après recherche externe)

La reco de l'audit interne précédent est **confirmée et renforcée** :

| Action                                                                                                                                                                                                                                          | Raison                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ✅ Supprimer 8 colonnes `custom_*` mortes (channel_pricing, channel_product_metadata, linkme_selection_items)                                                                                                                                   | 0 % d'usage prod + pas de best practice qui les justifie                                                       |
| ✅ Garder `channel_product_metadata.custom_selling_points`                                                                                                                                                                                      | 100 % utilisé par LinkMe + pratique courante (les affiliés B2B ajustent les selling points pour leurs clients) |
| ✅ Simplifier les 2 RPC (site-internet + LinkMe)                                                                                                                                                                                                | Cohérence avec le master                                                                                       |
| ✅ Corriger les 2 bugs (COALESCE LinkMe + init state site-internet)                                                                                                                                                                             | Indépendant du reste                                                                                           |
| 🟥 **NE PAS** créer de nouvelles colonnes custom pour Etsy / Le Bon Coin                                                                                                                                                                        | YAGNI. On les ajoute le jour où on intègre ces canaux.                                                         |
| 🟨 **À prévoir pour plus tard** : la table `channel_product_metadata` comme table d'extension générique pour canaux qui exigent des champs spécifiques (Etsy `who_made`, etc.) — structure déjà posée, on ajoutera les colonnes le moment venu. |

## 5. Pour la fiche produit

**Onglet Descriptions** = **seule UI d'édition**. Description + technical_description + selling_points + meta_title + meta_description + slug.

**Pages `/canaux-vente/*/produits/[id]`** :

- Descriptions affichées en **lecture seule** (héritées de la fiche produit).
- Champs spécifiques au canal uniquement : prix, `is_active`, `is_public_showcase`, `is_featured`, `display_order`.
- LinkMe : `custom_selling_points` éditable + bouton "Revenir aux selling points du produit".

**Boutons publier / dépublier** dans la fiche produit :

- Site-internet : toggle `is_published_online` sur `products`.
- LinkMe : toggle `channel_pricing.is_active` pour le canal LinkMe.
- Google Merchant / Meta : lecture seule, miroirs du site (rien à publier séparément — le feed XML s'auto-publie).
- Etsy / Le Bon Coin / autres futurs : quand tu intègres, tu décideras (API Etsy = bouton, Le Bon Coin = saisie manuelle donc pas de bouton).

## 6. Effort & risque — inchangé

- 1 jour de dev (migration DROP + RPC + UI nettoyage + 2 fix bugs).
- Risque quasi nul (0 ligne custom non-NULL à migrer, feed Google + page produit pointent déjà sur le fallback).

## 7. Verdict

Le modèle Romeo est **80 % correct**, à ajuster sur un point :

- **Retirer** l'idée de prévoir des colonnes custom pour des canaux pas encore intégrés (YAGNI).
- **Ajouter** la reconnaissance qu'Etsy nécessitera plus qu'un override (table d'extension).
- **Confirmer** que Le Bon Coin = saisie manuelle, aucune colonne DB à prévoir.

Le reste de son raisonnement correspond exactement à ce que font Pimcore, Akeneo, Shopify + ce qu'exigent les policies Google Merchant / Meta. L'audit interne et la recherche externe convergent.

## Sources

- [Google Merchant Center description attribute](https://support.google.com/merchants/answer/6324468)
- [Google Merchant landing page requirements](https://support.google.com/merchants/answer/4752265)
- [Google Merchant "different product landing page" error](https://support.google.com/merchants/answer/13640287)
- [Meta Commerce Catalog product description specs](https://www.facebook.com/business/help/2302017289821154)
- [Meta Product data specifications for catalogs](https://www.facebook.com/business/help/120325381656392)
- [Etsy Open API v3 Listings Tutorial](https://developer.etsy.com/documentation/tutorials/listings/)
- [Etsy listingProduct reference](https://www.etsy.com/developers/documentation/reference/listingproduct)
- [Le Bon Coin API — guide 2026 (pas d'API officielle)](https://stream.estate/fr/guides/leboncoin-api)
- [Pimcore Multichannel Publishing](https://pimcore.com/en/products/product-information-management/multichannel-publishing)
- [Stibo Systems — PLP best practices](https://www.stibosystems.com/blog/product-listing-page-best-practices-create-better-listings-with-pim)
- [inRiver — Multichannel Retail guide](https://www.inriver.com/resources/guide-to-multichannel-retail/)
- [Multishoring — Multi-channel PIM](https://multishoring.com/blog/multi-channel-e-commerce-excellence-how-pim-ensures-consistent-product-data-everywhere-2/)
- [Shopify Sales Channels help](https://help.shopify.com/en/manual/online-sales-channels)
- [Shopify Channel Management guide 2026](https://www.shopify.com/blog/channel-management)
