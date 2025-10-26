# 📋 Règles Métier: Système de Variantes Produits

**Date Création**: 2025-09-26
**Dernière MAJ**: 2025-09-26
**Status**: ✅ Validé & Implémenté

---

## 🎯 DÉFINITION

Une **variante produit** est une déclinaison d'un produit existant qui partage les mêmes caractéristiques fondamentales (nom de base, dimensions, fournisseur) mais diffère par des attributs comme la couleur ou la matière.

### Cas d'Usage Typiques

- Mobilier décliné en plusieurs coloris (chaise noire/blanche/grise)
- Produits disponibles en différentes matières (chêne/noyer/pin)
- Décoration avec variantes de finition (mat/brillant/texturé)

---

## 🔑 RÈGLES FONDAMENTALES

### 1. Système Bidirectionnel

**Principe:** Toutes les variantes d'un même groupe se voient mutuellement.

**Exemple:**
```
Groupe "Fauteuil Scandinave":
├─ Variante A (Bleu): Voit B et C
├─ Variante B (Rose): Voit A et C
└─ Variante C (Vert): Voit A et B
```

**Implémentation:** Tous les produits du même `variant_group_id` sont affichés dans la section Variantes.

### 2. Affichage Catalogue

**Règle:** Chaque variante s'affiche **séparément** dans le catalogue produits.

- ✅ 3 variantes = 3 produits distincts dans le catalogue
- ✅ Chaque fiche produit affiche les autres variantes du groupe
- ✅ Navigation facile entre variantes via lien direct

**Rationale:** Permet au client de voir immédiatement toutes les options disponibles.

---

## 🏷️ RÈGLES DE NOMMAGE

### Format Automatique

**Template:** `{NOM_BASE} - {COULEUR} - {MATIÈRE}`

**Exemples:**
```
Nom de base: "Chaise Moderne"
├─ Variante 1: "Chaise Moderne - Noir"
├─ Variante 2: "Chaise Moderne - Blanc Cassé"
└─ Variante 3: "Chaise Moderne - Gris - Velours"
```

### Extraction Nom de Base

**Règle:** Le nom de base est le nom **avant le premier " - "**.

```typescript
// Exemple code
const baseName = product.name.split(' - ')[0]
// "Fauteuil Design - Bleu Canard" → "Fauteuil Design"
```

### Changement Automatique

**Règle:** Si un produit avec un nom différent est ajouté à un groupe de variantes existant, son nom est **automatiquement réécrit** pour correspondre au format du groupe.

**Exemple:**
```
Produit initial: "Ma Super Chaise"
Ajout au groupe: "Fauteuil Club" (variantes existantes)
→ Renommé en: "Fauteuil Club - Ma Super Chaise"
```

**Rationale:** Garantit la cohérence visuelle dans le catalogue.

---

## 📦 DONNÉES COPIÉES AUTOMATIQUEMENT

### Toujours Identiques (Non Modifiables)

Ces champs sont **automatiquement copiés** du produit parent et doivent être **identiques** pour toutes les variantes du groupe:

| Champ | Type | Règle | Justification |
|-------|------|-------|---------------|
| **Nom de base** | string | Identique | Cohérence catalogue |
| **dimensions_length** | float | Identique | Même encombrement |
| **dimensions_width** | float | Identique | Même encombrement |
| **dimensions_height** | float | Identique | Même encombrement |
| **dimensions_unit** | string | Identique | Cohérence mesures |
| **supplier_id** | UUID | Identique | Même source approvisionnement |
| **category_id** | UUID | Identique | Même classification |
| **subcategory_id** | UUID | Identique | Même classification |
| **base_cost** | decimal | Identique (par défaut) | Coût similaire |
| **selling_price** | decimal | Identique (par défaut) | Prix similaire |
| **technical_description** | text | Identique | Mêmes specs techniques |
| **brand** | string | Identique | Même fabricant |

### Copiés avec Possibilité de Variation

| Champ | Type | Règle | Notes |
|-------|------|-------|-------|
| **weight** | float | Copié (peut varier légèrement) | Poids peut différer légèrement selon matière |
| **weight_unit** | string | Copié | kg/g |
| **description** | text | Copiée ou remplacée | Si `additional_note` fournie |

### Propres à Chaque Variante

