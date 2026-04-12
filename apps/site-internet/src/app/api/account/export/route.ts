import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SITE_INTERNET_CHANNEL_ID = '0c2639e9-df80-41fa-84d0-9da96a128f7f';

/**
 * RGPD Data Export — Returns all user data as JSON
 * GET /api/account/export?userId=xxx
 *
 * Protected: verifies the authenticated user matches the requested userId
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
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  // Verify the authenticated user matches the requested userId
  const cookieStore = await cookies();
  const authClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });

  const {
    data: { user: authUser },
  } = await authClient.auth.getUser();

  if (authUser?.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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

    // Find customer_id for this user
    const { data: customerRow } = await supabase
      .from('individual_customers')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    const customerId = customerRow
      ? String((customerRow as { id: string }).id)
      : null;

    // Fetch all user data in parallel
    const [ordersResult, addressesResult, reviewsResult, wishlistResult] =
      await Promise.all([
        // Use sales_orders filtered by channel_id (site_orders table was dropped)
        customerId
          ? supabase
              .from('sales_orders')
              .select(
                'id, order_number, status, payment_status_v2, total_ttc, shipping_address, created_at'
              )
              .eq('individual_customer_id', customerId)
              .eq('channel_id', SITE_INTERNET_CHANNEL_ID)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
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
