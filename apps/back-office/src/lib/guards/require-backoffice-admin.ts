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

import type { Database } from '@/types/supabase';

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
      return NextResponse.json(
        {
          error: 'Non authentifie',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Verifier le role dans user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, organisation_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('[requireBackofficeAdmin] DB error:', profileError);
      return NextResponse.json(
        {
          error: 'Erreur verification permissions',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }

    // Verifier que le role est owner ou admin
    const adminRoles: UserRoleType[] = ['owner', 'admin'];
    if (!profile || !adminRoles.includes(profile.role)) {
      return NextResponse.json(
        {
          error: 'Permissions insuffisantes - Admin back-office requis',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 4. Si une organisation specifique est requise, verifier l'acces
    if (options?.requiredOrganisationId) {
      if (profile.organisation_id !== options.requiredOrganisationId) {
        return NextResponse.json(
          {
            error: 'Acces refuse a cette organisation',
            code: 'FORBIDDEN_ORGANISATION',
          },
          { status: 403 }
        );
      }
    }

    // 5. Succes - retourner le contexte
    return {
      user,
      organisationId: profile.organisation_id,
      roleName: profile.role as 'owner' | 'admin',
    };
  } catch {
    console.error(
      '[requireBackofficeAdmin] Unexpected error during auth verification'
    );
    return NextResponse.json(
      {
        error: 'Erreur interne authentification',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
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
