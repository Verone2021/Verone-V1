/**
 * API Route: POST /api/linkme/users/create
 * Crée un nouvel utilisateur LinkMe via Supabase Admin API
 *
 * 🔐 SECURITE: Requiert authentification admin back-office (owner/admin)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createAdminClient } from '@verone/utils/supabase/server';

import { requireBackofficeAdmin } from '@/lib/guards';
import type { Database } from '@verone/types';

type UserProfileInsert =
  Database['public']['Tables']['user_profiles']['Insert'];
type UserAppRoleInsert =
  Database['public']['Tables']['user_app_roles']['Insert'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
type LinkmeAffiliateInsert =
  Database['public']['Tables']['linkme_affiliates']['Insert'];
type EnseigneRow = Database['public']['Tables']['enseignes']['Row'];
type OrganisationRow = Database['public']['Tables']['organisations']['Row'];

/** Zod: empty string → null for optional fields */
const emptyToNull = z.string().transform(val => (val === '' ? null : val));

const CreateLinkMeUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (min 6 caractères)'),
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  phone: emptyToNull.nullable().optional().default(null),
  role: z.enum(
    ['enseigne_admin', 'enseigne_collaborateur', 'organisation_admin'],
    {
      error:
        'Rôle invalide. Doit être: enseigne_admin, enseigne_collaborateur ou organisation_admin',
    }
  ),
  enseigne_id: emptyToNull.nullable().optional().default(null),
  organisation_id: emptyToNull.nullable().optional().default(null),
  permissions: z.array(z.string()).optional().default([]),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 🔐 GUARD: Vérifier authentification admin back-office
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult; // 401 ou 403
  }
  // guardResult contient { user, organisationId, roleName }

  try {
    const supabaseAdmin = createAdminClient();
    const body: unknown = await request.json();

    // Validation Zod (transforme "" → null automatiquement)
    const parsed = CreateLinkMeUserSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Données invalides';
      return NextResponse.json({ message: firstError }, { status: 400 });
    }

    const {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone,
      role,
      enseigne_id: enseigneId,
      organisation_id: organisationId,
      permissions,
    } = parsed.data;

    // Validation contraintes rôle (logique métier, pas du format)
    if (role === 'enseigne_admin' && !enseigneId) {
      return NextResponse.json(
        { message: 'Un admin enseigne doit être associé à une enseigne' },
        { status: 400 }
      );
    }

    if (role === 'enseigne_collaborateur' && !enseigneId) {
      return NextResponse.json(
        { message: 'Un collaborateur doit être associé à une enseigne' },
        { status: 400 }
      );
    }

    if (role === 'organisation_admin' && !organisationId) {
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
          first_name: firstName,
          last_name: lastName,
        },
        app_metadata: {
          linkme_role: role,
          enseigne_id: enseigneId,
          organisation_id: organisationId,
        },
      });

    if (authError) {
      console.error('Erreur création utilisateur auth:', authError);
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Créer le profil utilisateur
    const profileData: UserProfileInsert = {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      phone,
      app_source: 'linkme',
      user_type: 'staff',
    };

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData);

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
    const roleData: UserAppRoleInsert = {
      user_id: userId,
      app: 'linkme',
      role: role,
      enseigne_id: enseigneId,
      organisation_id: organisationId,
      permissions: permissions,
      is_active: true,
    };

    const { error: roleError } = await supabaseAdmin
      .from('user_app_roles')
      .insert(roleData);

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
    const contactData: ContactInsert = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      is_primary_contact: true, // Premier contact créé = contact principal
      is_active: true,
      notes: `Contact créé automatiquement pour utilisateur LinkMe (${role})`,
      enseigne_id:
        (role === 'enseigne_admin' || role === 'enseigne_collaborateur') &&
        enseigneId
          ? enseigneId
          : null,
      organisation_id:
        role === 'organisation_admin' && organisationId ? organisationId : null,
      owner_type:
        role === 'enseigne_admin' || role === 'enseigne_collaborateur'
          ? 'enseigne'
          : role === 'organisation_admin'
            ? 'organisation'
            : null,
    };

    const { error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert(contactData);

    if (contactError) {
      // Log l'erreur mais ne pas bloquer - le contact est optionnel
      console.error('Erreur création contact (non-bloquant):', contactError);
    }

    // 5. Vérifier si un affilié LinkMe existe déjà pour cette enseigne/organisation
    //    Un affilié est lié à une ENSEIGNE (pas à un utilisateur).
    //    Plusieurs utilisateurs d'une même enseigne partagent le même affilié.
    if (
      role === 'enseigne_admin' ||
      role === 'enseigne_collaborateur' ||
      role === 'organisation_admin'
    ) {
      let existingAffiliate: { id: string } | null = null;

      if (
        (role === 'enseigne_admin' || role === 'enseigne_collaborateur') &&
        enseigneId
      ) {
        const { data } = await supabaseAdmin
          .from('linkme_affiliates')
          .select('id')
          .eq('enseigne_id', enseigneId)
          .maybeSingle();
        existingAffiliate = data;
      } else if (role === 'organisation_admin' && organisationId) {
        const { data } = await supabaseAdmin
          .from('linkme_affiliates')
          .select('id')
          .eq('organisation_id', organisationId)
          .maybeSingle();
        existingAffiliate = data;
      }

      // Créer l'affilié UNIQUEMENT s'il n'existe pas encore
      if (!existingAffiliate) {
        const baseSlug = `${firstName}-${lastName}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

        let displayName = `${firstName} ${lastName}`;

        if (
          (role === 'enseigne_admin' || role === 'enseigne_collaborateur') &&
          enseigneId
        ) {
          const { data: enseigne } = await supabaseAdmin
            .from('enseignes')
            .select('name')
            .eq('id', enseigneId)
            .single<Pick<EnseigneRow, 'name'>>();
          if (enseigne?.name) {
            displayName = enseigne.name;
          }
        } else if (role === 'organisation_admin' && organisationId) {
          const { data: org } = await supabaseAdmin
            .from('organisations')
            .select('trade_name, legal_name')
            .eq('id', organisationId)
            .single<Pick<OrganisationRow, 'trade_name' | 'legal_name'>>();
          if (org) {
            displayName = org.trade_name ?? org.legal_name ?? displayName;
          }
        }

        const affiliateData: LinkmeAffiliateInsert = {
          affiliate_type:
            role === 'enseigne_admin' || role === 'enseigne_collaborateur'
              ? 'enseigne'
              : 'prescripteur',
          display_name: displayName,
          slug: uniqueSlug,
          email: email,
          phone,
          status: 'active',
          default_margin_rate: 20,
          linkme_commission_rate: 5,
          enseigne_id:
            (role === 'enseigne_admin' || role === 'enseigne_collaborateur') &&
            enseigneId
              ? enseigneId
              : null,
          organisation_id:
            role === 'organisation_admin' && organisationId
              ? organisationId
              : null,
        };

        const { error: affiliateError } = await supabaseAdmin
          .from('linkme_affiliates')
          .insert(affiliateData);

        if (affiliateError) {
          console.error(
            'Erreur création affilié (non-bloquant):',
            affiliateError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      userId: userId,
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
