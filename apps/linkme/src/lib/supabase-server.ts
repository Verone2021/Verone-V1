/**
 * Supabase Server Client - Pour Server Components
 *
 * Utilise @supabase/ssr pour la gestion des cookies.
 * Le middleware utilise directement @supabase/ssr (voir middleware.ts).
 *
 * @module supabase-server
 * @since 2025-12-01
 * @updated 2026-01-27 - Simplifié (middleware utilise @supabase/ssr directement)
 */

import { cookies } from 'next/headers';

import { createServerClient as createSSRServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Créer un client Supabase pour les Server Components
 * Utilise les cookies pour maintenir la session
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // La méthode setAll a été appelée depuis un Server Component.
          // Cela peut être ignoré si vous avez un middleware qui rafraîchit
          // les sessions utilisateur.
        }
      },
    },
  });
}
