# Prompt Claude Code — LOT 2 : rendre la base à l'application

`[BO-PERF-BASE-001]` — une PR vers `staging`. **Contient des opérations base : accord écrit de Roméo requis,
et exécution entre 17 h UTC et 07 h UTC uniquement.**

## Contexte mesuré le 18/09 (relevé `pg_stat_statements`, cumul depuis le 05/09/2025)

| Catégorie                                |     Appels | Temps total |       Part |
| ---------------------------------------- | ---------: | ----------: | ---------: |
| Temps réel Supabase                      | 47 832 922 |   240 328 s | **61,5 %** |
| Introspection de la CI sur la production |  8 284 876 |    85 167 s | **21,8 %** |
| Compteur d'alertes stock                 |    189 985 |    26 509 s |  **6,8 %** |
| **Application**                          | 21 956 131 |    25 258 s |  **6,5 %** |
| Journal de navigation                    |     69 320 |     7 560 s |      1,9 % |

Conséquence directe : quand la base sature, le service d'authentification ne la joint plus et répond 500
(31 erreurs le 17/09 16 h UTC, 95 le 18/09) — c'est ce qui a mis une collaboratrice dehors.

## Travail

### 2.1 Couper le temps réel (accord base)

- 2 tables publiées : `sales_orders`, `products`. 2 canaux dans le code, tous deux dans
  `packages/@verone/notifications/src/hooks/use-sidebar-counts.ts:73` et `:86`.
- Ces deux pastilles sont déjà servies par le RPC `get_sidebar_counts`. Le temps réel ne sert plus à rien.
- Migration append-only par `execute_sql` : retirer les deux tables de la publication `supabase_realtime`.
  Retirer les deux canaux du code dans la même PR.
- **Avant/après obligatoire** : relever la part du temps réel dans `pg_stat_statements` avant, puis 24 h après.

### 2.2 Sortir les contrôles de la CI de la production

- `db-drift-check` et `supabase-types-drift` interrogent `information_schema` **sur la base de production**.
  La requête la plus lourde : 880 appels, **5,6 s de moyenne**.
- Cible : ces deux contrôles ne tournent plus à chaque PR sur la prod. Trois options, tu choisis et tu justifies :
  une branche Supabase de test, une exécution nocturne unique, ou un instantané de schéma versionné comparé hors ligne.
- Le contrôle doit rester **bloquant** : on ne supprime pas un garde-fou, on le déplace.

### 2.3 Réparer le compteur d'alertes stock

- `get_stock_alerts_count` : 184 322 appels, **143 ms de moyenne**, 6,8 % du temps total de la base.
- Il reste appelé hors du RPC du menu à deux endroits :
  `packages/@verone/dashboard/src/hooks/use-dashboard-additional-data.ts:125` et
  `apps/back-office/src/app/(protected)/messages/hooks/use-messages-items.ts:339`.
- Mesure d'abord (`EXPLAIN (ANALYZE, BUFFERS)` sous `authenticated`, heure creuse), corrige ensuite. La vue
  `stock_alerts_unified_view` répond en p95 à **3 614 ms** pour 239 produits : le problème est dans le plan,
  pas dans le volume.

### 2.4 Index (accord base)

- 237 index jamais utilisés sur 924 — chacun ralentit toutes les écritures de sa table.
- 3 index en double : `products`, `product_images`, `gmail_watch_state`.
- 33 clés étrangères sans index.
- Propose une liste nominative en trois colonnes (supprimer / créer / laisser, avec justification), **fais
  valider par Roméo**, puis applique en heure creuse.

### 2.5 Purge des journaux (décision de Roméo, pas une action d'office)

- `user_activity_logs` 108 Mo (47,6 % de la base), `audit_logs` 76 Mo (33,8 %) : **81,4 % des 299 Mo**.
- Prépare la migration de rétention (90 jours proposés) et le `pg_cron` associé, **sans l'exécuter**.
  Chiffre ce que la base pèserait après. Roméo tranche.

## Vérification

Pour chaque point : la mesure avant, la mesure après, la commande dans les deux cas. Un gain annoncé sans
mesure après ne compte pas. Rapport dans `docs/scratchpad/dev-report-<date>-BO-PERF-BASE-001.md`.
