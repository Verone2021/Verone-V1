# dev-report — BO-PRODUCTS-PROFIT-001 — 2026-09-15

## Statut : DONE — prêt pour reviewer-agent

---

## 1. Objectif

Afficher la rentabilité nette LinkMe sur les fiches produit du back-office
(étapes 2 et 3 du plan). Règle métier : marge Vérone = prix LinkMe fixé
(`base_price_ht_locked`) − prix de revient. Les commissions affiliés sont
EXCLUES de la marge et affichées séparément.

---

## 2. Fichiers créés

### Calcul pur (testable sans réseau)

- `packages/@verone/products/src/utils/product-sales-margin.ts` (390 l)
  - Interfaces : `SaleLineInput`, `ProductCostInput`, `ResolvedCost`,
    `ComputedSaleLine`, `ChannelSummary`, `AffiliateSummary`,
    `TheoreticalMargin`, `LinkMeSummary`
  - Exports : `LINKME_CHANNEL_ID`, `VALID_SALE_STATUSES`,
    `resolveCost`, `isValidLine`, `computeSaleLine`,
    `summarizeByChannel`, `summarizeLinkMe`
  - `LINKME_CHANNEL_ID` hardcodé localement (pas de dep `@verone/channels`)
  - Produits affiliés (`created_by_affiliate`): logique inversée,
    Vérone perçoit une commission, pas de marge calculée

- `packages/@verone/products/src/utils/__tests__/product-sales-margin.test.ts` (343 l)
  - Runner `npx tsx`, 8 cas : resolveCost, isValidLine, canal manuel,
    LinkMe avec prix verrouillés, fallback unitPrice, produit affilié,
    coût manquant, comptage affiliés (summarizeLinkMe)
  - Vérification sanity SQL PLA-0001 : qty 1880, veroneRevenue 37129.10,
    affiliateCommissions 6552.63, clientRevenue 43677.80

### Hook de données

- `packages/@verone/products/src/hooks/use-product-sales-margin.ts` (275 l)
  - `'use client'`, TanStack Query, clé `['product-sales-margin', productId]`,
    staleTime 30 000 ms, cache partagé entre `LinkMeNetMarginCard` et
    `SalesByChannelCard` → 0 requête dupliquée
  - 4 requêtes parallèles : lignes de commande (2 000 lignes max), coûts
    produit, prix LinkMe canal, affiliés proposants (500 max)
  - Supabase embeds imbriqués (`any` implicite) → pattern `unknown` +
    `Record<string, unknown>` après guard `typeof === 'object'`. Zero
    `as unknown as X`, zero `@ts-ignore`

### Composants UI

- `packages/@verone/products/src/components/sections/profitability/profitability-format.ts`
  — `fmtEur`, `fmtPct`, `fmtQty`, `fmtDate`, `fmtCoef`, `clrMargin`

- `packages/@verone/products/src/components/sections/profitability/LinkMeAffiliateList.tsx`
  — liste empilée par affilié (div, pas de Table)

