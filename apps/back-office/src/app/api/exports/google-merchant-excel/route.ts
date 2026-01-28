/**
 * 📊 API Route: Export Excel Google Merchant Center
 *
 * GET /api/exports/google-merchant-excel
 * Génère un fichier Excel conforme au template Google Merchant fourni
 *
 * SÉCURITÉ: Hard gate + lazy import - Si NEXT_PUBLIC_GOOGLE_MERCHANT_SYNC_ENABLED !== 'true'
 * la route retourne 503 sans charger les modules Google Merchant
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';
import * as XLSX from 'xlsx';

interface ExportResponse {
  success: boolean;
  disabled?: boolean;
  message?: string;
  data?: {
    fileName: string;
    exportedAt: string;
    summary: {
      total: number;
      valid: number;
      invalid: number;
    };
    errors?: Array<{ productId: string; errors: string[] }>;
  };
  error?: string;
}

/**
 * Récupère les produits avec leurs relations depuis Supabase
 */
async function getProductsForExport(supabase: any, filters: any = {}) {
  let query = supabase.from('products').select(`
      *,
      variant_group:product_group_members(
        group:product_groups(
          id,
          name,
          item_group_id
        )
      )
    `);

  // Filtres optionnels
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.categoryId) {
    query = query.eq('subcategory_id', filters.categoryId);
  }

  if (filters.supplierId) {
    query = query.eq('supplier_id', filters.supplierId);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  } else {
    query = query.limit(1000); // Limite par défaut pour éviter les exports trop gros
  }

  // Trier par date de mise à jour
  query = query.order('updated_at', { ascending: false });

  const { data: products, error } = await query;

  console.warn('[API] Supabase query result:', {
    products,
    error,
    count: products?.length,
  });

  if (error) {
    throw new Error(`Erreur récupération produits: ${error.message}`);
  }

  return products || [];
}

/**
 * Génère le fichier Excel avec les données produits
 */
function generateExcelFile(
  excelData: any[],
  fileName: string,
  headers: readonly string[]
): Buffer {
  // 1. Créer le workbook
  const workbook = XLSX.utils.book_new();

  // 2. Préparer les données avec headers
  const worksheetData = [
    [...headers], // En-têtes en première ligne (copie mutable)
    ...excelData.map(row => headers.map(header => row[header] ?? '')),
  ];

  // 3. Créer la worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // 4. Définir les largeurs de colonnes
  const columnWidths = headers.map(header => {
    switch (header) {
      case 'title':
      case 'description':
        return { wch: 50 };
      case 'link':
      case 'image link':
      case 'additional image link':
        return { wch: 60 };
      case 'product highlight':
      case 'product detail':
        return { wch: 40 };
      default:
        return { wch: 15 };
    }
  });

  worksheet['!cols'] = columnWidths;

  // 5. Styling pour les en-têtes
  const headerStyle = {
    font: { bold: true },
    fill: { bgColor: { indexed: 64 }, fgColor: { rgb: 'EEEEEE' } },
  };

  // Appliquer le style aux en-têtes (première ligne)
  headers.forEach((_, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = headerStyle;
    }
  });

  // 6. Ajouter la worksheet au workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Google Merchant Products');

  // 7. Générer le buffer
  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    compression: true,
  });
}

