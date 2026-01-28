/**
 * API Route: Page Configuration
 * Retourne la configuration d'une page LinkMe spécifique
 *
 * GET /api/page-config/login
 * GET /api/page-config/dashboard
 *
 * @module /api/page-config/[pageId]
 * @since 2026-01-06
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

// Type pour la configuration de page
type PageConfiguration = {
  id: string;
  page_id: string;
  page_name: string;
  page_description: string | null;
  page_icon: string | null;
  globe_enabled: boolean;
  globe_rotation_speed: number;
  config: Record<string, unknown>;
};

// Configuration par défaut si la page n'existe pas en DB
const DEFAULT_CONFIG: Omit<PageConfiguration, 'id' | 'page_id'> = {
  page_name: 'Page',
  page_description: null,
  page_icon: 'file',
  globe_enabled: true,
  globe_rotation_speed: 0.003,
  config: {},
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> }
): Promise<NextResponse> {
  try {
    const { pageId } = await params;

    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId is required' },
        { status: 400 }
      );
    }

    // Client anonyme sans session (route publique)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Récupérer la configuration de la page
    const { data, error } = (await supabase
      .from('linkme_page_configurations')
      .select('*')
      .eq('page_id', pageId)
      .single()) as {
      data: PageConfiguration | null;
      error: { code?: string } | null;
    };

    if (error) {
      // Si la table n'existe pas ou pas de données, retourner config par défaut
      // PGRST116 = row not found, PGRST205 = table not found, 42P01 = undefined table
      if (
        error.code === 'PGRST116' ||
        error.code === 'PGRST205' ||
        error.code === '42P01'
      ) {
        return NextResponse.json({
          page_id: pageId,
          ...DEFAULT_CONFIG,
        });
      }

      console.error('Error fetching page config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch page configuration' },
        { status: 500 }
      );
    }

    // Retourner la configuration
    return NextResponse.json(data as PageConfiguration);
  } catch (error) {
    console.error('Error in page-config API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
