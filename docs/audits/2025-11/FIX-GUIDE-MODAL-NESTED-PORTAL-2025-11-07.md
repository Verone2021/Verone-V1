# GUIDE DE FIX : Modal Imbriqué avec Portal

**Durée estimée** : 30 minutes
**Difficulté** : Moyenne
**Priorité** : P0 - BLOQUANT

---

## SOLUTION RECOMMANDÉE : Portal Externe

### Étape 1 : Modifier SalesOrderFormModal.tsx (5 min)

```typescript
// Dans SalesOrderFormModal.tsx

import ReactDOM from 'react-dom'

export function SalesOrderFormModal() {
  // ... états existants

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger + Content existants */}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* ... formulaire existant ... */}
      </DialogContent>

      {/* ❌ SUPPRIMER UniversalProductSelectorV2 d'ici */}
    </Dialog>

    {/* ✅ AJOUTER Portal séparé */}
    {showProductSelector && ReactDOM.createPortal(
      <UniversalProductSelectorV2
        open={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onSelect={handleProductsSelect}
        mode="multi"
        context="orders"
        title="Sélectionner des produits pour la commande"
        description="Choisissez les produits à ajouter. Vous pourrez ajuster quantités et prix après sélection."
        excludeProductIds={excludeProductIds}
        showImages={true}
        showQuantity={true}
        showPricing={false}
      />,
      document.body  // Render directement dans <body>
    )}
  )
}
```

### Étape 2 : Modifier PurchaseOrderFormModal.tsx (5 min)

```typescript
// Dans PurchaseOrderFormModal.tsx

import ReactDOM from 'react-dom'

export function PurchaseOrderFormModal() {
  // ... états existants

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {/* ... formulaire existant ... */}
      </Dialog>

      {/* ✅ Portal séparé */}
      {isEditMode && showProductSelector && ReactDOM.createPortal(
        <UniversalProductSelectorV2
          open={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          onSelect={handleProductsSelect}
          mode="multi"
          context="orders"
          title="Sélectionner des produits pour la commande"
          description="Choisissez les produits à ajouter. Vous pourrez ajuster quantités et prix après sélection."
          excludeProductIds={excludeProductIds}
          showImages={true}
          showQuantity={true}
          showPricing={true}
        />,
        document.body
      )}
    </>
  )
}
```

### Étape 3 : Tests MCP Playwright (15 min)

```bash
# 1. Naviguer page commandes clients
mcp__playwright__browser_navigate("http://localhost:3000/commandes/clients")

# 2. Ouvrir modal commande
mcp__playwright__browser_click("Nouvelle commande")

# 3. Ouvrir modal produits (DOIT FONCTIONNER maintenant)
mcp__playwright__browser_click("Ajouter des produits")

# 4. Vérifier console = 0 errors
mcp__playwright__browser_console_messages(onlyErrors: true)
# ✅ DOIT RETOURNER : <system>Tool ran without output or errors</system>

# 5. Screenshot validation
mcp__playwright__browser_take_screenshot("modal-produits-success.png")

# 6. Sélectionner 2 produits
mcp__playwright__browser_click("+ (premier produit)")
mcp__playwright__browser_click("+ (deuxième produit)")

# 7. Confirmer
mcp__playwright__browser_click("Confirmer")

# 8. Vérifier produits dans tableau
# DOIT afficher 2 lignes dans le tableau Articles
```

### Étape 4 : Validation (5 min)

**Checklist** :

- [ ] Console = 0 errors à l'ouverture modal produits
- [ ] Modal produits s'affiche correctement
- [ ] Sélection produits fonctionne
- [ ] Bouton "Confirmer" ferme modal
- [ ] Produits apparaissent dans tableau formulaire
- [ ] Quantités/prix éditables
- [ ] Bouton suppression fonctionne
- [ ] Création commande complète réussit

---

## ALTERNATIVE : usePortal dans UniversalProductSelectorV2 (60 min)

Si vous voulez une solution réutilisable pour tous les usages futurs :

### Étape 1 : Modifier UniversalProductSelectorV2.tsx

```typescript
// Dans UniversalProductSelectorV2.tsx

export interface UniversalProductSelectorV2Props {
  // ... props existantes
  usePortal?: boolean  // ✅ NOUVEAU
}

export function UniversalProductSelectorV2({
  open,
  onClose,
  onSelect,
  usePortal = false,  // Default false pour rétro-compatibilité
  // ... autres props
}: UniversalProductSelectorV2Props) {

  const modalContent = (
    <Dialog open={open} onOpenChange={onClose}>
      {/* ... contenu existant ... */}
    </Dialog>
  )

  // ✅ Render conditionnel
  if (usePortal && typeof document !== 'undefined') {
    return ReactDOM.createPortal(modalContent, document.body)
  }

  return modalContent
}
```

### Étape 2 : Utiliser dans les formulaires

```typescript
// SalesOrderFormModal.tsx
<UniversalProductSelectorV2
  usePortal={true}  // ✅ Activer Portal
  open={showProductSelector}
  onClose={() => setShowProductSelector(false)}
  onSelect={handleProductsSelect}
  // ... autres props
/>

// PurchaseOrderFormModal.tsx
<UniversalProductSelectorV2
  usePortal={true}  // ✅ Activer Portal
  open={showProductSelector}
  onClose={() => setShowProductSelector(false)}
  onSelect={handleProductsSelect}
  // ... autres props
/>
```

