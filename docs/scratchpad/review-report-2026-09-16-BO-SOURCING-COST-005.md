# Review Report — 2026-09-16 — BO-SOURCING-COST-005

Branche `fix/BO-SOURCING-COST-005-repartition-frais`, PR #1168 vers `staging`.
Commits relus : `8b94e690` (calcul), `0b31e3f0` (affichage), `527111ca` (suite de relecture).
Migrations : `20260916210000_bo_sourcing_cost_005_repartition_frais.sql`,
`20260916220000_bo_sourcing_cost_005b_arrondis.sql` — **appliquées en production** le 16/09 à
19:14 et 19:34 UTC, hors fenêtre interdite, après accord explicite de Roméo sur le avant/après.

Relecture par `reviewer-agent` (read-only strict). Rapport rédigé par le coordinateur à partir de
ses deux passes, l'agent n'ayant pas le droit d'écrire.

---

## Verdict final : PASS

Premier passage : **FAIL** (3 CRITICAL, 2 WARNING).
Contre-vérification après corrections : **PASS**, zéro CRITICAL subsistant.

---

## Passage 1 — findings

### CRITICAL 1 — `sourcing-rpc-error.ts:20-29` — `VO002` absent de `READABLE_CODES`

`adopt_sourcing_offer` lève `VO001` (offre sans prix) et `VO002` (offre hors euro), mais
`READABLE_CODES` ne contenait ni l'un ni l'autre. `readableRpcError` retombait donc sur le message
générique « L'offre n'a pas pu être retenue. Réessayez. » au lieu du message actionnable produit par
la base. `VO001` était muet depuis `OFFRES-004`, livré le soir même.

**Statut : CORRIGÉ** (`527111ca`) — les deux codes ajoutés, avec un commentaire qui dit pourquoi.
Vérifié à l'écran : une offre passée temporairement en USD produit « Cette offre est en USD :
convertissez-la en euros avant de la retenir » (code `VO002` confirmé en console). L'offre a été
remise en EUR et son état d'origine revérifié en base.

### CRITICAL 2 — `SampleOrderCard.tsx` — `text-xs` sous 640 px

Le nouveau libellé « → revient à X € la pièce » portait `text-xs` sans garde de palier.

**Statut : CORRIGÉ autrement que proposé.** L'agent proposait `hidden sm:inline`, c'est-à-dire
masquer l'information sur mobile. C'est le chiffre principal de la carte : il passe en `text-sm`
plutôt que d'être caché. L'agent a validé ce choix en contre-vérification (« meilleure solution »).

**Prémisse partiellement fausse** : voir CRITICAL 3.

### CRITICAL 3 — Campagne de captures 5 tailles absente

L'agent affirmait que les deux composants sont rendus par `/produits/catalogue/[productId]`, page
listée dans les exceptions responsive obligatoires de `.claude/rules/responsive.md`.

**Statut : REJETÉ, prémisse fausse — confirmé par l'agent lui-même en contre-vérification.**
`grep` exhaustif sur `apps/` :

```
SampleOrderCard         → apps/back-office/src/app/(protected)/produits/sourcing/produits/[id]/page.tsx (2)
SourcingProductEditCard → apps/back-office/src/app/(protected)/produits/sourcing/produits/[id]/page.tsx (3)
```

Aucun autre appelant applicatif. La route est `/produits/sourcing/produits/[id]`, qui ne figure pas
parmi les exceptions (`/produits/catalogue` + `[productId]`, `/stocks/inventaire`, `/commandes`,
`/expeditions`). Page admin → captures desktop suffisantes, fournies à la PR.

### WARNING 1 — Perte du centime dans la répartition

Chaque poste était arrondi ligne à ligne : `SUM(ROUND(frais × ratio_i, 2))` pouvait manquer `frais`
de ±0,005 € par ligne, soit ±0,11 € sur les 23 lignes de la plus grosse commande réelle, et ce pour
chacun des trois postes. Trois lignes égales et 100 € de transport donnaient 33,33 × 3 = 99,99 €.

**Statut : CORRIGÉ, pas documenté** (migration `20260916220000`). L'agent proposait d'« accepter
l'écart et l'ajouter en commentaire ». Refusé : il s'agit de comptabilité. La part d'une ligne est
désormais la différence de deux cumuls arrondis, pris dans l'ordre des identifiants :

```
part(ligne) = ROUND(frais × cumul_incluant_cette_ligne, 2)
            − ROUND(frais × cumul_excluant_cette_ligne, 2)
```

Les termes se télescopent : la somme vaut exactement `ROUND(frais × 1, 2)`.

### WARNING 2 — `recalculate_purchase_order_totals` déclenché N−1 fois

Le réalignement réécrit les lignes voisines ; ce déclencheur n'a pas de garde de profondeur et
s'exécute donc une fois par ligne réalignée.

