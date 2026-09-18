# Audit — Onglet Général dashboard synthèse (redesign complet)

**Date** : 2026-04-21
**Demandeur** : Romeo
**Sprint** : BO-UI-PROD-GENERAL-001 (à ouvrir)
**Source** : agent Explore — audit DB + code + règles métier

---

## 0. Principes (verbatim Romeo)

- Général actuel est **obsolète**, gaspille l'espace.
- Il doit devenir un **dashboard de synthèse** de tous les onglets, pas un onglet de saisie.
- **Retirer toute référence "ambassadeur créateur"** — les ambassadeurs sont liés au site-internet, pas aux produits.
- Les canaux de vente (site-internet, LinkMe) doivent avoir des **toggles activer/désactiver fonctionnels** directement depuis ici.
- Les liens rapides deviennent **doc technique + génération PDF**.

## 1. Cartographie DB (faisabilité)

| Besoin                   | Table / Colonne                                                                                                          |      Remplis prod | Statut                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------: | ------------------------------------------- |
| Checklist complétude     | `products.completion_percentage`, `.completion_status`                                                                   |           232/232 | ✓                                           |
| Prix achat synthèse      | `products.cost_price / .cost_net_avg / .cost_price_avg/min/max/last`                                                     |           230/232 | ✓                                           |
| Variantes                | `products.variant_group_id` + `product_group_members`                                                                    |            20/232 | ✓                                           |
| Échantillons             | `products.requires_sample` + vue à créer sur `sample_orders.sample_status`                                               |             0/232 | ⚠️ vue à créer                              |
| Sourcing                 | `products.sourcing_type / .sourcing_channel / .sourcing_status / .sourcing_priority / .sourcing_tags / .consultation_id` | 2-232/232 partial | ⚠️ `sourcing_type` sous-rempli (bug métier) |
| Historique sourcing prix | `sourcing_price_history`                                                                                                 |             actif | ✓                                           |
| PO reçues                | `product_purchase_history`                                                                                               |             actif | ✓                                           |
| Flux activité stock      | `stock_movements`                                                                                                        |             actif | ✓                                           |
| Canaux vente             | `channel_pricing.is_active` + `is_published_online`                                                                      |               30+ | ✓                                           |
| Notes internes           | `products.internal_notes`                                                                                                |             0/232 | ✓ (champ vide)                              |

**Aucune migration DB obligatoire.** Juste une vue SQL pour agréger `sample_status` depuis `sample_orders`.

## 2. Composants réutilisables

| Composant                  | Path                                     |   L | Réutilisation                         |
| -------------------------- | ---------------------------------------- | --: | ------------------------------------- |
| `SampleRequirementSection` | `@verone/products`                       | 256 | Extraire toggle + status chip         |
| `ProductVariantsGrid`      | `@verone/products`                       | 100 | Créer version `Compact` (50 L)        |
| `UnifiedPricingPanel`      | `@verone/common`                         |  45 | Mode read-only                        |
| `SourcingPriceHistory`     | `@verone/products/.../sourcing/notebook` |  80 | Timeline + tendances                  |
| `ProductPublicationTab`    | `apps/back-office`                       | 170 | Extraire logique checks (lines 59-98) |
| `SourcingNotebook` (hooks) | `@verone/products/hooks/sourcing`        |   — | État sourcing typé                    |

**Composant à créer** : `SourceActivityTimeline` (~100 L) — UNION ALL de 4 tables.

## 3. Structure dashboard cible — grille 12 colonnes

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER SYNTHÈSE (12 cols)                                       │
│ Nom + SKU + Fournisseur · Badges : Complétude / Statut / Publié │
└─────────────────────────────────────────────────────────────────┘

