/**
 * Orders Components - Exports
 *
 * @module orders
 * @since 2026-01-20
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
export { ContactsStep } from './steps/ContactsStep';
export { DeliveryStep } from './steps/DeliveryStep';
export { ValidationStep } from './steps/ValidationStep';

// Schemas
export * from './schemas/order-form.schema';
