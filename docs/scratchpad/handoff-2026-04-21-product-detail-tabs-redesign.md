# Handoff — Refonte onglets produit (suite BO-UI-PROD-GENERAL-001)

**Date** : 2026-04-21
**Auteur session précédente** : Claude Opus 4.7
**Branche actuelle** : `staging` (BO-UI-PROD-GENERAL-001 mergé en `bd4746d98`)

---

## 1. Résumé exécutif

L'onglet **Général** du détail produit (`/produits/catalogue/[productId]`) a été refactoré en dashboard synthèse (pattern Plytix/Akeneo/Shopify). Il reste **6 onglets à redesigner** pour atteindre une expérience PIM complète et cohérente.

Les designs Stitch ont **déjà été générés pour chacun**, validés par Romeo. Un agent suivant doit implémenter onglet par onglet en suivant le même workflow que Général.

---

## 2. Ce qui a été fait (sprint précédent = mergé)

### Sprint BO-UI-PROD-GENERAL-001 — dashboard synthèse onglet Général

**Commit squash** : `bd4746d98` sur staging — [PR #703](https://github.com/Verone2021/Verone-V1/pull/703)

**Livrables** :

- 10 composants dans `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/_dashboard-blocks/` :
  - `GeneralRail.tsx` — rail gauche sticky 220px (image, SKU, completion circle, tabs completion, variantes, actions)
  - `TabCompletionList.tsx` — liste cliquable des 7 onglets avec % complétude (green/orange/red)
  - `VariantsRailMiniGrid.tsx` — thumbnails variantes si `variant_group_id`
  - `KpiStrip.tsx` — 4 tuiles KPI (Coût / Prix conseillé / Stock / Prix Site Live + marge %)
  - `ChannelPricingTable.tsx` — bloc central dominant (réutilise `useChannelPricing` + `useUpdateChannelPrice`)
  - `PublishChecklist.tsx` — 4 items critiques + barre progression
  - `SupplierPoCompactCard.tsx` — fournisseur + dernière PO
  - `ActivityHistoryCompact.tsx` — timeline events + mini stock moves
  - `InternalNotesFooter.tsx` — inline-edit `products.internal_notes`
- `product-general-dashboard.tsx` — wrapper orchestrant tous les blocs, layout `flex-col lg:flex-row + gap-4`
- `product-general-tab.tsx` — wrapper minimal délégant au dashboard
- `packages/@verone/products/src/hooks/use-product-general-dashboard.ts` — hook parallélisé (5 queries `Promise.all` : last PO, stock_movements, events, site live price, supplier SIRET)

**Principe de design respecté** :

- Rail gauche sticky + main content
- Source unique = `products.*` (jamais de duplication custom\_\*)
- Zéro migration DB (toutes données existantes)
- 1 produit = 1 fournisseur (règle métier)
- Retirés du dashboard : Ambassadeur créateur (site B2C uniquement), Sample requirement (→ onglet Sourcing), Labels, section attribution client

**Hooks réutilisés depuis SI-PRICING-001** :

- `useChannelPricing` — prix par canal avec coût unifié
- `useUpdateChannelPrice` — update inline
- `calculateMinSellingPrice` — prix minimum cost + margin

---

## 3. Onglets restants à refondre

Chaque onglet a un **design Stitch validé par Romeo** dans `docs/scratchpad/stitch/`. L'implémentation doit suivre le **même workflow** que BO-UI-PROD-GENERAL-001.

| Onglet           | Design Stitch                                    | Composant actuel                  | Task ID suggéré          |
| ---------------- | ------------------------------------------------ | --------------------------------- | ------------------------ |
| Descriptions     | `stitch-descriptions-desktop-2026-04-20.png`     | `product-descriptions-tab.tsx`    | `BO-UI-PROD-DESC-001`    |
| Tarification     | `stitch-tarification-desktop-v1-2026-04-20.png`  | `product-pricing-tab.tsx`         | `BO-UI-PROD-PRICING-001` |
| Stock            | `stitch-stock-desktop-2026-04-20.png`            | `product-stock-tab.tsx`           | `BO-UI-PROD-STOCK-001`   |
| Caractéristiques | `stitch-caracteristiques-desktop-2026-04-20.png` | `product-characteristics-tab.tsx` | `BO-UI-PROD-CHAR-001`    |
| Images           | `stitch-images-desktop-2026-04-20.png`           | `product-images-tab.tsx`          | `BO-UI-PROD-IMG-001`     |
| Publication      | `stitch-publication-desktop-2026-04-20.png`      | `product-publication-tab.tsx`     | `BO-UI-PROD-PUB-001`     |

**IMPORTANT** : Romeo a dit qu'il veut ouvrir **une autre branche depuis staging** pour faire des **corrections non-liées** AVANT d'attaquer les onglets suivants. Donc l'agent suivant doit ATTENDRE son ordre explicite avant de commencer ces sprints.

---

## 4. Pattern à réutiliser pour chaque onglet

### Phase 1 — Audit & plan

1. Lire le design Stitch correspondant (`docs/scratchpad/stitch/stitch-{tab}-desktop-*.png`)
2. Auditer le composant actuel (`product-{tab}-tab.tsx` + dépendances)
3. Vérifier les données disponibles dans `products.*` et tables associées (`docs/current/database/schema/`)
4. Produire `docs/scratchpad/dev-plan-{date}-BO-UI-PROD-{TAB}-001.md`
5. Mettre à jour `.claude/work/ACTIVE.md`

### Phase 2 — Implémentation

1. Créer les sous-composants dans `_components/_{tab}-blocks/` (ou réutiliser `_dashboard-blocks/` si partagé)
2. Si agrégation de données : créer un hook dans `packages/@verone/products/src/hooks/use-product-{tab}-dashboard.ts` (pattern `useState/useEffect/useCallback` + `Promise.all`)
3. Wrapper minimal dans `product-{tab}-tab.tsx`
4. Respecter les 5 techniques responsive (voir `.claude/rules/responsive.md`)

### Phase 3 — Validation

1. Invoquer `verify-agent` : type-check + lint + build
2. Invoquer `reviewer-agent` blind audit sur `docs/scratchpad/dev-report-{date}-BO-UI-PROD-{TAB}-001.md`
3. Fixer les CRITICAL/WARNING via `dev-agent`
4. 2e passe reviewer si nécessaire

### Phase 4 — Tests Playwright (DEFERRÉ — voir section 7)

L'agent NE fait PAS les tests Playwright pour chaque onglet individuellement. Ils seront groupés en fin de cycle (voir section 7).

### Phase 5 — Merge

1. DRAFT PR vers `staging` via `ops-agent`
2. Attendre ordre explicite Romeo (FEU ROUGE merge)
3. Ready + merge squash + delete branch

---

## 5. Documentation à lire AVANT toute action

### Obligatoire

- `CLAUDE.md` racine (identité, autonomie, interdictions)
- `.claude/rules/autonomy-boundaries.md` (FEU VERT/ORANGE/ROUGE)
- `.claude/rules/workflow.md` (1 PR = 1 bloc cohérent)
- `.claude/rules/responsive.md` (5 techniques obligatoires)
- `.claude/rules/code-standards.md` (zéro `any`, useCallback AVANT useEffect deps, etc.)
- `apps/back-office/CLAUDE.md` (patterns A-F, architecture)
- `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` (réutiliser l'existant)
- `docs/current/DEPENDANCES-PACKAGES.md` (avant tout import)
- `docs/current/database/schema/` (sections DB concernées)

### Références de design déjà produites

- `docs/scratchpad/audit-general-dashboard-2026-04-21.md` — approche audit profond
- `docs/scratchpad/dev-plan-2026-04-21-BO-UI-PROD-GENERAL-001.md` — template plan
- `docs/scratchpad/dev-report-2026-04-21-BO-UI-PROD-GENERAL-001-phase2.md` — template rapport

### Sprint pricing déjà existant (à réutiliser)

- PR #693 (SI-PRICING-001) — unified pricing (cost + margin + min selling + channel prices)
- Hooks : `useChannelPricing`, `useUpdateChannelPrice`, `calculateMinSellingPrice`
- L'onglet Tarification redesign devra **s'appuyer dessus**, pas réécrire

---

## 6. Règles métier non-négociables

- **1 produit = 1 fournisseur unique** (schéma `product_suppliers` en 1:1 effectif)
- **Source unique** = `products.*` — pas de duplication dans `channel_pricing.custom_*` (retiré par SI-DESC-001)
- **Site-internet = source des prix** — pas de "price locked" par canal (sauf exceptions documentées finance.md)
- **LinkMe ≠ Site-internet** — jamais mélanger
- **Qonto = source des documents financiers** — jamais de devis/proforma locaux
- **Triggers stock IMMUABLES** — voir `.claude/rules/stock-triggers-protected.md`
- **Routes API Qonto IMMUABLES** — ne jamais modifier `/api/qonto/*`

---

## 7. Tests Playwright — DÉFERRÉS groupés

**Ne pas faire les tests Playwright onglet par onglet.** Romeo a demandé de les **grouper en fin de cycle** sur l'ensemble de la refonte produit.

### Plan de tests à prévoir (sprint `BO-UI-PROD-E2E-001` après fin des 6 onglets)

1. **Viewports obligatoires** : 375 / 768 / 1024 / 1440 / 1920 px
2. **Scénarios critiques** :
   - Navigation entre les 7 onglets (General + 6 refondus) sans perte d'état
   - Édition inline sur chaque onglet (prix, descriptions, caractéristiques, notes)
   - Rail gauche sticky fonctionne sur tous les onglets
   - Completion % se met à jour en temps réel après édition
   - Modals (photos, caractéristiques, descriptions) ouvrent/ferment proprement
3. **Auth** : chaque lane doit se logger via `/login` (voir `.claude/test-credentials.md`)
4. **Screenshots** : sauvegarder dans `.playwright-mcp/screenshots/YYYYMMDD/` (voir `.claude/rules/playwright-artifacts.md`)
5. **Console** : `browser_console_messages(level: "error")` → **0 erreur**
6. **Régressions** : tester aussi les pages connexes (sourcing, variantes, PO) pour s'assurer qu'elles ne cassent pas

### Tests de non-régression à ajouter

- Prix par canal (SI-PRICING-001) fonctionne toujours après redesign Tarification
- Descriptions single-source (SI-DESC-001) fonctionne toujours après redesign Descriptions
- Images modal fonctionne toujours après redesign Images

---

## 8. Avertissements & pièges rencontrés dans cette session

1. **Stitch MCP timeouts** : les requêtes client expirent mais Google Stitch continue côté serveur ~4 min. Solution : `list_screens` après délai pour récupérer les designs.
2. **Romeo critique brutalement les premiers drafts** : faire la recherche web (Plytix, Akeneo, Shopify, Notion) AVANT de proposer un design. Ne pas reproduire sa liste à la lettre (voir memory `feedback_juger_pas_suivre_litteralement.md`).
3. **Imports fantômes** : `Badge, ButtonV2, Input` depuis `@verone/ui`, pas `@verone/common` (erreur découverte 2e passe reviewer).
4. **`<img>` → `next/image`** : obligatoire sinon ESLint fail build.
5. **Variables destructurées inutilisées** : ESLint bloque le build.
6. **useEffect deps stability** : jamais ajouter une fonction non-stable aux deps. `useCallback` AVANT (bug production 16 avril 2026).
7. **`as unknown as`** : éviter, préférer interface Raw\* + cast direct.
8. **Negative margin chip** : signe `+`/`-` conditionnel + couleur rouge si négatif.
9. **Stub PDF** : `disabled` + `title="Bientôt disponible"`, jamais `console.warn`.

---

## 9. État actuel du repo (snapshot 2026-04-21)

- Branche courante : `staging`
- Dernier commit : `bd4746d98` [BO-UI-PROD-GENERAL-001] merge General dashboard
- CI staging : VERTE (ESLint + Type-Check + Build)
- PRs ouvertes : `gh pr list --state open` à vérifier en début de session suivante

**Commandes de départ pour l'agent suivant** :

```bash
git checkout staging && git pull origin staging
bash .claude/scripts/check-open-prs.sh
gh pr list --state open
```

---

## 10. Priorité suggérée pour l'agent suivant

**ATTENDRE d'abord que Romeo revienne** avec sa branche de corrections non-liées. Quand il redonnera le feu vert pour les onglets produit :

1. **Ordre recommandé** (du plus impactant au moins impactant) :
   1. `BO-UI-PROD-PRICING-001` — Tarification (réutilise 100% SI-PRICING-001, plus rapide)
   2. `BO-UI-PROD-STOCK-001` — Stock (données complexes mais isolées)
   3. `BO-UI-PROD-DESC-001` — Descriptions (source unique SI-DESC-001)
   4. `BO-UI-PROD-CHAR-001` — Caractéristiques (`product_characteristic_values`)
   5. `BO-UI-PROD-IMG-001` — Images (hook `useProductImages` existant)
   6. `BO-UI-PROD-PUB-001` — Publication (canaux + status)

2. **Regroupement PR** (règle workflow.md) : 2-3 onglets par PR si cohérents, PAS 1 PR par onglet.
   - PR 1 : Pricing + Stock (données financières/stock)
   - PR 2 : Descriptions + Caractéristiques (contenu éditorial)
   - PR 3 : Images + Publication (media + canaux)

3. **Sprint final** : `BO-UI-PROD-E2E-001` tests Playwright groupés sur les 7 onglets.

---

## 11. Contact & questions

Si l'agent suivant a un doute :

- Lire d'abord **ce fichier** (handoff)
- Lire ensuite le playbook approprié dans `.claude/playbooks/`
- En cas d'ambiguïté : **FEU ROUGE par défaut** → demander Romeo
- Ne jamais deviner une structure DB ou composant — lire la doc
