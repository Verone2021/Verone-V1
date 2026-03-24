/**
 * 🔧 Supabase Client - Client Side
 *
 * Configuration client pour authentification et requêtes
 * Singleton pattern pour éviter multiple GoTrueClient instances
 *
 * NOTE: Toutes les apps partagent le même cookie Supabase par défaut.
 * L'isolation des sessions par app n'est PAS supportée par @supabase/ssr.
 * Les permissions sont gérées côté serveur via RLS et user_app_roles.
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

// Type pour globalThis avec notre cache
interface GlobalWithCache {
  [key: string]: ClientsCache | undefined;
}

// Initialiser le cache global s'il n'existe pas
if (
  typeof globalThis !== 'undefined' &&
  !(globalThis as unknown as GlobalWithCache)[globalKey]
) {
  (globalThis as unknown as GlobalWithCache)[globalKey] = {};
}

// ✅ FIX: Mock SSR unique (même instance à chaque appel)
const ssrMockClient: unknown = {
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
      eq: () => ({
        order: () => ({
          single: async () => ({ data: null, error: null }),
        }),
        single: async () => ({ data: null, error: null }),
      }),
      order: () => ({
        single: async () => ({ data: null, error: null }),
      }),
      single: async () => ({ data: null, error: null }),
    }),
  }),
  rpc: async () => ({ data: null, error: null }),
};

/**
 * Détecte automatiquement l'app courante basée sur l'URL
 * Utilisé quand appName n'est pas fourni explicitement
 */
function detectApp(): AppName {
  if (typeof window === 'undefined') return 'backoffice';

  const hostname = window.location.hostname;
  const port = window.location.port;

  // Détection par port (dev local)
  if (port === '3002') return 'linkme';
  if (port === '3001') return 'site';

  // Détection par hostname (production)
  if (hostname.includes('linkme')) return 'linkme';
  if (hostname.includes('site')) return 'site';

  return 'backoffice';
}

/**
 * Crée un client Supabase pour le navigateur
 *
 * @param appName - Nom de l'app (optionnel, pour logging/debug)
 * @returns Client Supabase avec cookie par défaut
 *
 * @example
 * const supabase = createClient();
 */
export const createClient = (
  appName?: AppName
): ReturnType<typeof createBrowserClient<Database>> => {
  // CRITICAL: Prevent SSR/SSG execution
  // During Next.js static generation, window is not defined
  // Return the SAME mock client (not a new object) for SSR stability
  if (typeof window === 'undefined') {
    return ssrMockClient as ReturnType<typeof createBrowserClient<Database>>;
  }

  // Auto-détection de l'app (pour debug/logging uniquement)
  const resolvedAppName = appName ?? detectApp();

  // Utiliser le cache global pour résister au HMR
  const clients: ClientsCache =
    (globalThis as unknown as GlobalWithCache)[globalKey] ?? {};

  if (!clients[resolvedAppName]) {
    // Toutes les apps utilisent le cookie par défaut: sb-{PROJECT_ID}-auth-token
    // L'option cookieOptions de createBrowserClient n'est PAS supportée par @supabase/ssr
    clients[resolvedAppName] = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Persister dans le cache global
    (globalThis as unknown as GlobalWithCache)[globalKey] = clients;
  }

  return clients[resolvedAppName];
};

// ============================================================================
// HELPER: Safe getUser() - Silence network errors in dev
// ============================================================================

/**
 * Wrapper sécurisé pour getUser() qui gère les erreurs network silencieusement
 *
 * CONTEXTE:
 * - En dev, Supabase peut throw "Failed to fetch" lors du chargement initial de page
 * - Race condition: client tente getUser() avant que session soit complètement initialisée
 * - Ces erreurs sont normales en dev et ne doivent pas polluer la console
 *
 * @returns User data ou null (jamais d'erreur throwée)
 *
 * @example
 * const { data } = await getUserSafe();
 * if (data.user) {
 *   console.log('User authenticated:', data.user.email);
 * }
 */
export async function getUserSafe() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // Log en dev uniquement (expected behavior)
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[Supabase] getUser failed (expected in dev):',
          error.message
        );
      }
      return { data: { user: null }, error: null };
    }

    return { data, error: null };
  } catch (_err) {
    // Catch network errors (Failed to fetch)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Supabase] getUser network error (expected in dev)');
    }
    return { data: { user: null }, error: null };
  }
}
