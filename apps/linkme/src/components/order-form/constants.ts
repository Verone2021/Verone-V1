/**
 * Constants for OrderFormUnified
 * @module order-form/constants
 */

import {
  User,
  Store,
  UserCircle,
  FileText,
  Truck,
  ShoppingCart,
} from 'lucide-react';

import type { OrderFormUnifiedData, StepConfig } from './types';

// Clé pour le cache localStorage des utilisateurs publics (TTL 7 jours)
export const REQUESTER_CACHE_KEY = 'linkme_requester_cache';
export const CACHE_TTL_DAYS = 7;

export const OPENING_STEPS: StepConfig[] = [
  { id: 1, title: 'Demandeur', icon: User },
  { id: 2, title: 'Restaurant', icon: Store },
  { id: 3, title: 'Responsable', icon: UserCircle },
  { id: 4, title: 'Facturation', icon: FileText },
  { id: 5, title: 'Livraison', icon: Truck },
  { id: 6, title: 'Validation', icon: ShoppingCart },
];

export const EXISTING_STEPS: StepConfig[] = [
  { id: 1, title: 'Demandeur', icon: User },
  { id: 2, title: 'Restaurant', icon: Store },
  { id: 3, title: 'Responsable', icon: UserCircle },
  { id: 4, title: 'Facturation', icon: FileText },
  { id: 5, title: 'Livraison', icon: Truck },
  { id: 6, title: 'Validation', icon: ShoppingCart },
];

export const INITIAL_DATA: OrderFormUnifiedData = {
  isNewRestaurant: null,

  // Étape 1 : Demandeur
  requester: {
    name: '',
    email: '',
    phone: '',
    position: '',
    notes: '',
  },

  // Étape 2 : Restaurant
  existingOrganisationId: null,
  newRestaurant: {
    ownershipType: null,
    tradeName: '',
    address: '',
    postalCode: '',
    city: '',
    latitude: null,
    longitude: null,
    optionalContactName: '',
  },

  // Étape 3 : Responsable
  existingContact: {
    selectedContactId: null,
    isNewContact: false,
  },
  responsable: {
    type: null,
    name: '',
    email: '',
    phone: '',
    companyLegalName: '',
    companyTradeName: '',
    siret: '',
    kbisFile: null,
    kbisUrl: null,
  },

  // Étape 4 : Facturation
  billing: {
    useParentOrganisation: true, // Pré-coché par défaut si propre
    contactSource: 'responsable',
    name: '',
    email: '',
    phone: '',
    companyLegalName: '',
    address: '',
    postalCode: '',
    city: '',
    latitude: null,
    longitude: null,
    siret: '',
  },

  // Étape 5 : Livraison
  delivery: {
    useResponsableContact: true, // Pré-coché par défaut
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    postalCode: '',
    city: '',
    latitude: null,
    longitude: null,
    deliveryDate: '',
    deliveryAsap: false,
    isMallDelivery: false,
    mallEmail: '',
    accessFormRequired: false,
    accessFormUrl: null,
    semiTrailerAccessible: true,
    notes: '',
  },

  // Étape 6 : Validation
  deliveryTermsAccepted: false,
  finalNotes: '',
};
