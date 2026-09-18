# Prompt Claude Code — LOT 7 : remettre d'aplomb le socle partagé

`[REFACTO-UI-001]` — plusieurs PR, aucune urgence, à faire quand les lots 1 à 6 sont passés.

## Constat mesuré le 18/09

Bonne nouvelle d'abord : **aucune primitive du design system n'est dupliquée entre les trois applications**
(bouton, carte, fenêtre, tableau, badge, sélecteur, formulaire), aucun import croisé entre apps, et le graphe
des 26 packages n'a **aucune dépendance circulaire**. La dette n'est pas là où on la craignait.

Elle est à l'intérieur des packages partagés :

| Constat                                    | Mesure                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Deux boutons concurrents dans `@verone/ui` | `button.tsx` (315 l., 556 usages) contre `button-unified.tsx` (210 l., 10 fichiers)                                                        |
| Sous-module `stock` forké                  | `packages/@verone/ui/components/stock/*` copié dans `apps/back-office/components/ui-v2/stock/*`, déjà divergé ; 4 pages importent les deux |
| Design system théorique non branché        | `@verone/tokens` : **0 import dans tout le dépôt**. `@verone/themes` : 4 fichiers                                                          |
| 3 configurations Tailwind divergentes      | aucun preset commun, 3 palettes, 3 typographies                                                                                            |
| Motif « confirmation » en double           | `confirm-dialog.tsx` d'un côté, `ConfirmDeleteModal`/`ConfirmSubmitModal` de l'autre                                                       |
| Typage laxiste concentré dans les packages | 41 `: any` + 46 `as any` + 309 `eslint-disable` dans `packages/`, contre 0 et 1 dans les apps                                              |
| Fichiers > 400 lignes                      | 274 au total (back-office 95, LinkMe 44, site 7, packages 128) — la règle interne est violée 274 fois                                      |
| Duplication de code brute                  | 3,95 %, dont **94 % dans les packages partagés**                                                                                           |
| Réutilisation du design system             | back-office 63 %, LinkMe 35 %, **site internet 11 %**                                                                                      |

## Ordre de travail

1. **Un seul bouton.** Choisis `ButtonV2`, migre les 10 fichiers qui utilisent `ButtonUnified`, supprime
   `button-unified.tsx`. Codemod, pas à la main.
2. **Supprimer le fork `ui-v2/stock`** : les 4 pages importent `@verone/ui`, les divergences utiles remontent
   dans le package.
3. **Brancher ou supprimer `@verone/tokens` et `@verone/themes`.** Un package à zéro import est soit une dette,
   soit une intention. Tranche avec Roméo : preset Tailwind commun alimenté par les tokens, ou suppression.
4. **Un seul motif de confirmation**, construit sur `confirm-dialog.tsx`.
5. **`any` et `eslint-disable` dans les packages** : plafond figé en CI, puis décroissant. On ne les corrige pas
   tous d'un coup, on empêche l'ajout.
6. **Fichiers > 400 lignes** : contrôle bloquant sur les **nouveaux** fichiers uniquement, puis les 20 plus gros
   par lots, en commençant par `packages/@verone/integrations/src/qonto/client.ts` (1 654 lignes).

## Règle générale

Ce lot ne doit changer **aucun comportement visible**. Toute PR qui modifie un écran en même temps qu'elle
refactorise est refusée : on ne mélange pas les deux.
