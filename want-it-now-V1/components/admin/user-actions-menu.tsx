'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Settings, 
  Shield, 
  UserX,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import { deleteUserHardAction } from '@/actions/utilisateurs'
import { toast } from 'sonner'

interface UserWithRoles {
  id: string
  nom: string | null
  prenom: string | null
  email: string
  telephone: string | null
  role: string
  created_at: string
  updated_at: string
  last_sign_in_at?: string | null
  user_roles: Array<{
    organisation_id: string
    role: string
    organisation: {
      id: string
      nom: string
      pays: string
    }
  }>
}

interface Capabilities {
  canCreateSuperAdmin: boolean
  canCreateAdmin: boolean
  canAssignOrganisations: boolean
  canViewAllUsers: boolean
  canDeleteUsers: boolean
  canExportData: boolean
  restrictedToOrganisations: string[] | null
}

interface UserActionsMenuProps {
  user: UserWithRoles
  capabilities: Capabilities
  currentUserRole: 'super_admin' | 'admin'
  currentUserId: string
}

export function UserActionsMenu({ 
  user, 
  capabilities, 
  currentUserRole,
  currentUserId 
}: UserActionsMenuProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Vérifier si l'utilisateur peut être modifié/supprimé
  const canModifyUser = () => {
    // Super admin peut tout modifier
    if (currentUserRole === 'super_admin') return true
    
    // Admin ne peut modifier que les utilisateurs de ses organisations
    if (capabilities.restrictedToOrganisations) {
      return user.user_roles?.some(role => 
        capabilities.restrictedToOrganisations!.includes(role.organisation_id)
      )
    }
    
    return false
  }

  // Vérifier si c'est un super admin
  const isSuperAdminUser = user.user_roles?.some(r => r.role === 'super_admin')
  const isSelf = user.id === currentUserId
  const canModify = canModifyUser()

  // Fonction de suppression d'utilisateur
  const handleDeleteUser = async () => {
    if (isSelf) {
      toast.error("Vous ne pouvez pas vous supprimer vous-même")
      return
    }

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ?\n\nCette action est irréversible et supprimera :\n- Le compte utilisateur\n- Tous ses accès\n- Son historique de connexions`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteUserHardAction(user.id)
      toast.success('Utilisateur supprimé avec succès')
      router.refresh()
      setIsOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  // Contact actions
  const handleSendEmail = () => {
    window.open(`mailto:${user.email}`, '_blank')
  }

  const handleCallPhone = () => {
    if (user.telephone) {
      window.open(`tel:${user.telephone}`, '_blank')
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ouvrir le menu d'actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-semibold">
          {user.prenom} {user.nom}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Actions de visualisation */}
        <DropdownMenuItem asChild>
          <Link href={`/admin/utilisateurs/${user.id}`} className="flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Voir le profil
          </Link>
        </DropdownMenuItem>

        {/* Actions de modification */}
        {canModify && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/utilisateurs/${user.id}/edit`} className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </DropdownMenuItem>
        )}

        {/* Assigner organisations (Super Admin uniquement, pas pour super admins) */}
        {capabilities.canAssignOrganisations && !isSuperAdminUser && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/utilisateurs/${user.id}/assign`} className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Assigner organisations
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Actions de contact */}
        <DropdownMenuItem onClick={handleSendEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Envoyer un email
        </DropdownMenuItem>

        {user.telephone && (
          <DropdownMenuItem onClick={handleCallPhone}>
            <Phone className="h-4 w-4 mr-2" />
            Appeler
          </DropdownMenuItem>
        )}

        {/* Actions d'administration */}
        {canModify && !isSelf && (
          <>
            <DropdownMenuSeparator />
            
            {/* TODO: Actions de désactivation/activation */}
            <DropdownMenuItem className="text-orange-600 focus:text-orange-600 focus:bg-orange-50">
              <UserX className="h-4 w-4 mr-2" />
              Désactiver temporairement
            </DropdownMenuItem>

            {/* Action de suppression */}
            <DropdownMenuItem 
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className={`h-4 w-4 mr-2 ${isDeleting ? 'animate-spin' : ''}`} />
              {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
            </DropdownMenuItem>
          </>
        )}

        {/* Indicateurs spéciaux */}
        {isSelf && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-gray-400">
              <UserCheck className="h-4 w-4 mr-2" />
              C'est vous
            </DropdownMenuItem>
          </>
        )}

        {isSuperAdminUser && currentUserRole !== 'super_admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-gray-400">
              <Shield className="h-4 w-4 mr-2" />
              Super administrateur
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}