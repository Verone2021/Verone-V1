import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type Propriete } from '@/lib/validations/proprietes'
import {
  MapPin,
  Map,
  Navigation,
  Globe,
  Building,
  Home,
  Mountain,
  Trees
} from 'lucide-react'

interface ProprieteLocationSectionProps {
  propriete: Propriete
}

export function ProprieteLocationSection({ propriete }: ProprieteLocationSectionProps) {
  const getCountryName = (code: string): string => {
    const countries: Record<string, string> = {
      FR: 'France',
      ES: 'Espagne',
      PT: 'Portugal',
      IT: 'Italie',
      MA: 'Maroc',
      TN: 'Tunisie',
      DZ: 'Algérie',
      SN: 'Sénégal',
      CI: 'Côte d\'Ivoire',
      CM: 'Cameroun'
    }
    return countries[code] || code
  }

  const getZoneLabel = (zone?: string): string => {
    if (!zone) return 'Non définie'
    const labels: Record<string, string> = {
      centre_ville: 'Centre-ville',
      quartier_residentiel: 'Quartier résidentiel',
      zone_touristique: 'Zone touristique',
      banlieue: 'Banlieue',
      campagne: 'Campagne',
      bord_de_mer: 'Bord de mer',
      montagne: 'Montagne',
      zone_commerciale: 'Zone commerciale',
      zone_industrielle: 'Zone industrielle'
    }
    return labels[zone] || zone
  }

  const getZoneIcon = (zone?: string) => {
    switch (zone) {
      case 'centre_ville':
      case 'quartier_residentiel':
      case 'banlieue':
        return <Building className="w-5 h-5" />
      case 'zone_touristique':
      case 'bord_de_mer':
        return <Navigation className="w-5 h-5" />
      case 'campagne':
        return <Trees className="w-5 h-5" />
      case 'montagne':
        return <Mountain className="w-5 h-5" />
      default:
        return <Map className="w-5 h-5" />
    }
  }

  const fullAddress = [
    propriete.adresse,
    propriete.adresse_complement,
    `${propriete.code_postal} ${propriete.ville}`,
    propriete.pays ? getCountryName(propriete.pays) : null
  ].filter(Boolean).join('\n')

  return (
    <div className="grid gap-6">
      {/* Address Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          Adresse complète
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Adresse</p>
              <p className="font-medium whitespace-pre-line">{fullAddress}</p>
            </div>

            {propriete.latitude && propriete.longitude && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Coordonnées GPS</p>
                <p className="font-mono text-sm">
                  {propriete.latitude}, {propriete.longitude}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Pays</p>
                <p className="font-medium">{propriete.pays ? getCountryName(propriete.pays) : 'Non défini'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Ville</p>
                <p className="font-medium">{propriete.ville}</p>
                {propriete.quartier && (
                  <p className="text-sm text-gray-600">Quartier: {propriete.quartier}</p>
                )}
              </div>
            </div>

            {propriete.quartier && (
              <div className="flex items-start gap-3">
                {getZoneIcon(propriete.quartier)}
                <div>
                  <p className="text-sm text-gray-600">Zone</p>
                  <p className="font-medium">{getZoneLabel(propriete.quartier)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Proximity Card */}
      {(propriete.transport_proche || propriete.ecoles_proche) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Proximités</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {propriete.transport_proche && (
              <Badge variant="outline" className="py-2">
                Transports: {propriete.transport_proche}
              </Badge>
            )}
            {propriete.ecoles_proche && (
              <Badge variant="outline" className="py-2">
                Écoles: {propriete.ecoles_proche}
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Map Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Carte</h3>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Map className="w-12 h-12 mx-auto mb-2" />
            <p>Carte interactive</p>
            <p className="text-sm">Disponible prochainement</p>
          </div>
        </div>
      </Card>
    </div>
  )
}