**Statut : ACCEPTÉ tel quel.** Aucune incidence sur les données (la dernière exécution est la
bonne). La plus grosse commande réelle fait 23 lignes, la fonction est peu coûteuse, et poser une
garde imposerait de modifier une fonction hors périmètre du chantier. Noté dans `ACTIVE.md`.

---

## Passage 2 — contre-vérification

### Télescopage : aucun contre-exemple

L'invariant tient par construction et non seulement empiriquement. Cas éprouvés en simulation :

| Cas                                              | Résultat                       |
| ------------------------------------------------ | ------------------------------ |
| 3 lignes 50 / 30 / 20, frais 100                 | 50,00 + 30,00 + 20,00 = 100,00 |
| 3 lignes égales, frais 100                       | 33,33 + 33,34 + 33,33 = 100,00 |
| Ordre des `id` différent de l'ordre des montants | 100,00                         |
| 2 lignes de montant identique                    | 50,00 + 50,00 = 100,00         |
| 7 lignes égales (1/7), frais 100                 | 100,00                         |

**Ligne recalculée seule, sans ses voisines** — deux cas seulement :

1. Le champ modifié n'est pas dans la garde de `realign_po_fee_allocation` (ex. `eco_tax`) :
   `v_line_ht` est inchangé, donc les deux cumuls aussi, donc l'allocation recalculée est identique
   à la précédente. La somme reste juste sans toucher aux voisines.
2. Le drapeau `verone.realigning_po_fees` est actif : cela n'arrive que **pendant** la boucle de
   réalignement, où chaque voisine voit son déclencheur BEFORE tourner dans la même transaction,
   avec le même total.

**Ordre de traitement** : l'`UPDATE` de réalignement n'a pas d'`ORDER BY` et PostgreSQL peut traiter
les lignes dans n'importe quel ordre. Sans incidence : le cumul s'appuie sur `id <`, pas sur l'ordre
d'exécution. Vérifié par permutation.

**`quantity = 0`** : `v_line_ht = 0`, les deux cumuls sont égaux, part = 0,00 €, et
`GREATEST(NEW.quantity, 1)` évite la division par zéro.

### Points vérifiés sans défaut (passage 1, toujours valables)

- **`handle_po_item_quantity_change_confirmed`** (déclencheur stock **protégé**) : gardé par
  `WHEN (old.quantity IS DISTINCT FROM new.quantity)`. La réécriture `SET quantity = quantity` ne le
  déclenche pas. Corps réel lu en base via `pg_get_functiondef`. Aucun effet sur
  `stock_forecasted_in`.
- **`update_product_cost_price_pmp`** : gardé par `WHEN (pg_trigger_depth() = 0)`. Ne s'exécute pas
  sur les lignes réalignées → pas de double écriture dans `product_purchase_history`.
- **Anti-récursion** : `set_config(..., true)` est transaction-local ; une exception non rattrapée
  avorte la transaction et réinitialise le drapeau. Étanche sans bloc `EXCEPTION`.
- **`RETURN NULL` dans un déclencheur AFTER** : correct, la valeur est ignorée par PostgreSQL.
- **Commande à ligne unique / toutes lignes archivées** : l'`UPDATE` touche 0 ligne, pas d'erreur.
- **R-GRANT** : `realign_po_fee_allocation`, `allocate_po_fees_and_calculate_unit_cost` et
  `reallocate_po_fees_on_charges_change` fermées à `PUBLIC`, `anon`, `authenticated` (fonctions de
  déclencheur) ; `adopt_sourcing_offer` fermée à `PUBLIC`/`anon`, ouverte à
  `authenticated`/`service_role`.
- **`search_path TO 'public'`** sur toutes les fonctions créées ou remplacées.
- **Append-only** : aucune migration existante modifiée. Retour arrière documenté en pied de chaque
  fichier.
- **Zéro `any`, zéro `@ts-ignore`, zéro `eslint-disable`.** Fichiers sous 400 lignes. Promesses
  correctement `void`.

---

## Rattrapage des données — contrôles

Les 10 lignes concernées ont été réécrites **sans changement de valeur**, pour que les déclencheurs
officiels recalculent. Aucun coût écrit à la main (cf. `.claude/rules/no-phantom-data.md`).
Garde-fous dans la transaction, avec annulation si l'un tombe :

| Contrôle                             | Avant            | Après      |
| ------------------------------------ | ---------------- | ---------- |
| Commandes                            | 25               | 25         |
| Lignes de commande                   | 195              | 195        |
| Pièces commandées                    | 5 437            | 5 437      |
| Stock réel                           | 2 707            | 2 707      |
| Stock réservé                        | 149              | 149        |
| Lignes `product_purchase_history`    | 194              | 194        |
| Écart frais / répartis (7 commandes) | jusqu'à 487,41 € | **0,00 €** |

Toute l'opération a d'abord été rejouée **en transaction annulée** sur les données réelles, avant la
moindre écriture.
