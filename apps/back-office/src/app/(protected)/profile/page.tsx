'use client';

import React, { useEffect, useState } from 'react';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ButtonUnified } from '@verone/ui';
import { Input } from '@verone/ui';
import { RoleBadge, type UserRole } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  validateProfileForm,
  sanitizeProfileData,
} from '@verone/utils/validation/profile-validation';
import {
  User,
  Mail,
  Shield,
  Building,
  Edit,
  Save,
  X,
  Phone,
  Briefcase,
} from 'lucide-react';

import { PasswordChangeDialog } from '@/components/profile/password-change-dialog';

interface UserProfile {
  user_id: string;
  role: string;
  scopes: string[];
  partner_id: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  job_title?: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [editData, setEditData] = useState({
    email: '',
    raw_user_meta_data: { name: '' },
    first_name: '',
    last_name: '',
    phone: '',
    job_title: '',
  });

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return;
      }

      setUser(user);

      // Initialize edit data
      setEditData({
        email: user.email ?? '',
        raw_user_meta_data: {
          name: (user.user_metadata?.name ?? user.email?.split('@')[0]) ?? '',
        },
        first_name: '',
        last_name: '',
        phone: '',
        job_title: '',
      });

      // Get user profile with extended fields
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData as any);
        // Update edit data with profile info
        setEditData(prevData => ({
          ...prevData,
          first_name: profileData.first_name ?? '',
          last_name: profileData.last_name ?? '',
          phone: profileData.phone ?? '',
          job_title: profileData.job_title ?? '',
        }));
      }

      setLoading(false);
    };

    void loadUserData().catch(error => {
      console.error('[ProfilePage] useEffect loadUserData failed:', error);
    });
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;

    // Validation des données
    const validationResult = validateProfileForm({
      displayName: editData.raw_user_meta_data.name,
      firstName: editData.first_name,
      lastName: editData.last_name,
      phone: editData.phone,
      jobTitle: editData.job_title,
    });

    if (!validationResult.isValid) {
      setValidationErrors(validationResult.errors);
      return;
    }

    setValidationErrors({});

    try {
      setSaveLoading(true);
      const supabase = createClient();

      // Update auth user metadata (for display name)
      const { error: updateError } = await supabase.auth.updateUser({
        data: editData.raw_user_meta_data,
      });

      if (updateError) {
        console.error('Error updating auth metadata:', updateError);
        return;
      }

      // Update user profile with validated and sanitized data
      const sanitizedData = sanitizeProfileData(validationResult.formatted);
      console.warn('🔍 Diagnostic profile update:', {
        user_id: user.id,
        sanitizedData,
        originalFormData: validationResult.formatted,
      });

      // Vérifier si le profil existe avant update
      const { data: _existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        console.error('❌ Erreur vérification profil existant:', checkError);
        console.warn('Profil inexistant - tentative de création');

        // Profil n'existe pas, le créer
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            ...sanitizedData,
          } as any);

        if (createError) {
          console.error('❌ Erreur création profil:', {
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
            code: createError.code,
          });
          return;
        }
        console.warn('✅ Profil créé avec succès');
      } else {
        console.warn('✅ Profil existant trouvé, tentative update');

        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(sanitizedData)
          .eq('user_id', user.id);

        if (profileError) {
          console.error('❌ Erreur update profil détaillée:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
            errorObject: profileError,
          });
          return;
        }
        console.warn('✅ Profil mis à jour avec succès');
      }

      // Refresh user data
      const {
        data: { user: updatedUser },
        error: userError,
      } = await supabase.auth.getUser();
      if (!userError && updatedUser) {
        setUser(updatedUser);
      }

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (updatedProfile) {
        setProfile(updatedProfile as any);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaveLoading(false);
    }
  };

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
      {/* Page header */}
      <div className="-mx-4 -mt-4 mb-4 bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <User className="h-5 w-5 text-neutral-900" />
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg font-bold text-neutral-900">
                  Mon Profil
                </h1>
                {profile && <RoleBadge role={profile.role as UserRole} />}
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
                  onClick={() => {
                    void handleSaveProfile().catch(error => {
                      console.error(
                        '[ProfilePage] handleSaveProfile failed:',
                        error
                      );
                    });
                  }}
                  disabled={saveLoading}
                  loading={saveLoading}
                  variant="success"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saveLoading ? 'Sauvegarde...' : 'Enregistrer'}
                </ButtonUnified>
                <ButtonUnified
                  onClick={() => setIsEditing(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </ButtonUnified>
              </>
            ) : (
              <ButtonUnified
                onClick={() => setIsEditing(true)}
                variant="secondary"
                size="sm"
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </ButtonUnified>
            )}
          </div>
        </div>
      </div>

      {/* Profile information */}
      <div className="max-w-lg">
        <div className="rounded-xl space-y-4 bg-white border border-neutral-300 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900">
            Informations personnelles
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {/* Nom d'affichage */}
            <div className="flex items-center space-x-2.5">
              <User className="h-3.5 w-3.5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-[11px] mb-1 text-neutral-600">
                  Nom d'affichage
                </p>
                {isEditing ? (
                  <Input
                    value={editData.raw_user_meta_data.name}
                    onChange={e =>
                      setEditData({
                        ...editData,
                        raw_user_meta_data: {
                          ...editData.raw_user_meta_data,
                          name: e.target.value,
                        },
                      })
                    }
                    placeholder="Nom d'affichage"
                    className="border-neutral-300"
                  />
                ) : (
                  <p className="font-medium text-xs text-neutral-900">
                    {user?.user_metadata?.name ??
                      user?.email?.split('@')[0] ??
                      'Non défini'}
                  </p>
                )}
                {validationErrors.displayName && (
                  <p className="text-xs mt-1 text-danger-500">
                    {validationErrors.displayName}
                  </p>
                )}
              </div>
            </div>

            {/* Prénom */}
            <div className="flex items-center space-x-2.5">
              <User className="h-3.5 w-3.5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-[11px] mb-1 text-neutral-600">
                  Prénom <span className="text-[11px]">(optionnel)</span>
                </p>
                {isEditing ? (
                  <Input
                    value={editData.first_name}
                    onChange={e =>
                      setEditData({
                        ...editData,
                        first_name: e.target.value,
                      })
                    }
                    placeholder="Votre prénom"
                    maxLength={50}
                    className="border-neutral-300"
                  />
                ) : (
                  <p className="font-medium text-xs text-neutral-900">
                    {profile?.first_name || 'Non renseigné'}
                  </p>
                )}
                {validationErrors.firstName && (
                  <p className="text-xs mt-1 text-danger-500">
                    {validationErrors.firstName}
                  </p>
                )}
              </div>
            </div>

            {/* Nom de famille */}
            <div className="flex items-center space-x-2.5">
              <User className="h-3.5 w-3.5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-[11px] mb-1 text-neutral-600">
                  Nom de famille{' '}
                  <span className="text-[11px]">(optionnel)</span>
                </p>
                {isEditing ? (
                  <Input
                    value={editData.last_name}
                    onChange={e =>
                      setEditData({
                        ...editData,
                        last_name: e.target.value,
                      })
                    }
                    placeholder="Votre nom de famille"
                    maxLength={50}
                    className="border-neutral-300"
                  />
                ) : (
                  <p className="font-medium text-xs text-neutral-900">
                    {profile?.last_name || 'Non renseigné'}
                  </p>
                )}
                {validationErrors.lastName && (
                  <p className="text-xs mt-1 text-danger-500">
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Téléphone */}
            <div className="flex items-center space-x-2.5">
              <Phone className="h-3.5 w-3.5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-[11px] mb-1 text-neutral-600">
                  Téléphone <span className="text-[11px]">(optionnel)</span>
                </p>
                {isEditing ? (
                  <Input
                    value={editData.phone}
                    onChange={e =>
                      setEditData({
                        ...editData,
                        phone: e.target.value,
                      })
                    }
                    placeholder="0X XX XX XX XX ou +33 X XX XX XX XX"
                    type="tel"
                    className="border-neutral-300"
                  />
                ) : (
                  <p className="font-medium text-xs text-neutral-900">
                    {profile?.phone ?? 'Non renseigné'}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs mt-1 text-neutral-500">
                    Format français accepté : 0123456789 ou +33123456789
                  </p>
                )}
                {validationErrors.phone && (
                  <p className="text-xs mt-1 text-danger-500">
                    {validationErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Intitulé de poste */}
            <div className="flex items-center space-x-2.5">
              <Briefcase className="h-3.5 w-3.5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-[11px] mb-1 text-neutral-600">
                  Intitulé de poste{' '}
                  <span className="text-[11px]">(optionnel)</span>
                </p>
                {isEditing ? (
                  <Input
                    value={editData.job_title}
                    onChange={e =>
                      setEditData({
                        ...editData,
                        job_title: e.target.value,
                      })
                    }
                    placeholder="Votre fonction/poste"
                    maxLength={100}
                    className="border-neutral-300"
                  />
                ) : (
                  <p className="font-medium text-xs text-neutral-900">
                    {profile?.job_title || 'Non renseigné'}
                  </p>
                )}
                {validationErrors.jobTitle && (
                  <p className="text-xs mt-1 text-danger-500">
                    {validationErrors.jobTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-2.5">
              <Mail className="h-3.5 w-3.5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-[11px] text-neutral-600">Email</p>
                <p className="font-medium text-xs text-neutral-900">
                  {user?.email}
                </p>
                {isEditing && (
                  <p className="text-xs mt-1 text-neutral-500">
                    L'email ne peut pas être modifié depuis cette interface
                  </p>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center space-x-2.5">
              <Shield className="h-3.5 w-3.5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-[11px] mb-2 text-neutral-600">
                  Rôle et permissions
                </p>
                {profile && (
                  <RoleBadge role={profile.role as UserRole} className="mb-2" />
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

          {/* Additional Actions */}
          <div className="pt-4 border-t border-neutral-300">
            <div className="flex space-x-2">
              <ButtonUnified
                variant="secondary"
                size="sm"
                onClick={() => setShowPasswordDialog(true)}
              >
                Changer le mot de passe
              </ButtonUnified>
              {profile?.role === 'owner' && (
                <ButtonUnified variant="secondary" size="sm">
                  Paramètres système
                </ButtonUnified>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <PasswordChangeDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />
    </div>
  );
}
