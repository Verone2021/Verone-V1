import { z } from 'zod';

import type { Organisation } from '@verone/organisations/hooks';

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  country: z
    .string()
    .min(2, 'Le pays doit contenir au moins 2 caractères')
    .default('FR'),
  description: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  customer_type: z.literal('professional'),
  legal_form: z.string().optional(),
  business_name: z.string().max(100).optional().nullable(),
  siren: z
    .string()
    .regex(/^\d{9}$/, 'Le SIREN doit contenir exactement 9 chiffres')
    .optional()
    .or(z.literal('')),
  siret: z
    .string()
    .regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres')
    .optional()
    .or(z.literal('')),
  vat_number: z.string().optional(),
  payment_terms: z.enum(['0', '30', '60', '90']).optional(),
  prepayment_required: z.boolean().default(false),
  currency: z.string().default('EUR'),
  enseigne_id: z.string().optional().nullable(),
  is_enseigne_parent: z.boolean().default(false),
  ownership_type: z.enum(['succursale', 'franchise']).optional().nullable(),
  billing_address_line1: z.string().optional(),
  billing_address_line2: z.string().optional(),
  billing_postal_code: z.string().optional(),
  billing_city: z.string().optional(),
  billing_region: z.string().optional(),
  billing_country: z.string().default('FR'),
  shipping_address_line1: z.string().optional(),
  shipping_address_line2: z.string().optional(),
  shipping_postal_code: z.string().optional(),
  shipping_city: z.string().optional(),
  shipping_region: z.string().optional(),
  shipping_country: z.string().default('FR'),
  has_different_shipping_address: z.boolean().default(false),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: (customer: Organisation) => void;
  onCustomerUpdated?: (customer: Organisation) => void;
  customer?: Organisation;
  mode?: 'create' | 'edit';
}
