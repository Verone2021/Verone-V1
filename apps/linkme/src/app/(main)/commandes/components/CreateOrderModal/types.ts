export interface UserMetadata {
  full_name?: string;
  phone?: string;
  position?: string;
}

export interface CreatePublicLinkmeOrderResult {
  success: boolean;
  error?: string;
  order_id?: string;
  order_number?: string;
  total_ttc?: number;
}

export interface SelectionDataWithAffiliate {
  name: string;
  linkme_affiliates: {
    name: string;
  } | null;
}

export interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CartTotals {
  totalHt: number;
  totalTtc: number;
  totalMargin: number;
  totalTva: number;
  tvaDetails: { rate: number; amount: number }[];
}

export interface CartItem {
  selectionItemId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceHt: number;
  marginRate: number;
  basePriceHt: number;
  taxRate: number;
}

export interface NewRestaurantFormState {
  // Étape 1 - Livraison
  tradeName: string;
  city: string;
  address: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  ownerType: 'succursale' | 'franchise' | null;
  // Étape 2 - Propriétaire
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCompanyName: string;
  ownerKbisUrl: string;
  // Étape 3 - Facturation
  billingSameAsOwner: boolean;
  billingUseSameAddress: boolean;
  billingCompanyName: string;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
  billingPostalCode: string;
  billingCity: string;
  billingLatitude: number | null;
  billingLongitude: number | null;
  billingSiret: string;
  billingKbisUrl: string;
}

export const initialNewRestaurantForm: NewRestaurantFormState = {
  tradeName: '',
  city: '',
  address: '',
  postalCode: '',
  latitude: null,
  longitude: null,
  ownerType: null,
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerCompanyName: '',
  ownerKbisUrl: '',
  billingSameAsOwner: true,
  billingUseSameAddress: true,
  billingCompanyName: '',
  billingFirstName: '',
  billingLastName: '',
  billingEmail: '',
  billingPhone: '',
  billingAddress: '',
  billingPostalCode: '',
  billingCity: '',
  billingLatitude: null,
  billingLongitude: null,
  billingSiret: '',
  billingKbisUrl: '',
};
