# Review Report — 2026-09-14 — BO-SOURCING-P5-001

Revue des commits locaux 5c3e74df et 53984f71 (diff 8bd86f8a..53984f71) par reviewer-agent.

## Verdict : PASS WITH WARNINGS

## Vérifications effectuées

- **Clean code** : zéro `any`, `@ts-ignore`, `as unknown as`, `eslint-disable` introduit. Fichiers < 400 lignes (max `page.tsx` 280, `use-sourcing-fetch.ts` 248). Imports `@verone/*`.
- **Anti-raccourcis** : recherche des motifs interdits dans les lignes ajoutées → vide.
- **Sécurité** : pas de migration ni de règle d'accès dans ce diff ; aucun `select('*')` ; colonnes explicites (~30 dans `use-sourcing-fetch.ts`, 3 dans `use-sourcing-segment-counts.ts`).
- **Performance** : mutations avec `await refetch()` et `await invalidateMenuCounts` internes ; `afterAction` relit les nombres (redondant mais inoffensif) ; promesses protégées `void … .then(…).catch(…)` ; lecture des nombres `.limit(1000)`.
- **Responsive** : `ResponsiveDataView` (tableau + cartes) ; Fournisseur `hidden lg:table-cell`, Type et Date `hidden xl:table-cell` ; cibles `h-11 w-11 md:h-9 md:w-9` ; filtres `h-11 md:h-8` ; tableau dans `w-full overflow-x-auto` ; vue Étapes en grille fluide.
- **Double `.or()`** : postgrest-js ajoute deux paramètres `or` (`searchParams.append`, pas `set`) ; PostgREST les combine en ET. Correct.
- **Cohérence des compteurs** : `SOURCING_IN_PROGRESS_STATUSES` (10 statuts), liste recopiée et commentée dans `use-sidebar-counts.ts`, `use-messages-items.ts` construit le filtre depuis `segmentQuery`. Alignés.
- **Appelants cassés** : `SourcingCardView`, `SourcingKpiCards`, `getStatusBadge`, vue « card » → zéro référence restante.

## WARNING — `SourcingProductCard.tsx:52` — bouton nom sans `type="button"`

Valeur HTML par défaut `submit` : dans un `<form>`, un clic sur le nom soumettrait le formulaire. Même cas pour le bouton nom et le bouton fournisseur de `SourcingProductRow.tsx`.
**Fix** : ajouter `type="button"`.

## WARNING — `use-sourcing-segment-counts.ts` — comptage tronqué silencieusement au-delà de 1 000 lignes

Acceptable à l'échelle actuelle ; à long terme, compter côté base (regroupement ou requêtes de comptage) pour éviter un plafond silencieux.

## INFO — `use-sourcing-fetch.ts:231` — `eslint-disable-next-line react-hooks/exhaustive-deps` pré-existant

Non aggravé : trois dépendances primitives ajoutées (`segment`, `stage`, `priority`). Extraction de `fetchSourcingProducts` en `useCallback` = dette à traiter à part.

## Régressions vérifiées

| Scénario                                      | Résultat |
| --------------------------------------------- | -------- |
| « Validés » ouvre `/produits/catalogue/[id]`  | ✅       |
| Retrait → fenêtre de motif obligatoire        | ✅       |
| Validation depuis la liste → confirmation     | ✅       |
| Lien fournisseur seulement si `supplier_id`   | ✅       |
| `canDelete` sur produit retiré                | ✅       |
| Formulaire rapide rafraîchit liste et nombres | ✅       |
| Statut vide → « En cours », étape Recherche   | ✅       |
| Badge `danger` pour « Refusés »               | ✅       |

## Suite donnée (coordinateur)

- `type="button"` ajouté sur les 3 boutons (commit suivant sur la branche P5).
- Plafond de 1 000 lignes : laissé (4 produits en sourcing au 14/09) ; noté pour la phase P6.
- `eslint-disable` pré-existant : laissé, hors périmètre.
