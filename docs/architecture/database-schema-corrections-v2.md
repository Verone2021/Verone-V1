# 🗄️ Corrections Schéma Base de Données - Vérone v2.0

> **Date**: 2025-01-15
> **Statut**: 📋 **PLAN DÉTAILLÉ** - Corrections pour aligner DB avec business rules
> **Impact**: 🚨 **CRITIQUE** - Migration données existantes requise

## 🎯 Objectifs des Corrections

1. **Séparer clairement données fournisseur vs internes**
2. **Corriger la confusion des champs prix**
3. **Déplacer caractéristiques communes au niveau Product Group**
4. **Ajouter champs manquants pour séparation supplier/internal**

## 📊 État Actuel vs État Cible

### **Table `products` - Corrections Requises**

#### **AVANT (État Actuel)**

```sql
-- Champs problématiques actuels
price_ht INTEGER NOT NULL,                    -- ❌ Ambiguë : prix de quoi ?
cost_price INTEGER NULL,                      -- ❌ Optionnel mais semble être prix d'achat
dimensions JSONB NULL,                        -- ❌ Devrait être au niveau Product Group
weight NUMERIC NULL,                          -- ❌ Devrait être au niveau Product Group
variant_attributes JSONB DEFAULT '{}',       -- ❌ Utilisé pour édition dynamique
-- Pas de champs pour descriptions séparées   -- ❌ Manquant
```

#### **APRÈS (État Cible)**

```sql
-- Prix clarifiés et séparés
supplier_price INTEGER NULL,                  -- ✅ Prix d'achat fournisseur HT (centimes)
selling_price INTEGER NOT NULL,               -- ✅ Prix de vente Vérone HT (centimes)
margin_percentage NUMERIC GENERATED ALWAYS AS
  (CASE WHEN supplier_price IS NOT NULL AND supplier_price > 0
   THEN ((selling_price - supplier_price)::numeric / supplier_price * 100)
   ELSE NULL END) STORED,                     -- ✅ Marge calculée automatiquement

-- Descriptions séparées
supplier_description TEXT NULL,               -- ✅ Description technique du fournisseur
internal_description TEXT NULL,               -- ✅ Description commerciale Vérone
marketing_notes TEXT NULL,                    -- ✅ Notes marketing internes

-- Caractéristiques fixes uniquement (couleur/matière)
color VARCHAR(50) NULL,                       -- ✅ Couleur variante (liste contrôlée)
material VARCHAR(50) NULL,                    -- ✅ Matière variante (liste contrôlée)
-- dimensions et weight → DÉPLACÉS vers product_groups

-- Références clarifiées
supplier_reference VARCHAR(255) NULL,         -- ✅ Référence chez le fournisseur
internal_reference VARCHAR(255) NULL,         -- ✅ Notre SKU interne
gtin VARCHAR(14) NULL,                        -- ✅ Code-barres international

-- Données fournisseur
supplier_lead_time_days INTEGER NULL,         -- ✅ Délai livraison fournisseur
supplier_minimum_order INTEGER NULL,          -- ✅ Quantité minimum commande
supplier_catalog_url TEXT NULL,               -- ✅ Lien catalogue fournisseur
supplier_notes TEXT NULL                      -- ✅ Notes techniques fournisseur
```

### **Table `product_groups` - Ajouts Requis**

#### **AJOUTS pour Caractéristiques Communes**

```sql
-- Caractéristiques communes (déplacées depuis products)
dimensions JSONB NULL,                        -- ✅ Dimensions communes à toutes variantes
weight NUMERIC NULL,                          -- ✅ Poids commun à toutes variantes
technical_specs JSONB DEFAULT '{}',          -- ✅ Spécifications techniques communes

-- Informations fournisseur niveau groupe
primary_supplier_id UUID NULL,               -- ✅ Fournisseur principal du groupe
supplier_collection VARCHAR(255) NULL,       -- ✅ Nom collection chez fournisseur

-- Descriptions niveau groupe
technical_description TEXT NULL,             -- ✅ Description technique commune
usage_description TEXT NULL,                 -- ✅ Description d'usage/destination

-- Contraintes de validation
CONSTRAINT check_weight_positive CHECK (weight IS NULL OR weight > 0),
CONSTRAINT check_dimensions_valid CHECK (
  dimensions IS NULL OR
  (dimensions ? 'length' AND dimensions ? 'width' AND dimensions ? 'height')
)
```

