# Dev Plan — BO-UI-PROD-STOCK-001

**Date** : 2026-04-22
**Branche** : `feat/BO-UI-PROD-STOCK-001`
**Design cible validé** : `docs/scratchpad/stitch/stitch-stock-v3-2026-04-22.png` + HTML full fourni par Romeo
**Règle absolue** : NE RIEN INVENTER. Tous les champs sont listés ci-dessous. Charte graphique strictement alignée avec Général / Tarification / Caractéristiques déjà en prod.

---

## 1. Décisions actées

| Décision                  | Choix retenu                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Design cible              | **v3** du projet Stitch `11982402396927945459`                                                                                                            |
| Charte graphique          | **Strictement identique** aux onglets Général / Tarification / Caractéristiques (déjà mergés)                                                             |
| Icônes                    | **lucide-react uniquement** (remplacer tous les `material-symbols-outlined` du HTML Stitch)                                                               |
| Rail gauche               | Réutiliser `GeneralRail` (220px, pas de photo, composant product-agnostic)                                                                                |
| Édition inline            | Pattern `useInlineEdit` de `@verone/common/hooks`                                                                                                         |
| Composants partagés stock | Réutiliser `@verone/stock` existant (StockAlertsBanner, StockMovementsChart, ProductStockHistoryModal, QuickStockMovementModal, InventoryAdjustmentModal) |
| Tests Playwright          | Déférés au sprint `BO-UI-PROD-E2E-001`                                                                                                                    |

---

## 2. Charte graphique Vérone (à respecter strictement)

Palette tokens utilisée dans les onglets existants :

| Usage                              | Classes Tailwind                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Page background                    | `bg-neutral-50`                                                                                                                     |
| Cards                              | `bg-white rounded-lg border border-neutral-200 shadow-none`                                                                         |
| Kickers KPI                        | `text-[10px] uppercase tracking-wide font-semibold text-neutral-500`                                                                |
| Values KPI                         | `text-2xl font-semibold tabular-nums text-neutral-900` (ou `text-3xl` pour hero)                                                    |
| Hero card (KPI principal)          | `border-2 border-indigo-500 bg-indigo-50/30`, value `text-indigo-700`                                                               |
| Chips génériques                   | `rounded px-1.5 py-0.5 text-[10px] border`                                                                                          |
| Chip green (OK / Actif)            | `bg-green-50 text-green-700 border-green-200`                                                                                       |
| Chip red (alerte / sous min)       | `bg-red-50 text-red-700 border-red-200`                                                                                             |
| Chip amber (bientôt / priorité)    | `bg-amber-50 text-amber-700 border-amber-200`                                                                                       |
| Chip blue (info / hérité)          | `bg-blue-50 text-blue-700 border-blue-200`                                                                                          |
| Chip neutral (miroir / secondaire) | `bg-neutral-100 text-neutral-600 border-neutral-200`                                                                                |
| Tables                             | `text-sm`, header `text-[10px] uppercase tracking-wide text-neutral-500`, rows `divide-y divide-neutral-100`, hover `bg-neutral-50` |
| Boutons outline                    | `border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 text-xs px-3 py-1.5 rounded-md`                                   |
| Boutons primaires                  | `bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-md`                                           |
| Icons lucide                       | 14-16px, `text-neutral-500` défaut                                                                                                  |
| Font                               | Inter, `tabular-nums` sur tous les nombres                                                                                          |
| Touch targets mobile               | `h-11 w-11 md:h-8 md:w-8` sur boutons icônes                                                                                        |

**Couleurs SPÉCIFIQUES Stock** (cohérent avec StockDisplay existant) :

- Movement IN : `text-green-600`
- Movement OUT : `text-red-600`
- Movement ADJUST : `text-neutral-600`
- Movement TRANSFER : `text-blue-600`
- Alert banner : `bg-red-50 border-red-200 text-red-700`
- Réapprovisionnement (priority 1) : `bg-amber-50/30 border-amber-200`

