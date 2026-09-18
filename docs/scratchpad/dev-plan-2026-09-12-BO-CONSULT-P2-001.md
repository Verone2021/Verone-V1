# Dev plan — 2026-09-12 — BO-CONSULT-P2-001 — P2a-c consultations (aucune migration)

Branche `fix/BO-CONSULT-P2-001-donnees-et-economie` depuis `origin/staging` (`3a39703a`). Pas de push (ordre Roméo).
Sources : rapport 11/09 § 3 et § 8.3, audit Explore du 12/09 (constats `fichier:ligne` repris ci-dessous).

## B0 — État « avant » (production, 2026-09-12, lecture seule)

6 consultations : 2 vivantes, 4 supprimées (`deleted_at`). TVA consultation = 20 % partout.

| Consultation                                              | Ligne                                    | q   | prix proposé | coût (override / produit) | éco-taxe | transport ligne | transport refact. | gratuit / échantillon | statut   |
| --------------------------------------------------------- | ---------------------------------------- | --- | ------------ | ------------------------- | -------- | --------------- | ----------------- | --------------------- | -------- |
| **c9b18dc9** « plateau bois 20 » (vivante)                | Plateaux Pokawa 20×40 (sans fournisseur) | 30  | 16,50        | 5 / —                     | 0        | 165             | 0                 | non / non             | pending  |
| **25fd2694** « Test consultation email » (vivante)        | Ampoule LED Baby boy                     | 1   | 15,00        | 5 / 9,00                  | 0        | 2               | 0                 | non / non             | approved |
| 45c5d2f2 Pokawa Paris 11e (supprimée, **2 fournisseurs**) | Grande planche à fromage                 | 1   | —            | — / 7,40                  | 0        | 0               | 0                 | non / non             | pending  |
|                                                           | Lampe Atomic chromé                      | 1   | —            | — / 35,00                 | 0,17     | 0               | 0                 | non / non             | pending  |
| c05a3a64 TEST E2E (supprimée)                             | Globe gm                                 | 1   | —            | — / 5,00                  | 0,10     | 0               | 0                 | non / non             | pending  |
|                                                           | Globe pm                                 | 2   | 8,00         | 3,70 / 3,70               | 0,10     | 1,5             | 0                 | **oui / oui**         | approved |
| 70546bd8, 7fa99903 (supprimées)                           | aucune ligne                             |     |              |                           |          |                 |                   |                       |          |

Valeurs affichées aujourd'hui (formules actuelles relevées dans le code) :