**Avantages** :

- ✅ Réutilisable partout
- ✅ Rétro-compatible (usePortal=false par défaut)
- ✅ Clean API

**Inconvénients** :

- ⏱️ Plus long à implémenter (60min vs 30min)
- 🧪 Nécessite tests sur tous les usages existants

---

## Z-INDEX LAYERS (Important)

Avec Portal, gérer les z-index correctement :

```css
/* Dans globals.css ou theme */

.modal-layer-1 {
  z-index: 1000; /* Dialog parent (commande) */
}

.modal-layer-2 {
  z-index: 1100; /* Dialog enfant (produits) */
}
```

**Radix UI Dialog** utilise déjà des z-index élevés, mais Portal garantit que le modal enfant s'affiche AU-DESSUS du parent.

---

## DEBUGGING

Si le fix ne fonctionne pas :

### Check 1 : Portal render

```typescript
// Ajouter console.log temporaire
{showProductSelector && ReactDOM.createPortal(
  <div>
    {console.log('🔍 Portal rendering:', showProductSelector)}
    <UniversalProductSelectorV2 ... />
  </div>,
  document.body
)}
```

### Check 2 : DOM Inspection

```bash
# Dans DevTools Console
document.querySelectorAll('[role="dialog"]').length
# DOIT RETOURNER : 2 (un pour commande, un pour produits)
```

### Check 3 : React DevTools

Vérifier dans React DevTools que UniversalProductSelectorV2 est HORS de la hiérarchie Dialog parent.

```
<App>
  <SalesOrderFormModal>
    <Dialog>  ← Parent
      ...
    </Dialog>
  </SalesOrderFormModal>
  <UniversalProductSelectorV2>  ← Enfant (via Portal, séparé)
    <Dialog>
      ...
    </Dialog>
  </UniversalProductSelectorV2>
</App>
```

---

## TESTS E2E COMPLETS

Après fix, exécuter workflow complet :

### Workflow Commande Client

1. Naviguer `/commandes/clients`
2. Cliquer "Nouvelle commande"
3. Sélectionner client (ex: "SARL Test")
4. Cliquer "Ajouter des produits"
5. **✅ Modal produits s'ouvre SANS crash**
6. Sélectionner 2 produits (cliquer +)
7. Ajuster quantité produit 1 (ex: 5)
8. Cliquer "Confirmer sélection"
9. **✅ Modal produits se ferme**
10. **✅ Tableau affiche 2 produits**
11. Modifier quantité en inline (ex: 10)
12. Modifier prix unitaire
13. Cliquer supprimer sur 1 produit
14. **✅ Reste 1 produit**
15. Vérifier totaux HT/TVA/TTC
16. Cliquer "Créer la commande"
17. **✅ Commande créée, modal se ferme**
18. **✅ Nouvelle commande visible dans tableau**

### Workflow Commande Fournisseur

(Identique mais en mode ÉDITION uniquement)

1. Créer commande vide d'abord
2. Cliquer "Modifier"
3. Cliquer "Ajouter des produits"
4. **✅ Modal produits fonctionne**
5. ... (même workflow)

---

## COMMIT MESSAGE

```bash
fix(commandes): Portal externe pour UniversalProductSelectorV2 (modal imbriqué)

PROBLÈME:
- Modal Radix UI imbriqué cause loop infini React
- "Maximum update depth exceeded" error
- @radix-ui/react-presence incompatible nesting

SOLUTION:
- ReactDOM.createPortal() pour render modal produits dans <body>
- Évite Dialog enfant dans Dialog parent
- z-index layers gérés automatiquement par Radix UI

FICHIERS:
- SalesOrderFormModal.tsx: Portal ajouté
- PurchaseOrderFormModal.tsx: Portal ajouté

TESTS:
✅ Console = 0 errors
✅ Modal produits s'ouvre
✅ Sélection multi-produits
✅ Ajout au formulaire
✅ Création commande complète

Fixes #BUG-UNIVERSAL-PRODUCT-SELECTOR-NESTED-MODALS

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## DOCUMENTATION À METTRE À JOUR

Après fix réussi :

1. **Design System V2** (`docs/design-system/modals.md`) :

   ````markdown
   ## Modals Imbriqués

   ⚠️ Radix UI Dialog ne supporte PAS le nesting direct.

   **Solution** : Utiliser ReactDOM.createPortal()

   ```typescript
   {showNestedModal && ReactDOM.createPortal(
     <Dialog>...</Dialog>,
     document.body
   )}
   ```
   ````

2. **Business Rules Commandes** :
   - Ajouter section "Sélection Produits"
   - Documenter comportement multi-sélection

3. **Tests E2E** :
   - Ajouter test "Modal imbriqué"
   - Playwright automation

---

**Créé par** : Vérone Debugger
**Dernière update** : 2025-11-07 19:15 CET
**Statut** : PRÊT À IMPLÉMENTER
