'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  X, 
  Edit2, 
  Trash2, 
  Star, 
  StarOff,
  Home,
  Bed,
  Bath,
  Sofa,
  ChefHat,
  Trees,
  Building,
  Camera,
  MapPin,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react'

import {
  uploadProprietePhoto,
  updatePhotoMetadata,
  deletePhoto,
  setPhotoCover,
  reorderPhotos,
  getPhotosByPropriete,
  downloadPhoto
} from '@/actions/proprietes-photos'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
// import { Skeleton } from '@/components/ui/skeleton' // Component not installed yet
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// =============================================
// TYPES
// =============================================

interface Photo {
  id: string
  titre: string
  description?: string
  categorie?: string
  piece_nom?: string
  storage_path: string
  url_small?: string
  url_medium?: string
  url_large?: string
  url_original?: string
  is_cover: boolean
  ordre: number
  tags?: string[]
  metadata?: any
  created_at: string
}

// Helper function to get photo URL with fallback
function getPhotoUrl(photo: Photo, size: 'small' | 'medium' | 'large' | 'original' = 'medium'): string {
  // Try to use the specific size URL first
  const sizeUrls = {
    small: photo.url_small,
    medium: photo.url_medium,
    large: photo.url_large,
    original: photo.url_original
  }
  
  if (sizeUrls[size]) {
    return sizeUrls[size]
  }
  
  // Try other sizes as fallback
  const fallbackUrls = [photo.url_medium, photo.url_large, photo.url_original, photo.url_small].filter(Boolean)
  if (fallbackUrls.length > 0) {
    return fallbackUrls[0]
  }
  
  // Construct URL from storage_path as last resort
  if (photo.storage_path) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    return `${baseUrl}/storage/v1/object/public/proprietes-photos/${photo.storage_path}`
  }
  
  // Ultimate fallback - placeholder
  return '/placeholder-property.jpg'
}

interface PhotosManagerProps {
  proprieteId: string
  uniteId?: string
  initialPhotos?: Photo[]
  maxPhotos?: number
  categories?: string[]
  onPhotosChange?: (photos: Photo[]) => void
}

// =============================================
// CONSTANTES
// =============================================

