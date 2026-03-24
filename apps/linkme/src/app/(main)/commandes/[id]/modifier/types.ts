export interface EditableItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  quantity: number;
  originalQuantity: number;
  unit_price_ht: number;
  original_unit_price_ht: number;
  base_price_ht: number;
  margin_rate: number;
  tax_rate: number;
  _delete: boolean;
  _isNew: boolean;
  /** Produit créé par l'affilié (modèle inversé) */
  is_affiliate_product: boolean;
  /** Taux de commission Verone (lecture seule pour l'affilié, ex: 0.15 = 15%) */
  affiliate_commission_rate: number;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
}
