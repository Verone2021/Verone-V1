import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@verone/utils/supabase/server';
import type { Database } from '@verone/types';
import {
  uploadImageToCloudflare,
  isCloudflareConfigured,
} from '@verone/utils/cloudflare/images';

export const maxDuration = 60;

/**
 * Crée un client Supabase qui exécute ses queries DB dans le contexte du
 * Bearer token reçu (sinon RLS s'exécute en anon et bloque les writes).
 */
function createAuthedClient(bearerToken: string) {
  return createSupabaseClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      global: {
        headers: { Authorization: `Bearer ${bearerToken}` },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

// ============================================================
// CORS — autorise le plugin Chrome + back-office
// ============================================================

const ALLOWED_ORIGIN_PATTERNS = [
  /^chrome-extension:\/\//,
  /^https:\/\/verone-backoffice\.vercel\.app$/,
  /^http:\/\/localhost:3000$/,
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGIN_PATTERNS.some(p => p.test(origin)) ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

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
  manufacturer: z.string().nullish(),
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
  moq: z.number().int().nullish(),
  lead_days: z.number().int().nullish(),
  brand_ids: z.array(z.string().uuid()).nullish(),

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
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);
  const cookieClient = await createServerClient();

  // --- Auth : cookies OU Bearer token ---
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  const authResult = bearerToken
    ? await cookieClient.auth.getUser(bearerToken)
    : await cookieClient.auth.getUser();
  const user = authResult.data.user;

  if (!user) {
    return NextResponse.json(
      { error: 'Non autorise' },
      { status: 401, headers: cors }
    );
  }

  // Client utilisé pour les queries DB : si Bearer, il faut un client
  // qui transmet ce token aux requêtes (sinon RLS s'exécute en anon).
  const supabase = bearerToken ? createAuthedClient(bearerToken) : cookieClient;

  // --- Validation Zod ---
  const body: unknown = await request.json();
  const parsed = ImportProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Donnees invalides', details: parsed.error.flatten() },
      { status: 400, headers: cors }
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
        { status: 409, headers: cors }
      );
    }

    let supplierId: string | null = null;
    let supplierIsNew = false;

    // ================================================================
    // STEP 1 : Créer ou trouver le fournisseur
    // ================================================================
    if (input.supplier) {
      let existingSupplier: { id: string; trade_name: string | null } | null =
        null;

      // 1. Par URL boutique Alibaba (identifiant unique du fournisseur sur Alibaba)
      if (input.supplier.alibaba_store_url) {
        const { data } = await supabase
          .from('organisations')
          .select('id, trade_name')
          .eq('alibaba_store_url', input.supplier.alibaba_store_url)
          .eq('type', 'supplier')
          .limit(1)
          .maybeSingle();
        existingSupplier = data;
      }

      // 2. Par domaine du website source (pour fournisseurs hors marketplace)
      if (!existingSupplier) {
        try {
          const sourceHost = new URL(input.source_url).hostname.replace(
            'www.',
            ''
          );
          if (
            !sourceHost.includes('alibaba.com') &&
            !sourceHost.includes('1688.com') &&
            !sourceHost.includes('zentrada.com')
          ) {
            const { data } = await supabase
              .from('organisations')
              .select('id, trade_name')
              .ilike('website', `%${sourceHost}%`)
              .limit(1)
              .maybeSingle();
            existingSupplier = data;
          }
        } catch (_e) {
          // URL invalide — ignorer
        }
      }

      // 3. Par nom (2 requêtes séparées au lieu de .or() qui casse avec
      //    les virgules dans le nom — ex: "Shenzhen XYZ Co., Ltd.")
      if (!existingSupplier) {
        const supplierName = input.supplier.name.trim();
        const { data: byTradeName } = await supabase
          .from('organisations')
          .select('id, trade_name')
          .ilike('trade_name', supplierName)
          .eq('type', 'supplier')
          .limit(1)
          .maybeSingle();
        existingSupplier = byTradeName;

        if (!existingSupplier) {
          const { data: byLegalName } = await supabase
            .from('organisations')
            .select('id, trade_name')
            .ilike('legal_name', supplierName)
            .eq('type', 'supplier')
            .limit(1)
            .maybeSingle();
          existingSupplier = byLegalName;
        }
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
            { status: 500, headers: cors }
          );
        }

        supplierId = newSupplier.id;
        supplierIsNew = true;
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
        manufacturer: input.manufacturer ?? null,
        product_status: 'draft' as const,
        creation_mode: 'sourcing',
        sourcing_status: 'supplier_search',
        sourcing_priority: 'medium',
        cost_price: input.cost_price ?? null,
        eco_tax_default: input.eco_tax ?? null,
        target_price: input.target_price ?? null,
        weight: input.weight ?? null,
        dimensions,
        style: input.style ?? null,
        brand_ids: input.brand_ids ?? null,
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
        { status: 500, headers: cors }
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
    // STEP 4 : Telecharger les images depuis la source (Alibaba, etc.)
    // puis upload vers Cloudflare Images (le trigger DB genere public_url)
    // ================================================================
    if (input.images && input.images.length > 0 && isCloudflareConfigured()) {
      const validImages = input.images
        .filter(url => url && !url.includes('icon') && !url.includes('logo'))
        .slice(0, 10);

      for (let i = 0; i < validImages.length; i++) {
        const imageUrl = validImages[i];
        try {
          const imgResponse = await fetch(imageUrl);
          if (!imgResponse.ok) continue;

          const contentType =
            imgResponse.headers.get('content-type') ?? 'image/jpeg';
          const ext = contentType.includes('png') ? 'png' : 'jpg';
          const arrayBuffer = await imgResponse.arrayBuffer();

          // Upload Cloudflare Images
          const cfResult = await uploadImageToCloudflare(arrayBuffer, {
            ownerType: 'product',
            ownerId: productId,
          });

          // Inserer dans product_images
          // storage_path conservé pour compat ascendante (NOT NULL côté DB) ;
          // le trigger DB privilégie cloudflare_image_id pour générer public_url
          const { error: imgInsertError } = await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              cloudflare_image_id: cfResult.id,
              storage_path: `cloudflare/${cfResult.id}`,
              display_order: i,
              is_primary: i === 0,
              image_type: i === 0 ? 'primary' : 'gallery',
              alt_text: `${input.name} - Photo ${i + 1}`,
              format: ext,
            });

          if (imgInsertError) {
            console.error(
              `[API sourcing/import] Image ${i} insert failed:`,
              imgInsertError
            );
          }
        } catch (imgErr) {
          console.error(
            `[API sourcing/import] Image ${i} upload failed:`,
            imgErr
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

    // Compter les images et URLs insérées
    const { count: imageCount } = await supabase
      .from('product_images')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);

    // Récupérer le nom du fournisseur créé/retrouvé
    let supplierName: string | null = null;
    if (supplierId) {
      const { data: supplierData } = await supabase
        .from('organisations')
        .select('trade_name')
        .eq('id', supplierId)
        .single();
      if (supplierData) {
        supplierName = supplierData.trade_name;
      }
    }

    return NextResponse.json(
      {
        success: true,
        redirect_url: `/produits/sourcing/produits/${productId}`,
        product: {
          id: productId,
          name: product.name,
          sku,
          cost_price: input.cost_price ?? null,
          manufacturer: input.manufacturer ?? null,
          supplier_reference: input.supplier_reference ?? null,
          sourcing_status: 'supplier_search',
          images_count: imageCount ?? 0,
        },
        supplier: supplierId
          ? {
              id: supplierId,
              name: supplierName,
              created: supplierIsNew,
              country: input.supplier?.country ?? null,
            }
          : null,
      },
      { headers: cors }
    );
  } catch (error) {
    console.error('[API sourcing/import] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Erreur interne',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500, headers: cors }
    );
  }
}
