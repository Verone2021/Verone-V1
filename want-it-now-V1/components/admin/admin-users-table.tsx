'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type Column } from '@/components/ui/datatable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// UserRoleChips inline component
import { Eye, Edit, Trash2, Settings, Shield, Building } from 'lucide-react'
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
  canCreateProprietaire: boolean
  canAssignOrganisations: boolean
  canViewAllUsers: boolean
  restrictedToOrganisations: string[] | null
}

interface AdminUsersTableProps {
  users: UserWithRoles[]
  capabilities: Capabilities
  currentUserRole: 'super_admin' | 'admin'
  currentUserId: string
}

export function AdminUsersTable({ 
  users, 
  capabilities, 
  currentUserRole,
  currentUserId 
}: AdminUsersTableProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Fonction pour formater la dernière connexion
  const formatLastConnection = (lastSignIn: string | null | undefined) => {
    if (!lastSignIn) return { text: 'Jamais connecté', color: 'text-gray-500' }
    
    const lastConnection = new Date(lastSignIn)
    const now = new Date()
    const diffMs = now.getTime() - lastConnection.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return { text: `Il y a ${diffMinutes}min`, color: 'text-green-600' }
    } else if (diffHours < 24) {
      return { text: `Il y a ${diffHours}h`, color: 'text-green-600' }
    } else if (diffDays < 7) {
      return { text: `Il y a ${diffDays}j`, color: 'text-yellow-600' }
    } else if (diffDays < 30) {
      return { text: `Il y a ${diffDays}j`, color: 'text-orange-600' }
    } else {
      return { text: `Il y a ${diffDays}j`, color: 'text-red-600' }
    }
  }

  // Fonction de suppression d'utilisateur
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userId === currentUserId) {
      toast.error("Vous ne pouvez pas vous supprimer vous-même")
      return
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ? Cette action est irréversible.`)) {
      return
    }

    try {
      setIsDeleting(userId)
      await deleteUserHardAction(userId)
      toast.success('Utilisateur supprimé avec succès')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(null)
    }
  }

  // Vérifier si l'utilisateur peut être modifié/supprimé
  const canModifyUser = (user: UserWithRoles) => {
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

  // Configuration des colonnes
  const columns: Column<UserWithRoles>[] = [
    {
      key: 'nom',
      header: 'Nom complet',
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">
            {user.prenom} {user.nom}
          </div>
          {user.telephone && (
            <div className="text-sm text-gray-500">{user.telephone}</div>
          )}
        </div>
      ),
      sortable: true,
      searchable: true,
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => (
        <div className="text-sm text-gray-900">{user.email}</div>
      ),
      sortable: true,
      searchable: true,
    },
    {
      key: 'role',
      header: 'Rôles & Organisations',
      render: (user) => {
        const hasMultipleRoles = user.user_roles && user.user_roles.length > 1
        const isSuperAdmin = user.user_roles?.some(r => r.role === 'super_admin')
        
        return (
          <div className="space-y-1">
            {/* Rôle principal */}
            <div className="flex flex-wrap gap-1">
              <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                {user.role === 'super_admin' ? 'Super Admin' : 
                 user.role === 'admin' ? 'Admin' : 'Utilisateur'}
              </Badge>
            </div>
            
            {/* Organisations pour les admins */}
            {user.user_roles?.filter(r => r.role === 'admin').map(role => (
              <Badge key={`${role.organisation_id}-${role.role}`} variant="outline" className="text-xs">
                <Building className="w-3 h-3 mr-1" />
                {role.organisation.nom}
              </Badge>
            ))}
            
            {/* Indicateur Super Admin */}
            {isSuperAdmin && (
              <Badge className="text-xs bg-brand-copper">
                <Shield className="w-3 h-3 mr-1" />
                Super Admin
              </Badge>
            )}
          </div>
        )
      },
      sortable: true,
    },
    {
      key: 'last_sign_in_at',
      header: 'Dernière connexion',
      render: (user) => {
        const lastConnection = formatLastConnection(user.last_sign_in_at)
        return (
          <div className={`text-sm ${lastConnection.color}`}>
            {lastConnection.text}
          </div>
        )
      },
      sortable: true,
    },
    {
      key: 'created_at',
      header: 'Créé le',
      render: (user) => (
        <div className="text-sm text-gray-500">
          {new Date(user.created_at).toLocaleDateString('fr-FR')}
        </div>
      ),
      sortable: true,
    },
  ]

  // Actions pour chaque ligne
  const renderActions = (user: UserWithRoles) => {
    const canModify = canModifyUser(user)
    const isSelf = user.id === currentUserId
    const isSuperAdminUser = user.user_roles?.some(r => r.role === 'super_admin')
    
    return (
      <div className="flex items-center space-x-1">
        {/* Voir détail */}
        <Link href={`/admin/utilisateurs/${user.id}`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Voir le détail et gérer les organisations">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        
        {/* Modifier (si autorisé) */}
        {canModify && (
          <Link href={`/admin/utilisateurs/${user.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Modifier les informations utilisateur">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
        )}
        
        {/* Gérer organisations (Super Admin uniquement) - Redirection vers vue détail */}
        {capabilities.canAssignOrganisations && !isSuperAdminUser && (
          <Link href={`/admin/utilisateurs/${user.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Gérer les organisations assignées">
              <Building className="h-4 w-4" />
            </Button>
          </Link>
        )}
        
        {/* Supprimer (si autorisé et pas soi-même) */}
        {canModify && !isSelf && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDeleteUser(user.id, user.email)}
            disabled={isDeleting === user.id}
          >
            <Trash2 className={`h-4 w-4 ${isDeleting === user.id ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    )
  }

  return (
    <DataTable<UserWithRoles>
      data={users}
      columns={columns}
      title={`${users.length} utilisateur${users.length > 1 ? 's' : ''}`}
      searchable={true}
      sortable={true}
      pagination={true}
      pageSize={10}
      actions={renderActions}
      className="modern-shadow-lg"
      emptyMessage={
        capabilities.canViewAllUsers 
          ? "Aucun utilisateur trouvé. Commencez par créer votre premier utilisateur."
          : "Aucun utilisateur visible dans vos organisations."
      }
    />
  )
}