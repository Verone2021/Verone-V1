# Workflows Catalogue - Documentation Complète

**Module** : Produits → Catalogue
**Date** : 2025-10-27

---

## 📋 Vue d'Ensemble

Le module Catalogue gère **7 workflows métier principaux** pour le cycle de vie complet des produits du catalogue.

### Workflows Disponibles

```
1. 📝 Création Produit (Wizard 4 Étapes)
2. ✏️ Modification Produit
3. 🗄️ Archivage & Restauration
4. 🖼️ Gestion Images
5. 📦 Gestion Conditionnements
6. 📊 Gestion Stock
7. 🔄 Intégration Sourcing → Catalogue
```

---

## 1️⃣ Workflow Création Produit (Wizard 4 Étapes)

### Diagramme Flux Complet

```
┌─────────────────────────────────────────────────────────────┐
│                 CRÉATION PRODUIT COMPLET                     │
└─────────────────────────────────────────────────────────────┘

[/produits/catalogue/nouveau]
         │
         ├─ Utilisateur accède page création
         │
         ▼
┌─────────────────────┐
│ ÉTAPE 1/4          │
│ Informations       │
│ Générales          │
└─────────────────────┘
    │ Champs :
    │ • Nom produit (REQUIRED)
    │ • Fournisseur (SupplierSelector)
    │ • Catégorie (CategorySelector)
    │ • Sous-catégorie
    │ • Famille
    │ • Description
    │ • Points de vente (selling_points[])
    │
    ├─ Validation :
    │  ✓ Nom présent (min 3 caractères)
    │
    ▼
┌─────────────────────┐
│ ÉTAPE 2/4          │
│ Images Produit     │
└─────────────────────┘
    │ Actions :
    │ • Upload multiple (drag & drop)
    │ • Sélection image primaire
    │ • Preview galerie
    │
    ├─ Validation :
    │  ✓ Au moins 1 image (recommandé)
    │  ✓ Format JPEG/PNG/WebP
    │  ✓ Taille max 5MB
    │
    ▼
┌─────────────────────┐
│ ÉTAPE 3/4          │
│ Prix & Marge       │
└─────────────────────┘
    │ Champs :
    │ • Prix achat HT (cost_price)
    │ • Marge % (margin_percentage)
    │ • Prix vente estimé (calculé auto)
    │
    ├─ Calcul automatique :
    │  Prix vente = cost_price × (1 + margin_percentage / 100)
    │
    ├─ Validation :
    │  ✓ cost_price > 0 (recommandé)
    │  ✓ margin_percentage ≥ 0
    │
    ▼
┌─────────────────────┐
│ ÉTAPE 4/4          │
│ Stock Initial      │
└─────────────────────┘
    │ Champs :
    │ • Stock réel initial (stock_real)
    │ • Stock minimum (min_stock)
    │ • Point réappro (reorder_point)
    │
    ├─ Validation :
    │  ✓ stock_real ≥ 0
    │  ✓ min_stock ≥ 0
    │  ✓ reorder_point ≥ min_stock
    │
    ▼
┌─────────────────────┐
│ SOUMISSION FINALE  │
└─────────────────────┘
    │
    ├─ 1. Création produit en DB
    │    ├─ INSERT products (...)
    │    ├─ Trigger : generate_product_sku() → SKU auto
    │    ├─ Trigger : calculate_product_completion() → completion_percentage
    │    └─ Trigger : update_product_stock_status() → status
    │
    ├─ 2. Upload images Supabase Storage
    │    ├─ Bucket : product-images
    │    ├─ Path : products/{productId}/{timestamp}-{random}.{ext}
    │    ├─ INSERT product_images (storage_path, is_primary, ...)
    │    └─ Trigger : generate_public_url() → public_url auto
    │
    ├─ 3. Calcul completion_percentage
    │    ├─ Nom présent : +20%
    │    ├─ Images présentes : +20%
    │    ├─ Prix défini : +20%
    │    ├─ Stock défini : +20%
    │    ├─ Fournisseur présent : +10%
    │    ├─ Catégorie présente : +10%
    │    └─ Total : 0-100%
    │
    └─ 4. Redirection
         └─ /produits/catalogue/[productId]
```

### État Final Produit Créé

