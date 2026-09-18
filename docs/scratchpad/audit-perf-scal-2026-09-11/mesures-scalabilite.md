# Mesures brutes — capacité à grandir (§ 4) — 2026-09-11

Lecture seule : `find`, `/usr/bin/grep`, `md5`, `diff -rq`, `git log`, `SELECT` sur le catalogue.
Aucun outil d'analyse lancé (madge, dependency-cruiser), aucune construction.

Attention méthode : dans ce shell, `grep` est une fonction qui **ignore les fichiers gitignorés** (donc
`dist/`). Les comptes ci-dessous utilisent `/usr/bin/grep`.

---

## a) Copies du fichier de types Supabase

| #   | Chemin                                                                                 | Lignes | Suivi git       | Tables `public`                             | Importé par                                                                                                |
| --- | -------------------------------------------------------------------------------------- | ------ | --------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | `packages/@verone/types/src/supabase.ts`                                               | 15 977 | oui             | **133**                                     | **tout** (222 fichiers `@verone/types`, 9 `@verone/types/supabase`, 15 via `@verone/utils/supabase/types`) |
| 2   | `packages/@verone/types/dist/supabase.d.ts`                                            | 16 115 | non (gitignoré) | 133                                         | 0                                                                                                          |
| 3   | `packages/@verone/types/dist/database.d.ts`                                            | 7 567  | non             | 69                                          | 0 — reste d'un ancien `database.ts` disparu                                                                |
| 4   | `packages/@verone/types/packages/@verone/types/src/supabase.ts`                        | 10 435 | **oui**         | 83 (70 manquantes, 20 disparues)            | 0                                                                                                          |
| 5   | `packages/@verone/types/apps/back-office/src/types/supabase.ts`                        | 10 435 | **oui**         | 83 (diffère de #4 : `brand`/`manufacturer`) | 0                                                                                                          |
| 6   | `apps/back-office/src/types/supabase.d.ts`                                             | 15 048 | **oui**         | 123 (10 manquantes)                         | 0                                                                                                          |
| 7   | `.playwright-mcp/types-drift/…/supabase.ts.generated`                                  | 15 965 | non             | 133                                         | 0                                                                                                          |
| +   | `packages/@verone/utils/dist/supabase/server.d.ts`, `admin.d.ts` (type recopié 3 fois) | —      | non             | 133                                         | 0                                                                                                          |

- Source de vérité : **#1**. Générateur : `package.json:34` racine (`supabase gen types … > packages/@verone/types/src/supabase.ts`).
  Tous les `tsconfig.json` (racine :28-29, back-office :28-29, linkme :28-29, site-internet :34-35) font
  pointer `@verone/types` vers `src`.
- « 7 copies » : **confirmé sur le disque**, mais seulement **4 suivies par git**, dont **3 mortes** (#4, #5, #6).
  Plus, mortes aussi et suivies : `apps/back-office/src/types/supabase.ts` (réexport de 6 lignes),
  `apps/back-office/src/types/supabase.js` (228 lignes), `packages/@verone/types/src/database.types.ts` (vide),
  `packages/@verone/ui/packages/@verone/types/` (package.json + tsconfig).
- Piège : `packages/@verone/types/package.json` fait pointer `main`/`types`/`exports` vers `dist/`
  (gitignoré, pas à jour) ; `ui` et `utils` pointent `main`/`types` vers `dist/` (celui de `ui` date du
  2025-11-09) mais `exports` vers `src`. Tout outil qui ignore les chemins `tsconfig` lirait un `dist/`
  périmé — **non vérifié** si un tel outil existe dans la chaîne.

## b) Cycles entre packages

Méthode : `from '@verone/<x>'` par package, hors tests ; 1 ligne = 1 import. **101 arêtes, 13 paires
mutuelles — les 13 de l'audit confirmées, aucune autre.**

| Paire                      | A→B                | B→A           | Cassable en < 1 jour ?                                                                                                   |
| -------------------------- | ------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| collections ↔ common      | 1                  | 2             | oui (1 hook)                                                                                                             |
| common ↔ finance          | 2                  | 23            | oui (2 modales de prix dans `common`)                                                                                    |
| common ↔ orders           | 1 (type seul)      | 25            | oui                                                                                                                      |
| common ↔ organisations    | 1 (type seul)      | 7             | oui                                                                                                                      |
| common ↔ products         | 2 (+1 commentaire) | 27            | oui                                                                                                                      |
| consultations ↔ products  | 4                  | 2             | oui                                                                                                                      |
| customers ↔ organisations | 4                  | 1             | oui                                                                                                                      |
| dashboard ↔ stock         | 1 (réexport)       | 1 (type seul) | oui                                                                                                                      |
| orders ↔ organisations    | 15                 | 1             | oui                                                                                                                      |
| organisations ↔ products  | 1                  | 13            | oui                                                                                                                      |
| products ↔ stock          | 4                  | 4             | oui                                                                                                                      |
| products ↔ ui-business    | 3                  | 3             | oui                                                                                                                      |
| **finance ↔ orders**      | 6                  | 15            | **limite** : les 6 viennent d'un seul module (`orders/components/modals/customer-selector`) ; le déplacer casse le cycle |

- Un seul fichier crée deux cycles : `packages/@verone/organisations/src/hooks/use-organisation-tab-counts.ts:10-11`.
- Exemples : `common/src/components/address/AddressInput.tsx:5-6` (types seulement),
  `common/src/components/collections/CollectionGrid.tsx:8`, `finance/src/components/QuoteFormModal/use-quote-form.ts:5`.
- **41 arêtes sur 101 non déclarées** dans les `package.json` (products 9, organisations 5, common 4,
  orders 4, stock 4, ui-business 4, dashboard 3, …).

## c) Tables sans `CREATE TABLE` dans les migrations

Méthode : liste réelle des tables (`pg_class`, 133) comparée aux noms extraits de tous les
`CREATE TABLE [IF NOT EXISTS] [public.]nom` et `ALTER TABLE … RENAME TO nom` des **771 migrations**.

**61 tables sur 133 n'ont aucune création dans le dépôt** (marge : 1 ligne `CREATE TABLE` coupée en fin
de ligne) :

`audit_logs categories channel_price_lists channel_pricing channel_pricing_history channel_product_metadata
client_consultations collection_images collection_products collection_shares collections consultation_images
consultation_products contacts customer_groups customer_pricing enseignes families feed_configs
google_merchant_syncs group_price_lists individual_customers linkme_affiliates linkme_channel_suppliers
linkme_commissions linkme_payments linkme_selection_items linkme_selections mcp_resolution_queue
mcp_resolution_strategies notifications order_discounts organisation_families organisations price_list_history
price_list_items price_lists product_colors product_group_members product_groups product_images
product_packages products purchase_order_items purchase_order_receptions purchase_orders sales_channels
sales_order_items sales_order_shipments sales_orders sample_order_items sample_orders stock_alert_tracking
stock_movements stock_reservations storage_allocations subcategories user_activity_logs user_profiles
user_sessions variant_groups`

Et **22 tables créées dans les migrations n'existent plus en base** (sauvegardes, anciennes tables).

Écarts entre documents : audit du 11/09 « 6 » (échantillon de 8), `ACTIVE.md` « 59 » → **61 mesuré**.

### Ce que coûterait une photo complète du schéma (estimation depuis le catalogue)

| Objet (`public`)          | Nombre                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Tables                    | 133                                                                                                  |
| Vues / vues matérialisées | 26 / 3                                                                                               |
| Fonctions                 | 574 (687 ko de code)                                                                                 |
| Triggers                  | 245                                                                                                  |
| Index                     | 911                                                                                                  |
| Policies                  | 334                                                                                                  |
| Clés étrangères           | 307                                                                                                  |
| Types énumérés            | 45                                                                                                   |
| Extensions                | plpgsql, pg_stat_statements, uuid-ossp, pgcrypto, supabase_vault, pg_trgm, unaccent, pg_cron, pg_net |

- Taille estimée du fichier : **~1,5 à 2,5 Mo de SQL** (687 ko de fonctions + ~1 Mo de tables, index,
  policies, droits). Ordre de grandeur, pas une mesure.
- Ce qu'elle débloque : reconstruire la base depuis le dépôt ; créer une copie de test (branche
  Supabase ou base locale) ; **tester sur une copie** chaque correction de base du plan (dont la piste
  « droits une fois par requête »). C'est le prérequis de toute correction de base sûre.
