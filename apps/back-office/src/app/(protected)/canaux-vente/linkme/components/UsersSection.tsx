'use client';

import { useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { Users, Plus, Search, Filter, Building2, Store } from 'lucide-react';

import { UserCreateModal } from './UserCreateModal';
import { UserEditModal } from './UserEditModal';
import {
  useLinkMeUsers,
  useLinkMeUsersStats,
  useToggleLinkMeUserActive,
  type LinkMeUser,
  type LinkMeRole,
} from '../hooks/use-linkme-users';
import {
  RoleBadge,
  StatusBadge,
  StatCard,
  UserRow,
} from './UsersSectionComponents';

/**
 * Section Utilisateurs LinkMe
 */
export function UsersSection() {
  const router = useRouter();
  const { data: users, isLoading, error } = useLinkMeUsers();
  const { data: stats } = useLinkMeUsersStats();
  const toggleActive = useToggleLinkMeUserActive();

  // État filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<LinkMeRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  // Modal création
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Modal edit (compte uniquement : email/password)
  const [selectedUser, setSelectedUser] = useState<LinkMeUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleToggleActive = (userId: string, isActive: boolean) => {
    toggleActive.mutate({ userId, isActive });
  };

  const handleEdit = (user: LinkMeUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleNavigate = (userId: string) => {
    router.push(`/canaux-vente/linkme/utilisateurs/${userId}`);
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
        Erreur lors du chargement des utilisateurs: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Utilisateurs LinkMe
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestion des utilisateurs et de leurs rôles sur la plateforme
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Utilisateurs"
          value={stats?.total ?? 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Admins Enseigne"
          value={stats?.byRole.enseigne_admin ?? 0}
          icon={Building2}
          color="bg-purple-500"
        />
        <StatCard
          title="Collaborateurs"
          value={stats?.byRole.enseigne_collaborateur ?? 0}
          icon={Users}
          color="bg-teal-500"
        />
        <StatCard
          title="Admins Organisation"
          value={stats?.byRole.organisation_admin ?? 0}
          icon={Store}
          color="bg-indigo-500"
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
              placeholder="Rechercher par nom, email, enseigne..."
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
              <option value="enseigne_admin">Admin Enseigne</option>
              <option value="enseigne_collaborateur">Collaborateur</option>
              <option value="organisation_admin">Admin Organisation</option>
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
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
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
                Créer le premier utilisateur
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enseigne / Organisation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
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
                  <UserRow
                    key={user.user_id}
                    user={user}
                    onToggleActive={handleToggleActive}
                    onEdit={handleEdit}
                    onNavigate={handleNavigate}
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
          Affichage de {filteredUsers.length} utilisateur
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

      {/* Modal Modifier Compte (email/password) */}
      {isEditModalOpen && selectedUser && (
        <UserEditModal
          isOpen={isEditModalOpen}
          user={selectedUser}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
