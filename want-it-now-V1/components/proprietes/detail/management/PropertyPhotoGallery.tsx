'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Star,
  StarOff,
  ChevronLeft,
  ChevronRight,
  Expand,
  Download,
  Upload,
  Grid3x3,
  LayoutGrid
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Photo {
  id: string
  url: string
  titre?: string
  categorie?: string
  is_cover?: boolean
  created_at?: string
}

interface PropertyPhotoGalleryProps {
  photos: Photo[]
  propertyId: string
  canEdit?: boolean
  onUpload?: () => void
  onDelete?: (photoId: string) => void
  onSetCover?: (photoId: string) => void
  className?: string
}

export function PropertyPhotoGallery({ 
  photos = [],
  propertyId,
  canEdit = false,
  onUpload,
  onDelete,
  onSetCover,
  className 
}: PropertyPhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const coverPhoto = photos.find(p => p.is_cover) || photos[0]

  const openLightbox = (photo: Photo, index: number) => {
    setSelectedPhoto(photo)
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % photos.length
      : (currentIndex - 1 + photos.length) % photos.length
    setCurrentIndex(newIndex)
    setSelectedPhoto(photos[newIndex])
  }

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-brand-copper" />
                Galerie Photos
              </CardTitle>
              <Badge variant="secondary">
                {photos.length} photo{photos.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Toggle view mode */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-2 py-1 h-7"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-2 py-1 h-7"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>

              {canEdit && onUpload && (
                <Button 
                  onClick={onUpload}
                  className="bg-brand-copper hover:bg-brand-copper/90 text-white"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-center mb-4">Aucune photo disponible</p>
              {canEdit && onUpload && (
                <Button 
                  onClick={onUpload}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter des photos
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Hero/Cover Photo Section */}
              {coverPhoto && (
                <div className="mb-6">
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden group cursor-pointer"
                    onClick={() => openLightbox(coverPhoto, photos.indexOf(coverPhoto))}
                  >
                    <Image
                      src={coverPhoto.url}
                      alt={coverPhoto.titre || 'Photo de couverture'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Cover badge */}
                    {coverPhoto.is_cover && (
                      <Badge className="absolute top-4 left-4 bg-brand-copper text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Photo de couverture
                      </Badge>
                    )}
                    
                    {/* Expand icon */}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Expand className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Gallery Grid/List */}
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  : "space-y-4"
              )}>
                {photos.filter(p => p !== coverPhoto).map((photo, index) => {
                  const actualIndex = photos.indexOf(photo)
                  return (
                    <div
                      key={photo.id}
                      className={cn(
                        "group relative rounded-lg overflow-hidden cursor-pointer",
                        viewMode === 'grid' 
                          ? "aspect-square" 
                          : "flex gap-4 p-3 border rounded-lg hover:bg-gray-50"
                      )}
                      onClick={() => viewMode === 'grid' && openLightbox(photo, actualIndex)}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <Image
                            src={photo.url}
                            alt={photo.titre || `Photo ${index + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                openLightbox(photo, actualIndex)
                              }}
                            >
                              <Expand className="w-4 h-4" />
                            </Button>
                            {canEdit && (
                              <>
                                {onSetCover && !photo.is_cover && (
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onSetCover(photo.id)
                                    }}
                                  >
                                    <Star className="w-4 h-4" />
                                  </Button>
                                )}
                                {onDelete && (
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDelete(photo.id)
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={photo.url}
                              alt={photo.titre || `Photo ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {photo.titre || `Photo ${index + 1}`}
                            </h4>
                            {photo.categorie && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {photo.categorie}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {canEdit && (
                              <>
                                {onSetCover && !photo.is_cover && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSetCover(photo.id)}
                                  >
                                    <Star className="w-4 h-4" />
                                  </Button>
                                )}
                                {onDelete && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDelete(photo.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openLightbox(photo, actualIndex)}
                            >
                              <Expand className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>
              {selectedPhoto?.titre || `Photo ${currentIndex + 1} sur ${photos.length}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <div className="relative aspect-[16/9] bg-black">
              {selectedPhoto && (
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.titre || 'Photo'}
                  fill
                  className="object-contain"
                />
              )}
            </div>
            
            {/* Navigation */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={() => navigateLightbox('prev')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={() => navigateLightbox('next')}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          <div className="p-4 border-t">
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  className={cn(
                    "relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
                    currentIndex === index 
                      ? "border-brand-copper" 
                      : "border-transparent hover:border-gray-300"
                  )}
                  onClick={() => {
                    setCurrentIndex(index)
                    setSelectedPhoto(photo)
                  }}
                >
                  <Image
                    src={photo.url}
                    alt={photo.titre || `Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}