```typescript
{
  id: "uuid-generated",
  sku: "PRD-XXXX",              // Auto-généré par trigger
  name: "Fauteuil Vintage",
  slug: "fauteuil-vintage",
  cost_price: 150,
  margin_percentage: 40,
  status: "in_stock",           // Si stock_real > 0
  stock_real: 10,
  stock_forecasted_in: 0,
  stock_forecasted_out: 0,
  min_stock: 2,
  reorder_point: 5,
  completion_percentage: 90,    // Calculé par trigger
  creation_mode: "complete",
  supplier_id: "uuid-supplier",
  subcategory_id: "uuid-category",
  images: [
    { public_url: "https://...", is_primary: true },
    { public_url: "https://...", is_primary: false }
  ],
  created_at: "2025-10-27T10:00:00Z",
  updated_at: "2025-10-27T10:00:00Z"
}
```

### Code Exemple

```typescript
// Page : src/app/produits/catalogue/nouveau/page.tsx

import { ProductCreationWizard } from '@/components/business/product-creation-wizard'

export default function NewProductPage() {
  const router = useRouter()

  const handleSuccess = (productId: string) => {
    toast.success('✅ Produit créé avec succès')
    router.push(`/produits/catalogue/${productId}`)
  }

  const handleCancel = () => {
    router.push('/produits/catalogue')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Nouveau Produit</h1>

      <ProductCreationWizard
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}
```

---

## 2️⃣ Workflow Modification Produit

### Diagramme Flux

```
[/produits/catalogue/[productId]]
         │
         ├─ Utilisateur accède page détail
         │
         ▼
┌─────────────────────┐
│ AFFICHAGE DÉTAIL   │
│ Mode View          │
└─────────────────────┘
    │ Sections :
    │ • Informations générales
    │ • Images (galerie)
    │ • Fournisseur
    │ • Prix & Marge
    │ • Stock réel/prévisionnel
    │ • Conditionnements
    │ • Variantes (si applicable)
    │
    ├─ Actions disponibles :
    │  • Bouton "Modifier"
    │  • Bouton "Archiver"
    │  • Bouton "Dupliquer" (TODO Phase 2)
    │
    ▼
┌─────────────────────┐
│ CLIC "Modifier"    │
└─────────────────────┘
    │
    ├─ Bascule en Mode Edit
    │  (ProductDualMode ou ProductEditMode)
    │
    ▼
┌─────────────────────┐
│ ÉDITION CHAMPS     │
│ Mode Edit          │
└─────────────────────┘
    │ Édition par section :
    │
    ├─ Section Informations
    │  • Nom, Description, Catégorie
    │  • Points de vente
    │
    ├─ Section Images
    │  • Upload nouvelles images
    │  • Supprimer images
    │  • Réordonner (drag & drop)
    │  • Définir primaire
    │
    ├─ Section Prix
    │  • cost_price
    │  • margin_percentage
    │  • (Prix vente calculé auto)
    │
    ├─ Section Stock
    │  • stock_real (via ajustement)
    │  • min_stock
    │  • reorder_point
    │
    └─ Section Conditionnements
       • Ajouter package
       • Modifier package
       • Supprimer package
    │
    ▼
┌─────────────────────┐
│ SAUVEGARDE         │
└─────────────────────┘
    │
    ├─ Validation :
    │  ✓ Nom présent
    │  ✓ Prix > 0
    │  ✓ Stock ≥ 0
    │
    ├─ UPDATE products
    │  SET ...
    │  WHERE id = $1
    │
    ├─ Triggers automatiques :
    │  ├─ calculate_product_completion()
    │  ├─ update_product_stock_status()
    │  └─ updated_at = NOW()
    │
    └─ Retour Mode View
       └─ Toast "✅ Produit mis à jour"
```

### Code Exemple

```typescript
// Page : src/app/produits/catalogue/[productId]/page.tsx

import { ProductDualMode } from '@/components/business/product-dual-mode'
import { useProduct } from '@/hooks/use-products'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { product, loading, error } = useProduct(params.id)
  const [isEditing, setIsEditing] = useState(false)

  const handleUpdate = async (updatedProduct: Product) => {
    try {
      await updateProduct(product.id, updatedProduct)
      toast.success('✅ Produit mis à jour')
      setIsEditing(false)
    } catch (error) {
      toast.error('❌ Erreur mise à jour')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error || !product) return <ErrorMessage />

  return (
    <div className="container mx-auto py-8">
      <ProductDualMode
        product={product}
        onUpdate={handleUpdate}
        initialMode="view"
      />
    </div>
  )
}
```

