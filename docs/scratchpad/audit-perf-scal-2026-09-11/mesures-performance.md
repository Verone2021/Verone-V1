# Mesures brutes — performance (§ 3) — 2026-09-11

Base `aorroydfjsrygmosnzrl` (verone-backoffice, Postgres 17.6, eu-west-3). Lecture seule
exclusivement : `SELECT`, `EXPLAIN (ANALYZE)` sur des `SELECT`, lecture de catalogue, logs.
Aucune écriture, aucun `SET`, aucune impersonation de rôle.

Compteurs cumulés depuis `stats_reset = 2025-09-05 14:06 UTC` (370 jours) — valable pour
`pg_stat_user_tables` et `pg_stat_statements`.

---

## a) `pg_stat_user_tables`

```sql
SELECT relname, n_live_tup, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables WHERE schemaname='public' ORDER BY seq_scan DESC LIMIT 12;
```

| Table                | Lignes | seq_scan    | seq_tup_read  | idx_scan   |
| -------------------- | ------ | ----------- | ------------- | ---------- |
| user_app_roles       | 9      | 262 455 330 | 1 362 176 124 | 1 550 973  |
| user_profiles        | 8      | 32 895 243  | 116 082 933   | 18 322     |
| stock_movements      | 404    | 6 359 973   | 4 791 497     | 727 797    |
| products             | 236    | 1 554 506   | 54 736 763    | 11 976 625 |
| sales_orders         | 190    | 1 011 867   | 146 283 068   | 1 748 840  |
| channel_pricing      | 109    | 745 521     | 79 572 916    | 121 868    |
| client_consultations | 6      | 392 523     | 1 272 997     | 461        |
| matching_rules       | 50     | 298 079     | 5 588 023     | 113 822    |
| organisations        | 223    | 297 374     | 33 761 414    | 4 502 138  |
| categories           | 12     | 257 565     | 3 029 771     | 106 363    |
| collections          | 2      | 249 903     | 268 303       | 40         |
| purchase_orders      | 24     | 233 991     | 541 614       | 81 052     |

`user_app_roles` : 262 390 637 au relevé du matin → 262 455 330 = **+64 693 scans en quelques heures**.
Base : 294 MB, dont `user_activity_logs` **106 MB / 123 549 lignes** (36 % de la base).

## b) Fonctions de rôle (`pg_get_functiondef`)

| Fonction                      | Langage | Volatilité   | SECURITY DEFINER | SET                           | Lecture de table                                     | Appelée par               |
| ----------------------------- | ------- | ------------ | ---------------- | ----------------------------- | ---------------------------------------------------- | ------------------------- |
| `is_backoffice_user()`        | sql     | STABLE       | oui              | search_path, row_security=off | `user_app_roles` (EXISTS)                            | 219 policies, 3 fonctions |
| `is_back_office_admin()`      | sql     | STABLE       | oui              | search_path, row_security=off | `user_app_roles`                                     | 1 policy (hors public)    |
| `is_back_office_owner()`      | sql     | STABLE       | oui              | search_path, row_security=off | `user_app_roles`                                     | 3 policies                |
| `is_back_office_privileged()` | sql     | **VOLATILE** | oui              | row_security=off, search_path | `user_app_roles`                                     | 1 policy                  |
| `is_backoffice_admin()`       | sql     | STABLE       | oui              | search_path                   | `user_app_roles`                                     | 0                         |
| `has_scope(text)`             | sql     | VOLATILE     | oui              | search_path                   | `user_profiles.scopes` — **colonne inexistante**     | 0                         |
| `is_staff_user_cached()`      | plpgsql | STABLE       | oui              | search_path, row_security=off | appelle `is_staff_user()` — **fonction inexistante** | 0                         |

Toutes font des I/O. `SECURITY DEFINER` + clauses `SET` ⇒ jamais « inlinées » par le planificateur :
chaque appel est un vrai appel de fonction (changement de contexte + sauvegarde/restauration des réglages).
`has_scope` et `is_staff_user_cached` sont mortes et cassées (planteraient si appelées).

## c) Policies par fonction

```sql
-- pg_policies, recherche de '\mfn\(' dans qual || with_check
```

| Fonction                  | Policies | dont `public` | déjà enveloppées `(SELECT …)` | Tables |
| ------------------------- | -------- | ------------- | ----------------------------- | ------ |
| is_backoffice_user        | **219**  | 216           | 0                             | 133    |
| auth.uid                  | 76       | 64            | 71                            | 37     |
| is_back_office_owner      | 3        | 3             | 0                             | 1      |
| auth.jwt                  | 2        | 2             | 0                             | 1      |
| is_back_office_admin      | 1        | 0             | 0                             | 1      |
| is_back_office_privileged | 1        | 1             | 0                             | 1      |

