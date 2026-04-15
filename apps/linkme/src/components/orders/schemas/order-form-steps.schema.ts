/**
 * Schemas des étapes du formulaire de commande
 *
 * @module order-form-steps.schema
 * @since 2026-04-14 (extrait de order-form.schema.ts)
 */

import { z } from 'zod';

import {
  contactBaseSchema,
  partialAddressSchema,
} from './order-form-base.schema';

// ============================================================================
// ÉTAPE 1 : RESTAURANT
// ============================================================================

export const newRestaurantSchema = z.object({
  tradeName: z.string().min(2, 'Nom commercial requis (min. 2 caractères)'),
  city: z.string().min(2, 'Ville requise'),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  ownershipType: z.enum(['succursale', 'franchise']),
  country: z.string().default('FR'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  legalName: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  kbisFile: z.unknown().nullable().optional(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
});

export const restaurantStepSchema = z
  .object({
    mode: z.enum(['existing', 'new']),
    existingId: z.string().uuid().optional().nullable(),
    existingName: z.string().optional(),
    existingCity: z.string().optional(),
    existingOwnershipType: z
      .enum(['succursale', 'franchise'])
      .optional()
      .nullable(),
    existingCountry: z.string().optional().nullable(),
    existingAddressLine1: z.string().optional().nullable(),
    existingPostalCode: z.string().optional().nullable(),
    newRestaurant: newRestaurantSchema.optional().nullable(),
  })
  .refine(
    data => {
      if (data.mode === 'existing') {
        return !!data.existingId && !!data.existingOwnershipType;
      }
      return (
        data.newRestaurant &&
        data.newRestaurant.tradeName.length >= 2 &&
        data.newRestaurant.city.length >= 2 &&
        !!data.newRestaurant.ownershipType
      );
    },
    {
      message:
        'Veuillez sélectionner le type du restaurant (franchise ou succursale)',
    }
  );

export type RestaurantStepData = z.infer<typeof restaurantStepSchema>;

// ============================================================================
// ÉTAPE 2 : SÉLECTION
// ============================================================================

export const selectionStepSchema = z.object({
  selectionId: z.string().uuid('Sélection requise'),
  selectionName: z.string(),
  productsCount: z.number().optional(),
});

export type SelectionStepData = z.infer<typeof selectionStepSchema>;

// ============================================================================
// ÉTAPES 3 & 4 : PRODUITS / PANIER
// ============================================================================

export const cartItemSchema = z.object({
  selectionItemId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  productSku: z.string().optional(),
  productImage: z.string().url().optional().nullable(),
  quantity: z.number().min(1, 'Quantité minimum: 1'),
  basePriceHt: z.number().min(0),
  unitPriceHt: z.number().min(0),
  marginRate: z.number().min(0),
  isAffiliateProduct: z.boolean().optional().default(false),
  affiliateCommissionRate: z.number().nullable().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const cartStepSchema = z.object({
  items: z
    .array(cartItemSchema)
    .min(1, 'Ajoutez au moins un produit au panier'),
});

export type CartStepData = z.infer<typeof cartStepSchema>;

// ============================================================================
// ÉTAPE 5 : CONTACTS
// ============================================================================

export const contactSectionSchema = z.object({
  sameAsResponsable: z.boolean().default(false),
  useParentOrg: z.boolean().default(false),
  contact: contactBaseSchema.optional().nullable(),
});

export const billingSectionSchema = z.object({
  sameAsResponsable: z.boolean().default(false),
  useParentOrg: z.boolean().default(false),
  contact: contactBaseSchema.optional().nullable(),
  existingContactId: z.string().uuid().optional().nullable(),
  address: partialAddressSchema.optional().nullable(),
  saveAddressAsDefault: z.boolean().default(false),
});

export type BillingSectionData = z.infer<typeof billingSectionSchema>;

export const billingContactSchema = z.object({
  mode: z.enum(['existing', 'new', 'same_as_responsable']),
  existingContactId: z.string().uuid().optional().nullable(),
  contact: contactBaseSchema.optional().nullable(),
});

export type BillingContactData = z.infer<typeof billingContactSchema>;

export const customBillingOrgSchema = z.object({
  legalName: z.string().min(1, 'Raison sociale requise'),
  tradeName: z.string().optional(),
  siret: z.string().optional(),
  vatNumber: z.string().optional(),
  addressLine1: z.string().min(1, 'Adresse requise'),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(4, 'Code postal requis'),
  city: z.string().min(1, 'Ville requise'),
  country: z.string().default('FR'),
});

export type CustomBillingOrg = z.infer<typeof customBillingOrgSchema>;

export const billingOrgSchema = z
  .object({
    mode: z.enum(['restaurant', 'parent_org', 'other']),
    organisationId: z.string().uuid().nullable(),
    customOrganisation: customBillingOrgSchema.nullable(),
    saveAsDefault: z.boolean().default(false),
  })
  .refine(
    data => {
      if (data.mode !== 'other' || !data.customOrganisation) return true;
      const org = data.customOrganisation;
      const isFrench = !org.country || org.country.toUpperCase() === 'FR';
      if (isFrench) return !!org.siret && org.siret.length >= 9;
      return !!org.vatNumber && org.vatNumber.length >= 4;
    },
    {
      message:
        'SIRET requis (France) ou N° TVA intracommunautaire requis (étranger)',
      path: ['customOrganisation', 'siret'],
    }
  );

export type BillingOrgData = z.infer<typeof billingOrgSchema>;

export const billingAddressSchema = z.object({
  mode: z.enum([
    'restaurant_address',
    'existing_billing',
    'new_billing',
    'parent_address',
  ]),
  existingAddressId: z.string().uuid().nullable(),
  customAddress: partialAddressSchema.nullable(),
  setAsDefault: z.boolean().default(false),
  replaceExistingAddress: z.boolean().default(false),
  sourceOrganisationId: z.string().uuid().optional().nullable(),
});

export type BillingAddressData = z.infer<typeof billingAddressSchema>;

export const deliverySectionSchema = z.object({
  sameAsResponsable: z.boolean().default(false),
  contact: contactBaseSchema.optional().nullable(),
  existingContactId: z.string().uuid().optional().nullable(),
  address: partialAddressSchema.optional().nullable(),
  saveAddressAsDefault: z.boolean().default(false),
});

export type DeliverySectionData = z.infer<typeof deliverySectionSchema>;

export const franchiseInfoSchema = z.object({
  companyLegalName: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
});

export type FranchiseInfo = z.infer<typeof franchiseInfoSchema>;

export const contactsStepSchema = z
  .object({
    responsable: contactBaseSchema,
    existingResponsableId: z.string().uuid().optional().nullable(),
    franchiseInfo: franchiseInfoSchema.optional().nullable(),
    billingContact: billingContactSchema,
    billingOrg: billingOrgSchema,
    billingAddress: billingAddressSchema,
    billing: billingSectionSchema,
    delivery: deliverySectionSchema,
  })
  .refine(
    data => {
      if (data.billingContact.mode !== 'same_as_responsable') {
        return (
          !!data.billingContact.contact ||
          !!data.billingContact.existingContactId
        );
      }
      return true;
    },
    { message: 'Contact facturation requis', path: ['billingContact'] }
  )
  .refine(
    data => {
      if (data.billingAddress.mode === 'new_billing') {
        const addr = data.billingAddress.customAddress;
        return !!(addr?.addressLine1 && addr?.postalCode && addr?.city);
      }
      if (data.billingAddress.mode === 'existing_billing') {
        return !!data.billingAddress.existingAddressId;
      }
      return true;
    },
    { message: 'Adresse de facturation requise', path: ['billingAddress'] }
  )
  .refine(
    data => {
      if (!data.delivery.sameAsResponsable) {
        return !!data.delivery.contact || !!data.delivery.existingContactId;
      }
      return true;
    },
    { message: 'Contact livraison requis', path: ['delivery'] }
  );

export type ContactsStepData = z.infer<typeof contactsStepSchema>;

// ============================================================================
// ÉTAPE 6 : LIVRAISON
// ============================================================================

export const deliveryStepSchema = z
  .object({
    address: z.string().min(5, 'Adresse requise (min. 5 caractères)'),
    postalCode: z.string().min(4, 'Code postal requis'),
    city: z.string().min(2, 'Ville requise'),
    desiredDate: z.string().optional().nullable(),
    deliveryAsap: z.boolean().default(false),
    isMallDelivery: z.boolean().default(false),
    mallEmail: z
      .string()
      .email('Email centre commercial invalide')
      .optional()
      .nullable(),
    semiTrailerAccessible: z.boolean().default(true),
    accessFormUrl: z.string().url().optional().nullable(),
    accessFormFile: z.any().optional().nullable(),
    notes: z.string().optional(),
    deliveryTermsAccepted: z.boolean().default(false),
  })
  .refine(
    data => {
      if (data.isMallDelivery && !data.mallEmail) return false;
      return true;
    },
    { message: 'Email du centre commercial requis', path: ['mallEmail'] }
  );

export type DeliveryStepData = z.infer<typeof deliveryStepSchema>;

// ============================================================================
// FORMULAIRE COMPLET
// ============================================================================

export const orderFormSchema = z.object({
  restaurant: restaurantStepSchema,
  selection: selectionStepSchema,
  cart: cartStepSchema,
  contacts: contactsStepSchema,
  delivery: deliveryStepSchema,
});

export type OrderFormData = z.infer<typeof orderFormSchema>;

// ============================================================================
// HELPERS DE VALIDATION
// ============================================================================

export const responsableStepSchema = z.object({
  responsable: contactBaseSchema,
  existingResponsableId: z.string().uuid().optional().nullable(),
});

export const billingStepValidationSchema = z.object({
  billingContact: billingContactSchema,
  billingAddress: billingAddressSchema,
});

export const shippingStepValidationSchema = z.object({
  contactDelivery: deliverySectionSchema,
  delivery: deliveryStepSchema,
});