const DEFAULT_CATEGORIES = [
  { value: 'facade', label: 'Façade', icon: Building },
  { value: 'salon', label: 'Salon', icon: Sofa },
  { value: 'cuisine', label: 'Cuisine', icon: ChefHat },
  { value: 'chambre', label: 'Chambre', icon: Bed },
  { value: 'salle_bain', label: 'Salle de bain', icon: Bath },
  { value: 'jardin', label: 'Jardin/Extérieur', icon: Trees },
  { value: 'vue', label: 'Vue', icon: MapPin },
  { value: 'autre', label: 'Autre', icon: Camera }
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif']
}

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export function PhotosManager({
  proprieteId,
  uniteId,
  initialPhotos = [],
  maxPhotos = 50,
  categories = DEFAULT_CATEGORIES.map(c => c.value),
  onPhotosChange
}: PhotosManagerProps) {
  // State
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filtrage des photos
  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = filterCategory === 'all' || photo.categorie === filterCategory
    const matchesSearch = !searchQuery || 
      photo.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.piece_nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  }).sort((a, b) => a.ordre - b.ordre)

  // Stats
  const stats = {
    total: photos.length,
    byCategory: categories.reduce((acc, cat) => {
      acc[cat] = photos.filter(p => p.categorie === cat).length
      return acc
    }, {} as Record<string, number>),
    hasCover: photos.some(p => p.is_cover)
  }

  // =============================================
  // UPLOAD HANDLERS
  // =============================================

  const handleUpload = useCallback(async (acceptedFiles: File[]) => {
    console.log('📤 Début handleUpload:', { filesCount: acceptedFiles.length, currentPhotos: photos.length, maxPhotos })
    
    if (photos.length + acceptedFiles.length > maxPhotos) {
      const errorMsg = `Limite de ${maxPhotos} photos atteinte (actuellement ${photos.length})`
      console.error('❌ Limite atteinte:', errorMsg)
      toast.error(errorMsg)
      return
    }

    // Validation côté client des fichiers
    const validFiles: File[] = []
    const errors: string[] = []
    
    for (const file of acceptedFiles) {
      // Vérifier la taille
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB, max 10MB)`)
        continue
      }
      
      // Vérifier le type
      if (!Object.keys(ACCEPTED_FORMATS).includes(file.type)) {
        errors.push(`${file.name}: type non supporté (${file.type})`)
        continue
      }
      
      validFiles.push(file)
    }
    
    // Afficher les erreurs de validation
    if (errors.length > 0) {
      console.error('❌ Erreurs validation client:', errors)
      errors.forEach(error => toast.error(error))
      if (validFiles.length === 0) return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const totalFiles = validFiles.length
    let uploadedCount = 0
    let successCount = 0
    const newPhotos: Photo[] = []
    const uploadErrors: string[] = []

    for (const file of validFiles) {
      try {
        console.log(`📤 Upload ${uploadedCount + 1}/${totalFiles}:`, file.name)
        
        // Préparation des métadonnées
        const metadata = {
          propriete_id: proprieteId,
          unite_id: uniteId,
          titre: file.name.replace(/\.[^/.]+$/, ''), // Nom sans extension
          is_public: true // Les photos de propriétés sont publiques par défaut
        }

        // Upload avec gestion d'erreur améliorée
        const result = await uploadProprietePhoto(file, metadata)
        console.log(`📤 Résultat upload ${file.name}:`, result.success ? 'SUCCESS' : 'ERROR')
        
        if (result.success && result.data) {
          // Transform to Photo interface avec URLs appropriées
          const photo: Photo = {
            id: result.data.id,
            titre: result.data.titre || metadata.titre,
            description: result.data.description,
            categorie: result.data.categorie,
            piece_nom: result.data.piece_nom,
            storage_path: result.data.storage_path,
            url_small: result.data.url_thumbnail,
            url_medium: result.data.url_medium,
            url_large: result.data.url_large,
            url_original: result.data.url_original,
            is_cover: result.data.is_cover || (photos.length === 0 && newPhotos.length === 0),
            ordre: result.data.display_order || (photos.length + newPhotos.length),
            tags: result.data.tags || [],
            metadata: null,
            created_at: result.data.created_at
          }
          newPhotos.push(photo)
          successCount++
          console.log(`✅ Photo ajoutée:`, photo.id)
        } else {
          const errorMsg = `${file.name}: ${result.error || 'Erreur inconnue'}`
          uploadErrors.push(errorMsg)
          console.error(`❌ Échec upload ${file.name}:`, result.error)
        }
      } catch (error) {
        const errorMsg = `${file.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        uploadErrors.push(errorMsg)
        console.error('💥 Exception upload:', error)
      }
      
      uploadedCount++
      setUploadProgress(Math.round((uploadedCount / totalFiles) * 100))
    }

    // Afficher les résultats
    if (uploadErrors.length > 0) {
      console.error('❌ Erreurs upload:', uploadErrors)
      uploadErrors.forEach(error => toast.error(error, { duration: 5000 }))
    }

    if (successCount > 0) {
      const updatedPhotos = [...photos, ...newPhotos]
      setPhotos(updatedPhotos)
      onPhotosChange?.(updatedPhotos)
      
      const successMsg = successCount === 1 
        ? '✅ Photo téléchargée avec succès' 
        : `✅ ${successCount} photos téléchargées avec succès`
      console.log(successMsg)
      toast.success(successMsg)
    }

    if (successCount === 0 && uploadErrors.length > 0) {
      toast.error('❌ Aucune photo n\'a pu être téléchargée')
    }

    setIsUploading(false)
    setUploadProgress(0)
    console.log('📤 handleUpload terminé:', { successCount, errorsCount: uploadErrors.length })
  }, [photos, maxPhotos, proprieteId, uniteId, onPhotosChange])

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: ACCEPTED_FORMATS,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled: isUploading || photos.length >= maxPhotos
  })

  // =============================================
  // PHOTO ACTIONS
  // =============================================

  const handleSetCover = async (photoId: string) => {
    const result = await setPhotoCover(photoId, proprieteId, uniteId)
    
    if (result.success) {
      const updatedPhotos = photos.map(p => ({
        ...p,
        is_cover: p.id === photoId
      }))
      setPhotos(updatedPhotos)
      onPhotosChange?.(updatedPhotos)
      toast.success('Photo de couverture définie')
    } else {
      toast.error(result.error || 'Erreur lors de la définition de la couverture')
    }
  }

  const handleUpdatePhoto = async (photoId: string, updates: Partial<Photo>) => {
    const result = await updatePhotoMetadata(photoId, updates)
    
    if (result.success && result.data) {
      const updatedPhotos = photos.map(p => 
        p.id === photoId ? { ...p, ...result.data } : p
      )
      setPhotos(updatedPhotos)
      onPhotosChange?.(updatedPhotos)
      toast.success('Photo mise à jour')
      setEditingPhoto(null)
    } else {
      toast.error(result.error || 'Erreur lors de la mise à jour')
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Supprimer cette photo ?')) return

    const result = await deletePhoto(photoId)
    
    if (result.success) {
      const updatedPhotos = photos.filter(p => p.id !== photoId)
      setPhotos(updatedPhotos)
      onPhotosChange?.(updatedPhotos)
      toast.success('Photo supprimée')
      setSelectedPhotos(prev => prev.filter(id => id !== photoId))
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
  }

  const handleBatchDelete = async () => {
    if (!selectedPhotos.length) return
    if (!confirm(`Supprimer ${selectedPhotos.length} photo(s) ?`)) return

    let deletedCount = 0
    for (const photoId of selectedPhotos) {
      const result = await deletePhoto(photoId)
      if (result.success) deletedCount++
    }

    const updatedPhotos = photos.filter(p => !selectedPhotos.includes(p.id))
    setPhotos(updatedPhotos)
    onPhotosChange?.(updatedPhotos)
    setSelectedPhotos([])
    toast.success(`${deletedCount} photo(s) supprimée(s)`)
  }

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const reorderedPhotos = [...filteredPhotos]
    const [movedPhoto] = reorderedPhotos.splice(fromIndex, 1)
    reorderedPhotos.splice(toIndex, 0, movedPhoto)
    
    // Mise à jour des ordres - reorderPhotos expects just the photo IDs in the new order
    const photoIds = reorderedPhotos.map(photo => photo.id)

    const result = await reorderPhotos(proprieteId, photoIds)
    
    if (result.success) {
      // Update the ordre based on the new order
      const updatedPhotos = reorderedPhotos.map((photo, index) => ({
        ...photo,
        ordre: index
      }))
      setPhotos(updatedPhotos)
      onPhotosChange?.(updatedPhotos)
    }
  }

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Gestion des photos
              </CardTitle>
              <CardDescription>
                {stats.total} / {maxPhotos} photos • 
                {stats.hasCover ? ' ✓ Photo de couverture définie' : ' ⚠️ Aucune photo de couverture'}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedPhotos.length > 0 && (
                <>
                  <Badge variant="secondary">
                    {selectedPhotos.length} sélectionnée(s)
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par titre, pièce ou tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {DEFAULT_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                  {stats.byCategory[cat.value] > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {stats.byCategory[cat.value]}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Zone d'upload */}
      {photos.length < maxPhotos && (
        <Card>
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              <input {...getInputProps()} />
              
              {isUploading ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                  <p className="text-sm text-gray-600">Téléchargement en cours...</p>
                  <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">
                    {isDragActive ? 'Déposez les photos ici' : 'Cliquez ou déposez des photos'}
                  </p>
                  <p className="text-sm text-gray-500">
                    JPG, PNG, WebP jusqu'à 10MB • Maximum {maxPhotos - photos.length} photos restantes
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Galerie de photos */}
      {filteredPhotos.length > 0 ? (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "space-y-4"
        )}>
          {filteredPhotos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              viewMode={viewMode}
              isSelected={selectedPhotos.includes(photo.id)}
              onSelect={() => {
                setSelectedPhotos(prev =>
                  prev.includes(photo.id)
                    ? prev.filter(id => id !== photo.id)
                    : [...prev, photo.id]
                )
              }}
              onView={() => setViewingPhoto(photo)}
              onEdit={() => setEditingPhoto(photo)}
              onSetCover={() => handleSetCover(photo.id)}
              onDelete={() => handleDeletePhoto(photo.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              {searchQuery || filterCategory !== 'all' 
                ? 'Aucune photo trouvée avec ces critères'
                : 'Aucune photo téléchargée'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'édition */}
      {editingPhoto && (
        <EditPhotoDialog
          photo={editingPhoto}
          categories={DEFAULT_CATEGORIES}
          onSave={(updates) => handleUpdatePhoto(editingPhoto.id, updates)}
          onClose={() => setEditingPhoto(null)}
        />
      )}

      {/* Lightbox de visualisation */}
      {viewingPhoto && (
        <PhotoLightbox
          photos={filteredPhotos}
          currentPhoto={viewingPhoto}
          onClose={() => setViewingPhoto(null)}
          onNavigate={(photo) => setViewingPhoto(photo)}
        />
      )}
    </div>
  )
}

// =============================================
// COMPOSANTS SECONDAIRES
// =============================================

function PhotoCard({
  photo,
  index,
  viewMode,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onSetCover,
  onDelete
}: {
  photo: Photo
  index: number
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: () => void
  onView: () => void
  onEdit: () => void
  onSetCover: () => void
  onDelete: () => void
}) {
  const categoryInfo = DEFAULT_CATEGORIES.find(c => c.value === photo.categorie)
  const Icon = categoryInfo?.icon || Camera

  if (viewMode === 'list') {
    return (
      <Card className={cn("overflow-hidden", isSelected && "ring-2 ring-primary")}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0">
              <Image
                src={getPhotoUrl(photo, 'small')}
                alt={photo.titre}
                fill
                className="object-cover rounded cursor-pointer"
                onClick={onView}
              />
              {photo.is_cover && (
                <div className="absolute top-1 left-1 bg-yellow-500 text-white p-1 rounded">
                  <Star className="h-3 w-3" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{photo.titre}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  <Icon className="h-3 w-3 mr-1" />
                  {categoryInfo?.label || 'Autre'}
                </Badge>
                {photo.piece_nom && (
                  <Badge variant="secondary" className="text-xs">
                    {photo.piece_nom}
                  </Badge>
                )}
              </div>
              {photo.tags && photo.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {photo.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="rounded border-gray-300"
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onView}>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Voir
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSetCover}>
                    {photo.is_cover ? (
                      <>
                        <StarOff className="h-4 w-4 mr-2" />
                        Retirer couverture
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Définir comme couverture
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden group", isSelected && "ring-2 ring-primary")}>
      <div className="relative aspect-square">
        <Image
          src={getPhotoUrl(photo, 'medium')}
          alt={photo.titre}
          fill
          className="object-cover cursor-pointer"
          onClick={onView}
        />
        
        {/* Overlay avec actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-white"
              onClick={(e) => e.stopPropagation()}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSetCover}>
                  <Star className="h-4 w-4 mr-2" />
                  {photo.is_cover ? 'Retirer couverture' : 'Définir comme couverture'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Badges */}
        {photo.is_cover && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
            Couverture
          </div>
        )}
        
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex gap-1">
            <Badge variant="secondary" className="text-xs bg-white/90">
              <Icon className="h-3 w-3 mr-1" />
              {categoryInfo?.label}
            </Badge>
            {photo.piece_nom && (
              <Badge variant="secondary" className="text-xs bg-white/90">
                {photo.piece_nom}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <CardContent className="p-3">
        <p className="font-medium text-sm truncate">{photo.titre}</p>
        {photo.description && (
          <p className="text-xs text-gray-500 truncate mt-1">{photo.description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function EditPhotoDialog({
  photo,
  categories,
  onSave,
  onClose
}: {
  photo: Photo
  categories: typeof DEFAULT_CATEGORIES
  onSave: (updates: Partial<Photo>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    titre: photo.titre,
    description: photo.description || '',
    categorie: photo.categorie || '',
    piece_nom: photo.piece_nom || '',
    tags: photo.tags?.join(', ') || ''
  })

  const handleSubmit = () => {
    onSave({
      titre: formData.titre,
      description: formData.description,
      categorie: formData.categorie,
      piece_nom: formData.piece_nom,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier la photo</DialogTitle>
          <DialogDescription>
            Ajoutez des informations pour mieux organiser vos photos
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="relative aspect-square">
            <Image
              src={getPhotoUrl(photo, 'medium')}
              alt={photo.titre}
              fill
              className="object-cover rounded"
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="titre">Titre</Label>
              <Input
                id="titre"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                placeholder="Ex: Vue du salon"
              />
            </div>
            
            <div>
              <Label htmlFor="categorie">Catégorie</Label>
              <Select 
                value={formData.categorie} 
                onValueChange={(value) => setFormData({ ...formData, categorie: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="piece">Pièce / Espace</Label>
              <Input
                id="piece"
                value={formData.piece_nom}
                onChange={(e) => setFormData({ ...formData, piece_nom: e.target.value })}
                placeholder="Ex: Salon principal, Chambre 1..."
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la photo..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Ex: lumineux, rénové, vue mer..."
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PhotoLightbox({
  photos,
  currentPhoto,
  onClose,
  onNavigate
}: {
  photos: Photo[]
  currentPhoto: Photo
  onClose: () => void
  onNavigate: (photo: Photo) => void
}) {
  const currentIndex = photos.findIndex(p => p.id === currentPhoto.id)
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(photos[currentIndex - 1])
    }
  }
  
  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      onNavigate(photos[currentIndex + 1])
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="font-semibold">{currentPhoto.titre}</h3>
              <p className="text-sm text-gray-500">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Image */}
          <div className="flex-1 relative bg-black">
            <Image
              src={getPhotoUrl(currentPhoto, 'large')}
              alt={currentPhoto.titre}
              fill
              className="object-contain"
            />
            
            {/* Navigation */}
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            
            {currentIndex < photos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>
          
          {/* Footer avec infos */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentPhoto.categorie && (
                  <Badge variant="outline">
                    {DEFAULT_CATEGORIES.find(c => c.value === currentPhoto.categorie)?.label}
                  </Badge>
                )}
                {currentPhoto.piece_nom && (
                  <Badge variant="secondary">{currentPhoto.piece_nom}</Badge>
                )}
                {currentPhoto.is_cover && (
                  <Badge className="bg-yellow-500">Photo de couverture</Badge>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const result = await downloadPhoto(currentPhoto.id)
                  if (result.success && result.url) {
                    window.open(result.url, '_blank')
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
            
            {currentPhoto.description && (
              <p className="text-sm text-gray-600 mt-2">{currentPhoto.description}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}