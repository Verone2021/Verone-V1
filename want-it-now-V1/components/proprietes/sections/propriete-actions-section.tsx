'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { type Propriete } from '@/lib/validations/proprietes'
import { 
  archivePropriete, 
  deletePropriete,
  duplicatePropriete,
  changeProprieteStatut
} from '@/actions/proprietes'
import { 
  Settings,
  Archive,
  Trash2,
  Copy,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText,
  Loader2
} from 'lucide-react'

interface ProprieteActionsSectionProps {
  propriete: Propriete
  hasContracts: boolean
}

export function ProprieteActionsSection({
  propriete,
  hasContracts
}: ProprieteActionsSectionProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    action: 'archive' | 'delete' | 'duplicate' | 'status' | null
    newStatus?: string
  }>({
    isOpen: false,
    action: null
  })

  const canDelete = !hasContracts && propriete.statut !== 'disponible'
  const canArchive = propriete.statut === 'disponible' && !hasContracts
  const canChangeStatus = propriete.statut !== 'vendue'

  const handleArchive = () => {
    setActionModal({
      isOpen: true,
      action: 'archive'
    })
  }

  const handleDelete = () => {
    setActionModal({
      isOpen: true,
      action: 'delete'
    })
  }

  const handleDuplicate = () => {
    setActionModal({
      isOpen: true,
      action: 'duplicate'
    })
  }

  const handleStatusChange = (newStatus: string) => {
    setActionModal({
      isOpen: true,
      action: 'status',
      newStatus
    })
  }

  const handleConfirmAction = async () => {
    if (!actionModal.action) return

    setIsProcessing(true)
    
    try {
      let result
      
      switch (actionModal.action) {
        case 'archive':
          result = await archivePropriete(propriete.id)
          break
        case 'delete':
          result = await deletePropriete(propriete.id)
          if (result.success) {
            router.push('/proprietes')
            return
          }
          break
        case 'duplicate':
          result = await duplicatePropriete(propriete.id)
          if (result.success && result.data) {
            router.push(`/proprietes/${result.data.id}`)
            return
          }
          break
        case 'status':
          if (actionModal.newStatus) {
            result = await changeProprieteStatut(propriete.id, actionModal.newStatus as any)
          }
          break
      }

      if (result?.success) {
        router.refresh()
      }
    } catch (error) {
      console.error('Action error:', error)
    } finally {
      setIsProcessing(false)
      setActionModal({ isOpen: false, action: null })
    }
  }

  const getModalContent = () => {
    switch (actionModal.action) {
      case 'archive':
        return {
          title: 'Archiver la propriété',
          description: 'Cette propriété sera archivée et ne sera plus visible dans la liste active. Vous pourrez la restaurer ultérieurement.',
          confirmText: 'Archiver',
          variant: 'destructive' as const
        }
      case 'delete':
        return {
          title: 'Supprimer la propriété',
          description: 'Cette action est irréversible. Toutes les données associées (photos, unités, quotités) seront définitivement supprimées.',
          confirmText: 'Supprimer',
          variant: 'destructive' as const
        }
      case 'duplicate':
        return {
          title: 'Dupliquer la propriété',
          description: 'Une copie de cette propriété sera créée avec toutes ses caractéristiques. Les photos et quotités ne seront pas copiées.',
          confirmText: 'Dupliquer',
          variant: 'default' as const
        }
      case 'status':
        return {
          title: 'Changer le statut',
          description: `Voulez-vous vraiment changer le statut de "${propriete.statut}" à "${actionModal.newStatus}" ?`,
          confirmText: 'Changer',
          variant: 'default' as const
        }
      default:
        return {
          title: '',
          description: '',
          confirmText: '',
          variant: 'default' as const
        }
    }
  }

  const modalContent = getModalContent()

  return (
    <div className="space-y-6">
      {/* Status Management */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-gray-400" />
          Gestion du statut
        </h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Statut actuel</p>
            <Badge
              variant={
                propriete.statut === 'disponible' ? 'success' :
                propriete.statut === 'louee' ? 'success' :
                propriete.statut === 'brouillon' ? 'secondary' :
                propriete.statut === 'vendue' ? 'destructive' :
                'default'
              }
              className="text-base px-3 py-1"
            >
              {propriete.statut}
            </Badge>
          </div>

          {canChangeStatus && (
            <div>
              <p className="text-sm text-gray-600 mb-3">Changer le statut</p>
              <div className="flex flex-wrap gap-2">
                {['brouillon', 'sourcing', 'evaluation', 'negociation', 'achetee', 'disponible'].map((status) => {
                  if (status === propriete.statut) return null
                  return (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(status)}
                      disabled={isProcessing}
                    >
                      {status === 'brouillon' && 'Brouillon'}
                      {status === 'sourcing' && 'En sourcing'}
                      {status === 'negociation' && 'En négociation'}
                      {status === 'evaluation' && 'En évaluation'}
                      {status === 'achetee' && 'Achetée'}
                      {status === 'disponible' && 'Disponible'}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Duplication */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Copy className="w-5 h-5 text-gray-400" />
          Duplication
        </h3>
        <p className="text-gray-600 mb-4">
          Créer une copie de cette propriété avec toutes ses caractéristiques.
        </p>
        <Button
          variant="outline"
          onClick={handleDuplicate}
          disabled={isProcessing}
        >
          <Copy className="w-4 h-4 mr-2" />
          Dupliquer la propriété
        </Button>
      </Card>

      {/* Archive/Delete */}
      <Card className="p-6 border-red-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          Zone de danger
        </h3>
        
        <div className="space-y-4">
          {canArchive && (
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="font-medium">Archiver cette propriété</p>
                <p className="text-sm text-gray-600 mt-1">
                  La propriété sera conservée mais ne sera plus active
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleArchive}
                disabled={isProcessing}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archiver
              </Button>
            </div>
          )}

          {canDelete ? (
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium">Supprimer définitivement</p>
                <p className="text-sm text-gray-600 mt-1">
                  Cette action est irréversible
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isProcessing}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700">Suppression impossible</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {hasContracts 
                      ? 'Cette propriété a des contrats associés et ne peut pas être supprimée.'
                      : 'Les propriétés actives ne peuvent pas être supprimées. Archivez-la d\'abord.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, action: null })}
        onConfirm={handleConfirmAction}
        title={modalContent.title}
        description={modalContent.description}
        confirmText={modalContent.confirmText}
        variant={modalContent.variant}
        isLoading={isProcessing}
      />
    </div>
  )
}