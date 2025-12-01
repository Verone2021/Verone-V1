/**
 * API Route: POST /api/linkme/users/create
 * Crée un nouvel utilisateur LinkMe via Supabase Admin API
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

// Client Admin Supabase (avec service_role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      role,
      enseigne_id,
      organisation_id,
      permissions = [],
    } = body;

    // Validation
    if (!email || !password || !first_name || !last_name || !role) {
      return NextResponse.json(
        { message: 'Email, mot de passe, prénom, nom et rôle sont requis' },
        { status: 400 }
      );
    }

    // Validation rôle
    const validRoles = ['enseigne_admin', 'organisation_admin', 'client'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          message:
            'Rôle invalide. Doit être: enseigne_admin, organisation_admin, ou client',
        },
        { status: 400 }
      );
    }

    // Validation contraintes rôle
    if (role === 'enseigne_admin' && !enseigne_id) {
      return NextResponse.json(
        { message: 'Un admin enseigne doit être associé à une enseigne' },
        { status: 400 }
      );
    }

    if (role === 'organisation_admin' && !organisation_id) {
      return NextResponse.json(
        {
          message: 'Un admin organisation doit être associé à une organisation',
        },
        { status: 400 }
      );
    }

    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirmer l'email
        user_metadata: {
          first_name,
          last_name,
        },
        app_metadata: {
          linkme_role: role,
          enseigne_id,
          organisation_id,
        },
      });

    if (authError) {
      console.error('Erreur création utilisateur auth:', authError);
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Créer le profil utilisateur
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userId,
        first_name,
        last_name,
        phone: phone || null,
        app_source: 'linkme',
        role: role,
      });

    if (profileError) {
      console.error('Erreur création profil:', profileError);
      // Rollback: supprimer l'utilisateur auth
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          message:
            'Erreur lors de la création du profil: ' + profileError.message,
        },
        { status: 500 }
      );
    }

    // 3. Créer le rôle dans user_app_roles
    const { error: roleError } = await supabaseAdmin
      .from('user_app_roles')
      .insert({
        user_id: userId,
        app: 'linkme',
        role: role,
        enseigne_id: enseigne_id || null,
        organisation_id: organisation_id || null,
        permissions: permissions,
        is_active: true,
      });

    if (roleError) {
      console.error('Erreur création rôle:', roleError);
      // Rollback: supprimer profil et utilisateur
      await supabaseAdmin.from('user_profiles').delete().eq('user_id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { message: 'Erreur lors de la création du rôle: ' + roleError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      email: email,
      message: 'Utilisateur créé avec succès',
    });
  } catch (error) {
    console.error('Erreur API create user:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
