import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@verone/utils/supabase/server';

// ============================================================
// Schema de validation pour l'import produit sourcing
// ============================================================

const PriceTierSchema = z.object({
  min_qty: z.number().optional(),
  max_qty: z.number().optional(),
  price: z.number(),
  currency: z.string().default('EUR'),
});

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
  images: z.array(z.string().url()).nullish(),
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
  condition: z.string().nullish(),
  moq: z.number().nullish(),
  lead_days: z.number().nullish(),
  price_tiers: z.array(PriceTierSchema).nullish(),

  // Fournisseur (optionnel — cree ou lie si fourni)
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
      alibaba_store_url: z.string().url().nullish(),
      delivery_terms: z.string().nullish(),
      specialties: z.array(z.string()).nullish(),
    })
    .optional(),
});

type ImportProductInput = z.infer<typeof ImportProductSchema>;

// ============================================================
// POST /api/sourcing/import
// ============================================================

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();

  // Auth check — support cookies (navigateur) OU Bearer token (extension Chrome)
  const authHeader = request.headers.get('Authorization');
  const authResult = authHeader?.startsWith('Bearer ')
    ? await supabase.auth.getUser(authHeader.slice(7))
    : await supabase.auth.getUser();
  const user = authResult.data.user;

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  // Parse and validate body
  const body: unknown = await request.json();
  const parsed = ImportProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Donnees invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input: ImportProductInput = parsed.data;

  try {
    let supplierId: string | null = null;

    // ---- Step 1: Creer ou trouver le fournisseur ----
    if (input.supplier) {
      // Chercher par nom ou URL Alibaba
      const { data: existingSupplier } = await supabase
        .from('organisations')
        .select('id, trade_name')
        .or(
          `trade_name.ilike.%${input.supplier.name}%,legal_name.ilike.%${input.supplier.name}%`
        )
        .eq('type', 'supplier')
        .limit(1)
        .maybeSingle();

      if (existingSupplier) {
        supplierId = existingSupplier.id;

        // Mettre a jour les champs Alibaba si pas encore remplis
        if (input.supplier.alibaba_store_url) {
          await supabase
            .from('organisations')
            .update({
              alibaba_store_url: input.supplier.alibaba_store_url,
              supplier_reliability_score:
                input.supplier.supplier_score ?? undefined,
            })
            .eq('id', supplierId);
        }
      } else {
        // Creer le fournisseur
        // country doit etre un code ISO 2 lettres (varchar(2))
        const countryCode = input.supplier.country
          ? input.supplier.country.length === 2
            ? input.supplier.country.toUpperCase()
            : input.supplier.country.toLowerCase().includes('chin')
              ? 'CN'
              : input.supplier.country.substring(0, 2).toUpperCase()
          : null;

        // supplier_reliability_score est un integer (1-5), pas un decimal
        const reliabilityScore = input.supplier.supplier_score
          ? Math.round(input.supplier.supplier_score)
          : null;

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
            supplier_reliability_score: reliabilityScore,
            supplier_specialties: input.supplier.specialties ?? null,
            preferred_comm_channel: 'alibaba',
            certification_labels: input.supplier.certifications ?? null,
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

    // ---- Step 2: Creer le produit sourcing ----
    // Generer un SKU temporaire pour le brouillon
    const skuPrefix = 'SRC';
    const skuTimestamp = Date.now().toString(36).toUpperCase();
    const sku = `${skuPrefix}-${skuTimestamp}`;

    // Construire les dimensions en jsonb si fournies
    const dimensions =
      input.dim_length || input.dim_width || input.dim_height
        ? {
            length: input.dim_length ?? null,
            width: input.dim_width ?? null,
            height: input.dim_height ?? null,
          }
        : null;

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
        condition: input.condition ?? 'Neuf',
        supplier_id: supplierId,
        supplier_moq: input.moq ?? null,
        supplier_page_url: input.source_url,
        sourcing_channel: input.source_platform,
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

    // ---- Step 3: Ajouter l'URL source ----
    await supabase.from('sourcing_urls').insert({
      product_id: productId,
      url: input.source_url,
      platform: input.source_platform,
      label: `Import ${input.source_platform}`,
    });

    // ---- Step 4: Ajouter les prix par palier ----
    if (input.price_tiers && input.price_tiers.length > 0) {
      const priceEntries = input.price_tiers.map(tier => ({
        product_id: productId,
        supplier_id: supplierId,
        price: tier.price,
        currency: tier.currency,
        quantity: tier.min_qty ?? null,
        proposed_by: 'supplier' as const,
        notes: tier.max_qty
          ? `${tier.min_qty ?? 1}-${tier.max_qty} pcs`
          : tier.min_qty
            ? `>= ${tier.min_qty} pcs`
            : null,
      }));

      await supabase.from('sourcing_price_history').insert(priceEntries);
    }

    // ---- Step 5: Ajouter le fournisseur comme candidat ----
    if (supplierId) {
      await supabase.from('sourcing_candidate_suppliers').insert({
        product_id: productId,
        supplier_id: supplierId,
        status: 'identified',
        quoted_price: input.cost_price ?? null,
        quoted_moq: input.moq ?? null,
        quoted_lead_days: input.lead_days ?? null,
        notes: `Import automatique depuis ${input.source_platform}`,
      });
    }

    // ---- Step 6: Stocker les URLs des images ----
    if (input.images && input.images.length > 0) {
      const imageUrls = input.images
        .filter(url => !url.includes('icon') && !url.includes('logo'))
        .slice(0, 10);

      if (imageUrls.length > 0) {
        const urlEntries = imageUrls.map((url, i) => ({
          product_id: productId,
          url,
          platform: input.source_platform,
          label: `Photo ${i + 1}`,
        }));

        await supabase.from('sourcing_urls').insert(urlEntries);
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
