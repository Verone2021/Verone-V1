/**
 * Supabase middleware helpers for back-office.
 *
 * - `updateSession` : refresh the Supabase auth cookies on every request,
 *   and read the current user. Returns both the response (with possibly
 *   refreshed cookies) and the user.
 *
 * Pattern lifted from `apps/site-internet/src/lib/supabase/middleware.ts`.
 *
 * @see BO-RBAC-CATALOG-MGR-001
 */
import { NextResponse, type NextRequest } from 'next/server';

import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

import type { Database } from '@verone/types';

export interface UpdateSessionResult {
  response: NextResponse;
  user: User | null;
  supabase: ReturnType<typeof createServerClient<Database>>;
}

export async function updateSession(
  request: NextRequest
): Promise<UpdateSessionResult> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do NOT add logic between createServerClient and getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user, supabase };
}
