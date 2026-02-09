# Import Produits - Quick Reference

**Version rapide** pour import quotidien. Voir [product-import-checklist.md](./product-import-checklist.md) pour version complète.

---

## ✅ Checklist Rapide (Les 15 Essentiels)

### 🔴 OBLIGATOIRES (5)

- [ ] `sku` - Identifiant unique (ex: `VAS-0032`)
- [ ] `name` - Nom produit
- [ ] `stock_status` - `out_of_stock` / `in_stock` / `coming_soon`
- [ ] `product_status` - `active` / `draft` / `discontinued`
- [ ] `article_type` - `vente_de_marchandises` (défaut)

### 🔥 CRITIQUES (10)

- [ ] `supplier_id` - UUID du fournisseur
- [ ] `subcategory_id` - UUID de la sous-catégorie
- [ ] `supplier_reference` - Référence fournisseur (ex: `015276`)
- [ ] `brand` - Marque (ex: `OPJET`)
- [ ] `weight` - **Poids en kg** (CRITIQUE pour frais de port)
- [ ] `dimensions` - `{"width_cm": 18, "height_cm": 28.6, "length_cm": 18}`
- [ ] `variant_attributes` - `{"color": "Bleu", "material": "ceramique"}`
- [ ] `cost_price` - Prix d'achat HT
- [ ] `style` - Style décoratif (ex: `contemporain`)
- [ ] `suitable_rooms` - Array de pièces adaptées

---

## 📋 Template SQL Minimal

```sql
INSERT INTO products (
  -- OBLIGATOIRES
  sku, name, stock_status, product_status, article_type,
  -- CRITIQUES
  supplier_id, subcategory_id, supplier_reference, brand,
  weight, dimensions, variant_attributes,
  cost_price, style, suitable_rooms
)
VALUES (
  -- OBLIGATOIRES
  'XXX-NNNN',                                          -- sku
  'Nom du Produit',                                    -- name
  'out_of_stock',                                      -- stock_status
  'active',                                            -- product_status
  'vente_de_marchandises',                            -- article_type

  -- CRITIQUES
  'uuid-fournisseur',                                  -- supplier_id
  'uuid-subcategory',                                  -- subcategory_id
  'REF-FOURNISSEUR',                                   -- supplier_reference
  'MARQUE',                                            -- brand
  1.5,                                                 -- weight (kg)
  '{"width_cm": 20, "height_cm": 30, "length_cm": 15}'::jsonb,  -- dimensions
  '{"color": "Couleur", "material": "matiere"}'::jsonb,          -- variant_attributes
  25.90,                                               -- cost_price
  'contemporain',                                      -- style
  ARRAY['salon', 'chambre', 'bureau']::room_type[]    -- suitable_rooms
);
```

---

## 🧮 Calculs Rapides

### Poids unitaire

```
Poids unitaire (kg) = Poids net facture / Quantité
```

**Exemple** : Facture indique 5.8 kg net pour 4 lampes
→ Poids unitaire = 5.8 / 4 = **1.45 kg**

### SKU

```
Format : CAT-NNNN
```

- `CAT` = Code catégorie (VAS, FAU, LAM, TAB, etc.)
- `NNNN` = Numéro séquentiel à 4 chiffres

**Vérifier dernier SKU de la catégorie** :

```sql
SELECT sku FROM products
WHERE sku LIKE 'VAS-%'
ORDER BY sku DESC
LIMIT 1;
```

---

## 🎨 Pièces Adaptées par Type

### Fauteuils / Chaises

```typescript
['salon', 'salle_a_manger', 'bureau', 'chambre', 'salon_sejour'];
```

### Tables / Consoles

```typescript
['salon', 'salle_a_manger', 'hall_entree', 'couloir', 'bureau'];
```

### Lampes

```typescript
[
  'salon',
  'chambre',
  'bureau',
  'salle_a_manger',
  'hall_entree',
  'couloir',
  'salon_sejour',
];
```

### Vases / Déco

```typescript
[
  'salon',
  'salle_a_manger',
  'chambre',
  'cuisine',
  'salle_de_bain',
  'bureau',
  'bibliotheque',
  'salon_sejour',
  'hall_entree',
  'terrasse',
  'balcon',
  'jardin',
  'veranda',
  'patio',
];
```

### Miroirs

```typescript
['hall_entree', 'salle_de_bain', 'chambre', 'salon', 'couloir', 'dressing'];
```

### Bancs

```typescript
['hall_entree', 'chambre', 'salon', 'salle_a_manger', 'couloir'];
```

---

## 🆔 UUIDs Fournisseurs Fréquents

| Fournisseur                       | UUID                                   |
| --------------------------------- | -------------------------------------- |
| **Opjet**                         | `9078f112-6944-4732-b926-f64dcef66034` |
| (Ajouter autres fournisseurs ici) |                                        |

---

## 📦 UUIDs Sous-Catégories Fréquentes

| Sous-catégorie                       | UUID                                   |
| ------------------------------------ | -------------------------------------- |
| **Vases**                            | `4a915a10-0099-439f-a512-09adf0088736` |
| (Ajouter autres sous-catégories ici) |                                        |

---

## 🔍 Requêtes Utiles

### Vérifier UUIDs

```sql
-- Liste fournisseurs
SELECT id, name FROM suppliers ORDER BY name;

-- Liste sous-catégories
SELECT id, name, category_id FROM subcategories ORDER BY name;
```

### Dernier SKU d'une catégorie

```sql
SELECT sku FROM products
WHERE sku LIKE 'VAS-%'
ORDER BY sku DESC
LIMIT 1;
```

### Vérifier complétude après import

```sql
SELECT
  sku, name,
  CASE WHEN weight IS NULL THEN '❌' ELSE '✅' END as weight,
  CASE WHEN style IS NULL THEN '❌' ELSE '✅' END as style,
  CASE WHEN array_length(suitable_rooms, 1) IS NULL THEN '❌' ELSE '✅' END as rooms,
  completion_percentage
FROM products
WHERE sku = 'XXX-NNNN';
```

---

## ⚠️ Pièges à Éviter

1. ❌ **Poids manquant** → Calcul frais de port impossible
2. ❌ **Style manquant** → Filtre front cassé
3. ❌ **Pièces aberrantes** → Fauteuils dans WC/cave/garage
4. ❌ **Oublier supplier_reference** → Impossible de repasser commande
5. ❌ **variant_attributes vide** → Pas de filtre couleur/matière

---

**Pro tip** : Copier-coller ce template dans un scratchpad pendant l'import pour cocher au fur et à mesure.
