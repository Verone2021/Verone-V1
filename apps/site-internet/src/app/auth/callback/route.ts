import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/compte';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // For OAuth signups, ensure source metadata is set
      // This allows the DB trigger to create individual_customer
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && !user.user_metadata?.source) {
        await supabase.auth.updateUser({
          data: { source: 'site-internet' },
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent('Lien invalide ou expiré. Veuillez réessayer.')}`
  );
}
