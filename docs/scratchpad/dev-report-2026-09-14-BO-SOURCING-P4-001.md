# Dev report — 2026-09-14 — BO-SOURCING-P4-001 — Fiche sourcing en 4 étapes

Branche locale `feat/BO-SOURCING-P4-001-fiche-4-etapes`, **empilée sur `feat/BO-SOURCING-P3-001-cycle-de-vie`**
(PR #1150, non fusionnée) : P4 a besoin des types de P3. Commits d5bd36b6 (fonctionnalité) + commit de corrections
de revue. **Rien n'est poussé** : la branche sera mise à jour depuis `staging` après fusion de #1148 → #1149 → #1150,
puis poussée en une fois.

Plan : `/Users/romeodossantos/.claude/plans/splendid-orbiting-comet.md` (section P4), approuvé le 13/09.

## Base — migration préparée, NON appliquée (accord de Roméo requis)

`supabase/migrations/20260913220000_bo_sourcing_p4_validate_to_catalogue.sql` : `CREATE OR REPLACE` de
`apply_product_lifecycle_action`. Seul changement : `validate` écrit `sourcing_status='validated'` **et**
`creation_mode='complete'` (décision de Roméo 13/09 : le produit rejoint le catalogue en brouillon). Même signature
→ types inchangés. Aucun déclencheur de `products` ne lit `creation_mode` ni `sourcing_status` (17 déclencheurs
vérifiés le 13/09).

Essai en transaction annulée (13/09, produit TEST `2d53ddd5-9a04-4c0a-b8f5-8081cf3066c5`, compte back-office) :

| Contrôle                                                                                | Résultat                                                         |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Validation sans fournisseur                                                             | refusée `VL004`                                                  |
| `set_stage` (inchangé)                                                                  | `sample_requested → evaluation`                                  |
| Validation avec fournisseur (posé dans la transaction)                                  | `creation_mode` sourcing → complete, `sourcing_status` validated |
| `product_status`, `stock_real`, `stock_forecasted_in/out`, `stock_status`, `cost_price` | identiques                                                       |
| Requête catalogue (`creation_mode <> 'sourcing'`) / liste sourcing                      | 1 / 0                                                            |
| 2e validation                                                                           | refusée `VL001`                                                  |
| Journal                                                                                 | 2 entrées `status_change` dans la même transaction               |
| Droits                                                                                  | anon **false**, authenticated **true**                           |
| Après annulation                                                                        | produit identique, journal 0, fonction de production inchangée   |

## Code

- **Logique pure testée** (`npx tsx packages/@verone/products/src/utils/__tests__/<nom>.test.ts`, 3 fichiers OK) :
  `sourcing-stage.ts` (`stageOfStatus`, `availableLifecycleActions`, miroir des listes SQL),
  `derive-sample-state.ts` (état échantillon lu dans les commandes `po_type='sample'`, même règle que VS001),
  `sourcing-journal.ts` (libellés, titre et motif des changements de statut).
- **Hooks** : `use-sourcing-lifecycle.ts` (seule porte vers la fonction), `use-sample-state.ts` (TanStack Query),
  `use-sourcing-sample-order.ts` réécrit sur `request_sample_order` (plus d'écriture directe, plus de TVA 20 % en dur,
  plus d'écriture `sample_requested`), `use-sourcing-mutations.ts` (valider / retirer avec motif / restaurer via la
  fonction), `use-sourcing-notebook.ts` (type journal aligné, notes, priorité seule, `.limit(200)`),
  `use-sourcing-fetch.ts` (filtres fournisseur et client rechargent enfin la liste).
- **Écran** : `product-page/` — `SourcingStageHeader`, `SourcingActionBar`, `SourcingJournal` + `SourcingJournalForm`,
  `SourcingOffersSection`, `SourcingReasonDialog` ; page 378 lignes sans onglets ; `SourcingLifecycleDialogs`
  co-localisé. Supprimés : `SourcingPipelineBar`, `SourcingStageGuide` (+ `getSectionsForStatus`),
  `SourcingCommunications`, encadré « Workflow » des consultations liées.
- **Corrections au passage** : lien fournisseur de l'onglet Archivés, retrait depuis la liste avec motif obligatoire,
  formulaire rapide (ne charge plus toute la liste, redirige vers la fiche créée), libellés du rapport
  (`archived`, `refused`, `validated`).

## Vérifications

- `@verone/products` : type-check OK, lint 0 avertissement ; `@verone/back-office` : type-check OK, ESLint 0 sur les
  fichiers touchés.
- **Playwright 1440** sur `localhost:3000` (serveur de Roméo, non relancé), produit TEST :
  fiche initiale (4 étapes, « Aucun échantillon », Commander / Valider grisés « Liez d'abord un fournisseur ») ;
  pause → reprise (retour exact à `sample_requested`) ; retrait avec motif (confirmer grisé tant que le motif est vide,
  badge « Retiré », seules Restaurer / Annoter proposées, étapes non cliquables) → restauration ; note interne
  (formulaire ouvert par « Annoter », page défilée jusqu'au journal). Base vérifiée après chaque action.
  0 erreur console venant de la fiche (seules erreurs : connexion temps réel de la base coupée, avertissements du
  compteur du menu et d'une image, sans lien).
  Captures : `.playwright-mcp/screenshots/20260914/sourcing-p4-*.png`.
- **Remise à l'identique** : 5 entrées de journal de test supprimées par identifiant (4 `status_change` + 1 note).
  Produit TEST identique à l'état relevé avant (étape, statut, priorité, retrait, fournisseur, prix, stocks,
  0 journal, 0 ligne de commande, 24 commandes fournisseurs au total). Seul `updated_at` a changé
  (22:08:07 UTC, posé par le déclencheur `products_updated_at`, non restaurable sans le contourner).
- **Revue** : `docs/scratchpad/review-report-2026-09-14-BO-SOURCING-P4-001.md` — PASS avec réserves ; les 3 réserves
  (taille de la page, `.catch` du formulaire, `.limit` du journal) corrigées dans le 2e commit.

## Non testé / écarts assumés

- **Validation au catalogue dans l'écran** : non cliquée — la fonction de production n'a pas encore le changement
  P4 (le produit resterait en sourcing « Validé » sans retour possible). Couverte par l'essai annulé ; à refaire
  dans l'écran après application.
- **Commander l'échantillon / Voir la commande / 2e commande refusée** : non testé dans l'écran — il faudrait lier
  un fournisseur au produit TEST et créer une vraie commande (numéro de commande consommé définitivement même si
  elle est annulée). Garde VS001 déjà prouvée en transaction annulée le 13/09 (P3). À décider avec Roméo.
- **1920 px** : non capturé — la règle Playwright interdit d'agrandir la fenêtre au-delà de 1440.
- **`ResponsiveActionMenu` non utilisé** pour la barre d'actions : il n'affiche que des icônes ; boutons avec libellé
  sur grand écran et menu « Plus » en dessous (cibles 44 px).
- **Section photos** reportée à P4b (affichage + ajout ensemble).
- **`approveSample` / `rejectSample`** gardées jusqu'au ménage P6 (seul appelant : écran mort de
  `@verone/ui-business`).
- **Suivi** : les notes et échanges du journal n'enregistrent pas leur auteur (`logged_by` vide, comportement
  antérieur) ; seuls les changements de statut l'ont.
