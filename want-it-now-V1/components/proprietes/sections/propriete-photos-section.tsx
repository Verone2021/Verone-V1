'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getProprietePhotos, type ProprietePhoto } from '@/actions/proprietes'
import {
  Camera,
  Plus,
  Star,
  Trash2,
  Download,
  Eye,
  GripVertical,
  Upload
} from 'lucide-react'

interface ProprietePhotosSectionProps {
  proprieteId: string
  isAdmin: boolean
}

export function ProprietePhotosSection({
  proprieteId,
  isAdmin
}: ProprietePhotosSectionProps) {
  const [photos, setPhotos] = useState<ProprietePhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<ProprietePhoto | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [proprieteId])

  const loadPhotos = async () => {
    setIsLoading(true)
    const result = await getProprietePhotos(proprieteId)
    if (result.success && result.data) {
      setPhotos(result.data)
    }
    setIsLoading(false)
  }

  const hasPhotos = photos.length > 0
  const coverPhoto = photos.find(p => p.is_cover)

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5 text-gray-400" />
            Galerie photos
          </h3>
          {isAdmin && (
            <Button className="bg-copper hover:bg-copper-dark">
              <Upload className="w-4 h-4 mr-2" />
              Ajouter des photos
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total photos</p>
            <p className="text-2xl font-bold">{photos.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Photo de couverture</p>
            <p className="text-lg font-semibold">
              {coverPhoto ? 'Définie' : 'Non définie'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Espace utilisé</p>
            <p className="text-lg font-semibold">
              {/* Calculate total size */}
              {photos.reduce((acc, p) => acc + (p.taille || 0), 0) / 1024 / 1024} MB
            </p>
          </div>
        </div>
      </Card>

      {/* Photo Grid */}
      {hasPhotos && (
        <Card className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden"
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* Photo Placeholder */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-300" />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button size="sm" variant="secondary">
                          <Star className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Badges */}
                {photo.is_cover && (
                  <Badge className="absolute top-2 left-2 bg-copper">
                    <Star className="w-3 h-3 mr-1" />
                    Couverture
                  </Badge>
                )}
                
                {photo.ordre && (
                  <Badge variant="secondary" className="absolute top-2 right-2">
                    #{photo.ordre}
                  </Badge>
                )}
                
                {/* Caption */}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {isAdmin && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <GripVertical className="w-4 h-4" />
                Glissez-déposez les photos pour réorganiser l'ordre d'affichage
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Empty State */}
      {!hasPhotos && !isLoading && (
        <Card className="p-12 text-center">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune photo</h3>
          <p className="text-gray-600 mb-6">
            Ajoutez des photos pour présenter cette propriété.
          </p>
          {isAdmin && (
            <Button className="bg-copper hover:bg-copper-dark">
              <Upload className="w-4 h-4 mr-2" />
              Ajouter les premières photos
            </Button>
          )}
        </Card>
      )}

      {/* Photo Viewer Modal Placeholder */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Aperçu de la photo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4">
                <Camera className="w-24 h-24 text-gray-300" />
              </div>
              {selectedPhoto.caption && (
                <p className="text-gray-700">{selectedPhoto.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}