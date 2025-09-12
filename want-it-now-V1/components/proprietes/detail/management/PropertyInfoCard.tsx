'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  Home, 
  Calendar, 
  User, 
  Building2, 
  Euro,
  Bed,
  Bath,
  Square,
  Users,
  Wifi,
  Car,
  TreePine,
  Waves,
  Mountain,
  Building,
  Hash,
  Globe,
  Phone,
  Mail
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import type { ProprieteListItem } from '@/lib/validations/proprietes'

interface PropertyInfoCardProps {
  property: ProprieteListItem
  showFullDetails?: boolean
  className?: string
}

export function PropertyInfoCard({ 
  property, 
  showFullDetails = true,
  className 
}: PropertyInfoCardProps) {
  
  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'appartement': return <Building2 className="w-5 h-5" />
      case 'maison': return <Home className="w-5 h-5" />
      case 'villa': return <Home className="w-5 h-5" />
      case 'studio': return <Square className="w-5 h-5" />
      case 'immeuble': return <Building className="w-5 h-5" />
      case 'residence': return <Building className="w-5 h-5" />
      case 'complex_hotelier': return <Building className="w-5 h-5" />
      default: return <Home className="w-5 h-5" />
    }
  }

  const formatAddress = () => {
    const parts = []
    if (property.adresse_ligne1) parts.push(property.adresse_ligne1)
    if (property.adresse_ligne2) parts.push(property.adresse_ligne2)
    if (property.code_postal && property.ville) {
      parts.push(`${property.code_postal} ${property.ville}`)
    } else if (property.ville) {
      parts.push(property.ville)
    }
    if (property.pays) parts.push(property.pays)
    return parts.join(', ')
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-brand-copper/5 to-brand-green/5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {getPropertyTypeIcon(property.type)}
              Informations générales
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Détails et caractéristiques de la propriété
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {property.reference}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Section Localisation */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Localisation
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Adresse complète</p>
              <p className="text-sm font-medium">
                {formatAddress() || 'Non renseignée'}
              </p>
            </div>
            {property.quartier && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Quartier</p>
                <p className="text-sm font-medium">{property.quartier}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Section Caractéristiques principales */}
        {showFullDetails && (
          <>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Home className="w-4 h-4" />
                Caractéristiques principales
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.surface_habitable && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Square className="w-5 h-5 text-brand-copper" />
                    <div>
                      <p className="text-xs text-gray-500">Surface</p>
                      <p className="text-sm font-semibold">{property.surface_habitable} m²</p>
                    </div>
                  </div>
                )}
                
                {property.nombre_chambres !== undefined && property.nombre_chambres !== null && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Bed className="w-5 h-5 text-brand-copper" />
                    <div>
                      <p className="text-xs text-gray-500">Chambres</p>
                      <p className="text-sm font-semibold">{property.nombre_chambres}</p>
                    </div>
                  </div>
                )}

                {property.nombre_salles_bain !== undefined && property.nombre_salles_bain !== null && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Bath className="w-5 h-5 text-brand-copper" />
                    <div>
                      <p className="text-xs text-gray-500">Salles de bain</p>
                      <p className="text-sm font-semibold">{property.nombre_salles_bain}</p>
                    </div>
                  </div>
                )}

                {property.capacite_max && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-brand-copper" />
                    <div>
                      <p className="text-xs text-gray-500">Capacité</p>
                      <p className="text-sm font-semibold">{property.capacite_max} pers.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Section Financière */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Euro className="w-4 h-4" />
            Informations financières
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {property.prix_acquisition && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Prix d'acquisition</p>
                <p className="text-lg font-semibold text-brand-copper">
                  {formatCurrency(property.prix_acquisition)}
                </p>
              </div>
            )}
            
            {property.valeur_actuelle && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Valeur actuelle</p>
                <p className="text-lg font-semibold text-brand-green">
                  {formatCurrency(property.valeur_actuelle)}
                </p>
              </div>
            )}

            {property.loyer_mensuel && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Loyer mensuel</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(property.loyer_mensuel)}
                </p>
              </div>
            )}

            {property.charges_mensuelles && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Charges mensuelles</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(property.charges_mensuelles)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section Équipements si disponibles et détails complets */}
        {showFullDetails && (property.equipements || property.inclus_charges) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Équipements & Services
              </h3>
              
              {property.equipements && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Équipements</p>
                  <div className="flex flex-wrap gap-2">
                    {property.equipements.split(',').map((equip, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {equip.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {property.inclus_charges && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Inclus dans les charges</p>
                  <div className="flex flex-wrap gap-2">
                    {property.inclus_charges.split(',').map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Section Propriétaire si disponible */}
        {property.proprietaire_nom_complet && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                Propriétaire
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">
                  {property.proprietaire_nom_complet}
                </p>
                {property.proprietaire_type && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {property.proprietaire_type === 'physique' ? 'Personne physique' : 'Personne morale'}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        {/* Notes si disponibles */}
        {property.notes && showFullDetails && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Notes
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {property.notes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}