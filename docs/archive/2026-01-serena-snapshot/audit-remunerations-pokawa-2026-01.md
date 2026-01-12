# Audit Rémunérations Pokawa - 2026-01-06

## Résumé

**Problème initial** : Divergence entre LinkMe (20k€) et Back-Office (16k€)
**Cause 1** : Back-Office affichait HT, LinkMe affichait TTC → **CORRIGÉ**
**Cause 2** : 19 commandes avec commission = 0€ en base de données

## Commandes avec Commission = 0€ (à corriger)

| Order Number | Date    | Total HT   | Commission DB | Commission Tableur |
| ------------ | ------- | ---------- | ------------- | ------------------ |
| LINK-230026  | 2023-11 | 1 681,05 € | 0.00 €        | 1 428,89 €         |
| LINK-240006  | 2024-01 | 1 681,05 € | 0.00 €        | 1 000,22 €         |
| LINK-240009  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €             |
| LINK-240010  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €             |
| LINK-240011  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €             |
| LINK-240012  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €             |
| LINK-240013  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €             |
| LINK-240014  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €             |
| LINK-240016  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €             |
| LINK-240017  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €             |
| LINK-240019  | 2024-03 | 1 598,00 € | 0.00 €        | 0,00 €             |
| LINK-240022  | 2024-05 | 5 152,43 € | 0.00 €        | 1 055,37 €         |
| LINK-240025  | 2024-06 | 799,00 €   | 0.00 €        | 0,00 €             |
| LINK-240031  | 2024-07 | 1 997,50 € | 0.00 €        | 0,00 €             |
| LINK-240033  | 2024-06 | 799,00 €   | 0.00 €        | 0,00 €             |
| LINK-240038  | 2024-07 | 5 874,03 € | 0.00 €        | 2 522,02 €         |
| LINK-240046  | 2024-11 | 2 783,76 € | 0.00 €        | 1 826,20 €         |
| LINK-240060  | 2025-12 | 5 485,03 € | 0.00 €        | 1 301,60 €         |
| LINK-240075  | 2025-12 | 2 002,46 € | 0.00 €        | 633,93 €           |

**Total commission manquante (estimée)** : ~9 768 €

## Correspondance Tableur CSV

Les commandes avec rémunération non nulle dans le tableur mais 0€ en DB :

- Facture230026 → 1 428,89 € (produits Pokawa)
- Facture240006 → 1 000,22 € (produits Pokawa)
- Facture240022 → 1 055,37 € (produits Pokawa)
- Facture240038 → 2 522,02 € (produits Pokawa - PKW NEYRPIC)
- Facture240046 → 1 826,20 € (produits Pokawa - CHAMBÉRY)
- Facture240060 → 1 301,60 € (Odysséum)
- Facture240075 → 633,93 € (Bourgoin Jallieu)

## Raison des écarts

Ces commandes contiennent des **produits Pokawa** (poubelle, meuble Tabesto) qui sont des "produits du client" avec une logique de commission inversée :

- L'affilié définit son `affiliate_payout_ht`
- LinkMe prend une commission (ex: 15%)
- Le calcul `retrocession_amount` n'a pas été fait correctement pour ces produits

## Actions Réalisées

1. ✅ Modification Back-Office pour afficher TTC (cohérent avec LinkMe)
2. ✅ Type-check passé
3. ✅ Build passé
4. ✅ Audit SQL complété
5. ⏳ Correction des commissions à 0€ (nécessite décision utilisateur)

## Prochaines Étapes

Pour corriger les commissions à 0€, il faut :

1. Identifier les items de commande concernés (sales_order_items)
2. Récupérer le `affiliate_payout_ht` des produits
3. Calculer : commission = affiliate_payout × (1 - commission_rate)
4. Mettre à jour `linkme_commissions.affiliate_commission` et `affiliate_commission_ttc`

---

_Audit réalisé le 2026-01-06_
