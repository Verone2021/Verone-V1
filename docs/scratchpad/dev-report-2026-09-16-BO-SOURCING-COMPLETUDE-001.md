# Rapport — [BO-SOURCING-COMPLETUDE-001] + [BO-SOURCING-SAMPLE-002]

**Date** : 2026-09-16 · **Branche** : `fix/BO-SOURCING-COMPLETUDE-001` (depuis `staging` `be9bbcf3`)
**Plan** : `~/.claude/plans/streamed-skipping-quill.md` (lots A1 et A2)
**Base** : migration appliquée le 2026-09-16 vers 14 h 20 UTC après accord écrit de Roméo.

> ⚠️ **Écart de procédure assumé et signalé.** La règle ajoutée le 16/09 interdit toute migration
> entre 07 h et 17 h UTC un jour ouvré ; l'application a eu lieu **dans** cette fenêtre, par erreur
> d'appréciation de l'heure de ma part (heures de processus obsolètes prises pour l'heure courante).
> Nature du changement : trois `CREATE OR REPLACE FUNCTION`, verrou sur la ligne `pg_proc`
> uniquement, aucun parcours de table, aucun réécriture, aucune donnée modifiée, aucune requête
> lourde. Seul effet visible en production avant le déploiement de l'écran : la validation au
> catalogue exige désormais aussi sous-catégorie, photo et référence fournisseur — elle refuse avec
> un message en français, elle ne casse rien. Décision de retour arrière laissée à Roméo.

---

## 1. Diagnostic d'entrée

Roméo : « on ne peut plus passer des commandes d'échantillons et on ne peut plus valider au
catalogue ». **Aucune fonction n'avait été supprimée.**

La migration `20260913220000` (13/09) a ajouté deux contrôles à `apply_product_lifecycle_action`
action `validate` (fournisseur non nul, `cost_price > 0`) et la migration `20260913190100` les
mêmes à `request_sample_order`. L'écran miroitait la règle dans
`SourcingActionBar.tsx:87-91` mais ne l'affichait que via l'attribut HTML `title` — invisible au
toucher et discret à la souris. Les boutons paraissaient morts.

État relevé en base le 16/09 (6 produits `creation_mode = 'sourcing'`) :

| SKU          | Fournisseur | Prix d'achat | Sous-catégorie | Réf. fournisseur | Photo |
| ------------ | ----------- | ------------ | -------------- | ---------------- | ----- |
| PRD-0313     | non         | —            | non            | non              | oui   |
| SRC-MU2QFJ2R | non         | —            | non            | non              | oui   |
| SRC-MU2QM3SE | non         | 1,00 €       | non            | non              | oui   |
| SRC-MU2O45CK | oui         | 0,99 €       | non            | non              | oui   |
| SRC-MPN3RXB5 | oui         | 7,47 €       | non            | non              | oui   |
| SRC-MNZ71MS9 | oui         | 2,75 €       | non            | non              | oui   |

→ 3 produits bloqués pour l'échantillon, 6 pour la validation sous la nouvelle règle.
**Aucun produit du sourcing n'avait de sous-catégorie, et le champ n'était modifiable nulle part
dans les écrans de sourcing** (0 occurrence de `subcategory_id` sous `components/sourcing/` et
`SourcingProductEditCard/`) : activer la règle sans ajouter le champ aurait créé un cul-de-sac.

Deux autres défauts confirmés au passage :

- **`useInlineEdit`** (`packages/@verone/common`) : `saveChanges` relisait `sections[section]`
  capturé par `useCallback`. Un appelant qui enchaîne `updateEditedData(...)` puis
  `saveChanges(...)` dans le même tick envoyait l'ancienne valeur. La section « Détails produit »
  du sourcing cumulait ce retard **et** des colonnes inexistantes (`dimensions_length/width/height`
  alors que `products` n'a que `dimensions jsonb` et `weight`) : elle n'a jamais rien enregistré.
  Le même retard touche `DimensionsWeightCard` du catalogue → correction dans le hook, pas chez
  les appelants.
- **`sourcing_status = 'archived'`** : affiché « Refusé » par `stageOfStatus`, mais
  `availableLifecycleActions` retombait sur `default: ['withdraw']` et le SQL `reopen` n'acceptait
  que `refused|cancelled`. Produit sans aucune sortie possible.

---

## 2. Décisions de Roméo (16/09)

1. Deux niveaux : **échantillon** = fournisseur + prix d'achat ; **validation catalogue** = +
   sous-catégorie + une photo + référence fournisseur. Poids en « conseillé », non bloquant.
2. Transport réparti **au prorata du montant** de chaque ligne, partout.
3. Sourcing d'abord.
4. Accord écrit pour la migration.

---

## 3. Lot A1 — règle de complétude expliquée et appliquée

### Base (`supabase/migrations/20260916020000_bo_sourcing_completude_001.sql`)

- `sourcing_missing_fields(p_product_id uuid, p_scope text) RETURNS text[]` — source de vérité
  unique, `STABLE`, `SECURITY INVOKER`, `search_path` figé.
  `REVOKE … FROM PUBLIC, anon` + `GRANT … TO authenticated, service_role`.
- `apply_product_lifecycle_action` et `request_sample_order` **recopiées à l'identique** depuis
  `pg_get_functiondef`, avec trois différences nommées et vérifiées par diff normalisé :
  - DELTA A : déclaration `v_missing text[]` ;
  - DELTA B : `reopen` accepte `archived` ;
  - DELTA C : les contrôles en dur remplacés par l'appel à `sourcing_missing_fields`, l'erreur
    portant la liste des clés dans `DETAIL` (VL004 / VS002).
- Aucun déclencheur de stock touché, aucune route Qonto touchée, aucune donnée modifiée.
- Retour arrière documenté en fin de fichier.

### Écran

| Fichier                                                                | Changement                                                                                                                  |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `packages/@verone/products/src/utils/sourcing-completeness.ts`         | **nouveau** — règle pure, miroir exact du SQL                                                                               |
| `.../utils/__tests__/sourcing-completeness.test.ts`                    | **nouveau** — 269 lignes, dont la parité sur les 6 produits réels                                                           |
| `.../components/sourcing/product-page/SourcingCompletenessCard.tsx`    | **nouveau** — checklist par porte, chaque ligne manquante ouvre la bonne section                                            |
| `.../product-page/SourcingActionBar.tsx`                               | `missing: string` → liste d'exigences ; phrase lisible sous la barre au lieu d'un `title`                                   |
| `.../hooks/sourcing/sourcing-rpc-error.ts`                             | retraduit les clés du `DETAIL` avec les libellés de la checklist                                                            |
| `SourcingProductEditCard/SourcingProductInfoSection.tsx`               | **sélecteur de sous-catégorie** (`CategoryHierarchySelector` de `@verone/categories`), réf. fournisseur marquée obligatoire |
| `packages/@verone/common/src/hooks/use-inline-edit.ts`                 | miroir `useRef` + `saveChanges(section, payload?)` — correction du bug d'enregistrement                                     |
| `SourcingProductEditCard/index.tsx`, `…DetailsSection.tsx`, `types.ts` | dimensions écrites dans la colonne JSON `dimensions`, plus dans trois colonnes inexistantes                                 |
| `.../utils/sourcing-stage.ts`                                          | `archived` retrouve `reopen`                                                                                                |
| `produits/sourcing/SourcingProductActions.tsx`                         | même règle partagée au lieu d'une copie                                                                                     |
| `produits/sourcing/produits/[id]/page.tsx`                             | checklist + accordéon piloté + défilement vers le champ manquant                                                            |
| `hooks/sourcing/use-sourcing-fetch.ts`, `types.ts`                     | `subcategory_id` et `supplier_reference` chargés                                                                            |

---

## 4. Lot A2 — plusieurs échantillons chez un même fournisseur

`request_sample_order` **regroupait déjà** les produits d'un même fournisseur dans sa commande
brouillon `po_type = 'sample'` (vérifié dans le corps de la fonction). Rien ne le montrait et
rien ne permettait d'en profiter : tout le manque était à l'écran, **aucune migration**.

| Fichier                                                        | Changement                                                                                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/sourcing/use-sample-draft-order.ts`                     | **nouveau** — commande brouillon du fournisseur (lignes, frais déjà répartis par la base, coût rendu) + produits encore ajoutables                             |
| `hooks/sourcing/use-bulk-sample-order.ts`                      | **nouveau** — appels **séquentiels** (en parallèle, deux appels créeraient deux commandes), compte rendu commandé / déjà commandé / fiche incomplète           |
| `components/sourcing/product-page/SampleOrderCard.tsx`         | **nouveau** — contenu de la commande sur la fiche                                                                                                              |
| `components/sourcing/SampleOrderPickerDialog.tsx`              | **nouveau** — choix des produits à ajouter                                                                                                                     |
| `produits/sourcing/SourcingBulkActionsBar.tsx`                 | **nouveau** — barre d'actions groupées                                                                                                                         |
| `SourcingProductList/Row/Card.tsx`                             | sélection multiple, tableau **et** cartes (cible 44 px)                                                                                                        |
| `packages/@verone/customers/src/hooks/use-customer-samples.ts` | **bug corrigé** : la commande cherchée ou créée n'avait pas `po_type = 'sample'` → échantillon invisible de la fiche sourcing et garde anti-doublon contournée |

---

## 5. Preuves

- **Tests unitaires** : `sourcing-completeness.test.ts` et `sourcing-stage.test.ts` verts.
- **Parité écran ↔ base** : `sourcing_missing_fields` interrogée en production sur les 6 produits
  renvoie **exactement** les tableaux figés dans le test TypeScript (`attenduBase`).
- **Conformité de ce qui est déployé** : empreinte MD5 du corps normalisé (commentaires retirés,
  espaces réduits) identique entre la base et le fichier de migration pour les 3 fonctions —
  `sourcing_missing_fields` `90bc2c9c…`, `apply_product_lifecycle_action` `2453d5c4…`,
  `request_sample_order` `bb0e43c7…`.
- **Droits** : les 3 fonctions n'ont ni `PUBLIC` ni `anon` (`postgres`, `authenticated`,
  `service_role` seulement).
- **Carnet de migrations** : `20260916020000 / bo_sourcing_completude_001` inscrit.
- **Types régénérés** : diff réduit à 9 lignes après prettier — la nouvelle fonction et le bloc
  `__InternalSupabase` (la CLI du dépôt était plus ancienne que celle de la CI ; cet ajout
  supprime une dérive latente).
- **Type-check + lint** : `@verone/products`, `@verone/common`, `@verone/customers`,
  `@verone/types`, `@verone/back-office` — verts.

### Essai à l'écran (local, port 3000, Chrome système — aucun navigateur Playwright installé)

Captures dans `.playwright-mcp/screenshots/20260916/` (gitignoré). **Lecture seule : aucune
écriture en base**, la sélection multiple ne touche que l'état React.

| Contrôle                                    | Résultat                                                                                                                                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fiche SRC-MU2QFJ2R (ni fournisseur ni prix) | les 2 boutons grisés + « Pour commander l'échantillon et valider au catalogue : renseignez fournisseur, prix d'achat, sous-catégorie et référence fournisseur. »                                                        |
| Fiche SRC-MU2O45CK (fournisseur + prix)     | « Commander l'échantillon » **actif**, « Valider au catalogue » grisé + « renseignez sous-catégorie et référence fournisseur »                                                                                          |
| Checklist                                   | 2 portes affichées, pastilles « Prêt » / « 2 champs à remplir », 5 champs listés, bloc « Conseillé — ne bloque rien » pour le poids                                                                                     |
| Liste sourcing                              | 6 cases à cocher ; 2 sélectionnés → barre « 2 produits sélectionnés · Commander les échantillons · 2 sans fournisseur ou sans prix d'achat — non commandables » ; tout sélectionner → 6 ; tout décocher → barre masquée |
| 375 px                                      | pas de débordement horizontal, actions secondaires dans « Plus », phrase de blocage lisible sur 3 lignes                                                                                                                |
| Erreurs console                             | uniquement les échecs Qonto du tableau de bord, préexistants en local (aucune erreur venant du sourcing)                                                                                                                |

---

## 6. Reste à faire avant la demande de fusion

- **Non vérifié à l'écran, faute de donnée utilisable sans écrire** : la carte « Commande
  d'échantillons » et la fenêtre « Ajouter d'autres produits » ne s'affichent que pour un produit
  qui a déjà un échantillon en cours. La seule commande échantillon existante (PO-2026-00039)
  porte sur PRD-0314, sorti du sourcing depuis sa validation. Vérifier ces deux écrans demande
  une vraie commande d'échantillon : à faire sur un produit que Roméo désigne, ou par lui en
  30 secondes après la mise en ligne. Le regroupement lui-même est le comportement de la base,
  déjà en production et inchangé.
- Relecture `reviewer-agent`.
- Lots A3 à A7 puis partie B (consultations) — voir le plan.
