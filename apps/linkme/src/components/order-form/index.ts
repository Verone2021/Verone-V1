/**
 * Order Form components — split from OrderFormUnified.tsx (3,596 lines)
 * @module order-form
 */

// Types
export type {
  CartItem,
  OrderFormUnifiedData,
  Organisation,
  RequesterCache,
  OrderFormUnifiedProps,
  CartTotals,
  StepProps,
  Step6Props,
  CartSummaryProps,
  HeaderProps,
  FooterProps,
  InlineConfirmationProps,
  ExistingStep2Props,
  ExistingStep3Props,
  ResponsableContactFormProps,
  CompanyFieldsProps,
  StepConfig,
} from './types';

// Constants
export {
  REQUESTER_CACHE_KEY,
  CACHE_TTL_DAYS,
  OPENING_STEPS,
  EXISTING_STEPS,
  INITIAL_DATA,
} from './constants';

// Sub-components
export { CartSummary } from './CartSummary';
export { Header } from './Header';
export { Footer } from './Footer';
export { InlineConfirmation } from './InlineConfirmation';

// Step components
export { OpeningStep1Requester } from './RequesterStep';
export {
  OpeningStep2Restaurant,
  ExistingStep2Restaurant,
} from './RestaurantStep';
export {
  OpeningStep3Responsable,
  ExistingStep3Responsable,
  ResponsableContactForm,
  CompanyFields,
} from './ResponsableStep';
export { OpeningStep4Billing } from './BillingStep';
export { OpeningStep5Delivery } from './DeliveryStep';
export { OpeningStep6Validation } from './ValidationStep';
