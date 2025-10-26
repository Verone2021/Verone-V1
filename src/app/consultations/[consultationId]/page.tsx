"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Building,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Package
} from 'lucide-react'
import { ButtonV2 } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { ConsultationOrderInterface } from '../../../components/business/consultation-order-interface'
import { ConsultationImageGallery } from '../../../components/business/consultation-image-gallery'
import { EditConsultationModal } from '../../../components/business/edit-consultation-modal'
import { useConsultations, ClientConsultation } from '../../../hooks/use-consultations'
import { useToast } from '../../../hooks/use-toast'

export default function ConsultationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const {
    consultations,
    loading,
    fetchConsultations,
    updateStatus,
    updateConsultation,
    validateConsultation,
    archiveConsultation,
    unarchiveConsultation,
    deleteConsultation
  } = useConsultations()

  const consultationId = params.consultationId as string
  const [consultation, setConsultation] = useState<ClientConsultation | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchConsultations()
  }, [])

  useEffect(() => {
    if (consultations && consultations.length > 0) {
      const foundConsultation = consultations.find(c => c.id === consultationId)
      setConsultation(foundConsultation || null)
    }
  }, [consultations, consultationId])

  const handleStatusChange = async (newStatus: ClientConsultation['status']) => {
    if (!consultation) return

    const success = await updateStatus(consultationId, newStatus)
    if (success) {
      setConsultation(prev => prev ? { ...prev, status: newStatus } : null)
    }
  }

  const handleUpdateConsultation = async (updates: Partial<ClientConsultation>): Promise<boolean> => {
    const success = await updateConsultation(consultationId, updates)
    if (success) {
      // Recharger pour avoir les données fraîches
      await fetchConsultations()
    }
    return success
  }

  const handleValidateConsultation = async () => {
    const success = await validateConsultation(consultationId)
    if (success) {
      await fetchConsultations()
    }
  }

  const handleArchiveConsultation = async () => {
    const success = await archiveConsultation(consultationId)
    if (success) {
      await fetchConsultations()
    }
  }

  const handleUnarchiveConsultation = async () => {
    const success = await unarchiveConsultation(consultationId)
    if (success) {
      await fetchConsultations()
    }
  }

  const handleDeleteConsultation = async () => {
    const success = await deleteConsultation(consultationId)
    if (success) {
      router.push('/consultations') // Rediriger après suppression
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-gray-100 text-gray-900 border-gray-200'
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'terminee': return 'bg-green-100 text-green-800 border-green-200'
      case 'annulee': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en_attente': return <Clock className="h-3 w-3" />
      case 'en_cours': return <AlertCircle className="h-3 w-3" />
      case 'terminee': return <CheckCircle className="h-3 w-3" />
      case 'annulee': return <XCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getPriorityColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-100 text-red-800 border-red-200'
      case 2: return 'bg-gray-100 text-gray-900 border-gray-200'
      case 3: return 'bg-blue-100 text-blue-800 border-blue-200'
      case 4: return 'bg-green-100 text-green-800 border-green-200'
      case 5: return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (level: number) => {
    switch (level) {
      case 1: return 'Très urgent'
      case 2: return 'Urgent'
      case 3: return 'Normal'
      case 4: return 'Faible'
      case 5: return 'Très faible'
      default: return 'Normal'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black mx-auto mb-1"></div>
          <p className="text-gray-600">Chargement de la consultation...</p>
        </div>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-1">
            <AlertCircle className="h-3 w-3 text-gray-400 mx-auto mb-1" />
            <h3 className="text-xs font-medium text-gray-900 mb-1">Consultation non trouvée</h3>
            <p className="text-gray-600 mb-1">
              Cette consultation n'existe pas ou a été supprimée.
            </p>
            <ButtonV2 onClick={() => router.push('/consultations')}>
              <ArrowLeft className="h-3 w-3 mr-2" />
              Retour aux consultations
            </ButtonV2>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-2 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="ghost"
                onClick={() => router.push('/consultations')}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-3 w-3 mr-2" />
                Retour aux consultations
              </ButtonV2>
              <div>
                <h1 className="text-xs font-bold text-black">Détail Consultation</h1>
                <p className="text-gray-600">{consultation.organisation_name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getStatusColor(consultation.status)}>
                {getStatusIcon(consultation.status)}
                <span className="ml-1 capitalize">{consultation.status.replace('_', ' ')}</span>
              </Badge>
              <Badge variant="outline" className={getPriorityColor(consultation.priority_level)}>
                Priorité: {getPriorityLabel(consultation.priority_level)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 py-1 space-y-1">
        {/* Section avec informations et galerie photos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
          {/* Galerie photos consultation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-3 w-3 mr-2" />
                  Photos consultation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConsultationImageGallery
                  consultationId={consultationId}
                  consultationTitle={consultation.organisation_name}
                  consultationStatus={consultation.status}
                  allowEdit={true}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Informations consultation */}
          <div className="lg:col-span-2">
            <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Building className="h-3 w-3 mr-2" />
                Informations de la consultation
              </CardTitle>
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="h-3 w-3 mr-2" />
                Modifier
              </ButtonV2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-600">Organisation</p>
                  <p className="font-medium">{consultation.organisation_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Email client</p>
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 text-gray-400 mr-2" />
                    <p className="font-medium">{consultation.client_email}</p>
                  </div>
                </div>
                {consultation.client_phone && (
                  <div>
                    <p className="text-xs text-gray-600">Téléphone</p>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 text-gray-400 mr-2" />
                      <p className="font-medium">{consultation.client_phone}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Canal d'origine</p>
                  <p className="font-medium capitalize">{consultation.source_channel}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-600">Créée le</p>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 text-gray-400 mr-2" />
                    <p className="font-medium">
                      {new Date(consultation.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                {consultation.tarif_maximum && (
                  <div>
                    <p className="text-xs text-gray-600">Budget maximum</p>
                    <p className="font-medium">{consultation.tarif_maximum}€</p>
                  </div>
                )}
                {consultation.estimated_response_date && (
                  <div>
                    <p className="text-xs text-gray-600">Réponse estimée</p>
                    <p className="font-medium">
                      {new Date(consultation.estimated_response_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {consultation.assigned_to && (
                  <div>
                    <p className="text-xs text-gray-600">Assignée à</p>
                    <div className="flex items-center">
                      <User className="h-3 w-3 text-gray-400 mr-2" />
                      <p className="font-medium">{consultation.assigned_to}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-1">
              <p className="text-xs text-gray-600 mb-1">Description</p>
              <p className="bg-gray-50 p-1 rounded">{consultation.descriptif}</p>
            </div>

            {consultation.notes_internes && (
              <div className="mt-1">
                <p className="text-xs text-gray-600 mb-1">Notes internes</p>
                <p className="bg-gray-50 p-1 rounded border-l-4 border-gray-300">
                  {consultation.notes_internes}
                </p>
              </div>
            )}
          </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions de statut */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Modifier le statut de la consultation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <ButtonV2
                variant={consultation.status === 'en_attente' ? 'primary' : 'outline'}
                onClick={() => handleStatusChange('en_attente')}
                disabled={consultation.status === 'en_attente'}
              >
                <Clock className="h-3 w-3 mr-2" />
                En attente
              </ButtonV2>
              <ButtonV2
                variant={consultation.status === 'en_cours' ? 'primary' : 'outline'}
                onClick={() => handleStatusChange('en_cours')}
                disabled={consultation.status === 'en_cours'}
              >
                <AlertCircle className="h-3 w-3 mr-2" />
                En cours
              </ButtonV2>
              <ButtonV2
                variant={consultation.status === 'terminee' ? 'primary' : 'outline'}
                onClick={() => handleStatusChange('terminee')}
                disabled={consultation.status === 'terminee'}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-3 w-3 mr-2" />
                Terminée
              </ButtonV2>
              <ButtonV2
                variant={consultation.status === 'annulee' ? 'primary' : 'outline'}
                onClick={() => handleStatusChange('annulee')}
                disabled={consultation.status === 'annulee'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="h-3 w-3 mr-2" />
                Annulée
              </ButtonV2>
            </div>
          </CardContent>
        </Card>

        {/* Gestion lifecycle: Validation, Archivage, Suppression */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion de la consultation</CardTitle>
            <CardDescription>Validation, archivage et suppression</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 flex-wrap gap-1">
              {/* Badge Validée si applicable */}
              {consultation.validated_at && (
                <Badge className="bg-green-600 text-white">
                  ✅ Validée le {new Date(consultation.validated_at).toLocaleDateString('fr-FR')}
                </Badge>
              )}

              {/* Bouton Valider (si pas encore validée) */}
              {!consultation.validated_at && !consultation.archived_at && (
                <ButtonV2
                  variant="success"
                  onClick={handleValidateConsultation}
                >
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Valider la consultation
                </ButtonV2>
              )}

              {/* Badge Archivée si applicable */}
              {consultation.archived_at && (
                <Badge variant="outline" className="border-gray-400 text-gray-700">
                  📦 Archivée le {new Date(consultation.archived_at).toLocaleDateString('fr-FR')}
                </Badge>
              )}

              {/* Bouton Archiver (si pas archivée) */}
              {!consultation.archived_at && (
                <ButtonV2
                  variant="outline"
                  onClick={handleArchiveConsultation}
                  className="border-gray-400 hover:bg-gray-100"
                >
                  📦 Archiver
                </ButtonV2>
              )}

              {/* Bouton Désarchiver (si archivée) */}
              {consultation.archived_at && (
                <ButtonV2
                  variant="outline"
                  onClick={handleUnarchiveConsultation}
                  className="border-blue-400 text-blue-600 hover:bg-blue-50"
                >
                  ↩️ Désarchiver
                </ButtonV2>
              )}

              {/* Bouton Supprimer (seulement si archivée) */}
              {consultation.archived_at && (
                <ButtonV2
                  variant="danger"
                  onClick={handleDeleteConsultation}
                >
                  <XCircle className="h-3 w-3 mr-2" />
                  Supprimer définitivement
                </ButtonV2>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interface de gestion des produits */}
        <ConsultationOrderInterface
          consultationId={consultationId}
          onItemsChanged={() => {
            // Optionnel: recharger les données de consultation si nécessaire
            console.log('Items changed for consultation:', consultationId)
          }}
        />
      </div>

      {/* Modal d'édition consultation */}
      {consultation && (
        <EditConsultationModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          consultation={consultation}
          onUpdated={handleUpdateConsultation}
        />
      )}
    </div>
  )
}