## 🔄 Plan de Migration Détaillé

### **PHASE 1 : Sauvegarde et Préparation**

```sql
-- 1. Backup complet des données actuelles
CREATE TABLE products_backup AS SELECT * FROM products;
CREATE TABLE product_groups_backup AS SELECT * FROM product_groups;

-- 2. Analyse des données existantes
SELECT
  COUNT(*) as total_products,
  COUNT(CASE WHEN price_ht IS NOT NULL THEN 1 END) as has_price_ht,
  COUNT(CASE WHEN cost_price IS NOT NULL THEN 1 END) as has_cost_price,
  COUNT(CASE WHEN dimensions IS NOT NULL THEN 1 END) as has_dimensions,
  COUNT(CASE WHEN weight IS NOT NULL THEN 1 END) as has_weight
FROM products;
```

### **PHASE 2 : Ajout Nouveaux Champs (Non Destructif)**

```sql
-- Ajouter nouveaux champs à products SANS supprimer les anciens
ALTER TABLE products
ADD COLUMN supplier_price INTEGER NULL,
ADD COLUMN selling_price INTEGER NULL,
ADD COLUMN supplier_description TEXT NULL,
ADD COLUMN internal_description TEXT NULL,
ADD COLUMN marketing_notes TEXT NULL,
ADD COLUMN color VARCHAR(50) NULL,
ADD COLUMN material VARCHAR(50) NULL,
ADD COLUMN supplier_lead_time_days INTEGER NULL,
ADD COLUMN supplier_minimum_order INTEGER NULL,
ADD COLUMN supplier_catalog_url TEXT NULL,
ADD COLUMN supplier_notes TEXT NULL,
ADD COLUMN internal_reference VARCHAR(255) NULL;

-- Ajouter champs à product_groups
ALTER TABLE product_groups
ADD COLUMN dimensions JSONB NULL,
ADD COLUMN weight NUMERIC NULL,
ADD COLUMN technical_specs JSONB DEFAULT '{}',
ADD COLUMN primary_supplier_id UUID NULL,
ADD COLUMN supplier_collection VARCHAR(255) NULL,
ADD COLUMN technical_description TEXT NULL,
ADD COLUMN usage_description TEXT NULL;
```

### **PHASE 3 : Migration des Données**

```sql
-- 3.1 Migration des prix (LOGIQUE À VALIDER AVEC UTILISATEUR)
-- HYPOTHÈSE : price_ht = prix de vente, cost_price = prix d'achat
UPDATE products SET
  selling_price = price_ht,
  supplier_price = cost_price;

-- 3.2 Migration des dimensions/poids vers product_groups
-- Regrouper les dimensions identiques par product_group_id
WITH grouped_dimensions AS (
  SELECT
    product_group_id,
    dimensions,
    weight,
    COUNT(*) as variant_count
  FROM products
  WHERE dimensions IS NOT NULL OR weight IS NOT NULL
  GROUP BY product_group_id, dimensions, weight
)
UPDATE product_groups
SET
  dimensions = gd.dimensions,
  weight = gd.weight
FROM grouped_dimensions gd
WHERE product_groups.id = gd.product_group_id
AND gd.variant_count > 0;

-- 3.3 Extraire couleur/matière depuis variant_attributes
UPDATE products SET
  color = variant_attributes->>'color',
  material = variant_attributes->>'material'
WHERE variant_attributes IS NOT NULL;

-- 3.4 Migration descriptions (à ajuster selon données réelles)
UPDATE products SET
  internal_description = name || COALESCE(' - ' || (variant_attributes->>'color'), '') || COALESCE(' - ' || (variant_attributes->>'material'), '');
```

