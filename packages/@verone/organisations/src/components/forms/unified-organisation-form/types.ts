import * as z from 'zod';

import type { Organisation } from '@verone/organisations/hooks';

// ========================
// TYPES & SCHEMAS
// ========================

export type OrganisationType =
  | 'supplier'
  | 'customer'
  | 'partner'
  | 'internal'
  | 'generic';

// Organisation type is imported from hooks (complete type with all properties)
export type { Organisation };

export const baseOrganisationSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  country: z.string().default('FR'),
  is_active: z.boolean().default(true),
  notes: z.string().optional().or(z.literal('')),

  // Propriétés de contact (ajoutées)
  legal_name: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  secondary_email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),

  // Adresse principale (DEPRECATED mais encore utilisée)
  address_line1: z.string().optional().or(z.literal('')),
  address_line2: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  region: z.string().optional().or(z.literal('')),

  // Adresse de facturation
  billing_address_line1: z.string().optional().or(z.literal('')),
  billing_address_line2: z.string().optional().or(z.literal('')),
  billing_postal_code: z.string().optional().or(z.literal('')),
  billing_city: z.string().optional().or(z.literal('')),
  billing_region: z.string().optional().or(z.literal('')),
  billing_country: z.string().default('FR'),

  // Adresse de livraison
  shipping_address_line1: z.string().optional().or(z.literal('')),
  shipping_address_line2: z.string().optional().or(z.literal('')),
  shipping_postal_code: z.string().optional().or(z.literal('')),
  shipping_city: z.string().optional().or(z.literal('')),
  shipping_region: z.string().optional().or(z.literal('')),
  shipping_country: z.string().default('FR'),
  has_different_shipping_address: z.boolean().default(false),

  // Coordonnées GPS (remplies automatiquement par AddressAutocomplete)
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),

  // Identité commerciale
  has_different_trade_name: z.boolean().default(false),
  trade_name: z.string().optional().or(z.literal('')),

  // Légal
  siren: z.string().optional().or(z.literal('')),
  legal_form: z.string().optional().or(z.literal('')),
  siret: z.string().optional().or(z.literal('')),
  vat_number: z.string().optional().or(z.literal('')),
  industry_sector: z.string().optional().or(z.literal('')),

  // Rattachement enseigne (clients B2B uniquement)
  enseigne_id: z.string().nullable().optional(),
  ownership_type: z
    .enum(['succursale', 'franchise', 'propre'])
    .nullable()
    .optional(),

  // Commercial
  currency: z.string().default('EUR'),
  payment_terms: z.string().optional().or(z.literal('')),

  // Supplier specific
  supplier_segment: z.string().optional().or(z.literal('')),
});

// z.output gives the type AFTER defaults are applied (all required fields have values)
export type OrganisationFormData = z.output<typeof baseOrganisationSchema>;

export interface UnifiedOrganisationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: OrganisationFormData,
    organisationId?: string
  ) => Promise<void>;
  onSuccess?: (organisation: Organisation) => void;
  organisationType: OrganisationType;
  organisation?: Organisation | null;
  mode?: 'create' | 'edit';
  title?: string;
  onLogoUploadSuccess?: () => void;
  customSections?: React.ReactNode;
  /** Pre-fill and lock enseigne (from enseigne detail page or LinkMe context) */
  enseigneId?: string | null;
}
