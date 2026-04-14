import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@verone/utils/supabase/server';

// ============================================================
// Schema — Import fournisseur seul (depuis page entreprise Alibaba)
// ============================================================

const ImportSupplierSchema = z.object({
  name: z.string().min(1, 'Nom du fournisseur requis'),
  country: z.string().nullish(),
  city: z.string().nullish(),
  address: z.string().nullish(),
  year_established: z.number().nullish(),
  employees: z.string().nullish(),
  certifications: z.array(z.string()).nullish(),
  trade_assurance: z.boolean().nullish(),
  verified: z.boolean().nullish(),
  response_rate: z.string().nullish(),
  response_time: z.string().nullish(),
  supplier_score: z.number().nullish(),
  alibaba_store_url: z.string().nullish(),
  delivery_terms: z.string().nullish(),
  specialties: z.array(z.string()).nullish(),
});

// ============================================================
// POST /api/sourcing/import-supplier
// ============================================================

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();

  // Auth — support cookies (navigateur) OU Bearer token (extension Chrome)
  const authHeader = request.headers.get('Authorization');
  const authResult = authHeader?.startsWith('Bearer ')
    ? await supabase.auth.getUser(authHeader.slice(7))
    : await supabase.auth.getUser();
  const user = authResult.data.user;

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = ImportSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Donnees invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  try {
    // country doit etre un code ISO 2 lettres (varchar(2))
    const countryCode = input.country
      ? input.country.length === 2
        ? input.country.toUpperCase()
        : input.country.toLowerCase().includes('chin')
          ? 'CN'
          : input.country.substring(0, 2).toUpperCase()
      : null;

    // supplier_reliability_score est un integer (1-5)
    const reliabilityScore = input.supplier_score
      ? Math.round(input.supplier_score)
      : null;

    // Verifier si le fournisseur existe deja
    const { data: existing } = await supabase
      .from('organisations')
      .select('id, trade_name')
      .or(`trade_name.ilike.%${input.name}%,legal_name.ilike.%${input.name}%`)
      .eq('type', 'supplier')
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Mettre a jour les champs Alibaba manquants
      await supabase
        .from('organisations')
        .update({
          alibaba_store_url: input.alibaba_store_url ?? undefined,
          supplier_reliability_score: reliabilityScore ?? undefined,
          supplier_specialties: input.specialties ?? undefined,
          preferred_comm_channel: 'alibaba',
          country: countryCode ?? undefined,
          certification_labels: input.certifications ?? undefined,
        })
        .eq('id', existing.id);

      return NextResponse.json({
        success: true,
        supplier_id: existing.id,
        supplier_name: existing.trade_name,
        created: false,
        redirect_url: `/organisations/${existing.id}`,
      });
    }

    // Creer le fournisseur
    const { data: newSupplier, error } = await supabase
      .from('organisations')
      .insert({
        trade_name: input.name,
        legal_name: input.name,
        type: 'supplier' as const,
        country: countryCode,
        city: input.city ?? null,
        address_line1: input.address ?? null,
        alibaba_store_url: input.alibaba_store_url ?? null,
        supplier_reliability_score: reliabilityScore,
        supplier_specialties: input.specialties ?? null,
        preferred_comm_channel: 'alibaba',
        certification_labels: input.certifications ?? null,
      })
      .select('id, trade_name')
      .single();

    if (error) {
      console.error('[API sourcing/import-supplier] Creation failed:', error);
      return NextResponse.json(
        { error: 'Erreur creation fournisseur', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      supplier_id: newSupplier.id,
      supplier_name: newSupplier.trade_name,
      created: true,
      redirect_url: `/organisations/${newSupplier.id}`,
    });
  } catch (error) {
    console.error('[API sourcing/import-supplier] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Erreur interne',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
