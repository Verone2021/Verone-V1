import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@verone/utils/supabase/server';

const ALLOWED_ORIGIN_PATTERNS = [
  /^chrome-extension:\/\//,
  /^https:\/\/verone-backoffice\.vercel\.app$/,
  /^http:\/\/localhost:3000$/,
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGIN_PATTERNS.some(p => p.test(origin)) ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const supabase = await createServerClient();

  const authHeader = request.headers.get('Authorization');
  const authResult = authHeader?.startsWith('Bearer ')
    ? await supabase.auth.getUser(authHeader.slice(7))
    : await supabase.auth.getUser();

  if (!authResult.data.user) {
    return NextResponse.json(
      { error: 'Non autorise' },
      { status: 401, headers: corsHeaders(origin) }
    );
  }

  const { data, error } = await supabase
    .from('brands')
    .select('id, name, slug, brand_color, logo_url')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'Erreur chargement marques', details: error.message },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  return NextResponse.json(
    { brands: data ?? [] },
    { headers: corsHeaders(origin) }
  );
}
