# Rapport d'audit performance & scalabilité — Claude Code — 2026-09-11

Lecture seule. Base `aorroydfjsrygmosnzrl`, Postgres 17.6. Mesures prises entre 17 h 50 et 18 h 20
(heure de Paris). Chaque chiffre renvoie à une commande de l'annexe (`[Cn]`).

**Transparence sur l'indépendance** : dans la même session, avant ce prompt, j'avais déjà lu
`docs/audit-2026-07-30/AUDIT-2026-09-11.md` (fourni par le prompt d'origine), le plan
`PLAN-CORRECTION-2026-09-11.md` et `PROMPTS-2026-09-11.md` (fournis par Roméo), et les 30 premières
lignes de `docs/scratchpad/audit-perf-scal-2026-09-11/suite-session-2026-09-11.md`. Je n'ai rien lu
d'autre. La comparaison avec l'autre audit n'est donc pas totalement à l'aveugle.

---

## 0. Vérifications d'ouverture

| Contrôle                       | Résultat                                                                                                                                                                                                                                                                                                                         | Commande |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Dossier                        | `/Users/romeodossantos/verone-back-office-V1`                                                                                                                                                                                                                                                                                    | [C1]     |
| Dépôt distant                  | `https://github.com/Verone2021/Verone-V1.git` (fetch + push)                                                                                                                                                                                                                                                                     | [C1]     |
| MCP Supabase `get_project_url` | `https://aorroydfjsrygmosnzrl.supabase.co` ✅                                                                                                                                                                                                                                                                                    | [C2]     |
| Branche                        | `feat/VER-CANAL-WIN-001-flux-want-it-now`                                                                                                                                                                                                                                                                                        | [C1]     |
| Arbre de travail               | 15 suppressions `docs/scratchpad/*.md` (rangement automatique vers `archive/2026-09/`) ; non suivis : `docs/audit-2026-07-30/AUDIT-2026-09-11.md`, `docs/scratchpad/archive/2026-09/`, `docs/scratchpad/audit-2026-09-11/`, `docs/scratchpad/audit-perf-scal-2026-09-11/`, 2 prompts `docs/scratchpad/prompt-*.md`. Rien touché. | [C1]     |

Interdits respectés : aucune écriture, aucun `ANALYZE`, aucune donnée de test, aucun commit. Les
mesures « sous `authenticated` » ont utilisé uniquement `set_config('role'|'request.jwt.claims', …, true)`
dans la transaction implicite de la requête, sans aucune écriture (l'identifiant d'admin n'est pas reproduit).

---

## 1. Ce qui change par rapport au plan du 2026-09-11

| Affirmation du plan                                                                                                              | Mesure                                                                                                                                                                                                                                                                                                                      | Verdict                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| « `user_activity_logs` reçoit une écriture à chaque page, dans le chemin du rendu, 107 ms »                                      | Le traceur met les événements en file et envoie **un INSERT groupé toutes les 60 s ou par 50 événements** (`use-user-activity-tracker.ts:59-60`), page vue différée par `setTimeout(0)`. Hors rendu. Écriture réelle : **81 lignes en août, 948 au 11 septembre** [C30]. Aujourd'hui : **28 POST** en 9 h de travail [C22]. | **Faux.** Le coût est payé en arrière-plan, et il est devenu faible.                         |
| « 107 ms » par écriture                                                                                                          | min **0,34 ms**, moyenne 107, max 7 981 ; moyenne/min = **317** [C8]                                                                                                                                                                                                                                                        | Le coût n'est pas l'écriture : ce sont des **attentes** (voir § 2).                          |
| Bloc B : « 41 tables sur 185 ont des statistiques de plus de 30 jours »                                                          | 185 tables utilisateur confirmées ; **174 sur 185** analysées il y a plus de 30 jours (130/136 en `public`) [C27]. Je ne reproduis pas « 41 ». Les tables chaudes ont 1 à 30 lignes modifiées depuis leur analyse ; estimations du planificateur = réel (8/8, 222/221, 102/107) [C14].                                      | **Statistiques anciennes mais justes. Aucun effet mesurable.**                               |
| Bloc D : « si les statistiques périmées sont la cause, ce bloc disparaît »                                                       | 5 appels de la fonction dans **une** requête : 11,4 ms au total, dont 10,4 pour le 1er et **0,26 ms** pour chacun des 4 suivants [C12].                                                                                                                                                                                     | **La cause est la re-préparation à chaque appel**, pas les statistiques. Le bloc reste.      |
| Bloc C : « 16 h de travail base par an » pour le menu                                                                            | Confirmé en ordre de grandeur (≈ 15,8 h sur les 11 requêtes, [C7]). Mais le vrai sujet est ailleurs : **le menu interroge la base toutes les ~32 s en permanence** (§ 2).                                                                                                                                                   | **Sous-estimé** : c'est 90 % du trafic de travail.                                           |
| Bloc E : « `TO authenticated` écarte le rôle public ; cible les 51 tables où la fonction de rôle est réévaluée ligne par ligne » | **37 policies sur 334** sont `TO public`, sur **20 tables** ; **4** seulement appellent `is_backoffice_user()` [C17]. La réévaluation par ligne concerne les requêtes **des salariés connectés** (`authenticated`) : `TO authenticated` ne la change pas. `user_app_roles` (9 lignes) a déjà 10 index [C29].                | **Gain mesurable ≈ 0**, et c'est une modification de policies (exclue par Roméo). À retirer. |
| « 6 tables cœur sans script de création »                                                                                        | **61 tables `public` sur 133** sans `CREATE TABLE` ni `RENAME TO` dans les 771 fichiers [C34].                                                                                                                                                                                                                              | **Faux par un facteur 10.**                                                                  |
| « 7 copies des types »                                                                                                           | **7 fichiers > 100 Ko** contenant `export type Database` [C35] ; **4 suivis par git**, dont **3 importés par personne**.                                                                                                                                                                                                    | Juste sur le disque ; 1 seule utile.                                                         |
| « 332 fonctions SECURITY DEFINER exécutables par `anon` »                                                                        | **332** confirmé, dont **108 fonctions de trigger** ; **571 fonctions sur 574** de `public` exécutables par `anon` ; `reset_finance_auto_data` exécutable par `anon` **et** `authenticated` [C17].                                                                                                                          | **Confirmé**, et plus large que dit.                                                         |
| « Middleware absent, 152 routes »                                                                                                | `apps/back-office/src/middleware.ts` absent de la branche courante ; 152 `route.ts` ; le fichier existe dans `cc10edae`, mode observation, `console.log` ligne 87 [C38].                                                                                                                                                    | **Confirmé.** « 90 sans contrôle » non remesuré ici.                                         |
| Scalabilité : « le premier plafond »                                                                                             | Instance de très petite taille : `shared_buffers` 224 Mo, `effective_cache_size` 384 Mo, `work_mem` 2,1 Mo, 2 workers parallèles, 60 connexions max [C9].                                                                                                                                                                   | **Le plafond est déjà atteint par intermittence** (§ 2), à 294 Mo de données.                |

---

## 2. L'intermittence : causes mesurées

### Le symptôme, chiffré

- Heures de travail du 11 septembre (07:00-15:55 UTC), trafic venant **uniquement** de
  `https://verone-back-office.vercel.app`, **2 sessions** [C23] : **14 464 appels `/rest/*`**, dont
  **1 698 au-delà de 2 s (11,7 %)** [C22]. p95 horaire entre **2,2 et 4,6 s**, max **8,8 s** [C21].
- Des instructions **triviales** prennent parfois 6 à 12 s : `SET client_encoding` (moyenne 0,06 ms,
  **max 7,9 s**), le `set_config` d'ouverture de chaque requête API (moyenne 0,57 ms, **max 6,2 s**),
  la lecture d'un utilisateur par le service de connexion (moyenne 0,37 ms, **max 12,5 s**) [C11].
  **100 requêtes distinctes** ont un max > 5 s ; **15** d'entre elles ont une moyenne < 10 ms [C10].

Une instruction qui ne lit rien ne peut pas prendre 8 s par elle-même : **c'est l'instance entière qui
cale par moments.** Les requêtes lentes sont les victimes, pas les coupables.

### Cause 1 — Le service temps réel occupe 63 % du temps de la base

`pg_stat_statements` sur 370 jours, 106 h de temps d'exécution cumulé [C6] :

| Poste                                                                                                             | Part du temps total | Appels            |
| ----------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------- |
| **Realtime** (lecture du journal des modifications : `wal->>…`, `realtime.list_changes`, `pg_publication_tables`) | **63 %**            | **46,8 millions** |
| Rôles applicatifs (`authenticated`, `anon`, `service_role`)                                                       | 31 %                | —                 |
| Reste (Auth, PostgREST, cron, CI, Studio)                                                                         | 6 %                 | —                 |

Top 25 [C5] : rangs **1, 2, 4, 5, 6, 9 = Realtime** (33,7 + 12,2 + 6,3 + 6,0 + 2,3 + 1,5 %), avec des
maxima de 10 à **48 s** et 1 300 à 1 900 blocs lus par appel. La première requête applicative
(`get_stock_alerts_count`) n'arrive qu'au rang 3 avec 6,7 %.

Ce que publie la base pour le temps réel : **2 tables seulement, `products` et `sales_orders`** [C16].
Aucun abonnement actif au moment de la mesure (18 h, personne connecté) [C16].

### Cause 2 — Le menu de gauche interroge la base toutes les ~32 s, sans action de personne

- `use-sidebar-counts.ts` ouvre **7 canaux temps réel** (l. 376-468) : `sales_orders`,
  `client_consultations`, `bank_transactions`, `products`, `form_submissions`, `linkme_info_requests`,
  et **`stock_alerts_unified_view` — une vue**. **5 tables et 1 vue ne sont pas publiées** [C16] ; une
  vue ne peut jamais l'être. Sur `CHANNEL_ERROR`, le hook bascule en **interrogation toutes les
  30 000 ms** (l. 89, 95, 356-366) [C31].
- L'en-tête ajoute `use-unread-mails-count.ts` : un comptage `email_messages` **toutes les 30 s**, sans condition.
- Mesure passerelle [C22][C24] : sur 9 h de travail, chaque compteur du menu apparaît ~1 000 fois
  (`sales_orders` 3 002 = 3 compteurs × 1 000 ; `products` 2 005 ; `rpc/get_stock_alerts_count` 1 002 ;
  `email_messages` 1 003…) ⇒ **un tour toutes les ~32 s**. Ces comptages = **13 004 appels sur 14 464
  (90 %)**, et **1 556 des 1 698 appels lents (92 %)**.
- En plus, les 2 canaux qui fonctionnent (`products`, `sales_orders`) relancent les 11 compteurs à
  chaque modification — et chaque modification est filtrée par les règles de sécurité pour chaque
  abonné : c'est ce qui fait tourner Realtime.

### Cause 3 — Des lectures massives du catalogue sur la base de production

| Qui                                                                                                                                                    | Requête                                                                             | Appels / 1 an      | Moyenne   | Max        | Blocs par appel   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------ | --------- | ---------- | ----------------- |
| `scripts/db-drift-check.py` (CI : chaque PR vers `main`/`staging`/`integration/*` + lundi 06:00 UTC) — rôle `postgres`, `SUPABASE_DB_URL` = production | `information_schema.table_constraints ⋈ key_column_usage ⋈ constraint_column_usage` | 809 (+76 variante) | **5,5 s** | **40,3 s** | **4,24 millions** |
| PostgREST (rechargement du cache de schéma)                                                                                                            | `pg_timezone_names`, types récursifs, clés                                          | ~4 430 chacun      | 70-350 ms | 7,9 s      | jusqu'à 7 618     |
| Génération de types / Studio (`supabase_read_only_user`)                                                                                               | introspection des tables                                                            | 376                | 2,4 s     | 16,3 s     | 233 314           |

[C18][C33]. Une exécution du contrôle CI lit **4,2 millions de blocs** (≈ 32 Go de pages mémoire
parcourues) sur une instance de 224 Mo de cache : pendant ces 5 s, tout le reste attend.

### Facteur aggravant — la taille de l'instance

224 Mo de cache, 2,1 Mo de mémoire de tri, 2 workers parallèles [C9]. Le planificateur lit
1 300 à 1 450 blocs rien que pour préparer le compteur d'alertes [C12][C13]. Hors travail (nuit), le
p50 `/rest` est **plus haut** qu'en journée (300-960 ms contre 205-285 ms) avec 20 à 80 appels/heure
[C21] : les connexions et caches se refroidissent quand le trafic baisse.

### Ce que je n'ai pas pu relier par l'horodatage

Pas de journal des requêtes lentes (`postgres_logs` : seulement checkpoints et cron, 0 message
« duration ») [C25]. Je ne peux donc pas prouver qu'un pic donné coïncide avec un passage CI ou une
rafale Realtime. Les trois causes sont mesurées en volume, pas synchronisées dans le temps.

---

## 3. Mesures par bloc du plan

### A — Journal de navigation

| Mesure                               | Valeur                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Cmd   |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| INSERT : appels, min / moy / σ / max | 67 853 · 0,34 / 107,2 / 373 / 7 981 ms                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | [C8]  |
| Mode d'écriture                      | file + INSERT groupé toutes les 60 s ou 50 événements ; hors rendu ; `getUser()` réseau à chaque envoi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | [C31] |
| Volume par mois                      | 20 035 (nov. 2025) → 81 (août 2026) → 948 (sept.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | [C30] |
| Taille                               | 106 Mo, 123 575 lignes (36 % de la base)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | [C30] |
| Trigger                              | `trigger_update_session_on_activity` → `update_user_session()` : UPSERT dans `user_sessions` (12 791 lignes, 12 Mo)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | [C19] |
| Index                                | 6 (pkey, user/date, organisation, action, severity partiel, app_source)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | [C19] |
| Lecteurs                             | Admin « Activité utilisateurs » (`admin/activite-utilisateurs/page.tsx:56` → `api/admin/users/route.ts:92`), onglet Activité d'une fiche (`api/admin/users/[id]/activity/route.ts:62,75,89`), LinkMe fiche utilisateur (`UserNavigationStats.tsx:179`), LinkMe tableau de bord (`use-recent-activity.ts:135`), notifications du tableau de bord (`dashboard-notifications.fetchers-orders.ts:163` — **demande `user_profiles.role`, colonne inexistante**) ; `use-user-module-metrics.ts:100` sans consommateur. Tous ≤ 30 jours ou N dernières lignes. RPC associées : 1 655 + 164 + 157 appels en 1 an. | [C32] |
| Purge / rétention                    | aucune (`cron.job` : 3 tâches, aucune sur ces tables)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | [C19] |

### B — Statistiques

| Table          | Lignes | Modifiées depuis analyse | last_analyze / last_autoanalyze | seq_scan        | seq_tup_read  |
| -------------- | ------ | ------------------------ | ------------------------------- | --------------- | ------------- |
| user_app_roles | 9      | 5                        | 2026-03-11 / 2026-02-13         | **264 557 447** | 1 376 930 479 |
| user_profiles  | 8      | 30                       | — / 2026-02-10                  | 32 895 279      | 116 082 969   |
| products       | 236    | 29                       | 2025-11-02 / 2026-07-29         | 1 554 506       | 54 736 763    |
| sales_orders   | 190    | 1                        | 2026-03-11 / 2026-09-09         | 1 015 885       | 147 046 488   |
| organisations  | 223    | 24                       | 2025-10-17 / 2026-05-08         | 297 374         | 33 761 414    |

Seuils : `autovacuum_analyze_threshold = 50`, `scale_factor = 0.1` [C14]. `user_app_roles` : 262 455 330
scans à 05:00, 264 557 447 à 18:10 → **+2,1 millions en une journée** [C14].

Conclusion : les tables ont trop peu changé pour que leurs statistiques soient fausses ; les estimations
sont exactes. **Les statistiques n'expliquent rien de mesurable.** `ANALYZE` n'a pas de retour arrière
exact en Postgres 17 (`pg_restore_relation_stats` absent) [C14].

### C — Menu de gauche

| Compteur (fichier `use-sidebar-counts.ts`) | Appels / 1 an | min  | moyenne   | σ   | max   |
| ------------------------------------------ | ------------- | ---- | --------- | --- | ----- |
| `rpc get_stock_alerts_count` (l.146)       | 180 712       | 3,34 | **141,4** | 382 | 7 737 |
| `bank_transactions` unmatched (l.190)      | 104 968       | 4,01 | 71,0      | 196 | 7 142 |
| `products` sans description (l.163)        | 105 407       | 0,75 | 52,7      | 155 | 6 963 |
| `sales_orders` draft (l.178)               | 104 895       | 7,31 | 51,2      | 122 | 7 546 |
| `sales_orders` validated+partial (l.184)   | 104 261       | 7,30 | 49,7      | 113 | 3 851 |
| `sales_orders` LinkMe draft (l.196)        | 103 775       | 6,49 | 44,2      | 101 | 7 588 |

ms, [C8]. Rapport moyenne/min de **7 à 70** : le travail propre de ces requêtes est de quelques ms ;
le reste est de l'attente. Le **plancher** de `sales_orders` (≈ 7 ms) correspond au coût des règles
de sécurité évaluées ligne par ligne (190 lignes × 2 appels × ~20 µs, mesuré le matin).

### D — Compteur d'alertes stock

`EXPLAIN (ANALYZE, BUFFERS)`, à chaud [C12][C13] :

| Variante                                       | Passages      | Planning                  | Exécution                                                 | Blocs                 |
| ---------------------------------------------- | ------------- | ------------------------- | --------------------------------------------------------- | --------------------- |
| `SELECT get_stock_alerts_count()` — `postgres` | 5             | 0,05 ms (externe)         | **10,75 · 10,45 · 10,64 · 10,61 · 10,46 ms**              | 2 232                 |
| idem — `authenticated` + vrai jeton admin      | 1 à froid + 4 | 0,01 ms                   | 32,9 (froid) · **10,28 · 9,97 · 10,63 · 9,77 ms**         | 2 048                 |
| 5 appels dans une seule requête — `postgres`   | 1             | 0,10 ms                   | **11,43 ms au total** (1er 10,4 ; suivants ≈ 0,26 chacun) | 2 665                 |
| Vue à nu — `postgres`                          | 3             | **7,21 · 7,32 · 7,22 ms** | 0,64 · 0,73 · 0,72 ms                                     | 1 328 (planif.) + 112 |
| Vue à nu — `authenticated`                     | 3             | **4,38 · 4,51 · 4,39 ms** | **6,15 · 6,29 · 6,10 ms**                                 | 1 444 (planif.) + 981 |

- La fonction (`SECURITY DEFINER`, propriétaire `postgres`) ignore les règles : son coût est
  identique quel que soit le rôle. **~10 ms à chaud, dont ~9,7 de préparation** refaite à chaque appel.
- La vue à nu sous `authenticated` (`security_invoker=true`) coûte 10,5 ms : filtre de règle
  `((InitPlan 4).col1 OR is_backoffice_user())` sur 221 lignes, et sous-requête d'image exécutée
  221 fois (632 blocs) pour un simple comptage.
- Production : moyenne 141 ms, min 3,3, max 7,7 s ⇒ **~130 ms de la moyenne sont de l'attente** (§ 2).
- Répété 3 fois au lieu de 5 pour la vue à nu : écart < 3 % entre passages, j'ai arrêté.

### E — Règles d'accès « méthode officielle »

| Mesure                                    | Valeur                                                                                                                                                              | Cmd   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Policies `public`                         | 334                                                                                                                                                                 | [C17] |
| Policies `TO public` (`polroles = '{0}'`) | 37, sur 20 tables                                                                                                                                                   | [C17] |
| … dont appelant `is_backoffice_user()`    | 4                                                                                                                                                                   | [C17] |
| Policies appelant `is_backoffice_user()`  | 216                                                                                                                                                                 | [C17] |
| Advisors performance                      | 251 `multiple_permissive_policies` (WARN), 238 `unused_index`, 27 `unindexed_foreign_keys`, 3 `auth_rls_initplan`, 3 `duplicate_index`, 1 `table_bloat` — total 523 | [C20] |

Référentiel Supabase « RLS Performance and Best Practices » : l'indexation des colonnes de règle et
`TO authenticated` servent quand une table est **grande** ou quand le rôle anonyme la lit. Ici les tables
font ≤ 737 lignes et le coût mesuré vient des salariés connectés. **Pas de gain mesurable attendu.**

### F — Page Inventaire

`packages/@verone/stock/src/hooks/use-stock-inventory.ts:103` : `Promise.all(products.map(...))` →
**1 + 221 requêtes** par chargement (221 produits non archivés). Requête `stock_movements …
affects_forecast IS NULL OR FALSE` : 176 565 appels en 1 an (relevé `pg_stat_statements` du matin,
`mesures-performance.md` § f) ; code relu : `docs/scratchpad/audit-perf-scal-2026-09-11/boucles-requete-par-element.md`.

### G — Contrôle central d'accès

`middleware.ts` absent de la branche courante ; présent dans `cc10edae` avec `GUARD_MODE =
process.env.API_GUARD_MODE ?? 'observe'` (l.29), « on laisse TOUJOURS passer » (l.100),
`console.log` (l.87) [C38]. 152 `route.ts` dans `apps/back-office/src/app/api`. Le nombre de routes sans
contrôle n'a pas été remesuré dans ce rapport.

### H — Fonctions exposées

332 `SECURITY DEFINER` exécutables par `anon`, dont 108 de type trigger ; 571/574 fonctions exécutables
par `anon` ; `reset_finance_auto_data(boolean)` : `anon` oui, `authenticated` oui [C17]. Référentiel :
OWASP API5:2023 (Broken Function Level Authorization). Les 17 fonctions ajoutées depuis la baseline
n'ont pas été identifiées ici.

---

## 4. Scalabilité

| Question                                                                                | Mesure                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Cmd       |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Tables `public`                                                                         | 133 (la doc du dépôt en annonce 119)                                                                                                                                                                                                                                                                                                                                                                                                                      | [C4]      |
| Migrations                                                                              | **771 fichiers** ; **437** inscrites dans `supabase_migrations.schema_migrations` (de `20251012` à `20260911012000`) — la doc annonce 686                                                                                                                                                                                                                                                                                                                 | [C3][C4]  |
| Taille de la base                                                                       | 294 Mo (dont `user_activity_logs` 106 Mo, `audit_logs` 76 Mo)                                                                                                                                                                                                                                                                                                                                                                                             | [C4][C19] |
| Tables sans `CREATE TABLE` / `RENAME TO` dans `supabase/migrations`                     | **61 / 133** (dont `products`, `sales_orders`, `organisations`, `stock_movements`, `contacts`, `purchase_orders`, `user_profiles`, `audit_logs`) ; 22 tables créées dans les migrations n'existent plus                                                                                                                                                                                                                                                   | [C34]     |
| Fichiers > 100 Ko avec `export type Database`                                           | **7** : `packages/@verone/types/src/supabase.ts` (source, seul importé), `packages/@verone/types/dist/{supabase,database}.d.ts` (gitignorés), `packages/@verone/types/packages/@verone/types/src/supabase.ts`, `packages/@verone/types/apps/back-office/src/types/supabase.ts`, `apps/back-office/src/types/supabase.d.ts` (suivis, 0 importateur), `.playwright-mcp/types-drift/…generated`                                                              | [C35]     |
| Cycles entre packages (imports réels `@verone/*`)                                       | **13 paires mutuelles** sur 101 arêtes ; 41 arêtes non déclarées dans les `package.json`                                                                                                                                                                                                                                                                                                                                                                  | [C36]     |
| Cycles fichier à fichier (`madge --circular`, `packages/@verone/*/src`, 1 460 fichiers) | **7** : `organisations` use-contacts ↔ use-contacts-mutations, use-organisations ↔ organisations.display ; `products` use-products ↔ products-fetcher, use-products ↔ use-product ; `finance` RecipientSelector ↔ SendDocumentEmailModal ↔ send-document-helpers ; `stock` hooks/index ↔ use-stock-dashboard. Limite : 104 avertissements (alias `@verone/*` non résolus par madge) ⇒ les cycles **entre** packages ne sont pas vus par cet outil. | [C37]     |
| Premier plafond                                                                         | **Déjà atteint** : instance minuscule saturée par intermittence (§ 2) à 294 Mo et 2 utilisateurs. La croissance des données n'est pas le facteur limitant ; le trafic de fond l'est.                                                                                                                                                                                                                                                                      | [C9][C21] |

---

## 5. Trois listes

### (a) Se corrige dans le code — aucune base touchée

1. **Menu de gauche** : ne s'abonner qu'aux tables réellement publiées (`products`, `sales_orders`) ;
   supprimer les 5 canaux voués à l'échec et celui sur la vue ⇒ plus de bascule en interrogation toutes
   les 30 s ; ajouter un délai de regroupement (≥ 1 s) sur les événements ; ne rien interroger quand
   l'onglet est masqué (`document.visibilityState`).
2. **Compteur de mails de l'en-tête** : même traitement (arrêt quand l'onglet est masqué, intervalle long).
3. **Contrôle CI de dérive** (`scripts/db-drift-check.py`) : remplacer `information_schema` par `pg_catalog`
   (`pg_constraint`), ou ne plus le lancer contre la production pendant les heures de travail. Fichier
   `.github/workflows/quality.yml:722-744`.
4. **Journal de navigation** : supprimer le `getUser()` réseau à chaque envoi ; décider (Roméo) si les
   clics restent enregistrés.
5. **Page Inventaire** : une seule requête ensembliste `stock_movements … in('product_id', ids)`.
6. **Notifications du tableau de bord** : la requête sur `user_profiles.role` échoue en silence.

### (b) Exige une migration ou des droits — accord écrit de Roméo

1. `REVOKE EXECUTE … FROM anon` sur les fonctions exposées, en commençant par `reset_finance_auto_data`,
   puis garde-fou en fin de migration (Bloc H).
2. Fonction unique `get_sidebar_counts()` renvoyant les 11 nombres.
3. Réécriture de `get_stock_alerts_count()` : comptage direct sans tri ni sous-requête d'image, ou fonction
   dont le plan est réutilisé.
4. Toute modification de la publication temps réel (ajouter des tables **augmenterait** la charge
   Realtime — à éviter tant que la cause 1 n'est pas réglée).
5. Taille de l'instance Supabase (coût mensuel) : **décision financière de Roméo**, à ne considérer
   qu'après les points (a)1 et (a)3, mesure à l'appui.

### (c) Touche à des données existantes — constat seulement

1. `user_activity_logs` : 106 Mo, 123 575 lignes, aucune rétention, lecteurs limités à 30 jours.
2. `audit_logs` : 76 Mo, 92 717 lignes, aucune rétention trouvée.
3. `user_sessions` : 12 791 lignes alimentées par le trigger du journal.

---

## 6. Ordre recommandé — et la mesure qui prouvera chaque gain

La mesure « avant/après » se fait par **différence de deux relevés** (`calls`, `total_exec_time`) de
`pg_stat_statements` et des `edge_logs`, sans remise à zéro.

| #   | Action                                                                 | Liste                   | Mesure de preuve                                                                                                                   |
| --- | ---------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Menu + en-tête : supprimer la bascule en interrogation toutes les 30 s | (a)                     | `edge_logs` : appels `HEAD` en heures de travail **13 004 → < 1 500** ; part des appels > 2 s **11,7 % → < 2 %**                   |
| 2   | Contrôle CI de dérive : `pg_catalog` ou hors production                | (a)                     | `pg_stat_statements` de cette requête : moyenne **5 510 ms → < 200 ms**, blocs **4,24 M → < 20 000**                               |
| 3   | `REVOKE` des fonctions exposées (`reset_finance_auto_data` d'abord)    | (b)                     | `has_function_privilege('anon', …)` : 332 → cible validée ; advisor sécurité repassé au vert                                       |
| 4   | Remesurer l'intermittence **avant** d'aller plus loin                  | —                       | Delta sur 1 journée : part Realtime du temps base (63 %) ; nombre d'instructions triviales > 5 s ; p95 horaire `/rest` (2,2-4,6 s) |
| 5   | `get_sidebar_counts()` en un appel                                     | (b)                     | 11 appels par tour → 1 ; plancher `sales_orders` 7 ms disparu                                                                      |
| 6   | Réécrire `get_stock_alerts_count()`                                    | (b)                     | min/moyenne en production : 3,3 / 141 ms → < 2 / < 10 ms                                                                           |
| 7   | Inventaire en une requête                                              | (a)                     | 222 → 2 requêtes au chargement (navigateur)                                                                                        |
| 8   | Journal : `getUser` par envoi supprimé ; rétention = décision Roméo    | (a)+(c)                 | `edge_logs` `/auth/v1/user` : 2 054 en 9 h → baisse                                                                                |
| 9   | Taille d'instance, seulement si 1-4 n'ont pas suffi                    | (b) décision financière | mêmes indicateurs qu'en 4                                                                                                          |

Écartés, mesure à l'appui : rôle dans le jeton (gain ×2-3, révocation différée) ; `force-dynamic` ;
27 index sur clés étrangères ; `ANALYZE` comme correctif ; Bloc E ; toute enveloppe
`(select is_backoffice_user())` dans une policy.

---

## 7. Ce qui n'a pas pu être mesuré, et pourquoi

| Point                                                                                                           | Raison                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q16 navigateur** (tableau de bord, Inventaire, Commandes, fiche produit ; 3 chargements ; 3 min d'inactivité) | **Non mesuré** : le back-office local ne répond pas sur 3003 (seul le port 3000 écoute, [C39]). **Roméo : lance ton back-office et donne-moi le port**, avec ta session ouverte dans la fenêtre de test. |
| Corrélation horaire des pics avec la CI ou Realtime                                                             | pas de journal des requêtes lentes côté Postgres [C25]                                                                                                                                                   |
| Consommation CPU / crédits d'entrée-sortie de l'instance                                                        | non visibles en SQL ni dans les logs interrogeables                                                                                                                                                      |
| Historique complet de `pg_stat_statements`                                                                      | 131 évictions (`dealloc`) sur un maximum de 5 000 entrées [C4] : les requêtes rares anciennes ont pu disparaître ; les grosses sont présentes                                                            |
| Coût Realtime par abonné et par modification                                                                    | 0 abonnement au moment de la mesure [C16]                                                                                                                                                                |
| Nombre de routes sans contrôle (Bloc G), origine des 17 nouvelles fonctions (Bloc H)                            | hors du périmètre mesuré dans ce rapport                                                                                                                                                                 |
| Vue d'alertes à nu : 5 passages demandés                                                                        | 3 passages, écart < 3 %, arrêt volontaire                                                                                                                                                                |
| Cycles entre packages via madge                                                                                 | madge ne résout pas les alias `@verone/*` ; cycles de packages mesurés par le graphe d'imports [C36]                                                                                                     |

---

## Annexe — commandes, dans l'ordre, avec résultat résumé

- **[C1]** `date; pwd; git remote -v; git branch --show-current; git status --short` → 2026-09-11 18:05, dossier et dépôt conformes, branche `feat/VER-CANAL-WIN-001-flux-want-it-now`, arbre décrit § 0.
- **[C2]** MCP `get_project_url` → `https://aorroydfjsrygmosnzrl.supabase.co`.
- **[C3]** `ls supabase/migrations/*.sql | wc -l` → 771.
- **[C4]** `SELECT count(*) FROM pg_class … relkind IN ('r','p')` (133) ; `information_schema.tables … BASE TABLE` (133) ; `count(*), min(version), max(version) FROM supabase_migrations.schema_migrations` (437, 20251012, 20260911012000) ; `pg_database_size` (294 MB) ; `pg_stat_statements_info` (reset 2025-09-05 14:06 UTC, dealloc 131) ; `pg_stat_statements.max` (5000).
- **[C5]** `SELECT rank, rolname, calls, mean, max, stddev, min, shared_blks_hit/calls, 100*total/sum(total) FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 25` → rangs 1,2,4,5,6,9 Realtime (`supabase_admin`) ; 3 `get_stock_alerts_count` 6,71 % ; 7 count `bank_transactions` 1,96 % ; 8 INSERT `user_activity_logs` 1,91 % ; 10 `get_activity_stats` 1,53 % ; 11-13,15 compteurs ; 14 `set_config` PostgREST (8,3 M appels) ; 16 FK `information_schema` (`postgres`, 5,5 s) ; 17 purge `net._http_response` ; 18 `get_site_internet_products` (`anon`) ; 19 `invoke_edge_function` (cron) ; 20,23 `notifications` ; 21 `bank_transactions.*` ; 22 `v_matching_rules_with_org` ; 24 `get_site_internet_products` (`service_role`) ; 25 `pg_timezone_names` (`authenticator`).
- **[C6]** `SELECT 100*sum(total) FILTER (WHERE query ~* '(realtime\.|wal->>|pg_publication_tables|list_changes)')/sum(total)` → 63 ; appels Realtime 46 796 389 ; part rôles applicatifs 31 ; total 106 h.
- **[C7]** (matin, `mesures-performance.md`) totaux par compteur du menu ≈ 57 000 s.
- **[C8]** `SELECT label, calls, min, mean, stddev, max, mean/min FROM pg_stat_statements` filtré par motif (INSERT `user_activity_logs`, `get_stock_alerts_count`, counts) → valeurs § 3 A, C.
- **[C9]** `SELECT name, setting, unit FROM pg_settings WHERE name IN (…)` → shared_buffers 28 672 × 8 kB, effective_cache_size 49 152 × 8 kB, work_mem 2 184 kB, max_parallel_workers 2, per_gather 1, max_worker_processes 6, max_connections 60, random_page_cost 1.1 ; connexions actives 1, clientes 14.
- **[C10]** `SELECT count(*) FILTER (WHERE max_exec_time > 5000), … AND mean_exec_time < 10, … < 1, max > 2000 FROM pg_stat_statements` → 100 ; 15 ; 6 ; 259 ; par rôle (moyenne < 10 ms) : supabase_admin 6, supabase_auth_admin 6, authenticated 2, authenticator 1.
- **[C11]** `SELECT … WHERE max_exec_time > 5000 AND mean_exec_time < 10 ORDER BY calls DESC LIMIT 15` → Realtime (max 9,9-24 s), `set_config` 0,57/6 220 ms, `mfa_amr_claims` 0,16/6 996, `identities` 0,10/10 044, `users` 0,37/12 532, `sessions` 0,25/9 551, `SET client_encoding` 0,06/7 920, `media_assets` count 8,6/7 113.
- **[C12]** `EXPLAIN (ANALYZE, BUFFERS) SELECT public.get_stock_alerts_count();` × 5 (`postgres`) ; même chose précédé de `SELECT set_config('role','authenticated',true), set_config('request.jwt.claims', json_build_object('sub',<admin back-office actif>,'role','authenticated','aud','authenticated')::text, true);` × 5 ; vérification de l'usurpation : `current_user = authenticated`, `auth.uid()` non nul, `is_backoffice_user() = true`, 236 produits visibles ; `EXPLAIN (ANALYZE, BUFFERS) SELECT public.get_stock_alerts_count() FROM generate_series(1,5)` → 11,586 ms.
- **[C13]** `EXPLAIN (ANALYZE, BUFFERS[, COSTS OFF, TIMING OFF]) SELECT COUNT(*)::INTEGER FROM public.stock_alerts_unified_view WHERE alert_type != 'none';` × 3 `postgres`, × 3 `authenticated` (même `set_config`) ; `SELECT reloptions, owner FROM pg_class WHERE relname='stock_alerts_unified_view'` → `security_invoker=true`, `postgres`.
- **[C14]** `SELECT relname, n_live_tup, n_mod_since_analyze, last_analyze, last_autoanalyze, seq_scan, seq_tup_read, idx_scan FROM pg_stat_user_tables WHERE relname IN (5 tables)` → tableau § 3 B ; réglages autovacuum (matin) 50 / 0.1 ; `EXISTS(pg_proc pg_restore_relation_stats)` → false ; estimations vs réel (matin, `mesures-performance-complements.md`).
- **[C16]** `pg_publication_tables WHERE pubname='supabase_realtime'` → `products`, `sales_orders` ; `pg_publication` → 2 ; `count(*) FROM realtime.subscription` → 0 ; `pg_replication_slots` → 0.
- **[C17]** `has_function_privilege('anon', oid, 'EXECUTE')` sur `public` : SECURITY DEFINER 332, dont `prorettype='trigger'` 108 ; toutes 571/574 ; `reset_finance_auto_data(boolean)` secdef=t anon=t authenticated=t ; `pg_policy` public 334, `polroles='{0}'` 37 sur 20 tables ; `pg_policies ~ 'is_backoffice_user\('` 216 ; `roles='{public}'` et `is_backoffice_user` 4.
- **[C18]** `SELECT … FROM pg_stat_statements WHERE query ILIKE '%information_schema%' OR '%pg_timezone_names%' …` → tableau cause 3.
- **[C19]** (matin) `pg_policies`, `pg_indexes`, `pg_trigger` sur `user_activity_logs` ; `cron.job` ; `pg_total_relation_size` (106 MB, `user_sessions` 12 MB, `audit_logs` 76 MB) ; `pg_get_functiondef('update_user_session')`.
- **[C20]** MCP `get_advisors(performance)` → sortie JSON analysée par `python3 json.loads(...)['result']['lints']` : 251 / 238 / 27 / 3 / 3 / 1 = 523.
- **[C21]** `query_logs` : `select toStartOfHour(timestamp), count(*), quantile(0.5|0.95)(origin_time), max, countIf(>2000) from logs where source='edge_logs' and startsWith(request.path,'/rest/') group by hour` → 2026-09-10 16:00 → 2026-09-11 16:00 UTC ; 07-14 h : 1 428-1 791 appels/h, p95 2 205-4 581 ms, max 3 961-8 847 ms, 100-358 appels > 2 s/h ; nuit : 18-80 appels/h, p50 207-962 ms.
- **[C22]** `query_logs` : totaux 07:00-15:55 UTC → tous 16 551, `/rest` 14 464, compteurs 13 004, préflights OPTIONS 1 262, `/auth/v1/user` 2 054, `/rest` > 2 s 1 698, compteurs > 2 s 1 556 ; par méthode+chemin (06-18 h) : HEAD `sales_orders` 3 002 (p95 2 975, 376 > 2 s), GET `/auth/v1/user` 2 047 (p95 185), HEAD `products` 2 005, HEAD `form_submissions` 1 997, HEAD `bank_transactions` 1 005, HEAD `linkme_orders_enriched` 1 005 (max 8 847), HEAD `client_consultations` 1 005, HEAD `email_messages` 1 003, POST `rpc/get_stock_alerts_count` 1 002, HEAD `linkme_info_requests` 1 001, POST `user_activity_logs` 28 (p50 362, p95 3 421).
- **[C23]** `query_logs` : `group by extract(referer,'^(https?://[^/]+)')` → `https://verone-back-office.vercel.app` 16 306 appels, 2 sessions, 1 695 > 2 s ; vide 187 ; `www.veronecollections.fr` 58.
- **[C24]** lecture `use-sidebar-counts.ts:144-216` (11 requêtes) et `use-unread-mails-count.ts` (30 000 ms).
- **[C25]** `query_logs` `postgres_logs` par heure → 36-55 messages/h (checkpoints toutes les 5 min, cron), 0 « duration ».
- **[C27]** `SELECT count(*) FROM pg_stat_user_tables` (185) ; `… WHERE greatest(last_analyze,last_autoanalyze) < now()-30 days` (174) ; idem `public` (136 / 130).
- **[C29]** (matin) `pg_indexes WHERE tablename='user_app_roles'` → 10 index.
- **[C30]** (matin) `SELECT month, count(*), page_view, user_click FROM user_activity_logs GROUP BY month` → oct. 2025 14 128 … août 2026 81, sept. 948.
- **[C31]** `/usr/bin/grep -n "pollingInterval|enableRealtime|subscribe(|CHANNEL_ERROR|table: '"` sur `use-sidebar-counts.ts` → défaut 30 000 ms (l.89,95), bascule sur `CHANNEL_ERROR` (l.356-366), 7 tables (l.376-468) ; lecture `use-user-activity-tracker.ts:59-60,80-130`.
- **[C32]** `/usr/bin/grep -rn "user_activity_logs|user_sessions|get_user_recent_actions|get_user_activity_stats"` apps/ packages/ → lecteurs § 3 A ; `pg_stat_statements` des RPC → 1 655 / 164 / 157.
- **[C33]** `/usr/bin/grep -rln information_schema.table_constraints scripts .github packages apps` → `scripts/db-drift-check.py`, `scripts/generate-docs.py` ; `quality.yml:3-12` (déclenchement `pull_request` vers main/staging/integration/_ + `workflow_dispatch`), `:722-744` (job `db-drift-check`, `SUPABASE_DB_URL`) ; `db-drift-cron.yml:16-18` (`0 6 _ \* 1`).
- **[C34]** noms extraits par `grep -rhoiE "create table[[:space:]]+(if not exists[[:space:]]+)?[\"a-z_.]+"` et `"… rename to …"` sur `supabase/migrations`, comparés par `comm -23` à la liste `pg_class` → 61 manquantes ; `comm -13` → 22 disparues.
- **[C35]** `find . -size +100k \( -name "*.ts" -o -name "*.d.ts" -o -name "*.generated" \) | xargs /usr/bin/grep -lE "export (declare )?(type Database ?=|interface Database)"` (hors node_modules/.next/.git) → 7 fichiers.
- **[C36]** (après-midi, `mesures-scalabilite.md`) `/usr/bin/grep -rhoE "from ['\"]@verone/[a-z-]+"` par package, hors tests → 101 arêtes, 13 paires mutuelles, 41 non déclarées.
- **[C37]** `node_modules/.bin/madge --circular --no-spinner --extensions ts,tsx --exclude '(node_modules|dist|\.next|__tests__|\.test\.|\.spec\.)' packages/@verone/*/src` → 1 460 fichiers, 104 avertissements, 7 cycles.
- **[C38]** `ls apps/back-office/src/middleware.ts` → absent ; `git show cc10edae:apps/back-office/src/middleware.ts | grep -n "console\.|observe|enforce|API_GUARD"` → l.29, 87, 100 ; `find apps/back-office/src/app/api -name route.ts | wc -l` → 152.
- **[C39]** `curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/login` → 000 ; `lsof -iTCP -sTCP:LISTEN` → seul `*:3000`.
