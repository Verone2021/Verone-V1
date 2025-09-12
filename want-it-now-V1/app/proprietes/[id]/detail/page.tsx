'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  AlertCircle,
  Home,
  BarChart3,
  Image as ImageIcon,
  Settings,
  FileText,
  Euro,
  Users,
  Calendar,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// Import all our modern components
import { PropertyDetailHeader } from '@/components/proprietes/detail/management/PropertyDetailHeader'
import { PropertyStatsBar } from '@/components/proprietes/detail/management/PropertyStatsBar'
import { PropertyInfoCard } from '@/components/proprietes/detail/management/PropertyInfoCard'
import { PropertyCharacteristicsGrid } from '@/components/proprietes/detail/management/PropertyCharacteristicsGrid'
import { PropertyPhotoGallery } from '@/components/proprietes/detail/management/PropertyPhotoGallery'
import { PropertyFinancialOverview } from '@/components/proprietes/detail/management/PropertyFinancialOverview'
import { PropertyDocuments } from '@/components/proprietes/detail/management/PropertyDocuments'
import { PropertyActivityLog } from '@/components/proprietes/detail/management/PropertyActivityLog'

import { getProprietes } from '@/actions/proprietes'
import { getPhotosByPropriete, uploadProprietePhoto } from '@/actions/proprietes-photos'
import type { ProprieteListItem } from '@/lib/validations/proprietes'

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  const [property, setProperty] = useState<ProprieteListItem | null>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  // Load property data
  useEffect(() => {
    const loadPropertyData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load property details
        const propertyResult = await getProprietes({ id: propertyId })
        if (!propertyResult.success || !propertyResult.data) {
          setError(propertyResult.error || 'Propriété introuvable')
          return
        }

        setProperty(propertyResult.data)

        // Check if it's a property with units
        if (propertyResult.data.a_unites) {
          // Redirect to the units version of the detail page
          router.replace(`/proprietes/${propertyId}/units`)
          return
        }

        // Load photos
        const photosResult = await getPhotosByPropriete(propertyId)
        if (photosResult.success && photosResult.data) {
          setPhotos(photosResult.data)
        }

      } catch (error) {
        console.error('Error loading property:', error)
        setError('Erreur lors du chargement de la propriété')
      } finally {
        setLoading(false)
      }
    }

    loadPropertyData()
  }, [propertyId, router])

  // Handle photo upload
  const handlePhotoUpload = async (files: File[]) => {
    if (!property) return

    setUploadingPhotos(true)
    try {
      const uploadPromises = files.map(file => 
        uploadProprietePhoto(propertyId, file, {
          titre: file.name,
          est_couverture: photos.length === 0 // First photo as cover
        })
      )

      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(r => r.success)
      
      if (successfulUploads.length > 0) {
        toast.success(`${successfulUploads.length} photo(s) ajoutée(s) avec succès`)
        // Reload photos
        const photosResult = await getPhotosByPropriete(propertyId)
        if (photosResult.success && photosResult.data) {
          setPhotos(photosResult.data)
        }
      }

      const failedUploads = results.filter(r => !r.success)
      if (failedUploads.length > 0) {
        toast.error(`${failedUploads.length} photo(s) n'ont pas pu être ajoutées`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur lors de l\'ajout des photos')
    } finally {
      setUploadingPhotos(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-96 lg:col-span-2" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Propriété introuvable'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-500">
            <Link href="/proprietes" className="hover:text-gray-700">
              Propriétés
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{property.nom}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Header */}
        <div className="flex items-start justify-between mb-8">
          <PropertyDetailHeader 
            property={property} 
            isAdmin={true}
            isSuperAdmin={true}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/proprietes/${propertyId}/preview`, '_blank')}
            className="ml-4 gap-2"
          >
            <Eye className="w-4 h-4" />
            Aperçu public
          </Button>
        </div>

        {/* Stats Bar */}
        <PropertyStatsBar 
          property={property} 
          className="mb-8"
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="characteristics" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Caractéristiques</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Photos</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <Euro className="w-4 h-4" />
              <span className="hidden sm:inline">Finances</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Activité</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <PropertyInfoCard 
                  property={property} 
                  showFullDetails={true}
                />
                
                {/* Quick Photos Preview */}
                {photos.length > 0 && (
                  <PropertyPhotoGallery
                    photos={photos.slice(0, 6)}
                    propertyId={propertyId}
                    canEdit={false}
                    className="max-h-96"
                  />
                )}
              </div>

              <div className="space-y-6">
                <PropertyCharacteristicsGrid 
                  property={property}
                />
              </div>
            </div>
          </TabsContent>

          {/* Characteristics Tab */}
          <TabsContent value="characteristics" className="space-y-6">
            <PropertyCharacteristicsGrid 
              property={property}
            />
            
            <PropertyInfoCard 
              property={property} 
              showFullDetails={true}
            />
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <PropertyPhotoGallery
              photos={photos}
              propertyId={propertyId}
              canEdit={true}
              onUpload={handlePhotoUpload}
              onDelete={async (photoId) => {
                // Implement photo deletion
                toast.info('Suppression de photo à implémenter')
              }}
              onSetCover={async (photoId) => {
                // Implement set cover
                toast.info('Définir photo de couverture à implémenter')
              }}
            />
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <PropertyFinancialOverview 
              property={property}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <PropertyDocuments 
              propertyId={propertyId}
              canEdit={true}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <PropertyActivityLog 
              propertyId={propertyId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}