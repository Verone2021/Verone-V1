# Images Produits

**Module** : Produits → Images
**Status** : ✅ PRODUCTION READY
**Date Validation** : 2025-10-27

---

## 📊 Vue d'Ensemble

Le module **Images** gère l'ensemble du système d'images produits avec upload, stockage Supabase, et triggers automatiques.

**Features clés** :
- Upload multiple (drag & drop)
- Image primaire automatique
- Génération URL publique auto
- Types images (gallery, technical, lifestyle, etc.)
- Compression et optimisation
- Réorganisation (drag & drop)

---

## ✅ Features Validées

### Upload & Stockage

- ✅ **Upload single** : 1 fichier à la fois
- ✅ **Upload multiple** : Plusieurs fichiers simultanés
- ✅ **Drag & drop** : Zone de dépôt visuelle
- ✅ **Validation** : Format (JPEG/PNG/WebP), Taille (max 5MB)
- ✅ **Compression** : Automatique si > 1MB
- ✅ **Stockage** : Supabase Storage (product-images bucket)
- ✅ **Path structure** : `products/{productId}/{timestamp}-{random}.{ext}`

### Gestion Images

- ✅ **Galerie** : Affichage grille avec tri
- ✅ **Image primaire** : 1 seule image primaire par produit
- ✅ **Trigger automatique** : Garantit single primary image
- ✅ **Suppression** : Delete image + storage cleanup
- ✅ **Réorganisation** : display_order modifiable
- ✅ **Métadonnées** : alt_text, image_type, dimensions

### Types Images

- ✅ **gallery** : Images galerie produit (défaut)
- ✅ **technical** : Photos techniques/dimensions
- ✅ **detail** : Détails/gros plans
- ✅ **lifestyle** : Mise en situation
- ✅ **dimension** : Schémas dimensions
- ✅ **other** : Autres types

### URL Publiques

- ✅ **Génération automatique** : Trigger `generate_public_url()`
- ✅ **URL stable** : Basée sur storage_path
- ✅ **Cache** : Cache-Control 3600s

---

## 📁 Database

### Table `product_images`

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  image_type VARCHAR(50) DEFAULT 'gallery',
  alt_text TEXT,
  file_size INTEGER,
  format VARCHAR(10),
  width INTEGER,
  height INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Colonnes clés** :
- `storage_path` : Chemin Supabase Storage (UNIQUE)
- `public_url` : URL publique générée automatiquement
- `is_primary` : Image primaire (1 seule par produit)
- `image_type` : Type enum (gallery, technical, etc.)
- `display_order` : Ordre affichage galerie

### Triggers Automatiques

#### `generate_public_url()`

Génère `public_url` automatiquement à l'INSERT.

```sql
CREATE TRIGGER trigger_generate_public_url
BEFORE INSERT ON product_images
FOR EACH ROW
EXECUTE FUNCTION generate_public_url();
```

#### `ensure_single_primary_image()`

Garantit 1 seule image primaire par produit.

```sql
CREATE TRIGGER trigger_ensure_single_primary
AFTER INSERT OR UPDATE ON product_images
FOR EACH ROW
WHEN (NEW.is_primary = true)
EXECUTE FUNCTION ensure_single_primary_image();

-- Fonction
CREATE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Unset autres images primaires du même produit
  UPDATE product_images
  SET is_primary = false
  WHERE product_id = NEW.product_id
    AND id != NEW.id
    AND is_primary = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Hook Principal

### `useProductImages(options)`

Hook complet gestion images produit.

```typescript
interface UseProductImagesOptions {
  productId: string
  bucketName?: string
  autoFetch?: boolean
}

type ImageType = 'gallery' | 'technical' | 'detail' | 'lifestyle' | 'dimension' | 'other'

function useProductImages(options: UseProductImagesOptions): {
  // 📊 Data
  images: ProductImage[]
  primaryImage: ProductImage | null
  galleryImages: ProductImage[]
  technicalImages: ProductImage[]

  // 🔄 State
  loading: boolean
  uploading: boolean
  error: string | null

  // 🎬 Actions
  fetchImages: () => Promise<void>
  uploadImage: (file: File, options?: UploadOptions) => Promise<ProductImage>
  uploadMultipleImages: (files: File[], options?: MultiUploadOptions) => Promise<ProductImage[]>
  deleteImage: (imageId: string) => Promise<void>
  reorderImages: (imageIds: string[]) => Promise<void>
  setPrimaryImage: (imageId: string) => Promise<void>
  updateImageMetadata: (imageId: string, metadata: ImageMetadata) => Promise<void>

  // 🛠️ Helpers
  getImagesByType: (type: ImageType) => ProductImage[]

  // 📈 Stats
  totalImages: number
  hasImages: boolean
}
```

---

## 🔄 Workflow Upload Image

```
1. User sélectionne fichier(s)
   • Input file
   • Drag & drop

