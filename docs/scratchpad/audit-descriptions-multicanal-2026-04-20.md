# Audit — Descriptions multi-canal (LinkMe / site-internet / produit mère)

**Date** : 2026-04-20
**Question Romeo** : faut-il abandonner les descriptions custom par canal de vente, ou garder un système d'override non-destructif ?

---

## 1. Cartographie DB — où les descriptions sont stockées

| Table                      | Colonne                          | Lignes totales | Non-NULL en prod |      % usage | UI active ?             |
| -------------------------- | -------------------------------- | -------------: | ---------------: | -----------: | ----------------------- |
| `products`                 | `description`                    |           ~550 |              ~30 |          5 % | ✅ Fiche produit        |
| `products`                 | `technical_description`          |           ~550 |              ~15 |          3 % | ✅ Modale site-internet |
| `products`                 | `selling_points` (jsonb)         |           ~550 |             ~100 |         18 % | ✅ Modale site-internet |
| `products`                 | `meta_title`, `meta_description` |           ~550 |              ~50 |          9 % | ✅ Modale site-internet |
| `channel_pricing`          | `custom_title`                   |            109 |            **0** |      **0 %** | ⚠️ UI orpheline         |
| `channel_pricing`          | `custom_description`             |            109 |            **0** |      **0 %** | ⚠️ UI orpheline         |
| `channel_pricing`          | `custom_selling_points`          |            109 |            **0** |      **0 %** | ⚠️ UI orpheline         |
| `channel_product_metadata` | `custom_title`                   |             21 |            **0** |      **0 %** | ⚠️ UI orpheline         |
| `channel_product_metadata` | `custom_description`             |             21 |            **0** |      **0 %** | ⚠️ UI orpheline         |
| `channel_product_metadata` | `custom_description_long`        |             21 |            **0** |      **0 %** | ⚠️ UI orpheline         |
| `channel_product_metadata` | `custom_technical_description`   |             21 |            **0** |      **0 %** | ⚠️ UI orpheline         |
| `channel_product_metadata` | `custom_selling_points`          |             21 |           **21** | **100 %** ✅ | ✅ LinkMe catalog       |
| `linkme_selection_items`   | `custom_description`             |             45 |            **0** |      **0 %** | ⚠️ Jamais implémentée   |
| `linkme_selections`        | `description`                    |              2 |                1 |         50 % | ✅ UI minimaliste       |

**Diagnostic** : 9 colonnes sur 10 custom sont inutilisées en prod. Seule exception = `channel_product_metadata.custom_selling_points` (100 % utilisé par LinkMe).

## 2. Qui écrit quoi (grep des UPDATE/UPSERT)

**Site-internet** (écrit dans `channel_product_metadata`) :

- `EditSiteInternetProductModal/useEditSiteInternetProduct.ts:184-190` → upsert custom_title, custom_description, custom_description_long, custom_technical_description, custom_brand, custom_selling_points
- `produits/[id]/components/ProductInfoSection.tsx:26-32` → state pour les mêmes champs

**LinkMe** (écrit dans `channel_pricing`) :

- `canaux-vente/linkme/components/ProductInfoCard.tsx:43-58` → state custom_title, custom_description, custom_selling_points
- `canaux-vente/linkme/hooks/catalog/use-catalog-metadata.ts:57` → useMutation update

**Catalogue produit** (écrit dans `products`) :

- `_components/product-descriptions-tab.tsx` → description, technical_description, selling_points, meta_title, meta_description
- `_components/ProductModals.tsx` (ProductDescriptionsModal)

**Pas de trigger DB** qui synchronise `products.description` → `channel_pricing.custom_description` (contrairement aux prix qui sont sync via `sync_channel_pricing_to_selections`).

## 3. Qui lit quoi côté public

| Consommateur                                       | Source lue                                                 | Formule                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| Feed Google Merchant (`products.xml`)              | RPC `get_site_internet_products()` ligne 47-50             | `COALESCE(cpm.custom_description_long, p.description)` ✅ fallback correct |
| Page produit `veronecollections.fr/produit/[slug]` | Même RPC                                                   | Idem ✅                                                                    |
| LinkMe sélections publiques                        | RPC `get_linkme_catalog_products_for_affiliate()` ligne 76 | `cp.custom_selling_points` brut — **❌ pas de fallback**                   |
| Back-office LinkMe catalog                         | `fetchers-list.ts:49` + `fetchers-detail.ts:172`           | Fallback en TS côté client                                                 |

**Deux bugs identifiés** :

1. **RPC LinkMe** (`supabase/migrations/20251208_002_fix_linkme_catalog_rpc.sql:76`) : retourne `cp.custom_selling_points` sans `COALESCE` → affiliés voient un array vide si le produit n'a pas de custom, alors que `products.selling_points` existe peut-être.

2. **ProductInfoSection site-internet** (`ProductInfoSection.tsx:27`) : initialise `custom_description_long: ''` au lieu de `product.description`. Admin qui ouvre la modale voit un champ vide trompeur.

