# Audit Database Site Internet

_Date : 12 avril 2026 | Branche : feat/BO-SI-001-site-internet-sprint1-3_

---

## Resume

| Table                  | Rows          | Exclusive site | Verdict | Probleme principal                                  |
| ---------------------- | ------------- | -------------- | ------- | --------------------------------------------------- |
| individual_customers   | 20            | Non (partagee) | WARNING | RLS SELECT manquante client connecte                |
| order_discounts        | 0             | Oui            | WARNING | RLS SELECT trop permissive                          |
| order_discount_targets | 0             | Oui            | OK      | —                                                   |
| promotion_usages       | 0             | Oui            | WARNING | RLS expose tous usages + pas trigger current_uses   |
| cms_pages              | 5             | Oui            | WARNING | Pas trigger updated_at, pas created_at              |
| wishlist_items         | 0             | Oui            | OK      | RLS correcte                                        |
| site_content           | 3             | Oui            | OK      | Trigger updated_at manquant (mineur)                |
| newsletter_subscribers | 0             | Oui            | WARNING | Pas self-unsubscribe, pas lien individual_customers |
| shopping_carts         | 3             | Oui            | OK      | Architecture flat correcte                          |
| product_reviews        | 0             | Oui            | WARNING | status TEXT (devrait ENUM), pas CHECK rating        |
| customer_addresses     | 0             | Oui            | WARNING | FK auth.users manquante                             |
| sales_orders           | 159           | Non (partagee) | WARNING | Pas RLS SELECT client site-internet                 |
| sales_order_items      | 489           | Non (partagee) | WARNING | Idem sales_orders                                   |
| products               | 231 (18 pub.) | Non (partagee) | OK      | Acces via RPC SECURITY DEFINER                      |
| collections            | 3 (2 pub.)    | Non (partagee) | OK      | RLS publique correcte                               |
| collection_products    | 9             | Non (partagee) | OK      | —                                                   |
| sales_channels         | 5             | Non (partagee) | OK      | —                                                   |

---

## Tables Exclusives Site Internet

### individual_customers

**Role** : Clients particuliers (multi-source : back-office, site-internet, LinkMe)
**Rows** : 20

**Colonnes cles** :

- `id` uuid PK
- `first_name`, `last_name` text NOT NULL
- `email` text UNIQUE
- `phone` text
- `address_line1/2`, `postal_code`, `city`, `region`, `country` (default 'France')
- `billing_*` (adresse facturation separee)
- `has_different_billing_address` boolean (default false)
- `auth_user_id` uuid UNIQUE — lien auth.users (pas de FK formelle)
- `source_type` ENUM customer_source_type (default 'internal') — **cle de differentiation multi-app**
- `source_affiliate_id` uuid FK linkme_affiliates
- `enseigne_id` uuid FK enseignes
- `organisation_id` uuid FK organisations
- `is_active` boolean (default true)
- `accepts_marketing` boolean (default false)
- `language_preference` text (default 'fr')
- `created_at`, `updated_at`

**Index** : 11 index (UNIQUE email, UNIQUE auth_user_id, index source_type, is_active, city, name)

**RLS** : 3 policies

- `backoffice_full_access` — ALL staff
- `insert_self` — INSERT authenticated (tout user peut creer sa fiche)
- `linkme_users_read` — SELECT affilies LinkMe

> **MANQUE** : Policy SELECT `WHERE auth_user_id = (SELECT auth.uid())` pour que le client connecte puisse lire SA propre fiche.

**Trigger** : `updated_at` auto-update

---

### order_discounts

**Role** : Codes promo et reductions automatiques
**Rows** : 0

**Colonnes cles** :

- `id` uuid PK
- `code` varchar UNIQUE (nullable pour promos auto)
- `name` varchar NOT NULL
- `discount_type` varchar NOT NULL ('percentage', 'fixed')
- `discount_value` numeric NOT NULL
- `min_order_amount`, `max_discount_amount` numeric
- `applicable_channels` ARRAY (ex: `['site-internet']`)
- `valid_from`, `valid_until` date NOT NULL
- `max_uses_total`, `max_uses_per_customer` integer
- `current_uses` integer (default 0)
- `is_active` boolean (default true)
- `requires_code` boolean (default false)
- `is_automatic` boolean (default false)
- `is_combinable` boolean (default false)
- `exclude_sale_items` boolean (default false)
- `target_type` text (default 'all') — 'all', 'products', 'collections'
- `created_at`, `updated_at`

**RLS** : 2 policies