2. Validation client
   ✓ Format : JPEG/PNG/WebP
   ✓ Taille : max 5MB
   ✓ Max 10 images total

3. Compression (si > 1MB)
   • Resize max 1920px
   • Qualité 85%

4. Upload Supabase Storage
   • Bucket : product-images
   • Path : products/{productId}/{timestamp}-{random}.{ext}
   • Progress bar

5. INSERT product_images
   • storage_path
   • is_primary (true si première image)
   • image_type
   • alt_text

6. Trigger : generate_public_url()
   → Génère public_url automatiquement

7. Trigger : ensure_single_primary_image()
   → Si is_primary=true, unset autres

8. Refresh galerie
   ✅ Image uploadée et visible
```

---

## 🖼️ Workflow Définir Image Primaire

```
1. Galerie images produit
2. Clic "Définir comme primaire" sur image
3. UPDATE product_images SET
     is_primary = true
   WHERE id = $imageId
4. Trigger : ensure_single_primary_image()
   • Unset anciennes primaires
   • Set nouvelle primaire
5. Refresh galerie
   ✅ Nouvelle image primaire définie
```

---

## 🗑️ Workflow Suppression Image

```
1. Clic "Supprimer" sur image
2. Confirmation
3. DELETE FROM product_images WHERE id = $imageId
4. Cleanup Supabase Storage
   • supabase.storage.from('product-images').remove([storage_path])
5. Si image supprimée était primaire :
   • Définir automatiquement nouvelle primaire
   • (Première image restante)
6. Refresh galerie
   ✅ Image supprimée
```

---

## 📊 Validation & Optimisation

### Validation Upload

```typescript
const validateImage = (file: File): boolean => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (file.size > maxSize) {
    throw new Error('Image trop volumineuse (max 5MB)')
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format non supporté (JPEG, PNG, WebP uniquement)')
  }

  return true
}
```

### Compression Automatique

```typescript
import imageCompression from 'browser-image-compression'

const compressImage = async (file: File): Promise<File> => {
  if (file.size < 1 * 1024 * 1024) {
    return file // Pas besoin compression
  }

  return await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  })
}
```

---

## 🎨 Composant Galerie

### Pattern Galerie Images

```typescript
import { useProductImages } from '@/hooks/use-product-images'

export default function ProductImageGallery({ productId }: { productId: string }) {
  const {
    images,
    primaryImage,
    uploading,
    uploadImage,
    deleteImage,
    setPrimaryImage
  } = useProductImages({
    productId,
    autoFetch: true
  })

  const handleUpload = async (file: File) => {
    try {
      await uploadImage(file, {
        imageType: 'gallery',
        isPrimary: images.length === 0, // Première = primary
        altText: file.name
      })
      toast.success('✅ Image uploadée')
    } catch (error) {
      toast.error('❌ Erreur upload')
    }
  }

  return (
    <div>
      {/* Upload zone */}
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

      {/* Galerie */}
      <div className="grid grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="relative">
            <img
              src={image.public_url}
              alt={image.alt_text}
              className="w-full h-40 object-cover rounded"
            />

            {image.is_primary && (
              <Badge className="absolute top-2 left-2">Primaire</Badge>
            )}

            <div className="actions absolute top-2 right-2">
              {!image.is_primary && (
                <button onClick={() => setPrimaryImage(image.id)}>
                  Définir primaire
                </button>
              )}
              <button onClick={() => deleteImage(image.id)}>
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

## 📚 Ressources

- **Hooks** : `./hooks.md`
- **Database** : `docs/database/tables/product_images.md`
- **Triggers** : `docs/database/triggers/product_images_triggers.md`

---

**Dernière Mise à Jour** : 2025-10-27
**Mainteneur** : Vérone Dev Team