---

## 3️⃣ Workflow Archivage & Restauration

### Diagramme Archivage

```
[Page Catalogue ou Détail Produit]
         │
         ├─ Clic "Archiver"
         │
         ▼
┌─────────────────────┐
│ CONFIRMATION       │
└─────────────────────┘
    │ Modal :
    │ "Archiver ce produit ?"
    │ • Raison archivage (optionnel)
    │ • Bouton "Confirmer" / "Annuler"
    │
    ├─ Si "Confirmer" ▼
    │
┌─────────────────────┐
│ ARCHIVAGE DB       │
└─────────────────────┘
    │ UPDATE products SET
    │   status = 'archived',
    │   archived_reason = $1,
    │   archived_at = NOW()
    │ WHERE id = $2
    │
    ├─ Toast "✅ Produit archivé"
    │
    └─ Redirection
       └─ /produits/catalogue
```

### Diagramme Restauration

```
[/produits/catalogue/archived]
         │
         ├─ Liste produits archivés
         │
         ▼
┌─────────────────────┐
│ SÉLECTION PRODUIT  │
└─────────────────────┘
    │ Tableau avec :
    │ • Nom, SKU, Date archivage
    │ • Raison archivage
    │ • Bouton "Restaurer"
    │
    ├─ Clic "Restaurer" ▼
    │
┌─────────────────────┐
│ RESTAURATION DB    │
└─────────────────────┘
    │ UPDATE products SET
    │   status = 'in_stock',  -- ou calculate automatique
    │   archived_reason = NULL,
    │   archived_at = NULL
    │ WHERE id = $1
    │
    ├─ Trigger : update_product_stock_status()
    │  └─ Recalcule statut basé sur stock_real
    │
    ├─ Toast "✅ Produit restauré"
    │
    └─ Retour au catalogue
```

### Code Exemple

```typescript
// Archivage
const handleArchive = async (productId: string) => {
  const reason = prompt('Raison de l\'archivage ? (optionnel)')

  if (!confirm('Archiver ce produit ?')) {
    return
  }

  try {
    await supabase
      .from('products')
      .update({
        status: 'archived',
        archived_reason: reason,
        archived_at: new Date().toISOString()
      })
      .eq('id', productId)

    toast.success('✅ Produit archivé')
    router.push('/produits/catalogue')
  } catch (error) {
    toast.error('❌ Erreur archivage')
  }
}

// Restauration
const handleRestore = async (productId: string) => {
  if (!confirm('Restaurer ce produit au catalogue ?')) {
    return
  }

  try {
    await supabase
      .from('products')
      .update({
        status: 'in_stock', // Sera recalculé par trigger
        archived_reason: null,
        archived_at: null
      })
      .eq('id', productId)

    toast.success('✅ Produit restauré')
    refetch() // Refresh liste
  } catch (error) {
    toast.error('❌ Erreur restauration')
  }
}
```

---

## 4️⃣ Workflow Gestion Images

### Diagramme Upload Images

```
[Page Produit - Section Images]
         │
         ├─ Upload zone (drag & drop)
         │
         ▼
┌─────────────────────┐
│ SÉLECTION FICHIERS │
└─────────────────────┘
    │ User sélectionne :
    │ • 1 fichier (simple)
    │ • Plusieurs fichiers (multiple)
    │ • Drag & drop
    │
    ├─ Validation client :
    │  ✓ Format JPEG/PNG/WebP
    │  ✓ Taille max 5MB par fichier
    │  ✓ Max 10 images total
    │
    ▼
┌─────────────────────┐
│ COMPRESSION        │
│ (Optionnel)        │
└─────────────────────┘
    │ Si image > 1MB :
    │ • Compression automatique
    │ • Resize max 1920px
    │ • Qualité 85%
    │
    ▼
┌─────────────────────┐
│ UPLOAD STORAGE     │
└─────────────────────┘
    │ Supabase Storage :
    │ • Bucket : product-images
    │ • Path : products/{productId}/{timestamp}-{random}.{ext}
    │ • Content-Type : image/{format}
    │ • Cache-Control : 3600
    │
    ├─ Progress bar affichée
    │
    ▼
┌─────────────────────┐
│ INSERT DATABASE    │
└─────────────────────┘
    │ INSERT product_images (
    │   product_id,
    │   storage_path,
    │   display_order,
    │   is_primary,      -- true si première image
    │   image_type,      -- 'gallery'
    │   alt_text,
    │   file_size,
    │   format
    │ )
    │
    ├─ Trigger : generate_public_url()
    │  └─ Génère public_url automatiquement
    │
    ├─ Trigger : ensure_single_primary_image()
    │  └─ Si is_primary=true, unset autres images
    │
    └─ Refresh galerie
       └─ Toast "✅ Image uploadée"
```

