'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { type Organisation } from '@/lib/validations/organisations'
import { 
  deactivateOrganisation, 
  deleteOrganisationHard, 
  getDeletionImpact, 
  reactivateOrganisation 
} from '@/actions/organisations'
import { 
  Edit, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar,
  Users,
  Building,
  FileText,
  CalendarDays,
  Power,
  RotateCcw,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface OrganisationDetailProps {
  organisation: Organisation
  stats?: {
    utilisateurs_count: number
    reservations_count: number
  }
}

export function OrganisationDetail({
  organisation,
  stats,
}: OrganisationDetailProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    action: 'deactivate' | 'hard-delete' | 'reactivate' | null
    impactData?: any
  }>({
    isOpen: false,
    action: null
  })

  const handleDeactivateClick = () => {
    setActionModal({
      isOpen: true,
      action: 'deactivate'
    })
  }

  const handleHardDeleteClick = async () => {
    // Get deletion impact first
    const impactResult = await getDeletionImpact(organisation.id)
    
    setActionModal({
      isOpen: true,
      action: 'hard-delete',
      impactData: impactResult.data
    })
  }

  const handleReactivateClick = () => {
    setActionModal({
      isOpen: true,
      action: 'reactivate'
    })
  }

  const handleConfirmAction = async () => {
    if (!actionModal.action) return

    setIsProcessing(true)
    
    try {
      let result
      
      switch (actionModal.action) {
        case 'deactivate':
          result = await deactivateOrganisation(organisation.id)
          break
        case 'hard-delete':
          result = await deleteOrganisationHard(organisation.id)
          break
        case 'reactivate':
          result = await reactivateOrganisation(organisation.id)
          break
        default:
          throw new Error('Action non reconnue')
      }
      
      if (result.ok) {
        setActionModal({ isOpen: false, action: null })
        // Navigate back to organisations list after successful action
        router.push('/organisations')
      } else {
        alert(`Erreur: ${result.error}`)
      }
    } catch (error) {
      alert('Une erreur est survenue lors de l\'opération')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelAction = () => {
    setActionModal({ isOpen: false, action: null })
  }

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'FR': '🇫🇷',
      'ES': '🇪🇸',
      'DE': '🇩🇪',
      'IT': '🇮🇹',
      'GB': '🇬🇧',
      'BE': '🇧🇪',
      'CH': '🇨🇭',
      'NL': '🇳🇱',
      'PT': '🇵🇹',
      'AT': '🇦🇹',
    }
    return flags[countryCode] || '🏳️'
  }

  const getCountryName = (countryCode: string) => {
    const names: Record<string, string> = {
      'FR': 'France',
      'ES': 'Espagne',
      'DE': 'Allemagne',
      'IT': 'Italie',
      'GB': 'Royaume-Uni',
      'BE': 'Belgique',
      'CH': 'Suisse',
      'NL': 'Pays-Bas',
      'PT': 'Portugal',
      'AT': 'Autriche',
    }
    return names[countryCode] || countryCode
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{getCountryFlag(organisation.pays)}</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organisation.nom}</h1>
            <p className="text-lg text-gray-600">{getCountryName(organisation.pays)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Link href={`/organisations/${organisation.id}/edit`}>
            <Button variant="outline" className="flex items-center space-x-2">
              <Edit size={16} />
              <span>Modifier</span>
            </Button>
          </Link>
          {organisation.is_active ? (
            <Button
              variant="destructive"
              onClick={handleDeactivateClick}
              disabled={isProcessing}
              className="flex items-center space-x-2"
              title="Désactiver l'organisation"
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Power size={16} />
              )}
              <span>{isProcessing ? 'Traitement...' : 'Désactiver'}</span>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleReactivateClick}
                disabled={isProcessing}
                className="flex items-center space-x-2"
                title="Réactiver l'organisation"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RotateCcw size={16} />
                )}
                <span>{isProcessing ? 'Traitement...' : 'Réactiver'}</span>
              </Button>
              <Button
                variant="destructive"
                onClick={handleHardDeleteClick}
                disabled={isProcessing}
                className="flex items-center space-x-2"
                title="Supprimer définitivement"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <AlertTriangle size={16} />
                )}
                <span>{isProcessing ? 'Traitement...' : 'Supprimer'}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.utilisateurs_count}</p>
              </div>
            </div>
          </Card>


          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarDays className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Réservations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reservations_count}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Organisation Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informations générales
          </h3>
          
          <div className="space-y-4">
            {organisation.description && (
              <div>
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-gray-900 mt-1">{organisation.description}</p>
              </div>
            )}

            {organisation.adresse_siege && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Adresse du siège</p>
                  <p className="text-gray-900">{organisation.adresse_siege}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informations de contact
          </h3>

          <div className="space-y-4">
            {organisation.email && (
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <a
                    href={`mailto:${organisation.email}`}
                    className="text-brand-copper hover:text-brand-copper/80 transition-colors"
                  >
                    {organisation.email}
                  </a>
                </div>
              </div>
            )}

            {organisation.telephone && (
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Téléphone</p>
                  <a
                    href={`tel:${organisation.telephone}`}
                    className="text-brand-copper hover:text-brand-copper/80 transition-colors"
                  >
                    {organisation.telephone}
                  </a>
                </div>
              </div>
            )}

            {organisation.site_web && (
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Site web</p>
                  <a
                    href={organisation.site_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-copper hover:text-brand-copper/80 transition-colors"
                  >
                    {organisation.site_web}
                  </a>
                </div>
              </div>
            )}

            {!organisation.email && !organisation.telephone && !organisation.site_web && (
              <p className="text-gray-500 italic">Aucune information de contact disponible</p>
            )}
          </div>
        </Card>

        {/* Metadata */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Métadonnées
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-600">Créée le</p>
                <p className="text-gray-900">{formatDate(organisation.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-600">Modifiée le</p>
                <p className="text-gray-900">{formatDate(organisation.updated_at)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={actionModal.isOpen}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        title={
          actionModal.action === 'deactivate' ? 'Désactiver l\'organisation' :
          actionModal.action === 'hard-delete' ? 'Supprimer définitivement' :
          actionModal.action === 'reactivate' ? 'Réactiver l\'organisation' :
          'Confirmer l\'action'
        }
        description={
          actionModal.action === 'deactivate' ?
            `Désactiver "${organisation.nom}" retirera tous les accès utilisateur mais conservera les données. L'organisation pourra être réactivée plus tard.` :
          actionModal.action === 'hard-delete' ?
            `ATTENTION: Supprimer définitivement "${organisation.nom}" est IRRÉVERSIBLE.\n\n${actionModal.impactData ? `Impact: ${actionModal.impactData.impact?.user_roles || 0} rôles, ${actionModal.impactData.impact?.user_assignments || 0} assignations` : ''}${actionModal.impactData?.can_delete === false ? `\n\n⚠️ Blocage: ${actionModal.impactData.blocking_reason}` : ''}` :
          actionModal.action === 'reactivate' ?
            `Réactiver "${organisation.nom}" permettra à nouveau l'accès à l'organisation.` :
          ''
        }
        confirmText={
          actionModal.action === 'deactivate' ? 'Désactiver' :
          actionModal.action === 'hard-delete' ? 'Supprimer définitivement' :
          actionModal.action === 'reactivate' ? 'Réactiver' :
          'Confirmer'
        }
        cancelText="Annuler"
        isLoading={isProcessing}
        variant={
          actionModal.action === 'deactivate' || actionModal.action === 'hard-delete' ? 
          'destructive' : 'default'
        }
      />
    </div>
  )
}