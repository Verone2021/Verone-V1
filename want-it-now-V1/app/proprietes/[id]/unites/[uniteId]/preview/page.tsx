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
  Euro,
  Square,
  Maximize2,
  DoorOpen,
  Sofa,
  Key
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { getUniteById } from '@/actions/proprietes-unites'
import { getProprieteById } from '@/actions/proprietes'
import { getPhotosByUnite } from '@/actions/unites-photos'
import type { UniteListItem } from '@/lib/validations/unites'
import type { ProprieteListItem } from '@/lib/validations/proprietes'

export default function UnitePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string
  const uniteId = params.uniteId as string

  const [unite, setUnite] = useState<UniteListItem | null>(null)
  const [property, setProperty] = useState<ProprieteListItem | null>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // Load unit and property data
  useEffect(() => {
    const loadUnitData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load unit details
        const uniteResult = await getUniteById(uniteId)
        if (!uniteResult.success || !uniteResult.data) {
          setError(uniteResult.error || 'Unité introuvable')
          return
        }

        // Check if unit is available for preview
        if (!uniteResult.data.disponible && !uniteResult.data.est_louee) {
          setError('Cette unité n\'est pas disponible pour la visualisation')
          return
        }

        setUnite(uniteResult.data)

        // Load property details for building info
        const propertyResult = await getProprieteById(propertyId)
        if (propertyResult.success && propertyResult.data) {
          setProperty(propertyResult.data)
        }

        // Load unit photos
        const photosResult = await getPhotosByUnite(uniteId)
        if (photosResult.success && photosResult.data) {
          setPhotos(photosResult.data)
        }

      } catch (error) {
        console.error('Error loading unit:', error)
        setError('Erreur lors du chargement de l\'unité')
      } finally {
        setLoading(false)
      }
    }

    loadUnitData()
  }, [uniteId, propertyId])

  // Photo navigation
  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  // Get unit type label
  const getUnitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'studio': 'Studio',
      't1': 'T1',
      't2': 'T2',
      't3': 'T3',
      't4': 'T4',
      't5plus': 'T5+',
      'chambre': 'Chambre',
      'suite': 'Suite',
      'penthouse': 'Penthouse',
      'duplex': 'Duplex',
      'loft': 'Loft'
    }
    return labels[type] || type
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
      'securite': Shield,
      'balcon': DoorOpen,
      'meuble': Sofa
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
  if (error || !unite) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Unité introuvable'}
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

  const amenities = unite.equipements || []
  const isAvailable = unite.disponible && !unite.est_louee

  return (
    <div className="min-h-screen bg-white">
      {/* Photo Gallery */}
      <div className="relative">
        {photos.length > 0 ? (
          <div className="relative h-[60vh] bg-black">
            <Image
              src={photos[currentPhotoIndex]?.storage_path || ''}
              alt={photos[currentPhotoIndex]?.titre || unite.nom}
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
                    title: unite.nom,
                    text: `Découvrez cette unité : ${unite.nom}`,
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

            {/* Unit Number Badge */}
            {unite.numero && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-white/90 backdrop-blur text-gray-900">
                  Unité {unite.numero}
                </Badge>
              </div>
            )}
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

      {/* Unit Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {unite.nom}
                  </h1>
                  {property && (
                    <p className="text-lg text-gray-600 mb-2">
                      Dans {property.nom}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{property?.ville || unite.ville}, {property?.pays || 'France'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">4.9</span>
                      <span className="text-gray-400">(8 avis)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-6 text-gray-700">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{getUnitTypeLabel(unite.type)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="w-5 h-5 text-gray-400" />
                  <span>{unite.surface_m2 || 0} m²</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-gray-400" />
                  <span>{unite.nombre_chambres || 0} chambre{(unite.nombre_chambres || 0) > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>{unite.capacite || 0} personne{(unite.capacite || 0) > 1 ? 's' : ''}</span>
                </div>
                {unite.etage && (
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-5 h-5 text-gray-400" />
                    <span>Étage {unite.etage}</span>
                  </div>
                )}
              </div>
            </div>

            <hr />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-4">À propos de ce logement</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {unite.description || `${getUnitTypeLabel(unite.type)} confortable et bien équipé, parfait pour un séjour agréable. Cette unité fait partie de ${property?.nom || 'notre résidence'} et offre tout le confort nécessaire pour votre séjour.`}
              </p>
            </div>

            <hr />

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Ce que propose ce logement</h2>
              <div className="grid grid-cols-2 gap-4">
                {['wifi', 'parking', 'cuisine', 'tv', 'climatisation', 'balcon', 'meuble', 'securite'].map((amenity) => {
                  const Icon = getAmenityIcon(amenity)
                  const hasAmenity = amenities.some(a => a.toLowerCase().includes(amenity)) ||
                                    (amenity === 'meuble' && unite.est_meublee)
                  
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
                    {property?.nom}<br />
                    {property?.adresse_ligne1}<br />
                    {property?.code_postal} {property?.ville}<br />
                    {property?.pays}
                  </p>
                </div>
              </div>
            </div>

            {/* Building Amenities */}
            {property && (
              <>
                <hr />
                <div>
                  <h2 className="text-xl font-semibold mb-4">Équipements de la résidence</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {['piscine', 'jardin', 'parking', 'securite', 'ascenseur'].map((amenity) => {
                      const Icon = getAmenityIcon(amenity)
                      const hasAmenity = property.equipements?.some(a => a.toLowerCase().includes(amenity))
                      
                      return (
                        <div
                          key={amenity}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg",
                            hasAmenity ? "text-gray-900 bg-gray-50" : "text-gray-300"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="capitalize">{amenity}</span>
                          {hasAmenity && (
                            <Check className="w-4 h-4 text-green-600 ml-auto" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-xl">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-2xl font-bold">
                        {unite.loyer_mensuel ? `€${unite.loyer_mensuel}` : 'Prix sur demande'}
                      </span>
                      {unite.loyer_mensuel && (
                        <span className="text-gray-500 ml-2">/ mois</span>
                      )}
                    </div>
                  </div>
                  
                  {unite.charges_mensuelles && (
                    <div className="text-sm text-gray-600 mb-2">
                      + €{unite.charges_mensuelles} de charges
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">4.9</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">8 avis</span>
                  </div>
                </div>

                {/* Unit Details */}
                <div className="mb-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium">{getUnitTypeLabel(unite.type)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Surface</span>
                    <span className="font-medium">{unite.surface_m2} m²</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Étage</span>
                    <span className="font-medium">{unite.etage || 'RDC'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Meublé</span>
                    <span className="font-medium">{unite.est_meublee ? 'Oui' : 'Non'}</span>
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
                          Cette unité est prête à être louée
                        </p>
                      </div>
                    </div>
                  ) : unite.est_louee ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-900">Actuellement louée</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Contactez-nous pour les prochaines disponibilités
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <X className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Non disponible</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Cette unité n'est pas disponible à la location
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
                    disabled={!isAvailable}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {isAvailable ? 'Réserver cette unité' : 'Non disponible'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    size="lg"
                  >
                    Contacter le gestionnaire
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full"
                    size="lg"
                    onClick={() => router.push(`/proprietes/${propertyId}/preview`)}
                  >
                    Voir toute la résidence
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-6 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Caution</span>
                    <span className="font-medium text-gray-900">
                      €{unite.depot_garantie || unite.loyer_mensuel || '1 mois'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Durée minimum</span>
                    <span className="font-medium text-gray-900">
                      {unite.duree_bail_min || 1} mois
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