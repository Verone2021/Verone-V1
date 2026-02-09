/**
 * Middleware Site-Internet - Session Refresh
 *
 * Gere le refresh de session Supabase et protege /compte.
 * Le site-internet est principalement public.
 *
 * @since 2026-02-09 - Simplifie (suppression app-isolation non necessaire)
 */
import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
