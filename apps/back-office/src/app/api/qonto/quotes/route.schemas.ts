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
  /**
   * [BO-FIN-009 Phase 5 — R5 finance.md]
   * Source de vérité explicite du type de devis. Requis.
   * - 'from-order'  : devis adossé à une commande existante (`salesOrderId` REQUIS)
   * - 'service'     : devis libre sans commande (`customer` + `customLines` REQUIS,
   *                   `consultationId` optionnel pour devis de consultation)
   */
  kind: z.enum(['from-order', 'service']),
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
  /**
   * ID de l'org choisie comme destinataire de facturation (Option B).
   * Si présent et différent de l'org commande → cette org devient le client Qonto
   * ET le partner_id du financial_document local.
   */
  billingOrgId: z.string().uuid().optional().nullable(),
  fees: FeesDataSchema.optional(),
  customLines: z.array(CustomLineSchema).optional(),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  footerNote: z.string().max(1000).optional(),
  /** itemComments : clé = sales_order_item.id (uuid), valeur = commentaire */
  itemComments: z.record(z.string(), z.string().max(500)).optional(),
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
