# Rapport — [BO-SOURCING-ETAPES-003] + [BO-SOURCING-OFFRES-004]

**Date** : 2026-09-16 · **Branche** : `fix/BO-SOURCING-COMPLETUDE-001` (suite des lots A1/A2)
**Plan** : `~/.claude/plans/streamed-skipping-quill.md`, lots A3 et A4
**Rapport précédent** : `dev-report-2026-09-16-BO-SOURCING-COMPLETUDE-001.md`

---

## 1. Le problème

Les 4 étapes Recherche / Contact / Évaluation / Négociation existaient depuis le 13/09, mais
**ne servaient qu'à changer un statut** : le même écran s'affichait à Recherche et à Négociation,
sans rien dire de ce qu'on est censé y faire.

En plus de ça, trois manques rendaient les étapes Évaluation et Négociation inutilisables :

- **Aucun coût rendu.** `sourcing_candidate_suppliers` portait le prix, la quantité minimale et le
  délai, mais pas les frais. Comparer deux fournisseurs revenait à comparer un prix départ usine à
  un prix livré — le moins cher au départ est souvent le plus cher rendu.
- **Aucune adoption.** Choisir un fournisseur imposait de recopier son nom et son prix à la main
  dans la fiche produit ; l'historique de négociation (`sourcing_price_history`) était purement
  décoratif, aucun bouton n'en reprenait un prix.
- **Prix cible non modifiable.** `products.target_price` était lisible sur la fiche sourcing mais
  seulement modifiable depuis le catalogue et l'extension Chrome — alors que c'est le repère de
  toute la négociation.

Enfin, `sourcing_photos` était chargée par le carnet depuis avril et **jamais affichée**.

---

## 2. Lot A3 — Recherche et Contact opérantes

**Aucune migration** : tous les champs nécessaires existaient déjà.

