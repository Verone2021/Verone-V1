/**
 * Schémas Zod pour les routes /api/qonto/quotes et /api/qonto/quotes/service
 * Source unique de vérité pour la validation des inputs POST.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schemas partagés — route principale /api/qonto/quotes
// ---------------------------------------------------------------------------

export const DocumentAddressSchema = z.object({
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const FeesDataSchema = z.object({
  shipping_cost_ht: z.number().optional(),
  handling_cost_ht: z.number().optional(),
  insurance_cost_ht: z.number().optional(),
  fees_vat_rate: z.number().optional(),
});

export const CustomLineSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  quantity: z.number(),
  unit_price_ht: z.number(),
  vat_rate: z.number(),
});

export const StandaloneCustomerSchema = z.object({
  customerId: z.string().uuid(),
  customerType: z.enum(['organization', 'individual']),
});

export const PostRequestBodySchema = z.object({
  salesOrderId: z.string().uuid().optional(),
  consultationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  supersededQuoteIds: z.array(z.string().uuid()).optional(),
  customer: StandaloneCustomerSchema.optional(),
  customerEmail: z.string().email().optional(),
  expiryDays: z.number().int().positive().optional(),
  billingAddress: DocumentAddressSchema.optional(),
  shippingAddress: DocumentAddressSchema.optional(),
  /** Si true : persiste billingAddress dans organisations.billing_* */
  updateOrgBilling: z.boolean().optional(),
  /** Si true : persiste shippingAddress dans organisations.shipping_* */
  updateOrgShipping: z.boolean().optional(),
  fees: FeesDataSchema.optional(),
  customLines: z.array(CustomLineSchema).optional(),
});

export type IDocumentAddress = z.infer<typeof DocumentAddressSchema>;
export type IFeesData = z.infer<typeof FeesDataSchema>;
export type ICustomLine = z.infer<typeof CustomLineSchema>;
export type IStandaloneCustomer = z.infer<typeof StandaloneCustomerSchema>;
export type IPostRequestBody = z.infer<typeof PostRequestBodySchema>;

// ---------------------------------------------------------------------------
// Schema dédié — route service /api/qonto/quotes/service
// ---------------------------------------------------------------------------

export const ServiceItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  quantity: z.number(),
  unitPrice: z.number(),
  vatRate: z.number(),
});

export const ServicePostRequestBodySchema = z.object({
  clientId: z.string().uuid(),
  clientType: z.enum(['organization', 'individual']),
  items: z.array(ServiceItemSchema).min(1),
  validityDays: z.number().int().positive().optional(),
  reference: z.string().optional(),
  autoFinalize: z.boolean().optional(),
});

export type IServiceItem = z.infer<typeof ServiceItemSchema>;
export type IServicePostRequestBody = z.infer<
  typeof ServicePostRequestBodySchema
>;
