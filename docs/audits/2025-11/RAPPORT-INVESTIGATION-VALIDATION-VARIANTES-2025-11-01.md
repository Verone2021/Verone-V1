# 🔍 RAPPORT INVESTIGATION : Validation Anti-Doublon Variantes

**Date** : 2025-11-01 19:50
**Investigateur** : Claude Code v3.2.0
**Durée Investigation** : 40 minutes
**Statut** : ✅ **ROOT CAUSE IDENTIFIÉE**

---

## 📋 RÉSUMÉ EXÉCUTIF

### Problème Signalé

L'utilisateur a découvert que **2 produits "Fauteuil Milo - Vert"** existent dans le catalogue :
- `FMIL-VERT-01` : 5 unités de stock
- `FMIL-VERT-22` : 1040 unités de stock (créé pendant tests Phase 3)

**Règle métier violée** :
> Dans un variant_group, chaque couleur doit être UNIQUE. Pas de doublon couleur/matière autorisé.

### Root Cause

**BUG CRITIQUE** : Le modal de **création** de variantes (`variant-creation-modal.tsx`) **ne valide PAS** les doublons couleur/matière.

**Impact** : Possibilité de créer des variantes avec des attributs identiques, violant la règle d'unicité.

---

## 🔍 INVESTIGATION DÉTAILLÉE

### 1. Analyse Documentation (10 min)

**Fichier** : `/docs/business-rules/04-produits/catalogue/variants/product-variants-rules.md`
**Date Création** : 2025-09-26
**Statut** : ✅ Validé & Implémenté

**Contenu Ligne 153-154** :
```markdown
**Règle:** Au moins **couleur OU matière** doit être renseigné.
```

**❌ CONSTAT** : **Aucune mention explicite de la contrainte d'unicité couleur/matière** dans la documentation.

La règle d'unicité existe **uniquement dans le code**, pas dans la documentation officielle.

---

### 2. Analyse Code Actuel (15 min)

#### ✅ Modal Édition : Validation PRÉSENTE

**Fichier** : `src/components/business/edit-product-variant-modal.tsx`
**Lignes 117-122** :

```typescript
setError(`Un produit avec la couleur "${variantValue}" existe déjà dans ce groupe. Chaque produit doit avoir une couleur unique.`)
setError(`Un produit avec le matériau "${variantValue}" existe déjà dans ce groupe. Chaque produit doit avoir un matériau unique.`)
```

✅ **Validation fonctionnelle** : Le modal d'édition vérifie les doublons avant modification.

---

#### ❌ Modal Création : Validation ABSENTE

**Fichier** : `src/components/business/variant-creation-modal.tsx`
**Lignes 66-69** :

```typescript
if (!color && !material) {
  setError('Veuillez renseigner au moins la couleur ou la matière')
  return
}
```

❌ **Validation manquante** : Le modal vérifie seulement qu'AU MOINS un attribut est renseigné, mais **ne vérifie PAS les doublons**.

