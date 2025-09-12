import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type Propriete } from '@/lib/validations/proprietes'
import { formatCurrency } from '@/lib/utils'
import {
  Euro,
  TrendingUp,
  Calculator,
  Receipt,
  Calendar,
  AlertCircle,
  Percent,
  Home,
  Layers
} from 'lucide-react'

interface ProprieteTarifsSectionProps {
  propriete: Propriete
}

export function ProprieteTarifsSection({ propriete }: ProprieteTarifsSectionProps) {
  // If property has units, pricing is managed at the unit level
  if (propriete.a_unites) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Layers className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tarification par unité</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Cette propriété est divisée en plusieurs unités. Les informations tarifaires 
            (loyer, charges, prix) sont définies au niveau de chaque unité individuelle.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Consultez l'onglet "Unités" pour voir les tarifs de chaque unité.
          </p>
        </div>
      </Card>
    )
  }
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Euro className="w-5 h-5 text-gray-400" />
        Informations tarifaires
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Prix d'achat */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Prix d'achat</p>
          <p className="text-2xl font-bold text-copper">
            {propriete.prix_achat ? formatCurrency(propriete.prix_achat) : 'Non défini'}
          </p>
        </div>
        
        {/* Frais d'acquisition */}
        {propriete.frais_acquisition && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Frais d'acquisition</p>
            <p className="text-xl font-semibold">
              {formatCurrency(propriete.frais_acquisition)}
            </p>
          </div>
        )}
        
        {/* Valeur actuelle */}
        {propriete.valeur_actuelle && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Valeur actuelle</p>
            <p className="text-xl font-semibold text-green">
              {formatCurrency(propriete.valeur_actuelle)}
            </p>
          </div>
        )}
        
        {/* Loyer */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Loyer mensuel</p>
          <p className="text-2xl font-bold text-blue-600">
            {propriete.loyer ? formatCurrency(propriete.loyer) : 'Non défini'}
          </p>
        </div>
        
        {/* Charges */}
        {propriete.charges && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Charges mensuelles</p>
            <p className="text-xl font-semibold">
              {formatCurrency(propriete.charges)}
            </p>
          </div>
        )}
        
        {/* Taxe foncière */}
        {propriete.taxe_fonciere && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Taxe foncière annuelle</p>
            <p className="text-xl font-semibold">
              {formatCurrency(propriete.taxe_fonciere)}
            </p>
          </div>
        )}
      </div>
      
      {/* Calcul ROI simple */}
      {propriete.prix_achat && propriete.loyer && (
        <div className="mt-6 pt-6 border-t">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Rendement brut estimé</h4>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {((propriete.loyer * 12 / propriete.prix_achat) * 100).toFixed(2)}%
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Basé sur le loyer annuel / prix d'achat
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}