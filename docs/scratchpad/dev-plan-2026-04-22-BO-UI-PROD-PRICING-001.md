# Dev Plan — BO-UI-PROD-PRICING-001

**Date** : 2026-04-22
**Branche** : `feat/BO-UI-PROD-PRICING-001` (déjà créée, 1 commit fix KPI Général déjà poussé)
**PR associée** : #708 (draft, à enrichir puis ready à la fin)
**Audit source** : `docs/scratchpad/audit-2026-04-22-pricing-tarification-general.md`
**Design cible** : `docs/scratchpad/stitch/stitch-tarification-v4-aligne-general-2026-04-22.png` (validé par Romeo)

---

## 1. Contexte & décisions actées

| Décision                                                    | Valeur retenue                                      | Justification                  |
| ----------------------------------------------------------- | --------------------------------------------------- | ------------------------------ |
| Devise d'affichage principal                                | **HT** partout, TTC en sub                          | Standard B2B senior            |
| Base calcul prix min vente                                  | `products.cost_net_avg ?? products.cost_price`      | Règle métier Romeo             |
| TVA appliquée                                               | 20 % (pas de colonne `tva_rate` en DB sur products) | Mobilier/déco FR standard      |
| Label KPI Général                                           | "PRIX VENTE CONSEILLÉ" → **"PRIX MIN VENTE"**       | Nomenclature pro               |
| Base `UnifiedPricingPanel` / `SupplierVsPricingEditSection` | Aligner sur `cost_net_avg`                          | Cohérence multi-endroits       |
| Scope PR                                                    | Phase A + B + C bundlées (1 PR cohérente)           | Règle workflow "1 PR = 1 bloc" |
| Tests Playwright                                            | Déferrés sprint `BO-UI-PROD-E2E-001`                | Handoff précédent              |
| Simulateur marge temps réel                                 | Backlog                                             | Scope creep                    |

---

## 2. Phase A — Corrections Général (quick wins)

### A.1 `apps/back-office/.../KpiStrip.tsx`

**Changements** :

- Tuile 2 : `kicker` "Coût unitaire HT" reste (déjà correct) ; `sub` enrichi avec `cost_net_avg` quand différent (déjà fait).
- Tuile 3 (actuellement "Prix vente conseillé") :
  - `kicker` → **"PRIX MIN VENTE"**
  - `value` → **HT** (ex. `14,84 €`) au lieu de TTC (`17,81 €`)
  - `sub` → `"HT · base prix de revient · TTC ${formatPrice(suggestedPriceTtc)}"`
- Signature de la prop renommée : `suggestedPriceTtc` → **`minSellingPriceHt`** (prop principale) + nouvelle prop optionnelle `minSellingPriceTtc` pour sub TTC.

### A.2 `apps/back-office/.../product-general-dashboard.tsx`

**Changements** :

- `minimumSellingPrice` = déjà calculé, devient la valeur HT principale.
- `suggestedPriceTtc` reste calculé mais devient sub, renommé `minSellingPriceTtc`.
- Passer à `KpiStrip` : `minSellingPriceHt` et `minSellingPriceTtc`.
- `siteMarginPercent` : **scinder en 2 calculs** :
  - `siteGrossMarginPercent` = `(sitePrice − minSellingPrice) / minSellingPrice × 100` (actuel)
  - `siteNetMarginPercent` = `(sitePrice × (1 − commission_site_%) − landedCost) / (sitePrice × (1 − commission_site_%)) × 100` (nouveau, selon `channel_pricing.channel_commission_rate` du canal site_internet, fallback 0 %)
- Prop `KpiStrip.siteMarginPercent` = garder le gross pour simplicité KPI, afficher le net dans le bloc détaillé.

### A.3 `apps/back-office/.../ChannelPricingTable.tsx`

**Changements** :

- Fetch enrichi : récupérer `channel_commission_rate` + `min_margin_rate` + `suggested_margin_rate` via le hook `useChannelPricing` existant (ou enrichir si manque). Note : ces colonnes existent déjà en DB, le hook doit être audité et enrichi si besoin.
- Nouvelles colonnes table :
  - Après "Marge %" (renommée en "Marge brute %") → ajouter "Commission" (text-xs, ex. "−15 %" ou "—")
  - Après "Commission" → ajouter "Marge nette %" (calculée avec commission)
- Sub sous le nom du canal : quand `commission_rate > 0`, afficher `"commission ${rate}%"` text-[10px] text-neutral-500.
- Chip rouge "Sous min" visible : déjà présent dans la colonne Statut quand `belowMin`, rendre plus visible (chip au lieu de fond rouge discret).

### A.4 `useChannelPricing` enrichi (si nécessaire)

- Vérifier que `custom_price_ht, public_price_ht, discount_rate, markup_rate` sont bien retournés (OK selon lecture).
- Ajouter au `select` : `channel_commission_rate, min_margin_rate, max_margin_rate, suggested_margin_rate`.
- Ajouter ces champs dans l'interface `ChannelPricingEntry`.

