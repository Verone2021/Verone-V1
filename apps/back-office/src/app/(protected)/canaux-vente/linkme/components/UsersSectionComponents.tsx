'use client';

import Image from 'next/image';

import { cn } from '@verone/utils';
import {
  Building2,
  Store,
  Users,
  Mail,
  Phone,
  Check,
  X,
  Eye,
  Pencil,
  UserX,
  UserCheck,
} from 'lucide-react';

import type { LinkMeUser, LinkMeRole } from '../hooks/use-linkme-users';
import {
  LINKME_ROLE_LABELS,
  LINKME_ROLE_COLORS,
} from '../hooks/use-linkme-users';

export function RoleBadge({ role }: { role: LinkMeRole }) {
  const Icon =
    role === 'enseigne_admin'
      ? Building2
      : role === 'enseigne_collaborateur'
        ? Users
        : Store;
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      <X className="h-3 w-3" />
      Inactif
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

export function UserRow({
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
            <p className="font-medium text-gray-900">{fullName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
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
      <td className="px-4 py-3">
        <StatusBadge isActive={user.is_active} />
      </td>
      <td className="px-4 py-3 text-right">
        <div
          className="flex items-center justify-end gap-1"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => onNavigate(user.user_id)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Voir details"
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
            title={user.is_active ? 'Desactiver' : 'Activer'}
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
