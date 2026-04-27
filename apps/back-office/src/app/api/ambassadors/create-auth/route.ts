/**
 * API: Create auth account for an ambassador
 * POST /api/ambassadors/create-auth
 *
 * Creates a Supabase auth user for an existing individual_customer with
 * is_ambassador=true, generates a temporary password, and links the
 * auth_user_id. The ambassador can change their password on first login.
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  customer_id: z.string().uuid(),
});

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export async function POST(request: Request) {
  try {
    // 1. Auth check: must be back-office staff
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // 2. Validate input
    const body: unknown = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'customer_id requis' },
        { status: 400 }
      );
    }

    // 3. Fetch ambassador from individual_customers
    const { data: ambassador, error: ambError } = await supabase
      .from('individual_customers')
      .select('id, email, first_name, last_name, auth_user_id')
      .eq('id', parsed.data.customer_id)
      // is_ambassador column not yet in generated types — cast to bypass
      .eq('is_ambassador' as never, true as never)
      .single();

    if (ambError || !ambassador) {
      return NextResponse.json(
        { error: 'Ambassadeur non trouve' },
        { status: 404 }
      );
    }

    if (ambassador.auth_user_id) {
      return NextResponse.json(
        { error: 'Cet ambassadeur a deja un compte' },
        { status: 409 }
      );
    }

    // 4. Create auth user with admin API (service role)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuration manquante' },
        { status: 500 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const tempPassword = generatePassword();

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: ambassador.email ?? '',
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: ambassador.first_name,
          last_name: ambassador.last_name,
          role: 'ambassador',
          user_type: 'ambassador',
        },
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          role: 'ambassador',
          user_type: 'ambassador',
        },
      });

    if (authError) {
      console.error('[Ambassador Auth] Create user failed:', authError);
      return NextResponse.json(
        { error: `Erreur creation compte: ${authError.message}` },
        { status: 500 }
      );
    }

    // 5. Link auth user to individual_customers row
    const { error: linkError } = await adminClient
      .from('individual_customers')
      .update({ auth_user_id: authData.user.id })
      .eq('id', ambassador.id);

    if (linkError) {
      console.error('[Ambassador Auth] Link failed:', linkError);
    }

    // 6. Create user_app_roles entry
    await adminClient.from('user_app_roles').insert({
      user_id: authData.user.id,
      app: 'site-internet',
      role: 'ambassador',
      is_active: true,
    });

    // 7. Create user_profiles entry
    await adminClient.from('user_profiles').insert({
      user_id: authData.user.id,
      first_name: ambassador.first_name,
      last_name: ambassador.last_name,
      email: ambassador.email,
      user_type: 'ambassador',
      app_source: 'site-internet',
    });

    return NextResponse.json({
      success: true,
      auth_user_id: authData.user.id,
      email: ambassador.email,
      temp_password: tempPassword,
    });
  } catch (error) {
    console.error('[Ambassador Auth] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
