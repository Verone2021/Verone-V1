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
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { ConsultationOrderInterface } from '../../../components/business/consultation-order-interface'
import { ConsultationImageGallery } from '../../../components/business/consultation-image-gallery'
import { useConsultations, ClientConsultation } from '../../../hooks/use-consultations'
import { useToast } from '../../../hooks/use-toast'

export default function ConsultationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { consultations, loading, fetchConsultations, updateStatus } = useConsultations()

  const consultationId = params.consultationId as string
  const [consultation, setConsultation] = useState<ClientConsultation | null>(null)

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'terminee': return 'bg-green-100 text-green-800 border-green-200'
      case 'annulee': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en_attente': return <Clock className="h-4 w-4" />
      case 'en_cours': return <AlertCircle className="h-4 w-4" />
      case 'terminee': return <CheckCircle className="h-4 w-4" />
      case 'annulee': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-100 text-red-800 border-red-200'
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200'
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la consultation...</p>
        </div>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Consultation non trouvée</h3>
            <p className="text-gray-600 mb-4">
              Cette consultation n'existe pas ou a été supprimée.
            </p>
            <Button onClick={() => router.push('/consultations')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux consultations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/consultations')}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux consultations
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">Détail Consultation</h1>
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

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Section avec informations et galerie photos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Galerie photos consultation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
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
                <Building className="h-5 w-5 mr-2" />
                Informations de la consultation
              </CardTitle>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Organisation</p>
                  <p className="font-medium">{consultation.organisation_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email client</p>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="font-medium">{consultation.client_email}</p>
                  </div>
                </div>
                {consultation.client_phone && (
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="font-medium">{consultation.client_phone}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Canal d'origine</p>
                  <p className="font-medium capitalize">{consultation.source_channel}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Créée le</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="font-medium">
                      {new Date(consultation.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                {consultation.tarif_maximum && (
                  <div>
                    <p className="text-sm text-gray-600">Budget maximum</p>
                    <p className="font-medium">{consultation.tarif_maximum}€</p>
                  </div>
                )}
                {consultation.estimated_response_date && (
                  <div>
                    <p className="text-sm text-gray-600">Réponse estimée</p>
                    <p className="font-medium">
                      {new Date(consultation.estimated_response_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {consultation.assigned_to && (
                  <div>
                    <p className="text-sm text-gray-600">Assignée à</p>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="font-medium">{consultation.assigned_to}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">Description</p>
              <p className="bg-gray-50 p-4 rounded-lg">{consultation.descriptif}</p>
            </div>

            {consultation.notes_internes && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Notes internes</p>
                <p className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
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
              <Button
                variant={consultation.status === 'en_attente' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('en_attente')}
                disabled={consultation.status === 'en_attente'}
              >
                <Clock className="h-4 w-4 mr-2" />
                En attente
              </Button>
              <Button
                variant={consultation.status === 'en_cours' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('en_cours')}
                disabled={consultation.status === 'en_cours'}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                En cours
              </Button>
              <Button
                variant={consultation.status === 'terminee' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('terminee')}
                disabled={consultation.status === 'terminee'}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Terminée
              </Button>
              <Button
                variant={consultation.status === 'annulee' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('annulee')}
                disabled={consultation.status === 'annulee'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annulée
              </Button>
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
    </div>
  )
}