# BO-SEC-007 — Préparation : 4 policies « ouvertes à tous » (2026-09-14)

**Statut : PRÉPARÉ, NON APPLIQUÉ — attend l'accord écrit de Roméo.**
Migration : `supabase/migrations/20260914190000_bo_sec_007_open_policies.sql`.
Aucune écriture persistante en base, aucune fonction ni aucun déclencheur modifié, aucun git.
Complète `B3-tables-anon-hors-lot5-2026-09-14.md` (constats § 4.1, 4.2, 4.8).

## 1. Constats (état production relu le 2026-09-14)

| table              | policy ouverte                                                             | effet mesuré                                                                                                                | lignes  |
| ------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------- |
| user_sessions      | `service_manage_sessions` ALL TO public USING (true), sans CHECK           | anon **lit 12 828/12 828**, peut UPDATE/DELETE ; affilié LinkMe lit 12 828 (au lieu de ses 90)                              | 12 828  |
| user_activity_logs | `service_insert_activity` INSERT TO public CHECK (true)                    | anon peut insérer (seul `action` obligatoire)                                                                               | 123 954 |
| notifications      | `notifications_insert_system` INSERT TO public CHECK (true)                | anon peut insérer (type, severity, title, message)                                                                          | 1 740   |
| stock_movements    | `system_triggers_can_insert_stock_movements` INSERT TO public CHECK (true) | anon peut insérer → déclencheurs `trg_sync_product_stock_after_movement`, `trg_update_stock_alert`, `audit_stock_movements` | 404     |

Droits de table : `anon=arwdDxtm` (tout, y compris TRUNCATE) sur les 4. RLS active, pas de FORCE RLS.
Aucune des 4 tables n'est dans une publication temps réel. `pg_stat_statements.track = top` (les requêtes
exécutées à l'intérieur des déclencheurs ne sont pas comptées). Rôles : `postgres` et `service_role` ont
BYPASSRLS ; `anon` / `authenticated` non.

### Correction d'un constat de départ

Les « 65 appels anon d'écriture » sur `stock_movements` sont en réalité **65 LECTURES** (aucune écriture anon
enregistrée sur les 4 tables) :

| calls | requête anon (tronquée)                                                                                                              | origine probable                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 23    | `SELECT stock_movements.* WHERE (affects_forecast IS NULL OR affects_forecast = $1) ORDER BY performed_at DESC LIMIT/OFFSET` + count | `packages/@verone/stock/src/hooks/use-movements-history.fetcher.ts:29,51` exécuté hors session (back-office)  |
| 22    | idem `AND performed_at >= $2`                                                                                                        | même fichier (filtre de date)                                                                                 |
| 12    | `SELECT created_at, quantity_change, movement_type WHERE created_at >= $1 ORDER BY created_at`                                       | tableaux de bord back-office hors session (`use-dashboard-analytics.ts:133` / `get-dashboard-metrics.ts:156`) |
| 8     | `SELECT stock_movements.* WHERE (affects_forecast …) LIMIT/OFFSET` + count                                                           | `use-movements-history.fetcher.ts`                                                                            |
| 13    | `SELECT user_sessions.* ORDER BY id, session_id, user_id, organisation_id, session_start, …` (tri sur toutes les colonnes)           | **aucun code** : forme typique d'un outil qui aspire une table entière via l'API REST (origine inconnue)      |
| 2     | `SELECT user_sessions.* LIMIT $1 OFFSET $2`                                                                                          | aucun code, origine inconnue                                                                                  |

**Découverte** : aujourd'hui, toute lecture de `stock_movements` par anon **ou par un affilié LinkMe** échoue
avec `42883 function get_user_role() does not exist`. Cause : la policy SELECT TO public
« Utilisateurs peuvent consulter les mouvements de stock » appelle `user_has_access_to_organisation()`, qui
appelle `get_user_role()` — fonction supprimée. Les salariés ne sont pas touchés (404 lignes lues). Les 65
lectures anon ci-dessus datent donc d'avant cette suppression. **Non traité ici** (voir § 6).

## 2. Qui écrit / lit légitimement

