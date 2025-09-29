# Facebook Meta Business - Spécifications Feeds V1

> **Version** : 1.0  
> **Statut** : Conforme template officiel Meta 2024  
> **Source** : Template fourni par l'utilisateur

## 🎯 Vue d'Ensemble

### **Objectif**
Export automatisé du catalogue Vérone vers Facebook Meta Business Manager selon le template officiel, optimisé pour le secteur décoration/mobilier.

### **Intégration Smart**
- ✅ Support import automatique depuis Google Merchant Center
- ✅ Export CSV direct depuis Vérone
- ✅ Synchronisation via API Meta (futur)

## 📋 **Champs Facebook Meta - Template Officiel**

### **🔴 OBLIGATOIRES (8 champs)**

| Champ | Description | Format | Limite |
|-------|-------------|--------|--------|
| `id` | ID de contenu unique (SKU) | Texte unique | 100 caractères |
| `title` | Titre produit spécifique et pertinent | Texte | 200 caractères |
| `description` | Description courte avec caractéristiques | Texte plein | 9999 caractères |
| `availability` | Disponibilité actuelle | `in stock` \| `out of stock` | - |
| `condition` | État du produit | `new` \| `used` | - |
| `price` | Prix avec devise ISO 4217 | `89.99 EUR` | - |
| `link` | URL page produit pour achat | URL HTTPS | - |
| `image_link` | URL image principale | JPG/PNG min 500x500px | - |
| `brand` | Nom de la marque | Texte | 100 caractères |

### **🟡 FACULTATIFS - COMMERCE (5 champs)**

| Champ | Description | Format | Usage Vérone |
|-------|-------------|--------|--------------|
| `google_product_category` | Catégorie Google | ID numérique | Réutilise mapping Google |
| `fb_product_category` | Catégorie Facebook | Texte | Spécifique Meta |
| `quantity_to_sell_on_facebook` | Stock Instagram checkout | Nombre ≥1 | Stock disponible |
| `sale_price` | Prix promo | `75.99 EUR` | Prix promotion |
| `sale_price_effective_date` | Période promotion | ISO 8601 | Dates début/fin |

### **🟢 FACULTATIFS - VARIANTES (8 champs)**

| Champ | Description | Format | Usage Vérone |
|-------|-------------|--------|--------------|
| `item_group_id` | ID groupe variantes | Texte | `product_group_id` |
| `gender` | Genre cible | `female` \| `male` \| `unisex` | Selon produit |
| `color` | Couleur produit | Texte descriptif | Attributs variantes |
| `size` | Taille/dimensions | Texte | Dimensions formatées |
| `age_group` | Tranche d'âge | `adult` \| `kids` \| etc. | `adult` par défaut |
| `material` | Matériau principal | Texte | Attributs matière |
| `pattern` | Motif/imprimé | Texte | Motif si applicable |
| `style[0]` | Style produit | Texte | Style déco |

### **🔵 FACULTATIFS - LOGISTIQUE (4 champs)**

| Champ | Description | Format | Usage Vérone |
|-------|-------------|--------|--------------|
| `shipping` | Infos expédition | `FR::Standard:9.99 EUR` | Tarifs FR |
| `shipping_weight` | Poids expédition | `5.2 kg` | Poids calculé |
| `gtin` | Code-barres | EAN13/UPC | Si disponible |
| `video[0].url` | URL vidéo produit | URL fichier vidéo | Vidéos démo |

### **🟣 FACULTATIFS - MARKETING (4 champs)**

| Champ | Description | Format | Usage Vérone |
|-------|-------------|--------|--------------|
| `video[0].tag[0]` | Tag vidéo | Texte | Tag descriptif |
| `product_tags[0]` | Tag produit 1 | Texte | Collection/Style |
| `product_tags[1]` | Tag produit 2 | Texte | Catégorie/Nouveau |

## 🔄 **Mapping Vérone → Facebook Meta**

### **Template CSV Facebook**
```csv
id,title,description,availability,condition,price,link,image_link,brand,google_product_category,fb_product_category,quantity_to_sell_on_facebook,sale_price,sale_price_effective_date,item_group_id,gender,color,size,age_group,material,pattern,shipping,shipping_weight,gtin,video[0].url,video[0].tag[0],product_tags[0],product_tags[1],style[0]
```

### **Exemple Ligne Vérone**
```csv
VER-TAB-001-BLANC,"Tabouret Romeo Blanc en Métal","Tabouret design moderne en métal blanc, parfait pour cuisine ou bar. Hauteur 75cm, assise rembourrée confort. Finition laquée résistante.","in stock","new","89.99 EUR","https://verone.com/produits/tabouret-romeo-blanc","https://verone.com/images/tabouret-romeo-blanc.jpg","Vérone","436","Furniture > Dining Room > Stools","5","79.99 EUR","2024-12-01T00:00+01:00/2024-12-31T23:59+01:00","GRP-TAB-ROMEO","unisex","Blanc","H75 x L40 x P40 cm","adult","Métal","","FR::Standard:19.99 EUR;FR:Express:29.99 EUR","8.5 kg","","","","Collection Moderne 2024","Nouveau","Moderne"
```

## 🏗️ **Architecture Export Vérone**

