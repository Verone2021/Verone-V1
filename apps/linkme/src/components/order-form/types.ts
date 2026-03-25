/**
 * Types for OrderFormUnified — 6-step public order form wizard
 * @module order-form/types
 */

import type { OrganisationOwnershipType } from '../../lib/hooks/use-enseigne-organisations';

// =====================================================================
// TYPES
// =====================================================================

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image?: string | null;
  selling_price_ht: number;
  selling_price_ttc: number;
  margin_rate: number;
  quantity: number;
}

export interface OrderFormUnifiedData {
  // QUESTION INITIALE - Obligatoire
  isNewRestaurant: boolean | null;

  // ========================================
  // ÉTAPE 1 : DEMANDEUR
  // ========================================
  requester: {
    name: string;
    email: string;
    phone: string;
    position: string; // Rôle/Fonction
    notes: string; // Notes optionnelles
  };

  // ========================================
  // ÉTAPE 2 : RESTAURANT
  // ========================================
  // Si restaurant existant
  existingOrganisationId: string | null;

  // Si nouveau restaurant
  newRestaurant: {
    ownershipType: 'succursale' | 'franchise' | null; // DÉPLACÉ ICI (était en étape 3)
    tradeName: string;
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    optionalContactName: string; // Contact responsable optionnel (créé automatiquement)
  };

  // ========================================
  // ÉTAPE 3 : RESPONSABLE (ex "Responsable")
  // ========================================
  // Sélection contact existant (si restaurant existant)
  existingContact: {
    selectedContactId: string | null; // ID du contact sélectionné OU 'new'
    isNewContact: boolean; // true si on crée un nouveau contact
  };

  // Contact responsable (nouveau ou data à créer)
  responsable: {
    type: 'succursale' | 'franchise' | null; // Redondant avec newRestaurant.ownershipType mais gardé pour compatibilité code
    name: string;
    email: string;
    phone: string;
    // Si franchisé uniquement
    companyLegalName: string;
    companyTradeName: string;
    siret: string;
    kbisFile: File | null; // Upload KBis
    kbisUrl: string | null; // URL KBis (legacy)
  };

  // ========================================
  // ÉTAPE 4 : FACTURATION
  // ========================================
  billing: {
    useParentOrganisation: boolean; // NOUVEAU : utiliser organisation mère (propre uniquement)
    contactSource: 'responsable' | 'custom'; // Renommé de 'owner'
    // Si custom
    name: string;
    email: string;
    phone: string; // OPTIONNEL pour facturation
    // Adresse facturation
    companyLegalName: string;
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    siret: string;
  };

  // ========================================
  // ÉTAPE 5 : LIVRAISON (NOUVEAU)
  // ========================================
  delivery: {
    useResponsableContact: boolean; // Contact livraison = responsable
    // Si non coché
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    // Adresse
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    deliveryDate: string; // Format ISO
    deliveryAsap: boolean; // Livraison dès que possible
    // Centre commercial
    isMallDelivery: boolean;
    mallEmail: string;
    accessFormRequired: boolean;
    accessFormUrl: string | null; // URL Supabase Storage
    // Semi-remorque
    semiTrailerAccessible: boolean;
    // Notes
    notes: string;
  };

  // ========================================
  // ÉTAPE 6 : VALIDATION
  // ========================================
  deliveryTermsAccepted: boolean;
  finalNotes: string; // Renommé de 'notes'
}

export interface Organisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  city: string | null;
  address_line1: string | null;
  postal_code: string | null;
  shipping_address_line1: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  logo_url: string | null;
  ownership_type: OrganisationOwnershipType | null;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
}

// Interface pour le cache localStorage des utilisateurs publics
export interface RequesterCache {
  name: string;
  email: string;
  phone: string;
  expiresAt: number; // Timestamp d'expiration (7 jours)
}

export interface OrderFormUnifiedProps {
  // Context
  affiliateId: string;
  selectionId: string;
  selectionName?: string;
  selectionSlug?: string;

  // Cart
  cart: CartItem[];
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;

  // Organisations disponibles
  organisations: Organisation[];
  isLoadingOrganisations?: boolean;

  // Actions
  onClose: () => void;
  onSubmit: (data: OrderFormUnifiedData, cart: CartItem[]) => Promise<void>;
  isSubmitting?: boolean;
}

export interface CartTotals {
  totalHt: number;
  totalTtc: number;
  totalTva: number;
  totalItems: number;
}

export interface StepProps {
  data: OrderFormUnifiedData;
  errors: Record<string, string>;
  updateData: (updates: Partial<OrderFormUnifiedData>) => void;
  affiliateId: string;
}

export interface Step6Props extends StepProps {
  cart: CartItem[];
  cartTotals: CartTotals;
  formatPrice: (price: number) => string;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onOpenConfirmation: () => void;
}

export interface CartSummaryProps {
  cart: CartItem[];
  cartTotals: CartTotals;
  formatPrice: (price: number) => string;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
  steps?: StepConfig[];
  currentStep?: number;
  onClose: () => void;
}

export interface FooterProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  isSubmitting: boolean;
  cartTotals: CartTotals;
  formatPrice: (price: number) => string;
  showBackButton?: boolean;
}

export interface InlineConfirmationProps {
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  termsAccepted: boolean;
  onTermsChange: (checked: boolean) => void;
  requesterName: string;
  requesterEmail: string;
  restaurantName: string;
  isNewRestaurant: boolean;
  responsableName: string;
  cart: CartItem[];
  itemsCount: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  hasDeliveryDate: boolean;
  deliveryAsap: boolean;
  deliveryAddress: string;
  selectionName: string;
  faqUrl: string;
}

export interface ExistingStep2Props {
  data: OrderFormUnifiedData;
  errors: Record<string, string>;
  updateData: (updates: Partial<OrderFormUnifiedData>) => void;
  organisations: Organisation[];
  isLoadingOrganisations?: boolean;
}

export interface ExistingStep3Props {
  data: OrderFormUnifiedData;
  errors: Record<string, string>;
  updateData: (updates: Partial<OrderFormUnifiedData>) => void;
}

export interface ResponsableContactFormProps {
  data: OrderFormUnifiedData;
  errors: Record<string, string>;
  updateData: (updates: Partial<OrderFormUnifiedData>) => void;
}

export interface CompanyFieldsProps {
  data: OrderFormUnifiedData;
  errors: Record<string, string>;
  updateData: (updates: Partial<OrderFormUnifiedData>) => void;
}

export interface StepConfig {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}