### 2.1 Code (`/usr/bin/grep -rn` dans apps/ et packages/, hors node_modules/.next/types)

| table              | fichier:ligne                                                                                                     | opération                                                                | client                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| user_activity_logs | `packages/@verone/notifications/src/hooks/use-user-activity-tracker.ts:92`                                        | INSERT par lots (60 s), `user_id: user.id`, `session_id` UUID par onglet | navigateur **connecté** (refuse si pas d'utilisateur) ; monté dans back-office (`activity-tracker-provider.tsx:15`) et LinkMe (`LinkmeActivityTrackerProvider.tsx:14`) |
| user_activity_logs | `apps/back-office/src/app/api/analytics/events/route.ts:93`, `analytics/batch/route.ts:102`                       | INSERT `user_id: user.id`                                                | route serveur, cookie (authenticated)                                                                                                                                  |
| user_activity_logs | `UserNavigationStats.tsx:179`, `use-user-module-metrics.ts:100`, `dashboard-notifications.fetchers-orders.ts:163` | SELECT                                                                   | back-office connecté                                                                                                                                                   |
| user_sessions      | `apps/back-office/src/app/api/admin/users/[id]/activity/route.ts:89`                                              | SELECT `.eq('user_id', …)`                                               | route serveur, cookie (salarié)                                                                                                                                        |
| user_sessions      | —                                                                                                                 | aucune écriture dans le code                                             | écrit uniquement par le déclencheur `update_user_session`                                                                                                              |
| notifications      | `use-notification-actions.ts:22,51,59,81`                                                                         | UPDATE `read` / DELETE                                                   | navigateur connecté (propres notifications ou salarié)                                                                                                                 |
| notifications      | `use-notification-actions.ts:125` (`createNotification`)                                                          | INSERT `user_id: data.user_id ?? user.id`                                | navigateur connecté ; **aucun appelant trouvé**                                                                                                                        |
| notifications      | `use-database-notifications.ts:44,55`, `use-affiliate-activity.ts:121`                                            | SELECT                                                                   | connecté                                                                                                                                                               |
| stock_movements    | `use-stock-adjustment-form.ts:163`, `use-stock.ts:380`, `use-stock-movements.ts:502`                              | INSERT                                                                   | back-office connecté (salarié)                                                                                                                                         |
| stock_movements    | `api/stock-movements/[id]/route.ts:64,108`                                                                        | SELECT / DELETE                                                          | route serveur, cookie (salarié)                                                                                                                                        |
| stock_movements    | `packages/@verone/orders/src/hooks/use-sales-orders-stock.ts:106`                                                 | RPC `mark_warehouse_exit`                                                | back-office connecté                                                                                                                                                   |
| stock_movements    | `apps/back-office/src/app/actions/sales-orders.ts:71`                                                             | déclencheurs via `createAdminClient()`                                   | service_role (contourne la RLS)                                                                                                                                        |
| stock_movements    | ~30 lectures (rapports finance, stock, commandes)                                                                 | SELECT                                                                   | back-office connecté                                                                                                                                                   |

Site internet : les commandes passent par `app/api/checkout/helpers/create-order.ts` et le webhook Stripe en
**service_role** (cf. B3) → aucune écriture anon sur ces tables.

### 2.2 Base : fonctions et déclencheurs qui écrivent ces tables

- **SECURITY DEFINER** (propriétaire postgres, BYPASSRLS → non concernés) : tous les écrivains de
  `stock_movements` sauf deux (create*\*\_forecast_movements, process_shipment_stock, update_stock_on_shipment,
  update_stock_on_reception, confirm_packlink_shipment_stock, manage_purchase_order_stock,
  create_stock_on_affiliate_reception_confirm, cancel_order_forecast_movements, create_manual_stock_movement,
  create_purchase_reception_movement, create_purchase_order*_*movements) ; tous les `notify*_`sauf un ;`create_notification_for_owners`.
- **SECURITY INVOKER** (s'exécutent sous le rôle de l'appelant) :

| fonction                                              | attachée à                                                            | écrit                                                       | qui la déclenche                                                                                                                                                             | couvert après correctif par                                                                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `update_user_session`                                 | `user_activity_logs` AFTER INSERT (si session_id et user_id non nuls) | `user_sessions` INSERT … ON CONFLICT (session_id) DO UPDATE | suivi d'activité, rôle authenticated (salariés **et affiliés LinkMe**)                                                                                                       | salariés : `backoffice_full_access_user_sessions` ; affiliés : **nouvelles** `users_insert_own_user_sessions` + `users_update_own_user_sessions` (+ SELECT own existante) |
| `handle_so_item_quantity_change_confirmed` (protégée) | `sales_order_items` AFTER UPDATE                                      | `stock_movements`                                           | uniquement si commande `validated`/`partially_shipped` ; la policy affilié `linkme_users_update_own_order_items` exige `so.status = 'draft'` → seuls salariés / service_role | `backoffice_full_access_stock_movements`                                                                                                                                  |
| `mark_warehouse_exit(p_order_id)`                     | RPC (anon a EXECUTE)                                                  | `stock_movements`, `products`                               | lève « Utilisateur non authentifié » si `auth.uid()` nul ; appelée par le back-office                                                                                        | `backoffice_full_access_stock_movements`                                                                                                                                  |
| `manage_sales_order_stock`                            | **non attachée**                                                      | `stock_movements`                                           | —                                                                                                                                                                            | —                                                                                                                                                                         |
| `notify_affiliate_payment_request_paid`               | `linkme_payment_requests` AFTER UPDATE                                | `notifications` (user_id des affiliés)                      | passage à `paid` : policy affilié limite le CHECK à pending/invoice_received/cancelled → seuls salariés / service_role                                                       | `backoffice_full_access_notifications`                                                                                                                                    |

Aucune fonction de la chaîne n'appelle `net.http_*` (seule `invoke_edge_function` le fait, non concernée).

### 2.3 Données (contrôles)

- `user_activity_logs` 30 j : 1 408 lignes, 0 sans user_id, 0 sans session_id ; app_source back-office 1 325,
  linkme 19, null 64 ; 98 lignes d'utilisateurs hors back-office.
- `user_sessions` : 0 ligne sans user_id. Sessions partagées par 2 utilisateurs : 91 au total, **0 sur 90 jours**
  (dernière 2026-05-26, propriétaire = compte LinkMe `b6c0bdde…`).
- `stock_movements` : 0 ligne sans performed_by, 0 ligne dont performed_by n'est pas un salarié actif.
- `notifications` : 1 398 lignes sans user_id (notifications d'équipe écrites par déclencheurs DEFINER).
- Identifiants `uuid` par défaut sur les 4 tables → les essais n'ont consommé aucune séquence.

## 3. Changement proposé

| table              | policies retirées                            | policies ajoutées                                                                                                              | droits anon                                                                                          |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| user_activity_logs | `service_insert_activity`                    | `users_insert_own_user_activity_logs` INSERT TO authenticated CHECK `user_id = (SELECT auth.uid())`                            | REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN (SELECT gardé, RLS → 0 ligne) |
| user_sessions      | `service_manage_sessions`                    | `users_insert_own_user_sessions` INSERT CHECK own ; `users_update_own_user_sessions` UPDATE USING/CHECK own (TO authenticated) | **REVOKE ALL**                                                                                       |
| notifications      | `notifications_insert_system`                | —                                                                                                                              | REVOKE écritures (SELECT gardé)                                                                      |
| stock_movements    | `system_triggers_can_insert_stock_movements` | —                                                                                                                              | REVOKE écritures (SELECT gardé)                                                                      |

Pourquoi garder SELECT pour anon sur 3 tables : des écrans back-office exécutés avant l'ouverture de session lisent
ces tables en anon ; aujourd'hui ils reçoivent 0 ligne (ou l'erreur 42883 existante) — retirer SELECT les ferait
passer en « permission denied ». Sur `user_sessions`, aucun lecteur anon dans le code → tout est retiré.

SQL complet + bloc RETOUR ARRIÈRE (policies d'origine recréées à l'identique, `GRANT ALL … TO anon`) : voir la
migration. Ordre des verrous dans la migration : `user_activity_logs` avant `user_sessions` (même ordre que le
déclencheur, évite un interblocage avec le suivi d'activité en direct). Types TS inchangés.

## 4. Essais (un seul bloc DO terminé par RAISE EXCEPTION → tout annulé)

Profils : anon (`request.jwt.claims = {"role":"anon"}`) ; salarié back-office `100d2439…` (is_backoffice_user =
true) ; affilié LinkMe `00332214…` (enseigne `de1bcbd7…`, pas de rôle back-office, 90 sessions, 566 journaux).
Écritures refusées vérifiées sans déclencher le stock : mouvement avec `product_id NULL` → 42501 = refus RLS,
23502 = RLS passée mais ligne rejetée avant tout déclencheur (le contrôle RLS précède les contraintes NOT NULL).

### 4.1 Référence avant changement (lecture seule, annulée)

| profil     | user_sessions | dont pas à lui | user_activity_logs | notifications | stock_movements |
| ---------- | ------------- | -------------- | ------------------ | ------------- | --------------- |
| postgres   | 12 828        | —              | 123 954            | 1 740         | 404             |
| anon       | **12 828**    | 12 828         | 0                  | 0             | ERR 42883       |
| salarié BO | 12 828        | 934            | 123 954            | 1 740         | 404             |
| affilié LM | **12 828**    | **12 738**     | 566                | 0             | ERR 42883       |

### 4.2 Après changement — Phase 1 (policies seules) puis Phase 2 (policies + REVOKE anon)

| essai                                                       | Phase 1                                        | Phase 2                             |
| ----------------------------------------------------------- | ---------------------------------------------- | ----------------------------------- |
| A1 anon SELECT user_sessions                                | 0                                              | 42501 permission denied             |
| A2 anon UPDATE user_sessions                                | 0 ligne                                        | 42501 permission denied             |
| A3 anon DELETE user_sessions                                | 0 ligne                                        | 42501 permission denied             |
| A4 anon INSERT user_sessions                                | 42501 RLS                                      | 42501 permission denied             |
| A5 anon INSERT user_activity_logs                           | 42501 RLS                                      | 42501 permission denied             |
| A6 anon SELECT user_activity_logs                           | 0                                              | 0                                   |
| A7 anon INSERT notifications                                | 42501 RLS                                      | 42501 permission denied             |
| A8 anon SELECT notifications                                | 0                                              | 0                                   |
| A9 anon INSERT stock_movements                              | 42501 RLS                                      | 42501 permission denied             |
| A10 anon SELECT stock_movements                             | ERR 42883 (existant)                           | ERR 42883 (existant)                |
| B1–B4 salarié SELECT us / ual / nt / sm                     | 12 828 / 123 954 / 1 740 / 404 (**identique**) | 12 830 / 123 958 / 1 741 / 404 (\*) |
| B5 salarié suivi d'activité, nouvelle session               | 1 ligne (session créée par le déclencheur)     | 1 ligne                             |
| B6 salarié suivi d'activité, même session                   | 1 ligne                                        | 1 ligne                             |
| B7 pages_visited de la session d'essai                      | 2 (branche ON CONFLICT DO UPDATE OK)           | 2                                   |
| B8 salarié crée une notification pour un affilié            | 1 ligne                                        | 1 ligne                             |
| B9 salarié INSERT stock_movements                           | 23502 (RLS passée)                             | 23502 (RLS passée)                  |
| L1 affilié SELECT user_sessions                             | **90** (ses sessions)                          | 91 (\*)                             |
| L2 affilié sessions pas à lui                               | **0**                                          | 0                                   |
| L3 affilié SELECT user_activity_logs                        | 566                                            | 568 (\*)                            |
| L4 affilié SELECT notifications                             | 1 (\*)                                         | 2 (\*)                              |
| L5 affilié suivi d'activité, nouvelle session               | 1 ligne                                        | 1 ligne                             |
| L6 affilié suivi d'activité, même session                   | 1 ligne                                        | 1 ligne                             |
| L7 pages_visited de sa session d'essai                      | 2                                              | 2                                   |
| L8 affilié INSERT journal pour un autre utilisateur         | 42501 RLS                                      | 42501 RLS                           |
| L9 affilié UPDATE session d'un salarié                      | 0 ligne                                        | 0 ligne                             |
| L10 affilié DELETE sa propre session                        | 0 ligne (pas de droit de suppression)          | 0 ligne                             |
| L11 affilié INSERT session pour un autre                    | 42501 RLS                                      | 42501 RLS                           |
| L12 affilié INSERT notification pour un autre               | 42501 RLS                                      | 42501 RLS                           |
| L13 affilié suivi d'activité sur le session_id d'un salarié | 42501 (USING) — voir risque R2                 | 42501                               |
| L14 affilié INSERT stock_movements performed_by = lui       | **23502 (RLS passée)** — voir risque R1        | 23502                               |
| L15 affilié INSERT stock_movements performed_by = salarié   | 42501 RLS                                      | 42501 RLS                           |

(\*) Les compteurs augmentent des lignes d'essai créées plus tôt dans la même transaction (B5/B6, B8, L5/L6), toutes
annulées.

Droits anon mesurés en fin d'essai : user_sessions SELECT/INSERT = false/false ; user_activity_logs,
notifications, stock_movements = true/false.

### 4.3 Preuve qu'aucune modification n'a persisté (relu après l'essai)

- `pg_policies` sur les 4 tables : **15 policies**, définitions identiques à l'état initial (les 4 policies
  ouvertes toujours présentes, aucune policy `users_insert_own_*` / `users_update_own_*`).
- `relacl` : `anon=arwdDxtm/postgres` toujours présent sur les 4 tables.
- Lignes d'essai : 0 dans user_sessions (`session_id LIKE 'bo-sec-007%'`), 0 dans user_activity_logs, 0
  notification « essai ».
- Totaux : user_sessions 12 828, notifications 1 740, stock_movements 404 (identiques).

## 5. Risques restants après application

- **R1 — `users_own_stock_movements` (ALL TO authenticated, `performed_by = auth.uid()`)** : tout compte connecté
  (affilié LinkMe, client du site internet) peut encore créer / modifier / supprimer un mouvement de stock s'il
  se met lui-même en `performed_by` (essai L14 : RLS passée). 0 ligne existante de ce type. Non traité ici :
  table protégée, décision Roméo.
- **R2 — session partagée** : si un navigateur réutilise un `session_id` appartenant à un autre utilisateur non
  salarié, l'INSERT du journal d'activité est refusé (L13) et le lot d'événements est perdu (erreur non bloquante
  côté code). 0 cas en 90 jours ; `session_id` est un UUID par onglet.
