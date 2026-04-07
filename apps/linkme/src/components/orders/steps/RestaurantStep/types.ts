import type {
  OrderFormData,
  RestaurantStepData,
} from '../../schemas/order-form.schema';

export type { RestaurantStepData };

export interface RestaurantStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<RestaurantStepData>) => void;
}

export type TabFilter = 'all' | 'succursale' | 'franchise';