## 3. Schéma DB (source de vérité)

### `products`

- `stock_real` int — stock physique actuel
- `stock_forecasted_in` int — entrées prévues (PO validées non reçues)
- `stock_forecasted_out` int — sorties prévues (SO validées non expédiées)
- `min_stock` int — seuil alerte critique
- `reorder_point` int — seuil déclenchement suggestion PO
- `stock_status` enum (USER-DEFINED)
- `weight` numeric — poids unitaire (utile pour colis)
- `cost_net_avg` numeric — prix revient moyen (pour valorisation)

### Enums DB

- `movement_type` : `IN`, `OUT`, `ADJUST`, `TRANSFER` (4 valeurs)
- `reason_code` : 24 valeurs groupées par catégorie (ventes, pertes/dégradations, usage commercial, R&D, retours SAV, corrections, réceptions PO). Labels FR dans `@verone/stock/hooks/stock-reason-utils.ts::getReasonDescription()`.

### Tables

- `stock_movements` (24 colonnes) : id, product_id, warehouse_id, movement_type, quantity_change, quantity_before, quantity_after, unit_cost, reference_type, reference_id, reason_code, notes, performed_by, performed_at, purchase_order_item_id, channel_id, carrier_name, tracking_number, delivery_note, received_by_name, shipped_by_name, affects_forecast, forecast_type
- `stock_reservations` : id, product_id, reserved_quantity, reference_type, reference_id, reserved_by, reserved_at, expires_at, released_at, released_by, notes
- `stock_alert_tracking` : id, product_id, alert_type, alert_priority, stock_real, stock_forecasted_out, stock_forecasted_in, min_stock, shortage_quantity, draft_order_id, draft_order_number, quantity_in_draft, added_to_draft_at, validated, validated_at, validated_by, notes

### Usage réel (stats DB)

- IN `purchase_reception` (194) — majoritaire
- OUT `sale` (84)
- ADJUST `inventory_correction` (53)
- IN `return_customer`, `found_inventory`
- ADJUST `manual_adjustment`, `found_inventory`

## 4. Composants `@verone/stock` existants à réutiliser

| Composant                                           | Usage dans le nouveau dashboard                          |
| --------------------------------------------------- | -------------------------------------------------------- |
| `StockAlertsBanner` (cards/)                        | Banner alerte rouge en haut si `stock_real <= min_stock` |
| `StockMovementsChart` (charts/)                     | Sparkline 60px au-dessus du tableau Mouvements           |
| `StockStatusBadge` / `StockStatusCompact` (badges/) | Chip statut stock                                        |
| `ProductStockHistoryModal` (via `@verone/products`) | Modal "Voir tout l'historique"                           |
| `QuickStockMovementModal` (modals/)                 | Modal "Créer mouvement manuel"                           |
| `InventoryAdjustmentModal` (modals/)                | Correction inventaire                                    |
| `CancelMovementModal` (modals/)                     | Annulation mouvement                                     |

### Hooks existants à utiliser

- `useStockDashboard` — agrégé stats stock
- `useMovementsHistory` — historique mouvements (déjà split en 3 fichiers : export, fetcher, types)
- `useStockAlerts` — alertes actives
- `useStockAlertsCount` — compteur
- `getReasonDescription(reason_code)` helper labels FR

## 5. Structure de l'implémentation

### 5.1 Nouveaux fichiers

**Dashboard orchestrateur** :

- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/product-stock-dashboard.tsx`

**Blocs** (sous `_stock-blocks/`) :

- `StockKpiStrip.tsx` — 4 tuiles (Stock disponible hero indigo / Stock réel / Seuils d'alerte min/reorder / Valorisation)
- `StockAlertBanner.tsx` — wrapper de `StockAlertsBanner` avec texte custom selon alerte
- `StockMovementsCard.tsx` — header + chip stats + sparkline (réutilise `StockMovementsChart`) + table compact + footer note reason_codes
- `StockReservationsCard.tsx` — liste réservations actives avec bouton Libérer (hover)
- `StockReorderCard.tsx` — bloc Réapprovisionnement amber avec déficit/suggestion + bouton **"Commander au fournisseur"** (si pas de draft) OU lien "Voir PO-DRAFT-XXX" (si draft existe)
- `StockSettingsCard.tsx` — paramètres inline (min_stock, reorder_point, stock_status readonly, weight)

**Wrapper** :

- Modifier `product-stock-tab.tsx` → wrapper minimal vers `ProductStockDashboard`

### 5.2 Hooks à créer (si nécessaire)

Analyser si les hooks existants `useStockDashboard`, `useMovementsHistory`, `useStockAlerts`, `useStockReservations` couvrent tout. Si pas de hook `useStockReservations` → le créer (SELECT depuis `stock_reservations` WHERE `product_id = $1 AND released_at IS NULL`).

### 5.3 Bouton "Commander au fournisseur" (feature clé ajoutée par Romeo)

Dans `StockReorderCard` :

```
Si stock_alert_tracking.draft_order_id existe :
  → Lien "Voir PO-DRAFT-XXX · N u" avec chip amber "en cours"
Sinon :
  → Bouton primaire indigo "Commander au fournisseur · N u"
  → Au click : ouvre modal QuickPurchaseOrderModal pré-rempli (produit, fournisseur, qté suggérée)
  → Après création, stock_alert_tracking.draft_order_id est rempli automatiquement
