'use client';

import Image from 'next/image';

import { cn } from '@verone/utils';
import {
  Building2,
  Store,
  Check,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  Key,
  Trash2,
  Archive,
} from 'lucide-react';

import type { LinkMeUser, LinkMeRole } from '../hooks/use-linkme-users';
import {
  LINKME_ROLE_LABELS,
  LINKME_ROLE_COLORS,
} from '../hooks/use-linkme-users';

// Suppress unused import warnings
void UserX;
void UserCheck;

export function RoleBadge({ role }: { role: LinkMeRole }) {
  const Icon = role === 'enseigne_admin' ? Building2 : Store;
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

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <Check className="h-3 w-3" />
      Actif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
      <Archive className="h-3 w-3" />
      Archive
    </span>
  );
}

export function StatCard({
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

export function AccountRow({
  user,
  onView,
  onEdit,
  onResetPassword,
  onDelete,
}: {
  user: LinkMeUser;
  onView: (user: LinkMeUser) => void;
  onEdit: (user: LinkMeUser) => void;
  onResetPassword: (user: LinkMeUser) => void;
  onDelete: (user: LinkMeUser) => void;
}) {
  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Sans nom';
  const initials =
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
    '?';
  const isArchived = !user.is_active;

  return (
    <tr
      className={cn(
        'hover:bg-gray-50 transition-colors cursor-pointer',
        isArchived && 'opacity-50'
      )}
      onClick={() => onView(user)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={fullName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
              {initials}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{user.email}</p>
            <p className="text-sm text-gray-500">{fullName}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.linkme_role} />
      </td>
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
      <td className="px-4 py-3">
        <StatusBadge isActive={user.is_active} />
      </td>
      <td className="px-4 py-3 text-right">
        <div
          className="flex items-center justify-end gap-1"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => onView(user)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Voir details"
          >
            <Eye className="h-4 w-4 text-gray-500" />
          </button>
          {!isArchived && (
            <button
              onClick={() => onEdit(user)}
              className="p-1.5 rounded hover:bg-blue-100 transition-colors"
              title="Modifier profil"
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </button>
          )}
          {!isArchived && (
            <button
              onClick={() => onResetPassword(user)}
              className="p-1.5 rounded hover:bg-orange-100 transition-colors"
              title="Reinitialiser mot de passe"
            >
              <Key className="h-4 w-4 text-orange-500" />
            </button>
          )}
          <button
            onClick={() => onDelete(user)}
            className={cn(
              'p-1.5 rounded transition-colors',
              isArchived ? 'hover:bg-red-100' : 'hover:bg-orange-100'
            )}
            title={isArchived ? 'Supprimer definitivement' : 'Archiver'}
          >
            {isArchived ? (
              <Trash2 className="h-4 w-4 text-red-500" />
            ) : (
              <Archive className="h-4 w-4 text-orange-500" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
