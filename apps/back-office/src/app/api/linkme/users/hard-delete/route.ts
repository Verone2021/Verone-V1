/**
 * API Route: POST /api/linkme/users/hard-delete
 * Hard delete a LinkMe user: removes auth.users + user_app_roles + user_profiles
 * Frees the email for reuse.
 *
 * Prerequisites: user must already be archived (is_active = false)
 * Business data (contacts, affiliates) is preserved.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createAdminClient } from '@verone/utils/supabase/server';

import { requireBackofficeAdmin } from '@/lib/guards';

const HardDeleteSchema = z.object({
  user_id: z.string().uuid('ID utilisateur invalide'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Guard: admin back-office only
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult;
  }

  try {
    const body: unknown = await request.json();
    const parsed = HardDeleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 }
      );
    }

    const { user_id } = parsed.data;
    const supabaseAdmin = createAdminClient();

    // 1. Verify user is archived (is_active = false)
    const { data: role, error: roleError } = await supabaseAdmin
      .from('user_app_roles')
      .select('id, is_active')
      .eq('user_id', user_id)
      .eq('app', 'linkme')
      .single();

    if (roleError || !role) {
      return NextResponse.json(
        { message: 'Utilisateur LinkMe introuvable' },
        { status: 404 }
      );
    }

    if (role.is_active) {
      return NextResponse.json(
        {
          message:
            "L'utilisateur doit d'abord être archivé avant la suppression définitive",
        },
        { status: 400 }
      );
    }

    // 2. Delete user_app_roles (LinkMe role only)
    const { error: deleteRoleError } = await supabaseAdmin
      .from('user_app_roles')
      .delete()
      .eq('user_id', user_id)
      .eq('app', 'linkme');

    if (deleteRoleError) {
      console.error(
        '[hard-delete] Error deleting user_app_roles:',
        deleteRoleError
      );
      return NextResponse.json(
        { message: 'Erreur lors de la suppression du rôle' },
        { status: 500 }
      );
    }

    // 3. Check if user has roles in other apps before deleting profile/auth
    const { data: otherRoles } = await supabaseAdmin
      .from('user_app_roles')
      .select('id')
      .eq('user_id', user_id)
      .neq('app', 'linkme')
      .limit(1);

    const hasOtherRoles = otherRoles && otherRoles.length > 0;

    if (!hasOtherRoles) {
      // 4. Delete user_profiles (only if no other app roles)
      const { error: deleteProfileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('user_id', user_id);

      if (deleteProfileError) {
        console.error(
          '[hard-delete] Error deleting user_profiles:',
          deleteProfileError
        );
        // Non-blocking: profile cleanup is best-effort
      }

      // 5. Delete auth.users (frees the email)
      const { error: deleteAuthError } =
        await supabaseAdmin.auth.admin.deleteUser(user_id);

      if (deleteAuthError) {
        console.error(
          '[hard-delete] Error deleting auth.users:',
          deleteAuthError
        );
        return NextResponse.json(
          {
            message:
              "Erreur lors de la suppression du compte d'authentification",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: hasOtherRoles
        ? 'Rôle LinkMe supprimé (utilisateur conservé car actif dans une autre app)'
        : 'Utilisateur supprimé définitivement, email libéré',
    });
  } catch (error) {
    console.error('[hard-delete] Unexpected error:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
