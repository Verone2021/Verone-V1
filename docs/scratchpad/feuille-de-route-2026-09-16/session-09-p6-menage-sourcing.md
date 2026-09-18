# Session 09 — P6 : ménage sourcing (code mort, fonctions mortes, contraction des statuts, données)

Strictement après que P3-P5 tournent en production depuis une semaine (fait le 15/09 → pas avant le 22/09). Accord base.
Chaque ligne de données touchée est montrée à Roméo avant, jamais modifiée sans son accord (décision 11/09).

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  docs/scratchpad/audit-2026-09-12/AUDIT-SOURCING-2026-09-12.md, Q1, Q5 (B13, B19), § 6 ligne P6
  docs/scratchpad/audit-2026-09-11/RAPPORT-SOURCING-CONSULTATIONS-2026-09-11.md, § 5 (contrat plugin) et § 8.1
  apps/back-office/src/app/api/sourcing/import/route.ts (ne rien changer)

═══ M1 — CODE MORT (PR 1, sans base) ═══
Liste avec preuve (aucun import, aucune route, aucun lien) puis suppression : page « Échantillons » (≈ 1 715 lignes),
page « Création » (184), composants de validation d'échantillon (≈ 1 171), `SourcingPipelineBar`, `SourcingStageGuide`,
`SourcingCardView`, `SourcingKpiCards`, hooks et types orphelins, notifications vers pages mortes, lecture
`sample_orders` du tableau de bord (B19). Type-check, lint, build des 3 apps, Playwright sur liste et fiche sourcing.

═══ M2 — BASE (PR 2, accord « OK P6 base ») ═══
- 13 fonctions SQL sans appel (liste + `pg_stat_statements` = 0 appel sur la fenêtre neuve) : DROP.
- Types énumérés morts (`sourcing_status_type`, `sample_status_type`, `sample_request_status_type`) : DROP si aucune
  colonne ne les utilise.
- Tables `sample_orders`, `sample_order_items` vides : DROP après export de sauvegarde (même vides).
- Contraction de `sourcing_status` : d'abord le rattrapage des données (M3), puis CHECK resserré aux 8 valeurs
  (supplier_search | initial_contact | evaluation | negotiation | on_hold | refused | validated | NULL), défaut NULL.
  Essai complet en `BEGIN … ROLLBACK` avec l'import plugin exact (contrat § 5) — le plugin écrit `supplier_search`,
  il doit passer.

═══ M3 — DONNÉES (constat → accord ligne par ligne) ═══
Tableau montré à Roméo avant toute écriture : 232 produits catalogue en `need_identified` par défaut de colonne (→ NULL) ;
3 produits catalogue en `sample_requested` ; paires incohérentes (draft + order_placed, preorder + received) sans
commande derrière ; produit TEST PRD-0314 et commande PO-2026-00039 (décision Roméo) ; `rejection_reason` migré vers
le journal. Une seule transaction, comptes avant/après, export CSV de sauvegarde des lignes touchées dans
`~/verone-backups/`.
Compte rendu, ACTIVE.md.
```