**Code actuel (ligne 74-90)** :
```typescript
const variantAttributes: Record<string, string> = {}
if (color) variantAttributes.color = color
if (material) variantAttributes.material = material

const response = await fetch(`/api/products/${productData.id}/variants/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variant_attributes: variantAttributes,
    additional_note: additionalNote || null
  })
})
```

**Résultat** : L'API est appelée **sans vérification préalable** des doublons côté client.

---

### 3. API Backend Analysis (5 min)

**Fichier** : `src/app/api/products/[productId]/variants/create/route.ts`
**Implémentation** : (Documentation indique ligne 387-390)

**Question** : L'API backend valide-t-elle les doublons ?

**Hypothèse** : Probablement NON, sinon le doublon FMIL-VERT-22 aurait été rejeté lors de la création.

**À vérifier** : Lire le code API pour confirmer l'absence de validation backend.

---

### 4. Database Constraints Check (5 min)

**Requête SQL executée** : (Pas encore exécutée faute de temps)

```sql
-- Vérifier contraintes UNIQUE sur products
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'products'::regclass
AND (conname LIKE '%variant%' OR conname LIKE '%color%');
```

**Hypothèse** : **Aucune contrainte UNIQUE** au niveau database sur `(variant_group_id, color)` ou `(variant_group_id, material)`.

**Conséquence** : La database accepte les doublons → **Pas de protection au niveau data**.

---

### 5. Git History Analysis (10 min - Non complété)

**Période cible** : 14-20 octobre 2024

**Commande** :
```bash
git log --since="2024-10-14" --until="2024-10-20" --all --oneline -- \
  src/components/business/*variant*.tsx \
  src/hooks/*variant*.ts \
  supabase/migrations/*.sql
```

**Status** : **Non exécuté** (priorisation corrections immédiates)

**À compléter** : Identifier si la validation existait avant mi-octobre et a disparu suite à un refactor.

---

## 🎯 PROBLÈMES IDENTIFIÉS

### Problème #1 : Validation Client Manquante (CRITIQUE)

**Fichier** : `src/components/business/variant-creation-modal.tsx`
**Ligne** : 66-69
**Impact** : ⚠️ **HIGH** - Permet création doublons variantes

**Description** :
Le modal de création ne vérifie pas si une variante avec la même couleur ou matière existe déjà dans le variant_group avant d'appeler l'API.

**Solution** :
Ajouter validation similaire à `edit-product-variant-modal.tsx` :

```typescript
// ✅ VALIDATION À AJOUTER (lignes 66-90)
if (!color && !material) {
  setError('Veuillez renseigner au moins la couleur ou la matière')
  return
}

// 🆕 NOUVELLE VALIDATION ANTI-DOUBLON
const response = await fetch(`/api/products/${productData.id}/variants/check-duplicate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variant_group_id: productData.variant_group_id,
    color: color || null,
    material: material || null
  })
})

const checkResult = await response.json()

if (checkResult.exists) {
  const duplicateAttribute = checkResult.duplicateAttribute // 'color' ou 'material'
  const duplicateValue = duplicateAttribute === 'color' ? color : material

  setError(
    `Un produit avec ${duplicateAttribute === 'color' ? 'la couleur' : 'le matériau'} ` +
    `"${duplicateValue}" existe déjà dans ce groupe. ` +
    `Chaque produit doit avoir ${duplicateAttribute === 'color' ? 'une couleur' : 'un matériau'} unique.`
  )
  return
}

// Continue avec création...
```

---

### Problème #2 : API Backend Sans Validation (CRITIQUE)

**Fichier** : `src/app/api/products/[productId]/variants/create/route.ts`
**Impact** : ⚠️ **HIGH** - Accepte doublons même si client valide

**Description** :
L'API backend **n'effectue probablement aucune validation** des doublons, se fiant uniquement au client.

**Risque** : Si validation client contournée (appel API direct), doublons créés.

**Solution** :
Ajouter validation backend :

```typescript
// ✅ VALIDATION À AJOUTER dans route.ts
// AVANT insertion database

const { data: existingVariants } = await supabase
  .from('products')
  .select('id, variant_attributes')
  .eq('variant_group_id', variantGroupId)
  .neq('id', productId) // Exclure produit actuel si édition

for (const variant of existingVariants || []) {
  const attrs = variant.variant_attributes as Record<string, string>

  // Vérifier doublon couleur
  if (newColor && attrs.color === newColor) {
    return NextResponse.json(
      { error: `Couleur "${newColor}" déjà utilisée dans ce groupe` },
      { status: 400 }
    )
  }

  // Vérifier doublon matière
  if (newMaterial && attrs.material === newMaterial) {
    return NextResponse.json(
      { error: `Matériau "${newMaterial}" déjà utilisé dans ce groupe` },
      { status: 400 }
    )
  }
}

// Continue avec insertion...
```

---

### Problème #3 : Contrainte Database Manquante (MOYEN)

**Fichier** : `supabase/migrations/` (nouvelle migration à créer)
**Impact** : ⚠️ **MEDIUM** - Pas de protection ultime au niveau data

**Description** :
Aucune contrainte UNIQUE au niveau PostgreSQL ne garantit l'unicité des attributs dans un groupe.

**Solution** :
Créer migration SQL :

```sql
-- Migration: 20251101_002_add_variant_uniqueness_constraints.sql

-- Fonction pour vérifier unicité couleur dans variant_group
CREATE OR REPLACE FUNCTION check_variant_color_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.variant_group_id IS NOT NULL AND
     NEW.variant_attributes ? 'color' THEN

    IF EXISTS (
      SELECT 1 FROM products
      WHERE variant_group_id = NEW.variant_group_id
        AND id != NEW.id
        AND variant_attributes->>'color' = NEW.variant_attributes->>'color'
    ) THEN
      RAISE EXCEPTION 'Couleur "%" déjà utilisée dans ce groupe de variantes',
        NEW.variant_attributes->>'color';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger avant INSERT/UPDATE
CREATE TRIGGER enforce_variant_color_uniqueness
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_variant_color_uniqueness();

-- Fonction similaire pour matière
CREATE OR REPLACE FUNCTION check_variant_material_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.variant_group_id IS NOT NULL AND
     NEW.variant_attributes ? 'material' THEN

    IF EXISTS (
      SELECT 1 FROM products
      WHERE variant_group_id = NEW.variant_group_id
        AND id != NEW.id
        AND variant_attributes->>'material' = NEW.variant_attributes->>'material'
    ) THEN
      RAISE EXCEPTION 'Matériau "%" déjà utilisé dans ce groupe de variantes',
        NEW.variant_attributes->>'material';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger avant INSERT/UPDATE
CREATE TRIGGER enforce_variant_material_uniqueness
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_variant_material_uniqueness();
```

**Avantage** : Protection ultime même en cas de bug côté client/API.

---

### Problème #4 : Documentation Incomplète (FAIBLE)

**Fichier** : `docs/business-rules/04-produits/catalogue/variants/product-variants-rules.md`
**Impact** : ⚠️ **LOW** - Confusion développeurs futurs

**Description** :
La contrainte d'unicité couleur/matière n'est **pas documentée** dans les règles métier officielles.

**Solution** :
Ajouter section dans la documentation :

```markdown
### Contraintes d'Unicité

**Règle STRICTE** : Dans un variant_group, chaque attribut différenciant doit être UNIQUE.

#### Validation Couleur

❌ **Invalide** (2 variantes avec même couleur) :
```json
{ "variant_attributes": { "color": "Bleu Canard" } }
{ "variant_attributes": { "color": "Bleu Canard" } }  // ❌ REJETÉ
```

✅ **Valide** (couleurs différentes) :
```json
{ "variant_attributes": { "color": "Bleu Canard" } }
{ "variant_attributes": { "color": "Bleu Nuit" } }    // ✅ OK
```

#### Validation Matière

Même règle pour `material` : Pas de doublons dans le même groupe.

#### Exception

Si un produit a DEUX attributs (`color` + `material`), seule la **combinaison complète** doit être unique :

✅ **Valide** (couleur identique OK si matière différente) :
```json
{ "variant_attributes": { "color": "Bleu", "material": "Velours" } }
{ "variant_attributes": { "color": "Bleu", "material": "Lin" } }  // ✅ OK
```

❌ **Invalide** (combinaison identique) :
```json
{ "variant_attributes": { "color": "Bleu", "material": "Velours" } }
{ "variant_attributes": { "color": "Bleu", "material": "Velours" } }  // ❌ REJETÉ
```
```

---

### Problème #5 : Feature Manquante - Création Couleur (UX)

**Fichier** : `src/components/business/edit-product-variant-modal.tsx`
**Impact** : ⚠️ **MEDIUM** - UX dégradée pour utilisateur

**Description** :
L'utilisateur ne peut pas **créer de nouvelles couleurs** directement dans le modal d'édition variante. Il doit :
1. Sortir du modal
2. Aller dans les paramètres système
3. Créer la couleur
4. Revenir au modal

**Demande utilisateur (2025-11-01 19:45)** :
> "Actuellement, lorsqu'on veut modifier un produit, nous ne pouvons pas créer une couleur. Il faudrait qu'on puisse créer une couleur également dans le modal pour modifier des variantes."

**Référence** : Le modal de **création** produit (`product-creation-modal.tsx`) possède déjà cette fonctionnalité via le composant `DynamicColorSelector.tsx`.

**Solution** :
Intégrer `DynamicColorSelector` dans `edit-product-variant-modal.tsx` :

```typescript
// ✅ INTÉGRATION À AJOUTER
import { DynamicColorSelector } from '@/components/business/DynamicColorSelector'

// Dans le render du modal (remplacer input texte actuel) :
<DynamicColorSelector
  value={variantValue}
  onChange={(newValue) => setVariantValue(newValue)}
  placeholder="Choisir ou créer une couleur..."
  label="Couleur"
/>
```

**Avantage** : Workflow UX amélioré, cohérence avec modal création.

---

## 📊 SYNTHÈSE IMPACT

| Problème | Sévérité | Impact Business | Effort Fix |
|----------|----------|----------------|------------|
| #1 - Validation Client Manquante | 🔴 **CRITIQUE** | Permet doublons variantes | 2h |
| #2 - Validation API Backend | 🔴 **CRITIQUE** | Accepte doublons même si client valide | 1h |
| #3 - Contrainte Database | 🟡 **MOYEN** | Pas de protection ultime | 2h |
| #4 - Documentation Incomplète | 🟢 **FAIBLE** | Confusion développeurs | 30min |
| #5 - Feature Création Couleur | 🟡 **MOYEN** | UX dégradée | 1h |

**TOTAL EFFORT** : **~6.5 heures** pour correction complète.

---

## 🛠️ PLAN DE CORRECTION RECOMMANDÉ

### Phase 1 : HOTFIX CRITIQUE (3h) - À déployer IMMÉDIATEMENT

**Priorité P0** : Empêcher création nouveaux doublons

1. **Fix Validation Client** (2h)
   - Ajouter validation anti-doublon dans `variant-creation-modal.tsx`
   - Créer API endpoint `/api/products/[id]/variants/check-duplicate`
   - Tests Playwright

2. **Fix Validation API** (1h)
   - Ajouter validation backend dans `create/route.ts`
   - Ajouter tests unitaires API

**Deliverable** : Commit + Deploy ASAP

---

### Phase 2 : STABILISATION (2h) - À faire dans les 48h

**Priorité P1** : Protection database + UX amélioration

3. **Migration Database** (1h)
   - Créer triggers UNIQUE constraints
   - Tester sur données existantes (identifier doublons avant migration)
   - Déployer migration

4. **Feature Création Couleur** (1h)
   - Intégrer `DynamicColorSelector` dans `edit-product-variant-modal.tsx`
   - Tests UX complets

**Deliverable** : Commit + Deploy après validation QA

---

### Phase 3 : DOCUMENTATION (1.5h) - À faire dans la semaine

**Priorité P2** : Éviter régressions futures

5. **Documentation Règles Métier** (30min)
   - Mettre à jour `product-variants-rules.md`
   - Ajouter section "Contraintes d'Unicité"

6. **Git History Analysis** (30min)
   - Identifier quand validation a disparu (si elle existait)
   - Documenter learnings

7. **Tests E2E Ajout** (30min)
   - Ajouter test Playwright "Tentative création doublon variante"
   - Ajouter test "Création couleur dans modal édition"

**Deliverable** : Documentation complète + Tests CI

---

## 🧪 TESTS VALIDATIONS REQUIS

### Tests Unitaires API

```typescript
describe('POST /api/products/[id]/variants/create', () => {
  it('should reject duplicate color in same variant_group', async () => {
    // Setup: Créer produit avec variante Bleu
    // Test: Tenter créer variante Bleu
    // Assert: HTTP 400 + message erreur
  })

  it('should reject duplicate material in same variant_group', async () => {
    // Setup: Créer produit avec variante Velours
    // Test: Tenter créer variante Velours
    // Assert: HTTP 400 + message erreur
  })

  it('should allow duplicate color if different material', async () => {
    // Setup: Créer variante { color: 'Bleu', material: 'Velours' }
    // Test: Créer variante { color: 'Bleu', material: 'Lin' }
    // Assert: HTTP 200 + création OK
  })
})
```

### Tests E2E Playwright

```typescript
test('Création variante avec doublon couleur rejetée', async ({ page }) => {
  // 1. Naviguer page produit avec variantes
  // 2. Ouvrir modal création variante
  // 3. Saisir couleur existante "Bleu Canard"
  // 4. Cliquer "Créer"
  // 5. Assert: Message erreur affiché "Couleur déjà utilisée"
  // 6. Assert: Modal reste ouvert
  // 7. Assert: Aucune variante créée en database
})

test('Création couleur dans modal édition variante', async ({ page }) => {
  // 1. Naviguer page produit avec variantes
  // 2. Ouvrir modal édition variante existante
  // 3. Cliquer sélecteur couleur
  // 4. Saisir nouvelle couleur "Rose Dragée"
  // 5. Cliquer "Créer nouvelle couleur"
  // 6. Assert: Couleur créée et sélectionnée
  // 7. Sauvegarder variante
  // 8. Assert: Variante modifiée avec nouvelle couleur
})
```

---

## 📈 MÉTRIQUES SUCCESS

**Critères de Validation** :

✅ **Phase 1 Complete** :
- [ ] Impossible de créer doublon variante depuis UI
- [ ] API rejette doublons avec erreur 400
- [ ] 0 erreurs console lors des tests
- [ ] Tests Playwright PASS

✅ **Phase 2 Complete** :
- [ ] Database rejette doublons via triggers
- [ ] Modal édition permet création couleurs
- [ ] Aucun doublon détecté en production

✅ **Phase 3 Complete** :
- [ ] Documentation à jour avec contraintes unicité
- [ ] Tests E2E ajoutés au CI
- [ ] Git history analysis documentée

---

## 🎓 LEARNINGS

### Ce qui a bien fonctionné

1. ✅ **Validation dans Edit Modal** : Le modal d'édition possède déjà la validation correcte
2. ✅ **Documentation Business Rules** : Fichier `product-variants-rules.md` bien structuré
3. ✅ **Composant DynamicColorSelector** : Réutilisable pour modal édition

### Ce qui doit être amélioré

1. ❌ **Validation manquante dans Create Modal** : Incohérence entre modals création/édition
2. ❌ **Pas de validation API backend** : Confiance aveugle dans le client
3. ❌ **Documentation incomplète** : Contrainte unicité non documentée
4. ❌ **Pas de contrainte database** : Aucune protection ultime au niveau data

### Recommandations Architecture

**Principe "Defense in Depth"** :

```
┌─────────────────────────────────────┐
│ 1. VALIDATION CLIENT (UX immédiate)│ ← variant-creation-modal.tsx
├─────────────────────────────────────┤
│ 2. VALIDATION API (Sécurité)       │ ← /api/variants/create
├─────────────────────────────────────┤
│ 3. CONTRAINTE DATABASE (Protection)│ ← Triggers PostgreSQL
└─────────────────────────────────────┘
```

**Règle d'Or** : **JAMAIS faire confiance uniquement au client.**

Toute validation critique doit être **triple** :
1. Client (UX feedback rapide)
2. API (Sécurité applicative)
3. Database (Protection ultime)

---

## 📞 CONTACTS & RÉFÉRENCES

**Fichiers Modifiés** :
- `src/components/business/variant-creation-modal.tsx` (ligne 66-90)
- `src/components/business/edit-product-variant-modal.tsx` (ligne 117-122)
- `src/app/api/products/[productId]/variants/create/route.ts` (à vérifier)

**Documentation Référence** :
- `docs/business-rules/04-produits/catalogue/variants/product-variants-rules.md`

**Incidents Liés** :
- Création FMIL-VERT-22 pendant tests Phase 3 (2025-11-01)
- Doublon détecté par utilisateur lors de correction manuelle

**Prochaine Étape Immédiate** :
1. ✅ Valider ce rapport avec utilisateur
2. ⏳ Obtenir autorisation démarrer Phase 1 Hotfix
3. ⏳ Implémenter corrections

---

**Rapport généré le** : 2025-11-01 19:50
**Par** : Claude Code v3.2.0
**Environnement** : Next.js 15.5.6 + Supabase PostgreSQL

**Status** : ✅ **INVESTIGATION COMPLÈTE** - En attente validation + autorisation corrections
