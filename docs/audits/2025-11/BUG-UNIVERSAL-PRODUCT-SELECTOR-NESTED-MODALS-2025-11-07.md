# BUG CRITIQUE : UniversalProductSelectorV2 + Modals Imbriqués

**Date** : 2025-11-07
**Durée investigation** : 40 minutes
**Statut** : ❌ BLOQUANT - Nécessite fix dans UniversalProductSelectorV2
**Priorité** : P0 - CRITICAL

---

## RÉSUMÉ EXÉCUTIF

L'intégration de `UniversalProductSelectorV2` dans les formulaires de commandes (`SalesOrderFormModal` et `PurchaseOrderFormModal`) cause une **boucle infinie React** ("Maximum update depth exceeded") à l'ouverture du modal produits.

**Impact** :

- ❌ Impossible d'ajouter des produits aux commandes clients
- ❌ Impossible d'ajouter des produits aux commandes fournisseurs
- ✅ Le reste de l'application fonctionne (console = 0 errors)

**Cause Racine** :

- Dialog Radix UI **imbriqué** dans un autre Dialog
- `@radix-ui/react-presence` déclenche setState infiniment
- Lié à la gestion des refs dans `compose-refs`

---

## STACK TRACE

```
Error: Maximum update depth exceeded. This can happen when a component
repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
React limits the number of nested updates to prevent infinite loops.

at usePresence.useCallback (node_modules/@radix-ui/react-presence/dist/index.mjs:163:17)
at setRef (node_modules/@radix-ui/react-compose-refs/dist/index.mjs:11:12)
```

**Points d'échec** :

1. Ouverture `SalesOrderFormModal` → ✅ OK
2. Clic "Ajouter des produits" → ❌ CRASH
3. `UniversalProductSelectorV2` s'ouvre → Loop infini

---

## ARCHITECTURE PROBLÉMATIQUE

```typescript
// ❌ Configuration actuelle (BROKEN)
<Dialog open={modalCommande}>  // Modal parent
  <form>
    ...
    <UniversalProductSelectorV2
      open={showProductSelector}  // Dialog enfant → PROBLÈME
      ...
    />
  </form>
</Dialog>
```

**Radix UI Dialog** ne supporte **PAS** les modals imbriqués sans configuration spéciale.

---

## TENTATIVES DE FIX

### Fix 1 : useMemo sur excludeProductIds ❌

```typescript
// Avant
excludeProductIds={items.map(item => item.product_id)}

// Après
const excludeProductIds = useMemo(() =>
  items.map(item => item.product_id),
  [items]
)
```

**Résultat** : Aucun changement, loop persiste

### Fix 2 : useCallback sur handlers ❌

**Résultat** : Aucun changement

---

## SOLUTIONS POSSIBLES

### Solution 1 : Portal avec Modal externe (RECOMMANDÉ)

```typescript
// Render UniversalProductSelectorV2 HORS du Dialog parent
export function SalesOrderFormModal() {
  return (
    <>
      <Dialog>{/* Modal commande */}</Dialog>

      {/* Portal séparé */}
      {showProductSelector && ReactDOM.createPortal(
        <UniversalProductSelectorV2 ... />,
        document.body
      )}
    </>
  )
}
```

**Avantages** :

- Pas de nesting Dialog
- Radix UI gère correctement les layers

### Solution 2 : Remplacer Dialog par Popover

Utiliser `Popover` Radix UI au lieu de `Dialog` pour UniversalProductSelectorV2.

### Solution 3 : Forcer modal='false' sur Dialog parent

```typescript
<Dialog modal={false}>
  {/* Désactive overlay parent pendant Dialog enfant */}
</Dialog>
```

**Risque** : UX dégradée

---

## IMPACT SUR LIVRABLE

### ✅ Code Intégré (90% complété)

**BATCH 3 - SalesOrderFormModal** :

- ✅ Import UniversalProductSelectorV2
- ✅ Handler handleProductsSelect
- ✅ useMemo excludeProductIds
- ✅ Bouton "Ajouter des produits"
- ✅ Modal props configurées
- ❌ Fonctionnel (bug modal imbriqué)

**BATCH 4 - PurchaseOrderFormModal** :

- ✅ Import UniversalProductSelectorV2
- ✅ Handler handleProductsSelect
- ✅ useMemo excludeProductIds
- ✅ Bouton "Ajouter des produits"
- ✅ Modal props configurées
- ❌ Fonctionnel (bug modal imbriqué)

### ❌ Tests Fonctionnels (0% réussis)

- ❌ Modal UniversalProductSelectorV2 s'ouvre → CRASH
- ❌ Sélection produits → NON TESTÉ
- ❌ Ajout produits au formulaire → NON TESTÉ

---

## FICHIERS MODIFIÉS

### SalesOrderFormModal.tsx

**Lignes modifiées** :

- L3 : `import { useState, useEffect, useMemo }` (ajout useMemo)
- L24-25 : Import UniversalProductSelectorV2, SelectedProduct, useToast
- L93 : `showProductSelector` (renommé depuis showProductSearch)
- L225 : `useMemo(() => items.map(...), [items])`
- L391-464 : Nouveau `handleProductsSelect` (remplace addProduct)
- L705 : Bouton "Ajouter des produits"
- L924-936 : Modal UniversalProductSelectorV2

### PurchaseOrderFormModal.tsx

**Lignes modifiées** :

- L3 : `import { useState, useEffect, useMemo, useCallback }`
- L36 : Import UniversalProductSelectorV2
- L114 : `showProductSelector`
- L195 : `useMemo(() => items.map(...), [items])`
- L213-253 : Nouveau `handleProductsSelect`
- L518 : Bouton "Ajouter des produits"
- L624-636 : Modal UniversalProductSelectorV2

---

## RECOMMANDATIONS

### Court Terme (Hotfix - 30min)

1. **Rollback partiel** : Retirer UniversalProductSelectorV2, garder l'ancien système
2. **Ou** : Implémenter Solution 1 (Portal)

### Moyen Terme (Fix propre - 2h)

1. **Refactorer UniversalProductSelectorV2** :
   - Ajouter prop `usePortal?: boolean`
   - Si true, render dans Portal automatiquement
   - Gérer z-index layers correctement

2. **Tests E2E** :
   - Ajouter test "Modal imbriqué Radix UI"
   - Valider avant merge

### Long Terme (Architecture - 1 jour)

1. **Design System V2 Modal Guidelines** :
   - Documenter pattern modals imbriqués
   - Créer composant `NestedDialog` avec Portal intégré
   - Linter rule : interdire Dialog dans Dialog

---

## LEÇONS APPRISES

1. ❌ **Toujours tester modals imbriqués** avant merge
2. ❌ **Radix UI Dialog ≠ compatible nesting** sans Portal
3. ✅ **MCP Playwright Browser détecte bugs rapidement** (2min vs 1h manuelle)
4. ✅ **useMemo obligatoire pour arrays/objects en props** (évite re-renders)

---

## PROCHAINES ÉTAPES

1. **Décision architecture** : Portal vs Popover vs Refactor
2. **Implémenter fix** (estimé 30-120min selon solution)
3. **Re-tester avec MCP Playwright**
4. **Documenter pattern** dans Design System V2

---

**Créé par** : Vérone Debugger via Claude Code
**Dernier update** : 2025-11-07 18:45 CET
