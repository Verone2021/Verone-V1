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
    const validRoles = [
      'enseigne_admin',
      'organisation_admin',
      'org_independante',
      'client',
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          message:
            'Rôle invalide. Doit être: enseigne_admin, organisation_admin, org_independante, ou client',
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

    if (role === 'org_independante' && !organisation_id) {
      return NextResponse.json(
        {
          message:
            'Une org. indépendante doit être associée à une organisation',
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
    // Mapper le rôle LinkMe vers l'enum user_role_type valide
    // enseigne_admin/organisation_admin → partner_manager, client → customer
    const profileRole = role === 'client' ? 'customer' : 'partner_manager';

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userId,
        first_name,
        last_name,
        phone: phone || null,
        app: 'linkme',
        app_source: 'linkme',
        role: profileRole,
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

    // 4. Créer le contact et le lier à l'enseigne/organisation
    const contactData: Record<string, unknown> = {
      first_name,
      last_name,
      email,
      phone: phone || null,
      is_primary_contact: true, // Premier contact créé = contact principal
      is_active: true,
      notes: `Contact créé automatiquement pour utilisateur LinkMe (${role})`,
    };

    // Lier à l'entité appropriée selon le rôle
    if (role === 'enseigne_admin' && enseigne_id) {
      contactData.enseigne_id = enseigne_id;
      contactData.owner_type = 'enseigne';
    } else if (role === 'organisation_admin' && organisation_id) {
      contactData.organisation_id = organisation_id;
      contactData.owner_type = 'organisation';
    } else if (role === 'org_independante' && organisation_id) {
      contactData.organisation_id = organisation_id;
      contactData.owner_type = 'organisation';
    }

    const { error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert(contactData);

    if (contactError) {
      // Log l'erreur mais ne pas bloquer - le contact est optionnel
      console.error('Erreur création contact (non-bloquant):', contactError);
    }

    // 5. Créer l'affilié LinkMe pour enseigne_admin et org_independante
    // (organisation_admin n'a pas besoin d'affilié - ils voient via leur org)
    if (role === 'enseigne_admin' || role === 'org_independante') {
      // Générer un slug unique basé sur le nom
      const baseSlug = `${first_name}-${last_name}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      // Récupérer le nom de l'enseigne ou organisation pour le display_name
      let displayName = `${first_name} ${last_name}`;

      if (role === 'enseigne_admin' && enseigne_id) {
        const { data: enseigne } = await supabaseAdmin
          .from('enseignes')
          .select('name')
          .eq('id', enseigne_id)
          .single();
        if (enseigne?.name) {
          displayName = enseigne.name;
        }
      } else if (role === 'org_independante' && organisation_id) {
        const { data: org } = await supabaseAdmin
          .from('organisations')
          .select('trade_name, legal_name')
          .eq('id', organisation_id)
          .single();
        if (org) {
          displayName = org.trade_name || org.legal_name || displayName;
        }
      }

      const affiliateData: Record<string, unknown> = {
        affiliate_type: role === 'enseigne_admin' ? 'enseigne' : 'prescripteur',
        display_name: displayName,
        slug: uniqueSlug,
        email: email,
        phone: phone || null,
        status: 'active',
        default_margin_rate: 20,
        linkme_commission_rate: 5,
      };

      // Lier à l'entité appropriée
      if (role === 'enseigne_admin' && enseigne_id) {
        affiliateData.enseigne_id = enseigne_id;
      } else if (role === 'org_independante' && organisation_id) {
        affiliateData.organisation_id = organisation_id;
      }

      const { error: affiliateError } = await supabaseAdmin
        .from('linkme_affiliates')
        .insert(affiliateData);

      if (affiliateError) {
        // Log l'erreur mais ne pas bloquer - l'affilié peut être créé manuellement
        console.error(
          'Erreur création affilié (non-bloquant):',
          affiliateError
        );
      }
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