---

## 3. Phase B — Refonte Tarification (design Stitch v4)

### B.1 Hook `packages/@verone/products/src/hooks/use-product-pricing-dashboard.ts`

**Déjà draft** (commit local non commité). À auditer/finaliser :

- Agrège `purchase_order_items` avec jointure `purchase_orders` + `organisations` (fournisseur)
- Calcule `costStats` : moyenne pondérée, min, max, last, total qty 12 mois
- Récupère `channel_pricing` avec `channel_commission_rate` + marge rates

**Export** : ajouter `export * from './use-product-pricing-dashboard'` dans `packages/@verone/products/src/hooks/index.ts`.

### B.2 Nouveaux composants `_components/_pricing-blocks/`

Pattern : identique à `_dashboard-blocks/` (Général).

- **`PricingKpiStrip.tsx`** : 3 tuiles (Prix d'achat HT subdued / Prix de revient HERO indigo / Marge cible editable)
- **`FormulaExplainerCard.tsx`** : card bleu clair, formule "Prix min vente = revient × (1+marge) + éco-taxe", link "Pourquoi pas prix d'achat ? →"
- **`CostHistoryCard.tsx`** : Moyenne / Min-Max / Dernier / Volume 12 mois + mini sparkline 12 bars
- **`PurchaseOrdersTable.tsx`** : tableau consolidé Réf PO / Date / Fournisseur / Prix unit HT / Prix revient / Qté + "Exporter CSV" + pagination "+N plus anciennes"
- **`ChannelPricingDetailed.tsx`** : tableau étendu (vs `ChannelPricingTable`) avec ligne LinkMe expandable (breakdown commission + marge nette), miroirs lockés
- **`PricingFooterNote.tsx`** : card footer "Rappel des règles de calcul"

### B.3 Orchestrateur `product-pricing-dashboard.tsx`

Pattern identique à `product-general-dashboard.tsx` :

- Rail gauche : réutilisation `GeneralRail` (composant product-agnostic, pas spécifique Général)
- Body : KPI strip → Formula → 2 cols historique → Canal → Footer note
- Props : `product`, `onProductUpdate`, `onTabChange`, `completionPercentage`, `primaryImageUrl`
- Hook : `useProductPricingDashboard(product.id)` pour les données + réutilisation `useChannelPricing`

### B.4 Wrapper minimal `product-pricing-tab.tsx`

Remplacer le contenu par :

```tsx
export function ProductPricingTab(props) {
  return <ProductPricingDashboard {...props} />;
}
```

### B.5 Mise à jour `page.tsx`

La prop `ProductPricingTab` doit recevoir les props supplémentaires (`completionPercentage`, `primaryImageUrl`, `onTabChange`) comme `ProductGeneralTab`. Ajuster le render dans `TabContent activeTab={activeTab} tabId="pricing"`.

---

## 4. Phase C — Aligner `UnifiedPricingPanel` + `SupplierVsPricingEditSection`

### C.1 `packages/@verone/common/src/components/pricing/UnifiedPricingPanel.tsx`

Changement minimal (une ligne) :

```tsx
// avant
const costPrice = isCostPriceManagedByGroup
  ? group.common_cost_price
  : product.cost_price;
// après
const landedCost = isCostPriceManagedByGroup
  ? (group.common_cost_price ?? 0)
  : (product.cost_net_avg ?? product.cost_price ?? 0);
const minimumSellingPrice =
  margin > 0 ? calculateMinSellingPrice(landedCost, ecoTax, margin) : 0;
```

### C.2 `packages/@verone/common/src/components/pricing/SupplierVsPricingEditSection.tsx`

- Ligne 49-51 (`currentCostPrice`) : inchangé (affichage du prix d'achat reste cost_price).
- Ligne 56-63 (`currentSellingPrice` affichage readonly) : base = `product.cost_net_avg ?? cost_price`.
- Ligne 84-89 (`handleSave` calcul `selling_price`) : base = `editData.cost_price` (cohérent : l'utilisateur simule un changement de prix d'achat, le selling_price sauvegardé reflète ce simulat). **Pas de changement** car la valeur en DB doit rester une référence calculable.
- Ligne 107-113 (`editSellingPrice` preview édition) : base = `editData.cost_price` (idem, preview cohérent avec la saisie utilisateur).

### C.3 Type `Product` dans `supplier-pricing-types.ts`

Vérifier que `cost_net_avg` est bien dans le type (ou l'ajouter).

### C.4 `SupplierPricingDisplay.tsx` (si nécessaire)

Afficher visuellement la distinction prix d'achat (5,15 €) vs prix de revient (10,60 €) comme base de calcul. Si le composant est utilisé par plusieurs modals, impact à auditer.

---

## 5. Phase D — Tests & validation (NON bloquant cette PR)

Selon handoff, les tests Playwright sont déférés au sprint `BO-UI-PROD-E2E-001`.

**Validation locale obligatoire avant push final** :

- `pnpm --filter @verone/back-office type-check`
- `pnpm --filter @verone/back-office lint`
- `pnpm --filter @verone/products type-check`
- `pnpm --filter @verone/common type-check`
- `pnpm --filter @verone/back-office build` (si RAM permet, sinon Vercel CI)

---

## 6. Fichiers touchés (récap)

### Phase A (3 fichiers)

- `apps/back-office/.../KpiStrip.tsx`
- `apps/back-office/.../product-general-dashboard.tsx`
- `apps/back-office/.../ChannelPricingTable.tsx`
- `packages/@verone/common/src/hooks/use-channel-pricing.ts` (si enrichissement nécessaire)

### Phase B (8 fichiers nouveaux + 2 modifiés)

- **Nouveaux** :
  - `packages/@verone/products/src/hooks/use-product-pricing-dashboard.ts` (déjà draft, finaliser)
  - `apps/back-office/.../_pricing-blocks/PricingKpiStrip.tsx`
  - `apps/back-office/.../_pricing-blocks/FormulaExplainerCard.tsx`
  - `apps/back-office/.../_pricing-blocks/CostHistoryCard.tsx`
  - `apps/back-office/.../_pricing-blocks/PurchaseOrdersTable.tsx`
  - `apps/back-office/.../_pricing-blocks/ChannelPricingDetailed.tsx`
  - `apps/back-office/.../_pricing-blocks/PricingFooterNote.tsx`
  - `apps/back-office/.../product-pricing-dashboard.tsx`
- **Modifiés** :
  - `apps/back-office/.../product-pricing-tab.tsx` (devient wrapper minimal)
  - `apps/back-office/.../page.tsx` (ajuster props `ProductPricingTab`)
  - `packages/@verone/products/src/hooks/index.ts` (export hook)

### Phase C (3 fichiers)

- `packages/@verone/common/src/components/pricing/UnifiedPricingPanel.tsx`
- `packages/@verone/common/src/components/pricing/SupplierVsPricingEditSection.tsx`
- `packages/@verone/common/src/components/pricing/supplier-pricing-types.ts` (si type à enrichir)

**Total** : ~14 fichiers (dont 8 nouveaux).

---

## 7. Contraintes techniques (CLAUDE.md + règles)

- ❌ Zéro `any`, zéro `as any`, zéro `eslint-disable`
- ✅ `useCallback` AVANT d'ajouter aux deps `useEffect`
- ✅ `await queryClient.invalidateQueries()` dans `onSuccess` mutations
- ✅ `void` + `.catch()` sur promises event handlers
- ✅ 5 techniques responsive (`ResponsiveDataView` pour le tableau PO si on veut transformer en cartes < md, sinon scroll horizontal)
- ✅ Touch targets 44 px mobile (`h-11 w-11 md:h-9 md:w-9`)
- ✅ Colonnes table `hidden lg/xl:table-cell` pour masquables
- ✅ Fichier < 400 lignes — si dépassement, décomposer
- ✅ Imports `@verone/ui` (Badge, ButtonV2, Input), `@verone/utils` (formatPrice, cn), `lucide-react` pour icônes
- ✅ `Image` from `next/image` (pas `<img>`)

---

## 8. Ordre d'exécution

1. **Phase A.4** — Enrichir `useChannelPricing` (ajouter commission + margin rates) si hook pas à jour
2. **Phase A.1-A.3** — Fixes Général (KpiStrip rename + ChannelPricingTable enrichi)
3. **Phase C** — Aligner UnifiedPricingPanel + SupplierVsPricingEditSection
4. **Phase B.1** — Finaliser hook `useProductPricingDashboard`
5. **Phase B.2** — Créer les 6 composants `_pricing-blocks/`
6. **Phase B.3-B.5** — Orchestrateur + wrapper + page.tsx
7. **Commits intermédiaires** : 1 commit par phase (A / C / B) pour faciliter rollback
8. **Verify-agent** : type-check all packages + lint
9. **Reviewer-agent** : blind audit du dev-report
10. **Push final + PR ready** via ops-agent

---

## 9. Points de vigilance

- **Routes API Qonto** : aucune touchée ✅
- **Triggers stock** : aucun touché ✅
- **RLS** : aucune policy touchée ✅
- **Migrations DB** : aucune nécessaire ✅
- **`GeneralRail`** : composant réutilisé tel quel. Si renommage en `ProductSidebarRail` (pour clarté), ajuster 2 imports (product-general-dashboard + product-pricing-dashboard). **Décision** : ne pas renommer, éviter scope creep.
- **Breakpoints mobile** : le tableau `PurchaseOrdersTable` doit passer en cartes < md via `ResponsiveDataView` OU scroll horizontal assumé. À trancher côté dev-agent.

---

**Status** : Plan validé par Romeo (design Stitch v4 + Phase C inclus). En attente de délégation à `dev-agent` pour exécution.
