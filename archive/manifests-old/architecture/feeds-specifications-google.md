# Google Merchant Center - Spécifications Feeds V1

> **Version** : 1.0  
> **Statut** : Conforme Template Officiel Google 2024  
> **Source** : Template fourni par l'utilisateur

## 🎯 Vue d'Ensemble

### **Objectif**
Export automatisé du catalogue Vérone vers Google Merchant Center selon le template officiel, optimisé pour le secteur décoration/mobilier.

### **Intégration Smart**
- ✅ Support nouvelles exigences Google 2024
- ✅ Template officiel 33+ champs complets
- ✅ Optimisation SEO et performance
- ✅ Synchronisation automatique

## 📋 **Champs Google Merchant - Template Officiel**

### **🔴 OBLIGATOIRES (8 champs)**

| Champ | Description | Format | Limite |
|-------|-------------|--------|--------|
| `id` | ID de contenu unique (SKU) | Texte unique | 50 caractères |
| `title` | Titre produit descriptif | Texte | 150 caractères |
| `description` | Description complète produit | Texte plein | 5000 caractères |
| `link` | URL page produit pour achat | URL HTTPS | - |
| `image_link` | URL image principale | JPG/PNG min 800x800px | - |
| `price` | Prix avec devise ISO 4217 | `89.99 EUR` | - |
| `availability` | Disponibilité actuelle | `in stock` \| `out of stock` \| `preorder` | - |
| `condition` | État du produit | `new` \| `refurbished` \| `used` | - |

### **🟡 OBLIGATOIRES SECTEUR (4 champs)**

| Champ | Description | Format | Usage Vérone |
|-------|-------------|--------|--------------| 
| `brand` | Nom de la marque | Texte | "Vérone" ou marque fournisseur |
| `gtin` | Code-barres global | EAN13/UPC | Si disponible |
| `mpn` | Référence fabricant | Texte | Référence fournisseur |
| `google_product_category` | Catégorie Google | ID numérique | Mapping taxonomy Google |

### **🟢 RECOMMANDÉS COMMERCE (8 champs)**

| Champ | Description | Format | Usage Vérone |
|-------|-------------|--------|--------------| 
| `sale_price` | Prix promotion | `75.99 EUR` | Prix promotion |
| `sale_price_effective_date` | Période promotion | ISO 8601 | Dates début/fin |
| `item_group_id` | ID groupe variantes | Texte | `product_group_id` |
| `product_type` | Type produit interne | Texte | Catégorie Vérone |
| `custom_label_0` | Label personnalisé 1 | Texte | Collection/Saison |
| `custom_label_1` | Label personnalisé 2 | Texte | "Nouveau", "Best-seller" |
| `custom_label_2` | Label personnalisé 3 | Texte | Style/Matière |
| `custom_label_3` | Label personnalisé 4 | Texte | Promotion/Caractéristique |

### **🔵 RECOMMANDÉS PRODUIT (7 champs)**

| Champ | Description | Format | Usage Vérone |
|-------|-------------|--------|--------------| 
| `color` | Couleur produit | Texte descriptif | Attributs variantes |
| `material` | Matériau principal | Texte | Attributs matière |
| `pattern` | Motif/imprimé | Texte | Motif si applicable |
| `size` | Taille/dimensions | Texte | Dimensions formatées |
| `size_type` | Type de taille | `regular` \| `petite` \| `plus` \| `big_and_tall` \| `maternity` | `regular` par défaut |
| `size_system` | Système de taille | `US` \| `UK` \| `EU` \| `DE` \| `FR` \| `JP` \| `CN` \| `IT` \| `BR` \| `MEX` \| `AU` | `EU` pour Vérone |
| `adult` | Contenu adulte | `yes` \| `no` | `no` par défaut |

### **🟣 OPTIONNELS LOGISTIQUE (6 champs)**

| Champ | Description | Format | Usage Vérone |
|-------|-------------|--------|--------------| 
| `availability_date` | Date disponibilité | ISO 8601 | Si preorder |
| `shipping_weight` | Poids expédition | `5.2 kg` | Poids calculé |
| `shipping_length` | Longueur colis | `60 cm` | Dimensions emballage |
| `shipping_width` | Largeur colis | `45 cm` | Dimensions emballage |
| `shipping_height` | Hauteur colis | `25 cm` | Dimensions emballage |
| `additional_image_link` | Images supplémentaires | URLs séparées virgules | Galerie produit |

### **🔷 OPTIONNELS AVANCÉS (6 champs)**

