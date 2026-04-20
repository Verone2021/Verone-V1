# [BO-UI-CONS-001] Redesign page detail consultation (Stitch V-C High-Density)

Date: 2026-04-20
Branche: `feat/BO-UI-CONS-001-redesign-consultation-detail`
Reference design: `.playwright-mcp/stitch/v3-var-C-d98017.png` + HTML `.playwright-mcp/stitch/v3-var-C-source.html`

## Contexte

Romeo a audite la page `/consultations/[id]` en live (20/04/2026) et trouve le design "ni fait ni a faire" :

- Colonne droite (Photos + Infos) casse : texte tronque, boutons qui se chevauchent
- Tableau produits : 6 boutons actions qui debordent, colonnes compressees
- Toolbar : 8 boutons alignes cassent sur tablette
- Typography trop grosse en general

Il a valide via Stitch la variante V-C "High-Density" (`d980170a2c7a4f6e832ed24438d959fd`) qui place :

- KPIs en STICKY HEADER (haut) au lieu de sous le tableau
- Table dense : row h-10 (40px), th 10px uppercase, td 12px
- Colonnes enrichies : Produit | Qte | Achat | Transport | TVA | Vente | Stock | Delai | Marge | Statut | ⋯
- Right rail stacke proprement (Photos, Client Info, Description, Devis/Commandes accordeon)

## Fichiers a modifier

| Fichier                                                                                        | Lignes | Role                                                                                    |
| ---------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| `apps/back-office/src/app/(protected)/consultations/[consultationId]/page.tsx`                 | 278    | Orchestrateur layout 8/12 + 4/12                                                        |
| `apps/back-office/src/app/(protected)/consultations/[consultationId]/ConsultationInfoCard.tsx` | 162    | **BUG CRITIQUE** : grid 1/3 imbriquee dans col 4/12 = overflow texte                    |
| `apps/back-office/src/app/(protected)/consultations/[consultationId]/ConsultationToolbar.tsx`  | 242    | 8 boutons -> grouper en "principaux + ⋯"                                                |
| `packages/@verone/consultations/src/components/interfaces/ConsultationOrderInterface.tsx`      | 767    | Tableau marges + KPIs. DEPASSE 400 LIGNES (refactoring obligatoire selon responsive.md) |

## Plan d'execution (5 phases)

### Phase 1 — Fix colonne droite (CRITIQUE)

**Probleme** : `ConsultationInfoCard.tsx:41` utilise `grid-cols-1 lg:grid-cols-3` qui s'imbrique dans la colonne 4/12 de la page parent. Resultat : Photos prend 1/3 = ~100px et Infos prend 2/3 = ~200px = overflow texte.

**Solution** :

1. Supprimer la grille interne `lg:grid-cols-3`
2. Transformer `ConsultationInfoCard` en 3 cards STACK verticalement (gap-3) :
   - Card "Photos de reference" (full width dans la colonne parent)
   - Card "Client Information" (grid-cols-2 interne pour key-value)
   - Card "Description" avec max-h-24 + scroll (no-scrollbar)
3. Retirer tous les `truncate` inutiles sur texte court
4. Typography : labels `text-[9px] uppercase tracking-wider text-zinc-400`, valeurs `text-xs font-semibold`
5. Card padding uniforme `p-4` (pas `pt-4 p-1`)

### Phase 2 — Toolbar compact

**Probleme** : 8 boutons en ligne = overflow tablette/mobile.

**Solution** : refactor `ConsultationToolbar.tsx` :

- LEFT group (icon + label, text-sm): [Modifier] [Email] [PDF] [Marges]
- RIGHT group (CTA): [Creer devis] (outlined) + [Commander] (primary filled)
- Overflow: [⋯] dropdown avec Changer statut, Archiver, Supprimer, Valider

### Phase 3 — KPIs sticky header

**Probleme** : KPIs actuellement EN BAS du tableau = peu visibles.

**Solution** :

- Deplacer les 5 KPIs au-dessus du tableau produits
- Design flex row `divide-x divide-zinc-100` (inspiration Stitch V-C lignes 139-160) :
  - CA Total (blue), Achat (rose), Transport (orange), Benefice (emerald), Marge (purple)
  - Labels `text-[9px] font-bold uppercase tracking-tighter`
  - Valeurs `text-base font-bold leading-none`
- Card englobante `bg-white border border-zinc-100 rounded-lg shadow-sm`
- Position : sticky top-24 dans la colonne gauche (apres toolbar) OU au-dessus du tableau simplement

### Phase 4 — Table produits dense

**Probleme** : `ConsultationOrderInterface.tsx` est monolithique (767 lignes), actions debordent, colonnes compressees.

**Solution** (refactor structurel) :

1. Extraire le tableau en sous-composant `ConsultationProductsTable.tsx` (< 400 lignes)
2. Extraire les KPIs en sous-composant `ConsultationMarginKpis.tsx`
3. Tableau dense :
   - Row h-10, td `text-[12px] py-0`, th `text-[10px] uppercase tracking-wider py-2 bg-zinc-50/50`
   - Thumb produit 24x24 (pas 48)
   - Colonne "Statut" = segmented 2-state compact `flex bg-zinc-100 p-0.5 rounded` avec boutons `px-1.5 py-0.5 rounded text-[9px]`
   - Colonne "Actions" = dropdown `⋯` avec Edit / Delete (pas 6 boutons visibles)
4. Ajouter les colonnes manquantes :
   - **TVA** (lecture depuis `tax_rate` sur `consultation_products`, default 20%)
   - **Stock** (via join sur `products.stock_real`)
   - **Delai** (via `suppliers.delivery_delay_days` ou fallback "—")
5. Row acceptes : `bg-emerald-50/20` ou border-left `border-l-2 border-l-emerald-500`
6. Row refuses : `opacity-60 line-through`
7. Mode edition inline garde sa logique actuelle mais styles plus compacts

### Phase 5 — Tests Playwright 5 tailles + qualite

**Tests obligatoires avant PR** :

- Screenshots 375 / 768 / 1024 / 1440 / 1920 sur la consultation test `c05a3a64-7d89-43a4-9b0f-d1495f4b0802` (Pokawa)
- Zero regression fonctionnelle : ajout produit, edition prix/transport, PDF Resume, PDF Rapport marges
- Zero console error
- Type-check : `pnpm --filter @verone/back-office type-check`
- Lint : `pnpm --filter @verone/back-office lint`

## Regles metier a PRESERVER (non negociable)

- Logique `useConsultationItems` (fetch + CRUD) inchangee
- Route `/api/consultations/*` inchangee
- PDF templates `@verone/consultations/pdf-templates` inchanges
- Dialog Commander (SO/PO) + QuickPurchaseOrderModal flow inchanges
- Statut par ligne (accepted/rejected/pending) logique inchangee
- Edition inline fields : quantity, price, shipping_cost, cost_price_override, is_sample, notes (tous preserver)

## Sortie attendue

- 3 commits :
  1. `[BO-UI-CONS-001] refactor: extract ConsultationProductsTable + ConsultationMarginKpis from ConsultationOrderInterface`
  2. `[BO-UI-CONS-001] feat: redesign ConsultationInfoCard stacked layout (fix overflow)`
  3. `[BO-UI-CONS-001] feat: compact V-C design (KPI sticky header + dense table + toolbar dropdown)`
- Rapport dev dans `docs/scratchpad/dev-report-2026-04-20-BO-UI-CONS-001.md`
- Screenshots 5 tailles dans `.playwright-mcp/screenshots/BO-UI-CONS-001/`
- PR draft vers staging
