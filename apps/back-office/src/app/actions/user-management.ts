'use server';

import { revalidatePath } from 'next/cache';

import {
  createServerClient,
  createAdminClient,
} from '@verone/utils/supabase/server';

import type { CreateUserData, ActionResult } from './user-management-types';

/**
 * Vérifier que l'utilisateur actuel est un owner
 */
async function verifyOwnerAccess(): Promise<ActionResult> {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'Non authentifié' };
  }

  // Check if user has owner role in back-office app
  const { data: userRole, error: roleError } = await supabase
    .from('user_app_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('app', 'back-office')
    .eq('is_active', true)
    .single();

  if (roleError || !userRole) {
    return { success: false, error: 'Profil utilisateur non trouvé' };
  }

  if (userRole.role !== 'owner') {
    return { success: false, error: 'Accès non autorisé - Rôle owner requis' };
  }

  return { success: true };
}

/**
 * Créer un nouvel utilisateur avec son rôle
 */
export async function createUserWithRole(
  userData: CreateUserData
): Promise<ActionResult> {
  // CORRECTION: Try-catch global plus robuste selon bonnes pratiques Next.js
  try {
    // Validation des données d'entrée
    if (!userData?.email || !userData?.password || !userData?.role) {
      return {
        success: false,
        error: 'Données manquantes: email, password et role sont requis',
      };
    }

    // Vérifier les permissions
    const accessCheck = await verifyOwnerAccess();
    if (!accessCheck.success) {
      return accessCheck;
    }

    // CORRECTION: Initialiser le client admin avec gestion d'erreur
    let adminClient: ReturnType<typeof createAdminClient>;

    try {
      adminClient = createAdminClient();
    } catch (clientError) {
      console.error('Erreur initialisation clients Supabase:', clientError);
      return {
        success: false,
        error: 'Erreur de configuration Supabase',
      };
    }

    // 1. Créer l'utilisateur dans Supabase Auth avec l'API Admin
    let newUser: Awaited<
      ReturnType<typeof adminClient.auth.admin.createUser>
    >['data'];
    let authError: Awaited<
      ReturnType<typeof adminClient.auth.admin.createUser>
    >['error'];

    try {
      const result = await adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirmer l'email
        user_metadata: {
          name: userData.firstName
            ? `${userData.firstName} ${userData.lastName || ''}`.trim()
            : userData.email.split('@')[0],
        },
      });

      newUser = result.data;
      authError = result.error;
    } catch (adminError) {
      console.error('Erreur Admin API createUser:', adminError);
      return {
        success: false,
        error: 'Erreur lors de la création du compte utilisateur',
      };
    }

    if (authError || !newUser?.user) {
      console.error('Erreur création auth user:', authError);
      return {
        success: false,
        error:
          authError?.message ??
          'Erreur lors de la création du compte utilisateur',
      };
    }

    // 2. Créer le profil utilisateur dans la table user_profiles
    //    Utilise adminClient pour bypass RLS (opération admin)
    let profileError: unknown;

    // Sanitize phone: strip spaces/dots/dashes to match DB check_phone_format constraint
    const rawPhone = userData.phone?.trim() || null;
    const sanitizedPhone = rawPhone
      ? rawPhone.replace(/[\s.\-()]/g, '') || null
      : null;

    try {
      const result = await adminClient.from('user_profiles').insert({
        user_id: newUser.user.id,
        user_type: 'staff',
        email: userData.email,
        first_name: userData.firstName?.trim() || null,
        last_name: userData.lastName?.trim() || null,
        phone: sanitizedPhone,
        job_title: userData.jobTitle?.trim() || null,
        partner_id: null,
        organisation_id: null,
      });

      profileError = result.error;

      // Also create entry in user_app_roles for back-office app
      if (!profileError) {
        const roleResult = await adminClient.from('user_app_roles').insert({
          user_id: newUser.user.id,
          app: 'back-office',
          role: userData.role,
          is_active: true,
        });

        if (roleResult.error) {
          profileError = roleResult.error;
        }
      }
    } catch (dbError) {
      console.error('Erreur DB insert profil:', dbError);
      profileError = dbError;
    }

    if (profileError) {
      console.error('Erreur création profil/rôle:', profileError);

      // Supprimer l'utilisateur auth si la création du profil a échoué
      try {
        await adminClient.auth.admin.deleteUser(newUser.user.id);
      } catch (cleanupError) {
        console.error('Erreur cleanup utilisateur:', cleanupError);
      }

      // Propager l'erreur Supabase réelle au lieu d'un message générique
      let errorMsg = 'Erreur lors de la création du profil utilisateur';

      if (profileError instanceof Error) {
        errorMsg = profileError.message;
      } else if (typeof profileError === 'object' && profileError !== null) {
        const errObj = profileError as Record<string, unknown>;
        if (typeof errObj.message === 'string') {
          errorMsg = errObj.message;
        } else {
          errorMsg = JSON.stringify(profileError);
        }
      } else if (typeof profileError === 'string') {
        errorMsg = profileError;
      }

      return {
        success: false,
        error: errorMsg,
      };
    }

    // Revalider la page d'administration pour afficher le nouvel utilisateur
    try {
      revalidatePath('/admin/users');
    } catch (revalidateError) {
      console.error('Erreur revalidation:', revalidateError);
      // Ne pas faire échouer la création pour une erreur de revalidation
    }

    // CORRECTION: Retour structuré garanti
    return {
      success: true,
      data: {
        user_id: newUser.user.id,
        email: newUser.user.email,
        role: userData.role,
      },
    };
  } catch (error: unknown) {
    // CORRECTION: Catch global qui capture TOUT problème imprévu
    console.error('Erreur globale createUserWithRole:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inattendue s'est produite lors de la création de l'utilisateur";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Supprimer un utilisateur
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    // Vérifier les permissions
    const accessCheck = await verifyOwnerAccess();
    if (!accessCheck.success) {
      return accessCheck;
    }

    const supabase = await createServerClient();
    const adminClient = createAdminClient();

    // Vérifier qu'on ne supprime pas le dernier owner
    const { data: owners } = await supabase
      .from('user_app_roles')
      .select('user_id')
      .eq('app', 'back-office')
      .eq('role', 'owner')
      .eq('is_active', true);

    const { data: userRole } = await supabase
      .from('user_app_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('app', 'back-office')
      .eq('is_active', true)
      .single();

    if (userRole?.role === 'owner' && owners && owners.length <= 1) {
      return {
        success: false,
        error: 'Impossible de supprimer le dernier propriétaire du système',
      };
    }

    // 1. Supprimer les rôles applicatifs (user_app_roles)
    const { error: rolesError } = await supabase
      .from('user_app_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Erreur suppression rôles:', rolesError);
      return {
        success: false,
        error: "Erreur lors de la suppression des rôles de l'utilisateur",
      };
    }

    // 2. Supprimer le profil utilisateur (user_profiles)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Erreur suppression profil:', profileError);
      return {
        success: false,
        error: 'Erreur lors de la suppression du profil utilisateur',
      };
    }

    // 3. Supprimer l'utilisateur auth
    const { error: authError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Erreur suppression auth user:', authError);
      return {
        success: false,
        error: 'Erreur lors de la suppression du compte utilisateur',
      };
    }

    // Revalider la page d'administration
    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite lors de la suppression",
    };
  }
}

