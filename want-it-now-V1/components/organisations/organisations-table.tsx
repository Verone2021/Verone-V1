'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/ui/datatable'
import { Button } from '@/components/ui/button'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { type Organisation } from '@/lib/validations/organisations'
import { 
  deactivateOrganisation, 
  deleteOrganisationHard, 
  getDeletionImpact, 
  reactivateOrganisation 
} from '@/actions/organisations'
import { Eye, Edit, Trash2, RotateCcw, Power, AlertTriangle, Loader2 } from 'lucide-react'

interface OrganisationsTableProps {
  organisations: Organisation[]
}

export function OrganisationsTable({
  organisations,
}: OrganisationsTableProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    organisation: Organisation | null
    action: 'deactivate' | 'hard-delete' | 'reactivate' | null
    impactData?: any
  }>({
    isOpen: false,
    organisation: null,
    action: null
  })

  const handleDeactivateClick = (organisation: Organisation) => {
    setActionModal({
      isOpen: true,
      organisation,
      action: 'deactivate'
    })
  }

  const handleHardDeleteClick = async (organisation: Organisation) => {
    // Get deletion impact first
    const impactResult = await getDeletionImpact(organisation.id)
    
    setActionModal({
      isOpen: true,
      organisation,
      action: 'hard-delete',
      impactData: impactResult.data
    })
  }

  const handleReactivateClick = (organisation: Organisation) => {
    setActionModal({
      isOpen: true,
      organisation,
      action: 'reactivate'
    })
  }

  const handleConfirmAction = async () => {
    if (!actionModal.organisation || !actionModal.action) return

    const { id } = actionModal.organisation
    setIsProcessing(id)
    
    try {
      let result
      
      switch (actionModal.action) {
        case 'deactivate':
          result = await deactivateOrganisation(id)
          break
        case 'hard-delete':
          result = await deleteOrganisationHard(id)
          break
        case 'reactivate':
          result = await reactivateOrganisation(id)
          break
        default:
          throw new Error('Action non reconnue')
      }
      
      if (result.ok) {
        setActionModal({ isOpen: false, organisation: null, action: null })
        // Refresh the page to reflect changes using Next.js router
        router.refresh()
      } else {
        alert(`Erreur: ${result.error}`)
      }
    } catch (error) {
      alert('Une erreur est survenue lors de l\'opération')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleCancelAction = () => {
    setActionModal({ isOpen: false, organisation: null, action: null })
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
    })
  }

  const columns = [
    {
      key: 'pays' as keyof Organisation,
      label: 'Pays',
      sortable: true,
      render: (organisation: Organisation) => (
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getCountryFlag(organisation.pays)}</span>
          <span className="font-medium">{getCountryName(organisation.pays)}</span>
        </div>
      ),
    },
    {
      key: 'nom' as keyof Organisation,
      label: 'Nom',
      sortable: true,
      render: (organisation: Organisation) => (
        <div>
          <div className="font-medium text-gray-900">{organisation.nom}</div>
          {organisation.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {organisation.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'email' as keyof Organisation,
      label: 'Contact',
      render: (organisation: Organisation) => (
        <div className="text-sm">
          {organisation.email && (
            <div className="text-gray-900">{organisation.email}</div>
          )}
          {organisation.telephone && (
            <div className="text-gray-500">{organisation.telephone}</div>
          )}
          {!organisation.email && !organisation.telephone && (
            <span className="text-gray-400 italic">Aucun contact</span>
          )}
        </div>
      ),
    },
    {
      key: 'is_active' as keyof Organisation,
      label: 'Statut',
      sortable: true,
      render: (organisation: Organisation) => (
        <div className="flex items-center space-x-2">
          {organisation.is_active ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></div>
              Désactivée
            </span>
          )}
          {organisation.deleted_at && (
            <span className="text-xs text-gray-500">
              le {formatDate(organisation.deleted_at)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at' as keyof Organisation,
      label: 'Créé le',
      sortable: true,
      render: (organisation: Organisation) => (
        <span className="text-sm text-gray-500">
          {formatDate(organisation.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (organisation: Organisation) => (
        <div className="flex items-center space-x-2">
          <Link href={`/organisations/${organisation.id}`}>
            <Button variant="outline" size="sm" className="p-2">
              <Eye size={16} />
              <span className="sr-only">Voir</span>
            </Button>
          </Link>
          <Link href={`/organisations/${organisation.id}/edit`}>
            <Button variant="outline" size="sm" className="p-2">
              <Edit size={16} />
              <span className="sr-only">Modifier</span>
            </Button>
          </Link>
          {organisation.is_active ? (
            <Button
              variant="destructive"
              size="sm"
              className="p-2"
              onClick={() => handleDeactivateClick(organisation)}
              disabled={isProcessing === organisation.id}
              title="Désactiver l'organisation"
            >
              {isProcessing === organisation.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Power size={16} />
              )}
              <span className="sr-only">Désactiver</span>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="p-2"
                onClick={() => handleReactivateClick(organisation)}
                disabled={isProcessing === organisation.id}
                title="Réactiver l'organisation"
              >
                {isProcessing === organisation.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RotateCcw size={16} />
                )}
                <span className="sr-only">Réactiver</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="p-2"
                onClick={() => handleHardDeleteClick(organisation)}
                disabled={isProcessing === organisation.id}
                title="Supprimer définitivement"
              >
                {isProcessing === organisation.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <AlertTriangle size={16} />
                )}
                <span className="sr-only">Supprimer définitivement</span>
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        data={organisations}
        columns={columns as any}


        emptyMessage="Aucune organisation trouvée"
        className="bg-white modern-shadow rounded-modern"
        pagination={true}
        pageSize={10}
        sortable={true}
        searchable={true}
      />
      
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
          actionModal.organisation && actionModal.action === 'deactivate' ?
            `Désactiver "${actionModal.organisation.nom}" retirera tous les accès utilisateur mais conservera les données. L'organisation pourra être réactivée plus tard.` :
          actionModal.organisation && actionModal.action === 'hard-delete' ?
            `ATTENTION: Supprimer définitivement "${actionModal.organisation.nom}" est IRRÉVERSIBLE.\n\n${actionModal.impactData ? `Impact: ${actionModal.impactData.impact?.user_roles || 0} rôles, ${actionModal.impactData.impact?.user_assignments || 0} assignations` : ''}${actionModal.impactData?.can_delete === false ? `\n\n⚠️ Blocage: ${actionModal.impactData.blocking_reason}` : ''}` :
          actionModal.organisation && actionModal.action === 'reactivate' ?
            `Réactiver "${actionModal.organisation.nom}" permettra à nouveau l'accès à l'organisation.` :
          ''
        }
        confirmText={
          actionModal.action === 'deactivate' ? 'Désactiver' :
          actionModal.action === 'hard-delete' ? 'Supprimer définitivement' :
          actionModal.action === 'reactivate' ? 'Réactiver' :
          'Confirmer'
        }
        cancelText="Annuler"
        isLoading={isProcessing === actionModal.organisation?.id}
        variant={
          actionModal.action === 'deactivate' || actionModal.action === 'hard-delete' ? 
          'destructive' : 'default'
        }

      />
    </>
  )
}