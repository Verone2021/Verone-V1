/**
 * 📊 Tableau de Gestion des Utilisateurs - Vérone
 *
 * Composant pour afficher et gérer la liste des utilisateurs
 * avec leurs rôles et informations dans l'interface d'administration.
 */

'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  Edit,
  Trash2,
  Shield,
  Phone,
  Mail,
  Calendar,
  Key,
  Eye,
} from 'lucide-react';

import type { UserWithProfile } from '@/app/admin/users/page';
import { ButtonV2 } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RoleBadge, type UserRole } from '@/components/ui/role-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { DeleteUserDialog } from './delete-user-dialog';
import { EditUserDialog } from './edit-user-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';

interface UserManagementTableProps {
  users: UserWithProfile[];
}

export function UserManagementTable({ users }: UserManagementTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(
    null
  );

  // Filtrer les utilisateurs selon les critères
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'all' || user.profile?.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatUserName = (email: string, user_metadata: any = null) => {
    // Essayer d'obtenir le nom depuis les métadonnées
    if (user_metadata?.name) {
      return user_metadata.name;
    }

    if (user_metadata?.first_name || user_metadata?.last_name) {
      return [user_metadata.first_name, user_metadata.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();
    }

    // Fallback : utiliser la partie avant @ comme nom temporaire
    const tempName = email.split('@')[0].split('.') || [''];
    return tempName.length > 1 ? tempName.join(' ') : tempName[0];
  };

  const getFirstName = (email: string, user_metadata: any = null) => {
    if (user_metadata?.first_name) return user_metadata.first_name;
    const tempName = email.split('@')[0].split('.') || [''];
    return tempName[0] || '';
  };

  const getLastName = (email: string, user_metadata: any = null) => {
    if (user_metadata?.last_name) return user_metadata.last_name;
    const tempName = email.split('@')[0].split('.') || [''];
    return tempName[1] || '';
  };

  const getJobTitle = (user_metadata: any = null) => {
    return user_metadata?.job_title || 'Non renseigné';
  };

  const handleViewUserDetails = (user: UserWithProfile) => {
    console.log('Navigation vers les détails utilisateur:', user.id); // Debug log
    router.push(`/admin/users/${user.id}`);
  };

  const handleEditUser = (user: UserWithProfile) => {
    setSelectedUser(user);
    setEditUserOpen(true);
  };

  const handleDeleteUser = (user: UserWithProfile) => {
    setSelectedUser(user);
    setDeleteUserOpen(true);
  };

  const handleResetPassword = (user: UserWithProfile) => {
    setSelectedUser(user);
    setResetPasswordOpen(true);
  };

  const handleUserUpdated = () => {
    // This will trigger a page refresh to show the updated data
    // In a real app, we might want to update the local state instead
    window.location.reload();
  };

  const handleUserDeleted = () => {
    // This will trigger a page refresh to show the updated data
    window.location.reload();
  };

  const handlePasswordReset = () => {
    // This will trigger a page refresh to show the updated data
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-500 focus:ring-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-offset-0"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48 bg-white border-neutral-300 text-neutral-900 focus:ring-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-offset-0">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent className="bg-white border-neutral-200">
            <SelectItem
              value="all"
              className="text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900"
            >
              Tous les rôles
            </SelectItem>
            <SelectItem
              value="owner"
              className="text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900"
            >
              Owner
            </SelectItem>
            <SelectItem
              value="admin"
              className="text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900"
            >
              Admin
            </SelectItem>
            <SelectItem
              value="catalog_manager"
              className="text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900"
            >
              Catalog Manager
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-200">
              <TableHead className="text-neutral-500 font-medium text-xs uppercase">
                Prénom
              </TableHead>
              <TableHead className="text-neutral-500 font-medium text-xs uppercase">
                Nom
              </TableHead>
              <TableHead className="text-neutral-500 font-medium text-xs uppercase">
                Rôle
              </TableHead>
              <TableHead className="text-neutral-500 font-medium text-xs uppercase">
                Poste
              </TableHead>
              <TableHead className="text-neutral-500 font-medium text-xs uppercase">
                Créé le
              </TableHead>
              <TableHead className="text-neutral-500 font-medium text-xs uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-neutral-500"
                >
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow
                  key={user.id}
                  className="border-neutral-200 hover:bg-neutral-50"
                >
                  {/* Prénom */}
                  <TableCell>
                    <div className="font-medium text-neutral-900">
                      {getFirstName(user.email, user.user_metadata)}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-neutral-500 mt-1">
                      <Mail className="h-2.5 w-2.5" />
                      <span>{user.email}</span>
                    </div>
                  </TableCell>

                  {/* Nom */}
                  <TableCell>
                    <div className="font-medium text-neutral-900">
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
                    <span
                      className={`text-sm ${getJobTitle(user.user_metadata) === 'Non renseigné' ? 'text-neutral-500' : 'text-neutral-900'}`}
                    >
                      {getJobTitle(user.user_metadata)}
                    </span>
                  </TableCell>

                  {/* Date de création */}
                  <TableCell>
                    <div className="flex items-center space-x-2 text-sm text-neutral-500">
                      <Calendar className="h-2.5 w-2.5" />
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
                      {!(
                        user.profile?.role === 'owner' &&
                        filteredUsers.filter(u => u.profile?.role === 'owner')
                          .length === 1
                      ) && (
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteUser(user)}
                          title="Supprimer utilisateur"
                          className="text-danger-500 hover:bg-danger-50 hover:text-danger-600"
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
      <div className="flex justify-between items-center text-xs text-neutral-500 pt-3 border-t border-neutral-200">
        <span>
          {filteredUsers.length} utilisateur
          {filteredUsers.length > 1 ? 's' : ''} affiché
          {filteredUsers.length > 1 ? 's' : ''}
          {searchTerm &&
            ` (filtré${filteredUsers.length > 1 ? 's' : ''} sur ${users.length})`}
        </span>

        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <Shield className="h-2.5 w-2.5" />
            <span>
              {users.filter(u => u.profile?.role === 'owner').length} Owner(s)
            </span>
          </span>
          <span className="flex items-center space-x-1">
            <Shield className="h-2.5 w-2.5" />
            <span>
              {users.filter(u => u.profile?.role === 'admin').length} Admin(s)
            </span>
          </span>
          <span className="flex items-center space-x-1">
            <Shield className="h-2.5 w-2.5" />
            <span>
              {users.filter(u => u.profile?.role === 'catalog_manager').length}{' '}
              Manager(s)
            </span>
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
  );
}
