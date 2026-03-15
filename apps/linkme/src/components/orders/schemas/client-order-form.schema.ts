/**
 * Schemas Zod pour le formulaire de commande client (public/non-authentifie)
 *
 * ClientOrderForm = OrderFormUnified.tsx
 * Utilise pour valider les donnees avant soumission au RPC `create_public_linkme_order`.
 *
 * Reutilise les schemas de base de `order-form.schema.ts` (addressSchema, etc.)
 * mais definit ses propres schemas par etape pour refleter la structure du formulaire public.
 *
 * @see OrderFormUnified.tsx (composant principal)
 * @see use-submit-unified-order.ts (hook de soumission)
 * @see docs/current/linkme/formulaires-commande-comparaison.md
 * @module client-order-form.schema
 * @since 2026-03-11
 */

import { z } from 'zod';

// ============================================================================
// HELPERS
// ============================================================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailSchema = z
  .string()
  .min(1, 'Email requis')
  .regex(emailRegex, 'Email invalide');

// ============================================================================
// ETAPE 1 : DEMANDEUR
// ============================================================================

export const clientRequesterSchema = z.object({
  name: z.string().min(1, 'Nom complet requis'),
  email: emailSchema,
  phone: z.string().min(1, 'Telephone requis'),
  position: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientRequesterData = z.infer<typeof clientRequesterSchema>;

// ============================================================================
// ETAPE 2 : RESTAURANT
// ============================================================================

export const clientNewRestaurantSchema = z.object({
  ownershipType: z.enum(['succursale', 'franchise'], {
    message: 'Type de restaurant requis',
  }),
  tradeName: z.string().min(1, 'Nom commercial requis'),
  address: z.string().min(1, 'Adresse requise'),
  postalCode: z.string().optional(),
  city: z.string().min(1, 'Ville requise'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  optionalContactName: z.string().optional(),
});

export type ClientNewRestaurantData = z.infer<typeof clientNewRestaurantSchema>;

// ============================================================================
// ETAPE 3 : RESPONSABLE (base + avec refine)
// ============================================================================

/**
 * Schema de base du responsable (sans refine, pour composition dans le schema global)
 */
export const clientResponsableBaseSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: emailSchema,
  phone: z.string().min(1, 'Telephone requis'),
  type: z.enum(['succursale', 'franchise']).nullable().optional(),
  companyLegalName: z.string().optional(),
  companyTradeName: z.string().optional(),
  siret: z.string().optional(),
  kbisFile: z.unknown().nullable().optional(),
  kbisUrl: z.string().nullable().optional(),
});

/**
 * Schema responsable avec validation franchise (pour validation par etape)
 */
export const clientResponsableSchema = clientResponsableBaseSchema.refine(
  data => {
    if (data.type === 'franchise') {
      return !!data.companyLegalName && !!data.siret;
    }
    return true;
  },
  {
    message: 'Raison sociale et SIRET requis pour les franchises',
    path: ['companyLegalName'],
  }
);

export type ClientResponsableData = z.infer<typeof clientResponsableSchema>;

/**
 * Schema responsable simplifie pour restaurant existant (pas de champs franchise)
 * Formulaire public : saisie manuelle uniquement, pas de contacts DB
 */
export const clientExistingResponsableSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: emailSchema,
  phone: z.string().min(1, 'Telephone requis'),
});

export type ClientExistingResponsableData = z.infer<
  typeof clientExistingResponsableSchema
>;

// ============================================================================
// ETAPE 4 : FACTURATION
// ============================================================================

export const clientBillingSchema = z.object({
  useParentOrganisation: z.boolean().default(false),
  contactSource: z.enum(['responsable', 'custom']).default('responsable'),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyLegalName: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  siret: z.string().optional(),
});

export type ClientBillingData = z.infer<typeof clientBillingSchema>;

// ============================================================================
// ETAPE 5 : LIVRAISON (base + avec refine)
// ============================================================================

/**
 * Schema de base de la livraison (sans refine, pour composition dans le schema global)
 */
export const clientDeliveryBaseSchema = z.object({
  useResponsableContact: z.boolean().default(true),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().min(1, 'Adresse de livraison requise'),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  deliveryDate: z.string().optional().default(''),
  deliveryAsap: z.boolean().default(false),
  isMallDelivery: z.boolean().default(false),
  mallEmail: z.string().optional(),
  accessFormRequired: z.boolean().default(false),
  accessFormUrl: z.string().nullable().optional(),
  semiTrailerAccessible: z.boolean().default(true),
  notes: z.string().optional(),
});

/**
 * Schema livraison avec validations conditionnelles (pour validation par etape)
 */
export const clientDeliverySchema = clientDeliveryBaseSchema
  .refine(
    data => {
      // deliveryDate requis seulement si deliveryAsap est false
      if (!data.deliveryAsap) {
        return !!data.deliveryDate && data.deliveryDate.length > 0;
      }
      return true;
    },
    {
      message: 'Date de livraison requise (ou cochez "Dès que possible")',
      path: ['deliveryDate'],
    }
  )
  .refine(
    data => {
      if (!data.useResponsableContact) {
        return !!data.contactName && !!data.contactEmail && !!data.contactPhone;
      }
      return true;
    },
    {
      message: 'Contact livraison requis',
      path: ['contactName'],
    }
  )
  .refine(
    data => {
      if (data.isMallDelivery) {
        return !!data.mallEmail;
      }
      return true;
    },
    {
      message: 'Email du centre commercial requis',
      path: ['mallEmail'],
    }
  );

export type ClientDeliveryData = z.infer<typeof clientDeliverySchema>;

// ============================================================================
// PANIER (memes items que UserOrderForm)
// ============================================================================

export const clientCartItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().min(1, 'Quantite minimum: 1'),
  selling_price_ttc: z.number().min(0),
  id: z.string().uuid(), // selection_item_id
});

export type ClientCartItem = z.infer<typeof clientCartItemSchema>;

// ============================================================================
// FORMULAIRE COMPLET (pour validation avant soumission)
// ============================================================================

export const clientOrderFormSubmissionSchema = z.object({
  requester: clientRequesterSchema,
  newRestaurant: clientNewRestaurantSchema,
  responsable: clientResponsableBaseSchema,
  billing: clientBillingSchema,
  delivery: clientDeliveryBaseSchema,
  cart: z.array(clientCartItemSchema).min(1, 'Panier vide'),
  deliveryTermsAccepted: z.boolean(),
  finalNotes: z.string().optional(),
});

export type ClientOrderFormSubmission = z.infer<
  typeof clientOrderFormSubmissionSchema
>;

// ============================================================================
// HELPERS DE VALIDATION PAR ETAPE
// ============================================================================

/**
 * Valide les donnees d'une etape specifique du formulaire client.
 * Retourne un tableau d'erreurs (vide si valide).
 */
export function validateClientStep(
  step: number,
  data: Record<string, unknown>
): string[] {
  try {
    switch (step) {
      case 1:
        clientRequesterSchema.parse(data);
        return [];
      case 2:
        clientNewRestaurantSchema.parse(data);
        return [];
      case 3:
        clientResponsableSchema.parse(data);
        return [];
      case 4:
        clientBillingSchema.parse(data);
        return [];
      case 5:
        clientDeliverySchema.parse(data);
        return [];
      default:
        return [];
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues.map(e => e.message);
    }
    return ['Erreur de validation inconnue'];
  }
}
