/**
 * Middleware back-office — refus par défaut sur `/api/*`
 *
 * ⚠️ RÈGLE ABSOLUE : JAMAIS d'import `@verone/*` ici. Le runtime Edge de Vercel
 * ne résout pas les paquets du monorepo. Toute la logique est en ligne.
 * Modèle repris de `apps/linkme/src/middleware.ts`.
 *
 * ---
 *
 * Pourquoi ce fichier existe (ADR-046, `.claude/rules/api-guards.md`) :
 *
 * Le back-office n'avait aucun middleware. Sa protection venait uniquement de
 * `(protected)/layout.tsx`, qui couvre les **pages** et jamais `src/app/api/**`.
 * Le 18/09/2026, `/api/qonto/invoices` renvoyait 41 factures depuis Internet
 * **sans aucune connexion**. Les portes de lecture ont été fermées une par une
 * ce jour-là ; celles qui écrivent restaient ouvertes, et surtout : **toute
 * route nouvellement ajoutée naissait ouverte**.
 *
 * Ce middleware inverse le défaut. Sous `/api/`, il faut désormais une raison
 * explicite pour passer sans session.
 *
 * Il ne touche PAS aux pages : le `matcher` ne vise que `/api/:path*`. Le
 * comportement des écrans est strictement inchangé.
 *
 * Quatre façons légitimes de passer :
 *   1. requête `OPTIONS` — contrôle préalable CORS, sans donnée ni cookie ;
 *   2. chemin de la liste blanche ci-dessous — la route porte sa propre serrure ;
 *   3. secret des tâches planifiées en en-tête — appel machine, la route revérifie ;
 *   4. session Supabase valide (cookie du navigateur, ou jeton porteur pour
 *      l'extension Chrome du sourcing).
 *
 * Le middleware est un **premier verrou**, pas le seul : les routes sensibles
 * gardent `requireBackofficeAdmin`, qui vérifie en plus le rôle (401 → 403).
 *
 * Sprint BO-SEC-MW-001 — 2026-09-19
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Import local (pas `@verone/*`) : compatible runtime Edge, et testable.
import { isPublicApiRoute } from '@/lib/security/public-api-routes';

function refus(pathname: string): NextResponse {
  console.warn(`[middleware] Acces refuse sans session : ${pathname}`);
  return NextResponse.json(
    { error: 'Non authentifie', code: 'UNAUTHORIZED' },
    { status: 401 }
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Contrôle préalable CORS : aucune donnée, aucun cookie. Le bloquer
  //    casserait l'extension Chrome du sourcing sans rien protéger.
  if (request.method === 'OPTIONS') {
    return NextResponse.next({ request });
  }

  // 2. Liste blanche explicite.
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next({ request });
  }

  const authHeader = request.headers.get('authorization');

  // 3. Appel machine porteur du secret des tâches planifiées. La route
  //    appelée refait la vérification : ceci n'est qu'un droit de passage.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return NextResponse.next({ request });
  }

  const bearerToken =
    authHeader?.startsWith('Bearer ') === true
      ? authHeader.slice('Bearer '.length)
      : null;

  // 4. Raccourci : ni cookie, ni jeton porteur → inutile d'appeler Supabase.
  //    Évite un aller-retour réseau sur chaque requête anonyme.
  const hasAuthCookie = request.cookies
    .getAll()
    .some(cookie => cookie.name.startsWith('sb-'));

  if (!hasAuthCookie && !bearerToken) {
    return refus(pathname);
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
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

    // Jeton porteur : c'est ainsi que l'extension Chrome du sourcing appelle
    // depuis une autre origine, où les cookies ne voyagent pas.
    const {
      data: { user },
    } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();

    if (!user) {
      return refus(pathname);
    }

    return supabaseResponse;
  } catch (error) {
    // Une panne de vérification ne doit jamais ouvrir la porte.
    console.error('[middleware] Erreur de verification :', error);
    return NextResponse.json(
      { error: 'Verification impossible', code: 'AUTH_CHECK_FAILED' },
      { status: 503 }
    );
  }
}

export const config = {
  // Les pages ne sont PAS concernées : leur protection reste
  // `(protected)/layout.tsx`, inchangée par ce sprint.
  matcher: ['/api/:path*'],
};
