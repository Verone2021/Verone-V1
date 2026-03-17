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
