import type {
  ContactBase,
  ContactsStepData,
  DeliveryStepData,
  OrderFormData,
} from '../../schemas/order-form.schema';

export interface ShippingStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<ContactsStepData>) => void;
  onUpdateDelivery: (data: Partial<DeliveryStepData>) => void;
}

export interface ContactFormProps {
  contact: ContactBase;
  onChange: (field: keyof ContactBase, value: string) => void;
}
