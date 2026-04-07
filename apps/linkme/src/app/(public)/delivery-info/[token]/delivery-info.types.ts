export interface OrderItem {
  id: string;
  quantity: number;
  products: {
    name: string;
  } | null;
}

export interface OrderWithDetails {
  id: string;
  order_number: string;
  total_ttc: number;
  status: string;
  expected_delivery_date: string | null;
  organisation: {
    trade_name: string | null;
    legal_name: string;
  } | null;
  linkmeDetails: {
    id: string;
    requester_name: string;
    requester_email: string;
    desired_delivery_date: string | null;
    step4_completed_at: string | null;
    reception_contact_name: string | null;
    reception_contact_email: string | null;
    reception_contact_phone: string | null;
    confirmed_delivery_date: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
    } | null;
  }>;
}

export interface TokenValidation {
  valid: boolean;
  expired: boolean;
  alreadyCompleted: boolean;
  order: OrderWithDetails | null;
  error?: string;
}

export interface DeliveryFormState {
  receptionName: string;
  receptionEmail: string;
  receptionPhone: string;
  confirmedDate: string;
  desiredDeliveryDate: string;
  mallFormRequired: boolean;
  mallFormEmail: string;
}