| Champ | Description | Format | Usage Vérone |
|-------|-------------|--------|--------------| 
| `identifier_exists` | Identifiants disponibles | `yes` \| `no` | `yes` si GTIN/MPN |
| `multipack` | Quantité package | Nombre entier | Si conditionnement multiple |
| `is_bundle` | Produit groupé | `yes` \| `no` | Si pack/bundle |
| `energy_efficiency_class` | Classe énergétique | `A+++` à `G` | Électroménager uniquement |
| `min_energy_efficiency_class` | Classe énergie min | `A+++` à `G` | Range énergétique |
| `max_energy_efficiency_class` | Classe énergie max | `A+++` à `G` | Range énergétique |

## 🔄 **Mapping Vérone → Google Merchant**

### **Template CSV Google**
```csv
id,title,description,link,image_link,price,availability,condition,brand,gtin,mpn,google_product_category,sale_price,sale_price_effective_date,item_group_id,product_type,custom_label_0,custom_label_1,custom_label_2,custom_label_3,color,material,pattern,size,size_type,size_system,adult,availability_date,shipping_weight,shipping_length,shipping_width,shipping_height,additional_image_link,identifier_exists,multipack,is_bundle,energy_efficiency_class,min_energy_efficiency_class,max_energy_efficiency_class
```

### **Exemple Ligne Vérone**
```csv
VER-TAB-001-BLANC,"Tabouret Romeo Blanc en Métal","Tabouret design moderne en métal blanc, parfait pour cuisine ou bar. Hauteur 75cm, assise rembourrée confort. Finition laquée résistante.","https://verone.com/produits/tabouret-romeo-blanc","https://verone.com/images/tabouret-romeo-blanc.jpg","89.99 EUR","in stock","new","Vérone","","TAB-ROMEO-001","436","79.99 EUR","2024-12-01T00:00+01:00/2024-12-31T23:59+01:00","GRP-TAB-ROMEO","Mobilier > Salon","Collection Moderne 2024","Nouveau","Design","Métal laqué","Blanc","Métal","","H75 x L40 x P40 cm","regular","EU","no","","8.5 kg","60 cm","45 cm","25 cm","https://verone.com/images/tabouret-romeo-blanc-2.jpg,https://verone.com/images/tabouret-romeo-blanc-3.jpg","yes","1","no","","",""
```

## 🏗️ **Architecture Export Vérone**

### **Fonction Génération Google**
```javascript
export async function generateGoogleFeed(filters = {}) {
  const products = await getActiveProducts(filters);
  
  return products.map(product => ({
    // OBLIGATOIRES
    id: product.sku,
    title: generateGoogleTitle(product),
    description: generateGoogleDescription(product),
    link: `${process.env.NEXT_PUBLIC_APP_URL}/produits/${product.slug}`,
    image_link: product.primary_image_url,
    price: `${calculatePriceTTC(product)} EUR`,
    availability: mapVeronaToGoogleStatus(product.status),
    condition: product.condition || 'new',
    
    // OBLIGATOIRES SECTEUR
    brand: product.brand || 'Vérone',
    gtin: product.gtin || '',
    mpn: product.supplier_reference || '',
    google_product_category: getCategoryMapping(product.category_id),
    
    // COMMERCE
    sale_price: product.promotion_price ? `${calculatePromoPriceTTC(product)} EUR` : '',
    sale_price_effective_date: formatPromoPeriod(product.promotion_period),
    item_group_id: product.product_group_id,
    product_type: getCategoryName(product.category_id),
    custom_label_0: product.collection?.name || '',
    custom_label_1: getProductLabel(product),
    custom_label_2: getStyleLabel(product),
    custom_label_3: getPromotionLabel(product),
    
    // PRODUIT
    color: product.variant_attributes?.color || '',
    material: product.variant_attributes?.material || '',
    pattern: product.variant_attributes?.pattern || '',
    size: formatDimensions(product.dimensions),
    size_type: 'regular',
    size_system: 'EU',
    adult: 'no',
    
    // LOGISTIQUE
    availability_date: product.status === 'preorder' ? product.availability_date : '',
    shipping_weight: `${product.weight || 0} kg`,
    shipping_length: `${product.packaging?.length || 0} cm`,
    shipping_width: `${product.packaging?.width || 0} cm`, 
    shipping_height: `${product.packaging?.height || 0} cm`,
    additional_image_link: product.gallery_images?.slice(0, 10).join(','),
    
    // AVANCÉS
    identifier_exists: (product.gtin || product.supplier_reference) ? 'yes' : 'no',
    multipack: getMultipackQuantity(product),
    is_bundle: product.is_bundle ? 'yes' : 'no',
    energy_efficiency_class: product.energy_class || '',
    min_energy_efficiency_class: product.energy_range?.min || '',
    max_energy_efficiency_class: product.energy_range?.max || ''
  }));
}
```