| Champ | Type | Règle | Usage |
|-------|------|-------|-------|
| **id** | UUID | Unique | Identifiant unique |
| **sku** | string | Généré | Format: `{PARENT_SKU}-V{POSITION}` |
| **variant_attributes** | JSONB | Unique | Stocke color, material |
| **variant_position** | integer | Unique | Position dans le groupe (1, 2, 3...) |
| **product_images** | relation | Unique | Chaque variante a ses propres images |

---

## 🎨 ATTRIBUTS DIFFÉRENCIANTS

### Champs Variant Attributes

Les seuls champs **modifiables** lors de la création d'une variante:

#### 1. **Couleur** (`color`)
- **Type:** string
- **Exemples:** "Noir", "Blanc Cassé", "Bleu Canard", "Rose Poudré"
- **Validation:** Aucune restriction (texte libre)
- **Affichage:** Badge coloré dans liste variantes

#### 2. **Matière** (`material`)
- **Type:** string
- **Exemples:** "Chêne Massif", "Métal Laqué", "Tissu Velours", "Rotin Naturel"
- **Validation:** Aucune restriction (texte libre)
- **Affichage:** Badge dans liste variantes

#### 3. **Note Additionnelle** (`additional_note`)
- **Type:** string (optionnel)
- **Usage:** Remplace le champ `description` si fourni
- **Exemples:** "Finition mate", "Assemblage à prévoir", "Coussin inclus"

### Validation

**Règle:** Au moins **couleur OU matière** doit être renseigné.

```typescript
// Valide
{ color: "Noir" }
{ material: "Chêne" }
{ color: "Blanc", material: "Métal" }

// Invalide (erreur)
{}
{ additional_note: "Note seule" }
```

---

## 🔢 SYSTÈME DE GROUPES

### Champs Database

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `variant_group_id` | UUID | NULL | Identifiant du groupe de variantes |
| `is_variant_parent` | boolean | false | Produit parent du groupe |
| `variant_position` | integer | 1 | Position dans le groupe |
| `variant_attributes` | JSONB | {} | Attributs différenciants |

### Création Groupe

**Scénario 1:** Produit sans groupe existant
1. Générer nouveau UUID pour `variant_group_id`
2. Mettre à jour produit parent:
   - `variant_group_id` = UUID généré
   - `is_variant_parent` = true
   - `variant_position` = 1
3. Créer variante avec:
   - `variant_group_id` = UUID du parent
   - `is_variant_parent` = false
   - `variant_position` = 2

**Scénario 2:** Produit avec groupe existant
1. Récupérer `max(variant_position)` du groupe
2. Créer variante avec:
   - `variant_group_id` = ID groupe existant
   - `is_variant_parent` = false
   - `variant_position` = max + 1

### Génération SKU

**Format:** `{SKU_PARENT}-V{POSITION}`

**Exemples:**
```
Parent: CHAIR-MOD-001 (position 1)
├─ Variante 1: CHAIR-MOD-001-V2
├─ Variante 2: CHAIR-MOD-001-V3
└─ Variante 3: CHAIR-MOD-001-V4
```

---

## 🚀 WORKFLOW CRÉATION

### Depuis Page Détail Produit

1. **Utilisateur clique "Créer Variante"**
2. **Modal affiche:**
   - Données copiées automatiquement (nom, dimensions, fournisseur)
   - Champs modifiables (couleur, matière)
   - Aperçu nom variante en temps réel
3. **Utilisateur saisit:**
   - Couleur: "Vert Forêt"
   - Matière: (optionnel)
4. **Aperçu:**
   ```
   Nom variante: "Fauteuil Club - Vert Forêt"
   SKU: CHAIR-001-V2 (généré automatiquement)
   ```
5. **Validation:**
   - ✅ Au moins couleur OU matière
   - ✅ Données copiées vérifiées
6. **Création:**
   - Appel API `/api/products/{id}/variants/create`
   - Insertion nouvelle variante
   - Rafraîchissement liste variantes

### Depuis Page Variantes (Future)

**TODO:** Interface de gestion groupes de variantes
- Créer nouveau groupe de variantes
- Ajouter produits existants à un groupe
- Modifier attributs variantes en masse
- Réorganiser ordre variantes (position)

---

## 🔗 INTÉGRATIONS

