# [BO-CONSULT-SOURCING-001] — Les produits en sourcing sélectionnables dans une consultation

Date : 2026-09-17 · Branche : `feat/BO-CONSULT-SOURCING-001-selection-produits-sourcing`

## Point de friction signalé par Roméo (16/09 au soir)

« Quand on ajoute un produit à une consultation, on ne peut choisir que des produits du
catalogue. Il faut pouvoir choisir un produit en sourcing, et pouvoir créer un produit en
sourcing depuis une consultation. »

## Audit — ce qui existait déjà, ce qui bloquait

| Élément                                                                          | État avant                                                                                                                              | Verdict               |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Bouton « Sourcer » dans une consultation (crée un produit sourcing + l'associe)  | Présent, ouvre `SourcingProductModal` → `SourcingQuickForm`                                                                             | ✅ déjà là            |
| Créer un sourcing sans consultation (`/produits/sourcing` → Nouveau sourcing)    | Présent                                                                                                                                 | ✅ déjà là            |
| Règle métier « proposable en consultation » (vendable **ou** encore en sourcing) | `isProductProposableInConsultation` (TS) + `get_consultation_eligible_products` (SQL) + garde serveur `/api/consultations/associations` | ✅ déjà là            |
| Sélecteur « Ajouter » d'une consultation                                         | `productStatus: 'active'` en dur → **aucun produit sourcing** (tous en `draft`)                                                         | ❌ **le blocage**     |
| Pastille de filtre « Sourcing » dans ce sélecteur                                | Présente mais renvoyait toujours 0 résultat                                                                                             | ❌ promesse non tenue |

Vérifié en production avant correction : filtre « Sourcing » → « Aucun produit trouvé », alors que
6 produits sont en sourcing.

Conséquence : la règle métier et la garde serveur acceptaient déjà les produits en sourcing ;
seule la requête du sélecteur front les écartait.

## Correction (3 fichiers, ~20 lignes)

`packages/@verone/products/src/components/selectors/UniversalProductSelectorV2/`

1. `index.tsx` — `productStatus: context === 'consultations' ? 'active' : null`
   → `proposableInConsultation: context === 'consultations'`.
2. `useProductSearch.ts` — filtre large en base (`archived_at IS NULL` +
   `product_status IN (active, preorder) OR creation_mode = 'sourcing'`), puis filtrage fin
   avec la règle partagée `isProductProposableInConsultation` (écarte les sourcings clos :
   refusé, annulé, archivé, validé). Colonnes `sourcing_status` et `archived_at` ajoutées au
   `select` explicite. `proposableInConsultation` ajouté aux deps de l'effect.
3. `types.ts` — `productStatus` (utilisé nulle part ailleurs) remplacé par
   `proposableInConsultation` ; `sourcing_status` ajouté à `ProductData`.

Aucune migration, aucune route API touchée, aucun composant dupliqué. La carte produit affichait
déjà le badge « Sourcing » — rien à ajouter côté affichage.

Effet de bord assumé : les produits en **précommande** deviennent eux aussi proposables, ce qui
aligne enfin le sélecteur sur la règle unique du 13/09 (vendable = actif ou précommande).

## Tests

- `pnpm --filter @verone/products type-check` ✅ · `lint` ✅ (0 warning)
- `pnpm --filter @verone/back-office type-check` ✅
- Écran (serveur local, consultation réelle « Black & White Burger ») :
  - filtre « Sourcing » → **6 produits** (avant : 0) ;
  - ajout du produit sourcing « Canapé » (SRC-MU2QM3SE) : la ligne apparaît sous
    « SANS FOURNISSEUR », **son prix d'achat sourcing 1,00 € alimente la colonne Revient**,
    vente « À fixer » ;
  - le lien de la ligne vers `/produits/catalogue/<id>` affiche correctement une fiche sourcing
    (badges « draft » + « Sourcing interne ») — pas de correction nécessaire ;
  - 0 erreur console nouvelle.
- **Donnée de test** : la ligne « Canapé » créée pour le test a été supprimée par l'écran.
  État de la consultation revérifié en base : 1 ligne, 0 frais, marge NULL, TVA 20, `en_attente`
  — identique à l'état d'origine.

## Reste ouvert (non fait ici, volontairement)

- Le sélecteur charge 100 produits max sans pagination (dette existante). Avec 215 produits
  éligibles, un produit sourcing peut être hors des 100 premiers : la pastille « Sourcing » ou la
  recherche par nom le retrouve en un clic.
- Photos de consultation cassées, données de test PRD-0314 : décisions Roméo, inchangées.

---

# Suite — 17/09 : modifier les prix dans une consultation

## Constat Roméo

« On ne peut pas changer le prix des produits dans une consultation. »

## Cause réelle

Les champs existaient déjà (prix d'achat `cost_price_override`, transport de ligne, transport
refacturé, prix de vente, marge de ligne) — mais **on ne pouvait pas y entrer** : le seul point
d'entrée était le menu « … » de la colonne Actions, et cette colonne est **hors cadre** dès
1440 px (tableau 1249 px de large dans un cadre de 853 px, mesuré à l'écran). Les prix affichés
n'étaient pas cliquables.

Second blocage, pour les simulations : un champ prix vidé était **ignoré** (`editPrice ? … :
undefined`), donc un prix saisi par erreur ne pouvait plus être effacé.

## Corrections

1. **Prix cliquables** — les cellules Achat, Transport et Vente ouvrent la ligne en modification
   (`onStartEdit`), avec une infobulle explicite.
2. **Colonne Actions collée au bord droit** (`sticky right-0`, en-tête compris) : « Modifier »,
   « Supprimer », ✓ et ✕ restent visibles quel que soit le défilement.
3. **Un champ vidé efface la valeur** : vente vide → le prix repart de la marge ; achat vide → on
   reprend le prix d'achat du produit. Helper `toAmountOrNull` + `unit_price` et
   `cost_price_override` passés en `number | null` dans `UpdateConsultationItemData` et dans la
   fusion optimiste (`!== undefined` au lieu de `??`, sinon un `null` était ignoré).

## Simulation vs vente réelle — vérifié, rien à faire

Règle Roméo : une consultation ne doit **pas** alimenter les moyennes de prix des produits.

- Aucune fonction ni déclencheur en base ne lit ou n'écrit `consultation_products` (vérifié).
- Le prix d'achat moyen (`cost_price_avg`) n'est mis à jour que par
  `update_product_pmp_on_po_received` — à la **réception d'une commande fournisseur**.
- Côté code, le module consultations n'écrit que dans `consultation_products` (aucun `from('products')`).

La consultation est donc déjà un bac à sable : les prix qu'on y saisit ne sortent que par un devis
ou une commande, c'est-à-dire par une vente réelle.

## Tests

- `type-check` + `lint` verts : `@verone/consultations`, `@verone/products`, `@verone/back-office`.
- Écran, consultation réelle « Pokawa » (PRD-0313, 30 pièces) : prix de vente effacé + marge 40 %
  → 14,70 € « calculé · marge 40 % » sur un revient de 10,50 € (5,00 € d'achat + 165 € de
  transport sur 30 pièces), CA 441 €, marge 40 %. **État d'origine remis et vérifié en base**
  (prix 16,50 €, marge NULL, reste inchangé).
- Consultation « Black & White Burger » (utilisée par Roméo au même moment) : ouverte en
  modification puis annulée, aucune donnée touchée — revérifié en base.

## Limites qui restent dans la consultation

1. **Un produit sans fournisseur n'a pas de ligne de frais.** Le bloc « Frais par fournisseur »
   ne liste que les fournisseurs présents sur les lignes ; un produit sourcé sans fournisseur
   (ex. « Sofá Modular Lounge ») tombe dans le groupe « Sans fournisseur » et ne peut recevoir ni
   port ni douane. Remède actuel : rattacher un fournisseur au produit.
2. **Une seule monnaie.** Les frais et les prix sont en euros ; une offre fournisseur libellée en
   dollars ou en yuans n'est pas convertie (limite déjà notée le 16/09 sur le comparatif d'offres).
3. **Pas de remise globale ni de ventilation de TVA par taux** sur la proposition client
   (décision Roméo en attente, demande une colonne en base).
4. **Pas de prix de vente cible par besoin** : le budget du client (`tarif_maximum`) s'affiche au
   niveau de la consultation et du besoin, pas comme objectif par ligne.
5. **Le rapport interne ne montre pas le point mort** (quantité minimale pour couvrir les frais
   fixes) ; il donne marge, bénéfice et part des frais.

---

# Contrôle à l'écran des frais par fournisseur (17/09)

## Ce qui marche déjà — vérifié dans le navigateur

Test sur la consultation réelle « Pokawa », deux fauteuils Opjet ajoutés
temporairement (achat 209 € et 599 €) + 150 € de frais (port 100 € + douane 50 €) :

| Ligne                        | Achat    | Part des frais | Revient  |
| ---------------------------- | -------- | -------------- | -------- |
| FAU-0003                     | 209,00 € | **38,80 €**    | 253,47 € |
| FAU-0008                     | 599,00 € | **111,20 €**   | 721,45 € |
| PRD-0313 (autre fournisseur) | 5,00 €   | 0,00 €         | 10,50 €  |

38,80 + 111,20 = 150,00 € : répartition exacte au prorata de la valeur de ligne
(209/808 et 599/808), affichée par ligne (« dont X € de frais ») et isolée au
fournisseur concerné. Les deux lignes de test et les frais ont été retirés, état
de la consultation revérifié en base (1 ligne, 0 frais, valeurs d'origine).

## Deux manques constatés, corrigés sans toucher la base

1. **Les « autres frais » n'avaient pas d'intitulé.** La colonne
   `other_cost_label` existait en base depuis `BO-CONSULT-P9-001` mais n'était
   jamais remplie : impossible de dire si les 30 € étaient de la manutention, de
   l'emballage ou de l'assurance. Champ texte ajouté à côté du montant, affiché
   ensuite à la place du mot « Autres ».
2. **Une ligne dont le produit n'a pas de fournisseur disparaissait du bloc.**
   `consultation_supplier_costs.supplier_id` est NOT NULL : ces lignes ne peuvent
   porter aucun frais de port ou de douane, et rien ne le disait. Une mention
   « Sans fournisseur — N lignes » apparaît maintenant, avec la marche à suivre
   (rattacher un fournisseur au produit, ou saisir le transport sur la ligne).

## Ce qui reste demandé par Roméo et qui, lui, demande la base

**Choisir quels produits d'un fournisseur portent ses frais.** Aujourd'hui tous
les produits retenus de ce fournisseur se partagent les frais au prorata, sans
exception possible. Il faudrait un marqueur par ligne (`consultation_products`,
colonne booléenne type `carries_supplier_fees` à `true` par défaut) + une case à
cocher par produit dans le bloc frais. **En attente du feu vert de Roméo**
(modification de base de données).
