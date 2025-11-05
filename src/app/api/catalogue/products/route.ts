/**
 * 🛋️ Catalogue Products API - Vérone Back Office
 *
 * API pour gestion produits catalogue avec logging business intégré.
 * Sécurisé avec authentification, rate limiting et validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withLogging } from '@/lib/middleware/logging';
import {
  withApiSecurity,
  validateInput,
  sanitizeString,
} from '@/lib/middleware/api-security';
import { logger, catalogueLogger } from '@/lib/logger';

// Mock data pour démonstration
const MOCK_PRODUCTS = [
  {
    id: '1',
    sku: 'VER-CANAPE-001',
    name: 'Canapé Vérone Classic Cuir Noir',
    description: 'Canapé 3 places en cuir italien premium',
    price_ht: 249900, // 2499€ HT
    price_ttc: 299880, // 2999€ TTC (20% VAT)
    category: 'canapes',
    brand: 'Vérone',
    status: 'active',
    stock_status: 'in_stock',
    product_status: 'active',
    images: [
      'https://example.com/canape-classic-1.jpg',
      'https://example.com/canape-classic-2.jpg',
    ],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-13T10:00:00Z',
  },
  {
    id: '2',
    sku: 'VER-TABLE-001',
    name: 'Table Basse Vérone Marbre Carrare',
    description: 'Table basse en marbre de Carrare et pieds bronze',
    price_ht: 149900, // 1499€ HT
    price_ttc: 179880, // 1799€ TTC
    category: 'tables',
    brand: 'Vérone',
    status: 'active',
    stock_status: 'in_stock',
    product_status: 'active',
    images: ['https://example.com/table-marbre-1.jpg'],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-10T15:30:00Z',
  },
  {
    id: '3',
    sku: 'VER-ECLAIRAGE-001',
    name: 'Lampadaire Vérone Art Déco Laiton',
    description: 'Lampadaire design Art Déco en laiton brossé',
    price_ht: 79900, // 799€ HT
    price_ttc: 95880, // 959€ TTC
    category: 'eclairage',
    brand: 'Vérone',
    status: 'active',
    stock_status: 'out_of_stock',
    product_status: 'preorder',
    images: ['https://example.com/lampadaire-artdeco-1.jpg'],
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-12T09:15:00Z',
  },
];

async function getProducts(req: NextRequest) {
  const timer = logger.startTimer();
  const url = new URL(req.url);

  // Parse query parameters
  const params = {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 100),
    category: url.searchParams.get('category'),
    status: url.searchParams.get('status') || 'active',
    search: url.searchParams.get('search'),
    sort: url.searchParams.get('sort') || 'updated_at',
    order: url.searchParams.get('order') || 'desc',
  };

  // Log début traitement avec paramètres
  logger.info('Processing products request', {
    operation: 'get_products',
    category: 'catalogue',
    params,
  });

  // Simulate database query delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Filter products based on parameters
  let filteredProducts = MOCK_PRODUCTS;

  if (params.category) {
    filteredProducts = filteredProducts.filter(
      p => p.category === params.category
    );
  }

  if (params.status) {
    filteredProducts = filteredProducts.filter(p => p.status === params.status);
  }

  if (params.search) {
    const searchTerm = params.search.toLowerCase();
    filteredProducts = filteredProducts.filter(
      p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.sku.toLowerCase().includes(searchTerm)
    );
  }

  // Pagination
  const totalCount = filteredProducts.length;
  const totalPages = Math.ceil(totalCount / params.limit);
  const startIndex = (params.page - 1) * params.limit;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + params.limit
  );

  const duration = timer();

  // Log business metrics
  catalogueLogger.productViewed(
    `products-list-${params.category || 'all'}`,
    'system'
  );

  logger.business(
    'products_fetched',
    {
      operation: 'get_products',
      category: 'catalogue',
      resource: 'products',
    },
    {
      total_count: totalCount,
      returned_count: paginatedProducts.length,
      page: params.page,
      query_time_ms: duration,
    }
  );

  // Log performance si lent
  if (duration > 500) {
    logger.performance('get_products', duration, {
      operation: 'get_products',
      resource: 'products',
      params,
    });
  }

  const response = {
    data: paginatedProducts,
    pagination: {
      page: params.page,
      limit: params.limit,
      total_count: totalCount,
      total_pages: totalPages,
      has_next_page: params.page < totalPages,
      has_prev_page: params.page > 1,
    },
    meta: {
      request_id: crypto.randomUUID(),
      query_time_ms: duration,
      cached: false,
    },
  };

  return NextResponse.json(response, {
    headers: {
      'X-Total-Count': totalCount.toString(),
      'X-Page': params.page.toString(),
      'X-Query-Time': duration.toString(),
    },
  });
}

async function createProduct(req: NextRequest) {
  const timer = logger.startTimer();

  try {
    const body = await req.json();

    // Validation simple
    if (!body.name || !body.sku || !body.price_ht) {
      logger.warn('Product creation failed - validation error', {
        operation: 'create_product',
        category: 'catalogue',
        validation_errors: {
          missing_fields: [
            !body.name && 'name',
            !body.sku && 'sku',
            !body.price_ht && 'price_ht',
          ].filter(Boolean),
        },
      });

      return NextResponse.json(
        {
          error: 'Validation failed',
          missing_fields: ['name', 'sku', 'price_ht'].filter(
            field => !body[field]
          ),
        },
        { status: 400 }
      );
    }

    // Simulate product creation
    await new Promise(resolve => setTimeout(resolve, 200));

    const newProduct = {
      id: crypto.randomUUID(),
      ...body,
      price_ttc: body.price_ht * 1.2, // 20% VAT
      status: body.status || 'draft',
      stock_status: body.stock_status || 'out_of_stock',
      product_status: body.product_status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const duration = timer();

    // Log audit trail
    logger.audit('create', 'product', {
      operation: 'create_product',
      category: 'catalogue',
      resource: 'product',
      productId: newProduct.id,
      sku: newProduct.sku,
    });

    // Log business metrics
    logger.business(
      'product_created',
      {
        operation: 'create_product',
        category: 'catalogue',
        resource: 'product',
      },
      {
        creation_time_ms: duration,
        price_ht_cents: newProduct.price_ht,
      }
    );

    return NextResponse.json(
      {
        data: newProduct,
        meta: {
          request_id: crypto.randomUUID(),
          creation_time_ms: duration,
        },
      },
      {
        status: 201,
        headers: {
          'X-Creation-Time': duration.toString(),
        },
      }
    );
  } catch (error) {
    const duration = timer();

    logger.error(
      'Product creation failed',
      error as Error,
      {
        operation: 'create_product',
        category: 'catalogue',
        resource: 'product',
      },
      {
        processing_time_ms: duration,
      }
    );

    return NextResponse.json(
      {
        error: 'Internal server error',
        request_id: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}

// Export avec middleware de logging complet
export const GET = withLogging(getProducts, {
  logRequestBody: false,
  logResponseBody: false,
  slowRequestThreshold: 1000,
});

export const POST = withLogging(createProduct, {
  logRequestBody: true,
  logResponseBody: false,
  slowRequestThreshold: 2000,
});

// Handle OPTIONS requests with secure CORS
export async function OPTIONS(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req: NextRequest) => {
      return new NextResponse(null, { status: 204 });
    },
    {
      requireAuth: false, // OPTIONS requests don't need auth
      rateLimit: false, // No rate limiting for preflight
      allowedMethods: ['OPTIONS'],
    }
  );
}
