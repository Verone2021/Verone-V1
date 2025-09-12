'use client'

import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Building2, 
  Calendar, 
  Euro, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Percent,
  Shield 
} from 'lucide-react'
import { QuotiteWithProprietaire } from '@/actions/proprietes-quotites'

interface QuotiteDetailModalProps {
  quotite: QuotiteWithProprietaire
}

export function QuotiteDetailModal({ quotite }: QuotiteDetailModalProps) {
  const formatProprietaire = (proprietaire: QuotiteWithProprietaire['proprietaire']) => {
    if (proprietaire.type === 'physique') {
      return `${proprietaire.prenom || ''} ${proprietaire.nom}`.trim()
    }
    return proprietaire.nom
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Non renseigné'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Non renseigné'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#D4841A]/10 rounded-full flex items-center justify-center">
            {quotite.proprietaire?.type === 'physique' ? (
              <User className="w-4 h-4 text-[#D4841A]" />
            ) : (
              <Building2 className="w-4 h-4 text-[#D4841A]" />
            )}
          </div>
          <span>Quotité de {quotite.proprietaire ? formatProprietaire(quotite.proprietaire) : 'Propriétaire non trouvé'}</span>
        </DialogTitle>
        <DialogDescription>
          Détails complets de la quotité de propriété
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Informations de la quotité */}
        <div className="bg-[#D4841A]/5 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Percent className="w-4 h-4 text-[#D4841A]" />
            <span>Quotité de propriété</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm text-gray-500">Pourcentage</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-[#D4841A]">{quotite.pourcentage}%</span>
                <Badge className="bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20">
                  <Shield className="w-3 h-3 mr-1" />
                  Quotité
                </Badge>
              </div>
            </div>
            
            {quotite.date_acquisition && (
              <div className="space-y-2">
                <span className="text-sm text-gray-500">Date d'acquisition</span>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{formatDate(quotite.date_acquisition)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informations financières */}
        {(quotite.prix_acquisition || quotite.frais_acquisition) && (
          <div className="bg-green-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Euro className="w-4 h-4 text-green-600" />
              <span>Informations financières</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quotite.prix_acquisition && (
                <div className="space-y-2">
                  <span className="text-sm text-gray-500">Prix d'acquisition</span>
                  <div className="font-semibold text-green-700">
                    {formatCurrency(quotite.prix_acquisition)}
                  </div>
                </div>
              )}
              
              {quotite.frais_acquisition && (
                <div className="space-y-2">
                  <span className="text-sm text-gray-500">Frais d'acquisition</span>
                  <div className="font-semibold text-green-700">
                    {formatCurrency(quotite.frais_acquisition)}
                  </div>
                </div>
              )}
            </div>
            
            {quotite.prix_acquisition && quotite.frais_acquisition && (
              <div className="pt-2 border-t border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total investissement</span>
                  <span className="text-lg font-bold text-green-700">
                    {formatCurrency(quotite.prix_acquisition + quotite.frais_acquisition)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {quotite.notes && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Notes</span>
            </h3>
            <p className="text-gray-700 leading-relaxed">{quotite.notes}</p>
          </div>
        )}

        {/* Informations du propriétaire */}
        {quotite.proprietaire && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              {quotite.proprietaire.type === 'physique' ? (
                <User className="w-4 h-4 text-gray-600" />
              ) : (
                <Building2 className="w-4 h-4 text-gray-600" />
              )}
              <span>Informations du propriétaire</span>
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Nom complet</span>
                <div className="font-semibold text-gray-900">
                  {formatProprietaire(quotite.proprietaire)}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Type</span>
                <div className="mt-1">
                  <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                    {quotite.proprietaire.type === 'physique' ? 'Personne physique' : 'Personne morale'}
                  </Badge>
                </div>
              </div>
              
              {quotite.proprietaire.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Email :</span>
                  <span className="font-medium">{quotite.proprietaire.email}</span>
                </div>
              )}
              
              {quotite.proprietaire.telephone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Téléphone :</span>
                  <span className="font-medium">{quotite.proprietaire.telephone}</span>
                </div>
              )}
              
              {quotite.proprietaire.adresse && (
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-500">Adresse :</span>
                    <div className="font-medium">{quotite.proprietaire.adresse}</div>
                  </div>
                </div>
              )}
              
              {quotite.proprietaire.forme_juridique && (
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Forme juridique :</span>
                  <span className="font-medium">{quotite.proprietaire.forme_juridique}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  )
}