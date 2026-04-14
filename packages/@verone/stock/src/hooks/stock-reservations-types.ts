export interface StockReservation {
  id: string;
  product_id: string;
  reserved_quantity: number;
  reference_type: string;
  reference_id: string;
  reserved_by: string;
  reserved_at: string;
  expires_at: string | null;
  released_at: string | null;
  released_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?: any;
  user_profiles?: { first_name?: string; last_name?: string };
  released_user_profiles?: { first_name?: string; last_name?: string };
}

export interface CreateReservationData {
  product_id: string;
  reserved_quantity: number;
  reference_type: string;
  reference_id: string;
  expires_at?: string;
  notes?: string;
}

export interface ReservationFilters {
  product_id?: string;
  reference_type?: string;
  reference_id?: string;
  is_active?: boolean;
  expires_soon?: boolean;
  reserved_by?: string;
}

export interface ReservationStats {
  total_reservations: number;
  active_reservations: number;
  expired_reservations: number;
  total_reserved_quantity: number;
  expiring_soon_count: number;
}
