/**
 * Schémas Zod pour le formulaire de commande unifié
 *
 * Structure en 8 étapes :
 * 1. Restaurant (existant ou nouveau)
 * 2. Sélection (choix si plusieurs)
 * 3. Produits (ajout au panier)
 * 4. Panier (récapitulatif modifiable)
 * 5. Contact Responsable (responsable de la commande)
 * 6. Facturation (contact + adresse facturation)
 * 7. Adresse et Options (contact livraison + adresse + date + options)
 * 8. Validation (récapitulatif final)
 *
 * @module order-form.schema
 * @since 2026-01-20
 * @updated 2026-01-24 - Refonte 7→8 étapes
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS DE BASE
// ============================================================================

/**
 * Contact de base (réutilisable)
 */
export const contactBaseSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis (min. 2 caractères)'),
  lastName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  position: z.string().optional(),
  company: z.string().optional(), // Si franchise
});

export type ContactBase = z.infer<typeof contactBaseSchema>;

/**
 * Mode de sélection de contact
 */
export const contactModeSchema = z.enum(['existing', 'new', 'same_as_responsable']);
export type ContactMode = z.infer<typeof contactModeSchema>;

/**
 * Contact avec mode de sélection
 */
export const contactWithModeSchema = z.object({
  mode: contactModeSchema,
  existingContactId: z.string().uuid().optional().nullable(),
  contact: contactBaseSchema.optional().nullable(),
});

export type ContactWithMode = z.infer<typeof contactWithModeSchema>;

/**
 * Adresse complète (réutilisable)
 */