- `backoffice_full_access` — ALL staff
- `select_authenticated` — SELECT `USING (true)` — **trop permissive**

> **PROBLEME** : Tout utilisateur authentifie voit TOUS les codes (actifs ET inactifs/expires). Devrait filtrer `is_active = true AND valid_until >= current_date`.

---

### order_discount_targets

**Role** : Ciblage promos (produit specifique, collection)
**Rows** : 0

**Colonnes** : `id`, `discount_id` FK, `target_type` text ('product', 'collection'), `target_id` uuid, `created_at`

**Index** : discount_id, composite (target_type, target_id)

**RLS** : staff ALL + authenticated SELECT `USING (true)` (meme probleme que order_discounts)

---

### promotion_usages

**Role** : Tracking utilisation promos
**Rows** : 0

**Colonnes** : `id`, `discount_id` FK, `order_id` FK, `customer_id` FK, `discount_amount` numeric, `used_at`

**Contrainte** : UNIQUE (discount_id, order_id)

**RLS** : 3 policies

- staff ALL
- SELECT `USING (true)` — **expose tous les usages a tout authenticated**
- INSERT `WITH CHECK (true)` — **tout authenticated peut inserer**

> **CRITIQUE** : INSERT sans restriction = fraude possible. SELECT expose donnees des autres clients.

---

### cms_pages

**Role** : Pages CMS editables (CGV, FAQ, mentions, etc.)
**Rows** : 5

**Colonnes** : `id`, `slug` text UNIQUE, `title`, `content` (default ''), `meta_title`, `meta_description`, `is_published` boolean, `updated_at`, `updated_by` uuid

**RLS** :

- `public_read_published` — SELECT anon+authenticated WHERE `is_published = true`
- `staff_full_access` — ALL staff

> **MANQUE** : `created_at`, trigger `updated_at`, FK sur `updated_by`.

---

### wishlist_items

**Role** : Favoris produits
**Rows** : 0

**Colonnes** : `id`, `user_id` uuid, `product_id` uuid FK products, `created_at`

**Contrainte** : UNIQUE (user_id, product_id)

**RLS** : 4 policies (correctes)

- SELECT own (`user_id = auth.uid()`)
- INSERT own
- DELETE own
- staff SELECT all

> **MANQUE** : FK formelle `user_id → auth.users(id) ON DELETE CASCADE`.

---

### site_content

**Role** : Blocs CMS JSONB (hero, banner, reassurance)
**Rows** : 3

**Colonnes** : `id`, `content_key` text UNIQUE, `content_value` jsonb, `updated_at`, `updated_by`

**RLS** :

- `public_read` — SELECT `USING (true)` (tout le monde, anon inclus)
- `staff_manage` — ALL staff

**Verdict** : OK

---

### newsletter_subscribers

**Role** : Abonnes newsletter
**Rows** : 0

**Colonnes** : `id`, `email` text UNIQUE, `source` text (default 'site-internet'), `is_active` boolean, `subscribed_at`, `unsubscribed_at`

**RLS** :

- `anon_insert` — INSERT (inscription anonyme)
- `staff_read` — ALL staff

> **MANQUE** : Policy UPDATE pour self-unsubscribe. Pas de lien avec `individual_customers.accepts_marketing`.

---

### shopping_carts

**Role** : Panier (architecture flat — 1 row = 1 article)
**Rows** : 3

**Colonnes** : `id`, `user_id` uuid, `session_id` text, `product_id` FK, `variant_group_id` FK, `quantity` integer, `include_assembly` boolean, `customer_email`, `abandoned_cart_email_sent_at`, `created_at`, `updated_at`

**Contraintes** : UNIQUE (session_id, product_id), UNIQUE (user_id, product_id)

**RLS** : 9 policies (complet) — anon via session_id, authenticated via user_id, staff ALL

**Verdict** : OK

---

### product_reviews

**Role** : Avis produits avec moderation
**Rows** : 0

**Colonnes** : `id`, `product_id` FK, `user_id`, `author_name`, `rating` integer, `title`, `comment`, `status` text (default 'pending'), `created_at`, `updated_at`

**RLS** : 4 policies (correctes — public read approved, user insert own, staff moderate)

> **MANQUE** : `status` devrait etre ENUM. Pas de CHECK sur rating (1-5). Pas de UNIQUE (user_id, product_id).

---

### customer_addresses

**Role** : Carnet d'adresses clients
**Rows** : 0