```

Vérifier si `QuickPurchaseOrderModal` existe. Sinon, créer un lien vers `/produits/sourcing/nouveau?product_id=X&qty=Y` ou équivalent.

### 5.4 Ajustement `page.tsx`

Le render `<ProductStockTab>` doit recevoir les mêmes props que `<ProductCharacteristicsTab>` (après cleanup précédent) :

- `product`
- `completionPercentage`
- `onProductUpdate`
- `onTabChange`

Si la signature actuelle ne correspond pas, aligner.

## 6. Comportement des 5 blocs

### Bloc 0 — Alert banner (conditionnel)

- Visible si `stock_real <= min_stock`
- Couleur rouge (`bg-red-50`)
- Texte : "Stock sous seuil minimum — il reste X unités, seuil = Y. Il faudrait commander N unités supplémentaires."
- Link droit : "Voir PO brouillon PO-DRAFT-XXX →" (si draft existe) OU "Commander au fournisseur →" (sinon)

### Bloc 1 — KPI strip (4 tuiles, col-span-12)

1. **Stock disponible** (hero indigo) :
   - Value : `stock_real - stock_forecasted_out - reservations_actives`
   - Sub : "= stock réel 41 − réservé 5 − sorties prévues 2"
   - Chip : "OK" green OR "SOUS MIN" red
2. **Stock réel physique** : `stock_real`, sub "dernier mouvement · +20 le 15 mars" depuis `stock_movements[0]`
3. **Seuils d'alerte** : `min_stock / reorder_point` format "5 / 15", pencil edit pour inline
4. **Valorisation stock** : `stock_real × cost_net_avg`, sub "41 u × 10,60 € (prix revient moyen)"

### Bloc 2 — Mouvements de stock (col-span-8)

- Header : title + chip stats "194 entrées · 84 sorties · 57 ajustements · 1 transfert" + bouton "Voir tout l'historique →"
- Sparkline 60px (`StockMovementsChart` existant)
- Table 8 colonnes : Date / Type / Qté / Stock après / Motif (reason_code via getReasonDescription) / Référence (PO-xxx, SO-xxx, TR-xxx, manuel) / Utilisateur / Coût unit
- Footer italique : "Les 24 motifs (reason_code) sont organisés par catégorie…"
- Icônes lucide : `ArrowDownToLine` (IN green), `ArrowUpFromLine` (OUT red), `Sliders` (ADJUST neutral), `ArrowLeftRight` (TRANSFER blue)

### Bloc 3 — Réservations actives (col-span-4)

- Header : title + chip "3 réservations · 5 u"
- Liste 3 rows : icon Lock + ref SO + nom client + qté + expire + bouton Libérer (hover)
- Footer italique : "Une réservation se libère automatiquement…"

### Bloc 4 — Réapprovisionnement (col-span-6, amber si alerte active)

- 2 cols : Déficit (rouge) + Suggestion (amber)
- CTA **"Commander au fournisseur · 10 u"** (indigo primary) ou lien "Voir PO-DRAFT-003 · 10 u"
- Footer amber : "Le stock prévisionnel sera mis à jour automatiquement…"

### Bloc 5 — Paramètres stock (col-span-6)

- Grid 2 cols, 4 fields inline-editable :
  1. Seuil alerte (min_stock) — number input
  2. Point réappro (reorder_point) — number input
  3. Statut stock (readonly) — chip green "IN_STOCK"
  4. Poids unitaire (weight) — number input kg
- Footer links : "Voir inventaire global" / "Historique complet" / "Règles d'alerte" / "Créer mouvement manuel"

## 7. Règles techniques (non négociables)

- Zéro `any`, zéro `as any`, zéro `eslint-disable`
- `useCallback` avant deps `useEffect`
- `void` + `.catch()` sur promises event handlers
- Imports strictement : `@verone/ui`, `@verone/utils`, `@verone/common/hooks`, `@verone/stock` (composants + hooks), `@verone/products/components/images` (GeneralRail via import local), `lucide-react`
- Fichier < 400 lignes
- Touch targets `h-11 w-11 md:h-8 md:w-8` sur mobile
- Colonnes masquables `hidden lg/xl:table-cell` sur le tableau mouvements

## 8. Ordre d'exécution

1. Créer les 6 composants `_stock-blocks/*` (KPI, AlertBanner, Movements, Reservations, Reorder, Settings)
2. Créer `product-stock-dashboard.tsx` orchestrateur
3. Transformer `product-stock-tab.tsx` en wrapper minimal
4. Ajuster `page.tsx` si signature change
5. Ajuster `use-product-detail.tsx` si des props changent
6. Type-check 4 packages
7. Lint 0 warning
8. Commits séquentiels (ou 1 commit bundle)

## 9. Points de vigilance

- **`StockAlertsBanner` existant** : composant déjà utilisé dans `product-stock-tab.tsx` actuel, réutiliser tel quel
- **`GeneralRail` réutilisé** : composant déjà utilisé dans ProductGeneralDashboard + ProductPricingDashboard + ProductCharacteristicsDashboard
- **Pas de nouveau champ DB** : pas de `safety_stock`, pas de `velocity_classification`, pas de `warehouse_id` sur products
- **`QuickPurchaseOrderModal`** : à vérifier s'il existe dans `@verone/orders` ou `@verone/products`. Si oui, l'utiliser pour le CTA "Commander au fournisseur". Sinon, créer lien vers page de création PO avec query params `?product_id=X&qty=Y`
- **Tests Playwright déférés** au sprint `BO-UI-PROD-E2E-001` selon handoff section 7

## 10. Livrables dev-agent attendus

- Branche `feat/BO-UI-PROD-STOCK-001` avec commits séquentiels
- `pnpm --filter @verone/back-office type-check` PASS
- `pnpm --filter @verone/products type-check` PASS
- `pnpm --filter @verone/common type-check` PASS
- `pnpm --filter @verone/stock type-check` PASS
- `pnpm --filter @verone/back-office lint` PASS (0 warning)
- Rapport `docs/scratchpad/dev-report-2026-04-22-BO-UI-PROD-STOCK-001.md`
- NE PAS push, NE PAS créer de PR