### Quand l'appel est-il vraiment répété par ligne ? (mesuré)

```sql
EXPLAIN ANALYZE SELECT count(*) FROM bank_transactions WHERE matching_status='unmatched' AND is_backoffice_user();
-- → "One-Time Filter: is_backoffice_user()"  : évaluée UNE fois
EXPLAIN ANALYZE SELECT count(*) FROM sales_orders so WHERE status='validated'
  AND (is_backoffice_user() OR (NOT is_backoffice_user() AND is_own_linkme_order(so.id, ...)));
-- → "Filter: (is_backoffice_user() OR ...)" : évaluée À CHAQUE LIGNE
```

Une table dont **toutes** les policies de lecture sont `is_backoffice_user()` seul → 1 appel par requête.
Une table où une autre policy (LinkMe, site, propriétaire) lit une colonne de la ligne → les policies
sont combinées en `OR` → **appel par ligne**. Estimation (heuristique sur `pg_policies`) : **au plus 51 tables
sur 132** sont dans ce cas, dont `products`, `sales_orders`, `sales_order_items`, `organisations`,
`stock_movements`, `purchase_orders`, `product_images`, `financial_documents`, `contacts`,
`linkme_*`, `user_profiles`, `user_activity_logs`, `notifications`, `collections`.

### Coût unitaire d'un appel (micro-mesure, 20 000 évaluations, rôle `postgres`)

```sql
EXPLAIN ANALYZE SELECT count(*) FROM generate_series(1,20000) g WHERE (g < 0 OR is_backoffice_user());
```

| Expression évaluée par ligne                                             | 20 000 lignes                                 | Par appel                       |
| ------------------------------------------------------------------------ | --------------------------------------------- | ------------------------------- |
| `is_backoffice_user()` actuelle                                          | 271 ms (272 ms au 2e passage ; 27 ms / 2 000) | **13,6 µs**                     |
| Lecture JWT, jeton vide (`auth.jwt()` sans claims)                       | 7,6 ms                                        | 0,38 µs — **non représentatif** |
| Lecture JWT, jeton réaliste de ~560 caractères (parse `jsonb` par ligne) | 167 ms                                        | **8,3 µs**                      |
| `EXISTS (SELECT … user_app_roles …)` écrit en ligne                      | 0,43 ms / 2 000                               | évalué 1 fois (InitPlan)        |

Limite : mesuré en rôle `postgres`, sans jeton ; en production la fonction actuelle appelle aussi
`auth.uid()` qui parse le jeton → coût réel estimé ≈ 13,6 + ~8 ≈ **22 µs par ligne**.

## d) Crochet de jeton et `raw_app_meta_data`

