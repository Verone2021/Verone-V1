'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhotosManager } from '@/components/proprietes/photos-manager'
import { Camera, Loader2 } from 'lucide-react'
import { getPhotosByUnite } from '@/actions/proprietes-photos'

interface UnitePhotosSectionProps {
  uniteId: string
  proprieteId: string
  canEdit: boolean
}

export function UnitePhotosSection({ uniteId, proprieteId, canEdit }: UnitePhotosSectionProps) {
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const photosResult = await getPhotosByUnite(uniteId)
        
        if (photosResult.success) {
          const formattedPhotos = photosResult.data?.map((photo: any) => ({
            id: photo.id,
            titre: photo.titre || '',
            description: photo.description || '',
            url_original: photo.url_original || '',
            url_medium: photo.url_medium || '',
            url_thumbnail: photo.url_thumbnail || '',
            storage_path: photo.storage_path || '',
            is_cover: photo.is_cover || false,
            categorie: photo.categorie || 'autre',
            display_order: photo.display_order || 0,
            created_at: photo.created_at || new Date().toISOString()
          })) || []
          
          setPhotos(formattedPhotos)
        } else {
          setError('Erreur lors du chargement des photos')
        }
      } catch (err) {
        setError('Erreur lors du chargement des photos')
        console.error('Error fetching photos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [uniteId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photos de l'unité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Chargement des photos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photos de l'unité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Photos de l'unité
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PhotosManager
          proprieteId={proprieteId}
          uniteId={uniteId}
          initialPhotos={photos}
        />
      </CardContent>
    </Card>
  )
}