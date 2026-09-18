# Session 02 — Corrections des requêtes lentes (issues de l'audit 01)

Une PR par correction. Base : « accord » pour chaque index, vue ou fonction ; le SQL est montré avant.

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  docs/scratchpad/audit-2026-09-16/AUDIT-COMPLET-2026-09-16.md, parties 1.2, 1.4 et 5.2
  .claude/rules/data-fetching.md, .claude/rules/database.md, .claude/rules/stock-triggers-protected.md

═══ MISSION — dans l'ordre de rentabilité de l'audit, les 4 cibles connues au minimum ═══
C1. `linkme_orders_enriched` : planning 206 ms / 1 952 blocs par comptage. Réécrire la vue (jointures en moins, sous-plan
    par ligne supprimé) ou remplacer le comptage par une colonne du RPC `get_sidebar_counts` ; index si l'EXPLAIN le
    justifie. Preuve : EXPLAIN avant/après sous `authenticated`, planning + exécution < 20 ms.
C2. `get_site_internet_products` (site public, p50 1 s, p95 11 s) : EXPLAIN, réécriture ou matérialisation
    (`refresh` sur événement produit, pas de cron), cache HTTP côté site (ISR déjà en place ? vérifier
    `revalidate`). Preuve : p95 < 500 ms sur 20 appels, site 200.
C3. `get_stock_alerts_count` / `stock_alerts_unified_view` : s'il est encore appelé à part, l'intégrer au RPC unique ;
    sinon marquer fait. Preuve : 0 appel dans les logs sur 1 h de travail.
C4. Page Inventaire (222 requêtes le 11/09) : une requête ensembliste (`in()` ou relation imbriquée), pagination
    serveur. Preuve : ≤ 5 requêtes au chargement, comptes identiques.
C5. Index : les FK non indexées retenues par l'audit (celles avec des lectures réelles), suppression des 3 index
    dupliqués et des index jamais utilisés depuis un an SI l'audit le recommande (accord ; `DROP INDEX CONCURRENTLY`,
    hors heures). Aucun index sur une table à trigger stock sans relecture de `stock-triggers-protected.md`.
C6. Boucles requête-par-élément : les 5 plus coûteuses de l'audit 2.1, converties en requête unique.
Preuves générales : tests unitaires existants verts, type-check, lint, reviewer ; captures avant/après ; `query_logs`
sur 1 h après release pour C1-C3.
Compte rendu : `_inbox/2026-09-1X-compte-rendu-session-02.md`, ACTIVE.md à jour.
```
