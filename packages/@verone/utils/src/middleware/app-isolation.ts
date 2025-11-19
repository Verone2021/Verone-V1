/**
 * 🔒 Middleware App Isolation - Vérone Multi-Canal
 *
 * Middleware générique pour isoler les users selon leur canal d'inscription (app_source).
 *
 * Architecture Turborepo :
 * - back-office (Port 3000) : Admin CRM/ERP
 * - site-internet (Port 3001) : E-commerce Public
 * - linkme (Port 3002) : Apporteurs d'affaires
 *
 * Règles :
 * - User back-office ne peut PAS accéder site-internet ou linkme
 * - User site-internet ne peut PAS accéder back-office ou linkme
 * - User linkme ne peut PAS accéder back-office ou site-internet
 *
 * @module app-isolation
 * @since 2025-11-19 (Phase 2 Multi-Canal)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

/** Type app_source depuis database */
export type AppType = 'back-office' | 'site-internet' | 'linkme';

/** Configuration middleware app-isolation */
export interface AppIsolationConfig {
  /** App courante (doit correspondre à user_profiles.app_source) */
  appName: AppType;

  /** Redirections en cas de mismatch */
  redirects: {
    /** URL redirection si user appartient à 'back-office' */
    'back-office'?: string;
    /** URL redirection si user appartient à 'site-internet' */
    'site-internet'?: string;
    /** URL redirection si user appartient à 'linkme' */
    linkme?: string;
  };

  /** URL par défaut si app_source non définie */
  defaultRedirect?: string;

  /** Paths exemptés de vérification (auth, public, api) */
  excludePaths?: RegExp[];

  /** Activer logs debug */
  debug?: boolean;
}

/** Résultat vérification app-isolation */
export interface AppIsolationResult {
  /** Vérification réussie (user appartient à l'app) */
  allowed: boolean;

  /** User app_source détecté */
  userAppSource: AppType | null;

  /** App demandée */
  requestedApp: AppType;

  /** URL redirection si allowed = false */
  redirectUrl?: string;

  /** Message erreur/warning */
  message?: string;
}

/**
 * Vérifie si user appartient à l'app correcte
 *
 * @param request - Next.js request
 * @param config - Configuration app-isolation
 * @returns Résultat vérification
 *
 * @example
 * ```ts
 * // Dans middleware.ts de back-office
 * import { checkAppIsolation } from '@verone/utils/middleware/app-isolation';
 *
 * export async function middleware(request: NextRequest) {
 *   const result = await checkAppIsolation(request, {
 *     appName: 'back-office',
 *     redirects: {
 *       'site-internet': 'https://shop.verone.fr',
 *       'linkme': 'https://linkme.verone.fr',
 *     },
 *     excludePaths: [/^\/auth/, /^\/api\/public/],
 *   });
 *
 *   if (!result.allowed) {
 *     return NextResponse.redirect(result.redirectUrl!);
 *   }
 *
 *   return NextResponse.next();
 * }
 * ```
 */
