// Déclaration du type pour le SDK Revolut (chargé dynamiquement)
declare global {
  interface Window {
    RevolutCheckout?: (
      token: string,
      mode: 'sandbox' | 'prod'
    ) => Promise<RevolutCheckoutInstance>;
  }
}

export interface RevolutCheckoutInstance {
  payWithPopup: (options: {
    locale?: string;
    email?: string;
    name?: string;
    phone?: string;
    billingAddress?: {
      countryCode: string;
      postcode: string;
      city: string;
      streetLine1: string;
      streetLine2?: string;
    };
    onSuccess: () => void;
    onError: (error: { type: string; message: string }) => void;
    onCancel?: () => void;
  }) => void;
  destroy: () => void;
}

export interface CheckoutFormData {
  // Contact
  email: string;
  phone: string;
  // Shipping
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  addressComplement: string;
  postalCode: string;
  city: string;
  country: string;
  countryCode: string;
  // Billing (if different)
  useSameForBilling: boolean;
  billingFirstName: string;
  billingLastName: string;
  billingCompany: string;
  billingAddress: string;
  billingAddressComplement: string;
  billingPostalCode: string;
  billingCity: string;
  billingCountry: string;
  billingCountryCode: string;
}
