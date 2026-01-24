/**
 * Orders Components - Exports
 *
 * @module orders
 * @since 2026-01-20
 * @updated 2026-01-24 - Refonte 7→8 etapes
 */

// Main components
export { NewOrderForm } from './NewOrderForm';
export { OrderStepper, ORDER_STEPS } from './OrderStepper';
export type { OrderStep, OrderStepperProps } from './OrderStepper';

// Step components
export { RestaurantStep } from './steps/RestaurantStep';
export { SelectionStep } from './steps/SelectionStep';
export { ProductsStep } from './steps/ProductsStep';
export { CartStep } from './steps/CartStep';
export { ResponsableStep } from './steps/ResponsableStep';
export { BillingStep } from './steps/BillingStep';
export { ShippingStep } from './steps/ShippingStep';
export { ValidationStep } from './steps/ValidationStep';

// Schemas
export * from './schemas/order-form.schema';
