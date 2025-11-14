/**
 * 🔧 Supabase Client - Client Side
 *
 * Configuration client pour authentification et requêtes
 * Singleton pattern pour éviter multiple GoTrueClient instances
 */

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './types';

// Singleton instance
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
};