- `custom_access_token_hook(jsonb)` existe, `supabase_auth_admin` a le droit EXECUTE, mais elle lit
  `user_profiles.app` et `user_profiles.role` — **colonnes inexistantes** (colonnes réelles : `user_id,
created_at, updated_at, first_name, last_name, phone, job_title, last_sign_in_at, avatar_url,
individual_customer_id, organisation_id, partner_id, user_type, client_type, app_source,
parent_user_id, email`). Si le crochet était activé, chaque connexion planterait.
  Logs auth des dernières 24 h : 1 090 lignes, **0 mention de « hook »** → crochet **non activé**
  (l'activation elle-même se lit dans la config Auth, non lisible en SQL).
- `test_custom_access_token_hook(uuid)` : fabrique un faux événement et appelle le crochet ci-dessus.
  Outil de test, mort.
- `sync_user_metadata_to_jwt()` : fonction trigger qui copie `user_type`, `role`, `partner_id` dans
  `raw_app_meta_data`. **Aucun trigger ne l'utilise** (0 dans `pg_trigger`). Morte.
- Triggers sur `user_app_roles` : `prevent_last_owner_deletion_trigger`, `prevent_last_owner_role_change_trigger`,
  `set_updated_at_user_app_roles`, `trg_sync_linkme_user_contact`. Aucun n'écrit dans `auth.users`.
- Clés présentes dans `raw_app_meta_data` (noms seulement, 14 comptes) : `provider` 14, `providers` 14,
  `linkme_role` 4, `enseigne_id` 4, `user_type` 2, `role` 2, `partner_id` 2, `app` 1.
  **Aucune clé back-office.** Écrites par `api/linkme/users/create/route.ts:113` et
  `api/ambassadors/create-auth/route.ts:105`.
- `user_app_roles` : back-office owner 2, admin 1, catalog_manager 1 ; linkme enseigne_admin 3,
  enseigne_collaborateur 2 (9 lignes, toutes actives).

## Le relevé de requêtes sur un an (`pg_stat_statements`)

Requêtes API reçues depuis le 2025-09-05 (compteur du `set_config` que PostgREST exécute à chaque
requête) : **8 532 723**, soit **~23 000 par jour**.

Top par temps base cumulé (rôles `authenticated` / `anon` / `service_role`) :

| Requête                                                                  | Appels  | Moyenne | Total              |
| ------------------------------------------------------------------------ | ------- | ------- | ------------------ |
| `rpc get_stock_alerts_count()` (menu latéral, tableau de bord, messages) | 179 707 | 141 ms  | **25 384 s (7 h)** |
| count `bank_transactions` non rapprochées (menu)                         | 103 963 | 71 ms   | 7 371 s            |
| INSERT `user_activity_logs` (traceur de navigation)                      | 67 829  | 107 ms  | 7 269 s            |
| `rpc get_activity_stats(days_ago)`                                       | 16 348  | 355 ms  | 5 808 s            |
| count `products` sans description (menu)                                 | 104 402 | 52 ms   | 5 461 s            |
| count `sales_orders` draft (menu)                                        | 103 891 | 51 ms   | 5 304 s            |
| count `sales_orders` validated+partially_shipped (menu)                  | 103 256 | 50 ms   | 5 117 s            |
| count `sales_orders` LinkMe draft (menu)                                 | 102 771 | 44 ms   | 4 543 s            |
| `rpc get_site_internet_products` (anon, site public)                     | 11 645  | 271 ms  | 3 159 s            |
| `notifications` (user_id IS NULL OR =)                                   | 4 730   | 485 ms  | 2 294 s            |
| count `linkme_orders_enriched` (menu)                                    | 104 189 | 14 ms   | 1 463 s            |
| count `client_consultations` (menu)                                      | 103 836 | 11,5 ms | 1 192 s            |

**Le menu latéral** (`packages/@verone/notifications/src/hooks/use-sidebar-counts.ts:144-216`, 11 requêtes
en parallèle, rejouées à chaque événement temps réel de 7 tables) = **~104 000 rafraîchissements en un an**
(~280/jour), **~440 ms de temps base par rafraîchissement**, ≈ 57 000 s cumulées : **c'est le premier
consommateur de la base.**

### Même requête sans les règles de sécurité (rôle `postgres`, à chaud)

| Requête                                                             | En production (moyenne 1 an) | Sans règles, à chaud                                                |
| ------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| count `sales_orders` status=validated                               | 44-51 ms                     | **0,14 ms** exécution + 1,6 ms planif                               |
| vue `stock_alerts_unified_view` (corps de `get_stock_alerts_count`) | 141 ms                       | **2 ms** exécution + 7 ms planif (1er passage à froid : 99 + 80 ms) |
| count `bank_transactions` unmatched                                 | 71 ms                        | 36 ms à froid (non remesuré à chaud)                                |

`get_stock_alerts_count` est `SECURITY DEFINER` au propriétaire `postgres` (qui ignore les règles) :
sa lenteur **ne vient pas des règles de sécurité** mais de la replanification complète de la vue à
chaque appel (fonction SQL non inlinée : 1 259 blocs lus par appel en production ≈ les 1 328 blocs
de planification mesurés).

Les mesures à froid (1er passage 20-100 ms, 2e passage < 2 ms) montrent une instance dont le cache
se refroidit vite : chiffres de latence à prendre avec cette marge.

## e) `force-dynamic`

| Emplacement                                          | Effet réel                            |
| ---------------------------------------------------- | ------------------------------------- |
| `apps/back-office/src/app/layout.tsx:23`             | hérité par les 169 pages              |
| `apps/back-office/src/app/(protected)/layout.tsx:11` | hérité par 165 pages                  |
| `apps/back-office/src/app/force-dynamic.ts:7-8`      | **importé nulle part** — fichier mort |
| 17 `route.ts` sous `api/`                            | normal pour des routes API            |

Constat qui corrige l'audit : `(protected)/layout.tsx:21-35` appelle `supabase.auth.getUser()` (lit les
cookies) + une requête `user_app_roles` à **chaque navigation**. Lire les cookies rend ces 165 pages
dynamiques **quoi qu'il arrive**. Retirer `force-dynamic` du layout racine ne change donc rien pour
elles ; seules 4 pages hors zone protégée (`/`, `/login`, `/unauthorized`, `/module-inactive`) en
profiteraient. 152 pages protégées sur 165 sont `'use client'`. 0 `loading.tsx`. Next `^15.5.7`,
aucun `experimental.staleTimes` dans `next.config.js`.

