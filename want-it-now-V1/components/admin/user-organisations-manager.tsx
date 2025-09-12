'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Trash2, 
  Building, 
  AlertCircle,
  Globe,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { removeAssignmentAction } from '@/actions/user-assignments'
import { OrganisationAssignmentModal } from './organisation-assignment-modal'

interface UserWithRoles {
  id: string
  nom: string | null
  prenom: string | null
  email: string
  user_roles: Array<{
    user_id: string
    organisation_id: string
    role: string
    created_at: string
    updated_at: string
    created_by: string
    organisations: {
      id: string
      nom: string
      pays: string
      is_active: boolean
    }
  }>
}

interface UserOrganisationsManagerProps {
  user: UserWithRoles
  currentUserId: string
}

export function UserOrganisationsManager({ user, currentUserId }: UserOrganisationsManagerProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  // Filtrer les organisations admin seulement
  const adminOrganisations = user.user_roles.filter(role => role.role === 'admin')

  // Vérifier si l'utilisateur est un super admin
  const isSuperAdmin = user.user_roles.some(role => role.role === 'super_admin')

  const handleRemoveOrganisation = async (organisationId: string, organisationName: string) => {
    if (adminOrganisations.length <= 1) {
      toast.error('Impossible de supprimer la dernière organisation')
      return
    }

    if (!confirm(`Êtes-vous sûr de vouloir retirer l'accès à "${organisationName}" ? L'administrateur perdra tous ses accès à cette organisation.`)) {
      return
    }

    try {
      setIsRemoving(organisationId)
      
      await removeAssignmentAction({
        userId: user.id,
        organisationId
      })

      toast.success(`Accès à "${organisationName}" retiré avec succès`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    } finally {
      setIsRemoving(null)
    }
  }

  const getOrganisationStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'France': '🇫🇷',
      'Royaume-Uni': '🇬🇧',
      'Espagne': '🇪🇸',
      'Allemagne': '🇩🇪',
      'Italie': '🇮🇹'
    }
    return flags[country] || '🌍'
  }

  if (isSuperAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Super Administrateur</strong><br />
          Cet utilisateur a un accès complet à toutes les organisations. 
          Les assignations spécifiques ne s'appliquent pas aux super administrateurs.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Liste des organisations */}
      {adminOrganisations.length > 0 ? (
        <div className="space-y-3">
          {adminOrganisations.map((userRole) => (
            <div 
              key={userRole.organisation_id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-brand-copper" />
                  {getOrganisationStatusIcon(userRole.organisations.is_active)}
                </div>
                <div>
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {userRole.organisations.nom}
                    <Badge variant="outline" className="text-xs">
                      Admin
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {getCountryFlag(userRole.organisations.pays)} {userRole.organisations.pays}
                    {!userRole.organisations.is_active && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Assigné le {new Date(userRole.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveOrganisation(
                  userRole.organisation_id, 
                  userRole.organisations.nom
                )}
                disabled={isRemoving === userRole.organisation_id || adminOrganisations.length <= 1}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cet administrateur n'est assigné à aucune organisation.
          </AlertDescription>
        </Alert>
      )}

      {/* Informations importantes */}
      {adminOrganisations.length === 1 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Attention :</strong> Cet administrateur n'est assigné qu'à une seule organisation. 
            Il est recommandé d'en ajouter une autre avant de retirer celle-ci.
          </AlertDescription>
        </Alert>
      )}

      {/* Bouton d'ajout */}
      <div className="pt-4 border-t">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full gradient-copper text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une organisation
        </Button>
      </div>

      {/* Modal d'ajout */}
      <OrganisationAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        existingOrganisationIds={adminOrganisations.map(role => role.organisation_id)}
      />
    </div>
  )
}