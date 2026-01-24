/**
 * API Request Validation Schemas - Verone Security Layer
 *
 * Zod schemas for validating API request bodies
 * All inputs are sanitized to prevent injection attacks
 */

import { z } from 'zod';

import { sanitizeInput, sanitizeObject } from './form-security';

// ============================================
// Base Schema Helpers
// ============================================

/** UUID validator */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Create a safe string schema with length constraints
 * Sanitizes HTML and validates length before transformation
 */
function safeString(options?: { min?: number; max?: number }) {
  let schema = z.string();

  if (options?.min !== undefined) {
    schema = schema.min(options.min);
  }
  if (options?.max !== undefined) {
    schema = schema.max(options.max);
  }

  return schema
    .transform(sanitizeInput)
    .refine((val) => !/<[^>]*>/.test(val), 'HTML tags not allowed');
}

/** Default safe string (no length constraints) */
export const safeStringSchema = safeString();

/** Positive integer */
export const positiveIntSchema = z.number().int().positive();

/** Non-negative number */
export const nonNegativeSchema = z.number().min(0);

/** Email with validation and sanitization */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .transform(sanitizeInput);

/** ISO date string (YYYY-MM-DD) */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

/** ISO datetime string */
export const isoDateTimeSchema = z.string().datetime('Invalid datetime format');

/** French postal code */
const postalCodeSchema = z
  .string()
  .regex(/^\d{5}$/, 'Invalid French postal code');

/** French phone number */
const phoneSchema = z
  .string()
  .regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Invalid French phone number');

/** Country code (2 letters) */
const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be 2 characters')
  .default('FR');

// ============================================
// Common API Schemas
// ============================================

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Date range filter
 */
export const dateRangeSchema = z
  .object({
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: 'Start date must be before or equal to end date' }
  );

// ============================================
// Address Schema (reusable)
// ============================================

const addressSchema = z.object({
  line1: safeString({ max: 200 }),
  line2: safeString({ max: 200 }).optional(),
  postal_code: postalCodeSchema,
  city: safeString({ max: 100 }),
  country: countryCodeSchema,
});

// ============================================
// Orders API Schemas
// ============================================

/**
 * Create sales order item
 */
export const salesOrderItemSchema = z.object({
  product_id: uuidSchema,
  quantity: positiveIntSchema,
  unit_price_ht: nonNegativeSchema,
  discount_rate: z.number().min(0).max(100).optional(),
  notes: safeString({ max: 500 }).optional(),
});

/**
 * Create sales order
 */
export const createSalesOrderSchema = z.object({
  customer_id: uuidSchema,
  customer_type: z.enum(['organisation', 'individual']),
  items: z.array(salesOrderItemSchema).min(1, 'At least one item required'),
  shipping_address: addressSchema.optional(),
  billing_address: addressSchema.optional(),
  payment_terms: z
    .enum(['immediate', 'net_15', 'net_30', 'net_60'])
    .default('net_30'),
  notes: safeString({ max: 2000 }).optional(),
});

/**
 * Update sales order status
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'draft',
    'pending',
    'confirmed',
    'in_preparation',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  reason: safeString({ max: 500 }).optional(),
});

// ============================================
// Invoice API Schemas
// ============================================

/**
 * Create invoice from order
 */
export const createInvoiceSchema = z.object({
  salesOrderId: uuidSchema,
  autoFinalize: z.boolean().default(false),
  fees: z
    .object({
      shipping_cost_ht: nonNegativeSchema.optional(),
      handling_cost_ht: nonNegativeSchema.optional(),
      insurance_cost_ht: nonNegativeSchema.optional(),
      fees_vat_rate: z.number().min(0).max(1).optional(),
    })
    .optional(),
  customLines: z
    .array(
      z.object({
        title: safeString({ max: 200 }),
        description: safeString({ max: 500 }).optional(),
        quantity: positiveIntSchema,
        unit_price_ht: nonNegativeSchema,
        vat_rate: z.number().min(0).max(1),
      })
    )
    .optional(),
});

