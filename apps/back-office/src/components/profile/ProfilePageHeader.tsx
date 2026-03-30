'use client';

import { ButtonUnified, RoleBadge, type UserRole } from '@verone/ui';
import { User, Edit, Save, X } from 'lucide-react';

interface ProfilePageHeaderProps {
  userRole: string | null;
  isEditing: boolean;
  saveLoading: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ProfilePageHeader({
  userRole,
  isEditing,
  saveLoading,
  onEdit,
  onSave,
  onCancel,
}: ProfilePageHeaderProps) {
  return (
    <div className="-mx-4 -mt-4 mb-4 bg-white border-b border-neutral-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <User className="h-5 w-5 text-neutral-900" />
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-bold text-neutral-900">Mon Profil</h1>
              {userRole && <RoleBadge role={userRole as UserRole} />}
            </div>
            <p className="text-sm text-neutral-600">
              Informations de votre compte Vérone
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <ButtonUnified
                onClick={onSave}
                disabled={saveLoading}
                loading={saveLoading}
                variant="success"
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {saveLoading ? 'Sauvegarde...' : 'Enregistrer'}
              </ButtonUnified>
              <ButtonUnified onClick={onCancel} variant="ghost" size="sm">
                <X className="h-4 w-4 mr-1" />
                Annuler
              </ButtonUnified>
            </>
          ) : (
            <ButtonUnified onClick={onEdit} variant="secondary" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </ButtonUnified>
          )}
        </div>
      </div>
    </div>
  );
}
