# Hooks Images - Documentation

**Module** : Produits → Images
**Date** : 2025-10-27

---

## 📋 Hook Principal

### `useProductImages(options)`

Hook complet gestion images produit avec triggers automatiques.

### Signature Complète

```typescript
interface UseProductImagesOptions {
  productId: string
  bucketName?: string  // Défaut: 'product-images'
  autoFetch?: boolean  // Défaut: true
}

type ImageType = 'gallery' | 'technical' | 'detail' | 'lifestyle' | 'dimension' | 'other'

interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  public_url: string
  display_order: number
  is_primary: boolean
  image_type: ImageType
  alt_text: string | null
  file_size: number | null
  format: string | null
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
}

interface UploadOptions {
  isPrimary?: boolean
  imageType?: ImageType
  altText?: string
}

interface MultiUploadOptions {
  imageType?: ImageType
  altTextPrefix?: string
  firstImagePrimary?: boolean
}

interface ImageMetadata {
  alt_text?: string
  image_type?: ImageType
  width?: number
  height?: number
}

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

## 📤 Action : `uploadImage()`

Upload une image avec validation et compression automatique.

### Algorithme

```typescript
async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<ProductImage> {
  try {
    // 1. Validation
    validateImage(file)

    // 2. Compression (si > 1MB)
    const compressedFile = await compressImage(file)

    // 3. Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `products/${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // 4. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // 5. Get next display_order
    const nextOrder = getNextDisplayOrder()

    // 6. Create database record
    const imageData = {
      product_id: productId,
      storage_path: uploadData.path,
      display_order: nextOrder,
      is_primary: options.isPrimary || false,
      image_type: options.imageType || 'gallery',
      alt_text: options.altText || file.name,
      file_size: file.size,
      format: fileExt || 'jpg'
    }

    const { data: dbData, error: dbError } = await supabase
      .from('product_images')
      .insert([imageData])
      .select()
      .single()

    if (dbError) {
      // Cleanup uploaded file if database insert fails
      await supabase.storage.from(bucketName).remove([uploadData.path])
      throw dbError
    }

    // 7. Triggers automatiques :
    //    - generate_public_url() → génère public_url
    //    - ensure_single_primary_image() → gère primary

    // 8. Refresh images list
    await fetchImages()

    return dbData
  } catch (error) {
    throw error
  }
}
```

### Exemple

```typescript
const { uploadImage } = useProductImages({ productId })

// Upload simple
await uploadImage(file, {
  imageType: 'gallery',
  altText: 'Photo produit principale'
})

// Upload avec primary
await uploadImage(file, {
  isPrimary: true, // Sera LA image primaire
  imageType: 'gallery',
  altText: 'Image principale'
})
```

---

## 📤 Action : `uploadMultipleImages()`

Upload plusieurs images en parallèle.

### Algorithme

```typescript
async function uploadMultipleImages(
  files: File[],
  options: MultiUploadOptions = {}
): Promise<ProductImage[]> {
  const results = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      const result = await uploadImage(file, {
        imageType: options.imageType || 'gallery',
        altText: options.altTextPrefix
          ? `${options.altTextPrefix} ${i + 1}`
          : file.name,
        isPrimary: options.firstImagePrimary && i === 0
      })
      results.push(result)
    } catch (error) {
      console.error('Erreur upload image:', error)
      // Continue avec les autres fichiers
    }
  }

  return results
}
```

### Exemple

```typescript
const { uploadMultipleImages } = useProductImages({ productId })

const files = Array.from(fileInput.files || [])

await uploadMultipleImages(files, {
  imageType: 'gallery',
  altTextPrefix: 'Fauteuil Vintage',
  firstImagePrimary: images.length === 0 // Si aucune image, première = primary
})
```

---

## 🗑️ Action : `deleteImage()`

Supprime une image (database + storage).

### Algorithme

```typescript
async function deleteImage(imageId: string): Promise<void> {
  try {
    // 1. Get image info
    const { data: imageData } = await supabase
      .from('product_images')
      .select('id, product_id, storage_path, public_url, is_primary')
      .eq('id', imageId)
      .single()

    // 2. Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([imageData.storage_path])

    if (storageError) {
      console.warn('Erreur suppression storage (non-bloquant)')
    }

    // 3. Delete from database
    const { error: dbError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)

    if (dbError) throw dbError

    // 4. Si image primaire supprimée → Définir nouvelle primaire
    if (imageData.is_primary && images.length > 1) {
      const firstRemaining = images.find(img => img.id !== imageId)
      if (firstRemaining) {
        await setPrimaryImage(firstRemaining.id)
      }
    }

    // 5. Refresh
    await fetchImages()
  } catch (error) {
    throw error
  }
}
```

---

## 🎯 Action : `setPrimaryImage()`

Définit une image comme primaire (trigger gère l'unset des autres).

### Algorithme

```typescript
async function setPrimaryImage(imageId: string): Promise<void> {
  try {
    // UPDATE avec is_primary=true
    const { error } = await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId)

    if (error) throw error

    // Trigger : ensure_single_primary_image()
    // → Unset automatiquement autres primaires du même produit

    await fetchImages()
  } catch (error) {
    throw error
  }
}
```

### Exemple

```typescript
const { setPrimaryImage } = useProductImages({ productId })