### Google Merchant Center

**Champ:** `item_group_id`
- Compatible avec système `variant_group_id`
- Permet groupement variantes dans Google Shopping
- Badge "Google Merchant" affiché dans UI

### Feeds Export

**Règle:** Chaque variante est exportée comme produit séparé avec:
- `item_group_id` = `variant_group_id`
- `color` = `variant_attributes.color`
- `material` = `variant_attributes.material`

---

## 📊 EXEMPLES COMPLETS

### Exemple 1: Fauteuil 3 Coloris

**Produit Parent:**
```json
{
  "id": "abc-123",
  "name": "Fauteuil Club Vintage",
  "sku": "CHAIR-CLUB-001",
  "supplier_id": "supplier-x",
  "dimensions_length": 80,
  "dimensions_width": 85,
  "dimensions_height": 95,
  "dimensions_unit": "cm",
  "selling_price": 450.00,
  "variant_group_id": "group-789",
  "is_variant_parent": true,
  "variant_position": 1
}
```

**Variante 1 (Bleu Canard):**
```json
{
  "id": "def-456",
  "name": "Fauteuil Club Vintage - Bleu Canard",
  "sku": "CHAIR-CLUB-001-V2",
  "supplier_id": "supplier-x",
  "dimensions_length": 80,
  "dimensions_width": 85,
  "dimensions_height": 95,
  "dimensions_unit": "cm",
  "selling_price": 450.00,
  "variant_group_id": "group-789",
  "is_variant_parent": false,
  "variant_position": 2,
  "variant_attributes": {
    "color": "Bleu Canard"
  }
}
```

**Variante 2 (Rose Poudré - Velours):**
```json
{
  "id": "ghi-789",
  "name": "Fauteuil Club Vintage - Rose Poudré - Velours",
  "sku": "CHAIR-CLUB-001-V3",
  "supplier_id": "supplier-x",
  "dimensions_length": 80,
  "dimensions_width": 85,
  "dimensions_height": 95,
  "dimensions_unit": "cm",
  "selling_price": 475.00,
  "variant_group_id": "group-789",
  "is_variant_parent": false,
  "variant_position": 3,
  "variant_attributes": {
    "color": "Rose Poudré",
    "material": "Velours"
  }
}
```

---

## ⚠️ CONTRAINTES & LIMITES

### Contraintes Techniques

1. **Dimensions Toujours Identiques**
   - Les 3 dimensions (L × l × H) doivent être strictement identiques
   - Pas de variante "grande taille" vs "petite taille"
   - Si dimensions différentes → produits séparés, pas variantes

2. **Fournisseur Toujours Identique**
   - Impossible de mixer fournisseurs dans un groupe
   - Si changement fournisseur → nouveau produit, pas variante

3. **SKU Unique Global**
   - Format `{PARENT}-V{N}` garantit unicité
   - Ne pas modifier SKU manuellement après création

### Limites Business

1. **Pas de Variantes de Variantes**
   - Structure plate: 1 groupe → N variantes
   - Pas de hiérarchie multi-niveaux

2. **Modifications Post-Création**
   - Changer `variant_attributes` possible
   - Changer dimensions/fournisseur → recréer produit

3. **Suppression Groupe**
   - Supprimer produit parent ne supprime PAS variantes
   - Variantes deviennent produits indépendants
   - TODO: Implémenter cascade ou warning

---

## 🔄 MISES À JOUR FUTURES

### Roadmap Phase 3 (Suite)

- [ ] Interface gestion groupes variantes (page dédiée)
- [ ] Ajout produits existants à groupe
- [ ] Réorganisation ordre variantes
- [ ] Modification attributs en masse
- [ ] Export/Import variantes CSV

### Roadmap Phase 5

- [ ] Variantes avec prix différenciés par marketplace
- [ ] Variantes avec stocks différenciés par entrepôt
- [ ] Variantes avec remises spécifiques

---

**Dernière Révision:** 2025-09-26
**Implémenté Dans:**
- `src/components/business/variant-creation-modal.tsx`
- `src/app/api/products/[productId]/variants/create/route.ts`
- `src/components/business/product-variants-section.tsx`

**Documentation Technique:** `MEMORY-BANK/sessions/2025-09-26-phase3-variant-system-complete.md`