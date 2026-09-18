# Compléments performance — 2026-09-11 (après retour Roméo)

Lecture seule. Aucun `ANALYZE`, aucun `SET`, aucune écriture.

---

## 1. Hypothèse « statistiques périmées » — mesurée, **largement infirmée**

### Ce que disent les dates… et ce qu'elles ne disent pas

La fraîcheur des statistiques ne se juge pas à la date de la dernière analyse, mais au **nombre de
lignes modifiées depuis** (`n_mod_since_analyze`). Une table qui ne change pas garde des statistiques justes.

```sql
SELECT relname, n_live_tup, n_mod_since_analyze, last_analyze, last_autoanalyze FROM pg_stat_user_tables ...
```

| Table              | Lignes  | Modifiées depuis la dernière analyse | Dernière analyse (manuelle / auto) |
| ------------------ | ------- | ------------------------------------ | ---------------------------------- |
| user_app_roles     | 9       | **5**                                | 2026-03-11 / 2026-02-13            |
| organisations      | 223     | **24**                               | 2025-10-17 / 2026-05-08            |
| products           | 236     | **29**                               | 2025-11-02 / 2026-07-29            |
| sales_orders       | 190     | **1**                                | 2026-03-11 / 2026-09-09            |
| bank_transactions  | 737     | 50                                   | — / 2026-06-29                     |
| stock_movements    | 404     | 12                                   | 2026-03-11 / 2026-07-29            |
| audit_logs         | 92 717  | 3 030 (3 %)                          | 2026-04-01 / 2026-02-15            |
| user_activity_logs | 123 575 | 5 748 (5 %)                          | — / 2026-05-29                     |
| auth.users         | 14      | 2                                    | 2026-05-08 / **2026-09-11**        |

Seuil d'analyse automatique : 50 lignes + 10 % (`autovacuum_analyze_threshold=50`, `scale_factor=0.1`).
Les petites tables ne l'atteignent presque jamais : **80 tables `public` sur 136 n'ont jamais été
analysées, 79 n'ont aucune statistique** (dont `client_consultations`, `email_messages`,
`linkme_info_requests`, `form_submissions`).

### Les estimations du planificateur contre la réalité (mesuré)

| Requête                                     | Lignes estimées | Lignes réelles |
| ------------------------------------------- | --------------- | -------------- |
| `sales_orders` status=validated             | 8               | 8              |
| `products` archived_at IS NULL              | 222             | 221            |
| `bank_transactions` unmatched               | 102             | 107            |
| `client_consultations` (aucune statistique) | 1               | 2              |
| `linkme_info_requests` (aucune statistique) | 1               | 0              |
| `stock_alert_tracking`                      | 24              | 2              |

Le planificateur estime juste, y compris sur les tables sans statistiques (elles sont minuscules).
**Des statistiques rafraîchies ne changeraient aucun de ces plans.**

### a) Temps de préparation (planning), à chaud et à froid

| Requête (rôle `postgres`, sans règles)  | 1er passage (froid) | 2e passage (chaud)   |
| --------------------------------------- | ------------------- | -------------------- |
| count `sales_orders` validated          | 27,9 ms             | 1,6 ms               |
| vue d'alertes stock (corps du compteur) | 79,7 ms             | 7,2 ms               |
| count `bank_transactions` unmatched     | 23,2 ms             | 0,8 ms (autre forme) |
| count `client_consultations`            | —                   | 1,1 ms               |
| count `linkme_info_requests`            | —                   | 0,6 ms               |

L'écart froid/chaud (×10 à ×17) vient du **cache interne de chaque connexion** (catalogue chargé à la
première utilisation), pas des statistiques des tables : les mêmes statistiques servent aux deux passages.

### b) Les 141 ms du compteur d'alertes stock

`pg_stat_statements`, 180 510 appels : **min 3,3 ms · moyenne 141 ms · écart-type 382 ms · max 7,7 s**,
1 262 blocs lus par appel (= les 1 328 blocs de préparation mesurés). Donc :

