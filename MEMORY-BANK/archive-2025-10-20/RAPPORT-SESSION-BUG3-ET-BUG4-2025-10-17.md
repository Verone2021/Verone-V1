# 🐛 RAPPORT SESSION - Bug #3 Corrigé + Bug #4 Découvert

**Date** : 17 Octobre 2025
**Contexte** : Test E2E #1 - Création produit avec `convertDraftToProduct`
**Objectif** : Valider le workflow complet Draft → Product

---

## 📋 Résumé Exécutif

### Statut Session
✅ **Bug #3 CORRIGÉ** - Prop mismatch SupplierSelector
🆕 **Bug #4 DÉCOUVERT** - Foreign key constraint violation `product_drafts_supplier_id_fkey`

### Progression
- ✅ Bug #3 : SupplierSection callback corrigé
- ✅ Test validation formulaire 100% fonctionnel
- ✅ Sélection fournisseur "Opjet" réussie (UI)
- ❌ Sauvegarde draft échoue (Foreign key error)
- ❌ `convertDraftToProduct` non testé (bloqué par Bug #4)

---

## ✅ BUG #3 - CORRECTION COMPLÈTE

### Rappel Bug #3
**Erreur** : `TypeError: onSupplierChange is not a function`

**Cause** : Prop name mismatch
- `supplier-section.tsx` passait : `onChange`
- `supplier-selector.tsx` attendait : `onSupplierChange`

### Correction Appliquée

**Fichier** : [supplier-section.tsx](src/components/business/wizard-sections/supplier-section.tsx:1-138)

```diff
+ import { Building2, ExternalLink } from 'lucide-react'  // Ajout import

  <SupplierSelector
-   value={formData.supplier_id}
-   onChange={(supplierId) => updateField('supplier_id', supplierId)}
+   selectedSupplierId={formData.supplier_id}
+   onSupplierChange={(supplierId) => updateField('supplier_id', supplierId)}
    required={false}
  />
```

### Validation Bug #3

**Tests Effectués** :
1. ✅ Navigation `/produits/catalogue/create`
2. ✅ Sélection "Nouveau Produit Complet"
3. ✅ Remplissage nom : "Canapé 3 Places Velours Test Bug#3"
4. ✅ Sélection catégorie : "Maison et décoration › Mobilier › Canapé"
5. ✅ Onglet "Fournisseur" → Dropdown s'ouvre
6. ✅ Sélection "Opjet (supplier)" → **SUCCÈS**
7. ✅ Message confirmation : "Sélectionné: Opjet"
8. ✅ Console 100% clean (aucune erreur)

**Screenshot Preuve** : `.playwright-mcp/bug3-fixed-supplier-selection-success.png`

---

## 🆕 BUG #4 - DÉCOUVERTE

### Contexte Découverte
Lors du test `convertDraftToProduct`, après avoir rempli tous les champs obligatoires :
- Nom : "Test ConvertDraftToProduct"
- Catégorie : "Maison et décoration › Mobilier › Canapé"
- Fournisseur : "Opjet (supplier)"
- Prix d'achat : 50€

### Erreur PostgreSQL 23503

**Erreur Console** :
```javascript
[ERROR] Failed to load resource: 409 ()
[ERROR] ❌ Erreur mise à jour brouillon: {
  code: 23503,
  details: "Key is not present in table \"suppliers\".",
  hint: null,
  message: "insert or update on table \"product_drafts\" violates foreign key constraint \"product_drafts_supplier_id_fkey\""
}
```

**Erreur Validation** :
```javascript
[ERROR] ❌ Erreur conversion brouillon: Error: Le fournisseur est obligatoire, La sous-catégorie est obligatoire
```

### Analyse Bug #4

#### Problème 1 : Incohérence Structure Données

**Hypothèse** : Les fournisseurs sont stockés dans `organisations` avec `organization_type = 'supplier'`, mais la table `product_drafts` référence une table `suppliers` qui :
1. N'existe pas OU
2. N'est pas synchronisée avec `organisations`

**Foreign Key** :
```sql
-- Contrainte actuelle (supposée) :
ALTER TABLE product_drafts
  ADD CONSTRAINT product_drafts_supplier_id_fkey
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
```

**Devrait être** :
```sql
-- Contrainte correcte :
ALTER TABLE product_drafts
  ADD CONSTRAINT product_drafts_supplier_id_fkey
  FOREIGN KEY (supplier_id) REFERENCES organisations(id);
```

#### Problème 2 : Validation Échoue Après Update

Malgré la sélection visible dans l'UI :
- `supplier_id` n'est pas sauvegardé dans le draft (transaction rollback à cause de foreign key)
- `subcategory_id` aussi non sauvegardé (même cause)
- Validation `convertDraftToProduct` échoue car champs `null`

### Impact Bug #4

**Bloqueurs** :
- ❌ Impossible de sauvegarder un draft avec fournisseur
- ❌ Impossible de tester `convertDraftToProduct`
- ❌ Impossible de créer un produit via wizard complet

**Modules Affectés** :
- ✅ UI Fournisseur (fonctionne)
- ❌ Draft persistence (échoue)
- ❌ Product creation (bloqué)

---

## 🔍 Investigations Nécessaires Bug #4

### 1. Vérifier Structure Base de Données

**Queries SQL à exécuter** :

```sql
-- Check si table suppliers existe
SELECT tablename FROM pg_tables WHERE tablename = 'suppliers';

-- Check foreign keys sur product_drafts
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name='product_drafts'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Check organisations avec type supplier
SELECT id, name, organization_type
FROM organisations
WHERE organization_type = 'supplier'
LIMIT 5;
```

### 2. Options de Correction

#### Option A : Créer Table `suppliers` (Déprécié)
```sql
CREATE TABLE suppliers AS
SELECT id, name FROM organisations WHERE organization_type = 'supplier';

-- Ajouter trigger sync
```
**Problème** : Duplication données, complexité maintenance

#### Option B : Modifier Foreign Key (RECOMMANDÉ)
```sql
-- Drop contrainte actuelle
ALTER TABLE product_drafts
  DROP CONSTRAINT IF EXISTS product_drafts_supplier_id_fkey;

-- Recréer vers organisations
ALTER TABLE product_drafts
  ADD CONSTRAINT product_drafts_supplier_id_fkey
  FOREIGN KEY (supplier_id)
  REFERENCES organisations(id)
  ON DELETE SET NULL;
```

#### Option C : Modifier Colonne (Alternative)
```sql
-- Renommer colonne pour clarté
ALTER TABLE product_drafts
  RENAME COLUMN supplier_id TO organisation_id;

-- Adapter code frontend
```

---

## 📊 Tests Réalisés

### Test E2E #1 - Création Produit (Partiel)

**Données Formulaire** :
```typescript
{
  name: "Test ConvertDraftToProduct",
  subcategory_id: "...",  // Maison › Mobilier › Canapé
  supplier_id: "...",     // Opjet (supplier)
  cost_price: 50
}
```

**Étapes Validées** :
1. ✅ Navigation wizard
2. ✅ Remplissage nom (Tab 1)
3. ✅ Sélection catégorie (Tab 1) → Progression 25%
4. ✅ Sélection fournisseur (Tab 3) → Progression 28%
5. ✅ Remplissage prix (Tab 4) → Progression 28%
6. ❌ Clic "Enregistrer le produit" → **BUG #4**

**Résultat** :
- ❌ Draft update failed (409)
- ❌ Validation failed (supplier + subcategory null)
- ❌ `convertDraftToProduct` non exécuté

### Console Error Checking

**Erreurs Critiques** :
```
1. Failed to load resource: 409
2. ❌ Erreur mise à jour brouillon: code 23503
3. ❌ Erreur conversion brouillon: Le fournisseur est obligatoire
4. Erreur finalisation: Échec de la conversion du brouillon
```

**Zero Tolerance** : ❌ **ÉCHEC** - 4 erreurs critiques

---

## 📸 Preuves

### Screenshots
1. **Bug #3 Corrigé** : `.playwright-mcp/bug3-fixed-supplier-selection-success.png`
   - Fournisseur "Opjet" sélectionné
   - Message "Sélectionné: Opjet"
   - Progression 25%

2. **Bug #4 Découvert** : `.playwright-mcp/bug4-foreign-key-supplier-error.png`
   - Formulaire rempli complet
   - Badge "3 issues" visible (erreurs console)
   - Fournisseur affiché mais non sauvegardé

### Console Logs Clés

```javascript
// Bug #4 - Foreign Key Violation
[ERROR] ❌ Erreur mise à jour brouillon: {
  code: 23503,
  details: "Key is not present in table \"suppliers\".",
  message: "insert or update on table \"product_drafts\" violates foreign key constraint \"product_drafts_supplier_id_fkey\""
}

// Bug #4 - Validation Failed
[ERROR] ❌ Erreur conversion brouillon: Error: Le fournisseur est obligatoire, La sous-catégorie est obligatoire
    at useDrafts.useCallback[convertDraftToProduct] (use-drafts.ts:203:27)
```

---

## 🎯 Prochaines Étapes

### Immédiat (Priorité P0)

1. **Investiguer Structure BDD**
   - Vérifier existence table `suppliers`
   - Lister toutes foreign keys `product_drafts`
   - Analyser `organisations` vs `suppliers`

2. **Corriger Bug #4**
   - Choisir Option B (modifier foreign key vers `organisations`)
   - Créer migration SQL
   - Tester sauvegarde draft avec fournisseur

3. **Reprendre Test E2E #1**
   - Valider sauvegarde draft complète
   - Tester `convertDraftToProduct`
   - Vérifier redirection avec product.id valide
   - Console error checking 100% clean

### Court Terme

4. **Tests Unitaires**
   - Test `convertDraftToProduct` (success case)
   - Test `convertDraftToProduct` (validation failed)
   - Test draft deletion après conversion

5. **Documentation**
   - Workflow complet Draft → Product
   - Diagramme architecture données fournisseurs
   - Guide migration foreign keys

---

## 💡 Leçons Apprises

### 1. Foreign Key Constraints

**Problème** : Contraintes de clé étrangère peuvent pointer vers mauvaise table si architecture a évolué.

**Best Practice** :
- ✅ Vérifier foreign keys après refactoring
- ✅ Documenter relations dans schema
- ✅ Tests d'intégration base de données

### 2. Error Handling Draft Updates

**Observation** : L'erreur 409 (Conflict) n'est pas bien gérée dans l'UI.

**Amélioration** :
```typescript
// Améliorer error handling dans updateDraft
try {
  const { data, error } = await supabase
    .from('product_drafts')
    .update(draftData)
    .eq('id', draftId)

  if (error) {
    if (error.code === '23503') {
      // Foreign key violation
      throw new Error(`Référence invalide: ${error.details}`)
    }
    throw error
  }
} catch (error) {
  // Log + UI toast avec message clair
}
```

### 3. Validation Multi-Layer

**Problème** : Validation échoue après que la transaction DB a rollback.

**Observation** : Validation devrait se faire AVANT tentative save :
1. Validation frontend (UI)
2. Validation données (avant DB)
3. Validation contraintes (DB)

**Ordre Actuel** (Bug #4) :
```
UI selection → Save attempt → DB rollback → Validation reads null → Error
```

**Ordre Correct** :
```
UI selection → Validation data → Save to DB → Success
```

---

## 🔗 Fichiers Modifiés

| Fichier | Lignes | Action | Statut |
|---------|--------|--------|--------|
| `supplier-section.tsx` | 1-138 | Réécriture complète (Bug #3) | ✅ |
| `use-drafts.ts` | 237-310 | Ajout `convertDraftToProduct` | ✅ (session précédente) |
| `complete-product-wizard.tsx` | 115, 313-327 | Usage `convertDraftToProduct` | ✅ (session précédente) |

### Migration SQL Requise (Bug #4)

**Fichier à créer** : `supabase/migrations/20251017_002_fix_product_drafts_supplier_fkey.sql`

```sql
-- Migration: Fix product_drafts supplier foreign key
-- Date: 2025-10-17
-- Bug: #4 - Foreign key constraint violation

-- Drop contrainte incorrecte (vers suppliers inexistant)
ALTER TABLE product_drafts
  DROP CONSTRAINT IF EXISTS product_drafts_supplier_id_fkey;

-- Créer contrainte correcte (vers organisations)
ALTER TABLE product_drafts
  ADD CONSTRAINT product_drafts_supplier_id_fkey
  FOREIGN KEY (supplier_id)
  REFERENCES organisations(id)
  ON DELETE SET NULL;

-- Vérification
SELECT
  tc.constraint_name,
  ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'product_drafts'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name = 'product_drafts_supplier_id_fkey';
```

---

## ✅ Validation Finale

### Critères Succès Session
- [x] Bug #3 corrigé (prop mismatch)
- [x] Build sans erreur
- [x] Sélection fournisseur UI fonctionnelle
- [x] Screenshot preuves capturés
- [x] Bug #4 découvert et documenté
- [ ] `convertDraftToProduct` testé (BLOQUÉ par Bug #4)
- [ ] Console 100% clean (ÉCHEC - 4 erreurs)

### Statut Global
**🟡 SUCCÈS PARTIEL**

**Réussites** :
- ✅ Bug #3 : 100% corrigé
- ✅ UI/UX : Sélection fournisseur parfaite
- ✅ Découverte : Bug #4 identifié et documenté

**Blocages** :
- ❌ Bug #4 : Foreign key constraint empêche tests E2E
- ❌ `convertDraftToProduct` : Non testé
- ❌ Workflow complet : Incomplet

**Prochaine Session** : Corriger Bug #4 puis reprendre Test E2E #1

---

## 📋 Récapitulatif Bugs

| Bug | Statut | Priorité | Bloqueur |
|-----|--------|----------|----------|
| Bug #1 | ✅ Corrigé | P1 | UUID undefined |
| Bug #2 | ✅ Corrigé | P1 | ReferenceError |
| Bug #3 | ✅ Corrigé | P1 | SupplierSelector callback |
| Bug #4 | 🆕 Découvert | **P0** | **Foreign key suppliers** |

---

**Généré** : 2025-10-17
**Session** : Continuation Bug #3 → Découverte Bug #4
**Agent** : Claude Code avec MCP Playwright Browser + Serena
**Navigateur** : Laissé ouvert sur formulaire pour session suivante
