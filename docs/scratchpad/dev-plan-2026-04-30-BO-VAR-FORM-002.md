# Dev Plan — [BO-VAR-FORM-002] Enrichissement auto-complétion produit témoin

Date : 2026-04-30
Branche : `fix/BO-VAR-FORM-002-enrich-matrix-mapping` (worktree `/Users/romeodossantos/verone-bo-var-form-002/`, depuis `origin/staging` à jour avec #859)
Tag commit : `[BO-VAR-FORM-002]`
Sprint : 2 du bloc « Refonte wizard variantes » — sprint 1 mergé en `5be8045c6` (#819)

## Référence audit

Rapport complet : `docs/scratchpad/audit-2026-04-27-variant-group-creation-form.md`
Rapport sprint 1 : `docs/scratchpad/dev-report-2026-04-27-BO-VAR-FORM-001.md`

## Décisions Romeo (validées 2026-04-30)

| # | Question | Décision |
|---|----------|----------|
| Q1 | Inclure `cost_price` + `eco_tax_default` dans le mapping ? | OUI |
| Q2 | Auto-cocher `has_common_supplier` / `has_common_weight` / `has_common_cost_price` après sélection produit témoin ? | OUI (Romeo peut décocher) |
| Q3 | Bloquer si produit témoin a déjà `variant_group_id` ? | OUI (règle sprint 1 maintenue) |
| Q4 | Badges hérités cohérents avec `InheritanceRulesCard.tsx` ? | OUI — chips bleus `Lock` (actif) / neutres opacité 50% (inactif) |

## Fichiers cibles (4 — limites strictes)

1. `packages/@verone/products/src/components/wizards/VariantGroupCreationWizard.tsx`
   - Élargir le `select` de `fetchAndApplyMatrixProduct` pour inclure `weight, dimensions, style, suitable_rooms, supplier_id, cost_price, eco_tax_default` (en plus des colonnes sprint 1)
   - Étendre le handler pour pré-remplir `formData` avec ces 7 champs (avec parsing du jsonb `dimensions`)
   - Auto-cocher les 3 flags `has_common_*` quand le champ correspondant a une valeur sur le produit témoin (Q2)
   - **Fix bug latent** : si `common_weight` set → set aussi `has_common_weight=true` dans le payload (sinon `propagateWeightToProducts` ne s'exécute jamais)
   - Étendre le payload `CreateVariantGroupData` avec les champs Q1 (`has_common_cost_price`, `common_cost_price`, `common_eco_tax`)

2. `packages/@verone/products/src/components/wizards/variant-group-creation/WizardStep1Basic.tsx`
   - Ajouter sous la carte « Produit témoin » une rangée de **chips hérités** (pattern `InheritanceRulesCard.tsx` — DUPLICATION volontaire, pas de refacto pour ce sprint)
   - Tags : Dimensions, Poids, Style décoratif, Pièces compatibles, Prix de revient, Fournisseur
   - Active = bleu + `Lock` icon (champ pré-rempli depuis le produit témoin)
   - Inactif = neutre opacité 50% (champ disponible mais produit n'a pas la valeur)

3. `packages/@verone/products/src/components/wizards/variant-group-creation/WizardStep2Style.tsx`
   - Aucune modification de structure — les valeurs préremplies arrivent via `formData` propagé depuis le wizard parent

4. `packages/@verone/products/src/components/wizards/variant-group-creation/WizardStep3Supplier.tsx`
   - Ajouter checkbox `has_common_weight` (cohérent avec `has_common_supplier` existant)
   - Ajouter section **« Prix d'achat commun »** : checkbox `has_common_cost_price` + 2 inputs `common_cost_price` (numeric) et `common_eco_tax` (numeric)
   - Inputs visibles si checkbox cochée (pattern identique à `has_common_supplier` / `supplier_id`)

## Fichiers À NE PAS toucher (logique d'héritage protégée — règle sprint 1)

- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/_characteristics-blocks/InheritanceRulesCard.tsx` (pattern source — copier, pas modifier)
- `EditProductVariantModal.tsx`, `SupplierEditSection.tsx`, `WeightEditSection.tsx`, `ProductFixedCharacteristics.tsx`, `ProductDimensionsSection.tsx`
- `use-variant-group-crud.ts` (CRUD + propagateurs intacts)
- `VariantGroupEditModal.tsx`, `variant-group-form.tsx`, `VariantGroupCommonPropsSection.tsx`
- `WizardStep1Basic.tsx` ne touche QUE le bloc chips, pas la structure existante du sprint 1

## Fichiers à éviter (autres agents en cours)

- `packages/@verone/types/src/supabase.ts` — drift résolu via #859, ne pas regen sans nécessité
- `.claude/rules/*` — autre agent en train de durcir les règles sur sa branche `chore/strict-no-main-no-admin`
- `apps/back-office/src/app/(protected)/produits/sourcing/*` (Bloc A potentiel)
- `apps/back-office/src/app/(protected)/produits/catalogue/Catalogue*.tsx` (Blocs B / C / D potentiels)

## Schéma DB — colonnes mappables (vérifié `02-produits.md` régénéré 2026-04-30)

| Colonne `products` | Type | → `variant_groups` | Type | Étape | Flag |
|---|---|---|---|---|---|
| `weight` | numeric | `common_weight` | numeric | 3 | `has_common_weight` |
| `dimensions` (jsonb) | `{length, width, height, unit}` | `dimensions_length/width/height/unit` | 4 colonnes | 2 | (toujours appliqué) |
| `style` | text | `style` | text | 2 | (toujours appliqué) |
| `suitable_rooms` | `room_type[]` | `suitable_rooms` | `room_type[]` | 2 | (toujours appliqué) |
| `supplier_id` | uuid | `supplier_id` | uuid | 3 | `has_common_supplier` |
| `cost_price` | numeric | `common_cost_price` | numeric | 3 | `has_common_cost_price` |
| `eco_tax_default` | numeric | `common_eco_tax` | numeric | 3 | (couplé) |

## UX — chips hérités dans WizardStep1Basic

```tsx
// Pattern identique à InheritanceRulesCard.tsx (lignes 22-44)
function TagChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={active
      ? 'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border border-blue-200 bg-blue-50 text-blue-700'
      : 'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border border-neutral-200 bg-neutral-50 text-neutral-500 opacity-50'
    }>
      {active && <Lock className="h-2 w-2" />}
      {label}
    </span>
  );
}
```

Affichés dans la carte « Produit témoin » uniquement si `matrixProduct !== null`. 6 chips :
- Dimensions (active si product.dimensions a length/width/height)
- Poids (active si product.weight !== null)
- Style décoratif (active si product.style !== null)
- Pièces compatibles (active si product.suitable_rooms.length > 0)
- Prix de revient (active si product.cost_price !== null)
- Fournisseur (active si product.supplier_id !== null)

## Conformité aux règles `.claude/`

- ✅ `code-standards.md` : zero `any`, refetch typé via `Database`
- ✅ `data-fetching.md` : pas de nouveau `useEffect`, pas de `select('*')`, on étend une projection existante
- ✅ `responsive.md` : nouvelles checkboxes en colonnes simples mobile-first, chips wrapping naturel
- ✅ `branch-strategy.md` : sujet distinct des PRs ouvertes, branche dédiée, **PR vers `staging`** (jamais `main`)
- ✅ `workflow.md` : 1 PR cohérente (mapping enrichi + Q1 + Q2 + Q4 + fix bug latent)
- ✅ `stock-triggers-protected.md` : aucun trigger touché
- ✅ `no-phantom-data.md` : pas d'INSERT manuel, pas de note technique en colonne user-visible
- ✅ `autonomy-boundaries.md` : aucun merge `--admin`, aucune PR vers main, aucune modif `.claude/`
- ✅ Multi-agents : worktree isolé `/Users/romeodossantos/verone-bo-var-form-002/` — n'interfère pas avec l'autre agent

## Validation prévue

```bash
# Dans le worktree
cd /Users/romeodossantos/verone-bo-var-form-002
pnpm --filter @verone/products type-check
pnpm --filter @verone/back-office type-check
pnpm --filter @verone/back-office build
pnpm --filter @verone/back-office lint
```

Playwright lane-2 (login `veronebyromeo@gmail.com` / `Abc123456`) — 6 cas :

1. **Produit témoin complet** : sélectionner un produit avec poids + dimensions + style + suitable_rooms + supplier + cost_price → 7 champs pré-remplis aux étapes 2/3 + 6 chips bleus actifs en étape 1
2. **Produit partiel** : produit avec style mais pas de dimensions → seuls les champs présents pré-remplis, chips inactifs sur les autres
3. **Produit sans poids/supplier** : flags `has_common_*` restent décochés
4. **Override manuel** : modifier après pré-remplissage → la modification tient
5. **Régression critique héritage** : créer un groupe avec produit témoin, ajouter un autre produit au groupe, vérifier que `InheritanceRulesCard` affiche bien chips « hérité » sur tous les champs communs
6. **Régression bug latent** : poids saisi → après création, vérifier que les produits ajoutés au groupe héritent bien du poids (`propagateWeightToProducts` exécuté)

Responsive : 375 / 768 / 1024 / 1440 / 1920 px.

## Workflow

1. ✅ Worktree créé
2. → Premier commit (ce dev-plan) + push + PR draft
3. → Brief précis au `dev-agent` avec scope strict (4 fichiers + liste des fichiers à éviter)
4. → Rebase `origin/staging` avant chaque push
5. → Reviewer-agent en blind audit avant promotion ready
6. → `gh pr ready` UNIQUEMENT après ordre Romeo + CI verte + reviewer PASS
7. → Aucun `--admin`, aucun merge sans ordre explicite Romeo, aucune PR vers `main`
