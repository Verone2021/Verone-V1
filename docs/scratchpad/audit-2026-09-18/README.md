# Plan de remise à niveau — audit du 2026-09-18

**Écrit par Cowork (tour de contrôle) le 2026-09-18. Source unique de l'ordre des lots.**
L'état d'avancement se tient dans `.claude/work/ACTIVE.md`, section « PLAN AUDIT 2026-09-18 ».

Rapport complet et preuves : `AUDIT-COMPLET-2026-09-18.md` (même dossier).
Incident du 17-18/09 (écran « Erreur système Vérone ») : `INCIDENT-2026-09-17-ecran-erreur.md`.

---

## 1. Où on en est

Grille de juillet (sécurité 25, stabilité 25, performance 20, scalabilité 15, qualité et tests 15 ; cible 80).

| Axe                        |  30/07 |  11/09 |  18/09 |
| -------------------------- | -----: | -----: | -----: |
| Sécurité                   |     17 |     19 |     38 |
| Stabilité fonctionnelle    |     24 |     24 |     30 |
| Performance                |     22 |     22 |     35 |
| Scalabilité / architecture |     28 |     26 |     28 |
| Qualité de code et tests   |     20 |     32 |     33 |
| **Global**                 | **22** | **24** | **33** |

Hors grille : maintenabilité et cohérence des composants **45**.

Verdict : socle sain (modélisation base 0 table sans clé primaire, 0 montant en flottant, packages sans cycle,
RLS qui tient au test réel en rôle `anon`), opérationnel absent (117 routes API sur 194 sans garde,
0 observabilité, 0 environnement de test, 0 sauvegarde testée, 0 test unitaire exécuté).

## 2. Trajectoire visée, lot par lot

Chaque note est une projection assumée, à re-mesurer après chaque lot avec les mêmes commandes que l'audit.

| Lot   | Contenu                                                                                                                      | Axes touchés                         | Global attendu |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------: |
| —     | état au 18/09                                                                                                                | —                                    |         **33** |
| **1** | Observabilité navigateur + filets d'erreur + anti-traduction + version périmée                                               | stabilité 30→45, qualité 33→38       |         **38** |
| **2** | Base : couper le temps réel, sortir la CI de la prod, réparer le compteur d'alertes, index, purge des journaux               | performance 35→65, scalabilité 28→35 |         **45** |
| **3** | Sécurité : middleware back-office, route PII, 39 fonctions ouvertes, webhooks fail-open, rotation des clés                   | sécurité 38→70                       |         **53** |
| **4** | Environnement de préproduction, schéma reconstructible, sauvegardes et plan de reprise testé                                 | scalabilité 35→65                    |         **58** |
| **5** | Tests : vitest branché, E2E bloquants, garde anti-production, couverture mesurée                                             | qualité 38→65                        |         **62** |
| **6** | Bugs fonctionnels de juillet encore ouverts (rapprochement, TVA, plafonds 1 000 et 50, contacts commandes, backorder)        | stabilité 45→70                      |         **68** |
| **7** | Maintenabilité : bouton unique, fork `ui-v2/stock`, tokens et thèmes branchés, fichiers > 400 lignes, types Database uniques | hors grille 45→70, qualité +5        |         **70** |

Pour aller de 70 à la cible 80 : p95 sous 500 ms sur les écrans principaux, couverture de tests réelle sur les
calculs d'argent, et zéro constat critique ouvert. À viser après le lot 7, pas avant.

## 3. Ordre et règles

1. **Lot 1 d'abord, sans exception.** Tant qu'on ne voit pas ce qui casse chez les utilisateurs, tout le reste
   se pilote à l'aveugle. C'est la leçon du 17-18/09 : deux heures d'enquête pour un défaut qu'un rejeu de
   session aurait montré en deux minutes.
2. **Lot 2 ensuite** : c'est la cause de fond des blocages (saturation de la base → le service
   d'authentification ne répond plus → écran sans issue).
3. Lots 3 à 7 : dans l'ordre du tableau, un lot = une PR = un bloc cohérent.

Règles non négociables, rappelées dans chaque prompt :

- Aucun commit, push, PR ou fusion sans ordre écrit de Roméo. PR vers `staging`.
- Aucune release, migration ni requête lourde entre 07 h et 17 h UTC un jour ouvré.
- Base en lecture seule par défaut ; écriture uniquement avec accord écrit, par `execute_sql`, jamais `supabase db push`.
- Jamais `(select is_backoffice_user())` dans une policy RLS.
- Un chiffre sans sa commande n'entre pas dans un compte rendu.

## 4. Ce qui reste à mesurer

Non fait le 18/09, à faire en heure creuse :

- `EXPLAIN (ANALYZE, BUFFERS)` sous `authenticated` sur `stock_alerts_unified_view`, `sales_orders` (liste),
  `client_consultations`, `get_site_internet_products`.
- Deuxième relevé de `pg_stat_statements` pour isoler la part du temps réel sur une fenêtre courte
  (premier relevé : 2026-09-18 15:52 UTC — temps réel 240 338 s, introspection 92 746 s, alertes 26 510 s,
  total 391 018 s, 78 467 053 appels).
- Mesures navigateur : Lighthouse, poids des bundles, démarrage à froid Vercel.