- chaque appel **re-prépare la vue** (fonction SQL `SECURITY DEFINER` + `SET search_path` ⇒ jamais
  inlinée, plan jamais réutilisé d'un appel à l'autre) : 7 ms à chaud, 80 ms à froid ;
- la moyenne est tirée par une queue de pics (écart-type 382 ms, max 7,7 s) : connexions froides
  et instance petite (`shared_buffers` 224 MB, `max_connections` 60 ⇒ plus petite taille de calcul).
  Connexions PostgREST observées : 11, dont la plus jeune a 14 s (le pool en recycle en permanence).

Les statistiques n'y sont pour rien.

### Même constat sur les compteurs du menu

| Compteur                       | min     | moyenne | écart-type | max   | blocs/appel | Sans règles, à chaud |
| ------------------------------ | ------- | ------- | ---------- | ----- | ----------- | -------------------- |
| sales_orders draft             | 7,3 ms  | 51 ms   | 122        | 7,5 s | 612         | 0,14 ms / 10 blocs   |
| sales_orders validated+partial | 7,3 ms  | 50 ms   | 113        | 3,9 s | 607         | idem                 |
| bank_transactions unmatched    | 4,0 ms  | 71 ms   | 196        | 7,1 s | 437         | 45 blocs             |
| products sans description      | 0,75 ms | 53 ms   | 155        | 7,0 s | 375         | —                    |
| client_consultations           | 0,02 ms | 11,5 ms | 54         | 4,2 s | 154         | 0,1 ms               |

Le **minimum** de `sales_orders` (7,3 ms) correspond au calcul : 190 lignes × 2 appels de fonction de
droits × ~20 µs ≈ 7,6 ms. C'est le plancher dû aux règles de sécurité. La moyenne (50 ms) est faite
de pics à froid.

### c) Coût d'un `ANALYZE`

- Lit un échantillon de 30 000 lignes maximum par table (`default_statistics_target=100`). Tables
  concernées : toutes < 124 000 lignes, schéma `public` = 223 MB. Ordre de grandeur : **quelques
  secondes au total** (non mesuré : ce serait l'exécuter).
- Verrou `SHARE UPDATE EXCLUSIVE` : **ne bloque ni les lectures ni les écritures** ; bloque seulement
  une autre maintenance ou un changement de structure sur la même table pendant l'analyse.
- Droits : `postgres` peut analyser `public` et `auth` (`MAINTAIN` = oui) mais **pas les tables système**
  (`pg_class` : `MAINTAIN` = non).
- Retour arrière : **il n'existe pas de retour arrière exact** en Postgres 17 (`pg_restore_relation_stats`
  n'existe qu'à partir de Postgres 18 : vérifié absent). On peut photographier `pg_stats` avant, et en
  cas de mauvais plan, relancer `ANALYZE` ou forcer les statistiques d'une colonne. « Réversible par
  construction » est donc inexact : c'est _auto-correctif_, pas réversible.

### Conclusion

Gain attendu mesuré : **≈ 0** sur les requêtes lentes identifiées. Coût et risque très faibles. Je le
classe en **hygiène**, pas en correction n° 1. Le rafraîchissement du 8 mai portait sur `auth` et les
tables système, juste après 64 modifications de règles en rafale : situation différente d'aujourd'hui
(`pg_policy` : 45 modifications depuis, `auth.users` analysée ce matin).

---

## 2. Le journal de navigation — lecture du code

### Je corrige ce que j'ai écrit au premier rapport

J'avais écrit « une ligne écrite à chaque page vue, 107 ms chacune ». **C'est inexact.**

- `packages/@verone/notifications/src/hooks/use-user-activity-tracker.ts:59-60` : `BATCH_SIZE = 50`,
  `BATCH_INTERVAL = 60 000 ms`. Les événements (pages vues, clics limités à 1/s, erreurs JavaScript)
  sont mis **en file d'attente**, puis envoyés en **un seul INSERT groupé** toutes les 60 s, ou dès 50
  événements, ou à la fermeture de la page.
