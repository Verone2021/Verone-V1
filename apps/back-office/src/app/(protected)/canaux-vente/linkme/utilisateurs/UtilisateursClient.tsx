'use client';

import { useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import {
  Users,
  Plus,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';

import { RoleBadge, StatusBadge, StatCard, AccountRow } from './components';

import { LinkMeDeleteUserDialog } from '../components/LinkMeDeleteUserDialog';
import { LinkMeResetPasswordDialog } from '../components/LinkMeResetPasswordDialog';
import { UserCreateModal } from '../components/UserCreateModal';
import { UserEditModal } from '../components/UserEditModal';
import {
  useLinkMeUsers,
  useLinkMeUsersStats,
  type LinkMeUser,
  type LinkMeRole,
} from '../hooks/use-linkme-users';

/**
 * Page Gestion Comptes Utilisateurs LinkMe
 * Focus : authentification, rôles, suspension (pas le business)
 */
export default function UtilisateursClient() {
  const router = useRouter();
  const { data: users, isLoading, error } = useLinkMeUsers();
  const { data: stats } = useLinkMeUsersStats();

  // État filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<LinkMeRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  // État utilisateur sélectionné pour les dialogs
  const [selectedUser, setSelectedUser] = useState<LinkMeUser | null>(null);

  // États des dialogs (pattern admin/users)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);

  // Utilisateurs filtrés
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(user => {
      // Filtre recherche
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.first_name?.toLowerCase() ?? '').includes(searchLower) ||
        (user.last_name?.toLowerCase() ?? '').includes(searchLower) ||
        (user.enseigne_name?.toLowerCase() ?? '').includes(searchLower) ||
        (user.organisation_name?.toLowerCase() ?? '').includes(searchLower);

      // Filtre rôle
      const matchesRole =
        roleFilter === 'all' || user.linkme_role === roleFilter;

      // Filtre statut
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Handlers pour les actions (pattern admin/users)
  const handleViewUser = (user: LinkMeUser) => {
    router.push(`/canaux-vente/linkme/utilisateurs/${user.user_id}`);
  };

  const handleEditUser = (user: LinkMeUser) => {
    setSelectedUser(user);
    setEditUserOpen(true);
  };

  const handleResetPassword = (user: LinkMeUser) => {
    setSelectedUser(user);
    setResetPasswordOpen(true);
  };

  const handleDeleteUser = (user: LinkMeUser) => {
    setSelectedUser(user);
    setDeleteUserOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Erreur lors du chargement des comptes: {error.message}
      </div>
    );
  }

  // Stats calculées
  const activeCount = users?.filter(u => u.is_active).length ?? 0;
  const suspendedCount = users?.filter(u => !u.is_active).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Comptes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Authentification, rôles et suspension des utilisateurs LinkMe
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau compte
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Comptes"
          value={stats?.total ?? 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Comptes Actifs"
          value={activeCount}
          icon={UserCheck}
          color="bg-green-500"
        />
        <StatCard
          title="Comptes Archivés"
          value={suspendedCount}
          icon={UserX}
          color="bg-red-500"
        />
        <StatCard
          title="Rôles Uniques"
          value={Object.values(stats?.byRole ?? {}).filter(v => v > 0).length}
          icon={Shield}
          color="bg-purple-500"
        />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par email, nom..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtre Rôle */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={e =>
                setRoleFilter(e.target.value as LinkMeRole | 'all')
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les rôles</option>
              <option value="enseigne_admin">Enseigne</option>
              <option value="organisation_admin">Organisation</option>
            </select>
          </div>

          {/* Filtre Statut */}
          <select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Archivés</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun compte trouvé</p>
            {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800"
              >
                Créer le premier compte
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email / Identité
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entité
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <AccountRow
                    key={user.user_id}
                    user={user}
                    onView={handleViewUser}
                    onEdit={handleEditUser}
                    onResetPassword={handleResetPassword}
                    onDelete={handleDeleteUser}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Résumé */}
      {filteredUsers.length > 0 && (
        <p className="text-sm text-gray-500">
          Affichage de {filteredUsers.length} compte
          {filteredUsers.length > 1 ? 's' : ''} sur {users?.length ?? 0}
        </p>
      )}

      {/* Modal Création */}
      {showCreateModal && (
        <UserCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Dialog Modifier Profil */}
      {editUserOpen && selectedUser && (
        <UserEditModal
          isOpen={editUserOpen}
          user={selectedUser}
          onClose={() => {
            setEditUserOpen(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Dialog Reset Password */}
      <LinkMeResetPasswordDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        user={selectedUser}
        onPasswordReset={() => {
          setResetPasswordOpen(false);
          setSelectedUser(null);
        }}
      />

      {/* Dialog Supprimer */}
      <LinkMeDeleteUserDialog
        open={deleteUserOpen}
        onOpenChange={setDeleteUserOpen}
        user={selectedUser}
        onUserDeleted={() => {
          setDeleteUserOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
