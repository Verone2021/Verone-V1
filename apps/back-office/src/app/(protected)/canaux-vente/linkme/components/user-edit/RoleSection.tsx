'use client';

import { Combobox } from '@verone/ui';
import { cn } from '@verone/utils';
import { Building2, Users, Store, Check } from 'lucide-react';

import {
  LINKME_ROLE_LABELS,
  LINKME_ROLE_PERMISSIONS,
  type LinkMeRole,
} from '../../hooks/use-linkme-users';

interface EnseigneOption {
  id: string;
  name: string;
}
interface OrgOption {
  id: string;
  name: string;
}

interface RoleSectionProps {
  role: LinkMeRole;
  enseigneId: string;
  organisationId: string;
  isActive: boolean;
  enseignes?: EnseigneOption[];
  organisations?: OrgOption[];
  errors: Record<string, string>;
  onRoleChange: (r: LinkMeRole) => void;
  onEnseigneChange: (id: string) => void;
  onOrganisationChange: (id: string) => void;
  onActiveChange: (v: boolean) => void;
}

export function RoleSection({
  role,
  enseigneId,
  organisationId,
  isActive,
  enseignes,
  organisations,
  errors,
  onRoleChange,
  onEnseigneChange,
  onOrganisationChange,
  onActiveChange,
}: RoleSectionProps) {
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

      {(role === 'enseigne_admin' ||
        role === 'enseigne_collaborateur' ||
        role === 'organisation_admin') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              Enseigne{' '}
              {role === 'enseigne_admin' || role === 'enseigne_collaborateur'
                ? '*'
                : ''}
            </div>
          </label>
          <Combobox
            options={
              enseignes?.map(e => ({ value: e.id, label: e.name })) ?? []
            }
            value={enseigneId}
            onValueChange={value => {
              onEnseigneChange(value);
              onOrganisationChange('');
            }}
            placeholder="Selectionner une enseigne"
            searchPlaceholder="Rechercher une enseigne..."
            emptyMessage="Aucune enseigne trouvee"
            variant={errors.enseigneId ? 'error' : 'default'}
            error={errors.enseigneId}
          />
        </div>
      )}

      {role === 'organisation_admin' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-gray-400" />
              Organisation *
            </div>
          </label>
          <Combobox
            options={
              organisations?.map(o => ({ value: o.id, label: o.name })) ?? []
            }
            value={organisationId}
            onValueChange={onOrganisationChange}
            placeholder="Selectionner une organisation"
            searchPlaceholder="Rechercher une organisation..."
            emptyMessage="Aucune organisation trouvee"
            variant={errors.organisationId ? 'error' : 'default'}
            error={errors.organisationId}
          />
        </div>
      )}

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => onActiveChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Utilisateur actif
          </span>
        </label>
        <p className="mt-1 text-xs text-gray-500 ml-7">
          Un utilisateur inactif ne peut pas se connecter
        </p>
      </div>
    </>
  );
}
