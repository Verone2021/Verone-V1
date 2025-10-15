/**
 * 📊 Tableau de Gestion des Utilisateurs - Vérone
 *
 * Composant pour afficher et gérer la liste des utilisateurs
 * avec leurs rôles et informations dans l'interface d'administration.
 */

"use client"

import React, { useState } from 'react'
import { Edit, Trash2, Shield, Phone, Mail, Calendar, Key, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ButtonV2 } from '@/components/ui-v2/button'
import { RoleBadge, type UserRole } from '@/components/ui/role-badge'
import { Input } from '@/components/ui/input'
import { UserWithProfile } from '@/app/admin/users/page'
import { EditUserDialog } from './edit-user-dialog'
import { DeleteUserDialog } from './delete-user-dialog'
import { ResetPasswordDialog } from './reset-password-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserManagementTableProps {
  users: UserWithProfile[]
}

export function UserManagementTable({ users }: UserManagementTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [deleteUserOpen, setDeleteUserOpen] = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null)

  // Filtrer les utilisateurs selon les critères
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
      // Note: first_name/last_name pas encore dans le schéma DB
      // Ces filtres seront ajoutés quand les colonnes seront disponibles

    const matchesRole = roleFilter === 'all' || user.profile?.role === roleFilter

    return matchesSearch && matchesRole
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatUserName = (email: string, user_metadata: any = null) => {
    // Essayer d'obtenir le nom depuis les métadonnées
    if (user_metadata?.name) {
      return user_metadata.name
    }

    if (user_metadata?.first_name || user_metadata?.last_name) {
      return [user_metadata.first_name, user_metadata.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()
    }

    // Fallback : utiliser la partie avant @ comme nom temporaire
    const tempName = email.split('@')[0].split('.') || ['']
    return tempName.length > 1 ? tempName.join(' ') : tempName[0]
  }

  const getFirstName = (email: string, user_metadata: any = null) => {
    if (user_metadata?.first_name) return user_metadata.first_name
    const tempName = email.split('@')[0].split('.') || ['']
    return tempName[0] || ''
  }

  const getLastName = (email: string, user_metadata: any = null) => {
    if (user_metadata?.last_name) return user_metadata.last_name
    const tempName = email.split('@')[0].split('.') || ['']
    return tempName[1] || ''
  }

  const getJobTitle = (user_metadata: any = null) => {
    return user_metadata?.job_title || 'Non renseigné'
  }

  const handleViewUserDetails = (user: UserWithProfile) => {
    console.log('Navigation vers les détails utilisateur:', user.id) // Debug log
    router.push(`/admin/users/${user.id}`)
  }

  const handleEditUser = (user: UserWithProfile) => {
    setSelectedUser(user)
    setEditUserOpen(true)
  }

  const handleDeleteUser = (user: UserWithProfile) => {
    setSelectedUser(user)
    setDeleteUserOpen(true)
  }

  const handleResetPassword = (user: UserWithProfile) => {
    setSelectedUser(user)
    setResetPasswordOpen(true)
  }

  const handleUserUpdated = () => {
    // This will trigger a page refresh to show the updated data
    // In a real app, we might want to update the local state instead
    window.location.reload()
  }

  const handleUserDeleted = () => {
    // This will trigger a page refresh to show the updated data
    window.location.reload()
  }

  const handlePasswordReset = () => {
    // This will trigger a page refresh to show the updated data
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border-black text-black placeholder:text-black placeholder:opacity-50 focus:ring-black focus:border-black focus:ring-2 focus:ring-offset-0"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48 bg-white border-black text-black focus:ring-black focus:border-black focus:ring-2 focus:ring-offset-0">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent className="bg-white border-black">
            <SelectItem value="all" className="text-black focus:bg-gray-100 focus:text-black">Tous les rôles</SelectItem>
            <SelectItem value="owner" className="text-black focus:bg-gray-100 focus:text-black">Owner</SelectItem>
            <SelectItem value="admin" className="text-black focus:bg-gray-100 focus:text-black">Admin</SelectItem>
            <SelectItem value="catalog_manager" className="text-black focus:bg-gray-100 focus:text-black">Catalog Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="border border-black rounded-none">
        <Table>
          <TableHeader>
            <TableRow className="border-black">
              <TableHead className="text-black font-semibold">Prénom</TableHead>
              <TableHead className="text-black font-semibold">Nom</TableHead>
              <TableHead className="text-black font-semibold">Rôle</TableHead>
              <TableHead className="text-black font-semibold">Poste</TableHead>
              <TableHead className="text-black font-semibold">Créé le</TableHead>
              <TableHead className="text-black font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-black opacity-60">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-black hover:bg-gray-50">
                  {/* Prénom */}
                  <TableCell>
                    <div className="font-medium text-black">
                      {getFirstName(user.email, user.user_metadata)}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-black opacity-50 mt-1">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>
                  </TableCell>

                  {/* Nom */}
                  <TableCell>
                    <div className="font-medium text-black">
                      {getLastName(user.email, user.user_metadata)}
                    </div>
                  </TableCell>

                  {/* Rôle */}
                  <TableCell>
                    {user.profile?.role && (
                      <RoleBadge role={user.profile.role as UserRole} />
                    )}
                  </TableCell>

                  {/* Poste */}
                  <TableCell>
                    <span className={`text-sm ${getJobTitle(user.user_metadata) === 'Non renseigné' ? 'text-black opacity-50' : 'text-black'}`}>
                      {getJobTitle(user.user_metadata)}
                    </span>
                  </TableCell>

                  {/* Date de création */}
                  <TableCell>
                    <div className="flex items-center space-x-2 text-sm text-black opacity-60">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(user.created_at)}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <ButtonV2
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewUserDetails(user)}
                        title="Voir les détails"
                      />

                      <ButtonV2
                        variant="secondary"
                        size="sm"
                        icon={Edit}
                        onClick={() => handleEditUser(user)}
                        title="Éditer utilisateur"
                      />

                      <ButtonV2
                        variant="warning"
                        size="sm"
                        icon={Key}
                        onClick={() => handleResetPassword(user)}
                        title="Réinitialiser le mot de passe"
                      />

                      {/* Ne pas permettre la suppression du dernier owner */}
                      {!(user.profile?.role === 'owner' &&
                        filteredUsers.filter(u => u.profile?.role === 'owner').length === 1) && (
                        <ButtonV2
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteUser(user)}
                          title="Supprimer utilisateur"
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer avec statistiques */}
      <div className="flex justify-between items-center text-sm text-black opacity-60 pt-4 border-t border-black">
        <span>
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} affiché{filteredUsers.length > 1 ? 's' : ''}
          {searchTerm && ` (filtré${filteredUsers.length > 1 ? 's' : ''} sur ${users.length})`}
        </span>

        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>{users.filter(u => u.profile?.role === 'owner').length} Owner(s)</span>
          </span>
          <span className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>{users.filter(u => u.profile?.role === 'admin').length} Admin(s)</span>
          </span>
          <span className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>{users.filter(u => u.profile?.role === 'catalog_manager').length} Manager(s)</span>
          </span>
        </div>
      </div>

      {/* Modals */}
      <EditUserDialog
        open={editUserOpen}
        onOpenChange={setEditUserOpen}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />

      <DeleteUserDialog
        open={deleteUserOpen}
        onOpenChange={setDeleteUserOpen}
        user={selectedUser}
        onUserDeleted={handleUserDeleted}
      />

      <ResetPasswordDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        user={selectedUser}
        onPasswordReset={handlePasswordReset}
      />
    </div>
  )
}