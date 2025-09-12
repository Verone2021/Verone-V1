'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { 
  MoreHorizontal, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Key, 
  UserCheck, 
  UserX,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { UserPasswordModal } from './user-password-modal'
import { deleteUserWithAutoAuth, processPendingAuthOperations } from '@/actions/auth-admin'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  nom?: string
  prenom?: string
  telephone?: string
  role?: string
  created_at: string
  last_sign_in_at?: string
  user_roles?: Array<{
    organisation_id: string
    role: string
    organisation: {
      id: string
      nom: string
      pays: string
    }
  }>
}

interface PendingOperation {
  operation_type: 'create' | 'delete'
  user_id: string
  email?: string
  created_at: string
}

interface UserManagementTableProps {
  users: User[]
  pendingOperations: PendingOperation[]
}

export function UserManagementTable({ users, pendingOperations }: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Filtrer les utilisateurs selon le terme de recherche
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.nom?.toLowerCase().includes(searchLower) ||
      user.prenom?.toLowerCase().includes(searchLower)
    )
  })

  // Vérifier si un utilisateur a des opérations en attente
  const hasPendingOperation = (userId: string) => {
    return pendingOperations.some(op => op.user_id === userId)
  }

  // Obtenir le type d'opération en attente
  const getPendingOperationType = (userId: string) => {
    return pendingOperations.find(op => op.user_id === userId)?.operation_type
  }

  // Obtenir le rôle principal de l'utilisateur
  const getPrimaryRole = (user: User) => {
    if (user.user_roles && user.user_roles.length > 0) {
      // Prioriser super_admin > admin > autres
      const roles = user.user_roles.map(ur => ur.role)
      if (roles.includes('super_admin')) return 'super_admin'
      if (roles.includes('admin')) return 'admin'
      return roles[0]
    }
    return user.role || 'utilisateur'
  }

  // Obtenir les organisations de l'utilisateur
  const getUserOrganisations = (user: User) => {
    return user.user_roles?.map(ur => ur.organisation.nom).join(', ') || 'Aucune'
  }

  // Obtenir les initiales de l'utilisateur
  const getUserInitials = (user: User) => {
    const prenom = user.prenom || ''
    const nom = user.nom || ''
    if (prenom && nom) return `${prenom[0]}${nom[0]}`.toUpperCase()
    if (prenom) return prenom.slice(0, 2).toUpperCase()
    if (nom) return nom.slice(0, 2).toUpperCase()
    return user.email.slice(0, 2).toUpperCase()
  }

  // Obtenir la couleur du badge de rôle
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive'
      case 'admin': return 'default'
      default: return 'outline'
    }
  }

  // Supprimer un utilisateur
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const result = await deleteUserWithAutoAuth(selectedUser.id)
      
      if (result.success) {
        toast.success('Utilisateur supprimé avec succès')
        // Recharger la page pour actualiser les données
        window.location.reload()
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur inattendue lors de la suppression')
    } finally {
      setIsProcessing(false)
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    }
  }

  // Traiter les opérations en attente
  const handleProcessPendingOperations = async () => {
    setIsProcessing(true)
    try {
      const result = await processPendingAuthOperations()
      
      if (result.success) {
        const { processed, failed } = result.data!
        if (processed > 0) {
          toast.success(`${processed} opération(s) traitée(s) avec succès`)
        }
        if (failed > 0) {
          toast.warning(`${failed} opération(s) échouée(s)`)
        }
        if (processed === 0 && failed === 0) {
          toast.info('Aucune opération en attente')
        }
        // Recharger la page pour actualiser
        window.location.reload()
      } else {
        toast.error(result.error || 'Erreur lors du traitement')
      }
    } catch (error) {
      console.error('Erreur traitement:', error)
      toast.error('Erreur inattendue lors du traitement')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et actions */}
      <div className="flex items-center justify-between p-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          {pendingOperations.length > 0 && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleProcessPendingOperations}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Traiter en attente ({pendingOperations.length})
            </Button>
          )}
          
          <Button size="sm" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Table des utilisateurs */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Organisations</TableHead>
            <TableHead>Dernière connexion</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => {
            const primaryRole = getPrimaryRole(user)
            const organisations = getUserOrganisations(user)
            const initials = getUserInitials(user)
            const pendingOpType = getPendingOperationType(user.id)
            
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.prenom && user.nom ? (
                          `${user.prenom} ${user.nom}`
                        ) : (
                          user.email
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                      {user.telephone && (
                        <div className="text-xs text-gray-400">
                          {user.telephone}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(primaryRole)}>
                    {primaryRole}
                  </Badge>
                  {user.user_roles && user.user_roles.length > 1 && (
                    <Badge variant="outline" className="ml-1">
                      +{user.user_roles.length - 1}
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell className="max-w-xs truncate" title={organisations}>
                  {organisations}
                </TableCell>
                
                <TableCell>
                  {user.last_sign_in_at ? (
                    format(new Date(user.last_sign_in_at), 'dd/MM/yy HH:mm', { locale: fr })
                  ) : (
                    <span className="text-gray-400">Jamais</span>
                  )}
                </TableCell>
                
                <TableCell>
                  {pendingOpType ? (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                      <Clock className="h-3 w-3 mr-1" />
                      {pendingOpType === 'create' ? 'Création' : 'Suppression'}
                    </Badge>
                  ) : user.user_roles && user.user_roles.length > 0 ? (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      <UserX className="h-3 w-3 mr-1" />
                      Inactif
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Ouvrir le menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          setPasswordModalOpen(true)
                        }}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Gérer mot de passe
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          // Changement de rôle temporairement désactivé
                        }}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Changer rôle
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedUser(user)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            {searchTerm ? (
              <>Aucun utilisateur trouvé pour "{searchTerm}"</>
            ) : (
              <>Aucun utilisateur trouvé</>
            )}
          </div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <strong>{selectedUser?.email}</strong> ?
              Cette action est irréversible et supprimera également le compte d'authentification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      {selectedUser && (
        <>
          <UserPasswordModal
            user={selectedUser}
            open={passwordModalOpen}
            onOpenChange={setPasswordModalOpen}
          />
          
        </>
      )}
    </div>
  )
}