- **R3 — Salariés** : aucune différence (ils passent par les policies `backoffice_full_access_*`).
- **R4 — Verrou** : `DROP/CREATE POLICY` pose un verrou exclusif bref sur les 4 tables ; `lock_timeout = 5s` fait
  échouer la migration plutôt que de bloquer le back-office.
- **R5 — Retour arrière** : bloc prêt en fin de migration (recrée les 4 policies d'origine et `GRANT ALL TO anon`).

## 6. Ce qui n'est PAS traité

- La policy SELECT « Utilisateurs peuvent consulter les mouvements de stock » (appelle `get_user_role()` inexistante
  → erreur 42883 pour anon et affiliés) : à retirer ou corriger dans un lot dédié (stock protégé).
- `users_own_stock_movements` trop large (R1).
- `users_own_notifications` FOR ALL : un affilié peut créer / supprimer ses propres notifications (comportement
  existant, faible enjeu).
- EXECUTE d'anon sur `mark_warehouse_exit(uuid)` INVOKER, `calculate_engagement_score` (INVOKER, lit
  user_sessions — 0 ligne pour anon après correctif), `get_user_organisation_id`, `user_has_access_to_organisation`
  : lot R-GRANT fonctions.
- Les autres tables listées dans B3 (organisations, products, linkme_affiliates, shopping_carts, sales_order_events…).
- Origine des 15 lectures anon intégrales de `user_sessions` : inconnue (aucun code) ; à surveiller après correctif
  (elles recevront « permission denied »).
