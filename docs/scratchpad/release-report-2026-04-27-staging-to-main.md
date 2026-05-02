# Release Report — 2026-04-27 staging → main

Date : 2026-04-27
Release PR : [#820](https://github.com/Verone2021/Verone-V1/pull/820)
Merge commit : `41a0611fa1dc9562d7672425b2949748c5e467eb`
Mergé à : 2026-04-27 20:13:35 UTC
Vercel deploy prod : `success` sur `verone-back-office.vercel.app`

## Sprints inclus (3)

| Sprint                 | PR   | Description                                                                                       |
| ---------------------- | ---- | ------------------------------------------------------------------------------------------------- |
| `[BO-CONSULT-FIX-002]` | #816 | line margin uses shipping_cost as line total + show subtotals                                     |
| `[BO-PERF-001]`        | #817 | 3 useEffect loops fix sur archives/tabs (variantes + factures + expéditions) + data-fetching rule |
| `[BO-VAR-FORM-001]`    | #819 | matrix product picker + hierarchy category selector (étape 1 wizard variantes)                    |

## Validation runtime — 6 cas BO-VAR-FORM-001 sur PROD

URL : `https://verone-back-office.vercel.app/produits/catalogue/variantes`
Browser : Playwright lane-2 (lane-1 indisponible — processus zombie tués pour libérer le profil mais MCP server déconnecté).

| #   | Cas                                                                                                                                                                                                                                                   | Verdict | Preuve                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------- |
| 1   | Saisie manuelle (sans produit témoin) — validation requise sous-catégorie OK, "Suivant" disabled tant que pas remplie                                                                                                                                 | ✅ PASS | screenshot `13-cas1-manual-fill.png`     |
| 2   | Produit libre (Ampoule LED `AMP-0007`) → auto-complétion `name="Ampoule LED Globe gm 4W E27 ambre dimmable"`, `base_sku="AMP"` (dérivé), catégorie pré-sélectionnée `Maison et décoration > Éclairage > Ampoule`                                      | ✅ PASS | `07-after-confirm-AMP-0007.png`          |
| 3   | Produit déjà dans groupe (Fauteuil Eve `FAU-EVE-BLEU`, `variant_group_id` non null) → carte produit témoin reset + sélection rejetée + champs non auto-remplis. Toast d'erreur affiché brièvement (durée react-hot-toast, déjà disparu au screenshot) | ✅ PASS | `09-toast-blocked-already-in-group.png`  |
| 4   | `CategoryHierarchySelector` arborescence à 3 colonnes (Familles / Catégories / Sous-catégories) avec toutes les familles actives visibles. Bug poule/œuf de l'ancien `CategoryFilterCombobox` éliminé                                                 | ✅ PASS | `04-hierarchy-open.png`                  |
| 5   | Régression héritage **Fournisseur** : page détail produit `FAU-0005` (membre du groupe `Fauteuil Eve tissu bouclette`) — `InheritanceRulesCard` affiche chip 🔒 `Fournisseur` dans "Hérités du groupe"                                                | ✅ PASS | `12-inheritance-rules-card-FAU-0005.png` |
| 6   | Régression héritage **Poids/Style/Prix** : même page → chips 🔒 `Poids`, 🔒 `Style décoratif`, 🔒 `Prix de revient` dans "Hérités du groupe" + champ `STYLE DÉCORATIF: Contemporain — Hérité du groupe` lock visible                                  | ✅ PASS | `12-inheritance-rules-card-FAU-0005.png` |

## Console errors

`browser_console_messages(level: "error", all: true)` retourne **2 erreurs préexistantes**, non introduites par la release :

1. `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` (Supabase auth refresh — bug auth global, pas lié à BO-VAR-FORM-001).
2. `Failed to load resource 404 /fournisseurs/9078f112-6944-4732-b926-f64dcef66034` (page fournisseur Opjet inexistante, lien clickable mais 404).

**0 erreur** liée aux fichiers modifiés par la release.

## Cleanup branches

- `fix/BO-VAR-FORM-001-step1-product-matrix` : supprimée (`gh pr merge --delete-branch` à PR #819)
- `fix/BO-CONSULT-FIX-002-line-margin-and-subtotals` : déjà supprimée
- `fix/BO-PERF-001-*` : déjà supprimée
- PRs ouvertes restantes vers staging (laissées) : 4 = 3 Dependabot + 1 INFRA-IMG-001 DRAFT (en attente Cloudflare Images activation)

## Suivi recommandé

| Item                                                                                                                                                                                                | Type                    | Priorité            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------- |
| Configurer un preview Vercel pour `staging` BO afin de tester runtime AVANT release                                                                                                                 | `[INFRA-VERCEL-001]`    | moyenne             |
| Investiguer le warning `Each child in a list should have a unique key prop` sur `ProductShippingCard.tsx:421` (signalé par Romeo, autre agent en cours)                                             | `[BO-CHAN-SITE-001]`    | basse (autre agent) |
| Investiguer Supabase advisors `anon_security_definer_function_executable` (313) et `authenticated_security_definer_function_executable` (313) → +623 vs baseline. Marqué informational mais à fixer | `[BO-DB-RLS-001]`       | basse               |
| Auth refresh token error : récurrent en console, mérite un fix                                                                                                                                      | `[BO-AUTH-REFRESH-001]` | basse               |

## Verdict global

✅ **Release validée en runtime sur prod**. Aucune régression d'héritage détectée (cas 5 et 6, règle absolue Romeo "ne rien casser" respectée). 6/6 cas passés. 0 erreur console introduite.
