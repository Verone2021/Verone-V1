/**
 * API Route: POST /api/linkme/selections/create
 * Crée une nouvelle sélection LinkMe avec ses produits
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

interface ProductInput {
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
}

interface CreateSelectionInput {
  user_id: string;
  name: string;
  description?: string | null;
  status: 'draft' | 'active';
  products: ProductInput[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSelectionInput = await request.json();
    const { user_id, name, description, status, products } = body;

    // Validation
    if (!user_id || !name) {
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
      .eq('user_id', user_id)
      .eq('app', 'linkme')
      .single();

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

    const { data: existingAffiliate } = await existingAffiliateQuery.single();

    if (existingAffiliate) {
      affiliateId = existingAffiliate.id;
    } else {
      // Créer un nouvel affilié
      // Récupérer les infos de l'utilisateur pour le display_name
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('user_id', user_id)
        .single();

      const { data: authUser } =
        await supabaseAdmin.auth.admin.getUserById(user_id);

      const displayName = userProfile
        ? `${userProfile.first_name} ${userProfile.last_name}`
        : authUser?.user?.email || 'Affilié';

      // Générer un slug unique
      const baseSlug = displayName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      // Note: linkme_affiliates n'a pas de user_id ni max_margin_rate
      const affiliateData: Record<string, unknown> = {
        affiliate_type:
          userRole.role === 'enseigne_admin' ? 'enseigne' : 'prescripteur',
        display_name: displayName,
        slug: uniqueSlug,
        email: authUser?.user?.email,
        status: 'active',
        default_margin_rate: 20,
        linkme_commission_rate: 5,
      };

      // Lier à l'entité appropriée
      if (userRole.enseigne_id) {
        affiliateData.enseigne_id = userRole.enseigne_id;
      }
      if (userRole.organisation_id) {
        affiliateData.organisation_id = userRole.organisation_id;
      }

      const { data: newAffiliate, error: affiliateError } = await supabaseAdmin
        .from('linkme_affiliates')
        .insert(affiliateData)
        .select('id')
        .single();

      if (affiliateError || !newAffiliate) {
        console.error('Erreur création affilié:', affiliateError);
        return NextResponse.json(
          {
            message:
              "Erreur lors de la création de l'affilié: " +
              (affiliateError?.message || 'Erreur inconnue'),
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
    const { data: selection, error: selectionError } = await supabaseAdmin
      .from('linkme_selections')
      .insert({
        affiliate_id: affiliateId,
        name,
        slug: selectionSlug,
        description: description || null,
        status,
        is_public: status === 'active',
        products_count: products.length,
        views_count: 0,
        orders_count: 0,
        total_revenue: 0,
      })
      .select('id, name, slug')
      .single();

    if (selectionError || !selection) {
      console.error('Erreur création sélection:', selectionError);
      return NextResponse.json(
        {
          message:
            'Erreur lors de la création de la sélection: ' +
            (selectionError?.message || 'Erreur inconnue'),
        },
        { status: 500 }
      );
    }

    // 5. Ajouter les produits à la sélection
    const selectionItems = products.map((p, index) => ({
      selection_id: selection.id,
      product_id: p.product_id,
      base_price_ht: p.base_price_ht,
      margin_rate: p.margin_rate,
      display_order: index + 1,
      is_featured: false,
    }));

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
