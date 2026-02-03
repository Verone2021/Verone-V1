/**
 * API Route: POST /api/linkme/selections/create
 * Crée une nouvelle sélection LinkMe avec ses produits
 *
 * 🔐 SECURITE: Requiert authentification admin back-office (owner/admin)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

import { requireBackofficeAdmin } from '@/lib/guards';
import type { Database } from '@verone/types';

type UserAppRoleRow = Database['public']['Tables']['user_app_roles']['Row'];
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type LinkmeAffiliateRow =
  Database['public']['Tables']['linkme_affiliates']['Row'];
type LinkmeAffiliateInsert =
  Database['public']['Tables']['linkme_affiliates']['Insert'];
type LinkmeSelectionRow =
  Database['public']['Tables']['linkme_selections']['Row'];
type LinkmeSelectionInsert =
  Database['public']['Tables']['linkme_selections']['Insert'];
type LinkmeSelectionItemInsert =
  Database['public']['Tables']['linkme_selection_items']['Insert'];

interface IProductInput {
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
}

interface ICreateSelectionInput {
  user_id: string;
  name: string;
  description?: string | null;
  status: 'draft' | 'active';
  products: IProductInput[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 🔐 GUARD: Vérifier authentification admin back-office
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult; // 401 ou 403
  }

  try {
    const supabaseAdmin = createAdminClient();
    const body = (await request.json()) as ICreateSelectionInput;
    const { user_id: userId, name, description, status, products } = body;

    // Validation
    if (!userId || !name) {
      return NextResponse.json(
        { message: 'user_id et name sont requis' },
        { status: 400 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { message: 'Au moins un produit est requis' },
        { status: 400 }
      );
    }

    // 1. Vérifier que l'utilisateur existe et récupérer son affilié
    const { data: userRole, error: userRoleError } = await supabaseAdmin
      .from('user_app_roles')
      .select('user_id, role, enseigne_id, organisation_id')
      .eq('user_id', userId)
      .eq('app', 'linkme')
      .single<
        Pick<
          UserAppRoleRow,
          'user_id' | 'role' | 'enseigne_id' | 'organisation_id'
        >
      >();

    if (userRoleError || !userRole) {
      return NextResponse.json(
        { message: 'Utilisateur LinkMe non trouvé' },
        { status: 404 }
      );
    }

    // 2. Trouver ou créer l'affilié pour cet utilisateur
    // Note: linkme_affiliates n'a pas de colonne user_id, on cherche par organisation_id ou enseigne_id
    let affiliateId: string;

    // Chercher un affilié existant par organisation ou enseigne
    let existingAffiliateQuery = supabaseAdmin
      .from('linkme_affiliates')
      .select('id');

    if (userRole.organisation_id) {
      existingAffiliateQuery = existingAffiliateQuery.eq(
        'organisation_id',
        userRole.organisation_id
      );
    } else if (userRole.enseigne_id) {
      existingAffiliateQuery = existingAffiliateQuery.eq(
        'enseigne_id',
        userRole.enseigne_id
      );
    }

    const { data: existingAffiliate } =
      await existingAffiliateQuery.single<Pick<LinkmeAffiliateRow, 'id'>>();

    if (existingAffiliate) {
      affiliateId = existingAffiliate.id;
    } else {
      // Créer un nouvel affilié
      // Récupérer les infos de l'utilisateur pour le display_name
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('user_id', userId)
        .single<Pick<UserProfileRow, 'first_name' | 'last_name'>>();

      const { data: authUser } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      const displayName = userProfile
        ? `${userProfile.first_name ?? ''} ${userProfile.last_name ?? ''}`.trim()
        : (authUser?.user?.email ?? 'Affilié');

      // Générer un slug unique
      const baseSlug = displayName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      // Note: linkme_affiliates n'a pas de user_id ni max_margin_rate
      const affiliateData: LinkmeAffiliateInsert = {
        affiliate_type:
          userRole.role === 'enseigne_admin' ? 'enseigne' : 'prescripteur',
        display_name: displayName,
        slug: uniqueSlug,
        email: authUser?.user?.email ?? null,
        status: 'active',
        default_margin_rate: 20,
        linkme_commission_rate: 5,
        enseigne_id: userRole.enseigne_id ?? null,
        organisation_id: userRole.organisation_id ?? null,
      };

      const { data: newAffiliate, error: affiliateError } = await supabaseAdmin
        .from('linkme_affiliates')
        .insert(affiliateData)
        .select('id')
        .single<Pick<LinkmeAffiliateRow, 'id'>>();

      if (affiliateError || !newAffiliate) {
        console.error('Erreur création affilié:', affiliateError);
        return NextResponse.json(
          {
            message:
              "Erreur lors de la création de l'affilié: " +
              (affiliateError?.message ?? 'Erreur inconnue'),
          },
          { status: 500 }
        );
      }

      affiliateId = newAffiliate.id;
    }

    // 3. Générer un slug unique pour la sélection
    const selectionBaseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const selectionSlug = `${selectionBaseSlug}-${Date.now().toString(36)}`;

    // 4. Créer la sélection
    const selectionData: LinkmeSelectionInsert = {
      affiliate_id: affiliateId,
      name,
      slug: selectionSlug,
      description: description ?? null,
      // published_at = NOW() si status === 'active', sinon NULL (brouillon)
      published_at: status === 'active' ? new Date().toISOString() : null,
      products_count: products.length,
      views_count: 0,
      orders_count: 0,
      total_revenue: 0,
    };

    const { data: selection, error: selectionError } = await supabaseAdmin
      .from('linkme_selections')
      .insert(selectionData)
      .select('id, name, slug')
      .single<Pick<LinkmeSelectionRow, 'id' | 'name' | 'slug'>>();

    if (selectionError || !selection) {
      console.error('Erreur création sélection:', selectionError);
      return NextResponse.json(
        {
          message:
            'Erreur lors de la création de la sélection: ' +
            (selectionError?.message ?? 'Erreur inconnue'),
        },
        { status: 500 }
      );
    }

    // 5. Ajouter les produits à la sélection
    const selectionItems: LinkmeSelectionItemInsert[] = products.map(
      (p, index) => ({
        selection_id: selection.id,
        product_id: p.product_id,
        base_price_ht: p.base_price_ht,
        margin_rate: p.margin_rate,
        display_order: index + 1,
        is_featured: false,
      })
    );

    const { error: itemsError } = await supabaseAdmin
      .from('linkme_selection_items')
      .insert(selectionItems);

    if (itemsError) {
      console.error('Erreur ajout produits:', itemsError);
      // Rollback: supprimer la sélection
      await supabaseAdmin
        .from('linkme_selections')
        .delete()
        .eq('id', selection.id);
      return NextResponse.json(
        {
          message: "Erreur lors de l'ajout des produits: " + itemsError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      selection: {
        id: selection.id,
        name: selection.name,
        slug: selection.slug,
      },
      message: 'Sélection créée avec succès',
    });
  } catch (error) {
    console.error('Erreur API create selection:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
