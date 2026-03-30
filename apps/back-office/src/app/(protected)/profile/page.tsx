'use client';

import { useState } from 'react';

import { ButtonUnified } from '@verone/ui';

import { PasswordChangeDialog } from '@/components/profile/password-change-dialog';
import { ProfileFormFields } from '@/components/profile/ProfileFormFields';
import { ProfilePageHeader } from '@/components/profile/ProfilePageHeader';
import { useProfileLoad } from '@/components/profile/useProfileLoad';
import { useProfileSave } from '@/components/profile/useProfileSave';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const {
    user,
    profile,
    userRole,
    loading,
    editData,
    setUser,
    setProfile,
    setEditData,
  } = useProfileLoad();

  const { saveLoading, validationErrors, handleSaveProfile } = useProfileSave({
    user,
    editData,
    setUser,
    setProfile,
    setIsEditing,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-3" />
          <p className="text-neutral-600 text-sm">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <ProfilePageHeader
        userRole={userRole}
        isEditing={isEditing}
        saveLoading={saveLoading}
        onEdit={() => setIsEditing(true)}
        onSave={() => {
          void handleSaveProfile().catch(error => {
            console.error('[ProfilePage] handleSaveProfile failed:', error);
          });
        }}
        onCancel={() => setIsEditing(false)}
      />

      <div className="max-w-lg">
        <div className="rounded-xl space-y-4 bg-white border border-neutral-300 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900">
            Informations personnelles
          </h2>

          <ProfileFormFields
            user={user}
            profile={profile}
            userRole={userRole}
            isEditing={isEditing}
            editData={editData}
            validationErrors={validationErrors}
            onEditDataChange={setEditData}
          />

          <div className="pt-4 border-t border-neutral-300">
            <div className="flex space-x-2">
              <ButtonUnified
                variant="secondary"
                size="sm"
                onClick={() => setShowPasswordDialog(true)}
              >
                Changer le mot de passe
              </ButtonUnified>
              {userRole === 'owner' && (
                <ButtonUnified variant="secondary" size="sm">
                  Paramètres système
                </ButtonUnified>
              )}
            </div>
          </div>
        </div>
      </div>

      <PasswordChangeDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />
    </div>
  );
}
