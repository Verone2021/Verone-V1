# T2 — Colonnes masquables progressivement (8 tables)

**Branche** : feat/responsive-lists-t1-catchup
**Date** : 2026-04-19

## Résultat type-check

`pnpm --filter @verone/back-office type-check` → **exit 0** (aucune erreur)

## Statut par fichier

| #   | Fichier                                                          | Statut | Colonnes masquées                                                        |
| --- | ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| 1   | `linkme/catalogue/configuration/components/ProductsTable.tsx`    | DONE   | `lg:` Prix achat HT / `xl:` Prix public HT, Buffer% / `2xl:` Commission% |
| 2   | `produits/catalogue/stocks/_components/StocksProductTable.tsx`   | DONE   | `lg:` SKU / `xl:` Prévisions, Disponible                                 |
| 3   | `factures/components/AvoirsTab.tsx`                              | DONE   | `lg:` Client, Facture liée / `xl:` Date, Statut                          |
| 4   | `canaux-vente/site-internet/components/ProductsTable.tsx`        | DONE   | `lg:` SKU, Variantes / `xl:` Statut, Eligibilite                         |
| 5   | `canaux-vente/site-internet/components/CollectionsSection.tsx`   | DONE   | `lg:` Slug, Produits / `xl:` Visibilité, Statut / `2xl:` Ordre           |
| 6   | `canaux-vente/meta/_components/meta-products-table.tsx`          | DONE   | `lg:` SKU, Prix Meta / `xl:` Derniere verif. / `2xl:` Sync               |
| 7   | `canaux-vente/google-merchant/_components/gm-products-table.tsx` | DONE   | `lg:` SKU, Impressions / `xl:` Clics, Derniere sync                      |
| 8   | `canaux-vente/linkme/components/SelectionsPerformanceTable.tsx`  | DONE   | `lg:` Affilié, Commandes / `xl:` Produits, Vues                          |

## Règle appliquée

Pour chaque `TableHead` masqué, le `TableCell` correspondant porte la même classe. Colonnes toujours visibles : identifiant/libellé principal, montant/total/CA, statut principal sync, actions.

Aucun commit, aucun push (instructions respectées).
