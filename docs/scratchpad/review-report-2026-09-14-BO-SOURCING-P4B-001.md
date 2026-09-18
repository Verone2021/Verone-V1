# Review Report — 2026-09-14 — BO-SOURCING-P4B-001

## Verdict : PASS WITH WARNINGS

---

### CRITICAL — aucun

---

### WARNING — ProductEvaluationDialog.tsx:1-239 — Composant > 200 lignes

**Problème** : Le composant mesure 239 lignes. La règle (`apps/back-office/CLAUDE.md` + `code-standards.md`) impose < 200 lignes par composant React.
**Fix** : Extraire `SafetyCheckSelector` (boutons ok/ko/to_check, lignes 148–176) et `EvaluationPreview` (bloc moyenne + suggestion, lignes 196–215) en sous-composants dans le même fichier ou dans un fichier dédié. Ramènerait le Dialog à ~190 lignes.

---

### WARNING — page.tsx:348 — Callback `onReasonConfirm` sans `.catch()`

**Problème** : `onReasonConfirm={(action, reason) => runAction({ action, reason })}` retourne une Promise implicite sans `.catch()`. Si `SourcingLifecycleDialogs` appelle ce callback sans `await`, une erreur dans `runAction` sera silencieuse. Inconsistant avec `onValidateConfirm` qui utilise `async () => { await runAction(...); }`.
**Fix** :

```tsx
onReasonConfirm={(action, reason) => {
  void runAction({ action, reason }).catch(error => {
    console.error('[SourcingDetail] reason action failed:', error);
  });
}}
```

---

### WARNING — ProductEvaluationDialog.tsx:128-238 — Absence de `DialogDescription`

**Problème** : Le `DialogContent` contient un `DialogTitle` mais aucune `DialogDescription`. Radix UI émet un avertissement en dev (`Missing Description or aria-describedby`). Les lecteurs d'écran n'ont pas de contexte au-delà du titre.
**Fix** : Ajouter une `DialogDescription` visuellement masquée :

```tsx
import { DialogDescription } from '@verone/ui/components/ui/dialog';
// dans DialogHeader, après DialogTitle :
<DialogDescription className="sr-only">
  Notez la conformité, la fabrication et l'emballage de l'échantillon reçu.
</DialogDescription>;
```

---

### INFO — use-product-evaluation.ts — Logique insert/update correcte

**Note** : Le choix insert vs update repose sur `query.data` (état TanStack Query au moment de la mutation). Correct car le hook gère au plus une évaluation par produit (`limit(1)` + logique métier). La contrainte UNIQUE `purchase_order_item_id` sur la table est défensive mais n'est pas exploitée pour un upsert — l'approche manuelle est acceptable.

---

### INFO — Migration 20260914010000 — Conformité R-GRANT

**Note** : `REVOKE ALL … FROM PUBLIC, anon, authenticated` + `GRANT … TO authenticated` + RLS `is_backoffice_user()` avec `WITH CHECK` conforme à R-GRANT. Aucun droit accordé à `anon`. Trigger de déclenchement `update_updated_at_column` = `RETURNS trigger`, aucun `GRANT EXECUTE` nécessaire.

---

### INFO — derive-sample-state.ts — Ajout `itemId` non régressif

**Note** : `itemId` ajouté à `SampleStateResult` avec valeur `null` pour les états sans commande. Tous les call sites passant `SampleStateResult` reçoivent le champ optionnellement (TypeScript aurait rejeté les cas manquants). Tests unitaires couvrent tous les états incluant `itemId: null` pour `state: 'none'`.

---

## Résumé des vérifications

| Axe                                               | Résultat                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| Anti-raccourcis (grep)                            | ✅ Aucun `@ts-ignore`, `as any`, `eslint-disable`, seuil abaissé |
| Clean Code                                        | ⚠️ Dialog 239 lignes (seuil 200)                                 |
| Sécurité (RLS, GRANT, colonnes explicites)        | ✅ Conforme                                                      |
| Performance (await invalidate, limit, pas de N+1) | ✅ Conforme                                                      |
| Responsive (modal, footer, touch targets 44px)    | ✅ Conforme                                                      |
| Promesses flottantes                              | ⚠️ `onReasonConfirm` sans `.catch()`                             |
| Accessibilité                                     | ⚠️ `DialogDescription` absente                                   |
