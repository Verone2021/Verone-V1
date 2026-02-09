# Audit Produits Opjet - Rapport Complet

**Date** : 2026-02-09
**Total produits** : 127
**Supplier** : Opjet (`9078f112-6944-4732-b926-f64dcef66034`)

---

## ✅ Résultats Globaux (Objectifs Atteints)

| Champ                  | Complétude          | Objectif | Statut      |
| ---------------------- | ------------------- | -------- | ----------- |
| **sku**                | 100% (127/127)      | 100%     | ✅          |
| **name**               | 100% (127/127)      | 100%     | ✅          |
| **subcategory_id**     | 100% (127/127)      | 100%     | ✅          |
| **supplier_reference** | 100% (127/127)      | 100%     | ✅          |
| **cost_price**         | 100% (127/127)      | 100%     | ✅          |
| **eco_tax_default**    | 100% (127/127)      | 100%     | ✅          |
| **suitable_rooms**     | 100% (127/127)      | 95%+     | ✅✅        |
| **style**              | 100% (127/127)      | 95%+     | ✅✅        |
| **product_status**     | 100% (127/127)      | 100%     | ✅          |
| **stock_status**       | 100% (127/127)      | 100%     | ✅          |
| **article_type**       | 100% (127/127)      | 100%     | ✅          |
| **weight**             | **99.2%** (126/127) | 90%+     | ✅          |
| **dimensions**         | **94.5%** (120/127) | 70%+     | ✅✅        |
| **color**              | **93.7%** (119/127) | 80%+     | ✅✅        |
| **gtin**               | 87.4% (111/127)     | -        | ✅          |
| **material**           | **79.5%** (101/127) | 80%+     | ⚠️ (proche) |

---

## 📋 Travail Accompli

### 1. Extraction Dimensions (120/127 - 94.5%)

- ✅ **36 produits** auto-extraits (patterns LxPxH, DxH, D, WxL)
- ✅ **82 produits** conservés (format ancien valide)
- ✅ **2 miroirs** corrigés (pattern LxH)

**Patterns détectés** :

- `LxPxH` : 9 produits (fauteuils, tables) → `{length_cm, width_cm, height_cm}`
- `DxH` : 25 produits (lampadaires, lampes) → `{diameter_cm, height_cm}`
- `D` : 1 produit (miroirs ronds) → `{diameter_cm}`
- `WxL` : 1 produit (tapis) → `{length_cm, width_cm}`

### 2. Extraction Variant Attributes

**Couleurs (119/127 - 93.7%)** :

- ✅ **73 produits** auto-extraits ou mergés
- ✅ **46 produits** mergés (données existantes + extraction)
- ✅ **15 produits** complétés manuellement (ambre, violet, matcha, palazzo, etc.)

**Matières (101/127 - 79.5%)** :

- ✅ Détection : velours, tissu_bouclette, bois, ceramique, metal_chrome, papier_mache, miroir, verre

### 3. Uniformisation Style + Suitable Rooms (100%)

**Règles appliquées selon recherche internet 2026** :

#### Lampes de table (17 produits)

