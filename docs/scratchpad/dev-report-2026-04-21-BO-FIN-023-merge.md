# Merge Report — 2026-04-21 — [BO-FIN-023]

## PR mergée

- **PR** : #704 — https://github.com/Verone2021/Verone-V1/pull/704
- **Titre** : [BO-FIN-023] feat: cascade order cancellation + auto-validate on quote accept
- **Squash merge commit** : `1188f0b90931375b6a3930f7577bc30be899f7f2`
- **Mergé le** : 2026-04-21T15:51:48Z
- **Branche source** : `feat/BO-FIN-023-cascade-order-docs` — supprimée après merge
- **Branche cible** : `staging`

## CI

- `Detect changes` : SUCCESS
- `ESLint + Type-Check + Build` : SUCCESS (complété à 17:51 heure locale)
- `Vercel Preview Comments` : SUCCESS
- `Vercel – veronecollections-fr` : SUCCESS

## Fichiers mergés (16 fichiers, +1406 / -81)

| Fichier                                                                                      | Nature                                            |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `apps/back-office/src/app/api/sales-orders/[id]/cancel/route.ts`                             | Nouveau — route annulation cascade                |
| `apps/back-office/src/lib/orders/cascade-cancel-linked-docs.ts`                              | Nouveau — helper cascade docs Qonto               |
| `apps/back-office/src/app/api/qonto/quotes/[id]/accept/route.ts`                             | Nouveau — auto-validate commande sur accept devis |
| `apps/back-office/src/app/api/qonto/invoices/[id]/finalize/route.ts`                         | Modifié — auto-validate commande sur finalisation |
| `apps/back-office/src/app/(protected)/factures/[id]/DocumentDetailDialogs.tsx`               | Modifié                                           |
| `apps/back-office/src/app/(protected)/factures/[id]/page.tsx`                                | Modifié                                           |
| `apps/back-office/src/app/(protected)/factures/[id]/types.tsx`                               | Modifié                                           |
| `apps/back-office/src/app/(protected)/factures/[id]/use-document-actions.ts`                 | Modifié                                           |
| `apps/back-office/src/app/(protected)/factures/[id]/use-document-detail.ts`                  | Modifié                                           |
| `packages/@verone/orders/src/components/sales-orders-table/hooks/use-cancel-order-action.ts` | Nouveau                                           |
| `packages/@verone/orders/src/components/sales-orders-table/SalesOrderConfirmDialogs.tsx`     | Nouveau                                           |
| `packages/@verone/orders/src/components/sales-orders-table/SalesOrderModals.tsx`             | Modifié                                           |
| `packages/@verone/orders/src/components/sales-orders-table/SalesOrdersTable.tsx`             | Modifié                                           |
| `packages/@verone/orders/src/components/sales-orders-table/hooks/use-sales-order-actions.ts` | Modifié                                           |
| `packages/@verone/orders/src/components/sales-orders-table/hooks/use-sales-orders-modals.ts` | Modifié                                           |
| `docs/current/INDEX-BACK-OFFICE-APP.md`                                                      | Docs mise à jour                                  |

## Statut ACTIVE.md

Bloc [BO-FIN-023] ajouté en section FAIT dans `.claude/work/ACTIVE.md`.

## Next step

Tests Playwright MCP sur staging déployé à la charge de l'orchestrateur.

URL staging : https://verone-backoffice.vercel.app

Parcours à tester :

1. Annulation commande validée avec devis/proforma liés → vérifier cascade Qonto
2. Acceptation devis → vérifier auto-validate commande liée
3. Finalisation facture → vérifier auto-validate commande liée
