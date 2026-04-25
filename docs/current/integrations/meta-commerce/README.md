# Meta Commerce — Intégration

**Source de vérité** pour l'intégration Meta Commerce (Facebook Catalog + Instagram Shopping) dans le back-office Verone.

**Dernière mise à jour** : 2026-04-25 — `[INFRA-DOC-META-001]`

---

## Vue d'ensemble

Meta Commerce est un canal de vente **dépendant du Site Internet** (voir `docs/current/canaux-vente-publication-rules.md`). Verone synchronise les produits éligibles vers le **catalogue Meta Business Manager**, qui sert ensuite Facebook Shop et Instagram Shop. La checkout est en **mode redirect** (`review_status` toujours vide côté Meta — c'est normal en Europe).

```
┌─────────────────────┐
│  Back-Office Verone │
│  /canaux-vente/meta │
└────────┬────────────┘
         │
         ├── /api/meta-commerce/* (routes HTTP)
         │
         ▼
┌─────────────────────┐         ┌──────────────────────────┐
│  Supabase Postgres  │         │  Meta Graph API v21.0    │
│  meta_commerce_syncs│◄────────┤  (Catalog + Products)    │
└─────────────────────┘         └──────────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────────────┐
                                │  Facebook Shop           │
                                │  Instagram Shop          │
                                └──────────────────────────┘
```

---

## ⚠️ État actuel (2026-04-25)

**Variables Vercel manquantes — canal non fonctionnel en production**.

`vercel env ls` (cwd `apps/back-office`) ne retourne **ni `META_ACCESS_TOKEN` ni `META_CATALOG_ID`**, alors que le code de la route `/api/meta-commerce/sync-statuses` les requiert (lignes 43-51 du fichier `route.ts` : retour HTTP 500 si absentes). Toute tentative de sync produits → Meta échoue silencieusement.

**Action requise** : ajouter les deux variables en Vercel (procédure section "Configuration" ci-dessous). Les credentials Meta n'ont pas été retrouvés dans la documentation restaurée le 2026-04-25 (`docs/restored/meta-facebook-feeds/` ne contient que les spécifications du feed, pas les tokens).

---

## Identifiants Verone (audit Playwright Business Manager 2026-04-25)

| Identifiant                  | Valeur                           | Source                                                                     |
| ---------------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| **Business Manager ID**      | `222452897164348`                | URL Business Suite, section "Portefeuille business"                        |
| **Compte commerce**          | `1011870551039929`               | Page Paramètres > Catalogue > Comptes marchands                            |
| **Meta Catalog ID**          | `1223749196006844`               | Section "Catalogues" — nom interne "Articles pour (454107991123092)"       |
| **Asset commerce ID**        | `454107991123092`                | suffixe du nom du catalogue (auto-généré)                                  |
| **Page Facebook Vérone**     | ID `461826940345802`             | Statut **Visible** dans canaux de vente                                    |
| **Compte Instagram**         | `@veronecollections`             | Statut **Visible** dans canaux de vente                                    |
| **App Meta connectée**       | `1973785847346434`               | Compte SDK Meta `romeo@veronecollections.fr`                               |
| **Domaine vérifié**          | `veronecollections.fr`           | meta tag `facebook-domain-verification` = `trojockg37hwcn77so0hup2246lqfx` |
| **System User Access Token** | À régénérer (procédure SETUP.md) | https://business.facebook.com/settings/system-users                        |

**Source du flux catalogue** : "Nouveau flux de données" — 28 éléments synchronisés en mode flux automatique (probablement feed XML/CSV depuis le site internet, à confirmer en cliquant "Gérer" sur le catalogue).

**Comptes publicitaires associés** : aucun. Le catalogue n'est pas connecté à Meta Ads — utile uniquement pour la boutique organique pour l'instant.

---

## Variables d'environnement requises

À configurer en Vercel pour les 3 environnements (Development, Preview, Production) :

| Variable            | Description                                                                                                                                       | Format                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `META_ACCESS_TOKEN` | System User Access Token avec scopes `catalog_management` + `business_management`. **Long-lived** (recommandé : sans expiration via System User). | `EAA...` (long string)                        |
| `META_CATALOG_ID`   | ID du catalogue Verone dans Meta Business Manager.                                                                                                | `1223749196006844` (cf. valeur par défaut DB) |

Les deux sont **server-side only** (pas de préfixe `NEXT_PUBLIC_`).

---

## Routes API back-office

| Route                                         | Méthode | Statut                                   | Description                                                                                                                                                             |
| --------------------------------------------- | ------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/meta-commerce/sync-statuses`            | POST    | ✅ existant                              | Pull statuses Meta → met à jour `meta_commerce_syncs.meta_status` (mappe `review_status` Meta `approved/pending/rejected/""` vers notre enum `active/pending/rejected`) |
| `/api/meta-commerce/products/[id]/visibility` | PATCH   | ✅ créé par `[BO-API-PUB-001]` (PR #762) | Toggle visibility produit. Guard 422 si `products.is_published_online = false` (Meta dépend du Site Internet)                                                           |
| `/api/meta-commerce/products/[id]`            | DELETE  | ✅ créé par `[BO-API-PUB-001]` (PR #762) | Soft delete via RPC `remove_from_meta_commerce`                                                                                                                         |

Routes manquantes (à créer dans un sprint dédié si besoin) :

- `POST /api/meta-commerce/products/batch-add` — symétrique de Google Merchant batch-add
- `PATCH /api/meta-commerce/products/[id]/price` — update prix
- `PATCH /api/meta-commerce/products/[id]/metadata` — update méta-données

Les RPCs Supabase équivalentes existent déjà côté DB (`batch_add_meta_commerce_products`, `update_meta_commerce_price`, `update_meta_commerce_metadata`) — il suffit de wrapper en HTTP.

---

## Tables DB

### `meta_commerce_syncs`

| Colonne                                              | Type            | Description                                             |
| ---------------------------------------------------- | --------------- | ------------------------------------------------------- |
| `id`                                                 | uuid            | PK                                                      |
| `product_id`                                         | uuid            | FK products                                             |
| `catalog_id`                                         | text            | Default `1223749196006844`                              |
| `meta_product_id`                                    | text            | ID retailer côté Meta (= notre SKU)                     |
| `sync_status`                                        | text            | `pending` / `synced` / `error` / `removed` (état local) |
| `sync_operation`                                     | text            | `insert` / `update` / `remove` / `toggle_visibility`    |
| `meta_status`                                        | text            | `active` / `pending` / `rejected` (état Meta)           |
| `meta_status_detail`                                 | jsonb           | Détails erreurs Meta                                    |
| `impressions`, `clicks`, `conversions`, `revenue_ht` | numeric/integer | Analytics                                               |
| `meta_status_checked_at`, `synced_at`                | timestamptz     | Timestamps                                              |
| `error_message`, `response_data`                     | text/jsonb      | Debug                                                   |

### RPCs Supabase

- `toggle_meta_commerce_visibility(p_product_id uuid, p_visible boolean)` — flip statut
- `remove_from_meta_commerce(p_product_id uuid)` — soft delete
- `batch_add_meta_commerce_products(...)` — ajout en lot
- `update_meta_commerce_price(...)` — update prix
- `update_meta_commerce_metadata(...)` — update meta
- `get_meta_commerce_products(...)` — fetch produits synced (utilisé par `useMetaCommerceProducts`)
- `get_meta_eligible_products(...)` — fetch produits éligibles (publiés sur SI)
- `get_meta_commerce_stats(...)` — KPIs canal
- `get_meta_sync_records_for_status_update(...)` — utilisé par `sync-statuses`
- `update_meta_sync_status(...)` — utilisé par `sync-statuses`

---

## Hooks consommateurs (apps)

Tous dans `packages/@verone/channels/src/hooks/meta/` :

- `useMetaCommerceProducts` — liste produits synced
- `useMetaEligibleProducts` — liste produits éligibles (publiés SI)
- `useToggleMetaVisibility` — appelle directement la RPC (note : à migrer vers la route HTTP `PATCH /api/meta-commerce/products/[id]/visibility` créée dans PR #762 pour bénéficier du guard cascade)
- `useRemoveFromMeta` — appelle directement la RPC (idem, à migrer vers `DELETE /api/meta-commerce/products/[id]`)
- `useUpdateMetaPrice` — appelle RPC `update_meta_commerce_price`
- `useUpdateMetaMetadata` — appelle RPC `update_meta_commerce_metadata`
- `useAddProductsToMeta` — appelle RPC `batch_add_meta_commerce_products`
- `rpc-helper.ts` — wrapper d'appel RPC

---

## Page back-office

`apps/back-office/src/app/(protected)/canaux-vente/meta/page.tsx` (note : le chemin est `meta`, pas `meta-commerce`).

Structure :

- Tabs `synced` / `add` (identique Google Merchant)
- Liste produits synced + leur `meta_status`
- Liste produits éligibles à ajouter au catalogue Meta

---

## URL produit publique

Pour un produit synchronisé, l'URL Facebook Shop est de la forme :

```
https://www.facebook.com/commerce/products/[meta_product_id]/
```

Le `meta_product_id` est stocké dans `meta_commerce_syncs.meta_product_id` (rempli après sync via Graph API).

---

## Voir aussi

- `docs/current/canaux-vente-publication-rules.md` — règle cascade Site → Google + Meta
- `docs/current/INDEX-CANAUX-VENTE.md` — sommaire canaux
- `docs/current/integrations/meta-commerce/SETUP.md` — procédure de configuration
- `docs/restored/meta-facebook-feeds/feeds-specifications-facebook.md` — spécifications du feed (note : visible après merge de PR #762)
- Documentation Meta : https://developers.facebook.com/docs/marketing-api/catalog
- Business Manager : https://business.facebook.com/
- Graph API Explorer : https://developers.facebook.com/tools/explorer