### **Helpers Spécifiques Google**

```javascript
// Titre optimisé Google (150 char max)
function generateGoogleTitle(product) {
  const baseTitle = `${product.name}`;
  const color = product.variant_attributes?.color;
  const material = product.variant_attributes?.material;
  
  let title = baseTitle;
  if (color) title += ` ${color}`;
  if (material) title += ` en ${material}`;
  
  return title.substring(0, 150);
}

// Description Google (5000 char max)
function generateGoogleDescription(product) {
  let desc = product.description || '';
  
  // Ajouter caractéristiques
  if (product.dimensions) {
    desc += ` Dimensions: ${formatDimensions(product.dimensions)}.`;
  }
  
  if (product.variant_attributes?.material) {
    desc += ` Matériau: ${product.variant_attributes.material}.`;
  }
  
  if (product.weight) {
    desc += ` Poids: ${product.weight}kg.`;
  }
  
  // Ajouter avantages
  desc += ' Design moderne et élégant. Fabrication de qualité.';
  
  return desc.substring(0, 5000);
}

// Mapping statuts Vérone → Google
function mapVeronaToGoogleStatus(status) {
  const mapping = {
    'in_stock': 'in stock',
    'preorder': 'preorder',
    'out_of_stock': 'out of stock',
    'discontinued': 'out of stock',
    'coming_soon': 'preorder'
  };
  
  return mapping[status] || 'out of stock';
}

// Multipack selon conditionnements
function getMultipackQuantity(product) {
  const defaultPackage = product.packages?.find(p => p.is_default);
  return defaultPackage?.base_quantity > 1 ? defaultPackage.base_quantity : '';
}
```

## 🎯 **Catégories Google Taxonomy**

### **Mapping Décoration/Mobilier**
```javascript
const GOOGLE_CATEGORIES = {
  // Mobilier
  'furniture_living_room': 436,      // Mobilier > Salon
  'furniture_bedroom': 494,          // Mobilier > Chambre
  'furniture_kitchen': 440,          // Mobilier > Cuisine
  'furniture_office': 443,           // Mobilier > Bureau
  
  // Décoration
  'home_decor': 696,                 // Décoration maison
  'lighting': 594,                   // Éclairage
  'textiles': 696,                   // Textiles maison
  'storage': 6749,                   // Rangement
  
  // Jardin
  'garden_furniture': 435,           // Mobilier jardin
  'garden_decor': 695               // Décoration jardin
};
```

## 📈 **Optimisations Performance**

### **Bonnes Pratiques Vérone**
1. **Images de Qualité**
   - Résolution minimum 800x800px
   - Fond blanc ou neutre pour mobilier
   - Multiples angles pour produits complexes

2. **Titres Optimisés**
   - Format : "Type Produit + Nom + Couleur/Matière"
   - Exemple : "Tabouret Romeo Blanc en Métal"
   - Max 150 caractères, mots-clés au début

3. **Descriptions Riches**
   - Dimensions précises
   - Matériaux et finitions
   - Usage et style
   - Avantages produit

### **Fréquence Mise à Jour**
- **Automatique** : Chaque dimanche 06h00 UTC
- **Manuel** : Bouton export immédiat back-office
- **API** : Push temps réel si stock critique

## 🔗 **URLs & Configuration**

### **Feed URLs**
```
# Feed complet (tous produits actifs)
https://verone.com/api/feeds/google/products.csv?token=SECURE_TOKEN

# Feed par collection
https://verone.com/api/feeds/google/products.csv?token=TOKEN&collection=moderne-2024

# Feed par catégorie
https://verone.com/api/feeds/google/products.csv?token=TOKEN&category=mobilier-salon
```

### **Configuration Google Merchant**
1. **Méthode Upload** : URL planifiée (hebdomadaire)
2. **Format** : CSV avec en-têtes
3. **Encodage** : UTF-8
4. **Compression** : GZIP si >1MB

Cette spécification assure une intégration parfaite avec Google Merchant Center selon les standards 2024, optimisée pour le catalogue Vérone décoration/mobilier.