- La page vue est elle-même différée (`activity-tracker-provider.tsx`, `setTimeout(…, 0)`).
- **L'écriture n'est pas dans le chemin du rendu.** Les 107 ms sont payés en arrière-plan ; l'utilisateur
  ne les attend pas.
- Coût caché : chaque envoi refait un `supabase.auth.getUser()` (aller-retour vers le service de
  connexion, `use-user-activity-tracker.ts:~84`), et chaque INSERT déclenche `update_user_session`
  (UPSERT dans `user_sessions`, 12 791 lignes, 12 MB) et met à jour 6 index.

### Volume réel par mois (`user_activity_logs`)

| Mois            | Lignes | dont pages vues | Utilisateurs |
| --------------- | ------ | --------------- | ------------ |
| 2025-10         | 14 128 | 9 616           | 1            |
| 2025-11         | 20 035 | 12 237          | 1            |
| 2026-02         | 17 177 | 10 354          | 3            |
| 2026-03         | 18 498 | 10 200          | 7            |
| 2026-05         | 6 450  | 4 072           | 4            |
| 2026-06         | 1 629  | 1 147           | 2            |
| 2026-07         | 3 014  | 1 659           | 2            |
| **2026-08**     | **81** | 34              | 1            |
| 2026-09 (au 11) | 948    | 481             | 3            |

Écriture actuelle : **~1 000 lignes par mois**, contre 20 000 fin 2025. Le coût base d'aujourd'hui est
faible ; les 106 MB sont **l'historique** (octobre 2025 → avril 2026 surtout).

### Qui lit cette table

| Écran                                       | Chemin                                                                                                     | Ce qui est lu                                                                                                                                  | Appels en 1 an               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Admin → Activité utilisateurs               | `admin/activite-utilisateurs/page.tsx:56` → `api/admin/users/route.ts:92`                                  | RPC `get_user_activity_stats` (lit `user_sessions`) par profil                                                                                 | 1 655 + 164                  |
| Admin → fiche utilisateur → onglet Activité | `admin/users/[id]/components/user-activity-tab.tsx:70` → `api/admin/users/[id]/activity/route.ts:62,75,89` | 50 dernières actions (`get_user_recent_actions`), stats 30 j, 5 dernières sessions                                                             | 157                          |
| LinkMe → Utilisateurs → fiche               | `canaux-vente/linkme/utilisateurs/[id]/components/UserNavigationStats.tsx:179`                             | 500 dernières pages vues + stats 30 j                                                                                                          | (inclus ci-dessus)           |
| LinkMe → Tableau de bord                    | `use-recent-activity.ts:135` via `DashboardSection.tsx`                                                    | 10 dernières actions                                                                                                                           | (inclus)                     |
| Tableau de bord → notifications             | `dashboard-notifications.fetchers-orders.ts:163` via `use-dashboard-notifications.ts:99`                   | 3 dernières erreurs des dernières 24 h — **demande `user_profiles.role`, colonne inexistante** : la requête échoue en silence (erreur non lue) | —                            |
| `useUserModuleMetrics`                      | `packages/@verone/dashboard/src/hooks/metrics/use-user-module-metrics.ts:100`                              | —                                                                                                                                              | **aucun écran ne l'utilise** |

Tous les lecteurs se limitent aux **30 derniers jours** ou aux **N dernières lignes**. Aucun écran ne lit
l'historique au-delà d'un mois. Aucun export trouvé.

Écritures : le traceur ci-dessus, plus `api/analytics/batch/route.ts:102` et `api/analytics/events/route.ts:93`
appelées par `packages/@verone/utils/src/analytics/gdpr-analytics-engine.ts:271,294`.

### Purge / rétention

**Aucune.** Aucune tâche planifiée (`cron.job` : 3 tâches, aucune sur ces tables), aucune fonction de
purge. Seule trace : une suppression ponctuelle dans `audit_logs` (`20260208_003_cleanup_orphan_accounts.sql:15`).

