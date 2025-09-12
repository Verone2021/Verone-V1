import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type Propriete } from '@/lib/validations/proprietes'
import { formatDate } from '@/lib/utils'
import {
  Calendar,
  Hash,
  Building2,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface ProprieteInfoSectionProps {
  propriete: Propriete
}

export function ProprieteInfoSection({ propriete }: ProprieteInfoSectionProps) {
  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return <Badge variant="secondary">Brouillon</Badge>
      case 'sourcing':
        return <Badge variant="warning">En sourcing</Badge>
      case 'evaluation':
        return <Badge variant="default">En évaluation</Badge>
      case 'negociation':
        return <Badge variant="default">En négociation</Badge>
      case 'achetee':
        return <Badge variant="default">Achetée</Badge>
      case 'disponible':
        return <Badge variant="success">Disponible</Badge>
      case 'louee':
        return <Badge variant="success">Louée</Badge>
      case 'vendue':
        return <Badge variant="destructive">Vendue</Badge>
      default:
        return <Badge variant="outline">{statut}</Badge>
    }
  }

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      maison: 'Maison',
      appartement: 'Appartement',
      villa: 'Villa',
      studio: 'Studio',
      loft: 'Loft',
      penthouse: 'Penthouse',
      immeuble: 'Immeuble',
      residence: 'Résidence',
      complex_hotelier: 'Complexe hôtelier',
      chalet: 'Chalet',
      bungalow: 'Bungalow',
      riad: 'Riad',
      ferme: 'Ferme',
      terrain: 'Terrain',
      local_commercial: 'Local commercial'
    }
    return labels[type] || type
  }

  return (
    <div className="grid gap-6">
      {/* Main Info Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Référence</p>
                <p className="font-medium">{propriete.reference || 'Non définie'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Type de propriété</p>
                <p className="font-medium">{getTypeLabel(propriete.type)}</p>
                {propriete.a_unites && (
                  <Badge variant="outline" className="mt-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Multi-unités
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <div className="mt-1">
                  {getStatutBadge(propriete.statut)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Date de création</p>
                <p className="font-medium">{formatDate(propriete.created_at)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Dernière modification</p>
                <p className="font-medium">{formatDate(propriete.updated_at)}</p>
              </div>
            </div>

            {/* Date acquisition temporairement commentée - à implémenter plus tard
            {propriete.date_acquisition && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Date d'acquisition</p>
                  <p className="font-medium">{formatDate(propriete.date_acquisition)}</p>
                </div>
              </div>
            )}
            */}
          </div>
        </div>
      </Card>

      {/* Description Card */}
      {propriete.description && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Description
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">{propriete.description}</p>
        </Card>
      )}

      {/* Notes Card */}
      {propriete.notes_internes && (
        <Card className="p-6 border-orange-200 bg-orange-50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-800">
            <AlertCircle className="w-5 h-5" />
            Notes internes
          </h3>
          <p className="text-orange-700 whitespace-pre-wrap">{propriete.notes_internes}</p>
        </Card>
      )}
    </div>
  )
}