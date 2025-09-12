import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type Propriete } from '@/lib/validations/proprietes'
import {
  Home,
  Bed,
  Bath,
  Square,
  Layers,
  Calendar,
  Thermometer,
  Car,
  Trees,
  Sofa,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface ProprieteCaracteristiquesSectionProps {
  propriete: Propriete
}

export function ProprieteCaracteristiquesSection({ propriete }: ProprieteCaracteristiquesSectionProps) {
  // If property has units, characteristics are managed at the unit level
  if (propriete.a_unites) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Layers className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Caractéristiques par unité</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Cette propriété est divisée en plusieurs unités. Les caractéristiques détaillées 
            (surface, chambres, équipements, etc.) sont définies au niveau de chaque unité individuelle.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Consultez l'onglet "Unités" pour voir les détails de chaque unité.
          </p>
        </div>
      </Card>
    )
  }
  const caracteristiques = [
    {
      label: 'Surface habitable',
      value: propriete.surface_m2 ? `${propriete.surface_m2} m²` : null,
      icon: <Square className="w-5 h-5" />
    },
    {
      label: 'Surface terrain',
      value: propriete.surface_terrain_m2 ? `${propriete.surface_terrain_m2} m²` : null,
      icon: <Trees className="w-5 h-5" />
    },
    {
      label: 'Chambres',
      value: propriete.nb_chambres || null,
      icon: <Bed className="w-5 h-5" />
    },
    {
      label: 'Salles de bain',
      value: propriete.nb_sdb || null,
      icon: <Bath className="w-5 h-5" />
    },
    {
      label: 'Étages',
      value: propriete.nb_etages || null,
      icon: <Layers className="w-5 h-5" />
    },
    {
      label: 'Année construction',
      value: propriete.annee_construction || null,
      icon: <Calendar className="w-5 h-5" />
    }
  ].filter(item => item.value !== null) as Array<{
    label: string
    value: string | number
    icon: React.ReactNode
    format?: (value: any) => React.ReactNode
  }>

  const amenityCategories = {
    general: {
      label: 'Général',
      items: {
        wifi: 'WiFi',
        climatisation: 'Climatisation',
        chauffage: 'Chauffage',
        ascenseur: 'Ascenseur',
        acces_handicape: 'Accès handicapé',
        interphone: 'Interphone',
        alarme: 'Alarme',
        concierge: 'Concierge'
      }
    },
    interieur: {
      label: 'Intérieur',
      items: {
        cuisine_equipee: 'Cuisine équipée',
        lave_vaisselle: 'Lave-vaisselle',
        lave_linge: 'Lave-linge',
        seche_linge: 'Sèche-linge',
        television: 'Télévision',
        cheminee: 'Cheminée',
        dressing: 'Dressing',
        cave: 'Cave'
      }
    },
    exterieur: {
      label: 'Extérieur',
      items: {
        jardin: 'Jardin',
        terrasse: 'Terrasse',
        balcon: 'Balcon',
        piscine: 'Piscine',
        barbecue: 'Barbecue',
        portail_automatique: 'Portail automatique',
        arrosage_automatique: 'Arrosage automatique',
        puits: 'Puits'
      }
    },
    services: {
      label: 'Services',
      items: {
        menage: 'Service de ménage',
        blanchisserie: 'Blanchisserie',
        room_service: 'Room service',
        navette: 'Navette',
        petit_dejeuner: 'Petit-déjeuner inclus',
        animaux_acceptes: 'Animaux acceptés'
      }
    }
  }

  const ruleCategories = {
    restrictions: {
      label: 'Restrictions',
      items: {
        non_fumeur: 'Non-fumeur',
        pas_animaux: 'Pas d\'animaux',
        pas_fetes: 'Pas de fêtes',
        pas_bruit_nuit: 'Pas de bruit la nuit',
        pas_visiteurs: 'Pas de visiteurs'
      }
    },
    horaires: {
      label: 'Horaires',
      items: {
        checkin_flexible: 'Check-in flexible',
        checkout_flexible: 'Check-out flexible',
        quiet_hours: 'Heures de silence',
        acces_24h: 'Accès 24h/24'
      }
    }
  }

  return (
    <div className="grid gap-6">
      {/* Main Characteristics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Caractéristiques principales</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {caracteristiques.map((item) => {
            if (!item.value) return null
            
            return (
              <div key={item.label} className="flex items-start gap-3">
                <div className="text-gray-400">{item.icon}</div>
                <div>
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className="font-medium">
                    {item.format ? item.format(item.value) : item.value}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Amenities */}
      {propriete.amenities && Object.keys(propriete.amenities).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sofa className="w-5 h-5 text-gray-400" />
            Équipements & Aménagements
          </h3>
          
          <div className="space-y-6">
            {Object.entries(amenityCategories).map(([key, category]) => {
              const activeItems = Object.entries(category.items).filter(
                ([itemKey]) => propriete.amenities?.[itemKey]
              )
              
              if (activeItems.length === 0) return null
              
              return (
                <div key={key}>
                  <h4 className="font-medium text-gray-700 mb-3">{category.label}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {activeItems.map(([itemKey, label]) => (
                      <div key={itemKey} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green" />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Rules */}
      {propriete.regles && Object.keys(propriete.regles).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Règles & Restrictions</h3>
          
          <div className="space-y-6">
            {Object.entries(ruleCategories).map(([key, category]) => {
              const activeItems = Object.entries(category.items).filter(
                ([itemKey]) => propriete.regles?.[itemKey]
              )
              
              if (activeItems.length === 0) return null
              
              return (
                <div key={key}>
                  <h4 className="font-medium text-gray-700 mb-3">{category.label}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {activeItems.map(([itemKey, label]) => (
                      <div key={itemKey} className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

    </div>
  )
}