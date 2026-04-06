'use client';

import type {
  RestaurantStepData,
  SelectionStepData,
  CartStepData,
  CartItem,
  ContactsStepData,
  DeliveryStepData,
  OrderFormData,
} from '../../components/orders/schemas/order-form.schema';

export type { OrderFormData };

export interface UseOrderFormReturn {
  // État
  formData: OrderFormData;
  currentStep: number;
  completedSteps: number[];
  isSubmitting: boolean;
  errors: string[];

  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;

  // Updates par étape
  updateRestaurant: (data: Partial<RestaurantStepData>) => void;
  updateSelection: (data: Partial<SelectionStepData>) => void;
  updateCart: (data: Partial<CartStepData>) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (selectionItemId: string) => void;
  updateCartQuantity: (selectionItemId: string, quantity: number) => void;
  clearCart: () => void;
  updateContacts: (data: Partial<ContactsStepData>) => void;
  updateDelivery: (data: Partial<DeliveryStepData>) => void;

  // Calculs
  cartTotals: {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    totalCommission: number;
    itemsCount: number;
    effectiveTaxRate: number;
  };

  // Actions
  resetForm: () => void;
  validateCurrentStep: () => boolean;
  submit: () => Promise<{ orderId: string; orderNumber: string } | null>;
}
