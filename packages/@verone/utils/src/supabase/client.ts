/**
 * 🔧 Supabase Client - Client Side
 *
 * Configuration client pour authentification et requêtes
 * Singleton pattern par app pour éviter multiple GoTrueClient instances
 * et isoler les sessions entre apps (back-office, linkme, site)
 */

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './types';

// Types d'apps supportées
export type AppName = 'backoffice' | 'linkme' | 'site';

// ============================================================================
// SINGLETON ROBUSTE - Résiste au hot reload et garantit 1 instance par app
// ============================================================================

// Utiliser globalThis pour survivre au hot module replacement (HMR)
const globalKey = '__VERONE_SUPABASE_CLIENTS__' as const;

type ClientsCache = Partial<
  Record<AppName, ReturnType<typeof createBrowserClient<Database>>>
>;

// Initialiser le cache global s'il n'existe pas
if (typeof globalThis !== 'undefined' && !(globalThis as any)[globalKey]) {
  (globalThis as any)[globalKey] = {};
}

// ✅ FIX: Mock SSR unique (même instance à chaque appel)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ssrMockClient: any = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: async () => ({
      data: null,
      error: new Error('SSR not supported'),
    }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({ single: async () => ({ data: null, error: null }) }),
    }),
  }),
  rpc: async () => ({ data: null, error: null }),
};

/**
 * Crée un client Supabase pour le navigateur avec cookie isolé par app
 *
 * @param appName - Nom de l'app ('backoffice', 'linkme', 'site')
 * @returns Client Supabase configuré avec cookie distinct
 *
 * @example
 * // Back-office (défaut)
 * const supabase = createClient();
 *
 * // LinkMe
 * const supabase = createClient('linkme');
 */
export const createClient = (
  appName: AppName = 'backoffice'
): ReturnType<typeof createBrowserClient<Database>> => {
  // CRITICAL: Prevent SSR/SSG execution
  // During Next.js static generation, window is not defined
  // Return the SAME mock client (not a new object) for SSR stability
  if (typeof window === 'undefined') {
    return ssrMockClient;
  }

  // ✅ FIX: Utiliser le cache global pour résister au HMR
  const clients: ClientsCache = (globalThis as any)[globalKey] || {};

  if (!clients[appName]) {
    // Back-office utilise le cookie par défaut (rétrocompatibilité)
    // LinkMe et Site utilisent des cookies distincts pour isoler les sessions
    const options =
      appName === 'backoffice'
        ? {} // Cookie par défaut: sb-{PROJECT_ID}-auth-token
        : { cookieOptions: { name: `sb-${appName}-auth` } };

    clients[appName] = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options
    );

    // Persister dans le cache global
    (globalThis as any)[globalKey] = clients;
  }

  return clients[appName];
};
