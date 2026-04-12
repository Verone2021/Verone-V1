'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect('/auth/login?error=missing_fields');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/compte');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const phone = (formData.get('phone') as string) || undefined;

  if (!email || !password || !firstName || !lastName) {
    redirect('/auth/register?error=missing_fields');
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
        source: 'site-internet',
      },
    },
  });

  if (error) {
    redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
  }

  // Send welcome email (non-blocking)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
  void fetch(`${siteUrl}/api/emails/welcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, firstName }),
  }).catch(emailError => {
    console.error('[Signup] Welcome email failed:', emailError);
  });

  revalidatePath('/', 'layout');
  redirect('/auth/login?message=check_email');
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;

  if (!email) {
    redirect('/auth/forgot-password?error=missing_email');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/auth/callback?next=/compte`,
  });

  if (error) {
    redirect(
      `/auth/forgot-password?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect('/auth/forgot-password?message=check_email');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const phone = (formData.get('phone') as string) || undefined;

  // 1. Update auth.users metadata
  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      phone,
    },
  });

  if (error) {
    redirect(`/compte?error=${encodeURIComponent(error.message)}`);
  }

  // 2. Sync individual_customers table
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { createClient: createServiceClient } = await import(
      '@supabase/supabase-js'
    );
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update by auth_user_id first, fallback to email
    const { data: customer } = await serviceClient
      .from('individual_customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .limit(1)
      .single();

    const customerId = customer?.id as string | undefined;
    if (!customerId && user.email) {
      const { data: byEmail } = await serviceClient
        .from('individual_customers')
        .select('id')
        .eq('email', user.email)
        .limit(1)
        .single();
      if (byEmail) {
        await serviceClient
          .from('individual_customers')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: phone ?? null,
            auth_user_id: user.id,
          })
          .eq('id', byEmail.id);
      }
    } else if (customerId) {
      await serviceClient
        .from('individual_customers')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone ?? null,
        })
        .eq('id', customerId);
    }
  }

  revalidatePath('/compte');
  redirect('/compte?message=profile_updated');
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();

  const newPassword = formData.get('newPassword') as string;

  if (!newPassword || newPassword.length < 8) {
    redirect('/compte?error=password_too_short');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    redirect(`/compte?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/compte');
  redirect('/compte?message=password_updated');
}

export async function deleteAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Anonymize user data (soft delete - admin can hard delete later)
  await supabase.auth.updateUser({
    data: {
      first_name: '[supprimé]',
      last_name: '[supprimé]',
      phone: null,
      deleted_at: new Date().toISOString(),
    },
  });

  // Sign out
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/?message=account_deleted');
}
