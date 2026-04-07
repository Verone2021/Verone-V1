export interface SampleOrderItem {
  id: string;
  product_draft_id: string;
  description: string;
  estimated_cost: number;
  delivery_time_days: number;
  status: 'pending' | 'approved' | 'rejected';
  product_drafts: {
    id: string;
    name: string;
    supplier_page_url: string;
    primary_image_url?: string;
  };
}

export interface SampleOrder {
  id: string;
  supplier_id: string;
  supplier: {
    id: string;
    name: string;
    contact_email?: string;
    contact_phone?: string;
  };
  status:
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'ordered'
    | 'delivered'
    | 'completed';
  estimated_total_cost: number;
  actual_total_cost?: number;
  expected_delivery_days: number;
  created_at: string;
  approved_at?: string;
  ordered_at?: string;
  delivered_at?: string;
  approval_notes?: string;
  sample_order_items: SampleOrderItem[];
}

export interface SampleOrderValidationProps {
  className?: string;
}