// Définir image comme primaire
await setPrimaryImage(imageId)
// Trigger s'assure qu'il n'y a qu'1 seule image is_primary=true
```

---

## 🔄 Action : `reorderImages()`

Réorganise l'ordre des images (drag & drop).

### Algorithme

```typescript
async function reorderImages(imageIds: string[]): Promise<void> {
  try {
    // Update display_order pour chaque image
    const updates = imageIds.map((imageId, index) =>
      supabase
        .from('product_images')
        .update({ display_order: index })
        .eq('id', imageId)
    )

    await Promise.all(updates)
    await fetchImages()
  } catch (error) {
    throw error
  }
}
```

### Exemple

```typescript
const { images, reorderImages } = useProductImages({ productId })

// Après drag & drop
const newOrder = ['id3', 'id1', 'id2', 'id4']
await reorderImages(newOrder)
```

---

## 🛠️ Helper : `getImagesByType()`

Filtre images par type.

```typescript
function getImagesByType(type: ImageType): ProductImage[] {
  return images.filter(img => img.image_type === type)
}

// Exemples
const galleryImages = getImagesByType('gallery')
const technicalImages = getImagesByType('technical')
const lifestyleImages = getImagesByType('lifestyle')
```

---

## 📈 Stats Disponibles

```typescript
const {
  totalImages,      // Nombre total d'images
  hasImages,        // Au moins 1 image ?
  galleryImages,    // Images type='gallery'
  technicalImages   // Images type='technical'
} = useProductImages({ productId })

console.log(`${totalImages} images (${galleryImages.length} galerie, ${technicalImages.length} techniques)`)
```

---

## 🎯 Exemple Complet

```typescript
import { useProductImages } from '@/hooks/use-product-images'

export default function ProductImagesManagement({ productId }: { productId: string }) {
  const {
    images,
    primaryImage,
    uploading,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    setPrimaryImage,
    reorderImages
  } = useProductImages({
    productId,
    autoFetch: true
  })

  // Upload single
  const handleSingleUpload = async (file: File) => {
    try {
      await uploadImage(file, {
        imageType: 'gallery',
        altText: 'Photo produit',
        isPrimary: images.length === 0
      })
      toast.success('✅ Image uploadée')
    } catch (error) {
      toast.error('❌ Erreur upload')
    }
  }

  // Upload multiple
  const handleMultipleUpload = async (files: FileList) => {
    try {
      const filesArray = Array.from(files)
      await uploadMultipleImages(filesArray, {
        imageType: 'gallery',
        firstImagePrimary: images.length === 0
      })
      toast.success(`✅ ${filesArray.length} images uploadées`)
    } catch (error) {
      toast.error('❌ Erreur upload')
    }
  }

  // Delete
  const handleDelete = async (imageId: string) => {
    if (!confirm('Supprimer cette image ?')) return
    await deleteImage(imageId)
  }

  // Set primary
  const handleSetPrimary = async (imageId: string) => {
    await setPrimaryImage(imageId)
  }

  // Reorder (après drag & drop)
  const handleReorder = async (newOrder: string[]) => {
    await reorderImages(newOrder)
  }

  return (
    <div>
      {/* Upload zone */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleMultipleUpload(e.target.files)}
        disabled={uploading}
      />
      {uploading && <span>Upload en cours...</span>}

      {/* Galerie */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        {images.map(image => (
          <div key={image.id} className="relative">
            <img src={image.public_url} alt={image.alt_text} />

            {image.is_primary && (
              <Badge className="absolute top-2 left-2">Primaire</Badge>
            )}

            <div className="actions absolute top-2 right-2 flex gap-1">
              {!image.is_primary && (
                <button onClick={() => handleSetPrimary(image.id)}>
                  Primaire
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

## 📚 Ressources

- **README Images** : `./README.md`
- **Database** : `docs/database/tables/product_images.md`
- **Triggers** : `docs/database/triggers/product_images_triggers.md`

---

**Dernière Mise à Jour** : 2025-10-27
