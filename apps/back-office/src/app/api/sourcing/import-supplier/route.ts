import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@verone/utils/supabase/server';

// ============================================================
// Schema — Import fournisseur seul (depuis page entreprise Alibaba)
// ============================================================

const ImportSupplierSchema = z.object({
  name: z.string().min(1, 'Nom du fournisseur requis'),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  year_established: z.number().optional(),
  employees: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  trade_assurance: z.boolean().optional(),
  verified: z.boolean().optional(),
  response_rate: z.string().optional(),
  response_time: z.string().optional(),
  supplier_score: z.number().optional(),
  alibaba_store_url: z.string().optional(),
  delivery_terms: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});

// ============================================================
// POST /api/sourcing/import-supplier
// ============================================================

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    // Verifier si le fournisseur existe deja
    const { data: existing } = await supabase
      .from('organisations')
      .select('id, trade_name')
      .or(`trade_name.ilike.%${input.name}%,legal_name.ilike.%${input.name}%`)
      .eq('is_supplier', true)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Mettre a jour les champs Alibaba manquants
      await supabase
        .from('organisations')
        .update({
          alibaba_store_url: input.alibaba_store_url ?? undefined,
          supplier_reliability_score: input.supplier_score ?? undefined,
          supplier_specialties: input.specialties ?? undefined,
          preferred_comm_channel: 'alibaba',
          country: input.country ?? undefined,
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
        is_supplier: true,
        is_customer: false,
        country: input.country ?? null,
        city: input.city ?? null,
        address_line1: input.address ?? null,
        alibaba_store_url: input.alibaba_store_url ?? null,
        supplier_reliability_score: input.supplier_score ?? null,
        supplier_specialties: input.specialties ?? null,
        preferred_comm_channel: 'alibaba',
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
