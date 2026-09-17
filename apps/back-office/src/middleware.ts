/**
 * Middleware Back-Office — rafraichissement de session + garde d'acces
 *
 * ⚠️ REGLE ABSOLUE : JAMAIS importer depuis @verone/* ici.
 * Vercel Edge Runtime ne supporte PAS les imports workspace du monorepo.
 * Toute la logique DOIT rester dans ce fichier.
 * @see apps/linkme/src/middleware.ts — meme pattern, en production depuis des mois
 * @see commit 11e87901 — documentation de cette contrainte
 *
 * Pourquoi ce fichier existe (17/09/2026)
 * ---------------------------------------
 * Le back-office n'avait AUCUN middleware, contrairement a LinkMe et au site.
 * Consequence : le cookie de session n'etait jamais rafraichi cote serveur
 * (`packages/@verone/utils/src/supabase/server.ts` ne peut pas ecrire de
 * cookie depuis un Server Component, et avale l'echec). Des qu'un onglet
 * dormait, le jeton expirait sans etre renouvele : « les sessions ne tiennent
 * plus », « impossible de passer par Chrome ». En prime, la redirection vers
 * /login etait decidee trop tard (apres le debut du streaming), donc livree en
 * 200 + JavaScript au lieu d'un vrai 307.
 *
 * Ici, la session est rafraichie et la redirection tranchee AVANT tout rendu.
 *
 * Perimetre volontairement restreint :
 * - `/api/*` est EXCLU du matcher. Les routes API (Qonto, webhooks Packlink,
 *   Revolut, emails) sont immuables et portent deja leur propre controle
 *   d'acces ; les faire passer ici serait un risque de regression pur.
 * - En cas de pepin (panne reseau, 5xx GoTrue), on laisse passer vers le rendu
 *   plutot que de deconnecter : le layout `(protected)` reste la ceinture.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Pages accessibles sans etre connecte. */
const PUBLIC_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/login$/,
  /^\/unauthorized$/,
  /^\/module-inactive$/,
];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

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

    // A appeler immediatement apres createServerClient : c'est cet appel qui
    // rafraichit le jeton et declenche l'ecriture des cookies ci-dessus.
    // (Ne jamais appeler getSession() avant — recommandation @supabase/ssr.)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (PUBLIC_ROUTES.some(re => re.test(pathname))) {
      return supabaseResponse;
    }

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const { data: role, error: roleError } = await supabase
      .from('user_app_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('app', 'back-office')
      .eq('is_active', true)
      .maybeSingle();

    // Lecture impossible : on ne sait pas si la personne a le droit d'etre la.
    // On ne tranche pas ici — le layout `(protected)` refera la verification.
    // Mieux vaut un rendu de plus qu'une deconnexion injustifiee.
    if (roleError) {
      console.error(
        `[back-office/middleware] Lecture du role indisponible (${roleError.code ?? 'sans code'}): ${roleError.message}`
      );
      return supabaseResponse;
    }

    if (!role) {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      url.search = '';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    // Jamais de 500 ici : on laisse le rendu se faire, la ceinture reste le
    // layout `(protected)`.
    console.error('[back-office/middleware] Erreur inattendue:', error);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * Toutes les pages SAUF :
     * - api          (routes immuables, controle d'acces propre)
     * - _next/static, _next/image, favicon.ico
     * - tout fichier portant une extension (images, polices, robots.txt…)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)',
  ],
};