export async function checkAppIsolation(
  request: NextRequest,
  config: AppIsolationConfig
): Promise<AppIsolationResult> {
  const { appName, redirects, excludePaths = [], debug = false } = config;

  // Vérifier si path exclu
  const pathname = request.nextUrl.pathname;
  const isExcluded = excludePaths.some(regex => regex.test(pathname));

  if (isExcluded) {
    if (debug) {
      console.log(`[App-Isolation] Path ${pathname} exclu de vérification`);
    }
    return {
      allowed: true,
      userAppSource: null,
      requestedApp: appName,
      message: 'Path exclu de vérification',
    };
  }

  // Créer client Supabase avec cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {
          // Pas de set dans middleware (lecture seule)
        },
        remove() {
          // Pas de remove dans middleware
        },
      },
    }
  );

  // Récupérer session user
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    if (debug) {
      console.log('[App-Isolation] Aucune session détectée');
    }
    // Pas de session = laisser passer (auth middleware gérera)
    return {
      allowed: true,
      userAppSource: null,
      requestedApp: appName,
      message: 'Aucune session (délégué à auth middleware)',
    };
  }

  // Récupérer app_source depuis user_profiles
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('app_source')
    .eq('user_id', session.user.id)
    .single();

  if (profileError || !profile) {
    if (debug) {
      console.error(
        '[App-Isolation] Erreur récupération profile:',
        profileError
      );
    }
    // Profile non trouvé = laisser passer avec warning
    return {
      allowed: true,
      userAppSource: null,
      requestedApp: appName,
      message: 'Profile non trouvé (nouveau user ?)',
    };
  }

  const userAppSource = profile.app_source as AppType;

  // Vérifier match app_source
  if (userAppSource !== appName) {
    const redirectUrl = redirects[userAppSource] || config.defaultRedirect;

    if (debug) {
      console.warn(
        `[App-Isolation] MISMATCH: User app_source=${userAppSource}, App demandée=${appName}`
      );
    }

    return {
      allowed: false,
      userAppSource,
      requestedApp: appName,
      redirectUrl,
      message: `User appartient à ${userAppSource}, accès ${appName} refusé`,
    };
  }

  // OK - User appartient à l'app correcte
  if (debug) {
    console.log(
      `[App-Isolation] OK: User app_source=${userAppSource} correspond à ${appName}`
    );
  }

  return {
    allowed: true,
    userAppSource,
    requestedApp: appName,
    message: 'Accès autorisé',
  };
}

/**
 * Créer middleware Next.js app-isolation
 *
 * @param config - Configuration app-isolation
 * @returns Middleware Next.js
 *
 * @example
 * ```ts
 * // apps/back-office/middleware.ts
 * import { createAppIsolationMiddleware } from '@verone/utils/middleware/app-isolation';
 *
 * export const middleware = createAppIsolationMiddleware({
 *   appName: 'back-office',
 *   redirects: {
 *     'site-internet': 'https://shop.verone.fr',
 *     'linkme': 'https://linkme.verone.fr',
 *   },
 *   excludePaths: [
 *     /^\/auth/,
 *     /^\/api\/public/,
 *     /^\/_next/,
 *     /^\/favicon.ico/,
 *   ],
 *   debug: process.env.NODE_ENV === 'development',
 * });
 *
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * };
 * ```
 */
export function createAppIsolationMiddleware(config: AppIsolationConfig) {
  return async function appIsolationMiddleware(
    request: NextRequest
  ): Promise<NextResponse> {
    const result = await checkAppIsolation(request, config);

    if (!result.allowed && result.redirectUrl) {
      if (config.debug) {
        console.warn(`[App-Isolation] Redirection vers ${result.redirectUrl}`);
      }
      return NextResponse.redirect(new URL(result.redirectUrl));
    }

    return NextResponse.next();
  };
}

/**
 * Helper: Vérifier app_source côté serveur (Server Component / API Route)
 *
 * @param userId - ID utilisateur
 * @param expectedApp - App attendue
 * @returns true si app_source correspond, false sinon
 *
 * @example
 * ```ts
 * // Dans Server Component
 * import { verifyUserAppSource } from '@verone/utils/middleware/app-isolation';
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function AdminPage() {
 *   const supabase = createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 *   if (!user) {
 *     redirect('/login');
 *   }
 *
 *   const isAllowed = await verifyUserAppSource(
 *     user.id,
 *     'back-office',
 *     supabase
 *   );
 *
 *   if (!isAllowed) {
 *     return <div>Accès refusé. Cette page est réservée au back-office.</div>;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export async function verifyUserAppSource(
  userId: string,
  expectedApp: AppType,
  supabaseClient: any // Type générique pour compatibilité SSR/client
): Promise<boolean> {
  const { data: profile, error } = await supabaseClient
    .from('user_profiles')
    .select('app_source')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    console.error('[App-Isolation] Erreur vérification app_source:', error);
    return false;
  }

  return profile.app_source === expectedApp;
}