/**
 * GET - Exporte les produits en format Excel Google Merchant
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // 🔒 HARD GATE: Si flag désactivé ou absent, skip silencieux
  if (process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_SYNC_ENABLED !== 'true') {
    return NextResponse.json(
      {
        success: false,
        disabled: true,
        message: 'Intégration Google Merchant désactivée',
      } satisfies ExportResponse,
      { status: 503 }
    );
  }

  // ✅ LAZY IMPORT: Chargé seulement si flag explicitement 'true'
  const { prepareExcelData, GOOGLE_MERCHANT_EXCEL_HEADERS } = await import(
    '@verone/integrations/google-merchant/excel-transformer'
  );

  try {
    const { searchParams } = new URL(request.url);

    // Paramètres de filtrage
    const filters = {
      status: searchParams.get('status') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      supplierId: searchParams.get('supplierId') ?? undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
    };

    // Options d'export
    const includeErrors = searchParams.get('includeErrors') === 'true';
    const downloadMode = searchParams.get('download') !== 'false'; // Par défaut true

    console.warn('[API] Google Merchant Excel export requested:', {
      filters,
      includeErrors,
      downloadMode,
    });

    // 1. Initialisation Supabase (Admin pour bypass RLS)
    const supabase = createAdminClient();

    // 2. Récupération des produits
    let products;
    try {
      products = await getProductsForExport(supabase, filters);
      console.warn(`[API] Retrieved ${products.length} products for export`);
    } catch (error: any) {
      console.error('[API] Error retrieving products:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucun produit trouvé avec ces critères',
        },
        { status: 404 }
      );
    }

    // 3. Enrichir les produits avec les item_group_id des variantes
    const enrichedProducts = products.map((product: any) => {
      // Extraire l'item_group_id si le produit fait partie d'un groupe de variantes
      const variantGroup = product.variant_group?.[0]?.group;
      const item_group_id = variantGroup?.item_group_id ?? null;

      return {
        ...product,
        item_group_id,
      };
    });

    console.warn(`[API] Products enriched with variant data:`, {
      total: enrichedProducts.length,
      withVariants: enrichedProducts.filter((p: any) => p.item_group_id).length,
    });

    // 4. Transformation des données pour Excel
    const {
      data: excelData,
      errors,
      summary,
    } = prepareExcelData(enrichedProducts);

    console.warn(`[API] Excel data prepared:`, summary);

    if (excelData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun produit valide pour l'export",
          data: {
            summary,
            errors: includeErrors ? errors : undefined,
          },
        },
        { status: 400 }
      );
    }

    // 5. Génération du fichier Excel
    const fileName = `google-merchant-products-${new Date().toISOString().split('T')[0]}.xlsx`;

    let excelBuffer;
    try {
      excelBuffer = generateExcelFile(
        excelData,
        fileName,
        GOOGLE_MERCHANT_EXCEL_HEADERS
      );
      console.warn(`[API] Excel file generated: ${fileName}`);
    } catch (error: any) {
      console.error('[API] Error generating Excel file:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Erreur génération fichier Excel: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // 6. Mode téléchargement vs informations
    if (!downloadMode) {
      // Retourner seulement les informations sans le fichier
      const response: ExportResponse = {
        success: true,
        data: {
          fileName,
          exportedAt: new Date().toISOString(),
          summary,
          ...(includeErrors && errors.length > 0 && { errors }),
        },
      };

      return NextResponse.json(response);
    }

    // 7. Retourner le fichier Excel pour téléchargement
    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': excelBuffer.length.toString(),
        'X-Export-Summary': JSON.stringify(summary),
        'X-Export-Errors': errors.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[API] Excel export failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne lors de l'export Excel",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Export avec configuration avancée
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 🔒 HARD GATE: Si flag désactivé ou absent, skip silencieux
  if (process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_SYNC_ENABLED !== 'true') {
    return NextResponse.json(
      {
        success: false,
        disabled: true,
        message: 'Intégration Google Merchant désactivée',
      } satisfies ExportResponse,
      { status: 503 }
    );
  }

  // ✅ LAZY IMPORT: Chargé seulement si flag explicitement 'true'
  const { prepareExcelData, GOOGLE_MERCHANT_EXCEL_HEADERS } = await import(
    '@verone/integrations/google-merchant/excel-transformer'
  );

  try {
    const body = await request.json();
    const { filters = {}, options = {}, productIds = null } = body;

    console.warn('[API] Advanced Excel export requested:', {
      filters,
      options,
      productIds,
    });

    // Initialisation Supabase (Admin pour bypass RLS)
    const supabase = createAdminClient();

    // Récupération des produits (spécifiques ou filtrés)
    let products;
    if (productIds && Array.isArray(productIds)) {
      // Export de produits spécifiques
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (error) {
        throw new Error(
          `Erreur récupération produits spécifiques: ${error.message}`
        );
      }

      products = data || [];
    } else {
      // Export avec filtres
      products = await getProductsForExport(supabase, filters);
    }

    console.warn(
      `[API] Retrieved ${products.length} products for advanced export`
    );

    if (products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucun produit trouvé',
        },
        { status: 404 }
      );
    }

    // Transformation et génération
    const { data: excelData, errors, summary } = prepareExcelData(products);

    if (excelData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun produit valide pour l'export",
          data: { summary, errors },
        },
        { status: 400 }
      );
    }

    const fileName =
      options.fileName || `google-merchant-export-${Date.now()}.xlsx`;
    const excelBuffer = generateExcelFile(
      excelData,
      fileName,
      GOOGLE_MERCHANT_EXCEL_HEADERS
    );

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': excelBuffer.length.toString(),
        'X-Export-Summary': JSON.stringify(summary),
      },
    });
  } catch (error: any) {
    console.error('[API] Advanced Excel export failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur export Excel avancé',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
