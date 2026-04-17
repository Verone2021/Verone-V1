# Documentation Stock — Règles métier

**Dossier restauré le 2026-04-21** (BO-STOCK-004) depuis `git show` sur commits de cleanup `f48d059bd` (14 mars 2026) et `2abd93328` (27 mars 2026).

## Docs restaurées

| Fichier                                      | Source (commit supprimé) |
| -------------------------------------------- | ------------------------ |
| `alertes/stock-alert-tracking-system.md`     | `2abd93328^`             |
| `movements/real-vs-forecast-separation.md`   | `2abd93328^`             |
| `movements/stock-traceability-rules.md`      | `2abd93328^`             |
| `AUDIT-TRIGGERS-STOCK-COMPLET-2025-11-23.md` | `f48d059bd^`             |

## État actuel du système (post BO-STOCK-001→007)

Les docs restaurées décrivent l'état du système **fin novembre 2025** (état fonctionnel confirmé par les tests de l'époque). Entre décembre 2025 et avril 2026, plusieurs régressions ont été introduites puis corrigées :

### Régressions corrigées (BO-STOCK-005 à 007)

- **A7** : `getSeverityColor()` du `StockAlertCard` ne lisait plus `alert.validated` depuis `9bde76c00` (8 déc 2025) → restauré par BO-STOCK-005 (PR #627)
- **A9** : bouton "Voir Commande" redirigeait vers la liste sans id depuis `eeb466fff` → restauré `?id=${draft_order_id}` (PR #627)

### Bugs originels corrigés (BO-STOCK-006)

- **A3** : double incrémentation des snapshots `stock_alert_tracking.stock_forecasted_out` lors validation SO (PR #628)
- **A5** : helper text "X unités manquantes" dans `QuickPurchaseOrderModal` (PR #628)
- **A6** : `validate_stock_alerts_on_po` force maintenant `validated=true` uniquement sur `alert_type='out_of_stock'` (PR #628)

### Nouvelles features (BO-STOCK-007)

- **A2** : bannière alertes sur la fiche produit (`product-stock-tab.tsx`) via composant `StockAlertsBanner` (PR #629)
- **A4** : regroupement des alertes par `product_id` (1 carte avec multiples badges) (PR #629)
- **A8** : nouveau `alert_type = 'low_stock_forecast'` — déclenché quand `stock_real >= min_stock` mais `previsionnel < min_stock` (stock OK maintenant, tombera sous le seuil après SO validées en attente) (PR #629)

### Anomalie A1 corrigée (BO-STOCK-004, cette PR)

`handle_shipment_deletion` rebascule maintenant en `partially_shipped` si après DELETE d'un shipment il reste d'autres shipments actifs mais que tous les items ne sont pas complètement expédiés.

## Audit complet

Voir `docs/scratchpad/audit-regressions-stock-alertes-2026-04-17.md` pour l'analyse détaillée des 10 anomalies A1-A10 avec commits exacts et méthodologie git log/git show.

## Docs de référence (doit être à jour)

- `docs/current/database/triggers-stock-reference.md` — liste des triggers + fonctions
- `docs/current/modules/stock-module-reference.md` — architecture module stock
- `docs/current/serena/stock-orders-logic.md` — workflow orders + stock (synthèse)

## Sources supplémentaires si besoin

Les docs suivantes existent dans l'historique git et peuvent être récupérées au besoin :

```bash
git show f48d059bd^:docs/recovered/audits-2025-11/RAPPORT-TESTS-PHASE-3-ALERTES-STOCK-2025-11-10.md
git show f48d059bd^:docs/recovered/audits-2025-11/composants/AUDIT-ALERTES-STOCK-TECHNIQUE-2025-11-22.md
git show 2abd93328^:docs/business-rules/06-stocks/alertes/guide-configuration-seuils.md
git show 2abd93328^:docs/business-rules/06-stocks/backorders/BACKORDERS-POLICY.md
git show 2abd93328^:docs/business-rules/07-commandes/clients/sales-order-cancellation-workflow.md
git show 2abd93328^:docs/business-rules/07-commandes/fournisseurs/PURCHASE-ORDER-WORKFLOW-COMPLET.md
```