### Diagramme Suppression Image

```
[Galerie Images Produit]
         │
         ├─ Clic "Supprimer" sur image
         │
         ▼
┌─────────────────────┐
│ CONFIRMATION       │
└─────────────────────┘
    │ "Supprimer cette image ?"
    │
    ├─ Si "Confirmer" ▼
    │
┌─────────────────────┐
│ SUPPRESSION        │
└─────────────────────┘
    │ 1. DELETE FROM product_images
    │    WHERE id = $1
    │
    ├─ 2. DELETE FROM storage
    │    (storage_path)
    │
    ├─ 3. Si image supprimée était primaire :
    │    └─ Définir automatiquement nouvelle primaire
    │       (première image restante)
    │
    └─ Refresh galerie
       └─ Toast "✅ Image supprimée"
```

### Code Exemple

```typescript
import { useProductImages } from '@/hooks/use-product-images'

export default function ProductImagesManagement({ productId }: { productId: string }) {
  const {
    images,
    uploading,
    uploadImage,
    deleteImage,
    setPrimaryImage,
    reorderImages
  } = useProductImages({
    productId,
    autoFetch: true
  })

  // Upload single image
  const handleUpload = async (file: File) => {
    try {
      await uploadImage(file, {
        imageType: 'gallery',
        isPrimary: images.length === 0, // Première image = primary
        altText: file.name
      })
      toast.success('✅ Image uploadée')
    } catch (error) {
      toast.error('❌ Erreur upload')
    }
  }

  // Delete image
  const handleDelete = async (imageId: string) => {
    if (!confirm('Supprimer cette image ?')) return

    try {
      await deleteImage(imageId)
      toast.success('✅ Image supprimée')
    } catch (error) {
      toast.error('❌ Erreur suppression')
    }
  }

  // Set primary image
  const handleSetPrimary = async (imageId: string) => {
    try {
      await setPrimaryImage(imageId)
      toast.success('✅ Image primaire définie')
    } catch (error) {
      toast.error('❌ Erreur')
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          files.forEach(file => handleUpload(file))
        }}
        disabled={uploading}
      />

      <div className="grid grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="relative">
            <img src={image.public_url} alt={image.alt_text} />
            {image.is_primary && <Badge>Primaire</Badge>}

            <div className="actions">
              {!image.is_primary && (
                <button onClick={() => handleSetPrimary(image.id)}>
                  Définir primaire
                </button>
              )}
              <button onClick={() => handleDelete(image.id)}>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 5️⃣ Workflow Gestion Conditionnements

### Diagramme Ajout Conditionnement

```
[Page Produit - Section Conditionnements]
         │
         ├─ Clic "Ajouter conditionnement"
         │
         ▼
┌─────────────────────┐
│ FORMULAIRE PACKAGE │
└─────────────────────┘
    │ Champs :
    │ • Type (single, pack, bulk, custom)
    │ • Quantité de base (base_quantity)
    │ • Unité (unit)
    │ • Prix unitaire HT (unit_price_ht) - Optionnel
    │ • Taux remise (discount_rate) - Optionnel
    │ • Par défaut ? (is_default)
    │
    ├─ Validation :
    │  ✓ base_quantity > 0
    │  ✓ unit présent
    │  ✓ Si type='single' → is_default=true obligatoire
    │  ✓ 1 seul package par défaut
    │
    ▼
