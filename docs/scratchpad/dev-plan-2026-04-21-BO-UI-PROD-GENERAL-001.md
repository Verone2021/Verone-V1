# Sprint BO-UI-PROD-GENERAL-001 — Onglet Général Dashboard Synthèse

**Date** : 2026-04-21
**Branche** : `feat/BO-UI-PROD-GENERAL-001-dashboard-synthese`
**Base Stitch validée** : V-D+ v2 (`docs/scratchpad/stitch/stitch-general-VALIDATED-vd+v2.png`)
**Référence audit** : `docs/scratchpad/audit-general-dashboard-2026-04-21.md`
**Référence implémentation** : `docs/scratchpad/stitch/stitch-general-VALIDATED-vd+v2.html` (HTML Stitch pour valeurs précises)

---

## 1. Objectif

Refactorer l'onglet Général (aujourd'hui 336 L, 10 sections pleine largeur empilées) en **dashboard synthèse** basé sur la variante V-D+ v2 validée par Romeo.

**Source unique produit** (sprint SI-DESC-001 merged) : aucune colonne `custom_*`, tout vient de `products.*`.

## 2. Contraintes dures (rappel)

- ❌ Aucune référence "ambassadeur", "affilié", "ambassadeur créateur"
- ❌ Pas de bloc Échantillons (va dans onglet Sourcing)
- ❌ Pas de bloc Labels (pas dans PIM pros)
- ✅ 1 produit = 1 fournisseur unique
- ✅ Complétude par onglet **cliquable dans le rail**
- ✅ Prix par canal = bloc central dominant
- ✅ Toggles canaux fonctionnels (mise à jour DB live)
- ✅ Responsive 5 tailles, fichier > 400 L = refactor

## 3. Structure cible V-D+ v2 (verbatim thumbnail)

### Rail gauche 200px

- Image miniature + nom produit + SKU
- Mini circle "complétude fiche" 80%
- Liste **COMPLÉTUDE PAR ONGLET** (cliquable) — 7 rows :
  - Général 100%
  - Logistics 85% → Stock/Caractéristiques
  - Media 80% → Images
  - Channels 60% → Publication
  - Pricing 100% → Tarification
  - Inventory 60% → Stock
  - History 30% → Publication/Sourcing
- Thumbnails variantes (si `variant_group_id`) + "+" Ajouter
- 2 boutons bottom : **"Export PDF"** (primary noir) · **"Sourcing"** (tertiaire)

### Header body

- Breadcrumb : Products › Accessories › Nom produit
- Chips : Actif · Public · **80% Complet** · actions icons (cloud sync, eye visibility, close)

### Zone 1 — 4 KPI strip

- Coût unitaire (HT) — tabular-nums neutre
- Prix de vente conseillé — big neutre
- Stock disponible — big vert si > min_stock
- **Prix Site Live** — big bleu + chip marge "+45%" ← le plus important

### Zone 2 — Bloc dominant "Prix par canal" (400px tall environ)

- Header "Prix par canal" + toggle "Auto-sync" à droite
- Table dense colonnes : Canal · Prix HT · Écart min · Marge % · Statut · Actions (pencil)
- 4 rows :
  - Site Internet : éditable, prix live
  - LinkMe : éditable, prix live
  - Google Merchant : greyed "= site-internet" + icon lock
  - Meta Commerce : greyed "= site-internet" + icon lock
- Lien bottom "Modifier tous les prix canal" (ouvre onglet Tarification ?)

### Zone 3 — Grid 3 cols

**Col 1 "À publier"** : 3-4 items checklist + barre progression + lien "Tout résoudre"
**Col 2 "Fournisseur + Dernière PO"** : logo + nom + SIRET + Ref PO + Montant + chip status + "View Supplier Sheet"
**Col 3 "Historique + Stock"** : 2-3 dots timeline events + mini-stats activité stock (entries récentes)

### Footer — Notes internes pleine largeur

- Textarea inline-edit placeholder "Ajoutez une note technique pour l'équipe logistique ou pricing"
- Bouton "Commit SKU Changes" noir à droite

## 4. Découpage composants

```
apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/
├── product-general-tab.tsx                   — wrapper (80 L)
├── product-general-dashboard.tsx             — layout + data fetching (200 L)
└── _dashboard-blocks/
    ├── GeneralRail.tsx                       — rail gauche 200px (120 L)
    ├── TabCompletionList.tsx                 — liste 7 onglets cliquables (80 L)
    ├── VariantsRailMiniGrid.tsx              — thumbnails variants rail (60 L)
    ├── KpiStrip.tsx                          — 4 tuiles KPI header (100 L)
    ├── ChannelPricingTable.tsx               — bloc central prix par canal (200 L)
    ├── PublishChecklist.tsx                  — col 1 checklist (80 L)
    ├── SupplierPoCompactCard.tsx             — col 2 fournisseur + PO (80 L)
    ├── ActivityHistoryCompact.tsx            — col 3 timeline + stock (100 L)
    └── InternalNotesFooter.tsx               — footer textarea inline (60 L)
```

Hook à créer (si besoin, sinon réutiliser existant) :

```
packages/@verone/products/src/hooks/
└── use-product-general-dashboard.ts          — agrège données 6-8 requêtes
```

## 5. Données DB (rappel audit)

