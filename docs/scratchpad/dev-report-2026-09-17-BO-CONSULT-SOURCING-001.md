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