export const addressSchema = z.object({
  id: z.string().uuid().optional().nullable(), // Si adresse existante
  label: z.string().optional().nullable(),
  legalName: z.string().optional().nullable(),
  tradeName: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  addressLine1: z.string().min(1, 'Adresse requise'),
  addressLine2: z.string().optional().nullable(),
  postalCode: z.string().min(1, 'Code postal requis'),
  city: z.string().min(1, 'Ville requise'),
  region: z.string().optional().nullable(),
  country: z.string().default('FR'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type AddressData = z.infer<typeof addressSchema>;

/**
 * Adresse partielle (tous champs optionnels sauf requis)
 */
export const partialAddressSchema = addressSchema.partial().extend({
  addressLine1: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
});

export type PartialAddressData = z.infer<typeof partialAddressSchema>;

// ============================================================================
// ÉTAPE 1 : RESTAURANT
// ============================================================================

export const newRestaurantSchema = z.object({
  tradeName: z.string().min(2, 'Nom commercial requis (min. 2 caractères)'),
  city: z.string().min(2, 'Ville requise'),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  ownershipType: z.enum(['succursale', 'franchise']),
  // Géolocalisation automatique via AddressAutocomplete
  country: z.string().default('FR'),           // Code ISO (FR, LU, BE...)
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const restaurantStepSchema = z.object({
  mode: z.enum(['existing', 'new']),
  existingId: z.string().uuid().optional().nullable(),
  existingName: z.string().optional(), // Pour affichage
  existingCity: z.string().optional(), // Pour affichage
  existingOwnershipType: z.enum(['succursale', 'franchise']).optional().nullable(),
  existingCountry: z.string().optional().nullable(), // Pour calcul TVA (FR=20%, autres=0%)
  newRestaurant: newRestaurantSchema.optional().nullable(),
}).refine(
  (data) => {
    if (data.mode === 'existing') {
      return !!data.existingId;
    }
    return data.newRestaurant &&
           data.newRestaurant.tradeName.length >= 2 &&
           data.newRestaurant.city.length >= 2 &&
           !!data.newRestaurant.ownershipType;
  },
  { message: 'Sélectionnez un restaurant ou créez-en un nouveau' }
);

export type RestaurantStepData = z.infer<typeof restaurantStepSchema>;

// ============================================================================
// ÉTAPE 2 : SÉLECTION
// ============================================================================

export const selectionStepSchema = z.object({
  selectionId: z.string().uuid('Sélection requise'),
  selectionName: z.string(), // Pour affichage
  productsCount: z.number().optional(), // Pour info
});

export type SelectionStepData = z.infer<typeof selectionStepSchema>;

// ============================================================================
// ÉTAPE 3 & 4 : PRODUITS / PANIER
// ============================================================================

export const cartItemSchema = z.object({
  selectionItemId: z.string().uuid(), // ID dans linkme_selection_items
  productId: z.string().uuid(),
  productName: z.string(),
  productSku: z.string().optional(),
  productImage: z.string().url().optional().nullable(),
  quantity: z.number().min(1, 'Quantité minimum: 1'),
  // SSOT: Prix depuis linkme_selection_items (colonne GENERATED en DB)
  basePriceHt: z.number().min(0), // Prix de base HT (pour calcul marge)
  unitPriceHt: z.number().min(0), // Prix de vente HT = selling_price_ht
  marginRate: z.number().min(0), // Taux de marge en %
  // Type de produit (affilié = créé par l'affilié, pas du catalogue Vérone)
  isAffiliateProduct: z.boolean().optional().default(false),
  // Taux de commission prélevée par Vérone sur les produits affiliés (%)
  affiliateCommissionRate: z.number().nullable().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const cartStepSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Ajoutez au moins un produit au panier'),
});

export type CartStepData = z.infer<typeof cartStepSchema>;

// ============================================================================
// ÉTAPE 5 : CONTACTS (UNIFIÉS) - Nouvelle version avec séparation Contact/Org
// ============================================================================

export const contactSectionSchema = z.object({
  sameAsResponsable: z.boolean().default(false),
  useParentOrg: z.boolean().default(false), // Pour facturation uniquement
  contact: contactBaseSchema.optional().nullable(),
});

/**
 * Section facturation complète (contact + adresse)
 * @deprecated Use billingContactSchema + billingOrgSchema instead
 */
export const billingSectionSchema = z.object({
  // Contact
  sameAsResponsable: z.boolean().default(false),
  useParentOrg: z.boolean().default(false), // Utiliser l'adresse de l'org mère (succursale)
  contact: contactBaseSchema.optional().nullable(),
  existingContactId: z.string().uuid().optional().nullable(),
  // Adresse
  address: partialAddressSchema.optional().nullable(),
  saveAddressAsDefault: z.boolean().default(false),
});

export type BillingSectionData = z.infer<typeof billingSectionSchema>;

/**
 * Contact de facturation (PERSONNE)
 * Séparé de l'organisation pour clarté
 */
export const billingContactSchema = z.object({
  mode: z.enum(['existing', 'new', 'same_as_responsable']),
  existingContactId: z.string().uuid().optional().nullable(),
  contact: contactBaseSchema.optional().nullable(),
});

export type BillingContactData = z.infer<typeof billingContactSchema>;

/**
 * Organisation de facturation (ENTITÉ)
 * Représente l'entité juridique à facturer
 */
export const customBillingOrgSchema = z.object({
  legalName: z.string().min(1, 'Raison sociale requise'),
  tradeName: z.string().optional(),
  siret: z.string().min(9, 'SIRET requis'),
  vatNumber: z.string().optional(),
  addressLine1: z.string().min(1, 'Adresse requise'),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(4, 'Code postal requis'),
  city: z.string().min(1, 'Ville requise'),
  country: z.string().default('FR'),
});

export type CustomBillingOrg = z.infer<typeof customBillingOrgSchema>;

export const billingOrgSchema = z.object({
  mode: z.enum(['restaurant', 'parent_org', 'other']),
  organisationId: z.string().uuid().nullable(),
  customOrganisation: customBillingOrgSchema.nullable(),
  saveAsDefault: z.boolean().default(false),
});

export type BillingOrgData = z.infer<typeof billingOrgSchema>;

/**
 * Adresse de facturation (V2 - remplace BillingOrg)
 *
 * IMPORTANT: L'organisation est FIXE (= restaurant de l'étape 1)
 * On gère uniquement les ADRESSES de facturation
 *
 * Modes disponibles:
 * - 'restaurant_address': Utilise l'adresse du restaurant (défaut)
 * - 'existing_billing': Utilise une adresse existante de la table addresses
 * - 'new_billing': Crée une nouvelle adresse
 * - 'parent_address': Utilise l'adresse de la maison mère (succursales uniquement)
 */
export const billingAddressSchema = z.object({
  mode: z.enum(['restaurant_address', 'existing_billing', 'new_billing', 'parent_address']),
  existingAddressId: z.string().uuid().nullable(),
  customAddress: partialAddressSchema.nullable(),
  setAsDefault: z.boolean().default(false),
  /** Si true, remplace l'adresse du restaurant par la nouvelle adresse */
  replaceExistingAddress: z.boolean().default(false),
});

export type BillingAddressData = z.infer<typeof billingAddressSchema>;

/**
 * Section livraison complète (contact + adresse + options)
 */
export const deliverySectionSchema = z.object({
  // Contact
  sameAsResponsable: z.boolean().default(false),
  contact: contactBaseSchema.optional().nullable(),
  existingContactId: z.string().uuid().optional().nullable(),
  // Adresse
  address: partialAddressSchema.optional().nullable(),
  saveAddressAsDefault: z.boolean().default(false),
});

export type DeliverySectionData = z.infer<typeof deliverySectionSchema>;

export const contactsStepSchema = z.object({
  // Contact responsable restaurant (obligatoire)
  responsable: contactBaseSchema,
  existingResponsableId: z.string().uuid().optional().nullable(),

  // Contact de facturation (PERSONNE)
  billingContact: billingContactSchema,

  // Organisation de facturation (ENTITÉ) - LEGACY, kept for compatibility
  billingOrg: billingOrgSchema,

  // Adresse de facturation (V2) - L'org est fixe, on gère l'adresse
  billingAddress: billingAddressSchema,

  // Contact & Adresse facturation (LEGACY - pour compatibilité)
  billing: billingSectionSchema,

  // Contact & Adresse livraison/réception
  delivery: deliverySectionSchema,
}).refine(
  (data) => {
    // Validation contact facturation: soit même que responsable, soit contact existant/nouveau
    if (data.billingContact.mode !== 'same_as_responsable') {
      return !!data.billingContact.contact || !!data.billingContact.existingContactId;
    }
    return true;
  },
  { message: 'Contact facturation requis', path: ['billingContact'] }
).refine(
  (data) => {
    // Validation adresse facturation (V2)
    if (data.billingAddress.mode === 'new_billing') {
      const addr = data.billingAddress.customAddress;
      return !!(addr?.addressLine1 && addr?.postalCode && addr?.city);
    }
    if (data.billingAddress.mode === 'existing_billing') {
      return !!data.billingAddress.existingAddressId;
    }
    // 'restaurant_address' and 'parent_address' are always valid
    return true;
  },
  { message: 'Adresse de facturation requise', path: ['billingAddress'] }
).refine(
  (data) => {
    // Validation livraison : soit même que responsable, soit contact custom
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

export const deliveryStepSchema = z.object({
  // Adresse livraison
  address: z.string().min(5, 'Adresse requise (min. 5 caractères)'),
  postalCode: z.string().min(4, 'Code postal requis'),
  city: z.string().min(2, 'Ville requise'),

  // Date souhaitée (optionnelle)
  desiredDate: z.date().optional().nullable(),

  // Options
  isMallDelivery: z.boolean().default(false),
  mallEmail: z.string().email('Email centre commercial invalide').optional().nullable(),
  semiTrailerAccessible: z.boolean().default(false),

  // Upload formulaire d'accès
  accessFormUrl: z.string().url().optional().nullable(),
  accessFormFile: z.any().optional().nullable(), // File pour upload

  // Notes
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Si centre commercial, email requis
    if (data.isMallDelivery && !data.mallEmail) {
      return false;
    }
    return true;
  },
  { message: 'Email du centre commercial requis', path: ['mallEmail'] }
);

export type DeliveryStepData = z.infer<typeof deliveryStepSchema>;

// ============================================================================
// FORMULAIRE COMPLET
// ============================================================================

export const orderFormSchema = z.object({
  // Étape 1: Restaurant
  restaurant: restaurantStepSchema,

  // Étape 2: Sélection
  selection: selectionStepSchema,

  // Étapes 3 & 4: Produits et Panier
  cart: cartStepSchema,

  // Étape 5: Contacts
  contacts: contactsStepSchema,

  // Étape 6: Livraison
  delivery: deliveryStepSchema,
});

export type OrderFormData = z.infer<typeof orderFormSchema>;

// ============================================================================
// VALEURS PAR DÉFAUT
// ============================================================================

export const defaultRestaurantStep: RestaurantStepData = {
  mode: 'existing',
  existingId: null,
  existingName: undefined,
  existingCity: undefined,
  existingOwnershipType: null,
  existingCountry: null,
  newRestaurant: null,
};

export const defaultSelectionStep: SelectionStepData = {
  selectionId: '',
  selectionName: '',
  productsCount: 0,
};

export const defaultCartStep: CartStepData = {
  items: [],
};

export const defaultContact: ContactBase = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  company: '',
};

export const defaultContactsStep: ContactsStepData = {
  responsable: defaultContact,
  existingResponsableId: null,
  // Contact facturation (PERSONNE)
  billingContact: {
    mode: 'same_as_responsable',
    existingContactId: null,
    contact: null,
  },
  // Organisation facturation (ENTITÉ) - LEGACY
  billingOrg: {
    mode: 'restaurant', // Par défaut: facturer le restaurant
    organisationId: null,
    customOrganisation: null,
    saveAsDefault: false,
  },
  // Adresse de facturation (V2)
  billingAddress: {
    mode: 'restaurant_address', // Par défaut: adresse du restaurant
    existingAddressId: null,
    customAddress: null,
    setAsDefault: false,
    replaceExistingAddress: false,
  },
  // Legacy billing (pour compatibilité)
  billing: {
    sameAsResponsable: true,
    useParentOrg: false,
    contact: null,
    existingContactId: null,
    address: null,
    saveAddressAsDefault: false,
  },
  delivery: {
    sameAsResponsable: true,
    contact: null,
    existingContactId: null,
    address: null,
    saveAddressAsDefault: false,
  },
};

export const defaultDeliveryStep: DeliveryStepData = {
  address: '',
  postalCode: '',
  city: '',
  desiredDate: null,
  isMallDelivery: false,
  mallEmail: null,
  semiTrailerAccessible: false,
  accessFormUrl: null,
  accessFormFile: null,
  notes: '',
};

export const defaultOrderFormData: OrderFormData = {
  restaurant: defaultRestaurantStep,
  selection: defaultSelectionStep,
  cart: defaultCartStep,
  contacts: defaultContactsStep,
  delivery: defaultDeliveryStep,
};

// ============================================================================
// HELPERS DE VALIDATION PAR ÉTAPE
// ============================================================================

/**
 * Schéma de validation pour l'étape 5 : Contact Responsable uniquement
 */
export const responsableStepSchema = z.object({
  responsable: contactBaseSchema,
  existingResponsableId: z.string().uuid().optional().nullable(),
});

/**
 * Schéma de validation pour l'étape 6 : Contact + Adresse Facturation
 */
export const billingStepValidationSchema = z.object({
  billingContact: billingContactSchema,
  billingAddress: billingAddressSchema,
});

/**
 * Schéma de validation pour l'étape 7 : Contact Livraison + Adresse + Options
 * Combine les données de contacts.delivery et delivery
 */
export const shippingStepValidationSchema = z.object({
  contactDelivery: deliverySectionSchema,
  delivery: deliveryStepSchema,
});

export function validateStep(step: number, data: Partial<OrderFormData>): boolean {
  try {
    switch (step) {
      case 1:
        if (!data.restaurant) return false;
        restaurantStepSchema.parse(data.restaurant);
        return true;
      case 2:
        if (!data.selection) return false;
        selectionStepSchema.parse(data.selection);
        return true;
      case 3:
        // Produits - pas de validation stricte, juste vérifier qu'on a accès aux produits
        return true;
      case 4:
        if (!data.cart) return false;
        cartStepSchema.parse(data.cart);
        return true;
      case 5:
        // Step 5: Contact Responsable uniquement
        if (!data.contacts) return false;
        responsableStepSchema.parse({
          responsable: data.contacts.responsable,
          existingResponsableId: data.contacts.existingResponsableId,
        });
        return true;
      case 6:
        // Step 6: Contact + Adresse Facturation
        if (!data.contacts) return false;
        billingStepValidationSchema.parse({
          billingContact: data.contacts.billingContact,
          billingAddress: data.contacts.billingAddress,
        });
        return true;
      case 7:
        // Step 7: Contact Livraison + Adresse + Date + Options
        if (!data.contacts || !data.delivery) return false;
        shippingStepValidationSchema.parse({
          contactDelivery: data.contacts.delivery,
          delivery: data.delivery,
        });
        return true;
      case 8:
        // Validation finale
        orderFormSchema.parse(data);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function getStepErrors(step: number, data: Partial<OrderFormData>): string[] {
  try {
    switch (step) {
      case 1:
        if (!data.restaurant) return ['Données restaurant manquantes'];
        restaurantStepSchema.parse(data.restaurant);
        return [];
      case 2:
        if (!data.selection) return ['Données sélection manquantes'];
        selectionStepSchema.parse(data.selection);
        return [];
      case 4:
        if (!data.cart) return ['Données panier manquantes'];
        cartStepSchema.parse(data.cart);
        return [];
      case 5:
        // Step 5: Contact Responsable uniquement
        if (!data.contacts) return ['Données contacts manquantes'];
        responsableStepSchema.parse({
          responsable: data.contacts.responsable,
          existingResponsableId: data.contacts.existingResponsableId,
        });
        return [];
      case 6:
        // Step 6: Contact + Adresse Facturation
        if (!data.contacts) return ['Données contacts manquantes'];
        billingStepValidationSchema.parse({
          billingContact: data.contacts.billingContact,
          billingAddress: data.contacts.billingAddress,
        });
        return [];
      case 7:
        // Step 7: Contact Livraison + Adresse + Date + Options
        if (!data.contacts) return ['Données contact livraison manquantes'];
        if (!data.delivery) return ['Données livraison manquantes'];
        shippingStepValidationSchema.parse({
          contactDelivery: data.contacts.delivery,
          delivery: data.delivery,
        });
        return [];
      case 8:
        orderFormSchema.parse(data);
        return [];
      default:
        return [];
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues.map((e) => e.message);
    }
    return ['Erreur de validation inconnue'];
  }
}
