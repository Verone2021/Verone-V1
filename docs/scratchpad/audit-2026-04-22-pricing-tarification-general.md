# Audit — Tarification & Prix par canal (Onglet Général + Onglet Tarification)

**Date** : 2026-04-22
**Demandeur** : Romeo
**Périmètre** : Page `/produits/catalogue/[productId]` — onglet Général (bloc Prix par canal + KPI coût/prix) et onglet Tarification (refonte à venir).

---

## 1. Résumé exécutif

Le label **"Prix vente conseillé"** affiché dans le KPI Général est **faux sémantiquement** et **faux mathématiquement** en production. Il est calculé à partir du `cost_price` (prix d'achat brut, 5,15 €) au lieu du `cost_net_avg` (prix de revient pondéré, 10,60 €), ce qui produit un prix conseillé de 8,65 € TTC — **sous le prix d'achat fournisseur**. Le bloc "Prix par canal" du Général hérite de ce bug (écarts min et marges % faux). La page Tarification (`product-pricing-tab.tsx`) est un simple wrapper du `UnifiedPricingPanel` partagé et n'implémente aucune des vues attendues (historique consolidé, commission dynamique, marge nette par canal).

Le benchmark (Shopify, Odoo, NetSuite, SAP, Plytix) confirme que la formule "Prix min vente = prix de revient × (1 + marge min) + éco-taxe" est le **standard pro**. Seule la nomenclature "Prix min vente" (pas "Prix vente conseillé") reflète la réalité.

Une PR `fix/BO-UI-PROD-GENERAL-002-prix-revient` (maintenant renommée `feat/BO-UI-PROD-PRICING-001`) corrige déjà le calcul (commit `e60ae7bf5`, PR #708 ouverte en draft, CI verte). Elle ne corrige PAS encore le label ni le bloc "Prix par canal", ni la notion de marge nette.

---

## 2. État production actuel (staging, live)

Capture référence : `.playwright-mcp/screenshots/20260421/product-general-live-ref-225500.png` (Coussin Rêveur COU-0001, bureau 1440 px).

### 2.1 KPI strip onglet Général

| Label affiché                      | Valeur prod | Source formule                                                        | Valeur attendue                           |
| ---------------------------------- | ----------- | --------------------------------------------------------------------- | ----------------------------------------- |
| COÛT UNITAIRE HT                   | 5,15 €      | `products.cost_price` ✅                                              | 5,15 €                                    |
| PRIX VENTE CONSEILLÉ ❌ label faux | 8,65 € ❌   | `cost_price × (1+margin/100) × 1.2 TTC`                               | 17,81 € TTC (base `cost_net_avg` 10,60 €) |
| STOCK DISPONIBLE                   | 41          | `products.stock_real` ✅                                              | 41                                        |
| PRIX SITE LIVE                     | 12,88 €     | `channel_pricing.custom_price_ht` (code `site_internet`) ✅           | 12,88 €                                   |
| marge chip                         | +79 %       | `(sitePrice − minSelling) / minSelling × 100` où minSelling=7,21 € ❌ | −13 % (sous min)                          |

**Problèmes détectés** :

1. Label "Prix vente conseillé" trompe l'utilisateur (ce n'est pas une suggestion mais un plancher).
2. Base calcul = prix d'achat au lieu de prix de revient → sous-estimation du plancher.
3. Chip marge +79 % donne une impression positive alors qu'en réalité le prix canal 12,88 € est **sous le prix min vente 14,84 €** → la marge est négative.

### 2.2 Bloc "Prix par canal" onglet Général

Capture live :

| Canal                | Prix HT           | Écart min       | Marge %       | Statut    |
| -------------------- | ----------------- | --------------- | ------------- | --------- |
| Google Merchant      | `= site-internet` | —               | —             | miroir ✅ |
| LinkMe               | 25,99 €           | **+18,78 €** ❌ | **+260 %** ❌ | Actif     |
| Meta Commerce        | `= site-internet` | —               | —             | miroir ✅ |
| Site Internet Vérone | 12,88 €           | **+5,67 €** ❌  | **+79 %** ❌  | Actif     |

Chip "Min vente : 7,21 €" en haut à droite = **faux** (devrait être 14,84 €).

**Recalcul correct (base 14,84 € HT min vente)** :

- LinkMe : écart = 25,99 − 14,84 = **+11,15 €**, marge brute = 75 %, commission LinkMe (−15 %) → prix net = 22,09 €, marge nette = (22,09 − 10,60) / 22,09 = **+52 %**
- Site Internet : écart = 12,88 − 14,84 = **−1,96 €** (alerte rouge "sous min"), marge brute = −13 %

**Manques structurels** :

1. Colonne **Marge nette %** inexistante (actuellement seul le brut)
2. Commission canal non affichée ni utilisée (malgré `channel_pricing.channel_commission_rate` en DB)
3. Pas de chip alerte "sous min vente" visible quand le canal passe sous le plancher (juste un fond rouge discret)

### 2.3 Onglet Tarification actuel

Capture : `.playwright-mcp/screenshots/20260421/product-tarification-live-1440-181600.png`.

État : 3 gros blocs colorés verticaux (rouge/bleu/vert) via `UnifiedPricingPanel`. Pas de :

- Historique achats fournisseurs détaillé
- Tableau tous PO consolidés
- Prix par canal avec breakdown commission
- Design aligné Général (pas de rail gauche, pas de tab bar verticale contextuelle)

---

## 3. État code actuel

### 3.1 Composants existants utilisables

| Composant                                     | Localisation                                                                  | Utilisation actuelle                                                  | Réutilisable pour Pricing ?                                                           |
| --------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `GeneralRail`                                 | `_dashboard-blocks/GeneralRail.tsx`                                           | Rail gauche Général (thumbnail, completion, tabs, variantes, actions) | **Oui, tel quel** (pas de logique spécifique Général)                                 |
| `KpiStrip`                                    | `_dashboard-blocks/KpiStrip.tsx`                                              | 4 tuiles KPI Général                                                  | Spécifique Général, non réutilisable pour les 3 tuiles Tarification                   |
| `ChannelPricingTable`                         | `_dashboard-blocks/ChannelPricingTable.tsx`                                   | Prix par canal compact dans Général                                   | **À enrichir** : ajouter colonne Marge nette + breakdown commission + alerte sous min |
| `TabCompletionList`                           | `_dashboard-blocks/TabCompletionList.tsx`                                     | Liste onglets + % dans rail                                           | Réutilisable tel quel                                                                 |
| `UnifiedPricingPanel`                         | `packages/@verone/common/src/components/pricing/`                             | Onglet Tarification actuel                                            | **À retirer** — remplacé par nouveau dashboard                                        |
| `SupplierVsPricingEditSection`                | Même package                                                                  | Formulaire édition pricing                                            | À conserver pour l'édition inline                                                     |
| `calculateMinSellingPrice(cost, eco, margin)` | `packages/@verone/common/src/components/pricing/use-supplier-pricing-calc.ts` | Helper pur                                                            | **Gardé tel quel** — on change juste la valeur passée en 1er arg                      |

### 3.2 Hooks existants

| Hook                                                        | Localisation             | Données retournées                                         | Utile pour Pricing ?                                               |
| ----------------------------------------------------------- | ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `useChannelPricing(productId)`                              | `@verone/common/hooks`   | Liste canaux + prix custom + prix public + commission      | **Oui, central**                                                   |
| `useUpdateChannelPrice()`                                   | `@verone/common/hooks`   | Mutation update prix canal                                 | **Oui** (édition inline)                                           |
| `useProductProfitability(productId, costNetAvg, stockReal)` | `@verone/products/hooks` | Historique achats + ventes + KPI marges                    | Partiel — donne les PO mais pas structuré pour la vue Tarification |
| `useProductGeneralDashboard(productId)`                     | `@verone/products/hooks` | Last PO, stock moves, events, site live price              | Dédié Général                                                      |
| `useProductPricingDashboard(productId)`                     | **créé ce jour (draft)** | Purchases complètes, costStats agrégé, channel commissions | À valider ou retirer selon décision Romeo                          |

### 3.3 Données DB disponibles

Toutes les colonnes nécessaires existent — **aucune migration requise**.

#### `products`

- `cost_price` (prix achat brut)
- `cost_net_avg` (prix revient moyenne pondérée) ← base calcul min vente
- `cost_net_last` (dernier prix revient)
- `cost_net_min`, `cost_net_max` (stats)
- `margin_percentage` (marge cible)
- `eco_tax_default`

#### `purchase_order_items`

- `unit_price_ht`, `unit_cost_net` (prix + prix revient par PO)
- `quantity`, `total_ht`
- Jointure `purchase_orders.order_date` + `organisations.legal_name` fournisseur

#### `channel_pricing`

- `custom_price_ht` (prix canal)
- `public_price_ht` (prix public hérité site)
- `channel_commission_rate` (commission dynamique par canal) ← **utilisé zéro part dans le code actuel**
- `min_margin_rate`, `max_margin_rate`, `suggested_margin_rate` ← **utilisés zéro part dans le code actuel**

#### `linkme_commissions` (historique réel)

- `linkme_rate_applied`, `margin_rate_applied`
- `affiliate_commission`, `linkme_commission`, `total_payout_ht`

---

## 4. Incohérences — Tableau récapitulatif

| #   | Problème                                          | Localisation                     | Impact                                                                  | Fix                                            |
| --- | ------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Label "PRIX VENTE CONSEILLÉ" trompeur             | `KpiStrip.tsx`                   | Confusion utilisateur                                                   | Renommer "PRIX MIN VENTE"                      |
| 2   | Calcul basé sur `cost_price` pas `cost_net_avg`   | `product-general-dashboard.tsx`  | Plancher sous prix d'achat                                              | ✅ Fixé dans PR #708                           |
| 3   | Valeur TTC × 1,2 forcée (TVA FR 20 %)             | `product-general-dashboard.tsx`  | TVA mobilier = 20 %, OK pour Verone, mais `tva_rate` existe par produit | Utiliser `products.tva_rate` si dispo          |
| 4   | Marge chip "Prix Site Live" mal calculée          | `ProductGeneralDashboard`        | Marge positive affichée quand en réalité sous min                       | ✅ Fixé en cascade dans PR #708                |
| 5   | Colonne "Marge %" = marge brute uniquement        | `ChannelPricingTable.tsx`        | Ne reflète pas la marge réelle après commission                         | Ajouter colonne "Marge nette %"                |
| 6   | Commission canal ignorée                          | `ChannelPricingTable.tsx`        | LinkMe −15 %, Google −0 % → écart important non visible                 | Lire `channel_pricing.channel_commission_rate` |
| 7   | Chip "Min vente" = 7,21 €                         | `ChannelPricingTable.tsx` header | Induit en erreur                                                        | Passe à 14,84 € via PR #708 ✅                 |
| 8   | `UnifiedPricingPanel` utilise encore `cost_price` | `@verone/common/pricing/*`       | Modals d'édition génèrent prix min vente faux                           | À aligner (hors scope PR #708)                 |
| 9   | Aucun tableau historique PO dans Tarification     | `product-pricing-tab.tsx`        | Pas de consolidation demandée par Romeo                                 | Refonte complète onglet                        |
| 10  | Pas de breakdown commission par canal             | Partout                          | Besoin métier non couvert                                               | Nouveau composant                              |

---

## 5. Design Stitch v4 — Alignement besoins

Design validé visuellement : `docs/scratchpad/stitch/stitch-tarification-v4-aligne-general-2026-04-22.png`.

### 5.1 Éléments couverts par le design

- ✅ Header aligné Général (breadcrumb, titre, chips, progress bar, tab bar)
- ✅ Rail gauche sticky (thumbnail, SKU, completion, liste onglets, Export PDF)
- ✅ 3 KPIs avec tuile centrale "PRIX DE REVIENT" mise en avant (indigo)
- ✅ Formula explainer card ("Prix min vente = revient × (1+marge) + éco-taxe")
- ✅ Historique prix de revient (Moyenne / Min-Max / Dernier prix / Volume 12 mois + sparkline)
- ✅ Tous les achats fournisseurs (tableau avec colonnes Prix unit. / Prix revient / Qté)
- ✅ Prix par canal avec breakdown commission (LinkMe expansé : commission −15 %, marge nette)
- ✅ Alerte visuelle "sous min" (chip rouge sur Site Internet)
- ✅ Miroirs (Google Merchant / Meta Commerce) lockés
- ✅ Footer note "Rappel des règles de calcul"

### 5.2 Éléments manquants à ajouter (si tu valides)

- Affichage **Marge nette %** chiffrée dans le tableau canal (pas juste le breakdown sub-row)
- Éco-participation par canal (`channel_pricing.eco_participation_amount`)
- Bouton "Simuler un prix" (changer marge cible en temps réel et voir impact sur tous les canaux)
- Indicateur "marge cible suggérée par canal" via `channel_pricing.suggested_margin_rate`

### 5.3 Cohérence visuelle avec Général

Design v4 **s'aligne** sur Général :

- Même header complet
- Même rail gauche (thumbnail, completion circle, liste onglets)
- Même tab bar horizontale
- Mêmes tokens de couleur (neutral-50 bg, white cards, indigo/green/red accents)

---

## 6. Benchmark CRM/ERP — Calcul prix minimum de vente

| Plateforme        | Formule                                                                                                   | Commentaire                                |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Shopify Admin** | `cost_per_item` libre + `price` libre → affiche `profit = price − cost` + `margin = profit / price × 100` | Pas de "min" imposé, juste calcul de marge |
| **Odoo ERP**      | `standard_price` (FIFO / AVCO / Standard) × (1 + `target_margin`) = `list_price`                          | Coût pondéré temps réel                    |
| **NetSuite**      | `min_selling_price` configurable par item + per customer tier, floor enforcement sur devis                | Tier-based, enterprise                     |
| **SAP S/4HANA**   | `landed_cost` (matériau + transport + douane + assurance) × (1 + `margin_floor_%`) + allocation overheads | Full absorption, enterprise                |
| **Plytix PIM**    | Champs `cost`, `wholesale_price`, `retail_price` séparés                                                  | PIM pur, pas de floor                      |
| **Akeneo PIM**    | Attributes libres, calcul dans connecteurs                                                                | PIM tolérant                               |

**Conclusion** : la formule Verone (`cost_net × (1 + min_margin) + eco_tax`) est le **standard pro**. Shopify est plus simple mais ne distingue pas coût d'achat vs coût de revient. Odoo et SAP ajoutent éventuellement des overheads (entrepôt, packaging, marketing) — raffinement possible mais pas requis pour Verone MVP.

**Ce qu'aucune plateforme ne fait bien** : la marge nette par canal en tenant compte de la commission dynamique. Verone peut aller **plus loin** que la concurrence sur ce point car `channel_pricing.channel_commission_rate` existe en DB.

---

## 7. Plan d'action proposé (séquencé, à valider)

### Phase A — Corrections Général (quick wins, ~1-2 h)

**Scope** : renommer labels + enrichir calculs + ajouter marge nette dans le tableau Prix par canal.

1. `KpiStrip.tsx` :
   - Renommer "PRIX VENTE CONSEILLÉ" → "PRIX MIN VENTE"
   - Sub "TTC recommandé" → "HT · base prix de revient · TTC 17,81 €"
   - Basculer valeur principale : HT (14,84 €) au lieu de TTC (17,81 €), TTC en sub
2. `ChannelPricingTable.tsx` :
   - Ajouter colonne "Marge nette %" (calculée avec `channel_commission_rate`)
   - Afficher la commission en sub sous le nom du canal ("LinkMe · commission 15 %")
   - Chip rouge visible "sous min" sur les canaux < min vente
3. Cascade sur `product-general-dashboard.tsx` : calcul `siteMarginPercent` → aligner base `landedCost` (déjà partiel) + prendre en compte la commission pour la marge nette du site

**PR** : même branche que le fix en cours (`feat/BO-UI-PROD-PRICING-001`). Commit additionnel dans la PR #708 (ou renommage de PR pour cohérence).

### Phase B — Refonte Tarification (design Stitch v4, ~4-6 h)

**Scope** : implémenter le design v4 validé.

1. Hook `use-product-pricing-dashboard` (déjà drafté, à valider avant intégration)
2. Composants `_pricing-blocks/` :
   - `PricingKpiStrip` (3 tuiles avec hero indigo "Prix de revient")
   - `FormulaExplainerCard`
   - `CostHistoryCard` (Moyenne / Min-Max / Dernier / Volume + sparkline)
   - `PurchaseOrdersTable` (tous les PO avec pagination)
   - `ChannelPricingDetailed` (tableau avancé avec commission + marge nette)
   - `PricingFooterNote`
3. `product-pricing-dashboard.tsx` (orchestrateur, pattern identique à `product-general-dashboard.tsx`)
4. `product-pricing-tab.tsx` transformé en wrapper minimal
5. Réutilisation `GeneralRail` (ou factoring en `ProductSidebarRail` partagé)

**PR** : même branche `feat/BO-UI-PROD-PRICING-001`. Bundle fix Général + refonte Tarification = 1 PR cohérente.

### Phase C — Alignement `UnifiedPricingPanel` (hors scope actuel, ~1 h)

**Scope** : propager la règle "base = prix de revient" dans les modals d'édition pricing (`SupplierVsPricingEditSection`, `UnifiedPricingPanel`) pour qu'ils utilisent aussi `cost_net_avg` comme base.

**Décision à prendre** : on inclut dans la PR actuelle ou on laisse pour un sprint ultérieur ?

### Phase D — Tests Playwright (groupés fin cycle)

Selon le handoff existant, les tests Playwright sont groupés en sprint final `BO-UI-PROD-E2E-001` après toutes les refontes d'onglets. Rien à faire dans cette PR.

---

## 8. Questions en attente de décision Romeo

1. **Acceptes-tu le design Stitch v4** (`stitch-tarification-v4-aligne-general-2026-04-22.png`) comme cible ?
2. **KPI principal** en HT ou TTC ? (Reco : HT principal + TTC en sub, standard B2B)
3. **Phase C (UnifiedPricingPanel)** : dans la PR actuelle ou reporté ?
4. **TVA** : forcer 20 % ou utiliser `products.tva_rate` quand dispo ?
5. **Hook draft `use-product-pricing-dashboard`** (créé ce jour) : je le garde pour Phase B ou je le retire en attendant ton OK ?
6. **Bouton "Simuler un prix"** (changer marge en temps réel et voir impact tous canaux) : dans cette PR ou backlog ?

---

## Annexes

### Fichiers touchés par cet audit

- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/_dashboard-blocks/KpiStrip.tsx`
- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/_dashboard-blocks/ChannelPricingTable.tsx`
- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/product-general-dashboard.tsx` (fix en cours, PR #708)
- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/product-pricing-tab.tsx` (à refondre)
- `packages/@verone/products/src/hooks/use-product-pricing-dashboard.ts` (draft)
- `packages/@verone/common/src/components/pricing/UnifiedPricingPanel.tsx` (Phase C)
- `packages/@verone/common/src/components/pricing/SupplierVsPricingEditSection.tsx` (Phase C)

### Designs Stitch référence

- `docs/scratchpad/stitch/stitch-general-VALIDATED-vd+v2.png` — Général validé
- `docs/scratchpad/stitch/stitch-tarification-desktop-v1-2026-04-20.png` — Tarification v1 (20/04)
- `docs/scratchpad/stitch/stitch-tarification-v4-aligne-general-2026-04-22.png` — **Tarification v4 (ce jour, à valider)**

### Captures production live

- `.playwright-mcp/screenshots/20260421/product-general-live-ref-225500.png`
- `.playwright-mcp/screenshots/20260421/product-tarification-live-1440-181600.png`

---

**Status** : En attente de validation Romeo sur les 6 questions section 8 + acceptation design Stitch v4.
