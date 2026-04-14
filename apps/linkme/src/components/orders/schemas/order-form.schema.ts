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
 * @updated 2026-04-14 - Refactoring: extraction base + steps schemas
 */

import { z } from 'zod';

// Re-exports from base schemas
export type {
  ContactBase,
  ContactMode,
  ContactWithMode,
  AddressData,
  PartialAddressData,
} from './order-form-base.schema';
export {
  contactBaseSchema,
  contactModeSchema,
  contactWithModeSchema,
  addressSchema,
  partialAddressSchema,
} from './order-form-base.schema';

// Re-exports from steps schemas
export type {
  RestaurantStepData,
  SelectionStepData,
  CartItem,
  CartStepData,
  BillingSectionData,
  BillingContactData,
  CustomBillingOrg,
  BillingOrgData,
  BillingAddressData,
  DeliverySectionData,
  FranchiseInfo,
  ContactsStepData,
  DeliveryStepData,
  OrderFormData,
} from './order-form-steps.schema';
export {
  newRestaurantSchema,
  restaurantStepSchema,
  selectionStepSchema,
  cartItemSchema,
  cartStepSchema,
  contactSectionSchema,
  billingSectionSchema,
  billingContactSchema,
  customBillingOrgSchema,
  billingOrgSchema,
  billingAddressSchema,
  deliverySectionSchema,
  franchiseInfoSchema,
  contactsStepSchema,
  deliveryStepSchema,
  orderFormSchema,
  responsableStepSchema,
  billingStepValidationSchema,
  shippingStepValidationSchema,
} from './order-form-steps.schema';

// Import des types pour les valeurs par défaut
import type { ContactBase } from './order-form-base.schema';
import type {
  RestaurantStepData,
  SelectionStepData,
  CartStepData,
  ContactsStepData,
  DeliveryStepData,
  OrderFormData,
} from './order-form-steps.schema';

import {
  restaurantStepSchema,
  selectionStepSchema,
  cartStepSchema,
} from './order-form-steps.schema';

// ============================================================================
// VALEURS PAR DÉFAUT
// ============================================================================

export const defaultContact: ContactBase = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  company: '',
};

export const defaultRestaurantStep: RestaurantStepData = {
  mode: 'existing',
  existingId: null,
  existingName: undefined,
  existingCity: undefined,
  existingOwnershipType: null,
  existingCountry: null,
  existingAddressLine1: null,
  existingPostalCode: null,
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

export const defaultContactsStep: ContactsStepData = {
  responsable: defaultContact,
  existingResponsableId: null,
  franchiseInfo: null,
  billingContact: {
    mode: 'new',
    existingContactId: null,
    contact: null,
  },
  billingOrg: {
    mode: 'restaurant',
    organisationId: null,
    customOrganisation: null,
    saveAsDefault: false,
  },
  billingAddress: {
    mode: 'restaurant_address',
    existingAddressId: null,
    customAddress: null,
    setAsDefault: false,
    replaceExistingAddress: false,
  },
  billing: {
    sameAsResponsable: false,
    useParentOrg: false,
    contact: null,
    existingContactId: null,
    address: null,
    saveAddressAsDefault: false,
  },
  delivery: {
    sameAsResponsable: false,
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
  deliveryAsap: false,
  isMallDelivery: false,
  mallEmail: null,
  semiTrailerAccessible: true,
  accessFormUrl: null,
  accessFormFile: null,
  notes: '',
  deliveryTermsAccepted: false,
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

export function validateStep(
  step: number,
  data: Partial<OrderFormData>
): boolean {
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
        return true;
      case 4:
        if (!data.cart) return false;
        cartStepSchema.parse(data.cart);
        return true;
      case 5:
      case 6:
      case 7:
        return true;
      case 8:
        if (!data.restaurant || !data.selection || !data.cart) return false;
        restaurantStepSchema.parse(data.restaurant);
        selectionStepSchema.parse(data.selection);
        cartStepSchema.parse(data.cart);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function getStepErrors(
  step: number,
  data: Partial<OrderFormData>
): string[] {
  try {
    switch (step) {
      case 1: {
        if (!data.restaurant) return ['Données restaurant manquantes'];
        const errors: string[] = [];
        if (data.restaurant.mode === 'existing') {
          if (!data.restaurant.existingId)
            errors.push('Veuillez sélectionner un restaurant');
          if (!data.restaurant.existingOwnershipType)
            errors.push(
              'Veuillez définir le type du restaurant (franchise ou succursale)'
            );
          if (errors.length > 0) return errors;
        }
        restaurantStepSchema.parse(data.restaurant);
        return [];
      }
      case 2:
        if (!data.selection) return ['Données sélection manquantes'];
        selectionStepSchema.parse(data.selection);
        return [];
      case 4:
        if (!data.cart) return ['Données panier manquantes'];
        cartStepSchema.parse(data.cart);
        return [];
      case 5:
      case 6:
      case 7:
        return [];
      case 8: {
        if (!data.restaurant) return ['Données restaurant manquantes'];
        if (!data.selection) return ['Données sélection manquantes'];
        if (!data.cart) return ['Données panier manquantes'];
        const finalErrors: string[] = [];
        try {
          restaurantStepSchema.parse(data.restaurant);
        } catch (e) {
          if (e instanceof z.ZodError)
            finalErrors.push(...e.issues.map(i => i.message));
        }
        try {
          selectionStepSchema.parse(data.selection);
        } catch (e) {
          if (e instanceof z.ZodError)
            finalErrors.push(...e.issues.map(i => i.message));
        }
        try {
          cartStepSchema.parse(data.cart);
        } catch (e) {
          if (e instanceof z.ZodError)
            finalErrors.push(...e.issues.map(i => i.message));
        }
        return finalErrors;
      }
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
