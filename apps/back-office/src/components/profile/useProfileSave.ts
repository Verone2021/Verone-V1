'use client';

import { useState } from 'react';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';
import {
  validateProfileForm,
  sanitizeProfileData,
} from '@verone/utils/validation/profile-validation';

interface EditData {
  email: string;
  raw_user_meta_data: { name: string };
  first_name: string;
  last_name: string;
  phone: string;
  job_title: string;
}

interface UserProfile {
  user_id: string;
  scopes: never[];
  partner_id: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  job_title?: string | null;
  created_at: string;
  updated_at: string;
  app_source?: string | null;
  avatar_url?: string | null;
  client_type?: string | null;
  email?: string | null;
  user_type?: string | null;
}

interface UseProfileSaveOptions {
  user: SupabaseUser | null;
  editData: EditData;
  setUser: (user: SupabaseUser) => void;
  setProfile: (profile: UserProfile) => void;
  setIsEditing: (editing: boolean) => void;
}

export function useProfileSave({
  user,
  editData,
  setUser,
  setProfile,
  setIsEditing,
}: UseProfileSaveOptions) {
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const handleSaveProfile = async () => {
    if (!user) return;

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
    setSaveLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        data: editData.raw_user_meta_data,
      });
      if (updateError) {
        console.error('Error updating auth metadata:', updateError);
        return;
      }

      const sanitizedData = sanitizeProfileData(validationResult.formatted);
      console.warn('🔍 Diagnostic profile update:', {
        user_id: user.id,
        sanitizedData,
        originalFormData: validationResult.formatted,
      });

      const { error: checkError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        console.error('❌ Erreur vérification profil existant:', checkError);
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({ user_id: user.id, ...sanitizedData } as never);
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

      const {
        data: { user: updatedUser },
        error: userError,
      } = await supabase.auth.getUser();
      if (!userError && updatedUser) setUser(updatedUser);

      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (updatedProfile) {
        setProfile({
          ...updatedProfile,
          scopes: [],
          created_at: updatedProfile.created_at ?? new Date().toISOString(),
          updated_at: updatedProfile.updated_at ?? new Date().toISOString(),
        });
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  return { saveLoading, validationErrors, handleSaveProfile };
}
