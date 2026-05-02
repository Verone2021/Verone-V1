# Audit factuel — Marques internes, canaux de vente, distinction images

**Date** : 2026-04-30
**Statut** : Audit factuel verrouillé — source de vérité pour Phase 1+
**Pour** : Claude Code + dev-agent (lecture OBLIGATOIRE avant tout code)

> Cet audit annule et remplace les présuppositions des documents antérieurs. Toute proposition d'architecture doit s'appuyer sur les faits ci-dessous, citation des fichiers à l'appui.

---

## 1. Concept de "marque" — état réel

### Ce qui existe en DB

- **Table `enseignes`** (depuis 2025-12-01)
  - Source : `supabase/migrations/20251201_001_add_enseigne_id_to_products.sql`
  - Type TS : `packages/@verone/types/src/supabase.ts` lignes 2416-2456
  - Colonnes clés : `id, name, description, logo_url, is_active, member_count, payment_delay_days, show_on_linkme_globe`
  - **Sémantique** : représente un client B2B partenaire (chaîne de magasins / groupement). Exemple : Pokawa.

- **Colonne `products.enseigne_id`** (FK → `enseignes(id)`, ON DELETE SET NULL)
  - Logique métier : "Si enseigne_id renseignée → assigned_client_id pointe vers société mère de l'enseigne"
  - Non-NULL pour les produits fabriqués pour un client partenaire spécifique

- **Table `organisations`** : sociétés/clients/partenaires. FK optionnel vers `enseignes`.

### Ce qui N'EXISTE PAS

- ❌ Table `brands` ou `marques`
- ❌ Notion de "marque interne Vérone Group" en DB
- ❌ Distinction Vérone / Bohemia / Solar / Flos
- ❌ Possibilité d'attribuer un produit à plusieurs marques internes simultanément

### Implications architecture

**`enseigne_id` ≠ `brand_id` (marque interne)**. Ce sont 2 concepts ORTHOGONAUX :

| Cas réel                                             | enseigne_id | brand_ids (à créer) |
| ---------------------------------------------------- | ----------- | ------------------- |
| Produit Vérone catalogue grand public                | NULL        | `[verone]`          |
| Produit Vérone + Solar (lampe)                       | NULL        | `[verone, solar]`   |
| Produit Solar uniquement (powerbank)                 | NULL        | `[solar]`           |
| Produit fabriqué pour Pokawa, sous marque Vérone     | pokawa_id   | `[verone]`          |
| Produit white-label pour Pokawa, sans marque interne | pokawa_id   | `[]`                |

**Verdict** : Phase 1 doit créer la table `brands` SANS toucher à `enseigne_id`. Les deux cohabitent.

---

## 2. Canaux de vente — état réel

### Architecture existante (production stable)

**Table maître `sales_channels`** (types lignes 6968-7042)

- Colonnes : `id, code, name, config (JSONB), domain_url, site_name, icon_name, is_active`
- Représente chaque canal disponible (Meta Commerce, Google Merchant, LinkMe, Site Internet, etc.)

**Table `channel_pricing`**

- FK vers `sales_channels(id)` + `products(id)`
- Colonnes : `custom_price_ht, channel_commission_rate, is_active, is_featured, is_public_showcase`
- Permet de définir un prix spécifique par canal pour un produit

**Tables de sync par canal** :

- `meta_commerce_syncs` (types 4711-4790, migration `20260331150000_meta_commerce_channel.sql`)
  - Colonnes : `product_id, meta_product_id, meta_status, sync_status, impressions, clicks, conversions, revenue_ht`
- `google_merchant_syncs` (types 3415-3498)
  - Colonnes : `product_id, merchant_id, google_product_id, google_status, sync_status, impressions, clicks, revenue_ht`

### Routes API matures (en production)

**Meta Commerce** (`/api/meta-commerce/`) :

- `/sync-statuses` POST
- `/products/[id]/price` POST/PATCH
- `/products/[id]/visibility`
- `/products/batch-add`

**Google Merchant** (`/api/google-merchant/`) :

- `/test-connection`
- `/products/[id]/price`, `/metadata`, `/visibility`
- `/batch-sync`
- `/poll-statuses`

**LinkMe** (UI `/canaux-vente/linkme/`) : affiliés, commissions, commandes, globe items.

**Site Internet** (UI `/canaux-vente/site-internet/`) : statut beta, sync via `get_site_internet_rpc`.

### Maturité

| Canal           | Sync auto | Tracking metrics | Statut      |
| --------------- | --------- | ---------------- | ----------- |
| Meta Commerce   | ✅        | ✅               | Production  |
| Google Merchant | ✅        | ✅               | Production  |
| LinkMe          | ✅        | ✅               | Production  |
| Site Internet   | ✅        | partiel          | Beta        |
| Pinterest       | ❌        | ❌               | Pas branché |
| TikTok          | ❌        | ❌               | Pas branché |
| Metricool       | ❌        | ❌               | Pas branché |

### Implications architecture