/**
 * Send invoice by email
 */
export const sendInvoiceSchema = z.object({
  invoiceId: uuidSchema,
  recipientEmail: emailSchema,
  subject: safeString({ max: 200 }).optional(),
  message: safeString({ max: 2000 }).optional(),
});

// ============================================
// Customer API Schemas
// ============================================

/**
 * Create organisation
 */
export const createOrganisationSchema = z.object({
  legal_name: safeString({ min: 2, max: 200 }),
  trade_name: safeString({ max: 200 }).optional(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  website: z.string().url('Invalid URL').optional(),
  tax_id: z
    .string()
    .regex(/^FR\d{11}$/, 'Invalid French VAT number')
    .optional(),
  siret: z
    .string()
    .regex(/^\d{14}$/, 'SIRET must be 14 digits')
    .optional(),
  address: addressSchema.optional(),
  notes: safeString({ max: 2000 }).optional(),
});

/**
 * Create individual customer
 */
export const createIndividualSchema = z.object({
  first_name: safeString({ min: 2, max: 100 }),
  last_name: safeString({ min: 2, max: 100 }),
  email: emailSchema,
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
  notes: safeString({ max: 2000 }).optional(),
});

// ============================================
// Product API Schemas
// ============================================

/**
 * Create/Update product
 */
export const productSchema = z.object({
  sku: z
    .string()
    .regex(
      /^[A-Z0-9\-_]{3,50}$/,
      'SKU must be 3-50 uppercase alphanumeric characters'
    ),
  name: safeString({ min: 2, max: 200 }),
  description: safeString({ max: 5000 }).optional(),
  price_ht: nonNegativeSchema,
  vat_rate: z.number().min(0).max(100),
  stock_quantity: z.number().int().min(0).default(0),
  min_stock: z.number().int().min(0).optional(),
  weight_kg: nonNegativeSchema.optional(),
  dimensions: z
    .object({
      length_cm: nonNegativeSchema,
      width_cm: nonNegativeSchema,
      height_cm: nonNegativeSchema,
    })
    .optional(),
  category_id: uuidSchema.optional(),
  status: z
    .enum(['draft', 'published', 'archived', 'out_of_stock'])
    .default('draft'),
});

// ============================================
// Linkme API Schemas
// ============================================

/**
 * Create Linkme user
 */
export const createLinkmeUserSchema = z.object({
  email: emailSchema,
  role: z.enum(['affiliate', 'agent', 'enseigne']),
  organisation_id: uuidSchema.optional(),
  enseigne_id: uuidSchema.optional(),
  first_name: safeString({ max: 100 }).optional(),
  last_name: safeString({ max: 100 }).optional(),
});

/**
 * Linkme selection
 */
export const createSelectionSchema = z.object({
  name: safeString({ min: 1, max: 200 }),
  description: safeString({ max: 2000 }).optional(),
  product_ids: z.array(uuidSchema).min(1, 'At least one product required'),
  affiliate_id: uuidSchema.optional(),
});

// ============================================
// Admin API Schemas
// ============================================

/**
 * Run migration (admin only)
 */
export const runMigrationSchema = z.object({
  migrationName: z
    .string()
    .regex(/^[a-z0-9_]+$/, 'Invalid migration name format'),
  dryRun: z.boolean().default(true),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Validate request body with a Zod schema
 *
 * @returns Parsed data if valid, or Response with 400 error
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; response: Response }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: 'Validation Error',
            details: result.error.flatten(),
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      };
    }

    // Additional sanitization for nested objects
    const sanitizedData = sanitizeObject(
      result.data as Record<string, unknown>
    );

    return { success: true, data: sanitizedData as T };
  } catch {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }
}

/**
 * Validate query parameters with a Zod schema
 */
export function validateQueryParams<T>(
  url: URL,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: Response } {
  const params: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Invalid Query Parameters',
          details: result.error.flatten(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  return { success: true, data: result.data };
}