- Risques : (1) l'export contient les noms de fonctions et de colonnes, aucune donnée, mais **aussi les
  `GRANT` et parfois des valeurs par défaut** — relire avant de l'enregistrer dans le dépôt ;
  (2) les objets Supabase (`auth`, `storage`, `realtime`) ne doivent pas y figurer ; (3) le carnet des
  migrations (`supabase_migrations.schema_migrations`) doit être marqué pour que la photo ne soit
  jamais « rejouée » sur la production. Aucune écriture en production pour la produire : c'est une lecture.
- Moyen : l'outil Supabase en ligne de commande, déjà authentifié par jeton sur ce poste. **Demande
  ton accord avant d'être lancée** (plus lourd qu'un SELECT).

## d) Clés étrangères sans index couvrant

**27 confirmées.** 21 pointent vers `auth.users` (colonnes « qui a fait » : `created_by`, `updated_by`,
`reviewed_by`, `sent_by`, `verified_by`…). Ces index ne servent qu'au moment où l'on **supprime un
compte** (Postgres vérifie alors chaque table enfant) : 14 comptes, ≤ 737 lignes par table. Les 6 autres :

| Table enfant (lignes)            | Colonne                | Table parente (lignes)     |
| -------------------------------- | ---------------------- | -------------------------- |
| product_purchase_history (194)   | purchase_order_item_id | purchase_order_items (194) |
| sales_orders (190)               | applied_discount_id    | order_discounts (**0**)    |
| sourcing_candidate_suppliers (4) | supplier_id            | organisations (223)        |
| sourcing_price_history (0)       | supplier_id            | organisations              |
| ambassador_attributions (0)      | code_id                | ambassador_codes (0)       |