| Fichier                                           | Rôle                                                                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils/sourcing-stage-playbook.ts`                | **nouveau** — pour chaque étape : le but, ce qui permet de passer à la suite, les sections mises en avant, les actions proposées, et le compteur d'avancement. Pur, testé.                        |
| `utils/__tests__/sourcing-stage-playbook.test.ts` | **nouveau** — couvre les 4 étapes, les compteurs et les relances en retard (dont le piège « prévue aujourd'hui ≠ en retard »).                                                                    |
| `product-page/SourcingStagePanel.tsx`             | **nouveau** — panneau de l'étape en cours, avec ses actions.                                                                                                                                      |
| `product-page/RfqTemplateDialog.tsx`              | **nouveau** — demande de prix (ou contre-proposition) pré-remplie : produit, quantité, prix cible, délai, Incoterm ; copiable, puis journalisée comme échange sortant avec une relance à prévoir. |
| `notebook/SourcingPhotos.tsx`                     | **nouveau** — les photos du sourcing, groupées par type (catalogue fournisseur, échantillon reçu, défaut constaté).                                                                               |
| `product-page/SourcingStageHeader.tsx`            | compteur sous chaque étape de la frise (« 2 fournisseurs · 3 liens », « 2 contactés · 4 échanges · 1 relance en retard »).                                                                        |
| `product-page/SourcingJournal.tsx`                | filtre Tout / Échanges / Notes ; relances **en retard d'abord**, avec une pastille.                                                                                                               |

**Rien dans le panneau ne bloque.** Les seules portes qui refusent une action restent celles de la
règle de complétude livrée en A1.

---

## 3. Lot A4 — Évaluation et Négociation

### Base — migration `20260916190000_bo_sourcing_offres_004.sql`

Additive uniquement, appliquée après accord écrit de Roméo, **hors** fenêtre 07-17 h UTC.

- 4 colonnes **facultatives** sur `sourcing_candidate_suppliers` : `quoted_shipping_ht`,
  `quoted_customs_ht`, `quoted_currency` (défaut `EUR`), `shipping_scope`
  (`per_order` | `per_unit`). Le plugin Chrome n'insère que `product_id`, `supplier_id` et le
  statut : **il continue de fonctionner sans changement**.
- `sourcing_price_history.currency` : défaut aligné sur l'euro (il était en dollars).
- `adopt_sourcing_offer(produit, offre)` : écrit `supplier_id`, `cost_price` et `supplier_moq` du
  produit, passe l'offre en « retenue » (les autres offres retenues redescendent en
  présélection, sans écraser un refus), enregistre le prix et une entrée de journal — en une seule
  transaction. Droits explicites, ni `PUBLIC` ni `anon`. Retour arrière documenté.

Aucun déclencheur de stock touché, aucune route Qonto touchée, aucune donnée existante modifiée.

### Écran

| Fichier                                                                | Rôle                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils/sourcing-offer-cost.ts`                                         | **nouveau** — coût rendu d'une offre (prix + éco-participation + frais ramenés à l'unité) et comparatif : meilleure offre, écart au prix cible. Même logique que la base sur les commandes fournisseurs. Pur, testé. |
| `utils/__tests__/sourcing-offer-cost.test.ts`                          | **nouveau** — dont le cas qui justifie tout : l'offre au prix le plus bas (9 €) n'est **pas** la meilleure une fois le transport réparti (17 € rendu contre 12 €).                                                   |
| `product-page/SourcingOffersComparison.tsx` + `SourcingOfferLines.tsx` | **nouveaux** — tableau comparatif ≥ md, cartes en dessous : fournisseur, statut, prix, MOQ, délai, frais/unité, **coût rendu**, écart cible, actions. Sélection multiple pour « marquer contactés ».                 |
| `product-page/SourcingOfferForm.tsx`                                   | **nouveau** — saisie d'une offre avec transport, douane et portée des frais ; aperçu du coût rendu en direct.                                                                                                        |
| `product-page/SourcingTargetPriceField.tsx`                            | **nouveau** — prix cible enfin modifiable, avec l'écart de la meilleure offre.                                                                                                                                       |
| `hooks/sourcing/use-adopt-offer.ts`                                    | **nouveau** — « Retenir cette offre ».                                                                                                                                                                               |
| `hooks/sourcing/use-sourcing-pricing.ts`                               | **nouveau** — prix cible + reprise d'un prix négocié comme prix d'achat, avec trace au journal.                                                                                                                      |
| `notebook/SourcingPriceHistory.tsx`                                    | colonne fournisseur + bouton **« Adopter ce prix »**.                                                                                                                                                                |
| `product-page/SourcingOffersSection.tsx`                               | réécrit : prix cible, comparatif, historique, formulaire.                                                                                                                                                            |
| `notebook/SourcingCandidateSuppliers.tsx`                              | **supprimé** — remplacé par le comparatif.                                                                                                                                                                           |

**Enchaînement voulu** : retenir une offre remplit le fournisseur et le prix d'achat du produit,
donc la porte « Commander l'échantillon » livrée en A1 s'ouvre dans la foulée.

---

## 4. Découpage de la fiche produit

`produits/[id]/page.tsx` atteignait 615 lignes, au-dessus de la limite de 400 du dépôt. L'état et
les gestes sont sortis dans `use-sourcing-detail-page.ts` (342 lignes) ; la page ne garde que
l'affichage (399 lignes). Aucun changement de comportement.

---

## 5. Preuves

- **Tests unitaires** : `sourcing-offer-cost`, `sourcing-stage-playbook`, `sourcing-completeness`,
  `sourcing-stage` — tous verts.
- **Type-check et lint** : voir § 6.
- **Contrat du plugin Chrome** : les 4 colonnes ajoutées sont facultatives ou ont un défaut ;
  l'insertion exacte du § 5 du rapport du 11/09 est rejouée en transaction annulée avant la PR.
- **Essai à l'écran** : voir § 6.

## 6. À compléter à la fin du lot

- Application de la migration, régénération des types, type-check et lint verts sur
  `@verone/products` et `@verone/back-office` (deux erreurs de type et sept erreurs de lint
  subsistent tant que les colonnes n'existent pas en base — elles disparaissent avec la migration).
- Essai à l'écran aux deux tailles sur un produit en sourcing.
- Relecture `reviewer-agent`, puis PR unique avec les lots A1 à A4.
