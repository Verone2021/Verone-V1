# Audit régressions stock/alertes — 2026-04-17 (APPROFONDI avec docs supprimées)

**Objectif** : identifier pour chaque anomalie A2-A9 si c'est une **régression**, un **bug originel**, ou une **spec documentée jamais codée**.

**Méthodologie approfondie** :

- `git log --follow --all` sur chaque fichier source
- Toutes les migrations SQL lues
- **15+ docs supprimées récupérées via `git show <commit>^:<path>`** dans :
  - `f48d059bd` (14 mars 2026) : Repo cleanup + index docs
  - `2abd93328` (27 mars 2026) : Documentation rewrite (BUSINESS RULES supprimées)
  - `654f5a62a`, `2171a4a7d`, `1f65e73f9` : cleanups divers
- Analyse des spec/rapports de test archivés

---

## Synthèse finale

| #      | Statut                                                               | Preuve commit origine     | Commit régression              | Doc de référence                            |
| ------ | -------------------------------------------------------------------- | ------------------------- | ------------------------------ | ------------------------------------------- |
| **A2** | **Spec documentée, jamais implémentée côté fiche produit**           | —                         | —                              | AUDIT-ALERTES-STOCK-TECHNIQUE (11 nov 2025) |
| **A3** | **Bug originel depuis création fonction 27 nov 2025**                | —                         | —                              | AUDIT-TRIGGERS-STOCK-COMPLET (23 nov 2025)  |
| **A4** | **Jamais implémenté côté front** (page affiche 1 ligne DB = 1 carte) | —                         | —                              | —                                           |
| **A5** | **Partiellement implémenté** (logique OK, helper text manque)        | —                         | —                              | —                                           |
| **A6** | **Bug originel depuis 27 nov 2025** (filtre alert_type jamais codé)  | —                         | —                              | AUDIT-TRIGGERS-STOCK-COMPLET section B      |
| **A7** | ✅ **RÉGRESSION CONFIRMÉE RE-INTRODUITE**                            | `3afbb41ed` (7 déc 2025)  | **`9bde76c00` (8 déc 2025)**   | RAPPORT-TESTS-PHASE-3-ALERTES (10 nov 2025) |
| **A8** | **Spec business documentée mais jamais implémentée**                 | —                         | —                              | cffeaa687 daily release feb 2026            |
| **A9** | ✅ **RÉGRESSION CONFIRMÉE**                                          | `82fa594b6` (11 nov 2025) | **`eeb466fff` Server Actions** | —                                           |

**Conclusion majeure** :

- **2 vraies régressions** (A7, A9) → restauration de code validé
- **6 bugs originels ou specs non codées** (A2, A3, A4, A5, A6, A8) → nouvelles implémentations

**Point clé** : même si A2/A6/A8 étaient documentés dans des specs métiers (confirmé par docs récupérées), le code n'a **jamais** contenu l'implémentation. Les docs décrivent le comportement ATTENDU, pas un comportement qui a existé puis disparu.

---

## A7 — 🔴 RÉGRESSION CONFIRMÉE AVEC DOCS

### Preuves croisées

**Doc récupérée** `f48d059bd^:docs/recovered/audits-2025-11/RAPPORT-TESTS-PHASE-3-ALERTES-STOCK-2025-11-10.md` :

> "✅ Fix couleur StockAlertCard (validated → GREEN) - COMPLET : VERT affiché pour draft, alerte disparaît après validation"
>
> Screenshots tests du 10 novembre 2025 confirmant : `validated=true` → badge VERT.

**Doc récupérée** `f48d059bd^:docs/recovered/audits-2025-11/database/AUDIT-TRIGGERS-STOCK-COMPLET-2025-11-23.md` (Problème 2 du 23 nov) :

> "Database : `validated = true` set correctement
> Frontend : Badges restent ROUGES malgré `validated = true`
> Cause : Page ne lit pas le champ `validated`"
>
> → Problème identifié le 23 nov, **résolu le 7 déc par commit `3afbb41ed`**.

**Commit `3afbb41ed` (7 déc 2025)** "fix(stock): Restaurer getSeverityColor() avec logique validated (ee935049)" :