**Tout nouveau canal s'ajoute comme une ligne dans `sales_channels`**, pas comme dev custom from scratch. Pinterest, TikTok, Metricool = nouvelle entrée + table de sync dédiée + routes API parallèles à Meta/Google.

**Le DAM (Phase 2) doit utiliser `sales_channels.code` comme valeurs de `eligible_channels`**, pas une enum hardcodée. Sinon ça déphasera quand un nouveau canal s'ajoutera.

---

## 3. Images — distinction catalogue vs publication

### Ce qui existe

- `product_images.image_type` enum : `primary | gallery | technical | lifestyle | thumbnail`
- `is_primary boolean`, `display_order int`, `alt_text text`
- `cloudflare_image_id` (depuis 2026-04-21)

### Ce qui N'EXISTE PAS

- ❌ Distinction "image catalogue produit" vs "image publication marketing"
- ❌ Tracking de publication sociale (`published_at`, `social_post_id`, `metricool_post_id`)
- ❌ Liaison image → canal sur lequel elle est éligible
- ❌ Statut "déjà publiée" / "jamais publiée"
- ❌ Tags libres
- ❌ Multi-marques (une image = un produit, pas une marque)

### Implications architecture

La table cible (`media_assets` du DAM) doit ajouter ces colonnes pour répondre au besoin Romeo :

- `eligible_channels text[]` aligné sur `sales_channels.code`
- `usage_intent text` (ex: `'catalog' | 'social' | 'banner' | 'mixed'`)
- Table dédiée `media_asset_publications` pour tracker chaque publication (canal, date, post_id, metrics)

---

## 4. Project ID Supabase

`aorroydfjsrygmosnzrl`

URL : `https://aorroydfjsrygmosnzrl.supabase.co`

---

## 5. Décisions architecturales basées sur ces faits

### Décision A — `brands` est une table NOUVELLE et SÉPARÉE

Ne pas chercher à recycler `enseignes` ou `organisations`. Concepts orthogonaux. Cohabitation propre.

### Décision B — `products.brand_ids uuid[]` est NOUVEAU et OPTIONNEL

- NULL ou `[]` autorisé (cas white-label Pokawa)
- Multi-marques via array (Vérone + Solar)
- Pas de migration de données initiale "tous à Vérone" → laisser à NULL et configurer au cas par cas

### Décision C — Le DAM s'appuie sur `sales_channels.code`

- `media_assets.eligible_channels text[]` contient des `sales_channels.code` réels
- Validation côté application (CHECK contrainte difficile sur array)
- Si demain on ajoute Pinterest dans `sales_channels`, les images peuvent automatiquement le cibler sans migration

### Décision D — Pas de réinvention des canaux

- Pinterest / TikTok / Metricool quand viendront = nouvelles lignes dans `sales_channels` + nouvelle table sync + nouvelles routes API en parallèle des patterns existants Meta/Google
- Pour la publication marketing court terme : **redirections** (deep-link vers Meta Business Suite, Pinterest Business, etc.) plutôt qu'API en direct

---

## 6. Ordre des phases révisé (basé sur les faits)

| Phase                   | Sujet                                                                                                                                                                                               | Bloquant pour         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **Phase 1**             | Création table `brands` + seed (Vérone, Bohemia, Solar, Flos) + colonne `products.brand_ids[]` + UI BrandSwitcher header. **Atomique, pas de DAM.**                                                 | Phase 2               |
| **Phase 2**             | DAM : table `media_assets` + `media_asset_links` + UI bibliothèque + migration douce des `product_images`. S'appuie sur `brands` (Phase 1) et `sales_channels` (existant).                          | Phase 3               |
| **Phase 3**             | Studio Marketing : 3 onglets (Générateur prompts, Créer fiche depuis photo, Itérer image) + redirections vers Meta Business Suite / Pinterest / TikTok depuis fiche produit. **Pas d'API externe.** | Phase 4 (optionnelle) |
| **Phase 4** (plus tard) | API Metricool/Meta Graph quand le workflow par redirection sera stabilisé. À reprioriser après Phase 3.                                                                                             | —                     |

**Phase 0 setup externe (Meta Business Manager / Pinterest Business / Metricool) reportée à AVANT Phase 4 uniquement**, pas avant Phase 1. La création des tables `brands` + DAM ne nécessite aucun setup externe.

---

## 7. Sources citées

- `supabase/migrations/20251201_001_add_enseigne_id_to_products.sql`
- `supabase/migrations/20260331150000_meta_commerce_channel.sql`
- `packages/@verone/types/src/supabase.ts` lignes 2416-2456 (enseignes), 4711-4790 (meta_commerce_syncs), 5897-5982 (product_images), 6968-7042 (sales_channels), 14403-14409 (image_type_enum)
- `apps/back-office/src/app/api/meta-commerce/sync-statuses/route.ts`
- `apps/back-office/src/app/api/google-merchant/test-connection/route.ts`
- `apps/back-office/src/app/(protected)/canaux-vente/`
- `apps/back-office/.env.local` ligne 1 (project_id)
