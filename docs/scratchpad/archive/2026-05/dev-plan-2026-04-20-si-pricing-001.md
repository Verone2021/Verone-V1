# SI-PRICING-001 — Fiche produit : prix regroupés (achat + canaux + garde-fou)

**Date** : 2026-04-20
**Branche** : `feat/SI-PRICING-001-unified-product-pricing`
**Base** : `staging` (fraîche)

---

## 1. Objectif utilisateur (Romeo)

Dans la fiche produit back-office, regrouper **au même endroit** :

1. **Prix d'achat auto-calculé** depuis les commandes fournisseurs (min/max/moyen + livraison répartie).
2. **Historique des prix d'achat** (timeline PO).
3. **Prix minimum de vente** (garde-fou calculé : cost + marge + eco_tax) — aucun canal ne peut descendre en dessous.
4. **Prix de vente par canal** :
   - Site-internet (= Google Merchant = Meta, prix unique, redirect vers le site)
   - LinkMe (différent, B2B)
5. **Description commune** (pas de section par canal, déjà le cas).

---

## 2. État actuel (audit 2026-04-20)

### Ce qui existe

**DB (products, 85 colonnes)** :

- `cost_price` (référence manuelle), `eco_tax_default`, `margin_percentage`
- `cost_price_avg/min/max/last/count` — agrégats prix achat unitaire depuis PO
- `cost_net_avg/min/max/last` — agrégats prix achat **livré** (inclus shipping/assurance)
- Table `product_purchase_history` (9 cols) — historique PO complet (unit_price_ht, unit_cost_net, quantity, purchased_at)

**DB (channel_pricing, 35 colonnes)** :

- `custom_price_ht`, `public_price_ht`, `discount_rate`, `markup_rate`
- Par couple `product_id × channel_id` (4 canaux : site-internet, LinkMe, Google Merchant, Meta)
- Table `channel_pricing_history` (16 cols) — historique changements

**UI** :

- `/produits/catalogue/[id]` → onglet Tarification → `SupplierVsPricingEditSection` (prix achat + min vente calculé + eco_tax + marge)
- `/canaux-vente/site-internet/produits/[id]` → `TabPricing` (custom_price_ht + discount_rate)
- Composant `SupplierPricingDisplay` (312 L) — affiche déjà min/max/avg/last des coûts

### Ce qui manque

- **Un seul écran** regroupant prix achat + garde-fou + prix canaux (actuellement éclaté sur 2 pages).
- **Édition inline des prix canaux** depuis la fiche produit (actuellement il faut aller dans `/canaux-vente/...`).
- **Validation serveur** : prix canal ≥ min calculé (actuellement pas de garde-fou persistant).
- **Timeline prix d'achat** côté UI (données présentes, pas affichées).

### Pas besoin de migration DB

La formule min vente = `cost_price × (1 + margin%) + eco_tax` se calcule à la volée côté client et serveur. On peut ajouter une colonne `min_selling_price` persistée plus tard si nécessaire, mais **pas dans ce sprint** (évite le FEU ROUGE migration).

---

## 3. Scope proposé

### Livraisons

1. **Nouveau composant partagé** `packages/@verone/common/src/components/pricing/UnifiedPricingPanel.tsx`
   - 4 sections dans un seul panel :
     - **A. Prix d'achat** (lecture, depuis `cost_net_*` + `cost_price_*`) + bouton "Voir historique"
     - **B. Paramètres de marge** (édition : `cost_price`, `margin_percentage`, `eco_tax_default`)
     - **C. Prix minimum de vente** (calculé live, encadré rouge si un canal < min)
     - **D. Prix par canal** (site-internet, LinkMe) — édition inline `custom_price_ht`, validation vs min

2. **Composant historique** `PurchasePriceHistoryTimeline.tsx`
   - Lit `product_purchase_history` + join `purchase_orders.reference` + `organisations.name`
   - Affiché en modal/drawer depuis bouton "Voir historique"

3. **Hook** `use-channel-pricing.ts` dans `packages/@verone/common/src/hooks/`
   - `useChannelPricing(productId)` → liste par canal
   - `useUpdateChannelPrice()` mutation avec validation min

4. **Refacto** `product-pricing-tab.tsx`
   - Remplace `SupplierVsPricingEditSection` par `UnifiedPricingPanel`
   - Reste < 400 lignes

5. **Validation serveur** (API route ou Server Action)
   - Avant UPDATE `channel_pricing.custom_price_ht`, vérifier `custom_price_ht ≥ cost_price × (1 + margin%) + eco_tax`
   - Retourne 422 avec message clair si violation

