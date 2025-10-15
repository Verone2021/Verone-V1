# 📊 Taxonomie Fournisseurs - Vérone Back Office

**Date création**: 2025-10-15
**Version**: 1.0
**Statut**: ✅ Actif

---

## 🎯 Objectif

Classifier les fournisseurs selon **2 dimensions complémentaires**:

1. **Supplier Segment** (Niveau stratégique) - Importance et criticité du fournisseur
2. **Supplier Category** (Type produits) - Catégorie(s) de produits vendus

**Bénéfices**:
- ✅ Recherche et filtrage rapide des fournisseurs
- ✅ Priorisation stratégique des relations fournisseurs
- ✅ Optimisation supply chain et négociations
- ✅ Analytics par segment (spend, performance, qualité)

---

## 📐 DIMENSION 1: Supplier Segment (Criticality Matrix)

### Principe

Basé sur **best practices procurement** et la **Criticality Matrix**:
- **Criticité**: Importance stratégique des produits
- **Spend**: Volume d'achats annuel
- **Performance**: Qualité, fiabilité, délais

### Les 5 Segments

#### 1. 🎯 STRATEGIC - Fournisseurs Stratégiques

**Définition**:
- Produits **uniques** ou **exclusifs**
- **Haute valeur ajoutée** pour l'offre Vérone
- **Partenariats long-terme** avec co-développement
- Substitution **difficile ou impossible**

**Caractéristiques**:
- Volume achats: Variable (peut être faible mais critique)
- Qualité: Excellence requise
- Relation: Partenariat stratégique, collaboration étroite
- Contrats: Long-terme, clauses exclusivité possibles

**Exemples Vérone**:
- Designer exclusif pour capsule collection
- Artisan créateur de pièces signature Vérone
- Fournisseur de matériaux rares/précieux
- Partenaire co-développement nouveaux produits

**Actions Management**:
- Meetings réguliers C-level
- Innovation collaborative
- Visites usines/ateliers
- Contrats pluriannuels

---

#### 2. ⭐ PREFERRED - Fournisseurs Préférés

**Définition**:
- **Qualité premium constante**
- **Fiabilité éprouvée** (délais, quantités, qualité)
- **Bon rapport qualité/prix**
- Représentent ~80% du volume d'achats

**Caractéristiques**:
- Volume achats: Élevé et régulier
- Qualité: Premium, contrôles qualité réguliers
- Relation: Privilégiée, communication fluide
- Contrats: Annuels avec conditions négociées

**Exemples Vérone**:
- DSA Menuiserie (16 produits, qualité établie)
- Fournisseur mobilier haut de gamme établi
- Fournisseur luminaires design régulier
- Partner textile premium avec collections saisonnières

**Actions Management**:
- Reviews trimestriels performance
- Négociations annuelles conditions
- Priorisation dans les allocations
- Programme loyalty si applicable

---

#### 3. ✅ APPROVED - Fournisseurs Validés

**Définition**:
- Qualité **acceptable** (conforme standards)
- Utilisation **ponctuelle** ou **backup**
- Alternative aux fournisseurs preferred
- En cours d'évaluation pour preferred

**Caractéristiques**:
- Volume achats: Faible à modéré, occasionnel
- Qualité: Acceptable, contrôles plus fréquents
- Relation: Standard, transactions ponctuelles
- Contrats: Commandes unitaires ou court-terme

**Exemples Vérone**:
- Nouveau fournisseur en période de test
- Backup supplier pour produit critique
- Fournisseur saisonnier (occasions spéciales)
- Alternative géographique (Europe vs Asie)

**Actions Management**:
- Monitoring qualité renforcé
- Évaluation continue pour upgrade preferred
- Diversification risques supply
- Commandes de test régulières

---

#### 4. 📦 COMMODITY - Fournisseurs Commodité

**Définition**:
- Produits **standards/génériques**
- **Facilement remplaçables** (multi-sourcing)
- **Prix compétitifs** = critère principal
- Faible différenciation

**Caractéristiques**:
- Volume achats: Variable selon besoins
- Qualité: Standard/basique acceptable
- Relation: Transactionnelle, prix-driven
- Contrats: Spot orders, court-terme

**Exemples Vérone**:
- Emballages standards (cartons, bulles)
- Fournitures logistique basiques
- Consommables atelier
- Petite quincaillerie standard

**Actions Management**:
- Multi-sourcing systématique
- Comparaison prix régulière
- Optimisation coûts
- Automatisation commandes possibles