Aucune suppression proposée tant que Roméo n'a pas tranché sur l'usage.

---

## 3. « Lire les droits une seule fois par requête » — détail de la piste

### Le principe

PostgREST (le service qui reçoit toutes les requêtes du navigateur) sait exécuter une fonction **au
début de chaque requête**, dans la même transaction : réglage `pgrst.db_pre_request` (documenté par
Supabase, guide « Securing your API » ; aucun n'est configuré aujourd'hui : `pg_db_role_setting` de
`authenticator` = `session_preload_libraries`, `statement_timeout`, `lock_timeout` seulement).

1. Cette fonction lit `user_app_roles` **une fois**, et pose le résultat dans un réglage local à la
   transaction (`set_config('verone.is_backoffice', 'on'|'off', true)`).
2. `is_backoffice_user()` garde **exactement la même signature** et devient : « lire ce réglage ; s'il
   est absent, faire l'ancienne vérification ».
3. **Aucune règle de sécurité n'est modifiée. Rien n'est stocké dans le jeton.** Un droit retiré est
   effectif à la requête suivante.

### Pourquoi le repli est indispensable

La documentation Supabase le précise : la fonction de début de requête **ne s'exécute pas** pour le temps
réel (Realtime) ni pour le stockage de fichiers (Storage). Or le menu de gauche écoute 7 tables en temps
réel, et 3 règles de `storage.objects` appellent `is_backoffice_user()`. Sans repli, ces chemins
verraient « pas du back-office » ⇒ plus de mises à jour en temps réel, fichiers refusés.

### Gain mesuré / calculé

|                                                   | Aujourd'hui                                   | Avec la piste                                                 |
| ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| Coût par évaluation                               | 13,6 µs mesuré (≈ 22 µs avec jeton)           | ≈ 0,4 µs (lecture d'un réglage, mesuré sur `current_setting`) |
| Préparation du corps de fonction à chaque requête | oui (≈ 400-600 blocs lus en plus par requête) | non, si la fonction est « inlinable » (voir risque 3)         |
| Lectures de `user_app_roles`                      | 1 par ligne évaluée                           | 1 par requête                                                 |
| Plancher d'un compteur `sales_orders`             | ≈ 7,3 ms                                      | ≈ 0,2-0,5 ms (estimation)                                     |

Ce qui **ne change pas** : les pics dus aux connexions froides et à la petite instance.

### Risques à instruire avant toute exécution

1. **Si la fonction de début de requête plante, toutes les requêtes du navigateur échouent** — back-office,
   LinkMe et site internet. Retour arrière en une commande (`ALTER ROLE authenticator RESET
pgrst.db_pre_request` + rechargement) ; à répéter d'abord sur une copie.
2. **Réglage falsifiable ?** Un appelant ne peut pas poser `verone.is_backoffice` lui-même par
   PostgREST, _sauf_ via une fonction exposée qui exécute du SQL arbitraire ou un `set_config` à nom
   variable. Vérifié en base : **aucune fonction `exec_sql` / `execute_sql` / `run_sql`** n'existe
   (la route signalée par `FINDINGS.md` appelle donc un RPC inexistant) et **aucune fonction `public`
   n'appelle `set_config` avec un nom variable**. À revérifier le jour de l'exécution, et à ajouter
   comme contrôle permanent.
3. **Inlining vs sécurité** : pour gagner le maximum, la fonction ne doit pas être `SECURITY DEFINER`
   ni porter `SET search_path` (sinon Postgres ne peut pas l'inliner). Le repli, lui, doit rester dans une
   fonction `SECURITY DEFINER` séparée. Le linter Supabase signalera `function_search_path_mutable` :
   noms entièrement qualifiés obligatoires. À mesurer sur une copie, pas à supposer.
4. **Pas une modification de règles, mais une modification de base** (une fonction + un réglage de
   rôle) ⇒ accord Roméo, fenêtre sans salariés connectés, test sur branche Supabase ou copie locale.
