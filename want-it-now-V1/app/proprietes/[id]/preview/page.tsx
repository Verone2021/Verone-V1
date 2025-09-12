'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MapPin,
  Users,
  Home,
  Bed,
  Bath,
  Wifi,
  Car,
  TreePine,
  Waves,
  Mountain,
  Utensils,
  Tv,
  Wind,
  Shield,
  Star,
  Heart,
  Share2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Clock,
  Euro
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { getProprieteById } from '@/actions/proprietes'
import { getPhotosByPropriete } from '@/actions/proprietes-photos'
import type { ProprieteWithStats } from '@/lib/validations/proprietes'

export default function PropertyPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  const [property, setProperty] = useState<ProprieteWithStats | null>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // Load property data
  useEffect(() => {
    const loadPropertyData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load property details
        const propertyResult = await getProprieteById(propertyId)
        if (!propertyResult.success || !propertyResult.data) {
          setError(propertyResult.error || 'Propriété introuvable')
          return
        }

        // Check if property is available for preview
        if (!['disponible', 'louee'].includes(propertyResult.data.statut)) {
          setError('Cette propriété n\'est pas disponible pour la visualisation')
          return
        }

        setProperty(propertyResult.data)

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
  }, [propertyId])

  // Photo navigation
  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  // Get amenities with icons
  const getAmenityIcon = (key: string) => {
    const icons: Record<string, any> = {
      'wifi': Wifi,
      'parking': Car,
      'jardin': TreePine,
      'piscine': Waves,
      'vue': Mountain,
      'cuisine': Utensils,
      'tv': Tv,
      'climatisation': Wind,
      'securite': Shield
    }
    return icons[key.toLowerCase()] || Home
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-96 w-full" />
          <div className="px-6 py-8 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Propriété introuvable'}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => router.back()} 
            className="mt-4 w-full"
            variant="outline"
          >
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const amenities = property.amenities || {}
  const isAvailable = property.statut === 'disponible'

  return (
    <div className="min-h-screen bg-white">
      {/* Photo Gallery */}
      <div className="relative">
        {photos.length > 0 ? (
          <div className="relative h-[60vh] bg-black">
            <Image
              src={photos[currentPhotoIndex]?.storage_path || ''}
              alt={photos[currentPhotoIndex]?.titre || property.nom}
              fill
              className="object-contain"
              priority
            />
            
            {/* Photo Navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur rounded-full p-2 hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur rounded-full p-2 hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {/* Photo Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentPhotoIndex 
                          ? "bg-white w-8" 
                          : "bg-white/50 hover:bg-white/75"
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => {
                  setIsFavorite(!isFavorite)
                  toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris')
                }}
                className="bg-white/90 backdrop-blur rounded-full p-2 hover:bg-white transition-colors"
              >
                <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
              </button>
              <button
                onClick={() => {
                  navigator.share?.({
                    title: property.nom,
                    text: `Découvrez cette propriété : ${property.nom}`,
                    url: window.location.href,
                  }) || toast.info('Partage non disponible')
                }}
                className="bg-white/90 backdrop-blur rounded-full p-2 hover:bg-white transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              {photos.length > 1 && (
                <button
                  onClick={() => setShowAllPhotos(true)}
                  className="bg-white/90 backdrop-blur rounded-full px-3 py-2 hover:bg-white transition-colors text-sm font-medium"
                >
                  Voir les {photos.length} photos
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-96 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune photo disponible</p>
            </div>
          </div>
        )}
      </div>

      {/* Property Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {property.nom}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{property.ville}, {property.pays}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">4.8</span>
                      <span className="text-gray-400">(12 avis)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 text-gray-700">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>{property.capacite_totale || 0} voyageurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-gray-400" />
                  <span>{property.nb_chambres || 0} chambres</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-gray-400" />
                  <span>{property.nb_sdb || 0} salles de bain</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-gray-400" />
                  <span>{property.surface_m2 || 0} m²</span>
                </div>
              </div>
            </div>

            <hr />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-4">À propos de ce logement</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {property.description || 'Magnifique propriété idéalement située, parfaite pour un séjour confortable et mémorable.'}
              </p>
            </div>

            <hr />

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Ce que propose ce logement</h2>
              <div className="grid grid-cols-2 gap-4">
                {['wifi', 'parking', 'jardin', 'piscine', 'cuisine', 'tv', 'climatisation', 'securite'].map((amenity) => {
                  const Icon = getAmenityIcon(amenity)
                  const hasAmenity = property.amenities?.[amenity as keyof typeof property.amenities] || false
                  
                  return (
                    <div
                      key={amenity}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg",
                        hasAmenity ? "text-gray-900" : "text-gray-300 line-through"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="capitalize">{amenity.replace('_', ' ')}</span>
                      {hasAmenity ? (
                        <Check className="w-4 h-4 text-green-600 ml-auto" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 ml-auto" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <hr />

            {/* Location */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Où vous serez</h2>
              <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    {property.adresse}<br />
                    {property.code_postal} {property.ville}<br />
                    {property.pays}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-xl">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-2xl font-bold">
                        {property.loyer ? `€${property.loyer}` : 'Prix sur demande'}
                      </span>
                      {property.loyer && (
                        <span className="text-gray-500 ml-2">/ mois</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">4.8</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">12 avis</span>
                  </div>
                </div>

                {/* Availability Status */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  {isAvailable ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900">Disponible immédiatement</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Cette propriété est prête à être louée
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-900">Actuellement louée</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Contactez-nous pour connaître les prochaines disponibilités
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    className="w-full gradient-copper text-white"
                    size="lg"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {isAvailable ? 'Réserver' : 'Vérifier les disponibilités'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    size="lg"
                  >
                    Contacter le propriétaire
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-6 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Charges</span>
                    <span className="font-medium text-gray-900">
                      €{property.charges || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taxe foncière</span>
                    <span className="font-medium text-gray-900">
                      €{property.taxe_fonciere || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Surface</span>
                    <span className="font-medium text-gray-900">
                      {property.surface_m2 || 0} m²
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}