### **Fonction Génération Facebook**
```javascript
export async function generateFacebookFeed(filters = {}) {
  const products = await getActiveProducts(filters);
  
  return products.map(product => ({
    // OBLIGATOIRES
    id: product.sku,
    title: generateFacebookTitle(product),
    description: generateFacebookDescription(product),
    availability: mapVeronaToFacebookStatus(product.status),
    condition: product.condition || 'new',
    price: `${calculatePriceTTC(product)} EUR`,
    link: `${process.env.NEXT_PUBLIC_APP_URL}/produits/${product.slug}`,
    image_link: product.primary_image_url,
    brand: product.brand || 'Vérone',
    
    // COMMERCE
    google_product_category: getCategoryMapping(product.category_id),
    fb_product_category: getFacebookCategory(product.category_id),
    quantity_to_sell_on_facebook: product.stock_quantity || 1,
    sale_price: product.promotion_price ? `${calculatePromoPriceTTC(product)} EUR` : '',
    sale_price_effective_date: formatPromoPeriod(product.promotion_period),
    
    // VARIANTES
    item_group_id: product.product_group_id,
    gender: getGenderFromCategory(product.category_id),
    color: product.variant_attributes?.color || '',
    size: formatDimensions(product.dimensions),
    age_group: 'adult',
    material: product.variant_attributes?.material || '',
    pattern: product.variant_attributes?.pattern || '',
    style: getStyleFromCategory(product.category_id),
    
    // LOGISTIQUE
    shipping: generateShippingInfo(),
    shipping_weight: `${product.weight || 0} kg`,
    gtin: product.gtin || '',
    
    // MARKETING
    product_tags: [
      product.collection?.name || '',
      getProductLabel(product)
    ].filter(Boolean),
    
    // VIDÉO (si disponible)
    'video[0].url': product.video_url || '',
    'video[0].tag[0]': product.video_url ? 'Démonstration produit' : ''
  }));
}
```

### **Helpers Spécifiques Facebook**

```javascript
// Titre optimisé Facebook (200 char max)
function generateFacebookTitle(product) {
  const baseTitle = `${product.name}`;
  const color = product.variant_attributes?.color;
  const material = product.variant_attributes?.material;
  
  let title = baseTitle;
  if (color) title += ` ${color}`;
  if (material) title += ` en ${material}`;
  
  return title.substring(0, 200);
}

// Description Facebook (9999 char max)
function generateFacebookDescription(product) {
  let desc = product.description || '';
  
  // Ajouter caractéristiques
  if (product.dimensions) {
    desc += ` Dimensions: ${formatDimensions(product.dimensions)}.`;
  }
  
  if (product.variant_attributes?.material) {
    desc += ` Matériau: ${product.variant_attributes.material}.`;
  }
  
  // Ajouter avantages
  desc += ' Design moderne et élégant. Fabrication de qualité.';
  
  return desc.substring(0, 9999);
}

// Mapping statuts Vérone → Facebook
function mapVeronaToFacebookStatus(status) {
  const mapping = {
    'in_stock': 'in stock',
    'preorder': 'in stock',      // Facebook n'a pas preorder
    'out_of_stock': 'out of stock',
    'discontinued': 'out of stock',
    'coming_soon': 'in stock'
  };
  
  return mapping[status] || 'out of stock';
}

// Informations expédition France
function generateShippingInfo() {
  return 'FR::Standard:19.99 EUR;FR::Express:29.99 EUR';
}
```

## 🎯 **Catégories Facebook Spécifiques**

### **Mapping Décoration/Mobilier**
```javascript
const FACEBOOK_CATEGORIES = {
  // Mobilier
  'furniture_living_room': 'Furniture > Living Room',
  'furniture_bedroom': 'Furniture > Bedroom', 
  'furniture_kitchen': 'Furniture > Dining Room',
  'furniture_office': 'Furniture > Office',
  
  // Décoration
  'home_decor': 'Home & Garden > Decor',
  'lighting': 'Home & Garden > Lighting',
  'textiles': 'Home & Garden > Linens & Bedding',
  'storage': 'Home & Garden > Storage & Organization',
  
  // Jardin
  'garden_furniture': 'Home & Garden > Yard, Garden & Outdoor Living > Patio & Garden Furniture',
  'garden_decor': 'Home & Garden > Yard, Garden & Outdoor Living > Garden Decor'
};
```

## 📊 **Optimisations Facebook**

### **Bonnes Pratiques Vérone**
1. **Images Facebook**
   - Résolution minimum 500x500px (recommandé 1200x1200px)
   - Format carré privilégié
   - Fond neutre pour mobilier
   - Pas de watermark visible

2. **Titres Accrocheurs**
   - Mots-clés au début
   - Couleur et matière mentionnées
   - Style/collection si pertinent
   - Max 200 caractères utilisés intelligemment

3. **Descriptions Vendues**
   - Caractéristiques techniques
   - Bénéfices utilisateur
   - Usage et style
   - Matériaux et finitions

### **Gestion Promotions**
```javascript
// Format date promotion Facebook
function formatPromoPeriod(period) {
  if (!period) return '';
  
  const start = new Date(period.start_date);
  const end = new Date(period.end_date);
  
  const formatDate = (date) => {
    return date.toISOString().replace(/\.\d{3}Z$/, '+01:00');
  };
  
  return `${formatDate(start)}/${formatDate(end)}`;
}
```

## 🔗 **URLs & Configuration**

### **Feed URLs Facebook**
```
# Feed complet Facebook
https://verone.com/api/feeds/facebook/products.csv?token=SECURE_TOKEN

# Feed par collection
https://verone.com/api/feeds/facebook/products.csv?token=TOKEN&collection=moderne-2024

# Import depuis Google Merchant (recommandé)
URL Google Merchant Feed → Configuration automatique Meta
```

### **Configuration Meta Commerce Manager**
1. **Source Données** : URL planifiée ou Google Merchant
2. **Fréquence** : Hebdomadaire (dimanche 06h00 UTC)
3. **Format** : CSV avec en-têtes
4. **Encodage** : UTF-8

Cette spécification garantit une compatibilité parfaite avec le template officiel Facebook Meta Business Manager pour le catalogue Vérone.