┌────────── COL 1 (4 col) ──┬─── COL 2 (4 col) ──┬── COL 3 (4 col) ┐
│ 1 Checklist publication   │ 4 Prix achat synth.│ 7 Timeline       │
│ 2 Variantes mini-grid     │ 5 Échantillons     │ 8 Activité stock │
│ 3 Sourcing synthèse       │ 6 Fournisseur + PO │ 9 Notes internes │
│                           │                    │ 10 Actions rapides│
└───────────────────────────┴────────────────────┴──────────────────┘
```

## 4. 10 blocs — spécification

### Bloc 1 — Checklist publication (4 col)

- 4 items critiques : Nom+Description, Images ≥1, Catégorisation+Slug, Prix de vente ≥1 canal
- Barre progression + chips statut (rouge bloquant / orange recommandé / vert OK)
- Clic item → scroll vers l'onglet concerné
- Source : logique extraite de `product-publication-tab.tsx:59-98`

### Bloc 2 — Variantes mini-grid (4 col, conditionnel)

- Affiché uniquement si `variant_group_id` existe
- 3 thumbnails (image + SKU + prix)
- Lien "Voir groupe complet" → `/produits/catalogue/variantes/[groupId]`

### Bloc 3 — Sourcing synthèse (4 col)

- 4 lignes clé-valeur : Type (badge), Status (badge), Priorité (LOW/MED/HIGH indicator), Tags (chips max 2)
- Si `consultation_id` → lien "Voir consultation #X"
- Source : colonnes `products.sourcing_*`

### Bloc 4 — Prix achat synthèse (4 col)

- Cost_price (big tabular)
- Mini sparkline ou trio min/avg/max
- Dernier prix négocié + date + delta %
- Marge % courante
- Source : `UnifiedPricingPanel` en mode read-only

### Bloc 5 — Échantillons (4 col)

- Toggle `requires_sample` (ON/OFF, inline)
- Si ON : chip status (none / ordered / received / validated / rejected)
- Lien vers onglet Sourcing si en cours

### Bloc 6 — Fournisseur & dernière PO (4 col)

- Nom fournisseur + link `/fournisseurs/[id]`
- Dernière PO : ref + date + total + chip statut (delivered/pending)
- Contrainte métier rappelée : "1 produit = 1 fournisseur"

### Bloc 7 — Historique sourcing timeline (4 col)

- 5 derniers events (création produit, PO reçue, changement prix, changement sourcing_status, consultation créée)
- UNION ALL de 4 tables + ORDER BY date DESC LIMIT 5
- Visuel : items verticaux dot + date courte + label

### Bloc 8 — Flux activité stock (4 col)

- 5 derniers `stock_movements` : date, type (in/out/transfer), qté ±, raison, initiateur
- Table compacte, pas de pagination

### Bloc 9 — Notes internes (4 col)

- Textarea `products.internal_notes`, inline edit
- Mode lecture 3 lignes max, mode édition plein

### Bloc 10 — Actions rapides (4 col)

- **Toggle Publication Site Internet** (fonctionnel, update `products.is_published_online`)
- **Toggle LinkMe** (fonctionnel, update `channel_pricing.is_active`)
- **Bouton "Générer PDF fiche technique"**
- Lien "Ouvrir fiche fournisseur"
- Lien "Ouvrir Sourcing détail"

## 5. Éléments à RETIRER de l'existant

| Élément                                    | Raison                                     | Fichier:lignes                    |
| ------------------------------------------ | ------------------------------------------ | --------------------------------- |
| **"Ambassadeur créateur"**                 | Ambassadeurs = site internet, pas produits | `product-general-tab.tsx:69-94`   |
| Section Métadonnées & Audit pleine largeur | ID/dates → tooltip header                  | `product-general-tab.tsx:305-333` |
| Badge "Produit affilié" × 3                | Triple doublon, garder 1 en header         | lines 70, 96, 122-137             |
| Section Attribution client 100px           | → Badge synthèse en header                 | lines 67-167                      |
| Champ "Condition" mal placé                | À déplacer vers Caractéristiques           | line 296                          |

## 6. Contraintes CLAUDE.md

- Responsive 5 tailles (375/768/1024/1440/1920)
- Fichier > 400 L = refactor → **10 fichiers** sous-composants
- `ResponsiveDataView` pour tableau flux activité
- Zéro `any`
- Inline edit (notes, toggles, sourcing_priority)
- Réutilisation max `@verone/*`

## 7. Structure fichiers cible

```
apps/back-office/.../[productId]/_components/
├── product-general-tab.tsx             (80 L — wrapper)
├── product-general-dashboard.tsx       (200 L — layout principal)
└── _dashboard-blocks/
    ├── DashboardHeader.tsx             (60 L)
    ├── ChecklistPublicationBlock.tsx   (80 L)
    ├── VariantsCompactBlock.tsx        (60 L)
    ├── SourcingBriefBlock.tsx          (70 L)
    ├── PricingBriefBlock.tsx           (80 L)
    ├── SamplesBlock.tsx                (60 L)
    ├── SupplierPoBlock.tsx             (70 L)
    ├── SourcingTimelineBlock.tsx       (100 L)
    ├── StockMovesBlock.tsx             (80 L)
    ├── InternalNotesBlock.tsx          (70 L)
    └── QuickActionsBlock.tsx           (100 L)

+ packages/@verone/products/src/hooks/
  └── use-product-dashboard-data.ts     (150 L — agrège 4 tables)
```

## 8. Plan d'implémentation

**Phase 1 — Foundation (1 semaine)** : créer les 10 blocs + hook + vue SQL sample_status
**Phase 2 — Intégration (3 jours)** : remplacer l'onglet + tester cross-links
**Phase 3 — Polish (3 jours)** : responsive, a11y, perf

## 9. Résumé exécutif

| Aspect           | Verdict                                                       |
| ---------------- | ------------------------------------------------------------- |
| Faisabilité      | 95 % (DB quasi-complète, 90 % composants réutilisables)       |
| Effort           | 3-4 semaines (hors design Stitch validation)                  |
| Migration DB     | **Zéro** obligatoire (vue SQL pour sample_status seulement)   |
| Breaking changes | Aucun, onglet Général indépendant                             |
| ROI              | Très haut — 70 % moins de clics pour voir l'état d'un produit |

## 10. Flag FEU ROUGE identifié

`products.sourcing_type` rempli sur 2/232 produits (0,8 %). Bug de saisie historique. À traiter séparément (pas bloquant pour le dashboard, mais à fixer sinon le bloc 3 affichera "Non défini" pour 99 % des produits).