## 4. Workflow actuel end-to-end

1. Admin crée produit dans `/produits/catalogue/nouveau` → saisit `description` dans `products`
2. Admin va sur `/canaux-vente/site-internet/produits/[id]` → peut saisir un `custom_description_long` qui écrase au niveau canal
3. Sur `veronecollections.fr` : s'affiche `custom_description_long` si rempli, sinon `products.description`
4. Pour LinkMe : admin édite sur `/canaux-vente/linkme/catalogue/[id]` → écrit dans `channel_pricing.custom_*` (99 % des champs jamais utilisés) ou `channel_product_metadata.custom_selling_points` (100 % utilisé)

**Constat** : 0 des 30 produits publiés site-internet ont un `custom_description_long`. Tout passe par le fallback `products.description`. L'UI custom est du code mort.

## 5. Recommandation — Option A : Supprimer les colonnes mortes

Seuil « < 5 % d'usage → supprimer » franchi largement (0 % partout sauf 1 exception).

### À supprimer via migration DROP

```sql
-- Table channel_pricing
ALTER TABLE channel_pricing
  DROP COLUMN custom_title,
  DROP COLUMN custom_description,
  DROP COLUMN custom_selling_points;

-- Table channel_product_metadata
ALTER TABLE channel_product_metadata
  DROP COLUMN custom_title,
  DROP COLUMN custom_description,
  DROP COLUMN custom_description_long,
  DROP COLUMN custom_technical_description;

-- Table linkme_selection_items
ALTER TABLE linkme_selection_items
  DROP COLUMN custom_description;
```

### À GARDER

- `channel_product_metadata.custom_selling_points` → 100 % utilisé par LinkMe catalog. Le conserver + ajouter bouton "Revenir aux selling points produit" qui set NULL.
- `linkme_selections.description` → UI minimaliste fonctionnelle (1/2 utilisé), à garder.
- `products.description / technical_description / selling_points / meta_*` → source de vérité unique.

### RPC à simplifier

- `get_site_internet_products()` : remplacer `COALESCE(cpm.custom_description_long, p.description)` par `p.description` tout court
- `get_linkme_catalog_products_for_affiliate()` : garder le fallback mais ajouter le COALESCE correct sur selling_points (fix du bug identifié)

### UI à nettoyer

- `EditSiteInternetProductModal` : retirer les champs custom\_\* (garder uniquement edit qui écrit dans `products`)
- `canaux-vente/site-internet/produits/[id]/ProductInfoSection` : idem, lecture seule avec lien vers la fiche produit mère
- `canaux-vente/linkme/components/ProductInfoCard` : garder uniquement l'édit de `custom_selling_points` + bouton "Revenir aux defaults"

## 6. Impact estimé

| Aspect                                 | Effort         | Risque                                                    |
| -------------------------------------- | -------------- | --------------------------------------------------------- |
| Migration DB DROP 8 colonnes           | S (10 min)     | **Zéro** (0 lignes non-NULL à migrer)                     |
| 2 RPC à simplifier                     | S (30 min)     | **Zéro** (résultat identique, 100 % fallback aujourd'hui) |
| UI site-internet (retirer édit custom) | M (2-3 h)      | Bas (code mort)                                           |
| UI LinkMe (garder selling_points)      | S (30 min)     | Bas                                                       |
| Tests e2e + screenshots                | M (2 h)        | —                                                         |
| **Total**                              | **1 jour dev** | **Très bas**                                              |

## 7. Bugs à corriger en même temps

1. **RPC LinkMe COALESCE manquant** sur `custom_selling_points` — affiliés voient vide au lieu des défauts produit.
2. **Init state `ProductInfoSection` site-internet** — champ vide trompeur.

## 8. Conséquence pour la fiche produit unifiée

Après suppression :

- **Onglet Descriptions** de la fiche produit (`/produits/catalogue/[id]`) = **source unique** de toute description, technical, selling points, meta.
- Pages `/canaux-vente/site-internet/produits/[id]` et `/canaux-vente/linkme/catalogue/[id]` deviennent des vues **spécifiques au canal** : prix, publication, visibilité — plus de double UI d'édition de description.
- Publication bouton direct possible depuis la fiche produit (pas besoin d'aller sur la page canal-vente pour rien).

Cela simplifie exactement ce que Romeo demandait : « le but est de simplifier visuellement et d'avoir le moins de redondance possible ».

## 9. Résumé en 3 lignes

1. **0 sur 109 descriptions custom par canal sont utilisées en prod.** C'est du code mort.
2. **Garder** uniquement `channel_product_metadata.custom_selling_points` (100 % LinkMe) + corriger 2 bugs.
3. **Supprimer** 8 colonnes custom\_\* + simplifier 2 RPC + nettoyer 5-6 composants UI. Effort : 1 jour dev. Risque : quasi nul.
