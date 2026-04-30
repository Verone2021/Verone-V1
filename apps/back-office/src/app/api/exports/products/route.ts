import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createServerClient } from '@verone/utils/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  const body = (await request.json()) as { format?: string; status?: string };
  const format = body.format ?? 'xlsx';

  const validStatuses = [
    'active',
    'draft',
    'preorder',
    'discontinued',
  ] as const;
  type ProductStatus = (typeof validStatuses)[number];

  // Fetch products with relations
  let query = supabase
    .from('products')
    .select(
      `
      id, sku, name, slug, manufacturer, product_status, cost_price, weight,
      dimensions, description, meta_title, meta_description,
      stock_real, stock_forecasted_in, stock_forecasted_out, min_stock,
      condition, gtin, supplier_reference, supplier_page_url, supplier_moq,
      completion_percentage, is_published_online, created_at, updated_at,
      supplier:organisations!products_supplier_id_fkey(trade_name, legal_name),
      subcategory:subcategories(name, category:categories(name, family:families(name)))
    `
    )
    .is('archived_at', null)
    .order('name', { ascending: true });

  if (
    body.status &&
    body.status !== 'all' &&
    validStatuses.includes(body.status as ProductStatus)
  ) {
    query = query.eq('product_status', body.status as ProductStatus);
  }

  const { data: products, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!products || products.length === 0) {
    return NextResponse.json(
      { error: 'Aucun produit a exporter' },
      { status: 404 }
    );
  }

  // Fetch channel pricing for sell prices
  const productIds = products.map(p => p.id);
  const { data: channelPrices } = await supabase
    .from('channel_pricing')
    .select('product_id, custom_price_ht, channel:sales_channels(name)')
    .in('product_id', productIds)
    .eq('is_active', true);

  const sellPriceMap = new Map<string, number>();
  for (const cp of channelPrices ?? []) {
    if (cp.custom_price_ht && !sellPriceMap.has(cp.product_id)) {
      sellPriceMap.set(cp.product_id, cp.custom_price_ht);
    }
  }

  // Helper to extract dimensions
  const getDim = (
    dims: Record<string, unknown> | null,
    key: string
  ): number | null => {
    if (!dims) return null;
    const val = dims[key];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  // Map rows
  const rows = products.map(p => {
    const dims = p.dimensions as Record<string, unknown> | null;
    const sub = p.subcategory as {
      name: string;
      category?: { name: string; family?: { name: string } };
    } | null;
    const sup = p.supplier as {
      trade_name: string | null;
      legal_name: string;
    } | null;

    return {
      sku: p.sku,
      name: p.name,
      manufacturer: p.manufacturer ?? '',
      status: p.product_status,
      family: sub?.category?.family?.name ?? '',
      category: sub?.category?.name ?? '',
      subcategory: sub?.name ?? '',
      supplier: sup?.trade_name ?? sup?.legal_name ?? '',
      supplier_ref: p.supplier_reference ?? '',
      cost_price: p.cost_price ?? 0,
      sell_price_ht: sellPriceMap.get(p.id) ?? 0,
      margin_pct:
        p.cost_price && sellPriceMap.has(p.id)
          ? Math.round(
              ((sellPriceMap.get(p.id)! - p.cost_price) /
                sellPriceMap.get(p.id)!) *
                100
            )
          : 0,
      stock: p.stock_real ?? 0,
      stock_in: p.stock_forecasted_in ?? 0,
      stock_out: p.stock_forecasted_out ?? 0,
      weight: p.weight ?? 0,
      length_cm: getDim(dims, 'length_cm') ?? 0,
      width_cm: getDim(dims, 'width_cm') ?? 0,
      height_cm: getDim(dims, 'height_cm') ?? 0,
      gtin: p.gtin ?? '',
      slug: p.slug ?? '',
      completion: p.completion_percentage ?? 0,
      published: p.is_published_online ? 'Oui' : 'Non',
      description: p.description ?? '',
      meta_description: p.meta_description ?? '',
      created_at: p.created_at
        ? new Date(p.created_at).toLocaleDateString('fr-FR')
        : '',
    };
  });

  // CSV format
  if (format === 'csv') {
    const headers = [
      'SKU',
      'Nom',
      'Marque',
      'Statut',
      'Famille',
      'Categorie',
      'Sous-categorie',
      'Fournisseur',
      'Ref. fournisseur',
      'Prix achat',
      'Prix vente HT',
      'Marge %',
      'Stock',
      'Prevision entrant',
      'Prevision sortant',
      'Poids (kg)',
      'Longueur (cm)',
      'Largeur (cm)',
      'Hauteur (cm)',
      'GTIN',
      'Slug',
      'Completude %',
      'Publie',
      'Description',
      'Meta description',
      'Date creation',
    ];

    const csvRows = rows.map(r =>
      [
        r.sku,
        r.name,
        r.manufacturer,
        r.status,
        r.family,
        r.category,
        r.subcategory,
        r.supplier,
        r.supplier_ref,
        r.cost_price,
        r.sell_price_ht,
        r.margin_pct,
        r.stock,
        r.stock_in,
        r.stock_out,
        r.weight,
        r.length_cm,
        r.width_cm,
        r.height_cm,
        r.gtin,
        r.slug,
        r.completion,
        r.published,
        `"${r.description.replace(/"/g, '""')}"`,
        `"${r.meta_description.replace(/"/g, '""')}"`,
        r.created_at,
      ].join(';')
    );

    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(';'), ...csvRows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="verone-catalogue-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // Excel format (default)
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Verone Back Office';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Catalogue', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'SKU', key: 'sku', width: 14 },
    { header: 'Nom', key: 'name', width: 35 },
    { header: 'Fabricant', key: 'manufacturer', width: 15 },
    { header: 'Statut', key: 'status', width: 10 },
    { header: 'Famille', key: 'family', width: 18 },
    { header: 'Categorie', key: 'category', width: 18 },
    { header: 'Sous-cat.', key: 'subcategory', width: 18 },
    { header: 'Fournisseur', key: 'supplier', width: 22 },
    { header: 'Ref. fourn.', key: 'supplier_ref', width: 14 },
    { header: 'Prix achat', key: 'cost_price', width: 12 },
    { header: 'Prix vente HT', key: 'sell_price_ht', width: 14 },
    { header: 'Marge %', key: 'margin_pct', width: 10 },
    { header: 'Stock', key: 'stock', width: 8 },
    { header: 'Prev. IN', key: 'stock_in', width: 10 },
    { header: 'Prev. OUT', key: 'stock_out', width: 10 },
    { header: 'Poids (kg)', key: 'weight', width: 10 },
    { header: 'L (cm)', key: 'length_cm', width: 8 },
    { header: 'l (cm)', key: 'width_cm', width: 8 },
    { header: 'H (cm)', key: 'height_cm', width: 8 },
    { header: 'GTIN', key: 'gtin', width: 16 },
    { header: 'Slug', key: 'slug', width: 25 },
    { header: 'Completude', key: 'completion', width: 12 },
    { header: 'Publie', key: 'published', width: 8 },
    { header: 'Date creation', key: 'created_at', width: 14 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A1A1A' },
  };
  headerRow.alignment = { vertical: 'middle' };

  // Add data
  for (const row of rows) {
    sheet.addRow(row);
  }

  // Auto-filter
  sheet.autoFilter = { from: 'A1', to: `X${rows.length + 1}` };

  // Number formats
  sheet.getColumn('cost_price').numFmt = '#,##0.00 €';
  sheet.getColumn('sell_price_ht').numFmt = '#,##0.00 €';
  sheet.getColumn('margin_pct').numFmt = '0"%"';
  sheet.getColumn('completion').numFmt = '0"%"';

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="verone-catalogue-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
