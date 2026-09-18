# Session 7 — Statistiques de la base · Bloc B · FACULTATIVE

Durée : 30 min. Touche la base : **`ANALYZE` sur une table, accord écrit**. Ex-« Session 2 ».

**Facultative** : les mesures du 2026-09-11 disent que les statistiques n'expliquent rien de mesurable.
La garder seulement si Roméo veut une preuve expérimentale sur une table.

## Ce qui est déjà mesuré (rapport § 1, § 3 B, § 3 D, [C12] [C13] [C14] [C27])

- 174 tables sur 185 analysées il y a plus de 30 jours (le « 41 sur 185 » du plan n'est pas reproduit).
- Mais les tables chaudes ont très peu changé : `user_app_roles` 5 lignes modifiées depuis son analyse,
  `sales_orders` 1, `products` 29, `organisations` 24. Estimations du planificateur = réel (8/8, 222/221, 102/107).
- Temps de préparation : 7,2 ms (vue d'alertes, `postgres`), 4,4 ms (`authenticated`) à chaud ; ×10 à ×17
  à froid **avec les mêmes statistiques** ⇒ l'écart vient de la mémoire des connexions, pas des statistiques.
- Les 141 ms du compteur d'alertes : ~10 ms de re-préparation à chaque appel (5 appels groupés = 11,4 ms),
  le reste est de l'attente de l'instance.
- `ANALYZE` n'a **pas de retour arrière exact** en Postgres 17 (`pg_restore_relation_stats` absent) : il
  se corrige de lui-même, il ne se défait pas.
- Le rafraîchissement du 8 mai portait sur `auth` et les tables système juste après 64 modifications
  de policies en rafale : situation différente d'aujourd'hui.

## Ce qui change par rapport au prompt d'origine

| Prompt d'origine                                      | Correction                                                                           | Pourquoi                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| « 41 tables sur 185 »                                 | 174/185 selon la date, **mais la date n'est pas le bon critère**                     | le critère est le nombre de modifications depuis l'analyse |
| Étapes 1-2 (mesure du planning, lien avec les 141 ms) | déjà faites, à **vérifier** en 10 min                                                | rapport § 3 B et D                                         |
| Plan de retour arrière de `ANALYZE`                   | « photographier `pg_stats` de la table avant » ; pas de restauration exacte possible | Postgres 17                                                |
| Table au choix                                        | `user_app_roles` (9 lignes, analyse instantanée, 264 M de parcours)                  | risque minimal, table la plus sollicitée                   |

## Prompt à coller

```
Dossier : ~/verone-back-office-V1

## Vérifications d'ouverture, lecture seule
1. `pwd` et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
2. MCP Supabase `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
3. `git status` et `git branch --show-current` : dis-moi l'état, ne touche à rien.

## Lecture
  docs/scratchpad/audit-2026-09-11/sessions/session-7-statistiques.md
  docs/scratchpad/audit-2026-09-11/RAPPORT-CLAUDE-CODE-2026-09-11.md (§ 3 B, § 3 D)
  docs/scratchpad/audit-perf-scal-2026-09-11/mesures-performance-complements.md (§ 1)

## Mission : Bloc B — expérience contrôlée sur UNE table

ÉTAPE 1 — lecture seule, 10 minutes : revérifie pour user_app_roles
n_mod_since_analyze, last_analyze, estimations vs réel (EXPLAIN ANALYZE d'une
lecture filtrée sur user_id + app), et le Planning Time à chaud (5 passages) d'un
count sur sales_orders avec les règles actives (set_config role authenticated +
request.jwt.claims d'un admin, sans aucune écriture). Chiffres bruts.

ÉTAPE 2 — dis-moi si quelque chose contredit « les statistiques n'expliquent
rien de mesurable ». Si rien ne le contredit, recommande de s'arrêter là.

ÉTAPE 3 — seulement si je le demande : propose ANALYZE public.user_app_roles,
avec la photo de pg_stats de la table prise avant (SELECT), sa durée estimée et le
fait qu'il n'existe pas de restauration exacte en Postgres 17.
ATTENDS MON ACCORD ÉCRIT. Ne lance rien.

ÉTAPE 4 — après mon accord : ANALYZE sur cette table, remesure identique à
l'étape 1, compare. Si le gain est net (> 20 % sur le Planning Time, reproductible),
propose la suite table par table. Sinon, conclus et arrête.

INTERDITS : aucun ANALYZE sans mon accord écrit ; aucune autre écriture ; aucune
donnée de test ; aucun commit ni push.
```
