export interface ProductEditModeProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  onSwitchToView: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (updatedProduct: any) => void;
  className?: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  subcategory_id: string;
  supplier_id: string;
  base_cost: string | number;
  selling_price: string | number;
  min_price: string | number;
  margin_percentage: string | number;
  tax_rate: number;
  status: string;
  condition: string;
  stock_quantity: number;
  min_stock: number;
  sku: string;
  manufacturer: string;
  gtin: string;
  dimensions_length: string | number;
  dimensions_width: string | number;
  dimensions_height: string | number;
  dimensions_unit: string;
  weight: string | number;
  weight_unit: string;
  supplier_reference: string;
  supplier_page_url: string;
}

export interface Supplier {
  id: string;
  name: string;
}
