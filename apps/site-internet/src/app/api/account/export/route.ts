import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

/**
 * RGPD Data Export — Returns all user data as JSON
 * GET /api/account/export?userId=xxx
 *
 * Protected: requires authenticated user + service role for full access
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId parameter required' },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch user profile from auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all user data in parallel
    const [ordersResult, addressesResult, reviewsResult, wishlistResult] =
      await Promise.all([
        supabase
          .from('site_orders')
          .select('id, status, total, items, created_at, shipping_address')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase.from('customer_addresses').select('*').eq('user_id', userId),
        supabase
          .from('product_reviews')
          .select('id, rating, title, comment, status, created_at')
          .eq('user_id', userId),
        supabase
          .from('wishlist_items')
          .select('product_id, created_at')
          .eq('user_id', userId),
      ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
      },
      orders: ordersResult.data ?? [],
      addresses: addressesResult.data ?? [],
      reviews: reviewsResult.data ?? [],
      wishlist: wishlistResult.data ?? [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="verone-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error('[Account Export] error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
