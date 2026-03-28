/**
 * 🔐 Guard: requireBackofficeAdmin
 *
 * Protege les API routes sensibles du back-office.
 * Verifie que l'appelant est un admin back-office authentifie (owner ou admin).
 *
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const guardResult = await requireBackofficeAdmin(request);
 *   if (guardResult instanceof NextResponse) {
 *     return guardResult; // 401 ou 403
 *   }
 *   const { user, organisationId } = guardResult;
 *   // ... logique metier
 * }
 * ```
 *
 * @author Verone Security Team
 * @date 2026-01-05
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { User } from '@supabase/supabase-js';
import { createServerClient } from '@verone/utils/supabase/server';

import type { Database } from '@verone/types';

type UserRoleType = Database['public']['Enums']['user_role_type'];

export interface IBackofficeAdminContext {
  user: User;
  organisationId: string | null;
  roleName: 'owner' | 'admin';
}

/**
 * Verifie que l'appelant est un admin back-office authentifie.
 *
 * @param request - NextRequest (pour lire les cookies)
 * @param options - Options de verification
 * @returns BackofficeAdminContext si OK, NextResponse (401/403) sinon
 */
function errorResponse(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}

export async function requireBackofficeAdmin(
  request: NextRequest,
  options?: {
    /** Si fourni, verifie que l'admin a acces a cette organisation specifique */
    requiredOrganisationId?: string;
  }
): Promise<IBackofficeAdminContext | NextResponse> {
  try {
    // 1. Creer le client Supabase avec cookies (session back-office)
    const supabase = await createServerClient('backoffice');

    // 2. Verifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse('Non authentifie', 'UNAUTHORIZED', 401);
    }

    // 3. Verifier le role dans user_app_roles
    const { data: userRole, error: roleError } = await supabase
      .from('user_app_roles')
      .select('role, organisation_id')
      .eq('user_id', user.id)
      .eq('app', 'back-office')
      .eq('is_active', true)
      .single();

    if (roleError) {
      console.error('[requireBackofficeAdmin] DB error:', roleError);
      return errorResponse(
        'Erreur verification permissions',
        'INTERNAL_ERROR',
        500
      );
    }

    const adminRoles: UserRoleType[] = ['owner', 'admin'];
    if (!userRole || !adminRoles.includes(userRole.role as UserRoleType)) {
      return errorResponse(
        'Permissions insuffisantes - Admin back-office requis',
        'FORBIDDEN',
        403
      );
    }

    if (
      options?.requiredOrganisationId &&
      userRole.organisation_id !== options.requiredOrganisationId
    ) {
      return errorResponse(
        'Acces refuse a cette organisation',
        'FORBIDDEN_ORGANISATION',
        403
      );
    }

    // 5. Succes - retourner le contexte
    return {
      user,
      organisationId: userRole.organisation_id,
      roleName: userRole.role as 'owner' | 'admin',
    };
  } catch {
    console.error(
      '[requireBackofficeAdmin] Unexpected error during auth verification'
    );
    return errorResponse(
      'Erreur interne authentification',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * Helper pour verifier si le resultat est une erreur (NextResponse)
 */
export function isGuardError(
  result: IBackofficeAdminContext | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
