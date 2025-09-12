'use client'

import { ContratAvecRelations, ContratStatus } from '@/types/contrats'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { 
  Calendar, 
  Home, 
  Building, 
  Percent, 
  Clock, 
  MapPin,
  FileText,
  Euro,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  Mail,
  Phone,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

interface ContratDetailProps {
  contrat: ContratAvecRelations
}

export function ContratDetail({ contrat }: ContratDetailProps) {
  const getStatusInfo = () => {
    const now = new Date()
    const dateDebut = new Date(contrat.date_debut)
    const dateFin = new Date(contrat.date_fin)
    
    let status: ContratStatus
    let variant: "default" | "secondary" | "destructive" | "outline"
    let emoji = ""
    let description = ""
    
    if (now < dateDebut) {
      status = 'a_venir'
      variant = 'outline'
      emoji = '⏳'
      description = `Débute dans ${Math.ceil((dateDebut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} jours`
    } else if (now >= dateDebut && now <= dateFin) {
      status = 'en_cours'
      variant = 'default'
      emoji = '🔄'
      description = `Se termine dans ${Math.ceil((dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} jours`
    } else {
      status = 'termine'
      variant = 'secondary'
      emoji = '✅'
      description = `Terminé depuis ${Math.ceil((now.getTime() - dateFin.getTime()) / (1000 * 60 * 60 * 24))} jours`
    }

    const labels = {
      'a_venir': 'À venir',
      'en_cours': 'En cours',
      'termine': 'Terminé'
    }

    return { status, variant, emoji, label: labels[status], description }
  }

  const statusInfo = getStatusInfo()
  
  const dureeJours = Math.ceil(
    (new Date(contrat.date_fin).getTime() - new Date(contrat.date_debut).getTime()) / 
    (1000 * 60 * 60 * 24)
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header avec statut */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Contrat {contrat.type_contrat}
          </h2>
          <p className="text-gray-600 mt-1">{statusInfo.description}</p>
        </div>
        <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
          {statusInfo.emoji} {statusInfo.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informations principales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Type de contrat</label>
              <p className="text-lg font-semibold capitalize">{contrat.type_contrat}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date d'émission</label>
                <p className="font-medium">
                  {new Date(contrat.date_emission).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Durée</label>
                <p className="font-medium">{dureeJours} jours</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date de début</label>
                <p className="font-medium">
                  {new Date(contrat.date_debut).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date de fin</label>
                <p className="font-medium">
                  {new Date(contrat.date_fin).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bien concerné */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {contrat.propriete_id ? <Home className="h-5 w-5" /> : <Building className="h-5 w-5" />}
              Bien concerné
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contrat.propriete_nom && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">Propriété</label>
                  {contrat.propriete_id ? (
                    <Link 
                      href={`/proprietes/${contrat.propriete_id}`}
                      className="text-lg font-semibold text-[#D4841A] hover:text-[#B8741A] cursor-pointer inline-flex items-center gap-2 transition-colors duration-200"
                    >
                      {contrat.propriete_nom}
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  ) : (
                    <p className="text-lg font-semibold">{contrat.propriete_nom}</p>
                  )}
                </div>
                
                {contrat.propriete_adresse && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                    <div>
                      <p className="text-sm">{contrat.propriete_adresse}</p>
                      <p className="text-sm text-gray-600">{contrat.propriete_ville}</p>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {contrat.unite_nom && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">Unité</label>
                  <p className="text-lg font-semibold">
                    Unité {contrat.unite_numero} - {contrat.unite_nom}
                  </p>
                </div>
                
                {contrat.unite_propriete_nom && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Propriété parente</label>
                    <p className="text-sm text-gray-600">{contrat.unite_propriete_nom}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Caractéristiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Caractéristiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {contrat.meuble ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                <span className={contrat.meuble ? 'text-green-700' : 'text-gray-600'}>
                  {contrat.meuble ? 'Meublé' : 'Non meublé'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {contrat.autorisation_sous_location ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                <span className={contrat.autorisation_sous_location ? 'text-green-700' : 'text-gray-600'}>
                  Sous-location {contrat.autorisation_sous_location ? 'autorisée' : 'interdite'}
                </span>
              </div>
            </div>
            
            {contrat.besoin_renovation && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Rénovations</label>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-orange-700">Besoin de rénovation</span>
                  </div>
                  
                  {contrat.deduction_futurs_loyers && (
                    <div className="mt-2 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm">
                        <strong>Déduction futurs loyers :</strong> {contrat.deduction_futurs_loyers}€
                      </p>
                      {contrat.duree_imposee_mois && (
                        <p className="text-sm mt-1">
                          <strong>Durée imposée :</strong> {contrat.duree_imposee_mois} mois
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Conditions financières */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Conditions financières
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Commission</label>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-gray-400" />
                <span className="text-lg font-semibold">{contrat.commission_pourcentage}%</span>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-gray-500">Usage propriétaire</label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium">
                  Maximum {contrat.usage_proprietaire_jours_max} jours par an
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Propriétaires & Quotités */}
      {contrat.proprietaires_data && contrat.proprietaires_data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Propriétaires & Quotités
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contrat.proprietaires_data.map((proprietaire, index) => (
              <div key={proprietaire.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Nom et type */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        proprietaire.type === 'physique' 
                          ? 'bg-[#D4841A]/10 text-[#D4841A]'
                          : 'bg-[#2D5A27]/10 text-[#2D5A27]'
                      }`}>
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {proprietaire.nom}
                            {proprietaire.prenom && ` ${proprietaire.prenom}`}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              proprietaire.type === 'physique'
                                ? 'text-[#D4841A] border-[#D4841A]/20 bg-[#D4841A]/5'
                                : 'text-[#2D5A27] border-[#2D5A27]/20 bg-[#2D5A27]/5'
                            }`}
                          >
                            {proprietaire.type === 'physique' ? '👤 Personne physique' : '🏢 Personne morale'}
                          </Badge>
                        </div>
                        
                        {/* Informations supplémentaires pour les personnes morales */}
                        {proprietaire.type === 'morale' && (
                          <div className="text-xs text-gray-600 mt-1 space-y-1">
                            {proprietaire.forme_juridique && (
                              <div>Forme juridique: {proprietaire.forme_juridique}</div>
                            )}
                            {proprietaire.numero_identification && (
                              <div>N° identification: {proprietaire.numero_identification}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Contact */}
                    {(proprietaire.email || proprietaire.telephone) && (
                      <div className="flex items-center gap-4 text-sm text-gray-600 ml-13">
                        {proprietaire.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{proprietaire.email}</span>
                          </div>
                        )}
                        {proprietaire.telephone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{proprietaire.telephone}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Adresse */}
                    {proprietaire.adresse && (
                      <div className="text-sm text-gray-600 ml-13 flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-0.5" />
                        <span>{proprietaire.adresse}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Quotité */}
                  <div className="text-right space-y-1">
                    <div className="text-lg font-bold text-gray-900">
                      {proprietaire.quotite_numerateur}/{proprietaire.quotite_denominateur}
                    </div>
                    <div className="text-sm text-[#D4841A] font-semibold">
                      {proprietaire.pourcentage.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total des quotités avec validation */}
            <Separator className="my-4" />
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              contrat.quotites_valid 
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {contrat.quotites_valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={`font-medium ${
                  contrat.quotites_valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  Total des quotités
                </span>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  contrat.quotites_valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {contrat.quotites_total?.toFixed(2)}%
                </div>
                {!contrat.quotites_valid && (
                  <div className="text-xs text-red-600">
                    Doit être exactement 100%
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organisation Gestionnaire */}
      {contrat.organisation_display_name && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organisation Gestionnaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {contrat.organisation_country_flag && (
                <div className="text-2xl">
                  {contrat.organisation_country_flag}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {contrat.organisation_display_name}
                </p>
                {contrat.organisation_pays && (
                  <p className="text-sm text-gray-600">
                    Pays de gestion: {contrat.organisation_pays}
                  </p>
                )}
              </div>
            </div>
            
            {contrat.organisation_nom && contrat.organisation_nom !== contrat.organisation_display_name && (
              <div className="text-sm text-gray-600">
                <strong>Nom technique:</strong> {contrat.organisation_nom}
              </div>
            )}
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                L'organisation est automatiquement assignée selon le pays de la propriété, 
                conformément à l'architecture métier Want It Now.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métadonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Métadonnées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-500">Créé le</label>
              <p>{new Date(contrat.created_at).toLocaleString('fr-FR')}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Modifié le</label>
              <p>{new Date(contrat.updated_at).toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}