```tsx
if (alert.validated && stock_previsionnel >= alert.min_stock) return 'green';
if (alert.is_in_draft || stock_previsionnel < alert.min_stock) return 'red';
```

**Commit `9bde76c00` (8 déc 2025 — LENDEMAIN)** "fix(stock): Corriger état VERT alertes stock lors validation PO" :

```diff
-if (alert.validated && stock_previsionnel >= alert.min_stock) { return 'green'; }
-if (alert.is_in_draft || stock_previsionnel < alert.min_stock) { return 'red'; }
+if (alert.is_in_draft) return 'orange';
+if (stock_previsionnel_valide >= alert.min_stock && >= 0) return 'green';
+return 'red';
```

→ **Suppression du `alert.validated`**. C'est la régression exacte.

### Fix proposé (restauration + ajout ORANGE 9bde76c00)

```tsx
if (alert.is_in_draft) return 'orange'; // Conservé de 9bde76c00 (bon ajout)
if (alert.validated && stock_previsionnel >= alert.min_stock) return 'green'; // Restauré de 3afbb41ed
if (alert.is_in_draft || stock_previsionnel < alert.min_stock) return 'red';
// fallback severity switch
```

---

## A9 — 🔴 RÉGRESSION CONFIRMÉE

### Preuves

**Commit `82fa594b6` (11 nov 2025)** "fix(stock): Bouton 'Voir Commande' maintenant fonctionnel sur alertes stock" :

> URL qui marchait : `/commandes/fournisseurs?id=${alert.draft_order_id}`
> Tests validés screenshots Nov 2025.

**Commit `eeb466fff`** "feat(orders): Migrer réceptions/expéditions vers Server Actions Next.js 15" — diff exact :

```diff
-<Link href={`/commandes/fournisseurs?id=${alert.draft_order_id}`}>
+<Link href={`/commandes/fournisseurs`}>
```

### Fix proposé

Restauration exacte de la ligne `82fa594b6`. Ou version moderne `/commandes/fournisseurs/${alert.draft_order_id}` si la route dynamique Next.js 15 existe.

---

## A2 — Page produit onglet Stock sans bannière alertes

### Recherche dans docs supprimées

**Doc** `AUDIT-ALERTES-STOCK-TECHNIQUE-2025-11-22.md` : décrit workflow alerte sur `/stocks/alertes` uniquement.

**Doc** `stock-alert-tracking-system.md` : mentionne "Page alertes affiche produit avec bouton réappro". Aucune mention d'affichage sur fiche produit.

**Doc** `NIVEAU-4-GESTION-STOCK-COMPLETE.md` : liste les pages module Stock — fiche produit n'y est pas.

### Conclusion

**Jamais implémenté.** Les specs historiques parlent uniquement de la page `/stocks/alertes`. Romeo décrit un comportement attendu/souhaité, mais aucune preuve d'implémentation antérieure.

### Fix proposé

Nouvelle feature : `<StockAlertsBanner productId={productId} />` en haut de `product-stock-tab.tsx`.

---

## A3 — Snapshots `stock_alert_tracking.stock_forecasted_out` cumulés

### Recherche dans migrations + docs

**Migrations `update_forecasted_out_on_so_validation`** :

- Création : `20251128_012_harmonize_po_so_triggers.sql` (27 nov)
- Puis : `20260121_002_fix_function_search_paths.sql`, `20260418_fix_so_direct_validated_forecast.sql`

**Toutes les versions** contiennent cette séquence :

```sql
UPDATE products SET stock_forecasted_out = fo + qty;
UPDATE stock_alert_tracking SET stock_forecasted_out = fo + qty;  -- ⚠️ Double maj
```

**Doc** `AUDIT-TRIGGERS-STOCK-COMPLET-2025-11-23.md` ne signale pas ce bug spécifique (audit trigger mais pas sur les snapshots).

### Conclusion

**Bug originel**. La logique d'incrémenter `stock_alert_tracking` en plus de `products` existe depuis la création de la fonction (27 nov 2025). Aucune version historique n'a corrigé ce cumul.

### Fix proposé