/**
 * Mettre à jour le rôle d'un utilisateur
 */
export async function updateUserRole(
  userId: string,
  newRole: 'owner' | 'admin' | 'catalog_manager'
): Promise<ActionResult> {
  try {
    // Vérifier les permissions
    const accessCheck = await verifyOwnerAccess();
    if (!accessCheck.success) {
      return accessCheck;
    }

    const supabase = await createServerClient();

    // Vérifier qu'on ne retire pas le rôle owner du dernier owner
    if (newRole !== 'owner') {
      const { data: owners } = await supabase
        .from('user_app_roles')
        .select('user_id')
        .eq('app', 'back-office')
        .eq('role', 'owner')
        .eq('is_active', true);

      const { data: currentUserRole } = await supabase
        .from('user_app_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('app', 'back-office')
        .eq('is_active', true)
        .single();

      if (currentUserRole?.role === 'owner' && owners && owners.length <= 1) {
        return {
          success: false,
          error:
            'Impossible de modifier le rôle du dernier propriétaire du système',
        };
      }
    }

    // Mettre à jour le rôle dans user_app_roles (pas user_profiles qui n'a pas de colonne role)
    const { error } = await supabase
      .from('user_app_roles')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('app', 'back-office');

    if (error) {
      console.error('Erreur mise à jour rôle:', error);
      return {
        success: false,
        error: 'Erreur lors de la mise à jour du rôle',
      };
    }

    // Revalider la page d'administration
    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    console.error('Erreur updateUserRole:', error);
    return {
      success: false,
      error:
        "Une erreur inattendue s'est produite lors de la mise à jour du rôle",
    };
  }
}

// resetUserPassword and updateUserProfile are in user-management-update.ts
export { resetUserPassword, updateUserProfile } from './user-management-update';
