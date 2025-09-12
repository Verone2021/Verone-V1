'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wifi,
  Car,
  TreePine,
  Waves,
  Mountain,
  Utensils,
  Tv,
  Wind,
  Zap,
  ShowerHead,
  Sofa,
  DoorOpen,
  Thermometer,
  Shield,
  Camera,
  Elevator,
  Dumbbell,
  Baby,
  PawPrint,
  Cigarette,
  PartyPopper,
  Key,
  CalendarDays
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProprieteListItem } from '@/lib/validations/proprietes'

interface PropertyCharacteristicsGridProps {
  property: ProprieteListItem
  className?: string
}

export function PropertyCharacteristicsGrid({ 
  property, 
  className 
}: PropertyCharacteristicsGridProps) {

  // Définir les caractéristiques avec leurs icônes
  const amenities = [
    { 
      key: 'wifi', 
      label: 'WiFi', 
      icon: Wifi,
      value: property.equipements?.includes('wifi') || property.equipements?.includes('WiFi')
    },
    { 
      key: 'parking', 
      label: 'Parking', 
      icon: Car,
      value: property.equipements?.includes('parking') || property.equipements?.includes('Parking')
    },
    { 
      key: 'jardin', 
      label: 'Jardin', 
      icon: TreePine,
      value: property.equipements?.includes('jardin') || property.equipements?.includes('Jardin')
    },
    { 
      key: 'piscine', 
      label: 'Piscine', 
      icon: Waves,
      value: property.equipements?.includes('piscine') || property.equipements?.includes('Piscine')
    },
    { 
      key: 'vue', 
      label: 'Vue exceptionnelle', 
      icon: Mountain,
      value: property.equipements?.includes('vue') || property.equipements?.includes('Vue')
    },
    { 
      key: 'cuisine', 
      label: 'Cuisine équipée', 
      icon: Utensils,
      value: property.equipements?.includes('cuisine') || property.equipements?.includes('Cuisine')
    },
    { 
      key: 'tv', 
      label: 'Télévision', 
      icon: Tv,
      value: property.equipements?.includes('tv') || property.equipements?.includes('TV') || property.equipements?.includes('Télévision')
    },
    { 
      key: 'climatisation', 
      label: 'Climatisation', 
      icon: Wind,
      value: property.equipements?.includes('climatisation') || property.equipements?.includes('Climatisation')
    },
    { 
      key: 'chauffage', 
      label: 'Chauffage', 
      icon: Thermometer,
      value: property.equipements?.includes('chauffage') || property.equipements?.includes('Chauffage')
    },
    { 
      key: 'securite', 
      label: 'Sécurité', 
      icon: Shield,
      value: property.equipements?.includes('securite') || property.equipements?.includes('Sécurité')
    },
    { 
      key: 'ascenseur', 
      label: 'Ascenseur', 
      icon: Elevator,
      value: property.equipements?.includes('ascenseur') || property.equipements?.includes('Ascenseur')
    },
    { 
      key: 'gym', 
      label: 'Salle de sport', 
      icon: Dumbbell,
      value: property.equipements?.includes('gym') || property.equipements?.includes('Salle de sport')
    },
  ]

  // Règles de la maison
  const houseRules = [
    { 
      key: 'enfants', 
      label: 'Adapté aux enfants', 
      icon: Baby,
      value: property.equipements?.includes('enfants') || !property.restrictions?.includes('enfants')
    },
    { 
      key: 'animaux', 
      label: 'Animaux acceptés', 
      icon: PawPrint,
      value: property.equipements?.includes('animaux') || !property.restrictions?.includes('animaux')
    },
    { 
      key: 'fumeur', 
      label: 'Fumeurs acceptés', 
      icon: Cigarette,
      value: !property.restrictions?.includes('fumeur')
    },
    { 
      key: 'fetes', 
      label: 'Fêtes autorisées', 
      icon: PartyPopper,
      value: !property.restrictions?.includes('fetes')
    },
  ]

  // Statistiques de disponibilité (simulées pour l'instant)
  const availabilityStats = {
    occupancyRate: property.taux_occupation || 75,
    averageStay: 4, // jours moyens
    nextAvailable: property.date_disponibilite || 'Disponible',
    minimumStay: property.duree_min_location || 1,
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Équipements principaux */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-copper" />
            Équipements & Commodités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {amenities.map((amenity) => {
              const Icon = amenity.icon
              const isAvailable = amenity.value
              
              return (
                <div
                  key={amenity.key}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    isAvailable 
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {amenity.label}
                  </span>
                  {isAvailable ? (
                    <CheckCircle2 className="w-4 h-4 ml-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 ml-auto" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Règles de la maison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-copper" />
            Règles de la propriété
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {houseRules.map((rule) => {
              const Icon = rule.icon
              const isAllowed = rule.value
              
              return (
                <div
                  key={rule.key}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg",
                    isAllowed 
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {rule.label}
                    </span>
                  </div>
                  {isAllowed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques de disponibilité */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-copper" />
            Disponibilité & Occupation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Taux d'occupation</p>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-brand-copper">
                  {availabilityStats.occupancyRate}%
                </p>
                <Progress value={availabilityStats.occupancyRate} className="h-2" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Séjour moyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {availabilityStats.averageStay} jours
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Prochaine disponibilité</p>
              <Badge variant="outline" className="text-green-700 border-green-300">
                {availabilityStats.nextAvailable}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Séjour minimum</p>
              <p className="text-2xl font-bold text-gray-900">
                {availabilityStats.minimumStay} {availabilityStats.minimumStay > 1 ? 'nuits' : 'nuit'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations supplémentaires */}
      {property.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-brand-copper" />
              Description détaillée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {property.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}