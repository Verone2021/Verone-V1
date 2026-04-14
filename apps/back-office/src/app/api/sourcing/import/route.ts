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

const ImportProductSchema = z.object({
  // Produit
  name: z.string().min(1, 'Nom du produit requis'),
  description: z.string().nullish(),
  technical_description: z.string().nullish(),
  supplier_reference: z.string().nullish(),
  brand: z.string().nullish(),
  source_url: z.string().url('URL invalide'),
  source_platform: z
    .enum(['alibaba', 'zentrada', 'faire', 'ankorstore', 'other'])
    .default('alibaba'),
  images: z.array(z.string()).nullish(),
  cost_price: z.number().nullish(),
  eco_tax: z.number().nullish(),
  target_price: z.number().nullish(),
  weight: z.number().nullish(),
  dim_length: z.number().nullish(),
  dim_width: z.number().nullish(),
  dim_height: z.number().nullish(),
  material: z.string().nullish(),
  color: z.string().nullish(),
  style: z.string().nullish(),
  moq: z.number().nullish(),
  lead_days: z.number().nullish(),

  // Fournisseur
  supplier: z
    .object({
      name: z.string().min(1),
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
    })
    .nullish(),
});

// ============================================================
// POST /api/sourcing/import
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
  const parsed = ImportProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Donnees invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  try {
    // ================================================================
    // STEP 0 : Anti-doublon par URL source
    // ================================================================
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, name')
      .eq('supplier_page_url', input.source_url)
      .limit(1)
      .maybeSingle();

    if (existingProduct) {
      return NextResponse.json(
        {
          error: 'Produit deja importe',
          existing_product_id: existingProduct.id,
          existing_product_name: existingProduct.name,
          redirect_url: `/produits/sourcing/produits/${existingProduct.id}`,
        },
        { status: 409 }
      );
    }

    let supplierId: string | null = null;

    // ================================================================
    // STEP 1 : Créer ou trouver le fournisseur
    // ================================================================
    if (input.supplier) {
      // Chercher d'abord par URL Alibaba (identifiant unique fiable)
      // Puis par nom exact, puis par nom approximatif
      let existingSupplier: { id: string; trade_name: string | null } | null =
        null;

      if (input.supplier.alibaba_store_url) {
        const { data } = await supabase
          .from('organisations')
          .select('id, trade_name')
          .eq('alibaba_store_url', input.supplier.alibaba_store_url)
          .limit(1)
          .maybeSingle();
        existingSupplier = data;
      }

      if (!existingSupplier) {
        // Chercher par nom exact
        const { data } = await supabase
          .from('organisations')
          .select('id, trade_name')
          .or(
            `trade_name.eq.${input.supplier.name},legal_name.eq.${input.supplier.name}`
          )
          .eq('type', 'supplier')
          .limit(1)
          .maybeSingle();
        existingSupplier = data;
      }

      if (existingSupplier) {
        supplierId = existingSupplier.id;

        // Mettre à jour les champs Alibaba si pas encore remplis
        if (input.supplier.alibaba_store_url) {
          const { error: updateErr } = await supabase
            .from('organisations')
            .update({
              alibaba_store_url: input.supplier.alibaba_store_url,
              supplier_reliability_score: input.supplier.supplier_score
                ? Math.round(input.supplier.supplier_score)
                : undefined,
              certification_labels: input.supplier.certifications ?? undefined,
            })
            .eq('id', supplierId);

          if (updateErr) {
            console.error(
              '[API sourcing/import] Supplier update failed:',
              updateErr
            );
          }
        }
      } else {
        // Créer le fournisseur
        const countryCode = toCountryCode(input.supplier.country);

        // Construire les notes avec les infos Alibaba non stockables en colonnes
        const supplierNotes: string[] = [];
        if (input.supplier.trade_assurance)
          supplierNotes.push('Trade Assurance');
        if (input.supplier.verified) supplierNotes.push('Fournisseur verifie');
        if (input.supplier.year_established)
          supplierNotes.push(`Cree en ${input.supplier.year_established}`);
        if (input.supplier.employees)
          supplierNotes.push(`Employes: ${input.supplier.employees}`);
        if (input.supplier.response_rate)
          supplierNotes.push(`Taux reponse: ${input.supplier.response_rate}`);
        if (input.supplier.response_time)
          supplierNotes.push(`Temps reponse: ${input.supplier.response_time}`);
        if (input.supplier.delivery_terms)
          supplierNotes.push(`Incoterms: ${input.supplier.delivery_terms}`);

        const { data: newSupplier, error: supplierError } = await supabase
          .from('organisations')
          .insert({
            trade_name: input.supplier.name,
            legal_name: input.supplier.name,
            type: 'supplier' as const,
            country: countryCode,
            city: input.supplier.city ?? null,
            address_line1: input.supplier.address ?? null,
            alibaba_store_url: input.supplier.alibaba_store_url ?? null,
            supplier_reliability_score: input.supplier.supplier_score
              ? Math.round(input.supplier.supplier_score)
              : null,
            rating: input.supplier.supplier_score ?? null,
            supplier_specialties: input.supplier.specialties ?? null,
            preferred_comm_channel: 'alibaba',
            certification_labels: input.supplier.certifications ?? null,
            notes: supplierNotes.length > 0 ? supplierNotes.join(' | ') : null,
          })
          .select('id')
          .single();

        if (supplierError) {
          console.error(
            '[API sourcing/import] Supplier creation failed:',
            supplierError
          );
          return NextResponse.json(
            {
              error: 'Erreur creation fournisseur',
              details: supplierError.message,
            },
            { status: 500 }
          );
        }

        supplierId = newSupplier.id;
      }
    }

    // ================================================================
    // STEP 2 : Créer le produit sourcing
    // ================================================================
    const sku = `SRC-${Date.now().toString(36).toUpperCase()}`;

    // Dimensions en jsonb
    const dimensions =
      input.dim_length || input.dim_width || input.dim_height
        ? {
            length: input.dim_length ?? null,
            width: input.dim_width ?? null,
            height: input.dim_height ?? null,
          }
        : undefined;

    // Material + color → internal_notes (colonnes inexistantes dans products)
    const noteParts: string[] = [];
    if (input.material) noteParts.push(`Materiau: ${input.material}`);
    if (input.color) noteParts.push(`Couleur: ${input.color}`);
    const internalNotes =
      noteParts.length > 0 ? noteParts.join(' | ') : undefined;

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: input.name,
        sku,
        description: input.description ?? null,
        technical_description: input.technical_description ?? null,
        supplier_reference: input.supplier_reference ?? null,
        brand: input.brand ?? null,
        product_status: 'draft' as const,
        sourcing_status: 'supplier_search',
        sourcing_priority: 'medium',
        cost_price: input.cost_price ?? null,
        eco_tax_default: input.eco_tax ?? null,
        target_price: input.target_price ?? null,
        weight: input.weight ?? null,
        dimensions,
        style: input.style ?? null,
        // condition: laisser le default DB ('new')
        supplier_id: supplierId,
        supplier_moq: input.moq ?? null,
        supplier_page_url: input.source_url,
        sourcing_channel: input.source_platform,
        internal_notes: internalNotes ?? null,
      })
      .select('id, name')
      .single();

    if (productError) {
      console.error(
        '[API sourcing/import] Product creation failed:',
        productError
      );
      return NextResponse.json(
        { error: 'Erreur creation produit', details: productError.message },
        { status: 500 }
      );
    }

    const productId = product.id;

    // ================================================================
    // STEP 3 : URL source dans sourcing_urls (PAS les images)
    // ================================================================
    const { error: urlError } = await supabase.from('sourcing_urls').insert({
      product_id: productId,
      url: input.source_url,
      platform: input.source_platform,
      label: `Import ${input.source_platform}`,
    });

    if (urlError) {
      console.error(
        '[API sourcing/import] Sourcing URL insert failed:',
        urlError
      );
    }

    // ================================================================
    // STEP 4 : Images dans product_images + sourcing_photos
    // ================================================================
    if (input.images && input.images.length > 0) {
      const validImages = input.images
        .filter(url => url && !url.includes('icon') && !url.includes('logo'))
        .slice(0, 10);

      if (validImages.length > 0) {
        // product_images — pour l'affichage catalogue
        const productImageRows = validImages.map((url, i) => ({
          product_id: productId,
          public_url: url,
          storage_path: `external/${input.source_platform}/${sku}-${i}`,
          display_order: i,
          is_primary: i === 0,
          image_type: (i === 0 ? 'primary' : 'gallery') as
            | 'primary'
            | 'gallery',
          alt_text: `${input.name} - Photo ${i + 1}`,
        }));

        const { error: imgError } = await supabase
          .from('product_images')
          .insert(productImageRows);

        if (imgError) {
          console.error(
            '[API sourcing/import] Product images insert failed:',
            imgError
          );
        }

        // sourcing_photos — pour le suivi sourcing
        const sourcingPhotoRows = validImages.map((url, i) => ({
          product_id: productId,
          public_url: url,
          storage_path: `external/${input.source_platform}/${sku}-${i}`,
          photo_type: 'supplier_catalog',
          caption: `Import ${input.source_platform} - Photo ${i + 1}`,
          sort_order: i,
        }));

        const { error: photoError } = await supabase
          .from('sourcing_photos')
          .insert(sourcingPhotoRows);

        if (photoError) {
          console.error(
            '[API sourcing/import] Sourcing photos insert failed:',
            photoError
          );
        }
      }
    }

    // ================================================================
    // STEP 5 : Fournisseur candidat (upsert pour éviter UNIQUE violation)
    // ================================================================
    if (supplierId) {
      const { error: candidateError } = await supabase
        .from('sourcing_candidate_suppliers')
        .upsert(
          {
            product_id: productId,
            supplier_id: supplierId,
            status: 'identified',
            quoted_price: input.cost_price ?? null,
            quoted_moq: input.moq ?? null,
            quoted_lead_days: input.lead_days ?? null,
            notes: `Import automatique depuis ${input.source_platform}`,
          },
          { onConflict: 'product_id,supplier_id' }
        );

      if (candidateError) {
        console.error(
          '[API sourcing/import] Candidate supplier upsert failed:',
          candidateError
        );
      }
    }

    return NextResponse.json({
      success: true,
      product_id: productId,
      product_name: product.name,
      supplier_id: supplierId,
      redirect_url: `/produits/sourcing/produits/${productId}`,
    });
  } catch (error) {
    console.error('[API sourcing/import] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Erreur interne',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