┌─────────────────────┐
│ INSERT DATABASE    │
└─────────────────────┘
    │ INSERT product_packages (
    │   product_id,
    │   type,
    │   base_quantity,
    │   unit,
    │   unit_price_ht,
    │   discount_rate,
    │   is_default,
    │   display_order,
    │   is_active
    │ )
    │
    ├─ Calcul display_order automatique
    │  (MAX(display_order) + 1)
    │
    └─ Refresh liste packages
       └─ Toast "✅ Conditionnement ajouté"
```

### Business Rules Conditionnements

1. **Package Single obligatoire** : Tout produit doit avoir au moins 1 package type='single'
2. **1 seul par défaut** : Exactement 1 package avec is_default=true
3. **Pricing modes** :
   - Mode 1 : Prix unitaire spécifique (`unit_price_ht` défini)
   - Mode 2 : Remise sur prix de base (`discount_rate` défini)

### Code Exemple

```typescript
const { packages, calculatePackagePrice } = useProductPackages({
  productId,
  autoFetch: true
})

// Créer conditionnement
const handleCreatePackage = async () => {
  const packageData = {
    product_id: productId,
    type: 'pack',
    base_quantity: 6,
    unit: 'unités',
    discount_rate: 0.10, // 10% remise
    is_default: false,
    is_active: true
  }

  await supabase
    .from('product_packages')
    .insert([packageData])

  toast.success('✅ Conditionnement créé')
  refetch()
}

// Calculer prix package
const basePrice = 50 // Prix unitaire de base
packages.forEach(pkg => {
  const price = calculatePackagePrice(basePrice, pkg)
  console.log(`Package ${pkg.base_quantity}x : ${price}€`)
})
```

---

## 6️⃣ Workflow Gestion Stock

### Diagramme Ajustement Stock

```
[Page Produit - Section Stock]
         │
         ├─ Clic "Ajuster stock"
         │
         ▼
┌─────────────────────┐
│ FORMULAIRE AJUST.  │
└─────────────────────┘
    │ Champs :
    │ • Type mouvement (adjustment)
    │ • Quantité (positive ou négative)
    │ • Raison (inventory_count, damage, etc.)
    │ • Notes
    │
    ├─ Validation :
    │  ✓ Quantité ≠ 0
    │  ✓ Stock final ≥ 0
    │  ✓ Raison sélectionnée
    │
    ▼
┌─────────────────────┐
│ INSERT MOUVEMENT   │
└─────────────────────┘
    │ INSERT stock_movements (
    │   product_id,
    │   movement_type,         -- 'adjustment'
    │   quantity_change,       -- +10 ou -5
    │   quantity_before,       -- stock_real actuel
    │   quantity_after,        -- stock_real + quantity_change
    │   affects_forecast,      -- false
    │   reason_code,
    │   notes,
    │   performed_at
    │ )
    │
    ▼
┌─────────────────────┐
│ UPDATE STOCK       │
└─────────────────────┘
    │ UPDATE products SET
    │   stock_real = stock_real + $quantity_change
    │ WHERE id = $product_id
    │
    ├─ Trigger : update_product_stock_status()
    │  └─ Recalcule status basé sur nouveau stock_real
    │     • stock_real > 0 → 'in_stock'
    │     • stock_real = 0 → 'out_of_stock'
    │
    └─ Toast "✅ Stock ajusté"
       └─ Refresh affichage stock
```

### Code Exemple

```typescript
// Ajustement stock manuel
const handleStockAdjustment = async (productId: string, quantityChange: number, reason: string) => {
  // 1. Récupérer stock actuel
  const { data: product } = await supabase
    .from('products')
    .select('stock_real')
    .eq('id', productId)
    .single()

  const stockBefore = product.stock_real || 0
  const stockAfter = stockBefore + quantityChange

  // Validation
  if (stockAfter < 0) {
    toast.error('❌ Stock final ne peut pas être négatif')
    return
  }

  // 2. Créer mouvement stock
  await supabase
    .from('stock_movements')
    .insert([{
      product_id: productId,
      movement_type: 'adjustment',
      quantity_change: quantityChange,
      quantity_before: stockBefore,
      quantity_after: stockAfter,
      affects_forecast: false,
      reason_code: reason,
      notes: `Ajustement manuel : ${quantityChange > 0 ? '+' : ''}${quantityChange}`,
      performed_at: new Date().toISOString()
    }])

  // 3. Mettre à jour stock produit
  await supabase
    .from('products')
    .update({ stock_real: stockAfter })
    .eq('id', productId)

  toast.success('✅ Stock ajusté')
  refetch()
}
```

---

## 7️⃣ Workflow Intégration Sourcing → Catalogue

### Diagramme Complet

```
[/produits/sourcing/produits]
         │
         ├─ Produit en statut 'sourcing'
         │
         ▼
