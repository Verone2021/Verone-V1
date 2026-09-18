# Session 00 — Mesure production du 16/09, timeouts `linkme_orders_enriched`, remise d'équerre

À lancer **le 16/09 après 17 h UTC** (19 h Paris). Lecture seule, aucun commit sauf la mise à jour d'ACTIVE.md
(gitignored) et du programme périmé.

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  docs/scratchpad/feuille-de-route-2026-09-16/README.md
  ~/Documents/Workspace/verone/_outputs/verone/audit-back-office-2026-09-11/compte-rendu-etat-back-office-2026-09-15.md (§ 2)
  ~/Documents/Workspace/verone/_inbox/2026-09-16-compte-rendu-mise-en-ligne-et-reste-a-faire.md

═══ A — MESURE DU 16/09 (preuve avant/après du menu de gauche) ═══
A1. `query_logs`, source `edge_logs`, `/rest/%`, 16/09 06:00 → 17:00 UTC, par heure : appels, HEAD, appels
    `rpc/get_sidebar_counts`, p50, p95, > 2 s, 5xx. Même tableau que le compte rendu Cowork § 2.
A2. Même fenêtre, par méthode + chemin (hors OPTIONS), top 20 : n, p50, p95, > 2 s.
A3. Comparaison écrite avec le 11/09 (14 456 appels, 90 % HEAD, p95 2,2-4,6 s) et le 15/09 (incident). Verdict en une
    phrase : le correctif S3 tient-il sur une journée ?
A4. Vérifie que plus AUCUN écran n'appelle `rpc/get_stock_alerts_count` ni les comptages HEAD à part (667 appels le 15/09) :
    grep du code sur `main`, et A2. S'il en reste, fichier:ligne.

═══ B — INCIDENT DU 15/09 12:34-14:00 UTC ═══
B1. Cause des 198 `canceling statement due to statement timeout` sur `HEAD /rest/v1/linkme_orders_enriched` : quel écran
    ou hook émet ce comptage (fichier:ligne), avec quels filtres ; `statement_timeout` effectif du rôle `authenticated`
    (`select rolconfig from pg_roles where rolname='authenticated'`) ; `EXPLAIN (ANALYZE, BUFFERS)` du comptage sous ce
    rôle avec un vrai jwt (planning vs exécution — Cowork a mesuré 206 ms de planning, 1 952 blocs) ; la vue
    `linkme_orders_enriched` : définition, jointures, index utilisés.
B2. Pourquoi le trafic a triplé à 11 h UTC avant même la release (3 276 appels) : quel client, quels chemins.
B3. Proposition de correction (index, réécriture de la vue, ou comptage déplacé dans `get_sidebar_counts`), gain attendu
    chiffré, base oui/non. Aucune application.
B4. Confirme par écrit la règle V8 (pas de release/migration en journée) dans `.claude/rules/workflow.md` sous forme d'une
    ligne, commit `[INFRA-RULES-041] docs: fenêtre de mise en ligne hors heures ouvrées`, PR vers staging, pas de fusion.

═══ C — REMISE D'ÉQUERRE ═══
C1. `docs/scratchpad/audit-2026-09-12/PROGRAMME-2026-09-12.md` : ajoute en tête « PÉRIMÉ le 2026-09-16 — voir
    docs/scratchpad/feuille-de-route-2026-09-16/README.md et ACTIVE.md ». Ne réécris pas le reste.
C2. ACTIVE.md : dans la section « FEUILLE DE ROUTE 2026-09-16 », colonne État : session 00 → « fait le 16/09 » avec le
    verdict A3 en une ligne.

═══ COMPTE RENDU ═══
`~/Documents/Workspace/verone/_inbox/2026-09-16-compte-rendu-session-00.md` : V1→V9, tableaux A1/A2 avec les requêtes,
verdict A3, résultats B1-B3 avec commandes, PR B4.
```