Logs Auth, 24 dernières heures (2026-09-10 04:43 → 2026-09-11 02:53 UTC) : **1 048 `GET /user`**
(p50 7,9 ms, p95 127 ms côté serveur Auth) pour **22 `POST /token`**. Chaque `getUser()` est un
aller-retour réseau vers le service Auth.

## f) Boucles « une requête par élément »

Méthode : script détectant la fin de chaque corps de boucle sur 3 701 fichiers `.ts/.tsx` (hors tests,
`dist`, répertoires imbriqués), 146 candidats, **chaque cas relu à la main** ; helpers ouverts pour
confirmer qu'ils appellent Supabase.

| Catégorie                                                 | Nombre  |
| --------------------------------------------------------- | ------- |
| Boucles séquentielles, requête écrite dans la boucle      | 44      |
| + boucles séquentielles appelant une route `/api` interne | 4       |
| + boucles séquentielles passant par un helper qui requête | 19      |
| **Total séquentiel**                                      | **67**  |
| Éventails parallèles `Promise.all(liste.map(requête))`    | 21      |
| dont lectures liées à l'affichage (le « 25 » du prompt)   | 23 à 25 |

Origine des chiffres précédents : « 45 » = `AUDIT.md:244`, recherche non relue (contient au moins un
faux positif, `use-cloture-data.ts:216,219`, **réfuté** : remplit un Set puis une seule requête `.in()`).
« 25 » = boucles de lecture à l'affichage.

### Les pires au pire cas (volumes réels)

| Emplacement                                                                                                       | Ce qui est itéré                           | Requêtes au pire cas                                           | Preuve en base                                                                         |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `packages/@verone/stock/src/hooks/use-stock-inventory.ts:103` — page `/stocks/inventaire`                         | tous les produits non archivés (221)       | **1 + 221 requêtes par chargement**                            | requête `stock_movements … affects_forecast IS NULL OR FALSE` : 176 565 appels en 1 an |
| `apps/back-office/src/app/api/admin/users/route.ts:76`                                                            | tous les profils (8)                       | 1 + 8 × 3 = 25                                                 | —                                                                                      |
| `packages/@verone/categories/src/hooks/use-categories.ts:54` — `/produits/catalogue`                              | toutes les catégories (12)                 | 1 + 12 count                                                   | —                                                                                      |
| `packages/@verone/stock/src/hooks/use-stock-dashboard.ts:369,402` — `/stocks`                                     | commandes fournisseurs / clients affichées | 1 par commande, séquentiel                                     | —                                                                                      |
| `apps/back-office/src/app/(protected)/produits/catalogue/use-bulk-actions.ts:128`                                 | produits sélectionnés                      | 1 UPDATE par produit, séquentiel (236 si tout sélectionné)     | —                                                                                      |
| `packages/@verone/orders/src/actions/sales-shipments.ts:114`                                                      | articles expédiés                          | 3 par article                                                  | —                                                                                      |
| `packages/@verone/finance/src/components/RapprochementModal/use-rapprochement-data.ts:61`                         | liens existants                            | jusqu'à 3 par lien, `error` jamais lu                          | —                                                                                      |
| `apps/back-office/src/app/(protected)/contacts-organisations/enseignes/[id]/hooks/use-enseigne-detail.ts:212,217` | organisations ajoutées/retirées            | 2 par organisation (UPDATE + rechargement complet de la liste) | —                                                                                      |
| `apps/back-office/src/app/actions/bank-matching.ts:238`                                                           | commandes                                  | 6 par commande — **importé nulle part, code mort**             | —                                                                                      |

Liste complète (88 emplacements) : `boucles-requete-par-element.md` dans ce dossier.

Autres signaux de lecture « une ligne à la fois » visibles dans `pg_stat_statements` :
`organisations WHERE id = $1` 489 358 appels, `product_images WHERE product_id = $1` 457 671,
`enseignes WHERE id = $1` 106 869.