### Fichiers touchés (prévision ~8 fichiers)

**Nouveaux** :

- `packages/@verone/common/src/components/pricing/UnifiedPricingPanel.tsx`
- `packages/@verone/common/src/components/pricing/PurchasePriceHistoryTimeline.tsx`
- `packages/@verone/common/src/hooks/use-channel-pricing.ts`
- `apps/back-office/src/app/api/channel-pricing/[id]/route.ts` (validation PATCH)

**Modifiés** :

- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/product-pricing-tab.tsx`
- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/types.ts` (si besoin)
- `packages/@verone/common/src/components/pricing/index.ts` (export)
- `packages/@verone/common/src/hooks/index.ts` (export)

### Hors scope (à reporter)

- Colonne DB `products.minimum_selling_price` persistée (pas utile tant que la formule suffit)
- Refonte `/canaux-vente/site-internet/produits/[id]` (on ajoute juste un raccourci depuis la fiche produit, on ne supprime pas la page existante)
- Prix par quantité / grille tarifaire B2B (`channel_price_lists`) — autre sprint
- Historique canaux UI (`channel_pricing_history`) — autre sprint

---

## 4. Flux utilisateur cible

1. Romeo ouvre `/produits/catalogue/[id]` → onglet Tarification.
2. Il voit 4 sections dans un seul écran :
   - **Prix d'achat** : min 45,20 € / avg 48,10 € / max 52,30 € / dernier achat (date + PO)
   - **Paramètres** : cost_price 48,00 € | marge 35 % | eco_tax 2,00 €
   - **Prix min de vente** : 66,80 € (calculé)
   - **Prix canaux** : site-internet 79,90 € ✅ | LinkMe 72,50 € ✅
3. Il change la marge à 30 % → min vente descend à 64,40 € → warning visuel si un canal passe sous la barre.
4. Il édite le prix site-internet à 60 € → rejet serveur avec message "prix < minimum de vente (64,40 €)".
5. Clic "Voir historique" → drawer liste des 10 derniers achats.

---

## 5. Responsive

Mobile-first :

- Section A/B/C empilées (cards), Section D en `ResponsiveDataView` (table desktop, cards mobile)
- Bouton "Historique" en `ResponsiveActionMenu` si plus d'actions
- Touch targets 44 px

---

## 6. Tests

- Unit : `calculateMinSellingPrice` déjà couvert, ajouter test validation serveur
- E2E Playwright : éditer prix site-internet depuis fiche produit + vérifier rejet si < min
- Screenshots 5 tailles (375 / 768 / 1024 / 1440 / 1920)

---

## 7. Découpage commits (PR unique à la fin)

1. `feat(pricing): add useChannelPricing hook + types`
2. `feat(pricing): add UnifiedPricingPanel component`
3. `feat(pricing): add PurchasePriceHistoryTimeline`
4. `feat(api): validate channel_pricing update against min selling price`
5. `feat(products): wire UnifiedPricingPanel into product detail tab`
6. `test(pricing): add unit + e2e coverage`

---

## 8. Risques / Points ouverts

- **Risque 1** : le trigger `trg_track_channel_pricing_changes` écrit dans `channel_pricing_history` — vérifier qu'il n'est pas cassé par un UPDATE venant d'une nouvelle route. ✅ OK car même colonne `custom_price_ht`.
- **Risque 2** : la page `/canaux-vente/site-internet/produits/[id]` continue d'exister — pas de double source d'édition ? Oui : les deux UI mutent la même table, cache React Query à invalider partout (`['channel-pricing', productId]`).
- **Question Romeo** : garde-fou strict (bloquant) ou warning (soft) ? Ma reco : bloquant avec override admin (checkbox "Forcer prix inférieur au minimum").

---

## 9. Estimation

- Composants : 1 session (~4h)
- API + validation : 0.5 session (~2h)
- Tests + screenshots : 0.5 session (~2h)

**Total : 1 session dense** (ou 1.5 session confort).

---

## 10. Check avant implémentation

- [x] Schema DB lu (`02-produits.md`, `09-autres.md`)
- [x] Composants existants lus (SupplierVsPricingEditSection, TabPricing, product-pricing-tab)
- [x] Branche créée depuis staging fraîche
- [ ] **Validation Romeo sur le scope avant de coder**
- [ ] Question ouverte : bloquant vs soft warning sur le garde-fou
