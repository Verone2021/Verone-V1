import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@verone/utils/supabase/server';

// ============================================================
// Mapping pays → code ISO 2 lettres
// ============================================================

const COUNTRY_MAP: Record<string, string> = {
  china: 'CN',
  chine: 'CN',
  vietnam: 'VN',
  germany: 'DE',
  allemagne: 'DE',
  france: 'FR',
  india: 'IN',
  inde: 'IN',
  taiwan: 'TW',
  'south korea': 'KR',
  italy: 'IT',
  italie: 'IT',
  spain: 'ES',
  espagne: 'ES',
  turkey: 'TR',
  turquie: 'TR',
  thailand: 'TH',
  thailande: 'TH',
  indonesia: 'ID',
  indonesie: 'ID',
  bangladesh: 'BD',
  pakistan: 'PK',
  portugal: 'PT',
  netherlands: 'NL',
  'pays-bas': 'NL',
  japan: 'JP',
  japon: 'JP',
  'united states': 'US',
  'united kingdom': 'GB',
  brazil: 'BR',
  bresil: 'BR',
  poland: 'PL',
  pologne: 'PL',
  romania: 'RO',
  roumanie: 'RO',
  belgium: 'BE',
  belgique: 'BE',
  morocco: 'MA',
  maroc: 'MA',
};

function toCountryCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return COUNTRY_MAP[trimmed.toLowerCase()] ?? null;
}

// ============================================================
// Schema Zod
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

  // --- Auth : cookies OU Bearer token ---
  const authHeader = request.headers.get('Authorization');
  const authResult = authHeader?.startsWith('Bearer ')
    ? await supabase.auth.getUser(authHeader.slice(7))
    : await supabase.auth.getUser();
  const user = authResult.data.user;

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  // --- Validation Zod ---
  const body: unknown = await request.json();
  const parsed = ImportSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Donnees invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const countryCode = toCountryCode(input.country);
  const reliabilityScore = input.supplier_score
    ? Math.round(input.supplier_score)
    : null;

  try {
    // Échapper les wildcards SQL
    const escapedName = input.name.replace(/[%_]/g, '\\$&');

    // Chercher si le fournisseur existe déjà
    const { data: existing } = await supabase
      .from('organisations')
      .select('id, trade_name')
      .or(`trade_name.ilike.%${escapedName}%,legal_name.ilike.%${escapedName}%`)
      .eq('type', 'supplier')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Mettre à jour les champs manquants
      const { error: updateErr } = await supabase
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

      if (updateErr) {
        console.error(
          '[API sourcing/import-supplier] Update failed:',
          updateErr
        );
      }

      return NextResponse.json({
        success: true,
        supplier_id: existing.id,
        supplier_name: existing.trade_name,
        created: false,
        redirect_url: `/organisations/${existing.id}`,
      });
    }

    // Construire les notes avec les infos Alibaba
    const supplierNotes: string[] = [];
    if (input.trade_assurance) supplierNotes.push('Trade Assurance');
    if (input.verified) supplierNotes.push('Fournisseur verifie');
    if (input.year_established)
      supplierNotes.push(`Cree en ${input.year_established}`);
    if (input.employees) supplierNotes.push(`Employes: ${input.employees}`);
    if (input.response_rate)
      supplierNotes.push(`Taux reponse: ${input.response_rate}`);
    if (input.response_time)
      supplierNotes.push(`Temps reponse: ${input.response_time}`);
    if (input.delivery_terms)
      supplierNotes.push(`Incoterms: ${input.delivery_terms}`);

    // Créer le fournisseur
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
        rating: input.supplier_score ?? null,
        supplier_specialties: input.specialties ?? null,
        preferred_comm_channel: 'alibaba',
        certification_labels: input.certifications ?? null,
        notes: supplierNotes.length > 0 ? supplierNotes.join(' | ') : null,
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
