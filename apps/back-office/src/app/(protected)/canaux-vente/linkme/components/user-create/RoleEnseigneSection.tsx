'use client';

import { cn } from '@verone/utils';
import { Building2, Store, Users, Check, AlertCircle } from 'lucide-react';

import type { LinkMeRole } from '../../hooks/use-linkme-users';
import {
  LINKME_ROLE_LABELS,
  LINKME_ROLE_PERMISSIONS,
} from '../../hooks/use-linkme-users';

interface EnseigneOption {
  id: string;
  name: string;
}
interface OrgOption {
  id: string;
  name: string;
}

interface RoleEnseigneSectionProps {
  role: LinkMeRole;
  enseigneId: string;
  organisationId: string;
  enseignes?: EnseigneOption[];
  organisations?: OrgOption[];
  errors: Record<string, string>;
  onRoleChange: (r: LinkMeRole) => void;
  onEnseigneChange: (id: string) => void;
  onOrganisationChange: (id: string) => void;
}

export function RoleEnseigneSection({
  role,
  enseigneId,
  organisationId,
  enseignes,
  organisations,
  errors,
  onRoleChange,
  onEnseigneChange,
  onOrganisationChange,
}: RoleEnseigneSectionProps) {
  const roles: LinkMeRole[] = [
    'enseigne_admin',
    'enseigne_collaborateur',
    'organisation_admin',
  ];

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {roles.map(r => {
            const Icon =
              r === 'enseigne_admin'
                ? Building2
                : r === 'enseigne_collaborateur'
                  ? Users
                  : Store;
            const isSelected = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onRoleChange(r)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isSelected ? 'text-blue-600' : 'text-gray-400'
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium text-center',
                    isSelected ? 'text-blue-700' : 'text-gray-600'
                  )}
                >
                  {LINKME_ROLE_LABELS[r]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">
            Permissions :
          </p>
          <ul className="space-y-1">
            {LINKME_ROLE_PERMISSIONS[role].map((perm, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs text-gray-600"
              >
                <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                {perm}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(role === 'enseigne_admin' || role === 'enseigne_collaborateur') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enseigne *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={enseigneId}
              onChange={e => onEnseigneChange(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 appearance-none',
                errors.enseigneId
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              )}
            >
              <option value="">Selectionner une enseigne</option>
              {enseignes?.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          {errors.enseigneId && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.enseigneId}
            </p>
          )}
        </div>
      )}

      {role === 'organisation_admin' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organisation *
          </label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={organisationId}
              onChange={e => onOrganisationChange(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 appearance-none',
                errors.organisationId
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              )}
            >
              <option value="">Selectionner une organisation</option>
              {organisations?.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          {errors.organisationId && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.organisationId}
            </p>
          )}
        </div>
      )}
    </>
  );
}