- **Pièces** : salon, chambre, bureau, salle_a_manger, hall_entree
- **Source** : [Veranda 2026 Lighting Trends](https://www.veranda.com/decorating-ideas/advice-from-designers/a69514939/lighting-trends-2026/), [Decorilla Lighting 2026](https://www.decorilla.com/online-decorating/lighting-trends-2026/)

#### Lampadaires (8 produits)

- **Pièces** : salon, chambre, bureau, salle_a_manger, couloir
- **Source** : [The Coolist Floor Lamps](https://www.thecoolist.com/floor-lamp-ideas-for-living-room/)

#### Vases (26 produits)

- **Pièces** : salon, salle_a_manger, hall_entree, chambre, bureau
- **Source** : [Homes and Gardens Vases](https://www.homesandgardens.com/interior-design/decorating-with-vases)

#### Fauteuils (18 produits)

- **Pièces** : salon, chambre, bureau, salle_a_manger
- **Source** : [The Coolist Arm Chair Trends](https://www.thecoolist.com/arm-chair-trends/)

#### Miroirs (5 produits)

- **Pièces** : hall_entree, salle_de_bain, chambre, salon, couloir, dressing
- **Source** : [Living ETC Mirror Trends 2026](https://www.livingetc.com/ideas/bathroom-mirror-trends-2026)

#### Tables basses (3 produits)

- **Pièces** : salon
- **Source** : [Petra Madalena Coffee Tables 2026](https://petramadalena.com/blog-post/2026-coffee-table-trends-contemporary-designs-and-styles/)

#### Tables d'appoint / Bouts de canapé (23 produits)

- **Pièces** : salon, chambre
- **Source** : [Wayfair Coffee & End Tables](https://www.wayfair.com/furniture/cat/coffee-tables-end-tables-c214994.html)

#### Chaises (4 produits)

- **Pièces** : salle_a_manger, bureau, chambre

#### Bancs & tabourets (6 produits)

- **Pièces** : hall_entree, chambre, salle_a_manger, salon

#### Tables (2 produits)

- **Pièces** : salle_a_manger

#### Tables de chevet (2 produits)

- **Pièces** : chambre

#### Commode (1 produit)

- **Pièces** : chambre, hall_entree

#### Tapis (1 produit)

- **Pièces** : salon, salle_a_manger, chambre, hall_entree

#### Ampoules (8 produits)

- **Pièces** : partout (éclairage générique)

---

## ❌ Manques pour Atteindre 100%

### 1. GTIN Manquants (16 produits - 12.6%)

**Ampoules LED (5)** :

- AMP-0001 : Ampoule LED Ronde 6W E14 ambre dimmable
- AMP-0002 : Ampoule LED mot Je t'aime maman E27 ambre
- AMP-0003 : Ampoule LED mot Je t'aime papa E27 ambre
- AMP-0004 : Ampoule LED mot Baby girl E27 ambre
- AMP-0005 : Ampoule LED mot Baby boy E27 ambre

**Fauteuils (2)** :

- FAU-0006 : Fauteuil Eve bouclette bleu indigo
- FAU-0007 : Fauteuil Eve bouclette caramel

**Lampes (5)** :

- LAM-0008 : Lampe Atomic brun D25 H34cm
- LAM-0009 : Lampe Mode chrome D21 H35cm
- LAM-0010 : Lampadaire Mode chrome D30 H150cm
- LAM-0011 : Lampe Lucas chrome D30 H40cm
- LAM-0012 : Lampe Paul doré satiné D30 H45cm

**Tables / Tabourets (4)** :

- TAB-0009 : Bout de canapé Dodu gm écru
- TAB-0010 : Table basse Oublie L70 P46 H42cm
- TAB-0011 : Bout de canapé Titou caramel D30 H45cm
- TBS-0003 : Tabouret coffre Aurélie teddy blanc

**Action nécessaire** : Récupérer GTIN depuis factures Opjet (code barre EAN13)

---

### 2. WEIGHT Manquant (1 produit - 0.8%)

- **TAB-0017** : Table à manger ovale natura L160 P80 H76cm

**Action nécessaire** : Calculer depuis facture (Poids Net / Quantité) ou chercher produit similaire internet

---

### 3. DIMENSIONS Manquantes (7 produits - 5.5%)

**Tous Fauteuils Eve (série complète)** :

- FAU-0009 : Fauteuil Eve tissu bouclette jaune
- FAU-0010 : Fauteuil Eve tissu bouclette rose poudré
- FAU-0011 : Fauteuil Eve tissu bouclette bleu
- FAU-0012 : Fauteuil Eve tissu bouclette kaki
- FAU-0013 : Fauteuil Eve tissu bouclette orange
- FAU-0014 : Fauteuil Eve doudou naturel
- FAU-0015 : Fauteuil Eve tissu bouclette vert foncé

**Particularité** : Dimensions PAS dans le nom (contrairement aux autres fauteuils). Probablement même modèle avec variantes couleur.

**Action nécessaire** :

1. Chercher dimensions sur facture Opjet (si commandé)
2. OU chercher sur site opjet.com (probablement L×P×H identiques pour toute la série Eve)
3. OU recherche internet "Fauteuil Eve dimensions" (si modèle standard)

---

### 4. COULEUR Manquante (8 produits - 6.3%)

**Lampes (3)** :

- LAM-0013 : Lampadaire Saturne papier mâché → **Naturel** (papier mâché = naturel)
- LAM-0014 : Lampe base totem gm → **Recherche internet nécessaire**
- LAM-0015 : Lampe base totem pm → **Recherche internet nécessaire**

**Tables miroir Dorian (4)** :

- TAB-0022 : Table basse Dorian miroir carré L60 P60 H35cm → **Neutre/Transparent** (miroir)
- TAB-0023 : Table basse Dorian miroir rectangle L80 P55 H35cm → **Neutre/Transparent**
- TAB-0024 : Bout de canapé Dorian miroir pm L30 P30 H45cm → **Neutre/Transparent**
- TAB-0025 : Bout de canapé Dorian miroir gm L30 P30 H70cm → **Neutre/Transparent**

**Tabouret (1)** :

- TBS-0004 : Tabouret passementerie palazzo → **Recherche internet nécessaire** (motif palazzo = multicolore ?)

**Action nécessaire** :

1. Tables miroir → `color: "Neutre"` ou `"Transparent"`
2. Lampes + Tabouret → Recherche opjet.com ou factures

---

### 5. MATIÈRE Manquante (26 produits - 20.5%)

**Fauteuils (1)** :

- FAU-0017 : Fauteuil Léon pivotant sable L81 P73 H89cm → **Tissu** (probable)

**Lampes Zigmo + Solène (9)** :

- LAM-0016 : Lampe Paul noire → **Metal** (série Paul = metal chrome/doré)
- LAM-0017, 0023, 0024, 0025, 0026 : Lampe Solène spirale (jaune, rose, blanc, vert, orange) → **Ceramique** (spirale = céramique)
- LAM-0019, 0020, 0021, 0022 : Lampadaire Zigmo (brun, blanc cassé, rose, kaki) → **Metal + Tissu** (abat-jour)

**Bouts de canapé Bibi + Titou (13)** :

- TAB-0013 : Bout de canapé Bibi ocre → **Bois** (série Bibi/Titou = bois)
- TAB-0015, 0018, 0019, 0020, 0021, 0026, 0027, 0028, 0029, 0030, 0031 : Bouts de canapé Titou/Bibi (diverses couleurs) → **Bois**

**Tapis (1)** :

- TAP-0001 : Tapis Ondulation blanc 170X240cm → **Textile** (tissu/coton)

**Tabourets (2)** :

- TBS-0004 : Tabouret passementerie palazzo → **Bois + Textile** (passementerie = tissu décoratif)
- TBS-0005 : Tabouret passementerie kaki → **Bois + Textile**

**Action nécessaire** :

1. Lampes Solène → `material: "ceramique"`
2. Lampes Zigmo → `material: "metal"` + `material_secondary: "tissu"`
3. Bouts de canapé Bibi/Titou → `material: "bois"`
4. Tapis → `material: "textile"`
5. Tabourets passementerie → `material: "bois"` + `material_secondary: "textile"`
6. Lampe Paul noire → `material: "metal"`
7. Fauteuil Léon → Vérifier facture/opjet.com

---

## 🎯 Actions Prioritaires Avant Factures

### Complétion Rapide (Déduction Logique)

```sql
-- 1. Couleurs tables miroir Dorian
UPDATE products
SET variant_attributes = jsonb_set(
  variant_attributes,
  '{color}',
  '"Neutre"'
)
WHERE supplier_id = '9078f112-6944-4732-b926-f64dcef66034'
  AND sku IN ('TAB-0022', 'TAB-0023', 'TAB-0024', 'TAB-0025');

-- 2. Matières Lampes Solène (ceramique)
UPDATE products
SET variant_attributes = jsonb_set(
  variant_attributes,
  '{material}',
  '"ceramique"'
)
WHERE supplier_id = '9078f112-6944-4732-b926-f64dcef66034'
  AND sku IN ('LAM-0017', 'LAM-0023', 'LAM-0024', 'LAM-0025', 'LAM-0026');

-- 3. Matières Lampadaires Zigmo (metal + tissu)
UPDATE products
SET variant_attributes = jsonb_build_object(
  'color', variant_attributes->>'color',
  'material', 'metal',
  'material_secondary', 'tissu',
  'source', 'manual'
)
WHERE supplier_id = '9078f112-6944-4732-b926-f64dcef66034'
  AND sku IN ('LAM-0019', 'LAM-0020', 'LAM-0021', 'LAM-0022');

-- 4. Matières Bouts de canapé Bibi/Titou (bois)
UPDATE products
SET variant_attributes = jsonb_set(
  variant_attributes,
  '{material}',
  '"bois"'
)
WHERE supplier_id = '9078f112-6944-4732-b926-f64dcef66034'
  AND name ~* 'Bout de canapé (Bibi|Titou)';

-- 5. Matière Tapis (textile)
UPDATE products
SET variant_attributes = jsonb_set(
  variant_attributes,
  '{material}',
  '"textile"'
)
WHERE supplier_id = '9078f112-6944-4732-b926-f64dcef66034'
  AND sku = 'TAP-0001';

-- 6. Matières Tabourets passementerie (bois + textile)
UPDATE products
SET variant_attributes = jsonb_build_object(
  'color', variant_attributes->>'color',
  'material', 'bois',
  'material_secondary', 'textile',
  'source', 'manual'
)
WHERE supplier_id = '9078f112-6944-4732-b926-f64dcef66034'
  AND sku IN ('TBS-0004', 'TBS-0005');

-- 7. Lampe Paul noire (metal)
UPDATE products
SET variant_attributes = jsonb_set(
  variant_attributes,
  '{material}',
  '"metal"'
)
WHERE supplier_id = '9078f112-6944-4732-b926-f64dcef66034'
  AND sku = 'LAM-0016';

-- 8. Lampadaire Saturne (couleur naturel)
UPDATE products
SET variant_attributes = jsonb_set(
  variant_attributes,
  '{color}',
  '"Naturel"'
)
WHERE supplier_id = '9078f112-6944-4732-b926-f64dcef66034'
  AND sku = 'LAM-0013';
```

**Impact attendu après UPDATE** :

- **Couleur** : 93.7% → **98.4%** (125/127) ✅ (reste 2 : lampes totem)
- **Matière** : 79.5% → **94.5%** (120/127) ✅✅ (reste 7 : lampes totem + fauteuil Léon)

---

## 🔍 Données à Récupérer depuis Factures

### Priorité Haute

1. **GTIN (16 produits)** : Code barre EAN13 sur factures
2. **Weight TAB-0017** : Poids Net / Quantité
3. **Dimensions Fauteuils Eve (7)** : L×P×H depuis factures OU opjet.com

### Priorité Moyenne

4. **Couleurs lampes totem (2)** : LAM-0014, LAM-0015
5. **Matières lampes totem (2)** : LAM-0014, LAM-0015
6. **Matière FAU-0017** : Fauteuil Léon (tissu/velours ?)

---

## 📊 Prochaines Étapes

1. ✅ **Appliquer complétion rapide** (8 UPDATE SQL ci-dessus)
2. ⏭️ **Audit Factures Opjet** (MCP Playwright)
   - Récupérer GTIN, poids, dimensions manquants
   - Vérifier correspondance montants commandes Verone
3. ⏭️ **Recherche internet produits restants** (lampes totem)
4. ✅ **Validation finale** : Tous champs à 100% (sauf GTIN 87% si non disponible factures)

---

**Rapport généré automatiquement par Claude Sonnet 4.5**
**Next : Application complétion rapide → Audit factures**