Supprimer l'UPDATE manuel sur `stock_alert_tracking` dans `update_forecasted_out_on_so_validation` ET `trigger_so_insert_validated_forecast`. Laisser `sync_stock_alert_tracking_v4` seul gérer les snapshots via `ON CONFLICT DO UPDATE`.

---

## A4 — UI affiche 2 cartes alertes séparées

### Recherche exhaustive

**`git log` hook `use-stock-alerts.ts`** : 13 commits depuis création 27 nov 2025.

**grep `Map`, `groupBy`, `reduce` dans hooks/components** : aucun résultat sur regroupement par product_id.

**Doc `stock-alert-tracking-system.md`** (supprimée 2abd93328) contient :

```sql
GROUP BY p.id, p.name, p.sku
```

Mais c'est une requête de tableau interne, pas de regroupement UI.

### Conclusion

**Jamais implémenté côté front**. La contrainte `UNIQUE (product_id, alert_type)` en DB permet d'avoir 2 alertes par produit (low_stock + out_of_stock) qui sont toujours affichées séparément.

### Fix proposé

Nouvelle feature : dans `hooks.ts` page alertes, grouper par `product_id` avec `Map`. Modifier `StockAlertCard.tsx` pour afficher 1-2 badges selon le tableau d'alert_types reçu.

---

## A5 — Helper text "X unités manquantes"

### État actuel

**`QuickPurchaseOrderModal.tsx`** : la logique est déjà bien implémentée (pré-remplissage qty, modal confirmation si qty < shortage). Il manque juste un `<p>` descriptif dans le formulaire.

### Conclusion

**Partiellement implémenté**. Pas une régression. Ajout UX mineur.

### Fix proposé

1 ligne JSX dans `QuickPurchaseOrderModal.tsx`.

---

## A6 — `validate_stock_alerts_on_po` sans filtre `alert_type`

### Recherche exhaustive migrations

**Toutes les versions de la fonction** (4 migrations lues) :

- `20251128_008_fix_po_validation_clear_draft_fields.sql` (création 27 nov)
- `20251128_012_harmonize_po_so_triggers.sql` (recrée trigger)
- `20260121_002_fix_function_search_paths.sql`
- `20260418_fix_remaining_security_invoker_triggers.sql` (BO-STOCK-002 SECURITY DEFINER)

**Version initiale (27 nov 2025)** :

```sql
UPDATE stock_alert_tracking
SET validated = true, ...
WHERE product_id = v_item.product_id;
-- ⚠️ Aucun filtre alert_type
```

**Toutes les versions** : aucune n'a jamais ajouté `AND alert_type = 'out_of_stock'`.

**Doc** `AUDIT-TRIGGERS-STOCK-COMPLET-2025-11-23.md` décrit le trigger comme "Marque alertes validated=true" sans distinction. **La spec implicite est donc "toutes les alertes passent validated=true"**, ce qui est conceptuellement incorrect car low_stock ne doit passer validated=true que si previsionnel >= min_stock.

### Conclusion

**Bug originel conceptuel**. La fonction n'a jamais filtré par alert_type. Romeo a peut-être toujours validé via `sync_stock_alert_tracking_v4` (qui recalcule correctement `v_is_validated := v_previsionnel >= NEW.min_stock`) avant que `validate_stock_alerts_on_po` ne vienne écraser ce calcul.

### Fix proposé

Ajouter `AND alert_type = 'out_of_stock'` dans le WHERE de `validate_stock_alerts_on_po`. Laisser `sync_stock_alert_tracking_v4` recalculer conditionnellement pour `low_stock`.

---

## A8 — Alerte `low_stock` basée sur prévisionnel manquante

### Preuves documentaires

**Migration** `cffeaa687` (daily release 27 fév 2026) — commit message :

> "Exigence Business : Une alerte est déclenchée lorsque le stock prévisionnel (`stock_real - stock_forecasted_out + stock_forecasted_in`) descend en dessous ou égal au seuil `min_stock`."