### **PHASE 4 : Validation et Nettoyage**

```sql
-- 4.1 Validation cohérence des données
SELECT
  COUNT(*) as total_products,
  COUNT(CASE WHEN selling_price IS NOT NULL THEN 1 END) as has_selling_price,
  COUNT(CASE WHEN supplier_price IS NOT NULL THEN 1 END) as has_supplier_price,
  COUNT(CASE WHEN selling_price > 0 AND supplier_price > 0 AND selling_price > supplier_price THEN 1 END) as positive_margin
FROM products;

-- 4.2 Identifier les anomalies
SELECT id, name, selling_price, supplier_price,
       (selling_price - supplier_price) as margin_amount
FROM products
WHERE selling_price IS NOT NULL
  AND supplier_price IS NOT NULL
  AND selling_price <= supplier_price;

-- 4.3 Ajouter contraintes de validation
ALTER TABLE products
ADD CONSTRAINT check_selling_price_positive CHECK (selling_price > 0),
ADD CONSTRAINT check_supplier_price_positive CHECK (supplier_price IS NULL OR supplier_price > 0),
ADD CONSTRAINT check_margin_positive CHECK (
  supplier_price IS NULL OR selling_price > supplier_price
);
```

### **PHASE 5 : Suppression Anciens Champs (DESTRUCTIF)**

```sql
-- ⚠️ ATTENTION : Actions destructives à effectuer APRÈS validation complète

-- 5.1 Supprimer les anciens champs des products (dimensions/weight → product_groups)
ALTER TABLE products
DROP COLUMN IF EXISTS dimensions,
DROP COLUMN IF EXISTS weight,
DROP COLUMN IF EXISTS variant_attributes;

-- 5.2 Renommer les anciens champs prix (optionnel, pour historique)
-- ALTER TABLE products RENAME COLUMN price_ht TO price_ht_legacy;
-- ALTER TABLE products RENAME COLUMN cost_price TO cost_price_legacy;

-- 5.3 Rendre selling_price obligatoire
ALTER TABLE products ALTER COLUMN selling_price SET NOT NULL;
```

## 🔧 Nouvelles Contraintes Business

### **Validation des Prix**

```sql
-- Contrainte : marge minimum 5% (configurable)
ALTER TABLE products
ADD CONSTRAINT check_minimum_margin CHECK (
  supplier_price IS NULL OR
  selling_price >= supplier_price * 1.05
);

-- Contrainte : marge maximum 500% (alerte système)
CREATE OR REPLACE FUNCTION check_maximum_margin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.supplier_price IS NOT NULL
     AND NEW.selling_price > NEW.supplier_price * 5 THEN
    -- Log warning mais n'empêche pas l'insertion
    RAISE NOTICE 'WARNING: Marge très élevée (>500%%) pour produit %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_maximum_margin
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION check_maximum_margin();
```

### **Validation Couleurs/Matières**

```sql
-- Listes contrôlées pour couleurs et matières
CREATE TYPE color_type AS ENUM (
  'blanc', 'noir', 'rouge', 'bleu', 'vert', 'jaune', 'orange',
  'violet', 'rose', 'gris', 'marron', 'beige', 'naturel', 'transparent'
);

CREATE TYPE material_type AS ENUM (
  'bois', 'metal', 'plastique', 'verre', 'ceramique', 'tissu',
  'cuir', 'velours', 'coton', 'lin', 'soie', 'laine', 'synthetique'
);

-- Application des types (optionnel, peut rester VARCHAR pour flexibilité)
-- ALTER TABLE products ALTER COLUMN color TYPE color_type USING color::color_type;
-- ALTER TABLE products ALTER COLUMN material TYPE material_type USING material::material_type;
```

## 📋 Impact sur le Frontend

### **Interfaces à Mettre à Jour**

1. **`pricing-edit-section.tsx`** :
   - Remplacer `price_ht` → `selling_price`
   - Remplacer `cost_price` → `supplier_price`
   - Ajouter calcul automatique `margin_percentage`