| Consultation | Écran (tableau + KPI)                                                                     | PDF marges                                                                           | Dialogue « Commander »                                                  | PDF client                         |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------- |
| c9b18dc9     | CA 495,00 · coût 315,00 · marge 180,00 · 57,14 %                                          | idem · prix de revient unitaire 10,50 · marge unitaire 6,00 · impact transport 110 % | vente 495,00 · **coût 5 100,00** (transport × 30) · **marge −4 605,00** | HT 495,00 · TVA 99,00 · TTC 594,00 |
| 25fd2694     | CA 15,00 · coût 7,00 · marge 8,00 · 114,29 %                                              | idem · revient 7,00 · impact transport 40 %                                          | vente 15 · coût 7 · marge 8 (q = 1, bug invisible)                      | HT 15,00 · TVA 3,00 · TTC 18,00    |
| 45c5d2f2     | **CA 42,40 = coût 42,40 · marge 0** (prix d'achat utilisé comme prix de vente)            | idem                                                                                 | vente 42,40                                                             | HT 42,40 (au prix d'achat)         |
| c05a3a64     | Globe gm : CA 5 = coût 5 (prix d'achat) ; Globe pm : CA 0 · coût 7,40 · marge −7,40 · 0 % | Globe pm : −7,40 · **−100 %**                                                        | —                                                                       | HT 5,00                            |

## Décisions (coordinateur, règle 6) — à appliquer telles quelles

1. **Données périmées** — une seule copie des lignes : l'appel `useConsultationItems` de `use-consultation-detail.ts` est la
   source ; `ConsultationOrderInterface` reçoit lignes + mutations en props ; suppression de la resynchronisation « si le
   nombre change ». Devis, 2 PDF, commande et dialogue lisent la même copie.
2. **Lignes refusées** (`status = 'rejected'`) exclues de : les deux « Commander », la liste du dialogue, le PDF client
   (lignes et total), le PDF marges (lignes et totaux), le devis (lignes et totaux), `calculateTotal`,
   `getTotalItemsCount`. (Les lignes `ordered` reprises par le dialogue : **signalé, non corrigé** — hors périmètre.)
3. **Pas de prix par défaut depuis le prix d'achat** : `unit_price = proposed_price ?? prix par défaut (marge) ?? null`.
   Aujourd'hui aucune marge n'existe en base ⇒ `null` ⇒ affichage « à fixer ». Une ligne incluse, non gratuite, sans
   prix : exclue du CA ; « Commander » et « Devis » refusent avec un message clair (« Prix de vente à fixer pour N
   ligne(s) ») au lieu d'envoyer 0 ; PDF client affiche « à fixer ».
4. **Transport = total de ligne** partout (`ConsultationOrderDialog.tsx:82-89` corrigé).
5. **Règles gratuit / échantillon : celles de l'écran actuel**, appliquées par la fonction d'économie à tout ce qui
   calcule une marge (tableau, KPI, dialogue, PDF marges) : CA = 0, transport de la ligne non compté dans le coût,
   marge % non calculée. **Non modifié** : le PDF client, le devis et la commande facturent l'échantillon au prix
   (`!is_free`). Contradiction signalée à Roméo (décision métier), pas tranchée ici.
6. **Éco-taxe** (`products.eco_tax_default`, jamais lue jusqu'ici) intégrée au prix de revient et au coût. Aucune ligne
   vivante n'en a (valeurs vivantes inchangées).
7. `supplierCosts` : paramètre optionnel prévu pour P10 ; non vide ⇒ erreur explicite « répartition par fournisseur :
   phase P10 ».
8. Helper d'association unique dans `@verone/utils` (export racine, **sans toucher `package.json`** pour éviter un conflit
   avec `[BO-PERF-S3-001]`), utilisé par les 5 appels vivants.
9. Pour limiter les conflits avec `[BO-PERF-S3-001]` (qui insère des invalidations dans `useConsultations`) : **ne pas
   modifier le corps de `useConsultations()` ni les lignes d'import en tête de `use-consultations.ts`** ; déplacer
   seulement `useConsultationItems` et supprimer `useConsultationProducts` (bas du fichier).

## B2 — Fonction d'économie (formules)

Entrée par ligne : `quantity`, `unitCost = cost_price_override ?? products.cost_price ?? 0` (+ drapeau coût manquant),
`ecoTax`, `shippingCost` (total ligne), `sellingShippingCost` (total ligne), `proposedPrice`, `isFree`, `isSample`,
`status`, `supplierId`, `marginPercentage?`. Réglages : `defaultMarginPercentage?`, `supplierCosts?`.

- `quantity ≤ 0` ⇒ `RangeError`
- `included = status !== 'rejected'`
- `fees = isFree || isSample ? 0 : shippingCost`
- `unitCostPrice` (prix de revient) `= unitCost + ecoTax + fees / quantity`
- `defaultUnitPrice = marge (ligne ?? réglage) != null ? unitCostPrice × (1 + marge / 100) : null`
- `unitPrice = proposedPrice ?? defaultUnitPrice ?? null` ; `priceToFix = unitPrice === null && !isFree`
- `revenue = isFree || isSample ? 0 : (unitPrice ?? 0) × quantity + sellingShippingCost`
- `cost = (unitCost + ecoTax) × quantity + fees`
- `margin = revenue − cost` ; `marginPercent = isFree || isSample || priceToFix || cost === 0 ? null : margin / cost × 100`
- Totaux sur les lignes incluses : `revenue`, `cost`, `fees`, `margin = Σrevenue − Σcost`, `marginPercent`,
  `linesToPrice`, `includedLines`.

Contrôle : c9b18dc9 ⇒ cost 315, revenue 495, margin 180, 57,14 %, revient 10,50 (identique à l'écran « avant »).

## Hors périmètre

Migration (P9), répartition par fournisseur (P10), écran projet (P11), gel des prix (P12), lignes `ordered`, TVA figée
0,2 du devis/commande (R8), découpage des mutations de `useConsultations` (après fusion de S3).