**Colonnes** : `id`, `user_id`, `label`, `first_name`, `last_name`, `address`, `postal_code`, `city`, `country`, `phone`, `is_default` boolean, `created_at`, `updated_at`

**RLS** : 2 policies

- `users_own_addresses` — ALL `WHERE auth.uid() = user_id`
- `staff_read` — SELECT staff

> **MANQUE** : FK `user_id → auth.users`. Pas de contrainte UNIQUE `is_default` par user.

---

## Fonctions/RPC Site Internet

| Fonction                                    | Type                   | Role                                                                            |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| `get_site_internet_products()`              | SECURITY DEFINER       | Catalogue produits publies (prix, images, eligibilite). Bypass RLS. Acces anon. |
| `get_site_internet_product_detail(uuid)`    | FUNCTION               | Detail produit + variantes JSON                                                 |
| `get_site_internet_collections()`           | FUNCTION               | Collections publiees avec images, prix min/max                                  |
| `get_site_internet_collection_detail(text)` | FUNCTION               | Detail collection + produits                                                    |
| `get_site_internet_config()`                | FUNCTION               | Config canal site-internet                                                      |
| `get_archived_site_internet_products()`     | FUNCTION               | Produits archives (back-office)                                                 |
| `handle_site_internet_signup()`             | TRIGGER (auth.users)   | Auto-creation individual_customer a l'inscription                               |
| `notify_backoffice_on_site_sales_order()`   | TRIGGER (sales_orders) | Notification back-office nouvelle commande                                      |

> **BUG CRITIQUE** : `get_site_internet_collection_detail` utilise `p.cost_price` au lieu de `channel_pricing.custom_price_ht` — **prix fournisseur expose au client**.

---

## Canal Site Internet dans sales_channels

- **ID** : `0c2639e9-df80-41fa-84d0-9da96a128f7f`
- **Code** : `site_internet`
- **Config JSONB** : shipping (standard, express, gratuite, zones), SEO, analytics, contact

---

## Migrations Site Internet (chronologie)

| Date       | Migration                                  | Ce qu'elle fait                       |
| ---------- | ------------------------------------------ | ------------------------------------- |
| 2026-03-17 | `create_shopping_carts`                    | Table panier                          |
| 2026-03-17 | `create_site_orders_table`                 | Table site_orders (droppee plus tard) |
| 2026-03-17 | `create_newsletter_subscribers`            | Table newsletter                      |
| 2026-03-18 | `create_wishlist_items`                    | Table favoris (v1)                    |
| 2026-03-18 | `create_product_reviews`                   | Table avis                            |
| 2026-03-18 | `create_site_content`                      | Table CMS                             |
| 2026-03-18 | `create_site_contact_messages`             | Table messages contact                |
| 2026-03-18 | `add_style_to_site_internet_rpc`           | RPC catalogue avec style              |
| 2026-03-18 | `add_color_to_site_internet_rpc`           | RPC catalogue avec couleur            |
| 2026-03-21 | `site_orders_to_sales_orders`              | Migration site_orders → sales_orders  |
| 2026-03-21 | `fix_triggers_skip_site_internet`          | Triggers stock ignorent site-internet |
| 2026-03-31 | `add_stock_status_to_site_internet_rpc`    | Stock dans RPC catalogue              |
| 2026-04-12 | `promotion_system_upgrade`                 | Tables promo + colonnes sales_orders  |
| 2026-04-12 | `auto_create_customer_on_signup`           | Trigger signup (v1, ecrasee)          |
| 2026-04-12 | `add_auth_user_id_to_individual_customers` | auth_user_id + trigger signup (v2)    |
| 2026-04-12 | `create_wishlist_items`                    | Table favoris (v2, recree)            |
| 2026-04-12 | `create_cms_pages`                         | Table CMS pages + seed 5 pages        |

---

## Architecture Multi-App : Comment les Clients sont Differencies

```
auth.users (partage)
    |
    |-- user_app_roles (app = 'back-office' | 'linkme')
    |
    |-- individual_customers
            |-- source_type = 'internal'     → Client cree en back-office
            |-- source_type = 'site-internet' → Client inscrit sur le site
            |-- source_type = 'linkme'        → Client cree via LinkMe
            |-- auth_user_id (UNIQUE)         → Lien vers auth.users
```

**Regle** : Un meme email peut avoir un profil `individual_customers` avec `source_type = 'site-internet'` ET un role `user_app_roles` pour LinkMe. La differentiation est par `source_type`, PAS par `auth_user_id`.

**Le filtre correct pour les clients site-internet est** : `source_type = 'site-internet'`
