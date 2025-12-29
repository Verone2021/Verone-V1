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

// Cache des clients par app (au lieu d'un singleton global)
const clients: Partial<
  Record<AppName, ReturnType<typeof createBrowserClient<Database>>>
> = {};

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
  }
  return clients[appName];
};
