'use server';

import { revalidatePath } from 'next/cache';

import {
  createServerClient,
  createAdminClient,
} from '@verone/utils/supabase/server';

import type {
  ActionResult,
  UpdateUserProfileData,
} from './user-management-types';

/**
 * Vérifier que l'utilisateur actuel est un owner (copie locale pour ce module)
 */
async function verifyOwnerAccess(): Promise<ActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, error: 'Non authentifie' };
  const { data: userRole, error: roleError } = await supabase
    .from('user_app_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('app', 'back-office')
    .eq('is_active', true)
    .single();
  if (roleError || !userRole)
    return { success: false, error: 'Profil utilisateur non trouve' };
  if (userRole.role !== 'owner')
    return { success: false, error: 'Acces non autorise - Role owner requis' };
  return { success: true };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    const accessCheck = await verifyOwnerAccess();
    if (!accessCheck.success) return accessCheck;
    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) {
      console.error('Erreur reinitialisation mot de passe:', error);
      return {
        success: false,
        error: 'Erreur lors de la reinitialisation du mot de passe',
      };
    }
    return { success: true };
  } catch (error) {
    console.error('Erreur resetUserPassword:', error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite lors de la reinitialisation",
    };
  }
}

export async function updateUserProfile(
  userId: string,
  updateData: UpdateUserProfileData
): Promise<ActionResult> {
  try {
    const accessCheck = await verifyOwnerAccess();
    if (!accessCheck.success) return accessCheck;
    const supabase = await createServerClient();
    const adminClient = createAdminClient();

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (!existingProfile)
      return { success: false, error: 'Profil utilisateur non trouve' };

    if (updateData.role) {
      const { error: roleError } = await supabase
        .from('user_app_roles')
        .update({ role: updateData.role })
        .eq('user_id', userId)
        .eq('app', 'back-office');
      if (roleError)
        return {
          success: false,
          error: 'Erreur lors de la mise a jour du role',
        };
    }

    const profileUpdates: {
      updated_at: string;
      first_name?: string | null;
      last_name?: string | null;
      job_title?: string | null;
    } = { updated_at: new Date().toISOString() };
    if (updateData.first_name !== undefined)
      profileUpdates.first_name = updateData.first_name?.trim() ?? null;
    if (updateData.last_name !== undefined)
      profileUpdates.last_name = updateData.last_name?.trim() ?? null;
    if (updateData.job_title !== undefined)
      profileUpdates.job_title = updateData.job_title?.trim() ?? null;

    if (Object.keys(profileUpdates).length > 1) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('user_id', userId);
      if (updateError) {
        console.error('Erreur mise a jour profil:', updateError);
        return {
          success: false,
          error: 'Erreur lors de la mise a jour du profil',
        };
      }
    }

    if (updateData.first_name ?? updateData.last_name) {
      const displayName = [updateData.first_name, updateData.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (displayName) {
        const { error: metadataError } =
          await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: {
              name: displayName,
              first_name: updateData.first_name ?? '',
              last_name: updateData.last_name ?? '',
              job_title: updateData.job_title ?? '',
            },
          });
        if (metadataError)
          console.error('Erreur mise a jour metadonnees:', metadataError);
      }
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: unknown) {
    console.error('Erreur updateUserProfile:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur inattendue s'est produite",
    };
  }
}