Tout est dans `products.*` + tables annexes déjà existantes :

- `products.cost_price / .cost_net_avg / .margin_percentage / .target_margin_percentage`
- `products.completion_percentage / .completion_status`
- `products.variant_group_id` + `product_group_members`
- `products.supplier_id → organisations`
- `products.is_published_online / .publication_date`
- `channel_pricing.custom_price_ht / .is_active` par canal (site_internet, linkme, google_merchant, meta_commerce)
- `product_purchase_history` (dernière PO)
- `stock_movements` (activité stock)
- `sourcing_price_history` (historique prix)
- `products.internal_notes`

**Aucune migration DB obligatoire.**

## 6. Composants existants réutilisables

| Composant                                     | Path                                | Usage                                         |
| --------------------------------------------- | ----------------------------------- | --------------------------------------------- |
| `UnifiedPricingPanel`                         | `@verone/common/components/pricing` | Mode read-only pour prix synthèse             |
| `ChannelPricingEditor`                        | `@verone/common/components/pricing` | Base pour bloc prix par canal (adapter dense) |
| `useChannelPricing` + `useUpdateChannelPrice` | `@verone/common/hooks`              | Déjà implémentés (SI-PRICING-001)             |
| `SupplierEditSection`                         | `@verone/products`                  | Extraire mini-display                         |
| `ProductVariantsGrid`                         | `@verone/products`                  | Variante Compact à créer                      |
| `PurchasePriceHistoryTimeline`                | `@verone/common/components/pricing` | Réutilisable pour historique                  |

## 7. Actions fonctionnelles (pas juste du visuel)

1. **Toggle canaux** (rail) : mise à jour `products.is_published_online` (site) ou `channel_pricing.is_active` (LinkMe) via `/api/channel-pricing/upsert`
2. **Complétude onglets cliquable** : navigation hash (`#pricing`, `#images`, etc.) + scroll vers onglet
3. **Bouton Export PDF** : route `/api/products/[id]/pdf` (à créer — scope sprint suivant ?)
4. **Bouton Sourcing** : lien `/produits/sourcing/produits/[id]`
5. **Prix par canal inline edit** : réutilise `useUpdateChannelPrice` du sprint SI-PRICING-001
6. **Auto-sync toggle** : toggle `channel_pricing.sync_enabled` (champ à vérifier/créer)
7. **Notes internes inline** : update `products.internal_notes`

## 8. Phases d'implémentation

### Phase 1 — Foundation (today)

1. Créer structure fichiers vides (10 composants + hook)
2. Écrire `product-general-dashboard.tsx` wrapper + layout grid
3. Implémenter rail gauche (`GeneralRail` + `TabCompletionList` + `VariantsRailMiniGrid`)
4. Implémenter KpiStrip (4 tuiles + prix site live)

### Phase 2 — Bloc central

5. Implémenter `ChannelPricingTable` avec réutilisation `ChannelPricingEditor`
6. Auto-sync toggle (valider champ DB, sinon report sprint suivant)

### Phase 3 — Grid 3 cols

7. Implémenter `PublishChecklist` (logique extraite de `product-publication-tab.tsx:59-98`)
8. Implémenter `SupplierPoCompactCard`
9. Implémenter `ActivityHistoryCompact`

### Phase 4 — Footer + intégration

10. `InternalNotesFooter`
11. Remplacer `product-general-tab.tsx` par `product-general-dashboard.tsx`
12. Type-check + lint + tests e2e

### Phase 5 — Polish

13. Responsive 5 tailles (mobile 1 col, tablet 2 cols, desktop 3 cols)
14. Accessibility (focus, keyboard nav)
15. Screenshots Playwright

## 9. Fichiers à retirer / nettoyer

Dans `product-general-tab.tsx` actuel :

- ❌ Section "Attribution client (produit sur mesure)" ligne 67-167 (→ fiche produit au besoin, pas synthèse)
- ❌ Bloc "Ambassadeur créateur" ligne 69-94 (bug métier)
- ❌ Badge "Produit affilié" ligne 108-138 (garder 1 seul en header)
- ❌ Section "Métadonnées & Audit" ligne 305-333 (→ tooltip header)
- ❌ Section "Gestion des produits" (Sample) ligne 255-283 (→ onglet Sourcing)
- ❌ Section "Identifiants" ligne 285-302 (→ tooltip ou onglet dédié)

## 10. Tests requis avant merge

- [x] Type-check `@verone/back-office` + `@verone/common` OK
- [ ] Lint 0 warning
- [ ] E2E Playwright : navigation onglets via rail complétude
- [ ] E2E : toggle canal site-internet fonctionne
- [ ] E2E : prix par canal inline-edit fonctionne
- [ ] Screenshots 5 tailles (375 / 768 / 1024 / 1440 / 1920)
- [ ] 0 erreur console
- [ ] Reviewer-agent PASS

## 11. Estimation

Phase 1-2 : ~1 journée dev
Phase 3-4 : ~1 journée dev
Phase 5 : ~0,5 journée QA
**Total : 2,5 jours** pour un refactor complet

## 12. Branche + PR

- Branche : `feat/BO-UI-PROD-GENERAL-001-dashboard-synthese`
- Commits atomiques : 1 par phase (5-6 commits)
- PR : DRAFT puis ready quand tests + screenshots OK
- Base : `staging`