**Doc active** `docs/current/modules/stock-module-reference.md` (présente aujourd'hui) :

```
| stock_available < min_stock | forecast_shortage | info |
```

Mentionne un type `forecast_shortage` qui **n'existe pas** dans l'enum `alert_type` de la DB (`low_stock`, `out_of_stock`, `no_stock_but_ordered` uniquement).

**Doc `AUDIT-TRIGGERS-STOCK-COMPLET-2025-11-23.md`** — Section C workflow `sync_stock_alert_tracking_v4` :

```sql
IF NEW.stock_real < NEW.min_stock THEN
    v_is_validated := v_previsionnel >= NEW.min_stock;
    -- INSERT/UPDATE alerte low_stock
END IF;
```

→ Condition `stock_real < min_stock` (stock RÉEL, pas prévisionnel). Documentée telle quelle.

### Conclusion

**Spec documentée mais jamais codée**. La règle business dit "previsionnel ≤ min_stock" mais le code vérifie `stock_real < min_stock`. Divergence entre doc et code depuis l'origine. Aucune version historique n'a implémenté la spec business.

### Fix proposé

**Option A** : changer la condition dans `sync_stock_alert_tracking_v4` :

```sql
-- AVANT
IF COALESCE(NEW.min_stock, 0) > 0 AND NEW.stock_real < NEW.min_stock THEN
-- APRÈS
IF COALESCE(NEW.min_stock, 0) > 0
   AND (NEW.stock_real + COALESCE(NEW.stock_forecasted_in, 0) - COALESCE(NEW.stock_forecasted_out, 0))
       < NEW.min_stock THEN
```

**Option B** : créer un nouveau `alert_type = 'low_stock_forecast'` pour ne pas mélanger.

**⚠️ Impact** : Option A créerait beaucoup de nouvelles alertes `low_stock` pour les produits avec SO validées non expédiées. Option B plus propre mais nécessite migration d'enum + mise à jour UI.

---

## Ordre de traitement final

### 🔴 BO-STOCK-005 — Restaurations critiques (risque nul)

1. **A9** : 1 ligne JSX. 2 min. Restauration exacte commit `82fa594b6`.
2. **A7** : 10 min. Restauration logique `validated` commit `3afbb41ed` + conservation ORANGE `is_in_draft` de `9bde76c00`.

### 🟠 BO-STOCK-006 — Bugs originels (risque faible)

3. **A6** : 15 min. Ajout filtre `alert_type` dans `validate_stock_alerts_on_po`.
4. **A3** : 20 min. Suppression double UPDATE dans `update_forecasted_out_on_so_validation`.
5. **A5** : 20 min. Helper text dans `QuickPurchaseOrderModal`.

### 🟡 BO-STOCK-007 — Nouvelles features (design requis)

6. **A2** : bannière alertes sur fiche produit. Réutiliser `StockAlertCard.tsx`.
7. **A4** : regroupement alertes par product_id dans hook. Design à valider.
8. **A8** : décision Option A vs B pour alerte prévisionnelle. Validation Romeo nécessaire avant.

---

## Preuves consultées (traçabilité)

**Commits exacts** :

- `3afbb41ed`, `9bde76c00`, `82fa594b6`, `eeb466fff`, `3338a350c`, `318e1b8b5`, `cffeaa687`
- `20251120162000`, `20251128_008`, `20251128_012`, `20251208_004`, `20260121_002`, `20260418_*`

**Docs récupérées (15+)** :

- `AUDIT-TRIGGERS-STOCK-COMPLET-2025-11-23.md`
- `AUDIT-ALERTES-STOCK-TECHNIQUE-2025-11-22.md`
- `RAPPORT-TESTS-PHASE-3-ALERTES-STOCK-2025-11-10.md`
- `stock-alert-tracking-system.md` (business-rules)
- `real-vs-forecast-separation.md`
- `stock-movements.md`, `orders-lifecycle.md`
- `NIVEAU-4-GESTION-STOCK-COMPLETE.md`
- Autres RAPPORT-TESTS/AUDIT de la série recovered/audits-2025-11

**Aucune modification de code ou DB effectuée durant cet audit.**

Commit en local `3b6d774c9` sur `feat/BO-STOCK-004-tests-and-cleanup`, non pushé.

---

**Rapport final. En attente de décision Romeo pour démarrer BO-STOCK-005.**