**Aucun ne servirait aujourd'hui.** À réévaluer au-delà de ~10 000 lignes sur une table enfant.

## e) Arbre produit dupliqué

|                              | `produits/catalogue/[id]` | `produits/catalogue/detail/[id]` |
| ---------------------------- | ------------------------- | -------------------------------- |
| Fichiers                     | 66                        | 67                               |
| Commits depuis le 2026-06-01 | **0**                     | 2 (dont Want It Now aujourd'hui) |
| Servi aux utilisateurs       | **non**                   | **oui**                          |

- `apps/back-office/next.config.js:87-94` réécrit toute adresse `/produits/catalogue/<uuid>` vers
  `/produits/catalogue/detail/<uuid>`. Les 26 liens du code (dont la liste du catalogue,
  `CatalogueListView.tsx:74`) passent par cette réécriture ; 3 liens visent `detail/` directement.
  L'arbre `[id]` n'est donc jamais affiché (d'après la documentation Next.js : les réécritures passent
  avant les routes dynamiques — non vérifié en navigateur).
- `[id]` est revenu par la fusion `5b0a8043` (2026-05-11) après son déplacement.
- `diff -rq` : 60 fichiers identiques, 6 différents, 1 seulement dans `detail/` (carte Want It Now).
- **Défaut réel trouvé** : le commit `4f45626c` (BO-PUBLISH-001, 2026-05-13) a ajouté à la liste de
  contrôle « avant publication » les critères **Poids** et **Dimensions obligatoires** et la **meta
  description obligatoire** — **uniquement dans l'arbre mort**. Sur la page réellement affichée, poids
  et dimensions n'apparaissent pas dans la liste et la meta description est marquée facultative.
  Le blocage côté serveur existe bien (route `api/products/[id]/publish/route.ts` et fonction
  `calculate_product_completion_status`) : c'est l'**affichage** qui ment, pas la protection.
  Hors périmètre perf — à signaler au lot des bugs.
- Seul `detail/[id]` a : carte Want It Now, visibilité catalogue LinkMe + réservation client/enseigne,
  styles et pièces lus en base.

## f) Packages et construction (inventaire statique)

| Mesure                                         | Valeur                                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Packages avec script `build`                   | 5 (types, ui, utils, themes, tokens)                                                                                   |
| Champ `sideEffects`                            | **0** partout                                                                                                          |
| `optimizePackageImports` / bloc `experimental` | absents des 3 applications                                                                                             |
| Cache webpack                                  | `type: 'memory'` en production **et** en dev (`next.config.js:183-185`, `217-219`)                                     |
| `transpilePackages` back-office                | 24 entrées dont **3 packages inexistants** (`admin`, `kpi`, `suppliers`) ; `roadmap` et `themes` utilisés mais absents |
| `exceljs`                                      | chargé par `utils/src/index.ts:36` → `excel-utils.ts:1` ; **546 fichiers** importent la racine `@verone/utils`         |
| `recharts`                                     | chargé par `orders/src/index.ts:9` → `components/charts` ; 46 fichiers importent la racine `@verone/orders`            |

**Effet réel sur le temps de construction et le poids : non mesuré.** Le mesurer demande deux
constructions complètes (avant / après, sur une copie de travail), ce qui est plus lourd qu'une lecture
et écrase le dossier de construction du serveur local s'il tourne. **Accord demandé.**
