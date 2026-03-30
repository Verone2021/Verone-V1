'use client';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { RoleBadge, type UserRole } from '@verone/ui';
import { User, Mail, Shield, Building, Phone, Briefcase } from 'lucide-react';

import { ProfileFieldRow } from '@/components/profile/ProfileFieldRow';

interface UserProfile {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  job_title?: string | null;
}

interface EditData {
  email: string;
  raw_user_meta_data: { name: string };
  first_name: string;
  last_name: string;
  phone: string;
  job_title: string;
}

interface ProfileFormFieldsProps {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  userRole: string | null;
  isEditing: boolean;
  editData: EditData;
  validationErrors: Record<string, string>;
  onEditDataChange: (data: EditData) => void;
}

export function ProfileFormFields({
  user,
  profile,
  userRole,
  isEditing,
  editData,
  validationErrors,
  onEditDataChange,
}: ProfileFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Nom d'affichage */}
      <ProfileFieldRow
        icon={User}
        label="Nom d'affichage"
        displayValue={
          (user?.user_metadata?.name as string | undefined) ??
          user?.email?.split('@')[0] ??
          'Non défini'
        }
        isEditing={isEditing}
        inputProps={{
          value: editData.raw_user_meta_data.name,
          onChange: e =>
            onEditDataChange({
              ...editData,
              raw_user_meta_data: {
                ...editData.raw_user_meta_data,
                name: e.target.value,
              },
            }),
          placeholder: "Nom d'affichage",
        }}
        error={validationErrors.displayName}
      />

      {/* Prénom */}
      <ProfileFieldRow
        icon={User}
        label={
          <>
            Prénom <span className="text-[11px]">(optionnel)</span>
          </>
        }
        displayValue={profile?.first_name ?? 'Non renseigné'}
        isEditing={isEditing}
        inputProps={{
          value: editData.first_name,
          onChange: e =>
            onEditDataChange({ ...editData, first_name: e.target.value }),
          placeholder: 'Votre prénom',
          maxLength: 50,
        }}
        error={validationErrors.firstName}
      />

      {/* Nom de famille */}
      <ProfileFieldRow
        icon={User}
        label={
          <>
            Nom de famille <span className="text-[11px]">(optionnel)</span>
          </>
        }
        displayValue={profile?.last_name ?? 'Non renseigné'}
        isEditing={isEditing}
        inputProps={{
          value: editData.last_name,
          onChange: e =>
            onEditDataChange({ ...editData, last_name: e.target.value }),
          placeholder: 'Votre nom de famille',
          maxLength: 50,
        }}
        error={validationErrors.lastName}
      />

      {/* Téléphone */}
      <ProfileFieldRow
        icon={Phone}
        label={
          <>
            Téléphone <span className="text-[11px]">(optionnel)</span>
          </>
        }
        displayValue={profile?.phone ?? 'Non renseigné'}
        isEditing={isEditing}
        inputProps={{
          value: editData.phone,
          onChange: e =>
            onEditDataChange({ ...editData, phone: e.target.value }),
          placeholder: '0X XX XX XX XX ou +33 X XX XX XX XX',
          type: 'tel',
        }}
        hint="Format français accepté : 0123456789 ou +33123456789"
        error={validationErrors.phone}
      />

      {/* Intitulé de poste */}
      <ProfileFieldRow
        icon={Briefcase}
        label={
          <>
            Intitulé de poste <span className="text-[11px]">(optionnel)</span>
          </>
        }
        displayValue={profile?.job_title ?? 'Non renseigné'}
        isEditing={isEditing}
        inputProps={{
          value: editData.job_title,
          onChange: e =>
            onEditDataChange({ ...editData, job_title: e.target.value }),
          placeholder: 'Votre fonction/poste',
          maxLength: 100,
        }}
        error={validationErrors.jobTitle}
      />

      {/* Email (read-only) */}
      <ProfileFieldRow
        icon={Mail}
        label="Email"
        displayValue={user?.email ?? ''}
        isEditing={isEditing}
        readOnly
        hint="L'email ne peut pas être modifié depuis cette interface"
      />

      {/* Rôle */}
      <div className="flex items-center space-x-2.5">
        <Shield className="h-3.5 w-3.5 text-neutral-400" />
        <div className="flex-1">
          <p className="text-[11px] mb-2 text-neutral-600">
            Rôle et permissions
          </p>
          {userRole && (
            <RoleBadge role={userRole as UserRole} className="mb-2" />
          )}
        </div>
      </div>

      {/* Organisation */}
      <div className="flex items-center space-x-2.5">
        <Building className="h-3.5 w-3.5 text-neutral-400" />
        <div>
          <p className="text-[11px] text-neutral-600">Organisation</p>
          <p className="font-medium text-xs text-neutral-900">Vérone</p>
        </div>
      </div>

      {/* User ID */}
      <div className="flex items-center space-x-2.5">
        <User className="h-3.5 w-3.5 text-neutral-400" />
        <div>
          <p className="text-[11px] text-neutral-600">ID Utilisateur</p>
          <p className="font-medium font-mono text-[11px] text-neutral-900">
            {user?.id}
          </p>
        </div>
      </div>
    </div>
  );
}