2. **`characteristics-edit-section.tsx`** :
   - **SUPPRIMER** complètement (édition dynamique)
   - **REMPLACER** par `product-fixed-characteristics.tsx` (lecture seule)

3. **`general-info-edit-section.tsx`** :
   - Séparer en deux sections :
     - `supplier-info-edit-section.tsx`
     - `internal-info-edit-section.tsx`

4. **Types TypeScript à Corriger** :

```typescript
interface Product {
  // PRIX CLARIFIÉS
  supplier_price?: number; // Prix d'achat fournisseur HT (centimes)
  selling_price: number; // Prix de vente Vérone HT (centimes)
  margin_percentage?: number; // Marge calculée automatiquement

  // DESCRIPTIONS SÉPARÉES
  supplier_description?: string; // Description technique fournisseur
  internal_description?: string; // Description commerciale Vérone
  marketing_notes?: string; // Notes marketing internes

  // CARACTÉRISTIQUES FIXES (plus de variant_attributes dynamique)
  color?: string; // Couleur variante
  material?: string; // Matière variante
  // dimensions et weight → déplacés vers ProductGroup

  // RÉFÉRENCES CLARIFIÉES
  supplier_reference?: string; // Référence fournisseur
  internal_reference?: string; // Notre SKU
  gtin?: string; // Code-barres

  // DONNÉES FOURNISSEUR
  supplier_lead_time_days?: number;
  supplier_minimum_order?: number;
  supplier_catalog_url?: string;
  supplier_notes?: string;
}

interface ProductGroup {
  // CARACTÉRISTIQUES COMMUNES (déplacées depuis Product)
  dimensions?: Dimensions; // Communes à toutes variantes
  weight?: number; // Commun à toutes variantes
  technical_specs?: Record<string, any>;

  // INFORMATIONS FOURNISSEUR GROUPE
  primary_supplier_id?: string;
  supplier_collection?: string;
  technical_description?: string;
  usage_description?: string;
}
```

## ⚠️ Risques et Mitigations

### **Risques Identifiés**

1. **Perte de données** lors de la migration
2. **Incohérence prix** si mauvaise interprétation price_ht/cost_price
3. **Rupture frontend** pendant la transition
4. **Corruption données** si migration échoue partiellement

### **Mitigations**

1. **Backup complet** avant toute modification
2. **Validation manuelle** échantillon données après migration
3. **Déploiement progressif** : ajout champs → migration → suppression anciens
4. **Rollback plan** préparé avec scripts de restauration
5. **Tests E2E** sur environnement staging avant production

## ✅ Checklist Validation Post-Migration

- [ ] **100% des produits** ont `selling_price` > 0
- [ ] **Marges cohérentes** : selling_price > supplier_price (quand défini)
- [ ] **Aucune marge négative** détectée
- [ ] **Dimensions communes** consolidées au niveau Product Group
- [ ] **Types TypeScript** mis à jour et cohérents
- [ ] **Interfaces utilisateur** fonctionnelles avec nouveaux champs
- [ ] **Labels prix** explicites dans toute l'interface
- [ ] **Tests E2E** passent avec nouvelles données

---

## 🎯 Bénéfices Attendus

### **Clarté Business**

- ✅ Distinction immédiate prix fournisseur vs prix de vente
- ✅ Calculs de marge automatiques et fiables
- ✅ Descriptions adaptées aux contextes (technique vs commercial)

### **Efficacité Opérationnelle**

- ✅ Import données fournisseur structuré
- ✅ Génération catalogues clients optimisée
- ✅ Gestion variantes au bon niveau architectural

### **Évolutivité Technique**

- ✅ Schéma de données cohérent avec business rules
- ✅ Support multi-fournisseurs facilité
- ✅ Intégrations externes (feeds) simplifiées

---

**Note Critique** : Cette migration corrige les incompréhensions architecturales identifiées et aligne parfaitement la base de données avec les règles business Vérone validées dans les manifestes.