- `packages/@verone/products/src/components/sections/profitability/LinkMeNetMarginCard.tsx`
  (213 l, légèrement > 200 — déjà extrait `LinkMeAffiliateList`)
  — tuiles `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
  — 3 états : loading, error, data
  — variante produit affilié : commission Vérone à la place de la marge
  — apostrophe Unicode U+2019 pour éviter l'erreur de syntaxe TS

- `packages/@verone/products/src/components/sections/profitability/SalesByChannelCard.tsx` (155 l)
  — `ResponsiveDataView` breakpoint="md"
  — colonnes masquées progressivement : `hidden lg:table-cell` /
  `hidden xl:table-cell`
  — canal LinkMe libellé "LinkMe (hors commission affiliés)"

- `packages/@verone/products/src/components/sections/profitability/PurchaseHistoryTable.tsx` (103 l)
  — extrait de l'ancien `ProductProfitabilitySection` (was 457 l)
  — responsive : Fournisseur `hidden md:table-cell`, PU/Coût `hidden lg:table-cell`

- `packages/@verone/products/src/components/sections/profitability/SalesHistoryTable.tsx` (146 l)
  — colonnes masquées progressivement

- `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/AffiliateCommissionCard.tsx` (104 l)
  — commission affilié extraite de la page `[id]` pour réduire à < 400 l

---

## 3. Fichiers modifiés

- `packages/@verone/products/src/hooks/index.ts`
  — ajout export `use-product-sales-margin`

- `packages/@verone/products/src/components/sections/ProductProfitabilitySection.tsx`
  — 457 l → 169 l (extraction des tables dans `profitability/`)
  — KPIs totalSoldQty + grossMargin recalculés depuis `salesData.lines`
  — restructuration Prettier imports + destructuring multi-lignes

- `packages/@verone/products/src/components/sections/index.ts`
  — ajout exports `LinkMeNetMarginCard`, `SalesByChannelCard`

- `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/index.ts`
  — ajout export `AffiliateCommissionCard`

- `apps/back-office/src/app/(protected)/canaux-vente/linkme/catalogue/[id]/page.tsx`
  — 441 l → 365 l : commission inline remplacée par `<AffiliateCommissionCard>`
  — `<LinkMeNetMarginCard>` ajouté entre les sélections et les variantes

- Les deux copies de `product-pricing-dashboard.tsx` (identiques, 204 l chacune)
  — Zone 5 : `<SalesByChannelCard>` + `<LinkMeNetMarginCard>` + section historique existante

---

## 4. Bugs rencontrés et corrigés

### Bug #1 — `affiliateId`/`affiliateName` manquants dans `ComputedSaleLine`

- Champs absents de l'interface et de l'objet retourné par `computeSaleLine`
- Détecté par les tests : `AssertionError: 2 affiliés vendeurs — 0 !== 2`
- Fix : ajout des champs dans l'interface et dans le `return`

### Bug #2 — Apostrophe brisant la syntaxe TypeScript (LinkMeNetMarginCard line 113)

- `'Prix d'achat seul...'` — le parseur TS interprétait `'` comme fin de chaîne
- Fix : `'Prix d’achat seul...'` (U+2019 RIGHT SINGLE QUOTATION MARK)

### Bug #3 — ESLint `no-unsafe-member-access` sur embeds Supabase imbriqués

- Cause : Supabase JS ne peut pas inférer le type des embeds > 2 niveaux de
  profondeur ; les variables `ch`, `si`, `sel`, `aff` étaient `any`
- Fix : pattern `unknown` → `Array.isArray` → `as unknown[]` → element →
  `typeof === 'object'` → `as Record<string, unknown>` pour chaque niveau.
  Aucun `as unknown as X`, aucun `@ts-ignore`

---

## 5. Vérifications effectuées

| Check                                                       | Résultat                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `npx tsx __tests__/product-sales-margin.test.ts`            | ✅ 8/8 OK                                                                           |
| `pnpm --filter @verone/products type-check`                 | ✅ 0 erreur                                                                         |
| `pnpm --filter @verone/back-office type-check`              | ✅ 0 erreur                                                                         |
| `pnpm --filter @verone/products lint` (--max-warnings=0)    | ✅ 0 erreur, 0 warning                                                              |
| `pnpm --filter @verone/back-office lint` (--max-warnings=0) | ✅ 0 erreur, 0 warning                                                              |
| Fichiers < 400 lignes                                       | ✅ max 390 l                                                                        |
| Composants < 200 lignes                                     | ⚠ `LinkMeNetMarginCard` : 213 l (13 au-dessus, déjà extrait `LinkMeAffiliateList`) |

---

## 6. Sanity SQL confirmée (mcp**supabase**execute_sql)

Produit PLA-0001 (Plateau bois 20×30), filtres identiques au hook :

- Lignes valides : qty 1880
- veroneRevenue : 37129.10
- affiliateCommissions : 6552.63
- clientRevenue : 43677.80

---

## 7. Responsive

- `SalesByChannelCard` : `ResponsiveDataView` breakpoint="md", colonnes masquées `lg:` / `xl:`
- `LinkMeNetMarginCard` : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- `LinkMeAffiliateList` : `div` stacked (pas de table)
- `PurchaseHistoryTable` / `SalesHistoryTable` : colonnes masquées `md:` / `lg:` / `xl:`
- Page back-office (admin uniquement) : tests Playwright desktop 1440 + 1920 non requis
  en l'absence de serveur dev (`pnpm dev` interdit)

---

## 8. Prêt pour

- `reviewer-agent` : audit qualité avant PR
- Aucun commit ni push effectué (conformément aux instructions)
