'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building, 
  Globe, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { getOrganisations } from '@/actions/organisations'
import { assignOrganisationsAction } from '@/actions/user-assignments'

interface Organisation {
  id: string
  nom: string
  pays: string
  is_active: boolean
}

interface UserWithRoles {
  id: string
  prenom: string | null
  nom: string | null
  email: string
}

interface OrganisationAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithRoles
  existingOrganisationIds: string[]
}

export function OrganisationAssignmentModal({
  isOpen,
  onClose,
  user,
  existingOrganisationIds
}: OrganisationAssignmentModalProps) {
  const router = useRouter()
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [selectedOrganisationIds, setSelectedOrganisationIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Charger les organisations disponibles et réinitialiser la sélection
  useEffect(() => {
    if (isOpen) {
      setSelectedOrganisationIds([]) // Réinitialiser la sélection à chaque ouverture
      loadOrganisations()
    }
  }, [isOpen])

  const loadOrganisations = async () => {
    try {
      setIsLoading(true)
      const result = await getOrganisations()
      
      if (result.ok && result.data) {
        // Filtrer les organisations déjà assignées
        const availableOrganisations = result.data.filter(
          org => !existingOrganisationIds.includes(org.id)
        )
        setOrganisations(availableOrganisations)
      } else {
        toast.error('Erreur lors du chargement des organisations')
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des organisations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOrganisationToggle = (organisationId: string) => {
    setSelectedOrganisationIds(prev => 
      prev.includes(organisationId)
        ? prev.filter(id => id !== organisationId)
        : [...prev, organisationId]
    )
  }

  const handleSubmit = async () => {
    if (selectedOrganisationIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une organisation')
      return
    }

    try {
      setIsSubmitting(true)
      
      await assignOrganisationsAction({
        userId: user.id,
        organisationIds: selectedOrganisationIds
      })

      toast.success(
        `${selectedOrganisationIds.length} organisation${selectedOrganisationIds.length > 1 ? 's' : ''} assignée${selectedOrganisationIds.length > 1 ? 's' : ''} avec succès`
      )
      
      router.refresh()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'assignation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedOrganisationIds([]) // Réinitialiser la sélection à la fermeture
    onClose()
  }

  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
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
      // Legacy support for full country names
      'France': '🇫🇷',
      'Royaume-Uni': '🇬🇧',
      'Espagne': '🇪🇸',
      'Allemagne': '🇩🇪',
      'Italie': '🇮🇹'
    }
    return flags[countryCode] || '🌍'
  }

  const activeOrganisations = organisations.filter(org => org.is_active)
  const inactiveOrganisations = organisations.filter(org => !org.is_active)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-copper" />
            Ajouter des organisations
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les organisations auxquelles assigner{' '}
            <strong>{user.prenom} {user.nom}</strong> en tant qu'administrateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
              <span className="ml-2 text-gray-600">Chargement des organisations...</span>
            </div>
          ) : organisations.length === 0 ? (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Aucune organisation disponible pour assignation. 
                Toutes les organisations sont déjà assignées à cet utilisateur.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Organisations actives */}
              {activeOrganisations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Organisations Actives ({activeOrganisations.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {activeOrganisations.map((organisation) => (
                      <div
                        key={organisation.id}
                        className="flex items-center space-x-3 p-3 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                      >
                        <Checkbox
                          id={`org-${organisation.id}`}
                          checked={selectedOrganisationIds.includes(organisation.id)}
                          onCheckedChange={() => handleOrganisationToggle(organisation.id)}
                        />
                        <label
                          htmlFor={`org-${organisation.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-brand-copper" />
                            <span className="font-medium text-gray-900">
                              {organisation.nom}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Globe className="w-3 h-3" />
                            {getCountryFlag(organisation.pays)} {organisation.pays}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Organisations inactives */}
              {inactiveOrganisations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    Organisations Inactives ({inactiveOrganisations.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {inactiveOrganisations.map((organisation) => (
                      <div
                        key={organisation.id}
                        className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg opacity-60"
                      >
                        <Checkbox
                          id={`org-inactive-${organisation.id}`}
                          disabled
                          checked={false}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-600">
                              {organisation.nom}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <Globe className="w-3 h-3" />
                            {getCountryFlag(organisation.pays)} {organisation.pays}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résumé de la sélection */}
              {selectedOrganisationIds.length > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>{selectedOrganisationIds.length}</strong> organisation{selectedOrganisationIds.length > 1 ? 's' : ''} 
                    {' '}sélectionnée{selectedOrganisationIds.length > 1 ? 's' : ''} pour assignation.
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedOrganisationIds.length === 0 || isSubmitting}
                  className="bg-brand-copper hover:bg-brand-copper/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assignation...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Assigner ({selectedOrganisationIds.length})
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}