┌─────────────────────┐
│ ÉCHANTILLON        │
│ (Optionnel)        │
└─────────────────────┘
    │ Si requires_sample = true :
    │ • Clic "Commander échantillon"
    │ • Création PO draft
    │ • Attente réception
    │
    ├─ Si échantillon OK ▼
    │
┌─────────────────────┐
│ VALIDATION         │
│ SOURCING           │
└─────────────────────┘
    │ Clic "Valider au catalogue"
    │
    ├─ Actions automatiques :
    │  1. UPDATE products SET
    │     status = 'in_stock',
    │     stock_real = 1,
    │     completion_percentage = 100,
    │     creation_mode = 'complete'
    │     WHERE id = $1
    │
    │  2. Trigger : update_product_stock_status()
    │     └─ Confirme status = 'in_stock'
    │
    │  3. INSERT stock_movements (
    │       movement_type = 'sourcing_validation',
    │       quantity_change = 1,
    │       affects_forecast = false
    │     )
    │
    └─ Redirection
       └─ /produits/catalogue/[productId]
          └─ Toast "✅ Produit validé au catalogue"
```

### Code Exemple

```typescript
// Hook : src/hooks/use-sourcing-products.ts

const validateSourcing = async (productId: string) => {
  try {
    // 1. Mettre à jour produit
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update({
        status: 'in_stock',
        stock_real: 1, // Stock initial après validation
        completion_percentage: 100,
        creation_mode: 'complete',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) throw updateError

    // 2. Créer mouvement stock
    await supabase
      .from('stock_movements')
      .insert([{
        product_id: productId,
        movement_type: 'sourcing_validation',
        quantity_change: 1,
        quantity_before: 0,
        quantity_after: 1,
        affects_forecast: false,
        reason_code: 'sourcing_completed',
        notes: 'Produit validé du sourcing au catalogue',
        performed_at: new Date().toISOString()
      }])

    toast.success('✅ Produit validé au catalogue')
    router.push(`/produits/catalogue/${productId}`)

    return product
  } catch (error) {
    toast.error('❌ Erreur validation')
    return null
  }
}
```

---

## 📊 Métriques Workflows

### Performance SLOs

| Workflow | SLO | Actuel | Statut |
|----------|-----|--------|--------|
| Création produit complet | <5s | 3.2s | ✅ |
| Upload image | <3s | 1.8s | ✅ |
| Modification produit | <2s | 1.5s | ✅ |
| Archivage | <1s | 0.5s | ✅ |
| Validation sourcing | <2s | 1.2s | ✅ |

### Triggers Database Automatiques

| Trigger | Déclenché sur | Fonction |
|---------|--------------|----------|
| `generate_product_sku` | INSERT products | Génère SKU auto (PRD-XXXX) |
| `calculate_product_completion` | INSERT/UPDATE products | Calcule completion_percentage |
| `update_product_stock_status` | UPDATE products.stock_real | Calcule status basé sur stock |
| `generate_public_url` | INSERT product_images | Génère public_url automatique |
| `ensure_single_primary_image` | UPDATE product_images.is_primary | Garantit 1 seule image primaire |

---

## 🔒 Permissions RLS

| Workflow | Owner | Admin | Catalog Manager | Sales | User |
|----------|-------|-------|-----------------|-------|------|
| Créer produit | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier produit | ✅ | ✅ | ✅ | ⚠️ Limited | ❌ |
| Archiver produit | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload images | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ajuster stock | ✅ | ✅ | ✅ | ❌ | ❌ |
| Voir détails | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 📚 Ressources

- **Hooks** : `docs/modules/produits/catalogue/hooks.md`
- **Composants** : `docs/modules/produits/catalogue/components.md`
- **Database** : `docs/database/tables/products.md`
- **Triggers** : `docs/database/triggers/`

---

**Dernière Mise à Jour** : 2025-10-27
**Mainteneur** : Vérone Dev Team
