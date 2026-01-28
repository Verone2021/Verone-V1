'use client';

import { useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { cn } from '@verone/utils';
import {
  Users,
  Plus,
  Search,
  Filter,
  Building2,
  Store,
  ShoppingCart,
  Briefcase,
  Mail,
  Phone,
  Check,
  X,
  Eye,
  Pencil,
  UserX,
  UserCheck,
} from 'lucide-react';

import { UserCreateModal } from './UserCreateModal';
import { UserEditModal } from './UserEditModal';
import {
  useLinkMeUsers,
  useLinkMeUsersStats,
  useToggleLinkMeUserActive,
  type LinkMeUser,
  type LinkMeRole,
  LINKME_ROLE_LABELS,
  LINKME_ROLE_COLORS,
} from '../hooks/use-linkme-users';

/**
 * Badge Rôle avec couleur
 */
function RoleBadge({ role }: { role: LinkMeRole }) {
  const Icon =
    role === 'enseigne_admin'
      ? Building2
      : role === 'organisation_admin'
        ? Store
        : role === 'org_independante'
          ? Briefcase
          : ShoppingCart;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        LINKME_ROLE_COLORS[role]
      )}
    >
      <Icon className="h-3 w-3" />
      {LINKME_ROLE_LABELS[role]}
    </span>
  );
}

/**
 * Badge Statut
 */
function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <Check className="h-3 w-3" />
      Actif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      <X className="h-3 w-3" />
      Inactif
    </span>
  );
}

/**
 * KPI Card
 */
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={cn('p-3 rounded-full', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

/**
 * Ligne utilisateur
 */
function UserRow({
  user,
  onToggleActive,
  onEdit,
  onNavigate,
}: {
  user: LinkMeUser;
  onToggleActive: (userId: string, isActive: boolean) => void;
  onEdit: (user: LinkMeUser) => void;
  onNavigate: (userId: string) => void;
}) {
  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Sans nom';
  const initials =
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
    '?';

  return (
    <tr
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onNavigate(user.user_id)}
    >
      {/* Avatar + Nom */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={fullName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
              {initials}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{fullName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Rôle */}
      <td className="px-4 py-3">
        <RoleBadge role={user.linkme_role} />
      </td>

      {/* Enseigne/Organisation */}
      <td className="px-4 py-3">
        {user.enseigne_name && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{user.enseigne_name}</span>
          </div>
        )}
        {user.organisation_name && (
          <div className="flex items-center gap-2 mt-1">
            <Store className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {user.organisation_name}
            </span>
          </div>
        )}
        {!user.enseigne_name && !user.organisation_name && (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>

      {/* Contact */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate max-w-[150px]">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-3.5 w-3.5" />
              <span>{user.phone}</span>
            </div>
          )}
        </div>
      </td>

      {/* Statut */}
      <td className="px-4 py-3">
        <StatusBadge isActive={user.is_active} />
      </td>

      {/* Actions - Boutons visibles */}
      <td className="px-4 py-3 text-right">
        <div
          className="flex items-center justify-end gap-1"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => onNavigate(user.user_id)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Voir détails"
          >
            <Eye className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Modifier compte"
          >
            <Pencil className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={() => onToggleActive(user.user_id, !user.is_active)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title={user.is_active ? 'Désactiver' : 'Activer'}
          >
            {user.is_active ? (
              <UserX className="h-4 w-4 text-orange-500" />
            ) : (
              <UserCheck className="h-4 w-4 text-green-500" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

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
          value={stats?.total || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Admins Enseigne"
          value={stats?.byRole.enseigne_admin || 0}
          icon={Building2}
          color="bg-purple-500"
        />
        <StatCard
          title="Admins Organisation"
          value={stats?.byRole.organisation_admin || 0}
          icon={Store}
          color="bg-indigo-500"
        />
        <StatCard
          title="Clients"
          value={stats?.byRole.client || 0}
          icon={ShoppingCart}
          color="bg-green-500"
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
              <option value="organisation_admin">Admin Organisation</option>
              <option value="client">Client</option>
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
          {filteredUsers.length > 1 ? 's' : ''} sur {users?.length || 0}
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