---

#### 5. 🎨 ARTISAN - Artisans Spécialisés

**Définition**:
- **Savoir-faire artisanal unique**
- **Production limitée** (petites séries)
- **Sur-mesure/personnalisation**
- Pièces **exclusives** ou **sur commande**

**Caractéristiques**:
- Volume achats: Faible, commandes ponctuelles
- Qualité: Excellence artisanale, travail main
- Relation: Collaborative, respect savoir-faire
- Contrats: Par projet ou pièce

**Exemples Vérone**:
- Céramiste pour pièces uniques
- Ébéniste créations sur-mesure
- Verrier d'art
- Tapissier traditionnel haute couture
- Ferronnier d'art

**Actions Management**:
- Respect délais artisanaux (plus longs)
- Communication personnalisée
- Valorisation du savoir-faire (storytelling)
- Prix flexibles selon complexité

---

## 📦 DIMENSION 2: Supplier Category (Type Produits)

### Principe

Classification par **type de produits vendus** pour faciliter:
- Recherche fournisseur par besoin produit
- Analytics achats par catégorie
- Diversification portfolio suppliers

**Multi-catégories possibles**: Un fournisseur peut vendre plusieurs types de produits
- Format DB: `"furniture_indoor,lighting"` (comma-separated)

### Les 13 Catégories

| Code | Label FR | Label EN | Description | Exemples Produits |
|------|----------|----------|-------------|-------------------|
| `furniture_indoor` | Mobilier intérieur | Indoor Furniture | Meubles pour espaces intérieurs | Chaises, tables, canapés, armoires, bureaux, bibliothèques |
| `furniture_outdoor` | Mobilier extérieur | Outdoor Furniture | Meubles pour espaces extérieurs | Salons de jardin, transats, parasols, tables ext. |
| `lighting` | Luminaires & Éclairage | Lighting | Tous types d'éclairage décoratif | Lampes, suspensions, appliques, lustres, spots design |
| `textiles_fabrics` | Textiles & Tissus | Textiles & Fabrics | Tissus et textiles décoratifs | Tissus ameublement, rideaux, coussins, plaids |
| `decorative_objects` | Objets décoratifs | Decorative Objects | Objets de décoration non fonctionnels | Vases, sculptures décoratives, figurines, bougeoirs |
| `art_sculptures` | Art & Sculptures | Art & Sculptures | Œuvres d'art et sculptures design | Tableaux, sculptures art, installations artistiques |
| `mirrors_frames` | Miroirs & Cadres | Mirrors & Frames | Miroirs et encadrements | Miroirs décoratifs, cadres photos/tableaux design |
| `rugs_carpets` | Tapis & Moquettes | Rugs & Carpets | Revêtements de sol textiles | Tapis décoratifs, runners, carpettes, moquettes premium |
| `wall_coverings` | Revêtements muraux | Wall Coverings | Décorations murales | Papiers peints design, panneaux décoratifs, fresques |
| `tableware` | Arts de la table | Tableware | Vaisselle et accessoires de table | Vaisselle design, couverts, verrerie premium, plateaux |
| `hardware_accessories` | Quincaillerie & Accessoires | Hardware & Accessories | Accessoires fonctionnels design | Poignées design, patères, fixations décoratives |
| `packaging_logistics` | Emballage & Logistique | Packaging & Logistics | Matériaux emballage et expédition | Emballages protecteurs, colis premium, étiquettes |
| `raw_materials` | Matières premières | Raw Materials | Matériaux bruts pour production | Bois brut, métaux, tissus bruts, composants |

---

## 🎯 Guidelines Classification Nouveaux Fournisseurs

### Étape 1: Déterminer le Segment

**Questions à se poser**:

1. **Criticité produits**:
   - Les produits sont-ils uniques/exclusifs? → **Strategic**
   - Les produits sont-ils facilement remplaçables? → **Commodity**

2. **Volume & fréquence achats**:
   - Achats réguliers et volume élevé? → **Preferred**
   - Achats ponctuels ou faibles? → **Approved** ou **Artisan**

3. **Type de production**:
   - Production artisanale limitée? → **Artisan**
   - Production industrielle standard? → **Commodity** ou **Preferred**

4. **Relation commerciale**:
   - Partenariat stratégique/co-développement? → **Strategic**
   - Relation transactionnelle prix-driven? → **Commodity**

### Étape 2: Déterminer la/les Catégorie(s)

**Questions à se poser**:

1. **Type principal de produits vendus**:
   - Identifier la catégorie dominante (70%+ du catalogue)

2. **Catégories secondaires**:
   - Si le fournisseur vend plusieurs types de produits significatifs
   - Ajouter les catégories représentant 20%+ du catalogue

**Exemples de multi-catégories**:
- `furniture_indoor,lighting` → Fabricant meubles avec gamme luminaires intégrés
- `textiles_fabrics,decorative_objects` → Créateur textile + coussins décoratifs
- `art_sculptures,mirrors_frames` → Artiste sculpteur + miroirs design

---

## 📋 Exemples de Classification

### Exemple 1: DSA Menuiserie

**Analyse**:
- 16 produits au catalogue
- Qualité établie et constante
- Achats réguliers (fournisseur actif)
- Mobilier intérieur (chaises, tables)

**Classification**:
- **Segment**: `preferred` ⭐
- **Category**: `furniture_indoor` 🛋️

---

### Exemple 2: Artisan Céramiste Local

**Analyse**:
- Production artisanale limitée (10-15 pièces/mois)
- Pièces uniques sur-mesure
- Savoir-faire traditionnel rare
- Vases, sculptures, objets déco

**Classification**:
- **Segment**: `artisan` 🎨
- **Category**: `decorative_objects,art_sculptures` (multi-catégorie)

---

### Exemple 3: Importateur Luminaires Design

**Analyse**:
- Catalogue exclusif designers européens
- Produits premium haute qualité
- Partenariat commercial établi
- Volume achats important

**Classification**:
- **Segment**: `strategic` ou `preferred` (selon exclusivité)
- **Category**: `lighting` 💡

---

### Exemple 4: Fournisseur Emballages Standard

**Analyse**:
- Cartons standards, bulles, film plastique
- Facilement remplaçable (10+ alternatives)
- Prix = critère principal
- Qualité basique acceptable

**Classification**:
- **Segment**: `commodity` 📦
- **Category**: `packaging_logistics` 📮

---

## 🔄 Évolution Taxonomie

### Ajouter un Nouveau Segment

**Via SQL** (nécessite migration):
```sql
ALTER TYPE supplier_segment_type ADD VALUE 'new_segment';
```

**Cas d'usage**: Rarement nécessaire (5 segments couvrent la plupart des cas)

### Ajouter une Nouvelle Catégorie

**Via SQL** (simple INSERT):
```sql
INSERT INTO supplier_categories (code, label_fr, label_en, description, icon_name, display_order)
VALUES ('new_category', 'Nouvelle Catégorie', 'New Category', 'Description...', 'IconName', 140);
```

**Cas d'usage**: Plus fréquent (nouvelles gammes produits)

---

## 📊 Analytics & Reporting

### Requêtes Utiles

**1. Distribution fournisseurs par segment**:
```sql
SELECT
  supplier_segment,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM organisations
WHERE type = 'supplier' AND is_active = true
GROUP BY supplier_segment
ORDER BY count DESC;
```

**2. Fournisseurs par catégorie**:
```sql
SELECT
  supplier_category,
  COUNT(*) as count
FROM organisations
WHERE type = 'supplier' AND is_active = true
  AND supplier_category IS NOT NULL
GROUP BY supplier_category
ORDER BY count DESC;
```

**3. Fournisseurs strategic sans preferred_supplier flag**:
```sql
SELECT id, name, supplier_segment, preferred_supplier
FROM organisations
WHERE type = 'supplier'
  AND supplier_segment = 'strategic'
  AND preferred_supplier = false;
```

---

## ✅ Checklist Utilisation

**Lors de la création d'un nouveau fournisseur**:
- [ ] Déterminer le segment selon guidelines ci-dessus
- [ ] Identifier la/les catégorie(s) principale(s)
- [ ] Remplir les champs `supplier_segment` et `supplier_category`
- [ ] Si strategic/preferred: Cocher `preferred_supplier` flag
- [ ] Ajouter notes explicatives si classification non évidente

**Lors de la review annuelle fournisseurs**:
- [ ] Vérifier que le segment reflète toujours la réalité
- [ ] Upgrade `approved` → `preferred` si performance excellente
- [ ] Downgrade `preferred` → `approved` si problèmes récurrents
- [ ] Mettre à jour catégories si gamme produits a évolué

---

**📝 Note**: Cette taxonomie est un outil de gestion, pas une contrainte rigide. En cas de doute, privilégier la classification qui facilite le plus la recherche et le management au quotidien.
